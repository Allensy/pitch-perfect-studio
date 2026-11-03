import { useEffect, useState } from 'react';
import { globalWithRangePreset, prepareSettingsDraft } from '@/domain/settings-presets';
import type { Mode, Settings } from '@/domain/types';
import type { SettingsPatch } from './section-props';

interface SetupDraftOptions {
  open: boolean;
  settings: Settings;
  mode: Mode;
  applySettings: (settings: Settings) => string[];
}

/** Transactional edits only; output and microphone commands remain outside this draft. */
export function useSetupDraft({ open, settings, mode, applySettings }: SetupDraftOptions) {
  const [draft, setDraft] = useState(() => structuredClone(settings));
  const [a4Text, setA4Text] = useState(String(settings.global.a4));
  const [configMode, setConfigMode] = useState(mode);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setDraft(structuredClone(settings));
      setA4Text(String(settings.global.a4));
      setConfigMode(mode);
      setErrors([]);
    }
  }, [open, settings, mode]);

  function update<Section extends keyof Settings>(section: Section, patch: SettingsPatch<Section>) {
    setDraft((previous) => ({
      ...previous,
      [section]: {
        ...previous[section],
        ...(typeof patch === 'function' ? patch(previous[section]) : patch),
      },
    }));
  }

  function selectRangePreset(preset: string) {
    setDraft((previous) => ({
      ...previous,
      global: globalWithRangePreset(previous.global, preset),
    }));
  }

  function apply(): boolean {
    const prepared = prepareSettingsDraft(draft, a4Text);
    const nextErrors = prepared.ok ? applySettings(prepared.value) : [prepared.message];
    setErrors(nextErrors);
    return nextErrors.length === 0;
  }

  return {
    draft,
    a4Text,
    configMode,
    errors,
    update,
    selectRangePreset,
    setA4Text,
    setConfigMode,
    apply,
  };
}
