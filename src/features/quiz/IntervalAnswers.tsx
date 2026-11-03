import { INTERVALS } from '@/domain/music';
import type { Answer, Round, Settings } from '@/domain/types';
import { AnswerTile } from './AnswerTile';
export function IntervalAnswers({
  settings,
  round,
  onSubmit,
}: {
  settings: Settings['intervals'];
  round: Round;
  onSubmit: (answer: Answer) => void;
}) {
  const answerable = round.phase === 'awaiting' || round.phase === 'retry';
  return (
    <div className="answer-grid intervals-grid">
      {INTERVALS.filter((interval) => interval.st > 0).map((interval) => {
        const wrong = round.phase === 'retry' && round.lastAnswer?.semitones === interval.st;
        return (
          <AnswerTile
            key={interval.st}
            label={interval.short}
            caption={interval.name}
            accessibleLabel={`${interval.name}${wrong ? ', incorrect previous answer' : ''}`}
            disabled={!answerable || !settings.activeSemitones.includes(interval.st)}
            wrong={wrong}
            onClick={() => onSubmit({ semitones: interval.st })}
          />
        );
      })}
    </div>
  );
}
