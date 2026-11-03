import { SelectField } from '@/components/ui/fields';
import type { Settings } from '@/domain/types';
import type { SettingsSectionProps } from './section-props';

const actionOptions = [
  { value: 'audition', label: 'Audition · reference only' },
  { value: 'answer', label: 'Answer · submits exact pitch' },
] satisfies { value: Settings['piano']['inputMode']; label: string }[];
const octaveOptions = [2, 3, 4, 5, 6].map((value) => ({ value, label: String(value) }));

export function KeyboardSettings({ settings, onChange }: SettingsSectionProps<'piano'>) {
  return (
    <details className="disclosure">
      <summary>Keyboard preferences</summary>
      <div className="form-grid">
        <SelectField
          label="Keyboard action"
          value={settings.inputMode}
          options={actionOptions}
          onChange={(inputMode) => onChange({ inputMode })}
        />
        <SelectField
          label="Initial octave"
          value={settings.octave}
          options={octaveOptions}
          onChange={(octave) => onChange({ octave })}
        />
      </div>
    </details>
  );
}
