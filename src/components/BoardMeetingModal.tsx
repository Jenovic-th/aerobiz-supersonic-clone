import React, { useState, useEffect } from 'react';
import { GameState, Airline, City, Route, AircraftModel } from '../types/game';
import { CITIES } from '../data/cities';
import { AIRCRAFTS } from '../data/aircrafts';
import { calculateDistance, calculateBaseFare, calculateRouteDemand } from '../simulation/engine';
import { getCityVisual } from '../data/cityVisuals';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useI18n } from '../utils/i18n';
import {
  Users,
  Compass,
  Sliders,
  Plane,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  X,
  MessageSquare,
  Award,
  Eye,
  ShieldAlert,
  Target,
  Zap,
  Activity,
  DollarSign,
  Calculator,
  HelpCircle,
  ChevronRight,
  BarChart3,
  AlertOctagon,
  Globe2,
  Clock,
  Sparkles,
  Search,
  Calendar,
} from 'lucide-react';

interface BoardMeetingModalProps {
  gameState: GameState;
  playerAirline: Airline;
  onClose: () => void;
  onOpenRouteModal: (originCity?: City, destCity?: City) => void;
  onOpenManageRoutes: () => void;
  onOpenAircraftShop: () => void;
  onOpenBusinessModal: () => void;
  onOpenSlotModal?: (city?: City) => void;
}

type MeetingTopic = 'NEW_ROUTES' | 'ADJUST_ROUTES' | 'PLANES' | 'BUSINESSES' | 'COMPETITOR_INTEL';

export const BoardMeetingModal: React.FC<BoardMeetingModalProps> = ({
  gameState,
  playerAirline,
  onClose,
  onOpenRouteModal,
  onOpenManageRoutes,
  onOpenAircraftShop,
  onOpenBusinessModal,
  onOpenSlotModal,
}) => {
  const { t, lang } = useI18n();
  const isTh = lang === 'th';
  const [selectedTopic, setSelectedTopic] = useState<MeetingTopic>('NEW_ROUTES');
  const [showFormulaExplanation, setShowFormulaExplanation] = useState<boolean>(true);

  // Keyboard Escape listener to dismiss meeting instantly
  useEscapeKey(onClose);

  const cityMap = new Map(CITIES.map((c) => [c.id, c]));
  const playerRoutes = gameState.routes.filter((r) => r.airlineId === playerAirline.id);
  const homeCity = cityMap.get(playerAirline.homeCityId) || CITIES[0];
  const allHubCities = [
    homeCity,
    ...playerAirline.hubCityIds
      .filter((id) => id !== homeCity.id)
      .map((id) => cityMap.get(id))
      .filter(Boolean) as City[],
  ];

  // =========================================================================
  // 1. INTELLIGENT NETWORK EXPANSION ALGORITHM (DIRECTOR OF NETWORK PLANNING)
  // =========================================================================
  // Candidate A: Cities where player owns landing slots (>= 1) but has no flights!
  const citiesWithSlots = CITIES.filter((c) => (playerAirline.slots[c.id] || 0) > 0);
  const unservedSlotCities = citiesWithSlots.filter(
    (c) =>
      c.id !== homeCity.id &&
      !playerRoutes.some(
        (r) =>
          (r.originCityId === homeCity.id && r.destCityId === c.id) ||
          (r.originCityId === c.id && r.destCityId === homeCity.id)
      )
  );

  // Candidate Corridors:
  // 1. Primary: Cities where player owns landing slots (>= 1) but has no flights!
  // 2. Secondary: Top global corridors from home base that are not yet served
  const candidateCitiesToEvaluate: City[] = unservedSlotCities.length > 0
    ? unservedSlotCities
    : CITIES.filter(
        (c) =>
          c.id !== homeCity.id &&
          !playerRoutes.some(
            (r) =>
              (r.originCityId === homeCity.id && r.destCityId === c.id) ||
              (r.originCityId === c.id && r.destCityId === homeCity.id)
          )
      )
        .sort((a, b) => (b.population * 2.5 + b.businessIndex * 2) - (a.population * 2.5 + a.businessIndex * 2))
        .slice(0, 3);

  // Evaluate candidate corridors with economic gravity formulas
  const candidateCorridors = candidateCitiesToEvaluate.map((dest) => {
    const dist = calculateDistance(homeCity.lat, homeCity.lon, dest.lat, dest.lon);
    const baseFare = calculateBaseFare(dist);
    const rawDemand = calculateRouteDemand(
      homeCity,
      dest,
      gameState.currentYear,
      gameState.currentQuarter,
      gameState.activeEvents || []
    );

    // Standard weekly service on starter aircraft (~160 seats, 7 flights/week)
    const quarterlyCapacity = 160 * 7 * 12; // 13,440 seats
    const estimatedLF = Math.min(94, Math.max(55, Math.round((rawDemand / quarterlyCapacity) * 82)));
    const projectedPax = Math.round(quarterlyCapacity * (estimatedLF / 100));
    const projectedRevenueK = Math.round((projectedPax * baseFare * 0.95) / 1000);
    const estimatedOpExK = Math.round((quarterlyCapacity * baseFare * 0.52) / 1000);
    const projectedNetProfitK = projectedRevenueK - estimatedOpExK;
    const operatingMarginPct = projectedRevenueK > 0 ? Math.round((projectedNetProfitK / projectedRevenueK) * 100) : 0;

    // Competitor check on this corridor
    const rivalRoutes = gameState.routes.filter(
      (r) =>
        r.airlineId !== playerAirline.id &&
        ((r.originCityId === homeCity.id && r.destCityId === dest.id) ||
          (r.originCityId === dest.id && r.destCityId === homeCity.id))
    );
    const isMonopoly = rivalRoutes.length === 0;

    // Check if player has an idle plane with certified range
    const idlePlane = playerAirline.fleet.find(
      (f) => f.assignedRouteId === null && ((AIRCRAFTS.find((a) => a.id === f.modelId)?.rangeKm ?? 0) >= dist)
    );

    const upcomingEvent = (gameState.upcomingEvents || []).find(
      (ue) =>
        (ue.event.affectedCityIds || []).includes(dest.id) ||
        (ue.event.affectedRegionIds || []).includes(dest.region)
    );

    const score =
      dest.population * 2.5 +
      dest.businessIndex * 1.8 +
      dest.tourismIndex * 1.5 +
      (isMonopoly ? 80 : 0) +
      (upcomingEvent ? 150 : 0);

    return {
      dest,
      distance: dist,
      baseFare,
      rawDemand,
      projectedPax,
      projectedRevenueK,
      estimatedOpExK,
      projectedNetProfitK,
      operatingMarginPct,
      isMonopoly,
      rivalCount: rivalRoutes.length,
      idlePlane,
      score,
      slotsOwned: playerAirline.slots[dest.id] || 0,
      upcomingEvent,
    };
  });

  const topRouteOpportunities = candidateCorridors.sort((a, b) => b.score - a.score).slice(0, 3);

  // =========================================================================
  // 2. COMMERCIAL YIELD & ROUTE MODIFICATION ALGORITHM (CCO)
  // =========================================================================
  // Categorize player routes into Deficit Corridors vs Overbooked Saturation Corridors
  const deficitRoutes = playerRoutes
    .filter((r) => r.lastQuarterStats && r.lastQuarterStats.profitK < 0 && r.status === 'ACTIVE')
    .map((r) => {
      const orig = cityMap.get(r.originCityId) || CITIES[0];
      const dst = cityMap.get(r.destCityId) || CITIES[1];
      const stats = r.lastQuarterStats!;
      const isLowLF = stats.loadFactorPct < 65;
      const isOversized = stats.capacity > 2400 && stats.passengers < 1200;

      // Price elasticity calculation: epsilon = -1.35
      // Dropping fare by 10% stimulates +13.5% pax volume
      const estPaxAfterDiscount = Math.round(stats.passengers * 1.135);
      const estRevAfterDiscountK = Math.round(stats.revenueK * 0.9 * 1.135);
      const estTurnaroundSavingK = Math.abs(stats.profitK) + Math.round(estRevAfterDiscountK - stats.revenueK);

      return {
        route: r,
        orig,
        dst,
        stats,
        isLowLF,
        isOversized,
        estTurnaroundSavingK,
      };
    });

  const overbookedRoutes = playerRoutes
    .filter((r) => r.lastQuarterStats && r.lastQuarterStats.loadFactorPct >= 95 && r.status === 'ACTIVE')
    .map((r) => {
      const orig = cityMap.get(r.originCityId) || CITIES[0];
      const dst = cityMap.get(r.destCityId) || CITIES[1];
      const stats = r.lastQuarterStats!;
      // +10% price increase on saturated route captures almost 100% flow-through
      const estExtraProfitK = Math.round(stats.revenueK * 0.11);

      return {
        route: r,
        orig,
        dst,
        stats,
        estExtraProfitK,
      };
    });

  // =========================================================================
  // 3. FLEET ENGINEERING & ASSET ALLOCATION (VP FLEET OPERATIONS)
  // =========================================================================
  const deterioratingPlanes = playerAirline.fleet.filter((f) => (f.conditionPct ?? 100) < 80);
  const criticalPlanes = playerAirline.fleet.filter((f) => (f.conditionPct ?? 100) < 70);
  const idlePlanes = playerAirline.fleet.filter((f) => f.assignedRouteId === null);
  const activeDiscount = gameState.activeDiscountDeal;

  // Intercontinental range capability check (>= 8,800 km)
  const hasInterconPlane = playerAirline.fleet.some((f) => {
    const model = AIRCRAFTS.find((a) => a.id === f.modelId);
    return model && model.rangeKm >= 8800;
  });

  // =========================================================================
  // 4. VENTURES & HOSPITALITY SYNERGIES (CHIEF INVESTMENT OFFICER)
  // =========================================================================
  const networkCities = Array.from(
    new Set([
      playerAirline.homeCityId,
      ...playerAirline.hubCityIds,
      ...playerRoutes.map((r) => r.destCityId),
    ])
  )
    .map((id) => cityMap.get(id))
    .filter(Boolean) as City[];

  const ventureRecommendations = networkCities
    .filter((c) => !playerAirline.businesses.some((b) => b.cityId === c.id))
    .map((c) => {
      const visual = getCityVisual(c.id);
      const topVenture = visual.ventures[0] || {
        type: 'HOTEL',
        name: `${c.name} Grand Hotel`,
        costK: 6000,
        dividendK: 520,
        tourismBoost: 6,
      };

      // Flight synergy: 1.35x dividend boost if airline operates flights to this city!
      const hasActiveFlight = playerRoutes.some(
        (r) => r.originCityId === c.id || r.destCityId === c.id
      );
      const effectiveDividendK = Math.round(topVenture.dividendK * (hasActiveFlight ? 1.35 : 1.0));
      const annualROI = Math.round(((effectiveDividendK * 4) / topVenture.costK) * 100);
      const paybackQuarters = Math.round((topVenture.costK / effectiveDividendK) * 10) / 10;

      return {
        city: c,
        venture: topVenture,
        hasActiveFlight,
        effectiveDividendK,
        annualROI,
        paybackQuarters,
        score: c.tourismIndex * 1.5 + c.businessIndex * 1.2 + (hasActiveFlight ? 50 : 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // =========================================================================
  // 5. COMPETITOR INTEL & COUNTER-STRATEGY (CHIEF INTELLIGENCE OFFICER)
  // =========================================================================
  const rivalAirlines = gameState.airlines.filter((a) => !a.isHuman);

  // A. Rival Envoys on active diplomatic missions
  const rivalDispatchedMissions = rivalAirlines.flatMap((rival) => {
    return (rival.negotiators || [])
      .filter((n) => n.status === 'DISPATCHED' && n.currentMission)
      .map((neg) => ({
        rival,
        neg,
        mission: neg.currentMission!,
      }));
  });

  // B. Rival Factory Orders awaiting delivery
  const rivalPendingOrders = rivalAirlines.flatMap((rival) => {
    return (rival.pendingOrders || []).map((order) => ({
      rival,
      order,
    }));
  });

  // C. Rival Weak & Vulnerable Corridors (Deficit or Low Load Factor < 55%)
  const rivalVulnerableRoutes = gameState.routes
    .filter((r) => {
      if (r.airlineId === playerAirline.id || r.status !== 'ACTIVE') return false;
      const stats = r.lastQuarterStats;
      return stats && (stats.profitK < 0 || stats.loadFactorPct < 55);
    })
    .map((r) => {
      const rival = rivalAirlines.find((a) => a.id === r.airlineId);
      const orig = cityMap.get(r.originCityId) || CITIES[0];
      const dst = cityMap.get(r.destCityId) || CITIES[1];
      return {
        route: r,
        rival,
        orig,
        dst,
        stats: r.lastQuarterStats!,
      };
    })
    .slice(0, 3);

  // D. Continental Hub Leadership Threat
  const rivalHubCounts = rivalAirlines.map((rival) => ({
    rival,
    hubsCount: (rival.hubCityIds || []).length,
    activeRoutes: gameState.routes.filter((r) => r.airlineId === rival.id).length,
  }));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-indigo-500/90 rounded-3xl shadow-[0_0_80px_rgba(99,102,241,0.4)] w-[96vw] max-w-[1650px] overflow-hidden flex flex-col text-slate-100 max-h-[95vh] cursor-default"
      >
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 px-6 sm:px-8 py-4.5 border-b border-indigo-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-900/80 border border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-mono tracking-wide text-white flex items-center gap-2">
                {t.board.headerTitle}
              </h2>
              <div className="text-xs sm:text-sm text-indigo-300 font-mono flex items-center gap-2 mt-0.5">
                <span className="font-bold text-white">{playerAirline.name}</span>
                <span>•</span>
                <span>{t.board.headerSubtitle}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/70 text-rose-200 hover:text-white text-xs sm:text-sm font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-md shrink-0 active:scale-95"
            title={isTh ? 'ยกเลิกหรือปิดการประชุมทันที (Esc)' : 'Cancel or Exit Meeting (Esc)'}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{t.board.cancelExitBtn}</span>
          </button>
        </div>

        {/* Boardroom Presentation Table */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Executive Secretary Strategic Overview */}
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-inner">
            <div className="w-16 h-16 rounded-2xl bg-indigo-950 border-2 border-indigo-400 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
                alt="Executive Secretary"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 font-mono">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs sm:text-sm text-indigo-400 font-black uppercase tracking-wider">
                  {t.board.secretaryBriefing}
                </span>
                <span className="text-xs text-slate-300">
                  {t.board.treasury} <strong className="text-emerald-400 font-bold">${playerAirline.cashK.toLocaleString()}K</strong> | {t.board.routes} <strong className="text-amber-300 font-bold">{playerRoutes.length}</strong>
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-200 mt-1.5 leading-relaxed">
                {t.board.secretarySpeech}
              </div>
            </div>
          </div>

          {/* 5 Strategic Agenda Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            {/* Agenda 1: New Routes */}
            <button
              onClick={() => setSelectedTopic('NEW_ROUTES')}
              className={`p-4 rounded-2xl border font-mono text-left transition flex flex-col justify-between gap-2 cursor-pointer relative overflow-hidden ${
                selectedTopic === 'NEW_ROUTES'
                  ? 'bg-sky-950/90 border-sky-400 text-white shadow-[0_0_25px_rgba(56,189,248,0.3)] ring-1 ring-sky-400'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Compass className="w-5 h-5 text-sky-400" />
                <span className="text-[10px] font-black uppercase text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                  {isTh ? 'วาระที่ 1' : 'AGENDA 1'}
                </span>
              </div>
              <div>
                <div className="text-sm sm:text-base font-black text-white">{t.board.agenda1Title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{t.board.agenda1Sub.replace('{count}', String(topRouteOpportunities.length))}</div>
              </div>
            </button>

            {/* Agenda 2: Adjust Routes */}
            <button
              onClick={() => setSelectedTopic('ADJUST_ROUTES')}
              className={`p-4 rounded-2xl border font-mono text-left transition flex flex-col justify-between gap-2 cursor-pointer relative overflow-hidden ${
                selectedTopic === 'ADJUST_ROUTES'
                  ? 'bg-emerald-950/90 border-emerald-400 text-white shadow-[0_0_25px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {isTh ? 'วาระที่ 2' : 'AGENDA 2'}
                </span>
              </div>
              <div>
                <div className="text-sm sm:text-base font-black text-white">{t.board.agenda2Title}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {deficitRoutes.length > 0 ? (
                    <span className="text-rose-400 font-bold">{t.board.agenda2SubDeficit.replace('{count}', String(deficitRoutes.length))}</span>
                  ) : (
                    <span>{t.board.agenda2SubNormal}</span>
                  )}
                </div>
              </div>
            </button>

            {/* Agenda 3: Fleet & Aircraft */}
            <button
              onClick={() => setSelectedTopic('PLANES')}
              className={`p-3 rounded-2xl border font-mono text-left transition flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden ${
                selectedTopic === 'PLANES'
                  ? 'bg-amber-950/90 border-amber-400 text-white shadow-[0_0_25px_rgba(251,191,36,0.3)]'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Plane className="w-5 h-5 text-amber-400" />
                <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                  {isTh ? 'วาระที่ 3' : 'AGENDA 3'}
                </span>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-white">{t.board.agenda3Title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{t.board.agenda3Sub}</div>
              </div>
            </button>

            {/* Agenda 4: Ventures */}
            <button
              onClick={() => setSelectedTopic('BUSINESSES')}
              className={`p-3 rounded-2xl border font-mono text-left transition flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden ${
                selectedTopic === 'BUSINESSES'
                  ? 'bg-purple-950/90 border-purple-400 text-white shadow-[0_0_25px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Building2 className="w-5 h-5 text-purple-400" />
                <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">
                  {isTh ? 'วาระที่ 4' : 'AGENDA 4'}
                </span>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-white">{t.board.agenda4Title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{t.board.agenda4Sub}</div>
              </div>
            </button>

            {/* Agenda 5: Competitor Intel Radar */}
            <button
              onClick={() => setSelectedTopic('COMPETITOR_INTEL')}
              className={`p-3 rounded-2xl border font-mono text-left transition flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden col-span-2 sm:col-span-1 ${
                selectedTopic === 'COMPETITOR_INTEL'
                  ? 'bg-rose-950/90 border-rose-400 text-white shadow-[0_0_25px_rgba(244,63,94,0.35)]'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Eye className="w-5 h-5 text-rose-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800">
                  {isTh ? 'เรดาร์ข่าวกรอง' : 'RADAR INTEL'}
                </span>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-white">{t.board.agenda5Title}</div>
                <div className="text-[10px] text-rose-300 font-bold mt-0.5">
                  {isTh ? `สอดแนมคู่แข่ง AI (${rivalDispatchedMissions.length} ทูต)` : `Rival AI Recon (${rivalDispatchedMissions.length} Envoys)`}
                </div>
              </div>
            </button>
          </div>

          {/* Toggle Formula Explanation Box */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowFormulaExplanation(!showFormulaExplanation)}
              className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer transition"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{showFormulaExplanation ? t.board.hideFormulas : t.board.showFormulas}</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TOPIC DETAIL 1: NEW ROUTES */}
          {/* ========================================================================= */}
          {selectedTopic === 'NEW_ROUTES' && (
            <div className="space-y-4 font-mono">
              {/* Director Card */}
              <div className="bg-sky-950/30 border border-sky-500/40 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-900/60 border border-sky-400 text-sky-300">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-sky-200 uppercase">
                      {t.board.directorNetworkTitle}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {t.board.directorNetworkSpeech}
                    </p>
                  </div>
                </div>
              </div>

              {/* Formula & Methodological Breakdown */}
              {showFormulaExplanation && (
                <div className="bg-slate-950 border border-sky-900/50 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="text-sky-400 font-black flex items-center gap-1.5 uppercase text-[11px]">
                    <Calculator className="w-4 h-4" />
                    <span>{isTh ? 'ระเบียบวิธีคิดและการคำนวณของ AI (Gravity Demand Model):' : 'ALGORITHMIC REASONING & DEMAND GRAVITY MODEL:'}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-slate-300 text-[11px] pt-1">
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-sky-300 block">{isTh ? '1. แบบจำลองแรงดึงดูดทางเศรษฐกิจ:' : '1. Gravity Demand Model:'}</strong>
                      Demand = √(Pop₁ × Pop₂) × [(Bus₁ + Bus₂ + Tour₁ + Tour₂) / 4] × EraMultiplier
                    </div>
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-sky-300 block">{isTh ? '2. ราคาตั๋วมาตรฐานตามระยะบิน:' : '2. Standard Base Fare:'}</strong>
                      {isTh ? 'ค่าโดยสารมาตรฐาน ($) = ระยะทาง (กม.) × 0.11 + $65 (แปรผันตามต้นทุนเชื้อเพลิง)' : 'Base Fare ($) = Distance (km) × 0.11 + $65 (Aligned with per-km fuel costs)'}
                    </div>
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-sky-300 block">{isTh ? '3. อัตรากำไรจากการดำเนินงาน:' : '3. Operating Profit Margin:'}</strong>
                      {isTh ? 'กำไรสุทธิ = รายรับรวม (ผู้โดยสาร × ค่าตั๋ว) - ต้นทุนดำเนินการ (ที่นั่ง × 52% ต้นทุนเที่ยวบิน)' : 'Net Margin = Revenue (Pax × Fare) - OpEx (Seats × 52% Standard Trip Cost)'}
                    </div>
                  </div>
                </div>
              )}

              {/* Opportunities List */}
              {topRouteOpportunities.length === 0 ? (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
                  {isTh ? 'ขณะนี้สนามบินทุกแห่งที่คุณถือครอง Landing Slot เปิดเที่ยวบินครบถ้วนแล้ว! แนะนำให้ส่งนักการทูตไปเจรจาขอสล็อตในมหานครใหม่เพื่อขยายโครงข่าย' : 'All cities with landing slots are currently served! Dispatch envoys to negotiate slots in new global cities to expand your network.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {topRouteOpportunities.map((opp) => (
                    <div
                      key={opp.dest.id}
                      className="bg-slate-950 border border-slate-800 hover:border-sky-500/60 rounded-2xl p-4 transition space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white">
                            {homeCity.name} ({homeCity.id}) ➔ {opp.dest.name} ({opp.dest.id})
                          </span>
                          <span className="text-xs bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded-md font-bold">
                            {opp.distance.toLocaleString()} km
                          </span>
                          {opp.isMonopoly ? (
                            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-black">
                              {t.board.monopolyBadge}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700 px-2 py-0.5 rounded font-black">
                              {t.board.contestedBadge.replace('{count}', String(opp.rivalCount))}
                            </span>
                          )}
                          {opp.upcomingEvent && (
                            <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/80 px-2 py-0.5 rounded font-black flex items-center gap-1 shadow animate-pulse">
                              <Calendar className="w-3 h-3 text-indigo-400" />
                              <span>{t.board.worldSpectacle.replace('{title}', opp.upcomingEvent.event.title).replace('{months}', String(opp.upcomingEvent.quartersUntil * 3)).replace('{surge}', String(opp.upcomingEvent.estimatedDemandSurgePct))}</span>
                            </span>
                          )}
                        </div>

                        {opp.slotsOwned > 0 ? (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenRouteModal(homeCity, opp.dest);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 shrink-0"
                          >
                            <span>{t.board.openRouteImmediate}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onClose();
                              if (onOpenSlotModal) onOpenSlotModal(opp.dest);
                              else onOpenRouteModal(homeCity, opp.dest);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 shrink-0"
                          >
                            <span>{t.board.dispatchEnvoy}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Financial Projection Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">{t.board.slotsOwned}</span>
                          <strong className="text-white">{opp.slotsOwned} {isTh ? 'สล็อต (ว่าง)' : 'Slots Idle'}</strong>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">{t.board.baseTicketFare}</span>
                          <strong className="text-amber-300">${opp.baseFare} {isTh ? '/ ที่นั่ง' : '/ seat'}</strong>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">{t.board.projectedPax}</span>
                          <strong className="text-sky-300">{opp.projectedPax.toLocaleString()} {isTh ? 'คน/ไตรมาส' : 'pax/Q'}</strong>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">{t.board.estOpEx}</span>
                          <strong className="text-slate-300">${opp.estimatedOpExK.toLocaleString()}K</strong>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">{t.board.projectedProfit}</span>
                          <strong className="text-emerald-400 font-black">
                            +${opp.projectedNetProfitK.toLocaleString()}K ({opp.operatingMarginPct}%)
                          </strong>
                        </div>
                      </div>

                      {/* AI Strategic Rationale */}
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                        <strong className="text-sky-300 block mb-1">{t.board.aiRationale}</strong>
                        {isTh ? (
                          <>
                            1. <strong>ใช้ประโยชน์สล็อตว่าง:</strong> เราถือสิทธิ์การบินใน {opp.dest.name} อยู่ {opp.slotsOwned} สล็อตโดยไม่มีเที่ยวบิน หากปล่อยทิ้งไว้จะเสี่ยงต่อกฎ Use-it-or-Lose-it ของสนามบินสากล<br />
                            2. <strong>ผลตอบแทนทางเศรษฐกิจ:</strong> เมือง {opp.dest.name} มีประชากร {opp.dest.population} ล้านคน และดัชนีธุรกิจ {opp.dest.businessIndex}/100 รองรับดีมานด์ {opp.rawDemand.toLocaleString()} คน/ไตรมาส คาดว่าจะทำกำไรสุทธิสูงถึง +${opp.projectedNetProfitK.toLocaleString()}K ต่อไตรมาส<br />
                            3. <strong>ความพร้อมฝูงบิน:</strong> {opp.idlePlane ? `มีเครื่องบินว่างที่ระยะบินถึง (${opp.distance.toLocaleString()} km) พร้อมจัดสรรบินได้ทันที!` : 'แนะนำให้สั่งซื้อหรือโยกย้ายเครื่องบินพิสัยบินอย่างน้อย ' + opp.distance.toLocaleString() + ' km'}
                          </>
                        ) : (
                          <>
                            1. <strong>Idle Slot Utilization:</strong> Holding {opp.slotsOwned} idle slots in {opp.dest.name} risks forfeiture under international Use-it-or-Lose-it airport regulations.<br />
                            2. <strong>Economic Yield:</strong> {opp.dest.name} has a population of {opp.dest.population}M and business index {opp.dest.businessIndex}/100, generating {opp.rawDemand.toLocaleString()} quarterly pax demand and projected net profit of +${opp.projectedNetProfitK.toLocaleString()}K.<br />
                            3. <strong>Fleet Allocation:</strong> {opp.idlePlane ? `Available aircraft with matching certified range (${opp.distance.toLocaleString()} km) is ready for immediate dispatch!` : 'Recommend ordering or reassigning an aircraft with certified range of at least ' + opp.distance.toLocaleString() + ' km.'}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC DETAIL 2: ADJUST ROUTES */}
          {/* ========================================================================= */}
          {selectedTopic === 'ADJUST_ROUTES' && (
            <div className="space-y-4 font-mono">
              {/* Director Card */}
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-400 text-emerald-300">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-200 uppercase">
                      {t.board.directorCommercialTitle}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {t.board.directorCommercialSpeech}
                    </p>
                  </div>
                </div>
              </div>

              {/* Formula & Methodological Breakdown */}
              {showFormulaExplanation && (
                <div className="bg-slate-950 border border-emerald-900/50 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="text-emerald-400 font-black flex items-center gap-1.5 uppercase text-[11px]">
                    <Calculator className="w-4 h-4" />
                    <span>{isTh ? 'หลักการบริหารผลตอบแทนค่าโดยสาร:' : 'YIELD MANAGEMENT THEORY & ELASTICITY RULES:'}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 text-[11px] pt-1">
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-emerald-300 block">{isTh ? '1. แก้ปัญหาเที่ยวบินขาดทุน (อัตราบรรทุก < 65%):' : '1. Deficit Fix (Load Factor < 65%):'}</strong>
                      {isTh ? 'ความยืดหยุ่นของอุปสงค์ต่อราคา (ε ≈ -1.35) เมื่อลดค่าตั๋วลง 10% จะกระตุ้นจำนวนผู้โดยสารพุ่งขึ้น +13.5% ช่วยเติมเต็มที่นั่งว่างและเปลี่ยนเส้นทางขาดทุนเป็นกำไร' : 'Price elasticity of demand (ε ≈ -1.35) means a 10% fare reduction can boost passenger volume by +13.5%, filling empty seats and turning deficits into profit.'}
                    </div>
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-emerald-300 block">{isTh ? '2. เพิ่มกำไรจากเที่ยวบินเต็ม (อัตราบรรทุก ≥ 95%):' : '2. Saturation Upsell (Load Factor ≥ 95%):'}</strong>
                      {isTh ? 'เที่ยวบินเต็มล้น 100% แสดงว่าดีมานด์ล้นเกินความจุ การปรับขึ้นค่าตั๋ว +10% ถึง +15% จะมีผู้โดยสารยอมจ่ายโดยแทบไม่มีผู้โดยสารลดลง กำไรสุทธิจะเพิ่มขึ้นเต็มเม็ดเต็มหน่วย' : 'Flights running at 100% capacity indicate excess demand. Increasing fares by +10% to +15% captures pure surplus profit with negligible passenger drop-off.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Two Sections: Deficit vs Overbooked */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Deficit Routes Alert */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>{t.board.deficitCorridors}</span>
                  </div>

                  {deficitRoutes.length === 0 ? (
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center text-xs text-emerald-400">
                      {t.board.noDeficitRoutes}
                    </div>
                  ) : (
                    deficitRoutes.map(({ route, orig, dst, stats, isLowLF, isOversized, estTurnaroundSavingK }) => (
                      <div key={route.id} className="bg-slate-950 border border-rose-800/60 rounded-2xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">
                            {orig.name} ➔ {dst.name}
                          </span>
                          <span className="text-rose-400 font-black text-xs">
                            -${Math.abs(stats.profitK).toLocaleString()}K / Q
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded-lg space-y-1">
                          <div>{isTh ? 'อัตราบรรทุกผู้โดยสาร:' : 'Load Factor:'} <strong className="text-amber-300">{stats.loadFactorPct}%</strong> ({isTh ? 'ผู้โดยสาร' : 'Pax'} {stats.passengers.toLocaleString()} / {isTh ? 'ความจุ' : 'Capacity'} {stats.capacity.toLocaleString()})</div>
                          <div className="text-rose-300 font-semibold">
                            💡 {isLowLF
                              ? (isTh ? 'วินิจฉัย: ค่าตั๋วสูงเกินไป แนะนำลดค่าตั๋ว -10% เพื่อดึงดูดผู้โดยสาร' : 'Diagnosis: Fares too high. Recommend cutting ticket price -10% to boost load factor.')
                              : isOversized
                              ? (isTh ? 'วินิจฉัย: ใช้เครื่องบินลำใหญ่เกินไป แนะนำเปลี่ยนเป็นลำเล็กลงเพื่อลดต้นทุนเชื้อเพลิง' : 'Diagnosis: Aircraft capacity exceeds demand. Recommend downsizing to reduce fuel burn.')
                              : (isTh ? 'วินิจฉัย: ต้นทุนต่อเที่ยวบินสูงกว่ารายรับ แนะนำปรับความถี่หรือตั๋ว' : 'Diagnosis: Operating costs exceed revenue. Recommend adjusting frequency or fares.')}
                          </div>
                          <div className="text-emerald-400 text-[10px]">
                            {isTh
                              ? `คาดการณ์ผลประโยชน์: ลดการขาดทุนได้ประมาณ +$${estTurnaroundSavingK.toLocaleString()}K ต่อไตรมาส`
                              : `Projected Benefit: Reduce losses by approx +$${estTurnaroundSavingK.toLocaleString()}K per quarter`}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            onOpenManageRoutes();
                          }}
                          className="w-full py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-100 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>{t.board.modifyRouteDeficit}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* 2. Overbooked Routes Upsell */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>{t.board.saturatedCorridors}</span>
                  </div>

                  {overbookedRoutes.length === 0 ? (
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center text-xs text-slate-400">
                      {t.board.noSaturatedRoutes}
                    </div>
                  ) : (
                    overbookedRoutes.map(({ route, orig, dst, stats, estExtraProfitK }) => (
                      <div key={route.id} className="bg-slate-950 border border-emerald-800/60 rounded-2xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">
                            {orig.name} ➔ {dst.name}
                          </span>
                          <span className="text-emerald-400 font-black text-xs">
                            LF: {stats.loadFactorPct}% {isTh ? '(เต็มพิกัด)' : '(Capacity Max)'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded-lg space-y-1">
                          <div>{isTh ? 'กำไรปัจจุบัน:' : 'Current Profit:'} <strong className="text-emerald-400">+${stats.profitK.toLocaleString()}K</strong></div>
                          <div className="text-emerald-300 font-semibold">
                            💡 {isTh ? 'วินิจฉัย: ที่นั่งไม่พอขาย แนะนำปรับขึ้นราคาตั๋ว +10% ถึง +15% หรือเปลี่ยนใส่เครื่องบินลำใหญ่ขึ้น' : 'Diagnosis: Saturated demand. Recommend raising ticket fare +10% to +15% or upgrading to larger aircraft.'}
                          </div>
                          <div className="text-sky-300 text-[10px]">
                            {isTh
                              ? `คาดการณ์ผลประโยชน์: ฟันกำไรส่วนเกินเพิ่มอีก +$${estExtraProfitK.toLocaleString()}K ต่อไตรมาสโดยไม่ต้องลงทุนเพิ่ม!`
                              : `Projected Benefit: Capture +$${estExtraProfitK.toLocaleString()}K in pure quarterly profit with zero added capex!`}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            onOpenManageRoutes();
                          }}
                          className="w-full py-1.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>{t.board.scaleUpFare}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC DETAIL 3: FLEET ENGINEERING & PROCUREMENT */}
          {/* ========================================================================= */}
          {selectedTopic === 'PLANES' && (
            <div className="space-y-4 font-mono">
              {/* Director Card */}
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-900/60 border border-amber-400 text-amber-300">
                    <Plane className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-200 uppercase">
                      {t.board.directorFleetTitle}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {t.board.directorFleetSpeech}
                    </p>
                  </div>
                </div>
              </div>

              {/* Formula & Methodological Breakdown */}
              {showFormulaExplanation && (
                <div className="bg-slate-950 border border-amber-900/50 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="text-amber-400 font-black flex items-center gap-1.5 uppercase text-[11px]">
                    <Calculator className="w-4 h-4" />
                    <span>{isTh ? 'เกณฑ์การบริหารสินทรัพย์ฝูงบิน:' : 'FLEET ENGINEERING THRESHOLDS & CAPITAL DEPLOYMENT:'}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-slate-300 text-[11px] pt-1">
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-amber-300 block">{isTh ? '1. เกณฑ์ความปลอดภัยทางกลไก (< 80%):' : '1. Wear & Tear Safety Threshold:'}</strong>
                      {isTh ? 'หากสภาพเครื่องยนต์ < 80% อัตราเสี่ยงดีเลย์หรือเครื่องขัดข้องจะพุ่งสูง ต้องปรับงบซ่อมบำรุงเป็น Rigorous (+15%) ทันที' : 'If airframe condition drops below 80%, incident and breakdown risks spike. Switch maintenance tier to Rigorous (+15%) immediately.'}
                    </div>
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-amber-300 block">{isTh ? '2. ต้นทุนการจอดเครื่องบินทิ้งว่าง:' : '2. Idle Asset Penalty:'}</strong>
                      {isTh ? 'เครื่องบินที่จอดทิ้งว่างมีต้นทุนการบำรุงรักษาและเสื่อมราคาไตรมาสละ $150K-$350K โดยไม่สร้างรายได้ ต้องนำไปบินให้เร็วที่สุด' : 'Idle aircraft incur hangar parking and depreciation fees of $150K-$350K per quarter without revenue. Deploy them to active routes promptly.'}
                    </div>
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-amber-300 block">{isTh ? '3. พิสัยการบินข้ามทวีป:' : '3. Intercontinental Reach:'}</strong>
                      {isTh ? 'การจะพิชิตชัยชนะเชื่อมโยง 7 ทวีป จำเป็นต้องมีเครื่องบินพิสัยไกล (≥ 8,800 km) เพื่อเชื่อมโยงฐานข้ามทวีปโดยไม่ต้องแวะพัก' : 'Dominating all 7 continents requires long-range aircraft (≥ 8,800 km) to establish nonstop transoceanic trunk corridors.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Active Manufacturer Rebate Box */}
              {activeDiscount ? (
                <div className="bg-amber-950/40 border border-amber-500/70 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-[0_0_25px_rgba(251,191,36,0.15)]">
                  <div>
                    <div className="text-xs font-black text-amber-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{t.board.activeRebateTitle.replace('{model}', activeDiscount.modelName).replace('{pct}', String(activeDiscount.discountPct))}</span>
                    </div>
                    <div className="text-xs text-slate-200 mt-1">
                      {activeDiscount.reason}
                    </div>
                    <div className="text-[11px] text-amber-200/80 mt-0.5">
                      {isTh ? 'โอกาสประหยัดเงินทุนได้หลายล้านดอลลาร์ เหมาะอย่างยิ่งสำหรับการขยายเส้นทางข้ามทวีป' : 'Save millions in capital expenditure. Perfect timing for intercontinental route expansion.'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAircraftShop();
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow active:scale-95"
                  >
                    {t.board.orderDiscountedPlane}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-slate-400">
                  {t.board.noRebate}
                </div>
              )}

              {/* Fleet Condition & Idle Aircraft Audit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <span>{t.board.mechanicalHealth}</span>
                  </div>
                  {deterioratingPlanes.length === 0 ? (
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{t.board.healthAllGood}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-300 space-y-1">
                      <div>{t.board.healthWarning.replace('{count}', String(deterioratingPlanes.length))}</div>
                      <div className="text-[11px] opacity-80 text-rose-400">
                        {criticalPlanes.length > 0 && (isTh ? `(ในนี้มี ${criticalPlanes.length} ลำต่ำกว่า 70% เสี่ยงต่อการเกิดอุบัติเหตุ!) ` : `(${criticalPlanes.length} below 70% critical danger threshold!) `)}
                        {isTh ? 'แนะนำตั้งค่างบซ่อมบำรุงเป็น Rigorous หรือเตรียมปลดระวาง' : 'Recommend setting maintenance tier to Rigorous or preparing for fleet retirement.'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>{t.board.fleetUtilization}</span>
                  </div>
                  {idlePlanes.length === 0 ? (
                    <div className="text-xs text-emerald-400">
                      {t.board.utilAllActive}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-300 space-y-1">
                      <div>{t.board.utilIdleCount.replace('{count}', String(idlePlanes.length))}</div>
                      <div className="text-[11px] text-slate-400">
                        {isTh ? 'เครื่องบินที่จอดนิ่งคิดเป็นมูลค่าเงินทุนหลายสิบล้าน แนะนำให้นำไปเปิดเส้นทางใหม่ในวาระที่ 1 ทันที' : 'Grounded aircraft represent millions in tied-up capital. Recommend allocating them to new routes in Agenda 1 immediately.'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC DETAIL 4: BUSINESSES & VENTURES */}
          {/* ========================================================================= */}
          {selectedTopic === 'BUSINESSES' && (
            <div className="space-y-4 font-mono">
              {/* Director Card */}
              <div className="bg-purple-950/30 border border-purple-500/40 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-900/60 border border-purple-400 text-purple-300">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-purple-200 uppercase">
                      {t.board.directorVenturesTitle}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {t.board.directorVenturesSpeech}
                    </p>
                  </div>
                </div>
              </div>

              {/* Formula & Methodological Breakdown */}
              {showFormulaExplanation && (
                <div className="bg-slate-950 border border-purple-900/50 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="text-purple-400 font-black flex items-center gap-1.5 uppercase text-[11px]">
                    <Calculator className="w-4 h-4" />
                    <span>{isTh ? 'สูตรผลตอบแทนการลงทุนและการผนึกกำลัง (ROI & Synergy):' : 'SUBSIDIARY RETURN ON INVESTMENT & FLIGHT SYNERGY:'}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-slate-300 text-[11px] pt-1">
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-purple-300 block">{isTh ? '1. โบนัสประสานพลังเที่ยวบิน (+35%):' : '1. Airline Flight Synergy (+35%):'}</strong>
                      {isTh ? 'หากเรามีเที่ยวบินไปเมืองนั้น ผู้โดยสารจะเข้าพักโรงแรมและใช้บริการรถบัสของเรา ส่งผลให้เงินปันผลพุ่งสูงขึ้น +35% ทันที!' : 'Operating an active route to the city channels airline passengers into your hotels and shuttle buses, yielding an immediate +35% dividend bonus!'}
                    </div>
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-purple-300 block">{isTh ? '2. ผลตอบแทนรายปีและระยะเวลาคืนทุน:' : '2. Annual ROI & Payback:'}</strong>
                      {isTh ? 'ROI % = (เงินปันผลรายไตรมาส × 4 / ราคาซื้อ) × 100% ช่วยให้คำนวณระยะเวลาคืนทุนได้อย่างแม่นยำ' : 'ROI % = (Quarterly Dividend × 4 / Cost) × 100%, providing exact forecasting on capital recovery timelines.'}
                    </div>
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-purple-300 block">{isTh ? '3. ตัวกระตุ้นแคมเปญโฆษณา:' : '3. Travel Agency Campaign Booster:'}</strong>
                      {isTh ? 'การเปิดบริษัททัวร์ในภูมิภาคจะเพิ่มผลการบูสต์ของแคมเปญโฆษณาทวีปอีก +30% ทรงพลังอย่างยิ่ง' : 'Operating regional travel agencies amplifies continental advertising campaigns by an extra +30% passenger multiplier.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Targets List */}
              <div className="space-y-3">
                {ventureRecommendations.map(({ city, venture, hasActiveFlight, effectiveDividendK, annualROI, paybackQuarters }) => (
                  <div
                    key={city.id}
                    className="bg-slate-950 border border-slate-800 hover:border-purple-500/60 rounded-2xl p-4 transition space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">
                          {city.name} ({city.id}) • {venture.name}
                        </span>
                        {hasActiveFlight ? (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-black">
                            {t.board.flightSynergyBonus}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                            {t.board.noFlightYet}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          onClose();
                          onOpenBusinessModal();
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
                      >
                        <span>{t.board.investAcquire.replace('{cost}', venture.costK.toLocaleString())}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">{isTh ? 'ราคาซื้อกิจการ' : 'PURCHASE COST'}</span>
                        <strong className="text-white">${venture.costK.toLocaleString()}K</strong>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">{isTh ? 'เงินปันผลต่อไตรมาส' : 'QUARTERLY DIVIDEND'}</span>
                        <strong className="text-emerald-400">+${effectiveDividendK.toLocaleString()}K / Q</strong>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">{isTh ? 'ผลตอบแทนต่อปี' : 'ANNUAL ROI'}</span>
                        <strong className="text-purple-300">{annualROI}% / year</strong>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">{isTh ? 'ระยะเวลาคืนทุน' : 'PAYBACK TIME'}</span>
                        <strong className="text-amber-300">{paybackQuarters} {isTh ? `ไตรมาส (~${(paybackQuarters / 4).toFixed(1)} ปี)` : `Quarters (~${(paybackQuarters / 4).toFixed(1)} yrs)`}</strong>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                      💡 <strong>{isTh ? 'ข้อเสนอแนะเชิงยุทธศาสตร์ AI:' : 'AI Strategic Recommendation:'}</strong> {isTh ? `เมือง ${city.name} มีดัชนีการท่องเที่ยว ${city.tourismIndex}/100 ` : `${city.name} has tourism index ${city.tourismIndex}/100 `}
                      {hasActiveFlight
                        ? (isTh ? 'และสายการบินของเรามีเที่ยวบินตรงรองรับ ส่งผลให้ได้รับผลคูณกำไรสูงสุด +35% ทันที!' : 'with direct flights in operation, unlocking the maximum +35% synergy dividend bonus!')
                        : (isTh ? 'แนะนำให้เปิดเส้นทางบินเชื่อมต่อเพื่อรับโบนัสประสานพลังเต็มอัตรา' : 'Recommend inaugurating flights to unlock the full flight synergy bonus.')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC DETAIL 5: COMPETITOR INTEL RADAR (NEW ADVANCED FEATURE!) */}
          {/* ========================================================================= */}
          {selectedTopic === 'COMPETITOR_INTEL' && (
            <div className="space-y-4 font-mono">
              {/* Director Card */}
              <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-900/60 border border-rose-400 text-rose-300">
                    <Eye className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-200 uppercase">
                      {t.board.directorIntelTitle}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {t.board.directorIntelSpeech}
                    </p>
                  </div>
                </div>
              </div>

              {/* Intel Analysis Grid */}
              <div className="space-y-4">
                {/* 1. Active Rival Diplomatic Envoys */}
                <div className="bg-slate-950 border border-rose-900/60 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-black text-rose-400 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-rose-500 animate-spin" />
                      <span>{t.board.rivalEnvoys}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {rivalDispatchedMissions.length} {isTh ? 'ทูตที่กำลังปฏิบัติภารกิจ' : 'Envoys Currently Deployed'}
                    </span>
                  </div>

                  {rivalDispatchedMissions.length === 0 ? (
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-slate-400 text-xs text-center">
                      {t.board.noRivalEnvoys}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {rivalDispatchedMissions.map(({ rival, neg, mission }) => {
                        const targetCity = cityMap.get(mission.targetCityId);
                        return (
                          <div
                            key={neg.id}
                            className="bg-slate-900 border border-rose-950/80 hover:border-rose-700/60 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs">
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block"
                                  style={{ backgroundColor: rival.color }}
                                />
                                <strong className="text-white">{rival.name} ({rival.ceoName})</strong>
                                <span className="text-slate-400">{isTh ? `ส่งทูต ${neg.name}` : `Dispatched envoy ${neg.name}`}</span>
                                <span className="text-rose-400 font-bold">➔ {isTh ? `มุ่งหน้าสู่ ${mission.targetCityName}` : `Heading to ${mission.targetCityName}`}</span>
                              </div>
                              <div className="text-[11px] text-slate-300">
                                {isTh ? 'ภารกิจ:' : 'Mission:'} <strong className="text-amber-300">{mission.type}</strong> ({isTh ? `ขอ ${mission.requestedSlots || 10} สล็อต` : `Requesting ${mission.requestedSlots || 10} slots`}) • {isTh ? `เหลือเวลาเจรจาอีก ${mission.quartersRemaining} ไตรมาส` : `${mission.quartersRemaining} quarters remaining`}
                              </div>
                              <div className="text-[11px] text-rose-300/90">
                                💡 <strong>{isTh ? 'ยุทธศาสตร์สกัดกั้น:' : 'Counter-Strategy:'}</strong> {isTh ? `คู่แข่งกำลังเล็งยึดหัวหาด ${mission.targetCityName} แนะนำให้เราส่งทูตไปชิงสล็อตในเมืองนี้ตัดหน้า หรือเตรียมเปิดเส้นทางบินป้องกัน!` : `Rival aims to monopolize ${mission.targetCityName}. Dispatch a counter-delegation or inaugurate routes to secure presence!`}
                              </div>
                            </div>

                            {onOpenSlotModal && targetCity && (
                              <button
                                onClick={() => onOpenSlotModal(targetCity)}
                                className="px-3 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-100 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                              >
                                {t.board.dispatchCounterEnvoy}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Rival Factory Orders & Fleet Expansion */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-black text-amber-400 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-amber-500" />
                      <span>{t.board.rivalOrders}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {rivalPendingOrders.length} {isTh ? 'รายการสั่งซื้อที่รอส่งมอบ' : 'Pending Aircraft Orders'}
                    </span>
                  </div>

                  {rivalPendingOrders.length === 0 ? (
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-slate-400 text-xs text-center">
                      {t.board.noRivalOrders}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rivalPendingOrders.map(({ rival, order }) => (
                        <div
                          key={order.orderId}
                          className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: rival.color }}
                            />
                            <strong className="text-white">{rival.name}</strong>
                          </div>
                          <div className="text-amber-300 font-bold">
                            {isTh ? `สั่งซื้อ ${order.quantity}x ${order.modelName}` : `Ordered ${order.quantity}x ${order.modelName}`}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {isTh ? `กำหนดส่งมอบ: ปี ${order.deliveryYear} Q${order.deliveryQuarter} (เงินลงทุน: $${order.totalCostK.toLocaleString()}K)` : `Delivery: ${order.deliveryYear} Q${order.deliveryQuarter} (Capex: $${order.totalCostK.toLocaleString()}K)`}
                          </div>
                          <div className="text-[11px] text-sky-300 pt-0.5">
                            💡 {isTh ? 'ประเมิน: กำลังเตรียมเปิดเที่ยวบินระยะไกล หรือเพิ่มความถี่เที่ยวบินหลัก' : 'Assessment: Prepping long-haul expansion or trunk corridor capacity boosts.'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Vulnerable Rival Corridors (Exploits) */}
                <div className="bg-slate-950 border border-emerald-900/50 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-black text-emerald-400 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>{t.board.vulnerableCorridors}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isTh ? 'โอกาสทองเชิงยุทธศาสตร์' : 'Top Strategic Opportunities'}
                    </span>
                  </div>

                  {rivalVulnerableRoutes.length === 0 ? (
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-slate-400 text-xs text-center">
                      {isTh ? 'เส้นทางของคู่แข่งส่วนใหญ่ยังมีอัตราที่นั่งมั่นคง ยังไม่พบเส้นทางที่ขาดทุนวิกฤติ' : 'Most rival corridors are operating stably. No critical loss-making routes detected.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {rivalVulnerableRoutes.map(({ route, rival, orig, dst, stats }) => (
                        <div
                          key={route.id}
                          className="bg-slate-900 border border-emerald-950 hover:border-emerald-700/60 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: rival?.color || '#ef4444' }}
                              />
                              <strong className="text-white">{rival?.name}</strong>
                              <span className="text-slate-400">{isTh ? 'กำลังขาดทุนบนเส้นทาง:' : 'Operating at a loss on:'}</span>
                              <strong className="text-rose-400 font-bold">{orig.name} ➔ {dst.name}</strong>
                            </div>
                            <div className="text-[11px] text-slate-300 flex items-center gap-3">
                              <span>{isTh ? 'ขาดทุนสุทธิ:' : 'Net Deficit:'} <strong className="text-rose-400">-${Math.abs(stats.profitK).toLocaleString()}K</strong></span>
                              <span>•</span>
                              <span>{isTh ? 'อัตราบรรทุกผู้โดยสาร:' : 'Load Factor:'} <strong className="text-amber-300">{stats.loadFactorPct}%</strong></span>
                            </div>
                            <div className="text-[11px] text-emerald-300">
                              💡 <strong>{isTh ? 'ยุทธการจู่โจม:' : 'Offensive Opportunity:'}</strong> {isTh ? 'เที่ยวบินของคู่แข่งคนน้อยมาก หากเราเปิดเส้นทางบินชนโดยใช้เครื่องบินที่ทันสมัยกว่าและบริการระดับพรีเมียม จะสามารถแย่งผู้โดยสารและบีบให้คู่แข่งถอนตัวได้!' : 'Rival flights have extremely low load factors. Entering this corridor with superior aircraft and service can capture market share and force their exit!'}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onClose();
                              onOpenRouteModal(orig, dst);
                            }}
                            className="px-3 py-1.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                          >
                            {t.board.attackCorridor}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Continental Dominance & Victory Race */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="text-slate-300 font-bold flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span>{t.board.worldChampionship}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    {rivalHubCounts.map(({ rival, hubsCount, activeRoutes }) => (
                      <div key={rival.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: rival.color }}
                          />
                          <strong className="text-white">{rival.name}</strong>
                        </div>
                        <div className="text-slate-400 mt-1">
                          Hubs: <strong className="text-sky-300">{hubsCount} / 7</strong> • Routes: <strong className="text-amber-300">{activeRoutes}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {isTh ? 'กลยุทธ์ AI:' : 'AI Strategy:'} {rival.personality || 'BALANCED'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Upcoming Global Spectacles Radar (3-12 Months Advance Notice) */}
                {gameState.upcomingEvents && gameState.upcomingEvents.length > 0 && (
                  <div className="bg-gradient-to-r from-indigo-950/70 via-slate-950 to-purple-950/70 border border-indigo-500/50 rounded-2xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
                      <div className="text-indigo-200 font-bold flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-indigo-400 animate-pulse" />
                        <span>{t.board.spectaclesRadar}</span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-400">
                        {isTh ? 'เรดาร์ข่าวกรองระดับสูง' : 'ADVANCE STRATEGIC INTELLIGENCE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {gameState.upcomingEvents.map((item, idx) => {
                        const ev = item.event;
                        const affectedCities = (ev.affectedCityIds || []).map((id) => cityMap.get(id)?.name || id).join(', ');
                        return (
                          <div key={ev.id + '_' + idx} className="bg-slate-900/90 p-3 rounded-xl border border-indigo-500/30 space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-white text-xs truncate">{ev.title}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 border ${
                                item.quartersUntil === 1
                                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                                  : 'bg-indigo-950 text-indigo-300 border-indigo-500'
                              }`}>
                                {item.quartersUntil === 1
                                  ? (isTh ? '🔥 อีก 3 เดือน!' : '🔥 Next 3 Months!')
                                  : (isTh ? `อีก ${item.quartersUntil * 3} เดือน (${item.quartersUntil}Q)` : `In ${item.quartersUntil * 3} mo (${item.quartersUntil}Q)`)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                              {ev.description}
                            </div>
                            <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400 border-t border-slate-800">
                              <span>{isTh ? 'เมืองเป้าหมาย:' : 'Host Cities:'} <strong className="text-indigo-300">{affectedCities || (isTh ? 'ทั่วโลก' : 'Global')}</strong></span>
                              <span className="text-emerald-400 font-bold">{isTh ? 'ดีมานด์:' : 'Demand:'} +{item.estimatedDemandSurgePct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 font-mono gap-3 flex-wrap">
          <div className="text-xs text-slate-400 hidden sm:block">
            {isTh
              ? 'ระบบข่าวกรองและสารสนเทศยุทธศาสตร์การบิน Aerobiz • แบบจำลองเศรษฐศาสตร์และเรดาร์คู่แข่งแบบเรียลไทม์'
              : 'Aerobiz Executive Intelligence System • Real-time Economic Modeling & Rival Reconnaissance'}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-200 hover:text-white rounded-xl text-xs font-bold font-mono transition cursor-pointer shadow active:scale-95"
            >
              {t.board.cancelExitBtn}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-indigo-900/80 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold font-mono transition cursor-pointer shadow border border-indigo-500/50 active:scale-95"
            >
              {t.board.adjournMeetingBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
