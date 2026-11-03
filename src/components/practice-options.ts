import { CHALLENGES, PROGRESSIONS } from '@/domain/music';
import type { ChallengeId, ProgressionId, Settings } from '@/domain/types';
import type { SelectOption } from './ui/fields';

// Shared presentation labels for the same domain choices in Setup and practice.
export const harmonyChallengeOptions = (Object.keys(CHALLENGES) as ChallengeId[]).map((value) => ({
  value,
  label: CHALLENGES[value].name,
}));
export const progressionOptions = (Object.keys(PROGRESSIONS) as ProgressionId[]).map((value) => ({
  value,
  label: PROGRESSIONS[value].name,
}));
export const harmonyRootOptions: readonly SelectOption<Settings['harmony']['rootPolicy']>[] = [
  { value: 'tonic', label: 'Tonic only' },
  { value: 'scale', label: 'Notes in this key' },
];
