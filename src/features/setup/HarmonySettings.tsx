import {
  harmonyChallengeOptions,
  harmonyRootOptions,
  progressionOptions,
} from '@/components/practice-options';
import { CheckField, SelectField } from '@/components/ui/fields';
import type { Settings } from '@/domain/types';
import type { SettingsSectionProps } from './section-props';

const activityOptions = [
  { value: 'target', label: 'Target practice' },
  { value: 'mixer', label: 'Harmony mixer' },
] satisfies { value: Settings['harmony']['submode']; label: string }[];

export function HarmonySettings({ settings, onChange }: SettingsSectionProps<'harmony'>) {
  return (
    <>
      <div className="form-grid">
        <SelectField
          label="Activity"
          value={settings.submode}
          options={activityOptions}
          onChange={(submode) => onChange({ submode })}
        />
        <SelectField
          label="Challenge"
          value={settings.challengeId}
          options={harmonyChallengeOptions}
          onChange={(challengeId) => onChange({ challengeId })}
        />
        <SelectField
          label="Root practice"
          value={settings.rootPolicy}
          options={harmonyRootOptions}
          onChange={(rootPolicy) => onChange({ rootPolicy })}
        />
        <SelectField
          label="Progression"
          value={settings.progressionId}
          options={progressionOptions}
          onChange={(progressionId) => onChange({ progressionId })}
        />
      </div>
      <p className="hint">
        Target holds use ±25 cents for 1.5 seconds. Notes in this key changes the local reference,
        not the selected global key. Mixer is ungraded.
      </p>
      <div className="filter-grid">
        {['Soprano', 'Alto', 'Tenor', 'Bass'].map((voice, i) => (
          <CheckField
            key={voice}
            label={`${voice} · mute / You Sing`}
            checked={settings.mutedVoices[i] ?? false}
            onChange={(checked) =>
              onChange((current) => ({
                mutedVoices: current.mutedVoices.map((muted, index) =>
                  index === i ? checked : muted,
                ),
              }))
            }
          />
        ))}
      </div>
    </>
  );
}
