import React from 'react';
import { GameState, Airline } from '../types/game';
import { Trophy, AlertOctagon, Globe2, Plane, DollarSign, Users, Award, RotateCcw, ArrowRight, X } from 'lucide-react';

interface VictoryDefeatModalProps {
  gameState: GameState;
  playerAirline: Airline;
  onClose: () => void;
  onContinueSandbox: () => void;
  onRestartGame: () => void;
}

export const VictoryDefeatModal: React.FC<VictoryDefeatModalProps> = ({
  gameState,
  playerAirline,
  onClose,
  onContinueSandbox,
  onRestartGame,
}) => {
  const isBankruptcy = gameState.victoryType === 'BANKRUPTCY';
  const isRivalWinner = gameState.victoryType === 'RIVAL_VICTORY';

  const isHumanWinner =
    !isBankruptcy &&
    !isRivalWinner &&
    (gameState.victoryType === 'EARLY_VICTORY' ||
      (gameState.victoryType === 'TIME_LIMIT_EXPIRED' && gameState.winnerAirlineId === playerAirline.id) ||
      gameState.winnerAirlineId === playerAirline.id);

  const winnerAirline = gameState.airlines.find((a) => a.id === gameState.winnerAirlineId) || playerAirline;
  const humanStanding = gameState.airlineStandings?.find((s) => s.isHuman);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border-2 flex flex-col text-slate-100 max-h-[94vh] animate-in zoom-in-95 duration-200 ${
          isHumanWinner
            ? 'bg-gradient-to-b from-amber-950/80 via-slate-900 to-slate-950 border-amber-400 shadow-[0_0_80px_rgba(251,191,36,0.35)]'
            : isBankruptcy
            ? 'bg-gradient-to-b from-rose-950/90 via-slate-900 to-slate-950 border-rose-500 shadow-[0_0_80px_rgba(244,63,94,0.35)]'
            : 'bg-gradient-to-b from-purple-950/80 via-slate-900 to-slate-950 border-purple-400 shadow-[0_0_80px_rgba(168,85,247,0.35)]'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between shrink-0 ${
            isHumanWinner
              ? 'bg-amber-950/60 border-amber-500/50'
              : isBankruptcy
              ? 'bg-rose-950/70 border-rose-600/50'
              : 'bg-purple-950/60 border-purple-500/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border ${
                isHumanWinner
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : isBankruptcy
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : 'bg-purple-500/20 border-purple-400 text-purple-300'
              }`}
            >
              {isHumanWinner ? (
                <Trophy className="w-8 h-8 animate-bounce" />
              ) : isBankruptcy ? (
                <AlertOctagon className="w-8 h-8" />
              ) : (
                <Globe2 className="w-8 h-8" />
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-mono tracking-wide text-white uppercase">
                {isHumanWinner
                  ? 'WORLD AIRLINE CHAMPION (ชัยชนะอันยิ่งใหญ่)'
                  : isBankruptcy
                  ? 'CORPORATE INSOLVENCY & BANKRUPTCY (ประกาศล้มละลาย)'
                  : 'RIVAL DOMINATION (คู่แข่งครองน่านฟ้า)'}
              </h2>
              <p className="text-xs sm:text-sm font-mono opacity-80 mt-0.5">
                {gameState.currentYear} • Quarter {gameState.currentQuarter} • Turn {gameState.turnNumber}/80
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Main Proclamation Box */}
          <div
            className={`p-5 rounded-2xl border font-mono ${
              isHumanWinner
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                : isBankruptcy
                ? 'bg-rose-950/30 border-rose-600/40 text-rose-100'
                : 'bg-purple-950/30 border-purple-500/40 text-purple-100'
            }`}
          >
            <div className="text-sm sm:text-base leading-relaxed font-bold">
              {isBankruptcy
                ? gameState.defeatReason || 'Your airline suffered continuous financial deficit and was forced into insolvency.'
                : isRivalWinner
                ? 'A rival airline reached global dominance before your airline could complete the network.'
                : gameState.victoryReason ||
                  'Congratulations CEO! You have satisfied all conditions of the Koei Aerobiz Supersonic World Championship!'}
            </div>
          </div>

          {/* Bankruptcy Foreclosure Audit vs Victory Checklist */}
          {isBankruptcy ? (
            <div className="bg-slate-950 border border-rose-900/60 rounded-2xl p-5 space-y-3 font-mono">
              <div className="text-xs uppercase tracking-wider text-rose-400 font-bold flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                <span>BANKRUPTCY & FINANCIAL INSOLVENCY AUDIT (การตรวจสอบสถานะหนี้สิน):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-xl border bg-rose-950/40 border-rose-600/60 text-rose-200 flex flex-col justify-between">
                  <div className="text-xs text-rose-400 font-bold">1. LOSS STREAK</div>
                  <div className="text-lg font-black mt-1">
                    {playerAirline.consecutiveLossQuarters || 4} Quarters
                  </div>
                  <div className="text-[11px] mt-1 opacity-80 text-rose-300">
                    ✕ 4 Quarters Deficit Limit Exceeded
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border bg-rose-950/40 border-rose-600/60 text-rose-200 flex flex-col justify-between">
                  <div className="text-xs text-rose-400 font-bold">2. CASH DEFICIT</div>
                  <div className="text-lg font-black mt-1">
                    ${playerAirline.cashK.toLocaleString()}K
                  </div>
                  <div className="text-[11px] mt-1 opacity-80 text-rose-300">
                    ✕ Treasury Insolvent / Negative
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border bg-rose-950/40 border-rose-600/60 text-rose-200 flex flex-col justify-between">
                  <div className="text-xs text-rose-400 font-bold">3. CHAPTER 11 STATUS</div>
                  <div className="text-lg font-black mt-1 text-rose-400">
                    LIQUIDATION
                  </div>
                  <div className="text-[11px] mt-1 opacity-80 text-rose-300">
                    Assets Foreclosed by Creditors
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Classic Koei 3-Pillar Verification */
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-400" />
                <span>KOEI AEROBIZ SUPERSONIC VICTORY BENCHMARKS (เกณฑ์การตัดสินแชมป์โลก):</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {/* Benchmark 1: 7 Hubs */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    (gameState.victoryDetails?.hubsCount || 0) >= 7 || playerAirline.hubCityIds.length >= 6
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-xs text-slate-400 font-bold">1. REGIONAL HUBS</div>
                  <div className="text-lg font-black mt-1">
                    {Math.min(7, playerAirline.hubCityIds.length + 1)} / 7 Regions
                  </div>
                  <div className="text-[11px] mt-1 opacity-80">
                    {playerAirline.hubCityIds.length >= 6 ? '✓ Complete (ครบ 7 ทวีป)' : 'Requires all 7 world regions'}
                  </div>
                </div>

                {/* Benchmark 2: Regional Passenger Leadership */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    (gameState.victoryDetails?.leadingRegionsCount || 0) >= 5
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-xs text-slate-400 font-bold">2. MARKET LEADERSHIP</div>
                  <div className="text-lg font-black mt-1">
                    {gameState.victoryDetails?.leadingRegionsCount || 0} / 5 Regions
                  </div>
                  <div className="text-[11px] mt-1 opacity-80">
                    #1 in passenger market share
                  </div>
                </div>

                {/* Benchmark 3: Profitability */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    (humanStanding?.quarterProfitK || 0) > 0
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                  }`}
                >
                  <div className="text-xs text-slate-400 font-bold">3. PROFITABLE EMPIRE</div>
                  <div className="text-lg font-black mt-1">
                    {(humanStanding?.quarterProfitK || 0) >= 0 ? '+' : ''}$
                    {(humanStanding?.quarterProfitK || 0).toLocaleString()}K
                  </div>
                  <div className="text-[11px] mt-1 opacity-80">
                    {(humanStanding?.quarterProfitK || 0) > 0 ? '✓ Profitable Net Margin' : 'Deficit / Red Alert'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Standing Overview Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 font-mono text-xs space-y-2">
            <div className="font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>FINAL EMPIRE AUDIT ({winnerAirline.name}):</span>
              <span className="text-emerald-400 font-black">
                Valuation: ${(humanStanding?.totalValuationK ?? (playerAirline.cashK + playerAirline.fleet.length * 25000)).toLocaleString()}K
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-300">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CASH RESERVES</span>
                <span className="font-black text-white text-sm">
                  ${playerAirline.cashK.toLocaleString()}K
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">TOTAL FLEET</span>
                <span className="font-black text-sky-400 text-sm">{playerAirline.fleet.length} Aircraft</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">ACTIVE ROUTES</span>
                <span className="font-black text-amber-400 text-sm">
                  {gameState.routes.filter((r) => r.airlineId === playerAirline.id).length} Routes
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SUBSIDIARIES</span>
                <span className="font-black text-purple-400 text-sm">
                  {playerAirline.businesses.length} Ventures
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 border-t border-slate-800/80 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={onRestartGame}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition cursor-pointer border border-slate-700"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Start New Game (เริ่มเกมใหม่)</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold font-mono transition cursor-pointer border border-slate-700"
            >
              Review Board (ตรวจดูผลงาน)
            </button>

            <button
              onClick={onContinueSandbox}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-black font-mono flex items-center gap-2 transition cursor-pointer shadow-lg border border-emerald-400 active:scale-95"
            >
              <span>Continue in Sandbox Mode (เล่นต่อแบบอิสระ)</span>
              <ArrowRight className="w-4 h-4 text-emerald-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
