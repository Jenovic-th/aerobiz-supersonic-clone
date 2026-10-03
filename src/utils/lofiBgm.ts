import { loadSettings } from './settings';
import { getAudioContext } from './audio';

// Helper: Note Name to Frequency in Hz
const noteFreq = (name: string | null): number => {
  if (!name) return 0;
  const notes: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
  };
  const match = name.match(/^([A-G][#b]?)([0-8])$/);
  if (!match) return 0;
  const semitone = notes[match[1]];
  const octave = parseInt(match[2], 10);
  const midi = 12 + octave * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
};

// Track 4: Executive Lounge Pattern (64 Sixteenth Steps @ 100 BPM)
// Authentic SNES City Pop / Koei 90s Airline Management Vibe
const PATTERN_LEAD: (string | null)[] = [
  // Bar 1: Fmaj7
  null, null, 'A4', 'C5', 'E5', null, 'G5', 'F5', 'E5', 'C5', null, 'A4', 'C5', null, 'D5', null,
  // Bar 2: Em7b5 -> A7
  'E5', null, 'G5', 'Bb5', null, 'A5', 'G5', 'E5', 'C#5', null, 'E5', null, 'F5', null, 'G5', null,
  // Bar 3: Dm7 -> Gm7
  'A5', null, 'F5', 'D5', null, 'F5', 'G5', null, 'Bb5', 'A5', 'G5', 'D5', 'F5', null, 'G5', null,
  // Bar 4: C7 -> Fmaj7 resolution
  'C5', null, 'E5', 'G5', 'Bb5', 'A5', 'G5', 'E5', 'F5', null, null, null, null, null, null, null,
];

const PATTERN_BASS: (string | null)[] = [
  // Bar 1: Fmaj7
  'F2', null, 'F2', 'C3', null, 'F2', 'A2', null, 'F2', null, 'C3', null, 'E2', null, 'D2', null,
  // Bar 2: Em7b5 -> A7
  'E2', null, 'E2', 'B2', null, 'E2', 'G2', null, 'A2', null, 'E3', null, 'G2', null, 'A2', null,
  // Bar 3: Dm7 -> Gm7
  'D2', null, 'D2', 'A2', null, 'D2', 'F2', null, 'G2', null, 'D3', null, 'F2', null, 'G2', null,
  // Bar 4: C7 -> Fmaj7
  'C2', null, 'C2', 'G2', null, 'C2', 'E2', null, 'F2', null, 'C3', null, 'A2', null, 'C3', null,
];

// Harmonic accompaniment chord stabs (soft, filtered SNES electric piano / synth pad)
const PATTERN_CHORDS: Record<number, string[]> = {
  0: ['A3', 'C4', 'E4'],   // Fmaj7
  8: ['A3', 'C4', 'E4'],
  16: ['G3', 'Bb3', 'D4'], // Em7b5
  24: ['G3', 'A3', 'C#4'], // A7
  32: ['F3', 'A3', 'C4'],  // Dm7
  40: ['F3', 'G3', 'Bb3'], // Gm7
  48: ['E3', 'G3', 'Bb3'], // C7
  56: ['F3', 'A3', 'C4'],  // Fmaj7
};

class RetroCityPopBgmEngine {
  private isRunning: boolean = false;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private vinylNode: AudioBufferSourceNode | null = null;
  private vinylGain: GainNode | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private usingCustomTrack: boolean = false;

  // Web Audio Step Scheduler
  private schedulerTimer: any = null;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private readonly BPM: number = 100; // User-selected exact 100 BPM

  constructor() {
    if (typeof window !== 'undefined') {
      const handleUserGesture = () => {
        const settings = loadSettings();
        if (settings.bgmEnabled && !this.isRunning) {
          this.start();
        }
        window.removeEventListener('click', handleUserGesture);
        window.removeEventListener('keydown', handleUserGesture);
      };
      window.addEventListener('click', handleUserGesture, { once: true });
      window.addEventListener('keydown', handleUserGesture, { once: true });
    }
  }

  // Create subtle tape warmth floor to preserve organic executive warmth
  private createTapeWarmthBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let lastOutL = 0.0;
    let lastOutR = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;
      lastOutL = (lastOutL * 0.98) + (whiteL * 0.02);
      lastOutR = (lastOutR * 0.98) + (whiteR * 0.02);
      left[i] = lastOutL * 0.08;
      right[i] = lastOutR * 0.08;
    }
    return buffer;
  }

  // Percussion: 8-Bit Soft Kick
  private play8BitKick(ctx: AudioContext, time: number) {
    if (!this.masterGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.09);

    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.11);
  }

  // Percussion: 8-Bit Snare (Filtered noise + gentle body tone)
  private play8BitSnare(ctx: AudioContext, time: number) {
    if (!this.masterGain) return;
    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(750, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.09);

    // Warm snare body
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, time);
    osc.frequency.exponentialRampToValueAtTime(70, time + 0.06);
    oscGain.gain.setValueAtTime(0.2, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  // Percussion: 8-Bit Hi-Hat
  private play8BitHiHat(ctx: AudioContext, time: number, open: boolean = false) {
    if (!this.masterGain) return;
    const dur = open ? 0.13 : 0.038;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(7200, time);
    filter.Q.setValueAtTime(2.2, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(open ? 0.2 : 0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + dur + 0.01);
  }

  // Melodic Lead: Warm SNES filtered square wave
  private playLeadNote(ctx: AudioContext, freq: number, time: number, dur: number) {
    if (!this.masterGain || !freq) return;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    // Warm SNES filter to avoid harshness
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, time);

    const vol = 0.22;
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.018);
    gain.gain.exponentialRampToValueAtTime(vol * 0.65, time + 0.08);
    gain.gain.setValueAtTime(vol * 0.65, time + Math.max(0.09, dur - 0.03));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  // Bass: Warm Triangle wave (Koei SNES style)
  private playBassNote(ctx: AudioContext, freq: number, time: number, dur: number) {
    if (!this.masterGain || !freq) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const vol = 0.44;
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.012);
    gain.gain.setValueAtTime(vol * 0.85, time + Math.max(0.03, dur - 0.03));
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  // Harmonic Accompaniment Chord Stab
  private playChordStab(ctx: AudioContext, chordNotes: string[], time: number, dur: number) {
    const dest = this.masterGain;
    if (!dest) return;
    const noteGainVal = 0.07 / Math.sqrt(chordNotes.length);

    chordNotes.forEach((noteName) => {
      const freq = noteFreq(noteName);
      if (!freq) return;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(noteGainVal, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    });
  }

  // Step Scheduler: Lookahead loop (Chris Wilson Web Audio timing)
  private scheduleLoop() {
    if (!this.isRunning) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const secondsPerStep = (60 / this.BPM) / 4; // 16th note step = 0.15s
    const lookahead = 0.12;

    while (this.nextStepTime < ctx.currentTime + lookahead) {
      const step = this.currentStep % 64;

      // 1. Drums
      // Kick on syncopated funk beats
      if (step === 0 || step === 10 || step === 16 || step === 26 ||
          step === 32 || step === 42 || step === 48 || step === 58) {
        this.play8BitKick(ctx, this.nextStepTime);
      }
      // Snare on beats 2 and 4
      if (step % 8 === 4) {
        this.play8BitSnare(ctx, this.nextStepTime);
      }
      // Hi-hat on 8th notes
      if (step % 2 === 0) {
        this.play8BitHiHat(ctx, this.nextStepTime, step % 8 === 6);
      }

      // 2. Bass (Triangle)
      const bassNote = PATTERN_BASS[step];
      if (bassNote) {
        const freq = noteFreq(bassNote);
        this.playBassNote(ctx, freq, this.nextStepTime, secondsPerStep * 0.95);
      }

      // 3. Melodic Lead
      const leadNote = PATTERN_LEAD[step];
      if (leadNote) {
        const freq = noteFreq(leadNote);
        this.playLeadNote(ctx, freq, this.nextStepTime, secondsPerStep * 1.45);
      }

      // 4. Harmonic Chords (Stabs on beat 1 and 3 of bars)
      if (PATTERN_CHORDS[step]) {
        this.playChordStab(ctx, PATTERN_CHORDS[step], this.nextStepTime, secondsPerStep * 2.5);
      }

      this.nextStepTime += secondsPerStep;
      this.currentStep++;
    }

    this.schedulerTimer = setTimeout(() => this.scheduleLoop(), 25);
  }

  // Start Background Music Loop
  public async start() {
    const settings = loadSettings();
    if (!settings.bgmEnabled) return;
    if (this.isRunning) return;

    try {
      // 1. Check if user provided an external MP3 file in public/audio/bgm/
      const customTrackCandidates = [
        './audio/bgm/lofi.mp3',
        './audio/bgm/music.mp3',
        './audio/bgm/ambient.mp3',
      ];

      for (const trackUrl of customTrackCandidates) {
        try {
          const resp = await fetch(trackUrl, { method: 'HEAD' });
          if (resp.ok) {
            this.customAudio = new Audio(trackUrl);
            this.customAudio.loop = true;
            this.customAudio.volume = (settings.bgmVolume / 100) * 0.6;
            await this.customAudio.play();
            this.usingCustomTrack = true;
            this.isRunning = true;
            console.log('[BGM] Playing custom user audio track from ' + trackUrl);
            return;
          }
        } catch (e) {
          // File not present, fallback to built-in generator
        }
      }

      // 2. Built-in Procedural SNES City Pop Chiptune Engine (Executive Lounge 100 BPM)
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Master Compressor for smooth, leveled dynamic range (zero sudden surges)
      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, ctx.currentTime);
      this.compressor.ratio.setValueAtTime(3.5, ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.015, ctx.currentTime);
      this.compressor.release.setValueAtTime(0.3, ctx.currentTime);

      this.masterGain = ctx.createGain();
      const initialVol = (settings.bgmVolume / 100) * 0.65;
      this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(initialVol, ctx.currentTime + 1.2);

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(ctx.destination);

      // Start subtle tape warmth bed
      const vinylBuffer = this.createTapeWarmthBuffer(ctx);
      this.vinylNode = ctx.createBufferSource();
      this.vinylNode.buffer = vinylBuffer;
      this.vinylNode.loop = true;

      this.vinylGain = ctx.createGain();
      this.vinylGain.gain.setValueAtTime(0.005 * (settings.bgmVolume / 100), ctx.currentTime);

      const vinylFilter = ctx.createBiquadFilter();
      vinylFilter.type = 'lowpass';
      vinylFilter.frequency.setValueAtTime(300, ctx.currentTime);

      this.vinylNode.connect(vinylFilter);
      vinylFilter.connect(this.vinylGain);
      this.vinylGain.connect(this.masterGain);
      this.vinylNode.start();

      this.isRunning = true;
      this.usingCustomTrack = false;
      this.currentStep = 0;
      this.nextStepTime = ctx.currentTime + 0.05;

      this.scheduleLoop();

      console.log('[BGM] Built-in SNES City Pop Chiptune started successfully (Executive Lounge @ 100 BPM)');
    } catch (err) {
      console.warn('[BGM] Failed to start BGM:', err);
    }
  }

  // Stop / Pause BGM cleanly
  public stop() {
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
    }

    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    if (this.vinylNode) {
      try {
        this.vinylNode.stop();
        this.vinylNode.disconnect();
      } catch (e) {}
      this.vinylNode = null;
    }

    if (this.masterGain) {
      try {
        const ctx = getAudioContext();
        if (ctx) {
          this.masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
          setTimeout(() => {
            this.masterGain?.disconnect();
            this.masterGain = null;
            this.compressor?.disconnect();
            this.compressor = null;
          }, 300);
        }
      } catch (e) {
        this.masterGain = null;
        this.compressor = null;
      }
    }

    this.isRunning = false;
    this.usingCustomTrack = false;
    console.log('[BGM] BGM Engine stopped');
  }

  // Update volume smoothly
  public setVolume(volumePct: number) {
    if (this.customAudio) {
      this.customAudio.volume = Math.max(0, Math.min(1, (volumePct / 100) * 0.6));
    }
    if (this.masterGain) {
      const ctx = getAudioContext();
      if (ctx) {
        this.masterGain.gain.linearRampToValueAtTime(
          Math.max(0.0001, (volumePct / 100) * 0.65),
          ctx.currentTime + 0.1
        );
      }
    }
    if (this.vinylGain) {
      const ctx = getAudioContext();
      if (ctx) {
        this.vinylGain.gain.setValueAtTime(0.005 * (volumePct / 100), ctx.currentTime);
      }
    }
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }

  public getIsCustomTrack(): boolean {
    return this.usingCustomTrack;
  }
}

// Global BGM Singleton Instance
export const bgmPlayer = new RetroCityPopBgmEngine();
