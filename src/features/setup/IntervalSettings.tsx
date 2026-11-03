import { Button } from '@/components/ui/button';
import { CheckField, SelectField } from '@/components/ui/fields';
import { INTERVALS } from '@/domain/music';
import { intervalsForPreset, type IntervalPreset } from '@/domain/settings-presets';
import type { Settings } from '@/domain/types';
import type { SettingsSectionProps } from './section-props';

const directionOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
  { value: 'harm', label: 'Harmonic · together' },
  { value: 'asc_harm', label: 'Melodic + harmonic' },
  { value: 'mixed', label: 'Random mixed' },
] satisfies { value: Settings['intervals']['direction']; label: string }[];
const presets: { value: IntervalPreset; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'diatonic', label: 'Major-scale diatonic' },
  { value: 'all', label: 'All chromatic' },
];

export function IntervalSettings({ settings, onChange }: SettingsSectionProps<'intervals'>) {
  return (
    <>
      <div className="form-grid">
        <SelectField
          label="Direction"
          value={settings.direction}
          options={directionOptions}
          onChange={(direction) => onChange({ direction })}
        />
        <CheckField
          label="Fix lower anchor to tonic"
          checked={settings.fixedRoot}
          onChange={(fixedRoot) => onChange({ fixedRoot })}
        />
      </div>
      <p className="hint">
        In a descending interval, the upper note sounds first; the lower reference anchor remains
        the tonic.
      </p>
      <div className="preset-buttons">
        {presets.map(({ value, label }) => (
          <Button
            key={value}
            size="small"
            onClick={() => onChange({ activeSemitones: intervalsForPreset(value) })}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="filter-grid">
        {INTERVALS.filter((interval) => interval.st > 0).map((interval) => (
          <CheckField
            key={interval.st}
            label={`${interval.short} · ${interval.name}`}
            checked={settings.activeSemitones.includes(interval.st)}
            onChange={(checked) =>
              onChange((current) => ({
                activeSemitones: checked
                  ? [...current.activeSemitones, interval.st].sort((a, b) => a - b)
                  : current.activeSemitones.filter((st) => st !== interval.st),
              }))
            }
          />
        ))}
      </div>
      <p className="hint">
        Select at least two intervals. Every selected interval must fit the current range.
      </p>
    </>
  );
}
