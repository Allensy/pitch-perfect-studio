import type { Settings } from '@/domain/types';
import type { Option } from '@/shared/options';

export const tunerDrillOptions: readonly Option<Exclude<Settings['tuner']['drillMode'], 'free'>>[] =
  [
    { value: 'target', label: 'Target note' },
    { value: 'scale_walk', label: 'Scale walk' },
    { value: 'arpeggio', label: 'Triad arpeggio' },
  ];
export const tunerToleranceOptions: readonly Option<Settings['tuner']['toleranceCents']>[] = [
  { value: 22, label: 'Standard ±22¢' },
  { value: 12, label: 'Strict ±12¢' },
  { value: 35, label: 'Relaxed ±35¢' },
];
