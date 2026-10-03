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
  Newspaper,
} from 'lucide-react';

import { useI18n } from '../utils/i18n';

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
  onOpenNews?: () => void;
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
  onOpenNews,
}) => {
  const { lang, t } = useI18n();
  const isTh = lang === 'th';
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
  const hasUnreadNews = gameState.turnNumber > (gameState.lastReadNewsTurn ?? 0);

  return (
    <footer className="w-full shrink-0 relative bg-slate-900 border-t border-slate-700/80 shadow-2xl z-20 select-none">
      {/* 1. SLIDE-UP OPERATIONS HUD DRAWER */}
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
                  {t.toolbar.hudTitle}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {t.toolbar.hudSubtitle}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowOperationsDrawer(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer shadow active:scale-95"
            >
              <span>{isTh ? 'พับเก็บ' : 'Hide'}</span>
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
                  <span className="font-black text-xs text-white uppercase tracking-wider">
                    {isTh ? 'โลจิสติกส์ฝูงบิน' : 'Fleet Logistics'}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono font-bold">
                  {totalPlanes} {isTh ? 'ลำรวม' : 'Total'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isTh ? 'ประจำเส้นทาง:' : 'Assigned Flights:'}</span>
                  <span className="font-bold text-white font-mono">{assignedPlanes} {isTh ? 'ลำ' : 'planes'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isTh ? 'พร้อมในโรงเก็บ:' : 'Ready in Hangars:'}</span>
                  <span className="font-bold text-emerald-400 font-mono">{availablePlanes} {isTh ? 'ลำว่าง' : 'idle planes'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isTh ? 'สภาพตัวเครื่องเฉลี่ย:' : 'Airframe Health:'}</span>
                  <span className="font-bold text-amber-300 font-mono">{avgCondition}% {isTh ? 'เฉลี่ย' : 'avg'}</span>
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
                  {isTh ? 'จัดการฝูงบิน' : 'Manage Fleet'}
                </button>
                <button
                  onClick={() => {
                    setShowOperationsDrawer(false);
                    onOpenAircraftShop();
                  }}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[11px] border border-slate-700 transition cursor-pointer"
                >
                  {isTh ? 'สั่งซื้อเครื่องบิน' : 'Buy Planes'}
                </button>
              </div>
            </div>

            {/* Panel 2: Fuel Market Pressure */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="font-black text-xs text-white uppercase tracking-wider">
                    {isTh ? 'ตลาดน้ำมัน' : 'Fuel Market'}
                  </span>
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
                  <span className="text-slate-400">{isTh ? 'ดัชนีราคา:' : 'Market Rate:'}</span>
                  <span className="font-bold text-white font-mono">
                    {fuelMultiplier <= 1.0
                      ? (isTh ? 'ปกติ / เสถียร (1.0x)' : 'Low / Stable (1.0x)')
                      : fuelMultiplier <= 1.3
                      ? (isTh ? 'สูงขึ้น (+10-30%)' : 'Elevated (+10-30%)')
                      : (isTh ? 'วิกฤตรุนแรง (เสี่ยงสูง)' : 'Severe Crisis (High Risk)')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isTh ? 'ผลกระทบค่าใช้จ่าย:' : 'Expense Impact:'}</span>
                  <span className={`font-bold font-mono ${isFuelHigh ? 'text-rose-400' : 'text-slate-300'}`}>
                    {isFuelHigh 
                      ? (isTh ? 'ภาระค่าน้ำมันพุ่งสูง' : 'High Fuel Surcharges')
                      : (isTh ? 'ต้นทุนดำเนินงานมาตรฐาน' : 'Standard Operating Cost')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isTh ? 'การบีบกำไร:' : 'Profit Squeeze:'}</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {fuelMultiplier > 1.0 
                      ? (isTh ? `กำไรลด -${Math.round((fuelMultiplier - 1.0) * 20)}%` : `-${Math.round((fuelMultiplier - 1.0) * 20)}% margin`) 
                      : (isTh ? 'ระดับเหมาะสม' : 'Optimal')}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 italic">
                {isTh ? '*รับมือวิกฤตน้ำมันได้ด้วยการเลือกใช้เครื่องบินยุคใหม่ที่ประหยัดพลังงาน' : '*Mitigate fuel crises by deploying modern, fuel-efficient aircraft'}
              </div>
            </div>

            {/* Panel 3: Route Network Performance */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-indigo-400" />
                  <span className="font-black text-xs text-white uppercase tracking-wider">
                    {isTh ? 'สุขภาพเครือข่าย' : 'Network Health'}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-bold">
                  {playerRoutes.length} {isTh ? 'เส้นทาง' : 'Routes'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isTh ? 'ศูนย์กลางภูมิภาค:' : 'Regional Hubs:'}</span>
                  <span className="font-bold text-sky-300 font-mono">
                    {(playerAirline.hubCityIds || []).length} {isTh ? 'ฮับที่เปิด' : 'Hubs Active'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isTh ? 'ผู้โดยสาร Q ก่อน:' : 'Last Q Passengers:'}</span>
                  <span className="font-bold text-white font-mono">{lastQuarterPax.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isTh ? 'กำไรสุทธิ Q ก่อน:' : 'Last Q Profit:'}</span>
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
                  {t.toolbar.quickOpenRoute}
                </button>
              </div>
            </div>

            {/* Panel 4: Global Events & Radar */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="font-black text-xs text-white uppercase tracking-wider">
                    {lang === 'th' ? 'เรดาร์โลก' : 'World Radar'}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold">
                  {upcomingEvents.length} {lang === 'th' ? 'เหตุการณ์' : 'Upcoming'}
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
                      {lang === 'th' ? `อีก ${upcomingEvents[0].quartersUntil * 3} เดือน` : `In ${upcomingEvents[0].quartersUntil * 3} mos`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{upcomingEvents[0].event.description}</p>
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs italic">
                  {t.toolbar.noActiveEvents}
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => {
                    setShowOperationsDrawer(false);
                    if (onOpenNews) onOpenNews();
                  }}
                  className="text-amber-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>{t.toolbar.readNews}</span>
                </button>
                <button
                  onClick={() => {
                    setShowOperationsDrawer(false);
                    onOpenBoardMeeting();
                  }}
                  className="text-slate-400 font-bold hover:text-white cursor-pointer"
                >
                  {t.toolbar.consultBoard}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN BOTTOM COMMAND BAR */}
      <div className="h-14 md:h-16 px-2 sm:px-4 py-1.5 md:py-2 flex items-center justify-between gap-2 select-none relative bg-slate-900 border-t border-slate-700/80">
        {/* Left: Primary Action Buttons (Smooth scrollable if screen is narrow, fits cleanly on standard displays) */}
        <div className="flex-1 flex items-center gap-1.5 md:gap-2 flex-nowrap overflow-x-auto no-scrollbar py-1 min-w-0">
          {/* Open Route */}
          <button
            onClick={onOpenRouteModal}
            className="flex items-center gap-1.5 md:gap-2 px-3 sm:px-3.5 py-1.5 md:py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white rounded-xl font-bold text-xs md:text-sm shadow-lg transition-all active:scale-95 border border-sky-400 cursor-pointer whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4 md:w-5 md:h-5 text-sky-100" />
            <span>{t.toolbar.openRoute}</span>
          </button>

          {/* My Routes */}
          <button
            onClick={onOpenFleetModal}
            data-testid="toolbar-my-routes-btn"
            className="flex items-center gap-1.5 md:gap-2 px-2.5 sm:px-3 py-1.5 md:py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 hover:border-sky-400 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plane className="w-4 h-4 text-sky-400" />
            <span>{t.toolbar.myRoutes}</span>
          </button>

          {/* Fleet Status Badge (Placed right beside My Routes as requested!) */}
          <button
            onClick={() => setShowOperationsDrawer((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 md:py-2 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-sky-400 rounded-xl text-xs font-bold transition shadow cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            title={lang === 'th' ? 'สถานะฝูงบิน: คลิกเพื่อดูรายละเอียด' : 'Fleet Status: Click to view details'}
          >
            <span className="text-slate-400 hidden xl:inline">{t.toolbar.fleet}:</span>
            <strong className="text-white font-mono text-xs md:text-sm font-black">
              {assignedPlanes}/{totalPlanes}
            </strong>
            {availablePlanes > 0 ? (
              <span className="text-emerald-400 font-bold text-[11px]">
                ({availablePlanes} {t.toolbar.idlePlanes})
              </span>
            ) : (
              <span className="text-amber-400 font-bold text-[11px]">
                (0 {t.toolbar.idlePlanes})
              </span>
            )}
          </button>

          {/* Aircraft Market */}
          <button
            onClick={onOpenAircraftShop}
            data-testid="toolbar-market-btn"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 md:py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 hover:border-amber-400 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShoppingCart className="w-4 h-4 text-amber-400" />
            <span>{t.toolbar.market}</span>
          </button>

          {/* Airport Slots */}
          <button
            onClick={onOpenSlotModal}
            data-testid="toolbar-slots-btn"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 md:py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 hover:border-emerald-400 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Handshake className="w-4 h-4 text-emerald-400" />
            <span>{t.toolbar.slots}</span>
          </button>

          {/* Hotels & Ventures */}
          <button
            onClick={onOpenBusinessModal}
            data-testid="toolbar-ventures-btn"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 md:py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 hover:border-indigo-400 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>{t.toolbar.ventures}</span>
          </button>

          {/* Board Meeting */}
          <button
            onClick={onOpenBoardMeeting}
            data-testid="toolbar-board-btn"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 md:py-2 bg-gradient-to-r from-amber-700/80 to-amber-800/80 hover:from-amber-600 hover:to-amber-700 text-amber-100 rounded-xl font-bold text-xs md:text-sm shadow border border-amber-500/50 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Users className="w-4 h-4 text-amber-300" />
            <span>{t.toolbar.board}</span>
          </button>

          {/* Financials */}
          <button
            onClick={onOpenFinancialReport}
            data-testid="toolbar-financials-btn"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 md:py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 hover:border-pink-400 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <BarChart3 className="w-4 h-4 text-pink-400" />
            <span>{t.toolbar.financials}</span>
          </button>

          {/* News Chronicle Button */}
          <button
            onClick={onOpenNews}
            data-testid="toolbar-news-btn"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 md:py-2 rounded-xl font-bold text-xs md:text-sm shadow transition-all active:scale-95 cursor-pointer whitespace-nowrap border shrink-0 ${
              hasUnreadNews
                ? 'bg-gradient-to-r from-amber-700 via-rose-700 to-amber-800 text-white border-amber-300 ring-2 ring-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600 hover:border-amber-400'
            }`}
            title={lang === 'th' ? 'ข่าวสารโลก & คลังเหตุการณ์' : 'Global News & Chronicle'}
          >
            <Newspaper className={`w-4 h-4 ${hasUnreadNews ? 'text-amber-200 animate-bounce' : 'text-amber-400'}`} />
            <span>{t.toolbar.news}</span>
            {hasUnreadNews && (
              <span
                data-testid="toolbar-news-unread-badge"
                className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono font-black animate-pulse"
              >
                ● {lang === 'th' ? 'ใหม่' : 'NEW'}
              </span>
            )}
          </button>

          {/* Interactive Operations HUD Toggle Button */}
          <button
            onClick={() => setShowOperationsDrawer((prev) => !prev)}
            data-testid="toolbar-hud-toggle-btn"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 md:py-2 rounded-xl border text-xs font-bold transition shadow cursor-pointer active:scale-95 whitespace-nowrap shrink-0 ${
              showOperationsDrawer
                ? 'bg-sky-600 text-white border-sky-300 ring-2 ring-sky-400/50'
                : 'bg-slate-800 text-sky-300 border-slate-700 hover:bg-slate-700 hover:border-sky-400'
            }`}
            title={lang === 'th' ? 'เปิด/ปิด แผงสรุปปฏิบัติการ HUD' : 'Toggle Operations HUD Drawer'}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{lang === 'th' ? 'HUD ข้อมูล' : 'HUD'}</span>
            {isFuelHigh && (
              <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" title="เตือน: น้ำมันแพง" />
            )}
            {upcomingEvents.length > 0 && (
              <span className="text-[11px]" title={`เหตุการณ์ใกล้เคียง: ${upcomingEvents[0].event.title}`}>🔮</span>
            )}
            {showOperationsDrawer ? (
              <ChevronDown className="w-3.5 h-3.5 text-sky-200" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
            )}
          </button>
        </div>

        {/* Right: Permanently Pinned End Quarter Button (Never cut off, never pushed out) */}
        <div className="shrink-0 flex items-center pl-2 sm:pl-3 bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent z-20">
          <button
            onClick={onAdvanceQuarter}
            data-testid="toolbar-end-quarter-btn"
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 md:py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs md:text-sm shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-95 border-2 border-emerald-400 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>{t.toolbar.endQuarter}</span>
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-emerald-200 animate-pulse" />
          </button>
        </div>
      </div>
    </footer>
  );
};
