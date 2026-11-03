import { availableHarmonyTargets, progressionSteps } from '@/domain/exercises';
import type { AppState, Runtime, Settings } from '@/domain/types';
import { Harmony } from '@/features/vocal/HarmonyPanel';
import { Tuner } from '@/features/vocal/TunerPanel';
import type { MicrophoneControlsProps } from '@/features/vocal/MicrophoneControls';
import type { PitchDisplayProps } from '@/features/vocal/PitchDisplay';

type ConnectedProps = { state: AppState; runtime: Runtime };

function microphoneControls(state: AppState, runtime: Runtime): MicrophoneControlsProps {
  return {
    status: state.capture,
    message: state.captureMessage,
    onStart: () => runtime.startMic(),
    onStop: () => runtime.stopAll(),
    onPreview: () => runtime.previewInput(),
  };
}

function pitchDisplay(
  state: AppState,
  runtime: Runtime,
): Omit<PitchDisplayProps, 'target' | 'free' | 'tolerance'> {
  return {
    source: runtime.pitch,
    settings: {
      global: { notation: state.settings.global.notation, rootKey: state.settings.global.rootKey },
    },
    status: state.capture,
    rearm: state.rearm,
    complete: state.targetComplete,
  };
}

/** App adapters own settings dispatch and service orchestration; views only receive data and actions. */
export function ConnectedHarmony({ state, runtime }: ConnectedProps) {
  const { settings } = state;
  const change = (patch: Partial<Settings['harmony']>) =>
    runtime.applySettings({ ...settings, harmony: { ...settings.harmony, ...patch } });
  const pitch = pitchDisplay(state, runtime);
  return (
    <Harmony
      activity={settings.harmony.submode}
      onActivityChange={(submode) => change({ submode })}
      targetPractice={{
        challengeId: settings.harmony.challengeId,
        rootPolicy: settings.harmony.rootPolicy,
        target: state.vocal,
        targetCount: availableHarmonyTargets(settings).length,
        error: state.vocalError,
        playing: state.playing,
        rearm: state.rearm,
        settings: pitch.settings,
        microphone: microphoneControls(state, runtime),
        pitch,
        onChallengeChange: (challengeId) => change({ challengeId }),
        onRootPolicyChange: (rootPolicy) => change({ rootPolicy }),
        onEditSetup: () => runtime.setSetup(true),
        onNext: () => runtime.newReference(),
        onToggleBacking: () => (state.playing ? runtime.stopPlayback() : runtime.play()),
        onCue: () => {
          if (state.vocal) runtime.audition(state.vocal.targetMidi);
        },
        onBlend: () => runtime.playBlend(),
        onRepeat: () => runtime.readyAgain(),
      }}
      mixerPractice={{
        progressionId: settings.harmony.progressionId,
        steps: progressionSteps(settings.harmony.progressionId, settings.global.rootKey),
        stepIndex: state.mixerStep,
        playing: state.mixerPlaying,
        mutedVoices: settings.harmony.mutedVoices,
        settings: pitch.settings,
        onProgressionChange: (progressionId) => change({ progressionId }),
        onPlay: () => runtime.playProgression(),
        onStop: () => runtime.stopPlayback(),
        onToggleVoice: (index) => runtime.toggleVoice(index),
        onAuditionVoice: (index) => runtime.auditionVoice(index),
      }}
    />
  );
}

export function ConnectedTuner({ state, runtime }: ConnectedProps) {
  const { settings } = state;
  const change = (patch: Partial<Settings['tuner']>) =>
    runtime.applySettings({ ...settings, tuner: { ...settings.tuner, ...patch } });
  const pitch = pitchDisplay(state, runtime);
  return (
    <Tuner
      drillMode={settings.tuner.drillMode}
      tolerance={settings.tuner.toleranceCents}
      a4={settings.global.a4}
      queue={state.queue}
      queueIndex={state.queueIndex}
      error={state.vocalError}
      rearm={state.rearm}
      settings={pitch.settings}
      microphone={microphoneControls(state, runtime)}
      pitch={pitch}
      onDrillChange={(drillMode) => change({ drillMode })}
      onToleranceChange={(toleranceCents) => change({ toleranceCents })}
      onHearTarget={() => runtime.play()}
      onEditSetup={() => runtime.setSetup(true)}
      onRepeat={() => runtime.readyAgain()}
      onNext={() => runtime.nextTarget()}
      onSelectTarget={(index) => runtime.selectTarget(index)}
    />
  );
}
