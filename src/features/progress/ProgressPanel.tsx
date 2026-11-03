import { modeOptions } from '@/components/practice-options';
import { Button } from '@/components/ui/button';
import { NOTE_NAMES } from '@/domain/music';
import type { Legacy, Mode, Progress as PracticeProgress } from '@/domain/types';
import { accuracyLabel, summarizeProgress } from './progress-model';
import { ResetProgressDialog } from './ResetProgressDialog';
import { useProgressReset } from './useProgressReset';
interface ProgressProps {
  progress: PracticeProgress;
  legacy: Legacy | null;
  mode: Mode;
  onStop: () => void;
  onReset: () => boolean;
}

export function Progress({ progress: p, legacy, mode, onStop, onReset }: ProgressProps) {
  const reset = useProgressReset(onStop, onReset);
  const summary = summarizeProgress(p, legacy);
  return (
    <section className="rail-section progress-section">
      <details>
        <summary>Your progress</summary>
        {!summary.hasNewActivity ? (
          <p className="rail-note">
            {legacy
              ? 'Your new practice history starts here. Legacy progress is preserved below.'
              : 'Your first real round starts the story.'}
          </p>
        ) : (
          <div className="progress-totals">
            <div>
              <strong>{summary.totalXp}</strong>
              <span>Total XP</span>
            </div>
            <div>
              <strong>{summary.currentStreak}</strong>
              <span>Current streak</span>
            </div>
            <div>
              <strong>{summary.accuracy}</strong>
              <span>New quiz accuracy · {summary.attempts} attempts</span>
            </div>
          </div>
        )}
        <p className="hint">
          Quiz accuracy counts submitted quiz answers. Skips and auditions are excluded. Vocal
          completions are tracked separately.
        </p>
        <dl className="progress-breakdown">
          {(['notes', 'intervals', 'chords'] as const).map((quizMode) => (
            <div key={quizMode}>
              <dt>{modeOptions.find((option) => option.value === quizMode)?.label}</dt>
              <dd>
                {p.quizzes[quizMode].correct}/{p.quizzes[quizMode].attempts} correct ·{' '}
                {p.quizzes[quizMode].firstTryCorrect} first try · {p.quizzes[quizMode].skips}{' '}
                skipped
              </dd>
            </div>
          ))}
          <div>
            <dt>Vocal targets</dt>
            <dd>{p.vocal.completedTargets} completed</dd>
          </div>
          <div>
            <dt>Harmony locks</dt>
            <dd>{p.vocal.harmonyLocks} completed · no XP</dd>
          </div>
        </dl>
        {legacy && (
          <details className="legacy-progress">
            <summary>Legacy history</summary>
            <p className="hint">
              Preserved from the original app: {legacy.xp} XP · {legacy.correctAttempts}/
              {legacy.totalAttempts} correct answers · historical streak {legacy.streak}. Historical
              per-mode accuracy is unavailable and is not reconstructed.
            </p>
          </details>
        )}
        {mode === 'notes' && (
          <details>
            <summary>Pitch class mastery</summary>
            <div className="mastery-grid">
              {p.noteStats.map((cell, i) => (
                <div key={i}>
                  <strong>{NOTE_NAMES[i]}</strong>
                  <span>{accuracyLabel(cell.correct, cell.attempts)}</span>
                  <small>{cell.attempts} answers</small>
                </div>
              ))}
            </div>
          </details>
        )}
        <Button variant="ghost" onClick={reset.requestReset}>
          Reset progress
        </Button>
      </details>
      <ResetProgressDialog
        open={reset.confirming}
        result={reset.result}
        returnFocusRef={reset.returnFocusRef}
        onOpenChange={reset.setConfirming}
        onConfirm={reset.confirmReset}
      />
      {reset.result && !reset.confirming && (
        <p className="hint" role="status">
          {reset.result}
        </p>
      )}
    </section>
  );
}
