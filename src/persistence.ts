import type { Envelope, Legacy, Mode, Progress, Counters, NoteCounter } from './domain/types';
import { defaultSettings, validateSettings } from './domain/music';
export const V1_KEY = 'pitch_perfect_studio_v1';
export const V2_KEY = 'pitch_perfect_studio_v2';
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function emptyProgress(): Progress {
  const counter = (): Counters => ({ attempts: 0, correct: 0, firstTryCorrect: 0, skips: 0 });
  return {
    xpEarned: 0,
    currentStreak: 0,
    quizzes: { notes: counter(), intervals: counter(), chords: counter() },
    noteStats: Array.from({ length: 12 }, () => ({ attempts: 0, correct: 0 })),
    vocal: { completedTargets: 0, harmonyLocks: 0 },
  };
}
const record = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown): x is number =>
  typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;
function pair(x: unknown): x is NoteCounter {
  return record(x) && count(x.attempts) && count(x.correct) && x.correct <= x.attempts;
}
function noteCells(x: unknown): x is NoteCounter[] {
  return Array.isArray(x) && x.length === 12 && x.every(pair);
}
export function parseLegacy(x: unknown): Legacy | null {
  if (
    !record(x) ||
    !count(x.xp) ||
    !count(x.streak) ||
    !count(x.totalAttempts) ||
    !count(x.correctAttempts) ||
    x.correctAttempts > x.totalAttempts ||
    !noteCells(x.noteStats)
  )
    return null;
  return {
    xp: x.xp,
    streak: x.streak,
    totalAttempts: x.totalAttempts,
    correctAttempts: x.correctAttempts,
    noteStats: x.noteStats.map((c) => ({ attempts: c.attempts, correct: c.correct })),
  };
}
const modes: Mode[] = ['notes', 'intervals', 'chords', 'harmony', 'tuner'];
function quizCounter(x: unknown): x is Counters {
  return (
    pair(x) &&
    record(x) &&
    count(x.firstTryCorrect) &&
    count(x.skips) &&
    x.firstTryCorrect <= x.correct
  );
}
export function parseEnvelope(x: unknown): Envelope | null {
  if (
    !record(x) ||
    x.schemaVersion !== 2 ||
    !count(x.revision) ||
    !modes.includes(x.activeMode as Mode) ||
    !record(x.legacyImport) ||
    !record(x.progress)
  )
    return null;
  const settings = validateSettings(x.settings);
  if (!settings.ok) return null;
  const l = x.legacyImport,
    p = x.progress;
  const output = x.output === undefined ? { volume: 65, muted: false } : x.output;
  if (
    !record(output) ||
    typeof output.volume !== 'number' ||
    !Number.isFinite(output.volume) ||
    output.volume < 0 ||
    output.volume > 100 ||
    typeof output.muted !== 'boolean'
  )
    return null;
  if (
    l.sourceKey !== V1_KEY ||
    !['imported', 'absent', 'invalid', 'reset'].includes(String(l.status)) ||
    typeof l.cleanupPending !== 'boolean' ||
    !(l.resetToken === null || typeof l.resetToken === 'string')
  )
    return null;
  const legacy = l.snapshot === null ? null : parseLegacy(l.snapshot);
  if (l.snapshot !== null && !legacy) return null;
  if (
    (l.status === 'imported' && !legacy) ||
    (l.status !== 'imported' && legacy) ||
    (l.status === 'reset' && !l.resetToken) ||
    (l.cleanupPending && l.status !== 'reset')
  )
    return null;
  if (
    !count(p.xpEarned) ||
    !count(p.currentStreak) ||
    !record(p.quizzes) ||
    !['notes', 'intervals', 'chords'].every((k) =>
      quizCounter((p.quizzes as Record<string, unknown>)[k]),
    ) ||
    !noteCells(p.noteStats) ||
    !record(p.vocal) ||
    !count(p.vocal.completedTargets) ||
    !count(p.vocal.harmonyLocks)
  )
    return null;
  // JSON has passed a closed field-by-field validator; reconstruct only whitelisted fields.
  const quizzes = p.quizzes as Record<'notes' | 'intervals' | 'chords', Counters>;
  const cloneCounter = (c: Counters): Counters => ({
    attempts: c.attempts,
    correct: c.correct,
    firstTryCorrect: c.firstTryCorrect,
    skips: c.skips,
  });
  return {
    schemaVersion: 2,
    revision: x.revision,
    activeMode: x.activeMode as Mode,
    output: { volume: output.volume, muted: output.muted },
    settings: settings.value,
    legacyImport: {
      sourceKey: V1_KEY,
      status: l.status as Envelope['legacyImport']['status'],
      snapshot: legacy,
      cleanupPending: l.cleanupPending,
      resetToken: l.resetToken as string | null,
    },
    progress: {
      xpEarned: p.xpEarned,
      currentStreak: p.currentStreak,
      quizzes: {
        notes: cloneCounter(quizzes.notes),
        intervals: cloneCounter(quizzes.intervals),
        chords: cloneCounter(quizzes.chords),
      },
      noteStats: p.noteStats.map((c) => ({ attempts: c.attempts, correct: c.correct })),
      vocal: { completedTargets: p.vocal.completedTargets, harmonyLocks: p.vocal.harmonyLocks },
    },
  };
}
function decode(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}
export function freshEnvelope(settings = defaultSettings()): Envelope {
  return {
    schemaVersion: 2,
    revision: 0,
    settings,
    activeMode: 'notes',
    output: { volume: 65, muted: false },
    legacyImport: {
      sourceKey: V1_KEY,
      status: 'absent',
      snapshot: null,
      cleanupPending: false,
      resetToken: null,
    },
    progress: emptyProgress(),
  };
}
export interface PersistenceResult {
  envelope: Envelope;
  message: string;
  blocked: boolean;
  saved: boolean;
}
/** A single writer. No normal outcome ever writes the legacy key. */
export class Persistence {
  private blocked = false;
  constructor(private readonly storage: () => StoragePort) {}
  load(): PersistenceResult {
    const fallback = freshEnvelope();
    let raw: string | null;
    try {
      raw = this.storage().getItem(V2_KEY);
    } catch {
      this.blocked = true;
      return {
        envelope: fallback,
        message:
          'Saved progress could not be read. Practice is available, but saved data will remain untouched. Reload when browser storage is available.',
        blocked: true,
        saved: false,
      };
    }
    if (raw !== null) {
      const data = decode(raw);
      const envelope = parseEnvelope(data);
      if (!envelope) {
        this.blocked = true;
        const newer =
          record(data) && typeof data.schemaVersion === 'number' && data.schemaVersion > 2;
        return {
          envelope: fallback,
          message: newer
            ? 'This browser has progress from a newer app. It is untouched. Use the compatible version to resume saving.'
            : 'Saved progress is invalid and has been left untouched. Practice can continue without saving; recover or export the browser data before resetting it.',
          blocked: true,
          saved: false,
        };
      }
      this.blocked = false;
      if (envelope.legacyImport.cleanupPending) return this.cleanup(envelope);
      return { envelope, message: '', blocked: false, saved: true };
    }
    try {
      const old = this.storage().getItem(V1_KEY);
      if (old !== null) {
        const snapshot = parseLegacy(decode(old));
        fallback.legacyImport = {
          ...fallback.legacyImport,
          status: snapshot ? 'imported' : 'invalid',
          snapshot,
        };
      }
    } catch {
      return {
        envelope: fallback,
        message:
          'Legacy progress could not be read. No migration was written. Reload before saving to protect existing history.',
        blocked: (this.blocked = true),
        saved: false,
      };
    }
    this.blocked = false;
    const result = this.save(fallback);
    if (fallback.legacyImport.status === 'invalid')
      result.message =
        'Legacy data was invalid and was left untouched. New progress is tracked separately. ' +
        result.message;
    return result;
  }
  save(envelope: Envelope): PersistenceResult {
    if (this.blocked)
      return {
        envelope,
        message: 'Saving is paused to protect unreadable or incompatible stored progress.',
        blocked: true,
        saved: false,
      };
    const next = { ...envelope, revision: envelope.revision + 1 };
    try {
      this.storage().setItem(V2_KEY, JSON.stringify(next));
      return { envelope: next, message: '', blocked: false, saved: true };
    } catch {
      return {
        envelope,
        message:
          'Your latest progress is in this tab but could not be saved. Keep this tab open and retry saving.',
        blocked: false,
        saved: false,
      };
    }
  }
  reset(envelope: Envelope, token: string): PersistenceResult {
    if (this.blocked)
      return {
        envelope,
        message:
          'Reset is unavailable while stored data cannot be safely read. Existing data is untouched.',
        blocked: true,
        saved: false,
      };
    const next: Envelope = {
      ...envelope,
      progress: emptyProgress(),
      legacyImport: {
        sourceKey: V1_KEY,
        status: 'reset',
        snapshot: null,
        cleanupPending: true,
        resetToken: token,
      },
    };
    const committed = this.save(next);
    if (!committed.saved)
      return {
        ...committed,
        envelope,
        message: 'Practice stopped, but reset could not be saved. Your prior progress remains.',
      };
    return this.cleanup(committed.envelope);
  }
  retry(envelope: Envelope): PersistenceResult {
    const saved = this.save(envelope);
    return saved.saved && saved.envelope.legacyImport.cleanupPending
      ? this.cleanup(saved.envelope)
      : saved;
  }
  private cleanup(envelope: Envelope): PersistenceResult {
    try {
      const zero: Legacy = {
        xp: 0,
        streak: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        noteStats: Array.from({ length: 12 }, () => ({ attempts: 0, correct: 0 })),
      };
      this.storage().setItem(V1_KEY, JSON.stringify(zero));
      const latestRaw = this.storage().getItem(V2_KEY);
      const latest = latestRaw === null ? null : parseEnvelope(decode(latestRaw));
      if (!latest || latest.legacyImport.resetToken !== envelope.legacyImport.resetToken)
        return {
          envelope,
          message:
            'Legacy reset was written. Progress changed in another tab; reload to reconcile it.',
          blocked: (this.blocked = true),
          saved: true,
        };
      const next = {
        ...latest,
        revision: latest.revision + 1,
        legacyImport: { ...latest.legacyImport, cleanupPending: false },
      };
      this.storage().setItem(V2_KEY, JSON.stringify(next));
      return {
        envelope: next,
        message: 'Progress reset. Musical settings retained.',
        blocked: false,
        saved: true,
      };
    } catch {
      return {
        envelope,
        message:
          'Reset is saved in this version. Cleanup of older-version history is still pending; retry saving.',
        blocked: false,
        saved: true,
      };
    }
  }
}
