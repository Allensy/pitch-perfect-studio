import { describe, expect, it } from 'vitest';
import { emptyProgress } from '../src/persistence';
import type { Legacy } from '../src/domain/types';
import { summarizeProgress } from '../src/features/progress/progress-model';

const legacy: Legacy = {
  xp: 400,
  streak: 90,
  totalAttempts: 1000,
  correctAttempts: 1000,
  noteStats: Array.from({ length: 12 }, () => ({ attempts: 0, correct: 0 })),
};

describe('progress presentation totals (REF-04/05)', () => {
  it('preserves legacy XP without inventing new quiz accuracy or a current streak', () => {
    expect(summarizeProgress(emptyProgress(), legacy)).toEqual({
      attempts: 0,
      correct: 0,
      accuracy: '—',
      totalXp: 400,
      currentStreak: 0,
      hasNewActivity: false,
    });
  });
  it('weights new quiz answers by attempts and excludes skips, vocal completions and legacy history', () => {
    const progress = emptyProgress();
    progress.quizzes.notes = { attempts: 100, correct: 75, firstTryCorrect: 30, skips: 20 };
    progress.quizzes.intervals = { attempts: 1, correct: 1, firstTryCorrect: 1, skips: 40 };
    progress.vocal = { completedTargets: 30, harmonyLocks: 20 };
    progress.xpEarned = 70;
    const before = structuredClone(progress);
    expect(summarizeProgress(progress, legacy)).toEqual({
      attempts: 101,
      correct: 76,
      accuracy: '75%',
      totalXp: 470,
      currentStreak: 0,
      hasNewActivity: true,
    });
    expect(progress).toEqual(before);
  });
  it('shows vocal activity without treating it as a submitted quiz answer', () => {
    const progress = emptyProgress();
    progress.vocal.harmonyLocks = 1;
    expect(summarizeProgress(progress, null)).toMatchObject({
      attempts: 0,
      accuracy: '—',
      hasNewActivity: true,
    });
  });
});
