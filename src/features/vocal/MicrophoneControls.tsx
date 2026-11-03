import { Button, cn } from '@/components/ui/button';
import type { CaptureStatus } from '@/domain/types';
import { Mic, Square } from 'lucide-react';

export interface MicrophoneControlsProps {
  status: CaptureStatus;
  message: string;
  onStart: () => void;
  onStop: () => void;
  onPreview: () => void;
}

export function MicControls({
  status,
  message,
  onStart,
  onStop,
  onPreview,
}: MicrophoneControlsProps) {
  const live = status === 'listening' || status === 'waiting';
  return (
    <>
      <div className="button-row mic-buttons">
        <Button variant={live ? 'danger' : 'primary'} onClick={live ? onStop : onStart}>
          {live ? <Square size={14} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
          {status === 'waiting'
            ? 'Cancel microphone request'
            : status === 'listening'
              ? 'Stop microphone'
              : status === 'off'
                ? 'Start microphone'
                : 'Retry microphone'}
        </Button>
        <Button onClick={onPreview} disabled={live}>
          Preview input
        </Button>
      </div>
      <p
        className={cn(
          'capture-message',
          ['denied', 'unavailable', 'interrupted'].includes(status) && 'field-error',
        )}
        role="status"
      >
        {message ||
          'Microphone audio is processed locally. Use headphones so reference tones stay separate from your voice.'}
      </p>
      <p className="hint">
        Preview input is simulated and never earns XP, accuracy or target credit.
      </p>
    </>
  );
}
