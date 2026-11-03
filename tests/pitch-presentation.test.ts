import { describe, expect, it } from 'vitest';
import type { PitchView } from '../src/domain/types';
import {
  pitchHistoryPath,
  pitchPresentation,
  signedCents,
} from '../src/features/vocal/pitch-presentation';

const empty: PitchView = {
  frequency: null,
  midi: null,
  nearestCents: null,
  targetCents: null,
  hold: 0,
  preview: false,
  history: [],
};

describe('live pitch presentation contract', () => {
  it('does not invent a measured note or graph center without input', () => {
    const view = pitchPresentation(empty, true, undefined, 22);
    expect(view.measured).toBe(false);
    expect(view.nearestMidi).toBeNull();
    expect(view.center).toBeNull();
    expect(view.meaning).toBe('No usable pitch');
    expect(view.historyPath).toBe('');
  });

  it('uses nearest-note error for Free Tuner and exact target error for practice', () => {
    const pitch = { ...empty, frequency: 440, midi: 69.02, nearestCents: 2, targetCents: 102 };
    const free = pitchPresentation(pitch, true, 68, 22);
    expect(free.center).toBe(69);
    expect(free.cents).toBe(2);
    expect(free.meaning).toBe('In tune');
    expect(free.beyond).toBe(false);
    const target = pitchPresentation(pitch, false, 68, 22);
    expect(target.center).toBe(68);
    expect(target.cents).toBe(102);
    expect(target.meaning).toBe('Sharp');
    expect(target.beyond).toBe(true);
  });

  it.each([
    [-22, 'In tune', false],
    [22, 'In tune', false],
    [-23, 'Flat', false],
    [50, 'Sharp', false],
    [-51, 'Flat', true],
  ])('describes %s cents at a ±22-cent tolerance', (targetCents, meaning, beyond) => {
    const view = pitchPresentation({ ...empty, targetCents }, false, 60, 22);
    expect(view.meaning).toBe(meaning);
    expect(view.beyond).toBe(beyond);
  });

  it('does not join silence gaps, retains the eight-second edge and clips large errors', () => {
    const history = [
      { time: 1000, midi: 60 },
      { time: 2000, midi: 60 },
      { time: 3000, midi: 64 },
      { time: 4000, midi: null },
      { time: 6000, midi: 55 },
      { time: 10000, midi: 60 },
    ];
    expect(pitchHistoryPath(history, 60)).toBe('M0.0 66.0 L80.0 2.0 M320.0 130.0 L640.0 66.0');
    expect(pitchHistoryPath(history, null)).toBe('');
  });

  it('formats directional cents without removing the pitch-error sign', () => {
    expect(signedCents(12.4)).toBe('+12¢');
    expect(signedCents(-12.4)).toBe('-12¢');
    expect(signedCents(0)).toBe('0¢');
  });
});
