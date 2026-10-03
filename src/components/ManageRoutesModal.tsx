import React, { useState, useMemo, useEffect } from 'react';
import { Route, Airline, GameState, AircraftModel } from '../types/game';
import { CITIES } from '../data/cities';
import { AIRCRAFTS } from '../data/aircrafts';
import { getAircraftPhotoInfo } from '../data/aircraftVisuals';
import { calculateDistance, calculateBaseFare, calculateRouteDemand, simulateRoutePerformance } from '../simulation/engine';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useI18n } from '../utils/i18n';
import {
  X,
  Plane,
  Trash2,
  Pause,
  Play,
  Sliders,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Coins,
  ShieldCheck,
  Compass,
  ArrowRight,
  DollarSign,
  Plus,
  Minus,
  BarChart3,
  Users,
  TrendingUp,
  ArrowRightLeft,
} from 'lucide-react';

interface ManageRoutesModalProps {
  playerAirline: Airline;
  routes: Route[];
  onClose: () => void;
  onUpdateRoute: (updatedRoute: Route, prevAssignedIds?: string[]) => void;
  onDeleteRoute: (routeId: string) => void;
  gameState?: GameState;
}

export const ManageRoutesModal: React.FC<ManageRoutesModalProps> = ({
  playerAirline,
  routes,
  onClose,
  onUpdateRoute,
  onDeleteRoute,
  gameState,
}) => {
  const { t, lang } = useI18n();
  const isTh = lang === 'th';
  const kmUnit = isTh ? 'กม.' : 'km';
  const flightsUnit = isTh ? 'เที่ยว/สัปดาห์' : 'flt/wk';

  const cityMap = useMemo(() => new Map(CITIES.map((c) => [c.id, c])), []);
  const aircraftMap = useMemo(() => new Map(AIRCRAFTS.map((a) => [a.id, a])), []);
  const playerRoutes = routes.filter((r) => r.airlineId === playerAirline.id);

  // Editing Route State
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editFrequency, setEditFrequency] = useState<number>(7);
  const [editPriceModifier, setEditPriceModifier] = useState<number>(0);
  const [editServiceQuality, setEditServiceQuality] = useState<number>(1.0);
  const [editAircraftInstanceIds, setEditAircraftInstanceIds] = useState<string[]>([]);

  // Confirmation for closing route
  const [routeToClose, setRouteToClose] = useState<Route | null>(null);

  useEscapeKey(() => {
    if (routeToClose) {
      setRouteToClose(null);
    } else if (editingRoute) {
      setEditingRoute(null);
    } else {
      onClose();
    }
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // When editingRoute changes, populate internal form state
  useEffect(() => {
    if (editingRoute) {
      setEditFrequency(editingRoute.weeklyFrequency);
      setEditPriceModifier(editingRoute.priceModifierPct);
      setEditServiceQuality(editingRoute.serviceQuality ?? 1.0);
      setEditAircraftInstanceIds([...editingRoute.assignedAircraftIds]);
    }
  }, [editingRoute]);

  // Details for currently edited route
  const editingOrigin = editingRoute ? cityMap.get(editingRoute.originCityId) : null;
  const editingDest = editingRoute ? cityMap.get(editingRoute.destCityId) : null;
  const editingDistance = useMemo(() => {
    if (!editingOrigin || !editingDest) return 0;
    return calculateDistance(editingOrigin.lat, editingOrigin.lon, editingDest.lat, editingDest.lon);
  }, [editingOrigin, editingDest]);

  const editingBaseFare = useMemo(() => calculateBaseFare(editingDistance), [editingDistance]);
  const editingEffectivePrice = Math.round(editingBaseFare * (1 + editPriceModifier / 100));

  // Available capable aircraft for this route (current planes + any idle planes whose range >= distance)
  const capableFleetForRoute = useMemo(() => {
    if (!editingRoute) return [];
    return playerAirline.fleet.filter((f) => {
      const model = aircraftMap.get(f.modelId);
      if (!model || model.rangeKm < editingDistance) return false;
      return (
        f.assignedRouteId === null ||
        f.assignedRouteId === editingRoute.id ||
        editingRoute.assignedAircraftIds.includes(f.instanceId)
      );
    });
  }, [playerAirline.fleet, editingRoute, editingDistance, aircraftMap]);

  // Assigned aircraft instances & models in editor
  const assignedInstances = useMemo(() => {
    return capableFleetForRoute.filter((f) => editAircraftInstanceIds.includes(f.instanceId));
  }, [capableFleetForRoute, editAircraftInstanceIds]);

  const assignedModels = useMemo(() => {
    return assignedInstances.map((f) => aircraftMap.get(f.modelId)).filter(Boolean) as AircraftModel[];
  }, [assignedInstances, aircraftMap]);

  // Available idle planes in hangar that can be added into this route
  const availableIdlePlanes = useMemo(() => {
    return capableFleetForRoute.filter(
      (f) =>
        !editAircraftInstanceIds.includes(f.instanceId) &&
        (f.assignedRouteId === null || f.assignedRouteId === editingRoute?.id)
    );
  }, [capableFleetForRoute, editAircraftInstanceIds, editingRoute]);

  const primaryAssignedInstance = assignedInstances[0] || capableFleetForRoute[0];
  const primaryAssignedModel = primaryAssignedInstance
    ? aircraftMap.get(primaryAssignedInstance.modelId)
    : null;

  // Total seat capacity of currently assigned fleet
  const totalFleetSeats = assignedModels.reduce((sum, m) => sum + m.capacity, 0);
  const isDualFlightMode = editFrequency <= 7 && assignedInstances.length > 1;
  const currentDepartureCapacity = isDualFlightMode
    ? totalFleetSeats
    : assignedModels.length > 0
    ? Math.round(totalFleetSeats / assignedModels.length)
    : 0;

  // Airport slots (free slots available for this route)
  const originSlotsFree = useMemo(() => {
    if (!editingOrigin) return 0;
    const usedByOthers = routes
      .filter(
        (r) =>
          r.airlineId === playerAirline.id &&
          r.status !== 'SUSPENDED' &&
          r.id !== editingRoute?.id &&
          (r.originCityId === editingOrigin.id || r.destCityId === editingOrigin.id)
      )
      .reduce((sum, r) => sum + r.weeklyFrequency, 0);
    return Math.max(0, (playerAirline.slots[editingOrigin.id] || 0) - usedByOthers);
  }, [routes, playerAirline.id, playerAirline.slots, editingOrigin, editingRoute]);

  const destSlotsFree = useMemo(() => {
    if (!editingDest) return 0;
    const usedByOthers = routes
      .filter(
        (r) =>
          r.airlineId === playerAirline.id &&
          r.status !== 'SUSPENDED' &&
          r.id !== editingRoute?.id &&
          (r.originCityId === editingDest.id || r.destCityId === editingDest.id)
      )
      .reduce((sum, r) => sum + r.weeklyFrequency, 0);
    return Math.max(0, (playerAirline.slots[editingDest.id] || 0) - usedByOthers);
  }, [routes, playerAirline.id, playerAirline.slots, editingDest, editingRoute]);

  const slotLimit = Math.max(1, Math.min(14, originSlotsFree, destSlotsFree));
  // Fleet flight capability (each assigned plane can operate up to 7 flights per week)
  const fleetMaxWeeklyFlights = Math.max(7, assignedInstances.length * 7);
  const maxWeeklyFlights = Math.min(slotLimit, fleetMaxWeeklyFlights);

  // Cap frequency if slots or fleet changed
  useEffect(() => {
    if (editFrequency > maxWeeklyFlights && maxWeeklyFlights > 0) {
      setEditFrequency(maxWeeklyFlights);
    }
  }, [editFrequency, maxWeeklyFlights]);

  // Add plane to route
  const handleAddAircraftToRoute = (instanceId: string) => {
    if (!editAircraftInstanceIds.includes(instanceId)) {
      setEditAircraftInstanceIds([...editAircraftInstanceIds, instanceId]);
    }
  };

  // Remove plane from route (cannot remove if only 1 plane left)
  const handleRemoveAircraftFromRoute = (instanceId: string) => {
    if (editAircraftInstanceIds.length <= 1) return;
    const nextIds = editAircraftInstanceIds.filter((id) => id !== instanceId);
    setEditAircraftInstanceIds(nextIds);
    const nextMax = nextIds.length * 7;
    if (editFrequency > nextMax) {
      setEditFrequency(Math.max(1, nextMax));
    }
  };

  // Original aircraft model and historical stats prior to current modification session
  const originalAssignedInstances = useMemo(() => {
    if (!editingRoute) return [];
    return playerAirline.fleet.filter((f) => editingRoute.assignedAircraftIds.includes(f.instanceId));
  }, [editingRoute, playerAirline.fleet]);

  const originalAssignedModels = useMemo(() => {
    return originalAssignedInstances.map((f) => aircraftMap.get(f.modelId)).filter(Boolean) as AircraftModel[];
  }, [originalAssignedInstances, aircraftMap]);

  const originalStats = editingRoute?.lastQuarterStats;
  const originalCapacityPerFlight =
    originalStats?.capacity && editingRoute?.weeklyFrequency
      ? Math.round(originalStats.capacity / (editingRoute.weeklyFrequency * 12))
      : originalAssignedModels[0]?.capacity || 160;
  const originalLoadFactorPct = originalStats?.loadFactorPct ?? 80;
  const originalPaxPerFlight = useMemo(() => {
    if (originalStats?.actualFlightsCompleted && originalStats.actualFlightsCompleted > 0) {
      return Math.round(originalStats.passengers / originalStats.actualFlightsCompleted);
    }
    if (originalStats?.passengers && editingRoute?.weeklyFrequency) {
      return Math.round(originalStats.passengers / (editingRoute.weeklyFrequency * 12));
    }
    return Math.round(originalCapacityPerFlight * (originalLoadFactorPct / 100));
  }, [originalStats, editingRoute, originalCapacityPerFlight, originalLoadFactorPct]);

  // Capacity difference between original model and currently selected model
  const capDiffTotal = currentDepartureCapacity - originalCapacityPerFlight;
  const capDiffPctTotal =
    originalCapacityPerFlight > 0 ? Math.round((capDiffTotal / originalCapacityPerFlight) * 100) : 0;

  // Baseline load factor percentage if the exact same previous passenger volume flies on the new airframe
  const baselineLoadFactorPct = useMemo(() => {
    if (currentDepartureCapacity <= 0) return 0;
    return Math.round((originalPaxPerFlight / currentDepartureCapacity) * 100);
  }, [originalPaxPerFlight, currentDepartureCapacity]);

  // Real-time Simulation Preview
  const previewSimulation = useMemo(() => {
    if (!editingRoute || !editingOrigin || !editingDest || assignedModels.length === 0 || !gameState) {
      return null;
    }

    const mockRoute: Route = {
      ...editingRoute,
      assignedAircraftIds: editAircraftInstanceIds,
      weeklyFrequency: editFrequency,
      priceModifierPct: editPriceModifier,
      serviceQuality: editServiceQuality,
    };

    const marketDemand = calculateRouteDemand(
      editingOrigin,
      editingDest,
      gameState.currentYear,
      gameState.currentQuarter,
      gameState.activeEvents || [],
      1.0
    );

    const competingRoutes = gameState.routes.filter(
      (r) =>
        r.id !== editingRoute.id &&
        ((r.originCityId === editingOrigin.id && r.destCityId === editingDest.id) ||
          (r.originCityId === editingDest.id && r.destCityId === editingOrigin.id))
    );

    return simulateRoutePerformance(
      mockRoute,
      editingOrigin,
      editingDest,
      assignedModels,
      assignedInstances,
      gameState.currentQuarter,
      gameState.fuelPriceIndex,
      marketDemand,
      competingRoutes
    );
  }, [
    editingRoute,
    editingOrigin,
    editingDest,
    assignedModels,
    assignedInstances,
    editAircraftInstanceIds,
    editFrequency,
    editPriceModifier,
    editServiceQuality,
    gameState,
  ]);

  // Save Route Edits
  const handleSaveRoute = () => {
    if (!editingRoute || editAircraftInstanceIds.length === 0) return;
    const prevAssigned = editingRoute.assignedAircraftIds;
    const updated: Route = {
      ...editingRoute,
      weeklyFrequency: editFrequency,
      priceModifierPct: editPriceModifier,
      serviceQuality: editServiceQuality,
      assignedAircraftIds: editAircraftInstanceIds,
    };
    onUpdateRoute(updated, prevAssigned);
    setEditingRoute(null);
    setToastMessage(
      isTh
        ? `บันทึกการปรับแต่งเส้นทาง ${editingOrigin?.name} ➔ ${editingDest?.name} สำเร็จ! (${editAircraftInstanceIds.length} ลำ)`
        : `Saved modifications for ${editingOrigin?.name} ➔ ${editingDest?.name}! (${editAircraftInstanceIds.length} aircraft assigned)`
    );
  };

  // Close Route Confirmation
  const handleConfirmClose = () => {
    if (!routeToClose) return;
    onDeleteRoute(routeToClose.id);
    setRouteToClose(null);
    setToastMessage(
      isTh
        ? 'ยกเลิกเส้นทางบินเรียบร้อยแล้ว เครื่องบินกลับเข้าสู่โรงเก็บ'
        : 'Route decommissioned. Aircraft returned to hangar.'
    );
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-sky-600/80 rounded-3xl shadow-[0_0_80px_rgba(14,165,233,0.3)] w-full max-w-6xl xl:max-w-7xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 px-6 py-4 border-b border-sky-800/80 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-900/80 border border-sky-500 shadow">
              <Plane className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white font-mono flex items-center gap-2">
                {t.routes.myRoutesTitle}
              </h2>
              <div className="text-xs text-sky-300/80 font-mono">
                {playerRoutes.length} {t.routes.activeRoutesSubtitle}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-700"
            title={`${t.common.close} (Esc)`}
            data-testid="modal-close-header-btn"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Routes List */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          {playerRoutes.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-base font-mono space-y-3">
              <Compass className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="font-bold text-slate-200">{t.routes.noRoutesYet}</div>
              <p className="text-xs text-slate-400">
                {t.routes.noRoutesSub}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {playerRoutes.map((route) => {
                const origin = cityMap.get(route.originCityId);
                const dest = cityMap.get(route.destCityId);
                const distKm = (origin && dest) ? calculateDistance(origin.lat, origin.lon, dest.lat, dest.lon) : 0;
                const assignedPlanesList = playerAirline.fleet.filter((f) =>
                  route.assignedAircraftIds.includes(f.instanceId)
                );
                const assignedModelsList = assignedPlanesList
                  .map((f) => aircraftMap.get(f.modelId))
                  .filter(Boolean) as AircraftModel[];
                const primaryModel = assignedModelsList[0] || null;
                const photoInfo = primaryModel ? getAircraftPhotoInfo(primaryModel) : null;
                const totalFleetSeats = assignedModelsList.reduce((sum, m) => sum + m.capacity, 0);
                const isDualMode = route.weeklyFrequency <= 7 && assignedPlanesList.length > 1;
                const stats = route.lastQuarterStats;
                const maintTier =
                  (route.serviceQuality ?? 1.0) >= 1.2
                    ? { label: isTh ? 'พรีเมียม (125%)' : 'Rigorous (125%)', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500' }
                    : (route.serviceQuality ?? 1.0) < 1.0
                    ? { label: isTh ? 'ประหยัด (80%)' : 'Budget (80%)', color: 'bg-amber-950/80 text-amber-300 border-amber-500' }
                    : { label: isTh ? 'มาตรฐาน (100%)' : 'Standard (100%)', color: 'bg-sky-950/80 text-sky-300 border-sky-500' };

                return (
                  <div
                    key={route.id}
                    className="bg-slate-950/90 border border-slate-800 hover:border-slate-600 rounded-2xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-lg transition"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Aircraft Photo Thumbnail */}
                      {photoInfo && (
                        <div className="w-20 h-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 relative shadow shrink-0">
                          <img
                            src={photoInfo.photoUrl}
                            alt={primaryModel?.model}
                            className="w-full h-full object-cover object-center filter brightness-105"
                          />
                          {primaryModel?.isSupersonic && (
                            <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black font-mono text-[8px]">
                              SST
                            </span>
                          )}
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-black text-base md:text-lg text-white font-mono flex items-center gap-2 flex-wrap">
                            <span>{origin?.name} ({origin?.id}) ➔ {dest?.name} ({dest?.id})</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold font-mono bg-sky-950/90 text-sky-300 border border-sky-500/80 shadow-sm flex items-center gap-1 shrink-0">
                              <Compass className="w-3.5 h-3.5 text-sky-400" />
                              <span>{distKm.toLocaleString()} {kmUnit}</span>
                            </span>
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono ${
                              route.status === 'ACTIVE'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                                : 'bg-amber-950 text-amber-300 border border-amber-500'
                            }`}
                          >
                            {route.status === 'ACTIVE' ? t.common.active : t.common.suspended}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold font-mono border ${maintTier.color}`}>
                            {isTh ? 'บำรุงรักษา: ' : 'Maint: '}{maintTier.label}
                          </span>
                        </div>

                        {/* Telemetry line: strictly respecting Rule 7 for distance & range transparency */}
                        <div className="text-xs text-slate-300 flex items-center gap-2.5 flex-wrap font-mono">
                          <span className="text-sky-300">
                            {t.routes.distanceLabel}: <strong>{distKm.toLocaleString()} {kmUnit}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            {t.routes.aircraftLabel}:{' '}
                            <strong className="text-white">
                              {assignedModelsList.length > 1
                                ? `${assignedModelsList.length} ${isTh ? 'ลำ' : 'Planes'} (${assignedModelsList.map(m => `${m.model} [${isTh ? 'พิสัยบิน ' + m.rangeKm.toLocaleString() + ' กม.' : 'Range ' + m.rangeKm.toLocaleString() + ' km'}]`).join(', ')}) • ${totalFleetSeats} ${isTh ? 'ที่นั่ง' : 'Seats'}`
                                : primaryModel ? `${primaryModel.model} (${isTh ? 'พิสัยบิน ' + primaryModel.rangeKm.toLocaleString() + ' กม.' : 'Range ' + primaryModel.rangeKm.toLocaleString() + ' km'})` : (isTh ? 'ยังไม่ได้จัดสรร' : 'Unassigned')}
                            </strong>
                          </span>
                          {isDualMode && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400 font-bold text-[10px]">
                              {isTh ? '⚡ บินคู่ขนาน' : '⚡ DUAL'}
                            </span>
                          )}
                          <span>•</span>
                          <span>
                            {t.routes.frequencyLabel}: <strong className="text-sky-300 font-mono">{route.weeklyFrequency} {flightsUnit}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            {t.routes.pricing}:{' '}
                            <strong className="text-amber-300 font-mono">
                              {route.priceModifierPct > 0 ? `+${route.priceModifierPct}%` : `${route.priceModifierPct}%`}
                            </strong>
                          </span>
                        </div>

                        {stats && (
                          <div className="text-xs text-slate-200 pt-1 flex items-center gap-3 font-mono flex-wrap">
                            <span>
                              {t.routes.paxLabel}: <strong className="text-sky-300">{stats.passengers.toLocaleString()}</strong> ({stats.loadFactorPct}%)
                            </span>
                            <span>•</span>
                            <span>
                              {t.routes.revenueLabel}: <strong className="text-emerald-400">+${stats.revenueK.toLocaleString()}K</strong>
                            </span>
                            <span>•</span>
                            <span className={`font-black ${stats.profitK >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {t.routes.profitLabel}: {stats.profitK >= 0 ? `+$${stats.profitK.toLocaleString()}K` : `-$${Math.abs(stats.profitK).toLocaleString()}K`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Modify, Suspend, Close */}
                    <div className="flex items-center gap-2.5 self-end lg:self-auto shrink-0">
                      <button
                        onClick={() => setEditingRoute(route)}
                        data-testid="route-modify-btn"
                        className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer shadow-md border border-sky-400 active:scale-95"
                        title={isTh ? 'ปรับแต่งราคา ความถี่ เครื่องบิน และงบบำรุงรักษา' : 'Modify route pricing, frequency, aircraft, and maintenance'}
                      >
                        <Sliders className="w-3.5 h-3.5" /> {t.routes.modifyRoute}
                      </button>

                      <button
                        onClick={() =>
                          onUpdateRoute({
                            ...route,
                            status: route.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                          })
                        }
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                      >
                        {route.status === 'ACTIVE' ? (
                          <>
                            <Pause className="w-3.5 h-3.5 text-amber-400" /> {t.routes.suspendRoute}
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-emerald-400" /> {t.routes.resumeRoute}
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setRouteToClose(route)}
                        className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {t.routes.closeRoute}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Standardized Modal Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex justify-between items-center text-xs font-mono shrink-0">
          <div className="text-slate-400">
            {isTh ? 'เส้นทางที่เปิดดำเนินการ:' : 'Active Routes:'} <strong className="text-sky-400 font-bold">{playerRoutes.length} {isTh ? 'เส้นทาง' : 'Pairs'}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold font-mono transition cursor-pointer border border-slate-700 shadow flex items-center gap-2 active:scale-95"
            data-testid="modal-close-footer-btn"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>{t.common.close}</span>
          </button>
        </div>
      </div>

      {/* ROUTE MODIFICATION MODAL */}
      {editingRoute && editingOrigin && editingDest && primaryAssignedModel && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-sky-500/90 rounded-3xl shadow-[0_0_80px_rgba(14,165,233,0.35)] w-full max-w-6xl xl:max-w-7xl overflow-hidden text-slate-100 flex flex-col animate-in zoom-in-95 duration-150 max-h-[96vh]">
            {/* Modal Header */}
            <div className="shrink-0 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 px-5 sm:px-6 py-3.5 border-b border-sky-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-2xl bg-sky-900/80 border border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.4)] shrink-0">
                  <Sliders className="w-5 h-5 text-sky-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-wide font-mono truncate">
                      {t.routes.modifyTitle}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400 font-bold shrink-0">
                      {t.routes.operationalDispatch}
                    </span>
                  </div>
                  <div className="text-xs text-sky-300/90 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="font-bold text-white text-sm">
                      {editingOrigin.name} ({editingOrigin.id}) ➔ {editingDest.name} ({editingDest.id})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-400 font-bold flex items-center gap-1 shadow-sm">
                      <Compass className="w-3.5 h-3.5 text-sky-400" />
                      <span>{editingDistance.toLocaleString()} {kmUnit}</span>
                    </span>
                    <span>•</span>
                    <span>{t.routes.baseFare}: <strong>${editingBaseFare}</strong></span>
                    <span>•</span>
                    <span className={editingRoute.status === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {t.common.status}: {editingRoute.status === 'ACTIVE' ? t.common.active : t.common.suspended}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingRoute(null)}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-rose-900/70 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                title={`${t.common.close} (Esc)`}
                data-testid="modal-close-header-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2-Column Responsive Landscape Grid */}
            <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-y-auto">
              {/* ================================================================= */}
              {/* LEFT COLUMN: FLEET ASSIGNMENT & CAPACITY ANALYSIS (lg:col-span-6) */}
              {/* ================================================================= */}
              <div className="lg:col-span-6 flex flex-col gap-3.5">
                {/* 1. Aircraft Assignment & Fleet Capacity */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sky-900/60 border border-sky-500">
                        <Plane className="w-4 h-4 text-sky-300" />
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider block">
                          {t.routes.assignedPlanes}:
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {assignedInstances.length} {isTh ? 'ลำประจำการ' : 'aircraft assigned'} • {isTh ? 'ความจุรวม' : 'Total capacity'} {totalFleetSeats} {isTh ? 'ที่นั่ง/เที่ยว' : 'seats/flight'}
                          {isDualFlightMode && (isTh ? ' (โหมดออกบินคู่)' : ' (Dual-flight mode)')}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-sky-300 bg-sky-950/80 px-2.5 py-1 rounded-lg border border-sky-500/70 font-bold flex items-center gap-1.5 shadow-sm">
                      <Compass className="w-3.5 h-3.5 text-sky-400" />
                      <span>{t.routes.distanceLabel}: <strong className="text-white">{editingDistance.toLocaleString()} {kmUnit}</strong></span>
                    </span>
                  </div>

                  {/* 1.1 Currently Assigned Aircraft */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {isTh ? `เครื่องบินที่บินอยู่ในเส้นทางนี้ (${assignedInstances.length} ลำ):` : `Operating in this corridor (${assignedInstances.length} aircraft):`}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {assignedInstances.length === 1
                          ? (isTh ? '1 ลำบินได้สูงสุด 7 เที่ยว/สัปดาห์' : '1 aircraft max 7 flights/wk')
                          : (isTh ? `ฝูงบิน ${assignedInstances.length} ลำ (สูงสุด ${assignedInstances.length * 7} เที่ยว/สัปดาห์)` : `${assignedInstances.length} aircraft (max ${assignedInstances.length * 7} flights/wk)`)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {assignedInstances.map((plane, idx) => {
                        const model = aircraftMap.get(plane.modelId);
                        if (!model) return null;
                        const photo = getAircraftPhotoInfo(model);
                        const cond = plane.conditionPct ?? 100;
                        const canRemove = assignedInstances.length > 1;

                        return (
                          <div
                            key={plane.instanceId}
                            data-testid="assigned-plane-card"
                            className="p-2.5 rounded-xl border border-sky-500/80 bg-sky-950/40 shadow flex items-center gap-2.5 justify-between"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-14 h-11 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                                <img
                                  src={photo.photoUrl}
                                  alt={model.model}
                                  className="w-full h-full object-cover object-center"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="font-mono font-bold text-xs text-white truncate flex items-center gap-1.5">
                                  <span>{model.model}</span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400 shrink-0">
                                    #{idx + 1}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono text-slate-300 flex items-center gap-2 flex-wrap">
                                  <span>{model.capacity} {isTh ? 'ที่นั่ง' : 'seats'}</span>
                                  <span>•</span>
                                  <span>{isTh ? 'พิสัยบิน' : 'Range'}: <strong className="text-sky-300">{model.rangeKm.toLocaleString()} {kmUnit}</strong></span>
                                  <span>•</span>
                                  <span>{isTh ? 'สภาพ' : 'Condition'}: <strong className="text-emerald-400">{cond}%</strong></span>
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 flex-wrap">
                                  <span>{t.routes.distanceLabel}: <strong className="text-white">{editingDistance.toLocaleString()} {kmUnit}</strong></span>
                                  <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/40">
                                    {t.routes.rangeSurplus}: +{(model.rangeKm - editingDistance).toLocaleString()} {kmUnit}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {canRemove ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAircraftFromRoute(plane.instanceId)}
                                  className="px-2.5 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-600 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 shadow"
                                  title={isTh ? 'ปลดเครื่องบินลำนี้ออกจากเส้นทาง กลับเข้าสู่โรงเก็บ' : 'Remove this aircraft and return to hangar'}
                                >
                                  <X className="w-3 h-3" />
                                  <span>{t.routes.removePlane}</span>
                                </button>
                              ) : (
                                <span className="text-[9px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  {isTh ? 'ลำหลัก' : 'Primary'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 1.2 Available Idle Aircraft in Hangar to Add */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        {isTh ? `เครื่องบินว่างในโรงเก็บที่สามารถเพิ่มเข้ามาได้ (${availableIdlePlanes.length} ลำ):` : `Available in hangar to deploy (${availableIdlePlanes.length} aircraft):`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({isTh ? 'พิสัยบิน' : 'Range'} ≥ {editingDistance.toLocaleString()} {kmUnit})
                      </span>
                    </div>

                    {availableIdlePlanes.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {availableIdlePlanes.map((plane) => {
                          const model = aircraftMap.get(plane.modelId);
                          if (!model) return null;
                          const photo = getAircraftPhotoInfo(model);
                          const cond = plane.conditionPct ?? 100;

                          return (
                            <div
                              key={plane.instanceId}
                              data-testid="idle-plane-card"
                              className="p-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:border-slate-600 flex items-center justify-between gap-2.5 transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-14 h-11 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                                  <img
                                    src={photo.photoUrl}
                                    alt={model.model}
                                    className="w-full h-full object-cover object-center"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-mono font-bold text-xs text-white truncate">
                                    {model.model}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-300 flex items-center gap-2 flex-wrap">
                                    <span>+{model.capacity} {isTh ? 'ที่นั่ง' : 'seats'}</span>
                                    <span>•</span>
                                    <span>{isTh ? 'พิสัยบิน' : 'Range'}: <strong className="text-sky-300">{model.rangeKm.toLocaleString()} {kmUnit}</strong></span>
                                    <span>•</span>
                                    <span>{isTh ? 'สภาพ' : 'Condition'}: <strong className="text-emerald-400">{cond}%</strong></span>
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 flex-wrap">
                                    <span>{t.routes.distanceLabel}: <strong className="text-white">{editingDistance.toLocaleString()} {kmUnit}</strong></span>
                                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/40">
                                      {t.routes.rangeSurplus}: +{(model.rangeKm - editingDistance).toLocaleString()} {kmUnit}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAddAircraftToRoute(plane.instanceId)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 rounded-lg text-xs font-mono font-bold shadow transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1"
                                title={isTh ? 'เพิ่มเครื่องบินลำนี้เข้าไปบินร่วมในเส้นทาง' : 'Deploy this aircraft to this route'}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{t.routes.deployPlane}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span className="text-sm">ℹ</span>
                        <span>
                          {t.routes.noIdleCapablePlanes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Dedicated Capacity & Passenger Utilization Analysis Card */}
                {originalAssignedModels.length > 0 && assignedModels.length > 0 && (
                  <div className="bg-slate-950 border border-indigo-500/50 rounded-2xl p-4 space-y-3 font-mono shadow">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-indigo-400" />
                        <span>{isTh ? 'วิเคราะห์สัดส่วนที่นั่งและการรองรับผู้โดยสาร:' : 'CAPACITY & PASSENGER UTILIZATION ANALYSIS:'}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                        <span>
                          {isTh ? `เดิม ${originalCapacityPerFlight} ➔ ใหม่ ${currentDepartureCapacity} ที่นั่ง/เที่ยว (${assignedInstances.length} ลำ)` : `Prev ${originalCapacityPerFlight} ➔ New ${currentDepartureCapacity} seats/flight (${assignedInstances.length} planes)`}
                        </span>
                      </span>
                    </div>

                    {/* 3 Metric Comparison Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Card 1: Previous Baseline */}
                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1">
                          <span className="w-2 h-2 rounded-full bg-slate-500" />
                          <span>{t.routes.baselineStats}</span>
                        </div>
                        <div className="font-bold text-slate-200 text-xs truncate">
                          {originalAssignedModels.map(m => m.model).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-300 mt-1 flex items-center justify-between">
                          <span>{isTh ? 'ความจุเดิม:' : 'Prev Capacity:'}</span>
                          <strong className="text-white">{originalCapacityPerFlight} {isTh ? 'ที่นั่ง' : 'seats'}</strong>
                        </div>
                        <div className="text-[10px] text-slate-300 flex items-center justify-between">
                          <span>{isTh ? 'ผดส.เดิม:' : 'Prev Pax:'}</span>
                          <strong className="text-sky-300">{originalPaxPerFlight} {isTh ? 'คน/เที่ยว' : 'pax'}</strong>
                        </div>
                        <div className="text-[10px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800/80 mt-1">
                          <span>{isTh ? 'อัตราส่วนเดิม:' : 'Prev LF:'}</span>
                          <strong className="text-amber-300 font-bold">{originalLoadFactorPct}%</strong>
                        </div>
                      </div>

                      {/* Card 2: Baseline Conversion on New Fleet */}
                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-indigo-500/50 shadow">
                        <div className="text-[10px] text-indigo-300 uppercase font-bold flex items-center gap-1 mb-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          <span>{isTh ? 'เทียบฝูงบินใหม่' : 'New Fleet Baseline'}</span>
                        </div>
                        <div className="font-bold text-indigo-200 text-xs truncate">
                          {assignedModels.map(m => m.model).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-300 mt-1 flex items-center justify-between">
                          <span>{isTh ? 'ความจุใหม่:' : 'New Capacity:'}</span>
                          <strong className="text-white">{currentDepartureCapacity} {isTh ? 'ที่นั่ง' : 'seats'}</strong>
                        </div>
                        <div className="text-[10px] text-slate-300 flex items-center justify-between">
                          <span>{isTh ? 'ส่วนต่าง:' : 'Cap Diff:'}</span>
                          <strong className={capDiffTotal >= 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                            {capDiffTotal >= 0 ? `+${capDiffTotal}` : capDiffTotal} {isTh ? 'ที่' : 'seats'} ({capDiffPctTotal > 0 ? `+${capDiffPctTotal}%` : `${capDiffPctTotal}%`})
                          </strong>
                        </div>
                        <div className="text-[10px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800/80 mt-1">
                          <span>Baseline LF:</span>
                          <strong
                            className={`text-xs font-black ${
                              baselineLoadFactorPct > 100
                                ? 'text-rose-400'
                                : baselineLoadFactorPct >= 70
                                ? 'text-emerald-400'
                                : 'text-indigo-300'
                            }`}
                          >
                            {baselineLoadFactorPct}%
                          </strong>
                        </div>
                      </div>

                      {/* Card 3: Projected Market Fill */}
                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-sky-500/50 shadow">
                        <div className="text-[10px] text-sky-300 uppercase font-bold flex items-center gap-1 mb-1">
                          <span className="w-2 h-2 rounded-full bg-sky-400" />
                          <span>{isTh ? 'ประมาณการบินจริง' : 'Projected Flight'}</span>
                        </div>
                        <div className="font-bold text-sky-200 text-xs truncate">
                          {isTh ? 'ไตรมาสถัดไป' : 'Next Quarter'}
                        </div>
                        <div className="text-[10px] text-slate-300 mt-1 flex items-center justify-between">
                          <span>{isTh ? 'ผดส.คาดการณ์:' : 'Proj. Pax:'}</span>
                          <strong className="text-sky-300 font-bold">
                            {previewSimulation
                              ? Math.round(previewSimulation.stats.passengers / (editFrequency * 12)).toLocaleString()
                              : 0}{' '}
                            {isTh ? 'คน/เที่ยว' : 'pax/flt'}
                          </strong>
                        </div>
                        <div className="text-[10px] text-slate-300 flex items-center justify-between">
                          <span>{isTh ? 'กำไรคาดการณ์:' : 'Proj. Profit:'}</span>
                          <strong
                            className={
                              previewSimulation && previewSimulation.stats.profitK >= 0
                                ? 'text-emerald-400 font-bold'
                                : 'text-rose-400 font-bold'
                            }
                          >
                            {previewSimulation
                              ? (previewSimulation.stats.profitK >= 0
                                  ? `+$${previewSimulation.stats.profitK.toLocaleString()}K`
                                  : `-$${Math.abs(previewSimulation.stats.profitK).toLocaleString()}K`)
                              : '-'}
                          </strong>
                        </div>
                        <div className="text-[10px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800/80 mt-1">
                          <span>Proj. LF:</span>
                          <strong className="text-emerald-400 font-black text-xs">
                            {previewSimulation ? previewSimulation.stats.loadFactorPct : 0}%
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Visual Multi-Segment Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>{isTh ? 'แผนภาพสัดส่วนที่นั่ง:' : 'Visual Capacity Fill Ratio:'}</span>
                        <span className="text-slate-400 text-[10px]">
                          100% = {currentDepartureCapacity} {isTh ? 'ที่นั่ง/เที่ยว' : 'seats/flight'}
                        </span>
                      </div>

                      <div className="w-full bg-slate-900 h-5 rounded-lg overflow-hidden border border-slate-800 flex relative">
                        {/* Segment 1: Baseline Pax Fill */}
                        <div
                          className="bg-indigo-600 h-full flex items-center justify-center text-[10px] text-white font-black transition-all"
                          style={{ width: `${Math.min(100, baselineLoadFactorPct)}%` }}
                        >
                          {baselineLoadFactorPct >= 18 && (isTh ? `ผู้โดยสารเดิม ${baselineLoadFactorPct}%` : `Prev Pax ${baselineLoadFactorPct}%`)}
                        </div>

                        {/* Segment 2: Projected Growth from Market Demand */}
                        {previewSimulation && previewSimulation.stats.loadFactorPct > baselineLoadFactorPct && (
                          <div
                            className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-slate-950 font-black transition-all"
                            style={{
                              width: `${Math.min(
                                100 - baselineLoadFactorPct,
                                previewSimulation.stats.loadFactorPct - baselineLoadFactorPct
                              )}%`,
                            }}
                          >
                            {previewSimulation.stats.loadFactorPct - baselineLoadFactorPct >= 14 &&
                              (isTh ? `+${previewSimulation.stats.loadFactorPct - baselineLoadFactorPct}% ตลาดโต` : `+${previewSimulation.stats.loadFactorPct - baselineLoadFactorPct}% Market Growth`)}
                          </div>
                        )}

                        {/* Empty Seats */}
                        <div className="flex-1 bg-slate-900/60 flex items-center justify-end px-2 text-[10px] text-slate-500">
                          {100 - (previewSimulation ? previewSimulation.stats.loadFactorPct : baselineLoadFactorPct) > 10 && (
                            <span>
                              {isTh ? 'ที่ว่างเหลือ ' : 'Empty Seats '}
                              {Math.max(
                                0,
                                currentDepartureCapacity -
                                  (previewSimulation
                                    ? Math.round(previewSimulation.stats.passengers / (editFrequency * 12))
                                    : originalPaxPerFlight)
                              )}{' '}
                              {isTh ? 'ที่นั่ง' : 'seats'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Legend Explanations */}
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm bg-indigo-600 inline-block" />
                          <span>
                            {isTh ? `ผดส.เดิม: ` : `Prev Pax: `}<strong>{baselineLoadFactorPct}%</strong> ({originalPaxPerFlight} {isTh ? 'คน' : 'pax'})
                          </span>
                        </div>
                        {previewSimulation && previewSimulation.stats.loadFactorPct > baselineLoadFactorPct && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />
                            <span>
                              {isTh ? 'ดีมานด์เติบโต: ' : 'Demand Growth: '}<strong className="text-emerald-400">+{previewSimulation.stats.loadFactorPct - baselineLoadFactorPct}%</strong>
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm bg-slate-800 border border-slate-700 inline-block" />
                          <span>
                            {isTh ? 'ที่ว่างสำรอง: ' : 'Empty Seats: '}{Math.max(0, 100 - (previewSimulation ? previewSimulation.stats.loadFactorPct : baselineLoadFactorPct))}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ================================================================= */}
              {/* RIGHT COLUMN: FLIGHT OPS, PRICING & PERFORMANCE (lg:col-span-6)  */}
              {/* ================================================================= */}
              <div className="lg:col-span-6 flex flex-col gap-3.5">
                {/* 3. Flight Frequency & Slot Capacity */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-sky-400" />
                      <span>{t.routes.flightFrequencyTitle}</span>
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      {isTh ? `ขีดจำกัดสล็อต: ${slotLimit} เที่ยว/สัปดาห์` : `Slot Limit: ${slotLimit} flt/wk`}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={editFrequency <= 1}
                        onClick={() => setEditFrequency(Math.max(1, editFrequency - 1))}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-mono font-black border border-slate-600 transition cursor-pointer active:scale-95"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="px-4 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-center min-w-[90px]">
                        <span className="font-mono font-black text-xl text-white block">
                          {editFrequency}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block -mt-1">
                          {flightsUnit}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={editFrequency >= maxWeeklyFlights}
                        onClick={() => setEditFrequency(Math.min(maxWeeklyFlights, editFrequency + 1))}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-mono font-black border border-slate-600 transition cursor-pointer active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      {/* Presets */}
                      <div className="flex items-center gap-1 ml-2 border-l border-slate-800 pl-2.5">
                        {[3, 7, 10, 14].map((qty) => (
                          <button
                            key={qty}
                            type="button"
                            disabled={qty > maxWeeklyFlights}
                            onClick={() => setEditFrequency(Math.min(maxWeeklyFlights, qty))}
                            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer disabled:opacity-25 active:scale-95 ${
                              editFrequency === qty
                                ? 'bg-sky-500 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            {qty === 7 ? (isTh ? '7 (ทุกวัน)' : '7x (Daily)') : qty === 14 ? (isTh ? '14 (วันละ 2)' : '14x (Double)') : `${qty}x`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs font-mono text-slate-400 text-right">
                      <div>
                        {isTh ? 'ความจุ/สัปดาห์: ' : 'Weekly Capacity: '}
                        <strong className="text-white">
                          {previewSimulation
                            ? Math.round(previewSimulation.stats.capacity / 12).toLocaleString()
                            : (editFrequency * currentDepartureCapacity).toLocaleString()}{' '}
                          {isTh ? 'ที่นั่ง' : 'seats'}
                        </strong>
                      </div>
                      <div>
                        {isTh ? 'เที่ยวบิน/ไตรมาส: ' : 'Flights/Quarter: '}
                        <strong className="text-sky-300">
                          {editFrequency * 12} {isTh ? `เที่ยว (${assignedInstances.length} ลำ)` : `flt (${assignedInstances.length} planes)`}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Explanatory Operational Banners */}
                  {slotLimit > 7 && assignedInstances.length === 1 && (
                    <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-[11px] font-mono text-indigo-300 flex items-center gap-2">
                      <span className="text-sm">💡</span>
                      <span>
                        {isTh
                          ? `สล็อตสนามบินรองรับได้ถึง ${slotLimit} เที่ยว/สัปดาห์! เครื่องบิน 1 ลำบินได้ 7 เที่ยว หากต้องการบิน 8–${slotLimit} เที่ยว กรุณากด [+ เพิ่มเข้า] เพื่อเพิ่มเครื่องบิน`
                          : `Airport slots support up to ${slotLimit} flights/week! 1 aircraft can operate 7 flights. Click [+ Deploy Plane] to add more planes for 8–${slotLimit} flights.`}
                      </span>
                    </div>
                  )}

                  {isDualFlightMode && (
                    <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
                      <span className="text-sm">⚡</span>
                      <span>
                        {isTh
                          ? `โหมดออกบินคู่: บินร่วมในรอบสัปดาห์ เพิ่มความจุเป็น ${totalFleetSeats} ที่นั่ง/เที่ยว (+${(assignedInstances.length - 1) * 100}%)`
                          : `Dual-Aircraft Mode: Flying in pair, boosting departure capacity to ${totalFleetSeats} seats/flight (+${(assignedInstances.length - 1) * 100}%)`}
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. Ticket Price Modifier (% Markup / Discount) */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-sky-400" />
                      <span>{t.routes.pricingPolicy}</span>
                    </span>
                    <span className="text-xs font-mono text-amber-300 font-bold">
                      {isTh ? 'ราคาจริง: ' : 'Effective: '}${editingEffectivePrice.toLocaleString()} / pax
                      <span className="text-slate-400 ml-1 font-normal">
                        ({isTh ? 'ราคาฐาน: ' : 'Base: '}${editingBaseFare.toLocaleString()})
                      </span>
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={-50}
                        max={50}
                        step={5}
                        value={editPriceModifier}
                        onChange={(e) => setEditPriceModifier(Number(e.target.value))}
                        className="flex-1 accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                      />
                      <div className="min-w-[65px] text-right font-mono font-black text-base text-amber-400">
                        {editPriceModifier > 0 ? `+${editPriceModifier}%` : `${editPriceModifier}%`}
                      </div>
                    </div>

                    {/* Pricing Presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[-30, -20, -10, 0, 10, 20, 35, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setEditPriceModifier(pct)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer active:scale-95 ${
                            editPriceModifier === pct
                              ? 'bg-amber-500 text-slate-950 font-black shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {pct === 0 ? (isTh ? 'มาตรฐาน (0%)' : 'Standard (0%)') : pct > 0 ? `+${pct}%` : `${pct}%`}
                        </button>
                      ))}
                    </div>

                    <div className="text-[10px] font-mono text-slate-400">
                      {editPriceModifier < 0 ? (
                        <span className="text-emerald-400">
                          {isTh ? `✓ ตั๋วราคาประหยัดช่วยกระตุ้นดีมานด์ (+${Math.abs(editPriceModifier * 0.6).toFixed(0)}% ผู้โดยสาร)` : `✓ Budget fare stimulates demand (+${Math.abs(editPriceModifier * 0.6).toFixed(0)}% pax elasticity)`}
                        </span>
                      ) : editPriceModifier > 0 ? (
                        <span className="text-amber-400">
                          {isTh ? `⚡ ตั๋วพรีเมียมเพิ่มรายได้ต่อที่นั่ง แต่อาจลดจำนวนผู้โดยสาร (-${(editPriceModifier * 0.7).toFixed(0)}% ผู้โดยสาร)` : `⚡ Premium fare yields higher per-seat revenue, but may reduce volume (-${(editPriceModifier * 0.7).toFixed(0)}% pax)`}
                        </span>
                      ) : (
                        <span>{isTh ? 'ราคามาตรฐานระดับตลาดแข่งขันสากล' : 'Standard competitive market fare'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Maintenance & Service Quality Tier */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                      <span>{t.routes.maintenanceBudget}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {isTh ? 'ควบคุมต้นทุนและการสึกหรอ' : 'Fleet wear & cost control'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Tier 1: Budget 0.8x */}
                    <div
                      onClick={() => setEditServiceQuality(0.8)}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
                        editServiceQuality === 0.8
                          ? 'bg-amber-950/50 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-xs text-amber-300 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isTh ? 'ประหยัด' : 'Budget'}</span>
                          </span>
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-950 border border-amber-500/80 text-amber-200">
                            80%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-tight">
                          {isTh ? 'ประหยัดงบ 20% แต่อะไหล่สึกหรอเร็วขึ้น +35%' : 'Save 20% budget, fleet wear increases +35%'}
                        </p>
                      </div>
                    </div>

                    {/* Tier 2: Standard 1.0x */}
                    <div
                      onClick={() => setEditServiceQuality(1.0)}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
                        editServiceQuality === 1.0
                          ? 'bg-sky-950/50 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-xs text-sky-300 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                            <span>{isTh ? 'มาตรฐาน' : 'Standard'}</span>
                          </span>
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-sky-950 border border-sky-500/80 text-sky-200">
                            100%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-tight">
                          {isTh ? 'มาตรฐานผู้ผลิต สมดุลต้นทุนและสภาพเครื่องบิน' : 'Manufacturer standard, balanced wear and costs'}
                        </p>
                      </div>
                    </div>

                    {/* Tier 3: Rigorous 1.25x */}
                    <div
                      onClick={() => setEditServiceQuality(1.25)}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
                        editServiceQuality === 1.25
                          ? 'bg-emerald-950/50 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-xs text-emerald-300 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{isTh ? 'พรีเมียม' : 'Rigorous'}</span>
                          </span>
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/80 text-emerald-200">
                            125%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-tight">
                          {isTh ? 'พรีเมียม ถนอมเครื่อง (-40% wear) และเพิ่มดีมานด์' : 'Premium care, preserves fleet (-40% wear), boosts demand'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Live Quarterly Financial & Operational Projection */}
                {previewSimulation && (
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-sky-800/80 rounded-2xl p-3.5 space-y-2 font-mono shadow">
                    <div className="flex items-center justify-between text-xs text-sky-300 font-bold uppercase tracking-wider">
                      <span>{isTh ? 'ประมาณการผลประกอบการไตรมาส:' : 'LIVE QUARTERLY PERFORMANCE PROJECTION:'}</span>
                      <span className="text-slate-400 text-[10px]">{isTh ? 'ประเมินแบบเรียลไทม์' : 'Real-time Model'}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 text-xs">
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 block">{isTh ? 'ผู้โดยสารคาดการณ์:' : 'EST. PASSENGERS:'}</span>
                        <strong className="text-xs text-sky-300 block truncate">
                          {previewSimulation.stats.passengers.toLocaleString()}
                        </strong>
                        <span className="text-[9px] text-emerald-400 font-bold block">
                          {previewSimulation.stats.loadFactorPct}% {isTh ? 'อัตราบรรทุก' : 'LF'}
                        </span>
                      </div>

                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 block">{isTh ? 'รายรับคาดการณ์:' : 'GROSS REVENUE:'}</span>
                        <strong className="text-xs text-emerald-400 block truncate">
                          +${previewSimulation.stats.revenueK.toLocaleString()}K
                        </strong>
                        <span className="text-[9px] text-slate-500 block">{isTh ? 'ต่อไตรมาส' : 'Quarterly Gross'}</span>
                      </div>

                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 block">{isTh ? 'ค่าใช้จ่ายคาดการณ์:' : 'OPERATING EXPENSES:'}</span>
                        <strong className="text-xs text-rose-400 block truncate">
                          -${previewSimulation.stats.expensesK.toLocaleString()}K
                        </strong>
                        <span className="text-[9px] text-slate-500 block">{isTh ? 'น้ำมัน, ซ่อม, สนามบิน' : 'Fuel, Maint, Airport'}</span>
                      </div>

                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 block">{isTh ? 'กำไรสุทธิต่อไตรมาส:' : 'NET PROFIT / QTR:'}</span>
                        <strong
                          className={`text-xs font-black block truncate ${
                            previewSimulation.stats.profitK >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {previewSimulation.stats.profitK >= 0
                            ? `+$${previewSimulation.stats.profitK.toLocaleString()}K`
                            : `-$${Math.abs(previewSimulation.stats.profitK).toLocaleString()}K`}
                        </strong>
                        <span className="text-[9px] text-slate-500 block">
                          {previewSimulation.stats.profitK >= 0 ? (isTh ? 'มีกำไร' : 'Profitable') : (isTh ? 'ขาดทุน' : 'Deficit Warning')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer: Cancel & Save Buttons */}
            <div className="shrink-0 bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between gap-3 font-mono flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const r = editingRoute;
                  setEditingRoute(null);
                  setRouteToClose(r);
                }}
                className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/70 hover:border-rose-500 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                title={isTh ? 'ยกเลิกเส้นทางบินนี้และนำเครื่องบินกลับเข้าโรงเก็บ' : 'Decommission route and return aircraft to hangar'}
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>{t.routes.abandonRoute}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRoute(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
                  data-testid="modal-close-footer-btn"
                >
                  {t.common.cancel}
                </button>

                <button
                  type="button"
                  onClick={handleSaveRoute}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-xl transition-all active:scale-95 border border-emerald-400 cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>{t.routes.saveChangesBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR CLOSING ROUTE */}
      {routeToClose && (
        <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 flex flex-col">
            <div className="bg-rose-950/80 px-5 py-3.5 border-b border-rose-800 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
              <h4 className="font-bold text-white font-mono text-base">{t.routes.closeConfirmTitle}</h4>
            </div>
            <div className="p-5 text-sm font-mono text-slate-300 space-y-2">
              <p>
                {isTh ? (
                  <>
                    คุณแน่ใจหรือไม่ว่าต้องการยกเลิกเส้นทางบินระหว่าง{' '}
                    <strong className="text-white">
                      {cityMap.get(routeToClose.originCityId)?.name}
                    </strong>{' '}
                    และ{' '}
                    <strong className="text-white">
                      {cityMap.get(routeToClose.destCityId)?.name}
                    </strong>
                    ?
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently close the route between{' '}
                    <strong className="text-white">
                      {cityMap.get(routeToClose.originCityId)?.name}
                    </strong>{' '}
                    and{' '}
                    <strong className="text-white">
                      {cityMap.get(routeToClose.destCityId)?.name}
                    </strong>
                    ?
                  </>
                )}
              </p>
              <p className="text-xs text-slate-400">
                {isTh
                  ? 'เครื่องบินที่ประจำการทั้งหมดจะถูกส่งกลับคืนสู่โรงเก็บฝูงบินของคุณ'
                  : 'All assigned airframes will be safely unassigned and returned to your fleet hangar.'}
              </p>
            </div>
            <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-end gap-3 font-mono text-xs font-bold">
              <button
                onClick={() => setRouteToClose(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConfirmClose}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition cursor-pointer shadow-lg"
              >
                {t.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST FEEDBACK NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-[70] bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-400 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="p-1.5 rounded-full bg-emerald-500 text-slate-950">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="font-mono text-xs md:text-sm font-bold">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
};
