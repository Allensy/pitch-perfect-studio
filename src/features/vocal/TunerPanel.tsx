import { captureLabel } from '@/components/audio/capture-status';
import { Button, cn } from '@/components/ui/button';
import { SelectField } from '@/components/ui/fields';
import { tunerDrillOptions, tunerToleranceOptions } from './options';
import { pitchLabel } from '@/domain/music';
import type { Settings } from '@/domain/types';
import type { PitchNotationSettings } from './contracts';
import { MicControls, type MicrophoneControlsProps } from './MicrophoneControls';
import { PitchDisplay, type PitchDisplayProps } from './PitchDisplay';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
export interface TunerProps {
  drillMode: Settings['tuner']['drillMode'];
  tolerance: Settings['tuner']['toleranceCents'];
  a4: number;
  queue: readonly number[];
  queueIndex: number;
  error: string | null;
  rearm: boolean;
  settings: PitchNotationSettings;
  microphone: MicrophoneControlsProps;
  pitch: Omit<PitchDisplayProps, 'target' | 'tolerance' | 'free'>;
  onDrillChange: (mode: Settings['tuner']['drillMode']) => void;
  onToleranceChange: (cents: Settings['tuner']['toleranceCents']) => void;
  onHearTarget: () => void;
  onEditSetup: () => void;
  onRepeat: () => void;
  onNext: () => void;
  onSelectTarget: (index: number) => void;
}

export function Tuner({
  drillMode,
  tolerance,
  a4,
  queue,
  queueIndex,
  error,
  rearm,
  settings,
  microphone,
  pitch,
  onDrillChange,
  onToleranceChange,
  onHearTarget,
  onEditSetup,
  onRepeat,
  onNext,
  onSelectTarget,
}: TunerProps) {
  const free = drillMode === 'free';
  const target = queue[queueIndex];
  return (
    <section aria-label="Tuner practice">
      <div className="mode-switch-row">
        <div className="segmented" role="group" aria-label="Tuner task">
          <Button aria-pressed={!free} onClick={() => onDrillChange('target')}>
            Target practice
          </Button>
          <Button aria-pressed={free} onClick={() => onDrillChange('free')}>
            Free tuner
          </Button>
        </div>
        {!free && (
          <Button variant="ghost" onClick={onHearTarget} disabled={target == null}>
            Hear target <ArrowUpRight size={14} aria-hidden="true" />
          </Button>
        )}
      </div>
      {!free && (
        <div className="drill-row">
          <SelectField
            label="Drill"
            className=""
            value={drillMode}
            options={tunerDrillOptions}
            onChange={onDrillChange}
          />
          <SelectField
            label="Tolerance"
            className=""
            value={tolerance}
            options={tunerToleranceOptions}
            onChange={onToleranceChange}
          />
        </div>
      )}
      {error && (
        <div className="notice notice-error" role="alert">
          <p>{error}</p>
          <Button onClick={onEditSetup}>Edit range or drill</Button>
        </div>
      )}
      <div className="tuner-well">
        <div className="tuner-top">
          <span>
            {free ? (
              `Ungraded · A4 ${a4} Hz`
            ) : (
              <>
                Target <strong>{target == null ? '—' : pitchLabel(target, settings)}</strong>
              </>
            )}
          </span>
          <span className={cn('input-status', microphone.status === 'listening' && 'is-live')}>
            {captureLabel(microphone.status)}
          </span>
        </div>
        <MicControls {...microphone} />
        <PitchDisplay {...pitch} free={free} target={target} tolerance={tolerance} />
        {!free && (
          <div className="button-row">
            {rearm ? (
              <Button variant="primary" onClick={onRepeat}>
                Repeat this target
              </Button>
            ) : null}
            <Button onClick={onNext} disabled={!queue.length}>
              Next target <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
      {!free && (
        <section className="queue-section">
          <div className="section-heading">
            <h2>Up next</h2>
            <span>{queue.length ? `${queueIndex + 1} of ${queue.length}` : 'No targets'}</span>
          </div>
          <div className="queue">
            {queue.map((midi, i) => (
              <Button
                key={`${i}-${midi}`}
                aria-pressed={i === queueIndex}
                onClick={() => onSelectTarget(i)}
              >
                {pitchLabel(midi, settings)}
              </Button>
            ))}
          </div>
          <p className="hint">
            Selecting or skipping a target never earns progress. Use Hear target to audition it.
          </p>
        </section>
      )}
    </section>
  );
}
