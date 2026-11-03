import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, cn } from '@/components/ui/button';
import { CheckField } from '@/components/ui/fields';
import type { AppState, QuizMode, Runtime } from '@/domain/types';
import { Piano } from '@/features/piano/PianoKeyboard';
import { ChordAnswers } from './ChordAnswers';
import { NoteAnswers } from './NoteAnswers';
import { IntervalAnswers } from './IntervalAnswers';
import { IntervalGuide } from './IntervalGuide';
import { QuizFeedback } from './QuizFeedback';
import { QuizPlayback } from './QuizPlayback';

export function Quiz({
  runtime,
  state,
  mode,
}: {
  runtime: Runtime;
  state: AppState;
  mode: QuizMode;
}) {
  const round = state.rounds[mode];
  const [entryError, setEntryError] = useState('');
  useEffect(() => setEntryError(''), [round.id, mode]);
  const answerable = round.phase === 'awaiting' || round.phase === 'retry';
  const formKey = `${mode}:${round.id}`;
  return (
    <section
      className={cn('quiz', round.phase !== 'ready' && 'quiz-active')}
      aria-label={`${mode} practice`}
    >
      {round.error && (
        <div role="alert" className="notice notice-error">
          <p>{round.error}</p>
          <Button onClick={() => runtime.setSetup(true)}>Edit range or exercise</Button>
        </div>
      )}
      <QuizPlayback
        mode={mode}
        round={round}
        settings={state.settings}
        onPlay={runtime.play}
        onReference={runtime.reference}
      />
      <div className="section-heading">
        <h2>Your answer</h2>
        {mode === 'notes' && (
          <CheckField
            label="Exact octave"
            checked={state.settings.notes.exactOctave}
            onChange={(exactOctave) =>
              runtime.applySettings({
                ...state.settings,
                notes: { ...state.settings.notes, exactOctave },
              })
            }
          />
        )}
      </div>
      {mode === 'notes' && (
        <NoteAnswers
          key={formKey}
          settings={state.settings}
          round={round}
          onSubmit={runtime.submit}
          onError={setEntryError}
        />
      )}
      {mode === 'intervals' && (
        <IntervalAnswers
          settings={state.settings.intervals}
          round={round}
          onSubmit={runtime.submit}
        />
      )}
      {mode === 'chords' && (
        <ChordAnswers
          key={formKey}
          settings={state.settings.chords}
          round={round}
          onSubmit={runtime.submit}
          onError={setEntryError}
          onAudition={runtime.audition}
        />
      )}
      {entryError && (
        <p role="alert" className="field-error">
          {entryError}
        </p>
      )}
      <QuizFeedback round={round} onNext={runtime.next} />
      <div className="next-row">
        {mode === 'notes' ? (
          <CheckField
            label="Auto-advance"
            checked={state.settings.notes.autoNext}
            onChange={(autoNext) =>
              runtime.applySettings({
                ...state.settings,
                notes: { ...state.settings.notes, autoNext },
              })
            }
          />
        ) : (
          <span />
        )}
        <Button variant="ghost" onClick={runtime.next}>
          Skip {mode === 'notes' ? 'note' : mode === 'intervals' ? 'interval' : 'chord'}{' '}
          <ArrowRight size={14} aria-hidden="true" />
        </Button>
      </div>
      {mode === 'notes' && <Piano runtime={runtime} state={state} answerable={answerable} />}
      {mode === 'intervals' && <IntervalGuide onAudition={runtime.auditionInterval} />}
    </section>
  );
}
