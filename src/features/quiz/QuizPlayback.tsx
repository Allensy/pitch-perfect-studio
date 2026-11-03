import { Button } from '@/components/ui/button';
import { NOTE_NAMES, SCALES, pitchLabel } from '@/domain/music';
import type { QuizMode, Round, Settings, Runtime } from '@/domain/types';
import { Play, ArrowUpRight } from 'lucide-react';
import { Signal } from './SoundSignal';
export function QuizPlayback({
  mode,
  round,
  settings,
  onPlay,
  onReference,
}: {
  mode: QuizMode;
  round: Round;
  settings: Settings;
  onPlay: Runtime['play'];
  onReference: Runtime['reference'];
}) {
  const q = round.question;
  return (
    <>
      <div className="sound-stage">
        <div className="stage-meta">
          <span>
            <i />
            {NOTE_NAMES[settings.global.rootKey]} {SCALES[settings.global.scaleId].name}
          </span>
          <span>
            {
              {
                ready: 'Ready to play',
                playing: 'Listening',
                awaiting: 'Your turn',
                retry: 'Another listen',
                correct: 'Nice listening',
              }[round.phase]
            }
          </span>
        </div>
        <Signal />
        <Button
          variant="primary"
          className="stage-action"
          onClick={() => onPlay()}
          disabled={!!round.error || round.phase === 'playing'}
        >
          <Play size={16} fill="currentColor" aria-hidden="true" />
          {round.phase === 'ready'
            ? `Play ${mode === 'notes' ? 'note' : mode === 'intervals' ? 'interval' : 'chord'}`
            : round.phase === 'playing'
              ? 'Playing…'
              : 'Replay'}
        </Button>
        <p className="stage-status">
          {round.phase === 'correct'
            ? 'Replay keeps this completed answer closed.'
            : 'One listen. A little closer to knowing it.'}
        </p>
      </div>
      {mode === 'notes' ? (
        <div className="reference-row">
          <Button variant="ghost" onClick={() => onReference('tonic')}>
            Hear tonic <ArrowUpRight size={14} aria-hidden="true" />
          </Button>
          <Button variant="ghost" onClick={() => onReference('scale')}>
            Hear scale <ArrowUpRight size={14} aria-hidden="true" />
          </Button>
          <Button variant="ghost" onClick={() => onReference('cadence')}>
            Hear cadence <ArrowUpRight size={14} aria-hidden="true" />
          </Button>
        </div>
      ) : mode === 'intervals' ? (
        <div className="reference-row">
          <Button variant="ghost" onClick={() => onPlay('ascending')}>
            Ascending
          </Button>
          <Button variant="ghost" onClick={() => onPlay('descending')}>
            Descending
          </Button>
          <Button variant="ghost" onClick={() => onPlay('harmonic')}>
            Together
          </Button>
        </div>
      ) : (
        <div className="reference-row">
          <Button variant="ghost" onClick={() => onPlay('block')}>
            Block chord
          </Button>
          <Button variant="ghost" onClick={() => onPlay('arpeggio')}>
            Arpeggio
          </Button>
        </div>
      )}
      {mode === 'chords' && (
        <p className="hint">
          Accompaniment register C2–C6. Chord voices may extend beyond your sung range.
        </p>
      )}
      {mode === 'chords' && settings.chords.inversionMode !== 'root' && q?.kind === 'chords' && (
        <div className="root-context">
          <span>
            Reference root <strong>{pitchLabel(q.rootMidi, settings)}</strong>
          </span>
          <Button size="small" onClick={() => onReference('root')}>
            Hear root
          </Button>
        </div>
      )}
    </>
  );
}
