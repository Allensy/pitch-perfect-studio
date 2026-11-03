import { noteName } from '@/domain/music';
import type { pitchPresentation } from './pitch-presentation';

type Props = Pick<
  ReturnType<typeof pitchPresentation>,
  'center' | 'meaning' | 'beyond' | 'historyPath'
>;
export function PitchHistoryChart({ center, meaning, beyond, historyPath }: Props) {
  return (
    <figure className="pitch-chart">
      <figcaption>
        <span>Pitch trail</span>
        <span>Last 8 seconds</span>
      </figcaption>
      <div className="chart-wrap">
        <span className="chart-note">{center === null ? '—' : noteName(center)}</span>
        <svg
          viewBox="0 0 640 132"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Recent pitch history. ${center === null ? 'No pitch yet.' : `Center ${noteName(center)}.`} ${meaning}${beyond ? ', current pitch beyond graph center window' : ''}.`}
        >
          <line x1="0" y1="26" x2="640" y2="26" />
          <line x1="0" y1="66" x2="640" y2="66" className="chart-center" />
          <line x1="0" y1="106" x2="640" y2="106" />
          <path d={historyPath} />
        </svg>
      </div>
      <div className="chart-axis">
        <span>8s ago</span>
        <span>Now</span>
      </div>
    </figure>
  );
}
