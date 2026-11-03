// @vitest-environment jsdom
import { useRef, useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../src/domain/music';
import type { Progress as PracticeProgress, Settings } from '../src/domain/types';
import { Help } from '../src/features/context/MusicalContext';
import { SetupSummary } from '../src/features/context/SetupSummary';
import { Progress } from '../src/features/progress/ProgressPanel';
import { Setup } from '../src/features/setup/SetupDialog';

afterEach(cleanup);

const settings = defaultSettings();
const quizCounters = { attempts: 2, correct: 1, firstTryCorrect: 1, skips: 0 };
const progress: PracticeProgress = {
  xpEarned: 30,
  currentStreak: 1,
  quizzes: {
    notes: { ...quizCounters },
    intervals: { ...quizCounters },
    chords: { ...quizCounters },
  },
  noteStats: Array.from({ length: 12 }, () => ({ attempts: 0, correct: 0 })),
  vocal: { completedTargets: 2, harmonyLocks: 1 },
};

// REF-01/03: examples wire only view inputs/callbacks, with no application store or runtime.
function SetupExample({
  onApply,
  onStop,
  onOutput,
}: {
  onApply: (candidate: Settings) => string[];
  onStop: () => void;
  onOutput: (volume: number, muted: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(40);
  const [muted, setMuted] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={opener} onClick={() => setOpen(true)}>
        Open settings
      </button>
      <output data-testid="output-state">
        {volume} · {String(muted)}
      </output>
      <Setup
        settings={settings}
        mode="notes"
        open={open}
        captureStatus="waiting"
        canStop
        volume={volume}
        muted={muted}
        returnFocusRef={opener}
        onOpenChange={setOpen}
        onStop={onStop}
        onApply={(candidate) => {
          const errors = onApply(candidate);
          if (!errors.length) setOpen(false);
          return errors;
        }}
        onOutputChange={(nextVolume, nextMuted) => {
          onOutput(nextVolume, nextMuted);
          setVolume(nextVolume);
          setMuted(nextMuted);
        }}
      />
    </>
  );
}

describe('isolated workspace views', () => {
  it('keeps immediate output/Stop separate from cancelled Setup edits and restores opener focus', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn<(candidate: Settings) => string[]>(() => []);
    const onStop = vi.fn(),
      onOutput = vi.fn();
    render(<SetupExample onApply={onApply} onStop={onStop} onOutput={onOutput} />);
    const opener = screen.getByRole('button', { name: 'Open settings' });
    await user.click(opener);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Root key' }), '2');
    fireEvent.change(screen.getByRole('slider', { name: 'Output volume' }), {
      target: { value: '23' },
    });
    await user.click(screen.getByRole('button', { name: 'Mute output' }));
    await user.click(screen.getByRole('button', { name: 'Cancel request' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(onStop).toHaveBeenCalledOnce();
    expect(onOutput).toHaveBeenLastCalledWith(23, true);
    expect(screen.getByTestId('output-state')).toHaveTextContent('23 · true');
    await waitFor(() => expect(opener).toHaveFocus());
    await user.click(opener);
    expect(screen.getByRole('combobox', { name: 'Root key' })).toHaveValue('0');
    expect(screen.getByRole('slider', { name: 'Output volume' })).toHaveValue('23');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Root key' }), '5');
    await user.click(screen.getByRole('button', { name: 'Apply setup' }));
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply.mock.calls[0]![0].global.rootKey).toBe(5);
    expect(settings.global.rootKey).toBe(0);
  });

  it('renders a setup summary with global settings and two focused callbacks', async () => {
    const user = userEvent.setup(),
      onOpenSetup = vi.fn(),
      onOutputChange = vi.fn();
    render(
      <SetupSummary
        settings={settings.global}
        volume={40}
        muted={false}
        onOpenSetup={onOpenSetup}
        onOutputChange={onOutputChange}
      />,
    );
    expect(screen.getByText('C Major')).toBeInTheDocument();
    expect(screen.getByText('C3–C5')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit setup' }));
    await user.click(screen.getByRole('button', { name: 'Mute output' }));
    expect(onOpenSetup).toHaveBeenCalledOnce();
    expect(onOutputChange).toHaveBeenCalledWith(40, true);
  });

  it('renders musical help from a mode without application state', async () => {
    const user = userEvent.setup();
    render(<Help mode="intervals" />);
    await user.click(screen.getByText('A little musical context'));
    expect(screen.getByText('Hear the distance, then the name.')).toBeVisible();
    expect(screen.getByText(/lower note is the reference anchor/)).toBeVisible();
  });

  it('cancels progress reset without invoking the destructive callback', async () => {
    const user = userEvent.setup(),
      onStop = vi.fn(),
      onReset = vi.fn(() => true);
    render(
      <Progress progress={progress} legacy={null} mode="notes" onStop={onStop} onReset={onReset} />,
    );
    await user.click(screen.getByText('Your progress'));
    expect(screen.getByText('30')).toBeVisible();
    const opener = screen.getByRole('button', { name: 'Reset progress' });
    await user.click(opener);
    expect(onStop).toHaveBeenCalledOnce();
    const dialog = screen.getByRole('dialog', { name: 'Reset your progress?' });
    await user.click(within(dialog).getByRole('button', { name: 'Keep progress' }));
    expect(onReset).not.toHaveBeenCalled();
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('keeps failed reset confirmation open for retry and reports successful persistence', async () => {
    const user = userEvent.setup(),
      onReset = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(
      <Progress
        progress={progress}
        legacy={null}
        mode="harmony"
        onStop={vi.fn()}
        onReset={onReset}
      />,
    );
    await user.click(screen.getByText('Your progress'));
    await user.click(screen.getByRole('button', { name: 'Reset progress' }));
    const dialog = screen.getByRole('dialog', { name: 'Reset your progress?' });
    await user.click(within(dialog).getByRole('button', { name: 'Reset progress' }));
    expect(dialog).toBeVisible();
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      'Reset was not saved. Your previous progress has been kept.',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Reset progress' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Progress reset. Musical setup kept.');
    expect(onReset).toHaveBeenCalledTimes(2);
  });
});
