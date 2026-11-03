import { Field, SelectField } from '@/components/ui/fields';
import { NOTE_NAMES, RANGE_PRESETS, SCALES, noteName } from '@/domain/music';
import type { ScaleId, Settings } from '@/domain/types';
import type { SettingsSectionProps } from './section-props';

const noteOptions = NOTE_NAMES.map((label, value) => ({ value, label }));
const pitchOptions = Array.from({ length: 49 }, (_, index) => index + 36).map((value) => ({
  value,
  label: noteName(value),
}));
const scaleOptions = (Object.keys(SCALES) as ScaleId[]).map((value) => ({
  value,
  label: SCALES[value].name,
}));
const rangeOptions = [
  ...Object.entries(RANGE_PRESETS).map(([value, range]) => ({ value, label: range.name })),
  { value: 'custom', label: 'Custom' },
];
const timbreOptions = [
  { value: 'piano', label: 'Warm piano' },
  { value: 'epiano', label: 'Rhodes electric piano' },
  { value: 'strings', label: 'Choir / strings pad' },
  { value: 'organ', label: 'Tonewheel organ' },
  { value: 'sine', label: 'Pure sine' },
] satisfies { value: Settings['global']['timbre']; label: string }[];
const notationOptions = [
  { value: 'letter', label: 'Letters · C, D, E' },
  { value: 'solfege', label: 'Solfège · Do, Re, Mi' },
  { value: 'degree', label: 'Scale degrees · 1, 2, 3' },
] satisfies { value: Settings['global']['notation']; label: string }[];

interface GeneralSettingsProps extends SettingsSectionProps<'global'> {
  a4Text: string;
  onA4Change: (text: string) => void;
  onRangePreset: (preset: string) => void;
}
export function GeneralSettings({
  settings,
  onChange,
  a4Text,
  onA4Change,
  onRangePreset,
}: GeneralSettingsProps) {
  return (
    <fieldset className="setup-section">
      <legend>Musical setup</legend>
      <div className="form-grid">
        <SelectField
          label="Root key"
          value={settings.rootKey}
          options={noteOptions}
          onChange={(rootKey) => onChange({ rootKey })}
        />
        <SelectField
          label="Scale"
          value={settings.scaleId}
          options={scaleOptions}
          onChange={(scaleId) => onChange({ scaleId })}
        />
        <SelectField
          label="Instrument"
          value={settings.timbre}
          options={timbreOptions}
          onChange={(timbre) => onChange({ timbre })}
        />
        <SelectField
          label="Range preset"
          value={settings.rangePreset}
          options={rangeOptions}
          onChange={onRangePreset}
        />
        <SelectField
          label="Low note"
          value={settings.lowMidi}
          options={pitchOptions}
          onChange={(lowMidi) => onChange({ lowMidi, rangePreset: 'custom' })}
        />
        <SelectField
          label="High note"
          value={settings.highMidi}
          options={pitchOptions}
          onChange={(highMidi) => onChange({ highMidi, rangePreset: 'custom' })}
        />
        <SelectField
          label="Note labels"
          value={settings.notation}
          options={notationOptions}
          onChange={(notation) => onChange({ notation })}
        />
        <Field label="Tuning A4 · Hz">
          <input
            type="number"
            inputMode="numeric"
            min="430"
            max="448"
            step="1"
            value={a4Text}
            onChange={(event) => onA4Change(event.target.value)}
          />
        </Field>
      </div>
      <p className="hint">
        Sung and listening targets fit your chosen range. Accompaniment has its own labeled C2–C6
        register.
      </p>
    </fieldset>
  );
}
