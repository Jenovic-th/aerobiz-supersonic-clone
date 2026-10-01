import { loadSettings } from './settings';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const playSound = {
  // Gentle tactile retro UI blip
  click: () => {
    const settings = loadSettings();
    if (!settings.sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const vol = (settings.sfxVolume / 100) * 0.15;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Ignore audio failure
    }
  },

  // Pleasant positive confirmation chime (C5 - E5 - G5 arpeggio)
  confirm: () => {
    const settings = loadSettings();
    if (!settings.sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const vol = (settings.sfxVolume / 100) * 0.18;

      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(vol, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch (e) {}
  },

  // Jet Engine Spool-Up Whoosh (for inauguration or takeoff)
  takeoff: () => {
    const settings = loadSettings();
    if (!settings.sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const vol = (settings.sfxVolume / 100) * 0.2;

      // Filtered noise buffer
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 1.2);
      filter.Q.value = 3.0;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 1.5);
    } catch (e) {}
  },
};
