import { loadSettings } from './settings';

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
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
  // Authentic, soft, subtle tactile mouse click (กิ๊กๆ เบาๆ สบายหู ไม่แหลม ไม่ปิ้ว)
  click: () => {
    const settings = loadSettings();
    if (!settings.sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = (settings.sfxVolume / 100) * 0.12;

      // 1. High-frequency microswitch snap (2.4kHz highpass click, ~5ms)
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      const snapFilter = ctx.createBiquadFilter();

      snapFilter.type = 'highpass';
      snapFilter.frequency.setValueAtTime(2200, now);

      snapOsc.type = 'square';
      snapOsc.frequency.setValueAtTime(2400, now);

      snapGain.gain.setValueAtTime(vol * 0.35, now);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.005);

      snapOsc.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(ctx.destination);

      snapOsc.start(now);
      snapOsc.stop(now + 0.006);

      // 2. Low-frequency mouse body tap (320Hz lowpass tap, ~8ms)
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      const bodyFilter = ctx.createBiquadFilter();

      bodyFilter.type = 'lowpass';
      bodyFilter.frequency.setValueAtTime(700, now);

      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(320, now);

      bodyGain.gain.setValueAtTime(vol * 0.45, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

      bodyOsc.connect(bodyFilter);
      bodyFilter.connect(bodyGain);
      bodyGain.connect(ctx.destination);

      bodyOsc.start(now);
      bodyOsc.stop(now + 0.009);
    } catch (e) {
      // Ignore audio failure
    }
  },

  // Soft, pleasant double-tap tactile confirmation (กิ๊ก-กิ๊ก ยืนยันคำสั่งอย่างนุ่มนวล)
  confirm: () => {
    const settings = loadSettings();
    if (!settings.sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const vol = (settings.sfxVolume / 100) * 0.14;

      [0, 0.038].forEach((offset, idx) => {
        const now = ctx.currentTime + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(idx === 0 ? 2000 : 2600, now);
        filter.Q.setValueAtTime(1.8, now);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 300 : 380, now);

        gain.gain.setValueAtTime(vol * (idx === 0 ? 0.35 : 0.5), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.007);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.009);
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
