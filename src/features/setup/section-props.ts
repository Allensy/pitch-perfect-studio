import type { Settings } from '@/domain/types';

export type SettingsPatch<Section extends keyof Settings> =
  Partial<Settings[Section]> | ((current: Settings[Section]) => Partial<Settings[Section]>);
export interface SettingsSectionProps<Section extends keyof Settings> {
  settings: Settings[Section];
  onChange: (patch: SettingsPatch<Section>) => void;
}
