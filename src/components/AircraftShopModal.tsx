import React, { useState, useEffect, useMemo } from 'react';
import { Airline, AircraftModel, AircraftDiscountDeal } from '../types/game';
import { AIRCRAFTS } from '../data/aircrafts';
import { CITIES } from '../data/cities';
import { calculateDistance } from '../simulation/engine';
import { X, ShoppingCart, Plane, CheckCircle2, AlertCircle, Sparkles, Filter, Flame, Tag, AlertTriangle, Wrench, Compass } from 'lucide-react';
import { AircraftBlueprintViewer } from './AircraftBlueprintViewer';
import { getAircraftPhotoInfo } from '../data/aircraftVisuals';

interface AircraftShopModalProps {
  playerAirline: Airline;
  onClose: () => void;
  onBuyAircraft: (model: AircraftModel, effectivePriceK?: number) => void;
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

  const selectedPriceInfo = selectedModel ? getModelPriceInfo(selectedModel) : { priceK: 0, originalPriceK: 0, hasDiscount: false, discountPct: 0 };
  const canAfford = selectedModel ? playerAirline.cashK >= selectedPriceInfo.priceK : false;
  const remainingCash = selectedModel ? playerAirline.cashK - selectedPriceInfo.priceK : 0;
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
                      onClick={() => setSelectedModelId(model.id)}
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
                <div className="shrink-0 mt-3 p-3.5 bg-slate-950 border-2 border-sky-800/70 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
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
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {canAfford ? (
                        <span className="text-emerald-400 font-bold">
                          Cash balance after delivery: ${remainingCash.toLocaleString()}K
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Short by ${(selectedPriceInfo.priceK - playerAirline.cashK).toLocaleString()}K
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      disabled={!canAfford}
                      onClick={() => onBuyAircraft(selectedModel, selectedPriceInfo.priceK)}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-30 disabled:pointer-events-none text-white font-black text-sm md:text-base rounded-xl shadow-xl transition-all active:scale-95 border-2 border-emerald-400 cursor-pointer flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                      <span>
                        Order Aircraft for ${selectedPriceInfo.priceK.toLocaleString()}K
                        {selectedPriceInfo.hasDiscount && (
                          <span className="text-xs text-amber-200 ml-1.5 font-mono">
                            (Save ${(selectedPriceInfo.originalPriceK - selectedPriceInfo.priceK).toLocaleString()}K)
                          </span>
                        )}
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
    </div>
  );
};
