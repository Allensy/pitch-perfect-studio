import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../src/domain/music';
import {
  exactNoteAnswer,
  chordEntryAnswer,
  submittedAnswerLabel,
  noteChoices,
} from '../src/features/quiz/answer-model';
import { pianoKeys } from '../src/features/piano/piano-model';

describe('quiz entry and presentation contracts', () => {
  it('requires a complete exact pitch and preserves the selected octave', () => {
    expect(exactNoteAnswer('0', '')).toMatchObject({ ok: false });
    expect(exactNoteAnswer('', '4')).toMatchObject({ ok: false });
    expect(exactNoteAnswer('0', '3')).toEqual({ ok: true, value: { pitchClass: 0, midi: 48 } });
    expect(exactNoteAnswer('0', '4')).toEqual({ ok: true, value: { pitchClass: 0, midi: 60 } });
    expect(exactNoteAnswer('12', '4')).toMatchObject({ ok: false });
    expect(exactNoteAnswer('oops', '4')).toMatchObject({ ok: false });
  });
  it('requires an inversion only in inversion exercises, with four positions for sevenths', () => {
    expect(chordEntryAnswer('maj', '', false)).toEqual({ ok: true, value: { qualityId: 'maj' } });
    expect(chordEntryAnswer('maj', '', true)).toMatchObject({ ok: false });
    expect(chordEntryAnswer('maj', '3', true)).toMatchObject({ ok: false });
    expect(chordEntryAnswer('dom7', '3', true)).toEqual({
      ok: true,
      value: { qualityId: 'dom7', inversion: 3 },
    });
  });
  it('formats the submitted answer rather than leaking the correct question answer', () => {
    expect(submittedAnswerLabel(null)).toBe('');
    expect(submittedAnswerLabel({ pitchClass: 2 })).toBe('D');
    expect(submittedAnswerLabel({ midi: 62 })).toBe('D4');
    expect(submittedAnswerLabel({ semitones: 7 })).toBe('Perfect 5th');
    expect(submittedAnswerLabel({ qualityId: 'dom7', inversion: 3 })).toBe(
      'Dominant 7th, third inversion',
    );
  });
  it('keeps note spelling, solfege and scale eligibility coherent in a different key', () => {
    const settings = defaultSettings();
    settings.global.rootKey = 2;
    settings.global.notation = 'solfege';
    const choices = noteChoices(settings.global);
    expect(choices[2]).toMatchObject({
      label: 'Do',
      caption: 'Do',
      inScale: true,
      accessibleLabel: 'Do (D) answer',
    });
    expect(choices[3]).toMatchObject({ inScale: false, caption: '—' });
  });
  it('keeps piano audition separate from answer eligibility and respects exact register', () => {
    const settings = defaultSettings();
    settings.piano.octave = 4;
    const keys = pianoKeys(settings, false);
    expect(keys[0]).toMatchObject({ midi: 60, disabled: false, accessibleLabel: 'Audition C4' });
    expect(keys.filter((key) => key.black)).toHaveLength(5);
    settings.piano.inputMode = 'answer';
    expect(pianoKeys(settings, false).every((key) => key.disabled)).toBe(true);
    expect(pianoKeys(settings, true)[1]).toMatchObject({ disabled: true, inPool: false });
    settings.piano.octave = 6;
    expect(pianoKeys(settings, true).every((key) => key.disabled)).toBe(true);
  });
});
