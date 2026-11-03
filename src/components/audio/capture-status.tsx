import { Button } from '@/components/ui/button';
import type { CaptureStatus, Runtime } from '@/domain/types';
import { Square } from 'lucide-react';

type CaptureProps = {
  state: { capture: CaptureStatus };
  runtime: Pick<Runtime, 'stopAll'>;
};

export function captureLabel(status: CaptureStatus) {
  return {
    off: 'Microphone off',
    waiting: 'Waiting for permission',
    listening: 'Microphone on',
    denied: 'Permission denied',
    unavailable: 'Input unavailable',
    interrupted: 'Input interrupted',
  }[status];
}
export function CaptureIndicator({ state, runtime }: CaptureProps) {
  return state.capture === 'off' ? null : (
    <div className="capture-indicator">
      <span>
        <i />
        {captureLabel(state.capture)}
      </span>
      <Button size="small" variant="danger" onClick={() => runtime.stopAll()}>
        {state.capture === 'waiting' ? 'Cancel' : 'Stop all'}
      </Button>
    </div>
  );
}

export function MobileCapture({ state, runtime }: CaptureProps) {
  return state.capture === 'off' ? null : (
    <div className="mobile-capture">
      <span>{state.capture === 'listening' ? 'Microphone on' : captureLabel(state.capture)}</span>
      <Button size="small" variant="danger" onClick={() => runtime.stopAll()}>
        <Square size={12} aria-hidden="true" />
        {state.capture === 'waiting' ? 'Cancel' : 'Stop all'}
      </Button>
    </div>
  );
}
