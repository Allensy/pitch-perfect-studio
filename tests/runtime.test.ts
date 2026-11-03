import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRuntime, type RuntimeOptions } from '../src/runtime';
import { midiToFrequency } from '../src/domain/music';
import type { CaptureStatus, Runtime, Timbre } from '../src/domain/types';
import type { PlaybackNote } from '../src/audio';
function memory() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}
function fixture(extra: RuntimeOptions = {}) {
  const storage = memory();
  let clock = 0;
  let sample: (frequency: number | null, time: number) => void = () => {};
  let status: (value: CaptureStatus, text: string) => void = () => {};
  const audio = {
    prepare: vi.fn(async () => {}),
    play: vi.fn(
      async (
        _notes: readonly PlaybackNote[],
        _config: { timbre: Timbre; a4: number; loop?: boolean },
      ) => {},
    ),
    cancel: vi.fn(),
    setOutput: vi.fn(),
    dispose: vi.fn(),
  };
  const capture = {
    start: vi.fn(async (onSample: typeof sample, onStatus: typeof status) => {
      sample = onSample;
      status = onStatus;
      status('listening', 'Listening');
    }),
    stop: vi.fn(),
    dispose: vi.fn(),
  };
  const runtime = createRuntime({
    audio,
    capture,
    storage: () => storage,
    random: () => 0.23,
    now: () => clock,
    ...extra,
  });
  runtime.attach();
  const emit = (freq: number | null, time: number) => {
    clock = time;
    sample(freq, time);
  };
  return {
    runtime,
    storage,
    audio,
    capture,
    emit,
    status: (value: CaptureStatus) => status(value, value),
    clock: (time: number) => {
      clock = time;
    },
  };
}
const runtimes: Runtime[] = [];
function setup(extra: RuntimeOptions = {}) {
  const f = fixture(extra);
  runtimes.push(f.runtime);
  return f;
}
afterEach(() => {
  runtimes.forEach((r) => r.dispose());
  runtimes.length = 0;
  vi.useRealTimers();
});
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
function noteAnswer(runtime: Runtime) {
  const q = runtime.state.getSnapshot().rounds.notes.question;
  if (q?.kind !== 'notes') throw new Error('Expected note');
  return { midi: q.midi, pitchClass: q.midi % 12 };
}

describe('ordered quiz and settings lifecycle', () => {
  it('does not touch audio or storage until attach', () => {
    const storage = memory(),
      audio = {
        prepare: vi.fn(async () => {}),
        play: vi.fn(
          async (
            _notes: readonly PlaybackNote[],
            _config: { timbre: Timbre; a4: number; loop?: boolean },
          ) => {},
        ),
        cancel: vi.fn(),
        setOutput: vi.fn(),
        dispose: vi.fn(),
      };
    const runtime = createRuntime({
      storage: () => storage,
      audio,
      capture: { start: vi.fn(async () => {}), stop: vi.fn(), dispose: vi.fn() },
    });
    runtimes.push(runtime);
    expect(storage.map.size).toBe(0);
    expect(audio.prepare).not.toHaveBeenCalled();
  });
  it('grades only after playback, awards once and keeps completed replay closed', async () => {
    const { runtime } = setup();
    const answer = noteAnswer(runtime);
    runtime.submit(answer);
    expect(runtime.state.getSnapshot().envelope.progress.xpEarned).toBe(0);
    runtime.play();
    await flush();
    runtime.submit(answer);
    expect(runtime.state.getSnapshot().envelope.progress.xpEarned).toBe(17);
    runtime.submit({ pitchClass: (answer.pitchClass + 1) % 12 });
    runtime.play();
    await flush();
    runtime.submit({ pitchClass: (answer.pitchClass + 1) % 12 });
    expect(runtime.state.getSnapshot().rounds.notes.phase).toBe('correct');
    expect(runtime.state.getSnapshot().envelope.progress.quizzes.notes).toMatchObject({
      attempts: 1,
      correct: 1,
      firstTryCorrect: 1,
    });
  });
  it('missing octave never changes accuracy or XP', async () => {
    const { runtime } = setup();
    const s = structuredClone(runtime.state.getSnapshot().settings);
    s.notes.exactOctave = true;
    runtime.applySettings(s);
    runtime.play();
    await flush();
    const q = noteAnswer(runtime);
    runtime.submit({ pitchClass: q.pitchClass });
    expect(runtime.state.getSnapshot().rounds.notes.attempts).toBe(0);
    expect(runtime.state.getSnapshot().rounds.notes.feedback).toMatch(/octave/);
    runtime.submit(q);
    expect(runtime.state.getSnapshot().envelope.progress.quizzes.notes.correct).toBe(1);
  });
  it('tracks wrong retries, skips and new quiz accuracy separately', async () => {
    const { runtime } = setup();
    runtime.play();
    await flush();
    const answer = noteAnswer(runtime);
    runtime.submit({ pitchClass: (answer.pitchClass + 1) % 12 });
    runtime.submit(answer);
    const before = runtime.state.getSnapshot().envelope.progress;
    expect(before.quizzes.notes).toMatchObject({ attempts: 2, correct: 1, firstTryCorrect: 0 });
    runtime.next();
    runtime.next();
    expect(runtime.state.getSnapshot().envelope.progress.quizzes.notes).toMatchObject({
      attempts: 2,
      correct: 1,
      skips: 1,
    });
  });
  it('label-only settings preserve identity, behavior settings invalidate all rounds', () => {
    const { runtime } = setup();
    const first = runtime.state.getSnapshot();
    const s = structuredClone(first.settings);
    s.global.notation = 'solfege';
    runtime.applySettings(s);
    expect(runtime.state.getSnapshot().rounds.notes.id).toBe(first.rounds.notes.id);
    s.global.rootKey = 1;
    runtime.applySettings(s);
    expect(runtime.state.getSnapshot().rounds.notes.id).not.toBe(first.rounds.notes.id);
    expect(runtime.state.getSnapshot().rounds.intervals.id).not.toBe(first.rounds.intervals.id);
  });
  it('stale playback completion cannot reopen a replaced round', async () => {
    let finish: () => void = () => {};
    const { runtime } = setup({
      audio: {
        prepare: async () => {},
        play: () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
        cancel: () => {},
        setOutput: () => {},
        dispose: () => {},
      },
    });
    runtime.play();
    runtime.next();
    const id = runtime.state.getSnapshot().rounds.notes.id;
    finish();
    await flush();
    expect(runtime.state.getSnapshot().rounds.notes.id).toBe(id);
    expect(runtime.state.getSnapshot().rounds.notes.phase).toBe('ready');
  });
  it('cancelled auto-next cannot change another mode', async () => {
    vi.useFakeTimers();
    const { runtime } = setup();
    runtime.play();
    await flush();
    runtime.submit(noteAnswer(runtime));
    runtime.setMode('intervals');
    const id = runtime.state.getSnapshot().rounds.intervals.id;
    vi.advanceTimersByTime(3000);
    expect(runtime.state.getSnapshot().mode).toBe('intervals');
    expect(runtime.state.getSnapshot().rounds.intervals.id).toBe(id);
  });
  it('opening then cancelling Setup never restores stopped capture', () => {
    const { runtime } = setup();
    runtime.setMode('tuner');
    runtime.startMic();
    runtime.setSetup(true);
    runtime.stopAll();
    runtime.setSetup(false);
    expect(runtime.state.getSnapshot().capture).toBe('off');
  });
  it('honors first harmonic playback rather than choosing a default first', () => {
    const { runtime, audio } = setup();
    runtime.setMode('intervals');
    runtime.play('harmonic');
    expect(audio.play.mock.calls[0]?.[0].map((note) => note.at)).toEqual([0, 0]);
  });
});

describe('musical playback ownership', () => {
  it('minor cadence uses actual minor I and IV shapes', () => {
    const { runtime, audio } = setup();
    const settings = structuredClone(runtime.state.getSnapshot().settings);
    settings.global.scaleId = 'natural_minor';
    runtime.applySettings(settings);
    runtime.reference('cadence');
    const notes = audio.play.mock.calls.at(-1)?.[0];
    expect(notes?.filter((n) => n.at === 0).map((n) => n.midi % 12)).toEqual([0, 3, 7]);
    expect(notes?.filter((n) => n.at === 0.75).map((n) => n.midi % 12)).toEqual([5, 8, 0]);
  });
  it('cues overlay sustained Harmony backing without replacing its owner', async () => {
    let finish: () => void = () => {};
    const cancel = vi.fn(),
      overlay = vi.fn(async () => {});
    const { runtime } = setup({
      audio: {
        prepare: async () => {},
        play: () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
        overlay,
        cancel,
        setOutput: () => {},
        dispose: () => {},
      },
    });
    runtime.setMode('harmony');
    runtime.play();
    cancel.mockClear();
    runtime.playBlend();
    expect(overlay).toHaveBeenCalledOnce();
    expect(cancel).not.toHaveBeenCalled();
    await flush();
    expect(runtime.state.getSnapshot().playing).toBe(true);
    runtime.stopAll();
    expect(cancel).toHaveBeenCalledOnce();
    finish();
    await flush();
    expect(runtime.state.getSnapshot().playing).toBe(false);
  });
  it('schedules all progression steps on the audio clock and mutes the current lane', () => {
    const setVoiceMuted = vi.fn();
    const play = vi.fn(
      async (
        _notes: readonly PlaybackNote[],
        _config: { timbre: Timbre; a4: number; loop?: boolean },
      ) => {},
    );
    const { runtime } = setup({
      audio: {
        prepare: async () => {},
        play,
        cancel: () => {},
        setOutput: () => {},
        dispose: () => {},
        setVoiceMuted,
      },
    });
    runtime.setMode('harmony');
    const settings = structuredClone(runtime.state.getSnapshot().settings);
    settings.harmony.submode = 'mixer';
    runtime.applySettings(settings);
    runtime.playProgression();
    expect(play.mock.calls[0]?.[0]).toHaveLength(16);
    expect([...new Set(play.mock.calls[0]?.[0].map((n) => n.at))]).toEqual([0, 2, 4, 6]);
    runtime.toggleVoice(0);
    expect(setVoiceMuted).toHaveBeenCalledWith(0, true);
  });
});

describe('vocal eligibility and scoped pitch updates', () => {
  it('preview input never earns XP, quiz accuracy or completion', () => {
    vi.useFakeTimers();
    const { runtime } = setup();
    runtime.setMode('tuner');
    runtime.previewInput();
    vi.advanceTimersByTime(3000);
    expect(runtime.state.getSnapshot().envelope.progress.vocal.completedTargets).toBe(0);
    expect(runtime.state.getSnapshot().envelope.progress.xpEarned).toBe(0);
    expect(runtime.state.getSnapshot().envelope.progress.quizzes.notes.attempts).toBe(0);
  });
  it('requires 1500ms continuous eligible input and keeps vocal counts out of quiz accuracy', () => {
    const { runtime, emit } = setup();
    runtime.setMode('tuner');
    runtime.startMic();
    const s = runtime.state.getSnapshot();
    const target = s.queue[s.queueIndex]!;
    const freq = midiToFrequency(target, s.settings.global.a4);
    for (let t = 200; t <= 1600; t += 40) emit(freq, t);
    expect(runtime.state.getSnapshot().envelope.progress.vocal.completedTargets).toBe(0);
    emit(freq, 1680);
    emit(freq, 1720);
    expect(runtime.state.getSnapshot().envelope.progress.vocal.completedTargets).toBe(1);
    expect(runtime.state.getSnapshot().envelope.progress.xpEarned).toBe(20);
    expect(runtime.state.getSnapshot().envelope.progress.quizzes.notes.attempts).toBe(0);
    emit(freq, 1760);
    expect(runtime.state.getSnapshot().envelope.progress.vocal.completedTargets).toBe(1);
  });
  it('silence and oversized observation gaps reset the hold', () => {
    const { runtime, emit } = setup();
    runtime.setMode('tuner');
    runtime.startMic();
    const s = runtime.state.getSnapshot();
    const freq = midiToFrequency(s.queue[0]!, s.settings.global.a4);
    for (let t = 200; t <= 1200; t += 40) emit(freq, t);
    emit(null, 1240);
    emit(freq, 1280);
    expect(runtime.pitch.getSnapshot().hold).toBe(0);
    emit(freq, 1700);
    expect(runtime.pitch.getSnapshot().hold).toBe(0);
    expect(runtime.state.getSnapshot().envelope.progress.vocal.completedTargets).toBe(0);
  });
  it('Free tuner and Harmony Mixer never credit a stationary target', () => {
    const { runtime, emit } = setup();
    runtime.setMode('tuner');
    const settings = structuredClone(runtime.state.getSnapshot().settings);
    settings.tuner.drillMode = 'free';
    runtime.applySettings(settings);
    runtime.startMic();
    for (let t = 200; t <= 2200; t += 40) emit(261.625565, t);
    runtime.setMode('harmony');
    settings.harmony.submode = 'mixer';
    runtime.applySettings(settings);
    runtime.startMic();
    const target = runtime.state.getSnapshot().vocal?.targetMidi ?? 60;
    for (let t = 2400; t <= 4400; t += 40) emit(midiToFrequency(target), t);
    expect(runtime.state.getSnapshot().envelope.progress.vocal).toEqual({
      completedTargets: 0,
      harmonyLocks: 0,
    });
  });
  it('mode navigation retains capture only between vocal modes', () => {
    const { runtime, capture } = setup();
    runtime.setMode('tuner');
    runtime.startMic();
    capture.stop.mockClear();
    runtime.setMode('harmony');
    expect(capture.stop).not.toHaveBeenCalled();
    runtime.setMode('notes');
    expect(capture.stop).toHaveBeenCalled();
    expect(runtime.state.getSnapshot().capture).toBe('off');
  });
  it('HUD updates do not publish the structural application store', () => {
    const { runtime, emit } = setup();
    runtime.setMode('tuner');
    runtime.startMic();
    const listener = vi.fn();
    const unsubscribe = runtime.state.subscribe(listener);
    for (let t = 200; t <= 1000; t += 40) emit(300, t);
    expect(listener).not.toHaveBeenCalled();
    expect(runtime.pitch.getSnapshot().frequency).toBe(300);
    unsubscribe();
  });
  it('repeat target selection needs explicit Ready Again', () => {
    const { runtime, emit } = setup();
    runtime.setMode('tuner');
    runtime.startMic();
    runtime.selectTarget(0);
    expect(runtime.state.getSnapshot().rearm).toBe(true);
    const s = runtime.state.getSnapshot(),
      freq = midiToFrequency(s.queue[0]!);
    for (let t = 200; t <= 2000; t += 40) emit(freq, t);
    expect(runtime.state.getSnapshot().envelope.progress.vocal.completedTargets).toBe(0);
    runtime.readyAgain();
    for (let t = 2200; t <= 3760; t += 40) emit(freq, t);
    expect(runtime.state.getSnapshot().envelope.progress.vocal.completedTargets).toBe(1);
  });
  it('late input from a stopped request is ignored', () => {
    const { runtime, emit } = setup();
    runtime.setMode('tuner');
    runtime.startMic();
    runtime.stopAll();
    emit(440, 1000);
    expect(runtime.pitch.getSnapshot().frequency).toBeNull();
  });
});

describe('visible answer feedback and Harmony progression', () => {
  it('retains the actual wrong guess for feedback without revealing or changing the question', async () => {
    const { runtime } = setup();
    runtime.play();
    await flush();
    const answer = noteAnswer(runtime);
    const wrong = { pitchClass: (answer.pitchClass + 2) % 12 };
    const id = runtime.state.getSnapshot().rounds.notes.id;
    runtime.submit(wrong);
    expect(runtime.state.getSnapshot().rounds.notes).toMatchObject({
      id,
      phase: 'retry',
      lastAnswer: wrong,
      attempts: 1,
    });
    runtime.submit(wrong);
    expect(runtime.state.getSnapshot().rounds.notes).toMatchObject({
      id,
      phase: 'retry',
      lastAnswer: wrong,
      attempts: 2,
    });
    expect(runtime.state.getSnapshot().envelope.progress.xpEarned).toBe(0);
    runtime.submit(answer);
    expect(runtime.state.getSnapshot().rounds.notes).toMatchObject({
      id,
      phase: 'correct',
      lastAnswer: answer,
    });
    runtime.next();
    expect(runtime.state.getSnapshot().rounds.notes.lastAnswer).toBeNull();
  });
  it('Next Harmony target always changes the root when another feasible target exists, even with constant randomness', () => {
    const { runtime } = setup({ random: () => 0 });
    runtime.setMode('harmony');
    for (let i = 0; i < 12; i++) {
      const before = runtime.state.getSnapshot().vocal;
      runtime.newReference();
      expect(runtime.state.getSnapshot().vocal?.rootMidi).not.toBe(before?.rootMidi);
      expect(runtime.state.getSnapshot().settings.global.rootKey).toBe(0);
      expect(runtime.state.getSnapshot().envelope.progress.vocal.harmonyLocks).toBe(0);
    }
  });
  it('Notes in key provides different sung pitch classes without changing the global key', () => {
    const { runtime } = setup({ random: () => 0 });
    runtime.setMode('harmony');
    const settings = structuredClone(runtime.state.getSnapshot().settings);
    settings.harmony.rootPolicy = 'scale';
    runtime.applySettings(settings);
    const pitches = new Set<number>();
    for (let i = 0; i < 8; i++) {
      pitches.add(runtime.state.getSnapshot().vocal!.targetMidi % 12);
      runtime.newReference();
    }
    expect(pitches.size).toBeGreaterThan(1);
    expect(runtime.state.getSnapshot().settings.global.rootKey).toBe(0);
  });
});
