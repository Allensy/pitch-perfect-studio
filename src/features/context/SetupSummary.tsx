import { Output } from '@/components/audio/output-controls';
import { Button } from '@/components/ui/button';
import { NOTE_NAMES, SCALES, noteName } from '@/domain/music';
import type { Settings, Timbre } from '@/domain/types';
import { ArrowUpRight } from 'lucide-react';
const instrumentNames: Record<Timbre, string> = {
  piano: 'Warm piano',
  epiano: 'Electric piano',
  strings: 'Choir / strings',
  organ: 'Organ',
  sine: 'Pure sine',
};

interface SetupSummaryProps {
  settings: Settings['global'];
  volume: number;
  muted: boolean;
  onOpenSetup: () => void;
  onOutputChange: (volume: number, muted: boolean) => void;
}

export function SetupSummary({
  settings: g,
  volume,
  muted,
  onOpenSetup,
  onOutputChange,
}: SetupSummaryProps) {
  return (
    <section className="rail-section">
      <h2 className="rail-eyebrow">Your setup</h2>
      <dl className="setup-list">
        <div>
          <dt>Key &amp; scale</dt>
          <dd>
            {NOTE_NAMES[g.rootKey]} {SCALES[g.scaleId].name}
          </dd>
        </div>
        <div>
          <dt>Your range</dt>
          <dd>
            {noteName(g.lowMidi)}–{noteName(g.highMidi)}
          </dd>
        </div>
        <div>
          <dt>Instrument</dt>
          <dd>{instrumentNames[g.timbre]}</dd>
        </div>
        <div>
          <dt>Tuning</dt>
          <dd>A4 · {g.a4} Hz</dd>
        </div>
      </dl>
      <Button variant="ghost" onClick={onOpenSetup}>
        Edit setup <ArrowUpRight size={15} aria-hidden="true" />
      </Button>
      <Output volume={volume} muted={muted} onChange={onOutputChange} />
    </section>
  );
}
