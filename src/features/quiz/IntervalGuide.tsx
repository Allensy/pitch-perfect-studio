import { Button } from '@/components/ui/button';
import { INTERVALS } from '@/domain/music';
export function IntervalGuide({
  onAudition,
}: {
  onAudition: (semitones: number, descending: boolean) => void;
}) {
  return (
    <details className="disclosure">
      <summary>Song anchors &amp; interval guide</summary>
      <p className="hint">
        Song names are memory prompts. Hear the interval itself, then compare the distance.
      </p>
      <div className="anchor-list">
        {INTERVALS.filter((interval) => interval.st > 0).map((interval) => (
          <div key={interval.st}>
            <strong>
              {interval.short} · {interval.name}
            </strong>
            <span>↑ {interval.songAsc}</span>
            <span>↓ {interval.songDesc}</span>
            <div className="button-row">
              <Button
                size="small"
                aria-label={`Hear ${interval.name} ascending reference`}
                onClick={() => onAudition(interval.st, false)}
              >
                Hear ↑
              </Button>
              <Button
                size="small"
                aria-label={`Hear ${interval.name} descending reference`}
                onClick={() => onAudition(interval.st, true)}
              >
                Hear ↓
              </Button>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
