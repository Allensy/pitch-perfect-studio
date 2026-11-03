import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/fields';
import { harmonyChallengeOptions, harmonyRootOptions } from '@/components/practice-options';
import { availableHarmonyTargets } from '@/domain/exercises';
import { noteName, pitchLabel } from '@/domain/music';
import type { AppState, Runtime } from '@/domain/types';
import { ArrowRight, Play, Square } from 'lucide-react';
import { MicControls } from './MicrophoneControls';
import { PitchDisplay } from './PitchDisplay';
import { HarmonyHelp } from './HarmonyHelp';
import { changeHarmony } from './settings-actions';

export function HarmonyTargetPractice({ state, runtime }: { state: AppState; runtime: Runtime }) {
  const targetCount = availableHarmonyTargets(state.settings).length;
  const tonicOnly = state.settings.harmony.rootPolicy === 'tonic';
  return (
    <>
      <HarmonyHelp />
      <div className="drill-row">
        <SelectField
          label="Harmony challenge"
          className=""
          value={state.settings.harmony.challengeId}
          options={harmonyChallengeOptions}
          onChange={(challengeId) => changeHarmony(runtime, state.settings, { challengeId })}
        />
        <SelectField
          label="Root practice"
          className=""
          value={state.settings.harmony.rootPolicy}
          options={harmonyRootOptions}
          onChange={(rootPolicy) => changeHarmony(runtime, state.settings, { rootPolicy })}
        />
      </div>
      {state.vocalError && (
        <div className="notice notice-error" role="alert">
          <p>{state.vocalError}</p>
          <Button onClick={() => runtime.setSetup(true)}>Edit range or challenge</Button>
        </div>
      )}
      <div className="harmony-context">
        <div>
          <span>Reference root</span>
          <strong>{state.vocal ? pitchLabel(state.vocal.rootMidi, state.settings) : '—'}</strong>
        </div>
        <div>
          <span>Your target</span>
          <strong>{state.vocal ? pitchLabel(state.vocal.targetMidi, state.settings) : '—'}</strong>
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
          <Button
            variant="primary"
            onClick={() => runtime.newReference()}
            disabled={targetCount < 2}
          >
            Next target <ArrowRight size={14} aria-hidden="true" />
          </Button>
          {targetCount < 2 && <Button onClick={() => runtime.setSetup(true)}>Edit range</Button>}
          {tonicOnly && (
            <Button
              variant="ghost"
              onClick={() => changeHarmony(runtime, state.settings, { rootPolicy: 'scale' })}
            >
              Vary notes in key
            </Button>
          )}
        </div>
      </div>
      <div className="reference-row">
        <Button
          onClick={() => (state.playing ? runtime.stopPlayback() : runtime.play())}
          disabled={!state.vocal}
        >
          {state.playing ? (
            <Square size={14} aria-hidden="true" />
          ) : (
            <Play size={14} aria-hidden="true" />
          )}
          {state.playing ? 'Stop backing' : 'Hold backing'}
        </Button>
        <Button
          onClick={() => {
            if (state.vocal) runtime.audition(state.vocal.targetMidi);
          }}
          disabled={!state.vocal}
        >
          Cue my note
        </Button>
        <Button onClick={() => runtime.playBlend()} disabled={!state.vocal}>
          Preview full blend
        </Button>
      </div>
      <p className="hint">
        Backing voices: {state.vocal ? state.vocal.backingMidi.map(noteName).join(' · ') : '—'}.
        Backing register C2–C6 may use notes outside your sung range. References pause and reset the
        hold; previewing the blend never earns a lock.
      </p>
      <div className="tuner-well">
        <MicControls state={state} runtime={runtime} />
        <PitchDisplay
          runtime={runtime}
          state={state}
          target={state.vocal?.targetMidi}
          tolerance={25}
        />
        {state.rearm && (
          <Button variant="primary" onClick={() => runtime.readyAgain()}>
            Repeat this target
          </Button>
        )}
      </div>
    </>
  );
}
