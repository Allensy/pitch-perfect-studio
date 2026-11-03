import { ConnectedQuiz } from './QuizPractice';
import { ConnectedHarmony, ConnectedTuner } from './VocalPractice';
import {
  ConnectedHelp,
  ConnectedProgress,
  ConnectedSetupSummary,
  ConnectedSetup,
} from './WorkspacePanels';
import { modes } from '@/app/navigation';
import { AppHeader } from './AppHeader';
import { ModeNavigation } from './ModeNavigation';
import { PracticeHeading } from './PracticeHeading';
import { MobileCapture } from '@/components/audio/capture-status';
import { Button, cn } from '@/components/ui/button';
import type { Runtime } from '@/domain/types';
import * as Tabs from '@radix-ui/react-tabs';
import { useMemo, useRef, useSyncExternalStore } from 'react';
export function Studio({ runtime: controller }: { runtime: Runtime }) {
  const setupReturnFocusRef = useRef<HTMLElement | null>(null);
  const runtime = useMemo<Runtime>(
    () => ({
      ...controller,
      setSetup(open) {
        if (open) {
          const active = document.activeElement;
          setupReturnFocusRef.current = active instanceof HTMLElement ? active : null;
        }
        controller.setSetup(open);
      },
    }),
    [controller],
  );
  const state = useSyncExternalStore(runtime.state.subscribe, runtime.state.getSnapshot);
  return (
    <Tabs.Root
      value={state.mode}
      onValueChange={(value) => {
        const mode = modes.find((mode) => mode.id === value);
        if (mode) runtime.setMode(mode.id);
      }}
      activationMode="manual"
      className="studio-app"
    >
      <a href="#practice" className="skip-link">
        Skip to practice
      </a>
      <AppHeader state={state} runtime={runtime} />
      <ModeNavigation />
      <main id="practice" className={cn('page-content', state.capture !== 'off' && 'has-capture')}>
        <PracticeHeading state={state} />
        {state.storageMessage && (
          <div className="notice" role="status">
            <span>{state.storageMessage}</span>
            <Button size="small" onClick={() => runtime.retrySave()}>
              Retry save
            </Button>
          </div>
        )}
        <div className="practice-grid">
          <div className="practice-main">
            <Tabs.Content value={state.mode} className="mode-content" tabIndex={-1}>
              {state.mode === 'notes' || state.mode === 'intervals' || state.mode === 'chords' ? (
                <ConnectedQuiz runtime={runtime} state={state} mode={state.mode} />
              ) : state.mode === 'harmony' ? (
                <ConnectedHarmony runtime={runtime} state={state} />
              ) : (
                <ConnectedTuner runtime={runtime} state={state} />
              )}
            </Tabs.Content>
            <div className="mobile-help">
              <ConnectedHelp state={state} />
              <ConnectedProgress state={state} runtime={runtime} />
            </div>
          </div>
          <aside className="context-rail">
            <ConnectedSetupSummary state={state} runtime={runtime} />
            <ConnectedHelp state={state} />
            <ConnectedProgress state={state} runtime={runtime} />
          </aside>
        </div>
        {state.message && (
          <p className="global-status" role="status">
            {state.message}
          </p>
        )}
      </main>
      <MobileCapture status={state.capture} onStop={runtime.stopAll} />
      <ConnectedSetup runtime={runtime} state={state} returnFocusRef={setupReturnFocusRef} />
    </Tabs.Root>
  );
}
