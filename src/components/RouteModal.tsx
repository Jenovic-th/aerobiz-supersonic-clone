import React, { useState, useMemo, useEffect } from 'react';
import { City, Airline, Route } from '../types/game';
import { CITIES } from '../data/cities';
import { AIRCRAFTS } from '../data/aircrafts';
import { calculateDistance, calculateBaseFare, calculateRouteDemand, simulateRoutePerformance } from '../simulation/engine';
import { X, Plane, AlertCircle, AlertTriangle, CheckCircle2, ShoppingCart, ArrowRight, Compass } from 'lucide-react';
import { AircraftVisual } from './AircraftVisual';
import { getAircraftPhotoInfo } from '../data/aircraftVisuals';

interface RouteModalProps {
  playerAirline: Airline;
  onClose: () => void;
  onAddRoute: (newRoute: Route) => void;
  onOpenAircraftShop?: () => void;
  initialOriginCity?: City | null;
  fuelPriceIndex: number;
  currentYear: number;
  currentQuarter: 1 | 2 | 3 | 4;
}

export const RouteModal: React.FC<RouteModalProps> = ({
  playerAirline,
  onClose,
  onAddRoute,
  onOpenAircraftShop,
  initialOriginCity,
  fuelPriceIndex,
  currentYear,
  currentQuarter,
}) => {
  // Cities where player has at least 1 slot
  const accessibleCities = useMemo(() => {
    return CITIES.filter((c) => (playerAirline.slots[c.id] || 0) > 0);
  }, [playerAirline]);

  const defaultOrigin = initialOriginCity?.id || playerAirline.homeCityId;
  const [originId, setOriginId] = useState<string>(defaultOrigin);

  useEffect(() => {
    if (initialOriginCity) {
      setOriginId(initialOriginCity.id);
    }
  }, [initialOriginCity]);

  const [destId, setDestId] = useState<string>(() => {
    const candidate = accessibleCities.find((c) => c.id !== defaultOrigin);
    return candidate ? candidate.id : (accessibleCities[1]?.id || 'TYO');
  });

  // Handle changing Origin: Ensure destination never matches origin
  const handleOriginChange = (newOrigin: string) => {
    setOriginId(newOrigin);
    if (destId === newOrigin) {
      const altDest = accessibleCities.find((c) => c.id !== newOrigin);
      if (altDest) {
        setDestId(altDest.id);
      }
    }
  };

  const originCity = CITIES.find((c) => c.id === originId) || accessibleCities[0] || CITIES[0];
  const destCity = CITIES.find((c) => c.id === destId) || accessibleCities.find((c) => c.id !== originCity.id) || CITIES[1];
  const distance = calculateDistance(originCity.lat, originCity.lon, destCity.lat, destCity.lon);
  const baseFare = calculateBaseFare(distance);

  // Available (unassigned) planes in fleet
  const idleFleet = useMemo(() => {
    return playerAirline.fleet.filter((f) => f.assignedRouteId === null);
  }, [playerAirline]);

  // STRICT FILTER: Only show planes whose certified range is >= distance
  const capableFleet = useMemo(() => {
    return idleFleet.filter((plane) => {
      const model = AIRCRAFTS.find((a) => a.id === plane.modelId);
      return model && model.rangeKm >= distance;
    });
  }, [idleFleet, distance]);

  // Selected aircraft instance ID
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>(
    capableFleet[0]?.instanceId || ''
  );

  // Auto-synchronize selection whenever destination or distance changes
  useEffect(() => {
    const isCurrentCapable = capableFleet.some((f) => f.instanceId === selectedInstanceId);
    if (!isCurrentCapable) {
      setSelectedInstanceId(capableFleet[0]?.instanceId || '');
    }
  }, [capableFleet, selectedInstanceId]);

  const [weeklyFrequency, setWeeklyFrequency] = useState<number>(7);
  const [priceModifierPct, setPriceModifierPct] = useState<number>(0);

  const effectivePrice = Math.round(baseFare * (1 + priceModifierPct / 100));

  const selectedInstance = playerAirline.fleet.find((f) => f.instanceId === selectedInstanceId);
  const aircraftModel = selectedInstance ? AIRCRAFTS.find((a) => a.id === selectedInstance.modelId) : null;
  const isRangeValid = aircraftModel ? aircraftModel.rangeKm >= distance : false;

  // Max flights allowed by airport slots
  const originSlots = playerAirline.slots[originId] || 0;
  const destSlots = playerAirline.slots[destId] || 0;
  const maxWeeklyFlights = Math.min(14, originSlots, destSlots);

  // Maximum range among idle planes (for clear guidance when capableFleet is empty)
  const maxIdleFleetRange = useMemo(() => {
    if (idleFleet.length === 0) return 0;
    const ranges = idleFleet.map((f) => AIRCRAFTS.find((a) => a.id === f.modelId)?.rangeKm || 0);
    return Math.max(...ranges);
  }, [idleFleet]);

  // Models currently available in the market that can fly this distance
  const marketCapableModels = useMemo(() => {
    return AIRCRAFTS.filter((a) => {
      const inService = a.introYear <= currentYear && (!a.retireYear || a.retireYear >= currentYear);
      return inService && a.rangeKm >= distance;
    }).sort((a, b) => a.priceK - b.priceK);
  }, [distance, currentYear]);

  // Live simulation estimate
  const estimate = useMemo(() => {
    if (!aircraftModel || !isRangeValid || maxWeeklyFlights <= 0) return null;
    const dummyRoute: Route = {
      id: 'temp',
      airlineId: playerAirline.id,
      originCityId: originId,
      destCityId: destId,
      assignedAircraftIds: [selectedInstanceId],
      weeklyFrequency: Math.min(weeklyFrequency, maxWeeklyFlights),
      priceModifierPct,
      serviceQuality: 1.0,
      status: 'ACTIVE',
    };
    const demand = calculateRouteDemand(originCity, destCity, currentYear, currentQuarter, []);
    const res = simulateRoutePerformance(
      dummyRoute,
      originCity,
      destCity,
      aircraftModel,
      selectedInstance,
      currentQuarter,
      fuelPriceIndex,
      demand
    );
    return res.stats;
  }, [
    originCity,
    destCity,
    aircraftModel,
    selectedInstance,
    isRangeValid,
    weeklyFrequency,
    maxWeeklyFlights,
    priceModifierPct,
    fuelPriceIndex,
    currentYear,
    currentQuarter,
  ]);

  const handleLaunch = () => {
    if (!selectedInstance || !aircraftModel || !isRangeValid || maxWeeklyFlights <= 0) return;

    const basePax = estimate?.passengers ?? Math.round(aircraftModel.capacity * weeklyFrequency * 12 * 0.82);
    const baseCap = estimate?.capacity ?? aircraftModel.capacity * weeklyFrequency * 12;
    const baseRev = estimate?.revenueK ?? Math.round((basePax * effectivePrice) / 1000);
    const baseExp = estimate?.expensesK ?? Math.round(baseRev * 0.55);

    const newRoute: Route = {
      id: `ROUTE_${Date.now()}`,
      airlineId: playerAirline.id,
      originCityId: originId,
      destCityId: destId,
      assignedAircraftIds: [selectedInstanceId],
      weeklyFrequency: Math.min(weeklyFrequency, maxWeeklyFlights),
      priceModifierPct,
      serviceQuality: 1.0,
      status: 'ACTIVE',
      lastQuarterStats: {
        passengers: basePax,
        capacity: baseCap,
        loadFactorPct: Math.round((basePax / baseCap) * 100),
        revenueK: baseRev,
        expensesK: baseExp,
        profitK: baseRev - baseExp,
        actualFlightsCompleted: Math.min(weeklyFrequency, maxWeeklyFlights) * 12,
        scheduledFlights: Math.min(weeklyFrequency, maxWeeklyFlights) * 12,
      },
    };

    onAddRoute(newRoute);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-3 md:p-4 select-none">
      <div className="bg-slate-900 border-2 border-slate-600 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400 text-sky-400 shadow">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-100 flex items-center gap-2">
                <span>Open New Commercial Flight Route</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400">
                  ESTABLISH ROUTE
                </span>
              </h2>
              <div className="text-xs text-sky-300/80 font-mono">
                Connect International Air Hubs & Assign Aircraft
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-4 md:space-y-5 text-sm text-slate-200">
          {/* Origin & Destination Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/90 p-4 rounded-2xl border border-slate-700 shadow-md">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 text-xs md:text-sm font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                Departure (Origin Hub)
              </label>
              <select
                value={originId}
                onChange={(e) => handleOriginChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3.5 py-2.5 text-slate-100 font-bold text-sm focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {accessibleCities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} ({city.id}) — Slots: {playerAirline.slots[city.id] || 0}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5 text-xs md:text-sm font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Arrival (Destination City)
              </label>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3.5 py-2.5 text-slate-100 font-bold text-sm focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {accessibleCities
                  .filter((c) => c.id !== originId)
                  .map((city) => {
                    const distToCity = calculateDistance(originCity.lat, originCity.lon, city.lat, city.lon);
                    const hasCapablePlane = idleFleet.some((f) => {
                      const m = AIRCRAFTS.find((a) => a.id === f.modelId);
                      return m && m.rangeKm >= distToCity;
                    });

                    return (
                      <option key={city.id} value={city.id}>
                        {city.name} ({city.id}) — {distToCity.toLocaleString()} km [Slots: {playerAirline.slots[city.id] || 0}] {hasCapablePlane ? '✓ Flyable' : '⚠️ Need Long-Range'}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Flight Metrics Summary Bar */}
            <div className="col-span-1 md:col-span-2 flex flex-wrap justify-between items-center text-xs md:text-sm text-slate-300 border-t border-slate-700/80 pt-3 gap-2 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Corridor Distance:</span>
                <span className="font-black text-amber-300 text-sm md:text-base">
                  {distance.toLocaleString()} km
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Standard Base Fare:</span>
                <span className="font-black text-emerald-400 text-sm md:text-base">
                  ${baseFare}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Airport Slot Clearance:</span>
                <span className={`font-bold ${maxWeeklyFlights > 0 ? 'text-sky-300' : 'text-rose-400'}`}>
                  Max {maxWeeklyFlights} flights/week
                </span>
              </div>
            </div>
          </div>

          {/* Aircraft Selection Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-200 font-black text-sm md:text-base font-mono flex items-center gap-2">
                <span>Assign Capable Aircraft from Available Fleet</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/60 font-bold">
                  {capableFleet.length} Aircraft Qualified
                </span>
              </label>

              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Required Certified Range: ≥ {distance.toLocaleString()} km
              </span>
            </div>

            {/* CONDITION 1: Capable aircraft exist in fleet */}
            {capableFleet.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {capableFleet.map((plane) => {
                  const model = AIRCRAFTS.find((a) => a.id === plane.modelId);
                  if (!model) return null;
                  const isSelected = plane.instanceId === selectedInstanceId;

                      const planePhoto = getAircraftPhotoInfo(model);

                      return (
                        <div
                          key={plane.instanceId}
                          onClick={() => setSelectedInstanceId(plane.instanceId)}
                          className={`p-3.5 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-950/80 border-sky-400 shadow-xl text-white'
                              : 'bg-slate-800/90 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-20 h-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative shadow shrink-0">
                              <img
                                src={planePhoto.photoUrl}
                                alt={model.model}
                                className="w-full h-full object-cover object-center filter brightness-105"
                              />
                              {model.isSupersonic && (
                                <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black font-mono text-[8px]">
                                  SST
                                </span>
                              )}
                            </div>
                        <div>
                          <div className="font-black text-base text-slate-100 flex items-center gap-2">
                            <span>{model.model}</span>
                            {isSelected && (
                              <span className="px-2 py-0.2 rounded bg-sky-500 text-slate-950 text-[10px] font-mono font-black">
                                SELECTED
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-300 mt-0.5 font-mono">
                            Capacity: <strong className="text-sky-300">{model.capacity} seats</strong> • Speed: {model.speedKmh} km/h • Certified Range:{' '}
                            <strong className="text-emerald-400 font-mono">{model.rangeKm.toLocaleString()} km</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500 font-bold font-mono flex items-center gap-1.5 shadow">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Range Certified</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : idleFleet.length === 0 ? (
              /* CONDITION 2: Fleet has 0 idle aircraft */
              <div className="p-5 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border-2 border-amber-500/80 rounded-2xl text-slate-200 space-y-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-black text-amber-300 text-sm md:text-base font-mono">
                      All Company Aircraft Currently Deployed
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      All {playerAirline.fleet.length} aircraft in your company fleet are currently assigned to active commercial rotations.
                    </p>
                  </div>
                </div>

                {onOpenAircraftShop && (
                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={onOpenAircraftShop}
                      className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl font-bold text-xs md:text-sm font-mono flex items-center gap-2 shadow-lg cursor-pointer border border-sky-400"
                    >
                      <ShoppingCart className="w-4 h-4 text-sky-200" />
                      <span>Open Aircraft Market to Purchase Airframe</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* CONDITION 3: Player has idle aircraft, but NONE can reach this distance */
              <div className="p-5 bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/60 border-2 border-rose-500/80 rounded-2xl text-slate-200 space-y-3.5 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-300 shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-rose-300 text-sm md:text-base font-mono flex items-center gap-2">
                      <span>No Aircraft in Fleet with Required Range ({distance.toLocaleString()} km)</span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      You have <strong className="text-white">{idleFleet.length} idle aircraft</strong> in your hangar, but their maximum flight range is only{' '}
                      <strong className="text-amber-300 font-mono">{maxIdleFleetRange.toLocaleString()} km</strong>, which is insufficient to fly this{' '}
                      <strong className="text-rose-300 font-mono">{distance.toLocaleString()} km</strong> corridor. Incapable aircraft have been filtered out.
                    </p>
                  </div>
                </div>

                {/* Market Recommendations for this route */}
                {marketCapableModels.length > 0 && (
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2 font-mono">
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-sky-400" />
                      <span>Aircraft in Market Qualified for this Distance (Year {currentYear}):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {marketCapableModels.slice(0, 4).map((m) => (
                        <div
                          key={m.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs flex items-center gap-2"
                        >
                          <span className="font-bold text-slate-100">{m.model}</span>
                          <span className="text-[10px] text-emerald-400">{m.rangeKm.toLocaleString()} km</span>
                          <span className="text-[10px] text-slate-400">${m.priceK.toLocaleString()}K</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {onOpenAircraftShop && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
                    <span className="text-xs text-slate-400 font-mono">
                      Acquire a long-haul airframe to unlock this lucrative route:
                    </span>
                    <button
                      onClick={onOpenAircraftShop}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs md:text-sm font-mono flex items-center gap-2 shadow-xl cursor-pointer border border-emerald-400"
                    >
                      <ShoppingCart className="w-4 h-4 text-emerald-200" />
                      <span>Go to Aircraft Market to Buy Capable Aircraft</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Weekly Frequency & Ticket Price Sliders (Rendered when capable aircraft is available) */}
          {capableFleet.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div>
                <div className="flex justify-between mb-1.5 text-sm font-mono">
                  <span className="font-bold text-slate-200">Weekly Flight Frequency:</span>
                  <span className="font-black text-sky-400 text-base">
                    {weeklyFrequency} flights / week
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={Math.max(1, maxWeeklyFlights)}
                  value={weeklyFrequency}
                  onChange={(e) => setWeeklyFrequency(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer h-2.5 bg-slate-700 rounded-lg"
                />
                <div className="text-xs text-slate-400 mt-1.5 font-mono">
                  Origin slots: {originSlots} • Dest slots: {destSlots} (Max permitted: {maxWeeklyFlights}/wk)
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5 text-sm font-mono">
                  <span className="font-bold text-slate-200">Ticket Fare Price:</span>
                  <span
                    className={`font-black text-base ${
                      priceModifierPct > 0
                        ? 'text-amber-400'
                        : priceModifierPct < 0
                        ? 'text-emerald-400'
                        : 'text-slate-100'
                    }`}
                  >
                    ${effectivePrice} ({priceModifierPct > 0 ? `+${priceModifierPct}` : priceModifierPct}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={priceModifierPct}
                  onChange={(e) => setPriceModifierPct(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-2.5 bg-slate-700 rounded-lg"
                />
                <div className="text-xs text-slate-400 mt-1.5 flex justify-between font-mono">
                  <span>-50% (Discount)</span>
                  <span>Base (${baseFare})</span>
                  <span>+50% (Premium)</span>
                </div>
              </div>
            </div>
          )}

          {/* Live Simulation Projection Box */}
          {estimate && capableFleet.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-2xl border-2 border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-3 text-center shadow-inner">
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-0.5 font-mono">Quarterly Capacity</div>
                <div className="font-black text-slate-100 font-mono text-base">
                  {estimate.capacity.toLocaleString()} seats
                </div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-0.5 font-mono">Est. Passengers</div>
                <div className="font-black text-sky-400 font-mono text-base">
                  {estimate.passengers.toLocaleString()} ({estimate.loadFactorPct}%)
                </div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-0.5 font-mono">Est. Revenue</div>
                <div className="font-black text-emerald-400 font-mono text-base">
                  +${estimate.revenueK.toLocaleString()}K
                </div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-0.5 font-mono">Est. Net Profit</div>
                <div
                  className={`font-black font-mono text-lg ${
                    estimate.profitK >= 0 ? 'text-emerald-300' : 'text-rose-400'
                  }`}
                >
                  {estimate.profitK >= 0
                    ? `+$${estimate.profitK.toLocaleString()}K`
                    : `-$${Math.abs(estimate.profitK).toLocaleString()}K`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-900 border-t border-slate-700 px-6 py-4 flex justify-between items-center gap-3 shrink-0">
          <div className="text-xs text-slate-400 font-mono">
            {capableFleet.length > 0 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Airframe verified for {distance.toLocaleString()} km non-stop service
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Select or acquire a certified airframe to establish this route
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={!selectedInstanceId || !isRangeValid || maxWeeklyFlights <= 0 || capableFleet.length === 0}
              onClick={handleLaunch}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-sky-500 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl font-black text-sm md:text-base shadow-xl transition border border-sky-400 cursor-pointer flex items-center gap-2"
            >
              <Plane className="w-4 h-4" />
              <span>Launch Route</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
