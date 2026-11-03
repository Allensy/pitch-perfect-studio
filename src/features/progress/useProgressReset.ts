import type { Runtime } from '@/domain/types';
import { useRef, useState } from 'react';

/** Own the reset confirmation transaction independently of progress presentation. */
export function useProgressReset(runtime: Pick<Runtime, 'stopAll' | 'resetProgress'>) {
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState('');
  const returnFocusRef = useRef<HTMLElement | null>(null);

  function requestReset() {
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement ? active : null;
    runtime.stopAll();
    setResult('');
    setConfirming(true);
  }

  function confirmReset() {
    const saved = runtime.resetProgress();
    setResult(
      saved
        ? 'Progress reset. Musical setup kept.'
        : 'Reset was not saved. Your previous progress has been kept.',
    );
    if (saved) setConfirming(false);
  }

  return { confirming, result, returnFocusRef, requestReset, confirmReset, setConfirming };
}
