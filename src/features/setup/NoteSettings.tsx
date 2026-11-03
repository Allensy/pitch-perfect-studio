import { CheckField } from '@/components/ui/fields';
import type { SettingsSectionProps } from './section-props';

export function NoteSettings({ settings, onChange }: SettingsSectionProps<'notes'>) {
  return (
    <div className="check-list">
      <CheckField
        label="Require exact octave"
        checked={settings.exactOctave}
        onChange={(exactOctave) => onChange({ exactOctave })}
      />
      <CheckField
        label="Auto-advance after correct feedback"
        checked={settings.autoNext}
        onChange={(autoNext) => onChange({ autoNext })}
      />
    </div>
  );
}
