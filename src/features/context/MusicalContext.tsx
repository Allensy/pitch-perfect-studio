import type { AppState } from '@/domain/types';

export function Help({ state }: { state: Pick<AppState, 'mode'> }) {
  return (
    <section className="rail-section">
      <details className="help-disclosure">
        <summary>A little musical context</summary>
        <p className="rail-note">
          {state.mode === 'notes'
            ? 'Every note has a place to call home.'
            : state.mode === 'intervals'
              ? 'Hear the distance, then the name.'
              : state.mode === 'chords'
                ? 'Every voice adds a color.'
                : 'A little space. A steady breath.'}
        </p>
        <p className="rail-copy">
          {state.mode === 'notes'
            ? 'Hear the tonic, then compare the mystery note with it. Start with the shape of the sound; the name will follow.'
            : state.mode === 'intervals'
              ? 'An interval is the distance between notes. The lower note is the reference anchor—even when a descending pair sounds the upper note first.'
              : state.mode === 'chords'
                ? 'Listen for the overall quality. In random-voicing and inversion practice, the shown reference root makes the intended interpretation clear.'
                : 'Headphones keep the reference separate from your voice. Cue the target, let it finish, then sing one steady note.'}
        </p>
        <p className="rail-copy">
          {state.mode === 'tuner' || state.mode === 'harmony'
            ? '100 cents is one semitone. Target practice compares the exact octave; Free Tuner compares the nearest note. Holds require 1.5 uninterrupted seconds in tune.'
            : 'References and skips never earn XP or change accuracy. Exact-octave answers require both note and register.'}
        </p>
      </details>
    </section>
  );
}
