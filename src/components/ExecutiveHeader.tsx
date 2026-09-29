import React, { useState, useRef } from 'react';
import { GameState, Airline } from '../types/game';
import {
  Plane,
  DollarSign,
  Calendar,
  Flame,
  Globe2,
  AlertTriangle,
  Users,
  Trophy,
  Save,
  Download,
  Upload,
  CheckCircle2,
  X,
  FileJson,
} from 'lucide-react';
import { ExecutiveRosterModal } from './ExecutiveRosterModal';
import { NegotiatorAvatar } from './NegotiatorAvatar';

interface ExecutiveHeaderProps {
  gameState: GameState;
  playerAirline: Airline;
  onQuickSave?: () => void;
  onExportSave?: () => void;
  onImportSave?: (file: File) => void;
}

export const ExecutiveHeader: React.FC<ExecutiveHeaderProps> = ({
  gameState,
  playerAirline,
  onQuickSave,
  onExportSave,
  onImportSave,
}) => {
  const [showRoster, setShowRoster] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quarterNames = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
  const currentQuarterText = quarterNames[gameState.currentQuarter - 1];

  const negotiators = playerAirline.negotiators || [];
  const fieldDelegates = negotiators.filter((n) => n.role === 'FIELD');
  const availableCount = fieldDelegates.filter((n) => n.status === 'AVAILABLE').length;
  const onMissionCount = fieldDelegates.filter((n) => n.status === 'DISPATCHED').length;

  // Count active player routes
  const playerRoutes = gameState.routes.filter((r) => r.airlineId === playerAirline.id);

  // Industry Standings
  const standings = gameState.airlineStandings || [];
  const playerRank = standings.find((s) => s.isHuman)?.rank || 1;
  const totalAirlines = gameState.airlines.length;

  // Calculate total fleet size and available planes
  const totalPlanes = playerAirline.fleet.length;
  const assignedPlanes = playerAirline.fleet.filter((f) => f.assignedRouteId !== null).length;
  const availablePlanes = totalPlanes - assignedPlanes;

  return (
    <header className="w-full shrink-0 h-14 md:h-16 bg-slate-900 border-b border-slate-700/80 shadow-2xl px-4 py-2 flex items-center justify-between gap-3 text-slate-100 z-20 overflow-x-auto select-none">
      {/* Airline Identity & Turn Info */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl border border-blue-400 font-black shadow-lg">
          <Plane className="w-4 h-4 md:w-5 md:h-5 text-sky-200" />
          <span className="text-white text-sm md:text-base tracking-wide whitespace-nowrap">{playerAirline.name}</span>
        </div>

        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-200 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 shadow font-bold whitespace-nowrap">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span className="text-white">{gameState.currentYear}</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-300">{currentQuarterText}</span>
          <span className="text-slate-500">•</span>
          <span className="text-sky-300 font-mono">
            {gameState.gameMode === 'SANDBOX_INFINITE'
              ? `Turn ${gameState.turnNumber} ♾️ Sandbox`
              : `Turn ${gameState.turnNumber}/80 🏆`}
          </span>
        </div>
      </div>

      {/* Financial & Fleet Stats (Enlarged $K scale) */}
      <div className="flex items-center gap-3 text-xs md:text-sm font-semibold shrink-0">
        {/* Industry Rank Badge */}
        <div className="flex items-center gap-2 bg-slate-800 border border-amber-500/50 px-3 py-2 rounded-xl shadow">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300">Rank:</span>
          <span
            className={`font-black font-mono text-base ${
              playerRank === 1 ? 'text-amber-300' : playerRank === 2 ? 'text-slate-200' : 'text-amber-500'
            }`}
          >
            #{playerRank}/{totalAirlines}
          </span>
        </div>

        {/* Cash in $K */}
        <div className="flex items-center gap-2 bg-emerald-950 border-2 border-emerald-500/70 px-4 py-2 rounded-xl shadow-lg">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <span className="text-slate-300">Cash:</span>
          <span className="text-emerald-300 font-black text-lg md:text-xl tracking-wider font-mono">
            ${playerAirline.cashK.toLocaleString()}K
          </span>
        </div>

        {/* Fleet Count */}
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 px-3.5 py-2 rounded-xl">
          <Plane className="w-4 h-4 text-sky-400" />
          <span className="text-slate-300">Fleet:</span>
          <span className="font-black text-white font-mono text-base">
            {assignedPlanes}/{totalPlanes}
          </span>
          <span className="text-emerald-400 font-bold text-xs">({availablePlanes} idle)</span>
        </div>

        {/* Active Routes */}
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 px-3.5 py-2 rounded-xl">
          <Globe2 className="w-4 h-4 text-indigo-400" />
          <span className="text-slate-300">Routes:</span>
          <span className="font-black text-white font-mono text-base">{playerRoutes.length}</span>
        </div>

        {/* Fuel Price Indicator */}
        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${
            gameState.fuelPriceIndex > 1.2
              ? 'bg-rose-950 border-rose-500 text-rose-200 animate-pulse font-black'
              : 'bg-slate-800 border-slate-600 text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300">Fuel:</span>
          <span className="font-mono font-black text-base">{gameState.fuelPriceIndex.toFixed(1)}x</span>
        </div>

        {/* Upcoming Event Radar Indicator */}
        {gameState.upcomingEvents && gameState.upcomingEvents.length > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border border-indigo-400/80 rounded-xl shadow-lg font-mono text-xs cursor-default"
            title={`${gameState.upcomingEvents[0].event.title}: ${gameState.upcomingEvents[0].event.description}`}
          >
            <span className="text-sm animate-pulse">
              {gameState.upcomingEvents[0].event.type === 'WORLD_CUP'
                ? '⚽'
                : gameState.upcomingEvents[0].event.type === 'OLYMPICS'
                ? '🏅'
                : gameState.upcomingEvents[0].event.type === 'EURO'
                ? '🏆'
                : gameState.upcomingEvents[0].event.type === 'EXPO'
                ? '🌐'
                : gameState.upcomingEvents[0].event.type === 'TOURISM_YEAR'
                ? '🌴'
                : '🔮'}
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider">
                อีก {gameState.upcomingEvents[0].quartersUntil * 3} เดือน ({gameState.upcomingEvents[0].quartersUntil}Q)
              </span>
              <span className="text-white font-bold text-xs truncate max-w-[150px]">
                {gameState.upcomingEvents[0].event.title}
              </span>
            </div>
          </div>
        )}

        {/* 4+1 Executive Delegates Bar */}
        <button
          onClick={() => setShowRoster(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-blue-900/80 to-indigo-950/80 hover:from-blue-800 hover:to-indigo-900 border border-sky-400/80 rounded-xl shadow-lg transition active:scale-95 cursor-pointer text-xs"
        >
          <Users className="w-4 h-4 text-sky-300" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-slate-300 font-bold uppercase">Envoys (4+1)</span>
            <div className="flex items-center gap-1.5 font-bold font-mono">
              <span className="text-emerald-300">{availableCount} Free</span>
              {onMissionCount > 0 && (
                <span className="text-amber-400 font-bold">• {onMissionCount} Active</span>
              )}
            </div>
          </div>
          <div className="flex -space-x-2 ml-1">
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

        {/* System Save / Load Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSaveMenu(!showSaveMenu)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-slate-200 transition cursor-pointer shadow active:scale-95"
            title="Save / Export / Import Game State"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Save & Load</span>
          </button>

          {showSaveMenu && (
            <div className="absolute right-0 top-12 w-64 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 font-mono border-b border-slate-800 flex justify-between items-center">
                <span>Game Data Management</span>
                <button
                  onClick={() => setShowSaveMenu(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => {
                  if (onQuickSave) onQuickSave();
                  setSaveToast('💾 Game Saved to Local Storage!');
                  setTimeout(() => setSaveToast(null), 2500);
                  setShowSaveMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800 text-left text-slate-200 font-bold transition cursor-pointer"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <div>
                  <div>Quick Save (บันทึกเซฟ)</div>
                  <div className="text-[10px] text-slate-400">Save to browser / local storage</div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (onExportSave) onExportSave();
                  setShowSaveMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800 text-left text-slate-200 font-bold transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <div>
                  <div>Export Save File (.json)</div>
                  <div className="text-[10px] text-slate-400">Download save to play on other PCs</div>
                </div>
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowSaveMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800 text-left text-slate-200 font-bold transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <div>
                  <div>Import Save File (.json)</div>
                  <div className="text-[10px] text-slate-400">Load backup from file on disk</div>
                </div>
              </button>
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

      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2 bg-emerald-950 border-2 border-emerald-400 text-emerald-200 rounded-xl shadow-2xl font-black text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Active World Event Banner (if any) */}
      {gameState.activeEvents.length > 0 && (
        <div
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm shadow-md border-2 ${
            gameState.activeEvents[0].type === 'WAR' ||
            gameState.activeEvents[0].type === 'OIL_CRISIS' ||
            gameState.activeEvents[0].type === 'EPIDEMIC' ||
            gameState.activeEvents[0].type === 'ECONOMIC_CRISIS'
              ? 'bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse'
              : 'bg-amber-950/90 border-amber-500 text-amber-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold truncate max-w-sm">{gameState.activeEvents[0].title}</span>
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
