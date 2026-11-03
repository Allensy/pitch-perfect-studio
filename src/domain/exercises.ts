import type {
  Settings,
  QuizMode,
  Question,
  Result,
  VocalTarget,
  ProgressionId,
  ProgressionStep,
  ChordQuestion,
} from './types';
import { SCALES, CHORDS, CHALLENGES, INTERVALS, scalePool, validateSettings } from './music';

function pick<T>(items: readonly T[], random: () => number): T | undefined {
  if (!items.length) return undefined;
  const value = random();
  const index = Math.floor(
    (Number.isFinite(value) ? Math.max(0, Math.min(value, 1 - Number.EPSILON)) : 0) * items.length,
  );
  return items[index];
}
const failure = (message: string): { ok: false; message: string } => ({ ok: false, message });
const register = Array.from({ length: 49 }, (_, i) => 36 + i);
const pc = (midi: number) => ((midi % 12) + 12) % 12;
const inScale = (midi: number, settings: Settings) =>
  SCALES[settings.global.scaleId].steps.includes(pc(midi - settings.global.rootKey));

/** Candidate enumeration avoids clamping a randomly selected out-of-range root. UX-09. */
export function generateQuestion(
  mode: QuizMode,
  settings: Settings,
  random: () => number,
): Result<Question> {
  const validated = validateSettings(settings);
  if (!validated.ok) return validated;
  const pool = scalePool(settings);
  if (mode === 'notes') {
    const midi = pick(pool, random);
    return midi === undefined
      ? failure('No scale notes fit this range. Edit the range or scale.')
      : { ok: true, value: { kind: 'notes', midi } };
  }
  if (mode === 'intervals') {
    const candidates = settings.intervals.activeSemitones.map((semitones) => ({
      semitones,
      roots: pool.filter(
        (lower) =>
          lower + semitones <= settings.global.highMidi &&
          (!settings.intervals.fixedRoot || pc(lower) === settings.global.rootKey),
      ),
    }));
    const impossible = candidates.filter((item) => !item.roots.length);
    if (impossible.length) {
      const labels = impossible
        .map(
          (item) =>
            INTERVALS.find((interval) => interval.st === item.semitones)?.short ??
            String(item.semitones),
        )
        .join(', ');
      return failure(
        `${labels} cannot fit the selected range${settings.intervals.fixedRoot ? ' with a lower tonic anchor' : ''}. Widen the range or change the selected intervals.`,
      );
    }
    const selected = pick(candidates, random);
    if (!selected) return failure('Select at least two intervals.');
    const lowerMidi = pick(selected.roots, random);
    if (lowerMidi === undefined)
      return failure('No valid interval anchor. Edit range or fixed-root settings.');
    const configured = settings.intervals.direction;
    const direction =
      configured === 'mixed'
        ? (pick(['asc', 'desc', 'harm'] as const, random) ?? 'asc')
        : configured;
    return {
      ok: true,
      value: {
        kind: 'intervals',
        lowerMidi,
        upperMidi: lowerMidi + selected.semitones,
        semitones: selected.semitones,
        direction,
      },
    };
  }
  const candidates: ChordQuestion[] = [];
  for (const id of settings.chords.activeQualityIds) {
    const quality = CHORDS.find((chord) => chord.id === id);
    if (!quality) return failure('Choose a known chord quality.');
    const inversions =
      settings.chords.inversionMode === 'root' ? [0] : quality.intervals.map((_, index) => index);
    for (const rootMidi of register.filter((midi) => inScale(midi, settings))) {
      for (const inversion of inversions) {
        const notes = quality.intervals
          .map((offset, index) => rootMidi + offset + (index < inversion ? 12 : 0))
          .sort((a, b) => a - b);
        if (notes.every((midi) => midi >= 36 && midi <= 84))
          candidates.push({ kind: 'chords', rootMidi, qualityId: id, inversion, notes });
      }
    }
  }
  // Select quality and inversion first, so neither is biased by its number of feasible roots.
  const id = pick(settings.chords.activeQualityIds, random);
  const qualityCandidates = candidates.filter((item) => item.qualityId === id);
  const inversions = [...new Set(qualityCandidates.map((item) => item.inversion))];
  const inversion = pick(inversions, random);
  const question = pick(
    qualityCandidates.filter((item) => item.inversion === inversion),
    random,
  );
  return question
    ? { ok: true, value: question }
    : failure(
        'No complete chord voicing fits the C2–C6 accompaniment register. Change the chord choices.',
      );
}

/** Free tuning deliberately has no target queue. Scale/arpeggio queues never truncate to eight. */
export function buildTunerQueue(settings: Settings, random: () => number): Result<number[]> {
  const validated = validateSettings(settings);
  if (!validated.ok) return validated;
  const mode = settings.tuner.drillMode;
  if (mode === 'free') return { ok: true, value: [] };
  if (mode === 'target') {
    const pool = scalePool(settings);
    if (!pool.length)
      return failure('No target fits the active range and scale. Edit musical setup.');
    const queue: number[] = [];
    for (let index = 0; index < 8; index++) {
      const choices = pool.length > 1 ? pool.filter((midi) => midi !== queue[index - 1]) : pool;
      const note = pick(choices, random);
      if (note === undefined) return failure('No target is available. Edit musical setup.');
      queue.push(note);
    }
    return { ok: true, value: queue };
  }
  const { lowMidi, highMidi, rootKey, scaleId } = settings.global;
  const roots = register.filter(
    (root) => root >= lowMidi && root + 12 <= highMidi && pc(root) === rootKey,
  );
  const root = pick(roots, random);
  if (root === undefined)
    return failure(
      `A full tonic-to-tonic octave does not fit this range. Widen the range for ${mode === 'scale_walk' ? 'Scale walk' : 'Triad arpeggio'}.`,
    );
  if (mode === 'arpeggio') {
    const third = settings.tuner.arpeggioQuality === 'minor' ? 3 : 4;
    return { ok: true, value: [0, third, 7, 12, 7, third, 0].map((offset) => root + offset) };
  }
  const ascending = [...SCALES[scaleId].steps, 12].map((offset) => root + offset);
  return { ok: true, value: [...ascending, ...ascending.slice(0, -1).reverse()] };
}

/** Feasible reference/target pairs, shared by generation, navigation and its UI explanation. */
export function availableHarmonyTargets(settings: Settings): VocalTarget[] {
  if (!validateSettings(settings).ok) return [];
  const challenge = CHALLENGES[settings.harmony.challengeId];
  const { rootKey, lowMidi, highMidi } = settings.global;
  return register
    .filter((root) => {
      const rootAllowed =
        settings.harmony.rootPolicy === 'tonic' ? pc(root) === rootKey : inScale(root, settings);
      return (
        rootAllowed &&
        root + challenge.target >= lowMidi &&
        root + challenge.target <= highMidi &&
        challenge.backing.every((offset) => root + offset >= 36 && root + offset <= 84)
      );
    })
    .map((rootMidi) => ({
      rootMidi,
      targetMidi: rootMidi + challenge.target,
      backingMidi: challenge.backing.map((offset) => rootMidi + offset),
    }));
}
export function buildHarmonyTarget(settings: Settings, random: () => number): Result<VocalTarget> {
  const validated = validateSettings(settings);
  if (!validated.ok) return validated;
  const target = pick(availableHarmonyTargets(settings), random);
  return target
    ? { ok: true, value: target }
    : failure(
        'This challenge and reference-root policy cannot produce a sung target in your range. Edit range, choose another challenge, or use Notes in key.',
      );
}

/** Ordered soprano, alto, tenor, bass; every promised quality has an explicit pitch fixture. */
export function progressionSteps(id: ProgressionId, rootKey: number): ProgressionStep[] {
  const root = 48 + (((Math.round(rootKey) % 12) + 12) % 12);
  const step = (label: string, offsets: [number, number, number, number]): ProgressionStep => ({
    label,
    notes: offsets.map((offset) => root + offset) as [number, number, number, number],
  });
  const tonic = (): ProgressionStep => step('I · major', [16, 12, 7, 0]);
  switch (id) {
    case 'pop':
      return [
        tonic(),
        step('V · major', [14, 11, 7, -5]),
        step('vi · minor', [16, 12, 9, -3]),
        step('IV · major', [12, 9, 5, -7]),
      ];
    case 'classic':
      return [
        tonic(),
        step('IV · major', [17, 12, 9, 5]),
        step('V · major', [19, 14, 11, 7]),
        tonic(),
      ];
    case 'jazz':
      return [
        step('ii7 · minor seventh', [17, 12, 9, 2]),
        step('V7 · dominant seventh', [17, 14, 11, -5]),
        step('Imaj7 · major seventh', [16, 11, 7, 0]),
        step('VI7 · dominant seventh', [16, 13, 7, -3]),
      ];
    case 'barbershop':
      return [
        tonic(),
        step('I7 · dominant seventh', [16, 10, 7, 0]),
        step('IV · major', [17, 12, 9, 5]),
        step('iv · minor', [17, 12, 8, 5]),
        tonic(),
      ];
  }
}
