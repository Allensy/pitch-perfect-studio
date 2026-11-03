import { Button } from '@/components/ui/button';
import type { AppState, Runtime } from '@/domain/types';
import { Mixer } from './HarmonyMixer';
import { HarmonyTargetPractice } from './HarmonyTargetPractice';
import { changeHarmony } from './settings-actions';

export function Harmony({ runtime, state }: { runtime: Runtime; state: AppState }) {
  const mixer = state.settings.harmony.submode === 'mixer';
  return (
    <section aria-label="Harmony practice">
      <div className="segmented harmony-switch" role="group" aria-label="Harmony activity">
        <Button
          aria-pressed={!mixer}
          onClick={() => changeHarmony(runtime, state.settings, { submode: 'target' })}
        >
          Target practice
        </Button>
        <Button
          aria-pressed={mixer}
          onClick={() => changeHarmony(runtime, state.settings, { submode: 'mixer' })}
        >
          Harmony mixer
        </Button>
      </div>
      {mixer ? (
        <Mixer runtime={runtime} state={state} />
      ) : (
        <HarmonyTargetPractice runtime={runtime} state={state} />
      )}
    </section>
  );
}
