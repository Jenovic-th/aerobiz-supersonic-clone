import React, { useState, useEffect } from 'react';
import { GameState } from '../types/game';
import { getLatestAvailableSave, loadGameFromLocalStorage, SaveMetadata } from '../utils/saveLoad';
import { playSound } from '../utils/audio';
import {
  Plane,
  Play,
  RotateCcw,
  FolderOpen,
  Settings,
  Power,
  Sparkles,
  Shield,
  Trophy,
  Calendar,
  DollarSign,
  ChevronRight,
  Globe2,
} from 'lucide-react';

interface TitleScreenProps {
  onNewGame: () => void;
  onResumeGame: (loadedState: GameState) => void;
  onOpenSaveLoad: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onNewGame,
  onResumeGame,
  onOpenSaveLoad,
  onOpenSettings,
}) => {
  const [latestSave, setLatestSave] = useState<{
    isAutoSave: boolean;
    metadata: SaveMetadata;
  } | null>(null);

  useEffect(() => {
    const save = getLatestAvailableSave();
    if (save) {
      setLatestSave(save);
    }
  }, []);

  const handleResume = () => {
    if (!latestSave) return;
    playSound.confirm();
    const loaded = loadGameFromLocalStorage(latestSave.isAutoSave);
    if (loaded) {
      onResumeGame(loaded);
    }
  };

  const handleExitGame = () => {
    playSound.click();
    if (window.confirm('คุณต้องการออกจากเกมและปิดโปรแกรมหรือไม่?')) {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.quit) {
        (window as any).electronAPI.quit();
      } else if (window.close) {
        window.close();
      }
    }
  };

  return (
    <div className="relative w-screen h-screen min-h-0 min-w-0 bg-slate-950 overflow-hidden flex flex-col justify-between select-none">
      {/* 1. ATMOSPHERIC BACKGROUND WITH RADAR & SATELLITE AESTHETIC */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0a1526] to-[#040814] z-0" />

      {/* Subtle Glowing Runway Horizon Light Arc */}
      <div className="absolute -bottom-36 left-1/2 -translate-x-1/2 w-[1600px] h-[500px] bg-gradient-to-t from-sky-500/15 via-indigo-600/5 to-transparent rounded-[100%] blur-3xl pointer-events-none" />

      {/* Grid line overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* 2. TOP STATUS BAR */}
      <header className="relative z-10 w-full px-6 py-4 flex justify-between items-center text-xs border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-950/80 border border-sky-400/60 rounded-full font-mono font-bold text-sky-300">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span>KOEI SUPERSONIC ENGINE</span>
          </div>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 font-mono hidden sm:inline">
            1980 – 2090 CHRONOLOGICAL TIMELINE
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-slate-400">
          <span className="px-2.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-amber-300 font-bold">
            v2.6.0 HD STANDALONE
          </span>
          <button
            onClick={() => {
              playSound.click();
              onOpenSettings();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Game Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. CENTER HERO: TITLE LOGO & MAIN MENU ACTION SUITE */}
      <main className="relative z-10 max-w-4xl mx-auto w-full px-6 py-4 flex flex-col items-center justify-center flex-1 my-auto">
        {/* Supersonic Jet Icon & Title Heading */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-600 to-indigo-600 p-0.5 shadow-[0_0_40px_rgba(56,189,248,0.4)] flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
                <Plane className="w-10 h-10 text-sky-400 transform -rotate-45" />
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-sky-200 to-indigo-300 drop-shadow-xl">
            AEROBIZ
          </h1>
          <div className="text-2xl sm:text-4xl md:text-5xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 font-mono -mt-1 sm:-mt-2">
            SUPERSONIC
          </div>
          <p className="text-slate-400 font-medium text-xs sm:text-sm mt-2 tracking-widest uppercase font-mono">
            Commercial Airline Tycoon Simulation
          </p>
        </div>

        {/* Action Menu Cards Deck */}
        <div className="w-full max-w-md space-y-3">
          {/* BUTTON 1: CONTINUE GAME (Prominent when save exists) */}
          {latestSave && (
            <button
              onClick={handleResume}
              data-testid="title-resume-btn"
              className="w-full p-4 bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-slate-900 border-2 border-emerald-400/90 hover:border-emerald-300 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex flex-col text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-2 font-black font-mono text-emerald-300 text-sm tracking-wide">
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span>Resume Flight Operations (เล่นต่อ)</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-900/60 text-emerald-200 border border-emerald-500/50 rounded-full">
                  {latestSave.isAutoSave ? 'AUTO-SAVE' : 'SAVED GAME'}
                </span>
              </div>

              {/* Save summary */}
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                <span className="font-bold text-white">{latestSave.metadata.airlineName}</span>
                <span className="text-emerald-400 font-bold">
                  {latestSave.metadata.currentYear} Q{latestSave.metadata.currentQuarter}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                <span>Fleet: {latestSave.metadata.fleetCount} planes</span>
                <span>•</span>
                <span>Routes: {latestSave.metadata.routesCount} active</span>
                <span>•</span>
                <span className="text-emerald-300 font-bold">
                  ${latestSave.metadata.cashK.toLocaleString()}K
                </span>
              </div>
            </button>
          )}

          {/* BUTTON 2: START NEW GAME */}
          <button
            onClick={() => {
              playSound.click();
              onNewGame();
            }}
            data-testid="title-new-game-btn"
            className="w-full p-4 bg-gradient-to-r from-blue-900/80 via-indigo-950/80 to-slate-900 border-2 border-sky-400/80 hover:border-sky-300 rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-300 group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-white text-sm font-mono tracking-wide group-hover:text-sky-200">
                  COMMENCE AIRLINE OPERATION (START SIMULATION)
                </div>
                <div className="text-xs text-slate-400">
                  เริ่มเกมใหม่ • ก่อตั้งสายการบินและเลือกยุค 1980 / 2000 / 2020
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition" />
          </button>

          {/* BUTTON 3 & 4 ROW: LOAD SAVE & SETTINGS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                playSound.click();
                onOpenSaveLoad();
              }}
              data-testid="title-load-btn"
              className="p-3 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700 hover:border-sky-400/70 rounded-2xl text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95"
            >
              <FolderOpen className="w-4 h-4 text-sky-400" />
              <span>Load Save File</span>
            </button>

            <button
              onClick={() => {
                playSound.click();
                onOpenSettings();
              }}
              data-testid="title-settings-btn"
              className="p-3 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700 hover:border-sky-400/70 rounded-2xl text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Game Settings</span>
            </button>
          </div>

          {/* BUTTON 5: EXIT GAME */}
          <button
            onClick={handleExitGame}
            data-testid="title-exit-btn"
            className="w-full py-2.5 bg-slate-950/60 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-500/50 rounded-2xl text-slate-400 hover:text-rose-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Exit Game (ออกจากโปรแกรม)</span>
          </button>
        </div>
      </main>

      {/* 4. FOOTER CREDITS */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 font-mono gap-1">
        <div>
          Inspired by Koei <span className="text-slate-300 font-bold">Aerobiz</span> &{' '}
          <span className="text-slate-300 font-bold">Aerobiz Supersonic</span> (1992 – 1994)
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Keyboard: [Esc] Back</span>
          <span>•</span>
          <span className="text-emerald-400">Save Storage Active</span>
        </div>
      </footer>
    </div>
  );
};
