import { CaptureIndicator } from '@/components/audio/capture-status';
import { Button } from '@/components/ui/button';
import { NOTE_NAMES, SCALES, noteName } from '@/domain/music';
import type { AppState, Runtime } from '@/domain/types';
import { Settings2 } from 'lucide-react';

export function AppHeader({
  state,
  runtime,
}: {
  state: Pick<AppState, 'settings' | 'capture'>;
  runtime: Pick<Runtime, 'setSetup' | 'stopAll'>;
}) {
  const global = state.settings.global;
  return (
    <header className="app-header">
      <div className="brand">
        <span className="beat-mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <div>
          <div className="brand-name">
            Pitch Perfect <span>Studio</span>
          </div>
          <div className="brand-caption">Your pocket rehearsal room</div>
        </div>
      </div>
      <div className="header-actions">
        <span className="header-summary">
          {NOTE_NAMES[global.rootKey]} {SCALES[global.scaleId].name} · {noteName(global.lowMidi)}–
          {noteName(global.highMidi)}
        </span>
        <CaptureIndicator state={state} runtime={runtime} />
        <Button onClick={() => runtime.setSetup(true)}>
          <Settings2 size={16} aria-hidden="true" />
          Setup
        </Button>
      </div>
    </header>
  );
}
