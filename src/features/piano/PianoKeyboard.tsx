import { Button, cn } from '@/components/ui/button';
import { pianoKeys } from './piano-model';
import type { AppState, Runtime, Settings } from '@/domain/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Piano({
  runtime,
  state,
  answerable,
}: {
  runtime: Runtime;
  state: AppState;
  answerable: boolean;
}) {
  const { octave, inputMode: action } = state.settings.piano;
  const updatePiano = (patch: Partial<Settings['piano']>) =>
    runtime.applySettings({ ...state.settings, piano: { ...state.settings.piano, ...patch } });
  return (
    <details className="disclosure piano-disclosure">
      <summary>
        Keyboard <span>Optional audition or answer</span>
      </summary>
      <div className="piano-tools">
        <div className="segmented" role="group" aria-label="Keyboard action">
          {(['audition', 'answer'] as const).map((value) => (
            <Button
              key={value}
              aria-pressed={action === value}
              onClick={() => updatePiano({ inputMode: value })}
            >
              {value === 'audition' ? 'Audition' : 'Answer'}
            </Button>
          ))}
        </div>
        <div className="octave-controls">
          <Button
            size="icon"
            aria-label="Previous keyboard octave"
            disabled={octave <= 2}
            onClick={() => updatePiano({ octave: octave - 1 })}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </Button>
          <span>Octave {octave}</span>
          <Button
            size="icon"
            aria-label="Next keyboard octave"
            disabled={octave >= 6}
            onClick={() => updatePiano({ octave: octave + 1 })}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="piano-scroll">
        <div className="piano" role="group" aria-label={`Octave ${octave} piano`}>
          {pianoKeys(state.settings, answerable).map((key) => (
            <button
              style={{ left: key.left }}
              key={key.midi}
              className={cn('piano-key', key.black && 'piano-black', key.inPool && 'piano-active')}
              type="button"
              disabled={key.disabled}
              aria-label={key.accessibleLabel}
              onClick={() =>
                action === 'answer'
                  ? runtime.submit({ pitchClass: key.pitchClass, midi: key.midi })
                  : runtime.audition(key.midi)
              }
            >
              {key.name}
              <small>{octave}</small>
            </button>
          ))}
        </div>
      </div>
      <p className="hint">
        {action === 'audition'
          ? 'Audition provides a reference. It never submits an answer.'
          : 'Answer submits the exact note and octave.'}{' '}
        Highlighted notes belong to your active range and scale.
      </p>
    </details>
  );
}
