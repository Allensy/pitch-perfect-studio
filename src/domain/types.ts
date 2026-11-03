export type Mode = 'notes' | 'intervals' | 'chords' | 'harmony' | 'tuner';
export type QuizMode = 'notes' | 'intervals' | 'chords';
export type Timbre = 'piano' | 'epiano' | 'strings' | 'organ' | 'sine';
export type ScaleId =
  | 'chromatic'
  | 'major'
  | 'natural_minor'
  | 'harmonic_minor'
  | 'melodic_minor'
  | 'dorian'
  | 'mixolydian'
  | 'pentatonic_major'
  | 'pentatonic_minor'
  | 'blues';
export type QualityId =
  'maj' | 'min' | 'dim' | 'aug' | 'sus2' | 'sus4' | 'dom7' | 'maj7' | 'min7' | 'm7b5' | 'dim7';
export type ProgressionId = 'pop' | 'classic' | 'jazz' | 'barbershop';
export type ChallengeId =
  'major3' | 'minor3' | 'fifth' | 'sixth' | 'majMiddle' | 'majTop' | 'minMiddle' | 'domTop';
export interface Settings {
  global: {
    timbre: Timbre;
    rangePreset: string;
    lowMidi: number;
    highMidi: number;
    rootKey: number;
    scaleId: ScaleId;
    notation: 'letter' | 'solfege' | 'degree';
    a4: number;
  };
  notes: { exactOctave: boolean; autoNext: boolean };
  intervals: {
    activeSemitones: number[];
    direction: 'asc' | 'desc' | 'harm' | 'asc_harm' | 'mixed';
    fixedRoot: boolean;
  };
  chords: {
    activeQualityIds: QualityId[];
    playback: 'block' | 'arp' | 'both';
    inversionMode: 'root' | 'random_voicing' | 'guess_inv';
  };
  harmony: {
    challengeId: ChallengeId;
    submode: 'target' | 'mixer';
    rootPolicy: 'tonic' | 'scale';
    progressionId: ProgressionId;
    mutedVoices: boolean[];
  };
  tuner: {
    drillMode: 'free' | 'target' | 'scale_walk' | 'arpeggio';
    toleranceCents: 12 | 22 | 35;
    arpeggioQuality: 'major' | 'minor';
  };
  piano: { inputMode: 'audition' | 'answer'; octave: number };
}
export interface NoteQuestion {
  kind: 'notes';
  midi: number;
}
export interface IntervalQuestion {
  kind: 'intervals';
  lowerMidi: number;
  upperMidi: number;
  semitones: number;
  direction: 'asc' | 'desc' | 'harm' | 'asc_harm';
}
export interface ChordQuestion {
  kind: 'chords';
  rootMidi: number;
  qualityId: QualityId;
  inversion: number;
  notes: number[];
}
export type Question = NoteQuestion | IntervalQuestion | ChordQuestion;
export interface Answer {
  pitchClass?: number;
  midi?: number;
  semitones?: number;
  qualityId?: QualityId;
  inversion?: number;
}
export type Result<T> = { ok: true; value: T } | { ok: false; message: string };
export type Phase = 'ready' | 'playing' | 'awaiting' | 'retry' | 'correct';
export interface Round {
  lastAnswer: Answer | null;
  id: number;
  question: Question | null;
  phase: Phase;
  attempts: number;
  credited: boolean;
  feedback: string;
  error: string | null;
}
export interface Counters {
  attempts: number;
  correct: number;
  firstTryCorrect: number;
  skips: number;
}
export interface NoteCounter {
  attempts: number;
  correct: number;
}
export interface Progress {
  xpEarned: number;
  currentStreak: number;
  quizzes: Record<QuizMode, Counters>;
  noteStats: NoteCounter[];
  vocal: { completedTargets: number; harmonyLocks: number };
}
export interface Legacy {
  xp: number;
  streak: number;
  totalAttempts: number;
  correctAttempts: number;
  noteStats: NoteCounter[];
}
export interface Envelope {
  schemaVersion: 2;
  revision: number;
  legacyImport: {
    sourceKey: 'pitch_perfect_studio_v1';
    status: 'imported' | 'absent' | 'invalid' | 'reset';
    snapshot: Legacy | null;
    cleanupPending: boolean;
    resetToken: string | null;
  };
  settings: Settings;
  activeMode: Mode;
  output: { volume: number; muted: boolean };
  progress: Progress;
}
export type CaptureStatus =
  'off' | 'waiting' | 'listening' | 'denied' | 'unavailable' | 'interrupted';
export interface PitchView {
  frequency: number | null;
  midi: number | null;
  nearestCents: number | null;
  targetCents: number | null;
  hold: number;
  preview: boolean;
  history: readonly { time: number; midi: number | null }[];
}
export interface VocalTarget {
  rootMidi: number;
  targetMidi: number;
  backingMidi: number[];
}
export interface ProgressionStep {
  label: string;
  notes: [number, number, number, number];
}
export interface AppState {
  mode: Mode;
  settings: Settings;
  rounds: Record<QuizMode, Round>;
  setupOpen: boolean;
  capture: CaptureStatus;
  captureMessage: string;
  playing: boolean;
  message: string;
  volume: number;
  muted: boolean;
  queue: number[];
  queueIndex: number;
  targetId: number;
  vocal: VocalTarget | null;
  vocalError: string | null;
  rearm: boolean;
  targetComplete: boolean;
  mixerPlaying: boolean;
  mixerStep: number;
  envelope: Envelope;
  storageMessage: string;
  storageBlocked: boolean;
}
export interface Source<T> {
  getSnapshot: () => T;
  subscribe: (listener: () => void) => () => void;
}
export type PlaybackVariant =
  'default' | 'harmonic' | 'ascending' | 'descending' | 'block' | 'arpeggio';
export interface Runtime {
  state: Source<AppState>;
  pitch: Source<PitchView>;
  setMode(mode: Mode): void;
  setSetup(open: boolean): void;
  applySettings(settings: Settings): string[];
  setOutput(volume: number, muted: boolean): void;
  play(variant?: PlaybackVariant): void;
  next(): void;
  submit(answer: Answer): void;
  reference(kind: 'tonic' | 'scale' | 'cadence' | 'root'): void;
  audition(midi: number): void;
  auditionInterval(semitones: number, descending: boolean): void;
  startMic(): void;
  stopAll(): void;
  stopPlayback(): void;
  previewInput(): void;
  selectTarget(index: number): void;
  nextTarget(): void;
  readyAgain(): void;
  newReference(): void;
  playBlend(): void;
  playProgression(): void;
  auditionVoice(voice: number): void;
  toggleVoice(voice: number): void;
  resetProgress(): boolean;
  retrySave(): void;
  attach(): void;
  dispose(): void;
}
