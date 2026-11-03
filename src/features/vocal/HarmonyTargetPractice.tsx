import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/fields';
import { harmonyChallengeOptions, harmonyRootOptions } from '@/components/practice-options';
import { noteName, pitchLabel } from '@/domain/music';
import type { ChallengeId, Settings, VocalTarget } from '@/domain/types';
import type { PitchNotationSettings } from './contracts';
import { ArrowRight, Play, Square } from 'lucide-react';
import { MicControls, type MicrophoneControlsProps } from './MicrophoneControls';
import { PitchDisplay, type PitchDisplayProps } from './PitchDisplay';
import { HarmonyHelp } from './HarmonyHelp';

export interface HarmonyTargetPracticeProps {
  challengeId: ChallengeId;
  rootPolicy: Settings['harmony']['rootPolicy'];
  target: VocalTarget | null;
  targetCount: number;
  error: string | null;
  playing: boolean;
  rearm: boolean;
  settings: PitchNotationSettings;
  microphone: MicrophoneControlsProps;
  pitch: Omit<PitchDisplayProps, 'target' | 'tolerance' | 'free'>;
  onChallengeChange: (id: ChallengeId) => void;
  onRootPolicyChange: (policy: Settings['harmony']['rootPolicy']) => void;
  onEditSetup: () => void;
  onNext: () => void;
  onToggleBacking: () => void;
  onCue: () => void;
  onBlend: () => void;
  onRepeat: () => void;
}

export function HarmonyTargetPractice({
  challengeId,
  rootPolicy,
  target,
  targetCount,
  error,
  playing,
  rearm,
  settings,
  microphone,
  pitch,
  onChallengeChange,
  onRootPolicyChange,
  onEditSetup,
  onNext,
  onToggleBacking,
  onCue,
  onBlend,
  onRepeat,
}: HarmonyTargetPracticeProps) {
  const tonicOnly = rootPolicy === 'tonic';
  return (
    <>
      <HarmonyHelp />
      <div className="drill-row">
        <SelectField
          label="Harmony challenge"
          className=""
          value={challengeId}
          options={harmonyChallengeOptions}
          onChange={onChallengeChange}
        />
        <SelectField
          label="Root practice"
          className=""
          value={rootPolicy}
          options={harmonyRootOptions}
          onChange={onRootPolicyChange}
        />
      </div>
      {error && (
        <div className="notice notice-error" role="alert">
          <p>{error}</p>
          <Button onClick={onEditSetup}>Edit range or challenge</Button>
        </div>
      )}
      <div className="harmony-context">
        <div>
          <span>Reference root</span>
          <strong>{target ? pitchLabel(target.rootMidi, settings) : '—'}</strong>
        </div>
        <div>
          <span>Your target</span>
          <strong>{target ? pitchLabel(target.targetMidi, settings) : '—'}</strong>
        </div>
        <div>
          <span>Tolerance</span>
          <strong>±25 cents</strong>
        </div>
      </div>
      <div className="harmony-next">
        <div>
          <p className="hint">
            {targetCount} {targetCount === 1 ? 'target fits' : 'targets fit'} your range and
            challenge.
          </p>
          {targetCount < 2 && (
            <p className="hint">
              {targetCount === 0
                ? 'No target fits.'
                : 'Only one target fits, so there is nowhere to move.'}{' '}
              Edit your range
              {tonicOnly ? ' or try Notes in this key.' : ' or choose another challenge.'}
            </p>
          )}
        </div>
        <div className="harmony-next-actions">
          <Button variant="primary" onClick={onNext} disabled={targetCount < 2}>
            Next target <ArrowRight size={14} aria-hidden="true" />
          </Button>
          {targetCount < 2 && <Button onClick={onEditSetup}>Edit range</Button>}
          {tonicOnly && (
            <Button variant="ghost" onClick={() => onRootPolicyChange('scale')}>
              Vary notes in key
            </Button>
          )}
        </div>
      </div>
      <div className="reference-row">
        <Button onClick={onToggleBacking} disabled={!target}>
          {playing ? (
            <Square size={14} aria-hidden="true" />
          ) : (
            <Play size={14} aria-hidden="true" />
          )}
          {playing ? 'Stop backing' : 'Hold backing'}
        </Button>
        <Button onClick={onCue} disabled={!target}>
          Cue my note
        </Button>
        <Button onClick={onBlend} disabled={!target}>
          Preview full blend
        </Button>
      </div>
      <p className="hint">
        Backing voices: {target ? target.backingMidi.map(noteName).join(' · ') : '—'}. Backing
        register C2–C6 may use notes outside your sung range. References pause and reset the hold;
        previewing the blend never earns a lock.
      </p>
      <div className="tuner-well">
        <MicControls {...microphone} />
        <PitchDisplay {...pitch} target={target?.targetMidi} tolerance={25} />
        {rearm && (
          <Button variant="primary" onClick={onRepeat}>
            Repeat this target
          </Button>
        )}
      </div>
    </>
  );
}
