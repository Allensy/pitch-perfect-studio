// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../src/domain/music';
import type { Mode, Settings } from '../src/domain/types';
import { useSetupDraft } from '../src/features/setup/useSetupDraft';

// REF-03: Setup is a transaction, not a second application settings owner.
describe('Setup draft transaction', () => {
  it('keeps edits local and discards them on Cancel/reopen', () => {
    const settings = defaultSettings(),
      applySettings = vi.fn<(settings: Settings) => string[]>(() => []);
    const { result, rerender } = renderHook((props) => useSetupDraft({ ...props, applySettings }), {
      initialProps: { open: true, settings, mode: 'notes' as Mode },
    });
    act(() => {
      result.current.update('notes', { exactOctave: true });
      result.current.setA4Text('445');
      result.current.setConfigMode('tuner');
    });
    expect(settings.notes.exactOctave).toBe(false);
    expect(applySettings).not.toHaveBeenCalled();
    rerender({ open: false, settings, mode: 'notes' });
    rerender({ open: true, settings, mode: 'notes' });
    expect(result.current.draft).toEqual(settings);
    expect(result.current.a4Text).toBe('440');
    expect(result.current.configMode).toBe('notes');
    expect(applySettings).not.toHaveBeenCalled();
  });
  it('blocks invalid text before runtime validation and retains errors from runtime validation', () => {
    const settings = defaultSettings();
    const applySettings = vi.fn<(settings: Settings) => string[]>(() => [
      'The selected exercise does not fit the range.',
    ]);
    const { result } = renderHook(() =>
      useSetupDraft({ open: true, settings, mode: 'notes', applySettings }),
    );
    act(() => result.current.setA4Text(''));
    act(() => expect(result.current.apply()).toBe(false));
    expect(applySettings).not.toHaveBeenCalled();
    expect(result.current.errors).toContain('Tuning A4 must be a whole number from 430 to 448 Hz.');
    act(() => result.current.setA4Text('430'));
    act(() => expect(result.current.apply()).toBe(false));
    expect(result.current.errors).toEqual(['The selected exercise does not fit the range.']);
    expect(applySettings).toHaveBeenCalledTimes(1);
    expect(applySettings.mock.calls[0]![0]).toMatchObject({ global: { a4: 430 } });
    expect(settings.global.a4).toBe(440);
  });
  it('applies one independent candidate and preserves consecutive edits to the same section', () => {
    const settings = defaultSettings(),
      applySettings = vi.fn<(settings: Settings) => string[]>(() => []);
    const { result } = renderHook(() =>
      useSetupDraft({ open: true, settings, mode: 'intervals', applySettings }),
    );
    act(() => {
      result.current.update('intervals', (current) => ({
        activeSemitones: current.activeSemitones.filter((st) => st !== 1),
      }));
      result.current.update('intervals', (current) => ({
        activeSemitones: current.activeSemitones.filter((st) => st !== 2),
      }));
      result.current.setA4Text('448');
    });
    act(() => expect(result.current.apply()).toBe(true));
    const candidate = applySettings.mock.calls[0]![0];
    expect(candidate).not.toBe(result.current.draft);
    expect(candidate).toMatchObject({ global: { a4: 448 } });
    expect(result.current.draft.intervals.activeSemitones).not.toContain(1);
    expect(result.current.draft.intervals.activeSemitones).not.toContain(2);
    expect(settings.intervals.activeSemitones).toContain(1);
    expect(settings.intervals.activeSemitones).toContain(2);
  });
  it('starts from the current committed settings and mode when context changes while open', () => {
    const settings = defaultSettings(),
      applySettings = vi.fn<(settings: Settings) => string[]>(() => []);
    const { result, rerender } = renderHook((props) => useSetupDraft({ ...props, applySettings }), {
      initialProps: { open: true, settings, mode: 'notes' as Mode },
    });
    act(() => result.current.update('global', { rootKey: 8 }));
    const nextSettings = structuredClone(settings);
    nextSettings.global.a4 = 432;
    nextSettings.global.rootKey = 5;
    rerender({ open: true, settings: nextSettings, mode: 'harmony' });
    expect(result.current.draft).toEqual(nextSettings);
    expect(result.current.a4Text).toBe('432');
    expect(result.current.configMode).toBe('harmony');
    expect(result.current.errors).toEqual([]);
  });
});
