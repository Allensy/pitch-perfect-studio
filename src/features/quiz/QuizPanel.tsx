import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, cn } from '@/components/ui/button';
import { CheckField } from '@/components/ui/fields';
import type { QuizProps } from './contracts';
import { ChordAnswers } from './ChordAnswers';
import { NoteAnswers } from './NoteAnswers';
import { IntervalAnswers } from './IntervalAnswers';
import { IntervalGuide } from './IntervalGuide';
import { QuizFeedback } from './QuizFeedback';
import { QuizPlayback } from './QuizPlayback';
import { quizItemNames } from './copy';

export function Quiz({
  mode,
  round,
  settings,
  onPlay,
  onReference,
  onSubmit,
  onNext,
  onOpenSetup,
  onNoteSettingsChange,
  onAudition,
  onAuditionInterval,
  keyboard,
}: QuizProps) {
  const [entryError, setEntryError] = useState('');
  useEffect(() => setEntryError(''), [round.id, mode]);
  const formKey = `${mode}:${round.id}`;
  return (
    <section
      className={cn('quiz', round.phase !== 'ready' && 'quiz-active')}
      aria-label={`${mode} practice`}
    >
      {round.error && (
        <div role="alert" className="notice notice-error">
          <p>{round.error}</p>
          <Button onClick={() => onOpenSetup()}>Edit range or exercise</Button>
        </div>
      )}
      <QuizPlayback
        mode={mode}
        round={round}
        settings={settings}
        onPlay={onPlay}
        onReference={onReference}
      />
      <div className="section-heading">
        <h2>Your answer</h2>
        {mode === 'notes' && (
          <CheckField
            label="Exact octave"
            checked={settings.notes.exactOctave}
            onChange={(exactOctave) => onNoteSettingsChange({ exactOctave })}
          />
        )}
      </div>
      {mode === 'notes' && (
        <NoteAnswers
          key={formKey}
          settings={settings}
          round={round}
          onSubmit={onSubmit}
          onError={setEntryError}
        />
      )}
      {mode === 'intervals' && (
        <IntervalAnswers settings={settings.intervals} round={round} onSubmit={onSubmit} />
      )}
      {mode === 'chords' && (
        <ChordAnswers
          key={formKey}
          settings={settings.chords}
          round={round}
          onSubmit={onSubmit}
          onError={setEntryError}
          onAudition={onAudition}
        />
      )}
      {entryError && (
        <p role="alert" className="field-error">
          {entryError}
        </p>
      )}
      <QuizFeedback round={round} onNext={onNext} />
      <div className="next-row">
        {mode === 'notes' ? (
          <CheckField
            label="Auto-advance"
            checked={settings.notes.autoNext}
            onChange={(autoNext) => onNoteSettingsChange({ autoNext })}
          />
        ) : (
          <span />
        )}
        <Button variant="ghost" onClick={onNext}>
          Skip {quizItemNames[mode]}
          <ArrowRight size={14} aria-hidden="true" />
        </Button>
      </div>
      {mode === 'notes' && keyboard}
      {mode === 'intervals' && <IntervalGuide onAudition={onAuditionInterval} />}
    </section>
  );
}
