import type { AppState, Runtime } from '@/domain/types';
import { Help } from '@/features/context/MusicalContext';
import { SetupSummary } from '@/features/context/SetupSummary';
import { Progress } from '@/features/progress/ProgressPanel';
import { Setup } from '@/features/setup/SetupDialog';
import type { RefObject } from 'react';

interface WorkspaceConnection {
  state: AppState;
  runtime: Runtime;
}

/** Composition adapters translate app ownership into each view's explicit inputs. */
export function ConnectedSetup({
  state,
  runtime,
  returnFocusRef,
}: WorkspaceConnection & {
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  return (
    <Setup
      settings={state.settings}
      mode={state.mode}
      open={state.setupOpen}
      captureStatus={state.capture}
      canStop={state.capture !== 'off' || state.playing || state.mixerPlaying}
      volume={state.volume}
      muted={state.muted}
      onApply={runtime.applySettings}
      onOpenChange={runtime.setSetup}
      onStop={runtime.stopAll}
      onOutputChange={runtime.setOutput}
      returnFocusRef={returnFocusRef}
    />
  );
}

export function ConnectedProgress({ state, runtime }: WorkspaceConnection) {
  return (
    <Progress
      progress={state.envelope.progress}
      legacy={state.envelope.legacyImport.snapshot}
      mode={state.mode}
      onStop={runtime.stopAll}
      onReset={runtime.resetProgress}
    />
  );
}

export function ConnectedSetupSummary({ state, runtime }: WorkspaceConnection) {
  return (
    <SetupSummary
      settings={state.settings.global}
      volume={state.volume}
      muted={state.muted}
      onOpenSetup={() => runtime.setSetup(true)}
      onOutputChange={runtime.setOutput}
    />
  );
}

export function ConnectedHelp({ state }: { state: AppState }) {
  return <Help mode={state.mode} />;
}
