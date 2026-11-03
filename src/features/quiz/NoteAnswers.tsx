import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/fields';
import { NOTE_NAMES } from '@/domain/music';
import type { Answer, Round, Settings } from '@/domain/types';
import { AnswerTile } from './AnswerTile';
import { exactNoteAnswer, noteChoices } from './answer-model';
const noteOptions = [
  { value: '', label: 'Choose note' },
  ...NOTE_NAMES.map((label, i) => ({ value: String(i), label })),
];
const octaveOptions = [
  { value: '', label: 'Choose octave' },
  ...[2, 3, 4, 5, 6].map((i) => ({ value: String(i), label: String(i) })),
];
export function NoteAnswers({
  settings,
  round,
  onSubmit,
  onError,
}: {
  settings: Settings;
  round: Round;
  onSubmit: (answer: Answer) => void;
  onError: (message: string) => void;
}) {
  const [note, setNote] = useState(''),
    [octave, setOctave] = useState('');
  const answerable = round.phase === 'awaiting' || round.phase === 'retry';
  function submit() {
    const answer = exactNoteAnswer(note, octave);
    onError(answer.ok ? '' : answer.message);
    if (answer.ok) onSubmit(answer.value);
  }
  if (settings.notes.exactOctave)
    return (
      <div className="exact-entry">
        <SelectField
          className=""
          label="Note"
          value={note}
          onChange={setNote}
          options={noteOptions}
        />
        <SelectField
          className=""
          label="Octave"
          value={octave}
          onChange={setOctave}
          options={octaveOptions}
        />
        <Button variant="primary" disabled={!answerable} onClick={submit}>
          Check answer
        </Button>
      </div>
    );
  return (
    <div className="answer-grid notes-grid">
      {noteChoices(settings.global).map((choice) => {
        const wrong = round.phase === 'retry' && round.lastAnswer?.pitchClass === choice.pitchClass;
        return (
          <AnswerTile
            key={choice.pitchClass}
            label={choice.label}
            caption={choice.caption}
            accessibleLabel={`${choice.accessibleLabel}${wrong ? ', incorrect previous answer' : ''}`}
            wrong={wrong}
            disabled={!answerable || !choice.inScale}
            onClick={() => onSubmit({ pitchClass: choice.pitchClass })}
          />
        );
      })}
    </div>
  );
}
