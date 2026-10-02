import { loadSettings } from './settings';
import { getAudioContext } from './audio';

// Lo-Fi Jazz Ambient Chord Progression (Frequencies in Hz)
// Soft, cozy Neo-Soul / Lo-Fi jazz voicings
// Continuous Ambient Pad Progression (Warm Executive Lounge / Chill Ambient)
// Frequencies in Hz, voiced in the comfortable mid-warm register (140-330 Hz)
interface AmbientChord {
  name: string;
  bass: number; // Low root frequency
  keys: number[]; // Warm pad frequencies
}

const CHORD_PROGRESSION: AmbientChord[] = [
  // 1. Fmaj9 (Serene, open executive calm)
  {
    name: 'Fmaj9',
    bass: 87.31, // F2
    keys: [174.61, 220.0, 261.63, 329.63], // F3, A3, C4, E4
  },
  // 2. Cmaj9/E (Warm, grounded)
  {
    name: 'Cmaj9/E',
    bass: 82.41, // E2
    keys: [164.81, 196.0, 246.94, 293.66], // E3, G3, B3, D4
  },
  // 3. Dm9 (Deep, contemplative)
  {
    name: 'Dm9',
    bass: 73.42, // D2
    keys: [146.83, 174.61, 220.0, 261.63], // D3, F3, A3, C4
  },
  // 4. Am7 (Cozy, reflective)
  {
    name: 'Am7',
    bass: 55.0, // A1
    keys: [164.81, 220.0, 261.63, 329.63], // E3, A3, C4, E4
  },
  // 5. G6/9 (Expansive horizon)
  {
    name: 'G6/9',
    bass: 49.0, // G1
    keys: [146.83, 196.0, 246.94, 293.66], // D3, G3, B3, D4
  },
  // 6. Em7 (Peaceful resolution)
  {
    name: 'Em7',
    bass: 65.41, // C2 (grounded anchor)
    keys: [164.81, 196.0, 246.94, 329.63], // E3, G3, B3, E4
  },
];

interface ActiveChordVoice {
  gainNode: GainNode;
  oscillators: OscillatorNode[];
  cleanupTimeoutId?: ReturnType<typeof setTimeout>;
}

// Singleton Lo-Fi Ambient Pad Engine State
class LoFiEngine {
  private isRunning: boolean = false;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private vinylNode: AudioBufferSourceNode | null = null;
  private vinylGain: GainNode | null = null;
  private chordTimer: any = null;
  private currentChordIndex: number = 0;
  private customAudio: HTMLAudioElement | null = null;
  private usingCustomTrack: boolean = false;
  private activeVoices: Set<ActiveChordVoice> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Check for user gesture to auto-resume audio context
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

  // Create silky, steady tape warmth bed (pure pink/brown noise, zero sudden pops)
  private createTapeWarmthBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 4; // 4-second seamless loop
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let lastOutL = 0.0;
    let lastOutR = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      // Gentle filtered pink noise
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;
      lastOutL = (lastOutL * 0.98) + (whiteL * 0.02);
      lastOutR = (lastOutR * 0.98) + (whiteR * 0.02);

      // Smooth tape bed without random pop spikes
      left[i] = lastOutL * 0.12;
      right[i] = lastOutR * 0.12;
    }
    return buffer;
  }

  // Play continuous ambient chord with smooth crossfade envelope
  private playChord(chord: AmbientChord, durationSec: number = 8.0, fadeSec: number = 3.0) {
    const ctx = getAudioContext();
    if (!ctx || !this.compressor || !this.isRunning) return;

    const now = ctx.currentTime;
    const settings = loadSettings();
    const effectiveVol = (settings.bgmVolume / 100) * 0.18;

    // Dedicated gain envelope for this chord instance (smooth fade in, sustain, smooth fade out)
    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.0001, now);
    chordGain.gain.linearRampToValueAtTime(effectiveVol, now + fadeSec);
    chordGain.gain.setValueAtTime(effectiveVol, Math.max(now + fadeSec, now + durationSec - fadeSec));
    chordGain.gain.linearRampToValueAtTime(0.0001, now + durationSec);
    chordGain.connect(this.compressor);

    const oscillators: OscillatorNode[] = [];

    // 1. Warm Sustained Sub/Root Bass Tone (Smooth low-pass filtered sine)
    const bassOsc = ctx.createOscillator();
    const bassFilter = ctx.createBiquadFilter();
    const bassGain = ctx.createGain();

    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(110, now);
    bassFilter.Q.setValueAtTime(0.6, now);

    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(chord.bass, now);

    bassGain.gain.setValueAtTime(0.3, now); // Gentle sub presence, zero boom

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(chordGain);

    bassOsc.start(now);
    bassOsc.stop(now + durationSec + 0.1);
    oscillators.push(bassOsc);

    // 2. Warm Analog Pad Keys (Equal-power normalized, dual detuned sine + triangle)
    const noteCount = chord.keys.length;
    const perNoteGain = 1.0 / Math.sqrt(noteCount + 1);

    chord.keys.forEach((freq, idx) => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420 + (idx * 20), now);
      filter.Q.setValueAtTime(0.6, now);

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(perNoteGain, now);

      // Voice A: Warm Pure Sine (slightly detuned down by 0.45 Hz)
      const oscA = ctx.createOscillator();
      oscA.type = 'sine';
      oscA.frequency.setValueAtTime(freq - 0.45, now);

      // Voice B: Mellow Triangle for velvety analog pad body (slightly detuned up by 0.45 Hz)
      const oscB = ctx.createOscillator();
      oscB.type = 'triangle';
      oscB.frequency.setValueAtTime(freq + 0.45, now);

      const blendB = ctx.createGain();
      blendB.gain.setValueAtTime(0.28, now); // Soft triangle overtone

      oscA.connect(filter);
      oscB.connect(blendB);
      blendB.connect(filter);

      filter.connect(noteGain);
      noteGain.connect(chordGain);

      oscA.start(now);
      oscB.start(now);
      oscA.stop(now + durationSec + 0.1);
      oscB.stop(now + durationSec + 0.1);

      oscillators.push(oscA, oscB);
    });

    const voice: ActiveChordVoice = {
      gainNode: chordGain,
      oscillators,
    };
    this.activeVoices.add(voice);

    voice.cleanupTimeoutId = setTimeout(() => {
      try {
        chordGain.disconnect();
      } catch (e) {}
      this.activeVoices.delete(voice);
    }, (durationSec + 0.2) * 1000);
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

      // 2. Built-in Procedural Lo-Fi Ambient Pad Generator
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Master Compressor for smooth, leveled dynamic range (zero sudden surges)
      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-20, ctx.currentTime);
      this.compressor.knee.setValueAtTime(14, ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4.0, ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.02, ctx.currentTime);
      this.compressor.release.setValueAtTime(0.4, ctx.currentTime);

      this.masterGain = ctx.createGain();
      const initialVol = (settings.bgmVolume / 100) * 0.75;
      this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(initialVol, ctx.currentTime + 2.0);

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(ctx.destination);

      // Start silky tape warmth floor
      const vinylBuffer = this.createTapeWarmthBuffer(ctx);
      this.vinylNode = ctx.createBufferSource();
      this.vinylNode.buffer = vinylBuffer;
      this.vinylNode.loop = true;

      this.vinylGain = ctx.createGain();
      this.vinylGain.gain.setValueAtTime(0.008 * (settings.bgmVolume / 100), ctx.currentTime);

      const vinylFilter = ctx.createBiquadFilter();
      vinylFilter.type = 'lowpass';
      vinylFilter.frequency.setValueAtTime(350, ctx.currentTime);

      this.vinylNode.connect(vinylFilter);
      vinylFilter.connect(this.vinylGain);
      this.vinylGain.connect(this.masterGain);

      this.vinylNode.start();

      this.isRunning = true;
      this.usingCustomTrack = false;
      this.currentChordIndex = 0;

      // Play first chord with gentle 8s duration and 3s crossfade
      const chordDurationSec = 8.0;
      const crossfadeSec = 3.0;
      const stepIntervalMs = (chordDurationSec - crossfadeSec) * 1000; // 5000ms

      this.playChord(CHORD_PROGRESSION[this.currentChordIndex], chordDurationSec, crossfadeSec);

      // Schedule overlapping chord transitions (continuous, seamless stream)
      this.chordTimer = setInterval(() => {
        if (!this.isRunning) return;
        this.currentChordIndex = (this.currentChordIndex + 1) % CHORD_PROGRESSION.length;
        this.playChord(CHORD_PROGRESSION[this.currentChordIndex], chordDurationSec, crossfadeSec);
      }, stepIntervalMs);

      console.log('[BGM] Built-in Lo-Fi Ambient Engine started successfully (Seamless Lo-Fi Loop Active)');
    } catch (err) {
      console.warn('[BGM] Failed to start Lo-Fi BGM:', err);
    }
  }

  // Stop / Pause BGM cleanly
  public stop() {
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
    }

    if (this.chordTimer) {
      clearInterval(this.chordTimer);
      this.chordTimer = null;
    }

    // Stop and disconnect all active chord voices
    this.activeVoices.forEach((voice) => {
      if (voice.cleanupTimeoutId) {
        clearTimeout(voice.cleanupTimeoutId);
      }
      voice.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      });
      try {
        voice.gainNode.disconnect();
      } catch (e) {}
    });
    this.activeVoices.clear();

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
          this.masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
          setTimeout(() => {
            this.masterGain?.disconnect();
            this.masterGain = null;
            this.compressor?.disconnect();
            this.compressor = null;
          }, 350);
        }
      } catch (e) {
        this.masterGain = null;
        this.compressor = null;
      }
    }

    this.isRunning = false;
    this.usingCustomTrack = false;
    console.log('[BGM] Lo-Fi Ambient Engine stopped');
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
          Math.max(0.0001, (volumePct / 100) * 0.75),
          ctx.currentTime + 0.1
        );
      }
    }
    if (this.vinylGain) {
      const ctx = getAudioContext();
      if (ctx) {
        this.vinylGain.gain.setValueAtTime(0.008 * (volumePct / 100), ctx.currentTime);
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
export const bgmPlayer = new LoFiEngine();
