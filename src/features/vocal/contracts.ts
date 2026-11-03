import type { PitchNotation } from '@/domain/types';

/** Only notation affects the labels rendered by vocal-practice views. */
export interface PitchNotationSettings {
  global: PitchNotation;
}
