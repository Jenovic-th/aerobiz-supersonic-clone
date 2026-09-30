import React, { useState } from 'react';
import { GameState, Airline } from '../types/game';
import {
  Plane,
  PlusCircle,
  ShoppingCart,
  Building2,
  Handshake,
  BarChart3,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Users,
  Flame,
  Globe2,
  X,
  LayoutGrid,
  Calendar,
  AlertTriangle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface BottomToolbarProps {
  gameState: GameState;
  playerAirline: Airline;
  onOpenRouteModal: () => void;
  onOpenFleetModal: () => void;
  onOpenAircraftShop: () => void;
  onOpenBusinessModal: () => void;
  onOpenSlotModal: () => void;
  onOpenFinancialReport: () => void;
  onOpenBoardMeeting: () => void;
  onAdvanceQuarter: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  gameState,
  playerAirline,
  onOpenRouteModal,
  onOpenFleetModal,
  onOpenAircraftShop,
  onOpenBusinessModal,
  onOpenSlotModal,
  onOpenFinancialReport,
  onOpenBoardMeeting,
  onAdvanceQuarter,
}) => {
  const [showOperationsDrawer, setShowOperationsDrawer] = useState(false);

  // Player fleet metrics
  const totalPlanes = playerAirline.fleet.length;
  const assignedPlanes = playerAirline.fleet.filter((f) => f.assignedRouteId !== null).length;
  const availablePlanes = Math.max(0, totalPlanes - assignedPlanes);
  const avgCondition =
    totalPlanes > 0
      ? Math.round(
          playerAirline.fleet.reduce((sum, f) => sum + (f.conditionPct || 100), 0) / totalPlanes
        )
      : 100;

  // Player routes
  const playerRoutes = gameState.routes.filter((r) => r.airlineId === playerAirline.id);
  const lastQuarterRev = playerRoutes.reduce((sum, r) => sum + (r.lastQuarterStats?.revenueK || 0), 0);
  const lastQuarterProf = playerRoutes.reduce((sum, r) => sum + (r.lastQuarterStats?.profitK || 0), 0);
  const lastQuarterPax = playerRoutes.reduce((sum, r) => sum + (r.lastQuarterStats?.passengers || 0), 0);

  // Market metrics
  const fuelMultiplier = gameState.fuelPriceIndex || 1.0;
  const isFuelHigh = fuelMultiplier > 1.2;
  const activeEvents = gameState.activeEvents || [];
  const upcomingEvents = gameState.upcomingEvents || [];

  return (
    <footer className="w-full shrink-0 relative bg-slate-900 border-t border-slate-700/80 shadow-2xl z-20 select-none">
      {/* 1. SLIDE-UP OPERATIONS HUD DRAWER (เด้งขึ้นมาเมื่อกด และพับจมลงไปได้) */}
      {showOperationsDrawer && (
        <div className="absolute bottom-full left-2 right-2 md:left-4 md:right-4 mb-2 bg-slate-900/95 backdrop-blur-xl border-2 border-sky-500/80 rounded-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.85)] p-4 md:p-5 z-40 animate-in slide-in-from-bottom-4 duration-200 text-slate-100">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-sky-950 border border-sky-400">
                <LayoutGrid className="w-5 h-5 text-sky-300" />
              </div>
              <div>
                <h3 className="font-black text-sm md:text-base text-white">
                  Operations & Market Intelligence HUD
                </h3>
                <p className="text-[11px] text-slate-400">
                  ศูนย์ควบคุมข้อมูลสถานะฝูงบิน ตลาดเชื้อเพลิง เครือข่ายการบิน และเรดาร์เหตุการณ์โลก
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowOperationsDrawer(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer shadow active:scale-95"
            >
              <span>พับเก็บ (Hide)</span>
              <ChevronDown className="w-4 h-4 text-sky-400" />
            </button>
          </div>

          {/* Drawer Grid of 4 Intelligence Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Panel 1: Fleet Logistics */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-sky-400" />
                  <span className="font-black text-xs text-white uppercase tracking-wider">Fleet Logistics</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono font-bold">
                  {totalPlanes} Total
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assigned Flights:</span>
                  <span className="font-bold text-white font-mono">{assignedPlanes} planes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ready in Hangars:</span>
                  <span className="font-bold text-emerald-400 font-mono">{availablePlanes} idle planes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Airframe Health:</span>
                  <span className="font-bold text-amber-300 font-mono">{avgCondition}% avg</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowOperationsDrawer(false);
                    onOpenFleetModal();
                  }}
                  className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-bold text-[11px] transition shadow cursor-pointer text-center"
                >
                  Manage Fleet
                </button>
                <button
                  onClick={() => {
                    setShowOperationsDrawer(false);
                    onOpenAircraftShop();
                  }}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[11px] border border-slate-700 transition cursor-pointer"
                >
                  Buy Planes
                </button>
              </div>
            </div>

            {/* Panel 2: Fuel Market Pressure */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="font-black text-xs text-white uppercase tracking-wider">Fuel Market</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                    isFuelHigh
                      ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}
                >
                  {fuelMultiplier.toFixed(2)}x Index
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Market Rate:</span>
                  <span className="font-bold text-white font-mono">
                    {fuelMultiplier <= 1.0
                      ? 'Low / Stable (1.0x)'
                      : fuelMultiplier <= 1.3
                      ? 'Elevated (+10-30%)'
                      : 'Severe Crisis (High Risk)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Expense Impact:</span>
                  <span className={`font-bold font-mono ${isFuelHigh ? 'text-rose-400' : 'text-slate-300'}`}>
                    {isFuelHigh ? 'High Fuel Surcharges' : 'Standard Operating Cost'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Profit Squeeze:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {fuelMultiplier > 1.0 ? `-${Math.round((fuelMultiplier - 1.0) * 20)}% margin` : 'Optimal'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 italic">
                *วิกฤตน้ำมันลดลงได้ด้วยการเลือกเครื่องบินยุคใหม่ที่ประหยัดพลังงาน
              </div>
            </div>

            {/* Panel 3: Route Network Performance */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-indigo-400" />
                  <span className="font-black text-xs text-white uppercase tracking-wider">Network Health</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-bold">
                  {playerRoutes.length} Routes
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Regional Hubs:</span>
                  <span className="font-bold text-sky-300 font-mono">
                    {(playerAirline.hubCityIds || []).length} Hubs Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Q Passengers:</span>
                  <span className="font-bold text-white font-mono">{lastQuarterPax.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Q Profit:</span>
                  <span
                    className={`font-black font-mono ${
                      lastQuarterProf >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {lastQuarterProf >= 0 ? '+' : ''}${lastQuarterProf.toLocaleString()}K
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowOperationsDrawer(false);
                    onOpenRouteModal();
                  }}
                  className="w-full py-1.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-bold text-[11px] transition shadow cursor-pointer text-center"
                >
                  + Open New Flight Route
                </button>
              </div>
            </div>

            {/* Panel 4: Global Events & Radar */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="font-black text-xs text-white uppercase tracking-wider">World Radar</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold">
                  {upcomingEvents.length} Upcoming
                </span>
              </div>

              {activeEvents.length > 0 ? (
                <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-700/60 text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{activeEvents[0].title}</span>
                  </div>
                  <p className="text-[11px] text-amber-300/80 line-clamp-2">{activeEvents[0].description}</p>
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-700/60 text-indigo-200 text-xs space-y-1">
                  <div className="font-bold flex items-center justify-between">
                    <span className="truncate max-w-[140px]">{upcomingEvents[0].event.title}</span>
                    <span className="font-mono text-emerald-400 text-[10px]">
                      อีก {upcomingEvents[0].quartersUntil * 3} เดือน
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{upcomingEvents[0].event.description}</p>
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs italic">
                  ไม่มีเหตุการณ์วิกฤติต่อเนื่องในไตรมาสนี้ น่านฟ้าสงบราบรื่น
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Board Meeting:</span>
                <button
                  onClick={() => {
                    setShowOperationsDrawer(false);
                    onOpenBoardMeeting();
                  }}
                  className="text-amber-300 font-bold hover:underline cursor-pointer"
                >
                  Consult Board →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN BOTTOM COMMAND BAR */}
      <div className="h-14 md:h-16 px-3 md:px-5 py-2 flex items-center justify-between gap-2 md:gap-3 overflow-x-auto select-none">
        {/* Left: Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          {/* Open Route */}
          <button
            onClick={onOpenRouteModal}
            className="flex items-center gap-1.5 md:gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white rounded-xl font-bold text-xs md:text-sm shadow-lg transition-all active:scale-95 border border-sky-400 cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 md:w-5 md:h-5 text-sky-100" />
            <span>Open Route</span>
          </button>

          {/* My Routes */}
          <button
            onClick={onOpenFleetModal}
            className="flex items-center gap-1.5 md:gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 hover:border-sky-400 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plane className="w-4 h-4 text-sky-400" />
            <span>My Routes</span>
          </button>

          {/* Fleet Status Badge (Placed right beside My Routes as requested!) */}
          <button
            onClick={() => setShowOperationsDrawer((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-sky-400 rounded-xl text-xs font-bold transition shadow cursor-pointer active:scale-95 whitespace-nowrap"
            title="Fleet Status: คลิกเพื่อเปิดดูรายละเอียดฝูงบิน"
          >
            <span className="text-slate-400 hidden xl:inline">Fleet:</span>
            <strong className="text-white font-mono text-xs md:text-sm font-black">
              {assignedPlanes}/{totalPlanes}
            </strong>
            {availablePlanes > 0 ? (
              <span className="text-emerald-400 font-bold text-[11px]">({availablePlanes} idle)</span>
            ) : (
              <span className="text-amber-400 font-bold text-[11px]">(0 idle)</span>
            )}
          </button>

          {/* Aircraft Market */}
          <button
            onClick={onOpenAircraftShop}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 hover:border-amber-400 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <ShoppingCart className="w-4 h-4 text-amber-400" />
            <span>Market</span>
          </button>

          {/* Airport Slots */}
          <button
            onClick={onOpenSlotModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 hover:border-emerald-400 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Handshake className="w-4 h-4 text-emerald-400" />
            <span>Slots</span>
          </button>

          {/* Hotels & Ventures */}
          <button
            onClick={onOpenBusinessModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 hover:border-indigo-400 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Ventures</span>
          </button>

          {/* Board Meeting */}
          <button
            onClick={onOpenBoardMeeting}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-700/80 to-amber-800/80 hover:from-amber-600 hover:to-amber-700 text-amber-100 rounded-xl font-bold text-xs md:text-sm shadow border border-amber-500/50 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Users className="w-4 h-4 text-amber-300" />
            <span>Board</span>
          </button>

          {/* Financials */}
          <button
            onClick={onOpenFinancialReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 hover:border-pink-400 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <BarChart3 className="w-4 h-4 text-pink-400" />
            <span>Financials</span>
          </button>
        </div>

        {/* Center / Gap Area: Live Operations Indicators (Relocated from Top Bar into the open space!) */}
        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          {/* Fuel Price Indicator */}
          <button
            onClick={() => setShowOperationsDrawer((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl border text-xs font-bold transition shadow cursor-pointer active:scale-95 whitespace-nowrap ${
              isFuelHigh
                ? 'bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse'
                : 'bg-slate-800/90 border-slate-700 hover:border-amber-400 text-slate-200'
            }`}
            title="Fuel Market Index: คลิกเพื่อเปิดดูรายงานเชื้อเพลิง"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400 hidden xl:inline">Fuel:</span>
            <strong className="font-mono text-xs md:text-sm text-white font-black">
              {fuelMultiplier.toFixed(1)}x
            </strong>
          </button>

          {/* Active Routes Count */}
          <button
            onClick={onOpenFleetModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl border bg-slate-800/90 border-slate-700 hover:border-indigo-400 text-slate-200 text-xs font-bold transition shadow cursor-pointer active:scale-95 whitespace-nowrap"
            title="Active Network Routes: คลิกเพื่อดูเส้นทางบินทั้งหมด"
          >
            <Globe2 className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400 hidden xl:inline">Routes:</span>
            <strong className="font-mono text-xs md:text-sm text-white font-black">
              {playerRoutes.length}
            </strong>
          </button>

          {/* Upcoming Event Radar Indicator */}
          {upcomingEvents.length > 0 && (
            <button
              onClick={() => setShowOperationsDrawer((prev) => !prev)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl border bg-purple-950/70 border-purple-500/70 hover:border-purple-300 text-purple-200 text-xs font-bold transition shadow cursor-pointer active:scale-95 whitespace-nowrap"
              title={`${upcomingEvents[0].event.title}: คลิกเพื่อเปิดดูเรดาร์เหตุการณ์โลก`}
            >
              <span className="text-sm">🔮</span>
              <span className="truncate max-w-[110px] xl:max-w-[150px]">
                {upcomingEvents[0].event.title}
              </span>
              <span className="text-emerald-400 font-mono text-[10px]">
                ({upcomingEvents[0].quartersUntil * 3}mo)
              </span>
            </button>
          )}

          {/* Interactive Operations HUD Toggle Button */}
          <button
            onClick={() => setShowOperationsDrawer((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl border text-xs font-black transition shadow cursor-pointer active:scale-95 whitespace-nowrap ${
              showOperationsDrawer
                ? 'bg-sky-600 text-white border-sky-300 ring-2 ring-sky-400/50'
                : 'bg-slate-800 text-sky-300 border-slate-700 hover:bg-slate-700 hover:border-sky-400'
            }`}
            title="เปิด/ปิด แถบสรุปข้อมูลด่วน (Operations HUD Drawer)"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden xl:inline">HUD</span>
            {showOperationsDrawer ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Right: Prominent End Quarter Button */}
        <div className="shrink-0 ml-auto pl-2">
          <button
            onClick={onAdvanceQuarter}
            className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs md:text-sm shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-95 border-2 border-emerald-400 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>End Quarter</span>
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-emerald-200 animate-pulse" />
          </button>
        </div>
      </div>
    </footer>
  );
};
