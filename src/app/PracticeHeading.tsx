import { NOTE_NAMES, SCALES, noteName } from '@/domain/music';
import type { AppState } from '@/domain/types';
import { intro, modes, title } from './navigation';

export function PracticeHeading({ state }: { state: Pick<AppState, 'mode' | 'settings'> }) {
  const global = state.settings.global;
  const key = `${NOTE_NAMES[global.rootKey]} ${SCALES[global.scaleId].name}`;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {state.mode === 'harmony' || state.mode === 'tuner' ? 'Vocal practice' : 'Ear training'}{' '}
            / {modes.find((mode) => mode.id === state.mode)?.label}
          </p>
          <h1>{title[state.mode]}</h1>
          <p className="intro">{intro[state.mode]}</p>
        </div>
        <span className="practice-tag">Free practice</span>
      </div>
      <div className="compact-summary">
        {key} · {noteName(global.lowMidi)}–{noteName(global.highMidi)} · A4 {global.a4} Hz
      </div>
    </>
  );
}
