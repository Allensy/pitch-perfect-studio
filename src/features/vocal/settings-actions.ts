import type { Runtime, Settings } from '@/domain/types';

/** UI adapters only: validation and exercise lifecycle remain in runtime.applySettings. */
export function changeHarmony(
  runtime: Runtime,
  settings: Settings,
  patch: Partial<Settings['harmony']>,
) {
  return runtime.applySettings({ ...settings, harmony: { ...settings.harmony, ...patch } });
}
export function changeTuner(
  runtime: Runtime,
  settings: Settings,
  patch: Partial<Settings['tuner']>,
) {
  return runtime.applySettings({ ...settings, tuner: { ...settings.tuner, ...patch } });
}
