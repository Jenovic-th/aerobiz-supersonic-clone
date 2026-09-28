import React, { useState, useMemo, useEffect } from 'react';
import { Route, Airline, GameState, AircraftModel } from '../types/game';
import { CITIES } from '../data/cities';
import { AIRCRAFTS } from '../data/aircrafts';
import { getAircraftPhotoInfo } from '../data/aircraftVisuals';
import { calculateDistance, calculateBaseFare, calculateRouteDemand, simulateRoutePerformance } from '../simulation/engine';
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
  const cityMap = useMemo(() => new Map(CITIES.map((c) => [c.id, c])), []);
  const aircraftMap = useMemo(() => new Map(AIRCRAFTS.map((a) => [a.id, a])), []);
  const playerRoutes = routes.filter((r) => r.airlineId === playerAirline.id);

  // Editing Route State
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editFrequency, setEditFrequency] = useState<number>(7);
  const [editPriceModifier, setEditPriceModifier] = useState<number>(0);
  const [editServiceQuality, setEditServiceQuality] = useState<number>(1.0);
  const [editAircraftInstanceId, setEditAircraftInstanceId] = useState<string>('');

  // Confirmation for closing route
  const [routeToClose, setRouteToClose] = useState<Route | null>(null);

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
      setEditAircraftInstanceId(editingRoute.assignedAircraftIds[0] || '');
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

  // Airport slots
  const originSlots = editingOrigin ? playerAirline.slots[editingOrigin.id] || 0 : 0;
  const destSlots = editingDest ? playerAirline.slots[editingDest.id] || 0 : 0;
  const maxWeeklyFlights = Math.max(1, Math.min(14, originSlots, destSlots));

  // Cap frequency if slots changed
  useEffect(() => {
    if (editFrequency > maxWeeklyFlights && maxWeeklyFlights > 0) {
      setEditFrequency(maxWeeklyFlights);
    }
  }, [editFrequency, maxWeeklyFlights]);

  // Available capable aircraft for swapping (current plane + any idle planes in fleet whose range >= distance)
  const availableFleetForRoute = useMemo(() => {
    if (!editingRoute) return [];
    return playerAirline.fleet.filter((f) => {
      const model = aircraftMap.get(f.modelId);
      if (!model || model.rangeKm < editingDistance) return false;
      // Eligible if currently assigned to this route or idle in hangar
      return f.assignedRouteId === null || f.assignedRouteId === editingRoute.id || editingRoute.assignedAircraftIds.includes(f.instanceId);
    });
  }, [playerAirline.fleet, editingRoute, editingDistance, aircraftMap]);

  // Active aircraft instance and model in editor
  const currentAssignedInstance = playerAirline.fleet.find((f) => f.instanceId === editAircraftInstanceId) || availableFleetForRoute[0];
  const currentAssignedModel = currentAssignedInstance ? aircraftMap.get(currentAssignedInstance.modelId) : null;

  // Original aircraft model and historical stats prior to current modification session
  const originalAssignedInstance = useMemo(() => {
    if (!editingRoute) return null;
    return playerAirline.fleet.find((f) => editingRoute.assignedAircraftIds.includes(f.instanceId)) || null;
  }, [editingRoute, playerAirline.fleet]);

  const originalAssignedModel = useMemo(() => {
    if (!originalAssignedInstance) return null;
    return aircraftMap.get(originalAssignedInstance.modelId) || null;
  }, [originalAssignedInstance, aircraftMap]);

  const originalStats = editingRoute?.lastQuarterStats;
  const originalCapacityPerFlight = originalAssignedModel?.capacity || 160;
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
  const capDiffTotal = (currentAssignedModel?.capacity || 0) - originalCapacityPerFlight;
  const capDiffPctTotal = originalCapacityPerFlight > 0
    ? Math.round((capDiffTotal / originalCapacityPerFlight) * 100)
    : 0;

  // Baseline load factor percentage if the exact same previous passenger volume flies on the new airframe
  const baselineLoadFactorPct = useMemo(() => {
    if (!currentAssignedModel || currentAssignedModel.capacity === 0) return 0;
    return Math.round((originalPaxPerFlight / currentAssignedModel.capacity) * 100);
  }, [originalPaxPerFlight, currentAssignedModel]);

  // Real-time Simulation Preview
  const previewSimulation = useMemo(() => {
    if (!editingRoute || !editingOrigin || !editingDest || !currentAssignedModel || !gameState) {
      return null;
    }

    const mockRoute: Route = {
      ...editingRoute,
      assignedAircraftIds: [editAircraftInstanceId],
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
      currentAssignedModel,
      currentAssignedInstance,
      gameState.currentQuarter,
      gameState.fuelPriceIndex,
      marketDemand,
      competingRoutes
    );
  }, [
    editingRoute,
    editingOrigin,
    editingDest,
    currentAssignedModel,
    currentAssignedInstance,
    editAircraftInstanceId,
    editFrequency,
    editPriceModifier,
    editServiceQuality,
    gameState,
  ]);

  // Save Route Edits
  const handleSaveRoute = () => {
    if (!editingRoute) return;
    const prevAssigned = editingRoute.assignedAircraftIds;
    const updated: Route = {
      ...editingRoute,
      weeklyFrequency: editFrequency,
      priceModifierPct: editPriceModifier,
      serviceQuality: editServiceQuality,
      assignedAircraftIds: [editAircraftInstanceId],
    };
    onUpdateRoute(updated, prevAssigned);
    setEditingRoute(null);
    setToastMessage(`Saved changes for ${editingOrigin?.name} ➔ ${editingDest?.name}!`);
  };

  // Close Route Confirmation
  const handleConfirmClose = () => {
    if (!routeToClose) return;
    onDeleteRoute(routeToClose.id);
    setRouteToClose(null);
    setToastMessage('Route decommissioned. Aircraft returned to hangar.');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-sky-600/80 rounded-3xl shadow-[0_0_50px_rgba(14,165,233,0.3)] w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 px-6 py-4 border-b border-sky-800/80 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-900/80 border border-sky-500 shadow">
              <Plane className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white font-mono flex items-center gap-2">
                ACTIVE COMMERCIAL ROUTES NETWORK
              </h2>
              <div className="text-xs text-sky-300/80 font-mono">
                {playerRoutes.length} Operational City Pairs • Route Frequency, Pricing & Maintenance Management
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Routes List */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          {playerRoutes.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-base font-mono space-y-3">
              <Compass className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="font-bold text-slate-200">No active routes established yet!</div>
              <p className="text-xs text-slate-400">
                Click "Open Route" on the main operations hub to connect your global destinations.
              </p>
            </div>
          ) : (
            playerRoutes.map((route) => {
              const origin = cityMap.get(route.originCityId);
              const dest = cityMap.get(route.destCityId);
              const instance = playerAirline.fleet.find((f) =>
                route.assignedAircraftIds.includes(f.instanceId)
              );
              const model = instance ? aircraftMap.get(instance.modelId) : null;
              const photoInfo = model ? getAircraftPhotoInfo(model) : null;
              const stats = route.lastQuarterStats;
              const maintTier =
                (route.serviceQuality ?? 1.0) >= 1.2
                  ? { label: 'Rigorous (125%)', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500' }
                  : (route.serviceQuality ?? 1.0) < 1.0
                  ? { label: 'Budget (80%)', color: 'bg-amber-950/80 text-amber-300 border-amber-500' }
                  : { label: 'Standard (100%)', color: 'bg-sky-950/80 text-sky-300 border-sky-500' };

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
                          alt={model?.model}
                          className="w-full h-full object-cover object-center filter brightness-105"
                        />
                        {model?.isSupersonic && (
                          <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black font-mono text-[8px]">
                            SST
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-black text-base md:text-lg text-white font-mono">
                          {origin?.name} ({origin?.id}) ➔ {dest?.name} ({dest?.id})
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono ${
                            route.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                              : 'bg-amber-950 text-amber-300 border border-amber-500'
                          }`}
                        >
                          {route.status}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold font-mono border ${maintTier.color}`}>
                          Maint: {maintTier.label}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 flex items-center gap-2.5 flex-wrap font-mono">
                        <span>
                          Aircraft: <strong className="text-white">{model?.model || 'Unassigned'}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Frequency: <strong className="text-sky-300 font-mono">{route.weeklyFrequency} flights/wk</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Ticket Price:{' '}
                          <strong className="text-amber-300 font-mono">
                            {route.priceModifierPct > 0 ? `+${route.priceModifierPct}%` : `${route.priceModifierPct}%`}
                          </strong>
                        </span>
                      </div>

                      {stats && (
                        <div className="text-xs text-slate-200 pt-1 flex items-center gap-3 font-mono flex-wrap">
                          <span>
                            Pax: <strong className="text-sky-300">{stats.passengers.toLocaleString()}</strong> ({stats.loadFactorPct}%)
                          </span>
                          <span>•</span>
                          <span>
                            Rev: <strong className="text-emerald-400">+${stats.revenueK.toLocaleString()}K</strong>
                          </span>
                          <span>•</span>
                          <span className={`font-black ${stats.profitK >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Net: {stats.profitK >= 0 ? `+$${stats.profitK.toLocaleString()}K` : `-$${Math.abs(stats.profitK).toLocaleString()}K`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Modify, Suspend, Close */}
                  <div className="flex items-center gap-2.5 self-end lg:self-auto shrink-0">
                    <button
                      onClick={() => setEditingRoute(route)}
                      className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer shadow-md border border-sky-400 active:scale-95"
                      title="Modify route pricing, frequency, aircraft, and maintenance"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Modify Route (ปรับแต่ง)
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
                          <Pause className="w-3.5 h-3.5 text-amber-400" /> Suspend
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-emerald-400" /> Resume
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setRouteToClose(route)}
                      className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Close
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ROUTE MODIFICATION MODAL */}
      {editingRoute && editingOrigin && editingDest && currentAssignedModel && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-sky-500/90 rounded-2xl shadow-[0_0_60px_rgba(14,165,233,0.35)] w-full max-w-3xl overflow-hidden text-slate-100 flex flex-col animate-in zoom-in-95 duration-150 max-h-[94vh]">
            {/* Modal Header */}
            <div className="shrink-0 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 px-5 py-3.5 border-b border-sky-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-900/80 border border-sky-400 shadow">
                  <Sliders className="w-5 h-5 text-sky-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-wide font-mono flex items-center gap-2">
                    MODIFY COMMERCIAL ROUTE PARAMETERS
                  </h3>
                  <div className="text-xs text-sky-300/80 font-mono">
                    {editingOrigin.name} ({editingOrigin.id}) ➔ {editingDest.name} ({editingDest.id}) • Distance: {editingDistance.toLocaleString()} km
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingRoute(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/70 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* 1. Aircraft Assignment & Capacity (Swap or Keep) */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
                    <Plane className="w-4 h-4 text-sky-400" />
                    <span>ASSIGNED AIRCRAFT (เปลี่ยนเครื่องบิน / ความจุ):</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Route Range Required: ≥ {editingDistance.toLocaleString()} km
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableFleetForRoute.map((plane) => {
                    const model = aircraftMap.get(plane.modelId);
                    if (!model) return null;
                    const isSelected = plane.instanceId === editAircraftInstanceId;
                    const photo = getAircraftPhotoInfo(model);
                    const cond = plane.conditionPct ?? 100;

                    return (
                      <div
                        key={plane.instanceId}
                        onClick={() => setEditAircraftInstanceId(plane.instanceId)}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer ${
                          isSelected
                            ? 'bg-sky-950/80 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 relative shrink-0 shadow">
                          <img
                            src={photo.photoUrl}
                            alt={model.model}
                            className="w-full h-full object-cover object-center filter brightness-105"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono font-black text-sm text-white truncate flex items-center justify-between">
                            <span>{model.model}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {model.capacity !== originalCapacityPerFlight && (
                                <span
                                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                    model.capacity > originalCapacityPerFlight
                                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                                      : 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                                  }`}
                                >
                                  {model.capacity > originalCapacityPerFlight
                                    ? `+${model.capacity - originalCapacityPerFlight}`
                                    : model.capacity - originalCapacityPerFlight}{' '}
                                  seats
                                </span>
                              )}
                              {isSelected && (
                                <span className="text-[10px] text-sky-400 bg-sky-900/50 px-1.5 py-0.2 rounded border border-sky-500">
                                  ASSIGNED
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-[11px] font-mono text-slate-300 mt-0.5 flex items-center gap-2">
                            <span>{model.capacity} Seats</span>
                            <span>•</span>
                            <span>{model.rangeKm.toLocaleString()} km</span>
                            <span>•</span>
                            <span className="text-emerald-400">{cond}% Health</span>
                          </div>

                          {/* Baseline passenger utilization on this candidate card */}
                          <div className="text-[10px] font-mono mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-slate-400">
                            <span>
                              สัดส่วนผู้โดยสารเดิม ({originalPaxPerFlight} คน):{' '}
                              <strong
                                className={
                                  Math.round((originalPaxPerFlight / model.capacity) * 100) > 100
                                    ? 'text-rose-400 font-bold'
                                    : Math.round((originalPaxPerFlight / model.capacity) * 100) >= 70
                                    ? 'text-emerald-300 font-bold'
                                    : 'text-indigo-300 font-bold'
                                }
                              >
                                {Math.round((originalPaxPerFlight / model.capacity) * 100)}%
                              </strong>
                              {model.capacity !== originalCapacityPerFlight && (
                                <span className="text-slate-500 ml-1">
                                  (จากเดิม {originalLoadFactorPct}%)
                                </span>
                              )}
                            </span>
                            {Math.round((originalPaxPerFlight / model.capacity) * 100) > 100 && (
                              <span className="text-[9px] text-rose-400 font-bold">
                                ⚠️ ล้น {originalPaxPerFlight - model.capacity} ที่
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 1.1 Dedicated Capacity & Passenger Utilization Analysis Card */}
                {originalAssignedModel && currentAssignedModel && (
                  <div className="bg-slate-900/90 border border-indigo-500/50 rounded-xl p-4 space-y-3 font-mono shadow-lg mt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-400" />
                        <span>CAPACITY & PASSENGER UTILIZATION ANALYSIS (วิเคราะห์สัดส่วนที่นั่งและผู้โดยสาร):</span>
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                        <span>
                          {originalAssignedModel.model} ({originalAssignedModel.capacity} seats) ➔ {currentAssignedModel.model} ({currentAssignedModel.capacity} seats)
                        </span>
                      </span>
                    </div>

                    {/* 3 Metric Comparison Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Card 1: Previous Baseline */}
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full bg-slate-500" />
                          <span>เครื่องบินเดิม (Previous Airframe)</span>
                        </div>
                        <div className="font-bold text-slate-200 text-xs truncate">
                          {originalAssignedModel.model}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
                          <span>ความจุที่นั่งเดิม:</span>
                          <strong className="text-white">{originalAssignedModel.capacity} ที่นั่ง</strong>
                        </div>
                        <div className="text-[11px] text-slate-300 flex items-center justify-between">
                          <span>ผู้โดยสารเฉลี่ยเดิม:</span>
                          <strong className="text-sky-300">{originalPaxPerFlight} คน/เที่ยว</strong>
                        </div>
                        <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800/80 mt-1">
                          <span>อัตราบรรทุกเดิม (Prev LF):</span>
                          <strong className="text-amber-300 font-bold">{originalLoadFactorPct}%</strong>
                        </div>
                      </div>

                      {/* Card 2: Baseline Conversion on New Airframe */}
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-indigo-500/50 shadow">
                        <div className="text-[10px] text-indigo-300 uppercase font-bold flex items-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          <span>สัดส่วนผู้โดยสารเดิมเทียบกับลำใหม่</span>
                        </div>
                        <div className="font-bold text-indigo-200 text-xs truncate">
                          {currentAssignedModel.model}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
                          <span>ความจุที่นั่งใหม่:</span>
                          <strong className="text-white">{currentAssignedModel.capacity} ที่นั่ง</strong>
                        </div>
                        <div className="text-[11px] text-slate-300 flex items-center justify-between">
                          <span>ส่วนต่างความจุ:</span>
                          <strong className={capDiffTotal >= 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                            {capDiffTotal >= 0 ? `+${capDiffTotal}` : capDiffTotal} ที่ ({capDiffPctTotal > 0 ? `+${capDiffPctTotal}%` : `${capDiffPctTotal}%`})
                          </strong>
                        </div>
                        <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800/80 mt-1">
                          <span>สัดส่วนผู้โดยสารเดิม (Baseline LF):</span>
                          <strong
                            className={`text-sm font-black ${
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
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-sky-500/50 shadow">
                        <div className="text-[10px] text-sky-300 uppercase font-bold flex items-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full bg-sky-400" />
                          <span>ประมาณการบินจริง (Market Demand)</span>
                        </div>
                        <div className="font-bold text-sky-200 text-xs truncate">
                          ไตรมาสถัดไป (Projected Flight)
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
                          <span>ผู้โดยสารคาดการณ์:</span>
                          <strong className="text-sky-300 font-bold">
                            {previewSimulation
                              ? Math.round(previewSimulation.stats.passengers / (editFrequency * 12)).toLocaleString()
                              : 0}{' '}
                            คน/เที่ยว
                          </strong>
                        </div>
                        <div className="text-[11px] text-slate-300 flex items-center justify-between">
                          <span>กำไรสุทธิคาดการณ์:</span>
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
                        <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800/80 mt-1">
                          <span>อัตราบรรทุกจริงคาดการณ์ (Proj. LF):</span>
                          <strong className="text-emerald-400 font-black text-sm">
                            {previewSimulation ? previewSimulation.stats.loadFactorPct : 0}%
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Visual Multi-Segment Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>แผนภาพสัดส่วนที่นั่ง (Visual Capacity Fill):</span>
                        <span className="text-slate-400 text-[10px]">
                          100% = {currentAssignedModel.capacity} ที่นั่ง
                        </span>
                      </div>

                      <div className="w-full bg-slate-950 h-5 rounded-lg overflow-hidden border border-slate-800 flex relative">
                        {/* Segment 1: Baseline Pax Fill */}
                        <div
                          className="bg-indigo-600 h-full flex items-center justify-center text-[10px] text-white font-black transition-all"
                          style={{ width: `${Math.min(100, baselineLoadFactorPct)}%` }}
                        >
                          {baselineLoadFactorPct >= 18 && `ผู้โดยสารเดิม ${baselineLoadFactorPct}%`}
                        </div>

                        {/* Segment 2: Projected Growth from Market Demand (if projected > baseline) */}
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
                              `+${previewSimulation.stats.loadFactorPct - baselineLoadFactorPct}% ตลาดโต`}
                          </div>
                        )}

                        {/* Empty Seats */}
                        <div className="flex-1 bg-slate-900/60 flex items-center justify-end px-2 text-[10px] text-slate-500">
                          {100 - (previewSimulation ? previewSimulation.stats.loadFactorPct : baselineLoadFactorPct) >
                            10 && (
                            <span>
                              ที่ว่างเหลือ{' '}
                              {Math.max(
                                0,
                                currentAssignedModel.capacity -
                                  (previewSimulation
                                    ? Math.round(previewSimulation.stats.passengers / (editFrequency * 12))
                                    : originalPaxPerFlight)
                              )}{' '}
                              ที่นั่ง
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Legend Explanations */}
                      <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" />
                          <span>
                            ผู้โดยสารเดิม ({originalPaxPerFlight} คน คิดเป็น <strong>{baselineLoadFactorPct}%</strong>{' '}
                            ของลำนี้)
                          </span>
                        </div>
                        {previewSimulation && previewSimulation.stats.loadFactorPct > baselineLoadFactorPct && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                            <span>
                              อุปสงค์ในตลาดที่จะมาเติมเพิ่ม (ขยับเป็น{' '}
                              <strong className="text-emerald-400">
                                {previewSimulation.stats.loadFactorPct}%
                              </strong>
                              )
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700 inline-block" />
                          <span>
                            ที่ว่างสำรองสำหรับรองรับการขยายตัว (
                            {Math.max(
                              0,
                              100 - (previewSimulation ? previewSimulation.stats.loadFactorPct : baselineLoadFactorPct)
                            )}
                            %)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {availableFleetForRoute.length === 1 && (
                  <div className="text-[11px] font-mono text-slate-400 italic">
                    ℹ Currently assigned {currentAssignedModel.model}. Other aircraft in your fleet are active on other routes or have insufficient range. Procure more aircraft in the Market to swap.
                  </div>
                )}
              </div>

              {/* 2. Flight Frequency & Slot Capacity */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>FLIGHT FREQUENCY (เที่ยวบินต่อสัปดาห์):</span>
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Slot Limit: Min({originSlots}, {destSlots}) = {maxWeeklyFlights} flights/wk
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={editFrequency <= 1}
                      onClick={() => setEditFrequency(Math.max(1, editFrequency - 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-mono font-black border border-slate-600 transition cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="px-4 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-center min-w-[100px]">
                      <span className="font-mono font-black text-xl text-white block">
                        {editFrequency}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block -mt-1">
                        flights / week
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={editFrequency >= maxWeeklyFlights}
                      onClick={() => setEditFrequency(Math.min(maxWeeklyFlights, editFrequency + 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-mono font-black border border-slate-600 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 ml-2 border-l border-slate-800 pl-3">
                      {[3, 7, 14].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          disabled={qty > maxWeeklyFlights}
                          onClick={() => setEditFrequency(Math.min(maxWeeklyFlights, qty))}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer disabled:opacity-25 ${
                            editFrequency === qty
                              ? 'bg-sky-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {qty === 7 ? '7x (Daily)' : qty === 14 ? '14x (Double)' : `${qty}x`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs font-mono text-slate-400 text-right">
                    <div>Weekly Seats: <strong className="text-white">{(editFrequency * currentAssignedModel.capacity).toLocaleString()} seats/wk</strong></div>
                    <div>Quarterly Rotations: <strong className="text-sky-300">{editFrequency * 12} flights</strong></div>
                  </div>
                </div>
              </div>

              {/* 3. Ticket Price Modifier (% Markup / Discount) */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-sky-400" />
                    <span>TICKET PRICING STRATEGY (ปรับราคาค่าตั๋วโดยสาร):</span>
                  </span>
                  <span className="text-xs font-mono text-amber-300 font-bold">
                    Effective Fare: ${editingEffectivePrice.toLocaleString()} per pax
                    <span className="text-slate-400 ml-1">
                      (Base: ${editingBaseFare.toLocaleString()})
                    </span>
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      step={5}
                      value={editPriceModifier}
                      onChange={(e) => setEditPriceModifier(Number(e.target.value))}
                      className="flex-1 accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <div className="min-w-[70px] text-right font-mono font-black text-lg text-amber-400">
                      {editPriceModifier > 0 ? `+${editPriceModifier}%` : `${editPriceModifier}%`}
                    </div>
                  </div>

                  {/* Pricing Presets */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[-30, -20, -10, 0, 10, 20, 35, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setEditPriceModifier(pct)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                          editPriceModifier === pct
                            ? 'bg-amber-500 text-slate-950 font-black shadow'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {pct === 0 ? 'Normal (0%)' : pct > 0 ? `+${pct}%` : `${pct}%`}
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] font-mono text-slate-400">
                    {editPriceModifier < 0 ? (
                      <span className="text-emerald-400">
                        ✓ Discounted fares stimulate passenger demand and boost load factor (+{Math.abs(editPriceModifier * 0.6).toFixed(0)}% pax elasticity).
                      </span>
                    ) : editPriceModifier > 0 ? (
                      <span className="text-amber-400">
                        ⚡ Premium fares increase revenue yield per seat, but may lower passenger volume (-{(editPriceModifier * 0.7).toFixed(0)}% pax volume).
                      </span>
                    ) : (
                      <span>Standard IATA competitive market pricing.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Maintenance & Service Quality Tier */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>MAINTENANCE & SERVICE BUDGET (การบำรุงรักษาและการบริการ):</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Controls operating costs, airframe wear, and breakdown risk
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Tier 1: Budget 0.8x */}
                  <div
                    onClick={() => setEditServiceQuality(0.8)}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
                      editServiceQuality === 0.8
                        ? 'bg-amber-950/50 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-sm text-amber-300 flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span>Budget / Economy</span>
                        </span>
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/80 text-amber-200">
                          80% COST
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Saves 20% on maintenance expense. Trade-off: Airframe suffers +35% faster mechanical wear and elevated breakdown risk.
                      </p>
                    </div>
                  </div>

                  {/* Tier 2: Standard 1.0x */}
                  <div
                    onClick={() => setEditServiceQuality(1.0)}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
                      editServiceQuality === 1.0
                        ? 'bg-sky-950/50 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-sm text-sky-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-sky-400" />
                          <span>Standard Certified</span>
                        </span>
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-sky-950 border border-sky-500/80 text-sky-200">
                          100% COST
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Certified manufacturer maintenance. Balanced operating costs with normal airframe degradation and passenger satisfaction.
                      </p>
                    </div>
                  </div>

                  {/* Tier 3: Rigorous 1.25x */}
                  <div
                    onClick={() => setEditServiceQuality(1.25)}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
                      editServiceQuality === 1.25
                        ? 'bg-emerald-950/50 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span>Rigorous Premium</span>
                        </span>
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/80 text-emerald-200">
                          125% COST
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        +25% maintenance budget & deep preventative care. Extends airframe life (-40% wear), cuts breakdowns by half, and boosts demand.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Live Quarterly Financial & Operational Projection */}
              {previewSimulation && (
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-sky-800/80 rounded-xl p-4 space-y-2.5 font-mono">
                  <div className="flex items-center justify-between text-xs text-sky-300 font-bold uppercase tracking-wider">
                    <span>LIVE QUARTERLY PERFORMANCE PROJECTION (จำลองผลประกอบการไตรมาส):</span>
                    <span className="text-slate-400">Based on current market conditions</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">EST. PASSENGERS:</span>
                      <strong className="text-sm text-sky-300">
                        {previewSimulation.stats.passengers.toLocaleString()}
                      </strong>
                      <span className="text-[10px] text-emerald-400 font-bold block">
                        {previewSimulation.stats.loadFactorPct}% Load Factor
                      </span>
                      {capDiffTotal !== 0 && (
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          (เดิม {originalLoadFactorPct}% ➔ สัดส่วนใหม่ {baselineLoadFactorPct}%)
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">GROSS REVENUE:</span>
                      <strong className="text-sm text-emerald-400">
                        +${previewSimulation.stats.revenueK.toLocaleString()}K
                      </strong>
                      <span className="text-[10px] text-slate-500 block">Quarterly Gross</span>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">OPERATING EXPENSES:</span>
                      <strong className="text-sm text-rose-400">
                        -${previewSimulation.stats.expensesK.toLocaleString()}K
                      </strong>
                      <span className="text-[10px] text-slate-500 block">Fuel, Maint, Airport</span>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">NET PROFIT / QTR:</span>
                      <strong
                        className={`text-sm font-black ${
                          previewSimulation.stats.profitK >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {previewSimulation.stats.profitK >= 0
                          ? `+$${previewSimulation.stats.profitK.toLocaleString()}K`
                          : `-$${Math.abs(previewSimulation.stats.profitK).toLocaleString()}K`}
                      </strong>
                      <span className="text-[10px] text-slate-500 block">
                        {previewSimulation.stats.profitK >= 0 ? 'Profitable' : 'Deficit Warning'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer: Cancel & Save Buttons */}
            <div className="shrink-0 bg-slate-950 px-5 py-3.5 border-t border-slate-800 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setEditingRoute(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500 rounded-xl text-slate-300 hover:text-white font-mono font-bold text-sm transition cursor-pointer flex items-center gap-2"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>Cancel (ยกเลิก)</span>
              </button>

              <button
                type="button"
                onClick={handleSaveRoute}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black font-mono text-sm sm:text-base rounded-xl shadow-xl transition-all active:scale-95 border-2 border-emerald-400 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>Save & Apply Modifications (บันทึกการเปลี่ยนแปลง)</span>
              </button>
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
              <h4 className="font-bold text-white font-mono text-base">Confirm Route Decommission</h4>
            </div>
            <div className="p-5 text-sm font-mono text-slate-300 space-y-2">
              <p>
                Are you sure you want to permanently close the route between{' '}
                <strong className="text-white">
                  {cityMap.get(routeToClose.originCityId)?.name}
                </strong>{' '}
                and{' '}
                <strong className="text-white">
                  {cityMap.get(routeToClose.destCityId)?.name}
                </strong>
                ?
              </p>
              <p className="text-xs text-slate-400">
                All assigned airframes will be safely unassigned and returned to your fleet hangar.
              </p>
            </div>
            <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-end gap-3 font-mono text-xs font-bold">
              <button
                onClick={() => setRouteToClose(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClose}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition cursor-pointer shadow-lg"
              >
                Confirm Close
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
