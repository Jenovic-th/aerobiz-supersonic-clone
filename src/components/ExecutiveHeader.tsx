import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Newspaper,
} from 'lucide-react';
import { ExecutiveRosterModal } from './ExecutiveRosterModal';
import { NegotiatorAvatar } from './NegotiatorAvatar';
import { playSound } from '../utils/audio';
import { useI18n } from '../utils/i18n';

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
  onOpenNews?: () => void;
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
  onOpenNews,
}) => {
  const { lang, setLanguage, t } = useI18n();
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

  const quarterNames = lang === 'th'
    ? ['Q1 (ม.ค.-มี.ค.)', 'Q2 (เม.ย.-มิ.ย.)', 'Q3 (ก.ค.-ก.ย.)', 'Q4 (ต.ค.-ธ.ค.)']
    : ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
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
  const hasUnreadNews = gameState.turnNumber > (gameState.lastReadNewsTurn ?? 0);

  return (
    <header className="w-full shrink-0 h-13 md:h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/80 shadow-2xl px-3 md:px-5 py-1.5 flex items-center justify-between gap-3 text-slate-100 z-20 select-none">
      {/* 1. LEFT: Consolidated Airline Identity & Calendar Turn */}
      <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl shadow-md divide-x divide-slate-700/80 overflow-hidden shrink-0">
        {/* Airline Name & Home City */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-700/90 to-indigo-800/90 font-black">
          <Plane className="w-4 h-4 text-sky-200 shrink-0" />
          <span className="text-white text-xs md:text-sm tracking-wide font-bold truncate max-w-[130px] md:max-w-[180px]">
            {playerAirline.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-sky-300 font-mono font-bold shrink-0">
            {playerAirline.homeCityId}
          </span>
        </div>

        {/* Date, Quarter & Turn */}
        <div className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 text-xs md:text-sm text-slate-200 font-bold whitespace-nowrap">
          <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-white">{gameState.currentYear}</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-300">{currentQuarterText}</span>
          <span className="text-slate-500">•</span>
          <span className="text-sky-300 font-mono">
            {gameState.gameMode === 'SANDBOX_INFINITE'
              ? (lang === 'th' ? `เทิร์น ${gameState.turnNumber} ♾️` : `Turn ${gameState.turnNumber} ♾️`)
              : (lang === 'th' ? `เทิร์น ${gameState.turnNumber}/80 🏆` : `Turn ${gameState.turnNumber}/80 🏆`)}
          </span>
        </div>
      </div>

      {/* 2. CENTER: Consolidated Performance & Resources (Cash, Rank, Envoys) */}
      <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl shadow-md divide-x divide-slate-700/80 overflow-hidden shrink-0">
        {/* Cash */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/50">
          <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-400 text-xs hidden sm:inline">{t.header.treasury}:</span>
          <span className="text-emerald-300 font-black text-sm md:text-base tracking-wider font-mono">
            ${playerAirline.cashK.toLocaleString()}K
          </span>
        </div>

        {/* Industry Rank */}
        <div className="flex items-center gap-1.5 px-3 py-1.5">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-400 text-xs hidden md:inline">{t.header.rank}:</span>
          <span
            className={`font-black font-mono text-xs md:text-sm ${
              playerRank === 1 ? 'text-amber-300' : playerRank === 2 ? 'text-slate-200' : 'text-amber-500'
            }`}
          >
            #{playerRank}/{totalAirlines}
          </span>
        </div>

        {/* Compact Envoys Button (Opens Roster) */}
        <button
          onClick={() => setShowRoster(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-700/50 transition cursor-pointer text-xs"
          title={lang === 'th' ? 'คลิกเพื่อดูทำเนียบทูตเจรจา' : 'Click to view envoys roster'}
        >
          <Users className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-slate-400 hidden xl:inline">{t.header.negotiators}:</span>
          <span className="text-emerald-300 font-bold font-mono">
            {availableCount} {lang === 'th' ? 'พร้อม' : 'Free'}
          </span>
          {onMissionCount > 0 && (
            <span className="text-amber-400 font-bold font-mono">
              ({onMissionCount} {lang === 'th' ? 'เจรจา' : 'Out'})
            </span>
          )}
        </button>

        {/* Major Active Crisis Event Badge (If any active) */}
        {activeEvent && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold ${
              activeEvent.type === 'WAR' ||
              activeEvent.type === 'OIL_CRISIS' ||
              activeEvent.type === 'EPIDEMIC' ||
              activeEvent.type === 'ECONOMIC_CRISIS'
                ? 'bg-rose-950/90 text-rose-200 animate-pulse'
                : 'bg-amber-950/90 text-amber-200'
            }`}
            title={activeEvent.title}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate max-w-[130px] hidden lg:inline">{activeEvent.title}</span>
          </div>
        )}
      </div>

      {/* 3. RIGHT: Executive System Hub (Single Clean Dropdown Trigger) */}
      <div className="flex items-center gap-2 shrink-0 ml-auto" ref={menuRef}>
        <div className="relative">
          <button
            onClick={() => {
              playSound.click();
              setShowSystemMenu((prev) => !prev);
            }}
            data-testid="header-system-btn"
            className={`flex items-center gap-2 px-3.5 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold transition cursor-pointer shadow-md active:scale-95 whitespace-nowrap border ${
              showSystemMenu
                ? 'bg-sky-600 border-sky-300 text-white ring-2 ring-sky-400/50'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-600 hover:border-sky-400 text-slate-200'
            }`}
            title={lang === 'th' ? 'เมนูระบบ / รีสตาร์ท / ตั้งค่า / บันทึกเกม' : 'System menu, settings, save and restart'}
          >
            <Settings className="w-4 h-4 text-sky-400" />
            <span className="font-bold">{t.header.systemMenu}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showSystemMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {/* System Dropdown Menu Card */}
          {showSystemMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{t.header.systemMenu}</span>
                <span className="text-sky-400 font-mono text-[10px]">● Live</span>
              </div>

              {/* In-menu Language Switcher */}
              <div className="p-2 border-b border-slate-800 bg-slate-950/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">{lang === 'th' ? 'ภาษา UI' : 'Language'}:</span>
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      onClick={() => { playSound.click(); setLanguage('th'); }}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        lang === 'th' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🇹🇭 ไทย
                    </button>
                    <button
                      onClick={() => { playSound.click(); setLanguage('en'); }}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        lang === 'en' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🇬🇧 ENG
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-1.5 space-y-1 text-xs">
                {/* 0. Global News & Chronicles */}
                <button
                  onClick={() => {
                    setShowSystemMenu(false);
                    if (onOpenNews) onOpenNews();
                  }}
                  data-testid="menu-news-btn"
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between gap-2.5 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 font-semibold">
                    <Newspaper className="w-4 h-4 text-amber-400" />
                    <span>{t.header.newsChronicle}</span>
                  </div>
                  {hasUnreadNews && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono font-bold animate-pulse">
                      NEW
                    </span>
                  )}
                </button>

                {/* 1. Quick Save */}
                <button
                  onClick={() => {
                    setShowSystemMenu(false);
                    if (onQuickSave) onQuickSave();
                    setQuickSavedAnimation(true);
                    setSaveToast(lang === 'th' ? '💾 บันทึกเกมลงใน Local Storage สำเร็จ!' : '💾 Game saved to Local Storage successfully!');
                    setTimeout(() => {
                      setQuickSavedAnimation(false);
                      setSaveToast(null);
                    }, 2500);
                  }}
                  data-testid="menu-quick-save-btn"
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <div className="flex-1 font-semibold">{t.header.quickSave}</div>
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
                  <div className="flex-1 font-semibold">{t.header.saveLoadManager}</div>
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
                  <div className="flex-1 font-semibold">{t.header.gameSettings}</div>
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
                    <div className="font-bold">{t.header.restartSimulation}</div>
                    <div className="text-[10px] text-amber-400/70 font-normal">
                      {lang === 'th' ? 'รีสตาร์ทเริ่มรอบใหม่จากขั้นตอนสร้างสายการบิน' : 'Restart and create new airline from scratch'}
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
                    <div className="font-bold">{t.header.returnToTitle}</div>
                    <div className="text-[10px] text-indigo-400/70 font-normal">
                      {lang === 'th' ? 'กลับสู่หน้าปกหลักของเกม' : 'Return to main title screen'}
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
                  <div className="flex-1 font-bold">{t.header.exitApp}</div>
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
      {saveToast &&
        createPortal(
          <div className="fixed bottom-20 right-6 z-[100] px-4 py-2 bg-emerald-950 border-2 border-emerald-400 text-emerald-200 rounded-xl shadow-2xl font-black text-xs flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveToast}</span>
          </div>,
          document.body
        )}

      {/* Roster Modal */}
      {showRoster &&
        createPortal(
          <ExecutiveRosterModal
            playerAirline={playerAirline}
            onClose={() => setShowRoster(false)}
          />,
          document.body
        )}

      {/* Confirmation Dialog Modal for Restart / Title / Exit */}
      {confirmAction &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
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
                    {confirmAction === 'restart' && (lang === 'th' ? 'ยืนยันการเริ่มเกมใหม่' : 'Restart Simulation')}
                    {confirmAction === 'title' && (lang === 'th' ? 'กลับสู่หน้าแรก' : 'Return to Title Screen')}
                    {confirmAction === 'exit' && (lang === 'th' ? 'ออกจากเกม' : 'Exit Aerobiz Supersonic')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {confirmAction === 'restart' && (lang === 'th' ? 'เริ่มสร้างสายการบินรอบใหม่' : 'Start fresh simulation')}
                    {confirmAction === 'title' && (lang === 'th' ? 'กลับสู่หน้าแรกของเกม' : 'Leave to main title')}
                    {confirmAction === 'exit' && (lang === 'th' ? 'ปิดและยุติการทำงานของโปรแกรม' : 'Quit application')}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono">
                {confirmAction === 'restart' &&
                  (lang === 'th'
                    ? 'คุณต้องการยกเลิกความคืบหน้าปัจจุบันและเริ่มสร้างสายการบินรอบใหม่หรือไม่? (แนะนำให้บันทึกเกมไว้ก่อนหากยังต้องการเล่นต่อ)'
                    : 'Are you sure you want to discard current simulation progress and start over? (Recommended to save first).')}
                {confirmAction === 'title' &&
                  (lang === 'th'
                    ? 'คุณต้องการออกจากรอบการเล่นปัจจุบันและกลับสู่หน้าแรกของเกมหรือไม่? ความคืบหน้าที่ไม่ได้บันทึกจะสูญหาย'
                    : 'Return to main title screen? Any unsaved progress will be lost.')}
                {confirmAction === 'exit' &&
                  (lang === 'th'
                    ? 'คุณต้องการปิดโปรแกรมและออกจากเกมหรือไม่? ตรวจสอบให้แน่ใจว่าได้บันทึกเกมเรียบร้อยแล้ว'
                    : 'Are you sure you want to quit the game? Ensure you have saved your game.')}
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
                  {t.common.cancel}
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
                  {confirmAction === 'restart' && (lang === 'th' ? 'เริ่มรอบใหม่' : 'Restart')}
                  {confirmAction === 'title' && (lang === 'th' ? 'กลับหน้าแรก' : 'Title Screen')}
                  {confirmAction === 'exit' && (lang === 'th' ? 'ออกจากเกม' : 'Exit')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};

