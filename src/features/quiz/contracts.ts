import type { ReactNode } from 'react';
import type { Answer, PlaybackVariant, QuizMode, Round, Settings } from '@/domain/types';

export type QuizSettings = Pick<Settings, 'global' | 'notes' | 'intervals' | 'chords'>;
export type ReferenceKind = 'tonic' | 'scale' | 'cadence' | 'root';

/** Feature input/output contract; application services and store ownership stay in its adapter. */
export interface QuizProps {
  mode: QuizMode;
  round: Round;
  settings: QuizSettings;
  onPlay: (variant?: PlaybackVariant) => void;
  onReference: (kind: ReferenceKind) => void;
  onSubmit: (answer: Answer) => void;
  onNext: () => void;
  onOpenSetup: () => void;
  onNoteSettingsChange: (patch: Partial<Settings['notes']>) => void;
  onAudition: (midi: number) => void;
  onAuditionInterval: (semitones: number, descending: boolean) => void;
  keyboard?: ReactNode;
}
