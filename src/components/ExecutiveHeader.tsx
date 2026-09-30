import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { ExecutiveRosterModal } from './ExecutiveRosterModal';
import { NegotiatorAvatar } from './NegotiatorAvatar';

interface ExecutiveHeaderProps {
  gameState: GameState;
  playerAirline: Airline;
  onQuickSave?: () => void;
  onExportSave?: () => void;
  onImportSave?: (file: File) => void;
  onOpenSaveLoadModal?: () => void;
}

export const ExecutiveHeader: React.FC<ExecutiveHeaderProps> = ({
  gameState,
  playerAirline,
  onQuickSave,
  onExportSave,
  onImportSave,
  onOpenSaveLoadModal,
}) => {
  const [showRoster, setShowRoster] = useState(false);
  const [quickSavedAnimation, setQuickSavedAnimation] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <Plane className="w-4 h-4 md:w-5 md:h-5 text-sky-200" />
          <span className="text-white text-xs md:text-sm tracking-wide whitespace-nowrap font-bold">
            {playerAirline.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-sky-300 font-mono font-bold">
            {playerAirline.homeCityId}
          </span>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-slate-200 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 shadow font-bold whitespace-nowrap">
          <Calendar className="w-4 h-4 text-sky-400" />
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
        <div className="flex items-center gap-1.5 md:gap-2 bg-emerald-950/90 border-2 border-emerald-500/80 px-3.5 py-1.5 rounded-xl shadow-lg">
          <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
          <span className="text-slate-300 hidden sm:inline">Cash:</span>
          <span className="text-emerald-300 font-black text-base md:text-lg tracking-wider font-mono">
            ${playerAirline.cashK.toLocaleString()}K
          </span>
        </div>

        {/* Industry Rank Badge */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 border border-amber-500/50 px-2.5 md:px-3 py-1.5 rounded-xl shadow">
          <Trophy className="w-4 h-4 text-amber-400" />
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
          className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-900/80 to-indigo-950/80 hover:from-blue-800 hover:to-indigo-900 border border-sky-400/80 rounded-xl shadow-lg transition active:scale-95 cursor-pointer text-xs"
          title="คลิกเพื่อดูทำเนียบทูตเจรจา (Envoys Roster)"
        >
          <Users className="w-4 h-4 text-sky-300" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-slate-300 font-bold uppercase hidden lg:inline">Envoys (4+1)</span>
            <div className="flex items-center gap-1 font-bold font-mono">
              <span className="text-emerald-300">{availableCount} Free</span>
              {onMissionCount > 0 && (
                <span className="text-amber-400 font-bold">• {onMissionCount} Active</span>
              )}
            </div>
          </div>
          <div className="hidden sm:flex -space-x-1.5 ml-0.5">
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
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs shadow border font-bold ${
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
      <div className="flex items-center gap-2 shrink-0 ml-auto">
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
          className={`flex items-center gap-1.5 px-3 py-1.5 md:py-2 border rounded-xl text-xs font-black transition cursor-pointer shadow-md active:scale-95 whitespace-nowrap ${
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
          <span>{quickSavedAnimation ? 'Saved! ✓' : 'Quick Save'}</span>
        </button>

        {/* Full Save & Load Data Management Modal Trigger */}
        <button
          onClick={onOpenSaveLoadModal}
          className="flex items-center gap-1.5 px-3 py-1.5 md:py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-sky-400 rounded-xl text-xs font-bold text-slate-100 transition cursor-pointer shadow-md active:scale-95 whitespace-nowrap"
          title="Save & Load Data Management (จัดการข้อมูลเซฟ/โหลด/สำรองไฟล์)"
        >
          <Database className="w-4 h-4 text-sky-400" />
          <span>Save & Load</span>
        </button>
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
    </header>
  );
};
