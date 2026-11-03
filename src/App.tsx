import {
  Component,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ErrorInfo,
  type ReactNode,
  type RefObject,
} from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { LazyMotion, domAnimation, m, MotionConfig, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Mic,
  Play,
  Settings2,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {
  AppState,
  ChallengeId,
  Mode,
  QualityId,
  Runtime,
  ScaleId,
  Settings,
  Timbre,
} from './domain/types';
import {
  CHALLENGES,
  CHORDS,
  INTERVALS,
  NOTE_NAMES,
  SOLFEGE_NAMES,
  DEGREE_NAMES,
  PROGRESSIONS,
  RANGE_PRESETS,
  SCALES,
  noteName,
  pitchLabel,
} from './domain/music';
import { availableHarmonyTargets, progressionSteps } from './domain/exercises';
import { Button, cn } from './components/ui/button';
import { HelpDialog } from './components/help-dialog';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './components/ui/dialog';
import './styles.css';

const modes: { id: Mode; label: string; symbol: string }[] = [
  { id: 'notes', label: 'Notes', symbol: '♫' },
  { id: 'intervals', label: 'Intervals', symbol: '↗' },
  { id: 'chords', label: 'Chords', symbol: '≡' },
  { id: 'harmony', label: 'Harmony', symbol: '♬' },
  { id: 'tuner', label: 'Tuner', symbol: '⌁' },
];
const pitches = Array.from({ length: 49 }, (_, i) => i + 36);
const title = {
  notes: 'Listen. Trust your ears.',
  intervals: 'Hear the space between.',
  chords: 'Find the color.',
  harmony: 'Find your place in the chord.',
  tuner: 'Find your center.',
};
const intro = {
  notes: 'Play a note, then choose what you heard.',
  intervals: 'Two notes. One relationship. Listen for the distance.',
  chords: 'Listen to the whole sound, then name its shape.',
  harmony: 'Hear the backing, find your note, and hold steady.',
  tuner: 'Hear a target, sing it back, and settle into the note.',
};
const clone = (settings: Settings) => structuredClone(settings);

class StudioBoundary extends Component<
  { runtime: Runtime; children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.runtime.stopAll();
  }
  render() {
    return this.state.error ? (
      <main className="error-page">
        <p className="eyebrow">Practice paused</p>
        <h1>Let’s reset the room.</h1>
        <p>The interface encountered an error. Audio and microphone input have been stopped.</p>
        <Button onClick={() => this.setState({ error: false })}>Try again</Button>
      </main>
    ) : (
      this.props.children
    );
  }
}
export default function App({ runtime }: { runtime: Runtime }) {
  return (
    <StudioBoundary runtime={runtime}>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation} strict>
          <Studio runtime={runtime} />
        </LazyMotion>
      </MotionConfig>
    </StudioBoundary>
  );
}
function Studio({ runtime: controller }: { runtime: Runtime }) {
  const setupReturnFocusRef = useRef<HTMLElement | null>(null);
  const runtime = useMemo<Runtime>(
    () => ({
      ...controller,
      setSetup(open) {
        if (open) {
          const active = document.activeElement;
          setupReturnFocusRef.current = active instanceof HTMLElement ? active : null;
        }
        controller.setSetup(open);
      },
    }),
    [controller],
  );
  const state = useSyncExternalStore(runtime.state.subscribe, runtime.state.getSnapshot);
  const key = `${NOTE_NAMES[state.settings.global.rootKey]} ${SCALES[state.settings.global.scaleId].name}`;
  return (
    <Tabs.Root
      value={state.mode}
      onValueChange={(value) => {
        if (modes.some((mode) => mode.id === value)) runtime.setMode(value as Mode);
      }}
      activationMode="manual"
      className="studio-app"
    >
      <a href="#practice" className="skip-link">
        Skip to practice
      </a>
      <header className="app-header">
        <div className="brand">
          <span className="beat-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <div>
            <div className="brand-name">
              Pitch Perfect <span>Studio</span>
            </div>
            <div className="brand-caption">Your pocket rehearsal room</div>
          </div>
        </div>
        <div className="header-actions">
          <span className="header-summary">
            {key} · {noteName(state.settings.global.lowMidi)}–
            {noteName(state.settings.global.highMidi)}
          </span>
          <CaptureIndicator state={state} runtime={runtime} />
          <Button onClick={() => runtime.setSetup(true)}>
            <Settings2 size={16} aria-hidden="true" />
            Setup
          </Button>
        </div>
      </header>
      <Tabs.List className="mode-nav" aria-label="Training modes">
        {modes.map((mode) => (
          <Tabs.Trigger key={mode.id} value={mode.id} className="mode-button">
            <span className="nav-symbol" aria-hidden="true">
              {mode.symbol}
            </span>
            <span>{mode.label}</span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <main id="practice" className={cn('page-content', state.capture !== 'off' && 'has-capture')}>
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              {['harmony', 'tuner'].includes(state.mode) ? 'Vocal practice' : 'Ear training'} /{' '}
              {modes.find((mode) => mode.id === state.mode)?.label}
            </p>
            <h1>{title[state.mode]}</h1>
            <p className="intro">{intro[state.mode]}</p>
          </div>
          <span className="practice-tag">Free practice</span>
        </div>
        <div className="compact-summary">
          {key} · {noteName(state.settings.global.lowMidi)}–
          {noteName(state.settings.global.highMidi)} · A4 {state.settings.global.a4} Hz
        </div>
        {state.storageMessage && (
          <div className="notice" role="status">
            <span>{state.storageMessage}</span>
            <Button size="small" onClick={() => runtime.retrySave()}>
              Retry save
            </Button>
          </div>
        )}
        <div className="practice-grid">
          <div className="practice-main">
            <Tabs.Content value={state.mode} className="mode-content" tabIndex={-1}>
              {state.mode === 'notes' || state.mode === 'intervals' || state.mode === 'chords' ? (
                <Quiz runtime={runtime} state={state} mode={state.mode} />
              ) : state.mode === 'harmony' ? (
                <Harmony runtime={runtime} state={state} />
              ) : (
                <Tuner runtime={runtime} state={state} />
              )}
            </Tabs.Content>
            <div className="mobile-help">
              <Help state={state} />
              <Progress state={state} runtime={runtime} />
            </div>
          </div>
          <aside className="context-rail">
            <SetupSummary state={state} runtime={runtime} />
            <Help state={state} />
            <Progress state={state} runtime={runtime} />
          </aside>
        </div>
        {state.message && (
          <p className="global-status" role="status">
            {state.message}
          </p>
        )}
      </main>
      {state.capture !== 'off' && (
        <div className="mobile-capture">
          <span>
            {state.capture === 'listening' ? 'Microphone on' : captureLabel(state.capture)}
          </span>
          <Button size="small" variant="danger" onClick={() => runtime.stopAll()}>
            <Square size={12} aria-hidden="true" />
            {state.capture === 'waiting' ? 'Cancel' : 'Stop all'}
          </Button>
        </div>
      )}
      <Setup runtime={runtime} state={state} returnFocusRef={setupReturnFocusRef} />
    </Tabs.Root>
  );
}
function captureLabel(status: AppState['capture']) {
  return {
    off: 'Microphone off',
    waiting: 'Waiting for permission',
    listening: 'Microphone on',
    denied: 'Permission denied',
    unavailable: 'Input unavailable',
    interrupted: 'Input interrupted',
  }[status];
}
function CaptureIndicator({ state, runtime }: { state: AppState; runtime: Runtime }) {
  return state.capture === 'off' ? null : (
    <div className="capture-indicator">
      <span>
        <i />
        {captureLabel(state.capture)}
      </span>
      <Button size="small" variant="danger" onClick={() => runtime.stopAll()}>
        {state.capture === 'waiting' ? 'Cancel' : 'Stop all'}
      </Button>
    </div>
  );
}
function Output({ state, runtime }: { state: AppState; runtime: Runtime }) {
  const id = useId();
  return (
    <div className="output">
      <div className="output-row">
        <Button
          variant="ghost"
          onClick={() => runtime.setOutput(state.volume, !state.muted)}
          aria-pressed={state.muted}
        >
          {state.muted ? (
            <VolumeX size={16} aria-hidden="true" />
          ) : (
            <Volume2 size={16} aria-hidden="true" />
          )}
          {state.muted ? 'Unmute output' : 'Mute output'}
        </Button>
        <label className="sr-only" htmlFor={id}>
          Output volume
        </label>
        <input
          id={id}
          type="range"
          min="0"
          max="100"
          value={state.volume}
          aria-valuetext={`${state.volume}%${state.muted ? ', muted' : ''}`}
          onChange={(event) => runtime.setOutput(Number(event.target.value), state.muted)}
        />
        <span>{state.volume}%</span>
      </div>
      <p>Output only. Muting sound does not stop the microphone.</p>
    </div>
  );
}
function SetupSummary({ state, runtime }: { state: AppState; runtime: Runtime }) {
  const g = state.settings.global;
  return (
    <section className="rail-section">
      <h2 className="rail-eyebrow">Your setup</h2>
      <dl className="setup-list">
        <div>
          <dt>Key &amp; scale</dt>
          <dd>
            {NOTE_NAMES[g.rootKey]} {SCALES[g.scaleId].name}
          </dd>
        </div>
        <div>
          <dt>Your range</dt>
          <dd>
            {noteName(g.lowMidi)}–{noteName(g.highMidi)}
          </dd>
        </div>
        <div>
          <dt>Instrument</dt>
          <dd>
            {
              {
                piano: 'Warm piano',
                epiano: 'Electric piano',
                strings: 'Choir / strings',
                organ: 'Organ',
                sine: 'Pure sine',
              }[g.timbre]
            }
          </dd>
        </div>
        <div>
          <dt>Tuning</dt>
          <dd>A4 · {g.a4} Hz</dd>
        </div>
      </dl>
      <Button variant="ghost" onClick={() => runtime.setSetup(true)}>
        Edit setup <ArrowUpRight size={15} aria-hidden="true" />
      </Button>
      <Output state={state} runtime={runtime} />
    </section>
  );
}
function Signal() {
  return (
    <div className="signal" aria-hidden="true">
      {[
        9, 13, 19, 12, 26, 36, 22, 47, 32, 61, 44, 72, 49, 64, 77, 51, 63, 39, 54, 32, 47, 27, 37,
        18, 29, 16, 21, 11, 15, 8, 11,
      ].map((height, i) => (
        <i key={i} style={{ height }} />
      ))}
    </div>
  );
}
function Quiz({
  runtime,
  state,
  mode,
}: {
  runtime: Runtime;
  state: AppState;
  mode: 'notes' | 'intervals' | 'chords';
}) {
  const round = state.rounds[mode];
  const [note, setNote] = useState('');
  const [octave, setOctave] = useState('');
  const [quality, setQuality] = useState<QualityId | ''>('');
  const [inversion, setInversion] = useState('');
  const [entryError, setEntryError] = useState('');
  const reduced = useReducedMotion();
  useEffect(() => {
    setNote('');
    setOctave('');
    setQuality('');
    setInversion('');
    setEntryError('');
  }, [round.id, mode]);
  const answerable = round.phase === 'awaiting' || round.phase === 'retry';
  const active = round.phase !== 'ready';
  const q = round.question;
  const retry = round.phase === 'retry';
  const lastAnswer = round.lastAnswer;
  const submittedChoice =
    lastAnswer?.midi !== undefined
      ? noteName(lastAnswer.midi)
      : lastAnswer?.pitchClass !== undefined
        ? NOTE_NAMES[lastAnswer.pitchClass]
        : lastAnswer?.semitones !== undefined
          ? INTERVALS.find((interval) => interval.st === lastAnswer.semitones)?.name
          : lastAnswer?.qualityId
            ? `${CHORDS.find((chord) => chord.id === lastAnswer.qualityId)?.name}${lastAnswer.inversion !== undefined ? `, ${['root position', 'first inversion', 'second inversion', 'third inversion'][lastAnswer.inversion]}` : ''}`
            : '';

  function exact() {
    if (note === '' || octave === '') {
      setEntryError(
        'Choose both a note and an octave before checking. No attempt has been counted.',
      );
      return;
    }
    setEntryError('');
    runtime.submit({ pitchClass: Number(note), midi: (Number(octave) + 1) * 12 + Number(note) });
  }
  function chordAnswer() {
    if (!quality || (state.settings.chords.inversionMode === 'guess_inv' && inversion === '')) {
      setEntryError(
        'Choose a chord quality and, when requested, an inversion. No attempt has been counted.',
      );
      return;
    }
    setEntryError('');
    runtime.submit({
      qualityId: quality,
      ...(inversion !== '' ? { inversion: Number(inversion) } : {}),
    });
  }
  const selectedChord = CHORDS.find((chord) => chord.id === quality);
  return (
    <section className={cn('quiz', active && 'quiz-active')} aria-label={`${mode} practice`}>
      {round.error && (
        <div role="alert" className="notice notice-error">
          <p>{round.error}</p>
          <Button onClick={() => runtime.setSetup(true)}>Edit range or exercise</Button>
        </div>
      )}
      <div className="sound-stage">
        <div className="stage-meta">
          <span>
            <i />
            {NOTE_NAMES[state.settings.global.rootKey]} {SCALES[state.settings.global.scaleId].name}
          </span>
          <span>
            {
              {
                ready: 'Ready to play',
                playing: 'Listening',
                awaiting: 'Your turn',
                retry: 'Another listen',
                correct: 'Nice listening',
              }[round.phase]
            }
          </span>
        </div>
        <Signal />
        <Button
          variant="primary"
          className="stage-action"
          onClick={() => runtime.play()}
          disabled={!!round.error || round.phase === 'playing'}
        >
          <Play size={16} fill="currentColor" aria-hidden="true" />
          {round.phase === 'ready'
            ? `Play ${mode === 'notes' ? 'note' : mode === 'intervals' ? 'interval' : 'chord'}`
            : round.phase === 'playing'
              ? 'Playing…'
              : 'Replay'}
        </Button>
        <p className="stage-status">
          {round.phase === 'correct'
            ? 'Replay keeps this completed answer closed.'
            : 'One listen. A little closer to knowing it.'}
        </p>
      </div>
      {mode === 'notes' ? (
        <div className="reference-row">
          <Button variant="ghost" onClick={() => runtime.reference('tonic')}>
            Hear tonic <ArrowUpRight size={14} aria-hidden="true" />
          </Button>
          <Button variant="ghost" onClick={() => runtime.reference('scale')}>
            Hear scale <ArrowUpRight size={14} aria-hidden="true" />
          </Button>
          <Button variant="ghost" onClick={() => runtime.reference('cadence')}>
            Hear cadence <ArrowUpRight size={14} aria-hidden="true" />
          </Button>
        </div>
      ) : mode === 'intervals' ? (
        <div className="reference-row">
          <Button variant="ghost" onClick={() => runtime.play('ascending')}>
            Ascending
          </Button>
          <Button variant="ghost" onClick={() => runtime.play('descending')}>
            Descending
          </Button>
          <Button variant="ghost" onClick={() => runtime.play('harmonic')}>
            Together
          </Button>
        </div>
      ) : (
        <div className="reference-row">
          <Button variant="ghost" onClick={() => runtime.play('block')}>
            Block chord
          </Button>
          <Button variant="ghost" onClick={() => runtime.play('arpeggio')}>
            Arpeggio
          </Button>
        </div>
      )}
      {mode === 'chords' && (
        <p className="hint">
          Accompaniment register C2–C6. Chord voices may extend beyond your sung range.
        </p>
      )}
      {mode === 'chords' &&
        state.settings.chords.inversionMode !== 'root' &&
        q?.kind === 'chords' && (
          <div className="root-context">
            <span>
              Reference root <strong>{pitchLabel(q.rootMidi, state.settings)}</strong>
            </span>
            <Button size="small" onClick={() => runtime.reference('root')}>
              Hear root
            </Button>
          </div>
        )}
      <div className="section-heading">
        <h2>Your answer</h2>
        {mode === 'notes' && (
          <label className="check-label">
            <input
              type="checkbox"
              checked={state.settings.notes.exactOctave}
              onChange={(event) =>
                runtime.applySettings({
                  ...state.settings,
                  notes: { ...state.settings.notes, exactOctave: event.target.checked },
                })
              }
            />
            Exact octave
          </label>
        )}
      </div>
      {mode === 'notes' &&
        (state.settings.notes.exactOctave ? (
          <div className="exact-entry">
            <label>
              Note
              <select value={note} onChange={(event) => setNote(event.target.value)}>
                <option value="">Choose note</option>
                {NOTE_NAMES.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Octave
              <select value={octave} onChange={(event) => setOctave(event.target.value)}>
                <option value="">Choose octave</option>
                {[2, 3, 4, 5, 6].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <Button variant="primary" disabled={!answerable} onClick={exact}>
              Check answer
            </Button>
          </div>
        ) : (
          <div className="answer-grid notes-grid">
            {NOTE_NAMES.map((name, pc) => {
              const relative = (pc - state.settings.global.rootKey + 12) % 12;
              const inScale = SCALES[state.settings.global.scaleId].steps.includes(relative);
              const wrong = retry && lastAnswer?.pitchClass === pc;
              return (
                <button
                  key={name}
                  type="button"
                  className={cn('answer-key', wrong && 'is-wrong')}
                  disabled={!answerable || !inScale}
                  onClick={() => runtime.submit({ pitchClass: pc })}
                  aria-label={`${state.settings.global.notation === 'letter' ? name : `${state.settings.global.notation === 'solfege' ? SOLFEGE_NAMES[relative] : DEGREE_NAMES[relative]} (${name})`}${inScale ? ' answer' : ', outside active scale'}${wrong ? ', incorrect previous answer' : ''}`}
                >
                  <span>
                    {state.settings.global.notation === 'letter'
                      ? name
                      : state.settings.global.notation === 'solfege'
                        ? SOLFEGE_NAMES[relative]
                        : DEGREE_NAMES[relative]}
                  </span>
                  <small>{inScale ? SOLFEGE_NAMES[relative] : '—'}</small>
                  {wrong && (
                    <i className="answer-mark" aria-hidden="true">
                      ×
                    </i>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      {mode === 'intervals' && (
        <div className="answer-grid intervals-grid">
          {INTERVALS.filter((interval) => interval.st > 0).map((interval) => (
            <button
              type="button"
              className={cn(
                'answer-key',
                retry && lastAnswer?.semitones === interval.st && 'is-wrong',
              )}
              aria-label={`${interval.name}${retry && lastAnswer?.semitones === interval.st ? ', incorrect previous answer' : ''}`}
              key={interval.st}
              disabled={
                !answerable || !state.settings.intervals.activeSemitones.includes(interval.st)
              }
              onClick={() => runtime.submit({ semitones: interval.st })}
            >
              <span>{interval.short}</span>
              <small>{interval.name}</small>
              {retry && lastAnswer?.semitones === interval.st && (
                <i className="answer-mark" aria-hidden="true">
                  ×
                </i>
              )}
            </button>
          ))}
        </div>
      )}
      {mode === 'chords' && (
        <>
          <div className="answer-grid chord-grid">
            {CHORDS.map((chord) => (
              <button
                type="button"
                className={cn(
                  'answer-key',
                  quality === chord.id && 'selected',
                  retry && lastAnswer?.qualityId === chord.id && 'is-wrong',
                )}
                aria-label={`${chord.name}${retry && lastAnswer?.qualityId === chord.id ? ', part of previous incorrect answer' : ''}`}
                key={chord.id}
                disabled={!answerable || !state.settings.chords.activeQualityIds.includes(chord.id)}
                aria-pressed={quality === chord.id}
                onClick={() => {
                  setQuality(chord.id);
                  if (chord.intervals.length === 3 && inversion === '3') setInversion('');
                }}
              >
                <span>{chord.short}</span>
                <small>{chord.name}</small>
                {retry && lastAnswer?.qualityId === chord.id && (
                  <i className="answer-mark" aria-hidden="true">
                    ×
                  </i>
                )}
              </button>
            ))}
          </div>
          {state.settings.chords.inversionMode === 'guess_inv' && (
            <fieldset className="inversion-options">
              <legend>Inversion</legend>
              {['Root position', 'First inversion', 'Second inversion', 'Third inversion'].map(
                (label, i) => (
                  <label
                    key={label}
                    className={cn('choice', inversion === String(i) && 'selected')}
                  >
                    <input
                      type="radio"
                      name="chord-inversion"
                      value={i}
                      checked={inversion === String(i)}
                      disabled={!answerable || (i === 3 && selectedChord?.intervals.length === 3)}
                      onChange={(event) => setInversion(event.target.value)}
                    />
                    {label}
                  </label>
                ),
              )}
            </fieldset>
          )}
          <Button
            className="check-chord"
            variant="primary"
            onClick={chordAnswer}
            disabled={!answerable}
          >
            Check answer
          </Button>
          {q?.kind === 'chords' && (
            <details className="disclosure">
              <summary>Isolate a voice</summary>
              <div className="button-row">
                {q.notes.map((midi, i) => (
                  <Button key={i} size="small" onClick={() => runtime.audition(midi)}>
                    Voice {i + 1}
                  </Button>
                ))}
              </div>
            </details>
          )}
        </>
      )}
      {entryError && (
        <p role="alert" className="field-error">
          {entryError}
        </p>
      )}
      <m.div
        initial={{ opacity: reduced ? 1 : 0.65 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16 }}
        className={cn(
          'feedback',
          round.phase === 'correct' && 'feedback-correct',
          retry && 'feedback-retry',
        )}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div>
          <strong>
            {round.phase === 'correct'
              ? 'Locked in.'
              : round.phase === 'retry'
                ? '× Not quite — try again.'
                : round.phase === 'ready'
                  ? 'A good place to start.'
                  : round.phase === 'playing'
                    ? 'Listen closely.'
                    : 'What did you hear?'}
          </strong>
          {retry && (
            <p className="feedback-attempt">
              Attempt {round.attempts} · Your choice: {submittedChoice}.
            </p>
          )}
          <p>{round.feedback || 'Play when you’re ready. References are here if you need them.'}</p>
        </div>
        {round.phase === 'correct' && (
          <Button onClick={() => runtime.next()}>
            Next <ArrowRight size={14} aria-hidden="true" />
          </Button>
        )}
      </m.div>
      <div className="next-row">
        {mode === 'notes' ? (
          <label className="check-label">
            <input
              type="checkbox"
              checked={state.settings.notes.autoNext}
              onChange={(event) =>
                runtime.applySettings({
                  ...state.settings,
                  notes: { ...state.settings.notes, autoNext: event.target.checked },
                })
              }
            />
            Auto-advance
          </label>
        ) : (
          <span />
        )}
        <Button variant="ghost" onClick={() => runtime.next()}>
          Skip {mode === 'notes' ? 'note' : mode === 'intervals' ? 'interval' : 'chord'}{' '}
          <ArrowRight size={14} aria-hidden="true" />
        </Button>
      </div>
      {mode === 'notes' && <Piano runtime={runtime} state={state} answerable={answerable} />}
      {mode === 'intervals' && (
        <details className="disclosure">
          <summary>Song anchors &amp; interval guide</summary>
          <p className="hint">
            Song names are memory prompts. Hear the interval itself, then compare the distance.
          </p>
          <div className="anchor-list">
            {INTERVALS.filter((interval) => interval.st > 0).map((interval) => (
              <div key={interval.st}>
                <strong>
                  {interval.short} · {interval.name}
                </strong>
                <span>↑ {interval.songAsc}</span>
                <span>↓ {interval.songDesc}</span>
                <div className="button-row">
                  <Button
                    size="small"
                    aria-label={`Hear ${interval.name} ascending reference`}
                    onClick={() => runtime.auditionInterval(interval.st, false)}
                  >
                    Hear ↑
                  </Button>
                  <Button
                    size="small"
                    aria-label={`Hear ${interval.name} descending reference`}
                    onClick={() => runtime.auditionInterval(interval.st, true)}
                  >
                    Hear ↓
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
function Piano({
  runtime,
  state,
  answerable,
}: {
  runtime: Runtime;
  state: AppState;
  answerable: boolean;
}) {
  const { octave, inputMode: action } = state.settings.piano;
  const updatePiano = (patch: Partial<Settings['piano']>) =>
    runtime.applySettings({ ...state.settings, piano: { ...state.settings.piano, ...patch } });
  const base = (octave + 1) * 12;
  return (
    <details className="disclosure piano-disclosure">
      <summary>
        Keyboard <span>Optional audition or answer</span>
      </summary>
      <div className="piano-tools">
        <div className="segmented" role="group" aria-label="Keyboard action">
          {(['audition', 'answer'] as const).map((value) => (
            <Button
              key={value}
              aria-pressed={action === value}
              onClick={() => updatePiano({ inputMode: value })}
            >
              {value === 'audition' ? 'Audition' : 'Answer'}
            </Button>
          ))}
        </div>
        <div className="octave-controls">
          <Button
            size="icon"
            aria-label="Previous keyboard octave"
            disabled={octave <= 2}
            onClick={() => updatePiano({ octave: octave - 1 })}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </Button>
          <span>Octave {octave}</span>
          <Button
            size="icon"
            aria-label="Next keyboard octave"
            disabled={octave >= 6}
            onClick={() => updatePiano({ octave: octave + 1 })}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="piano-scroll">
        <div className="piano" role="group" aria-label={`Octave ${octave} piano`}>
          {NOTE_NAMES.map((name, i) => {
            const midi = base + i;
            const inRange =
              midi >= state.settings.global.lowMidi && midi <= state.settings.global.highMidi;
            const inScale = SCALES[state.settings.global.scaleId].steps.includes(
              (i - state.settings.global.rootKey + 12) % 12,
            );
            const black = [1, 3, 6, 8, 10].includes(i);
            const position = black
              ? ({ 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 } as Record<number, number>)[i]
              : ({ 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 } as Record<number, number>)[i];
            return (
              <button
                style={{
                  left: black
                    ? `calc(${(position / 7) * 100}% - 14px)`
                    : `${(position / 7) * 100}%`,
                }}
                key={midi}
                className={cn(
                  'piano-key',
                  black && 'piano-black',
                  inRange && inScale && 'piano-active',
                )}
                type="button"
                disabled={
                  midi > 84 || (action === 'answer' && (!answerable || !inRange || !inScale))
                }
                aria-label={`${action === 'answer' ? 'Answer' : 'Audition'} ${noteName(midi)}${inRange && inScale ? '' : ', outside active pool'}`}
                onClick={() =>
                  action === 'answer'
                    ? runtime.submit({ pitchClass: i, midi })
                    : runtime.audition(midi)
                }
              >
                {name}
                <small>{octave}</small>
              </button>
            );
          })}
        </div>
      </div>
      <p className="hint">
        {action === 'audition'
          ? 'Audition provides a reference. It never submits an answer.'
          : 'Answer submits the exact note and octave.'}{' '}
        Highlighted notes belong to your active range and scale.
      </p>
    </details>
  );
}
function PitchDisplay({
  runtime,
  state,
  free = false,
  target,
  tolerance,
}: {
  runtime: Runtime;
  state: AppState;
  free?: boolean;
  target?: number;
  tolerance: number;
}) {
  const pitch = useSyncExternalStore(runtime.pitch.subscribe, runtime.pitch.getSnapshot);
  const nearestMidi = pitch.midi === null ? null : Math.round(pitch.midi);
  const cents = free ? pitch.nearestCents : pitch.targetCents;
  const measured = pitch.frequency !== null && nearestMidi !== null;
  const meaning =
    cents === null
      ? 'No usable pitch'
      : Math.abs(cents) <= tolerance
        ? 'In tune'
        : cents < 0
          ? 'Flat'
          : 'Sharp';
  const beyond = cents !== null && Math.abs(cents) > 50;
  const center = free ? nearestMidi : target;
  const points: string[] = [];
  const now = pitch.history[pitch.history.length - 1]?.time ?? 0;
  let drawing = false;
  for (const observation of pitch.history) {
    if (observation.midi === null || center == null || observation.time < now - 8000) {
      drawing = false;
      continue;
    }
    const x = Math.max(0, Math.min(640, ((observation.time - now + 8000) / 8000) * 640));
    const y = Math.max(2, Math.min(130, 66 - (observation.midi - center) * 45));
    points.push(`${drawing ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
    drawing = true;
  }
  return (
    <div className="pitch-display">
      <div className="pitch-reading">
        <div className="pitch-note">{measured ? pitchLabel(nearestMidi, state.settings) : '—'}</div>
        <p>
          {measured
            ? `${pitch.frequency?.toFixed(1)} Hz · nearest note ${pitch.nearestCents === null ? '—' : signedCents(pitch.nearestCents)}`
            : state.capture === 'listening'
              ? 'Sing one steady note. Your reading will appear here.'
              : 'A steady note starts here.'}
        </p>
        <strong
          className={cn(
            'pitch-meaning',
            measured && Math.abs(cents ?? 1000) <= tolerance && 'in-tune',
          )}
        >
          {meaning}
          {pitch.preview ? ' · preview, no credit' : ''}
        </strong>
      </div>
      <div
        className="meter"
        role="img"
        aria-label={`${free ? 'Nearest-note' : 'Exact-target'} pitch error: ${cents === null ? 'no current reading' : signedCents(cents)}${beyond ? ', beyond displayed 50-cent window' : ''}`}
      >
        <div className="meter-track" />
        <div
          className="meter-zone"
          style={{ left: `${50 - tolerance}%`, width: `${tolerance * 2}%` }}
        />
        <div className="meter-center" />
        {cents !== null && (
          <div
            className="meter-pointer"
            style={{ left: `${Math.max(0, Math.min(100, cents + 50))}%` }}
          />
        )}
      </div>
      <div className="meter-labels" aria-hidden="true">
        <span>−50</span>
        <span>−25</span>
        <span>0</span>
        <span>+25</span>
        <span>+50¢</span>
      </div>
      <p className="tolerance-copy">
        {free
          ? `Nearest-note guidance ±${tolerance} cents · ungraded`
          : `Exact target ${target == null ? '—' : noteName(target)} · ${cents === null ? 'waiting for pitch' : signedCents(cents)}${beyond ? ' · beyond meter window' : ''}`}
      </p>
      {!free && (
        <div className="hold">
          <div>
            <strong>
              {state.rearm
                ? 'Ready again before your next hold'
                : state.targetComplete
                  ? 'Target completed'
                  : `Hold within ±${tolerance} cents`}
            </strong>
            <span>
              {pitch.preview
                ? 'Preview · unearned'
                : `${((Math.min(100, pitch.hold) / 100) * 1.5).toFixed(1)} / 1.5s`}
            </span>
          </div>
          <div
            className="hold-track"
            role="progressbar"
            aria-label="Continuous target hold"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pitch.preview ? 0 : pitch.hold)}
          >
            <i style={{ width: `${pitch.preview ? 0 : pitch.hold}%` }} />
          </div>
        </div>
      )}
      <figure className="pitch-chart">
        <figcaption>
          <span>Pitch trail</span>
          <span>Last 8 seconds</span>
        </figcaption>
        <div className="chart-wrap">
          <span className="chart-note">{center == null ? '—' : noteName(center)}</span>
          <svg
            viewBox="0 0 640 132"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Recent pitch history. ${center == null ? 'No pitch yet.' : `Center ${noteName(center)}.`} ${meaning}${beyond ? ', current pitch beyond graph center window' : ''}.`}
          >
            <line x1="0" y1="26" x2="640" y2="26" />
            <line x1="0" y1="66" x2="640" y2="66" className="chart-center" />
            <line x1="0" y1="106" x2="640" y2="106" />
            <path d={points.join(' ')} />
          </svg>
        </div>
        <div className="chart-axis">
          <span>8s ago</span>
          <span>Now</span>
        </div>
      </figure>
    </div>
  );
}
function signedCents(cents: number) {
  return `${cents > 0 ? '+' : ''}${Math.round(cents)}¢`;
}
function MicControls({ state, runtime }: { state: AppState; runtime: Runtime }) {
  const live = state.capture === 'listening' || state.capture === 'waiting';
  return (
    <>
      <div className="button-row mic-buttons">
        <Button
          variant={live ? 'danger' : 'primary'}
          onClick={() => (live ? runtime.stopAll() : runtime.startMic())}
        >
          {live ? <Square size={14} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
          {state.capture === 'waiting'
            ? 'Cancel microphone request'
            : state.capture === 'listening'
              ? 'Stop microphone'
              : state.capture === 'off'
                ? 'Start microphone'
                : 'Retry microphone'}
        </Button>
        <Button onClick={() => runtime.previewInput()} disabled={live}>
          Preview input
        </Button>
      </div>
      <p
        className={cn(
          'capture-message',
          ['denied', 'unavailable', 'interrupted'].includes(state.capture) && 'field-error',
        )}
        role="status"
      >
        {state.captureMessage ||
          'Microphone audio is processed locally. Use headphones so reference tones stay separate from your voice.'}
      </p>
      <p className="hint">
        Preview input is simulated and never earns XP, accuracy or target credit.
      </p>
    </>
  );
}
function Tuner({ runtime, state }: { runtime: Runtime; state: AppState }) {
  const free = state.settings.tuner.drillMode === 'free';
  const target = state.queue[state.queueIndex];
  const change = (drillMode: Settings['tuner']['drillMode']) =>
    runtime.applySettings({ ...state.settings, tuner: { ...state.settings.tuner, drillMode } });
  return (
    <section aria-label="Tuner practice">
      <div className="mode-switch-row">
        <div className="segmented" role="group" aria-label="Tuner task">
          <Button aria-pressed={!free} onClick={() => change('target')}>
            Target practice
          </Button>
          <Button aria-pressed={free} onClick={() => change('free')}>
            Free tuner
          </Button>
        </div>
        {!free && (
          <Button variant="ghost" onClick={() => runtime.play()} disabled={target == null}>
            Hear target <ArrowUpRight size={14} aria-hidden="true" />
          </Button>
        )}
      </div>
      {!free && (
        <div className="drill-row">
          <label>
            Drill
            <select
              value={state.settings.tuner.drillMode}
              onChange={(event) => change(event.target.value as Settings['tuner']['drillMode'])}
            >
              <option value="target">Target note</option>
              <option value="scale_walk">Scale walk</option>
              <option value="arpeggio">Triad arpeggio</option>
            </select>
          </label>
          <label>
            Tolerance
            <select
              value={state.settings.tuner.toleranceCents}
              onChange={(event) =>
                runtime.applySettings({
                  ...state.settings,
                  tuner: {
                    ...state.settings.tuner,
                    toleranceCents: Number(event.target.value) as 12 | 22 | 35,
                  },
                })
              }
            >
              <option value={22}>Standard ±22¢</option>
              <option value={12}>Strict ±12¢</option>
              <option value={35}>Relaxed ±35¢</option>
            </select>
          </label>
        </div>
      )}
      {state.vocalError && (
        <div className="notice notice-error" role="alert">
          <p>{state.vocalError}</p>
          <Button onClick={() => runtime.setSetup(true)}>Edit range or drill</Button>
        </div>
      )}
      <div className="tuner-well">
        <div className="tuner-top">
          <span>
            {free ? (
              `Ungraded · A4 ${state.settings.global.a4} Hz`
            ) : (
              <>
                Target <strong>{target == null ? '—' : pitchLabel(target, state.settings)}</strong>
              </>
            )}
          </span>
          <span className={cn('input-status', state.capture === 'listening' && 'is-live')}>
            {captureLabel(state.capture)}
          </span>
        </div>
        <MicControls state={state} runtime={runtime} />
        <PitchDisplay
          runtime={runtime}
          state={state}
          free={free}
          target={target}
          tolerance={state.settings.tuner.toleranceCents}
        />
        {!free && (
          <div className="button-row">
            {state.rearm ? (
              <Button variant="primary" onClick={() => runtime.readyAgain()}>
                Repeat this target
              </Button>
            ) : null}
            <Button onClick={() => runtime.nextTarget()} disabled={!state.queue.length}>
              Next target <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
      {!free && (
        <section className="queue-section">
          <div className="section-heading">
            <h2>Up next</h2>
            <span>
              {state.queue.length
                ? `${state.queueIndex + 1} of ${state.queue.length}`
                : 'No targets'}
            </span>
          </div>
          <div className="queue">
            {state.queue.map((midi, i) => (
              <Button
                key={`${i}-${midi}`}
                aria-pressed={i === state.queueIndex}
                onClick={() => runtime.selectTarget(i)}
              >
                {pitchLabel(midi, state.settings)}
              </Button>
            ))}
          </div>
          <p className="hint">
            Selecting or skipping a target never earns progress. Use Hear target to audition it.
          </p>
        </section>
      )}
    </section>
  );
}
function Harmony({ runtime, state }: { runtime: Runtime; state: AppState }) {
  const mixer = state.settings.harmony.submode === 'mixer';
  const targetCount = availableHarmonyTargets(state.settings).length;
  const tonicOnly = state.settings.harmony.rootPolicy === 'tonic';
  return (
    <section aria-label="Harmony practice">
      <div className="segmented harmony-switch" role="group" aria-label="Harmony activity">
        <Button
          aria-pressed={!mixer}
          onClick={() =>
            runtime.applySettings({
              ...state.settings,
              harmony: { ...state.settings.harmony, submode: 'target' },
            })
          }
        >
          Target practice
        </Button>
        <Button
          aria-pressed={mixer}
          onClick={() =>
            runtime.applySettings({
              ...state.settings,
              harmony: { ...state.settings.harmony, submode: 'mixer' },
            })
          }
        >
          Harmony mixer
        </Button>
      </div>
      {mixer ? (
        <Mixer runtime={runtime} state={state} />
      ) : (
        <>
          <div className="practice-help-row">
            <HelpDialog
              triggerLabel="How to practice"
              title="Find your harmony"
              description="Sing one note against the backing, then hold it steady. Here’s how to get started."
              steps={[
                {
                  title: 'Listen to the backing',
                  body: 'Press Hold backing to hear your reference. Use Cue my note to hear the exact pitch you’ll sing, or Preview full blend to hear how it fits.',
                },
                {
                  title: 'Sing your target',
                  body: 'Press Start microphone and allow access. Sing the note and octave shown under Your target; the pitch display shows whether you’re above or below it.',
                },
                {
                  title: 'Settle in and hold',
                  body: 'Stay within ±25 cents for 1.5 continuous seconds to earn a lock. If your pitch drifts or you pause, the hold starts again.',
                },
              ]}
            >
              <h3>Want a different note?</h3>
              <p>
                Next target changes the reference and sung note while keeping your challenge. Tonic
                only keeps the root on the key’s home note and varies its octave; choose Notes in
                this key for more variety. If only one target fits, widen your range or change the
                challenge.
              </p>
              <h3>Just exploring?</h3>
              <p>
                Preview input is simulated and never earns a lock. After a real lock, use Repeat
                this target to practice the same note again.
              </p>
            </HelpDialog>
          </div>
          <div className="drill-row">
            <label>
              Harmony challenge
              <select
                value={state.settings.harmony.challengeId}
                onChange={(event) =>
                  runtime.applySettings({
                    ...state.settings,
                    harmony: {
                      ...state.settings.harmony,
                      challengeId: event.target.value as ChallengeId,
                    },
                  })
                }
              >
                {Object.entries(CHALLENGES).map(([id, challenge]) => (
                  <option key={id} value={id}>
                    {challenge.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Root practice
              <select
                value={state.settings.harmony.rootPolicy}
                onChange={(event) =>
                  runtime.applySettings({
                    ...state.settings,
                    harmony: {
                      ...state.settings.harmony,
                      rootPolicy: event.target.value as 'tonic' | 'scale',
                    },
                  })
                }
              >
                <option value="tonic">Tonic only</option>
                <option value="scale">Notes in this key</option>
              </select>
            </label>
          </div>
          {state.vocalError && (
            <div className="notice notice-error" role="alert">
              <p>{state.vocalError}</p>
              <Button onClick={() => runtime.setSetup(true)}>Edit range or challenge</Button>
            </div>
          )}
          <div className="harmony-context">
            <div>
              <span>Reference root</span>
              <strong>
                {state.vocal ? pitchLabel(state.vocal.rootMidi, state.settings) : '—'}
              </strong>
            </div>
            <div>
              <span>Your target</span>
              <strong>
                {state.vocal ? pitchLabel(state.vocal.targetMidi, state.settings) : '—'}
              </strong>
            </div>
            <div>
              <span>Tolerance</span>
              <strong>±25 cents</strong>
            </div>
          </div>
          <div className="harmony-next">
            <div>
              <p className="hint">
                {targetCount} {targetCount === 1 ? 'target fits' : 'targets fit'} your range and
                challenge.
              </p>
              {targetCount < 2 && (
                <p className="hint">
                  {targetCount === 0
                    ? 'No target fits.'
                    : 'Only one target fits, so there is nowhere to move.'}{' '}
                  Edit your range
                  {tonicOnly ? ' or try Notes in this key.' : ' or choose another challenge.'}
                </p>
              )}
            </div>
            <div className="harmony-next-actions">
              <Button
                variant="primary"
                onClick={() => runtime.newReference()}
                disabled={targetCount < 2}
              >
                Next target <ArrowRight size={14} aria-hidden="true" />
              </Button>
              {targetCount < 2 && (
                <Button onClick={() => runtime.setSetup(true)}>Edit range</Button>
              )}
              {tonicOnly && (
                <Button
                  variant="ghost"
                  onClick={() =>
                    runtime.applySettings({
                      ...state.settings,
                      harmony: { ...state.settings.harmony, rootPolicy: 'scale' },
                    })
                  }
                >
                  Vary notes in key
                </Button>
              )}
            </div>
          </div>
          <div className="reference-row">
            <Button
              onClick={() => (state.playing ? runtime.stopPlayback() : runtime.play())}
              disabled={!state.vocal}
            >
              {state.playing ? (
                <Square size={14} aria-hidden="true" />
              ) : (
                <Play size={14} aria-hidden="true" />
              )}
              {state.playing ? 'Stop backing' : 'Hold backing'}
            </Button>
            <Button
              onClick={() => {
                if (state.vocal) runtime.audition(state.vocal.targetMidi);
              }}
              disabled={!state.vocal}
            >
              Cue my note
            </Button>
            <Button onClick={() => runtime.playBlend()} disabled={!state.vocal}>
              Preview full blend
            </Button>
          </div>
          <p className="hint">
            Backing voices: {state.vocal ? state.vocal.backingMidi.map(noteName).join(' · ') : '—'}.
            Backing register C2–C6 may use notes outside your sung range. References pause and reset
            the hold; previewing the blend never earns a lock.
          </p>
          <div className="tuner-well">
            <MicControls state={state} runtime={runtime} />
            <PitchDisplay
              runtime={runtime}
              state={state}
              target={state.vocal?.targetMidi}
              tolerance={25}
            />
            {state.rearm && (
              <Button variant="primary" onClick={() => runtime.readyAgain()}>
                Repeat this target
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
function Mixer({ runtime, state }: { runtime: Runtime; state: AppState }) {
  const steps = progressionSteps(
    state.settings.harmony.progressionId,
    state.settings.global.rootKey,
  );
  const step = steps[state.mixerStep] ?? steps[0];
  return (
    <div className="mixer">
      <div className="drill-row">
        <label>
          Progression
          <select
            value={state.settings.harmony.progressionId}
            onChange={(event) =>
              runtime.applySettings({
                ...state.settings,
                harmony: {
                  ...state.settings.harmony,
                  progressionId: event.target.value as Settings['harmony']['progressionId'],
                },
              })
            }
          >
            {Object.entries(PROGRESSIONS).map(([id, progression]) => (
              <option key={id} value={id}>
                {progression.name}
              </option>
            ))}
          </select>
        </label>
        <span className="practice-tag">Ungraded rehearsal</span>
      </div>
      <p className="mixer-guidance">Mute your part, then sing it against the other voices.</p>
      <div className="progression-steps" role="list" aria-label="Progression steps">
        {steps.map((item, i) => (
          <div
            key={i}
            role="listitem"
            className={cn('progression-step', i === state.mixerStep && 'selected')}
            aria-current={i === state.mixerStep ? 'step' : undefined}
          >
            <span>{i + 1}</span>
            <strong>{item.label}</strong>
          </div>
        ))}
      </div>
      <div className="button-row">
        <Button variant="primary" onClick={() => runtime.playProgression()}>
          <Play size={15} aria-hidden="true" />
          {state.mixerPlaying ? 'Replay progression' : 'Play progression'}
        </Button>
        <Button onClick={() => runtime.stopPlayback()} disabled={!state.mixerPlaying}>
          <Square size={14} aria-hidden="true" />
          Stop
        </Button>
      </div>
      <div className="voice-lanes">
        {['Soprano', 'Alto', 'Tenor', 'Bass'].map((voice, i) => (
          <section
            className={cn('voice-lane', state.settings.harmony.mutedVoices[i] && 'voice-muted')}
            key={voice}
          >
            <div className="voice-name">
              <h3>{voice}</h3>
              <span>{['S', 'A', 'T', 'B'][i]}</span>
            </div>
            <div className="voice-pitch">
              {step?.notes[i] == null ? '—' : pitchLabel(step.notes[i], state.settings)}
            </div>
            <Button
              aria-pressed={state.settings.harmony.mutedVoices[i] ?? false}
              onClick={() => runtime.toggleVoice(i)}
            >
              {state.settings.harmony.mutedVoices[i] ? 'You sing · muted' : 'Mute / You sing'}
            </Button>
            <Button variant="ghost" onClick={() => runtime.auditionVoice(i)}>
              Audition voice <Volume2 size={14} aria-hidden="true" />
            </Button>
          </section>
        ))}
      </div>
      <p className="hint">
        {state.mixerPlaying
          ? `Playing step ${state.mixerStep + 1} of ${steps.length}.`
          : 'Ready to rehearse.'}{' '}
        Displayed notes and voice auditions use the same progression step. Accompaniment register
        C2–C6. Mixer practice does not award pitch locks, quiz accuracy or XP.
      </p>
    </div>
  );
}
function Help({ state }: { state: AppState }) {
  return (
    <section className="rail-section">
      <details className="help-disclosure">
        <summary>A little musical context</summary>
        <p className="rail-note">
          {state.mode === 'notes'
            ? 'Every note has a place to call home.'
            : state.mode === 'intervals'
              ? 'Hear the distance, then the name.'
              : state.mode === 'chords'
                ? 'Every voice adds a color.'
                : 'A little space. A steady breath.'}
        </p>
        <p className="rail-copy">
          {state.mode === 'notes'
            ? 'Hear the tonic, then compare the mystery note with it. Start with the shape of the sound; the name will follow.'
            : state.mode === 'intervals'
              ? 'An interval is the distance between notes. The lower note is the reference anchor—even when a descending pair sounds the upper note first.'
              : state.mode === 'chords'
                ? 'Listen for the overall quality. In random-voicing and inversion practice, the shown reference root makes the intended interpretation clear.'
                : 'Headphones keep the reference separate from your voice. Cue the target, let it finish, then sing one steady note.'}
        </p>
        <p className="rail-copy">
          {state.mode === 'tuner' || state.mode === 'harmony'
            ? '100 cents is one semitone. Target practice compares the exact octave; Free Tuner compares the nearest note. Holds require 1.5 uninterrupted seconds in tune.'
            : 'References and skips never earn XP or change accuracy. Exact-octave answers require both note and register.'}
        </p>
      </details>
    </section>
  );
}
function Progress({ state, runtime }: { state: AppState; runtime: Runtime }) {
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState('');
  const resetReturnFocusRef = useRef<HTMLElement | null>(null);
  const p = state.envelope.progress;
  const legacy = state.envelope.legacyImport.snapshot;
  const totalAttempts = Object.values(p.quizzes).reduce((sum, c) => sum + c.attempts, 0);
  const totalCorrect = Object.values(p.quizzes).reduce((sum, c) => sum + c.correct, 0);
  function reset() {
    const saved = runtime.resetProgress();
    setResult(
      saved
        ? 'Progress reset. Musical setup kept.'
        : 'Reset was not saved. Your previous progress has been kept.',
    );
    if (saved) setConfirm(false);
  }
  return (
    <section className="rail-section progress-section">
      <details>
        <summary>Your progress</summary>
        {!totalAttempts && !p.vocal.completedTargets && !p.vocal.harmonyLocks ? (
          <p className="rail-note">
            {legacy
              ? 'Your new practice history starts here. Legacy progress is preserved below.'
              : 'Your first real round starts the story.'}
          </p>
        ) : (
          <div className="progress-totals">
            <div>
              <strong>{p.xpEarned + (legacy?.xp ?? 0)}</strong>
              <span>Total XP</span>
            </div>
            <div>
              <strong>{p.currentStreak}</strong>
              <span>Current streak</span>
            </div>
            <div>
              <strong>
                {totalAttempts ? `${Math.round((totalCorrect / totalAttempts) * 100)}%` : '—'}
              </strong>
              <span>New quiz accuracy · {totalAttempts} attempts</span>
            </div>
          </div>
        )}
        <p className="hint">
          Quiz accuracy counts submitted quiz answers. Skips and auditions are excluded. Vocal
          completions are tracked separately.
        </p>
        <dl className="progress-breakdown">
          {(['notes', 'intervals', 'chords'] as const).map((mode) => (
            <div key={mode}>
              <dt>{modes.find((m) => m.id === mode)?.label}</dt>
              <dd>
                {p.quizzes[mode].correct}/{p.quizzes[mode].attempts} correct ·{' '}
                {p.quizzes[mode].firstTryCorrect} first try · {p.quizzes[mode].skips} skipped
              </dd>
            </div>
          ))}
          <div>
            <dt>Vocal targets</dt>
            <dd>{p.vocal.completedTargets} completed</dd>
          </div>
          <div>
            <dt>Harmony locks</dt>
            <dd>{p.vocal.harmonyLocks} completed · no XP</dd>
          </div>
        </dl>
        {legacy && (
          <details className="legacy-progress">
            <summary>Legacy history</summary>
            <p className="hint">
              Preserved from the original app: {legacy.xp} XP · {legacy.correctAttempts}/
              {legacy.totalAttempts} correct answers · historical streak {legacy.streak}. Historical
              per-mode accuracy is unavailable and is not reconstructed.
            </p>
          </details>
        )}
        {state.mode === 'notes' && (
          <details>
            <summary>Pitch class mastery</summary>
            <div className="mastery-grid">
              {p.noteStats.map((cell, i) => (
                <div key={i}>
                  <strong>{NOTE_NAMES[i]}</strong>
                  <span>
                    {cell.attempts ? `${Math.round((cell.correct / cell.attempts) * 100)}%` : '—'}
                  </span>
                  <small>{cell.attempts} answers</small>
                </div>
              ))}
            </div>
          </details>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            const active = document.activeElement;
            resetReturnFocusRef.current = active instanceof HTMLElement ? active : null;
            runtime.stopAll();
            setResult('');
            setConfirm(true);
          }}
        >
          Reset progress
        </Button>
      </details>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent
          className="confirm-dialog"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            requestAnimationFrame(() => {
              if (resetReturnFocusRef.current?.isConnected) resetReturnFocusRef.current.focus();
            });
          }}
        >
          <DialogTitle>Reset your progress?</DialogTitle>
          <DialogDescription>
            Clear new and Legacy practice scores in this browser. Your musical setup stays. This
            cannot be undone.
          </DialogDescription>
          {result && (
            <p role="status" className="notice">
              {result}
            </p>
          )}
          <div className="button-row">
            <Button onClick={() => setConfirm(false)}>Keep progress</Button>
            <Button variant="danger" onClick={reset}>
              Reset progress
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {result && !confirm && (
        <p className="hint" role="status">
          {result}
        </p>
      )}
    </section>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="check-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
function Setup({
  runtime,
  state,
  returnFocusRef,
}: {
  runtime: Runtime;
  state: AppState;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const [draft, setDraft] = useState(() => clone(state.settings));
  const [configMode, setConfigMode] = useState<Mode>(state.mode);
  const [errors, setErrors] = useState<string[]>([]);
  const [a4Text, setA4Text] = useState(String(state.settings.global.a4));
  const errorRef = useRef<HTMLDivElement>(null);
  const formId = useId();
  useEffect(() => {
    if (state.setupOpen) {
      setDraft(clone(state.settings));
      setA4Text(String(state.settings.global.a4));
      setConfigMode(state.mode);
      setErrors([]);
    }
  }, [state.setupOpen, state.settings, state.mode]);
  const change = (edit: (next: Settings) => void) =>
    setDraft((previous) => {
      const next = clone(previous);
      edit(next);
      return next;
    });
  function preset(id: string) {
    change((next) => {
      next.global.rangePreset = id;
      const value = RANGE_PRESETS[id];
      if (value) {
        next.global.lowMidi = value.low;
        next.global.highMidi = value.high;
      }
    });
  }
  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d+$/.test(a4Text) || Number(a4Text) < 430 || Number(a4Text) > 448) {
      setErrors(['Tuning A4 must be a whole number from 430 to 448 Hz.']);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    const next = clone(draft);
    next.global.a4 = Number(a4Text);
    const nextErrors = runtime.applySettings(next);
    setErrors(nextErrors);
    if (nextErrors.length) requestAnimationFrame(() => errorRef.current?.focus());
  }
  function intervalPreset(id: string) {
    change((next) => {
      next.intervals.activeSemitones =
        id === 'beginner'
          ? [1, 2, 4, 5, 7, 12]
          : id === 'diatonic'
            ? [2, 4, 5, 7, 9, 11, 12]
            : Array.from({ length: 12 }, (_, i) => i + 1);
    });
  }
  function chordPreset(id: string) {
    change((next) => {
      next.chords.activeQualityIds = CHORDS.filter(
        (chord) =>
          id === 'all' ||
          (id === 'triads' && ['maj', 'min', 'dim', 'aug'].includes(chord.id)) ||
          (id === 'triads_sus' && chord.intervals.length === 3) ||
          (id === 'sevenths' && chord.intervals.length === 4),
      ).map((chord) => chord.id);
    });
  }
  return (
    <Dialog open={state.setupOpen} onOpenChange={(open) => runtime.setSetup(open)}>
      <DialogContent
        className="setup-dialog"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          requestAnimationFrame(() => {
            if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
          });
        }}
      >
        <div className="dialog-heading">
          <DialogTitle>Set the room.</DialogTitle>
          <DialogDescription>Your musical setup. Your pace.</DialogDescription>
        </div>
        <div className="dialog-body">
          <section className="setup-section">
            <div className="section-heading">
              <h2>Output</h2>
              <span className="immediate-label">Immediate · outside Apply/Cancel</span>
            </div>
            <Output state={state} runtime={runtime} />
          </section>
          <section className="dialog-capture">
            <div>
              <strong>{captureLabel(state.capture)}</strong>
              <p>
                {state.capture === 'off'
                  ? 'Input is stopped.'
                  : 'Practice holds are paused while Setup is open.'}
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => runtime.stopAll()}
              disabled={state.capture === 'off' && !state.playing && !state.mixerPlaying}
            >
              {state.capture === 'waiting' ? 'Cancel request' : 'Stop all'}
            </Button>
          </section>
          <form id={formId} onSubmit={apply} noValidate>
            {errors.length > 0 && (
              <div className="notice notice-error" role="alert" tabIndex={-1} ref={errorRef}>
                <strong>Check your setup</strong>
                <ul>
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            <fieldset className="setup-section">
              <legend>Musical setup</legend>
              <div className="form-grid">
                <Field label="Root key">
                  <select
                    value={draft.global.rootKey}
                    onChange={(event) =>
                      change((next) => {
                        next.global.rootKey = Number(event.target.value);
                      })
                    }
                  >
                    {NOTE_NAMES.map((name, i) => (
                      <option key={name} value={i}>
                        {name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Scale">
                  <select
                    value={draft.global.scaleId}
                    onChange={(event) =>
                      change((next) => {
                        next.global.scaleId = event.target.value as ScaleId;
                      })
                    }
                  >
                    {Object.entries(SCALES).map(([id, scale]) => (
                      <option key={id} value={id}>
                        {scale.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Instrument">
                  <select
                    value={draft.global.timbre}
                    onChange={(event) =>
                      change((next) => {
                        next.global.timbre = event.target.value as Timbre;
                      })
                    }
                  >
                    <option value="piano">Warm piano</option>
                    <option value="epiano">Rhodes electric piano</option>
                    <option value="strings">Choir / strings pad</option>
                    <option value="organ">Tonewheel organ</option>
                    <option value="sine">Pure sine</option>
                  </select>
                </Field>
                <Field label="Range preset">
                  <select
                    value={draft.global.rangePreset}
                    onChange={(event) => preset(event.target.value)}
                  >
                    {Object.entries(RANGE_PRESETS).map(([id, value]) => (
                      <option key={id} value={id}>
                        {value.name}
                      </option>
                    ))}
                    <option value="custom">Custom</option>
                  </select>
                </Field>
                <Field label="Low note">
                  <select
                    value={draft.global.lowMidi}
                    onChange={(event) =>
                      change((next) => {
                        next.global.lowMidi = Number(event.target.value);
                        next.global.rangePreset = 'custom';
                      })
                    }
                  >
                    {pitches.map((midi) => (
                      <option key={midi} value={midi}>
                        {noteName(midi)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="High note">
                  <select
                    value={draft.global.highMidi}
                    onChange={(event) =>
                      change((next) => {
                        next.global.highMidi = Number(event.target.value);
                        next.global.rangePreset = 'custom';
                      })
                    }
                  >
                    {pitches.map((midi) => (
                      <option key={midi} value={midi}>
                        {noteName(midi)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Note labels">
                  <select
                    value={draft.global.notation}
                    onChange={(event) =>
                      change((next) => {
                        next.global.notation = event.target.value as Settings['global']['notation'];
                      })
                    }
                  >
                    <option value="letter">Letters · C, D, E</option>
                    <option value="solfege">Solfège · Do, Re, Mi</option>
                    <option value="degree">Scale degrees · 1, 2, 3</option>
                  </select>
                </Field>
                <Field label="Tuning A4 · Hz">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="430"
                    max="448"
                    step="1"
                    value={a4Text}
                    onChange={(event) => setA4Text(event.target.value)}
                  />
                </Field>
              </div>
              <p className="hint">
                Sung and listening targets fit your chosen range. Accompaniment has its own labeled
                C2–C6 register.
              </p>
            </fieldset>
            <fieldset className="setup-section">
              <legend>Practice settings</legend>
              <Field label="Configure mode">
                <select
                  value={configMode}
                  onChange={(event) => setConfigMode(event.target.value as Mode)}
                >
                  {modes.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </Field>
              {configMode === 'notes' && (
                <div className="check-list">
                  <CheckField
                    label="Require exact octave"
                    checked={draft.notes.exactOctave}
                    onChange={(checked) =>
                      change((next) => {
                        next.notes.exactOctave = checked;
                      })
                    }
                  />
                  <CheckField
                    label="Auto-advance after correct feedback"
                    checked={draft.notes.autoNext}
                    onChange={(checked) =>
                      change((next) => {
                        next.notes.autoNext = checked;
                      })
                    }
                  />
                </div>
              )}
              {configMode === 'intervals' && (
                <>
                  <div className="form-grid">
                    <Field label="Direction">
                      <select
                        value={draft.intervals.direction}
                        onChange={(event) =>
                          change((next) => {
                            next.intervals.direction = event.target
                              .value as Settings['intervals']['direction'];
                          })
                        }
                      >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                        <option value="harm">Harmonic · together</option>
                        <option value="asc_harm">Melodic + harmonic</option>
                        <option value="mixed">Random mixed</option>
                      </select>
                    </Field>
                    <CheckField
                      label="Fix lower anchor to tonic"
                      checked={draft.intervals.fixedRoot}
                      onChange={(checked) =>
                        change((next) => {
                          next.intervals.fixedRoot = checked;
                        })
                      }
                    />
                  </div>
                  <p className="hint">
                    In a descending interval, the upper note sounds first; the lower reference
                    anchor remains the tonic.
                  </p>
                  <div className="preset-buttons">
                    <Button size="small" onClick={() => intervalPreset('beginner')}>
                      Beginner
                    </Button>
                    <Button size="small" onClick={() => intervalPreset('diatonic')}>
                      Major-scale diatonic
                    </Button>
                    <Button size="small" onClick={() => intervalPreset('all')}>
                      All chromatic
                    </Button>
                  </div>
                  <div className="filter-grid">
                    {INTERVALS.filter((interval) => interval.st > 0).map((interval) => (
                      <CheckField
                        key={interval.st}
                        label={`${interval.short} · ${interval.name}`}
                        checked={draft.intervals.activeSemitones.includes(interval.st)}
                        onChange={(checked) =>
                          change((next) => {
                            next.intervals.activeSemitones = checked
                              ? [...next.intervals.activeSemitones, interval.st].sort(
                                  (a, b) => a - b,
                                )
                              : next.intervals.activeSemitones.filter((st) => st !== interval.st);
                          })
                        }
                      />
                    ))}
                  </div>
                  <p className="hint">
                    Select at least two intervals. Every selected interval must fit the current
                    range.
                  </p>
                </>
              )}
              {configMode === 'chords' && (
                <>
                  <div className="form-grid">
                    <Field label="Playback">
                      <select
                        value={draft.chords.playback}
                        onChange={(event) =>
                          change((next) => {
                            next.chords.playback = event.target
                              .value as Settings['chords']['playback'];
                          })
                        }
                      >
                        <option value="block">Block chord</option>
                        <option value="arp">Arpeggio</option>
                        <option value="both">Arpeggio + block</option>
                      </select>
                    </Field>
                    <Field label="Inversion practice">
                      <select
                        value={draft.chords.inversionMode}
                        onChange={(event) =>
                          change((next) => {
                            next.chords.inversionMode = event.target
                              .value as Settings['chords']['inversionMode'];
                          })
                        }
                      >
                        <option value="root">Root position only</option>
                        <option value="random_voicing">Random inversion · quality</option>
                        <option value="guess_inv">Quality + inversion</option>
                      </select>
                    </Field>
                  </div>
                  <div className="preset-buttons">
                    {[
                      ['triads', 'Core triads'],
                      ['triads_sus', 'Triads + suspended'],
                      ['sevenths', 'Seventh chords'],
                      ['all', 'All chords'],
                    ].map(([id, label]) => (
                      <Button key={id} size="small" onClick={() => chordPreset(id)}>
                        {label}
                      </Button>
                    ))}
                  </div>
                  <div className="filter-grid">
                    {CHORDS.map((chord) => (
                      <CheckField
                        key={chord.id}
                        label={chord.name}
                        checked={draft.chords.activeQualityIds.includes(chord.id)}
                        onChange={(checked) =>
                          change((next) => {
                            next.chords.activeQualityIds = checked
                              ? [...next.chords.activeQualityIds, chord.id]
                              : next.chords.activeQualityIds.filter((id) => id !== chord.id);
                          })
                        }
                      />
                    ))}
                  </div>
                  <p className="hint">
                    Select at least two qualities. A shown, auditionable root provides fair context.
                    Triads have three inversion choices; seventh chords have four.
                  </p>
                </>
              )}
              {configMode === 'harmony' && (
                <>
                  <div className="form-grid">
                    <Field label="Activity">
                      <select
                        value={draft.harmony.submode}
                        onChange={(event) =>
                          change((next) => {
                            next.harmony.submode = event.target.value as 'target' | 'mixer';
                          })
                        }
                      >
                        <option value="target">Target practice</option>
                        <option value="mixer">Harmony mixer</option>
                      </select>
                    </Field>
                    <Field label="Challenge">
                      <select
                        value={draft.harmony.challengeId}
                        onChange={(event) =>
                          change((next) => {
                            next.harmony.challengeId = event.target.value as ChallengeId;
                          })
                        }
                      >
                        {Object.entries(CHALLENGES).map(([id, challenge]) => (
                          <option key={id} value={id}>
                            {challenge.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Root practice">
                      <select
                        value={draft.harmony.rootPolicy}
                        onChange={(event) =>
                          change((next) => {
                            next.harmony.rootPolicy = event.target.value as 'tonic' | 'scale';
                          })
                        }
                      >
                        <option value="tonic">Tonic only</option>
                        <option value="scale">Notes in this key</option>
                      </select>
                    </Field>
                    <Field label="Progression">
                      <select
                        value={draft.harmony.progressionId}
                        onChange={(event) =>
                          change((next) => {
                            next.harmony.progressionId = event.target
                              .value as Settings['harmony']['progressionId'];
                          })
                        }
                      >
                        {Object.entries(PROGRESSIONS).map(([id, value]) => (
                          <option key={id} value={id}>
                            {value.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <p className="hint">
                    Target holds use ±25 cents for 1.5 seconds. Notes in this key changes the local
                    reference, not the selected global key. Mixer is ungraded.
                  </p>
                  <div className="filter-grid">
                    {['Soprano', 'Alto', 'Tenor', 'Bass'].map((voice, i) => (
                      <CheckField
                        key={voice}
                        label={`${voice} · mute / You Sing`}
                        checked={draft.harmony.mutedVoices[i] ?? false}
                        onChange={(checked) =>
                          change((next) => {
                            next.harmony.mutedVoices[i] = checked;
                          })
                        }
                      />
                    ))}
                  </div>
                </>
              )}
              {configMode === 'tuner' && (
                <>
                  <div className="form-grid">
                    <Field label="Drill">
                      <select
                        value={draft.tuner.drillMode}
                        onChange={(event) =>
                          change((next) => {
                            next.tuner.drillMode = event.target
                              .value as Settings['tuner']['drillMode'];
                          })
                        }
                      >
                        <option value="free">Free tuner · ungraded</option>
                        <option value="target">Target note</option>
                        <option value="scale_walk">Scale walk</option>
                        <option value="arpeggio">Triad arpeggio</option>
                      </select>
                    </Field>
                    <Field label="Tolerance">
                      <select
                        value={draft.tuner.toleranceCents}
                        onChange={(event) =>
                          change((next) => {
                            next.tuner.toleranceCents = Number(event.target.value) as 12 | 22 | 35;
                          })
                        }
                      >
                        <option value={22}>Standard · ±22 cents</option>
                        <option value={12}>Strict · ±12 cents</option>
                        <option value={35}>Relaxed · ±35 cents</option>
                      </select>
                    </Field>
                    <Field label="Arpeggio quality">
                      <select
                        value={draft.tuner.arpeggioQuality}
                        onChange={(event) =>
                          change((next) => {
                            next.tuner.arpeggioQuality = event.target.value as 'major' | 'minor';
                          })
                        }
                      >
                        <option value="major">Major · 1–3–5–8</option>
                        <option value="minor">Minor · 1–♭3–5–8</option>
                      </select>
                    </Field>
                  </div>
                  <p className="hint">
                    Only Target note uses an eight-target queue. Scale walk uses the whole scale up
                    and back. Arpeggios use 1–3–5–8–5–3–1. Repeated pitches require Ready Again.
                  </p>
                </>
              )}
            </fieldset>
            <details className="disclosure">
              <summary>Keyboard preferences</summary>
              <div className="form-grid">
                <Field label="Keyboard action">
                  <select
                    value={draft.piano.inputMode}
                    onChange={(event) =>
                      change((next) => {
                        next.piano.inputMode = event.target.value as 'audition' | 'answer';
                      })
                    }
                  >
                    <option value="audition">Audition · reference only</option>
                    <option value="answer">Answer · submits exact pitch</option>
                  </select>
                </Field>
                <Field label="Initial octave">
                  <select
                    value={draft.piano.octave}
                    onChange={(event) =>
                      change((next) => {
                        next.piano.octave = Number(event.target.value);
                      })
                    }
                  >
                    {[2, 3, 4, 5, 6].map((octave) => (
                      <option key={octave}>{octave}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </details>
          </form>
          <p className="dialog-footnote">
            Apply prepares a fresh round when the musical task changes, with playback and input
            stopped. Label-only changes keep the round. Cancel discards draft edits; it never
            reverses Stop or immediate output changes.
          </p>
        </div>
        <footer className="dialog-footer">
          <Button onClick={() => runtime.setSetup(false)}>Cancel</Button>
          <Button type="submit" form={formId} variant="primary">
            Apply setup <Check size={14} aria-hidden="true" />
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
