import React, { useState } from 'react';
import { City, Airline, Route, NegotiatorMission, Negotiator, GameState, OngoingAirportExpansion } from '../types/game';
import { getCityVisual } from '../data/cityVisuals';
import { calculateNegotiationQuarters, calculateNegotiationCostK, calculateSlotNegotiationLimits } from '../data/negotiators';
import { CityLandmarkDiorama } from './CityLandmarkDiorama';
import { NegotiatorAvatar } from './NegotiatorAvatar';
import { useEscapeKey } from '../hooks/useEscapeKey';
import {
  X,
  Plane,
  Users,
  Briefcase,
  Palmtree,
  KeyRound,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Shield,
  HelpCircle,
  Plus,
  Minus,
  Scale,
  Hammer,
} from 'lucide-react';

interface CityDetailModalProps {
  city: City;
  playerAirline: Airline;
  routes: Route[];
  onClose: () => void;
  onOpenRouteFromCity: (city: City) => void;
  onDispatchNegotiator: (negotiatorId: string, mission: NegotiatorMission) => void;
  onInstantReturnSlots?: (cityId: string, count: number) => void;
  onInstantSellBusiness?: (businessId: string, refundK: number) => void;
  onEstablishHub?: (cityId: string, costK: number) => void;
  gameState?: GameState;
}

export const CityDetailModal: React.FC<CityDetailModalProps> = ({
  city,
  playerAirline,
  routes,
  onClose,
  onOpenRouteFromCity,
  onDispatchNegotiator,
  onInstantReturnSlots,
  onInstantSellBusiness,
  onEstablishHub,
  gameState,
}) => {
  useEscapeKey(onClose);
  const visualData = getCityVisual(city.id);
  const isHQ = playerAirline.homeCityId === city.id;
  const isHub = playerAirline.hubCityIds.includes(city.id);
  const slotsOwned = playerAirline.slots[city.id] || 0;

  const totalAirportCap = gameState?.airportSlots?.[city.id] ?? city.baseSlots;
  const totalAllocated = (gameState?.airlines || [playerAirline]).reduce(
    (sum, a) => sum + (a.slots[city.id] || 0),
    0
  );
  const remainingFreeSlots = Math.max(0, totalAirportCap - totalAllocated);
  const isAirportFull = remainingFreeSlots <= 0;

  // Active routes involving this city
  const cityRoutes = routes.filter(
    (r) => (r.originCityId === city.id || r.destCityId === city.id) && r.airlineId === playerAirline.id
  );

  // Field negotiators & HQ Director
  const negotiators = playerAirline.negotiators || [];
  const fieldNegotiators = negotiators.filter((n) => n.role === 'FIELD');
  const hqDirector = negotiators.find((n) => n.role === 'HQ') || negotiators[4];
  const availableFieldNegotiators = fieldNegotiators.filter((n) => n.status === 'AVAILABLE');

  // Home city of player for duration calculation
  const homeCity =
    playerAirline.homeCityId === city.id
      ? city
      : ({ id: playerAirline.homeCityId, country: 'Home Country', bloc: 'WEST' } as City);

  const requiredQuarters = calculateNegotiationQuarters(homeCity, city);
  const recentExpansion = gameState?.airportExpansions?.find((e) => e.cityId === city.id);
  const ongoingExpansion = gameState?.ongoingAirportExpansions?.find((e) => e.cityId === city.id);

  const limits = calculateSlotNegotiationLimits(
    city,
    totalAirportCap,
    totalAllocated,
    slotsOwned,
    isHQ,
    isHub,
    recentExpansion?.addedSlots || 0,
    (gameState?.airlines || []).length || 4
  );

  const [chosenSlots, setChosenSlots] = useState<number | null>(null);
  const requestedSlots = Math.min(
    limits.maxRequestableSlots,
    Math.max(limits.minSlots, chosenSlots ?? limits.recommendedSlots)
  );
  const slotCostK = calculateNegotiationCostK(city, requestedSlots);
  const maxSlotsReached = slotsOwned >= totalAirportCap || isAirportFull || limits.maxRequestableSlots <= 0;

  // Active slot negotiation in this city (if any)
  const activeSlotNegotiator = fieldNegotiators.find(
    (n) =>
      n.status === 'DISPATCHED' &&
      n.currentMission?.targetCityId === city.id &&
      n.currentMission.type === 'SLOT_NEGOTIATION'
  );

  // Modal State for Confirming Envoy Dispatch (Prevents accidental clicks!)
  const [pendingMission, setPendingMission] = useState<NegotiatorMission | null>(null);
  const [selectedEnvoyId, setSelectedEnvoyId] = useState<string>(
    availableFieldNegotiators[0]?.id || ''
  );

  // Toggle for David Sterling HQ Operations Popup
  const [showHQOperations, setShowHQOperations] = useState(false);

  // Player owned businesses in this city
  const playerBusinessesInCity = playerAirline.businesses.filter((b) => b.cityId === city.id);

  // Trigger Confirmation for Slots
  const promptSlotNegotiation = () => {
    if (activeSlotNegotiator || maxSlotsReached || availableFieldNegotiators.length === 0) return;
    const mission: NegotiatorMission = {
      type: 'SLOT_NEGOTIATION',
      targetCityId: city.id,
      targetCityName: city.name,
      requestedSlots: requestedSlots,
      costK: slotCostK,
      quartersRemaining: requiredQuarters,
      totalQuarters: requiredQuarters,
    };
    setSelectedEnvoyId(availableFieldNegotiators[0]?.id || '');
    setPendingMission(mission);
  };

  const handleUpdatePendingSlots = (newSlots: number) => {
    if (!pendingMission || pendingMission.type !== 'SLOT_NEGOTIATION') return;
    const clamped = Math.max(limits.minSlots, Math.min(limits.maxRequestableSlots, newSlots));
    const newCostK = calculateNegotiationCostK(city, clamped);
    setPendingMission({
      ...pendingMission,
      requestedSlots: clamped,
      costK: newCostK,
    });
    setChosenSlots(clamped);
  };

  // Trigger Confirmation for Subsidiary Buyout
  const promptSubsidiaryBuyout = (v: (typeof visualData.ventures)[0]) => {
    if (availableFieldNegotiators.length === 0 || playerAirline.cashK < v.costK) return;
    const mission: NegotiatorMission = {
      type: 'SUBSIDIARY_ACQUISITION',
      targetCityId: city.id,
      targetCityName: city.name,
      ventureName: v.name,
      ventureType: v.type,
      costK: v.costK,
      quartersRemaining: requiredQuarters,
      totalQuarters: requiredQuarters,
    };
    setSelectedEnvoyId(availableFieldNegotiators[0]?.id || '');
    setPendingMission(mission);
  };

  // Confirm and Execute Dispatch
  const handleConfirmDispatch = () => {
    if (!pendingMission || !selectedEnvoyId) return;
    onDispatchNegotiator(selectedEnvoyId, pendingMission);
    setPendingMission(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-3 animate-in fade-in duration-150">
      {/* ZERO-SCROLL SINGLE SCREEN MODAL CONTAINER */}
      <div className="bg-slate-900 border-2 border-sky-500/70 rounded-3xl shadow-2xl w-full max-w-6xl h-[92vh] max-h-[760px] overflow-hidden flex flex-col text-slate-100 font-sans relative">
        {/* 1. TOP EXECUTIVE TITLE & METRICS RIBBON (Compact unified bar: 48px) */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 px-4 py-2 border-b border-sky-800/80 flex items-center justify-between shrink-0 shadow-lg gap-2">
          {/* City Identity */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="p-1.5 rounded-lg bg-sky-900/80 border border-sky-400">
              <MapPin className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">{city.name}</h2>
                <span className="px-2 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400 font-mono font-black text-xs">
                  {city.id}
                </span>
                {isHQ && (
                  <span className="px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400 font-black text-[10px]">
                    👑 HQ
                  </span>
                )}
                {isHub && !isHQ && (
                  <span className="px-2 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400 font-black text-[10px]">
                    🌐 HUB
                  </span>
                )}
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                  {city.bloc}
                </span>
              </div>
              <div className="text-[10px] text-sky-200/80">
                {city.country} • {city.region.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          {/* Unified Compact Metrics Strip */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] text-slate-400">Pop:</span>
              <span className="font-mono font-bold text-white">{city.population}M</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-slate-400">Slots:</span>
              <span className="font-mono font-bold text-emerald-400">
                {slotsOwned}/{totalAirportCap}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-slate-400">Biz:</span>
              <span className="font-mono font-bold text-amber-300">{city.businessIndex}/100</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <Palmtree className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-[10px] text-slate-400">Tour:</span>
              <span className="font-mono font-bold text-pink-300">{city.tourismIndex}/100</span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-700 shrink-0"
            title="Close (Esc)"
            data-testid="modal-close-header-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. MAIN WORKSPACE (Single-Screen 2-Column Layout, zero scrollbar needed) */}
        <div className="flex-1 min-h-0 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
          {/* LEFT COLUMN: LANDMARK ART, ROUTES & DIPLOMATIC CORPS (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-2 min-h-0 h-full overflow-hidden">
            {/* Real 8K Panoramic Landmark Photograph */}
            <div className="h-32 sm:h-36 shrink-0 rounded-2xl overflow-hidden shadow-lg border border-sky-500/60">
              <CityLandmarkDiorama city={city} visualData={visualData} className="h-full w-full" />
            </div>

            {/* Flight Routes Bar (Clean separate bar, zero overlap!) */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/90 rounded-xl border border-slate-800 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Plane className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-xs font-bold text-slate-300 font-mono">
                  Routes: <span className="text-sky-300">{cityRoutes.length} Active</span>
                </span>
                {cityRoutes.length > 0 && (
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    ({cityRoutes.map(r => r.destCityId === city.id ? r.originCityId : r.destCityId).join(', ')})
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenRouteFromCity(city);
                }}
                disabled={slotsOwned < 2}
                className="px-2.5 py-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white rounded-lg font-bold text-[11px] shadow flex items-center gap-1 cursor-pointer transition active:scale-95 border border-sky-400 shrink-0"
              >
                <Plane className="w-3 h-3" />
                <span>Launch Route</span>
              </button>
            </div>

            {/* DIPLOMATIC CORPS STATION (4 Field Envoys) - Filling the entire space with 4 spacious cards */}
            <div className="flex-1 min-h-0 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-800/80 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">💼</span>
                  <span className="text-xs font-black text-slate-200 font-mono uppercase tracking-wider">
                    Diplomatic Envoys
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  {availableFieldNegotiators.length} of 4 Available
                </span>
              </div>

              {/* 4 Envoy Cards (Stacked vertically, spacious and perfectly fitted with zero scroll) */}
              <div className="flex-1 min-h-0 flex flex-col justify-between gap-1.5">
                {fieldNegotiators.map((neg) => {
                  const isStationedHere =
                    neg.status === 'DISPATCHED' && neg.currentMission?.targetCityId === city.id;
                  const isStationedElsewhere =
                    neg.status === 'DISPATCHED' && neg.currentMission?.targetCityId !== city.id;
                  const isAvail = neg.status === 'AVAILABLE';
                  const mission = neg.currentMission;

                  return (
                    <div
                      key={neg.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                        isStationedHere
                          ? 'bg-gradient-to-r from-amber-950/60 to-slate-900 border-amber-500/90 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                          : isStationedElsewhere
                          ? 'bg-slate-900/50 border-slate-800/80 opacity-70'
                          : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <NegotiatorAvatar
                          avatarId={neg.avatarId}
                          size="sm"
                          className="w-10 h-11 rounded-lg border border-slate-600"
                        />
                        {isStationedHere && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-white truncate">
                            {neg.name}
                          </span>
                          {isStationedHere && (
                            <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                              {mission?.quartersRemaining}Q Left
                            </span>
                          )}
                          {isAvail && (
                            <span className="text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-0.5 shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                            </span>
                          )}
                          {isStationedElsewhere && (
                            <span className="text-[9px] font-mono text-slate-400 truncate shrink-0">
                              {mission?.targetCityId} ({mission?.quartersRemaining}Q)
                            </span>
                          )}
                        </div>

                        {/* Subtitle / Live Mission description */}
                        <div className="text-[10px] mt-0.5 leading-tight truncate">
                          {isStationedHere ? (
                            <span className="text-amber-200/90 font-medium">
                              {mission?.type === 'SLOT_NEGOTIATION'
                                ? `Negotiating ${mission.requestedSlots || 10} Landing Slots`
                                : mission?.type === 'SUBSIDIARY_ACQUISITION'
                                ? `Acquiring "${mission.ventureName || 'Venture'}"`
                                : 'Chartering Regional Hub'}
                            </span>
                          ) : isStationedElsewhere ? (
                            <span className="text-slate-400">
                              Stationed in {mission?.targetCityName}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              Available for treaties & buyouts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 6 SUBSIDIARY TILES (8 Cols - Compact 2x3 Grid) */}
          <div className="lg:col-span-8 flex flex-col min-h-0 h-full bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-black text-slate-200 font-mono tracking-wide uppercase">
                  Local Commercial Subsidiaries (6 Opportunities)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Duration: {requiredQuarters} Quarter{requiredQuarters > 1 ? 's' : ''} ({requiredQuarters * 3} mo)
              </span>
            </div>

            {/* 6-Tile Matrix (2 cols x 3 rows) */}
            <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visualData.ventures.map((v) => {
                // Check if player already owns this exact venture
                const isOwned = playerAirline.businesses.some(
                  (b) => b.cityId === city.id && b.name === v.name
                );

                // Check which exact negotiator is acquiring this specific venture
                const activeNegotiator = fieldNegotiators.find(
                  (n) =>
                    n.status === 'DISPATCHED' &&
                    n.currentMission?.targetCityId === city.id &&
                    n.currentMission.type === 'SUBSIDIARY_ACQUISITION' &&
                    n.currentMission.ventureName === v.name
                );

                const canAfford = playerAirline.cashK >= v.costK;

                return (
                  <div
                    key={v.slotIndex}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                      isOwned
                        ? 'bg-emerald-950/30 border-emerald-500/80 shadow'
                        : activeNegotiator
                        ? 'bg-amber-950/30 border-amber-500/80 shadow animate-pulse'
                        : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      {/* Top Header of Tile */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-lg p-1 bg-slate-800 rounded-md border border-slate-700 shrink-0">
                            {v.icon}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-white truncate leading-tight">
                              {v.name}
                            </div>
                            <div className="text-[10px] text-slate-400">{v.type}</div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isOwned ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400 shrink-0">
                            OWNED
                          </span>
                        ) : activeNegotiator ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-400 shrink-0">
                            TALKS ONGOING ({activeNegotiator.name.split(' ')[0]})
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                            AVAILABLE
                          </span>
                        )}
                      </div>

                      {/* Financial Yield Details */}
                      <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">
                          Cost: <strong className="text-white">${v.costK.toLocaleString()}K</strong>
                        </span>
                        <span className="text-emerald-400 font-mono font-bold">
                          +${v.dividendK}K/qtr
                        </span>
                        <span className="text-pink-300 font-mono font-bold">
                          +{v.tourismBoost}% Pax
                        </span>
                      </div>
                    </div>

                    {/* Action Button: Opens Confirmation Modal! */}
                    {!isOwned && !activeNegotiator && (
                      <div className="mt-2">
                        <button
                          disabled={availableFieldNegotiators.length === 0 || !canAfford}
                          onClick={() => promptSubsidiaryBuyout(v)}
                          className="w-full py-1 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-30 disabled:pointer-events-none text-white rounded-lg font-bold text-[11px] shadow border border-indigo-400 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Acquire (${v.costK.toLocaleString()}K • {requiredQuarters}Q)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. BOTTOM EXECUTIVE DECK: CITY SLOTS STATUS & PRIMARY ACTIONS */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-2.5 border-t-2 border-sky-500/60 shrink-0 flex items-center justify-between gap-4">
          {/* Left: City Status & Negotiation Summary */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase font-mono">Status:</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono font-bold text-xs text-sky-300">
                {slotsOwned} / {totalAirportCap} Slots (Airport: {totalAllocated}/{totalAirportCap})
              </span>
            </div>

            {ongoingExpansion && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500 font-bold flex items-center gap-1 animate-pulse">
                <Hammer className="w-3 h-3" />
                <span>+{ongoingExpansion.addedSlots} in {ongoingExpansion.quartersRemaining}Q ({ongoingExpansion.quartersRemaining * 3}mo)</span>
              </span>
            )}

            {limits.isAntiMonopolyActive && !isAirportFull && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500 font-bold flex items-center gap-1">
                <Scale className="w-3 h-3" />
                <span>Fair-Share: Max {limits.maxRequestableSlots}</span>
              </span>
            )}

            {/* If slots negotiation ongoing */}
            {activeSlotNegotiator && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/70 text-amber-300 text-xs font-bold animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Slot Treaty: {activeSlotNegotiator.currentMission?.quartersRemaining}Q Remaining ({activeSlotNegotiator.name.split(' ')[0]})
                </span>
              </div>
            )}
          </div>

          {/* Right: Direct Actions (Negotiate Slots & HQ Director) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Negotiate Slots Button */}
            {!activeSlotNegotiator && (
              <button
                disabled={
                  availableFieldNegotiators.length === 0 ||
                  maxSlotsReached ||
                  playerAirline.cashK < slotCostK
                }
                onClick={promptSlotNegotiation}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl font-black text-xs md:text-sm shadow-xl transition-all active:scale-95 border border-emerald-400 cursor-pointer flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-emerald-200" />
                <span>
                  {maxSlotsReached
                    ? 'Slots Maxed'
                    : `Negotiate ${requestedSlots} Slots ($${slotCostK.toLocaleString()}K • ${requiredQuarters}Q)`}
                </span>
              </button>
            )}

            {/* Charter Regional Hub Button: Always visible for non-HQ cities! */}
            {!isHQ && !isHub && (() => {
              const hasInboundRoute = cityRoutes.length > 0;
              const hasEnoughSlots = slotsOwned >= 10;
              const hasEnoughCash = playerAirline.cashK >= 15000;
              const canCharter = hasInboundRoute && hasEnoughSlots && hasEnoughCash;

              const tooltipMsg = !hasInboundRoute
                ? `Charter Hub: Requires at least 1 active flight connecting to ${city.name} from your network.`
                : !hasEnoughSlots
                ? `Charter Hub: Requires holding at least 10 landing slots (currently ${slotsOwned}/10). Negotiate more slots first.`
                : !hasEnoughCash
                ? `Charter Hub: Requires $15,000K treasury funds (currently have $${playerAirline.cashK.toLocaleString()}K).`
                : `Charter ${city.name} as an Official Regional Hub ($15M). Grants +15 bonus landing slots and unlocks spoke routes across this continent with +18% connecting transit bonus!`;

              const buttonLabel = !hasInboundRoute
                ? 'Hub: Need Inbound Flight'
                : !hasEnoughSlots
                ? `Hub: Need 10 Slots (${slotsOwned}/10)`
                : !hasEnoughCash
                ? 'Hub: Need $15M'
                : 'Charter Hub ($15M • +15 Slots)';

              return (
                <button
                  type="button"
                  disabled={!canCharter}
                  onClick={() => onEstablishHub?.(city.id, 15000)}
                  title={tooltipMsg}
                  className={`px-4 py-2 rounded-xl font-black text-xs md:text-sm shadow-xl transition-all border flex items-center gap-1.5 ${
                    canCharter
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white border-sky-400 cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(56,189,248,0.35)]'
                      : 'bg-slate-900/90 text-slate-400 border-slate-700/80 cursor-not-allowed opacity-80'
                  }`}
                >
                  <span>🌐</span>
                  <span>{buttonLabel}</span>
                </button>
              );
            })()}

            {isHub && !isHQ && (
              <div className="px-3 py-1.5 rounded-xl bg-sky-950/90 border border-sky-400 text-sky-300 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
                <span>🌐</span>
                <span>Regional Hub (+18% Transit Boost)</span>
              </div>
            )}

            {/* HQ Operations Button (David Sterling) */}
            <button
              onClick={() => setShowHQOperations(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-600 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>HQ Director</span>
            </button>
          </div>
        </div>

        {/* 4. CONFIRMATION POPUP OVERLAY (Prevents Accidental Buys & Lets Player Select Envoy!) */}
        {pendingMission && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
            <div className="bg-slate-900 border-2 border-sky-400 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-sky-400" />
                  <h3 className="font-black text-base text-white">
                    Confirm Diplomatic Delegation Dispatch
                  </h3>
                </div>
                <button
                  onClick={() => setPendingMission(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mission Summary Card */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Objective:</span>
                  <span className="font-black text-white text-sm">
                    {pendingMission.type === 'SLOT_NEGOTIATION'
                      ? `+${pendingMission.requestedSlots} Airport Slots in ${city.name}`
                      : `${pendingMission.ventureName}`}
                  </span>
                </div>

                {pendingMission.type === 'SLOT_NEGOTIATION' && limits.maxRequestableSlots > 0 && (
                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold uppercase font-mono text-[10px]">
                        Adjust Requested Slots:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={(pendingMission.requestedSlots || 10) <= limits.minSlots}
                          onClick={() =>
                            handleUpdatePendingSlots(
                              (pendingMission.requestedSlots || 10) -
                                ((pendingMission.requestedSlots || 10) > 10 ? 5 : 1)
                            )
                          }
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white border border-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="font-mono text-sm font-black text-emerald-400 min-w-[36px] text-center">
                          +{pendingMission.requestedSlots}
                        </span>

                        <button
                          type="button"
                          disabled={(pendingMission.requestedSlots || 10) >= limits.maxRequestableSlots}
                          onClick={() =>
                            handleUpdatePendingSlots(
                              (pendingMission.requestedSlots || 10) +
                                ((pendingMission.requestedSlots || 10) >= 10 ? 5 : 1)
                            )
                          }
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white border border-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {limits.presetOptions.map((preset) => {
                        const isSelected = pendingMission.requestedSlots === preset;
                        const isMax = preset === limits.maxRequestableSlots;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleUpdatePendingSlots(preset)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition cursor-pointer border ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {isMax ? `Max (${preset})` : `+${preset}`}
                          </button>
                        );
                      })}
                    </div>

                    {limits.isAntiMonopolyActive && limits.antiMonopolyReason && (
                      <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/60 text-purple-200 text-[11px] flex items-start gap-1.5 leading-snug">
                        <Scale className="w-3.5 h-3.5 text-purple-300 shrink-0 mt-0.5" />
                        <span>{limits.antiMonopolyReason}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Negotiation Duration:</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {pendingMission.quartersRemaining} Quarter{pendingMission.quartersRemaining > 1 ? 's' : ''} ({pendingMission.quartersRemaining * 3} Months)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Delegation Cost:</span>
                  <span className="font-black text-emerald-400 font-mono text-sm">
                    ${pendingMission.costK.toLocaleString()}K
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-500">Remaining Treasury After:</span>
                  <span className="font-mono text-slate-300">
                    ${(playerAirline.cashK - pendingMission.costK).toLocaleString()}K
                  </span>
                </div>
              </div>

              {/* Assign Envoy Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2 font-mono uppercase">
                  Select Available Envoy To Dispatch:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableFieldNegotiators.map((neg) => {
                    const isSelected = selectedEnvoyId === neg.id;

                    return (
                      <button
                        key={neg.id}
                        type="button"
                        onClick={() => setSelectedEnvoyId(neg.id)}
                        className={`p-2 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-left ${
                          isSelected
                            ? 'bg-blue-600/30 border-sky-400 shadow-md ring-2 ring-sky-400/50'
                            : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <NegotiatorAvatar avatarId={neg.avatarId} size="sm" className="w-9 h-10 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate">{neg.name}</div>
                          <div className="text-[10px] text-emerald-400 font-mono">Ready to Go</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setPendingMission(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedEnvoyId || playerAirline.cashK < pendingMission.costK}
                  onClick={handleConfirmDispatch}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl font-black text-xs shadow-lg transition active:scale-95 border border-emerald-400 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Dispatch</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. HQ OPERATIONS POPUP (David Sterling - Slot Return & Venture Liquidation) */}
        {showHQOperations && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
            <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <NegotiatorAvatar avatarId={hqDirector.avatarId} size="sm" className="w-9 h-10" />
                  <div>
                    <h3 className="font-black text-sm text-white">HQ Operations: {hqDirector.name}</h3>
                    <div className="text-[10px] text-amber-400 font-mono">Permanent Home Office Desk</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowHQOperations(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                &quot;I can instantly process regulatory surrenders or subsidiary liquidations in{' '}
                <strong>{city.name}</strong> directly from head office without dispatch delays.&quot;
              </p>

              <div className="space-y-3 pt-1">
                {/* Surrender Slots */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Surrender Unused Slots</div>
                    <div className="text-[11px] text-slate-400">Currently owned: {slotsOwned} slots</div>
                  </div>
                  <button
                    disabled={slotsOwned < 5 || !onInstantReturnSlots}
                    onClick={() => {
                      if (onInstantReturnSlots) onInstantReturnSlots(city.id, 5);
                      setShowHQOperations(false);
                    }}
                    className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 disabled:opacity-30 text-rose-200 rounded-lg font-bold text-xs border border-rose-700 transition cursor-pointer"
                  >
                    Return 5 Slots
                  </button>
                </div>

                {/* Divest Business Ventures */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Liquidate Local Venture</div>
                    <div className="text-[11px] text-slate-400">
                      Owned: {playerBusinessesInCity.length} in {city.name}
                    </div>
                  </div>
                  {playerBusinessesInCity.length > 0 && onInstantSellBusiness ? (
                    <button
                      onClick={() => {
                        const b = playerBusinessesInCity[0];
                        onInstantSellBusiness(b.id, Math.round(b.purchaseCostK * 0.75));
                        setShowHQOperations(false);
                      }}
                      className="px-3 py-1.5 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded-lg font-bold text-xs border border-amber-700 transition cursor-pointer"
                    >
                      Sell 1 Venture (75%)
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">None Owned</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowHQOperations(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Standardized Modal Footer */}
        <div className="bg-slate-950 px-5 sm:px-6 py-3 border-t border-slate-800 flex justify-between items-center text-xs font-mono shrink-0">
          <div className="text-slate-400">
            {city.name} ({city.id}) • {city.country} • Regional Metro
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold font-mono transition cursor-pointer border border-slate-700 shadow flex items-center gap-2 active:scale-95"
            data-testid="modal-close-footer-btn"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>Close (ปิดหน้าต่าง)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
