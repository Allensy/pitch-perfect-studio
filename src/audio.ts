import type { CaptureStatus, Timbre } from './domain/types';

/** Scheduled offsets/durations use the audio clock, in seconds. */
export interface PlaybackNote {
  midi: number;
  at: number;
  duration: number;
  gain?: number;
  voice?: number;
}
export interface PlaybackConfig {
  timbre: Timbre;
  a4: number;
  loop?: boolean;
  mutedVoices?: readonly boolean[];
  onStarted?: (audioStartTime: number) => void;
}
interface Voice {
  lane: number | undefined;
  setMuted(muted: boolean): void;
  dispose(immediate?: boolean): void;
}
interface Playback {
  epoch: number;
  voices: Set<Voice>;
  timer: ReturnType<typeof setTimeout> | null;
  resolve(): void;
}

function diagnostic(error: unknown) {
  if (!(error instanceof DOMException && error.name === 'InvalidStateError'))
    console.warn('Pitch Perfect audio cleanup:', error);
}
function safely(action: () => void) {
  try {
    action();
  } catch (error) {
    diagnostic(error);
  }
}
const frequency = (midi: number, a4: number) => a4 * 2 ** ((midi - 69) / 12);

/** Construction is inert. Only an intentional command calls prepare/play. */
export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private playback: Playback | null = null;
  private overlayPlayback: Playback | null = null;
  private releasing = new Set<Voice>();
  private epoch = 0;
  private overlayEpoch = 0;
  private disposed = false;
  private volume = 65;
  private muted = false;
  private captureSessions = new Set<symbol>();
  private sessionConfigured = false;

  private applyAudioSession() {
    // Optional Audio Session API (notably iOS). Never let an unsupported or
    // restricted setter prevent playback or leave microphone tracks running.
    try {
      const session = (
        globalThis.navigator as (Navigator & { audioSession?: { type: string } }) | undefined
      )?.audioSession;
      if (!session) return;
      const type = this.disposed
        ? 'auto'
        : this.captureSessions.size
          ? 'play-and-record'
          : 'playback';
      if (session.type !== type) session.type = type;
      this.sessionConfigured = true;
    } catch {
      // Feature detection includes implementations whose setter can throw.
    }
  }

  /** One cancellable capture request owns one session lease. */
  acquireCaptureSession(): () => void {
    if (this.disposed) return () => {};
    const owner = Symbol('capture session');
    this.captureSessions.add(owner);
    this.applyAudioSession();
    return () => {
      this.captureSessions.delete(owner);
      // Reassert the current owner's mode even on a repeated release: a late
      // getUserMedia grant can change the OS route after its request was cancelled.
      if (!this.disposed) this.applyAudioSession();
    };
  }

  getContext() {
    return this.context;
  }

  prepare(): Promise<void> {
    if (this.disposed)
      return Promise.reject(new Error('Audio is unavailable after the application has closed.'));
    try {
      this.applyAudioSession();
      if (!this.context) {
        const Constructor =
          globalThis.AudioContext ??
          (globalThis as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Constructor)
          throw new Error(
            'This browser does not support Web Audio. Try a current Safari or Chrome browser.',
          );
        const context = new Constructor();
        this.context = context;
        try {
          this.master = context.createGain();
          this.limiter = context.createDynamicsCompressor();
          this.limiter.threshold.value = -10;
          this.limiter.knee.value = 12;
          this.limiter.ratio.value = 12;
          this.limiter.attack.value = 0.003;
          this.limiter.release.value = 0.18;
          this.master.connect(this.limiter);
          this.limiter.connect(context.destination);
          this.applyOutput();
        } catch (error) {
          safely(() => this.master?.disconnect());
          safely(() => this.limiter?.disconnect());
          void context.close().catch(diagnostic);
          this.context = null;
          this.master = null;
          this.limiter = null;
          throw error;
        }
      }
      // Resume is invoked before the caller's first await, preserving the gesture.
      const context = this.context;
      const ready = context.state === 'running' ? Promise.resolve() : context.resume();
      return ready.then(() => {
        if (this.disposed || context.state === 'closed')
          throw new Error('Audio was stopped before it could start.');
        if (context.state !== 'running')
          throw new Error(
            'Audio is paused by your browser. Press Play or Start microphone to retry.',
          );
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  setOutput(volume: number, muted: boolean) {
    this.volume = Number.isFinite(volume) ? Math.max(0, Math.min(100, volume)) : 0;
    this.muted = muted;
    this.applyOutput();
  }
  private applyOutput() {
    if (!this.context || !this.master) return;
    const value = this.muted ? 0 : (this.volume / 100) * 0.55;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(value, this.context.currentTime, 0.012);
  }

  play(notes: readonly PlaybackNote[], config: PlaybackConfig): Promise<void> {
    this.cancel();
    return this.schedule(notes, config, false);
  }

  /** Replace a transient cue without silencing sustained main accompaniment. */
  overlay(notes: readonly PlaybackNote[], config: PlaybackConfig): Promise<void> {
    this.cancelOverlay();
    return this.schedule(notes, config, true);
  }

  private schedule(
    notes: readonly PlaybackNote[],
    config: PlaybackConfig,
    overlay: boolean,
  ): Promise<void> {
    const epoch = overlay ? this.overlayEpoch : this.epoch;
    return new Promise<void>((resolve, reject) => {
      const job: Playback = { epoch, voices: new Set(), timer: null, resolve };
      if (overlay) this.overlayPlayback = job;
      else this.playback = job;
      const current = () =>
        !this.disposed &&
        (overlay
          ? this.overlayPlayback === job && epoch === this.overlayEpoch
          : this.playback === job && epoch === this.epoch);
      // Calling this async closure synchronously initiates prepare in the gesture.
      void (async () => {
        try {
          await this.prepare();
          if (!current()) return;
          const context = this.context;
          if (!context || !this.master)
            throw new Error('Audio could not be initialized. Please retry.');
          const start = context.currentTime + 0.015;
          let finish = 0;
          for (const note of notes) {
            if (
              !Number.isFinite(note.midi) ||
              !Number.isFinite(note.at) ||
              !Number.isFinite(note.duration)
            )
              continue;
            if (note.midi < 36 || note.midi > 84 || note.at < 0 || note.duration <= 0) continue;
            const voice = this.createVoice(note, start, config, job);
            job.voices.add(voice);
            finish = Math.max(finish, note.at + note.duration + 0.1);
          }
          if (job.voices.size > 0) config.onStarted?.(start);
          if (!current()) return;
          if (!config.loop || job.voices.size === 0) {
            job.timer = setTimeout(
              () => {
                if (current()) this.finish(job);
              },
              (finish + 0.025) * 1000,
            );
          }
        } catch (error) {
          if (!current()) return;
          reject(error);
          this.finish(job, true);
        }
      })();
    });
  }

  private createVoice(
    note: PlaybackNote,
    start: number,
    config: PlaybackConfig,
    job: Playback,
  ): Voice {
    const context = this.context!;
    const gain = context.createGain();
    let gate: GainNode | null = null;
    const oscillators: OscillatorNode[] = [];
    const harmonics: GainNode[] = [];
    let cleanupTimer: ReturnType<typeof setTimeout> | null = null;
    let done = false;
    let stopped = false;
    const began = new Set<OscillatorNode>();
    const onEnded = () => {
      ended++;
      if (ended >= oscillators.length) disposeNow();
    };
    let ended = 0;
    const disposeNow = () => {
      if (done) return;
      done = true;
      if (cleanupTimer !== null) clearTimeout(cleanupTimer);
      for (const oscillator of oscillators) {
        oscillator.removeEventListener('ended', onEnded);
        safely(() => oscillator.disconnect());
      }
      harmonics.forEach((node) => safely(() => node.disconnect()));
      safely(() => gain.disconnect());
      safely(() => gate?.disconnect());
      job.voices.delete(voice);
      this.releasing.delete(voice);
    };
    const voice: Voice = {
      lane: note.voice,
      setMuted: (muted) => {
        if (done || !gate) return;
        gate.gain.cancelScheduledValues(context.currentTime);
        gate.gain.setTargetAtTime(muted ? 0 : 1, context.currentTime, 0.006);
      },
      dispose: (immediate = false) => {
        if (done || stopped) {
          if (immediate) disposeNow();
          return;
        }
        stopped = true;
        const now = context.currentTime;
        const releasing = !immediate && context.state === 'running';
        safely(() => {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setTargetAtTime(0, now, 0.006);
        });
        for (const oscillator of began)
          safely(() => oscillator.stop(now + (releasing ? 0.025 : 0)));
        if (releasing) {
          this.releasing.add(voice);
          cleanupTimer = setTimeout(disposeNow, 40);
        } else disposeNow();
      },
    };
    try {
      gate = context.createGain();
      gain.connect(gate);
      gate.connect(this.master!);
      const initiallyMuted = note.voice !== undefined && config.mutedVoices?.[note.voice] === true;
      gate.gain.setValueAtTime(initiallyMuted ? 0 : 1, context.currentTime);
      const at = start + note.at;
      const duration = Math.max(0.03, note.duration);
      const amplitude = Math.min(0.28, Math.max(0, note.gain ?? 0.22));
      const attack = Math.min(
        duration / 3,
        config.timbre === 'strings' ? 0.09 : config.timbre === 'piano' ? 0.006 : 0.014,
      );
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(amplitude, at + Math.min(attack, duration / 3));
      gain.gain.setTargetAtTime(
        amplitude * (config.timbre === 'piano' || config.timbre === 'epiano' ? 0.25 : 0.8),
        at + attack,
        config.timbre === 'piano' ? 0.45 : 0.8,
      );
      if (!config.loop) {
        gain.gain.setTargetAtTime(0, at + duration, 0.018);
      }
      const recipe: readonly (readonly [number, number, OscillatorType, number])[] =
        config.timbre === 'strings'
          ? [
              [1, 0.45, 'sawtooth', -5],
              [1, 0.45, 'sawtooth', 5],
            ]
          : config.timbre === 'organ'
            ? [
                [1, 0.6, 'sine', 0],
                [2, 0.25, 'sine', 0],
                [4, 0.12, 'sine', 0],
              ]
            : config.timbre === 'epiano'
              ? [
                  [1, 0.75, 'sine', 0],
                  [2, 0.2, 'sine', 0],
                  [3, 0.06, 'sine', 0],
                ]
              : config.timbre === 'piano'
                ? [
                    [1, 0.75, 'sine', 0],
                    [2, 0.18, 'sine', 0],
                    [3, 0.08, 'sine', 0],
                  ]
                : [[1, 1, 'sine', 0]];
      for (const [multiple, level, type, detune] of recipe) {
        const oscillator = context.createOscillator();
        oscillators.push(oscillator);
        const harmonicGain = context.createGain();
        harmonics.push(harmonicGain);
        oscillator.type = type;
        oscillator.frequency.value = frequency(note.midi, config.a4) * multiple;
        oscillator.detune.value = detune;
        harmonicGain.gain.value = level;
        oscillator.connect(harmonicGain);
        harmonicGain.connect(gain);
        oscillator.addEventListener('ended', onEnded);
        oscillator.start(at);
        began.add(oscillator);
        if (!config.loop) oscillator.stop(at + duration + 0.09);
      }
      return voice;
    } catch (error) {
      voice.dispose(true);
      throw error;
    }
  }
  private finish(job: Playback, immediate = false) {
    if (job.timer !== null) clearTimeout(job.timer);
    for (const voice of [...job.voices]) voice.dispose(immediate);
    if (this.playback === job) this.playback = null;
    if (this.overlayPlayback === job) this.overlayPlayback = null;
    job.resolve();
  }
  /** A separate lane gate leaves every voice's scheduled attack/release intact. */
  setVoiceMuted(lane: number, muted: boolean) {
    if (!Number.isInteger(lane) || lane < 0 || lane > 3) return;
    for (const voice of this.playback?.voices ?? []) if (voice.lane === lane) voice.setMuted(muted);
  }
  private cancelOverlay() {
    this.overlayEpoch++;
    if (this.overlayPlayback) this.finish(this.overlayPlayback);
  }
  cancel() {
    this.epoch++;
    if (this.playback) this.finish(this.playback);
    this.cancelOverlay();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.captureSessions.clear();
    if (this.sessionConfigured) this.applyAudioSession();
    this.cancel();
    for (const voice of [...this.releasing]) voice.dispose(true);
    if (this.context) {
      safely(() => this.master?.disconnect());
      safely(() => this.limiter?.disconnect());
      void this.context.close().catch(diagnostic);
    }
    this.context = null;
    this.master = null;
    this.limiter = null;
  }
}

/** Allocation-free YIN-style difference search. Synthetic fixtures do not prove microphone accuracy. */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  minHz: number,
  maxHz: number,
): number | null {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || minHz <= 0 || maxHz <= minHz) return null;
  const step = Math.max(1, Math.floor(sampleRate / 12000));
  const rate = sampleRate / step;
  const size = Math.floor(buffer.length / step);
  const window = Math.floor(size / 2);
  const maxLag = Math.min(Math.ceil(rate / minHz), window - 2);
  const minLag = Math.max(2, Math.floor(rate / maxHz));
  if (maxLag <= minLag || window < 8) return null;
  let sum = 0,
    energy = 0;
  for (let i = 0; i < size; i++) {
    const v = buffer[i * step]!;
    sum += v;
    energy += v * v;
  }
  if (Math.sqrt(Math.max(0, energy / size - (sum / size) ** 2)) < 0.007) return null;
  let cumulative = 0,
    left = 1,
    previous = 1;
  for (let lag = 1; lag <= maxLag + 1; lag++) {
    let difference = 0;
    for (let i = 0; i < window; i++) {
      const delta = buffer[i * step]! - buffer[(i + lag) * step]!;
      difference += delta * delta;
    }
    cumulative += difference;
    const current = cumulative > 1e-12 ? (difference * lag) / cumulative : 1;
    if (lag > minLag + 1 && previous < 0.15 && previous <= left && previous < current) {
      const denominator = left - 2 * previous + current;
      const adjustment =
        Math.abs(denominator) > 1e-12
          ? Math.max(-0.5, Math.min(0.5, (0.5 * (left - current)) / denominator))
          : 0;
      const found = rate / (lag - 1 + adjustment);
      return Number.isFinite(found) && found >= minHz && found <= maxHz ? found : null;
    }
    left = previous;
    previous = current;
  }
  return null;
}

type StatusHandler = (status: CaptureStatus, message: string) => void;
interface CaptureLease {
  epoch: number;
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
  timer: ReturnType<typeof setTimeout> | null;
  dead: boolean;
  dispose(): void;
}

export class CaptureController {
  private epoch = 0;
  private desired = false;
  private lease: CaptureLease | null = null;
  private onStatus: StatusHandler | null = null;
  private onSample: ((frequency: number | null, timeMs: number) => void) | null = null;
  private disposed = false;
  private releaseSession: (() => void) | null = null;
  constructor(private readonly engine: AudioEngine) {}

  async start(
    onSample: (frequency: number | null, timeMs: number) => void,
    onStatus: StatusHandler,
    config: { a4: number; lowMidi: number; highMidi: number },
  ): Promise<void> {
    this.stop();
    if (this.disposed) return;
    const epoch = ++this.epoch;
    this.desired = true;
    this.onStatus = onStatus;
    this.onSample = onSample;
    let candidate: MediaStream | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let localLease: CaptureLease | null = null;
    let releaseSession: (() => void) | null = null;
    const current = () => epoch === this.epoch && this.desired && !this.disposed;
    onStatus(
      'waiting',
      'Preparing audio and waiting for microphone permission. You can cancel this request.',
    );
    try {
      releaseSession = this.engine.acquireCaptureSession();
      this.releaseSession = releaseSession;
      const ready = this.engine.prepare();
      await ready;
      if (!current()) return;
      if (!globalThis.navigator?.mediaDevices?.getUserMedia)
        throw new Error(
          'Microphone access requires HTTPS or localhost and a browser with microphone support.',
        );
      if (typeof document !== 'undefined' && document.hidden)
        throw new Error('Return to the practice tab, then press Start microphone.');
      candidate = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      if (!current()) return;
      const context = this.engine.getContext();
      if (!context || context.state !== 'running')
        throw new Error('Audio was interrupted. Press Start microphone to retry.');
      // Free tuner still searches the full declared C2–C6 register, regardless of practice range.
      const minHz = frequency(Math.min(36, config.lowMidi) - 1, config.a4);
      const maxHz = frequency(Math.max(84, config.highMidi) + 1, config.a4);
      let fftSize = 2048;
      while (fftSize < (context.sampleRate / minHz) * 4.5 && fftSize < 32768) fftSize *= 2;
      if (fftSize < (context.sampleRate / minHz) * 4)
        throw new Error(
          'This device cannot analyse the selected low range. Try a higher range or another device.',
        );
      source = context.createMediaStreamSource(candidate);
      analyser = context.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser); // Deliberately never connect microphone to destination.
      const buffer = new Float32Array(fftSize);
      const stream = candidate;
      const node = source;
      const detector = analyser;
      const tracks = stream.getTracks();
      const removeListeners: (() => void)[] = [];
      let cleaned = false;
      const lease: CaptureLease = {
        epoch,
        stream,
        source: node,
        analyser: detector,
        timer: null,
        dead: false,
        dispose: () => {
          if (cleaned) return;
          cleaned = true;
          if (lease.timer !== null) clearTimeout(lease.timer);
          removeListeners.forEach((remove) => remove());
          safely(() => node.disconnect());
          safely(() => detector.disconnect());
          tracks.forEach((track) => safely(() => track.stop()));
          if (this.releaseSession === releaseSession) this.releaseSession = null;
          releaseSession?.();
        },
      };
      localLease = lease;
      candidate = null;
      source = null;
      analyser = null;
      const interrupt = (message: string) => {
        lease.dead = true;
        if (this.lease === lease && current()) this.interrupt(epoch, message);
      };
      for (const track of tracks) {
        const ended = () =>
          interrupt(
            'Microphone disconnected or stopped. Reconnect it, then press Start microphone.',
          );
        const muted = () =>
          interrupt(
            'Microphone input was interrupted. Check your device, then press Start microphone.',
          );
        track.addEventListener('ended', ended);
        removeListeners.push(() => track.removeEventListener('ended', ended));
        track.addEventListener('mute', muted);
        removeListeners.push(() => track.removeEventListener('mute', muted));
      }
      const contextChanged = () => {
        if (context.state !== 'running')
          interrupt('Audio was paused or interrupted. Press Start microphone to resume.');
      };
      context.addEventListener('statechange', contextChanged);
      removeListeners.push(() => context.removeEventListener('statechange', contextChanged));
      if (typeof document !== 'undefined') {
        const hidden = () => {
          if (document.hidden)
            interrupt(
              'Microphone stopped while the page was hidden. Press Start microphone when ready.',
            );
        };
        document.addEventListener('visibilitychange', hidden);
        removeListeners.push(() => document.removeEventListener('visibilitychange', hidden));
      }
      if (!current()) return;
      if (
        tracks.length === 0 ||
        tracks.some((track) => track.readyState === 'ended') ||
        lease.dead ||
        context.state !== 'running'
      ) {
        onStatus(
          'interrupted',
          'Microphone ended before it was ready. Check your device and retry.',
        );
        this.desired = false;
        return;
      }
      this.lease = lease;
      localLease = null;
      onStatus(
        'listening',
        'Microphone listening locally. Use headphones to keep reference audio separate from your voice.',
      );
      const tick = () => {
        if (!current() || this.lease !== lease || lease.dead) return;
        try {
          detector.getFloatTimeDomainData(buffer);
          onSample(detectPitch(buffer, context.sampleRate, minHz, maxHz), performance.now());
        } catch (error) {
          this.interrupt(
            epoch,
            error instanceof Error ? error.message : 'Microphone analysis stopped. Please retry.',
          );
          return;
        }
        if (current() && this.lease === lease) lease.timer = setTimeout(tick, 40);
      };
      tick();
    } catch (error) {
      if (current()) {
        if (this.lease?.epoch === epoch) {
          this.lease.dispose();
          this.lease = null;
        }
        this.desired = false;
        const name = error instanceof Error ? error.name : '';
        if (name === 'NotAllowedError' || name === 'SecurityError')
          onStatus(
            'denied',
            'Microphone permission was denied. Allow access in browser/site settings, then Retry; browser or OS restrictions may still apply.',
          );
        else if (name === 'NotFoundError' || name === 'DevicesNotFoundError')
          onStatus('unavailable', 'No microphone was found. Connect a microphone, then Retry.');
        else if (name === 'NotReadableError' || name === 'TrackStartError')
          onStatus(
            'unavailable',
            'The microphone is busy or unavailable. Close other recording apps, check your device, then Retry.',
          );
        else
          onStatus(
            'unavailable',
            error instanceof Error
              ? error.message
              : 'Microphone could not start. Check your device and browser permissions, then Retry.',
          );
      }
    } finally {
      localLease?.dispose();
      if (candidate) candidate.getTracks().forEach((track) => safely(() => track.stop()));
      if (source) safely(() => source?.disconnect());
      if (analyser) safely(() => analyser?.disconnect());
      if (this.lease?.epoch !== epoch) {
        if (this.releaseSession === releaseSession) this.releaseSession = null;
        releaseSession?.();
      }
    }
  }
  private interrupt(epoch: number, message: string) {
    if (epoch !== this.epoch || !this.desired) return;
    this.desired = false;
    this.epoch++;
    this.lease?.dispose();
    this.lease = null;
    this.onSample?.(null, performance.now());
    this.onStatus?.('interrupted', message);
  }
  stop() {
    this.epoch++;
    this.desired = false;
    this.lease?.dispose();
    this.lease = null;
    const release = this.releaseSession;
    this.releaseSession = null;
    release?.();
    this.onSample?.(null, performance.now());
    this.onStatus?.('off', 'Microphone off.');
    this.onSample = null;
    this.onStatus = null;
  }
  dispose() {
    if (this.disposed) return;
    this.stop();
    this.disposed = true;
  }
}
