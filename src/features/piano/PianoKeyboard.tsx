import { Button, cn } from '@/components/ui/button';
import { pianoKeys } from './piano-model';
import type { Answer, Settings } from '@/domain/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Piano({
  settings,
  answerable,
  onPreferencesChange,
  onAnswer,
  onAudition,
}: {
  settings: Pick<Settings, 'global' | 'piano'>;
  answerable: boolean;
  onPreferencesChange: (patch: Partial<Settings['piano']>) => void;
  onAnswer: (answer: Answer) => void;
  onAudition: (midi: number) => void;
}) {
  const { octave, inputMode: action } = settings.piano;
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
              onClick={() => onPreferencesChange({ inputMode: value })}
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
            onClick={() => onPreferencesChange({ octave: octave - 1 })}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </Button>
          <span>Octave {octave}</span>
          <Button
            size="icon"
            aria-label="Next keyboard octave"
            disabled={octave >= 6}
            onClick={() => onPreferencesChange({ octave: octave + 1 })}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="piano-scroll">
        <div className="piano" role="group" aria-label={`Octave ${octave} piano`}>
          {pianoKeys(settings, answerable).map((key) => (
            <button
              style={{ left: key.left }}
              key={key.midi}
              className={cn('piano-key', key.black && 'piano-black', key.inPool && 'piano-active')}
              type="button"
              disabled={key.disabled}
              aria-label={key.accessibleLabel}
              onClick={() =>
                action === 'answer'
                  ? onAnswer({ pitchClass: key.pitchClass, midi: key.midi })
                  : onAudition(key.midi)
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
