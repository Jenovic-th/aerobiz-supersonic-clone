import React, { useState, useEffect, useMemo } from 'react';
import { Airline, AircraftModel, AircraftDiscountDeal } from '../types/game';
import { AIRCRAFTS } from '../data/aircrafts';
import { CITIES } from '../data/cities';
import { calculateDistance } from '../simulation/engine';
import { X, ShoppingCart, Plane, CheckCircle2, AlertCircle, Sparkles, Filter, Flame, Tag, AlertTriangle, Wrench, Compass, Plus, Minus, Receipt } from 'lucide-react';
import { AircraftBlueprintViewer } from './AircraftBlueprintViewer';
import { getAircraftPhotoInfo } from '../data/aircraftVisuals';

interface AircraftShopModalProps {
  playerAirline: Airline;
  onClose: () => void;
  onBuyAircraft: (model: AircraftModel, effectivePriceK?: number, quantity?: number) => void;
  onSellAircraft: (instanceId: string, sellPriceK: number) => void;
  currentYear: number;
  currentEra: 1 | 2 | 3;
  activeDiscountDeal?: AircraftDiscountDeal;
}

export const AircraftShopModal: React.FC<AircraftShopModalProps> = ({
  playerAirline,
  onClose,
  onBuyAircraft,
  onSellAircraft,
  currentYear,
  activeDiscountDeal,
}) => {
  const [activeTab, setActiveTab] = useState<'DEPOT' | 'FLEET'>('DEPOT');
  const [filterMfg, setFilterMfg] = useState<string>('ALL');

  // Filter available aircraft models for current era & year
  const availableModels = useMemo(() => {
    return AIRCRAFTS.filter((model) => {
      return model.introYear <= currentYear && (!model.retireYear || model.retireYear >= currentYear);
    });
  }, [currentYear]);

  // Helper to compute effective price with active manufacturer discount deal
  const getModelPriceInfo = (model: AircraftModel) => {
    if (activeDiscountDeal) {
      const isApplicable = activeDiscountDeal.specificModelId
        ? activeDiscountDeal.specificModelId === model.id
        : activeDiscountDeal.manufacturer.toLowerCase() === model.manufacturer.toLowerCase();

      if (isApplicable) {
        const discountedPrice = Math.round(model.priceK * (1 - activeDiscountDeal.discountPct / 100));
        return {
          priceK: discountedPrice,
          originalPriceK: model.priceK,
          hasDiscount: true,
          discountPct: activeDiscountDeal.discountPct,
        };
      }
    }
    return {
      priceK: model.priceK,
      originalPriceK: model.priceK,
      hasDiscount: false,
      discountPct: 0,
    };
  };

  // Target Destination Range Filter (Filter by destination reachability)
  const homeCity = useMemo(() => {
    return CITIES.find((c) => c.id === playerAirline.homeCityId) || CITIES[0];
  }, [playerAirline.homeCityId]);

  const [targetDestId, setTargetDestId] = useState<string>('ALL');

  const targetCityObj = useMemo(() => {
    return targetDestId !== 'ALL' ? CITIES.find((c) => c.id === targetDestId) : null;
  }, [targetDestId]);

  const targetDistance = useMemo(() => {
    return targetCityObj
      ? calculateDistance(homeCity.lat, homeCity.lon, targetCityObj.lat, targetCityObj.lon)
      : 0;
  }, [homeCity, targetCityObj]);

  const filteredModels = useMemo(() => {
    return availableModels.filter((model) => {
      // If a destination filter is set, strictly hide models that cannot reach it
      if (targetDistance > 0 && model.rangeKm < targetDistance) {
        return false;
      }
      if (filterMfg === 'ALL') return true;
      if (filterMfg === 'SUPERSONIC') return model.isSupersonic;
      if (filterMfg === 'DISCOUNT') {
        if (!activeDiscountDeal) return false;
        return activeDiscountDeal.specificModelId
          ? activeDiscountDeal.specificModelId === model.id
          : activeDiscountDeal.manufacturer.toLowerCase() === model.manufacturer.toLowerCase();
      }
      return model.manufacturer.toLowerCase().includes(filterMfg.toLowerCase());
    });
  }, [availableModels, targetDistance, filterMfg, activeDiscountDeal]);

  // Currently selected model for Blueprint viewing
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  // Selected model is simply: current selection if it is in filteredModels, otherwise the first in filteredModels!
  const selectedModel =
    filteredModels.find((m) => m.id === selectedModelId) ||
    filteredModels[0] ||
    availableModels[0] ||
    AIRCRAFTS[0];

  // Batch purchase quantity & confirmation modal
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Keyboard shortcut listener (ESC to cancel confirm modal first, otherwise close shop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmModal) {
          setShowConfirmModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmModal, onClose]);

  const selectedPriceInfo = selectedModel ? getModelPriceInfo(selectedModel) : { priceK: 0, originalPriceK: 0, hasDiscount: false, discountPct: 0 };
  const unitPriceK = selectedPriceInfo.priceK;
  const maxAffordableQuantity = unitPriceK > 0 ? Math.floor(playerAirline.cashK / unitPriceK) : 0;
  const safeQuantity = Math.max(1, orderQuantity);
  const totalCostK = unitPriceK * safeQuantity;
  const totalOriginalCostK = selectedPriceInfo.originalPriceK * safeQuantity;
  const totalSavingsK = (selectedPriceInfo.originalPriceK - unitPriceK) * safeQuantity;
  const canAfford = selectedModel ? playerAirline.cashK >= totalCostK && safeQuantity > 0 : false;
  const remainingCash = selectedModel ? playerAirline.cashK - totalCostK : 0;
  const ownedCount = selectedModel
    ? playerAirline.fleet.filter((p) => p.modelId === selectedModel.id).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-full h-full overflow-hidden text-slate-100 animate-in fade-in duration-150">
      <div className="w-full h-full flex flex-col overflow-hidden bg-slate-950">
        {/* Top Header - Full Window Bleed */}
        <div className="shrink-0 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 px-6 py-3.5 border-b border-sky-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-900/70 border border-sky-500 shadow">
              <ShoppingCart className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white tracking-wide font-mono flex items-center gap-2">
                COMMERCIAL AIRCRAFT MARKET & FLEET HANGAR
              </h2>
              <div className="text-xs text-sky-300/80 font-mono">
                Aerospace Showroom & Commercial Fleet Procurement • Year {currentYear}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Airline Available Cash Balance */}
            <div className="bg-slate-950/90 border-2 border-emerald-500/80 px-4 py-1.5 rounded-xl shadow-lg text-right">
              <span className="text-[10px] text-slate-400 font-mono block">YOUR AVAILABLE CASH:</span>
              <span className="text-base md:text-lg font-black font-mono text-emerald-400">
                ${playerAirline.cashK.toLocaleString()}K
              </span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800/90 hover:bg-rose-900/70 border border-slate-700 hover:border-rose-500 rounded-xl text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-2 font-mono text-xs font-bold shadow"
              title="Close Aircraft Showroom (Esc)"
            >
              <X className="w-5 h-5 text-rose-400" />
              <span className="hidden sm:inline">CLOSE SHOWROOM (ESC)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-700 bg-slate-950 px-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('DEPOT')}
              className={`py-3 px-6 text-sm md:text-base font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'DEPOT'
                  ? 'border-sky-400 text-sky-400 bg-sky-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Acquire New Aircraft ({availableModels.length} Models Available)</span>
            </button>
            <button
              onClick={() => setActiveTab('FLEET')}
              className={`py-3 px-6 text-sm md:text-base font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'FLEET'
                  ? 'border-sky-400 text-sky-400 bg-sky-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plane className="w-4 h-4 text-sky-400" />
              <span>Company Fleet Hangar ({playerAirline.fleet.length} Aircraft Owned)</span>
            </button>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-sky-300">
            <span>ACTIVE FLEET: {playerAirline.fleet.filter((f) => f.assignedRouteId).length}</span>
            <span>•</span>
            <span>IDLE IN HANGAR: {playerAirline.fleet.filter((f) => !f.assignedRouteId).length}</span>
          </div>
        </div>

        {/* Main Workspace Body */}
        {activeTab === 'DEPOT' ? (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* LEFT COLUMN: Aircraft Selection Catalog (Comfortable 460px width, no horizontal truncation) */}
            <div className="w-full md:w-[440px] lg:w-[480px] xl:w-[500px] shrink-0 flex flex-col border-r border-slate-700/80 bg-slate-950">
              {/* Manufacturer Filter Chips (Flex-wrap with comfortable spacing) */}
              <div className="p-3 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-sky-400 font-mono font-bold mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>FILTER:</span>
                </div>
                {['ALL', 'Boeing', 'Airbus', 'SUPERSONIC'].map((mfg) => (
                  <button
                    key={mfg}
                    onClick={() => setFilterMfg(mfg)}
                    className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs transition cursor-pointer ${
                      filterMfg === mfg
                        ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {mfg === 'ALL' ? 'All Models' : mfg}
                  </button>
                ))}
              </div>

              {/* Dedicated Full-Width Flash Promotion Banner (Never clipped, prominent gold) */}
              {activeDiscountDeal && (
                <div className="px-3 pt-2.5 pb-1 bg-slate-950">
                  <button
                    onClick={() => setFilterMfg(filterMfg === 'DISCOUNT' ? 'ALL' : 'DISCOUNT')}
                    className={`w-full px-3.5 py-2 rounded-xl font-mono font-bold text-xs transition cursor-pointer flex items-center justify-between border ${
                      filterMfg === 'DISCOUNT'
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.6)] font-black'
                        : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-amber-500/80 text-amber-300 hover:border-amber-400 hover:bg-amber-900/40 shadow'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                      <span>SPECIAL {activeDiscountDeal.discountPct}% OFF REBATE: {activeDiscountDeal.manufacturer.toUpperCase()}</span>
                    </span>
                    <span className="text-[10px] uppercase font-black tracking-wider bg-amber-950/90 border border-amber-500/50 px-2 py-0.5 rounded-md text-amber-200">
                      {filterMfg === 'DISCOUNT' ? 'FILTER ON' : 'FILTER'}
                    </span>
                  </button>
                </div>
              )}

              {/* Destination Reachability Filter (Koei Aerobiz Route Filter) */}
              <div className="px-3 py-2.5 border-b border-slate-800 bg-slate-900/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono font-bold text-sky-300 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Filter for Route from {homeCity.name}:</span>
                  </span>
                  {targetDestId !== 'ALL' && (
                    <button
                      onClick={() => setTargetDestId('ALL')}
                      className="text-[10px] text-sky-400 hover:text-white underline cursor-pointer font-mono"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                <select
                  value={targetDestId}
                  onChange={(e) => setTargetDestId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-sky-400 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Show All Models (No Route Range Filter)</option>
                  {CITIES.filter((c) => c.id !== homeCity.id)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((city) => {
                      const dist = calculateDistance(homeCity.lat, homeCity.lon, city.lat, city.lon);
                      return (
                        <option key={city.id} value={city.id}>
                          To {city.name} ({city.country}) • {dist.toLocaleString()} km
                        </option>
                      );
                    })}
                </select>
                {targetCityObj && (
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-emerald-400">
                    <span>Route: {homeCity.name} ➔ {targetCityObj.name}</span>
                    <span className="font-bold">Required Range: ≥ {targetDistance.toLocaleString()} km</span>
                  </div>
                )}
              </div>

              {/* Active Flash Promotion Banner */}
              {activeDiscountDeal && (
                <div className="m-3 p-3 bg-gradient-to-r from-amber-950 via-rose-950 to-orange-950 border border-amber-500/80 rounded-xl shadow-lg">
                  <div className="flex items-center gap-2 text-amber-300 font-mono font-black text-xs">
                    <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>
                      {activeDiscountDeal.specificModelId
                        ? `🔥 CLEARANCE: ${activeDiscountDeal.discountPct}% OFF ${activeDiscountDeal.modelName || activeDiscountDeal.specificModelId}!`
                        : `🔥 ${activeDiscountDeal.discountPct}% FACTORY DISCOUNT ACTIVE!`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1 leading-snug">
                    {activeDiscountDeal.reason || `${activeDiscountDeal.manufacturer} is offering a ${activeDiscountDeal.discountPct}% rebate this quarter.`}
                  </div>
                </div>
              )}

              {/* Scrollable Model List */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                {filteredModels.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-dashed border-slate-700 space-y-2.5">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <div className="font-bold text-slate-200 text-sm font-mono">No Capable Aircraft Found</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {targetCityObj
                        ? `No aircraft in this category can reach ${targetCityObj.name} (${targetDistance.toLocaleString()} km).`
                        : 'No aircraft match the current manufacturer filter.'}
                    </p>
                    <button
                      onClick={() => {
                        setTargetDestId('ALL');
                        setFilterMfg('ALL');
                      }}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold transition cursor-pointer shadow"
                    >
                      Reset Range & Manufacturer Filters
                    </button>
                  </div>
                ) : (
                  filteredModels.map((model) => {
                  const isSelected = selectedModel?.id === model.id;
                  const priceInfo = getModelPriceInfo(model);
                  const affordable = playerAirline.cashK >= priceInfo.priceK;
                  const owned = playerAirline.fleet.filter((f) => f.modelId === model.id).length;
                  const isRetiringThisYear = model.retireYear === currentYear;
                  const isRetiringNextYear = model.retireYear === currentYear + 1;
                  const photoInfo = getAircraftPhotoInfo(model);

                  return (
                    <div
                      key={model.id}
                      data-model-id={model.id}
                      onClick={() => {
                        setSelectedModelId(model.id);
                        setOrderQuantity(1);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer select-none group ${
                        isSelected
                          ? 'bg-sky-950/80 border-2 border-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.3)]'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Realistic Aviation Photo Thumbnail */}
                        <div className="shrink-0 w-20 h-14 rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 relative shadow group-hover:border-sky-400 transition">
                          <img
                            src={photoInfo.photoUrl}
                            alt={model.model}
                            className="w-full h-full object-cover object-center filter brightness-105"
                          />
                          {model.isSupersonic && (
                            <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black font-mono text-[8px] leading-tight shadow">
                              SST
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <div className="font-black text-sm md:text-base text-white flex items-center gap-1.5 flex-wrap">
                                <span className="truncate">{model.model}</span>
                                {isRetiringThisYear && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600/30 text-rose-300 border border-rose-500 flex items-center gap-0.5 animate-pulse">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>FINAL YEAR</span>
                                  </span>
                                )}
                                {!isRetiringThisYear && isRetiringNextYear && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500 flex items-center gap-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>RETIRES {model.retireYear}</span>
                                  </span>
                                )}
                                {priceInfo.hasDiscount && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-0.5">
                                    <Flame className="w-2.5 h-2.5" />
                                    <span>{priceInfo.discountPct}% OFF</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5 font-mono">
                                {model.manufacturer} • Intro {model.introYear} {model.retireYear ? `• End ${model.retireYear}` : ''}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              {priceInfo.hasDiscount ? (
                                <div>
                                  <span className="line-through text-slate-500 font-mono text-[11px] block">
                                    ${priceInfo.originalPriceK.toLocaleString()}K
                                  </span>
                                  <span className="font-black font-mono text-sm md:text-base text-amber-300">
                                    ${priceInfo.priceK.toLocaleString()}K
                                  </span>
                                </div>
                              ) : (
                                <div className="font-black font-mono text-sm md:text-base text-emerald-400">
                                  ${priceInfo.priceK.toLocaleString()}K
                                </div>
                              )}
                              {owned > 0 && (
                                <span className="text-[10px] font-mono font-bold text-sky-400 block mt-0.5">
                                  Owned: {owned}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-300 border-t border-slate-800/80 pt-1.5">
                            <span>{model.capacity} Seats</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">{model.rangeKm.toLocaleString()} km</span>
                            <span>•</span>
                            <span>{model.speedKmh} km/h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }))}
              </div>
            </div>

            {/* RIGHT COLUMN: Full Aerospace Technical Blueprint Viewer & Ordering Bar */}
            <div className="flex-1 min-h-0 flex flex-col p-3 md:p-4 bg-slate-900/90 overflow-hidden">
              {/* Large CAD Blueprint Schematic */}
              <div className="flex-1 min-h-0 relative">
                {selectedModel && <AircraftBlueprintViewer key={selectedModel.id} model={selectedModel} />}
              </div>

              {/* Bottom Order Execution Strip */}
              {selectedModel && (
                <div className="shrink-0 mt-3 p-3.5 bg-slate-950 border-2 border-sky-800/70 rounded-xl flex flex-col xl:flex-row xl:items-center justify-between gap-3 shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-400">ORDERING UNIT:</span>
                      <strong className="text-sky-300 font-mono text-base">{selectedModel.model}</strong>
                      {ownedCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-sky-900/60 text-sky-300 border border-sky-500 text-xs font-mono">
                          Already own {ownedCount} in fleet
                        </span>
                      )}
                      {selectedModel.retireYear === currentYear && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500 text-xs font-mono font-black flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Final Production Year ({selectedModel.retireYear})</span>
                        </span>
                      )}
                      {selectedModel.retireYear === currentYear + 1 && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500 text-xs font-mono font-black flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Assembly Ceases Next Year ({selectedModel.retireYear})</span>
                        </span>
                      )}
                      {selectedPriceInfo.hasDiscount && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/80 text-xs font-mono font-black flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{selectedPriceInfo.discountPct}% OFF Discount Applied!</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2.5 flex-wrap">
                      <span>
                        Unit Price:{' '}
                        {selectedPriceInfo.hasDiscount ? (
                          <span>
                            <span className="line-through text-slate-500 mr-1">
                              ${selectedPriceInfo.originalPriceK.toLocaleString()}K
                            </span>
                            <span className="text-amber-300 font-bold">${unitPriceK.toLocaleString()}K</span>
                          </span>
                        ) : (
                          <span className="text-white font-bold">${unitPriceK.toLocaleString()}K</span>
                        )}
                      </span>
                      <span>•</span>
                      <span>
                        Order Total:{' '}
                        <strong className="text-emerald-400 font-bold text-sm">
                          ${totalCostK.toLocaleString()}K
                        </strong>
                      </span>
                      <span>•</span>
                      {canAfford ? (
                        <span className="text-emerald-400 font-bold">
                          Cash balance after delivery: ${remainingCash.toLocaleString()}K
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Short by ${(totalCostK - playerAirline.cashK).toLocaleString()}K
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {/* Quantity Stepper & Quick Presets */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 p-1 rounded-xl">
                      <span className="text-[11px] font-mono text-slate-400 px-2 font-bold uppercase">
                        QTY:
                      </span>
                      <button
                        type="button"
                        disabled={safeQuantity <= 1}
                        onClick={() => setOrderQuantity((prev) => Math.max(1, prev - 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 hover:text-white font-mono font-black cursor-pointer border border-slate-600 transition"
                        title="Decrease quantity by 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <div className="px-2.5 py-0.5 bg-slate-950 border border-slate-700 rounded-lg text-center min-w-[58px]">
                        <span className="font-mono font-black text-white text-base leading-none">
                          {safeQuantity}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">
                          {safeQuantity === 1 ? 'airframe' : 'airframes'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setOrderQuantity((prev) => prev + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono font-black cursor-pointer border border-slate-600 transition"
                        title="Increase quantity by 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      {/* Quick preset chips */}
                      <div className="flex items-center gap-1 ml-1 border-l border-slate-700/80 pl-1.5">
                        {[1, 2, 3, 5].map((qty) => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => setOrderQuantity(qty)}
                            className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold transition cursor-pointer ${
                              safeQuantity === qty
                                ? 'bg-sky-500 text-slate-950 font-black'
                                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            {qty}x
                          </button>
                        ))}
                        {maxAffordableQuantity > 0 && (
                          <button
                            type="button"
                            onClick={() => setOrderQuantity(maxAffordableQuantity)}
                            className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold transition cursor-pointer border ${
                              safeQuantity === maxAffordableQuantity
                                ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                                : 'bg-amber-950/40 text-amber-300 border-amber-500/50 hover:bg-amber-900/60'
                            }`}
                            title={`Order maximum affordable quantity (${maxAffordableQuantity})`}
                          >
                            Max ({maxAffordableQuantity})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Review & Place Order Button */}
                    <button
                      disabled={!canAfford}
                      onClick={() => setShowConfirmModal(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-30 disabled:pointer-events-none text-white font-black text-sm md:text-base rounded-xl shadow-xl transition-all active:scale-95 border-2 border-emerald-400 cursor-pointer flex items-center gap-2"
                    >
                      <Receipt className="w-4 h-4 text-emerald-200" />
                      <span>
                        Review & Order {safeQuantity}x (${totalCostK.toLocaleString()}K)
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* FLEET HANGAR / RESALE DEPOT */
          <div className="flex-1 min-h-0 p-6 overflow-y-auto bg-slate-950">
            {playerAirline.fleet.length === 0 ? (
              <div className="text-center py-20 text-slate-400 font-mono text-lg">
                Your hangar is currently empty! Switch to the Aircraft Market to purchase your first commercial airliner.
              </div>
            ) : (
              <div className="max-w-5xl mx-auto space-y-3">
                <div className="text-sm font-mono text-slate-300 mb-2">
                  Company Aircraft Registry ({playerAirline.fleet.length} active airframes)
                </div>
                {playerAirline.fleet.map((plane, index) => {
                  const model = AIRCRAFTS.find((a) => a.id === plane.modelId);
                  if (!model) return null;
                  const isAssigned = plane.assignedRouteId !== null;

                  const ageYears = plane.ageYears ?? (plane.purchaseYear ? currentYear - plane.purchaseYear : 0);
                  const conditionPct = plane.conditionPct ?? Math.max(30, 100 - ageYears * 2.5);

                  // Condition factor reduces resale value realistically as plane wears down and ages
                  const conditionFactor = Math.max(0.35, conditionPct / 100);
                  const sellValueK = Math.round(model.priceK * 0.7 * conditionFactor);

                  // Maintenance impact & breakdown risk
                  let maintTier = {
                    label: 'Mint Condition',
                    mult: '1.0x',
                    color: 'text-emerald-400',
                    badgeBg: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300',
                    risk: 'Low Breakdown Risk',
                  };
                  if (ageYears >= 25) {
                    maintTier = {
                      label: 'Critical Fatigue',
                      mult: '2.1x',
                      color: 'text-rose-400',
                      badgeBg: 'bg-rose-950/80 border-rose-500/70 text-rose-300',
                      risk: 'High Breakdown Risk',
                    };
                  } else if (ageYears >= 19) {
                    maintTier = {
                      label: 'Heavy Airframe Wear',
                      mult: '1.65x',
                      color: 'text-orange-400',
                      badgeBg: 'bg-orange-950/70 border-orange-500/60 text-orange-300',
                      risk: 'Elevated Breakdown Risk',
                    };
                  } else if (ageYears >= 13) {
                    maintTier = {
                      label: 'Aging Airframe',
                      mult: '1.35x',
                      color: 'text-amber-400',
                      badgeBg: 'bg-amber-950/70 border-amber-500/60 text-amber-300',
                      risk: 'Moderate Breakdown Risk',
                    };
                  } else if (ageYears >= 6) {
                    maintTier = {
                      label: 'Standard Service',
                      mult: '1.15x',
                      color: 'text-sky-300',
                      badgeBg: 'bg-sky-950/60 border-sky-500/50 text-sky-300',
                      risk: 'Normal Risk',
                    };
                  }

                  const condBarColor =
                    conditionPct >= 80
                      ? 'bg-emerald-500'
                      : conditionPct >= 65
                      ? 'bg-sky-500'
                      : conditionPct >= 45
                      ? 'bg-amber-500'
                      : 'bg-rose-500';

                  const fleetPhoto = getAircraftPhotoInfo(model);

                  return (
                    <div
                      key={plane.instanceId}
                      className="bg-slate-900 border border-slate-700 hover:border-slate-500 p-4 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg transition"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Real Photo Thumbnail with Registration Index */}
                        <div className="w-20 h-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative shadow shrink-0">
                          <img
                            src={fleetPhoto.photoUrl}
                            alt={model.model}
                            className="w-full h-full object-cover object-center filter brightness-105"
                          />
                          <span className="absolute bottom-0.5 left-0.5 bg-slate-950/85 px-1.5 py-0.2 rounded font-mono text-[9px] text-sky-300 font-bold border border-slate-700">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-base md:text-lg text-white flex items-center gap-2 flex-wrap">
                            <span>{model.model}</span>
                            {model.isSupersonic && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/50">
                                SST
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${maintTier.badgeBg}`}>
                              {maintTier.label} ({maintTier.mult} Maint)
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 font-mono mt-0.5">
                            {model.manufacturer} • {model.capacity} Seats • Max Range: {model.rangeKm.toLocaleString()} km
                          </div>

                          {/* Airframe Age & Mechanical Condition Health Bar */}
                          <div className="mt-2.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-wrap items-center gap-4 text-xs font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 text-[11px]">Airframe Age:</span>
                              <span className="font-bold text-white">
                                {ageYears} Yrs Old
                              </span>
                              <span className="text-[10px] text-slate-500">
                                (Built {plane.purchaseYear || currentYear - ageYears})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 min-w-[160px] flex-1">
                              <span className="text-slate-400 text-[11px] shrink-0">Condition:</span>
                              <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${condBarColor}`}
                                  style={{ width: `${conditionPct}%` }}
                                />
                              </div>
                              <span className={`font-bold shrink-0 ${maintTier.color}`}>
                                {conditionPct}%
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400">
                              Risk: <span className="font-semibold text-slate-200">{maintTier.risk}</span>
                            </div>
                          </div>

                          <div className="mt-2">
                            {isAssigned ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-950 text-sky-400 border border-sky-700">
                                ✈ Assigned to Commercial Route ({plane.assignedRouteId})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-700">
                                ✓ Idle in Hangar (Available for Route Assignment)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 font-mono block">Secondary Resale Value:</span>
                          <span className="font-black font-mono text-base md:text-lg text-emerald-400">
                            ${sellValueK.toLocaleString()}K
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono block">
                            (Depreciated: {conditionPct}% condition)
                          </span>
                        </div>
                        <button
                          disabled={isAssigned}
                          onClick={() => onSellAircraft(plane.instanceId, sellValueK)}
                          className="px-4 py-2.5 bg-rose-950 hover:bg-rose-900 border border-rose-500 disabled:opacity-30 disabled:pointer-events-none text-rose-200 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer font-mono"
                        >
                          {isAssigned ? 'In Flight Service' : 'Sell Airframe'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PROCUREMENT CONTRACT REVIEW & CONFIRMATION MODAL */}
      {showConfirmModal && selectedModel && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-sky-500/80 rounded-2xl shadow-[0_0_60px_rgba(14,165,233,0.35)] w-full max-w-2xl overflow-hidden text-slate-100 flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]">
            {/* Contract Header */}
            <div className="shrink-0 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 px-5 py-3.5 border-b border-sky-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-900/80 border border-sky-400 shadow">
                  <Receipt className="w-5 h-5 text-sky-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-wide font-mono flex items-center gap-2">
                    AIRCRAFT PROCUREMENT CONTRACT REVIEW
                  </h3>
                  <div className="text-xs text-sky-300/80 font-mono">
                    ใบตรวจสอบและยืนยันสัญญาจัดซื้ออากาศยานพาณิชย์ • Review before final commitment
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/70 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-white transition cursor-pointer"
                title="Cancel and close review"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contract Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Aircraft Summary with Realistic Photo */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-4">
                <div className="w-24 h-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0 shadow relative">
                  <img
                    src={getAircraftPhotoInfo(selectedModel).photoUrl}
                    alt={selectedModel.model}
                    className="w-full h-full object-cover object-center filter brightness-105"
                  />
                  {selectedModel.isSupersonic && (
                    <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black font-mono text-[8px]">
                      SST
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-sky-400 font-bold uppercase tracking-wider">
                    {selectedModel.manufacturer} AEROSPACE
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white font-mono truncate">
                    {selectedModel.model}
                  </h4>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-3 mt-1 flex-wrap">
                    <span>{selectedModel.capacity} Passengers</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">{selectedModel.rangeKm.toLocaleString()} km Range</span>
                    <span>•</span>
                    <span>{selectedModel.speedKmh} km/h Cruise</span>
                  </div>
                </div>
              </div>

              {/* In-Modal Quantity Adjustment */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-300 block">
                    NUMBER OF AIRFRAMES TO PROCURE (จำนวนลำที่สั่งซื้อ):
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Adjust quantity before finalizing the contract
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safeQuantity <= 1}
                    onClick={() => setOrderQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 hover:text-white font-mono font-black border border-slate-600 transition cursor-pointer"
                    title="Decrease quantity by 1"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center min-w-[64px]">
                    <span className="font-mono font-black text-white text-lg leading-none">
                      {safeQuantity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block -mt-0.5">
                      {safeQuantity === 1 ? 'airframe' : 'airframes'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOrderQuantity((prev) => prev + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono font-black border border-slate-600 transition cursor-pointer"
                    title="Increase quantity by 1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1 ml-1 border-l border-slate-700/80 pl-2">
                    {[1, 2, 3, 5].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setOrderQuantity(qty)}
                        className={`px-2 py-1 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                          safeQuantity === qty
                            ? 'bg-sky-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {qty}x
                      </button>
                    ))}
                    {maxAffordableQuantity > 0 && (
                      <button
                        type="button"
                        onClick={() => setOrderQuantity(maxAffordableQuantity)}
                        className={`px-2 py-1 rounded-md text-xs font-mono font-bold transition cursor-pointer border ${
                          safeQuantity === maxAffordableQuantity
                            ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                            : 'bg-amber-950/40 text-amber-300 border-amber-500/50 hover:bg-amber-900/60'
                        }`}
                      >
                        Max ({maxAffordableQuantity})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Table / Invoice */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2.5 font-mono text-sm">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Unit Base Price:</span>
                  <span className="font-bold text-white">
                    ${selectedPriceInfo.originalPriceK.toLocaleString()}K per unit
                  </span>
                </div>

                {selectedPriceInfo.hasDiscount && (
                  <div className="flex justify-between items-center text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      <span>Promotional Rebate ({selectedPriceInfo.discountPct}% OFF):</span>
                    </span>
                    <span className="font-bold">
                      -${totalSavingsK.toLocaleString()}K
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-300">
                  <span>Effective Unit Acquisition Price:</span>
                  <span className="font-bold text-emerald-400">
                    ${unitPriceK.toLocaleString()}K
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Order Quantity (จำนวนลำ):</span>
                  <span className="font-bold text-sky-400">
                    × {safeQuantity} {safeQuantity === 1 ? 'Airframe' : 'Airframes'}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center text-base">
                  <span className="font-bold text-white">Total Acquisition Cost (ยอดรวมชำระ):</span>
                  <span className="font-black text-xl text-emerald-400">
                    ${totalCostK.toLocaleString()}K
                  </span>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-800/80 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Current Company Cash (ยอดเงินปัจจุบัน):</span>
                    <span className="font-bold text-slate-200">${playerAirline.cashK.toLocaleString()}K</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Projected Balance After Delivery (เงินคงเหลือหลังจ่าย):</span>
                    {canAfford ? (
                      <span className="font-bold text-emerald-400">
                        ${remainingCash.toLocaleString()}K
                      </span>
                    ) : (
                      <span className="font-bold text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Insufficient Cash (Short by ${(totalCostK - playerAirline.cashK).toLocaleString()}K)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Working Capital Warning */}
              {canAfford && remainingCash < 15000 && (
                <div className="p-3 bg-amber-950/60 border border-amber-500/70 rounded-xl flex items-center gap-3 text-xs font-mono text-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold block">Low Working Capital Advisory:</span>
                    Your airline will have less than $15,000K remaining after this order. Keep sufficient liquidity for route maintenance and operating overhead!
                  </div>
                </div>
              )}
            </div>

            {/* Contract Footer: Explicit Cancel & Confirm Buttons */}
            <div className="shrink-0 bg-slate-950 px-5 py-3.5 border-t border-slate-800 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500 rounded-xl text-slate-300 hover:text-white font-mono font-bold text-sm transition cursor-pointer flex items-center gap-2"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>Cancel Order (ยกเลิก)</span>
              </button>

              <button
                type="button"
                disabled={!canAfford}
                onClick={() => {
                  onBuyAircraft(selectedModel, unitPriceK, safeQuantity);
                  setShowConfirmModal(false);
                  setToastNotification(
                    `Acquired ${safeQuantity}x ${selectedModel.model} for $${totalCostK.toLocaleString()}K into your fleet hangar!`
                  );
                  setOrderQuantity(1);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-35 disabled:pointer-events-none text-white font-black text-sm sm:text-base rounded-xl shadow-xl transition-all active:scale-95 border-2 border-emerald-400 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>
                  Confirm & Finalize Purchase (${totalCostK.toLocaleString()}K)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST SUCCESS NOTIFICATION */}
      {toastNotification && (
        <div className="fixed top-16 right-6 z-60 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-400 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="p-1.5 rounded-full bg-emerald-500 text-slate-950">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="font-mono text-xs md:text-sm font-bold">
            {toastNotification}
          </div>
        </div>
      )}
    </div>
  );
};
