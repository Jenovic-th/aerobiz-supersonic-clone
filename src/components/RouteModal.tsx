import React, { useState, useMemo, useEffect } from 'react';
import { City, Airline, Route } from '../types/game';
import { CITIES } from '../data/cities';
import { AIRCRAFTS } from '../data/aircrafts';
import { calculateDistance, calculateBaseFare, calculateRouteInceptionCostK, calculateRouteDemand, simulateRoutePerformance } from '../simulation/engine';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { X, Plane, AlertCircle, AlertTriangle, CheckCircle2, ShoppingCart, ArrowRight, Compass } from 'lucide-react';
import { AircraftVisual } from './AircraftVisual';
import { getAircraftPhotoInfo } from '../data/aircraftVisuals';

interface RouteModalProps {
  playerAirline: Airline;
  existingRoutes?: Route[];
  onClose: () => void;
  onAddRoute: (newRoute: Route, inceptionCostK?: number) => void;
  onOpenAircraftShop?: () => void;
  onOpenManageRoutes?: () => void;
  onOpenSlotModal?: () => void;
  initialOriginCity?: City | null;
  initialDestCity?: City | null;
  fuelPriceIndex: number;
  currentYear: number;
  currentQuarter: 1 | 2 | 3 | 4;
}

export const RouteModal: React.FC<RouteModalProps> = ({
  playerAirline,
  existingRoutes,
  onClose,
  onAddRoute,
  onOpenAircraftShop,
  onOpenManageRoutes,
  onOpenSlotModal,
  initialOriginCity,
  initialDestCity,
  fuelPriceIndex,
  currentYear,
  currentQuarter,
}) => {
  useEscapeKey(onClose);
  // Authorized Departure Bases: Corporate HQ + Established Regional Hubs
  const authorizedBases = useMemo(() => {
    const baseIds = new Set([playerAirline.homeCityId, ...(playerAirline.hubCityIds || [])]);
    return CITIES.filter((c) => baseIds.has(c.id) && (playerAirline.slots[c.id] || 0) >= 1);
  }, [playerAirline]);

  // Cities where player has at least 1 slot
  const accessibleCities = useMemo(() => {
    return CITIES.filter((c) => (playerAirline.slots[c.id] || 0) > 0);
  }, [playerAirline]);

  const isInitialBase = initialOriginCity && authorizedBases.some((b) => b.id === initialOriginCity.id);
  const defaultOrigin = isInitialBase ? initialOriginCity.id : playerAirline.homeCityId;
  const [originId, setOriginId] = useState<string>(defaultOrigin);

  const [destId, setDestId] = useState<string>(() => {
    if (initialDestCity && (playerAirline.slots[initialDestCity.id] || 0) > 0) {
      return initialDestCity.id;
    }
    if (initialOriginCity && !isInitialBase && (playerAirline.slots[initialOriginCity.id] || 0) > 0) {
      return initialOriginCity.id;
    }
    const candidate = accessibleCities.find((c) => c.id !== defaultOrigin);
    return candidate ? candidate.id : (accessibleCities[1]?.id || 'TYO');
  });

  useEffect(() => {
    if (initialOriginCity) {
      if (authorizedBases.some((b) => b.id === initialOriginCity.id)) {
        setOriginId(initialOriginCity.id);
      } else if ((playerAirline.slots[initialOriginCity.id] || 0) > 0) {
        setDestId(initialOriginCity.id);
        const regionalHub = authorizedBases.find((b) => b.region === initialOriginCity.region);
        if (regionalHub) {
          setOriginId(regionalHub.id);
        } else {
          setOriginId(playerAirline.homeCityId);
        }
      }
    }
    if (initialDestCity && (playerAirline.slots[initialDestCity.id] || 0) > 0) {
      setDestId(initialDestCity.id);
    }
  }, [initialOriginCity, initialDestCity, authorizedBases, playerAirline.homeCityId, playerAirline.slots]);

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

  // Selected aircraft instance IDs (support 1 or multiple planes)
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>(
    capableFleet[0] ? [capableFleet[0].instanceId] : []
  );

  // Auto-synchronize selection whenever destination or distance changes
  useEffect(() => {
    const validIds = selectedInstanceIds.filter((id) => capableFleet.some((f) => f.instanceId === id));
    if (validIds.length === 0) {
      setSelectedInstanceIds(capableFleet[0] ? [capableFleet[0].instanceId] : []);
    } else if (validIds.length !== selectedInstanceIds.length) {
      setSelectedInstanceIds(validIds);
    }
  }, [capableFleet]);

  const [weeklyFrequency, setWeeklyFrequency] = useState<number>(7);
  const [priceModifierPct, setPriceModifierPct] = useState<number>(0);

  const effectivePrice = Math.round(baseFare * (1 + priceModifierPct / 100));

  const selectedInstances = useMemo(() => {
    return playerAirline.fleet.filter((f) => selectedInstanceIds.includes(f.instanceId));
  }, [playerAirline.fleet, selectedInstanceIds]);

  const selectedModels = useMemo(() => {
    return selectedInstances
      .map((f) => AIRCRAFTS.find((a) => a.id === f.modelId))
      .filter(Boolean) as (typeof AIRCRAFTS)[0][];
  }, [selectedInstances]);

  const isRangeValid = selectedModels.length > 0 && selectedModels.every((m) => m.rangeKm >= distance);
  const totalFleetSeats = selectedModels.reduce((sum, m) => sum + m.capacity, 0);

  // Check if player already operates a route on this city pair
  const isDuplicateRoute = useMemo(() => {
    if (!existingRoutes) return false;
    return existingRoutes.some(
      (r) =>
        r.airlineId === playerAirline.id &&
        ((r.originCityId === originId && r.destCityId === destId) ||
          (r.originCityId === destId && r.destCityId === originId))
    );
  }, [existingRoutes, playerAirline.id, originId, destId]);

  // Airport available slots (total owned minus slots committed to other active routes)
  const originUsedSlots = useMemo(() => {
    if (!existingRoutes) return 0;
    return existingRoutes
      .filter(
        (r) =>
          r.airlineId === playerAirline.id &&
          r.status !== 'SUSPENDED' &&
          (r.originCityId === originId || r.destCityId === originId)
      )
      .reduce((sum, r) => sum + r.weeklyFrequency, 0);
  }, [existingRoutes, playerAirline.id, originId]);

  const destUsedSlots = useMemo(() => {
    if (!existingRoutes) return 0;
    return existingRoutes
      .filter(
        (r) =>
          r.airlineId === playerAirline.id &&
          r.status !== 'SUSPENDED' &&
          (r.originCityId === destId || r.destCityId === destId)
      )
      .reduce((sum, r) => sum + r.weeklyFrequency, 0);
  }, [existingRoutes, playerAirline.id, destId]);

  const originTotalSlots = playerAirline.slots[originId] || 0;
  const destTotalSlots = playerAirline.slots[destId] || 0;
  const originFreeSlots = Math.max(0, originTotalSlots - originUsedSlots);
  const destFreeSlots = Math.max(0, destTotalSlots - destUsedSlots);
  const slotLimit = Math.min(14, originFreeSlots, destFreeSlots);
  const fleetMaxWeeklyFlights = Math.max(7, selectedInstanceIds.length * 7);
  const maxWeeklyFlights = isDuplicateRoute ? 0 : Math.min(slotLimit, fleetMaxWeeklyFlights);

  // Helper to query slot breakdown for any city
  const getCitySlotInfo = (cityId: string) => {
    const total = playerAirline.slots[cityId] || 0;
    const used = (existingRoutes || [])
      .filter(
        (r) =>
          r.airlineId === playerAirline.id &&
          r.status !== 'SUSPENDED' &&
          (r.originCityId === cityId || r.destCityId === cityId)
      )
      .reduce((sum, r) => sum + r.weeklyFrequency, 0);
    const free = Math.max(0, total - used);
    return { total, used, free };
  };

  // Synchronize and clamp weekly frequency to available slot clearance
  useEffect(() => {
    if (maxWeeklyFlights > 0) {
      if (weeklyFrequency > maxWeeklyFlights || weeklyFrequency === 0) {
        setWeeklyFrequency(Math.min(7, maxWeeklyFlights));
      }
    }
  }, [maxWeeklyFlights]);

  // Toggle plane selection
  const togglePlaneSelection = (instanceId: string) => {
    if (selectedInstanceIds.includes(instanceId)) {
      if (selectedInstanceIds.length > 1) {
        setSelectedInstanceIds(selectedInstanceIds.filter((id) => id !== instanceId));
      }
    } else {
      setSelectedInstanceIds([...selectedInstanceIds, instanceId]);
    }
  };

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
    if (selectedModels.length === 0 || !isRangeValid || maxWeeklyFlights <= 0) return null;
    const dummyRoute: Route = {
      id: 'temp',
      airlineId: playerAirline.id,
      originCityId: originId,
      destCityId: destId,
      assignedAircraftIds: selectedInstanceIds,
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
      selectedModels,
      selectedInstances,
      currentQuarter,
      fuelPriceIndex,
      demand
    );
    return res.stats;
  }, [
    originCity,
    destCity,
    selectedModels,
    selectedInstances,
    selectedInstanceIds,
    isRangeValid,
    weeklyFrequency,
    maxWeeklyFlights,
    priceModifierPct,
    fuelPriceIndex,
    currentYear,
    currentQuarter,
  ]);

  const inceptionCostK = useMemo(() => {
    if (!originCity || !destCity) return 0;
    return calculateRouteInceptionCostK(originCity, destCity, distance);
  }, [originCity, destCity, distance]);

  const canAffordInception = playerAirline.cashK >= inceptionCostK;

  // Dynamic button label providing immediate clarity on any launch blockage
  const launchButtonLabel = useMemo(() => {
    if (isDuplicateRoute) return '🚫 มีเส้นทางบินนี้อยู่แล้ว (Duplicate)';
    if (originFreeSlots === 0) return `🚫 สล็อตต้นทางเต็ม (${originCity?.name || originId}: 0 ว่าง)`;
    if (destFreeSlots === 0) return `🚫 สล็อตปลายทางไม่พอ (${destCity?.name || destId}: 0 ว่าง)`;
    if (maxWeeklyFlights <= 0) return '🚫 สล็อตไม่เพียงพอ (Max 0 เที่ยว/สัปดาห์)';
    if (capableFleet.length === 0) return '🚫 ไม่มีเครื่องบินว่างที่บินถึง';
    if (!canAffordInception) return `🚫 เงินไม่พอจ่ายค่าจัดตั้งสถานี ($${inceptionCostK.toLocaleString()}K)`;
    return `Launch Route ($${inceptionCostK.toLocaleString()}K)`;
  }, [
    isDuplicateRoute,
    originFreeSlots,
    destFreeSlots,
    maxWeeklyFlights,
    capableFleet.length,
    canAffordInception,
    originCity,
    originId,
    destCity,
    destId,
    inceptionCostK,
  ]);

  const handleLaunch = () => {
    if (
      selectedInstances.length === 0 ||
      selectedModels.length === 0 ||
      !isRangeValid ||
      maxWeeklyFlights <= 0 ||
      !canAffordInception ||
      isDuplicateRoute
    )
      return;

    const basePax = estimate?.passengers ?? Math.round(totalFleetSeats * weeklyFrequency * 12 * 0.82);
    const baseCap = estimate?.capacity ?? totalFleetSeats * weeklyFrequency * 12;
    const baseRev = estimate?.revenueK ?? Math.round((basePax * effectivePrice) / 1000);
    const baseExp = estimate?.expensesK ?? Math.round(baseRev * 0.55);

    const newRoute: Route = {
      id: `ROUTE_${Date.now()}`,
      airlineId: playerAirline.id,
      originCityId: originId,
      destCityId: destId,
      assignedAircraftIds: selectedInstanceIds,
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

    onAddRoute(newRoute, inceptionCostK);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 md:p-6 select-none">
      <div className="bg-slate-900 border-2 border-slate-600 rounded-3xl shadow-2xl w-[95vw] max-w-6xl xl:max-w-7xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 sm:px-8 py-4.5 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-400 text-sky-400 shadow">
              <Plane className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2.5">
                <span>Open New Commercial Flight Route</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400 font-bold">
                  ESTABLISH ROUTE
                </span>
              </h2>
              <div className="text-xs sm:text-sm text-sky-300/80 font-mono mt-0.5">
                Connect International Air Hubs & Assign Aircraft
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-700"
            title="Close (Esc)"
            data-testid="modal-close-header-btn"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-4 md:space-y-5 text-sm text-slate-200">
          {/* Origin & Destination Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/90 p-4 rounded-2xl border border-slate-700 shadow-md">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 text-xs md:text-sm font-mono flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Departure Base (HQ / Hub)
                </span>
                <span className="text-[10px] text-sky-400 font-bold">
                  {originCity.id === playerAirline.homeCityId ? '🏛️ Corporate HQ' : '🌐 Regional Hub'}
                </span>
              </label>
              <select
                value={originId}
                onChange={(e) => handleOriginChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3.5 py-2.5 text-slate-100 font-bold text-sm focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {authorizedBases.map((city) => {
                  const isHQ = city.id === playerAirline.homeCityId;
                  const info = getCitySlotInfo(city.id);
                  return (
                    <option key={city.id} value={city.id}>
                      {city.name} ({city.id}) — {isHQ ? 'Corporate HQ' : 'Regional Hub'} [ว่าง: {info.free}/{info.total} สล็อต]{info.free === 0 ? ' ⛔ สล็อตเต็ม' : ''}
                    </option>
                  );
                })}
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
                    const info = getCitySlotInfo(city.id);
                    return (
                      <option key={city.id} value={city.id}>
                        {city.name} ({city.id}) — {distToCity.toLocaleString()} km [ว่าง: {info.free}/{info.total} สล็อต] {info.free === 0 ? '⛔ สล็อตหมด' : hasCapablePlane ? '✓ Flyable' : '⚠️ Need Long-Range'}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Aerobiz Hub & Spoke System Info Banner */}
            {originCity.id !== playerAirline.homeCityId ? (
              <div className="col-span-1 md:col-span-2 px-3.5 py-2 rounded-xl bg-sky-950/80 border border-sky-400/80 text-sky-200 text-xs flex items-center gap-2">
                <span className="text-base">🌐</span>
                <span>
                  <strong>Regional Hub Spoke Service:</strong> Flights radiating from <strong>{originCity.name} Hub</strong> enjoy <strong>+18% Transit Passenger Boost</strong> from your connected trunk network!
                </span>
              </div>
            ) : authorizedBases.length === 1 ? (
              <div className="col-span-1 md:col-span-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 text-xs flex items-center gap-2">
                <span className="text-base">💡</span>
                <span>
                  <strong>Aerobiz Hub & Spoke Rule:</strong> Routes depart from your Corporate HQ ({originCity.name}). To branch out within another continent (e.g. Europe or America), fly into that region and charter a Regional Hub ($15M • +15 Slots)!
                </span>
              </div>
            ) : null}

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

            {/* Prominent Airport Slot Status Dashboard */}
            <div className="col-span-1 md:col-span-2 bg-slate-950/90 border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs font-mono flex-wrap gap-2">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-sky-400" />
                  <span>AIRPORT SLOT STATUS (สถานะโควตาสล็อตสนามบิน)</span>
                </span>
                <span
                  className={`font-black px-2.5 py-0.5 rounded-full border text-xs ${
                    maxWeeklyFlights > 0
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                      : 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
                  }`}
                >
                  {maxWeeklyFlights > 0
                    ? `✓ โควตาสูงสุด: ${maxWeeklyFlights} เที่ยว/สัปดาห์`
                    : '⛔ สล็อตไม่พอ (0 เที่ยว/สัปดาห์)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Origin Airport */}
                <div
                  className={`p-3 rounded-xl border ${
                    originFreeSlots > 0 ? 'bg-slate-900/90 border-slate-700' : 'bg-rose-950/50 border-rose-500/80'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-black text-sky-300 flex items-center gap-1">
                      <span>🛫 ต้นทาง:</span>
                      <span>{originCity.name} ({originCity.id})</span>
                    </span>
                    <span
                      className={`font-black font-mono px-2 py-0.5 rounded text-xs ${
                        originFreeSlots > 0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/30 text-rose-200 font-bold border border-rose-500'
                      }`}
                    >
                      {originFreeSlots > 0 ? `${originFreeSlots} สล็อตว่าง` : '⛔ 0 สล็อต (เต็ม)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono space-y-0.5">
                    <div>สล็อตที่ถือครอง: <strong className="text-white">{originTotalSlots}</strong> สล็อต</div>
                    <div>ถูกใช้โดยเส้นทางอื่น: <strong className="text-amber-400">{originUsedSlots}</strong> สล็อต</div>
                  </div>
                </div>

                {/* Destination Airport */}
                <div
                  className={`p-3 rounded-xl border ${
                    destFreeSlots > 0 ? 'bg-slate-900/90 border-slate-700' : 'bg-rose-950/50 border-rose-500/80'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-black text-emerald-300 flex items-center gap-1">
                      <span>🛬 ปลายทาง:</span>
                      <span>{destCity.name} ({destCity.id})</span>
                    </span>
                    <span
                      className={`font-black font-mono px-2 py-0.5 rounded text-xs ${
                        destFreeSlots > 0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/30 text-rose-200 font-bold border border-rose-500'
                      }`}
                    >
                      {destFreeSlots > 0 ? `${destFreeSlots} สล็อตว่าง` : '⛔ 0 สล็อต (ไม่มีสล็อต)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono space-y-0.5">
                    <div>สล็อตที่ถือครอง: <strong className="text-white">{destTotalSlots}</strong> สล็อต</div>
                    <div>ถูกใช้โดยเส้นทางอื่น: <strong className="text-amber-400">{destUsedSlots}</strong> สล็อต</div>
                  </div>
                </div>
              </div>

              {/* Actionable Warning Banner for Origin Slot Shortage */}
              {originFreeSlots <= 0 && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/80 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-2 text-rose-200 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      สล็อตสนามบินต้นทาง ({originCity.name}) ถูกใช้จนเต็มแล้ว! ({originUsedSlots}/{originTotalSlots} สล็อต)
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-200/80 leading-relaxed">
                    เส้นทางเดิมของคุณได้ใช้โควตาสล็อตทั้งหมดของ {originCity.name} ไปแล้ว จึงไม่สามารถเปิดเที่ยวบินเพิ่มได้
                  </p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {onOpenManageRoutes && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenManageRoutes();
                        }}
                        className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg font-bold text-xs transition cursor-pointer shadow flex items-center gap-1.5"
                      >
                        <span>🔧 ลดเที่ยวบินเส้นทางเดิม (Manage Routes)</span>
                      </button>
                    )}
                    {onOpenSlotModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSlotModal();
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg font-bold text-xs border border-slate-600 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>💼 ส่งทูตขอสล็อตเพิ่ม (Envoy)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Actionable Warning Banner for Dest Slot Shortage */}
              {originFreeSlots > 0 && destFreeSlots <= 0 && (
                <div className="p-3 bg-amber-950/80 border border-amber-500/80 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-200 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>สนามบินปลายทาง ({destCity.name}) ไม่มีสล็อตว่าง!</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    สายการบินของคุณยังไม่มีสล็อตที่เมืองนี้ หรือใช้โควตาเต็มแล้ว ต้องส่งทูตเจรจาขอสล็อตก่อน
                  </p>
                  {onOpenSlotModal && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSlotModal();
                        }}
                        className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-bold text-xs transition cursor-pointer shadow flex items-center gap-1.5"
                      >
                        <span>💼 ส่งทูตไปเจรจาสล็อตที่ {destCity.name}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Aircraft Selection Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-200 font-black text-sm md:text-base font-mono flex items-center gap-2">
                <span>Assign Aircraft from Available Fleet</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/60 font-bold">
                  {selectedInstanceIds.length} Selected ({totalFleetSeats} Seats Total)
                </span>
              </label>

              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Required Range: ≥ {distance.toLocaleString()} km • Click to toggle multiple aircraft
              </span>
            </div>

            {/* CONDITION 1: Capable aircraft exist in fleet */}
            {capableFleet.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {capableFleet.map((plane) => {
                  const model = AIRCRAFTS.find((a) => a.id === plane.modelId);
                  if (!model) return null;
                  const isSelected = selectedInstanceIds.includes(plane.instanceId);
                  const selectedIndex = selectedInstanceIds.indexOf(plane.instanceId);
                  const planePhoto = getAircraftPhotoInfo(model);

                  return (
                    <div
                      key={plane.instanceId}
                      onClick={() => togglePlaneSelection(plane.instanceId)}
                      className={`p-3.5 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-950/80 border-sky-400 shadow-xl text-white ring-1 ring-sky-400'
                          : 'bg-slate-800/90 border-slate-700 hover:border-slate-500 opacity-80'
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
                              <span className="px-2 py-0.2 rounded bg-sky-500 text-slate-950 text-[10px] font-mono font-black flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>ASSIGNED (#{selectedIndex + 1})</span>
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
                  <span className={`font-black text-base ${maxWeeklyFlights === 0 ? 'text-rose-400 font-bold' : 'text-sky-400'}`}>
                    {maxWeeklyFlights === 0 ? '0 flights / week (⛔ สล็อตเต็ม)' : `${weeklyFrequency} flights / week`}
                  </span>
                </div>
                <input
                  type="range"
                  min={maxWeeklyFlights === 0 ? 0 : 1}
                  max={Math.max(1, maxWeeklyFlights)}
                  value={maxWeeklyFlights === 0 ? 0 : weeklyFrequency}
                  disabled={maxWeeklyFlights === 0}
                  onChange={(e) => setWeeklyFrequency(Number(e.target.value))}
                  className={`w-full h-2.5 rounded-lg ${
                    maxWeeklyFlights === 0
                      ? 'opacity-30 cursor-not-allowed bg-slate-800'
                      : 'accent-sky-500 cursor-pointer bg-slate-700'
                  }`}
                />
                <div className="text-xs text-slate-400 mt-1.5 font-mono">
                  Origin slots: <strong className={originFreeSlots > 0 ? 'text-emerald-400' : 'text-rose-400'}>{originFreeSlots} free</strong> • Dest slots: <strong className={destFreeSlots > 0 ? 'text-emerald-400' : 'text-rose-400'}>{destFreeSlots} free</strong> (Max permitted: <strong className={maxWeeklyFlights > 0 ? 'text-sky-300' : 'text-rose-400'}>{maxWeeklyFlights}/wk</strong>)
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
          {/* Duplicate Route Warning */}
          {isDuplicateRoute && (
            <div className="p-3 bg-amber-950/70 border border-amber-500/80 rounded-xl flex items-center gap-3 text-xs font-mono text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold block">Route Already Active (เส้นทางนี้เปิดทำการบินอยู่แล้ว):</span>
                Your airline already operates flights between {originCity.name} and {destCity.name}. Use "My Routes" to adjust flight frequencies or assign additional airframes!
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-900 border-t border-slate-700 px-6 py-4 flex justify-between items-center gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-mono">
            {isDuplicateRoute ? (
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Route already active (Duplicate)</span>
              </span>
            ) : capableFleet.length > 0 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified for {distance.toLocaleString()} km service</span>
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Select certified airframe to establish route</span>
              </span>
            )}

            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 flex items-center gap-2">
              <span className="text-slate-400">ค่าจัดตั้งสถานี (Inception Fee):</span>
              <strong className={canAffordInception ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                ${inceptionCostK.toLocaleString()}K
              </strong>
              {!canAffordInception && (
                <span className="text-[10px] text-rose-400 font-bold">(เงินทุนไม่พอ)</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold font-mono transition cursor-pointer border border-slate-700 shadow flex items-center gap-2 active:scale-95"
              data-testid="modal-close-footer-btn"
            >
              <X className="w-4 h-4 text-slate-400" />
              <span>Cancel / Close (ปิด)</span>
            </button>
            <button
              disabled={
                selectedInstanceIds.length === 0 ||
                !isRangeValid ||
                maxWeeklyFlights <= 0 ||
                capableFleet.length === 0 ||
                !canAffordInception ||
                isDuplicateRoute
              }
              onClick={handleLaunch}
              title={
                isDuplicateRoute
                  ? 'มีเส้นทางบินระหว่างคู่นี้อยู่แล้ว (Duplicate Route)'
                  : originFreeSlots === 0
                  ? `สนามบินต้นทาง (${originCity.name}) ไม่มีสล็อตว่าง กรุณาลดเที่ยวบินเส้นทางเดิมหรือเจรจาขอสล็อต`
                  : destFreeSlots === 0
                  ? `สนามบินปลายทาง (${destCity.name}) ไม่มีสล็อตว่าง กรุณาส่งทูตไปเจรจาขอสล็อต`
                  : maxWeeklyFlights <= 0
                  ? 'สล็อตการบินไม่เพียงพอที่จะจัดสรรเที่ยวบิน'
                  : capableFleet.length === 0
                  ? 'ไม่มีเครื่องบินว่างในฝูงบินที่พิสัยบินถึง'
                  : !canAffordInception
                  ? `ต้องการเงินทุน $${inceptionCostK.toLocaleString()}K เพื่อจัดตั้งสถานี`
                  : 'เปิดเส้นทางบินพาณิชย์'
              }
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-sky-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl font-black text-xs md:text-sm shadow-xl transition border border-sky-400 cursor-pointer flex items-center gap-2"
            >
              <Plane className="w-4 h-4 shrink-0" />
              <span>{launchButtonLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
