import type { Mode } from '@/domain/types';
import { modeOptions } from '@/components/practice-options';
import { Activity, ArrowUpRight, AudioLines, Layers3, Music2, type LucideIcon } from 'lucide-react';

const icons: Record<Mode, LucideIcon> = {
  notes: Music2,
  intervals: ArrowUpRight,
  chords: Layers3,
  harmony: AudioLines,
  tuner: Activity,
};
export const modes = modeOptions.map(({ value: id, label }) => ({ id, label, icon: icons[id] }));
export const title = {
  notes: 'Listen. Trust your ears.',
  intervals: 'Hear the space between.',
  chords: 'Find the color.',
  harmony: 'Find your place in the chord.',
  tuner: 'Find your center.',
};
export const intro = {
  notes: 'Play a note, then choose what you heard.',
  intervals: 'Two notes. One relationship. Listen for the distance.',
  chords: 'Listen to the whole sound, then name its shape.',
  harmony: 'Hear the backing, find your note, and hold steady.',
  tuner: 'Hear a target, sing it back, and settle into the note.',
};
