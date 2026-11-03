interface Props {
  hold: number;
  preview: boolean;
  rearm: boolean;
  complete: boolean;
  tolerance: number;
}
export function PitchHoldProgress({ hold, preview, rearm, complete, tolerance }: Props) {
  return (
    <div className="hold">
      <div>
        <strong>
          {rearm
            ? 'Ready again before your next hold'
            : complete
              ? 'Target completed'
              : `Hold within ±${tolerance} cents`}
        </strong>
        <span>
          {preview
            ? 'Preview · unearned'
            : `${((Math.min(100, hold) / 100) * 1.5).toFixed(1)} / 1.5s`}
        </span>
      </div>
      <div
        className="hold-track"
        role="progressbar"
        aria-label="Continuous target hold"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(preview ? 0 : hold)}
      >
        <i style={{ width: `${preview ? 0 : hold}%` }} />
      </div>
    </div>
  );
}
