import { afterEach, describe, expect, it } from 'vitest';
import { createRuntime } from '../src/runtime';
import { midiToFrequency } from '../src/domain/music';
import type { CaptureStatus, Runtime } from '../src/domain/types';

const runtimes: Runtime[] = [];
afterEach(() => {
  runtimes.splice(0).forEach((runtime) => runtime.dispose());
});
function narrowHarmony() {
  const values = new Map<string, string>();
  let clock = 0;
  let sample: (frequency: number | null, time: number) => void = () => {};
  const runtime = createRuntime({
    storage: () => ({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value);
      },
    }),
    audio: {
      prepare: async () => {},
      play: async () => {},
      cancel: () => {},
      setOutput: () => {},
      dispose: () => {},
    },
    capture: {
      start: async (onSample, onStatus: (status: CaptureStatus, text: string) => void) => {
        sample = onSample;
        onStatus('listening', 'Listening');
      },
      stop: () => {},
      dispose: () => {},
    },
    random: () => 0.23,
    now: () => clock,
  });
  runtimes.push(runtime);
  runtime.attach();
  const settings = structuredClone(runtime.state.getSnapshot().settings);
  settings.global.lowMidi = 60;
  settings.global.highMidi = 64;
  settings.global.rangePreset = 'custom';
  settings.harmony.challengeId = 'major3';
  expect(runtime.applySettings(settings)).toEqual([]);
  runtime.setMode('harmony');
  runtime.startMic();
  const target = runtime.state.getSnapshot().vocal?.targetMidi;
  if (target === undefined)
    throw new Error('Narrow Harmony fixture must have the one feasible C4 → E4 reference.');
  const emit = (from: number, to: number) => {
    for (let time = from; time <= to; time += 40) {
      clock = time;
      sample(midiToFrequency(target, settings.global.a4), time);
    }
  };
  return { runtime, emit };
}

describe('Harmony target identity and stale queue controls', () => {
  it('preserves a visible Ready Again path after completing the only feasible target and returning from Tuner', () => {
    const { runtime, emit } = narrowHarmony();
    emit(200, 1760);
    expect(runtime.state.getSnapshot()).toMatchObject({ targetComplete: true, rearm: true });
    expect(runtime.state.getSnapshot().envelope.progress.vocal.harmonyLocks).toBe(1);
    runtime.setMode('tuner');
    runtime.setMode('harmony');
    expect(runtime.state.getSnapshot()).toMatchObject({ targetComplete: true, rearm: true });
    runtime.newReference();
    expect(runtime.state.getSnapshot().message).toMatch(/Only this reference fits/);
    emit(2000, 3760);
    expect(runtime.state.getSnapshot().envelope.progress.vocal.harmonyLocks).toBe(1);
    const previousId = runtime.state.getSnapshot().targetId;
    runtime.readyAgain();
    expect(runtime.state.getSnapshot().targetId).not.toBe(previousId);
    expect(runtime.state.getSnapshot()).toMatchObject({ targetComplete: false, rearm: false });
    emit(4000, 5560);
    expect(runtime.state.getSnapshot().envelope.progress.vocal.harmonyLocks).toBe(2);
    expect(runtime.state.getSnapshot().envelope.progress.xpEarned).toBe(0);
  });
  it('ignores a stale Tuner queue selection while Harmony is visible', () => {
    const { runtime } = narrowHarmony();
    const before = runtime.state.getSnapshot();
    expect(before.queue.length).toBeGreaterThan(1);
    runtime.selectTarget(1);
    expect(runtime.state.getSnapshot()).toBe(before);
  });
});
