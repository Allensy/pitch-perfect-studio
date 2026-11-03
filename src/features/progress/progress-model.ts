import type { Legacy, Progress } from '@/domain/types';

export function accuracyLabel(correct: number, attempts: number): string {
  return attempts ? `${Math.round((correct / attempts) * 100)}%` : '—';
}

/** Presentation totals never reconstruct missing legacy or vocal quiz accuracy. */
export function summarizeProgress(progress: Progress, legacy: Legacy | null) {
  const quizzes = Object.values(progress.quizzes);
  const attempts = quizzes.reduce((sum, counter) => sum + counter.attempts, 0);
  const correct = quizzes.reduce((sum, counter) => sum + counter.correct, 0);
  return {
    attempts,
    correct,
    accuracy: accuracyLabel(correct, attempts),
    totalXp: progress.xpEarned + (legacy?.xp ?? 0),
    currentStreak: progress.currentStreak,
    hasNewActivity: Boolean(
      attempts || progress.vocal.completedTargets || progress.vocal.harmonyLocks,
    ),
  };
}
