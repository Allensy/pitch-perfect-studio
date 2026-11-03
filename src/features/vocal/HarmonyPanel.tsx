import { Button } from '@/components/ui/button';
import type { Settings } from '@/domain/types';
import { Mixer, type HarmonyMixerProps } from './HarmonyMixer';
import { HarmonyTargetPractice, type HarmonyTargetPracticeProps } from './HarmonyTargetPractice';

export interface HarmonyProps {
  activity: Settings['harmony']['submode'];
  targetPractice: HarmonyTargetPracticeProps;
  mixerPractice: HarmonyMixerProps;
  onActivityChange: (activity: Settings['harmony']['submode']) => void;
}

export function Harmony({
  activity,
  targetPractice,
  mixerPractice,
  onActivityChange,
}: HarmonyProps) {
  const mixer = activity === 'mixer';
  return (
    <section aria-label="Harmony practice">
      <div className="segmented harmony-switch" role="group" aria-label="Harmony activity">
        <Button aria-pressed={!mixer} onClick={() => onActivityChange('target')}>
          Target practice
        </Button>
        <Button aria-pressed={mixer} onClick={() => onActivityChange('mixer')}>
          Harmony mixer
        </Button>
      </div>
      {mixer ? <Mixer {...mixerPractice} /> : <HarmonyTargetPractice {...targetPractice} />}
    </section>
  );
}
