import React, { useState } from 'react';
import { GameState, Airline, RegionId, Route } from '../types/game';
import { CITIES } from '../data/cities';
import {
  X,
  Award,
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  Plane,
  Trophy,
  Infinity,
  Handshake,
  BarChart3,
  Globe2,
  Newspaper,
  Flame,
  Users,
  ShoppingCart,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { NegotiatorAvatar } from './NegotiatorAvatar';
import { AIRCRAFTS } from '../data/aircrafts';

interface QuarterReportModalProps {
  gameState: GameState;
  playerAirline: Airline;
  onClose: () => void;
  onContinueSandbox?: () => void;
  onOpenAircraftShop?: () => void;
}

const REGION_LABELS: Record<RegionId, { name: string; icon: string }> = {
  EAST_SOUTHEAST_ASIA: { name: 'East & Southeast Asia', icon: '⛩️' },
  EUROPE: { name: 'Europe', icon: '🏰' },
  NORTH_AMERICA: { name: 'North America', icon: '🗽' },
  SOUTH_AMERICA: { name: 'South America', icon: '🏖️' },
  MIDDLE_EAST_SOUTH_ASIA: { name: 'Middle East & South Asia', icon: '🕌' },
  AFRICA: { name: 'African Continent', icon: '🦁' },
  OCEANIA: { name: 'Oceania & Pacific', icon: '🦘' },
};

export const QuarterReportModal: React.FC<QuarterReportModalProps> = ({
  gameState,
  playerAirline,
  onClose,
  onContinueSandbox,
  onOpenAircraftShop,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INSPECTOR' | 'NEWS'>('OVERVIEW');
  const [selectedAirlineId, setSelectedAirlineId] = useState<string>(playerAirline.id);

  const cityMap = new Map(CITIES.map((c) => [c.id, c]));
  const quarterNames = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];

  // 1. Calculate Human Player Totals
  const playerRoutes = gameState.routes.filter((r) => r.airlineId === playerAirline.id);
  let totalRevenueK = 0;
  let totalExpensesK = 0;
  let totalProfitK = 0;
  let totalPassengers = 0;

  playerRoutes.forEach((r) => {
    if (r.lastQuarterStats) {
      totalRevenueK += r.lastQuarterStats.revenueK;
      totalExpensesK += r.lastQuarterStats.expensesK;
      totalProfitK += r.lastQuarterStats.profitK;
      totalPassengers += r.lastQuarterStats.passengers;
    }
  });

  let totalDividendsK = 0;
  playerAirline.businesses.forEach((b) => {
    totalDividendsK += b.quarterlyDividendK;
  });
  totalProfitK += totalDividendsK;

  // Best & Worst Player Routes
  const sortedRoutes = [...playerRoutes].sort((a, b) => {
    const profitA = a.lastQuarterStats?.profitK || 0;
    const profitB = b.lastQuarterStats?.profitK || 0;
    return profitB - profitA;
  });
  const bestRoute = sortedRoutes[0];
  const worstRoute = sortedRoutes[sortedRoutes.length - 1];

  // 2. Standings & Ranks
  const standings = gameState.airlineStandings || [];
  const playerRank = standings.find((s) => s.isHuman)?.rank || 1;

  // Find max revenue across all airlines to scale the Koei comparison bars
  const maxRevenue = Math.max(
    10000,
    ...standings.map((s) => Math.max(s.quarterRevenueK, s.quarterExpensesK))
  );
  const maxPassengers = Math.max(
    1000,
    ...standings.map((s) => s.quarterPassengers)
  );

  const getUpcomingAircraftAdvisory = (plane: (typeof AIRCRAFTS)[0]): string => {
    if (plane.isSupersonic) {
      return 'Prestige Supersonic Flagship. Engineered for high-yield executive corridors (e.g. NYC - LON, TYO - LAX). Blazing Mach 2+ cruising speed enables faster turnaround rotations and commands lucrative premium business passenger fares.';
    }
    if (plane.rangeKm >= 10000 && plane.capacity >= 300) {
      return 'Heavy Intercontinental Workhorse. Unlocks nonstop transoceanic trunk routes across the Pacific and Atlantic. Massive passenger capacity provides supreme economies of scale to dominate congested global megahubs.';
    }
    if (plane.rangeKm >= 6000) {
      return 'Versatile Transcontinental Cruiser. Balanced operating costs and generous range make it the premier choice for linking major continental hubs and opening new intercontinental corridors.';
    }
    return 'High-Frequency Regional Workhorse. Superior fuel economy and low capital expenditure make it ideal for rapid regional network expansion and high-density domestic shuttle routes.';
  };

  // 3. Inspect Selected Airline Data
  const inspectedAirline =
    gameState.airlines.find((a) => a.id === selectedAirlineId) || playerAirline;
  const inspectedStanding = standings.find((s) => s.airlineId === inspectedAirline.id);
  const inspectedRoutes = gameState.routes.filter((r) => r.airlineId === inspectedAirline.id);

  // Group inspected airline's routes by Continent
  interface ContinentStat {
    region: RegionId;
    cities: Set<string>;
    routes: Route[];
    pax: number;
    revenueK: number;
    expensesK: number;
    profitK: number;
  }
  const continentMap = new Map<RegionId, ContinentStat>();

  inspectedRoutes.forEach((route) => {
    const orig = cityMap.get(route.originCityId);
    const dest = cityMap.get(route.destCityId);
    if (!orig || !dest) return;

    const regionsToCredit = Array.from(new Set([orig.region, dest.region]));
    regionsToCredit.forEach((reg) => {
      if (!continentMap.has(reg)) {
        continentMap.set(reg, {
          region: reg,
          cities: new Set<string>(),
          routes: [],
          pax: 0,
          revenueK: 0,
          expensesK: 0,
          profitK: 0,
        });
      }
      const stat = continentMap.get(reg)!;
      if (orig.region === reg) stat.cities.add(orig.id);
      if (dest.region === reg) stat.cities.add(dest.id);
      if (!stat.routes.includes(route)) {
        stat.routes.push(route);
        if (route.lastQuarterStats) {
          stat.pax += route.lastQuarterStats.passengers;
          stat.revenueK += route.lastQuarterStats.revenueK;
          stat.expensesK += route.lastQuarterStats.expensesK;
          stat.profitK += route.lastQuarterStats.profitK;
        }
      }
    });
  });

  const continentStats = Array.from(continentMap.values()).sort(
    (a, b) => b.revenueK - a.revenueK
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-2 md:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-slate-600 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-sky-300 flex items-center justify-center font-black text-white text-sm shadow">
              CEO
            </div>
            <div>
              <h2 className="text-base md:text-xl font-black text-slate-100 flex items-center gap-2">
                <span>Quarterly Board Meeting & Financial Review</span>
                {gameState.gameMode === 'SANDBOX_INFINITE' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400">
                    ♾️ SANDBOX
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400">
                    🏆 CAMPAIGN
                  </span>
                )}
              </h2>
              <div className="text-xs md:text-sm text-sky-300 font-bold">
                {gameState.currentYear} {quarterNames[gameState.currentQuarter - 1]} Briefing • Turn {gameState.turnNumber}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-700 bg-slate-950 px-6 overflow-x-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`py-3 px-4 md:px-6 text-xs md:text-sm font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'OVERVIEW'
                  ? 'border-sky-400 text-sky-400 bg-sky-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>Global Overview (ภาพรวมสายการบิน)</span>
            </button>
            <button
              onClick={() => setActiveTab('INSPECTOR')}
              className={`py-3 px-4 md:px-6 text-xs md:text-sm font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'INSPECTOR'
                  ? 'border-sky-400 text-sky-400 bg-sky-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe2 className="w-4 h-4 text-emerald-400" />
              <span>Airlines & Continents (เจาะลึกรายทวีป)</span>
            </button>
            <button
              onClick={() => setActiveTab('NEWS')}
              className={`py-3 px-4 md:px-6 text-xs md:text-sm font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer relative ${
                activeTab === 'NEWS'
                  ? 'border-sky-400 text-sky-400 bg-sky-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Newspaper className="w-4 h-4 text-amber-400" />
              <span>Aviation Bulletin & Sales (ข่าว & ส่วนลด)</span>
              {gameState.activeDiscountDeal && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-2.5 right-2" />
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-sky-500/50 shadow font-mono text-xs">
            <span className="text-slate-400">Industry Rank:</span>
            <span className="font-black text-amber-300">
              {playerRank === 1 ? '🥇 1st' : playerRank === 2 ? '🥈 2nd' : playerRank === 3 ? '🥉 3rd' : '4th'}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-5 text-sm md:text-base flex-1 min-h-0">
          {/* 1. CAMPAIGN VICTORY SCREEN (At Turn 80) */}
          {gameState.isGameOver && (
            <div className="p-5 bg-gradient-to-br from-amber-950 via-slate-900 to-indigo-950 border-2 border-amber-400 rounded-3xl shadow-2xl text-center">
              <div className="text-4xl mb-2 animate-bounce">🏆</div>
              <h2 className="text-xl md:text-2xl font-black text-amber-300 font-mono tracking-wider">
                20-YEAR CAMPAIGN COMPLETE!
              </h2>
              <p className="text-xs md:text-sm text-slate-200 mt-1.5 max-w-xl mx-auto leading-relaxed">
                {gameState.victoryReason}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {onContinueSandbox && (
                  <button
                    onClick={onContinueSandbox}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-sky-600 to-blue-700 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl font-black text-xs md:text-sm shadow-xl border-2 border-sky-400 cursor-pointer flex items-center gap-2"
                  >
                    <Infinity className="w-4 h-4 text-indigo-200" />
                    <span>Continue Playing in Infinite Sandbox Mode</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Global Crises & World Events Flash Alert */}
          {gameState.activeEvents.length > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-amber-950/90 via-slate-900 to-rose-950/90 border-2 border-amber-500 rounded-2xl shadow-xl flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl">
                  {gameState.activeEvents[0].type === 'WAR'
                    ? '⚔️'
                    : gameState.activeEvents[0].type === 'OIL_CRISIS'
                    ? '🛢️'
                    : gameState.activeEvents[0].type === 'EPIDEMIC'
                    ? '☣️'
                    : '🏆'}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black uppercase font-mono">
                      WORLD BREAKING NEWS
                    </span>
                    <span className="font-black text-amber-200 text-sm">
                      {gameState.activeEvents[0].title}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5 truncate max-w-xl">
                    {gameState.activeEvents[0].description}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('NEWS')}
                className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-lg text-xs font-bold font-mono transition cursor-pointer shrink-0"
              >
                View News Bulletin ➔
              </button>
            </div>
          )}

          {/* Recent Airport Expansions Flash */}
          {gameState.airportExpansions && gameState.airportExpansions.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border border-emerald-500/80 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏗️</span>
                <div>
                  <span className="font-bold text-emerald-300 uppercase font-mono text-[10px] mr-1.5">
                    AIRPORT INFRASTRUCTURE ALERT:
                  </span>
                  <span className="text-slate-200">
                    {gameState.airportExpansions.map((e) => `${e.cityName} (+${e.addedSlots})`).join(', ')} expanded runway capacity!
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('NEWS')}
                className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded-lg text-[11px] font-bold font-mono hover:bg-emerald-500/30 transition cursor-pointer shrink-0"
              >
                Details ➔
              </button>
            </div>
          )}

          {/* 2. Executive Assistant Dialogue Box */}
          <div className="flex gap-4 p-4 bg-slate-950 border-2 border-slate-800 rounded-2xl shadow-inner items-start">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-2xl shrink-0 border-2 border-indigo-400 shadow-md">
              👩‍💼
            </div>
            <div>
              <div className="font-black text-sky-400 text-xs md:text-sm mb-1">
                Executive Assistant to President:
              </div>
              <p className="text-slate-100 text-xs md:text-sm leading-relaxed">
                {totalProfitK >= 0 ? (
                  <>
                    "Excellent quarter, Chief Executive! Our commercial flight operations generated{' '}
                    <span className="font-black text-emerald-400 font-mono text-sm md:text-base">
                      +${totalProfitK.toLocaleString()}K
                    </span>{' '}
                    in net profit, carrying{' '}
                    <span className="font-black text-sky-300 font-mono text-sm md:text-base">
                      {totalPassengers.toLocaleString()}
                    </span>{' '}
                    passengers across our network."
                  </>
                ) : (
                  <>
                    "Attention, CEO! Our quarterly operations ended with a loss of{' '}
                    <span className="font-black text-rose-400 font-mono text-sm md:text-base">
                      -${Math.abs(totalProfitK).toLocaleString()}K
                    </span>
                    . We should review unprofitable routes, adjust fares, or retire fuel-heavy aircraft."
                  </>
                )}
              </p>
            </div>
          </div>

          {/* TAB 1: GLOBAL OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              {/* 1-YEAR ADVANCE NOTICE EXECUTIVE ALERT BANNER */}
              {gameState.upcomingAircraft && gameState.upcomingAircraft.length > 0 && (
                <div
                  onClick={() => setActiveTab('NEWS')}
                  className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 border-2 border-cyan-400 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-cyan-300 transition group select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow group-hover:scale-105 transition shrink-0">
                      <Plane className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400 uppercase tracking-wide">
                          📢 1-Year Advance Notice ({gameState.currentYear + 1})
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                          Aerospace Confidential Intelligence
                        </span>
                      </div>
                      <div className="text-white font-black text-sm md:text-base mt-0.5">
                        {gameState.upcomingAircraft.map((p) => p.model).join(', ')} entering commercial airline service next year!
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-400 font-black text-xs md:text-sm shrink-0 font-mono bg-cyan-950/80 px-3.5 py-1.5 rounded-xl border border-cyan-500/40 group-hover:bg-cyan-900/60 transition self-end sm:self-auto">
                    <span>Inspect Blueprint Schematics</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              )}

              {/* 1-YEAR RETIRING AIRCRAFT ADVANCE NOTICE EXECUTIVE ALERT BANNER */}
              {gameState.retiringAircraft && gameState.retiringAircraft.length > 0 && (
                <div
                  onClick={() => setActiveTab('NEWS')}
                  className="p-4 bg-gradient-to-r from-amber-950/90 via-slate-900 to-rose-950/90 border-2 border-amber-400 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-amber-300 transition group select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shadow group-hover:scale-105 transition shrink-0">
                      <AlertTriangle className="w-6 h-6 animate-pulse text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-amber-500/20 text-amber-300 border border-amber-400 uppercase tracking-wide">
                          ⚠️ 1-Year Advance Notice: Factory Line Retirement ({gameState.currentYear + 1})
                        </span>
                        <span className="text-[11px] text-amber-200/80 font-mono hidden md:inline">
                          Assembly Line Shutdown
                        </span>
                      </div>
                      <div className="text-white font-black text-sm md:text-base mt-0.5">
                        {gameState.retiringAircraft.map((p) => p.model).join(', ')} ceasing factory production at end of next year!
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-300 font-black text-xs md:text-sm shrink-0 font-mono bg-amber-950/80 px-3.5 py-1.5 rounded-xl border border-amber-500/40 group-hover:bg-amber-900/60 transition self-end sm:self-auto">
                    <span>Inspect Retirement Briefing</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              )}

              {/* ROUTE DISRUPTIONS ALERT BANNER (If Player Was Impacted) */}
              {gameState.routeIncidents &&
                gameState.routeIncidents.some((i) => i.airlineId === playerAirline.id) && (
                  <div
                    onClick={() => setActiveTab('NEWS')}
                    className="p-3 bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 border-2 border-rose-500/80 rounded-2xl shadow-lg flex items-center justify-between gap-3 cursor-pointer hover:border-rose-400 transition group select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-300 shadow">
                        <AlertCircle className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="font-black text-rose-300 text-xs md:text-sm font-mono flex items-center gap-2">
                          <span>⚠️ OPERATIONAL FLIGHT DISRUPTIONS DETECTED</span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-rose-500/30 text-rose-200 border border-rose-400">
                            {gameState.routeIncidents.filter((i) => i.airlineId === playerAirline.id).length} Your Route(s) Impacted
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 line-clamp-1 font-sans">
                          Severe seasonal weather or aging airframe mechanical issues grounded scheduled flights and incurred emergency passenger/repair costs.
                        </div>
                      </div>
                    </div>
                    <div className="text-rose-300 font-mono font-bold text-xs shrink-0 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                      <span>View Log</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}

              {/* ACTIVE DISCOUNT FLASH PROMOTION ALERT */}
              {gameState.activeDiscountDeal && (
                <div
                  onClick={() => setActiveTab('NEWS')}
                  className="p-3.5 bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 border-2 border-amber-400/90 rounded-2xl shadow-lg flex items-center justify-between gap-3 cursor-pointer hover:border-amber-300 transition group select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shadow">
                      <Flame className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="font-black text-amber-300 text-xs md:text-sm font-mono flex items-center gap-2">
                        <span>
                          {gameState.activeDiscountDeal.specificModelId
                            ? `🔥 ${gameState.activeDiscountDeal.discountPct}% OFF CLEARANCE: ${gameState.activeDiscountDeal.modelName || gameState.activeDiscountDeal.specificModelId}`
                            : `🔥 ${gameState.activeDiscountDeal.discountPct}% OFF FACTORY PROMOTION: ${gameState.activeDiscountDeal.manufacturer.toUpperCase()}`}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-100/80 line-clamp-1">
                        {gameState.activeDiscountDeal.reason}
                      </div>
                    </div>
                  </div>
                  <div className="text-amber-300 font-mono font-bold text-xs shrink-0 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    <span>View Deal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}

              {/* MODERNIZED MULTI-AIRLINE COMPARATIVE PERFORMANCE BENCHMARK */}
              <div className="bg-slate-950/95 border-2 border-slate-700/80 rounded-2xl p-4 md:p-5 shadow-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-500/20 border border-sky-400/50 text-sky-400">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wider font-mono">
                        Quarterly Multi-Airline Financial & Traffic Benchmark
                      </h3>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Comparative Analysis: Operating Cost vs Gross Revenue & Passenger Volume
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-slate-300">Expenses</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-slate-300">Revenue</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                      <span className="text-slate-300">Traffic</span>
                    </div>
                  </div>
                </div>

                {/* Comparative Rows for 4 Airlines */}
                <div className="space-y-3">
                  {standings.map((st) => {
                    const hqCity = cityMap.get(st.homeCityId);
                    const isPlayer = st.isHuman;
                    const connectedCitiesCount = new Set(
                      gameState.routes
                        .filter((r) => r.airlineId === st.airlineId)
                        .flatMap((r) => [r.originCityId, r.destCityId])
                    ).size;

                    const revPct = Math.min(100, Math.round((st.quarterRevenueK / maxRevenue) * 100));
                    const expPct = Math.min(100, Math.round((st.quarterExpensesK / maxRevenue) * 100));
                    const paxPct = Math.min(100, Math.round((st.quarterPassengers / maxPassengers) * 100));
                    const marginPct =
                      st.quarterRevenueK > 0
                        ? Math.round((st.quarterProfitK / st.quarterRevenueK) * 100)
                        : 0;

                    return (
                      <div
                        key={st.airlineId}
                        className={`p-3 md:p-3.5 rounded-2xl border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 ${
                          isPlayer
                            ? 'bg-sky-950/40 border-2 border-sky-400/90 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Left: Rank & Airline Info */}
                        <div className="w-full lg:w-56 shrink-0 flex items-center justify-between lg:justify-start gap-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs font-mono shadow ${
                                st.rank === 1
                                  ? 'bg-amber-500 text-slate-950'
                                  : st.rank === 2
                                  ? 'bg-slate-300 text-slate-900'
                                  : st.rank === 3
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {st.rank}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow"
                                  style={{ backgroundColor: st.airlineColor }}
                                />
                                <span className="font-black text-white text-xs md:text-sm truncate max-w-[130px]">
                                  {st.airlineName}
                                </span>
                                {isPlayer && (
                                  <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-mono font-black border border-sky-400">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                HQ: {hqCity?.name || st.homeCityId} • {connectedCitiesCount} Hubs
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Center: Modern Sleek Visual Progress Bars */}
                        <div className="flex-1 w-full min-w-0 space-y-1.5 font-mono">
                          {/* Operating Expenses Bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-rose-400 font-bold w-8 shrink-0 text-right">COST</span>
                            <div className="flex-1 bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
                              <div
                                className="bg-gradient-to-r from-rose-600 via-rose-500 to-red-500 h-full rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${expPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-rose-300 font-semibold w-20 text-right">
                              -${st.quarterExpensesK.toLocaleString()}K
                            </span>
                          </div>

                          {/* Gross Revenue Bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-400 font-bold w-8 shrink-0 text-right">REV</span>
                            <div className="flex-1 bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
                              <div
                                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${revPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-emerald-300 font-semibold w-20 text-right">
                              +${st.quarterRevenueK.toLocaleString()}K
                            </span>
                          </div>

                          {/* Passenger Traffic Bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-sky-400 font-bold w-8 shrink-0 text-right flex items-center justify-end gap-0.5">
                              <Users className="w-2.5 h-2.5 inline" />
                            </span>
                            <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
                              <div
                                className="bg-gradient-to-r from-sky-500 via-blue-400 to-indigo-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${paxPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-sky-300 font-semibold w-20 text-right">
                              {st.quarterPassengers.toLocaleString()} pax
                            </span>
                          </div>
                        </div>

                        {/* Right: Modern Net Profit Badge */}
                        <div className="w-full lg:w-40 text-right shrink-0 flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-1 font-mono">
                          <span className="text-[10px] text-slate-400">NET RESULT</span>
                          <div
                            className={`px-3 py-1 rounded-xl border text-right ${
                              st.quarterProfitK >= 0
                                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                                : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                            }`}
                          >
                            <span className="font-black text-xs md:text-sm block">
                              {st.quarterProfitK >= 0
                                ? `+$${st.quarterProfitK.toLocaleString()}K`
                                : `-$${Math.abs(st.quarterProfitK).toLocaleString()}K`}
                            </span>
                            <span className="text-[9px] opacity-80 block">
                              {st.quarterProfitK >= 0 ? `Margin: +${marginPct}%` : 'Operating Deficit'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GLOBAL AIRLINE STANDINGS TABLE */}
              <div className="bg-slate-950/90 border-2 border-slate-700/80 rounded-2xl p-4 md:p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="font-black text-white text-sm md:text-base font-mono">
                      Global Airline Standings & Valuation
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Valuation = Cash + 70% Fleet + Subsidiaries
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                        <th className="py-2 px-2.5">Rank</th>
                        <th className="py-2 px-2.5">Airline & CEO</th>
                        <th className="py-2 px-2.5">HQ Hub</th>
                        <th className="py-2 px-2.5 text-right">Empire Valuation</th>
                        <th className="py-2 px-2.5 text-right">Quarter Profit</th>
                        <th className="py-2 px-2.5 text-right">Passengers</th>
                        <th className="py-2 px-2.5 text-center">Routes/Fleet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {standings.map((st) => {
                        const isPlayer = st.isHuman;
                        const hqCity = cityMap.get(st.homeCityId);
                        const rankMedal =
                          st.rank === 1
                            ? '🥇 1st'
                            : st.rank === 2
                            ? '🥈 2nd'
                            : st.rank === 3
                            ? '🥉 3rd'
                            : '🎖️ 4th';

                        return (
                          <tr
                            key={st.airlineId}
                            onClick={() => {
                              setSelectedAirlineId(st.airlineId);
                              setActiveTab('INSPECTOR');
                            }}
                            className={`transition-colors cursor-pointer ${
                              isPlayer
                                ? 'bg-sky-950/40 border-l-4 border-l-sky-400 font-semibold'
                                : 'hover:bg-slate-900/60'
                            }`}
                          >
                            <td className="py-2 px-2.5 font-mono font-black text-xs whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                                  st.rank === 1
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : st.rank === 2
                                    ? 'bg-slate-400/20 text-slate-200 border border-slate-400/40'
                                    : st.rank === 3
                                    ? 'bg-amber-700/20 text-amber-400 border border-amber-700/40'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {rankMedal}
                              </span>
                            </td>

                            <td className="py-2 px-2.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full shrink-0 shadow"
                                  style={{ backgroundColor: st.airlineColor }}
                                />
                                <div>
                                  <div className="font-black text-white text-xs md:text-sm flex items-center gap-1.5">
                                    <span>{st.airlineName}</span>
                                    {isPlayer && (
                                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400 font-black">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                                    CEO: {st.ceoName || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-2 px-2.5 whitespace-nowrap">
                              <span className="font-bold text-slate-200 text-xs">
                                {hqCity?.name || st.homeCityId}
                              </span>
                              <span className="text-slate-400 text-[10px] font-mono block">
                                {hqCity?.country}
                              </span>
                            </td>

                            <td className="py-2 px-2.5 text-right whitespace-nowrap font-mono">
                              <span className="font-black text-xs md:text-sm text-amber-300">
                                ${st.totalValuationK.toLocaleString()}K
                              </span>
                              <span className="text-[10px] text-slate-400 block font-sans">
                                Cash: ${st.cashK.toLocaleString()}K
                              </span>
                            </td>

                            <td className="py-2 px-2.5 text-right whitespace-nowrap font-mono">
                              <span
                                className={`font-black text-xs md:text-sm ${
                                  st.quarterProfitK >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {st.quarterProfitK >= 0
                                  ? `+$${st.quarterProfitK.toLocaleString()}K`
                                  : `-$${Math.abs(st.quarterProfitK).toLocaleString()}K`}
                              </span>
                            </td>

                            <td className="py-2 px-2.5 text-right whitespace-nowrap font-mono">
                              <span className="text-slate-200 font-bold text-xs">
                                {st.quarterPassengers.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-500 block font-sans">pax/qtr</span>
                            </td>

                            <td className="py-2 px-2.5 text-center whitespace-nowrap font-mono">
                              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
                                {st.activeRoutesCount} routes • {st.fleetCount} planes
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FINANCIAL BALANCE SHEET SUMMARY (HUMAN PLAYER) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-800/90 p-4 rounded-2xl border-2 border-slate-700 text-center shadow">
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
                  <div className="text-[11px] text-slate-400 mb-0.5">Flight Revenue</div>
                  <div className="font-black text-emerald-400 font-mono text-sm md:text-base">
                    +${totalRevenueK.toLocaleString()}K
                  </div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
                  <div className="text-[11px] text-slate-400 mb-0.5">Operating Cost</div>
                  <div className="font-black text-rose-400 font-mono text-sm md:text-base">
                    -${totalExpensesK.toLocaleString()}K
                  </div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
                  <div className="text-[11px] text-slate-400 mb-0.5">Ventures Dividend</div>
                  <div className="font-black text-indigo-300 font-mono text-sm md:text-base">
                    +${totalDividendsK.toLocaleString()}K
                  </div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
                  <div className="text-[11px] text-slate-400 mb-0.5">Net Profit</div>
                  <div
                    className={`font-black font-mono text-base md:text-lg ${
                      totalProfitK >= 0 ? 'text-emerald-300' : 'text-rose-400'
                    }`}
                  >
                    {totalProfitK >= 0
                      ? `+$${totalProfitK.toLocaleString()}K`
                      : `-$${Math.abs(totalProfitK).toLocaleString()}K`}
                  </div>
                </div>
              </div>

              {/* Best and Worst Routes */}
              {playerRoutes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bestRoute && bestRoute.lastQuarterStats && (
                    <div className="bg-emerald-950/40 border border-emerald-500/60 p-3.5 rounded-xl shadow">
                      <div className="flex items-center gap-2 font-black text-emerald-300 text-xs mb-1">
                        <Award className="w-4 h-4 text-emerald-400" />
                        <span>Best Performing Route</span>
                      </div>
                      <div className="text-white font-bold text-sm">
                        {cityMap.get(bestRoute.originCityId)?.name} ➔{' '}
                        {cityMap.get(bestRoute.destCityId)?.name}
                      </div>
                      <div className="text-xs text-slate-300 mt-1 font-mono">
                        Pax: {bestRoute.lastQuarterStats.passengers.toLocaleString()} | Profit:{' '}
                        <span className="font-black text-emerald-400">
                          +${bestRoute.lastQuarterStats.profitK.toLocaleString()}K
                        </span>
                      </div>
                    </div>
                  )}

                  {worstRoute && worstRoute.lastQuarterStats && (
                    <div className="bg-rose-950/40 border border-rose-500/60 p-3.5 rounded-xl shadow">
                      <div className="flex items-center gap-2 font-black text-rose-300 text-xs mb-1">
                        <TrendingDown className="w-4 h-4 text-rose-400" />
                        <span>Lowest Margin Route</span>
                      </div>
                      <div className="text-white font-bold text-sm">
                        {cityMap.get(worstRoute.originCityId)?.name} ➔{' '}
                        {cityMap.get(worstRoute.destCityId)?.name}
                      </div>
                      <div className="text-xs text-slate-300 mt-1 font-mono">
                        Pax: {worstRoute.lastQuarterStats.passengers.toLocaleString()} | Result:{' '}
                        <span
                          className={`font-black ${
                            worstRoute.lastQuarterStats.profitK >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ${worstRoute.lastQuarterStats.profitK.toLocaleString()}K
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AIRLINE INSPECTOR & CONTINENTAL BREAKDOWN */}
          {activeTab === 'INSPECTOR' && (
            <div className="space-y-4">
              {/* Airline Selector Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {gameState.airlines.map((a) => {
                  const isSelected = selectedAirlineId === a.id;
                  const isPlayer = a.isHuman;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAirlineId(a.id)}
                      className={`px-3 py-2 rounded-xl text-xs md:text-sm font-bold font-mono transition flex items-center gap-2 cursor-pointer whitespace-nowrap border ${
                        isSelected
                          ? 'bg-slate-800 text-white shadow-lg border-2'
                          : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                      }`}
                      style={{
                        borderColor: isSelected ? a.color : undefined,
                      }}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                      <span>{a.name}</span>
                      {isPlayer && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-400">
                          YOU
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Inspected Airline Dossier Banner */}
              <div
                className="p-4 rounded-2xl border-2 bg-slate-950/90 shadow-xl flex flex-wrap items-center justify-between gap-4"
                style={{ borderColor: `${inspectedAirline.color}88` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow"
                    style={{ backgroundColor: inspectedAirline.color }}
                  >
                    ✈️
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                      <span>{inspectedAirline.name}</span>
                      <span className="text-xs font-mono text-slate-400">
                        (HQ: {cityMap.get(inspectedAirline.homeCityId)?.name})
                      </span>
                    </h3>
                    <div className="text-xs text-slate-300 font-mono">
                      <span>CEO: {inspectedAirline.ceoName || 'Unknown'}</span>
                      {inspectedAirline.personality && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 text-[10px]">
                          {inspectedAirline.personality}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right font-mono text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">CASH RESERVES</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      ${inspectedAirline.cashK.toLocaleString()}K
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">FLEET SIZE</span>
                    <span className="text-sky-300 font-bold text-sm">
                      {inspectedAirline.fleet.length} Aircraft
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ACTIVE ROUTES</span>
                    <span className="text-amber-300 font-bold text-sm">
                      {inspectedRoutes.length} Corridors
                    </span>
                  </div>
                </div>
              </div>

              {/* CONTINENTAL PERFORMANCE BREAKDOWN (แยกผลประกอบการตามทวีป) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <h4 className="font-black text-white text-sm md:text-base font-mono flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-sky-400" />
                    <span>Continental Network Breakdown (ผลประกอบการแยกตามทวีป):</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    {continentStats.length} Operating Continent(s)
                  </span>
                </div>

                {continentStats.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-mono bg-slate-950/60 rounded-xl border border-slate-800">
                    No active commercial routes recorded in any continent this quarter.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {continentStats.map((stat) => {
                      const regInfo = REGION_LABELS[stat.region] || { name: stat.region, icon: '🌐' };
                      return (
                        <div
                          key={stat.region}
                          className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl shadow space-y-2.5 font-mono"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{regInfo.icon}</span>
                              <span className="font-black text-white text-sm font-sans">{regInfo.name}</span>
                            </div>
                            <span className="text-xs text-sky-400 font-bold">
                              {stat.cities.size} Cities • {stat.routes.length} Routes
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="bg-slate-900 p-2 rounded-lg">
                              <span className="text-[10px] text-slate-400 block">Passengers</span>
                              <span className="font-bold text-slate-200">
                                {stat.pax.toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-slate-900 p-2 rounded-lg">
                              <span className="text-[10px] text-slate-400 block">Revenue</span>
                              <span className="font-bold text-emerald-400">
                                +${stat.revenueK.toLocaleString()}K
                              </span>
                            </div>
                            <div className="bg-slate-900 p-2 rounded-lg">
                              <span className="text-[10px] text-slate-400 block">Net Profit</span>
                              <span
                                className={`font-bold ${
                                  stat.profitK >= 0 ? 'text-emerald-300' : 'text-rose-400'
                                }`}
                              >
                                {stat.profitK >= 0
                                  ? `+$${stat.profitK.toLocaleString()}K`
                                  : `-$${Math.abs(stat.profitK).toLocaleString()}K`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* QUARTERLY ACTIVITY & BUSINESS ACTIONS LOG */}
              <div className="space-y-2 bg-slate-950/90 border border-slate-800 p-4 rounded-xl">
                <h4 className="font-black text-sky-300 text-xs md:text-sm font-mono uppercase flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>Strategic Operations & Decisions Recorded This Quarter:</span>
                </h4>
                {inspectedAirline.aiActionLog && inspectedAirline.aiActionLog.length > 0 ? (
                  <ul className="space-y-1.5 text-xs font-mono text-slate-200">
                    {inspectedAirline.aiActionLog.map((act, idx) => (
                      <li
                        key={idx}
                        className={`p-2 rounded-lg flex items-center gap-2 ${
                          act.includes('Terminated') || act.includes('Closed')
                            ? 'bg-rose-950/40 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-900/80 text-slate-200 border border-slate-800'
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-400 font-mono py-2">
                    Standard route operations maintained throughout the quarter without major fleet alterations.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AVIATION BULLETIN, UPCOMING AIRCRAFT & FLASH SALES */}
          {activeTab === 'NEWS' && (
            <div className="space-y-4">
              {/* 1. ACTIVE MANUFACTURER FLASH DISCOUNT SALE */}
              {gameState.activeDiscountDeal && (
                <div className="p-5 bg-gradient-to-r from-amber-950 via-rose-950 to-orange-950 border-2 border-amber-400 rounded-2xl shadow-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/40 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-md">
                        <Flame className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-amber-500/30 text-amber-200 border border-amber-400 uppercase">
                            {gameState.activeDiscountDeal.specificModelId ? 'AIRFRAME CLEARANCE' : 'FACTORY REBATE'}
                          </span>
                          <span className="text-xs text-amber-300 font-mono font-bold">
                            // LIMITED TIME OFFER (1 QUARTER ONLY)
                          </span>
                        </div>
                        <h3 className="font-black text-amber-300 text-base md:text-lg font-mono mt-0.5">
                          {gameState.activeDiscountDeal.specificModelId
                            ? `🔥 ${gameState.activeDiscountDeal.discountPct}% OFF CLEARANCE ON ${gameState.activeDiscountDeal.modelName || gameState.activeDiscountDeal.specificModelId}!`
                            : `🔥 SPECIAL PROMOTION: ${gameState.activeDiscountDeal.discountPct}% OFF ${gameState.activeDiscountDeal.manufacturer.toUpperCase()} AIRCRAFT!`}
                        </h3>
                        <p className="text-xs text-amber-100 font-sans mt-0.5">
                          {gameState.activeDiscountDeal.reason}
                        </p>
                      </div>
                    </div>

                    {onOpenAircraftShop && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenAircraftShop();
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-xl flex items-center gap-2 cursor-pointer transition active:scale-95"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Procure Discounted Aircraft</span>
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-amber-200/90 font-mono">
                    All global airlines are eligible for this promotional discount during the current quarter. AI competitors with available funds are actively placing orders!
                  </div>
                </div>
              )}

              {/* 2. RETIRING AIRCRAFT 1-YEAR NOTICE SHOWCASE */}
              {gameState.retiringAircraft && gameState.retiringAircraft.length > 0 && (
                <div className="p-5 bg-gradient-to-br from-slate-950 via-amber-950/40 to-slate-950 border-2 border-amber-400/90 rounded-2xl shadow-2xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/40 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 shadow">
                        <AlertTriangle className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-amber-500/20 text-amber-300 border border-amber-400 uppercase tracking-wider">
                            AEROSPACE FACTORY NOTICE
                          </span>
                          <span className="text-xs text-amber-300 font-mono font-bold">
                            // 1-YEAR NOTICE: ASSEMBLY LINE SHUTDOWN
                          </span>
                        </div>
                        <h3 className="font-black text-white text-base md:text-lg font-mono mt-0.5">
                          Aircraft Models Ceasing Factory Production After Year {gameState.currentYear + 1}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-amber-300 bg-amber-950/80 px-3 py-1 rounded-lg border border-amber-500/50">
                        Final Deliveries: Year {gameState.currentYear + 1}
                      </span>
                      {onOpenAircraftShop && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenAircraftShop();
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer transition active:scale-95 font-mono"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Procure Final Airframes</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gameState.retiringAircraft.map((plane) => (
                      <div
                        key={plane.id}
                        className="p-4 bg-slate-900/95 border-2 border-amber-500/50 hover:border-amber-400 rounded-xl space-y-3.5 shadow-xl transition-all relative overflow-hidden group"
                      >
                        <div className="flex items-start justify-between gap-2 relative z-10">
                          <div>
                            <div className="font-black text-white text-base md:text-lg flex items-center gap-2">
                              <span>{plane.model}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500">
                                FINAL RUN
                              </span>
                            </div>
                            <div className="text-xs text-amber-300 font-mono mt-0.5">
                              {plane.manufacturer} • Lifespan: {plane.introYear} – {plane.retireYear} ({plane.retireYear ? plane.retireYear - plane.introYear : 0} Years in Production)
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400 font-black shrink-0">
                            RETIRES {plane.retireYear}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs font-mono relative z-10">
                          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">CAPACITY</span>
                            <span className="font-black text-white text-sm">{plane.capacity} Pax</span>
                          </div>
                          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">MAX RANGE</span>
                            <span className="font-black text-sky-300 text-sm">{plane.rangeKm.toLocaleString()} km</span>
                          </div>
                          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">CATALOG PRICE</span>
                            <span className="font-black text-emerald-400 text-sm">${plane.priceK.toLocaleString()}K</span>
                          </div>
                        </div>

                        <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl relative z-10">
                          <div className="font-black text-amber-300 text-xs flex items-center gap-1.5 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Fleet Manager Strategic Advisory:</span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-sans">
                            Tooling and assembly lines for the {plane.model} will permanently decommission after {plane.retireYear}. In-service airframes remain fully operational and spare parts will continue to be supplied. However, as airframes age past 15-20 years, maintenance costs rise significantly (+35% to +110%) and mechanical failure probabilities increase. Order final factory-fresh airframes now or prepare fleet renewal plans.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NEWLY RETIRED AIRCRAFT NOTICE */}
              {gameState.retiredAircraft && gameState.retiredAircraft.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-slate-950 via-rose-950/40 to-slate-950 border-2 border-rose-500/70 rounded-2xl shadow-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-black text-sm md:text-base font-mono">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span>🏁 FACTORY PRODUCTION CEASED // AIRCRAFT MODELS PERMANENTLY RETIRED</span>
                  </div>
                  <div className="space-y-2">
                    {gameState.retiredAircraft.map((plane) => (
                      <div
                        key={plane.id}
                        className="p-3 bg-slate-900 border border-rose-800/50 rounded-xl flex items-center justify-between gap-3 text-xs font-mono"
                      >
                        <div>
                          <div className="font-bold text-white text-sm">
                            {plane.model} ({plane.manufacturer})
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            Production concluded ({plane.introYear} – {plane.retireYear}). Airframe removed from commercial catalog. Existing fleet units continue normal flight operations.
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-700/60 font-black text-[10px] shrink-0">
                          OFFICIALLY RETIRED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. ADVANCE 1-YEAR AIRCRAFT IN-DEVELOPMENT PREVIEW */}
              {gameState.upcomingAircraft && gameState.upcomingAircraft.length > 0 && (
                <div className="p-5 bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-950 border-2 border-cyan-400/90 rounded-2xl shadow-2xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/40 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow">
                        <Plane className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400 uppercase tracking-wider">
                            CONFIDENTIAL INTELLIGENCE
                          </span>
                          <span className="text-xs text-cyan-300 font-mono font-bold">
                            // 1-YEAR ADVANCE ROLLOUT NOTICE
                          </span>
                        </div>
                        <h3 className="font-black text-white text-base md:text-lg font-mono mt-0.5">
                          New Commercial Aircraft Entering Service Next Year ({gameState.currentYear + 1})
                        </h3>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-lg border border-cyan-500/50">
                      Maiden Delivery: Year {gameState.currentYear + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gameState.upcomingAircraft.map((plane) => (
                      <div
                        key={plane.id}
                        className="p-4 bg-slate-900/95 border-2 border-cyan-500/50 hover:border-cyan-400 rounded-xl space-y-3.5 shadow-xl transition-all relative overflow-hidden group"
                      >
                        {/* Background Blueprint Decorative Plane Silhouette */}
                        <div className="absolute -right-4 -bottom-4 text-slate-800/40 pointer-events-none group-hover:text-cyan-950/40 transition">
                          <Plane className="w-32 h-32" />
                        </div>

                        {/* Top Header */}
                        <div className="flex items-start justify-between gap-2 relative z-10">
                          <div>
                            <div className="font-black text-white text-base md:text-lg flex items-center gap-2">
                              <span>{plane.model}</span>
                              {plane.isSupersonic && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500 animate-pulse">
                                  ⚡ SUPERSONIC
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-cyan-300 font-mono mt-0.5 flex items-center gap-2">
                              <span>{plane.manufacturer}</span>
                              <span>•</span>
                              <span>
                                {plane.originBloc === 'WEST' ? 'Western Alliance (WEST)' : plane.originBloc === 'EAST' ? 'Eastern Bloc (EAST)' : 'International Consortium'}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-black shrink-0">
                            LAUNCH {plane.introYear}
                          </span>
                        </div>

                        {/* Key Technical Specifications Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono relative z-10">
                          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">CAPACITY</span>
                            <span className="font-black text-white text-sm">{plane.capacity} Seats</span>
                            <span className="text-[9px] text-slate-500 block truncate">{plane.cabinAisle || 'Standard'}</span>
                          </div>
                          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">MAX RANGE</span>
                            <span className="font-black text-sky-300 text-sm">{plane.rangeKm.toLocaleString()} km</span>
                            <span className="text-[9px] text-slate-500 block">
                              {plane.rangeKm >= 9000 ? 'Intercontinental' : plane.rangeKm >= 5000 ? 'Transcontinental' : 'Regional'}
                            </span>
                          </div>
                          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">CRUISE SPEED</span>
                            <span className="font-black text-amber-300 text-sm">{plane.speedKmh} km/h</span>
                            <span className="text-[9px] text-slate-500 block">Mach {(plane.speedKmh / 1060).toFixed(2)}</span>
                          </div>
                          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">PROJECTED PRICE</span>
                            <span className="font-black text-emerald-400 text-sm">${plane.priceK.toLocaleString()}K</span>
                            <span className="text-[9px] text-slate-500 block">First Delivery</span>
                          </div>
                          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">FUEL CONSUMPTION</span>
                            <span className="font-black text-slate-200 text-sm">{plane.fuelBurnPerKm} L/km</span>
                            <span className="text-[9px] text-slate-500 block">Cruise Burn</span>
                          </div>
                          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">MAINTENANCE</span>
                            <span className="font-black text-slate-200 text-sm">${plane.maintCostPerHour}/hr</span>
                            <span className="text-[9px] text-slate-500 block">Operating Tier</span>
                          </div>
                        </div>

                        {/* Powerplant & Airframe details */}
                        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 relative z-10">
                          <div className="text-[10px] text-slate-400 uppercase">Engine & Airframe Specifications:</div>
                          <div className="text-slate-200 font-semibold mt-0.5">{plane.engineType}</div>
                          <div className="text-slate-400 text-[10px] mt-0.5">
                            Wingspan: {plane.wingspanM}m • Length: {plane.lengthM}m • MTOW: {plane.mtowTon}t
                          </div>
                        </div>

                        {/* Strategic Advisory */}
                        <div className="bg-cyan-950/40 border border-cyan-500/40 p-3 rounded-xl relative z-10">
                          <div className="font-black text-cyan-300 text-xs flex items-center gap-1.5 mb-1">
                            <Award className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Chief Aeronautical Strategist Advisory:</span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-sans">
                            {getUpcomingAircraftAdvisory(plane)}
                          </p>
                          <div className="mt-1.5 text-[10px] font-mono text-amber-300/90 italic">
                            💡 Strategic Recommendation: Reserve company cash flow this fiscal year to order delivery slots in Q1 {plane.introYear}.
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. NEW AIRCRAFT COMMERCIAL LAUNCH THIS QUARTER */}
              {gameState.newlyIntroducedAircraft && gameState.newlyIntroducedAircraft.length > 0 && (
                <div className="p-4 bg-sky-950/80 border-2 border-sky-400 rounded-2xl shadow-xl space-y-2">
                  <div className="flex items-center gap-2 text-sky-300 font-black text-sm md:text-base font-mono">
                    <Plane className="w-5 h-5 text-sky-400 animate-pulse" />
                    <span>🚀 COMMERCIAL LAUNCH // NEW AIRCRAFT NOW AVAILABLE FOR PURCHASE!</span>
                  </div>
                  <div className="space-y-2">
                    {gameState.newlyIntroducedAircraft.map((plane) => (
                      <div
                        key={plane.id}
                        className="p-3 bg-slate-900 border border-sky-700/60 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-black text-white text-sm md:text-base flex items-center gap-2">
                            <span>{plane.model}</span>
                            {plane.isSupersonic && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500 font-black">
                                SUPERSONIC
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-300 font-mono mt-0.5">
                            {plane.manufacturer} • {plane.capacity} Seats • Max Range: {plane.rangeKm.toLocaleString()} km
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block font-mono">Market Price:</span>
                          <span className="font-black font-mono text-emerald-400 text-sm md:text-base">
                            ${plane.priceK.toLocaleString()}K
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. QUARTERLY FLIGHT INCIDENTS & DISRUPTIONS LOG */}
              {gameState.routeIncidents && gameState.routeIncidents.length > 0 && (
                <div className="space-y-3 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border-2 border-amber-500/70 p-4 md:p-5 rounded-2xl shadow-xl font-mono">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300">
                        <AlertCircle className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-black text-white text-xs md:text-sm uppercase tracking-wider">
                          Quarterly Flight Disruptions & Incident Log ({gameState.routeIncidents.length} Events)
                        </h3>
                        <p className="text-[11px] text-slate-400 font-sans">
                          Severe seasonal weather, mechanical faults on aging planes, and traffic delays reduced scheduled flights and incurred emergency expenditures.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-sky-400">
                        <span>⛈️ Seasonal Weather</span>
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <span>⚙️ Mechanical Fault</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {gameState.routeIncidents.map((item, idx) => {
                      const isPlayer = item.airlineId === playerAirline.id;
                      const icon =
                        item.incident.type === 'WEATHER'
                          ? '⛈️'
                          : item.incident.type === 'MECHANICAL'
                          ? '⚙️'
                          : '📡';
                      const typeLabel =
                        item.incident.type === 'WEATHER'
                          ? 'Severe Seasonal Weather'
                          : item.incident.type === 'MECHANICAL'
                          ? 'Mechanical Fault / Fatigue'
                          : 'Air Traffic Delay';

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${
                            isPlayer
                              ? 'bg-rose-950/50 border-2 border-rose-400/90 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                              : 'bg-slate-900/90 border-slate-800'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: item.airlineColor }}
                                />
                                <span className="font-bold text-white text-xs">{item.airlineName}</span>
                                {isPlayer && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-black border border-rose-500">
                                    YOUR ROUTE
                                  </span>
                                )}
                                <span className="text-slate-400 text-xs">•</span>
                                <span className="text-amber-300 font-bold text-xs">
                                  {item.originCityName} ➔ {item.destCityName}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                  {typeLabel}
                                </span>
                              </div>
                              <div className="text-xs text-slate-200 font-sans mt-1">
                                <span className="font-bold text-amber-200">{item.incident.title}:</span>{' '}
                                {item.incident.description}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-right font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                            <div className="text-rose-400 font-bold text-xs">
                              -{item.incident.lostFlights} Flights Grounded
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Emergency: -${item.incident.emergencyCostK.toLocaleString()}K
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. DIPLOMATIC TREATIES & ENVOY MISSION RESULTS */}
              {gameState.diplomaticReports && gameState.diplomaticReports.length > 0 && (
                <div className="space-y-3 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border-2 border-emerald-500/80 p-4 md:p-5 rounded-2xl shadow-xl">
                  <h3 className="font-black text-emerald-300 text-xs md:text-sm flex items-center gap-2 font-mono uppercase">
                    <Handshake className="w-4 h-4 text-emerald-400" />
                    <span>Diplomatic Treaties & Envoy Results This Quarter ({gameState.diplomaticReports.length}):</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {gameState.diplomaticReports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-slate-900/90 border border-emerald-500/60 p-3.5 rounded-xl flex items-center gap-3 shadow-md"
                      >
                        <NegotiatorAvatar avatarId={report.avatarId} size="md" className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-white text-xs md:text-sm truncate">
                              {report.negotiatorName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500">
                              RATIFIED
                            </span>
                          </div>
                          <div className="text-xs text-sky-300 font-bold mt-0.5">
                            {report.targetCityName}
                          </div>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">
                            {report.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. World Events */}
              {gameState.activeEvents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-black text-slate-100 text-sm md:text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Global Events, Wars & Aviation Crises:</span>
                  </h3>
                  {gameState.activeEvents.map((ev) => {
                    const isDemandPositive = (ev.demandMultiplier || 1) >= 1;
                    const demandDeltaPct = Math.round(((ev.demandMultiplier || 1) - 1) * 100);
                    const isFuelSpike = (ev.fuelPriceMultiplier || 1) > 1.05;
                    const fuelDeltaPct = Math.round(((ev.fuelPriceMultiplier || 1) - 1) * 100);

                    return (
                      <div
                        key={ev.id}
                        className={`border-2 p-4 rounded-2xl shadow-md ${
                          ev.type === 'WAR' ||
                          ev.type === 'OIL_CRISIS' ||
                          ev.type === 'EPIDEMIC' ||
                          ev.type === 'ECONOMIC_CRISIS'
                            ? 'bg-rose-950/60 border-rose-500/80 text-rose-200'
                            : 'bg-amber-950/50 border-amber-500/80 text-amber-200'
                        }`}
                      >
                        <div className="font-black text-sm md:text-base flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span>
                              {ev.type === 'WAR'
                                ? '⚔️'
                                : ev.type === 'OIL_CRISIS'
                                ? '🛢️'
                                : ev.type === 'EPIDEMIC'
                                ? '☣️'
                                : '🏆'}
                            </span>
                            <span className="text-white">{ev.title}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {ev.demandMultiplier && (
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full border font-black ${
                                  isDemandPositive
                                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400'
                                    : 'bg-rose-500/30 text-rose-200 border-rose-400'
                                }`}
                              >
                                {isDemandPositive
                                  ? `Passenger Demand: +${demandDeltaPct}%`
                                  : `Passenger Demand: ${demandDeltaPct}%`}
                              </span>
                            )}
                            {isFuelSpike && (
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400 font-black">
                                🛢️ Jet Fuel: +{fuelDeltaPct}%
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                              Duration: {ev.durationQuarters}Q
                            </span>
                          </div>
                        </div>
                        <p className="text-xs md:text-sm text-slate-200 mt-2 leading-relaxed">
                          {ev.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 5.5 AIRPORT INFRASTRUCTURE & RUNWAY EXPANSIONS */}
              {gameState.airportExpansions && gameState.airportExpansions.length > 0 && (
                <div className="space-y-3 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500/80 p-4 md:p-5 rounded-2xl shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                      <Building2 className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-xs md:text-sm uppercase tracking-wider font-mono">
                        🏗️ Global Airport Infrastructure & Runway Expansions ({gameState.airportExpansions.length} Hubs)
                      </h3>
                      <p className="text-[11px] text-slate-300 font-sans">
                        Civil aviation authorities have completed major terminal, concourse, and runway expansion projects to relieve slot congestion!
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {gameState.airportExpansions.map((exp) => (
                      <div
                        key={exp.cityId}
                        className="p-3 bg-slate-900/90 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 shadow"
                      >
                        <div>
                          <div className="font-black text-white text-sm flex items-center gap-2">
                            <span>{exp.cityName}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono">
                              {exp.cityId}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 mt-0.5">
                            {exp.reason}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black font-mono text-emerald-400 block bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500">
                            +{exp.addedSlots} SLOTS
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-1">
                            New Cap: {exp.newTotalSlots}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. ROUTE CLOSURES & LOSS-CUTTING REPORT */}
              {gameState.lastQuarterClosedRoutes && gameState.lastQuarterClosedRoutes.length > 0 && (
                <div className="space-y-3 bg-rose-950/50 border-2 border-rose-500/80 p-4 md:p-5 rounded-2xl shadow-xl">
                  <h3 className="font-black text-rose-300 text-xs md:text-sm flex items-center gap-2 font-mono uppercase">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Aviation Fleet Terminations & Deficit Route Closures ({gameState.lastQuarterClosedRoutes.length}):</span>
                  </h3>
                  <div className="space-y-2">
                    {gameState.lastQuarterClosedRoutes.map((cr, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-900/90 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cr.airlineColor }} />
                          <span className="font-bold text-white">{cr.airlineName}</span>
                          <span className="text-slate-400">terminated</span>
                          <span className="text-amber-300 font-bold">
                            {cityMap.get(cr.originCityId)?.name} ➔ {cityMap.get(cr.destCityId)?.name}
                          </span>
                        </div>
                        <span className="text-rose-400 font-bold">Cut Loss: -${cr.lossK.toLocaleString()}K</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. FUTURE AEROSPACE HORIZON WATCH (Global R&D Intelligence) */}
              <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs md:text-sm">
                    <Plane className="w-4 h-4" />
                    <span>Aerospace Horizon Watch // Upcoming Model Timeline</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Global R&D Intelligence</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {AIRCRAFTS.filter((a) => a.introYear > gameState.currentYear)
                    .slice(0, 2)
                    .map((m) => (
                      <div key={m.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60">
                        <div className="flex justify-between items-center text-white font-black">
                          <span>{m.model}</span>
                          <span className="text-amber-300 text-[10px]">Introduces {m.introYear}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {m.manufacturer} • {m.capacity} Pax • {m.rangeKm.toLocaleString()} km
                        </div>
                      </div>
                    ))}
                </div>
                <div className="text-[11px] text-slate-400 italic">
                  💡 Tip: Manufacturers periodically offer 30%-50% flash discounts. Keep cash in reserve to expand your fleet when promotions hit.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 border-t border-slate-700 px-6 py-3.5 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs md:text-sm shadow-xl transition-all active:scale-95 border-2 border-sky-400 cursor-pointer"
          >
            <span>Confirm & Enter Next Quarter</span>
            <ChevronRight className="w-4 h-4 text-sky-200" />
          </button>
        </div>
      </div>
    </div>
  );
};
