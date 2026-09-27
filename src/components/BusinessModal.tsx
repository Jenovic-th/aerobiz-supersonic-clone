import React, { useState } from 'react';
import { Airline, BusinessVenture } from '../types/game';
import { CITIES } from '../data/cities';
import { X, Building2, Hotel, Bus, Compass, Sparkles } from 'lucide-react';

interface BusinessModalProps {
  playerAirline: Airline;
  onClose: () => void;
  onBuyBusiness: (venture: BusinessVenture) => void;
}

interface VentureTemplate {
  type: BusinessVenture['type'];
  name: string;
  icon: any;
  baseCostK: number;
  baseDividendK: number;
  tourismBoost: number;
  description: string;
}

const VENTURE_TYPES: VentureTemplate[] = [
  {
    type: 'HOTEL',
    name: 'Luxury Airport Hotel',
    icon: Hotel,
    baseCostK: 8000,
    baseDividendK: 550,
    tourismBoost: 0,
    description: 'Provides passenger packages and strong quarterly dividends. Feeds loyal travelers directly to your flights.',
  },
  {
    type: 'SHUTTLE_BUS',
    name: 'City Shuttle Express',
    icon: Bus,
    baseCostK: 2500,
    baseDividendK: 180,
    tourismBoost: 0,
    description: 'High-convenience airport transfer network connecting regional cities to your hub.',
  },
  {
    type: 'TRAVEL_AGENCY',
    name: 'Global Travel Agency',
    icon: Compass,
    baseCostK: 3500,
    baseDividendK: 260,
    tourismBoost: 0,
    description: 'Promotes your airline ticket packages across the entire continent.',
  },
  {
    type: 'AMUSEMENT_PARK',
    name: 'Supersonic Theme Park',
    icon: Sparkles,
    baseCostK: 25000,
    baseDividendK: 1600,
    tourismBoost: 20,
    description: 'Massive world-class attraction! Permanently boosts the city tourism index by +20 points.',
  },
  {
    type: 'MUSEUM',
    name: 'Aviation Heritage Museum',
    icon: Building2,
    baseCostK: 4500,
    baseDividendK: 220,
    tourismBoost: 4,
    description: 'Cultural landmark that raises local prestige and increases tourism by +4 points.',
  }
];

export const BusinessModal: React.FC<BusinessModalProps> = ({
  playerAirline,
  onClose,
  onBuyBusiness,
}) => {
  const [selectedCityId, setSelectedCityId] = useState<string>(playerAirline.homeCityId);

  const accessibleCities = CITIES.filter((c) => (playerAirline.slots[c.id] || 0) > 0);
  const city = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];

  const handleBuy = (template: VentureTemplate) => {
    const costMultiplier = 0.6 + (city.businessIndex / 100) * 0.8;
    const finalCostK = Math.round(template.baseCostK * costMultiplier);
    const finalDividendK = Math.round(template.baseDividendK * costMultiplier);

    const newVenture: BusinessVenture = {
      id: `BIZ_${Date.now()}`,
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border-2 border-slate-600 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 px-7 py-5 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <h2 className="text-lg md:text-xl font-black text-slate-100">
              Subsidiaries & Tourism Ventures Division
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* City Picker Bar */}
        <div className="bg-slate-950 px-7 py-4 border-b border-slate-800 flex items-center gap-4 text-sm">
          <span className="text-slate-300 font-bold">Select Destination City:</span>
          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
            className="bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-2 text-slate-100 font-black text-sm md:text-base focus:outline-none focus:border-indigo-500"
          >
            {accessibleCities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.id}) - Tourism: {c.tourismIndex}/100
              </option>
            ))}
          </select>
        </div>

        {/* Venture Catalog */}
        <div className="p-7 overflow-y-auto space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VENTURE_TYPES.map((template) => {
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
                  className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-md"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-indigo-950 border border-indigo-700 text-indigo-300">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-black text-base md:text-lg text-slate-100">
                            {template.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{city.name}</div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-black text-base md:text-lg text-emerald-400">
                          ${finalCostK.toLocaleString()}K
                        </div>
                        <div className="text-xs text-indigo-300 font-bold">
                          Div: +${finalDividendK}K/qtr
                        </div>
                      </div>
                    </div>

                    <p className="mt-2.5 text-slate-200 text-xs md:text-sm leading-relaxed">
                      {template.description}
                    </p>

                    {template.tourismBoost > 0 && (
                      <div className="mt-2.5 text-xs text-pink-300 font-black bg-pink-950/50 border border-pink-700/60 p-2 rounded-lg text-center">
                        ⭐ Permanently boosts {city.name} Tourism by +{template.tourismBoost} Points!
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-700/60">
                    <button
                      disabled={!canAfford || isAlreadyOwned}
                      onClick={() => handleBuy(template)}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-30 disabled:pointer-events-none text-white font-black text-sm rounded-xl shadow-lg transition-all active:scale-95 border border-indigo-400 cursor-pointer"
                    >
                      {isAlreadyOwned ? 'Already Established' : `Invest $${finalCostK.toLocaleString()}K`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Owned Ventures List */}
          {playerAirline.businesses.length > 0 && (
            <div className="mt-8 border-t border-slate-700 pt-5">
              <h3 className="font-black text-base text-slate-100 mb-3">
                Active Corporate Subsidiaries ({playerAirline.businesses.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {playerAirline.businesses.map((biz) => (
                  <div key={biz.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="font-bold text-slate-100 text-sm">{biz.name}</div>
                    <div className="text-xs text-emerald-400 font-mono font-bold mt-1">
                      Yield: +${biz.quarterlyDividendK}K / quarter
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
