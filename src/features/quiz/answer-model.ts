import {
  CHORDS,
  DEGREE_NAMES,
  INTERVALS,
  NOTE_NAMES,
  SCALES,
  SOLFEGE_NAMES,
  noteName,
} from '@/domain/music';
import type { Answer, QualityId, Result, Settings } from '@/domain/types';

export const INVERSION_LABELS = [
  'Root position',
  'First inversion',
  'Second inversion',
  'Third inversion',
] as const;
const missingNote =
  'Choose both a note and an octave before checking. No attempt has been counted.';
const missingChord =
  'Choose a chord quality and, when requested, an inversion. No attempt has been counted.';

/** Translate complete native form entries; scoring remains exclusively in runtime/domain grading. */
export function exactNoteAnswer(note: string, octave: string): Result<Answer> {
  const pitchClass = Number(note),
    register = Number(octave);
  if (
    note === '' ||
    octave === '' ||
    !Number.isInteger(pitchClass) ||
    pitchClass < 0 ||
    pitchClass > 11 ||
    !Number.isInteger(register) ||
    register < 2 ||
    register > 6
  )
    return { ok: false, message: missingNote };
  return { ok: true, value: { pitchClass, midi: (register + 1) * 12 + pitchClass } };
}
export function chordEntryAnswer(
  qualityId: QualityId | '',
  inversion: string,
  requireInversion: boolean,
): Result<Answer> {
  const chord = CHORDS.find((chord) => chord.id === qualityId);
  const index = Number(inversion);
  if (
    !chord ||
    (requireInversion && inversion === '') ||
    (inversion !== '' && (!Number.isInteger(index) || index < 0 || index >= chord.intervals.length))
  )
    return { ok: false, message: missingChord };
  return {
    ok: true,
    value: { qualityId: chord.id, ...(inversion !== '' ? { inversion: index } : {}) },
  };
}
export function submittedAnswerLabel(answer: Answer | null): string {
  if (answer?.midi !== undefined) return noteName(answer.midi);
  if (answer?.pitchClass !== undefined) return NOTE_NAMES[answer.pitchClass] ?? '';
  if (answer?.semitones !== undefined)
    return INTERVALS.find((interval) => interval.st === answer.semitones)?.name ?? '';
  if (answer?.qualityId)
    return `${CHORDS.find((chord) => chord.id === answer.qualityId)?.name ?? ''}${answer.inversion !== undefined ? `, ${INVERSION_LABELS[answer.inversion]?.toLowerCase() ?? ''}` : ''}`;
  return '';
}
export function noteChoices(global: Settings['global']) {
  return NOTE_NAMES.map((name, pitchClass) => {
    const relative = (pitchClass - global.rootKey + 12) % 12;
    const inScale = SCALES[global.scaleId].steps.includes(relative);
    const label =
      global.notation === 'letter'
        ? name
        : global.notation === 'solfege'
          ? SOLFEGE_NAMES[relative]!
          : DEGREE_NAMES[relative]!;
    return {
      pitchClass,
      label,
      inScale,
      caption: inScale ? SOLFEGE_NAMES[relative]! : '—',
      accessibleLabel: `${global.notation === 'letter' ? name : `${label} (${name})`}${inScale ? ' answer' : ', outside active scale'}`,
    };
  });
}
