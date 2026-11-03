import type { Mode } from '@/domain/types';
import { Activity, ArrowUpRight, AudioLines, Layers3, Music2, type LucideIcon } from 'lucide-react';

export const modes: { id: Mode; label: string; icon: LucideIcon }[] = [
  { id: 'notes', label: 'Notes', icon: Music2 },
  { id: 'intervals', label: 'Intervals', icon: ArrowUpRight },
  { id: 'chords', label: 'Chords', icon: Layers3 },
  { id: 'harmony', label: 'Harmony', icon: AudioLines },
  { id: 'tuner', label: 'Tuner', icon: Activity },
];
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
