import { useState } from 'react';
import { Button, cn } from '@/components/ui/button';
import { CHORDS } from '@/domain/music';
import type { Answer, QualityId, Round, Settings } from '@/domain/types';
import { AnswerTile } from './AnswerTile';
import { chordEntryAnswer, INVERSION_LABELS } from './answer-model';
export function ChordAnswers({
  settings,
  round,
  onSubmit,
  onError,
  onAudition,
}: {
  settings: Settings['chords'];
  round: Round;
  onSubmit: (answer: Answer) => void;
  onError: (message: string) => void;
  onAudition: (midi: number) => void;
}) {
  const [quality, setQuality] = useState<QualityId | ''>(''),
    [inversion, setInversion] = useState('');
  const answerable = round.phase === 'awaiting' || round.phase === 'retry';
  const selectedChord = CHORDS.find((chord) => chord.id === quality);
  function submit() {
    const answer = chordEntryAnswer(quality, inversion, settings.inversionMode === 'guess_inv');
    onError(answer.ok ? '' : answer.message);
    if (answer.ok) onSubmit(answer.value);
  }
  return (
    <>
      <div className="answer-grid chord-grid">
        {CHORDS.map((chord) => {
          const wrong = round.phase === 'retry' && round.lastAnswer?.qualityId === chord.id;
          return (
            <AnswerTile
              key={chord.id}
              label={chord.short}
              caption={chord.name}
              accessibleLabel={`${chord.name}${wrong ? ', part of previous incorrect answer' : ''}`}
              selected={quality === chord.id}
              pressed={quality === chord.id}
              wrong={wrong}
              disabled={!answerable || !settings.activeQualityIds.includes(chord.id)}
              onClick={() => {
                setQuality(chord.id);
                if (chord.intervals.length === 3 && inversion === '3') setInversion('');
              }}
            />
          );
        })}
      </div>
      {settings.inversionMode === 'guess_inv' && (
        <fieldset className="inversion-options">
          <legend>Inversion</legend>
          {INVERSION_LABELS.map((label, i) => (
            <label key={label} className={cn('choice', inversion === String(i) && 'selected')}>
              <input
                type="radio"
                name="chord-inversion"
                value={i}
                checked={inversion === String(i)}
                disabled={!answerable || (i === 3 && selectedChord?.intervals.length === 3)}
                onChange={(event) => setInversion(event.target.value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      )}
      <Button className="check-chord" variant="primary" onClick={submit} disabled={!answerable}>
        Check answer
      </Button>
      {round.question?.kind === 'chords' && (
        <details className="disclosure">
          <summary>Isolate a voice</summary>
          <div className="button-row">
            {round.question.notes.map((midi, i) => (
              <Button key={i} size="small" onClick={() => onAudition(midi)}>
                Voice {i + 1}
              </Button>
            ))}
          </div>
        </details>
      )}
    </>
  );
}
