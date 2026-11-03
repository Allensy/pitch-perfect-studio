import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../src/domain/music';
import {
  chordsForPreset,
  globalWithRangePreset,
  intervalsForPreset,
  prepareSettingsDraft,
} from '../src/domain/settings-presets';

// REF-03/04: presets retain musical vocabulary; draft validation cannot mutate saved settings.
describe('settings presets and draft preparation', () => {
  it('keeps the lower-anchor teaching sets distinct from all chromatic intervals', () => {
    expect(intervalsForPreset('beginner')).toEqual([1, 2, 4, 5, 7, 12]);
    expect(intervalsForPreset('diatonic')).toEqual([2, 4, 5, 7, 9, 11, 12]);
    expect(intervalsForPreset('all')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const mutable = intervalsForPreset('beginner');
    mutable.pop();
    expect(intervalsForPreset('beginner')).toHaveLength(6);
  });
  it('keeps suspended qualities out of core triads and preserves all seventh qualities', () => {
    expect(chordsForPreset('triads')).toEqual(['maj', 'min', 'dim', 'aug']);
    expect(chordsForPreset('triads_sus')).toEqual(['maj', 'min', 'dim', 'aug', 'sus2', 'sus4']);
    expect(chordsForPreset('sevenths')).toEqual(['dom7', 'maj7', 'min7', 'm7b5', 'dim7']);
    expect(chordsForPreset('all')).toHaveLength(11);
  });
  it('switches to custom range without losing manually chosen endpoints', () => {
    const original = { ...defaultSettings().global, lowMidi: 55, highMidi: 67 };
    const result = globalWithRangePreset(original, 'custom');
    expect(result).toMatchObject({ lowMidi: 55, highMidi: 67, rangePreset: 'custom' });
    expect(original.rangePreset).not.toBe('custom');
    expect(result.rootKey).toBe(original.rootKey);
  });
  it('applies both endpoints of a named range without changing the current settings', () => {
    const original = defaultSettings().global;
    const result = globalWithRangePreset(original, 'bass');
    expect(result).toMatchObject({ lowMidi: 40, highMidi: 64, rangePreset: 'bass' });
    expect(original).toMatchObject({ lowMidi: 48, highMidi: 72, rangePreset: 'two_oct' });
  });
  for (const text of ['', '429', '449', '440.5', '4.4e2', ' 440 ']) {
    it(`rejects incomplete or non-integer tuning text ${JSON.stringify(text)}`, () => {
      const draft = defaultSettings();
      expect(prepareSettingsDraft(draft, text)).toEqual({
        ok: false,
        message: 'Tuning A4 must be a whole number from 430 to 448 Hz.',
      });
      expect(draft.global.a4).toBe(440);
    });
  }
  it('prepares an independent settings value at the supported tuning endpoints', () => {
    const draft = defaultSettings();
    for (const text of ['430', '448']) {
      const result = prepareSettingsDraft(draft, text);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.message);
      expect(result.value.global.a4).toBe(Number(text));
      result.value.harmony.mutedVoices[0] = true;
      expect(draft.harmony.mutedVoices[0]).toBe(false);
      expect(draft.global.a4).toBe(440);
    }
  });
});
