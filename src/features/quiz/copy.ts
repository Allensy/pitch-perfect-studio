import type { Phase, QuizMode } from '@/domain/types';

export const quizItemNames: Readonly<Record<QuizMode, string>> = {
  notes: 'note',
  intervals: 'interval',
  chords: 'chord',
};
export const feedbackHeadings: Readonly<Record<Phase, string>> = {
  ready: 'A good place to start.',
  playing: 'Listen closely.',
  awaiting: 'What did you hear?',
  retry: '× Not quite — try again.',
  correct: 'Locked in.',
};
export const playbackHeadings: Readonly<Record<Phase, string>> = {
  ready: 'Ready to play',
  playing: 'Listening',
  awaiting: 'Your turn',
  retry: 'Another listen',
  correct: 'Nice listening',
};
