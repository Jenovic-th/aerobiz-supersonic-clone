import { loadSettings } from './settings';
import { getAudioContext } from './audio';
import {
  EXECUTIVE_LOUNGE_FULL_SCORE,
  BarScore,
  DrumStyle,
} from './executiveLoungeFullSong';
import {
  BGM_TRACKS_CATALOG,
  BgmTrackDefinition,
} from './retroMusicTracks';

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
  private currentTrackId: string = 'executive_lounge';
  private currentBpm: number = 100;
  private activeScore: BarScore[] = EXECUTIVE_LOUNGE_FULL_SCORE;
  private totalBars: number = EXECUTIVE_LOUNGE_FULL_SCORE.length;
  private totalSteps: number = EXECUTIVE_LOUNGE_FULL_SCORE.length * 16;

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
      left[i] = lastOutL * 0.07;
      right[i] = lastOutR * 0.07;
    }
    return buffer;
  }

  // Percussion: 8-Bit Soft Kick
  private play8BitKick(ctx: AudioContext, time: number, vol: number = 0.55) {
    if (!this.masterGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.09);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.11);
  }

  // Percussion: 8-Bit Snare (Filtered noise + gentle body tone)
  private play8BitSnare(ctx: AudioContext, time: number, tone: number = 240, vol: number = 0.3) {
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
    gain.gain.setValueAtTime(vol, time);
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
    osc.frequency.setValueAtTime(tone, time);
    osc.frequency.exponentialRampToValueAtTime(70, time + 0.06);
    oscGain.gain.setValueAtTime(vol * 0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  // Percussion: 8-Bit Hi-Hat
  private play8BitHiHat(ctx: AudioContext, time: number, open: boolean = false, vol: number = 0.18) {
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
    gain.gain.setValueAtTime(open ? vol * 1.2 : vol, time);
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

  // Dynamic Drums by Style
  private dispatchDrums(ctx: AudioContext, style: DrumStyle, stepInBar: number, time: number) {
    switch (style) {
      case 'intro':
        // Soft kick on 0, 8; light hi-hat on 4, 12
        if (stepInBar === 0 || stepInBar === 8) this.play8BitKick(ctx, time, 0.4);
        if (stepInBar % 4 === 0) this.play8BitHiHat(ctx, time, false, 0.12);
        break;

      case 'normal':
        // Kick on 0, 10
        if (stepInBar === 0 || stepInBar === 10) this.play8BitKick(ctx, time, 0.55);
        // Snare on 4, 12
        if (stepInBar === 4 || stepInBar === 12) this.play8BitSnare(ctx, time, 240, 0.28);
        // Hi-hat on 8th notes
        if (stepInBar % 2 === 0) this.play8BitHiHat(ctx, time, stepInBar === 6, 0.16);
        break;

      case 'groove':
        // Syncopated kick on 0, 6, 10
        if (stepInBar === 0 || stepInBar === 6 || stepInBar === 10) this.play8BitKick(ctx, time, 0.58);
        // Snare on 4, 12 + ghost on 14
        if (stepInBar === 4 || stepInBar === 12) this.play8BitSnare(ctx, time, 240, 0.32);
        if (stepInBar === 14) this.play8BitSnare(ctx, time, 310, 0.14);
        // Hi-hat on 8th notes
        if (stepInBar % 2 === 0) this.play8BitHiHat(ctx, time, stepInBar === 6 || stepInBar === 14, 0.18);
        break;

      case 'fill':
        // Drum fill leading into next section
        if (stepInBar === 0 || stepInBar === 6) this.play8BitKick(ctx, time, 0.55);
        if (stepInBar === 4) this.play8BitSnare(ctx, time, 240, 0.28);
        if (stepInBar >= 10 && stepInBar <= 15) {
          const fillPitch = 220 + (stepInBar - 10) * 25;
          this.play8BitSnare(ctx, time, fillPitch, 0.35);
        } else if (stepInBar % 2 === 0) {
          this.play8BitHiHat(ctx, time, false, 0.15);
        }
        break;

      case 'soft':
        if (stepInBar === 0) this.play8BitKick(ctx, time, 0.45);
        if (stepInBar === 4 || stepInBar === 12) this.play8BitSnare(ctx, time, 200, 0.18);
        if (stepInBar % 4 === 0) this.play8BitHiHat(ctx, time, false, 0.12);
        break;

      case 'outro':
        if (stepInBar === 0) this.play8BitKick(ctx, time, 0.4);
        if (stepInBar === 4) this.play8BitSnare(ctx, time, 180, 0.15);
        if (stepInBar === 0) this.play8BitHiHat(ctx, time, true, 0.2);
        break;
    }
  }

  // Step Scheduler: Lookahead loop (Chris Wilson Web Audio timing)
  private scheduleLoop() {
    if (!this.isRunning) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const secondsPerStep = (60 / this.currentBpm) / 4; // 16th note step based on current BPM
    const lookahead = 0.12;

    while (this.nextStepTime < ctx.currentTime + lookahead) {
      const stepIndex = this.currentStep % this.totalSteps;
      const barIndex = Math.floor(stepIndex / 16);
      const stepInBar = stepIndex % 16;

      const bar: BarScore = this.activeScore[barIndex];

      if (bar) {
        // 1. Dynamic Drums according to section context
        this.dispatchDrums(ctx, bar.drumStyle, stepInBar, this.nextStepTime);

        // 2. Bass (Triangle)
        const bassNote = bar.bass[stepInBar];
        if (bassNote) {
          const freq = noteFreq(bassNote);
          this.playBassNote(ctx, freq, this.nextStepTime, secondsPerStep * 0.95);
        }

        // 3. Melodic Lead (Square)
        const leadNote = bar.lead[stepInBar];
        if (leadNote) {
          const freq = noteFreq(leadNote);
          this.playLeadNote(ctx, freq, this.nextStepTime, secondsPerStep * 1.45);
        }

        // 4. Harmonic Chords (Stabs)
        if (bar.chords) {
          const chordDef = bar.chords.find(c => c.step === stepInBar);
          if (chordDef) {
            this.playChordStab(ctx, chordDef.notes, this.nextStepTime, secondsPerStep * 2.5);
          }
        }
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

      // 2. Built-in Procedural SNES City Pop Chiptune Engine (Executive Lounge Full 48-Bar Suite @ 100 BPM)
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

      // Resolve active track from user settings
      const track = this.resolveActiveTrack(settings.bgmTrack);
      this.currentTrackId = track.id;
      this.currentBpm = track.bpm;
      this.activeScore = track.score;
      this.totalBars = track.score.length;
      this.totalSteps = track.score.length * 16;

      this.isRunning = true;
      this.usingCustomTrack = false;
      this.currentStep = 0;
      this.nextStepTime = ctx.currentTime + 0.05;

      this.scheduleLoop();

      console.log(
        `[BGM] Built-in 16-Bit Soundtrack started: ${track.id} (${this.totalBars} bars, ${this.totalSteps} steps @ ${this.currentBpm} BPM)`
      );
    } catch (err) {
      console.warn('[BGM] Failed to start BGM:', err);
    }
  }

  // Resolve active track score and BPM by ID
  private resolveActiveTrack(trackId?: string): { id: string; bpm: number; score: BarScore[] } {
    const settings = loadSettings();
    const targetId = trackId || settings.bgmTrack || 'executive_lounge';
    if (targetId === 'executive_lounge') {
      return { id: 'executive_lounge', bpm: 100, score: EXECUTIVE_LOUNGE_FULL_SCORE };
    }
    const found = BGM_TRACKS_CATALOG.find((t) => t.id === targetId);
    if (found && found.score && found.score.length > 0) {
      return { id: found.id, bpm: found.bpm, score: found.score };
    }
    return { id: 'executive_lounge', bpm: 100, score: EXECUTIVE_LOUNGE_FULL_SCORE };
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

  // Switch to a new track smoothly
  public setTrack(trackId: string) {
    const track = this.resolveActiveTrack(trackId);
    this.currentTrackId = track.id;
    this.currentBpm = track.bpm;
    this.activeScore = track.score;
    this.totalBars = track.score.length;
    this.totalSteps = track.score.length * 16;
    this.currentStep = 0;

    if (this.isRunning) {
      const ctx = getAudioContext();
      if (ctx) {
        this.nextStepTime = ctx.currentTime + 0.05;
      }
    }
    console.log(`[BGM] Switched active soundtrack to: ${track.id} (${track.bpm} BPM)`);
  }

  public getCurrentTrackId(): string {
    return this.currentTrackId;
  }

  public getTracksList(): BgmTrackDefinition[] {
    return BGM_TRACKS_CATALOG;
  }

  public getCurrentSection(): string {
    if (!this.isRunning) return 'Standby';
    const barIndex = Math.floor((this.currentStep % this.totalSteps) / 16);
    return this.activeScore[barIndex]?.sectionName || 'Main Theme';
  }

  public getTotalDurationSec(): number {
    return this.totalSteps * ((60 / this.currentBpm) / 4);
  }
}

// Global BGM Singleton Instance
export const bgmPlayer = new RetroCityPopBgmEngine();
