import { Button } from '@/components/ui/button';
import { CheckField, SelectField } from '@/components/ui/fields';
import { CHORDS } from '@/domain/music';
import { chordsForPreset, type ChordPreset } from '@/domain/settings-presets';
import type { Settings } from '@/domain/types';
import type { SettingsSectionProps } from './section-props';

const playbackOptions = [
  { value: 'block', label: 'Block chord' },
  { value: 'arp', label: 'Arpeggio' },
  { value: 'both', label: 'Arpeggio + block' },
] satisfies { value: Settings['chords']['playback']; label: string }[];
const inversionOptions = [
  { value: 'root', label: 'Root position only' },
  { value: 'random_voicing', label: 'Random inversion · quality' },
  { value: 'guess_inv', label: 'Quality + inversion' },
] satisfies { value: Settings['chords']['inversionMode']; label: string }[];
const presets: { value: ChordPreset; label: string }[] = [
  { value: 'triads', label: 'Core triads' },
  { value: 'triads_sus', label: 'Triads + suspended' },
  { value: 'sevenths', label: 'Seventh chords' },
  { value: 'all', label: 'All chords' },
];

export function ChordSettings({ settings, onChange }: SettingsSectionProps<'chords'>) {
  return (
    <>
      <div className="form-grid">
        <SelectField
          label="Playback"
          value={settings.playback}
          options={playbackOptions}
          onChange={(playback) => onChange({ playback })}
        />
        <SelectField
          label="Inversion practice"
          value={settings.inversionMode}
          options={inversionOptions}
          onChange={(inversionMode) => onChange({ inversionMode })}
        />
      </div>
      <div className="preset-buttons">
        {presets.map(({ value, label }) => (
          <Button
            key={value}
            size="small"
            onClick={() => onChange({ activeQualityIds: chordsForPreset(value) })}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="filter-grid">
        {CHORDS.map((chord) => (
          <CheckField
            key={chord.id}
            label={chord.name}
            checked={settings.activeQualityIds.includes(chord.id)}
            onChange={(checked) =>
              onChange((current) => ({
                activeQualityIds: checked
                  ? [...current.activeQualityIds, chord.id]
                  : current.activeQualityIds.filter((id) => id !== chord.id),
              }))
            }
          />
        ))}
      </div>
      <p className="hint">
        Select at least two qualities. A shown, auditionable root provides fair context. Triads have
        three inversion choices; seventh chords have four.
      </p>
    </>
  );
}
