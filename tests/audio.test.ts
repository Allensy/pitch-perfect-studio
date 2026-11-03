import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioEngine, CaptureController, detectPitch } from '../src/audio';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
class Param {
  value = 0;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  setTargetAtTime = vi.fn();
  cancelScheduledValues = vi.fn();
}
class Node extends EventTarget {
  connect = vi.fn();
  disconnect = vi.fn();
}
class Gain extends Node {
  gain = new Param();
}
class Oscillator extends Node {
  type = 'sine';
  frequency = new Param();
  detune = new Param();
  start = vi.fn();
  stop = vi.fn();
}
class Analyser extends Node {
  fftSize = 2048;
  smoothingTimeConstant = 0;
  getFloatTimeDomainData = vi.fn((buffer: Float32Array) => buffer.fill(0));
}
class Context extends EventTarget {
  static instances: Context[] = [];
  static state: AudioContextState = 'running';
  static readiness: Promise<void> | null = null;
  static failAnalyser = false;
  state: AudioContextState = Context.state;
  sampleRate = 48000;
  currentTime = 0;
  destination = new Node();
  gains: Gain[] = [];
  sources: Node[] = [];
  analysers: Analyser[] = [];
  oscillators: Oscillator[] = [];
  constructor() {
    super();
    Context.instances.push(this);
  }
  createGain() {
    const node = new Gain();
    this.gains.push(node);
    return node;
  }
  createDynamicsCompressor() {
    return Object.assign(new Node(), {
      threshold: new Param(),
      knee: new Param(),
      ratio: new Param(),
      attack: new Param(),
      release: new Param(),
    });
  }
  createOscillator() {
    const node = new Oscillator();
    this.oscillators.push(node);
    return node;
  }
  createMediaStreamSource() {
    const node = new Node();
    this.sources.push(node);
    return node;
  }
  createAnalyser() {
    if (Context.failAnalyser) throw new Error('Graph initialization failed');
    const node = new Analyser();
    this.analysers.push(node);
    return node;
  }
  resume = vi.fn(async () => {
    if (Context.readiness) await Context.readiness;
    this.state = 'running';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });
}
class Track extends EventTarget {
  readyState = 'live';
  stop = vi.fn(() => {
    this.readyState = 'ended';
  });
}
function stream() {
  const track = new Track();
  const media = { getTracks: () => [track] } as unknown as MediaStream;
  return { track, media };
}
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

beforeEach(() => {
  vi.useFakeTimers();
  Context.instances = [];
  Context.state = 'running';
  Context.readiness = null;
  Context.failAnalyser = false;
  vi.stubGlobal('AudioContext', Context);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// UX-05 / TD-05: inert construction and owned asynchronous playback.
describe('AudioEngine ownership', () => {
  it('does not allocate audio until an intentional action, and cancels scheduled notes', async () => {
    const engine = new AudioEngine();
    expect(Context.instances).toHaveLength(0);
    const finished = engine.play([{ midi: 60, at: 2, duration: 1 }], { timbre: 'piano', a4: 440 });
    expect(Context.instances).toHaveLength(1);
    await flush();
    const context = Context.instances[0]!;
    expect(context.oscillators).toHaveLength(3);
    expect(context.oscillators[0]!.start).toHaveBeenCalledWith(2.015);
    engine.cancel();
    await finished;
    await vi.advanceTimersByTimeAsync(50);
    expect(context.oscillators.every((node) => node.disconnect.mock.calls.length === 1)).toBe(true);
    engine.dispose();
    engine.dispose();
    expect(context.close).toHaveBeenCalledTimes(1);
  });
  it('mutes the active and future scheduled voices of one lane without changing their envelopes', async () => {
    const engine = new AudioEngine();
    const started = vi.fn();
    const finished = engine.play(
      [
        { midi: 72, at: 0, duration: 1, voice: 0 },
        { midi: 74, at: 2, duration: 1, voice: 0 },
        { midi: 60, at: 0, duration: 1, voice: 1 },
      ],
      { timbre: 'sine', a4: 440, mutedVoices: [false, true, false, false], onStarted: started },
    );
    await flush();
    const context = Context.instances[0]!;
    expect(started).toHaveBeenCalledExactlyOnceWith(0.015);
    const gates = context.gains.filter((node) =>
      node.gain.setValueAtTime.mock.calls.some((call) => call[1] === 0),
    );
    expect(gates).toHaveLength(3);
    expect(gates.map((gate) => gate.gain.setValueAtTime.mock.calls[0]?.[0])).toEqual([1, 1, 0]);
    engine.setVoiceMuted(0, true);
    expect(gates[0]!.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.006);
    expect(gates[1]!.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.006);
    expect(gates[2]!.gain.setTargetAtTime).not.toHaveBeenCalled();
    engine.setVoiceMuted(1, false);
    expect(gates[2]!.gain.setTargetAtTime).toHaveBeenLastCalledWith(1, 0, 0.006);
    expect(context.oscillators.every((node) => node.start.mock.calls.length === 1)).toBe(true);
    engine.cancel();
    await finished;
    engine.dispose();
  });
  it('does not announce audio start for an invalid or cancelled schedule', async () => {
    const started = vi.fn(),
      engine = new AudioEngine();
    const empty = engine.play([{ midi: -1, at: 0, duration: 1 }], {
      timbre: 'sine',
      a4: 440,
      onStarted: started,
    });
    await flush();
    await vi.advanceTimersByTimeAsync(30);
    await empty;
    expect(started).not.toHaveBeenCalled();
    engine.dispose();
    const ready = deferred<void>();
    Context.state = 'suspended';
    Context.readiness = ready.promise;
    const second = new AudioEngine();
    const cancelled = second.play([{ midi: 60, at: 0, duration: 1 }], {
      timbre: 'sine',
      a4: 440,
      onStarted: started,
    });
    second.cancel();
    await cancelled;
    ready.resolve();
    await flush();
    expect(started).not.toHaveBeenCalled();
    second.dispose();
  });
  it('plays and finishes a cue on the same context without stopping its sustained backing', async () => {
    const engine = new AudioEngine();
    let backingFinished = false;
    const backing = engine
      .play([{ midi: 48, at: 0, duration: 2 }], { timbre: 'sine', a4: 440, loop: true })
      .then(() => {
        backingFinished = true;
      });
    await flush();
    const context = Context.instances[0]!,
      backingSource = context.oscillators[0]!;
    const cue = engine.overlay([{ midi: 64, at: 0, duration: 0.2 }], { timbre: 'sine', a4: 440 });
    await flush();
    expect(Context.instances).toHaveLength(1);
    expect(context.oscillators).toHaveLength(2);
    expect(backingSource.stop).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(400);
    await cue;
    expect(backingFinished).toBe(false);
    expect(backingSource.stop).not.toHaveBeenCalled();
    engine.cancel();
    await backing;
    engine.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('replaces only the older overlay and Stop All cancels both scopes', async () => {
    const engine = new AudioEngine();
    const backing = engine.play([{ midi: 48, at: 0, duration: 2 }], {
      timbre: 'sine',
      a4: 440,
      loop: true,
    });
    await flush();
    const context = Context.instances[0]!;
    const first = engine.overlay([{ midi: 60, at: 2, duration: 1 }], { timbre: 'sine', a4: 440 });
    await flush();
    const firstSource = context.oscillators[1]!;
    const second = engine.overlay([{ midi: 64, at: 0, duration: 1 }], { timbre: 'sine', a4: 440 });
    await first;
    await flush();
    expect(firstSource.stop).toHaveBeenCalledTimes(2);
    expect(context.oscillators[0]!.stop).not.toHaveBeenCalled();
    expect(context.oscillators[2]!.start).toHaveBeenCalledTimes(1);
    engine.cancel();
    await Promise.all([backing, second]);
    await vi.advanceTimersByTimeAsync(50);
    expect(context.oscillators.every((node) => node.disconnect.mock.calls.length === 1)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    engine.dispose();
  });
  it('settles pending main and overlay jobs before a late preparation finishes', async () => {
    const readiness = deferred<void>();
    Context.state = 'suspended';
    Context.readiness = readiness.promise;
    const engine = new AudioEngine(),
      started = vi.fn();
    const backing = engine.play([{ midi: 48, at: 0, duration: 2 }], {
      timbre: 'sine',
      a4: 440,
      loop: true,
      onStarted: started,
    });
    const oldCue = engine.overlay([{ midi: 60, at: 0, duration: 1 }], {
      timbre: 'sine',
      a4: 440,
      onStarted: started,
    });
    const cue = engine.overlay([{ midi: 64, at: 0, duration: 1 }], {
      timbre: 'sine',
      a4: 440,
      onStarted: started,
    });
    await oldCue;
    engine.cancel();
    await Promise.all([backing, cue]);
    readiness.resolve();
    await flush();
    expect(Context.instances).toHaveLength(1);
    expect(Context.instances[0]!.oscillators).toHaveLength(0);
    expect(started).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    engine.dispose();
  });
  it('a late resume cannot start a cancelled playback', async () => {
    const pending = deferred<void>();
    Context.state = 'suspended';
    Context.readiness = pending.promise;
    const engine = new AudioEngine();
    const finished = engine.play([{ midi: 60, at: 0, duration: 1 }], { timbre: 'sine', a4: 440 });
    engine.cancel();
    await finished;
    pending.resolve();
    await flush();
    expect(Context.instances[0]!.oscillators).toHaveLength(0);
    engine.dispose();
  });
  it('reports initialization failures rather than resolving successful playback', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const engine = new AudioEngine();
    await expect(
      engine.play([{ midi: 60, at: 0, duration: 1 }], { timbre: 'organ', a4: 440 }),
    ).rejects.toThrow('does not support Web Audio');
    engine.dispose();
  });
  it('cancellation disconnects graphs even when suspended audio cannot dispatch ended', async () => {
    const engine = new AudioEngine();
    const finished = engine.play([{ midi: 48, at: 0, duration: 4 }], {
      timbre: 'strings',
      a4: 440,
      loop: true,
    });
    await flush();
    const context = Context.instances[0]!;
    context.state = 'suspended';
    engine.cancel();
    await finished;
    expect(context.oscillators.every((node) => node.disconnect.mock.calls.length === 1)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    engine.dispose();
  });
});

// UX-05.B/C, TD-06: local leases and request epochs must never compete.
describe('CaptureController lease lifecycle', () => {
  it('stops a late cancelled stream without disturbing the newer accepted lease', async () => {
    const first = deferred<MediaStream>(),
      second = deferred<MediaStream>();
    const a = stream(),
      b = stream();
    const getUserMedia = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    const engine = new AudioEngine(),
      capture = new CaptureController(engine);
    const statusA = vi.fn(),
      statusB = vi.fn(),
      samples = vi.fn();
    const requestA = capture.start(samples, statusA, { a4: 440, lowMidi: 48, highMidi: 72 });
    await flush();
    capture.stop();
    const requestB = capture.start(samples, statusB, { a4: 430, lowMidi: 48, highMidi: 72 });
    await flush();
    second.resolve(b.media);
    await requestB;
    expect(statusB).toHaveBeenLastCalledWith('listening', expect.any(String));
    first.resolve(a.media);
    await requestA;
    expect(a.track.stop).toHaveBeenCalledTimes(1);
    expect(b.track.stop).not.toHaveBeenCalled();
    expect(statusB).toHaveBeenLastCalledWith('listening', expect.any(String));
    expect(Context.instances[0]!.sources[0]!.connect).not.toHaveBeenCalledWith(
      Context.instances[0]!.destination,
    );
    capture.stop();
    engine.dispose();
    expect(b.track.stop).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('ignores an older request rejection after a new lease is listening', async () => {
    const pending = deferred<MediaStream>(),
      newer = stream();
    const getUserMedia = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(newer.media);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    const engine = new AudioEngine(),
      capture = new CaptureController(engine),
      status = vi.fn();
    const first = capture.start(vi.fn(), vi.fn(), { a4: 440, lowMidi: 36, highMidi: 84 });
    await flush();
    capture.stop();
    await capture.start(vi.fn(), status, { a4: 440, lowMidi: 36, highMidi: 84 });
    pending.reject(new DOMException('No', 'NotAllowedError'));
    await first;
    expect(status).toHaveBeenLastCalledWith('listening', expect.any(String));
    expect(newer.track.stop).not.toHaveBeenCalled();
    capture.dispose();
    engine.dispose();
  });
  it('cleans stream and partial graph when analyser construction fails', async () => {
    const input = stream();
    Context.failAnalyser = true;
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(input.media) },
    });
    const engine = new AudioEngine(),
      capture = new CaptureController(engine),
      status = vi.fn();
    await capture.start(vi.fn(), status, { a4: 440, lowMidi: 36, highMidi: 84 });
    expect(input.track.stop).toHaveBeenCalledTimes(1);
    expect(Context.instances[0]!.sources[0]!.disconnect).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenLastCalledWith('unavailable', 'Graph initialization failed');
    capture.dispose();
    engine.dispose();
  });
  it('ended tracks stop analysis and clear the current measurement', async () => {
    const input = stream();
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(input.media) },
    });
    const engine = new AudioEngine(),
      capture = new CaptureController(engine),
      status = vi.fn(),
      samples = vi.fn();
    await capture.start(samples, status, { a4: 440, lowMidi: 36, highMidi: 84 });
    input.track.readyState = 'ended';
    input.track.dispatchEvent(new Event('ended'));
    expect(status).toHaveBeenLastCalledWith('interrupted', expect.stringMatching(/disconnected/));
    expect(samples).toHaveBeenLastCalledWith(null, expect.any(Number));
    expect(vi.getTimerCount()).toBe(0);
    capture.dispose();
    engine.dispose();
  });
  it('does not ask for media after cancellation during audio preparation', async () => {
    const readiness = deferred<void>();
    Context.state = 'suspended';
    Context.readiness = readiness.promise;
    const getUserMedia = vi.fn();
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    const engine = new AudioEngine(),
      capture = new CaptureController(engine),
      status = vi.fn();
    const pending = capture.start(vi.fn(), status, { a4: 440, lowMidi: 36, highMidi: 84 });
    expect(Context.instances[0]!.resume).toHaveBeenCalledTimes(1);
    capture.stop();
    readiness.resolve();
    await pending;
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(status).toHaveBeenLastCalledWith('off', 'Microphone off.');
    capture.dispose();
    engine.dispose();
  });
  it('does not publish an already-ended candidate as listening', async () => {
    const input = stream();
    input.track.readyState = 'ended';
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(input.media) },
    });
    const engine = new AudioEngine(),
      capture = new CaptureController(engine),
      status = vi.fn();
    await capture.start(vi.fn(), status, { a4: 440, lowMidi: 36, highMidi: 84 });
    expect(status).toHaveBeenLastCalledWith('interrupted', expect.stringMatching(/ended before/));
    expect(status.mock.calls.some(([state]) => state === 'listening')).toBe(false);
    expect(input.track.stop).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    capture.dispose();
    engine.dispose();
  });
  it('turns permission denial into actionable UI status without a live stream', async () => {
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')),
      },
    });
    const engine = new AudioEngine(),
      capture = new CaptureController(engine),
      status = vi.fn();
    await capture.start(vi.fn(), status, { a4: 440, lowMidi: 36, highMidi: 84 });
    expect(status).toHaveBeenLastCalledWith(
      'denied',
      expect.stringMatching(/browser\/site settings/),
    );
    expect(vi.getTimerCount()).toBe(0);
    capture.dispose();
    engine.dispose();
  });
});

// UX-06 / TD-07: tuned low endpoints and 96 kHz are synthetic detector fixtures only.
describe('pitch detector', () => {
  for (const sampleRate of [44100, 48000, 96000]) {
    for (const a4 of [430, 440, 448]) {
      for (const midi of [36, 48, 69, 84]) {
        it(`finds MIDI ${midi} at A4=${a4}, ${sampleRate}Hz`, () => {
          const expected = a4 * 2 ** ((midi - 69) / 12);
          const min = a4 * 2 ** ((35 - 69) / 12),
            max = a4 * 2 ** ((85 - 69) / 12);
          let size = 2048;
          while (size < (sampleRate / min) * 4.5) size *= 2;
          const buffer = Float32Array.from(
            { length: size },
            (_, i) => 0.2 * Math.sin((2 * Math.PI * expected * i) / sampleRate),
          );
          const detected = detectPitch(buffer, sampleRate, min, max);
          expect(detected).not.toBeNull();
          expect(Math.abs(1200 * Math.log2(detected! / expected))).toBeLessThan(12);
        });
      }
    }
  }
  it('returns no current pitch for silence, DC offset and deterministic noise', () => {
    expect(detectPitch(new Float32Array(8192), 96000, 60, 1200)).toBeNull();
    expect(detectPitch(new Float32Array(8192).fill(0.2), 96000, 60, 1200)).toBeNull();
    let seed = 42;
    const noise = Float32Array.from({ length: 8192 }, () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed / 2 ** 32 - 0.5) * 0.2;
    });
    expect(detectPitch(noise, 96000, 60, 1200)).toBeNull();
  });
});

// Mobile audio-session routing: these mocks verify policy/lifecycle, not iPhone loudness.
describe('mobile playback and microphone audio sessions', () => {
  const config = { a4: 440, lowMidi: 48, highMidi: 72 };
  function sessionWith(getUserMedia = vi.fn()) {
    const session = { type: 'auto' };
    vi.stubGlobal('navigator', { audioSession: session, mediaDevices: { getUserMedia } });
    return session;
  }
  it('requests media playback on intentional sound, keeps output settings and releases the session on disposal', async () => {
    const session = sessionWith();
    const engine = new AudioEngine();
    expect(session.type).toBe('auto');
    engine.setOutput(37, true);
    expect(session.type).toBe('auto');
    await engine.prepare();
    expect(session.type).toBe('playback');
    expect(Context.instances[0]!.gains[0]!.gain.setTargetAtTime).toHaveBeenLastCalledWith(
      0,
      0,
      0.012,
    );
    engine.dispose();
    expect(session.type).toBe('auto');
  });
  it('enters recording mode before requesting the mic and restores playback after tracks stop', async () => {
    const input = stream();
    const getUserMedia = vi.fn(async () => {
      expect(session.type).toBe('play-and-record');
      return input.media;
    });
    const session = sessionWith(getUserMedia);
    const engine = new AudioEngine(),
      capture = new CaptureController(engine);
    await engine.prepare();
    await capture.start(vi.fn(), vi.fn(), config);
    await engine.prepare(); // A cue during capture must retain duplex mode.
    expect(session.type).toBe('play-and-record');
    input.track.stop.mockImplementation(() => {
      expect(session.type).toBe('play-and-record');
      input.track.readyState = 'ended';
    });
    capture.stop();
    expect(input.track.stop).toHaveBeenCalledTimes(1);
    expect(session.type).toBe('playback');
    expect(Context.instances).toHaveLength(1);
    capture.dispose();
    engine.dispose();
  });
  for (const reason of ['denial', 'graph failure', 'track interruption']) {
    it(`restores playback on ${reason}`, async () => {
      const input = stream();
      const session = sessionWith(
        vi
          .fn()
          .mockImplementation(() =>
            reason === 'denial'
              ? Promise.reject(new DOMException('Denied', 'NotAllowedError'))
              : Promise.resolve(input.media),
          ),
      );
      Context.failAnalyser = reason === 'graph failure';
      const engine = new AudioEngine(),
        capture = new CaptureController(engine);
      await capture.start(vi.fn(), vi.fn(), config);
      if (reason === 'track interruption') input.track.dispatchEvent(new Event('mute'));
      expect(session.type).toBe('playback');
      if (reason !== 'denial') expect(input.track.stop).toHaveBeenCalledTimes(1);
      capture.dispose();
      engine.dispose();
    });
  }
  it('cancels a pending permission request and repairs a late grant without reopening the tab', async () => {
    const pending = deferred<MediaStream>(),
      input = stream();
    const session = sessionWith(vi.fn().mockReturnValue(pending.promise));
    const engine = new AudioEngine(),
      capture = new CaptureController(engine);
    const request = capture.start(vi.fn(), vi.fn(), config);
    await flush();
    capture.stop();
    expect(session.type).toBe('playback');
    session.type = 'play-and-record'; // Browser switches routes when the late grant resolves.
    pending.resolve(input.media);
    await request;
    expect(input.track.stop).toHaveBeenCalledTimes(1);
    expect(session.type).toBe('playback');
    capture.dispose();
    engine.dispose();
  });
  it('does not let an old permission result reset a newer capture session', async () => {
    const pending = deferred<MediaStream>(),
      old = stream(),
      current = stream();
    const session = sessionWith(
      vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValueOnce(current.media),
    );
    const engine = new AudioEngine(),
      capture = new CaptureController(engine);
    const request = capture.start(vi.fn(), vi.fn(), config);
    await flush();
    capture.stop();
    await capture.start(vi.fn(), vi.fn(), config);
    pending.resolve(old.media);
    await request;
    expect(old.track.stop).toHaveBeenCalledTimes(1);
    expect(current.track.stop).not.toHaveBeenCalled();
    expect(session.type).toBe('play-and-record');
    capture.stop();
    expect(session.type).toBe('playback');
    capture.dispose();
    engine.dispose();
  });
  it('restores playback when cancelled during audio preparation before requesting permission', async () => {
    const ready = deferred<void>(),
      getUserMedia = vi.fn();
    const session = sessionWith(getUserMedia);
    Context.state = 'suspended';
    Context.readiness = ready.promise;
    const engine = new AudioEngine(),
      capture = new CaptureController(engine);
    const request = capture.start(vi.fn(), vi.fn(), config);
    capture.stop();
    expect(session.type).toBe('playback');
    ready.resolve();
    await request;
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(session.type).toBe('playback');
    capture.dispose();
    engine.dispose();
  });
  for (const failure of ['getter', 'setter']) {
    it(`keeps audio/capture usable when the optional session ${failure} throws`, async () => {
      const input = stream(),
        session = {};
      Object.defineProperty(session, 'type', {
        get() {
          if (failure === 'getter') throw new Error('Unsupported');
          return 'auto';
        },
        set() {
          throw new Error('Unsupported');
        },
      });
      vi.stubGlobal('navigator', {
        audioSession: session,
        mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(input.media) },
      });
      const engine = new AudioEngine(),
        capture = new CaptureController(engine),
        status = vi.fn();
      await engine.prepare();
      await capture.start(vi.fn(), status, config);
      expect(status).toHaveBeenLastCalledWith('listening', expect.any(String));
      capture.stop();
      expect(input.track.stop).toHaveBeenCalledTimes(1);
      capture.dispose();
      engine.dispose();
    });
  }
});
