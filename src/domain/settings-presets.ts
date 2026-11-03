import { CHORDS, RANGE_PRESETS } from './music';
import type { QualityId, Result, Settings } from './types';

export type IntervalPreset = 'beginner' | 'diatonic' | 'all';
export type ChordPreset = 'triads' | 'triads_sus' | 'sevenths' | 'all';

export function intervalsForPreset(preset: IntervalPreset): number[] {
  if (preset === 'beginner') return [1, 2, 4, 5, 7, 12];
  if (preset === 'diatonic') return [2, 4, 5, 7, 9, 11, 12];
  return Array.from({ length: 12 }, (_, index) => index + 1);
}

export function chordsForPreset(preset: ChordPreset): QualityId[] {
  return CHORDS.filter(
    (chord) =>
      preset === 'all' ||
      (preset === 'triads' && ['maj', 'min', 'dim', 'aug'].includes(chord.id)) ||
      (preset === 'triads_sus' && chord.intervals.length === 3) ||
      (preset === 'sevenths' && chord.intervals.length === 4),
  ).map((chord) => chord.id);
}

export function globalWithRangePreset(
  global: Settings['global'],
  rangePreset: string,
): Settings['global'] {
  const range = RANGE_PRESETS[rangePreset];
  return { ...global, rangePreset, ...(range ? { lowMidi: range.low, highMidi: range.high } : {}) };
}

/** Keep the text entry separate so an empty/partial numeric input is editable. */
export function prepareSettingsDraft(draft: Settings, a4Text: string): Result<Settings> {
  if (!/^\d+$/.test(a4Text) || Number(a4Text) < 430 || Number(a4Text) > 448)
    return { ok: false, message: 'Tuning A4 must be a whole number from 430 to 448 Hz.' };
  const settings = structuredClone(draft);
  settings.global.a4 = Number(a4Text);
  return { ok: true, value: settings };
}
