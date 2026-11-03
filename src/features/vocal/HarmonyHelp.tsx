import { HelpDialog } from '@/components/help-dialog';

export function HarmonyHelp() {
  return (
    <div className="practice-help-row">
      <HelpDialog
        triggerLabel="How to practice"
        title="Find your harmony"
        description="Sing one note against the backing, then hold it steady. Here’s how to get started."
        steps={[
          {
            title: 'Listen to the backing',
            body: 'Press Hold backing to hear your reference. Use Cue my note to hear the exact pitch you’ll sing, or Preview full blend to hear how it fits.',
          },
          {
            title: 'Sing your target',
            body: 'Press Start microphone and allow access. Sing the note and octave shown under Your target; the pitch display shows whether you’re above or below it.',
          },
          {
            title: 'Settle in and hold',
            body: 'Stay within ±25 cents for 1.5 continuous seconds to earn a lock. If your pitch drifts or you pause, the hold starts again.',
          },
        ]}
      >
        <h3>Want a different note?</h3>
        <p>
          Next target changes the reference and sung note while keeping your challenge. Tonic only
          keeps the root on the key’s home note and varies its octave; choose Notes in this key for
          more variety. If only one target fits, widen your range or change the challenge.
        </p>
        <h3>Just exploring?</h3>
        <p>
          Preview input is simulated and never earns a lock. After a real lock, use Repeat this
          target to practice the same note again.
        </p>
      </HelpDialog>
    </div>
  );
}
