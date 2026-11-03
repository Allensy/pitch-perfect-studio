import { describe, expect, it } from 'vitest';
import {
  CHORDS,
  CHALLENGES,
  INTERVALS,
  NOTE_NAMES,
  PROGRESSIONS,
  RANGE_PRESETS,
  SCALES,
  defaultSettings,
  frequencyToMidi,
  midiToFrequency,
  noteName,
  pitchLabel,
  scalePool,
  validateSettings,
} from '../src/domain/music';
import {
  buildHarmonyTarget,
  buildTunerQueue,
  generateQuestion,
  progressionSteps,
} from '../src/domain/exercises';
import {
  advanceHold,
  evaluateNoteGuess,
  gradeAnswer,
  updateHoldProgress,
} from '../src/domain/grading';
import type { ChordQuestion, ProgressionId, ScaleId } from '../src/domain/types';

const fixture = () => defaultSettings();
function sequence(...values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length] ?? 0;
}

describe('preserved musical inventory and validated settings', () => {
  it('retains the complete audited vocabulary', () => {
    expect(NOTE_NAMES).toHaveLength(12);
    expect(INTERVALS).toHaveLength(12);
    expect(CHORDS).toHaveLength(11);
    expect(Object.keys(SCALES)).toHaveLength(10);
    expect(Object.keys(RANGE_PRESETS)).toHaveLength(9);
    expect(Object.keys(CHALLENGES)).toHaveLength(8);
    expect(Object.keys(PROGRESSIONS)).toHaveLength(4);
    expect(RANGE_PRESETS.baritone).toMatchObject({ low: 45, high: 69 });
  });
  it('round-trips defaults while reconstructing only trusted fields', () => {
    const input = { ...fixture(), unexpected: 'discard me' };
    const parsed = validateSettings(input);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).toEqual(fixture());
      expect(parsed.value).not.toBe(input);
      expect('unexpected' in parsed.value).toBe(false);
    }
  });
  it('rejects malformed runtime JSON, invalid boundaries and insufficient filters', () => {
    for (const input of [null, [], {}, 'settings']) expect(validateSettings(input).ok).toBe(false);
    const settings = fixture();
    settings.global.a4 = 449;
    expect(validateSettings(settings).ok).toBe(false);
    settings.global.a4 = 440;
    settings.global.highMidi = settings.global.lowMidi + 3;
    expect(validateSettings(settings).ok).toBe(false);
    settings.global.highMidi = 72;
    settings.intervals.activeSemitones = [1, 1];
    expect(validateSettings(settings).ok).toBe(false);
    settings.intervals.activeSemitones = [1, 2];
    settings.chords.activeQualityIds = ['maj'];
    expect(validateSettings(settings).ok).toBe(false);
  });
  it('rejects sparse filter and voice arrays from programmatic settings input', () => {
    const settings = fixture();
    settings.intervals.activeSemitones = Array<number>(2);
    expect(validateSettings(settings).ok).toBe(false);
    settings.intervals.activeSemitones = [1, 2];
    settings.harmony.mutedVoices = Array<boolean>(4);
    expect(validateSettings(settings).ok).toBe(false);
  });
  it('does not leave a preset label on manually changed endpoints', () => {
    const settings = fixture();
    settings.global.lowMidi = 49;
    const parsed = validateSettings(settings);
    expect(parsed.ok && parsed.value.global.rangePreset).toBe('custom');
    expect(settings.global.rangePreset).toBe('two_oct');
  });
  it('uses the configured tuning and notation reference', () => {
    expect(midiToFrequency(69, 430)).toBe(430);
    expect(frequencyToMidi(430, 430)).toBeCloseTo(69);
    expect(noteName(61)).toBe('C♯4');
    const settings = fixture();
    settings.global.rootKey = 2;
    settings.global.notation = 'solfege';
    expect(pitchLabel(62, settings)).toContain('Do');
    expect(pitchLabel(64, settings)).toContain('Re');
  });
});

describe('UX-09 bounded, explainable exercise generation', () => {
  it('keeps Notes inside every selected key, scale and learner range', () => {
    for (const scaleId of Object.keys(SCALES) as ScaleId[])
      for (let rootKey = 0; rootKey < 12; rootKey++) {
        const settings = fixture();
        settings.global.scaleId = scaleId;
        settings.global.rootKey = rootKey;
        for (const value of [0, 0.23, 0.71, 0.999999]) {
          const result = generateQuestion('notes', settings, () => value);
          expect(result.ok).toBe(true);
          if (result.ok && result.value.kind === 'notes') {
            expect(result.value.midi).toBeGreaterThanOrEqual(settings.global.lowMidi);
            expect(result.value.midi).toBeLessThanOrEqual(settings.global.highMidi);
            expect(scalePool(settings)).toContain(result.value.midi);
          }
        }
      }
  });
  it('rejects impossible selected intervals instead of silently dropping them or overrunning range', () => {
    const settings = fixture();
    settings.global.lowMidi = 60;
    settings.global.highMidi = 64;
    settings.intervals.activeSemitones = [1, 12];
    const result = generateQuestion('intervals', settings, () => 0.999);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/Octave|P8/);
  });
  it('keeps the lower tonic as the descending anchor and both pitches in range', () => {
    const settings = fixture();
    settings.intervals.fixedRoot = true;
    settings.intervals.direction = 'desc';
    for (const value of [0, 0.2, 0.6, 0.999]) {
      const result = generateQuestion('intervals', settings, () => value);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.kind === 'intervals') {
        expect(result.value.lowerMidi % 12).toBe(0);
        expect(result.value.direction).toBe('desc');
        expect(result.value.upperMidi - result.value.lowerMidi).toBe(result.value.semitones);
        expect(result.value.upperMidi).toBeLessThanOrEqual(72);
      }
    }
  });
  it('offers all four seventh inversions in the declared accompaniment register', () => {
    const settings = fixture();
    settings.chords.activeQualityIds = ['maj7', 'dom7'];
    settings.chords.inversionMode = 'guess_inv';
    for (let inversion = 0; inversion < 4; inversion++) {
      const result = generateQuestion(
        'chords',
        settings,
        sequence(0, (inversion + 0.1) / 4, 0.999),
      );
      expect(result.ok).toBe(true);
      if (result.ok && result.value.kind === 'chords') {
        expect(result.value.inversion).toBe(inversion);
        expect(result.value.notes).toHaveLength(4);
        expect(Math.min(...result.value.notes)).toBeGreaterThanOrEqual(36);
        expect(Math.max(...result.value.notes)).toBeLessThanOrEqual(84);
      }
    }
  });
  it('uses explicit root context for the documented cross-quality alias', () => {
    const settings = fixture();
    settings.chords.inversionMode = 'guess_inv';
    const sus2: ChordQuestion = {
      kind: 'chords',
      rootMidi: 60,
      qualityId: 'sus2',
      inversion: 1,
      notes: [62, 67, 72],
    };
    const sus4: ChordQuestion = {
      kind: 'chords',
      rootMidi: 55,
      qualityId: 'sus4',
      inversion: 2,
      notes: [62, 67, 72],
    };
    expect(sus2.notes).toEqual(sus4.notes);
    expect(gradeAnswer(sus2, { qualityId: 'sus2', inversion: 1 }, settings)).toBe('correct');
    expect(gradeAnswer(sus4, { qualityId: 'sus4', inversion: 2 }, settings)).toBe('correct');
    expect(gradeAnswer(sus2, { qualityId: 'sus4', inversion: 2 }, settings)).toBe('wrong');
  });
  it('keeps Target note at eight but never truncates Scale walk or arpeggio', () => {
    const settings = fixture();
    const target = buildTunerQueue(settings, () => 0);
    expect(target.ok && target.value).toHaveLength(8);
    if (target.ok)
      expect(target.value.every((midi, i) => i === 0 || midi !== target.value[i - 1])).toBe(true);
    settings.tuner.drillMode = 'scale_walk';
    const scale = buildTunerQueue(settings, () => 0);
    expect(scale.ok && scale.value).toEqual([
      48, 50, 52, 53, 55, 57, 59, 60, 59, 57, 55, 53, 52, 50, 48,
    ]);
    settings.global.lowMidi = 60;
    settings.global.highMidi = 84;
    settings.global.rootKey = 1;
    settings.tuner.drillMode = 'arpeggio';
    settings.tuner.arpeggioQuality = 'minor';
    const arp = buildTunerQueue(settings, () => 0);
    expect(arp.ok && arp.value).toEqual([61, 64, 68, 73, 68, 64, 61]);
    settings.global.highMidi = 72;
    expect(buildTunerQueue(settings, () => 0).ok).toBe(false);
    settings.tuner.drillMode = 'free';
    expect(buildTunerQueue(settings, () => 0)).toEqual({ ok: true, value: [] });
  });
  it('preserves every scale step on the ascent and descending return', () => {
    for (const scaleId of Object.keys(SCALES) as ScaleId[]) {
      const settings = fixture();
      settings.global.scaleId = scaleId;
      settings.tuner.drillMode = 'scale_walk';
      const result = buildTunerQueue(settings, () => 0);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const up = [...SCALES[scaleId].steps, 12].map((offset) => 48 + offset);
        expect(result.value).toEqual([...up, ...up.slice(0, -1).reverse()]);
      }
    }
  });
  it('keeps Harmony targets in range for both root policies without relabeling the global key', () => {
    for (const rootPolicy of ['tonic', 'scale'] as const)
      for (const challengeId of Object.keys(CHALLENGES) as (keyof typeof CHALLENGES)[]) {
        const settings = fixture();
        settings.harmony.rootPolicy = rootPolicy;
        settings.harmony.challengeId = challengeId;
        const result = buildHarmonyTarget(settings, () => 0.999);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.targetMidi).toBeGreaterThanOrEqual(48);
          expect(result.value.targetMidi).toBeLessThanOrEqual(72);
          expect(result.value.backingMidi.every((n) => n >= 36 && n <= 84)).toBe(true);
          if (rootPolicy === 'tonic') expect(result.value.rootMidi % 12).toBe(0);
        }
        expect(settings.global.rootKey).toBe(0);
      }
    const impossible = fixture();
    impossible.global.lowMidi = 60;
    impossible.global.highMidi = 64;
    impossible.harmony.challengeId = 'domTop';
    expect(buildHarmonyTarget(impossible, () => 0).ok).toBe(false);
  });
});

describe('corrected accompaniment fixtures', () => {
  const expected: Record<ProgressionId, number[][]> = {
    pop: [
      [0, 4, 7],
      [2, 7, 11],
      [0, 4, 9],
      [0, 5, 9],
    ],
    classic: [
      [0, 4, 7],
      [0, 5, 9],
      [2, 7, 11],
      [0, 4, 7],
    ],
    jazz: [
      [0, 2, 5, 9],
      [2, 5, 7, 11],
      [0, 4, 7, 11],
      [1, 4, 7, 9],
    ],
    barbershop: [
      [0, 4, 7],
      [0, 4, 7, 10],
      [0, 5, 9],
      [0, 5, 8],
      [0, 4, 7],
    ],
  };
  it('matches each promised chord quality in all keys, with ordered SATB voices in C2–C6', () => {
    for (const id of Object.keys(PROGRESSIONS) as ProgressionId[])
      for (let key = 0; key < 12; key++) {
        const steps = progressionSteps(id, key);
        expect(steps).toHaveLength(expected[id].length);
        steps.forEach((step, index) => {
          const classes = [...new Set(step.notes.map((note) => (note - key + 120) % 12))].sort(
            (a, b) => a - b,
          );
          expect(classes).toEqual(expected[id][index]);
          expect(step.notes).toHaveLength(4);
          expect(step.notes.every((note) => note >= 36 && note <= 84)).toBe(true);
          expect(step.notes).toEqual([...step.notes].sort((a, b) => b - a));
        });
      }
  });
});

describe('grading and continuous hold regression expectations', () => {
  it('requires exact octave input and permits matching pitch classes across octaves', () => {
    expect(evaluateNoteGuess(60, 0, null, true)).toBe(null);
    expect(evaluateNoteGuess(60, 0, 48, true)).toBe(false);
    expect(evaluateNoteGuess(60, 0, 60, true)).toBe(true);
    expect(evaluateNoteGuess(60, 0, 48, false)).toBe(true);
    expect(evaluateNoteGuess(60, 2, 62, false)).toBe(false);
    const settings = fixture();
    settings.notes.exactOctave = true;
    expect(gradeAnswer({ kind: 'notes', midi: 60 }, { pitchClass: 0 }, settings)).toBe('missing');
    expect(gradeAnswer({ kind: 'notes', midi: 60 }, { midi: 48 }, settings)).toBe('wrong');
    settings.chords.inversionMode = 'guess_inv';
    expect(
      gradeAnswer(
        { kind: 'chords', rootMidi: 60, qualityId: 'maj7', inversion: 3, notes: [71, 72, 76, 79] },
        { qualityId: 'maj7' },
        settings,
      ),
    ).toBe('missing');
  });
  for (const fps of [30, 60, 144])
    it(`retains the baseline 1.5-second hold at ${fps} display fps`, () => {
      let progress = 0;
      for (let i = 0; i < fps; i++) progress = updateHoldProgress(progress, 1000 / fps, true);
      expect(progress).toBeLessThan(100);
      for (let i = 0; i < fps / 2; i++) progress = updateHoldProgress(progress, 1000 / fps, true);
      expect(progress).toBeCloseTo(100);
      expect(updateHoldProgress(progress, 16, false)).toBe(0);
    });
  it('uses observation timestamps, resets gaps/silence, and never credits the first sample', () => {
    let hold = advanceHold({ since: null, last: null }, 0, true);
    expect(hold.progress).toBe(0);
    for (let time = 100; time <= 1400; time += 100) hold = advanceHold(hold, time, true);
    hold = advanceHold(hold, 1499, true);
    expect(hold.progress).toBeLessThan(100);
    hold = advanceHold(hold, 1500, true);
    expect(hold.progress).toBe(100);
    expect(advanceHold(hold, 1600, false)).toEqual({ since: null, last: null, progress: 0 });
    expect(advanceHold(hold, 1700, true).progress).toBe(0);
    expect(advanceHold(hold, 1400, true).progress).toBe(0);
  });
});
