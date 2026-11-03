// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../src/domain/music';
import type { Round } from '../src/domain/types';
import { Quiz } from '../src/features/quiz/QuizPanel';
import type { QuizProps } from '../src/features/quiz/contracts';
import { Piano } from '../src/features/piano/PianoKeyboard';

afterEach(cleanup);
function inputs(): QuizProps {
  const { global, notes, intervals, chords } = defaultSettings();
  const round: Round = {
    id: 1,
    question: { kind: 'notes', midi: 48 },
    phase: 'awaiting',
    lastAnswer: null,
    attempts: 0,
    credited: false,
    feedback: 'Choose your answer.',
    error: null,
  };
  return {
    mode: 'notes',
    round,
    settings: { global, notes, intervals, chords },
    onPlay: vi.fn(),
    onReference: vi.fn(),
    onSubmit: vi.fn(),
    onNext: vi.fn(),
    onOpenSetup: vi.fn(),
    onNoteSettingsChange: vi.fn(),
    onAudition: vi.fn(),
    onAuditionInterval: vi.fn(),
  };
}

// REF-09: these views work with domain data and callbacks, without an app/store/audio fixture.
describe('independent practice view contracts', () => {
  it('emits note answers and preference requests through separate callbacks', () => {
    const props = inputs();
    render(<Quiz {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'D answer' }));
    expect(props.onSubmit).toHaveBeenCalledWith({ pitchClass: 2 });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Exact octave' }));
    expect(props.onNoteSettingsChange).toHaveBeenCalledWith({ exactOctave: true });
    expect(props.onPlay).not.toHaveBeenCalled();
    expect(props.onNext).not.toHaveBeenCalled();
  });
  it('retains entries for a retry and discards them at the new-round boundary', () => {
    const props = inputs();
    props.settings.notes = { ...props.settings.notes, exactOctave: true };
    const { rerender } = render(<Quiz {...props} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Note' }), { target: { value: '0' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Octave' }), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(props.onSubmit).toHaveBeenCalledWith({ pitchClass: 0, midi: 60 });
    rerender(<Quiz {...props} round={{ ...props.round, phase: 'retry', attempts: 1 }} />);
    expect((screen.getByRole('combobox', { name: 'Octave' }) as HTMLSelectElement).value).toBe('4');
    rerender(<Quiz {...props} round={{ ...props.round, id: 2 }} />);
    expect((screen.getByRole('combobox', { name: 'Note' }) as HTMLSelectElement).value).toBe('');
    expect((screen.getByRole('combobox', { name: 'Octave' }) as HTMLSelectElement).value).toBe('');
  });
  it('keeps an incomplete answer local and supplies the chosen keyboard slot', () => {
    const props = inputs();
    props.settings.notes = { ...props.settings.notes, exactOctave: true };
    render(<Quiz {...props} keyboard={<div>Alternate keyboard</div>} />);
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('alert').textContent).toContain('Choose both a note and an octave');
    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Alternate keyboard')).toBeTruthy();
  });
  it('lets a piano consumer handle audition and answer independently', () => {
    const { global, piano } = defaultSettings();
    const callbacks = { onPreferencesChange: vi.fn(), onAnswer: vi.fn(), onAudition: vi.fn() };
    const { rerender } = render(<Piano settings={{ global, piano }} answerable {...callbacks} />);
    // Open the native disclosure for accessible role queries.
    screen.getByText('Keyboard').closest('details')!.open = true;
    fireEvent.click(screen.getByRole('button', { name: 'Audition C4' }));
    expect(callbacks.onAudition).toHaveBeenCalledWith(60);
    expect(callbacks.onAnswer).not.toHaveBeenCalled();
    rerender(
      <Piano
        settings={{ global, piano: { ...piano, inputMode: 'answer' } }}
        answerable
        {...callbacks}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Answer C4' }));
    expect(callbacks.onAnswer).toHaveBeenCalledWith({ pitchClass: 0, midi: 60 });
    fireEvent.click(screen.getByRole('button', { name: 'Next keyboard octave' }));
    expect(callbacks.onPreferencesChange).toHaveBeenCalledWith({ octave: 5 });
  });
});
