import { useRef, useState } from 'react';

/** Own the reset confirmation transaction independently of progress presentation. */
export function useProgressReset(onStop: () => void, onReset: () => boolean) {
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState('');
  const returnFocusRef = useRef<HTMLElement | null>(null);

  function requestReset() {
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement ? active : null;
    onStop();
    setResult('');
    setConfirming(true);
  }

  function confirmReset() {
    const saved = onReset();
    setResult(
      saved
        ? 'Progress reset. Musical setup kept.'
        : 'Reset was not saved. Your previous progress has been kept.',
    );
    if (saved) setConfirming(false);
  }

  return { confirming, result, returnFocusRef, requestReset, confirmReset, setConfirming };
}
