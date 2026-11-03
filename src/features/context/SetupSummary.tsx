import { Output } from '@/components/audio/output-controls';
import { Button } from '@/components/ui/button';
import { NOTE_NAMES, SCALES, noteName } from '@/domain/music';
import type { AppState, Runtime } from '@/domain/types';
import { ArrowUpRight } from 'lucide-react';
export function SetupSummary({
  state,
  runtime,
}: {
  state: Pick<AppState, 'settings' | 'volume' | 'muted'>;
  runtime: Pick<Runtime, 'setSetup' | 'setOutput'>;
}) {
  const g = state.settings.global;
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
          <dd>
            {
              {
                piano: 'Warm piano',
                epiano: 'Electric piano',
                strings: 'Choir / strings',
                organ: 'Organ',
                sine: 'Pure sine',
              }[g.timbre]
            }
          </dd>
        </div>
        <div>
          <dt>Tuning</dt>
          <dd>A4 · {g.a4} Hz</dd>
        </div>
      </dl>
      <Button variant="ghost" onClick={() => runtime.setSetup(true)}>
        Edit setup <ArrowUpRight size={15} aria-hidden="true" />
      </Button>
      <Output state={state} runtime={runtime} />
    </section>
  );
}
