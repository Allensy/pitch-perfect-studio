import { cn } from '@/components/ui/button';
import { noteName, pitchLabel } from '@/domain/music';
import type { CaptureStatus, PitchView, Source } from '@/domain/types';
import type { PitchNotationSettings } from './contracts';
import { useSyncExternalStore } from 'react';
import { pitchPresentation, signedCents } from './pitch-presentation';
import { PitchHistoryChart } from './PitchHistoryChart';
import { PitchHoldProgress } from './PitchHoldProgress';

export interface PitchDisplayProps {
  source: Source<PitchView>;
  settings: PitchNotationSettings;
  status: CaptureStatus;
  free?: boolean;
  target?: number;
  tolerance: number;
  rearm: boolean;
  complete: boolean;
}

export function PitchDisplay({
  source,
  settings,
  status,
  free = false,
  target,
  tolerance,
  rearm,
  complete,
}: PitchDisplayProps) {
  const pitch = useSyncExternalStore(source.subscribe, source.getSnapshot);
  const view = pitchPresentation(pitch, free, target, tolerance);
  const { nearestMidi, cents, measured, meaning, beyond } = view;
  return (
    <div className="pitch-display">
      <div className="pitch-reading">
        <div className="pitch-note">
          {measured && nearestMidi !== null ? pitchLabel(nearestMidi, settings) : '—'}
        </div>
        <p>
          {measured
            ? `${pitch.frequency?.toFixed(1)} Hz · nearest note ${pitch.nearestCents === null ? '—' : signedCents(pitch.nearestCents)}`
            : status === 'listening'
              ? 'Sing one steady note. Your reading will appear here.'
              : 'A steady note starts here.'}
        </p>
        <strong
          className={cn(
            'pitch-meaning',
            measured && Math.abs(cents ?? 1000) <= tolerance && 'in-tune',
          )}
        >
          {meaning}
          {pitch.preview ? ' · preview, no credit' : ''}
        </strong>
      </div>
      <div
        className="meter"
        role="img"
        aria-label={`${free ? 'Nearest-note' : 'Exact-target'} pitch error: ${cents === null ? 'no current reading' : signedCents(cents)}${beyond ? ', beyond displayed 50-cent window' : ''}`}
      >
        <div className="meter-track" />
        <div
          className="meter-zone"
          style={{ left: `${50 - tolerance}%`, width: `${tolerance * 2}%` }}
        />
        <div className="meter-center" />
        {cents !== null && (
          <div
            className="meter-pointer"
            style={{ left: `${Math.max(0, Math.min(100, cents + 50))}%` }}
          />
        )}
      </div>
      <div className="meter-labels" aria-hidden="true">
        <span>−50</span>
        <span>−25</span>
        <span>0</span>
        <span>+25</span>
        <span>+50¢</span>
      </div>
      <p className="tolerance-copy">
        {free
          ? `Nearest-note guidance ±${tolerance} cents · ungraded`
          : `Exact target ${target == null ? '—' : noteName(target)} · ${cents === null ? 'waiting for pitch' : signedCents(cents)}${beyond ? ' · beyond meter window' : ''}`}
      </p>
      {!free && (
        <PitchHoldProgress
          hold={pitch.hold}
          preview={pitch.preview}
          rearm={rearm}
          complete={complete}
          tolerance={tolerance}
        />
      )}
      <PitchHistoryChart
        center={view.center}
        meaning={meaning}
        beyond={beyond}
        historyPath={view.historyPath}
      />
    </div>
  );
}
