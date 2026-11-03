import type { Question, Answer, Settings } from './types';
import { CHORDS } from './music';

/** Null is incomplete input, never a failed scored answer. UX-04.A. */
export function evaluateNoteGuess(
  targetMidi: number,
  guessedPc: number,
  guessedMidi: number | null,
  exact: boolean,
): boolean | null {
  if (exact) return guessedMidi === null ? null : guessedMidi === targetMidi;
  return guessedPc === targetMidi % 12;
}
const validInteger = (value: unknown, low: number, high: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= low && value <= high;
export function gradeAnswer(
  question: Question,
  answer: Answer,
  settings: Settings,
): 'missing' | 'correct' | 'wrong' {
  if (question.kind === 'notes') {
    if (settings.notes.exactOctave) {
      if (!validInteger(answer.midi, 36, 84)) return 'missing';
      return answer.midi === question.midi ? 'correct' : 'wrong';
    }
    const pitchClass =
      answer.pitchClass ?? (validInteger(answer.midi, 36, 84) ? answer.midi % 12 : undefined);
    if (!validInteger(pitchClass, 0, 11)) return 'missing';
    return pitchClass === question.midi % 12 ? 'correct' : 'wrong';
  }
  if (question.kind === 'intervals') {
    if (!validInteger(answer.semitones, 1, 12)) return 'missing';
    return answer.semitones === question.semitones ? 'correct' : 'wrong';
  }
  const quality = CHORDS.find((item) => item.id === answer.qualityId);
  if (!quality) return 'missing';
  if (settings.chords.inversionMode === 'guess_inv') {
    if (!validInteger(answer.inversion, 0, quality.intervals.length - 1)) return 'missing';
    return quality.id === question.qualityId && answer.inversion === question.inversion
      ? 'correct'
      : 'wrong';
  }
  return quality.id === question.qualityId ? 'correct' : 'wrong';
}

export function updateHoldProgress(progress: number, elapsedMs: number, inTune: boolean): number {
  if (!inTune || !Number.isFinite(progress) || !Number.isFinite(elapsedMs)) return 0;
  return Math.min(100, Math.max(0, progress) + (Math.max(0, elapsedMs) / 1500) * 100);
}
export interface HoldState {
  since: number | null;
  last: number | null;
}
/** Gaps, silence and clock reversal break continuity; a new first observation earns zero time. */
export function advanceHold(
  state: HoldState,
  time: number,
  inTune: boolean,
  maxGap = 120,
): HoldState & { progress: number } {
  if (!inTune || !Number.isFinite(time)) return { since: null, last: null, progress: 0 };
  const continuous =
    state.since !== null &&
    state.last !== null &&
    time >= state.last &&
    time - state.last <= maxGap &&
    time >= state.since;
  const since = continuous && state.since !== null ? state.since : time;
  return { since, last: time, progress: Math.min(100, (Math.max(0, time - since) / 1500) * 100) };
}
