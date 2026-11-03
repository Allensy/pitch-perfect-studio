import { NOTE_NAMES, SCALES, noteName } from '@/domain/music';
import type { Settings } from '@/domain/types';

const blackPositions = new Map([
  [1, 1],
  [3, 2],
  [6, 4],
  [8, 5],
  [10, 6],
]);
const whitePositions = new Map([
  [0, 0],
  [2, 1],
  [4, 2],
  [5, 3],
  [7, 4],
  [9, 5],
  [11, 6],
]);

/** Layout and answer availability for one spatial octave; no scoring or audio side effects. */
export function pianoKeys(settings: Pick<Settings, 'global' | 'piano'>, answerable: boolean) {
  const { octave, inputMode } = settings.piano;
  return NOTE_NAMES.map((name, pitchClass) => {
    const midi = (octave + 1) * 12 + pitchClass;
    const inRange = midi >= settings.global.lowMidi && midi <= settings.global.highMidi;
    const inScale = SCALES[settings.global.scaleId].steps.includes(
      (pitchClass - settings.global.rootKey + 12) % 12,
    );
    const inPool = inRange && inScale;
    const black = blackPositions.has(pitchClass);
    const position = (black ? blackPositions : whitePositions).get(pitchClass)!;
    return {
      midi,
      pitchClass,
      name,
      black,
      inPool,
      left: black ? `calc(${(position / 7) * 100}% - 14px)` : `${(position / 7) * 100}%`,
      disabled: midi > 84 || (inputMode === 'answer' && (!answerable || !inPool)),
      accessibleLabel: `${inputMode === 'answer' ? 'Answer' : 'Audition'} ${noteName(midi)}${inPool ? '' : ', outside active pool'}`,
    };
  });
}
