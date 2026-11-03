import type {
  Settings,
  PitchNotation,
  ScaleId,
  QualityId,
  ChallengeId,
  ProgressionId,
  Result,
} from './types';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTE_DISPLAY = [
  'C',
  'C♯/D♭',
  'D',
  'D♯/E♭',
  'E',
  'F',
  'F♯/G♭',
  'G',
  'G♯/A♭',
  'A',
  'A♯/B♭',
  'B',
];
export const SOLFEGE_NAMES = [
  'Do',
  'Di/Ra',
  'Re',
  'Ri/Me',
  'Mi',
  'Fa',
  'Fi/Se',
  'Sol',
  'Si/Le',
  'La',
  'Li/Te',
  'Ti',
];
export const DEGREE_NAMES = [
  '1 (Root)',
  '♭2',
  '2',
  '♭3',
  '3',
  '4',
  '♯4/♭5',
  '5',
  '♭6',
  '6',
  '♭7',
  '7',
];

export const SCALES: Record<ScaleId, { name: string; steps: number[] }> = {
  chromatic: { name: 'Chromatic', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  major: { name: 'Major', steps: [0, 2, 4, 5, 7, 9, 11] },
  natural_minor: { name: 'Natural Minor', steps: [0, 2, 3, 5, 7, 8, 10] },
  harmonic_minor: { name: 'Harmonic Minor', steps: [0, 2, 3, 5, 7, 8, 11] },
  melodic_minor: { name: 'Melodic Minor', steps: [0, 2, 3, 5, 7, 9, 11] },
  dorian: { name: 'Dorian', steps: [0, 2, 3, 5, 7, 9, 10] },
  mixolydian: { name: 'Mixolydian', steps: [0, 2, 4, 5, 7, 9, 10] },
  pentatonic_major: { name: 'Major Pentatonic', steps: [0, 2, 4, 7, 9] },
  pentatonic_minor: { name: 'Minor Pentatonic', steps: [0, 3, 5, 7, 10] },
  blues: { name: 'Blues Scale', steps: [0, 3, 5, 6, 7, 10] },
};

const LEGACY_PRESETS = {
  single_c4: { low: 60, high: 71 }, // C4-B4
  two_oct: { low: 48, high: 72 }, // C3-C5
  soprano: { low: 60, high: 84 }, // C4-C6
  mezzo: { low: 57, high: 81 }, // A3-A5
  alto: { low: 53, high: 77 }, // F3-F5
  tenor: { low: 48, high: 72 }, // C3-C5
  baritone: { low: 45, high: 69 }, // A2-A4
  bass: { low: 40, high: 64 }, // E2-E4
  full: { low: 36, high: 84 }, // C2-C6
};

const ALL_INTERVALS = [
  {
    st: 0,
    short: 'P1',
    name: 'Perfect Unison',
    songAsc: 'Same Note Repeated',
    songDesc: 'Same Note Repeated',
  },
  { st: 1, short: 'm2', name: 'Minor 2nd', songAsc: 'Jaws (Theme)', songDesc: 'Für Elise' },
  {
    st: 2,
    short: 'M2',
    name: 'Major 2nd',
    songAsc: 'Happy Birthday',
    songDesc: 'Yesterday (Beatles)',
  },
  {
    st: 3,
    short: 'm3',
    name: 'Minor 3rd',
    songAsc: 'Greensleeves / Seven Nation Army',
    songDesc: 'Hey Jude',
  },
  {
    st: 4,
    short: 'M3',
    name: 'Major 3rd',
    songAsc: 'When the Saints Go Marching In',
    songDesc: 'Swing Low, Sweet Chariot',
  },
  {
    st: 5,
    short: 'P4',
    name: 'Perfect 4th',
    songAsc: 'Here Comes the Bride',
    songDesc: 'Eine Kleine Nachtmusik',
  },
  {
    st: 6,
    short: 'TT',
    name: 'Tritone (♯4/♭5)',
    songAsc: 'The Simpsons / Maria',
    songDesc: 'Black Sabbath',
  },
  {
    st: 7,
    short: 'P5',
    name: 'Perfect 5th',
    songAsc: 'Star Wars / Twinkle Twinkle',
    songDesc: 'Flintstones Theme',
  },
  {
    st: 8,
    short: 'm6',
    name: 'Minor 6th',
    songAsc: 'The Entertainer',
    songDesc: 'Love Story Theme',
  },
  {
    st: 9,
    short: 'M6',
    name: 'Major 6th',
    songAsc: 'My Bonnie Lies Over the Ocean',
    songDesc: 'Nobody Knows the Trouble',
  },
  {
    st: 10,
    short: 'm7',
    name: 'Minor 7th',
    songAsc: 'Somewhere (West Side Story)',
    songDesc: 'Watermelon Man',
  },
  {
    st: 11,
    short: 'M7',
    name: 'Major 7th',
    songAsc: 'Take On Me (Chorus)',
    songDesc: 'I Love You (Cole Porter)',
  },
  {
    st: 12,
    short: 'P8',
    name: 'Perfect Octave',
    songAsc: 'Somewhere Over the Rainbow',
    songDesc: 'Singing in the Rain',
  },
];

export const CHORDS: {
  id: QualityId;
  name: string;
  short: string;
  intervals: number[];
  desc: string;
}[] = [
  {
    id: 'maj',
    name: 'Major Triad',
    short: 'Maj',
    intervals: [0, 4, 7],
    desc: 'Bright, consonant (1–3–5)',
  },
  {
    id: 'min',
    name: 'Minor Triad',
    short: 'Min',
    intervals: [0, 3, 7],
    desc: 'Warm, melancholic (1–♭3–5)',
  },
  {
    id: 'dim',
    name: 'Diminished Triad',
    short: 'dim',
    intervals: [0, 3, 6],
    desc: 'Tense, unstable (1–♭3–♭5)',
  },
  {
    id: 'aug',
    name: 'Augmented Triad',
    short: 'aug',
    intervals: [0, 4, 8],
    desc: 'Dreamy, symmetrical (1–3–♯5)',
  },
  {
    id: 'sus2',
    name: 'Suspended 2nd',
    short: 'sus2',
    intervals: [0, 2, 7],
    desc: 'Open, airy (1–2–5)',
  },
  {
    id: 'sus4',
    name: 'Suspended 4th',
    short: 'sus4',
    intervals: [0, 5, 7],
    desc: 'Bright tension (1–4–5)',
  },
  {
    id: 'dom7',
    name: 'Dominant 7th',
    short: '7',
    intervals: [0, 4, 7, 10],
    desc: 'Bluesy, strong resolution (1–3–5–♭7)',
  },
  {
    id: 'maj7',
    name: 'Major 7th',
    short: 'Maj7',
    intervals: [0, 4, 7, 11],
    desc: 'Lush, jazzy (1–3–5–7)',
  },
  {
    id: 'min7',
    name: 'Minor 7th',
    short: 'm7',
    intervals: [0, 3, 7, 10],
    desc: 'Smooth, soulful (1–♭3–5–♭7)',
  },
  {
    id: 'm7b5',
    name: 'Half-Diminished 7th',
    short: 'm7♭5',
    intervals: [0, 3, 6, 10],
    desc: 'Cinematic minor ii° (1–♭3–♭5–♭7)',
  },
  {
    id: 'dim7',
    name: 'Diminished 7th',
    short: 'dim7',
    intervals: [0, 3, 6, 9],
    desc: 'Dramatic symmetrical (1–♭3–♭5–𝄫7)',
  },
];
export const INTERVALS = ALL_INTERVALS.filter((interval) => interval.st > 0);

const presetNames: Record<keyof typeof LEGACY_PRESETS, string> = {
  single_c4: 'Single octave · C4–B4',
  two_oct: 'Standard two octaves · C3–C5',
  soprano: 'Soprano · C4–C6',
  mezzo: 'Mezzo-soprano · A3–A5',
  alto: 'Alto · F3–F5',
  tenor: 'Tenor · C3–C5',
  baritone: 'Baritone · A2–A4',
  bass: 'Bass · E2–E4',
  full: 'Full studio · C2–C6',
};
export const RANGE_PRESETS: Record<string, { name: string; low: number; high: number }> =
  Object.fromEntries(
    Object.entries(LEGACY_PRESETS).map(([id, range]) => [
      id,
      { name: presetNames[id as keyof typeof LEGACY_PRESETS], ...range },
    ]),
  );
export const CHALLENGES: Record<ChallengeId, { name: string; target: number; backing: number[] }> =
  {
    major3: { name: 'Major third above', target: 4, backing: [0] },
    minor3: { name: 'Minor third above', target: 3, backing: [0] },
    fifth: { name: 'Perfect fifth above', target: 7, backing: [0] },
    sixth: { name: 'Major sixth above', target: 9, backing: [0] },
    majMiddle: { name: 'Major triad · middle voice', target: 4, backing: [0, 7] },
    majTop: { name: 'Major triad · top voice', target: 7, backing: [0, 4] },
    minMiddle: { name: 'Minor triad · middle voice', target: 3, backing: [0, 7] },
    domTop: { name: 'Dominant seventh · top voice', target: 10, backing: [0, 4, 7] },
  };
export const PROGRESSIONS: Record<ProgressionId, { name: string }> = {
  pop: { name: 'Pop · I–V–vi–IV' },
  classic: { name: 'Classic · I–IV–V–I' },
  jazz: { name: 'Jazz · ii7–V7–Imaj7–VI7' },
  barbershop: { name: 'Barbershop tag · I–I7–IV–iv–I' },
};

export function defaultSettings(): Settings {
  return {
    global: {
      timbre: 'piano',
      rangePreset: 'two_oct',
      lowMidi: 48,
      highMidi: 72,
      rootKey: 0,
      scaleId: 'major',
      notation: 'letter',
      a4: 440,
    },
    notes: { exactOctave: false, autoNext: true },
    intervals: {
      activeSemitones: INTERVALS.map((i) => i.st),
      direction: 'asc_harm',
      fixedRoot: false,
    },
    chords: { activeQualityIds: CHORDS.map((c) => c.id), playback: 'both', inversionMode: 'root' },
    harmony: {
      challengeId: 'fifth',
      submode: 'target',
      rootPolicy: 'tonic',
      progressionId: 'pop',
      mutedVoices: [false, false, false, false],
    },
    tuner: { drillMode: 'target', toleranceCents: 22, arpeggioQuality: 'major' },
    piano: { inputMode: 'audition', octave: 4 },
  };
}

export function noteName(midi: number): string {
  if (!Number.isFinite(midi)) return '—';
  const note = Math.round(midi);
  return `${NOTE_DISPLAY[((note % 12) + 12) % 12]?.split('/')[0] ?? '—'}${Math.floor(note / 12) - 1}`;
}
export function pitchLabel(midi: number, settings: { global: PitchNotation }): string {
  if (settings.global.notation === 'letter') return noteName(midi);
  const degree = (((Math.round(midi) - settings.global.rootKey) % 12) + 12) % 12;
  const label =
    (settings.global.notation === 'solfege' ? SOLFEGE_NAMES : DEGREE_NAMES)[degree] ?? '—';
  return `${label} · ${noteName(midi)}`;
}
export function midiToFrequency(midi: number, a4 = 440): number {
  return a4 * 2 ** ((midi - 69) / 12);
}
export function frequencyToMidi(frequency: number, a4 = 440): number {
  return 69 + 12 * Math.log2(frequency / a4);
}
export function scalePool(settings: Settings): number[] {
  const { lowMidi, highMidi, rootKey, scaleId } = settings.global;
  return Array.from({ length: highMidi - lowMidi + 1 }, (_, i) => lowMidi + i).filter((midi) =>
    SCALES[scaleId].steps.includes((midi - rootKey + 120) % 12),
  );
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
function integer(value: unknown, low: number, high: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= low && value <= high;
}
function member<T extends string>(value: unknown, values: readonly T[]): T | null {
  return values.find((option) => option === value) ?? null;
}
function numericList(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length < 2 || value.some((v) => !integer(v, 1, 12)))
    return null;
  const items: number[] = value.filter((v): v is number => typeof v === 'number');
  return items.length === value.length && new Set(items).size === items.length ? items : null;
}
function qualityList(value: unknown): QualityId[] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const values: QualityId[] = [];
  for (const item of value) {
    const quality = CHORDS.find((c) => c.id === item);
    if (!quality) return null;
    values.push(quality.id);
  }
  return new Set(values).size === values.length ? values : null;
}

/** Reconstruct only whitelisted fields; no runtime object is accepted by a cast. */
export function validateSettings(input: unknown): Result<Settings> {
  const invalid = (message: string): Result<Settings> => ({ ok: false, message });
  const root = record(input);
  if (!root) return invalid('Musical settings are missing.');
  const g = record(root.global),
    n = record(root.notes),
    i = record(root.intervals),
    c = record(root.chords);
  const h = record(root.harmony),
    t = record(root.tuner),
    p = record(root.piano);
  if (!g || !n || !i || !c || !h || !t || !p)
    return invalid('Settings are incomplete. Restore defaults or review every practice group.');
  const timbre = member(g.timbre, ['piano', 'epiano', 'strings', 'organ', 'sine'] as const);
  const scaleId = member(g.scaleId, Object.keys(SCALES) as ScaleId[]);
  const notation = member(g.notation, ['letter', 'solfege', 'degree'] as const);
  const preset =
    typeof g.rangePreset === 'string' &&
    (g.rangePreset === 'custom' || Object.hasOwn(RANGE_PRESETS, g.rangePreset))
      ? g.rangePreset
      : null;
  if (
    !timbre ||
    !scaleId ||
    !notation ||
    !preset ||
    !integer(g.lowMidi, 36, 84) ||
    !integer(g.highMidi, 36, 84) ||
    g.highMidi - g.lowMidi < 4 ||
    !integer(g.rootKey, 0, 11) ||
    !integer(g.a4, 430, 448)
  ) {
    return invalid(
      'Use C2–C6 with at least four semitones between endpoints, a valid key/scale/instrument, and A4 from 430 to 448 Hz.',
    );
  }
  const semitones = numericList(i.activeSemitones),
    qualities = qualityList(c.activeQualityIds);
  const direction = member(i.direction, ['asc', 'desc', 'harm', 'asc_harm', 'mixed'] as const);
  const playback = member(c.playback, ['block', 'arp', 'both'] as const);
  const inversionMode = member(c.inversionMode, ['root', 'random_voicing', 'guess_inv'] as const);
  if (
    !semitones ||
    !qualities ||
    !direction ||
    !playback ||
    !inversionMode ||
    typeof i.fixedRoot !== 'boolean' ||
    typeof n.exactOctave !== 'boolean' ||
    typeof n.autoNext !== 'boolean'
  )
    return invalid(
      'Select at least two distinct intervals and chord qualities, and valid playback/answer modes.',
    );
  const challengeId = member(h.challengeId, Object.keys(CHALLENGES) as ChallengeId[]);
  const progressionId = member(h.progressionId, Object.keys(PROGRESSIONS) as ProgressionId[]);
  const submode = member(h.submode, ['target', 'mixer'] as const),
    rootPolicy = member(h.rootPolicy, ['tonic', 'scale'] as const);
  if (
    !challengeId ||
    !progressionId ||
    !submode ||
    !rootPolicy ||
    !Array.isArray(h.mutedVoices) ||
    h.mutedVoices.length !== 4 ||
    !h.mutedVoices.every((v) => typeof v === 'boolean')
  )
    return invalid(
      'Choose a known Harmony challenge, root policy and progression with four voice states.',
    );
  const mutedVoices = h.mutedVoices.filter((v): v is boolean => typeof v === 'boolean');
  if (mutedVoices.length !== 4) return invalid('All four Harmony voice states must be present.');
  const drillMode = member(t.drillMode, ['free', 'target', 'scale_walk', 'arpeggio'] as const);
  const arpeggioQuality = member(t.arpeggioQuality, ['major', 'minor'] as const);
  const inputMode = member(p.inputMode, ['audition', 'answer'] as const);
  if (
    !drillMode ||
    !arpeggioQuality ||
    !(t.toleranceCents === 12 || t.toleranceCents === 22 || t.toleranceCents === 35) ||
    !inputMode ||
    !integer(p.octave, 2, 6)
  )
    return invalid(
      'Choose a known tuner drill, ±12/22/35-cent tolerance, and keyboard octave 2–6.',
    );
  const matched = RANGE_PRESETS[preset];
  return {
    ok: true,
    value: {
      global: {
        timbre,
        scaleId,
        notation,
        rangePreset:
          matched && (matched.low !== g.lowMidi || matched.high !== g.highMidi) ? 'custom' : preset,
        lowMidi: g.lowMidi,
        highMidi: g.highMidi,
        rootKey: g.rootKey,
        a4: g.a4,
      },
      notes: { exactOctave: n.exactOctave, autoNext: n.autoNext },
      intervals: { activeSemitones: semitones, direction, fixedRoot: i.fixedRoot },
      chords: { activeQualityIds: qualities, playback, inversionMode },
      harmony: { challengeId, submode, rootPolicy, progressionId, mutedVoices },
      tuner: { drillMode, toleranceCents: t.toleranceCents, arpeggioQuality },
      piano: { inputMode, octave: p.octave },
    },
  };
}
