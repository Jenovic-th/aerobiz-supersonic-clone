import { loadSettings } from './settings';
import { getAudioContext } from './audio';

// Lo-Fi Jazz Ambient Chord Progression (Frequencies in Hz)
// Soft, cozy Neo-Soul / Lo-Fi jazz voicings
interface LoFiChord {
  name: string;
  bass: number; // Low root frequency
  keys: number[]; // Warm Rhodes chord frequencies
}

const CHORD_PROGRESSION: LoFiChord[] = [
  // 1. Cmaj9 (C, G, B, E, D)
  {
    name: 'Cmaj9',
    bass: 65.41, // C2
    keys: [130.81, 196.0, 246.94, 329.63, 587.33],
  },
  // 2. Am9 (A, G, C, E, B)
  {
    name: 'Am9',
    bass: 55.0, // A1
    keys: [110.0, 196.0, 261.63, 329.63, 493.88],
  },
  // 3. Dm9 (D, F, A, C, E)
  {
    name: 'Dm9',
    bass: 73.42, // D2
    keys: [146.83, 174.61, 220.0, 261.63, 329.63],
  },
  // 4. G13 (G, F, B, E, A)
  {
    name: 'G13',
    bass: 49.0, // G1
    keys: [98.0, 174.61, 246.94, 329.63, 440.0],
  },
  // 5. Em9 (E, G, D, F#, B)
  {
    name: 'Em9',
    bass: 82.41, // E2
    keys: [164.81, 196.0, 293.66, 369.99, 493.88],
  },
  // 6. A7b13 (A, G, C#, F, C)
  {
    name: 'A7b13',
    bass: 55.0, // A1
    keys: [110.0, 196.0, 277.18, 349.23, 523.25],
  },
  // 7. Dm11 (D, F, C, G, C)
  {
    name: 'Dm11',
    bass: 73.42, // D2
    keys: [146.83, 174.61, 261.63, 392.0, 523.25],
  },
  // 8. G7sus4 (G, F, C, D, G)
  {
    name: 'G7sus4',
    bass: 49.0, // G1
    keys: [98.0, 174.61, 261.63, 293.66, 392.0],
  },
];

// Singleton Lo-Fi Engine State
class LoFiEngine {
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;
  private vinylNode: AudioBufferSourceNode | null = null;
  private vinylGain: GainNode | null = null;
  private chordTimer: any = null;
  private currentChordIndex: number = 0;
  private customAudio: HTMLAudioElement | null = null;
  private usingCustomTrack: boolean = false;

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

  // Create warm vinyl noise buffer
  private createVinylBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 3; // 3-second loop
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let lastOutL = 0.0;
    let lastOutR = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      // Soft pink noise
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;
      lastOutL = (lastOutL * 0.96) + (whiteL * 0.04);
      lastOutR = (lastOutR * 0.96) + (whiteR * 0.04);

      // Random micro-crackle pop
      const popL = Math.random() < 0.0003 ? (Math.random() * 0.4 - 0.2) : 0;
      const popR = Math.random() < 0.0003 ? (Math.random() * 0.4 - 0.2) : 0;

      left[i] = lastOutL * 0.15 + popL;
      right[i] = lastOutR * 0.15 + popR;
    }
    return buffer;
  }

  // Play single warm Rhodes chord
  private playChord(chord: LoFiChord, durationSec: number = 4.0) {
    const ctx = getAudioContext();
    if (!ctx || !this.masterGain || !this.isRunning) return;

    const now = ctx.currentTime;
    const settings = loadSettings();
    const effectiveVol = (settings.bgmVolume / 100) * 0.22;

    // 1. Warm Acoustic/Sub Bass Root Note
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    const bassFilter = ctx.createBiquadFilter();

    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(220, now);

    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(chord.bass, now);

    bassGain.gain.setValueAtTime(0.001, now);
    bassGain.gain.linearRampToValueAtTime(effectiveVol * 0.6, now + 0.1);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec * 0.9);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(this.masterGain);

    bassOsc.start(now);
    bassOsc.stop(now + durationSec);

    // 2. Warm Rhodes Electric Piano Chords
    chord.keys.forEach((freq, noteIdx) => {
      // Fundamental Sine
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Mellow Low-Pass (Vintage Tape Warmth)
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(850 + (noteIdx * 40), now);
      filter.Q.setValueAtTime(0.8, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Gentle random human touch (slight detune & velocity variation)
      const humanDelay = noteIdx * 0.012; // Arpeggiated soft strum
      const noteVol = effectiveVol * (0.28 + Math.random() * 0.06);

      const noteStart = now + humanDelay;
      noteGain.gain.setValueAtTime(0.0001, noteStart);
      noteGain.gain.linearRampToValueAtTime(noteVol, noteStart + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(noteVol * 0.35, noteStart + 1.8);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + durationSec);

      // Subtle 2nd harmonic for bell warmth
      const overtoneOsc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtoneOsc.type = 'sine';
      overtoneOsc.frequency.setValueAtTime(freq * 2, noteStart);
      overtoneGain.gain.setValueAtTime(noteVol * 0.12, noteStart);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.4);

      overtoneOsc.connect(filter);
      overtoneGain.connect(filter);
      overtoneOsc.start(noteStart);
      overtoneOsc.stop(noteStart + 0.5);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.masterGain!);

      osc.start(noteStart);
      osc.stop(noteStart + durationSec);
    });

    // 3. Occasional gentle high chime bell on 3rd or 4th beat
    if (Math.random() < 0.65) {
      const chimeDelay = now + durationSec * 0.55;
      const chimeFreq = chord.keys[chord.keys.length - 1] * 1.5; // Sweet upper harmony
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      const chimeFilter = ctx.createBiquadFilter();

      chimeFilter.type = 'bandpass';
      chimeFilter.frequency.setValueAtTime(chimeFreq, chimeDelay);
      chimeFilter.Q.setValueAtTime(3.0, chimeDelay);

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(chimeFreq, chimeDelay);

      chimeGain.gain.setValueAtTime(0.0001, chimeDelay);
      chimeGain.gain.linearRampToValueAtTime(effectiveVol * 0.15, chimeDelay + 0.02);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, chimeDelay + 1.2);

      chimeOsc.connect(chimeFilter);
      chimeFilter.connect(chimeGain);
      chimeGain.connect(this.masterGain);

      chimeOsc.start(chimeDelay);
      chimeOsc.stop(chimeDelay + 1.3);
    }
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

      // 2. Built-in Procedural Lo-Fi Ambient Generator
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      this.masterGain = ctx.createGain();
      const initialVol = (settings.bgmVolume / 100) * 0.8;
      this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(initialVol, ctx.currentTime + 1.5);
      this.masterGain.connect(ctx.destination);

      // Start gentle vinyl crackle layer
      const vinylBuffer = this.createVinylBuffer(ctx);
      this.vinylNode = ctx.createBufferSource();
      this.vinylNode.buffer = vinylBuffer;
      this.vinylNode.loop = true;

      this.vinylGain = ctx.createGain();
      this.vinylGain.gain.setValueAtTime(0.018 * (settings.bgmVolume / 100), ctx.currentTime);

      const vinylFilter = ctx.createBiquadFilter();
      vinylFilter.type = 'lowpass';
      vinylFilter.frequency.setValueAtTime(1400, ctx.currentTime);

      this.vinylNode.connect(vinylFilter);
      vinylFilter.connect(this.vinylGain);
      this.vinylGain.connect(this.masterGain);

      this.vinylNode.start();

      this.isRunning = true;
      this.usingCustomTrack = false;
      this.currentChordIndex = 0;

      // Play first chord immediately
      const chordDurationMs = 3800;
      this.playChord(CHORD_PROGRESSION[this.currentChordIndex], chordDurationMs / 1000);

      // Schedule subsequent chords in loop
      this.chordTimer = setInterval(() => {
        if (!this.isRunning) return;
        this.currentChordIndex = (this.currentChordIndex + 1) % CHORD_PROGRESSION.length;
        this.playChord(CHORD_PROGRESSION[this.currentChordIndex], chordDurationMs / 1000);
      }, chordDurationMs);

      console.log('[BGM] Built-in Lo-Fi Ambient Engine started successfully (Seamless Lo-Fi Loop Active)');
    } catch (err) {
      console.warn('[BGM] Failed to start Lo-Fi BGM:', err);
    }
  }

  // Stop / Pause BGM
  public stop() {
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
    }

    if (this.chordTimer) {
      clearInterval(this.chordTimer);
      this.chordTimer = null;
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
          this.masterGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          setTimeout(() => {
            this.masterGain?.disconnect();
            this.masterGain = null;
          }, 500);
        }
      } catch (e) {
        this.masterGain = null;
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
          Math.max(0.0001, (volumePct / 100) * 0.8),
          ctx.currentTime + 0.1
        );
      }
    }
    if (this.vinylGain) {
      const ctx = getAudioContext();
      if (ctx) {
        this.vinylGain.gain.setValueAtTime(0.018 * (volumePct / 100), ctx.currentTime);
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
