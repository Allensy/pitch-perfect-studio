// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PitchView, Source } from '../src/domain/types';
import { MicControls } from '../src/features/vocal/MicrophoneControls';
import { PitchDisplay } from '../src/features/vocal/PitchDisplay';
import { Tuner, type TunerProps } from '../src/features/vocal/TunerPanel';

afterEach(cleanup);
const noPitch: PitchView = {
  frequency: null,
  midi: null,
  nearestCents: null,
  targetCents: null,
  hold: 0,
  preview: false,
  history: [],
};
const notation = { global: { rootKey: 0, notation: 'letter' as const } };

function pitchSource() {
  let snapshot = noPitch;
  const listeners = new Set<() => void>();
  const source: Source<PitchView> = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    source,
    listeners,
    publish(next: PitchView) {
      snapshot = next;
      listeners.forEach((listener) => listener());
    },
  };
}

function tunerProps(): TunerProps {
  return {
    drillMode: 'target',
    tolerance: 22,
    a4: 440,
    queue: [60, 64],
    queueIndex: 0,
    error: null,
    rearm: false,
    settings: notation,
    microphone: {
      status: 'off',
      message: 'Input stopped',
      onStart: vi.fn(),
      onStop: vi.fn(),
      onPreview: vi.fn(),
    },
    pitch: {
      source: pitchSource().source,
      settings: notation,
      status: 'off',
      rearm: false,
      complete: false,
    },
    onDrillChange: vi.fn(),
    onToleranceChange: vi.fn(),
    onHearTarget: vi.fn(),
    onEditSetup: vi.fn(),
    onRepeat: vi.fn(),
    onNext: vi.fn(),
    onSelectTarget: vi.fn(),
  };
}

describe('vocal views without an app controller or app-state fixture', () => {
  it('exposes start, cancellation and retry actions using only capture data and callbacks', () => {
    const actions = { onStart: vi.fn(), onStop: vi.fn(), onPreview: vi.fn() };
    const view = render(<MicControls status="off" message="Input stopped" {...actions} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start microphone' }));
    expect(actions.onStart).toHaveBeenCalledTimes(1);
    view.rerender(<MicControls status="waiting" message="Waiting for permission" {...actions} />);
    expect(
      (screen.getByRole('button', { name: 'Preview input' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel microphone request' }));
    expect(actions.onStop).toHaveBeenCalledTimes(1);
    view.rerender(<MicControls status="denied" message="Allow access and retry" {...actions} />);
    expect(screen.getByRole('status').textContent).toBe('Allow access and retry');
    fireEvent.click(screen.getByRole('button', { name: 'Retry microphone' }));
    expect(actions.onStart).toHaveBeenCalledTimes(2);
  });

  it('renders practice data and emits typed configuration and queue choices', () => {
    const props = tunerProps();
    render(<Tuner {...props} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Tolerance' }), {
      target: { value: '35' },
    });
    expect(props.onToleranceChange).toHaveBeenCalledWith(35);
    fireEvent.change(screen.getByRole('combobox', { name: 'Drill' }), {
      target: { value: 'arpeggio' },
    });
    expect(props.onDrillChange).toHaveBeenCalledWith('arpeggio');
    fireEvent.click(screen.getByRole('button', { name: 'E4' }));
    expect(props.onSelectTarget).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Next target' }));
    expect(props.onNext).toHaveBeenCalledTimes(1);
  });

  it('renders Free Tuner without graded-target controls', () => {
    const props = tunerProps();
    render(<Tuner {...props} drillMode="free" />);
    expect(screen.queryByRole('heading', { name: 'Up next' })).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByText('Nearest-note guidance ±22 cents · ungraded')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Target practice' }));
    expect(props.onDrillChange).toHaveBeenCalledWith('target');
  });

  it('updates a pitch display from its narrow source and releases that subscription on unmount', () => {
    const { source, listeners, publish } = pitchSource();
    const view = render(
      <PitchDisplay
        source={source}
        settings={notation}
        status="listening"
        target={69}
        tolerance={22}
        rearm={false}
        complete={false}
      />,
    );
    expect(listeners.size).toBe(1);
    expect(screen.getByText('Sing one steady note. Your reading will appear here.')).toBeTruthy();
    act(() =>
      publish({ ...noPitch, frequency: 440, midi: 69, nearestCents: 0, targetCents: 0, hold: 50 }),
    );
    expect(screen.getByText('440.0 Hz · nearest note 0¢')).toBeTruthy();
    expect(
      screen
        .getByRole('progressbar', { name: 'Continuous target hold' })
        .getAttribute('aria-valuenow'),
    ).toBe('50');
    view.unmount();
    expect(listeners.size).toBe(0);
  });
});
