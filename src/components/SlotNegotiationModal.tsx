import React, { useState } from 'react';
import { Airline, NegotiatorMission, City, GameState, AirportExpansionNotice, OngoingAirportExpansion } from '../types/game';
import { CITIES, REGIONS } from '../data/cities';
import {
  calculateNegotiationQuarters,
  calculateNegotiationCostK,
  calculateSlotNegotiationLimits,
} from '../data/negotiators';
import { NegotiatorAvatar } from './NegotiatorAvatar';
import { X, Handshake, Clock, CheckCircle2, KeyRound, Building2, Plus, Minus, Scale, AlertTriangle, Hammer } from 'lucide-react';

interface SlotNegotiationModalProps {
  playerAirline: Airline;
  onClose: () => void;
  onDispatchNegotiator: (negotiatorId: string, mission: NegotiatorMission) => void;
  onEstablishHub: (cityId: string, costK: number) => void;
  initialCityId?: string;
  gameState?: GameState;
}

export const SlotNegotiationModal: React.FC<SlotNegotiationModalProps> = ({
  playerAirline,
  onClose,
  onDispatchNegotiator,
  onEstablishHub,
  initialCityId,
  gameState,
}) => {
  const initialCity = initialCityId ? CITIES.find((c) => c.id === initialCityId) : null;
  const [selectedRegion, setSelectedRegion] = useState<string>(
    initialCity ? initialCity.region : 'ALL'
  );

  const fieldNegotiators = (playerAirline.negotiators || []).filter((n) => n.role === 'FIELD');
  const availableNegotiators = fieldNegotiators.filter((n) => n.status === 'AVAILABLE');

  // Currently selected negotiator for dispatches (default to first available)
  const [selectedNegId, setSelectedNegId] = useState<string>(
    availableNegotiators[0]?.id || fieldNegotiators[0]?.id || 'NEG_JOHN'
  );

  // User-selected requested slots per city (overrides recommended slots)
  const [requestedSlotsByCity, setRequestedSlotsByCity] = useState<Record<string, number>>({});

  const handleSetCitySlots = (cityId: string, count: number, min: number, max: number) => {
    const clamped = Math.max(min, Math.min(max, count));
    setRequestedSlotsByCity((prev) => ({
      ...prev,
      [cityId]: clamped,
    }));
  };

  const filteredCities = CITIES.filter((c) => {
    return selectedRegion === 'ALL' || c.region === selectedRegion;
  });

  const homeCity = CITIES.find((c) => c.id === playerAirline.homeCityId) || CITIES[0];
  const allAirlines = gameState?.airlines || [playerAirline];

  const handleDispatch = (city: City, chosenSlots: number) => {
    if (availableNegotiators.length === 0) return;

    const quarters = calculateNegotiationQuarters(homeCity, city);
    const costK = calculateNegotiationCostK(city, chosenSlots);
    if (playerAirline.cashK < costK) return;

    const mission: NegotiatorMission = {
      type: 'SLOT_NEGOTIATION',
      targetCityId: city.id,
      targetCityName: city.name,
      requestedSlots: chosenSlots,
      costK: costK,
      quartersRemaining: quarters,
      totalQuarters: quarters,
    };

    onDispatchNegotiator(selectedNegId, mission);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-5">
      <div className="bg-slate-900 border-2 border-slate-600 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-900/70 border border-emerald-400">
              <Handshake className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-100">
                Diplomatic Slot Treaties & Bilateral Affairs
              </h2>
              <div className="text-xs text-emerald-300">
                Available Field Delegates: {availableNegotiators.length} of 4 Available
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Delegate Selection Bar */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase">Assign Envoy:</span>
            <div className="flex items-center gap-2">
              {fieldNegotiators.map((neg) => {
                const isSelected = selectedNegId === neg.id;
                const isAvail = neg.status === 'AVAILABLE';

                return (
                  <button
                    key={neg.id}
                    onClick={() => isAvail && setSelectedNegId(neg.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-sky-300 shadow'
                        : isAvail
                        ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                        : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
                    }`}
                  >
                    <NegotiatorAvatar avatarId={neg.avatarId} size="sm" className="w-5 h-5" />
                    <span>{neg.name.split(' ')[0]}</span>
                    {!isAvail && (
                      <span className="text-[10px] text-amber-400">
                        ({neg.currentMission?.quartersRemaining}Q)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Treasury: <strong className="text-emerald-400 font-mono">${playerAirline.cashK.toLocaleString()}K</strong>
          </div>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-2 p-3 bg-slate-950 border-b border-slate-800 overflow-x-auto text-xs shrink-0">
          <span className="text-slate-400 font-bold px-2 whitespace-nowrap">Filter:</span>
          <button
            onClick={() => setSelectedRegion('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition ${
              selectedRegion === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Regions
          </button>
          {REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRegion(r.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition ${
                selectedRegion === r.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>

        {/* City Slots Table */}
        <div className="p-6 overflow-y-auto space-y-3 text-sm flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCities.map((city) => {
              const currentSlots = playerAirline.slots[city.id] || 0;
              const totalAirportCap = gameState?.airportSlots?.[city.id] ?? city.baseSlots;
              const totalAllocated = allAirlines.reduce(
                (sum: number, a: Airline) => sum + (a.slots[city.id] || 0),
                0
              );
              const remainingFreeSlots = Math.max(0, totalAirportCap - totalAllocated);
              const isAirportFull = remainingFreeSlots <= 0;
              const isCongested = !isAirportFull && (remainingFreeSlots <= 15 || totalAllocated / totalAirportCap >= 0.75);
              const recentExpansion = gameState?.airportExpansions?.find(
                (e: AirportExpansionNotice) => e.cityId === city.id
              );
              const ongoingExpansion = gameState?.ongoingAirportExpansions?.find(
                (e: OngoingAirportExpansion) => e.cityId === city.id
              );

              const isHub = playerAirline.hubCityIds.includes(city.id) || playerAirline.homeCityId === city.id;
              const isHome = playerAirline.homeCityId === city.id;

              const limits = calculateSlotNegotiationLimits(
                city,
                totalAirportCap,
                totalAllocated,
                currentSlots,
                isHome,
                isHub,
                recentExpansion?.addedSlots || 0,
                allAirlines.length || 4
              );

              const chosenSlots = Math.min(
                limits.maxRequestableSlots,
                Math.max(
                  limits.minSlots,
                  requestedSlotsByCity[city.id] ?? limits.recommendedSlots
                )
              );

              const quarters = calculateNegotiationQuarters(homeCity, city);
              const costK = calculateNegotiationCostK(city, chosenSlots);
              const hubCostK = 15000;

              const canAffordSlots = playerAirline.cashK >= costK;
              const canAffordHub = playerAirline.cashK >= hubCostK;
              const isMaxed = currentSlots >= totalAirportCap || isAirportFull || limits.maxRequestableSlots <= 0;

              // Check if currently negotiating this city
              const activeMission = fieldNegotiators.find(
                (n) => n.status === 'DISPATCHED' && n.currentMission?.targetCityId === city.id
              );

              return (
                <div
                  key={city.id}
                  className="bg-slate-800/90 border border-slate-700/90 hover:border-slate-600 rounded-2xl p-4 flex flex-col justify-between shadow-lg gap-3 transition-all"
                >
                  {/* Top: City info & badges */}
                  <div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-base text-slate-100">{city.name}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-900 text-sky-300 font-bold border border-slate-700">
                          {city.id}
                        </span>
                        {isHome && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500 font-bold">
                            HQ
                          </span>
                        )}
                        {isHub && !isHome && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500 font-bold">
                            HUB
                          </span>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ongoingExpansion && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500 font-bold flex items-center gap-1 animate-pulse">
                            <Hammer className="w-3 h-3" />
                            <span>+{ongoingExpansion.addedSlots} in {ongoingExpansion.quartersRemaining}Q ({ongoingExpansion.quartersRemaining * 3}mo)</span>
                          </span>
                        )}
                        {recentExpansion && !ongoingExpansion && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500 font-bold">
                            🏗️ +{recentExpansion.addedSlots} Expanded
                          </span>
                        )}
                        {limits.isAntiMonopolyActive && !isAirportFull && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500 font-bold flex items-center gap-1">
                            <Scale className="w-3 h-3" />
                            <span>Fair-Share: Max {limits.maxRequestableSlots}</span>
                          </span>
                        )}
                        {isCongested && !isAirportFull && !ongoingExpansion && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500 font-bold">
                            ⚠️ Congested ({remainingFreeSlots} left)
                          </span>
                        )}
                        {isAirportFull && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500 font-bold">
                            ⛔ Airport Full
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subtitle / Country */}
                    <div className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                      <span>{city.country}</span>
                      <span>•</span>
                      <span>
                        Owned: <strong className="text-emerald-400 font-mono text-sm">{currentSlots}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Capacity:{' '}
                        <strong className="text-sky-300 font-mono">
                          {totalAllocated} / {totalAirportCap}
                        </strong>{' '}
                        <span className="text-[11px] text-slate-400">({remainingFreeSlots} free)</span>
                      </span>
                    </div>

                    {/* Capacity visual bar */}
                    <div className="w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden mt-2 border border-slate-800 flex">
                      <div
                        className="bg-sky-500 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((totalAllocated / totalAirportCap) * 100))}%` }}
                      />
                    </div>

                    {/* Anti-Monopoly Explanation Banner if active */}
                    {limits.isAntiMonopolyActive && limits.antiMonopolyReason && !isAirportFull && (
                      <div className="mt-2 p-2 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-200 text-[11px] flex items-start gap-1.5 leading-snug">
                        <Scale className="w-3.5 h-3.5 text-purple-300 shrink-0 mt-0.5" />
                        <span>{limits.antiMonopolyReason}</span>
                      </div>
                    )}

                    {/* Ongoing expansion banner */}
                    {ongoingExpansion && (
                      <div className="mt-2 p-2 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-200 text-[11px] flex items-start gap-1.5 leading-snug">
                        <Hammer className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{ongoingExpansion.reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Middle: Flexible Slot Selector & Stepper */}
                  {!isMaxed && !activeMission && limits.maxRequestableSlots > 0 && (
                    <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-700/60 space-y-2 mt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-bold uppercase font-mono text-[10px]">
                          Requested Slots:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={chosenSlots <= limits.minSlots}
                            onClick={() =>
                              handleSetCitySlots(
                                city.id,
                                chosenSlots - (chosenSlots > 10 ? 5 : 1),
                                limits.minSlots,
                                limits.maxRequestableSlots
                              )
                            }
                            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white border border-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className="font-mono text-sm font-black text-emerald-400 min-w-[36px] text-center">
                            +{chosenSlots}
                          </span>

                          <button
                            type="button"
                            disabled={chosenSlots >= limits.maxRequestableSlots}
                            onClick={() =>
                              handleSetCitySlots(
                                city.id,
                                chosenSlots + (chosenSlots >= 10 ? 5 : 1),
                                limits.minSlots,
                                limits.maxRequestableSlots
                              )
                            }
                            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white border border-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Preset Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {limits.presetOptions.map((preset) => {
                          const isSelected = chosenSlots === preset;
                          const isMax = preset === limits.maxRequestableSlots;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() =>
                                handleSetCitySlots(
                                  city.id,
                                  preset,
                                  limits.minSlots,
                                  limits.maxRequestableSlots
                                )
                              }
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

                      {/* Cost & Quarters readout */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                        <span className="text-amber-300 font-mono">
                          ⏱️ {quarters} Quarter{quarters > 1 ? 's' : ''} ({quarters * 3} mo)
                        </span>
                        <span className="text-emerald-400 font-mono font-bold">
                          Cost: ${costK.toLocaleString()}K
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions Deck */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 flex-wrap">
                    {/* Hub Charter button */}
                    {!isHome && (
                      isHub ? (
                        <div className="px-2.5 py-1 bg-sky-950/80 border border-sky-400 text-sky-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                          <span>🌐</span>
                          <span>Hub Active (+18%)</span>
                        </div>
                      ) : (() => {
                        const hasInboundRoute = (gameState?.routes || []).some(
                          (r) => r.airlineId === playerAirline.id && (r.originCityId === city.id || r.destCityId === city.id)
                        );
                        const hasEnoughSlots = currentSlots >= 10;
                        const canCharter = hasInboundRoute && hasEnoughSlots && canAffordHub;

                        const tooltipMsg = !hasInboundRoute
                          ? `Requires an active flight route connecting to ${city.name} before chartering a Regional Hub`
                          : !hasEnoughSlots
                          ? `Requires at least 10 slots (currently ${currentSlots}/10)`
                          : !canAffordHub
                          ? `Requires $15,000K (currently have $${playerAirline.cashK.toLocaleString()}K)`
                          : 'Charter Regional Hub ($15M • +15 Bonus Slots & Unlock Spoke Routes across this continent)';

                        const buttonLabel = !hasInboundRoute
                          ? 'Hub: Need Route'
                          : !hasEnoughSlots
                          ? `Hub: ${currentSlots}/10 Slots`
                          : !canAffordHub
                          ? 'Hub: Need $15M'
                          : 'Charter Hub ($15M • +15 Slots)';

                        return (
                          <button
                            disabled={!canCharter}
                            onClick={() => onEstablishHub(city.id, hubCostK)}
                            title={tooltipMsg}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow border flex items-center gap-1 transition ${
                              canCharter
                                ? 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white border-sky-400 cursor-pointer active:scale-95'
                                : 'bg-slate-900 text-slate-400 border-slate-700 cursor-not-allowed opacity-75'
                            }`}
                          >
                            <span>🌐</span>
                            <span>{buttonLabel}</span>
                          </button>
                        );
                      })()
                    )}

                    {/* Dispatch Envoy Button */}
                    <div className="ml-auto">
                      {activeMission ? (
                        <div className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {activeMission.currentMission?.quartersRemaining}Q Left ({activeMission.name.split(' ')[0]})
                          </span>
                        </div>
                      ) : (
                        <button
                          disabled={
                            !canAffordSlots ||
                            isMaxed ||
                            availableNegotiators.length === 0
                          }
                          onClick={() => handleDispatch(city, chosenSlots)}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl font-bold text-xs md:text-sm shadow transition-all active:scale-95 border border-emerald-500 cursor-pointer flex items-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {isAirportFull
                              ? 'Airport Full'
                              : isMaxed
                              ? 'Max Slots'
                              : `Dispatch Envoy (${chosenSlots} Slots • $${costK.toLocaleString()}K)`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
