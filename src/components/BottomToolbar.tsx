import React from 'react';
import { Plane, PlusCircle, ShoppingCart, Building2, Handshake, BarChart3, ChevronRight } from 'lucide-react';

interface BottomToolbarProps {
  onOpenRouteModal: () => void;
  onOpenFleetModal: () => void;
  onOpenAircraftShop: () => void;
  onOpenBusinessModal: () => void;
  onOpenSlotModal: () => void;
  onOpenFinancialReport: () => void;
  onAdvanceQuarter: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  onOpenRouteModal,
  onOpenFleetModal,
  onOpenAircraftShop,
  onOpenBusinessModal,
  onOpenSlotModal,
  onOpenFinancialReport,
  onAdvanceQuarter,
}) => {
  return (
    <footer className="w-full shrink-0 h-14 md:h-16 bg-slate-900 border-t border-slate-700/80 px-4 py-2 flex items-center justify-between gap-3 shadow-2xl z-20 overflow-x-auto select-none">
      {/* Executive Command Buttons (Enlarged) */}
      <div className="flex items-center gap-2.5 flex-nowrap shrink-0">
        <button
          onClick={onOpenRouteModal}
          className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white rounded-xl font-bold text-xs md:text-sm shadow-lg transition-all active:scale-95 border border-sky-400 cursor-pointer whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4 md:w-5 md:h-5 text-sky-100" />
          <span>Open Route</span>
        </button>

        <button
          onClick={onOpenFleetModal}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Plane className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
          <span>My Routes</span>
        </button>

        <button
          onClick={onOpenAircraftShop}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
          <span>Aircraft Market</span>
        </button>

        <button
          onClick={onOpenSlotModal}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Handshake className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
          <span>Airport Slots</span>
        </button>

        <button
          onClick={onOpenBusinessModal}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Building2 className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
          <span>Hotels & Ventures</span>
        </button>

        <button
          onClick={onOpenFinancialReport}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs md:text-sm shadow border border-slate-600 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
          <span>Financials</span>
        </button>
      </div>

      {/* Prominent End Quarter Button */}
      <button
        onClick={onAdvanceQuarter}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-sm md:text-base shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-95 border-2 border-emerald-400 cursor-pointer whitespace-nowrap shrink-0"
      >
        <span>End Quarter</span>
        <ChevronRight className="w-5 h-5 text-emerald-200 animate-pulse" />
      </button>
    </footer>
  );
};
