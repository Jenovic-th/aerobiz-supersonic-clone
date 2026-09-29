import React, { useState } from 'react';
import { GameState, Airline, City, Route } from '../types/game';
import { CITIES } from '../data/cities';
import { calculateDistance, calculateBaseFare } from '../simulation/engine';
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
} from 'lucide-react';

interface BoardMeetingModalProps {
  gameState: GameState;
  playerAirline: Airline;
  onClose: () => void;
  onOpenRouteModal: (originCity?: City, destCity?: City) => void;
  onOpenManageRoutes: () => void;
  onOpenAircraftShop: () => void;
  onOpenBusinessModal: () => void;
}

type MeetingTopic = 'NEW_ROUTES' | 'ADJUST_ROUTES' | 'PLANES' | 'BUSINESSES';

export const BoardMeetingModal: React.FC<BoardMeetingModalProps> = ({
  gameState,
  playerAirline,
  onClose,
  onOpenRouteModal,
  onOpenManageRoutes,
  onOpenAircraftShop,
  onOpenBusinessModal,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<MeetingTopic>('NEW_ROUTES');

  const cityMap = new Map(CITIES.map((c) => [c.id, c]));
  const playerRoutes = gameState.routes.filter((r) => r.airlineId === playerAirline.id);

  // 1. Intelligent Route Recommendations:
  // Find cities where player owns slots (>= 1) but has no active route connecting them!
  const citiesWithSlots = CITIES.filter((c) => (playerAirline.slots[c.id] || 0) > 0);
  const homeCity = cityMap.get(playerAirline.homeCityId) || CITIES[0];

  const unservedSlotCities = citiesWithSlots.filter(
    (c) =>
      c.id !== homeCity.id &&
      !playerRoutes.some(
        (r) =>
          (r.originCityId === homeCity.id && r.destCityId === c.id) ||
          (r.originCityId === c.id && r.destCityId === homeCity.id)
      )
  );

  // Sort unserved cities by economic mass (population * businessIndex)
  const topRouteOpportunities = unservedSlotCities
    .map((c) => {
      const dist = calculateDistance(homeCity.lat, homeCity.lon, c.lat, c.lon);
      const score = c.population * 2.0 + c.businessIndex * 1.5 + c.tourismIndex * 1.2;
      const baseFare = calculateBaseFare(dist);
      return { city: c, distance: dist, score, baseFare };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // 2. Intelligent Route Adjustment Recommendations:
  // Find routes running at a deficit or overbooked at 100% Load Factor
  const deficitRoutes = playerRoutes.filter(
    (r) => r.lastQuarterStats && r.lastQuarterStats.profitK < 0 && r.status === 'ACTIVE'
  );
  const overbookedRoutes = playerRoutes.filter(
    (r) => r.lastQuarterStats && r.lastQuarterStats.loadFactorPct >= 95 && r.status === 'ACTIVE'
  );

  // 3. Intelligent Fleet Engineering Recommendations:
  // Find aging or deteriorating aircraft in fleet
  const deterioratingPlanes = playerAirline.fleet.filter((f) => (f.conditionPct ?? 100) < 80);
  const activeDiscount = gameState.activeDiscountDeal;

  // 4. Intelligent Business Recommendations:
  // Suggest business investments in cities player serves with high tourism
  const hubAndRouteCities = Array.from(
    new Set([
      playerAirline.homeCityId,
      ...playerAirline.hubCityIds,
      ...playerRoutes.map((r) => r.destCityId),
    ])
  )
    .map((id) => cityMap.get(id))
    .filter(Boolean) as City[];

  const unownedBusinessCityOpportunities = hubAndRouteCities
    .filter((c) => !playerAirline.businesses.some((b) => b.cityId === c.id))
    .sort((a, b) => b.tourismIndex + b.businessIndex - (a.tourismIndex + a.businessIndex))
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-indigo-500/90 rounded-3xl shadow-[0_0_70px_rgba(99,102,241,0.35)] w-full max-w-4xl overflow-hidden flex flex-col text-slate-100 max-h-[94vh]">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 px-6 py-4 border-b border-indigo-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-900/80 border border-indigo-400 shadow">
              <Users className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-mono tracking-wide text-white flex items-center gap-2">
                BOARD OF DIRECTORS DELIBERATION (การประชุมบอร์ดบริหาร)
              </h2>
              <div className="text-xs text-indigo-300 font-mono">
                {playerAirline.name} • Executive Strategic Advisory Council
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Boardroom Presentation Table */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Secretary Greeting Banner */}
          <div className="bg-gradient-to-r from-slate-950 to-indigo-950/40 border border-indigo-500/40 rounded-2xl p-4 flex items-center gap-4 shadow-inner">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950 border border-indigo-400 overflow-hidden flex items-center justify-center shrink-0 shadow">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
                alt="Executive Secretary"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 font-mono">
              <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                EXECUTIVE SECRETARY (เลขานุการบริหาร)
              </div>
              <div className="text-sm font-semibold text-white mt-0.5">
                "Welcome CEO! The Executive Board has assembled to review our global operations. Please select an agenda topic for our directors to report on."
              </div>
            </div>
          </div>

          {/* 4 Classic Koei Topics Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setSelectedTopic('NEW_ROUTES')}
              className={`p-3.5 rounded-2xl border font-mono text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                selectedTopic === 'NEW_ROUTES'
                  ? 'bg-sky-950/80 border-sky-400 text-white shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Compass className="w-5 h-5 text-sky-400" />
                <span className="text-[10px] font-black uppercase text-sky-400">AGENDA 1</span>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-white">NEW ROUTES</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Where to expand next?</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedTopic('ADJUST_ROUTES')}
              className={`p-3.5 rounded-2xl border font-mono text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                selectedTopic === 'ADJUST_ROUTES'
                  ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-[0_0_20px_rgba(52,211,153,0.25)]'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-black uppercase text-emerald-400">AGENDA 2</span>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-white">ADJUST ROUTES</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Optimize route yield</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedTopic('PLANES')}
              className={`p-3.5 rounded-2xl border font-mono text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                selectedTopic === 'PLANES'
                  ? 'bg-amber-950/80 border-amber-400 text-white shadow-[0_0_20px_rgba(251,191,36,0.25)]'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Plane className="w-5 h-5 text-amber-400" />
                <span className="text-[10px] font-black uppercase text-amber-400">AGENDA 3</span>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-white">PLANES & FLEET</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Fleet health & orders</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedTopic('BUSINESSES')}
              className={`p-3.5 rounded-2xl border font-mono text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                selectedTopic === 'BUSINESSES'
                  ? 'bg-purple-950/80 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Building2 className="w-5 h-5 text-purple-400" />
                <span className="text-[10px] font-black uppercase text-purple-400">AGENDA 4</span>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-white">BUSINESSES</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Hotels & Ventures</div>
              </div>
            </button>
          </div>

          {/* Topic Detail View */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono space-y-4">
            {selectedTopic === 'NEW_ROUTES' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                    <Compass className="w-5 h-5" />
                    <span>DIRECTOR OF NETWORK PLANNING REPORT (รายงานฝ่ายวางแผนเส้นทางบิน):</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Home Base: {homeCity.name} ({homeCity.id})
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  "Based on our active airport landing slot portfolio, we currently hold landing rights in high-demand cities without operating flights. Here are our top unserved commercial corridors:"
                </p>

                {topRouteOpportunities.length === 0 ? (
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
                    All cities where we hold airport slots are currently active! Send negotiators to acquire new slots in major foreign hubs.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topRouteOpportunities.map((opp) => (
                      <div
                        key={opp.city.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>
                              {homeCity.name} ({homeCity.id}) ➔ {opp.city.name} ({opp.city.id})
                            </span>
                            <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.5 rounded">
                              {opp.distance.toLocaleString()} km
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                            <span>Slots Owned: {playerAirline.slots[opp.city.id] || 0}</span>
                            <span>•</span>
                            <span>Population: {opp.city.population}M</span>
                            <span>•</span>
                            <span>Base Fare: ${opp.baseFare}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            onOpenRouteModal(homeCity, opp.city);
                          }}
                          className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow active:scale-95 shrink-0"
                        >
                          <span>Open Route</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTopic === 'ADJUST_ROUTES' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Sliders className="w-5 h-5" />
                    <span>COMMERCIAL YIELD DIRECTOR REPORT (รายงานฝ่ายพาณิชย์และการปรับปรุงเส้นทาง):</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Active Routes: {playerRoutes.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Deficit Alert Box */}
                  <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-3.5 space-y-2">
                    <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>DEFICIT CORRIDORS (เส้นทางที่ขาดทุน):</span>
                    </div>
                    {deficitRoutes.length === 0 ? (
                      <div className="text-xs text-slate-400 pt-1">
                        ✓ All active commercial routes are operating with positive quarterly net margins!
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        {deficitRoutes.slice(0, 2).map((r) => {
                          const orig = cityMap.get(r.originCityId);
                          const dst = cityMap.get(r.destCityId);
                          return (
                            <div key={r.id} className="bg-slate-900/80 p-2.5 rounded-lg border border-rose-900/60 flex items-center justify-between">
                              <div>
                                <div className="text-xs font-bold text-white">
                                  {orig?.name} ➔ {dst?.name}
                                </div>
                                <div className="text-[11px] text-rose-400">
                                  Net: -${Math.abs(r.lastQuarterStats?.profitK || 0).toLocaleString()}K (LF: {r.lastQuarterStats?.loadFactorPct}%)
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenManageRoutes();
                                }}
                                className="px-2.5 py-1 bg-rose-900 hover:bg-rose-800 text-rose-200 rounded text-[11px] font-bold cursor-pointer"
                              >
                                Modify
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Overbooked / Yield Upsell Box */}
                  <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-3.5 space-y-2">
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>HIGH-DEMAND FULL FLIGHTS (เต็ม 95-100%):</span>
                    </div>
                    {overbookedRoutes.length === 0 ? (
                      <div className="text-xs text-slate-400 pt-1">
                        No routes currently experiencing 100% capacity saturation.
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        {overbookedRoutes.slice(0, 2).map((r) => {
                          const orig = cityMap.get(r.originCityId);
                          const dst = cityMap.get(r.destCityId);
                          return (
                            <div key={r.id} className="bg-slate-900/80 p-2.5 rounded-lg border border-emerald-900/60 flex items-center justify-between">
                              <div>
                                <div className="text-xs font-bold text-white">
                                  {orig?.name} ➔ {dst?.name}
                                </div>
                                <div className="text-[11px] text-emerald-300">
                                  Capacity: {r.lastQuarterStats?.loadFactorPct}% (Raise fare by +10% or swap larger aircraft)
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenManageRoutes();
                                }}
                                className="px-2.5 py-1 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 rounded text-[11px] font-bold cursor-pointer"
                              >
                                Scale Up
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedTopic === 'PLANES' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Plane className="w-5 h-5" />
                    <span>FLEET ENGINEERING & PROCUREMENT REPORT (รายงานฝ่ายวิศวกรรมฝูงบิน):</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Fleet Size: {playerAirline.fleet.length} Aircraft
                  </span>
                </div>

                <div className="space-y-3">
                  {activeDiscount && (
                    <div className="bg-amber-950/40 border border-amber-500/60 p-3.5 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-amber-300">
                          ⭐ FACTORY REBATE ACTIVE: {activeDiscount.modelName} ({activeDiscount.discountPct}% OFF)
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          {activeDiscount.reason}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenAircraftShop();
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-lg text-xs cursor-pointer shadow"
                      >
                        Visit Market
                      </button>
                    </div>
                  )}

                  {deterioratingPlanes.length > 0 ? (
                    <div className="bg-rose-950/30 border border-rose-800/40 p-3 rounded-xl text-xs text-rose-300">
                      ⚠️ Warning: {deterioratingPlanes.length} aircraft in our fleet have fallen below 80% mechanical health. Upgrade route maintenance budgets to Rigorous Premium to prevent in-flight mechanical breakdowns.
                    </div>
                  ) : (
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>All aircraft in our active fleet are operating at optimal mechanical condition.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTopic === 'BUSINESSES' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <Building2 className="w-5 h-5" />
                    <span>CHIEF INVESTMENT OFFICER REPORT (รายงานฝ่ายการลงทุนและธุรกิจเสริม):</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Ventures: {playerAirline.businesses.length} Active
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  "Investing in airport hotels, shuttle bus networks, and tourism attractions significantly boosts passenger catchment and unlocks 1-year regional promotional campaigns. Recommended target cities:"
                </p>

                <div className="space-y-2">
                  {unownedBusinessCityOpportunities.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white text-xs">
                          {c.name} ({c.id}) • Tourism Rating: {c.tourismIndex}/100
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          High tourism traffic makes this city ideal for an Airport Hotel or Shuttle Service.
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenBusinessModal();
                        }}
                        className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-600 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Explore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold font-mono transition cursor-pointer"
          >
            Adjourn Meeting (ปิดการประชุม)
          </button>
        </div>
      </div>
    </div>
  );
};
