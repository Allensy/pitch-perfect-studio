import type { PitchView } from '@/domain/types';

export function signedCents(cents: number) {
  return `${cents > 0 ? '+' : ''}${Math.round(cents)}¢`;
}

/** Keep gaps in the trace: silence is not a connecting line or a held pitch. */
export function pitchHistoryPath(history: PitchView['history'], center: number | null) {
  const points: string[] = [];
  const now = history[history.length - 1]?.time ?? 0;
  let drawing = false;
  for (const observation of history) {
    if (observation.midi === null || center === null || observation.time < now - 8000) {
      drawing = false;
      continue;
    }
    const x = Math.max(0, Math.min(640, ((observation.time - now + 8000) / 8000) * 640));
    const y = Math.max(2, Math.min(130, 66 - (observation.midi - center) * 45));
    points.push(`${drawing ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
    drawing = true;
  }
  return points.join(' ');
}

export function pitchPresentation(
  pitch: PitchView,
  free: boolean,
  target: number | undefined,
  tolerance: number,
) {
  const nearestMidi = pitch.midi === null ? null : Math.round(pitch.midi);
  const cents = free ? pitch.nearestCents : pitch.targetCents;
  const measured = pitch.frequency !== null && nearestMidi !== null;
  const meaning =
    cents === null
      ? 'No usable pitch'
      : Math.abs(cents) <= tolerance
        ? 'In tune'
        : cents < 0
          ? 'Flat'
          : 'Sharp';
  const beyond = cents !== null && Math.abs(cents) > 50;
  const center = free ? nearestMidi : (target ?? null);
  return {
    nearestMidi,
    cents,
    measured,
    meaning,
    beyond,
    center,
    historyPath: pitchHistoryPath(pitch.history, center),
  };
}
