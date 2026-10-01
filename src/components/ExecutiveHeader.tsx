import React, { useState, useRef, useEffect } from 'react';
import { GameState, Airline } from '../types/game';
import {
  Plane,
  DollarSign,
  Calendar,
  Trophy,
  Users,
  Save,
  CheckCircle2,
  Database,
  AlertTriangle,
  Settings,
  RotateCcw,
  Home,
  Power,
  ChevronDown,
  Sliders,
  X,
} from 'lucide-react';
import { ExecutiveRosterModal } from './ExecutiveRosterModal';
import { NegotiatorAvatar } from './NegotiatorAvatar';
import { playSound } from '../utils/audio';

interface ExecutiveHeaderProps {
  gameState: GameState;
  playerAirline: Airline;
  onQuickSave?: () => void;
  onExportSave?: () => void;
  onImportSave?: (file: File) => void;
  onOpenSaveLoadModal?: () => void;
  onRestartGame?: () => void;
  onReturnToTitle?: () => void;
  onOpenSettings?: () => void;
}

export const ExecutiveHeader: React.FC<ExecutiveHeaderProps> = ({
  gameState,
  playerAirline,
  onQuickSave,
  onExportSave,
  onImportSave,
  onOpenSaveLoadModal,
  onRestartGame,
  onReturnToTitle,
  onOpenSettings,
}) => {
  const [showRoster, setShowRoster] = useState(false);
  const [quickSavedAnimation, setQuickSavedAnimation] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showSystemMenu, setShowSystemMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'restart' | 'title' | 'exit' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSystemMenu(false);
      }
    };
    if (showSystemMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSystemMenu]);

  const quarterNames = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
  const currentQuarterText = quarterNames[gameState.currentQuarter - 1];

  const negotiators = playerAirline.negotiators || [];
  const fieldDelegates = negotiators.filter((n) => n.role === 'FIELD');
  const availableCount = fieldDelegates.filter((n) => n.status === 'AVAILABLE').length;
  const onMissionCount = fieldDelegates.filter((n) => n.status === 'DISPATCHED').length;

  // Industry Standings
  const standings = gameState.airlineStandings || [];
  const playerRank = standings.find((s) => s.isHuman)?.rank || 1;
  const totalAirlines = gameState.airlines.length;

  const activeEvent = gameState.activeEvents?.[0];

  return (
    <header className="w-full shrink-0 h-14 md:h-16 bg-slate-900 border-b border-slate-700/80 shadow-2xl px-3 md:px-5 py-2 flex items-center justify-between gap-2 md:gap-4 text-slate-100 z-20 select-none">
      {/* 1. LEFT: Airline Identity & Calendar Turn */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl border border-blue-400 font-black shadow-lg">
          <Plane className="w-4 h-4 md:w-5 md:h-5 text-sky-200 shrink-0" />
          <span className="text-white text-xs md:text-sm tracking-wide font-bold truncate max-w-[120px] md:max-w-[160px] xl:max-w-[200px]">
            {playerAirline.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-sky-300 font-mono font-bold shrink-0">
            {playerAirline.homeCityId}
          </span>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-slate-200 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 shadow font-bold whitespace-nowrap">
          <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-white">{gameState.currentYear}</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-300">{currentQuarterText}</span>
          <span className="text-slate-500">•</span>
          <span className="text-sky-300 font-mono">
            {gameState.gameMode === 'SANDBOX_INFINITE'
              ? `Turn ${gameState.turnNumber} ♾️`
              : `Turn ${gameState.turnNumber}/80 🏆`}
          </span>
        </div>
      </div>

      {/* 2. CENTER: Executive Core KPIs (Cash, Rank, Envoys) */}
      <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm font-semibold shrink-0">
        {/* Cash in $K (Large, highlighted, glowing emerald) */}
        <div className="flex items-center gap-1.5 md:gap-2 bg-emerald-950/90 border-2 border-emerald-500/80 px-3 py-1.5 rounded-xl shadow-lg">
          <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 shrink-0" />
          <span className="text-slate-300 hidden sm:inline">Cash:</span>
          <span className="text-emerald-300 font-black text-base md:text-lg tracking-wider font-mono">
            ${playerAirline.cashK.toLocaleString()}K
          </span>
        </div>

        {/* Industry Rank Badge */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 border border-amber-500/50 px-2.5 md:px-3 py-1.5 rounded-xl shadow">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-300 hidden md:inline">Rank:</span>
          <span
            className={`font-black font-mono text-sm md:text-base ${
              playerRank === 1 ? 'text-amber-300' : playerRank === 2 ? 'text-slate-200' : 'text-amber-500'
            }`}
          >
            #{playerRank}/{totalAirlines}
          </span>
        </div>

        {/* 4+1 Executive Delegates Bar */}
        <button
          onClick={() => setShowRoster(true)}
          className="hidden 2xl:flex items-center gap-1.5 md:gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-900/80 to-indigo-950/80 hover:from-blue-800 hover:to-indigo-900 border border-sky-400/80 rounded-xl shadow-lg transition active:scale-95 cursor-pointer text-xs shrink-0"
          title="คลิกเพื่อดูทำเนียบทูตเจรจา (Envoys Roster)"
        >
          <Users className="w-4 h-4 text-sky-300" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-slate-300 font-bold uppercase hidden xl:inline">Envoys (4+1)</span>
            <div className="flex items-center gap-1 font-bold font-mono">
              <span className="text-emerald-300">{availableCount} Free</span>
              {onMissionCount > 0 && (
                <span className="text-amber-400 font-bold">• {onMissionCount} Active</span>
              )}
            </div>
          </div>
          <div className="hidden xl:flex -space-x-1.5 ml-0.5">
            {fieldDelegates.map((d) => (
              <div
                key={d.id}
                className={`w-5 h-5 rounded-full border-2 ${
                  d.status === 'AVAILABLE' ? 'border-emerald-400' : 'border-amber-400'
                } overflow-hidden`}
              >
                <NegotiatorAvatar avatarId={d.avatarId} size="sm" className="w-full h-full" />
              </div>
            ))}
          </div>
        </button>

        {/* Major Active Crisis Event Badge (Compact) */}
        {activeEvent && (
          <div
            className={`hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs shadow border font-bold ${
              activeEvent.type === 'WAR' ||
              activeEvent.type === 'OIL_CRISIS' ||
              activeEvent.type === 'EPIDEMIC' ||
              activeEvent.type === 'ECONOMIC_CRISIS'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse'
                : 'bg-amber-950/90 border-amber-500 text-amber-200'
            }`}
            title={activeEvent.description}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate max-w-[140px]">{activeEvent.title}</span>
          </div>
        )}
      </div>

      {/* 3. RIGHT: Permanent Save & Load Command Suite (ALWAYS VISIBLE & LOCKED IN PLACE) */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0 ml-auto">
        {/* Quick Save Button (Instant 1-Click Save with visual confirmation) */}
        <button
          onClick={() => {
            if (onQuickSave) onQuickSave();
            setQuickSavedAnimation(true);
            setSaveToast('💾 บันทึกเกมลงใน Local Storage สำเร็จ!');
            setTimeout(() => {
              setQuickSavedAnimation(false);
              setSaveToast(null);
            }, 2500);
          }}
          className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 border rounded-xl text-xs font-black transition cursor-pointer shadow-md active:scale-95 whitespace-nowrap ${
            quickSavedAnimation
              ? 'bg-emerald-600 border-emerald-300 text-white ring-2 ring-emerald-400'
              : 'bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 border-emerald-400 text-white shadow-emerald-950/50'
          }`}
          title="Quick Save (บันทึกเซฟด่วนทันที)"
        >
          {quickSavedAnimation ? (
            <CheckCircle2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Save className="w-4 h-4 text-emerald-200" />
          )}
          <span className="hidden xl:inline">{quickSavedAnimation ? 'Saved! ✓' : 'Quick Save'}</span>
        </button>

        {/* Full Save & Load Data Management Modal Trigger */}
        <button
          onClick={onOpenSaveLoadModal}
          className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-sky-400 rounded-xl text-xs font-bold text-slate-100 transition cursor-pointer shadow-md active:scale-95 whitespace-nowrap"
          title="Save & Load Data Management (จัดการข้อมูลเซฟ/โหลด/สำรองไฟล์)"
        >
          <Database className="w-4 h-4 text-sky-400" />
          <span className="hidden 2xl:inline">Save & Load</span>
        </button>

        {/* System Menu Dropdown Trigger */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              playSound.click();
              setShowSystemMenu((prev) => !prev);
            }}
            data-testid="header-system-btn"
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-md active:scale-95 whitespace-nowrap border ${
              showSystemMenu
                ? 'bg-sky-600 border-sky-300 text-white ring-2 ring-sky-400/50'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-600 hover:border-sky-400 text-slate-200'
            }`}
            title="System & Game Management (เมนูระบบ / รีสตาร์ท / ตั้งค่า / ออกจากเกม)"
          >
            <Settings className="w-4 h-4 text-sky-400" />
            <span className="font-bold">System</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showSystemMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {/* System Dropdown Menu Card */}
          {showSystemMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Executive System Menu</span>
                <span className="text-sky-400 font-mono text-[10px]">● Live</span>
              </div>

              <div className="p-1.5 space-y-1 text-xs">
                {/* 1. Quick Save */}
                <button
                  onClick={() => {
                    setShowSystemMenu(false);
                    if (onQuickSave) onQuickSave();
                    setQuickSavedAnimation(true);
                    setSaveToast('💾 บันทึกเกมลงใน Local Storage สำเร็จ!');
                    setTimeout(() => {
                      setQuickSavedAnimation(false);
                      setSaveToast(null);
                    }, 2500);
                  }}
                  data-testid="menu-quick-save-btn"
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <div className="flex-1 font-semibold">Quick Save (เซฟด่วน)</div>
                </button>

                {/* 2. Save & Load Modal */}
                <button
                  onClick={() => {
                    setShowSystemMenu(false);
                    if (onOpenSaveLoadModal) onOpenSaveLoadModal();
                  }}
                  data-testid="menu-save-load-btn"
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Database className="w-4 h-4 text-sky-400" />
                  <div className="flex-1 font-semibold">Save & Load Management</div>
                </button>

                {/* 3. Game Settings */}
                <button
                  onClick={() => {
                    setShowSystemMenu(false);
                    if (onOpenSettings) onOpenSettings();
                  }}
                  data-testid="menu-settings-btn"
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <div className="flex-1 font-semibold">Game Settings (การตั้งค่า)</div>
                </button>

                <div className="border-t border-slate-800 my-1" />

                {/* 4. Restart Game */}
                <button
                  onClick={() => {
                    setShowSystemMenu(false);
                    playSound.click();
                    setConfirmAction('restart');
                  }}
                  data-testid="menu-restart-btn"
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-amber-950/40 text-amber-300 hover:text-amber-200 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold">Restart Game (เริ่มเกมใหม่)</div>
                    <div className="text-[10px] text-amber-400/70 font-normal">
                      รีสตาร์ทเริ่มรอบใหม่จากขั้นตอนสร้างสายการบิน
                    </div>
                  </div>
                </button>

                {/* 5. Return to Title */}
                <button
                  onClick={() => {
                    setShowSystemMenu(false);
                    playSound.click();
                    setConfirmAction('title');
                  }}
                  data-testid="menu-title-btn"
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-indigo-950/40 text-indigo-300 hover:text-indigo-200 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Home className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="font-bold">Main Title Screen (กลับหน้าปก)</div>
                    <div className="text-[10px] text-indigo-400/70 font-normal">
                      กลับสู่หน้าปกหลักของเกม
                    </div>
                  </div>
                </button>

                {/* 6. Exit Game */}
                <button
                  onClick={() => {
                    setShowSystemMenu(false);
                    playSound.click();
                    setConfirmAction('exit');
                  }}
                  data-testid="menu-exit-btn"
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-rose-950/40 text-rose-400 hover:text-rose-200 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Power className="w-4 h-4 text-rose-400" />
                  <div className="flex-1 font-bold">Exit Game (ออกจากโปรแกรม)</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input for Importing Save */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onImportSave) {
            onImportSave(file);
          }
          e.target.value = '';
        }}
      />

      {/* Floating Save Toast Notification */}
      {saveToast && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2 bg-emerald-950 border-2 border-emerald-400 text-emerald-200 rounded-xl shadow-2xl font-black text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Roster Modal */}
      {showRoster && (
        <ExecutiveRosterModal
          playerAirline={playerAirline}
          onClose={() => setShowRoster(false)}
        />
      )}

      {/* Confirmation Dialog Modal for Restart / Title / Exit */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-md rounded-3xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl border ${
                  confirmAction === 'restart'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-400'
                    : confirmAction === 'title'
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-400'
                    : 'bg-rose-500/20 border-rose-400 text-rose-400'
                }`}
              >
                {confirmAction === 'restart' && <RotateCcw className="w-6 h-6" />}
                {confirmAction === 'title' && <Home className="w-6 h-6" />}
                {confirmAction === 'exit' && <Power className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-black font-mono">
                  {confirmAction === 'restart' && 'ยืนยันการเริ่มเกมใหม่ (Restart Game)'}
                  {confirmAction === 'title' && 'กลับสู่หน้าปกหลัก (Return to Title)'}
                  {confirmAction === 'exit' && 'ออกจากเกม (Exit Game)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {confirmAction === 'restart' && 'เริ่มสร้างสายการบินรอบใหม่'}
                  {confirmAction === 'title' && 'กลับสู่หน้าแรกของเกม'}
                  {confirmAction === 'exit' && 'ปิดและยุติการทำงานของโปรแกรม'}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono">
              {confirmAction === 'restart' &&
                'คุณต้องการยกเลิกความคืบหน้าปัจจุบันและเริ่มสร้างสายการบินรอบใหม่หรือไม่? (แนะนำให้เซฟเกมไว้ก่อนหากยังต้องการเล่นต่อ)'}
              {confirmAction === 'title' &&
                'คุณต้องการออกจากรอบการเล่นปัจจุบันและกลับสู่หน้าปกของเกมหรือไม่? ความคืบหน้าที่ไม่ได้บันทึกจะสูญหาย'}
              {confirmAction === 'exit' &&
                'คุณต้องการปิดโปรแกรมและออกจากเกมหรือไม่? ตรวจสอบให้แน่ใจว่าได้บันทึกเกมเรียบร้อยแล้ว'}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  playSound.click();
                  setConfirmAction(null);
                }}
                data-testid="confirm-dialog-cancel-btn"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound.confirm();
                  const action = confirmAction;
                  setConfirmAction(null);
                  if (action === 'restart' && onRestartGame) {
                    onRestartGame();
                  } else if (action === 'title' && onReturnToTitle) {
                    onReturnToTitle();
                  } else if (action === 'exit') {
                    if (typeof window !== 'undefined' && (window as any).electronAPI?.quit) {
                      (window as any).electronAPI.quit();
                    } else if (typeof window !== 'undefined' && (window as any).electronAPI?.close) {
                      (window as any).electronAPI.close();
                    } else if (window.close) {
                      window.close();
                    }
                  }
                }}
                data-testid="confirm-dialog-confirm-btn"
                className={`px-5 py-2 rounded-xl text-xs font-black shadow-lg transition cursor-pointer ${
                  confirmAction === 'restart'
                    ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                    : confirmAction === 'title'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {confirmAction === 'restart' && 'เริ่มรอบใหม่'}
                {confirmAction === 'title' && 'กลับหน้าปก'}
                {confirmAction === 'exit' && 'ออกจากเกม'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
