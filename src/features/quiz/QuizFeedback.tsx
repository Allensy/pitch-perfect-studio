import { Button, cn } from '@/components/ui/button';
import type { Round } from '@/domain/types';
import { ArrowRight } from 'lucide-react';
import { m, useReducedMotion } from 'motion/react';
import { submittedAnswerLabel } from './answer-model';
import { feedbackHeadings } from './copy';
export function QuizFeedback({ round, onNext }: { round: Round; onNext: () => void }) {
  const reduced = useReducedMotion();
  const retry = round.phase === 'retry';
  const submittedChoice = submittedAnswerLabel(round.lastAnswer);
  return (
    <m.div
      initial={{ opacity: reduced ? 1 : 0.65 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16 }}
      className={cn(
        'feedback',
        round.phase === 'correct' && 'feedback-correct',
        retry && 'feedback-retry',
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div>
        <strong>{feedbackHeadings[round.phase]}</strong>
        {retry && (
          <p className="feedback-attempt">
            Attempt {round.attempts} · Your choice: {submittedChoice}.
          </p>
        )}
        <p>{round.feedback || 'Play when you’re ready. References are here if you need them.'}</p>
      </div>
      {round.phase === 'correct' && (
        <Button onClick={() => onNext()}>
          Next <ArrowRight size={14} aria-hidden="true" />
        </Button>
      )}
    </m.div>
  );
}
