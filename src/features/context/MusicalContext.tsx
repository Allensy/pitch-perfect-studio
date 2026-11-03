import type { Mode } from '@/domain/types';

const quizGuidance =
  'References and skips never earn XP or change accuracy. Exact-octave answers require both note and register.';
const vocalContext = {
  heading: 'A little space. A steady breath.',
  explanation:
    'Headphones keep the reference separate from your voice. Cue the target, let it finish, then sing one steady note.',
  guidance:
    '100 cents is one semitone. Target practice compares the exact octave; Free Tuner compares the nearest note. Holds require 1.5 uninterrupted seconds in tune.',
};
const contextByMode: Record<Mode, { heading: string; explanation: string; guidance: string }> = {
  notes: {
    heading: 'Every note has a place to call home.',
    explanation:
      'Hear the tonic, then compare the mystery note with it. Start with the shape of the sound; the name will follow.',
    guidance: quizGuidance,
  },
  intervals: {
    heading: 'Hear the distance, then the name.',
    explanation:
      'An interval is the distance between notes. The lower note is the reference anchor—even when a descending pair sounds the upper note first.',
    guidance: quizGuidance,
  },
  chords: {
    heading: 'Every voice adds a color.',
    explanation:
      'Listen for the overall quality. In random-voicing and inversion practice, the shown reference root makes the intended interpretation clear.',
    guidance: quizGuidance,
  },
  harmony: vocalContext,
  tuner: vocalContext,
};

export function Help({ mode }: { mode: Mode }) {
  const context = contextByMode[mode];
  return (
    <section className="rail-section">
      <details className="help-disclosure">
        <summary>A little musical context</summary>
        <p className="rail-note">{context.heading}</p>
        <p className="rail-copy">{context.explanation}</p>
        <p className="rail-copy">{context.guidance}</p>
      </details>
    </section>
  );
}
