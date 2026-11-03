import { SelectField } from '@/components/ui/fields';
import type { Settings } from '@/domain/types';
import type { SettingsSectionProps } from './section-props';

const drillOptions = [
  { value: 'free', label: 'Free tuner · ungraded' },
  { value: 'target', label: 'Target note' },
  { value: 'scale_walk', label: 'Scale walk' },
  { value: 'arpeggio', label: 'Triad arpeggio' },
] satisfies { value: Settings['tuner']['drillMode']; label: string }[];
const toleranceOptions = [
  { value: 22, label: 'Standard · ±22 cents' },
  { value: 12, label: 'Strict · ±12 cents' },
  { value: 35, label: 'Relaxed · ±35 cents' },
] satisfies { value: Settings['tuner']['toleranceCents']; label: string }[];
const qualityOptions = [
  { value: 'major', label: 'Major · 1–3–5–8' },
  { value: 'minor', label: 'Minor · 1–♭3–5–8' },
] satisfies { value: Settings['tuner']['arpeggioQuality']; label: string }[];

export function TunerSettings({ settings, onChange }: SettingsSectionProps<'tuner'>) {
  return (
    <>
      <div className="form-grid">
        <SelectField
          label="Drill"
          value={settings.drillMode}
          options={drillOptions}
          onChange={(drillMode) => onChange({ drillMode })}
        />
        <SelectField
          label="Tolerance"
          value={settings.toleranceCents}
          options={toleranceOptions}
          onChange={(toleranceCents) => onChange({ toleranceCents })}
        />
        <SelectField
          label="Arpeggio quality"
          value={settings.arpeggioQuality}
          options={qualityOptions}
          onChange={(arpeggioQuality) => onChange({ arpeggioQuality })}
        />
      </div>
      <p className="hint">
        Only Target note uses an eight-target queue. Scale walk uses the whole scale up and back.
        Arpeggios use 1–3–5–8–5–3–1. Repeated pitches require Ready Again.
      </p>
    </>
  );
}
