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
  Globe,
  Disc,
  Radio,
} from 'lucide-react';
import { bgmPlayer } from '../utils/lofiBgm';
import { BGM_TRACKS_CATALOG } from '../utils/retroMusicTracks';
import { useI18n, Language } from '../utils/i18n';

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
  const { lang, setLanguage, t } = useI18n();
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleLanguageChange = (newLang: Language) => {
    playSound.click();
    const updated = { ...settings, language: newLang };
    setSettings(updated);
    saveSettings(updated);
    setLanguage(newLang);
    if (onSettingsChanged) onSettingsChanged(updated);
  };

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

  const handleTrackSelect = (trackId: string) => {
    playSound.click();
    const updated = { ...settings, bgmTrack: trackId };
    setSettings(updated);
    saveSettings(updated);
    bgmPlayer.setTrack(trackId);
    if (!bgmPlayer.getIsPlaying() && settings.bgmEnabled) {
      bgmPlayer.start();
    }
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
                {t.settings.title}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'th' ? 'การตั้งค่าระบบและสภาพแวดล้อมจำลอง' : 'System configuration & simulation options'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playSound.click();
              onClose();
            }}
            data-testid="modal-close-header-btn"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-700"
            title={`${t.common.close} (Esc)`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {/* 0. Language Selection Card */}
          <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/40 shadow">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">
                  {t.settings.languageTitle}
                </div>
                <div className="text-xs text-slate-400">
                  {t.settings.languageDesc}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleLanguageChange('th')}
                data-testid="settings-lang-th"
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  lang === 'th'
                    ? 'bg-sky-600/30 border-sky-400 text-sky-200 ring-2 ring-sky-400/30 shadow-lg font-black'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <span className="text-base">🇹🇭</span>
                <span>ภาษาไทย</span>
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                data-testid="settings-lang-en"
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  lang === 'en'
                    ? 'bg-sky-600/30 border-sky-400 text-sky-200 ring-2 ring-sky-400/30 shadow-lg font-black'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <span className="text-base">🇬🇧</span>
                <span>English</span>
              </button>
            </div>
          </div>

          {/* 1. Lo-Fi Ambient Background Music (BGM) Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-400/40 shadow">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span>{t.settings.bgmTitle}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold">
                    {bgmPlayer.getIsCustomTrack() ? (lang === 'th' ? 'ไฟล์เพลงส่วนตัว' : 'Custom MP3') : (lang === 'th' ? 'ดนตรีเลานจ์ 100 BPM' : 'Executive Lounge 100 BPM')}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {t.settings.bgmDesc}
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

          {/* BGM Volume & Track Jukebox */}
          {settings.bgmEnabled && (
            <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3">
              {/* Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t.settings.bgmVolume}</span>
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
              </div>

              {/* Jukebox Track Selector */}
              <div className="pt-2 border-t border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Disc className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t.settings.bgmTrackSelect}</span>
                  </div>
                  <span className="text-[10px] text-purple-300 bg-purple-950/70 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    6 Tracks
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {t.settings.bgmTrackDesc}
                </p>

                {/* Track List Grid */}
                <div className="space-y-1.5 pt-1">
                  {BGM_TRACKS_CATALOG.map((track) => {
                    const isSelected = (settings.bgmTrack || 'executive_lounge') === track.id;
                    const title = lang === 'th' ? track.titleTh : track.titleEn;
                    const desc = lang === 'th' ? track.descTh : track.descEn;

                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => handleTrackSelect(track.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-950/70 to-slate-800 border-purple-400/80 shadow-md ring-1 ring-purple-400/40'
                            : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              isSelected
                                ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}
                          >
                            <Radio className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs font-bold truncate ${
                                  isSelected ? 'text-white' : 'text-slate-300'
                                }`}
                              >
                                {title}
                              </span>
                              {isSelected && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {desc}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-300">
                            {track.bpm} BPM
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-700/60">
                <span>{lang === 'th' ? '💡 รองรับไฟล์เพลงส่วนตัว: วางไฟล์ lofi.mp3 ใน public/audio/bgm/' : '💡 Custom BGM supported: Place lofi.mp3 in public/audio/bgm/'}</span>
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
                <div className="font-bold text-sm text-white">{t.settings.sfxTitle}</div>
                <div className="text-xs text-slate-400">{t.settings.sfxDesc}</div>
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
                <span className="text-slate-300 font-bold">{t.settings.sfxVolume}</span>
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
                  {savedFeedback ? (lang === 'th' ? '♪ กำลังเล่น...' : '♪ Playing...') : t.settings.testSfx}
                </button>
              </div>
            </div>
          )}

          {/* 3. Auto-Save Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-3">
              <Save className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-sm text-white">{t.settings.autoSaveTitle}</div>
                <div className="text-xs text-slate-400">{t.settings.autoSaveDesc}</div>
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

          {/* 4. Fast Animation Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <div className="font-bold text-sm text-white">{t.settings.fastAnimationTitle}</div>
                <div className="text-xs text-slate-400">{t.settings.fastAnimationDesc}</div>
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

          {/* 5. CRT Retro Monitor Shader Effect Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-purple-400" />
              <div>
                <div className="font-bold text-sm text-white">{t.settings.crtTitle}</div>
                <div className="text-xs text-slate-400">{t.settings.crtDesc}</div>
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
            {lang === 'th' ? 'บันทึกการตั้งค่าลงในเครื่องโดยอัตโนมัติ' : 'Settings auto-saved to LocalStorage'}
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
            <span>{t.common.close}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
