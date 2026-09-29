import React, { useState } from 'react';
import { Airline, BusinessVenture, RegionalCampaign, RegionId } from '../types/game';
import { CITIES } from '../data/cities';
import { REGIONS, RegionZone } from '../data/regions';
import {
  X,
  Building2,
  Hotel,
  Bus,
  Compass,
  Sparkles,
  Megaphone,
  Ship,
  Landmark,
  Music,
  Trash2,
  CheckCircle2,
  TrendingUp,
  Award,
} from 'lucide-react';

interface BusinessModalProps {
  playerAirline: Airline;
  onClose: () => void;
  onBuyBusiness: (venture: BusinessVenture) => void;
  onSellBusiness: (ventureId: string, refundK: number) => void;
  onLaunchCampaign: (campaign: RegionalCampaign) => void;
}

interface VentureTemplate {
  type: BusinessVenture['type'];
  name: string;
  category: 'HOTEL' | 'CULTURE' | 'AMUSEMENT' | 'SERVICE' | 'TRAVEL';
  icon: any;
  baseCostK: number;
  baseDividendK: number;
  tourismBoost: number;
  description: string;
}

const VENTURE_TYPES: VentureTemplate[] = [
  // 1. Hotels
  {
    type: 'HOTEL',
    name: 'Grand Luxury Hotel',
    category: 'HOTEL',
    icon: Hotel,
    baseCostK: 8500,
    baseDividendK: 580,
    tourismBoost: 5,
    description: 'Premier downtown hotel providing luxury accommodations and consistent quarterly dividend cashflow.',
  },
  // 2. Cultural Facilities (Unlocks Culture & Art Campaign)
  {
    type: 'MUSEUM',
    name: 'Aviation Heritage Museum',
    category: 'CULTURE',
    icon: Landmark,
    baseCostK: 4500,
    baseDividendK: 240,
    tourismBoost: 4,
    description: 'Cultural landmark that raises local prestige and unlocks regional Culture & Art campaigns.',
  },
  {
    type: 'ARTS_PAVILION',
    name: 'Fine Arts Pavilion',
    category: 'CULTURE',
    icon: Building2,
    baseCostK: 3800,
    baseDividendK: 210,
    tourismBoost: 3,
    description: 'Celebrated cultural gallery that attracts international connoisseurs and unlocks regional cultural marketing.',
  },
  {
    type: 'CONCERT_HALL',
    name: 'Metropolitan Concert Hall',
    category: 'CULTURE',
    icon: Music,
    baseCostK: 6200,
    baseDividendK: 360,
    tourismBoost: 6,
    description: 'Acoustic symphony auditorium hosting world tours, boosting local city tourism and cultural visibility.',
  },
  // 3. Amusement Businesses (Unlocks Leisure & Sports Campaign)
  {
    type: 'AMUSEMENT_PARK',
    name: 'Supersonic Theme Park',
    category: 'AMUSEMENT',
    icon: Sparkles,
    baseCostK: 25000,
    baseDividendK: 1650,
    tourismBoost: 20,
    description: 'Massive world-class attraction! Permanently boosts the city tourism index by +20 points and unlocks Leisure campaigns.',
  },
  {
    type: 'PLEASURE_BOAT',
    name: 'Coastal Cruise & Pleasure Boat',
    category: 'AMUSEMENT',
    icon: Ship,
    baseCostK: 5000,
    baseDividendK: 320,
    tourismBoost: 5,
    description: 'Scenic pleasure cruise fleet offering sightseeing tours for seaside and coastal hubs.',
  },
  {
    type: 'GOLF_COURSE',
    name: 'Championship Golf Club',
    category: 'AMUSEMENT',
    icon: Sparkles,
    baseCostK: 12000,
    baseDividendK: 750,
    tourismBoost: 12,
    description: 'Prestigious 18-hole resort course attracting affluent business travelers and holidaymakers.',
  },
  {
    type: 'SKI_RESORT',
    name: 'Alpine Ski Resort',
    category: 'AMUSEMENT',
    icon: Sparkles,
    baseCostK: 14000,
    baseDividendK: 880,
    tourismBoost: 10,
    description: 'Mountain winter wonderland generating strong seasonal demand and elevating regional leisure traffic.',
  },
  // 4. Service Businesses (Unlocks Travel Network Campaign)
  {
    type: 'SHUTTLE_BUS',
    name: 'Airport Express Shuttle',
    category: 'SERVICE',
    icon: Bus,
    baseCostK: 2500,
    baseDividendK: 180,
    tourismBoost: 0,
    description: 'High-convenience airport transfer network connecting regional cities and feeding passengers to your flights.',
  },
  {
    type: 'FERRY_BOAT',
    name: 'Island Cross-Harbor Ferry',
    category: 'SERVICE',
    icon: Ship,
    baseCostK: 3200,
    baseDividendK: 210,
    tourismBoost: 0,
    description: 'Essential maritime passenger link transporting travelers between surrounding islands and the international airport.',
  },
  {
    type: 'COMMUTER_AIRLINE',
    name: 'Regional Feeder Commuter',
    category: 'SERVICE',
    icon: Compass,
    baseCostK: 6500,
    baseDividendK: 420,
    tourismBoost: 0,
    description: 'Turboprop feeder airline serving smaller remote communities and connecting them into your main hub flights.',
  },
  // 5. Travel Agency (Unlocks Campaign Synergy +30% boost!)
  {
    type: 'TRAVEL_AGENCY',
    name: 'Global Travel Agency',
    category: 'TRAVEL',
    icon: Compass,
    baseCostK: 3500,
    baseDividendK: 260,
    tourismBoost: 0,
    description: 'Promotes your airline ticket packages across the continent. Grants a +30% synergy boost to all regional advertising campaigns!',
  },
];

export const BusinessModal: React.FC<BusinessModalProps> = ({
  playerAirline,
  onClose,
  onBuyBusiness,
  onSellBusiness,
  onLaunchCampaign,
}) => {
  const [activeTab, setActiveTab] = useState<'VENTURES' | 'CAMPAIGNS'>('VENTURES');
  const [selectedCityId, setSelectedCityId] = useState<string>(playerAirline.homeCityId);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('ALL');

  const accessibleCities = CITIES.filter((c) => (playerAirline.slots[c.id] || 0) > 0);
  const city = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
  const cityMap = new Map(CITIES.map((c) => [c.id, c]));

  const filteredTemplates = VENTURE_TYPES.filter((t) => {
    if (selectedFilterCategory === 'ALL') return true;
    return t.category === selectedFilterCategory;
  });

  const handleBuy = (template: VentureTemplate) => {
    const costMultiplier = 0.6 + (city.businessIndex / 100) * 0.8;
    const finalCostK = Math.round(template.baseCostK * costMultiplier);
    const finalDividendK = Math.round(template.baseDividendK * costMultiplier);

    const newVenture: BusinessVenture = {
      id: `BIZ_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      cityId: city.id,
      airlineId: playerAirline.id,
      type: template.type,
      name: `${city.name} ${template.name}`,
      purchaseCostK: finalCostK,
      quarterlyDividendK: finalDividendK,
      tourismBoost: template.tourismBoost,
    };

    onBuyBusiness(newVenture);
  };

  const handleSell = (venture: BusinessVenture) => {
    const refundK = Math.round(venture.purchaseCostK * 0.75); // 75% liquidation value
    if (
      window.confirm(
        `Are you sure you want to liquidate and sell ${venture.name}? You will recover $${refundK.toLocaleString()}K (75% of asset valuation).`
      )
    ) {
      onSellBusiness(venture.id, refundK);
    }
  };

  // Advertising Campaign Helper for a Region
  const getRegionCampaignData = (regionId: RegionId) => {
    const regionalVentures = playerAirline.businesses.filter((b) => {
      const c = cityMap.get(b.cityId);
      return c?.region === regionId;
    });

    const hasCultural = regionalVentures.some((b) =>
      ['MUSEUM', 'ARTS_PAVILION', 'CONCERT_HALL'].includes(b.type)
    );
    const hasAmusement = regionalVentures.some((b) =>
      ['AMUSEMENT_PARK', 'PLEASURE_BOAT', 'GOLF_COURSE', 'SKI_RESORT'].includes(b.type)
    );
    const hasService = regionalVentures.some((b) =>
      ['SHUTTLE_BUS', 'FERRY_BOAT', 'COMMUTER_AIRLINE'].includes(b.type)
    );
    const hasTravelAgency = regionalVentures.some((b) => b.type === 'TRAVEL_AGENCY');

    const activeCampaign = (playerAirline.activeCampaigns || []).find(
      (c) => c.regionId === regionId && c.quartersRemaining > 0
    );

    return {
      regionalVentures,
      hasCultural,
      hasAmusement,
      hasService,
      hasTravelAgency,
      activeCampaign,
    };
  };

  const handleStartCampaign = (
    regionId: RegionId,
    category: 'CULTURE_ART' | 'LEISURE_SPORTS' | 'TRAVEL_NETWORK',
    baseCostK: number,
    baseBoostPct: number
  ) => {
    const data = getRegionCampaignData(regionId);
    const synergy = data.hasTravelAgency ? 1.3 : 1.0;
    const finalBoostPct = Math.round(baseBoostPct * synergy);

    if (playerAirline.cashK < baseCostK) {
      alert(`Insufficient funds! $${baseCostK.toLocaleString()}K required to launch this campaign.`);
      return;
    }

    const campaignNames: Record<string, string> = {
      CULTURE_ART: 'Continental Culture & Heritage Promotion',
      LEISURE_SPORTS: 'Grand Holiday & Leisure Tourism Campaign',
      TRAVEL_NETWORK: 'Integrated Transit & Feeder Network Drive',
    };

    const newCampaign: RegionalCampaign = {
      id: `CAMP_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      airlineId: playerAirline.id,
      regionId,
      category,
      name: campaignNames[category] || 'Regional Promotion',
      quartersRemaining: 4, // 1 full year duration!
      demandBoostPct: finalBoostPct,
      costK: baseCostK,
    };

    onLaunchCampaign(newCampaign);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-indigo-500/90 rounded-3xl shadow-[0_0_70px_rgba(99,102,241,0.35)] w-full max-w-5xl overflow-hidden flex flex-col text-slate-100 max-h-[94vh]">
        {/* Header with Dual Tabs */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 px-6 py-4 border-b border-indigo-800/80 flex flex-wrap justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-900/80 border border-indigo-400 shadow">
              <Building2 className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-mono tracking-wide text-white">
                SUBSIDIARIES & REGIONAL ADVERTISING (ธุรกิจในเครือและแคมเปญโฆษณา)
              </h2>
              <div className="text-xs text-indigo-300 font-mono">
                {playerAirline.name} • Commercial Ventures Division
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-700 flex gap-1 font-mono text-xs">
              <button
                onClick={() => setActiveTab('VENTURES')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'VENTURES'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Subsidiaries (ธุรกิจเสริม)
              </button>
              <button
                onClick={() => setActiveTab('CAMPAIGNS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'CAMPAIGNS'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>2. Ad Campaigns (แคมเปญโฆษณา)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB 1: VENTURES CATALOG */}
        {activeTab === 'VENTURES' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
            {/* Filter & City Selector Bar */}
            <div className="bg-slate-950 px-5 py-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2.5">
                <span className="text-slate-400 font-bold">TARGET CITY:</span>
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                >
                  {accessibleCities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id}) • Tourism: {c.tourismIndex}/100 • Econ: {c.businessIndex}/100
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['ALL', 'HOTEL', 'CULTURE', 'AMUSEMENT', 'SERVICE', 'TRAVEL'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                      selectedFilterCategory === cat
                        ? 'bg-indigo-950 border-indigo-400 text-indigo-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Ventures Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTemplates.map((template) => {
                const costMultiplier = 0.6 + (city.businessIndex / 100) * 0.8;
                const finalCostK = Math.round(template.baseCostK * costMultiplier);
                const finalDividendK = Math.round(template.baseDividendK * costMultiplier);
                const canAfford = playerAirline.cashK >= finalCostK;

                const isAlreadyOwned = playerAirline.businesses.some(
                  (b) => b.cityId === city.id && b.type === template.type
                );

                const Icon = template.icon;

                return (
                  <div
                    key={template.type}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-indigo-950 border border-indigo-700 text-indigo-300 shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-mono font-black text-sm text-white">
                              {template.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {city.name} ({city.id}) • {template.category}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0">
                          <div className="font-black text-sm text-emerald-400">
                            ${finalCostK.toLocaleString()}K
                          </div>
                          <div className="text-[10px] text-indigo-300 font-bold">
                            Yield: +${finalDividendK}K/qtr
                          </div>
                        </div>
                      </div>

                      <p className="mt-2 text-slate-300 text-xs leading-relaxed">
                        {template.description}
                      </p>

                      {template.tourismBoost > 0 && (
                        <div className="mt-2 text-[11px] text-pink-300 font-black bg-pink-950/40 border border-pink-700/60 px-2 py-1 rounded-lg text-center">
                          ⭐ Permanently boosts {city.name} Tourism by +{template.tourismBoost} Points!
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-800/80">
                      <button
                        disabled={!canAfford || isAlreadyOwned}
                        onClick={() => handleBuy(template)}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-30 disabled:pointer-events-none text-white font-black text-xs font-mono rounded-xl shadow transition-all active:scale-95 border border-indigo-400 cursor-pointer"
                      >
                        {isAlreadyOwned ? 'Already Established' : `Acquire ($${finalCostK.toLocaleString()}K)`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Corporate Subsidiaries List with Liquidate / Sell Button */}
            {playerAirline.businesses.length > 0 && (
              <div className="mt-6 border-t border-slate-800 pt-4 font-mono">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ACTIVE CORPORATE SUBSIDIARIES ({playerAirline.businesses.length})</span>
                  </h3>
                  <span className="text-xs text-emerald-400 font-bold">
                    Total Passive Dividends: +$
                    {playerAirline.businesses
                      .reduce((sum, b) => sum + b.quarterlyDividendK, 0)
                      .toLocaleString()}
                    K / quarter
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {playerAirline.businesses.map((biz) => {
                    const refundK = Math.round(biz.purchaseCostK * 0.75);
                    return (
                      <div
                        key={biz.id}
                        className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between gap-2 shadow"
                      >
                        <div>
                          <div className="font-bold text-white text-xs truncate">{biz.name}</div>
                          <div className="text-[11px] text-emerald-400 font-bold mt-0.5">
                            Dividend: +${biz.quarterlyDividendK}K/qtr
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                          <span className="text-slate-400">Valuation: ${biz.purchaseCostK}K</span>
                          <button
                            onClick={() => handleSell(biz)}
                            className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/80 text-rose-300 font-bold rounded flex items-center gap-1 transition cursor-pointer"
                            title="Sell venture for 75% liquid cash refund"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>Sell (${refundK}K)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REGIONAL ADVERTISING CAMPAIGNS */}
        {activeTab === 'CAMPAIGNS' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-mono">
            {/* Explanatory Banner */}
            <div className="bg-gradient-to-r from-slate-950 to-indigo-950/50 border border-indigo-500/40 rounded-2xl p-4 flex items-center gap-3">
              <Megaphone className="w-6 h-6 text-indigo-400 shrink-0" />
              <div className="space-y-0.5">
                <div className="font-bold text-white text-sm">
                  CONTINENTAL ADVERTISING CAMPAIGNS (การทำแคมเปญโฆษณาประจำทวีป)
                </div>
                <div className="text-slate-300 leading-relaxed text-[11px]">
                  ตามคู่มือ Koei Aerobiz Supersonic: เมื่อท่านครอบครองธุรกิจเสริมในภูมิภาค จะปลดล็อกการทำแคมเปญโฆษณาประจำทวีปเพื่อกระตุ้นยอดผู้โดยสาร (Passenger Demand) ของทุกเที่ยวบินในทวีปนั้นยาวนาน 1 ปีเต็ม (4 ไตรมาส)! หากเป็นเจ้าของ <strong>Travel Agency</strong> จะได้รับโบนัสขยายผลลัพธ์แคมเปญเพิ่มอีก +30%!
                </div>
              </div>
            </div>

            {/* Region List Cards */}
            <div className="space-y-4">
              {REGIONS.map((reg: RegionZone) => {
                const data = getRegionCampaignData(reg.id as RegionId);
                const hasSynergy = data.hasTravelAgency;

                return (
                  <div
                    key={reg.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow"
                  >
                    {/* Region Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white">{reg.name}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {data.regionalVentures.length} Subsidiaries Owned
                        </span>
                        {hasSynergy && (
                          <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/80 px-2 py-0.5 rounded flex items-center gap-1 font-bold animate-pulse">
                            ⭐ Travel Agency Synergy (+30% Power)
                          </span>
                        )}
                      </div>

                      {data.activeCampaign && (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500 px-2.5 py-1 rounded-xl">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            ACTIVE: {data.activeCampaign.quartersRemaining} Quarters Left (+
                            {data.activeCampaign.demandBoostPct}% Traffic)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Campaign Type Options for this Region */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* 1. Culture & Art Campaign */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                          data.hasCultural
                            ? 'bg-slate-900 border-indigo-700/60'
                            : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white flex items-center justify-between">
                            <span>Culture & Art Campaign</span>
                            <span className="text-emerald-400">
                              +{hasSynergy ? '20%' : '15%'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Requires: Museum or Arts Pavilion
                          </div>
                        </div>

                        <button
                          disabled={!data.hasCultural || !!data.activeCampaign}
                          onClick={() =>
                            handleStartCampaign(
                              reg.id as RegionId,
                              'CULTURE_ART',
                              1200,
                              15
                            )
                          }
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold rounded-lg transition cursor-pointer"
                        >
                          Launch ($1,200K)
                        </button>
                      </div>

                      {/* 2. Leisure & Sports Campaign */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                          data.hasAmusement
                            ? 'bg-slate-900 border-indigo-700/60'
                            : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white flex items-center justify-between">
                            <span>Leisure & Sports Campaign</span>
                            <span className="text-emerald-400">
                              +{hasSynergy ? '29%' : '22%'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Requires: Theme Park, Cruise or Golf
                          </div>
                        </div>

                        <button
                          disabled={!data.hasAmusement || !!data.activeCampaign}
                          onClick={() =>
                            handleStartCampaign(
                              reg.id as RegionId,
                              'LEISURE_SPORTS',
                              2500,
                              22
                            )
                          }
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold rounded-lg transition cursor-pointer"
                        >
                          Launch ($2,500K)
                        </button>
                      </div>

                      {/* 3. Travel Network Campaign */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                          data.hasService || data.hasTravelAgency
                            ? 'bg-slate-900 border-indigo-700/60'
                            : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white flex items-center justify-between">
                            <span>Travel Network Campaign</span>
                            <span className="text-emerald-400">
                              +{hasSynergy ? '24%' : '18%'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Requires: Shuttle, Ferry, or Travel Agency
                          </div>
                        </div>

                        <button
                          disabled={
                            (!data.hasService && !data.hasTravelAgency) ||
                            !!data.activeCampaign
                          }
                          onClick={() =>
                            handleStartCampaign(
                              reg.id as RegionId,
                              'TRAVEL_NETWORK',
                              1800,
                              18
                            )
                          }
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold rounded-lg transition cursor-pointer"
                        >
                          Launch ($1,800K)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs font-mono shrink-0">
          <div className="text-slate-400">
            Treasury Balance: <strong className="text-emerald-400">${playerAirline.cashK.toLocaleString()}K</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Close Window (ปิดหน้าต่าง)
          </button>
        </div>
      </div>
    </div>
  );
};
