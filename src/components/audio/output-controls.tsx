import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { useId } from 'react';

export function Output({
  volume,
  muted,
  onChange,
}: {
  volume: number;
  muted: boolean;
  onChange: (volume: number, muted: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="output">
      <div className="output-row">
        <Button variant="ghost" onClick={() => onChange(volume, !muted)} aria-pressed={muted}>
          {muted ? (
            <VolumeX size={16} aria-hidden="true" />
          ) : (
            <Volume2 size={16} aria-hidden="true" />
          )}
          {muted ? 'Unmute output' : 'Mute output'}
        </Button>
        <label className="sr-only" htmlFor={id}>
          Output volume
        </label>
        <input
          id={id}
          type="range"
          min="0"
          max="100"
          value={volume}
          aria-valuetext={`${volume}%${muted ? ', muted' : ''}`}
          onChange={(event) => onChange(Number(event.target.value), muted)}
        />
        <span>{volume}%</span>
      </div>
      <p>Output only. Muting sound does not stop the microphone.</p>
    </div>
  );
}
