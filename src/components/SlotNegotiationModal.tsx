import React, { useState } from 'react';
import { Airline, NegotiatorMission, City } from '../types/game';
import { CITIES, REGIONS } from '../data/cities';
import { calculateNegotiationQuarters, calculateNegotiationCostK } from '../data/negotiators';
import { NegotiatorAvatar } from './NegotiatorAvatar';
import { X, Handshake, Clock, CheckCircle2, KeyRound, Building2 } from 'lucide-react';

interface SlotNegotiationModalProps {
  playerAirline: Airline;
  onClose: () => void;
  onDispatchNegotiator: (negotiatorId: string, mission: NegotiatorMission) => void;
  onEstablishHub: (cityId: string, costK: number) => void;
  initialCityId?: string;
}

export const SlotNegotiationModal: React.FC<SlotNegotiationModalProps> = ({
  playerAirline,
  onClose,
  onDispatchNegotiator,
  onEstablishHub,
  initialCityId,
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

  const filteredCities = CITIES.filter((c) => {
    return selectedRegion === 'ALL' || c.region === selectedRegion;
  });

  const homeCity = CITIES.find((c) => c.id === playerAirline.homeCityId) || CITIES[0];

  const handleDispatch = (city: City) => {
    if (availableNegotiators.length === 0) return;

    const quarters = calculateNegotiationQuarters(homeCity, city);
    const costK = calculateNegotiationCostK(city, 10);
    if (playerAirline.cashK < costK) return;

    const mission: NegotiatorMission = {
      type: 'SLOT_NEGOTIATION',
      targetCityId: city.id,
      targetCityName: city.name,
      requestedSlots: 10,
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
              const isHub = playerAirline.hubCityIds.includes(city.id) || playerAirline.homeCityId === city.id;
              const isHome = playerAirline.homeCityId === city.id;
              const quarters = calculateNegotiationQuarters(homeCity, city);
              const costK = calculateNegotiationCostK(city, 10);
              const hubCostK = 15000;

              const canAffordSlots = playerAirline.cashK >= costK;
              const canAffordHub = playerAirline.cashK >= hubCostK;
              const isMaxed = currentSlots >= city.baseSlots;

              // Check if currently negotiating this city
              const activeMission = fieldNegotiators.find(
                (n) => n.status === 'DISPATCHED' && n.currentMission?.targetCityId === city.id
              );

              return (
                <div
                  key={city.id}
                  className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex justify-between items-center shadow-md gap-3"
                >
                  <div className="min-w-0">
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
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                        {city.bloc}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 mt-1">
                      {city.country} • Slots Owned:{' '}
                      <span className="font-black text-emerald-400 font-mono text-sm">
                        {currentSlots} / {city.baseSlots}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="text-amber-300 font-mono">
                        ⏱️ {quarters} Quarter{quarters > 1 ? 's' : ''} ({quarters * 3} mo)
                      </span>
                      <span>• Cost: ${costK.toLocaleString()}K</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
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
                        onClick={() => handleDispatch(city)}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl font-bold text-xs md:text-sm shadow transition-all active:scale-95 border border-emerald-500 cursor-pointer flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {isMaxed
                            ? 'Max Slots'
                            : `Dispatch Envoy (${quarters}Q)`}
                        </span>
                      </button>
                    )}

                    {currentSlots >= 10 && !isHub && (
                      <button
                        disabled={!canAffordHub}
                        onClick={() => onEstablishHub(city.id, hubCostK)}
                        className="px-3 py-1 bg-blue-700 hover:bg-blue-600 disabled:opacity-30 text-white rounded-lg font-bold text-xs shadow border border-sky-400 cursor-pointer"
                      >
                        Charter Hub ($15M)
                      </button>
                    )}
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
