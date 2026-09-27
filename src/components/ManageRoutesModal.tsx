import React from 'react';
import { Route, Airline } from '../types/game';
import { CITIES } from '../data/cities';
import { AIRCRAFTS } from '../data/aircrafts';
import { X, Plane, Trash2, Pause, Play } from 'lucide-react';

interface ManageRoutesModalProps {
  playerAirline: Airline;
  routes: Route[];
  onClose: () => void;
  onUpdateRoute: (updatedRoute: Route) => void;
  onDeleteRoute: (routeId: string) => void;
}

export const ManageRoutesModal: React.FC<ManageRoutesModalProps> = ({
  playerAirline,
  routes,
  onClose,
  onUpdateRoute,
  onDeleteRoute,
}) => {
  const cityMap = new Map(CITIES.map((c) => [c.id, c]));
  const aircraftMap = new Map(AIRCRAFTS.map((a) => [a.id, a]));
  const playerRoutes = routes.filter((r) => r.airlineId === playerAirline.id);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border-2 border-slate-600 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Plane className="w-6 h-6 text-sky-400" />
            <h2 className="text-lg md:text-xl font-black text-slate-100">
              Active Commercial Routes Network ({playerRoutes.length} Routes)
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Routes List */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          {playerRoutes.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-base">
              No active routes established yet! Click "Open Route" to connect cities worldwide.
            </div>
          ) : (
            playerRoutes.map((route) => {
              const origin = cityMap.get(route.originCityId);
              const dest = cityMap.get(route.destCityId);
              const instance = playerAirline.fleet.find((f) =>
                route.assignedAircraftIds.includes(f.instanceId)
              );
              const model = instance ? aircraftMap.get(instance.modelId) : null;
              const stats = route.lastQuarterStats;

              return (
                <div
                  key={route.id}
                  className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-base md:text-lg text-slate-100">
                        {origin?.name} ({origin?.id}) ➔ {dest?.name} ({dest?.id})
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          route.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                            : 'bg-amber-950 text-amber-300 border border-amber-500'
                        }`}
                      >
                        {route.status}
                      </span>
                    </div>

                    <div className="text-xs md:text-sm text-slate-300 flex items-center gap-3 flex-wrap">
                      <span>Aircraft: <strong className="text-white">{model?.model || 'Unassigned'}</strong></span>
                      <span>•</span>
                      <span>Frequency: <strong className="text-sky-300 font-mono">{route.weeklyFrequency} flights/wk</strong></span>
                      <span>•</span>
                      <span>Ticket Price: <strong className="text-amber-300 font-mono">{route.priceModifierPct > 0 ? `+${route.priceModifierPct}%` : `${route.priceModifierPct}%`}</strong></span>
                    </div>

                    {stats && (
                      <div className="text-xs md:text-sm text-slate-200 pt-1.5 flex items-center gap-4 font-mono flex-wrap">
                        <span>Pax: <strong className="text-sky-300">{stats.passengers.toLocaleString()}</strong> ({stats.loadFactorPct}%)</span>
                        <span>Rev: <strong className="text-emerald-400">+${stats.revenueK.toLocaleString()}K</strong></span>
                        <span
                          className={`font-black ${
                            stats.profitK >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          Net: {stats.profitK >= 0 ? `+$${stats.profitK.toLocaleString()}K` : `-$${Math.abs(stats.profitK).toLocaleString()}K`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    {/* Toggle Active / Suspended */}
                    <button
                      onClick={() =>
                        onUpdateRoute({
                          ...route,
                          status: route.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                        })
                      }
                      className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {route.status === 'ACTIVE' ? (
                        <>
                          <Pause className="w-4 h-4" /> Suspend
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 text-emerald-400" /> Resume
                        </>
                      )}
                    </button>

                    {/* Delete / Close Route */}
                    <button
                      onClick={() => onDeleteRoute(route.id)}
                      className="px-3.5 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-200 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Close Route
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
