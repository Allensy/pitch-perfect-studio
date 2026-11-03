import { Button, cn } from '@/components/ui/button';
import type { AppState, Runtime } from '@/domain/types';
import { Mic, Square } from 'lucide-react';

export function MicControls({ state, runtime }: { state: AppState; runtime: Runtime }) {
  const live = state.capture === 'listening' || state.capture === 'waiting';
  return (
    <>
      <div className="button-row mic-buttons">
        <Button
          variant={live ? 'danger' : 'primary'}
          onClick={() => (live ? runtime.stopAll() : runtime.startMic())}
        >
          {live ? <Square size={14} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
          {state.capture === 'waiting'
            ? 'Cancel microphone request'
            : state.capture === 'listening'
              ? 'Stop microphone'
              : state.capture === 'off'
                ? 'Start microphone'
                : 'Retry microphone'}
        </Button>
        <Button onClick={() => runtime.previewInput()} disabled={live}>
          Preview input
        </Button>
      </div>
      <p
        className={cn(
          'capture-message',
          ['denied', 'unavailable', 'interrupted'].includes(state.capture) && 'field-error',
        )}
        role="status"
      >
        {state.captureMessage ||
          'Microphone audio is processed locally. Use headphones so reference tones stay separate from your voice.'}
      </p>
      <p className="hint">
        Preview input is simulated and never earns XP, accuracy or target credit.
      </p>
    </>
  );
}
