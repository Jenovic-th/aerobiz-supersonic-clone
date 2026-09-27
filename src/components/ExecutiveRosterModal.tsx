import React from 'react';
import { Airline } from '../types/game';
import { NegotiatorAvatar } from './NegotiatorAvatar';
import { X, Users, Clock, CheckCircle2, Shield, MapPin, Building2, Briefcase } from 'lucide-react';

interface ExecutiveRosterModalProps {
  playerAirline: Airline;
  onClose: () => void;
}

export const ExecutiveRosterModal: React.FC<ExecutiveRosterModalProps> = ({
  playerAirline,
  onClose,
}) => {
  const negotiators = playerAirline.negotiators || [];
  const fieldDelegates = negotiators.filter((n) => n.role === 'FIELD');
  const hqDirector = negotiators.find((n) => n.role === 'HQ') || negotiators[4];

  const availableCount = fieldDelegates.filter((n) => n.status === 'AVAILABLE').length;
  const dispatchedCount = fieldDelegates.filter((n) => n.status === 'DISPATCHED').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-sky-500/70 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col text-slate-100">
        {/* Title Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 px-6 py-4 border-b border-sky-800/80 flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-900/80 border border-sky-400">
              <Users className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">
                Executive Delegation Roster (4+1 Staff)
              </h2>
              <div className="text-xs text-sky-300 font-mono">
                {availableCount} Available • {dispatchedCount} Dispatched on Mission • 1 HQ Director
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Field Envoys (4 Characters with identical capability) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-black text-slate-200 tracking-wide font-mono uppercase">
                  Field Diplomatic Envoys (4 Foreign Mission Delegates)
                </h3>
              </div>
              <span className="text-xs text-slate-400">Equal Capability & Authority</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldDelegates.map((delegate) => {
                const isDispatched = delegate.status === 'DISPATCHED' && delegate.currentMission;
                const mission = delegate.currentMission;

                return (
                  <div
                    key={delegate.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDispatched
                        ? 'bg-amber-950/30 border-amber-500/80 shadow-md'
                        : 'bg-slate-800/90 border-slate-700 hover:border-slate-600 shadow'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <NegotiatorAvatar avatarId={delegate.avatarId} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-black text-base text-white truncate">
                            {delegate.name}
                          </h4>
                          {isDispatched ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400 whitespace-nowrap animate-pulse">
                              DISPATCHED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400 whitespace-nowrap">
                              AVAILABLE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-sky-400 font-mono mt-0.5">
                          {delegate.title}
                        </div>

                        {/* Mission status or Readiness description */}
                        {isDispatched && mission ? (
                          <div className="mt-3 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              <span className="truncate">Mission in {mission.targetCityName}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Objective:{' '}
                              <strong className="text-white">
                                {mission.type === 'SLOT_NEGOTIATION'
                                  ? `+${mission.requestedSlots} Airport Slots`
                                  : `Subsidiary Acquisition`}
                              </strong>
                            </div>
                            <div className="flex items-center gap-1.5 text-amber-300 font-mono text-xs pt-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{mission.quartersRemaining} Quarter(s) Remaining</span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 text-xs text-slate-400 leading-relaxed">
                            Stationed at flight operations desk. Ready to be dispatched to foreign
                            civil aviation authorities.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Permanent HQ Operations Director (David Sterling) */}
          {hqDirector && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-slate-200 tracking-wide font-mono uppercase">
                  HQ Operations Director (Stationed at Home Office)
                </h3>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-2 border-slate-700 shadow-lg">
                <div className="flex items-start gap-4">
                  <NegotiatorAvatar avatarId={hqDirector.avatarId} size="lg" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-black text-lg text-white">{hqDirector.name}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/20 text-sky-300 border border-sky-400">
                        PERMANENT HQ STATION
                      </span>
                    </div>
                    <div className="text-xs text-amber-400 font-mono mt-0.5">
                      {hqDirector.title}
                    </div>

                    <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Coordinates head office internal administration, regulatory compliance, slot
                      surrenders, and subsidiary asset divestments without dispatch wait.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs shadow border border-slate-700 transition cursor-pointer"
          >
            Close Roster
          </button>
        </div>
      </div>
    </div>
  );
};
