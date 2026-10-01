import React from 'react';
import { GameState, Airline } from '../types/game';
import { REGIONS } from '../data/cities';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { X, BarChart3, Trophy } from 'lucide-react';

interface FinancialReportModalProps {
  gameState: GameState;
  playerAirline: Airline;
  onClose: () => void;
}

export const FinancialReportModal: React.FC<FinancialReportModalProps> = ({
  gameState,
  playerAirline,
  onClose,
}) => {
  useEscapeKey(onClose);
  const history = gameState.quarterHistory;

  // Calculate cumulative stats
  const totalCareerProfitK = history.reduce((sum, h) => sum + h.humanProfitK, 0);
  const totalCareerPassengers = history.reduce((sum, h) => sum + h.humanPassengers, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border-2 border-slate-600 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-950 via-slate-900 to-slate-900 px-7 py-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-pink-400" />
            <h2 className="text-lg md:text-xl font-black text-slate-100">
              Corporate Ledger & Global Market Dominance
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-700"
            title="Close (Esc)"
            data-testid="modal-close-header-btn"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-7 overflow-y-auto space-y-6 text-sm">
          {/* Victory Conditions Status Bar */}
          <div className="bg-slate-950 p-5 rounded-2xl border-2 border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="font-black text-base md:text-lg text-slate-100">
                  Global Dominance Objective (Year 20)
                </span>
              </div>
              <span className="text-xs md:text-sm text-slate-300 font-bold">
                Turn {gameState.turnNumber} of 80 (Quarter {gameState.currentQuarter})
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Current Cash</div>
                <div className="font-black text-emerald-400 font-mono text-base md:text-lg">
                  ${playerAirline.cashK.toLocaleString()}K
                </div>
              </div>
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Career Net Profit</div>
                <div
                  className={`font-black font-mono text-base md:text-lg ${
                    totalCareerProfitK >= 0 ? 'text-emerald-300' : 'text-rose-400'
                  }`}
                >
                  {totalCareerProfitK >= 0
                    ? `+$${totalCareerProfitK.toLocaleString()}K`
                    : `-$${Math.abs(totalCareerProfitK).toLocaleString()}K`}
                </div>
              </div>
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Total Career Passengers</div>
                <div className="font-black text-sky-400 font-mono text-base md:text-lg">
                  {totalCareerPassengers.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Regional Hubs Expansion</div>
                <div className="font-black text-amber-400 font-mono text-base md:text-lg">
                  {playerAirline.hubCityIds.length} / 7
                </div>
              </div>
            </div>
          </div>

          {/* Regional Hubs Checklist */}
          <div>
            <h3 className="font-black text-base text-slate-100 mb-3">Regional Hubs Across 7 Continents</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {REGIONS.map((region) => {
                return (
                  <div
                    key={region.id}
                    className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between shadow"
                  >
                    <span className="font-bold text-slate-100 text-xs md:text-sm">{region.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500 font-bold">
                      Established
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quarter by Quarter Financial History Table */}
          <div>
            <h3 className="font-black text-base text-slate-100 mb-3">Quarterly Financial History</h3>
            <div className="border-2 border-slate-700 rounded-2xl overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-900 text-slate-300 border-b border-slate-700 font-bold">
                  <tr>
                    <th className="p-3">Year / Quarter</th>
                    <th className="p-3">Passengers</th>
                    <th className="p-3">Revenue</th>
                    <th className="p-3">Net Profit</th>
                    <th className="p-3">World Events</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        First quarter results will appear after concluding Turn 1.
                      </td>
                    </tr>
                  ) : (
                    history.slice(-10).reverse().map((h, i) => (
                      <tr key={i} className="hover:bg-slate-900/60">
                        <td className="p-3 font-black text-slate-100">
                          {h.year} Q{h.quarter}
                        </td>
                        <td className="p-3 text-slate-200 font-mono font-bold">
                          {h.humanPassengers.toLocaleString()}
                        </td>
                        <td className="p-3 text-emerald-400 font-mono font-bold">
                          +${h.humanRevenueK.toLocaleString()}K
                        </td>
                        <td
                          className={`p-3 font-black font-mono ${
                            h.humanProfitK >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {h.humanProfitK >= 0
                            ? `+$${h.humanProfitK.toLocaleString()}K`
                            : `-$${Math.abs(h.humanProfitK).toLocaleString()}K`}
                        </td>
                        <td className="p-3 text-slate-300 text-xs">
                          {h.events.join(', ') || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Standardized Modal Footer */}
        <div className="bg-slate-950 px-7 py-3.5 border-t border-slate-800 flex justify-end shrink-0">
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
    </div>
  );
};
