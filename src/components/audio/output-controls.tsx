import { Button } from '@/components/ui/button';
import type { AppState, Runtime } from '@/domain/types';
import { Volume2, VolumeX } from 'lucide-react';
import { useId } from 'react';

export function Output({
  state,
  runtime,
}: {
  state: Pick<AppState, 'volume' | 'muted'>;
  runtime: Pick<Runtime, 'setOutput'>;
}) {
  const id = useId();
  return (
    <div className="output">
      <div className="output-row">
        <Button
          variant="ghost"
          onClick={() => runtime.setOutput(state.volume, !state.muted)}
          aria-pressed={state.muted}
        >
          {state.muted ? (
            <VolumeX size={16} aria-hidden="true" />
          ) : (
            <Volume2 size={16} aria-hidden="true" />
          )}
          {state.muted ? 'Unmute output' : 'Mute output'}
        </Button>
        <label className="sr-only" htmlFor={id}>
          Output volume
        </label>
        <input
          id={id}
          type="range"
          min="0"
          max="100"
          value={state.volume}
          aria-valuetext={`${state.volume}%${state.muted ? ', muted' : ''}`}
          onChange={(event) => runtime.setOutput(Number(event.target.value), state.muted)}
        />
        <span>{state.volume}%</span>
      </div>
      <p>Output only. Muting sound does not stop the microphone.</p>
    </div>
  );
}
