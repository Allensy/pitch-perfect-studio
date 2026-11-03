import { Button, cn } from '@/components/ui/button';
import { SelectField } from '@/components/ui/fields';
import { progressionOptions } from '@/components/practice-options';
import { changeHarmony } from './settings-actions';
import { progressionSteps } from '@/domain/exercises';
import { pitchLabel } from '@/domain/music';
import type { AppState, Runtime } from '@/domain/types';
import { Play, Square, Volume2 } from 'lucide-react';

export function Mixer({ runtime, state }: { runtime: Runtime; state: AppState }) {
  const steps = progressionSteps(
    state.settings.harmony.progressionId,
    state.settings.global.rootKey,
  );
  const step = steps[state.mixerStep] ?? steps[0];
  return (
    <div className="mixer">
      <div className="drill-row">
        <SelectField
          label="Progression"
          className=""
          value={state.settings.harmony.progressionId}
          options={progressionOptions}
          onChange={(progressionId) => changeHarmony(runtime, state.settings, { progressionId })}
        />
        <span className="practice-tag">Ungraded rehearsal</span>
      </div>
      <p className="mixer-guidance">Mute your part, then sing it against the other voices.</p>
      <div className="progression-steps" role="list" aria-label="Progression steps">
        {steps.map((item, i) => (
          <div
            key={i}
            role="listitem"
            className={cn('progression-step', i === state.mixerStep && 'selected')}
            aria-current={i === state.mixerStep ? 'step' : undefined}
          >
            <span>{i + 1}</span>
            <strong>{item.label}</strong>
          </div>
        ))}
      </div>
      <div className="button-row">
        <Button variant="primary" onClick={() => runtime.playProgression()}>
          <Play size={15} aria-hidden="true" />
          {state.mixerPlaying ? 'Replay progression' : 'Play progression'}
        </Button>
        <Button onClick={() => runtime.stopPlayback()} disabled={!state.mixerPlaying}>
          <Square size={14} aria-hidden="true" />
          Stop
        </Button>
      </div>
      <div className="voice-lanes">
        {['Soprano', 'Alto', 'Tenor', 'Bass'].map((voice, i) => (
          <section
            className={cn('voice-lane', state.settings.harmony.mutedVoices[i] && 'voice-muted')}
            key={voice}
          >
            <div className="voice-name">
              <h3>{voice}</h3>
              <span>{['S', 'A', 'T', 'B'][i]}</span>
            </div>
            <div className="voice-pitch">
              {step?.notes[i] == null ? '—' : pitchLabel(step.notes[i], state.settings)}
            </div>
            <Button
              aria-pressed={state.settings.harmony.mutedVoices[i] ?? false}
              onClick={() => runtime.toggleVoice(i)}
            >
              {state.settings.harmony.mutedVoices[i] ? 'You sing · muted' : 'Mute / You sing'}
            </Button>
            <Button variant="ghost" onClick={() => runtime.auditionVoice(i)}>
              Audition voice <Volume2 size={14} aria-hidden="true" />
            </Button>
          </section>
        ))}
      </div>
      <p className="hint">
        {state.mixerPlaying
          ? `Playing step ${state.mixerStep + 1} of ${steps.length}.`
          : 'Ready to rehearse.'}{' '}
        Displayed notes and voice auditions use the same progression step. Accompaniment register
        C2–C6. Mixer practice does not award pitch locks, quiz accuracy or XP.
      </p>
    </div>
  );
}
