import React, { useState } from 'react';
import { GameSettings, loadSettings, saveSettings } from '../utils/settings';
import { playSound } from '../utils/audio';
import { useEscapeKey } from '../hooks/useEscapeKey';
import {
  X,
  Volume2,
  VolumeX,
  Music,
  Headphones,
  Save,
  Zap,
  Monitor,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { bgmPlayer } from '../utils/lofiBgm';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: (newSettings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChanged,
}) => {
  useEscapeKey(onClose, isOpen);
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (key: keyof GameSettings) => {
    playSound.click();
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveSettings(updated);
    if (onSettingsChanged) onSettingsChanged(updated);
  };

  const handleToggleBgm = () => {
    playSound.click();
    const nextBgm = !settings.bgmEnabled;
    const updated = { ...settings, bgmEnabled: nextBgm };
    setSettings(updated);
    saveSettings(updated);
    if (nextBgm) {
      bgmPlayer.start();
    } else {
      bgmPlayer.stop();
    }
    if (onSettingsChanged) onSettingsChanged(updated);
  };

  const handleVolumeChange = (vol: number) => {
    const updated = { ...settings, sfxVolume: vol };
    setSettings(updated);
    saveSettings(updated);
    if (onSettingsChanged) onSettingsChanged(updated);
  };

  const handleBgmVolumeChange = (vol: number) => {
    const updated = { ...settings, bgmVolume: vol };
    setSettings(updated);
    saveSettings(updated);
    bgmPlayer.setVolume(vol);
    if (onSettingsChanged) onSettingsChanged(updated);
  };

  const handleTestSound = () => {
    playSound.confirm();
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-indigo-950 to-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400 text-sky-400 shadow">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-white uppercase font-mono">
                Game Settings
              </h2>
              <p className="text-xs text-slate-400">การตั้งค่าระบบและสภาพแวดล้อมจำลอง</p>
            </div>
          </div>
          <button
            onClick={() => {
              playSound.click();
              onClose();
            }}
            data-testid="modal-close-header-btn"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-700"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* 1. Lo-Fi Ambient Background Music (BGM) Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-400/40 shadow">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Background Music (ดนตรีคลอ Lo-Fi)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/50 font-bold">
                    {bgmPlayer.getIsCustomTrack() ? 'Custom MP3 Track' : 'Lo-Fi Jazz Ambient'}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  ดนตรีแจ๊สเปียโน Lo-Fi คลอเบาๆ สร้างสมาธิขณะเล่น (ไม่รบกวนเสียงคลิก)
                </div>
              </div>
            </div>
            <button
              onClick={handleToggleBgm}
              data-testid="settings-bgm-toggle"
              className={`w-13 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                settings.bgmEnabled ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform transform shadow ${
                  settings.bgmEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* BGM Volume Slider */}
          {settings.bgmEnabled && (
            <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-purple-400" />
                  <span>BGM Volume Level (ระดับเสียงดนตรีคลอ)</span>
                </span>
                <span className="font-mono text-purple-400 font-bold">{settings.bgmVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.bgmVolume}
                onChange={(e) => handleBgmVolumeChange(parseInt(e.target.value, 10))}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-0.5">
                <span>💡 รองรับไฟล์เพลงส่วนตัว: วางไฟล์ <code className="text-amber-300 font-mono">lofi.mp3</code> ใน <code className="text-sky-300 font-mono">public/audio/bgm/</code></span>
              </div>
            </div>
          )}

          {/* 2. Audio SFX Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-3">
              {settings.sfxEnabled ? (
                <Volume2 className="w-5 h-5 text-sky-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
              <div>
                <div className="font-bold text-sm text-white">Sound Effects (เสียงเอฟเฟกต์)</div>
                <div className="text-xs text-slate-400">เสียงปุ่มกด, เรดาร์, เที่ยวบิน และเสียงยืนยัน</div>
              </div>
            </div>
            <button
              onClick={() => handleToggle('sfxEnabled')}
              className={`w-13 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                settings.sfxEnabled ? 'bg-sky-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform transform shadow ${
                  settings.sfxEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Volume Slider */}
          {settings.sfxEnabled && (
            <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold">SFX Volume Level</span>
                <span className="font-mono text-sky-400 font-bold">{settings.sfxVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.sfxVolume}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleTestSound}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-sky-300 rounded-lg border border-slate-600 cursor-pointer transition active:scale-95"
                >
                  {savedFeedback ? '♪ Playing SFX...' : '🔊 Test Sound'}
                </button>
              </div>
            </div>
          )}

          {/* 2. Auto-Save Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-3">
              <Save className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-sm text-white">Quarterly Auto-Save</div>
                <div className="text-xs text-slate-400">บันทึกเกมอัตโนมัติทุกสิ้นไตรมาส (End Quarter)</div>
              </div>
            </div>
            <button
              onClick={() => handleToggle('autoSaveEnabled')}
              className={`w-13 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                settings.autoSaveEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform transform shadow ${
                  settings.autoSaveEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. Fast Animation Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <div className="font-bold text-sm text-white">Fast Simulation Pace</div>
                <div className="text-xs text-slate-400">เร่งความเร็วแอนิเมชันเที่ยวบินและการประมวลผล</div>
              </div>
            </div>
            <button
              onClick={() => handleToggle('fastAnimation')}
              className={`w-13 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                settings.fastAnimation ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform transform shadow ${
                  settings.fastAnimation ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. CRT Retro Monitor Shader Effect Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-purple-400" />
              <div>
                <div className="font-bold text-sm text-white">Retro CRT Scanline Effect</div>
                <div className="text-xs text-slate-400">ฟิลเตอร์จอหลอดแก้วเรโทรสไตล์ Koei 90s</div>
              </div>
            </div>
            <button
              onClick={() => handleToggle('crtFilter')}
              className={`w-13 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                settings.crtFilter ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform transform shadow ${
                  settings.crtFilter ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            Settings auto-saved to LocalStorage
          </div>
          <button
            onClick={() => {
              playSound.click();
              onClose();
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold font-mono transition cursor-pointer border border-slate-700 shadow flex items-center gap-2 active:scale-95"
            data-testid="modal-close-footer-btn"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>Close (ปิดหน้าต่าง)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
