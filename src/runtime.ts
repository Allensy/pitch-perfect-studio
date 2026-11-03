import { AudioEngine, CaptureController, type PlaybackNote } from './audio';
import { createStore } from './store';
import {
  defaultSettings,
  midiToFrequency,
  frequencyToMidi,
  noteName,
  SCALES,
  CHORDS,
  scalePool,
} from './domain/music';
import {
  generateQuestion,
  buildTunerQueue,
  buildHarmonyTarget,
  availableHarmonyTargets,
  progressionSteps,
} from './domain/exercises';
import { gradeAnswer, advanceHold } from './domain/grading';
import { Persistence, freshEnvelope, type StoragePort } from './persistence';
import { validateSettings } from './domain/music';
import type {
  Runtime,
  AppState,
  PitchView,
  Mode,
  QuizMode,
  Settings,
  Answer,
  Round,
  Envelope,
  PlaybackVariant,
} from './domain/types';

type AudioPort = Pick<AudioEngine, 'prepare' | 'play' | 'cancel' | 'setOutput' | 'dispose'> &
  Partial<Pick<AudioEngine, 'getContext' | 'setVoiceMuted' | 'overlay'>>;
type CapturePort = Pick<CaptureController, 'start' | 'stop' | 'dispose'>;
export interface RuntimeOptions {
  audio?: AudioPort;
  capture?: CapturePort;
  storage?: () => StoragePort;
  random?: () => number;
  now?: () => number;
}
const quizModes: QuizMode[] = ['notes', 'intervals', 'chords'];
const isQuiz = (mode: Mode): mode is QuizMode => quizModes.includes(mode as QuizMode);
const isVocal = (mode: Mode) => mode === 'tuner' || mode === 'harmony';
const emptyPitch = (): PitchView => ({
  frequency: null,
  midi: null,
  nearestCents: null,
  targetCents: null,
  hold: 0,
  preview: false,
  history: [],
});
const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Audio could not start. Press Play to retry.';

/** Bootstrap owns this runtime. Construction allocates plain state, never browser resources. */
export function createRuntime(options: RuntimeOptions = {}): Runtime {
  const engine = new AudioEngine();
  const audio = options.audio ?? engine;
  const capture = options.capture ?? new CaptureController(engine);
  const random = options.random ?? Math.random;
  const now = options.now ?? (() => performance.now());
  const persistence = new Persistence(options.storage ?? (() => window.localStorage));
  let sequence = 0,
    playEpoch = 0,
    captureEpoch = 0,
    attached = false,
    disposed = false;
  let autoTimer: ReturnType<typeof setTimeout> | null = null,
    mixerTimer: ReturnType<typeof setTimeout> | null = null,
    previewTimer: ReturnType<typeof setTimeout> | null = null;
  let hold = { since: null as number | null, last: null as number | null };
  let excludedUntil = 0,
    lastHud = -Infinity;
  let history: { time: number; midi: number | null }[] = [];
  let harmonyCompleted = false,
    tunerCompleted = false,
    backingActive = false,
    overlayEpoch = 0;
  const emptyRound = (): Round => ({
    id: ++sequence,
    question: null,
    phase: 'ready',
    attempts: 0,
    credited: false,
    feedback: 'Play when you are ready.',
    lastAnswer: null,
    error: null,
  });
  const initialSettings = defaultSettings();
  const state = createStore<AppState>({
    mode: 'notes',
    settings: initialSettings,
    rounds: { notes: emptyRound(), intervals: emptyRound(), chords: emptyRound() },
    setupOpen: false,
    capture: 'off',
    captureMessage: 'Microphone off',
    playing: false,
    message: '',
    volume: 65,
    muted: false,
    queue: [],
    queueIndex: 0,
    targetId: ++sequence,
    vocal: null,
    vocalError: null,
    rearm: false,
    targetComplete: false,
    mixerPlaying: false,
    mixerStep: 0,
    envelope: freshEnvelope(initialSettings),
    storageMessage: '',
    storageBlocked: false,
  });
  const pitch = createStore(emptyPitch());
  const get = state.getSnapshot;
  const patch = (value: Partial<AppState>) => state.set({ ...get(), ...value });
  function resetHold(clear = false) {
    hold = { since: null, last: null };
    if (clear) {
      history = [];
      pitch.set(emptyPitch());
    } else pitch.set({ ...pitch.getSnapshot(), hold: 0 });
  }
  function clearAuto() {
    if (autoTimer !== null) clearTimeout(autoTimer);
    autoTimer = null;
  }
  function clearPreview() {
    if (previewTimer !== null) clearTimeout(previewTimer);
    previewTimer = null;
    if (pitch.getSnapshot().preview) resetHold(true);
  }
  function write(envelope: Envelope) {
    const result = persistence.save(envelope);
    patch({
      envelope: result.envelope,
      storageMessage: result.message,
      storageBlocked: result.blocked,
    });
  }
  function updateRound(mode: QuizMode, round: Round) {
    patch({ rounds: { ...get().rounds, [mode]: round } });
  }
  function makeRound(mode: QuizMode): Round {
    const result = generateQuestion(mode, get().settings, random);
    return {
      ...emptyRound(),
      question: result.ok ? result.value : null,
      error: result.ok ? null : result.message,
    };
  }
  function prepareTargets(force = false) {
    const s = get();
    let queue = s.queue,
      vocal = s.vocal,
      error: string | null = null;
    if (force || queue.length === 0) {
      const result = buildTunerQueue(s.settings, random);
      queue = result.ok ? result.value : [];
      if (!result.ok && s.mode === 'tuner' && s.settings.tuner.drillMode !== 'free')
        error = result.message;
      tunerCompleted = false;
    }
    if (force || !vocal) {
      const result = buildHarmonyTarget(s.settings, random);
      vocal = result.ok ? result.value : null;
      if (!result.ok && s.mode === 'harmony' && s.settings.harmony.submode === 'target')
        error = result.message;
      harmonyCompleted = false;
    }
    patch({
      queue,
      vocal,
      vocalError: error,
      queueIndex: force ? 0 : s.queueIndex,
      targetId: ++sequence,
      targetComplete: s.mode === 'harmony' ? harmonyCompleted : tunerCompleted,
      rearm: s.mode === 'harmony' && harmonyCompleted,
    });
  }
  function targetMidi(): number | null {
    const s = get();
    return s.mode === 'harmony'
      ? (s.vocal?.targetMidi ?? null)
      : s.mode === 'tuner' && s.settings.tuner.drillMode !== 'free'
        ? (s.queue[s.queueIndex] ?? null)
        : null;
  }
  function stopPlayback() {
    ++playEpoch;
    ++overlayEpoch;
    backingActive = false;
    clearAuto();
    if (mixerTimer !== null) clearTimeout(mixerTimer);
    mixerTimer = null;
    audio.cancel();
    excludedUntil = now() + 180;
    resetHold();
    const s = get();
    const rounds = { ...s.rounds };
    for (const mode of quizModes) {
      const r = rounds[mode];
      if (r.phase === 'playing')
        rounds[mode] = {
          ...r,
          phase: 'ready',
          feedback: 'Playback stopped. Press Play to listen again.',
        };
    }
    patch({ playing: false, mixerPlaying: false, rounds });
  }
  function stopMic() {
    ++captureEpoch;
    capture.stop();
    patch({ capture: 'off', captureMessage: 'Microphone off' });
    resetHold(true);
  }
  function stopAll() {
    stopPlayback();
    stopMic();
    clearPreview();
    patch({ message: 'All audio and microphone input stopped.' });
  }
  function playback(
    notes: PlaybackNote[],
    loop = false,
    permitBacking = false,
    onFinish?: () => void,
  ) {
    if (
      backingActive &&
      !loop &&
      get().mode === 'harmony' &&
      get().settings.harmony.submode === 'target' &&
      audio.overlay
    ) {
      clearAuto();
      clearPreview();
      resetHold();
      const owner = playEpoch,
        token = ++overlayEpoch;
      excludedUntil = Infinity;
      patch({ message: '' });
      void audio
        .overlay(notes, { timbre: get().settings.global.timbre, a4: get().settings.global.a4 })
        .then(() => {
          if (disposed || owner !== playEpoch || token !== overlayEpoch) return;
          excludedUntil = now() + 180;
          resetHold();
          onFinish?.();
        })
        .catch((error) => {
          if (disposed || owner !== playEpoch || token !== overlayEpoch) return;
          excludedUntil = now() + 180;
          patch({ message: message(error) });
        });
      return;
    }
    stopPlayback();
    clearPreview();
    backingActive = loop && permitBacking;
    const epoch = ++playEpoch;
    patch({ playing: true, message: '' });
    if (!permitBacking) excludedUntil = Infinity;
    // Calling play synchronously preserves audio preparation inside the initiating gesture.
    void audio
      .play(notes, { timbre: get().settings.global.timbre, a4: get().settings.global.a4, loop })
      .then(() => {
        if (disposed || epoch !== playEpoch) return;
        patch({ playing: false });
        excludedUntil = now() + 180;
        resetHold();
        onFinish?.();
      })
      .catch((error) => {
        if (disposed || epoch !== playEpoch) return;
        excludedUntil = now() + 180;
        patch({ playing: false, message: message(error) });
        if (isQuiz(get().mode)) {
          const mode = get().mode as QuizMode;
          const round = get().rounds[mode];
          if (round.phase === 'playing')
            updateRound(mode, { ...round, phase: 'ready', feedback: message(error) });
        }
      });
  }
  function sequenceNotes(
    notes: readonly number[],
    variant: 'block' | 'arpeggio' | 'both' = 'block',
    duration = 0.9,
  ): PlaybackNote[] {
    const events: PlaybackNote[] = [];
    if (variant !== 'arpeggio') {
      notes.forEach((midi) =>
        events.push({
          midi,
          at: variant === 'both' ? notes.length * 0.22 + 0.2 : 0,
          duration,
          gain: 1 / Math.max(1, Math.sqrt(notes.length)),
        }),
      );
    }
    if (variant !== 'block')
      notes.forEach((midi, i) => events.push({ midi, at: i * 0.22, duration: 0.55, gain: 0.8 }));
    return events;
  }
  function play(variant: PlaybackVariant = 'default') {
    if (disposed || get().setupOpen) return;
    const s = get();
    if (isQuiz(s.mode)) {
      const mode = s.mode;
      let round = s.rounds[mode];
      if (!round.question) {
        round = makeRound(mode);
        updateRound(mode, round);
      }
      const q = round.question;
      if (!q) {
        patch({ message: round.error ?? 'Choose a valid practice configuration.' });
        return;
      }
      let events: PlaybackNote[];
      if (q.kind === 'notes') events = [{ midi: q.midi, at: 0, duration: 1.05 }];
      else if (q.kind === 'intervals') {
        const direction =
          variant === 'harmonic'
            ? 'harm'
            : variant === 'descending'
              ? 'desc'
              : variant === 'ascending'
                ? 'asc'
                : q.direction;
        const pair = direction === 'desc' ? [q.upperMidi, q.lowerMidi] : [q.lowerMidi, q.upperMidi];
        events =
          direction === 'harm'
            ? sequenceNotes(pair)
            : pair.map((midi, i) => ({ midi, at: i * 0.65, duration: 0.55 }));
        if (direction === 'asc_harm')
          events.push(...pair.map((midi) => ({ midi, at: 1.5, duration: 0.9, gain: 0.7 })));
      } else
        events = sequenceNotes(
          q.notes,
          variant === 'arpeggio'
            ? 'arpeggio'
            : variant === 'block'
              ? 'block'
              : s.settings.chords.playback === 'arp'
                ? 'arpeggio'
                : s.settings.chords.playback,
        );
      const id = round.id;
      const wasCorrect = round.credited;
      playback(events, false, false, () => {
        const current = get();
        if (
          current.mode !== mode ||
          current.rounds[mode].id !== id ||
          current.rounds[mode].credited
        )
          return;
        updateRound(mode, {
          ...current.rounds[mode],
          phase: 'awaiting',
          feedback: 'What did you hear? Choose your answer.',
        });
      });
      // playback cancellation may reset the old phase first; publish the new phase afterward.
      updateRound(mode, {
        ...get().rounds[mode],
        phase: wasCorrect ? 'correct' : 'playing',
        feedback: wasCorrect ? round.feedback : 'Listening…',
      });
    } else if (s.mode === 'harmony') {
      if (s.settings.harmony.submode === 'mixer') {
        playProgression();
        return;
      }
      if (!s.vocal) {
        patch({ message: s.vocalError ?? 'Choose a feasible harmony challenge and range.' });
        return;
      }
      playback(sequenceNotes(s.vocal.backingMidi, 'block', 2), true, true);
    } else {
      const midi = targetMidi();
      if (midi !== null) playback([{ midi, at: 0, duration: 1.1 }]);
    }
  }
  function next() {
    const mode = get().mode;
    if (!isQuiz(mode)) return;
    const old = get().rounds[mode];
    stopPlayback();
    if (!old.credited) {
      const envelope = structuredClone(get().envelope);
      envelope.progress.quizzes[mode].skips++;
      write(envelope);
    }
    updateRound(mode, makeRound(mode));
    patch({ message: '' });
  }
  function submit(answer: Answer) {
    const s = get();
    if (disposed || s.setupOpen || !isQuiz(s.mode)) return;
    const mode = s.mode,
      r = s.rounds[mode];
    if (!r.question || r.credited || !['awaiting', 'retry'].includes(r.phase)) return;
    const result = gradeAnswer(r.question, answer, s.settings);
    if (result === 'missing') {
      updateRound(mode, {
        ...r,
        feedback:
          r.question.kind === 'notes'
            ? 'Choose both a note and its octave before checking.'
            : 'Choose a chord quality and the required inversion before checking.',
      });
      return;
    }
    clearAuto();
    const correct = result === 'correct';
    const envelope = structuredClone(s.envelope);
    const stats = envelope.progress.quizzes[mode];
    stats.attempts++;
    if (r.question.kind === 'notes') {
      const cell = envelope.progress.noteStats[r.question.midi % 12];
      if (cell) {
        cell.attempts++;
        if (correct) cell.correct++;
      }
    }
    let feedback = 'Not quite. Replay, compare with a reference, and try again.';
    if (correct) {
      stats.correct++;
      if (r.attempts === 0) stats.firstTryCorrect++;
      envelope.progress.currentStreak++;
      const streak = envelope.progress.currentStreak;
      envelope.progress.xpEarned +=
        mode === 'notes'
          ? 15 + Math.min(streak * 2, 30)
          : mode === 'intervals'
            ? 20 + Math.min(streak * 2, 35)
            : 25 + Math.min(streak * 3, 40);
      const q = r.question;
      feedback =
        q.kind === 'notes'
          ? `Locked in. That was ${noteName(q.midi)} · ${midiToFrequency(q.midi, s.settings.global.a4).toFixed(1)} Hz.`
          : q.kind === 'intervals'
            ? `Correct. ${q.semitones} semitones between ${noteName(q.lowerMidi)} and ${noteName(q.upperMidi)}.`
            : `Correct. ${noteName(q.rootMidi)} ${CHORDS.find((c) => c.id === q.qualityId)?.name ?? q.qualityId}${s.settings.chords.inversionMode === 'guess_inv' ? ` · ${['root position', 'first inversion', 'second inversion', 'third inversion'][q.inversion]}` : ''}.`;
    } else {
      envelope.progress.currentStreak = 0;
      if (
        r.question.kind === 'notes' &&
        answer.midi !== undefined &&
        answer.midi % 12 === r.question.midi % 12
      )
        feedback = 'Right pitch class; listen for the octave. Choose the exact register.';
    }
    updateRound(mode, {
      ...r,
      attempts: r.attempts + 1,
      lastAnswer: { ...answer },
      credited: correct,
      phase: correct ? 'correct' : 'retry',
      feedback,
    });
    write(envelope);
    if (correct && mode === 'notes' && s.settings.notes.autoNext) {
      const id = r.id;
      autoTimer = setTimeout(() => {
        autoTimer = null;
        const current = get();
        if (
          current.mode !== mode ||
          current.setupOpen ||
          current.rounds[mode].id !== id ||
          !current.settings.notes.autoNext ||
          (typeof document !== 'undefined' && document.hidden)
        )
          return;
        next();
        play();
      }, 1400);
    }
  }
  function reference(kind: 'tonic' | 'scale' | 'cadence' | 'root') {
    const s = get();
    let root = s.settings.global.rootKey + 48;
    if (kind === 'root') {
      const q = isQuiz(s.mode) ? s.rounds[s.mode].question : null;
      root =
        q?.kind === 'chords'
          ? q.rootMidi
          : s.mode === 'harmony' && s.vocal
            ? s.vocal.rootMidi
            : root;
    }
    let events: PlaybackNote[] = [{ midi: root, at: 0, duration: 1.1 }];
    if (kind === 'scale') {
      const steps = SCALES[s.settings.global.scaleId].steps;
      events = [...steps, 12].map((step, i) => ({
        midi: root + step,
        at: i * 0.25,
        duration: 0.3,
      }));
    }
    if (kind === 'cadence') {
      const scale = SCALES[s.settings.global.scaleId].steps;
      events = [0, 5, 7, 0].flatMap((step, i) => {
        const third = scale.includes((step + 4) % 12) ? 4 : scale.includes((step + 3) % 12) ? 3 : 4;
        return [0, third, 7].map((tone) => ({
          midi: root + step + tone,
          at: i * 0.75,
          duration: 0.6,
          gain: 0.55,
        }));
      });
    }
    playback(events);
  }
  function audition(midi: number) {
    if (midi >= 36 && midi <= 84 && Number.isInteger(midi))
      playback([{ midi, at: 0, duration: 0.8 }]);
  }
  function auditionInterval(semitones: number, descending: boolean) {
    if (!Number.isInteger(semitones) || semitones < 1 || semitones > 12) return;
    const settings = get().settings;
    const candidates = scalePool(settings).filter((m) => m + semitones <= settings.global.highMidi);
    const lower = candidates.find((m) => m % 12 === settings.global.rootKey) ?? candidates[0];
    if (lower === undefined) {
      patch({
        message: 'This reference interval does not fit your range. Widen the range to hear it.',
      });
      return;
    }
    const notes = descending ? [lower + semitones, lower] : [lower, lower + semitones];
    playback(notes.map((midi, i) => ({ midi, at: i * 0.65, duration: 0.55 })));
  }

  function playBlend() {
    const vocal = get().vocal;
    if (vocal) playback(sequenceNotes([...vocal.backingMidi, vocal.targetMidi], 'block', 1.4));
  }
  function setMode(mode: Mode) {
    if (disposed || get().mode === mode) return;
    const previous = get().mode;
    stopPlayback();
    clearPreview();
    if (!(isVocal(previous) && isVocal(mode))) stopMic();
    resetHold(true);
    patch({
      mode,
      message: '',
      targetComplete: mode === 'harmony' ? harmonyCompleted : tunerCompleted,
      rearm: false,
      targetId: ++sequence,
      mixerStep: 0,
    });
    prepareTargets();
    write({ ...get().envelope, activeMode: mode });
  }
  function setSetup(open: boolean) {
    clearAuto();
    resetHold();
    patch({ setupOpen: open });
  }
  function applySettings(input: Settings): string[] {
    const valid = validateSettings(input);
    if (!valid.ok) return [valid.message];
    const settings = valid.value;
    const old = get().settings;
    const behavior = (s: Settings) =>
      JSON.stringify([
        s.global.rangePreset,
        s.global.lowMidi,
        s.global.highMidi,
        s.global.rootKey,
        s.global.scaleId,
        s.global.a4,
        s.notes.exactOctave,
        [...s.intervals.activeSemitones].sort((a, b) => a - b),
        s.intervals.direction,
        s.intervals.fixedRoot,
        [...s.chords.activeQualityIds].sort(),
        s.chords.playback,
        s.chords.inversionMode,
        s.harmony.challengeId,
        s.harmony.submode,
        s.harmony.rootPolicy,
        s.harmony.progressionId,
        s.tuner.drillMode,
        s.tuner.toleranceCents,
        s.tuner.arpeggioQuality,
      ]);
    const changed = behavior(old) !== behavior(settings);
    if (changed) {
      stopAll();
      patch({ settings });
      const rounds = { ...get().rounds };
      for (const mode of quizModes) rounds[mode] = makeRound(mode);
      patch({ rounds, mixerStep: 0 });
      prepareTargets(true);
    } else {
      patch({ settings });
      if (!settings.notes.autoNext) clearAuto();
    }
    const errors = quizModes
      .map((mode) => generateQuestion(mode, settings, () => 0))
      .filter((result) => !result.ok);
    // Incompatibilities remain visible in each mode rather than silently narrowing a selected filter.
    patch({
      setupOpen: false,
      message: changed
        ? 'Setup applied. Press Play or Start microphone when ready.'
        : errors.length
          ? 'Some exercises do not fit this setup; each affected mode explains how to recover.'
          : 'Setup applied.',
    });
    write({ ...get().envelope, settings });
    return [];
  }
  function setOutput(volume: number, muted: boolean) {
    const value = Math.min(100, Math.max(0, Number.isFinite(volume) ? volume : 0));
    audio.setOutput(value, muted);
    patch({ volume: value, muted });
    write({ ...get().envelope, output: { volume: value, muted } });
  }
  function nextTarget() {
    clearAuto();
    const s = get();
    if (s.mode !== 'tuner' || s.settings.tuner.drillMode === 'free' || !s.queue.length) return;
    const index = (s.queueIndex + 1) % s.queue.length;
    selectTarget(index);
  }
  function selectTarget(index: number) {
    const s = get();
    if (
      s.mode !== 'tuner' ||
      s.settings.tuner.drillMode === 'free' ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= s.queue.length
    )
      return;
    stopPlayback();
    const previous = s.queue[s.queueIndex];
    tunerCompleted = false;
    patch({
      queueIndex: index,
      targetId: ++sequence,
      targetComplete: false,
      rearm: s.queue[index] === previous,
      message:
        s.queue[index] === previous
          ? 'Same pitch again: press Ready Again before a fresh hold.'
          : '',
    });
    resetHold();
  }
  function readyAgain() {
    clearAuto();
    if (get().mode === 'harmony') harmonyCompleted = false;
    else tunerCompleted = false;
    patch({
      targetId: ++sequence,
      targetComplete: false,
      rearm: false,
      message: 'Ready for a fresh continuous hold.',
    });
    resetHold();
  }
  function newReference() {
    const s = get();
    if (s.mode !== 'harmony') return;
    const alternatives = availableHarmonyTargets(s.settings).filter(
      (target) => target.rootMidi !== s.vocal?.rootMidi,
    );
    if (!alternatives.length) {
      patch({
        message:
          'Only this reference fits the current range. Repeat this target, choose Notes in key, or change the range/challenge.',
      });
      return;
    }
    const value = random();
    const index = Math.floor(
      Math.min(1 - Number.EPSILON, Math.max(0, Number.isFinite(value) ? value : 0)) *
        alternatives.length,
    );
    const selected = alternatives[index]!;
    stopPlayback();
    harmonyCompleted = false;
    patch({
      vocal: selected,
      vocalError: null,
      targetId: ++sequence,
      targetComplete: false,
      rearm: false,
      message: '',
    });
    resetHold();
  }
  function completeTarget() {
    const s = get();
    if (s.targetComplete || s.rearm || s.setupOpen) return;
    const envelope = structuredClone(s.envelope);
    if (s.mode === 'harmony') {
      harmonyCompleted = true;
      envelope.progress.vocal.harmonyLocks++;
    } else {
      tunerCompleted = true;
      envelope.progress.vocal.completedTargets++;
      envelope.progress.xpEarned += 20;
      envelope.progress.currentStreak++;
    }
    patch({
      targetComplete: true,
      rearm: s.mode === 'harmony',
      message: `Locked in: ${noteName(targetMidi() ?? 60)}.`,
    });
    write(envelope);
    if (s.mode === 'tuner') {
      const id = s.targetId;
      autoTimer = setTimeout(() => {
        autoTimer = null;
        if (get().mode === 'tuner' && get().targetId === id && !get().setupOpen) nextTarget();
      }, 1100);
    }
  }
  function onSample(frequency: number | null, time: number) {
    if (disposed || get().capture !== 'listening') return;
    const s = get();
    if (!isVocal(s.mode)) return;
    const midi =
      frequency && frequency > 0 ? frequencyToMidi(frequency, s.settings.global.a4) : null;
    const nearest = midi === null ? null : (midi - Math.round(midi)) * 100;
    const target = targetMidi();
    const cents = midi === null || target === null ? null : (midi - target) * 100;
    const eligible =
      !(typeof document !== 'undefined' && document.hidden) &&
      !s.setupOpen &&
      !s.rearm &&
      !s.targetComplete &&
      now() >= excludedUntil &&
      (s.mode === 'harmony'
        ? s.settings.harmony.submode === 'target'
        : s.settings.tuner.drillMode !== 'free');
    const inTune =
      eligible &&
      cents !== null &&
      Math.abs(cents) <= (s.mode === 'harmony' ? 25 : s.settings.tuner.toleranceCents);
    const progress = advanceHold(hold, time, inTune);
    hold = { since: progress.since, last: progress.last };
    history.push({ time, midi });
    while (history.length > 0 && (history[0]!.time < time - 8000 || history.length > 240))
      history.shift();
    if (
      time - lastHud >= 100 ||
      progress.progress >= 100 ||
      (frequency === null && pitch.getSnapshot().frequency !== null)
    ) {
      lastHud = time;
      pitch.set({
        frequency,
        midi,
        nearestCents: nearest,
        targetCents: cents,
        hold: s.targetComplete ? 100 : progress.progress,
        preview: false,
        history: [...history],
      });
    }
    if (progress.progress >= 100 && eligible) completeTarget();
  }
  function startMic() {
    const s = get();
    if (
      disposed ||
      !isVocal(s.mode) ||
      s.setupOpen ||
      s.capture === 'waiting' ||
      s.capture === 'listening'
    )
      return;
    clearPreview();
    resetHold(true);
    const epoch = ++captureEpoch;
    void capture
      .start(
        (frequency, time) => {
          if (epoch === captureEpoch) onSample(frequency, time);
        },
        (status, text) => {
          if (disposed || epoch !== captureEpoch) return;
          patch({ capture: status, captureMessage: text });
          if (status !== 'listening') resetHold(true);
        },
        { a4: s.settings.global.a4, lowMidi: 36, highMidi: 84 },
      )
      .catch((error) => {
        if (epoch === captureEpoch)
          patch({ capture: 'unavailable', captureMessage: message(error) });
      });
  }
  function previewInput() {
    if (!isVocal(get().mode)) return;
    if (get().capture !== 'off') {
      patch({ message: 'Stop microphone input before trying the unscored preview.' });
      return;
    }
    clearPreview();
    resetHold();
    const midi = targetMidi() ?? 60;
    const frequency = midiToFrequency(midi, get().settings.global.a4) * 2 ** (-4 / 1200);
    pitch.set({
      frequency,
      midi: midi - 0.04,
      nearestCents: -4,
      targetCents: targetMidi() === null ? null : -4,
      hold: 0,
      preview: true,
      history: [{ time: now(), midi: midi - 0.04 }],
    });
    patch({ message: 'Simulated input only. No XP, accuracy, hold or completion is earned.' });
    previewTimer = setTimeout(() => {
      previewTimer = null;
      resetHold(true);
      patch({ message: '' });
    }, 2500);
  }
  function playProgression() {
    if (get().mode !== 'harmony' || get().settings.harmony.submode !== 'mixer' || get().setupOpen)
      return;
    stopPlayback();
    clearPreview();
    const epoch = ++playEpoch;
    const s = get();
    const steps = progressionSteps(s.settings.harmony.progressionId, s.settings.global.rootKey);
    patch({ mixerPlaying: true, playing: true, mixerStep: 0 });
    resetHold();
    excludedUntil = Infinity;
    const events: PlaybackNote[] = steps.flatMap((step, index) =>
      step.notes.map((midi, voice) => ({ midi, voice, at: index * 2, duration: 1.7, gain: 0.5 })),
    );
    const clock = () => audio.getContext?.()?.currentTime ?? now() / 1000;
    const playhead = (startedAt: number) => {
      if (disposed || epoch !== playEpoch) return;
      const context = audio.getContext?.();
      if (context && context.state !== 'running') {
        stopPlayback();
        patch({ message: 'Audio was interrupted. Press Play progression to restart.' });
        return;
      }
      const index = Math.min(steps.length - 1, Math.max(0, Math.floor((clock() - startedAt) / 2)));
      if (get().mixerStep !== index) patch({ mixerStep: index });
      mixerTimer = setTimeout(() => playhead(startedAt), 50);
    };
    // Every chord is scheduled on AudioContext time in one owned job; timers update only the visual playhead.
    void audio
      .play(events, {
        timbre: s.settings.global.timbre,
        a4: s.settings.global.a4,
        mutedVoices: s.settings.harmony.mutedVoices,
        onStarted: (start) => playhead(start),
      })
      .then(() => {
        if (disposed || epoch !== playEpoch) return;
        if (mixerTimer !== null) clearTimeout(mixerTimer);
        mixerTimer = null;
        patch({ mixerPlaying: false, playing: false, mixerStep: steps.length - 1 });
        excludedUntil = now() + 180;
      })
      .catch((error) => {
        if (epoch === playEpoch) {
          stopPlayback();
          patch({ message: message(error) });
        }
      });
  }

  function auditionVoice(voice: number) {
    if (!Number.isInteger(voice) || voice < 0 || voice > 3) return;
    const s = get();
    const steps = progressionSteps(s.settings.harmony.progressionId, s.settings.global.rootKey);
    const midi = steps[s.mixerStep]?.notes[voice];
    if (midi !== undefined) audition(midi);
  }
  function toggleVoice(voice: number) {
    if (!Number.isInteger(voice) || voice < 0 || voice > 3) return;
    const settings = structuredClone(get().settings);
    settings.harmony.mutedVoices[voice] = !settings.harmony.mutedVoices[voice];
    audio.setVoiceMuted?.(voice, settings.harmony.mutedVoices[voice]!);
    patch({ settings });
    write({ ...get().envelope, settings });
  }
  function resetProgress(): boolean {
    stopAll();
    const result = persistence.reset(get().envelope, String(++sequence));
    patch({ storageMessage: result.message, storageBlocked: result.blocked });
    if (!result.saved) return false;
    patch({ envelope: result.envelope });
    const rounds = { ...get().rounds };
    for (const mode of quizModes) rounds[mode] = makeRound(mode);
    patch({ rounds, message: 'Progress reset. Musical settings retained.' });
    prepareTargets(true);
    return true;
  }
  function retrySave() {
    const result = persistence.retry(get().envelope);
    patch({
      envelope: result.envelope,
      storageMessage: result.message,
      storageBlocked: result.blocked,
    });
  }
  const onVisibility = () => {
    if (document.hidden) stopAll();
  };
  const onPageHide = () => stopAll();
  function attach() {
    if (attached || disposed) return;
    attached = true;
    const loaded = persistence.load();
    patch({
      settings: loaded.envelope.settings,
      mode: loaded.envelope.activeMode,
      envelope: loaded.envelope,
      volume: loaded.envelope.output.volume,
      muted: loaded.envelope.output.muted,
      storageMessage: loaded.message,
      storageBlocked: loaded.blocked,
    });
    audio.setOutput(loaded.envelope.output.volume, loaded.envelope.output.muted);
    const rounds = { ...get().rounds };
    for (const mode of quizModes) rounds[mode] = makeRound(mode);
    patch({ rounds });
    prepareTargets(true);
    if (typeof document !== 'undefined')
      document.addEventListener('visibilitychange', onVisibility);
    if (typeof window !== 'undefined') window.addEventListener('pagehide', onPageHide);
  }
  function dispose() {
    if (disposed) return;
    stopAll();
    disposed = true;
    audio.dispose();
    capture.dispose();
    if (typeof document !== 'undefined')
      document.removeEventListener('visibilitychange', onVisibility);
    if (typeof window !== 'undefined') window.removeEventListener('pagehide', onPageHide);
  }
  return {
    state,
    pitch,
    setMode,
    setSetup,
    applySettings,
    setOutput,
    play,
    next,
    submit,
    reference,
    audition,
    auditionInterval,
    startMic,
    stopAll,
    stopPlayback,
    previewInput,
    selectTarget,
    nextTarget,
    readyAgain,
    newReference,
    playProgression,
    playBlend,
    auditionVoice,
    toggleVoice,
    resetProgress,
    retrySave,
    attach,
    dispose,
  };
}
