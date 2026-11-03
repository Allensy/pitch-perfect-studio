import type { AppState, QuizMode, Runtime } from '@/domain/types';
import { Piano } from '@/features/piano/PianoKeyboard';
import { Quiz } from '@/features/quiz/QuizPanel';

/** Application adapter: maps runtime commands and a snapshot into feature contracts. */
export function ConnectedQuiz({
  state,
  runtime,
  mode,
}: {
  state: AppState;
  runtime: Runtime;
  mode: QuizMode;
}) {
  const round = state.rounds[mode];
  const settings = state.settings;
  const answerable = round.phase === 'awaiting' || round.phase === 'retry';
  return (
    <Quiz
      mode={mode}
      round={round}
      settings={settings}
      onPlay={runtime.play}
      onReference={runtime.reference}
      onSubmit={runtime.submit}
      onNext={runtime.next}
      onOpenSetup={() => runtime.setSetup(true)}
      onNoteSettingsChange={(patch) =>
        runtime.applySettings({ ...settings, notes: { ...settings.notes, ...patch } })
      }
      onAudition={runtime.audition}
      onAuditionInterval={runtime.auditionInterval}
      keyboard={
        mode === 'notes' ? (
          <Piano
            settings={settings}
            answerable={answerable}
            onPreferencesChange={(patch) =>
              runtime.applySettings({ ...settings, piano: { ...settings.piano, ...patch } })
            }
            onAnswer={runtime.submit}
            onAudition={runtime.audition}
          />
        ) : undefined
      }
    />
  );
}
