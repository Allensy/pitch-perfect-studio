import { captureLabel } from '@/components/audio/capture-status';
import { Button, cn } from '@/components/ui/button';
import { SelectField } from '@/components/ui/fields';
import { tunerDrillOptions, tunerToleranceOptions } from './options';
import { changeTuner } from './settings-actions';
import { pitchLabel } from '@/domain/music';
import type { AppState, Runtime, Settings } from '@/domain/types';
import { MicControls } from '@/features/vocal/MicrophoneControls';
import { PitchDisplay } from '@/features/vocal/PitchDisplay';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
export function Tuner({ runtime, state }: { runtime: Runtime; state: AppState }) {
  const free = state.settings.tuner.drillMode === 'free';
  const target = state.queue[state.queueIndex];
  const change = (drillMode: Settings['tuner']['drillMode']) =>
    changeTuner(runtime, state.settings, { drillMode });
  return (
    <section aria-label="Tuner practice">
      <div className="mode-switch-row">
        <div className="segmented" role="group" aria-label="Tuner task">
          <Button aria-pressed={!free} onClick={() => change('target')}>
            Target practice
          </Button>
          <Button aria-pressed={free} onClick={() => change('free')}>
            Free tuner
          </Button>
        </div>
        {!free && (
          <Button variant="ghost" onClick={() => runtime.play()} disabled={target == null}>
            Hear target <ArrowUpRight size={14} aria-hidden="true" />
          </Button>
        )}
      </div>
      {!free && (
        <div className="drill-row">
          <SelectField
            label="Drill"
            className=""
            value={state.settings.tuner.drillMode}
            options={tunerDrillOptions}
            onChange={change}
          />
          <SelectField
            label="Tolerance"
            className=""
            value={state.settings.tuner.toleranceCents}
            options={tunerToleranceOptions}
            onChange={(toleranceCents) => changeTuner(runtime, state.settings, { toleranceCents })}
          />
        </div>
      )}
      {state.vocalError && (
        <div className="notice notice-error" role="alert">
          <p>{state.vocalError}</p>
          <Button onClick={() => runtime.setSetup(true)}>Edit range or drill</Button>
        </div>
      )}
      <div className="tuner-well">
        <div className="tuner-top">
          <span>
            {free ? (
              `Ungraded · A4 ${state.settings.global.a4} Hz`
            ) : (
              <>
                Target <strong>{target == null ? '—' : pitchLabel(target, state.settings)}</strong>
              </>
            )}
          </span>
          <span className={cn('input-status', state.capture === 'listening' && 'is-live')}>
            {captureLabel(state.capture)}
          </span>
        </div>
        <MicControls state={state} runtime={runtime} />
        <PitchDisplay
          runtime={runtime}
          state={state}
          free={free}
          target={target}
          tolerance={state.settings.tuner.toleranceCents}
        />
        {!free && (
          <div className="button-row">
            {state.rearm ? (
              <Button variant="primary" onClick={() => runtime.readyAgain()}>
                Repeat this target
              </Button>
            ) : null}
            <Button onClick={() => runtime.nextTarget()} disabled={!state.queue.length}>
              Next target <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
      {!free && (
        <section className="queue-section">
          <div className="section-heading">
            <h2>Up next</h2>
            <span>
              {state.queue.length
                ? `${state.queueIndex + 1} of ${state.queue.length}`
                : 'No targets'}
            </span>
          </div>
          <div className="queue">
            {state.queue.map((midi, i) => (
              <Button
                key={`${i}-${midi}`}
                aria-pressed={i === state.queueIndex}
                onClick={() => runtime.selectTarget(i)}
              >
                {pitchLabel(midi, state.settings)}
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
