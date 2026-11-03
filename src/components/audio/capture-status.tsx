import { Button } from '@/components/ui/button';
import type { CaptureStatus } from '@/domain/types';
import { Square } from 'lucide-react';

type CaptureProps = {
  status: CaptureStatus;
  onStop: () => void;
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
export function CaptureIndicator({ status, onStop }: CaptureProps) {
  return status === 'off' ? null : (
    <div className="capture-indicator">
      <span>
        <i />
        {captureLabel(status)}
      </span>
      <Button size="small" variant="danger" onClick={onStop}>
        {status === 'waiting' ? 'Cancel' : 'Stop all'}
      </Button>
    </div>
  );
}

export function MobileCapture({ status, onStop }: CaptureProps) {
  return status === 'off' ? null : (
    <div className="mobile-capture">
      <span>{status === 'listening' ? 'Microphone on' : captureLabel(status)}</span>
      <Button size="small" variant="danger" onClick={onStop}>
        <Square size={12} aria-hidden="true" />
        {status === 'waiting' ? 'Cancel' : 'Stop all'}
      </Button>
    </div>
  );
}
