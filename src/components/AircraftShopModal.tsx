import React, { useState, useEffect, useMemo } from 'react';
import { Airline, AircraftModel, AircraftDiscountDeal } from '../types/game';
import { AIRCRAFTS, getAllAircraftModels } from '../data/aircrafts';
import { CITIES } from '../data/cities';
import { calculateDistance } from '../simulation/engine';
import { X, ShoppingCart, Plane, CheckCircle2, AlertCircle, Sparkles, Filter, Flame, Tag, AlertTriangle, Wrench, Compass, Plus, Minus, Receipt, Clock, Building2, Calendar, Eye } from 'lucide-react';
import { AircraftBlueprintViewer } from './AircraftBlueprintViewer';
import { getAircraftPhotoInfo } from '../data/aircraftVisuals';

interface AircraftShopModalProps {
  playerAirline: Airline;
  onClose: () => void;
  onBuyAircraft: (model: AircraftModel, effectivePriceK?: number, quantity?: number) => void;
  onSellAircraft: (instanceId: string, sellPriceK: number) => void;
  currentYear: number;
  currentQuarter?: number;
  currentEra: 1 | 2 | 3;
  activeDiscountDeal?: AircraftDiscountDeal;
}

export const AircraftShopModal: React.FC<AircraftShopModalProps> = ({
  playerAirline,
  onClose,
  onBuyAircraft,
  onSellAircraft,
  currentYear,
  currentQuarter = 1,
  activeDiscountDeal,
}) => {
  const [activeTab, setActiveTab] = useState<'DEPOT' | 'FLEET' | 'PENDING' | 'TIMELINE'>('DEPOT');
  const [filterMfg, setFilterMfg] = useState<string>('ALL');
  const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'RETIRED'>('ALL');
  const [timelineSelectedId, setTimelineSelectedId] = useState<string>('');

  const pendingOrders = playerAirline.pendingOrders || [];
  const nextDeliveryQuarter = currentQuarter === 4 ? 1 : currentQuarter + 1;
  const nextDeliveryYear = currentQuarter === 4 ? currentYear + 1 : currentYear;

  // Master catalog including future models dynamically up to currentYear + 15
  const allAircraftCatalog = useMemo(() => {
    return getAllAircraftModels(Math.max(currentYear + 15, 2075));
  }, [currentYear]);

  // Filter available aircraft models for current era & year
  const availableModels = useMemo(() => {
    return allAircraftCatalog.filter((model) => {
      return model.introYear <= currentYear && (!model.retireYear || model.retireYear >= currentYear);
    });
  }, [allAircraftCatalog, currentYear]);

  // Dynamic statistics per manufacturer for available models in this era/year
  const manufacturerStats = useMemo(() => {
    const counts: Record<string, number> = {};
    availableModels.forEach((m) => {
      counts[m.manufacturer] = (counts[m.manufacturer] || 0) + 1;
    });
    return counts;
  }, [availableModels]);

  const supersonicCount = useMemo(() => {
    return availableModels.filter((m) => m.isSupersonic).length;
  }, [availableModels]);

  // Order active manufacturers logically (Boeing, McDonnell Douglas, Airbus, Lockheed, Ilyushin, Tupolev, etc.)
  const activeManufacturers = useMemo(() => {
    const priority = [
      'Boeing',
      'McDonnell Douglas',
      'Airbus',
      'Lockheed',
      'Ilyushin',
      'Tupolev',
      'Aérospatiale',
      'Boom Supersonic',
      'Tesla Aerospace',
      'SpaceX',
    ];
    return Object.keys(manufacturerStats).sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return (manufacturerStats[b] || 0) - (manufacturerStats[a] || 0);
    });
  }, [manufacturerStats]);

  const getMfgMeta = (mfg: string) => {
    const lower = mfg.toLowerCase();
    if (lower.includes('boeing')) return { flag: '🇺🇸', shortName: 'Boeing', country: 'USA' };
    if (lower.includes('mcdonnell') || lower.includes('douglas'))
      return { flag: '🇺🇸', shortName: 'McDonnell Douglas', country: 'USA' };
    if (lower.includes('lockheed')) return { flag: '🇺🇸', shortName: 'Lockheed', country: 'USA' };
    if (lower.includes('airbus')) return { flag: '🇪🇺', shortName: 'Airbus', country: 'Europe' };
    if (lower.includes('aérospatiale') || lower.includes('aerospatiale'))
      return { flag: '🇫🇷', shortName: 'Aérospatiale', country: 'France/UK' };
    if (lower.includes('ilyushin')) return { flag: '🇷🇺', shortName: 'Ilyushin (Ил)', country: 'USSR/RU' };
    if (lower.includes('tupolev')) return { flag: '🇷🇺', shortName: 'Tupolev (Ту)', country: 'USSR/RU' };
    if (lower.includes('boom')) return { flag: '⚡', shortName: 'Boom', country: 'USA' };
    if (lower.includes('embraer')) return { flag: '🇧🇷', shortName: 'Embraer', country: 'Brazil' };
    if (lower.includes('comac')) return { flag: '🇨🇳', shortName: 'COMAC', country: 'China' };
    if (lower.includes('tesla') || lower.includes('spacex'))
      return { flag: '🚀', shortName: mfg, country: 'USA' };
    return { flag: '✈️', shortName: mfg, country: 'Global' };
  };

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
      return (
        model.manufacturer.toLowerCase() === filterMfg.toLowerCase() ||
        model.manufacturer.toLowerCase().includes(filterMfg.toLowerCase())
      );
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

  // Auto-focus first model in list when user changes manufacturer filter
  useEffect(() => {
    if (filteredModels.length > 0 && !filteredModels.some((m) => m.id === selectedModelId)) {
      setSelectedModelId(filteredModels[0].id);
      setOrderQuantity(1);
    }
  }, [filteredModels, selectedModelId]);

  // Sorted chronological timeline of all models
  const timelineModels = useMemo(() => {
    const list = [...allAircraftCatalog].sort((a, b) => {
      if (a.introYear !== b.introYear) return a.introYear - b.introYear;
      return a.model.localeCompare(b.model);
    });

    if (timelineFilter === 'ACTIVE') {
      return list.filter((m) => m.introYear <= currentYear && (!m.retireYear || m.retireYear >= currentYear));
    }
    if (timelineFilter === 'UPCOMING') {
      return list.filter((m) => m.introYear > currentYear);
    }
    if (timelineFilter === 'RETIRED') {
      return list.filter((m) => m.retireYear && m.retireYear < currentYear);
    }
    return list;
  }, [allAircraftCatalog, timelineFilter, currentYear]);

  const selectedTimelineModel = useMemo(() => {
    return (
      timelineModels.find((m) => m.id === timelineSelectedId) ||
      timelineModels.find((m) => m.introYear > currentYear) ||
      timelineModels[0] ||
      allAircraftCatalog[0]
    );
  }, [timelineModels, timelineSelectedId, currentYear, allAircraftCatalog]);

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
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-700 flex items-center gap-1.5"
              title="Close (Esc)"
              data-testid="modal-close-header-btn"
            >
              <X className="w-5 h-5 text-rose-400" />
              <span className="text-xs font-mono font-bold hidden sm:inline">CLOSE [ESC]</span>
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
              <span>Catalog ({availableModels.length} Models)</span>
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`py-3 px-6 text-sm md:text-base font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'border-amber-400 text-amber-400 bg-amber-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>
                Factory Order Book ({pendingOrders.reduce((sum, o) => sum + o.quantity, 0)} on Order)
              </span>
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
              <span>Fleet Hangar ({playerAirline.fleet.length} Owned)</span>
            </button>
            <button
              onClick={() => setActiveTab('TIMELINE')}
              className={`py-3 px-6 text-sm md:text-base font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'TIMELINE'
                  ? 'border-purple-400 text-purple-400 bg-purple-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>R&D Roadmap ({allAircraftCatalog.length} Models)</span>
            </button>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-sky-300">
            <span>ACTIVE: {playerAirline.fleet.filter((f) => f.assignedRouteId).length}</span>
            <span>•</span>
            <span>HANGAR: {playerAirline.fleet.filter((f) => !f.assignedRouteId).length}</span>
            {pendingOrders.length > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-300 font-bold">
                  PENDING DELIVERY: {pendingOrders.reduce((sum, o) => sum + o.quantity, 0)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Main Workspace Body */}
        {activeTab === 'DEPOT' ? (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* LEFT COLUMN: Aircraft Selection Catalog (Comfortable 460px width, no horizontal truncation) */}
            <div className="w-full md:w-[440px] lg:w-[480px] xl:w-[500px] shrink-0 flex flex-col border-r border-slate-700/80 bg-slate-950">
              {/* Dynamic Manufacturer Showroom Deck */}
              <div className="p-3 border-b border-slate-800 bg-slate-950/95 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sky-400 font-mono font-bold text-xs">
                    <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>MANUFACTURER SHOWROOM:</span>
                  </div>
                  {filterMfg !== 'ALL' && (
                    <button
                      onClick={() => setFilterMfg('ALL')}
                      className="text-[10px] text-sky-400 hover:text-white underline cursor-pointer font-mono"
                    >
                      Show All ({availableModels.length})
                    </button>
                  )}
                </div>

                {/* Filter Chips: All, Each Manufacturer in Era, Supersonic */}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {/* All Models Chip */}
                  <button
                    onClick={() => setFilterMfg('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                      filterMfg === 'ALL'
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow font-black'
                        : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span>🌐</span>
                    <span>All Models</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        filterMfg === 'ALL'
                          ? 'bg-slate-950/30 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {availableModels.length}
                    </span>
                  </button>

                  {/* Dynamic Manufacturer Chips (Boeing, McDonnell Douglas, Airbus, Lockheed, Ilyushin, Tupolev, etc.) */}
                  {activeManufacturers.map((mfg) => {
                    const meta = getMfgMeta(mfg);
                    const count = manufacturerStats[mfg] || 0;
                    const isSelected = filterMfg.toLowerCase() === mfg.toLowerCase();
                    const hasDiscount =
                      activeDiscountDeal &&
                      activeDiscountDeal.manufacturer.toLowerCase() === mfg.toLowerCase();

                    return (
                      <button
                        key={mfg}
                        onClick={() => setFilterMfg(mfg)}
                        className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-sky-500 text-slate-950 border-sky-400 shadow font-black'
                            : hasDiscount
                            ? 'bg-amber-950/40 border-amber-500/70 text-amber-300 hover:bg-amber-900/50'
                            : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                        title={`${mfg} (${meta.country}) • ${count} models in service`}
                      >
                        <span className="text-xs">{meta.flag}</span>
                        <span>{meta.shortName}</span>
                        {hasDiscount && <Flame className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />}
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-slate-950/30 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  {/* Supersonic Flagships Chip */}
                  {supersonicCount > 0 && (
                    <button
                      onClick={() => setFilterMfg('SUPERSONIC')}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                        filterMfg === 'SUPERSONIC'
                          ? 'bg-purple-500 text-slate-950 border-purple-400 shadow font-black'
                          : 'bg-purple-950/40 border-purple-600/70 text-purple-300 hover:bg-purple-900/50'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-purple-300 shrink-0" />
                      <span>Supersonic</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          filterMfg === 'SUPERSONIC'
                            ? 'bg-slate-950/30 text-slate-950 font-black'
                            : 'bg-purple-900/80 text-purple-200'
                        }`}
                      >
                        {supersonicCount}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Consolidated Special Promotion / Rebate Banner */}
              {activeDiscountDeal && (
                <div className="px-3 pt-2 pb-1 bg-slate-950">
                  <div className="p-2.5 bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-500/80 rounded-xl shadow-lg flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-amber-300 font-mono font-black text-xs">
                        <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                        <span className="truncate">
                          {activeDiscountDeal.specificModelId
                            ? `CLEARANCE: ${activeDiscountDeal.discountPct}% OFF ${activeDiscountDeal.modelName || activeDiscountDeal.specificModelId}`
                            : `${activeDiscountDeal.discountPct}% REBATE: ${activeDiscountDeal.manufacturer.toUpperCase()}`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 font-sans truncate mt-0.5">
                        {activeDiscountDeal.reason || `${activeDiscountDeal.manufacturer} is offering a sales incentive.`}
                      </div>
                    </div>
                    <button
                      onClick={() => setFilterMfg(filterMfg === 'DISCOUNT' ? 'ALL' : 'DISCOUNT')}
                      className={`shrink-0 px-2.5 py-1 rounded-lg font-mono font-black text-[10px] uppercase transition cursor-pointer border ${
                        filterMfg === 'DISCOUNT'
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow font-black'
                          : 'bg-amber-900/60 border-amber-500/60 text-amber-200 hover:bg-amber-800'
                      }`}
                    >
                      {filterMfg === 'DISCOUNT' ? 'ACTIVE' : 'FILTER'}
                    </button>
                  </div>
                </div>
              )}

              {/* Destination Reachability Filter (Koei Aerobiz Route Filter) */}
              <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/60">
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
                              <div className="text-xs text-slate-400 mt-0.5 font-mono flex items-center gap-1.5 flex-wrap">
                                <span>{getMfgMeta(model.manufacturer).flag}</span>
                                <span>{model.manufacturer}</span>
                                <span>•</span>
                                <span>Intro {model.introYear}</span>
                                {model.retireYear && <span>• End {model.retireYear}</span>}
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

                          <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-slate-300 border-t border-slate-800/80 pt-1.5">
                            <span>{model.capacity} Seats</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-emerald-400 font-bold">{model.rangeKm.toLocaleString()} km</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400">{model.speedKmh} km/h</span>
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
                      <span className="whitespace-nowrap">
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
                      <span className="text-slate-600 hidden sm:inline">•</span>
                      <span className="whitespace-nowrap">
                        Order Total:{' '}
                        <strong className="text-emerald-400 font-bold text-sm">
                          ${totalCostK.toLocaleString()}K
                        </strong>
                      </span>
                      <span className="text-slate-600 hidden sm:inline">•</span>
                      {canAfford ? (
                        <span className="text-emerald-400 font-bold whitespace-nowrap">
                          Balance after delivery: ${remainingCash.toLocaleString()}K
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1 whitespace-nowrap">
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
        ) : activeTab === 'PENDING' ? (
          /* FACTORY ORDER BOOK (PENDING & DELAYED ORDERS) */
          <div className="flex-1 min-h-0 p-6 overflow-y-auto bg-slate-950">
            {pendingOrders.length === 0 ? (
              <div className="max-w-2xl mx-auto text-center py-20 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-4 shadow-xl">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-mono">No Outstanding Factory Aircraft Orders</h3>
                  <p className="text-sm text-slate-400 font-mono mt-1">
                    When you order commercial airliners from the market, they are queued here with the manufacturer for assembly and scheduled for delivery in the next quarter.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('DEPOT')}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold font-mono text-sm rounded-xl transition cursor-pointer shadow-lg inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-sky-200" />
                    <span>Browse Commercial Aircraft Catalog</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white font-mono flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400" />
                      MANUFACTURER FACTORY ORDER BOOK
                    </h3>
                    <div className="text-xs text-slate-400 font-mono">
                      Orders queued at aerospace assembly lines • Delivered next quarter (5% delay risk)
                    </div>
                  </div>
                  <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-amber-950/70 border border-amber-500/50 text-amber-300 font-bold self-start sm:self-auto">
                    Total on Order: {pendingOrders.reduce((sum, o) => sum + o.quantity, 0)} Airframes
                  </div>
                </div>

                <div className="space-y-3">
                  {pendingOrders.map((order, idx) => {
                    const model = AIRCRAFTS.find((a) => a.id === order.modelId);
                    const photoInfo = model ? getAircraftPhotoInfo(model) : null;
                    const isDelayed = order.status === 'DELAYED';

                    return (
                      <div
                        key={order.orderId || idx}
                        className={`p-4 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg transition ${
                          isDelayed
                            ? 'bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border-rose-500/60'
                            : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {photoInfo && (
                            <div className="w-24 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative shadow shrink-0">
                              <img
                                src={photoInfo.photoUrl}
                                alt={order.modelName}
                                className="w-full h-full object-cover object-center filter brightness-105"
                              />
                              <span className="absolute bottom-0.5 left-0.5 bg-slate-950/85 px-1.5 py-0.2 rounded font-mono text-[9px] text-amber-300 font-bold border border-slate-700">
                                {order.quantity}x
                              </span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-wider">
                                {order.manufacturer}
                              </span>
                              <h4 className="text-base md:text-lg font-black text-white font-mono">
                                {order.modelName}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50">
                                {order.quantity} {order.quantity === 1 ? 'Airframe' : 'Airframes'}
                              </span>
                              {isDelayed ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-950 border border-rose-500 text-rose-300 animate-pulse flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                  Factory Delay (+1 Qtr)
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-950 border border-sky-600 text-sky-300 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                                  In Assembly (On Schedule)
                                </span>
                              )}
                            </div>

                            {model && (
                              <div className="text-xs text-slate-300 font-mono mt-0.5">
                                {model.capacity} Seats • {model.rangeKm.toLocaleString()} km Range • {model.speedKmh} km/h Cruise
                              </div>
                            )}

                            {isDelayed && order.delayReason && (
                              <div className="mt-2 text-xs font-mono p-2 bg-rose-950/50 border border-rose-500/50 rounded-lg text-rose-200">
                                <span className="font-bold text-rose-300">Notice from Manufacturer: </span>
                                {order.delayReason}
                              </div>
                            )}

                            <div className="mt-2.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-wrap items-center gap-4 text-xs font-mono">
                              <div>
                                <span className="text-slate-400">Order Placed: </span>
                                <span className="font-bold text-white">Year {order.orderYear} Q{order.orderQuarter}</span>
                              </div>
                              <div className="text-slate-600">•</div>
                              <div>
                                <span className="text-slate-400">Scheduled Handover: </span>
                                <span className={`font-bold ${isDelayed ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  Year {order.deliveryYear} Q{order.deliveryQuarter}
                                </span>
                              </div>
                              <div className="text-slate-600">•</div>
                              <div>
                                <span className="text-slate-400">Delivery Status: </span>
                                <span className="font-semibold text-slate-200">
                                  {isDelayed ? 'Postponed to target quarter' : 'Expected Next Quarter Handover'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-left lg:text-right pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800 font-mono">
                          <span className="text-[11px] text-slate-400 block">Total Contract Value:</span>
                          <span className="font-black text-base md:text-lg text-emerald-400">
                            ${order.totalCostK.toLocaleString()}K
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            (${order.unitPriceK.toLocaleString()}K/unit • Paid in Full)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'FLEET' ? (
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
        ) : (
          /* TIMELINE / R&D ROADMAP (1962 - 2070+) */
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden bg-slate-950">
            {/* LEFT COLUMN: Chronological Timeline List */}
            <div className="w-full md:w-[460px] lg:w-[480px] xl:w-[500px] shrink-0 flex flex-col border-r border-slate-700/80 bg-slate-950">
              {/* Timeline Header & Filter Pills */}
              <div className="p-3 border-b border-slate-800 bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-purple-400 font-mono font-bold text-xs">
                    <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>AEROSPACE R&D TIMELINE (1962 – 2070+)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Current Year: {currentYear}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                  <button
                    onClick={() => setTimelineFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      timelineFilter === 'ALL'
                        ? 'bg-purple-500 text-slate-950 font-black shadow'
                        : 'bg-slate-900 border border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    All ({allAircraftCatalog.length})
                  </button>
                  <button
                    onClick={() => setTimelineFilter('ACTIVE')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                      timelineFilter === 'ACTIVE'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow'
                        : 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50'
                    }`}
                  >
                    <span>🟢 In Market</span>
                    <span className="text-[10px]">({availableModels.length})</span>
                  </button>
                  <button
                    onClick={() => setTimelineFilter('UPCOMING')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                      timelineFilter === 'UPCOMING'
                        ? 'bg-amber-500 text-slate-950 font-black shadow'
                        : 'bg-amber-950/40 border border-amber-500/50 text-amber-300 hover:bg-amber-900/50'
                    }`}
                  >
                    <span>🟡 Upcoming</span>
                    <span className="text-[10px]">
                      ({allAircraftCatalog.filter((m) => m.introYear > currentYear).length})
                    </span>
                  </button>
                  <button
                    onClick={() => setTimelineFilter('RETIRED')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                      timelineFilter === 'RETIRED'
                        ? 'bg-slate-500 text-slate-950 font-black shadow'
                        : 'bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>⚪ Retired</span>
                    <span className="text-[10px]">
                      ({allAircraftCatalog.filter((m) => m.retireYear && m.retireYear < currentYear).length})
                    </span>
                  </button>
                </div>
              </div>

              {/* Scrollable Model Cards */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                {timelineModels.map((m) => {
                  const isSelected = selectedTimelineModel.id === m.id;
                  const isNow = m.introYear <= currentYear && (!m.retireYear || m.retireYear >= currentYear);
                  const isUpcoming = m.introYear > currentYear;
                  const isRetired = m.retireYear && m.retireYear < currentYear;
                  const photoInfo = getAircraftPhotoInfo(m);
                  const meta = getMfgMeta(m.manufacturer);

                  return (
                    <div
                      key={m.id}
                      onClick={() => setTimelineSelectedId(m.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer select-none group ${
                        isSelected
                          ? 'bg-purple-950/80 border-2 border-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.3)]'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Year Badge & Thumbnail */}
                        <div className="shrink-0 flex flex-col items-center gap-1">
                          <div
                            className={`px-2 py-0.5 rounded font-mono font-black text-xs shadow text-center min-w-[50px] ${
                              isNow
                                ? 'bg-emerald-500 text-slate-950'
                                : isUpcoming
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {m.introYear}
                          </div>
                          <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 relative shadow">
                            <img
                              src={photoInfo.photoUrl}
                              alt={m.model}
                              className="w-full h-full object-cover object-center filter brightness-105"
                            />
                            {m.isSupersonic && (
                              <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black font-mono text-[7px] leading-tight shadow">
                                SST
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div className="font-black text-sm text-white truncate">
                              {m.model}
                            </div>
                            <span className="font-black font-mono text-xs text-emerald-400 shrink-0">
                              ${m.priceK.toLocaleString()}K
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>{meta.flag}</span>
                            <span>{m.manufacturer}</span>
                            <span>•</span>
                            {isNow ? (
                              <span className="text-emerald-400 font-bold">🟢 Active in Market</span>
                            ) : isUpcoming ? (
                              <span className="text-amber-300 font-bold">
                                🟡 Debuts in {m.introYear} ({m.introYear - currentYear === 1 ? 'Next Year' : `in ${m.introYear - currentYear} yrs`})
                              </span>
                            ) : (
                              <span className="text-slate-400">⚪ Retired {m.retireYear}</span>
                            )}
                          </div>

                          <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-slate-300 border-t border-slate-800/80 pt-1">
                            <span>{m.capacity} Seats</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-emerald-400 font-bold">{m.rangeKm.toLocaleString()} km</span>
                            <span className="text-slate-600">•</span>
                            <span>{m.speedKmh} km/h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Blueprint, Photos & Actions */}
            <div className="flex-1 min-h-0 flex flex-col p-3 md:p-4 bg-slate-900/90 overflow-hidden">
              <div className="flex-1 min-h-0 relative">
                {selectedTimelineModel && (
                  <AircraftBlueprintViewer key={selectedTimelineModel.id} model={selectedTimelineModel} />
                )}
              </div>

              {/* Bottom Context & Jump-to-Purchase Bar */}
              {selectedTimelineModel && (
                <div className="shrink-0 mt-3 p-3.5 bg-slate-950 border-2 border-purple-800/70 rounded-xl flex flex-col xl:flex-row xl:items-center justify-between gap-3 shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-400">R&D STATUS:</span>
                      <strong className="text-purple-300 font-mono text-base">{selectedTimelineModel.model}</strong>
                      {selectedTimelineModel.introYear <= currentYear && (!selectedTimelineModel.retireYear || selectedTimelineModel.retireYear >= currentYear) ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500 text-xs font-mono font-bold">
                          ✓ Production Active (Order Available in Showroom)
                        </span>
                      ) : selectedTimelineModel.introYear > currentYear ? (
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500 text-xs font-mono font-bold animate-pulse">
                          ⏳ Debut Scheduled: Year {selectedTimelineModel.introYear} ({selectedTimelineModel.introYear - currentYear === 1 ? 'Next Year' : `in ${selectedTimelineModel.introYear - currentYear} Years`})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-600 text-xs font-mono font-bold">
                          🏛 Historical Classic (Production Ended {selectedTimelineModel.retireYear})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2 flex-wrap">
                      <span>Engine: {selectedTimelineModel.engineType || 'High-Bypass Turbofans'}</span>
                      <span>•</span>
                      <span>Ceiling: {selectedTimelineModel.serviceCeilingFt?.toLocaleString() || 41000} ft</span>
                      <span>•</span>
                      <span>Cabin: {selectedTimelineModel.cabinAisle || 'Standard'}</span>
                    </div>
                  </div>

                  {selectedTimelineModel.introYear <= currentYear && (!selectedTimelineModel.retireYear || selectedTimelineModel.retireYear >= currentYear) && (
                    <button
                      onClick={() => {
                        setSelectedModelId(selectedTimelineModel.id);
                        setActiveTab('DEPOT');
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm md:text-base rounded-xl shadow-xl transition-all active:scale-95 border-2 border-emerald-400 cursor-pointer flex items-center gap-2 shrink-0"
                    >
                      <ShoppingCart className="w-4 h-4 text-emerald-200" />
                      <span>Switch to Showroom to Procure</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Standardized Modal Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex justify-between items-center text-xs font-mono shrink-0">
          <div className="text-slate-400">
            Treasury Available:{' '}
            <strong className="text-emerald-400 font-bold">
              ${playerAirline.cashK.toLocaleString()}K
            </strong>
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

      {/* PROCUREMENT CONTRACT REVIEW & CONFIRMATION MODAL */}
      {showConfirmModal && selectedModel && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-sky-500/80 rounded-3xl shadow-[0_0_80px_rgba(14,165,233,0.35)] w-[92vw] max-w-4xl overflow-hidden text-slate-100 flex flex-col animate-in zoom-in-95 duration-150 max-h-[94vh]">
            {/* Contract Header */}
            <div className="shrink-0 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 px-6 py-4 border-b border-sky-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-sky-900/80 border border-sky-400 shadow">
                  <Receipt className="w-6 h-6 text-sky-300" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-wide font-mono flex items-center gap-2">
                    AIRCRAFT PROCUREMENT CONTRACT REVIEW
                  </h3>
                  <div className="text-xs sm:text-sm text-sky-300/80 font-mono">
                    ใบตรวจสอบและยืนยันสัญญาจัดซื้ออากาศยานพาณิชย์ • Review before final commitment
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/70 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-white transition cursor-pointer"
                title="Cancel and close review"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contract Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Aircraft Summary with Realistic Photo */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-5">
                <div className="w-36 h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0 shadow relative">
                  <img
                    src={getAircraftPhotoInfo(selectedModel).photoUrl}
                    alt={selectedModel.model}
                    className="w-full h-full object-cover object-center filter brightness-105"
                  />
                  {selectedModel.isSupersonic && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black font-mono text-[9px]">
                      SST
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs sm:text-sm text-sky-400 font-bold uppercase tracking-wider">
                    {selectedModel.manufacturer} AEROSPACE
                  </div>
                  <h4 className="text-lg sm:text-2xl font-black text-white font-mono truncate">
                    {selectedModel.model}
                  </h4>
                  <div className="text-xs sm:text-sm text-slate-300 font-mono flex items-center gap-3 mt-1.5 flex-wrap">
                    <span>{selectedModel.capacity} Passengers</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">{selectedModel.rangeKm.toLocaleString()} km Range</span>
                    <span>•</span>
                    <span>{selectedModel.speedKmh} km/h Cruise</span>
                  </div>
                </div>
              </div>

              {/* In-Modal Quantity Adjustment */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs sm:text-sm font-mono font-bold text-slate-200 block">
                    NUMBER OF AIRFRAMES TO PROCURE (จำนวนลำที่สั่งซื้อ):
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Adjust quantity before finalizing the contract
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={safeQuantity <= 1}
                    onClick={() => setOrderQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 hover:text-white font-mono font-black border border-slate-600 transition cursor-pointer shadow"
                    title="Decrease quantity by 1"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="px-4 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-center min-w-[72px]">
                    <span className="font-mono font-black text-white text-xl leading-none">
                      {safeQuantity}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 block -mt-0.5">
                      {safeQuantity === 1 ? 'airframe' : 'airframes'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOrderQuantity((prev) => prev + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono font-black border border-slate-600 transition cursor-pointer shadow"
                    title="Increase quantity by 1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5 ml-2 border-l border-slate-700/80 pl-3">
                    {[1, 2, 3, 5].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setOrderQuantity(qty)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
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
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
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
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-3 font-mono text-sm sm:text-base">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Unit Base Price:</span>
                  <span className="font-bold text-white">
                    ${selectedPriceInfo.originalPriceK.toLocaleString()}K per unit
                  </span>
                </div>

                {selectedPriceInfo.hasDiscount && (
                  <div className="flex justify-between items-center text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4" />
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

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-base sm:text-lg">
                  <span className="font-bold text-white">Total Acquisition Cost (ยอดรวมชำระ):</span>
                  <span className="font-black text-2xl text-emerald-400">
                    ${totalCostK.toLocaleString()}K
                  </span>
                </div>

                <div className="pt-2.5 border-t border-dashed border-slate-800/80 space-y-1.5 text-xs sm:text-sm">
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
                        <AlertCircle className="w-4 h-4" />
                        Insufficient Cash (Short by ${(totalCostK - playerAirline.cashK).toLocaleString()}K)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lead Time & Delivery Terms Advisory */}
              <div className="p-4 bg-sky-950/50 border border-sky-600/60 rounded-2xl flex items-start gap-3.5 text-xs sm:text-sm font-mono text-sky-200">
                <Clock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-sky-300 block text-sm">
                    Manufacturing Lead Time & Delivery Terms (กำหนดการส่งมอบอากาศยาน):
                  </span>
                  <p className="text-slate-300">
                    Airliners are ordered directly from the factory. Scheduled handover is set for <span className="font-bold text-white">Year {nextDeliveryYear} Quarter {nextDeliveryQuarter}</span> (Next Quarter).
                  </p>
                  <p className="text-slate-400 text-xs">
                    ※ Realistic aviation production factor: 95% on-time delivery rate, 5% supply-chain/certification postponement risk.
                  </p>
                </div>
              </div>

              {/* Working Capital Warning */}
              {canAfford && remainingCash < 15000 && (
                <div className="p-4 bg-amber-950/60 border border-amber-500/70 rounded-2xl flex items-center gap-3.5 text-xs sm:text-sm font-mono text-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold block">Low Working Capital Advisory:</span>
                    Your airline will have less than $15,000K remaining after this order. Keep sufficient liquidity for route maintenance and operating overhead!
                  </div>
                </div>
              )}
            </div>

            {/* Contract Footer: Explicit Cancel & Confirm Buttons */}
            <div className="shrink-0 bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-4">
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
                    `Contract signed! Ordered ${safeQuantity}x ${selectedModel.model} for $${totalCostK.toLocaleString()}K. Scheduled delivery: Year ${nextDeliveryYear} Q${nextDeliveryQuarter}!`
                  );
                  setOrderQuantity(1);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-35 disabled:pointer-events-none text-white font-black text-sm sm:text-base rounded-xl shadow-xl transition-all active:scale-95 border-2 border-emerald-400 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>
                  Confirm & Place Factory Order (${totalCostK.toLocaleString()}K)
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
