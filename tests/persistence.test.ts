import { describe, it, expect } from 'vitest';
import {
  Persistence,
  freshEnvelope,
  parseEnvelope,
  parseLegacy,
  V1_KEY,
  V2_KEY,
} from '../src/persistence';
const legacy = () => ({
  xp: 100,
  streak: 4,
  totalAttempts: 10,
  correctAttempts: 7,
  noteStats: Array.from({ length: 12 }, () => ({ attempts: 0, correct: 0 })),
});
function memory() {
  const map = new Map<string, string>();
  let fail: string | null = null;
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (fail === k) throw new Error('storage full');
      map.set(k, v);
    },
    fail: (k: string | null) => {
      fail = k;
    },
  };
}
describe('validated single-writer migration', () => {
  it('imports exact legacy totals once without changing v1 or inventing mode history', () => {
    const storage = memory();
    const raw = JSON.stringify(legacy());
    storage.map.set(V1_KEY, raw);
    const p = new Persistence(() => storage);
    const first = p.load();
    expect(first.saved).toBe(true);
    expect(first.envelope.legacyImport.snapshot?.xp).toBe(100);
    expect(first.envelope.progress.quizzes.notes.correct).toBe(0);
    expect(storage.map.get(V1_KEY)).toBe(raw);
    storage.map.set(V1_KEY, JSON.stringify({ ...legacy(), xp: 999 }));
    expect(new Persistence(() => storage).load().envelope.legacyImport.snapshot?.xp).toBe(100);
  });
  it('distinguishes absent from invalid legacy data and preserves invalid input', () => {
    const storage = memory();
    expect(new Persistence(() => storage).load().envelope.legacyImport.status).toBe('absent');
    const other = memory();
    other.map.set(V1_KEY, 'broken');
    const read = new Persistence(() => other).load();
    expect(read.envelope.legacyImport.status).toBe('invalid');
    expect(other.map.get(V1_KEY)).toBe('broken');
  });
  it.each(['broken', JSON.stringify({ schemaVersion: 3, privateFutureField: 123 })])(
    'blocks writes to invalid/newer v2 rather than falling back to v1',
    (raw) => {
      const storage = memory();
      storage.map.set(V2_KEY, raw);
      storage.map.set(V1_KEY, JSON.stringify(legacy()));
      const p = new Persistence(() => storage);
      const read = p.load();
      expect(read.blocked).toBe(true);
      expect(p.save(read.envelope).saved).toBe(false);
      expect(p.reset(read.envelope, 'reset').saved).toBe(false);
      expect(storage.map.get(V2_KEY)).toBe(raw);
      expect(read.envelope.legacyImport.snapshot).toBeNull();
    },
  );
  it('keeps valid in-memory outcomes when a save fails, then saves the latest snapshot', () => {
    const storage = memory(),
      p = new Persistence(() => storage);
    const initial = p.load().envelope;
    const next = structuredClone(initial);
    next.progress.xpEarned = 17;
    storage.fail(V2_KEY);
    const failed = p.save(next);
    expect(failed.saved).toBe(false);
    expect(failed.envelope.progress.xpEarned).toBe(17);
    next.progress.xpEarned = 36;
    storage.fail(null);
    const saved = p.retry(next);
    expect(saved.saved).toBe(true);
    expect(parseEnvelope(JSON.parse(storage.map.get(V2_KEY)!))?.progress.xpEarned).toBe(36);
  });
  it('failed reset preserves prior counters and never zeroes v1 first', () => {
    const storage = memory();
    storage.map.set(V1_KEY, JSON.stringify(legacy()));
    const p = new Persistence(() => storage);
    const before = p.load().envelope;
    before.progress.xpEarned = 50;
    storage.fail(V2_KEY);
    const result = p.reset(before, 'token');
    expect(result.saved).toBe(false);
    expect(result.envelope.progress.xpEarned).toBe(50);
    expect(JSON.parse(storage.map.get(V1_KEY)!).xp).toBe(100);
  });
  it('commits reset tombstone before legacy cleanup, preserving settings', () => {
    const storage = memory();
    storage.map.set(V1_KEY, JSON.stringify(legacy()));
    const p = new Persistence(() => storage);
    const before = p.load().envelope;
    before.settings.global.rootKey = 5;
    storage.fail(V1_KEY);
    const result = p.reset(before, 'token');
    expect(result.saved).toBe(true);
    expect(result.envelope.legacyImport.cleanupPending).toBe(true);
    expect(result.envelope.legacyImport.snapshot).toBeNull();
    expect(result.envelope.settings.global.rootKey).toBe(5);
    expect(JSON.parse(storage.map.get(V1_KEY)!).xp).toBe(100);
    expect(new Persistence(() => storage).load().envelope.legacyImport.status).toBe('reset');
  });
  it('cleanup retry cannot overwrite new progress with an old reset snapshot', () => {
    const storage = memory();
    storage.map.set(V1_KEY, JSON.stringify(legacy()));
    const p = new Persistence(() => storage);
    const before = p.load().envelope;
    storage.fail(V1_KEY);
    const reset = p.reset(before, 'token').envelope;
    const next = structuredClone(reset);
    next.progress.xpEarned = 40;
    storage.fail(null);
    const result = p.retry(next);
    expect(result.saved).toBe(true);
    expect(result.envelope.progress.xpEarned).toBe(40);
    expect(result.envelope.legacyImport.cleanupPending).toBe(false);
    expect(JSON.parse(storage.map.get(V1_KEY)!).xp).toBe(0);
  });
  it('rejects impossible legacy counts and settings at the unknown-data boundary', () => {
    expect(parseLegacy({ ...legacy(), correctAttempts: 11 })).toBeNull();
    expect(parseLegacy({ ...legacy(), xp: '100' })).toBeNull();
    expect(parseLegacy({ ...legacy(), noteStats: [] })).toBeNull();
    const env = freshEnvelope();
    env.progress.quizzes.notes.firstTryCorrect = 1;
    expect(parseEnvelope(env)).toBeNull();
    env.progress.quizzes.notes.firstTryCorrect = 0;
    env.settings.global.a4 = 999;
    expect(parseEnvelope(env)).toBeNull();
  });
  it('restores volume/mute without creating browser audio resources', () => {
    const storage = memory(),
      p = new Persistence(() => storage);
    const env = freshEnvelope();
    env.output = { volume: 27, muted: true };
    p.save(env);
    expect(new Persistence(() => storage).load().envelope.output).toEqual({
      volume: 27,
      muted: true,
    });
  });
});
