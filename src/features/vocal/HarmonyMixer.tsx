import { Button, cn } from '@/components/ui/button';
import { SelectField } from '@/components/ui/fields';
import { progressionOptions } from '@/components/practice-options';
import { pitchLabel } from '@/domain/music';
import type { ProgressionId, ProgressionStep } from '@/domain/types';
import type { PitchNotationSettings } from './contracts';
import { Play, Square, Volume2 } from 'lucide-react';

export interface HarmonyMixerProps {
  progressionId: ProgressionId;
  steps: readonly ProgressionStep[];
  stepIndex: number;
  playing: boolean;
  mutedVoices: readonly boolean[];
  settings: PitchNotationSettings;
  onProgressionChange: (id: ProgressionId) => void;
  onPlay: () => void;
  onStop: () => void;
  onToggleVoice: (voice: number) => void;
  onAuditionVoice: (voice: number) => void;
}

export function Mixer({
  progressionId,
  steps,
  stepIndex,
  playing,
  mutedVoices,
  settings,
  onProgressionChange,
  onPlay,
  onStop,
  onToggleVoice,
  onAuditionVoice,
}: HarmonyMixerProps) {
  const step = steps[stepIndex] ?? steps[0];
  return (
    <div className="mixer">
      <div className="drill-row">
        <SelectField
          label="Progression"
          className=""
          value={progressionId}
          options={progressionOptions}
          onChange={onProgressionChange}
        />
        <span className="practice-tag">Ungraded rehearsal</span>
      </div>
      <p className="mixer-guidance">Mute your part, then sing it against the other voices.</p>
      <div className="progression-steps" role="list" aria-label="Progression steps">
        {steps.map((item, i) => (
          <div
            key={i}
            role="listitem"
            className={cn('progression-step', i === stepIndex && 'selected')}
            aria-current={i === stepIndex ? 'step' : undefined}
          >
            <span>{i + 1}</span>
            <strong>{item.label}</strong>
          </div>
        ))}
      </div>
      <div className="button-row">
        <Button variant="primary" onClick={onPlay}>
          <Play size={15} aria-hidden="true" />
          {playing ? 'Replay progression' : 'Play progression'}
        </Button>
        <Button onClick={onStop} disabled={!playing}>
          <Square size={14} aria-hidden="true" />
          Stop
        </Button>
      </div>
      <div className="voice-lanes">
        {['Soprano', 'Alto', 'Tenor', 'Bass'].map((voice, i) => (
          <section className={cn('voice-lane', mutedVoices[i] && 'voice-muted')} key={voice}>
            <div className="voice-name">
              <h3>{voice}</h3>
              <span>{['S', 'A', 'T', 'B'][i]}</span>
            </div>
            <div className="voice-pitch">
              {step?.notes[i] == null ? '—' : pitchLabel(step.notes[i], settings)}
            </div>
            <Button aria-pressed={mutedVoices[i] ?? false} onClick={() => onToggleVoice(i)}>
              {mutedVoices[i] ? 'You sing · muted' : 'Mute / You sing'}
            </Button>
            <Button variant="ghost" onClick={() => onAuditionVoice(i)}>
              Audition voice <Volume2 size={14} aria-hidden="true" />
            </Button>
          </section>
        ))}
      </div>
      <p className="hint">
        {playing ? `Playing step ${stepIndex + 1} of ${steps.length}.` : 'Ready to rehearse.'}{' '}
        Displayed notes and voice auditions use the same progression step. Accompaniment register
        C2–C6. Mixer practice does not award pitch locks, quiz accuracy or XP.
      </p>
    </div>
  );
}
