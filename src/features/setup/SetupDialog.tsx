import { modes } from '@/app/navigation';
import { captureLabel } from '@/components/audio/capture-status';
import { Output } from '@/components/audio/output-controls';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { SelectField } from '@/components/ui/fields';
import type { AppState, Runtime } from '@/domain/types';
import { Check } from 'lucide-react';
import { useId, useRef, type FormEvent, type RefObject } from 'react';
import { ChordSettings } from './ChordSettings';
import { GeneralSettings } from './GeneralSettings';
import { HarmonySettings } from './HarmonySettings';
import { IntervalSettings } from './IntervalSettings';
import { KeyboardSettings } from './KeyboardSettings';
import { NoteSettings } from './NoteSettings';
import { TunerSettings } from './TunerSettings';
import { useSetupDraft } from './useSetupDraft';

const modeOptions = modes.map((mode) => ({ value: mode.id, label: mode.label }));

export function Setup({
  runtime,
  state,
  returnFocusRef,
}: {
  runtime: Runtime;
  state: AppState;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const editor = useSetupDraft({
    open: state.setupOpen,
    settings: state.settings,
    mode: state.mode,
    applySettings: runtime.applySettings,
  });
  const { draft, configMode, errors, update } = editor;
  const errorRef = useRef<HTMLDivElement>(null);
  const formId = useId();
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor.apply()) requestAnimationFrame(() => errorRef.current?.focus());
  }

  return (
    <Dialog open={state.setupOpen} onOpenChange={(open) => runtime.setSetup(open)}>
      <DialogContent
        className="setup-dialog"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          requestAnimationFrame(() => {
            if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
          });
        }}
      >
        <div className="dialog-heading">
          <DialogTitle>Set the room.</DialogTitle>
          <DialogDescription>Your musical setup. Your pace.</DialogDescription>
        </div>
        <div className="dialog-body">
          <section className="setup-section">
            <div className="section-heading">
              <h2>Output</h2>
              <span className="immediate-label">Immediate · outside Apply/Cancel</span>
            </div>
            <Output state={state} runtime={runtime} />
          </section>
          <section className="dialog-capture">
            <div>
              <strong>{captureLabel(state.capture)}</strong>
              <p>
                {state.capture === 'off'
                  ? 'Input is stopped.'
                  : 'Practice holds are paused while Setup is open.'}
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => runtime.stopAll()}
              disabled={state.capture === 'off' && !state.playing && !state.mixerPlaying}
            >
              {state.capture === 'waiting' ? 'Cancel request' : 'Stop all'}
            </Button>
          </section>
          <form id={formId} onSubmit={apply} noValidate>
            {errors.length > 0 && (
              <div className="notice notice-error" role="alert" tabIndex={-1} ref={errorRef}>
                <strong>Check your setup</strong>
                <ul>
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            <GeneralSettings
              settings={draft.global}
              onChange={(patch) => update('global', patch)}
              a4Text={editor.a4Text}
              onA4Change={editor.setA4Text}
              onRangePreset={editor.selectRangePreset}
            />
            <fieldset className="setup-section">
              <legend>Practice settings</legend>
              <SelectField
                label="Configure mode"
                value={configMode}
                options={modeOptions}
                onChange={editor.setConfigMode}
              />
              {configMode === 'notes' && (
                <NoteSettings settings={draft.notes} onChange={(patch) => update('notes', patch)} />
              )}
              {configMode === 'intervals' && (
                <IntervalSettings
                  settings={draft.intervals}
                  onChange={(patch) => update('intervals', patch)}
                />
              )}
              {configMode === 'chords' && (
                <ChordSettings
                  settings={draft.chords}
                  onChange={(patch) => update('chords', patch)}
                />
              )}
              {configMode === 'harmony' && (
                <HarmonySettings
                  settings={draft.harmony}
                  onChange={(patch) => update('harmony', patch)}
                />
              )}
              {configMode === 'tuner' && (
                <TunerSettings
                  settings={draft.tuner}
                  onChange={(patch) => update('tuner', patch)}
                />
              )}
            </fieldset>
            <KeyboardSettings settings={draft.piano} onChange={(patch) => update('piano', patch)} />
          </form>
          <p className="dialog-footnote">
            Apply prepares a fresh round when the musical task changes, with playback and input
            stopped. Label-only changes keep the round. Cancel discards draft edits; it never
            reverses Stop or immediate output changes.
          </p>
        </div>
        <footer className="dialog-footer">
          <Button onClick={() => runtime.setSetup(false)}>Cancel</Button>
          <Button type="submit" form={formId} variant="primary">
            Apply setup <Check size={14} aria-hidden="true" />
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
