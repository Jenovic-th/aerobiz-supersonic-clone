import React, { useState } from 'react';
import { AircraftModel } from '../types/game';
import { getAircraftBlueprintData } from '../data/aircraftBlueprints';
import { getAircraftPhotoInfo } from '../data/aircraftVisuals';
import {
  Gauge,
  Compass,
  Fuel,
  Wrench,
  Users,
  Maximize2,
  ShieldCheck,
  Plane,
  Sparkles,
  Info,
  Camera,
  Layers,
} from 'lucide-react';

interface AircraftBlueprintViewerProps {
  model: AircraftModel;
}

export const AircraftBlueprintViewer: React.FC<AircraftBlueprintViewerProps> = ({ model }) => {
  const bp = getAircraftBlueprintData(model);
  const photoInfo = getAircraftPhotoInfo(model);
  const [viewMode, setViewMode] = useState<'PHOTO' | 'BLUEPRINT' | 'TECH_SPECS'>('PHOTO');

  // Identify specific airframe configuration
  const isSST =
    model.isSupersonic ||
    bp.category === 'SUPERSONIC' ||
    model.id.includes('CONCORDE') ||
    model.id.includes('Boom') ||
    model.id.includes('MACH4');
  const is747 = model.id.includes('747');
  const isA380 = model.id.includes('380');
  const isWidebodyTrijet = model.id.includes('DC-10') || model.id.includes('MD-11') || model.id.includes('L-1011');
  const isTTailTrijet = model.id.includes('727') || model.id.includes('154');
  const isClassicQuad =
    model.id.includes('707') ||
    model.id.includes('DC-8') ||
    model.id.includes('340') ||
    model.id.includes('96') ||
    model.id.includes('86') ||
    model.id.includes('62');
  const isFutureTech = model.id.includes('Tesla') || model.id.includes('SpaceX') || model.id.includes('Starship');
  const isWidebodyTwin =
    bp.category === 'WIDEBODY_TWIN' ||
    model.id.includes('777') ||
    model.id.includes('787') ||
    model.id.includes('350') ||
    model.id.includes('330') ||
    model.id.includes('300') ||
    model.id.includes('767');

  return (
    <div className="relative w-full h-full flex flex-col bg-[#070d19] text-slate-100 rounded-none md:rounded-2xl border-0 md:border-2 border-slate-700/80 shadow-2xl overflow-hidden select-none">
      {/* 1. Aerospace Showroom Horizon & Atmospheric Lighting */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_90%_60%_at_50%_15%,rgba(56,189,248,0.12),transparent_75%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_60%,rgba(2,6,23,0.85)_100%)]" />

      {/* 2. Top Title & Presentation Header */}
      <div className="relative shrink-0 px-5 pt-4 pb-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md z-10">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white font-mono drop-shadow flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-400" />
              <span>{model.model}</span>
            </h1>

            {isSST ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400 font-black text-[11px] tracking-wide animate-pulse">
                ⚡ SUPERSONIC FLAGSHIP
              </span>
            ) : isA380 || is747 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400 font-black text-[11px] tracking-wide">
                👑 HEAVY DOUBLE-DECK QUEEN
              </span>
            ) : isFutureTech ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 font-black text-[11px] tracking-wide">
                🚀 NEXT-GEN FUTURE TECH
              </span>
            ) : isWidebodyTwin || isWidebodyTrijet ? (
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400 font-black text-[11px] tracking-wide">
                🌐 WIDEBODY INTERCONTINENTAL
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600 font-black text-[11px] tracking-wide">
                ✈️ COMMERCIAL AIRLINER
              </span>
            )}
          </div>

          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2.5 flex-wrap">
            <span className="text-sky-300 font-bold">{model.manufacturer}</span>
            <span>•</span>
            <span>ERA {model.era}: {model.introYear} {model.retireYear ? `– ${model.retireYear}` : '– Present'}</span>
            <span>•</span>
            <span className="text-slate-300">
              {model.originBloc === 'WEST' ? '🇺🇸/🇪🇺 Western Aviation' : model.originBloc === 'EAST' ? '🇷🇺 Eastern Bloc' : '🌐 Global Consortium'}
            </span>
          </div>
        </div>

        {/* Right Controls: View Switcher & Acquisition Price */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700 font-mono text-xs">
            <button
              onClick={() => setViewMode('PHOTO')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'PHOTO'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-sky-300" />
              <span>Real Photo</span>
            </button>
            <button
              onClick={() => setViewMode('BLUEPRINT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'BLUEPRINT'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-300" />
              <span>CAD Profile</span>
            </button>
            <button
              onClick={() => setViewMode('TECH_SPECS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'TECH_SPECS'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Telemetry</span>
            </button>
          </div>

          <div className="bg-slate-950/90 border-2 border-emerald-500/70 px-3.5 py-1 rounded-xl text-right shrink-0">
            <div className="text-[9px] text-emerald-300/90 font-mono uppercase tracking-wider">Unit Acquisition</div>
            <div className="text-lg md:text-xl font-black font-mono text-emerald-400">
              ${model.priceK.toLocaleString()}K
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Aircraft Presentation Stage */}
      {viewMode === 'PHOTO' ? (
        <div className="relative flex-1 min-h-[300px] w-full flex items-center justify-center p-3 md:p-5 overflow-hidden bg-slate-950/80">
          <div className="relative w-full max-w-5xl h-full max-h-[460px] rounded-2xl overflow-hidden border border-sky-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.85)] bg-slate-950 flex items-center justify-center group">
            {/* Real High-Resolution Aviation Photograph */}
            <img
              src={photoInfo.photoUrl}
              alt={photoInfo.caption}
              className="w-full h-full object-cover object-center filter brightness-105 contrast-105 transition-transform duration-700 group-hover:scale-105"
            />

            {/* Atmospheric Overlays & Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/40 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-transparent to-slate-950/50 pointer-events-none" />

            {/* Top Banner: Authenticity & Live Photography Watermark */}
            <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-xs font-mono z-10 pointer-events-none">
              <div className="flex items-center gap-2 bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-sky-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                <span className="text-[11px] font-bold text-sky-200 tracking-wider">
                  REALISTIC AIR-TO-AIR PRESENTATION // 4K HIGH FIDELITY
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-[11px] text-slate-300 font-bold tracking-widest uppercase">
                <span>{photoInfo.manufacturerWatermark}</span>
              </div>
            </div>

            {/* Bottom Overlays: Livery, Flight Context, Airframe Details */}
            <div className="absolute bottom-3 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-xs font-mono z-10 pointer-events-none">
              <div className="bg-slate-950/85 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-slate-700/80 max-w-lg shadow-xl">
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <Plane className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{photoInfo.caption}</span>
                </div>
                <div className="text-[11px] text-sky-300/90 mt-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{photoInfo.flightContext}</span>
                </div>
                <div className="text-[10px] text-amber-300 mt-1 flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>LIVERY: {photoInfo.airlineLivery}</span>
                </div>
              </div>

              <div className="bg-slate-950/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/80 text-right shadow-xl shrink-0">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">AIRFRAME SCALE</div>
                <div className="text-sm font-black text-emerald-400">
                  {bp.lengthM}m L × {bp.wingspanM}m W
                </div>
                <div className="text-[10px] text-sky-300/80 mt-0.5">
                  SPEED: {model.speedKmh} km/h ({bp.machNumber})
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex-1 min-h-[260px] p-3 md:p-4 flex flex-col justify-center items-center overflow-hidden">
          {/* Tarmac Runway Light & Dimension Banner */}
          <div className="w-full max-w-3xl flex items-center justify-between text-xs font-mono px-4 mb-1 z-10">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
              <span className="text-[11px] font-bold text-slate-300 tracking-wider">
                AEROSPACE CAD BLUEPRINT // 1:200 SCALE SIDE PROFILE
              </span>
            </div>
            <div className="text-sky-300 font-bold text-[11px]">
              LENGTH: {bp.lengthM}m • SPAN: {bp.wingspanM}m
            </div>
          </div>

        {/* Master Realistic SVG Aircraft Canvas */}
        <div className="w-full max-w-3xl flex-1 flex items-center justify-center relative z-10">
          <svg
            viewBox="0 0 700 230"
            className="w-full h-auto max-h-[230px] drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Solid Aviation Pearl Fuselage Paint Gradient */}
              <linearGradient id="fuselagePaint" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="18%" stopColor="#f1f5f9" />
                <stop offset="55%" stopColor="#e2e8f0" />
                <stop offset="82%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              {/* Stainless Steel Mirror Finish (for Starship) */}
              <linearGradient id="mirrorSteel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#e2e8f0" />
                <stop offset="75%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Airline Livery Cheatline Gradients */}
              <linearGradient id="liveryRoyal" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="60%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="liveryGold" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
              <linearGradient id="tailFinGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1d4ed8" />
                <stop offset="50%" stopColor="#1e40af" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              {/* Cockpit Polarized Glass Gradient */}
              <linearGradient id="cockpitGlass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="50%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              {/* Cylindrical Engine Nacelle Gradient */}
              <linearGradient id="engineNacelle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#e2e8f0" />
                <stop offset="70%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              {/* Polished Chrome Inlet Cowl Lip Ring */}
              <linearGradient id="chromeInlet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>

              {/* Titanium Exhaust Hot Section */}
              <linearGradient id="titaniumExhaust" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="70%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>

              {/* Rubber Tire Gradient */}
              <radialGradient id="rubberTire" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="#1e293b" />
                <stop offset="85%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>

              {/* Ground Shadow Filter */}
              <filter id="groundShadowBlur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
              </filter>
            </defs>

            {/* Tarmac Ground Surface & Taxiway Lines */}
            <rect x="20" y="186" width="660" height="38" fill="#090f1d" opacity="0.9" />
            <line x1="20" y1="186" x2="680" y2="186" stroke="#334155" strokeWidth="2" />
            {/* Tarmac Centerline Striping */}
            <line x1="20" y1="204" x2="680" y2="204" stroke="#eab308" strokeWidth="2" strokeDasharray="16 10" opacity="0.8" />
            {/* Runway Edge Inset Lights */}
            {[60, 160, 260, 360, 460, 560, 640].map((lx) => (
              <circle key={lx} cx={lx} cy="186" r="2.5" fill="#fde047" opacity="0.85" />
            ))}

            {/* Realistic Ambient Ground Shadow Beneath Airframe */}
            <ellipse
              cx={isSST ? 360 : 340}
              cy="188"
              rx={isSST ? 250 : isA380 || is747 ? 240 : 210}
              ry="7"
              fill="#000000"
              opacity="0.65"
              filter="url(#groundShadowBlur)"
            />

            {/* ========================================================================= */}
            {/* AIRFRAME RENDERING ENGINES BY CATEGORY */}
            {/* ========================================================================= */}

            {isSST ? (
              /* ========================================================= */
              /* 1. SUPERSONIC JET (CONCORDE / BOOM OVERTURE / MACH 4 SST) */
              /* ========================================================= */
              <g id="supersonicProfile">
                {/* Slender Aerodynamic Fuselage with Droop Snoot Nose */}
                <path
                  d="M650 120 L570 114 L220 115 L140 85 L115 116 L70 117 L60 120 L115 127 L480 126 L580 123 Z"
                  fill="url(#fuselagePaint)"
                  stroke="#64748b"
                  strokeWidth="1.2"
                />

                {/* Droop Snoot Visor Cockpit Glass */}
                <polygon points="585,114 560,113 564,118 584,118" fill="url(#cockpitGlass)" stroke="#0f172a" strokeWidth="0.8" />
                <polygon points="584,114 572,113 574,116 584,116" fill="#ffffff" opacity="0.4" />
                {/* Pitot Probe Needle */}
                <line x1="650" y1="120" x2="668" y2="120" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Supersonic Aerodynamic Blue & Gold Cheatline */}
                <path d="M570 117 L220 117 L115 121 L480 121 Z" fill="url(#liveryRoyal)" />
                <path d="M565 119 L220 119 L115 122 L480 122 Z" fill="url(#liveryGold)" opacity="0.9" />

                {/* Ogival Compound Delta Wing */}
                <path
                  d="M500 121 C420 122 340 148 240 166 L180 166 L240 122 Z"
                  fill="#cbd5e1"
                  stroke="#475569"
                  strokeWidth="1.2"
                />
                {/* Polished Wing Leading Edge Slat */}
                <path d="M500 121 C420 122 340 148 240 166" stroke="#ffffff" strokeWidth="1.5" />
                {/* Trailing Edge Elevons */}
                <line x1="240" y1="166" x2="180" y2="166" stroke="#f59e0b" strokeWidth="2.5" />

                {/* Olympus / Symphony Underwing Box Nacelles (Twin Pods) */}
                <rect x="290" y="132" width="68" height="19" rx="3" fill="url(#engineNacelle)" stroke="#475569" strokeWidth="1" />
                <rect x="215" y="132" width="68" height="19" rx="3" fill="url(#engineNacelle)" stroke="#475569" strokeWidth="1" />
                {/* Variable Ramp Intake Cowls */}
                <rect x="350" y="132" width="8" height="19" rx="1" fill="url(#chromeInlet)" />
                <rect x="275" y="132" width="8" height="19" rx="1" fill="url(#chromeInlet)" />
                {/* Reheat Exhaust Nozzles with Heat Glow */}
                <rect x="286" y="134" width="6" height="15" fill="url(#titaniumExhaust)" />
                <rect x="211" y="134" width="6" height="15" fill="url(#titaniumExhaust)" />
                <ellipse cx="208" cy="141" rx="5" ry="4" fill="#f59e0b" opacity="0.75" />

                {/* Swept Supersonic Vertical Tail Fin with Livery */}
                <path d="M150 115 L108 42 L80 42 L102 116 Z" fill="url(#tailFinGrad)" stroke="#1e3a8a" strokeWidth="1.2" />
                {/* Tailfin Emblem & Rudder Seam */}
                <line x1="108" y1="42" x2="102" y2="116" stroke="#f59e0b" strokeWidth="1.5" />
                <polygon points="104,50 90,65 95,65 106,53" fill="#ffffff" opacity="0.9" />

                {/* Passenger Windows (Narrow Supersonic Layout) */}
                <line x1="530" y1="116" x2="160" y2="116" stroke="#0f172a" strokeWidth="2" strokeDasharray="3.5 2.5" />

                {/* Main & Nose Landing Gear with Alloy Wheels */}
                {/* Nose Gear */}
                <line x1="540" y1="123" x2="540" y2="186" stroke="#94a3b8" strokeWidth="2.5" />
                <circle cx="540" cy="186" r="5" fill="url(#rubberTire)" stroke="#64748b" strokeWidth="1" />
                <circle cx="540" cy="186" r="2" fill="#cbd5e1" />
                {/* Main Gear Bogies */}
                <line x1="280" y1="145" x2="280" y2="186" stroke="#94a3b8" strokeWidth="3" />
                <circle cx="274" cy="186" r="6" fill="url(#rubberTire)" stroke="#64748b" strokeWidth="1.2" />
                <circle cx="274" cy="186" r="2.5" fill="#cbd5e1" />
                <circle cx="286" cy="186" r="6" fill="url(#rubberTire)" stroke="#64748b" strokeWidth="1.2" />
                <circle cx="286" cy="186" r="2.5" fill="#cbd5e1" />
              </g>
            ) : is747 ? (
              /* ========================================================= */
              /* 2. BOEING 747 QUEEN OF THE SKIES (UPPER DECK HUMP & 4 PODS)*/
              /* ========================================================= */
              <g id="boeing747Profile">
                {/* 747 Fuselage with Upper Deck Hump */}
                <path
                  d="M620 120 C610 94 540 76 430 79 C370 82 220 84 125 86 L80 34 L52 34 L72 120 L98 138 C240 138 520 138 595 132 Z"
                  fill="url(#fuselagePaint)"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />

                {/* Upper Deck Cockpit Windows */}
                <polygon points="562,94 545,91 548,98 562,99" fill="url(#cockpitGlass)" stroke="#0f172a" strokeWidth="0.8" />
                <polygon points="561,94 552,92 553,96 561,96" fill="#ffffff" opacity="0.5" />

                {/* Upper Deck Cabin Windows */}
                <line x1="530" y1="94" x2="430" y2="94" stroke="#0f172a" strokeWidth="2.5" strokeDasharray="3.5 2" />

                {/* Main Deck Continuous Window Belt */}
                <line x1="575" y1="117" x2="145" y2="117" stroke="#0f172a" strokeWidth="3" strokeDasharray="4 2" />
                {/* Golden Aerodynamic Beltline Cheatline */}
                <path d="M590 122 L110 122" stroke="url(#liveryRoyal)" strokeWidth="3" />
                <path d="M590 125 L110 125" stroke="url(#liveryGold)" strokeWidth="1.2" />

                {/* Passenger Doors L1, L2, L3, L4, L5 */}
                {[570, 500, 370, 240, 140].map((dx, i) => (
                  <rect key={i} x={dx} y="106" width="6.5" height="20" rx="1.5" fill="#f8fafc" stroke="#475569" strokeWidth="0.8" />
                ))}

                {/* Swept Main Wing with Flap Track Canoes & Canted Winglet */}
                <path
                  d="M420 126 L280 180 L220 180 L310 126 Z"
                  fill="#cbd5e1"
                  stroke="#475569"
                  strokeWidth="1.2"
                />
                {/* 3x Flap Track Fairing Canoes */}
                {[270, 245, 225].map((cx, i) => (
                  <polygon key={i} points={`${cx},178 ${cx - 12},184 ${cx - 4},178`} fill="#64748b" />
                ))}
                {/* Canted 6-ft Wingtip Winglet */}
                <line x1="220" y1="180" x2="215" y2="162" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />

                {/* Quad Podded Turbofans (Inboard #2 and Outboard #1) */}
                {/* Outboard Engine 1 */}
                <g transform="translate(240, 150)">
                  <rect x="0" y="0" width="40" height="18" rx="4" fill="url(#engineNacelle)" stroke="#475569" strokeWidth="1" />
                  <rect x="34" y="0" width="6" height="18" rx="2" fill="url(#chromeInlet)" />
                  <ellipse cx="37" cy="9" rx="2" ry="7" fill="#0f172a" />
                  <circle cx="37" cy="9" r="1.5" fill="#ffffff" /> {/* Fan spinner */}
                  <rect x="-4" y="2" width="5" height="14" fill="url(#titaniumExhaust)" />
                  <path d="M12 0 L20 -10" stroke="#64748b" strokeWidth="2.5" /> {/* Pylon */}
                </g>

                {/* Inboard Engine 2 */}
                <g transform="translate(325, 138)">
                  <rect x="0" y="0" width="44" height="20" rx="4" fill="url(#engineNacelle)" stroke="#475569" strokeWidth="1" />
                  <rect x="38" y="0" width="6" height="20" rx="2" fill="url(#chromeInlet)" />
                  <ellipse cx="41" cy="10" rx="2" ry="8" fill="#0f172a" />
                  <circle cx="41" cy="10" r="2" fill="#ffffff" />
                  <rect x="-4" y="2" width="5" height="16" fill="url(#titaniumExhaust)" />
                  <path d="M14 0 L22 -12" stroke="#64748b" strokeWidth="3" />
                </g>

                {/* Giant Vertical Stabilizer with Royal Tailfin Livery */}
                <path d="M125 86 L80 34 L52 34 L72 120 Z" fill="url(#tailFinGrad)" stroke="#1e3a8a" strokeWidth="1.2" />
                <polygon points="78,45 62,68 68,68 81,49" fill="#f59e0b" />
                <line x1="80" y1="34" x2="72" y2="120" stroke="#f8fafc" strokeWidth="1" strokeDasharray="4 2" />

                {/* Quad-Bogie Heavy Landing Gear (16 Wheels Total) */}
                {/* Dual Nose Gear */}
                <line x1="535" y1="130" x2="535" y2="186" stroke="#94a3b8" strokeWidth="2.5" />
                <circle cx="535" cy="186" r="5.5" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <circle cx="535" cy="186" r="2" fill="#cbd5e1" />
                {/* 4-Wheel Main Gear Trucks */}
                <line x1="315" y1="135" x2="310" y2="186" stroke="#94a3b8" strokeWidth="3.5" />
                <circle cx="298" cy="186" r="6.5" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <circle cx="298" cy="186" r="2.5" fill="#cbd5e1" />
                <circle cx="310" cy="186" r="6.5" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <circle cx="310" cy="186" r="2.5" fill="#cbd5e1" />
                <circle cx="322" cy="186" r="6.5" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <circle cx="322" cy="186" r="2.5" fill="#cbd5e1" />
              </g>
            ) : isA380 ? (
              /* ========================================================= */
              /* 3. AIRBUS A380 FULL DOUBLE-DECK SUPERJUMBO                */
              /* ========================================================= */
              <g id="a380Profile">
                {/* Full-Length Double Decker Fuselage */}
                <path
                  d="M620 120 C600 70 510 60 280 60 C180 60 120 75 80 82 L52 26 L28 26 L48 120 L78 144 C200 144 480 144 585 138 Z"
                  fill="url(#fuselagePaint)"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />

                {/* Cockpit Windows (Positioned Between Main & Upper Decks) */}
                <polygon points="585,108 568,104 571,112 585,112" fill="url(#cockpitGlass)" stroke="#0f172a" strokeWidth="0.8" />

                {/* Upper Deck Continuous Windows */}
                <line x1="540" y1="80" x2="130" y2="80" stroke="#0f172a" strokeWidth="2.5" strokeDasharray="3.5 1.5" />
                {/* Lower Main Deck Continuous Windows */}
                <line x1="560" y1="120" x2="110" y2="120" stroke="#0f172a" strokeWidth="3" strokeDasharray="3.5 1.5" />
                {/* Dual Cheatlines */}
                <path d="M580 98 L110 98" stroke="url(#liveryRoyal)" strokeWidth="3" />
                <path d="M580 102 L110 102" stroke="url(#liveryGold)" strokeWidth="1.5" />

                {/* Giant Supercritical Wing with Wingtip Fences */}
                <path
                  d="M430 130 L270 184 L215 184 L310 130 Z"
                  fill="#cbd5e1"
                  stroke="#475569"
                  strokeWidth="1.2"
                />
                {/* Wingtip Fence */}
                <line x1="215" y1="174" x2="215" y2="190" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />

                {/* 4x Massive Rolls-Royce Trent 900 Turbofans */}
                {/* Outboard Trent */}
                <g transform="translate(245, 154)">
                  <rect x="0" y="0" width="42" height="20" rx="4" fill="url(#engineNacelle)" stroke="#475569" strokeWidth="1" />
                  <rect x="36" y="0" width="6" height="20" rx="2" fill="url(#chromeInlet)" />
                  <ellipse cx="39" cy="10" rx="2" ry="8" fill="#0f172a" />
                  <circle cx="39" cy="10" r="2" fill="#ffffff" />
                  <rect x="-4" y="2" width="5" height="16" fill="url(#titaniumExhaust)" />
                  <path d="M12 0 L18 -10" stroke="#64748b" strokeWidth="2.5" />
                </g>
                {/* Inboard Trent */}
                <g transform="translate(335, 140)">
                  <rect x="0" y="0" width="48" height="22" rx="4" fill="url(#engineNacelle)" stroke="#475569" strokeWidth="1" />
                  <rect x="42" y="0" width="6" height="22" rx="2" fill="url(#chromeInlet)" />
                  <ellipse cx="45" cy="11" rx="2.5" ry="9" fill="#0f172a" />
                  <circle cx="45" cy="11" r="2" fill="#ffffff" />
                  <rect x="-4" y="2" width="5" height="18" fill="url(#titaniumExhaust)" />
                  <path d="M14 0 L22 -10" stroke="#64748b" strokeWidth="3" />
                </g>

                {/* Massive 24-Meter Tall Vertical Stabilizer */}
                <path d="M110 82 L52 26 L28 26 L48 120 Z" fill="url(#tailFinGrad)" stroke="#1e3a8a" strokeWidth="1.2" />

                {/* Multi-Axle 20-Wheel Main Gear Assembly */}
                <line x1="520" y1="136" x2="520" y2="186" stroke="#94a3b8" strokeWidth="2.5" />
                <circle cx="520" cy="186" r="5.5" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <line x1="300" y1="140" x2="295" y2="186" stroke="#94a3b8" strokeWidth="4" />
                <circle cx="282" cy="186" r="6.5" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <circle cx="295" cy="186" r="6.5" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <circle cx="308" cy="186" r="6.5" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
              </g>
            ) : isWidebodyTrijet ? (
              /* ========================================================= */
              /* 4. WIDEBODY TRIJET (MCDONNELL DOUGLAS DC-10-30 / MD-11)   */
              /* ========================================================= */
              <g id="widebodyTrijetProfile">
                <path
                  d="M610 120 C590 88 510 82 250 82 L130 84 L78 28 L50 28 L68 112 L98 136 C220 136 510 136 580 130 Z"
                  fill="url(#fuselagePaint)"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />

                {/* Cockpit & Windows */}
                <polygon points="585,98 568,95 570,103 585,103" fill="url(#cockpitGlass)" stroke="#0f172a" strokeWidth="0.8" />
                <line x1="560" y1="113" x2="160" y2="113" stroke="#0f172a" strokeWidth="3" strokeDasharray="4 2" />
                <path d="M575 118 L130 118" stroke="url(#liveryRoyal)" strokeWidth="3" />
                <path d="M575 121 L130 121" stroke="url(#liveryGold)" strokeWidth="1.2" />

                {/* Iconic Straight-Through #2 Center Tailfin Engine */}
                <g transform="translate(75, 48)">
                  <rect x="0" y="0" width="56" height="24" rx="4" fill="url(#engineNacelle)" stroke="#475569" strokeWidth="1.2" />
                  <rect x="50" y="0" width="6" height="24" rx="2" fill="url(#chromeInlet)" />
                  <ellipse cx="53" cy="12" rx="2" ry="10" fill="#0f172a" />
                  <circle cx="53" cy="12" r="2.5" fill="#ffffff" />
                  <rect x="-6" y="2" width="7" height="20" fill="url(#titaniumExhaust)" />
                </g>

                {/* Swept Main Wing & Underwing Engine */}
                <path d="M410 126 L270 178 L220 178 L310 126 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1.2" />
                <g transform="translate(305, 142)">
                  <rect x="0" y="0" width="46" height="21" rx="4" fill="url(#engineNacelle)" stroke="#475569" strokeWidth="1" />
                  <rect x="40" y="0" width="6" height="21" rx="2" fill="url(#chromeInlet)" />
                  <ellipse cx="43" cy="10.5" rx="2" ry="9" fill="#0f172a" />
                  <circle cx="43" cy="10.5" r="2" fill="#ffffff" />
                  <rect x="-4" y="2" width="5" height="17" fill="url(#titaniumExhaust)" />
                  <path d="M14 0 L22 -16" stroke="#64748b" strokeWidth="3" />
                </g>

                {/* Vertical Stabilizer Surrounding Center Engine */}
                <path d="M130 84 L78 28 L50 28 L68 112 Z" fill="url(#tailFinGrad)" stroke="#1e3a8a" strokeWidth="1.2" />

                {/* Landing Gear */}
                <line x1="535" y1="128" x2="535" y2="186" stroke="#94a3b8" strokeWidth="2.5" />
                <circle cx="535" cy="186" r="5" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <line x1="295" y1="135" x2="290" y2="186" stroke="#94a3b8" strokeWidth="3.5" />
                <circle cx="282" cy="186" r="6" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <circle cx="295" cy="186" r="6" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
              </g>
            ) : isTTailTrijet ? (
              /* ========================================================= */
              /* 5. T-TAIL REAR TRIJET (BOEING 727-200 / TUPOLEV TU-154B)  */
              /* ========================================================= */
              <g id="tTailTrijetProfile">
                {/* Slender Narrowbody Fuselage */}
                <path
                  d="M605 120 C585 92 510 88 230 88 L140 90 L85 24 L52 24 L72 120 L98 134 C220 134 490 134 570 128 Z"
                  fill="url(#fuselagePaint)"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />

                {/* T-Tail Horizontal Stabilizer Mounted On Top of Tail Fin */}
                <polygon points="98,24 45,24 60,30 110,30" fill="#cbd5e1" stroke="#475569" strokeWidth="1.2" />

                {/* #2 Engine S-Duct Intake Scoop at Base of Tail Fin */}
                <path d="M125 78 C115 65 100 64 90 64 L86 78 Z" fill="url(#engineNacelle)" stroke="#475569" strokeWidth="1.2" />
                <ellipse cx="125" cy="72" rx="2.5" ry="6" fill="#0f172a" />
                {/* #2 Engine Tailcone Exhaust */}
                <ellipse cx="68" cy="120" rx="3" ry="5" fill="url(#titaniumExhaust)" />

                {/* Rear Fuselage Side-Mounted Engines #1 & #3 */}
                <g transform="translate(130, 102)">
                  <rect x="0" y="0" width="46" height="18" rx="4" fill="url(#engineNacelle)" stroke="#475569" strokeWidth="1.2" />
                  <rect x="40" y="0" width="6" height="18" rx="2" fill="url(#chromeInlet)" />
                  <ellipse cx="43" cy="9" rx="2" ry="7" fill="#0f172a" />
                  <circle cx="43" cy="9" r="1.5" fill="#ffffff" />
                  <rect x="-4" y="2" width="5" height="14" fill="url(#titaniumExhaust)" />
                  <path d="M20 9 L10 18" stroke="#64748b" strokeWidth="2.5" />
                </g>

                {/* Cockpit & Cabin Windows */}
                <polygon points="582,98 566,95 568,102 582,102" fill="url(#cockpitGlass)" stroke="#0f172a" strokeWidth="0.8" />
                <line x1="550" y1="112" x2="190" y2="112" stroke="#0f172a" strokeWidth="2.5" strokeDasharray="3.5 2" />
                <path d="M575 116 L175 116" stroke="url(#liveryRoyal)" strokeWidth="2.5" />
                <path d="M575 119 L175 119" stroke="url(#liveryGold)" strokeWidth="1" />

                {/* Clean Low Wing (No Engines on Wing!) with 3 Flap Canoes */}
                <path d="M400 126 L275 178 L230 178 L315 126 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1.2" />
                {[265, 245, 235].map((cx, i) => (
                  <polygon key={i} points={`${cx},176 ${cx - 10},182 ${cx - 3},176`} fill="#64748b" />
                ))}

                {/* Vertical Stabilizer with Livery */}
                <path d="M140 90 L85 24 L52 24 L72 120 Z" fill="url(#tailFinGrad)" stroke="#1e3a8a" strokeWidth="1.2" />

                {/* Tricycle Gear */}
                <line x1="530" y1="128" x2="530" y2="186" stroke="#94a3b8" strokeWidth="2.5" />
                <circle cx="530" cy="186" r="5" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <line x1="290" y1="135" x2="285" y2="186" stroke="#94a3b8" strokeWidth="3" />
                <circle cx="280" cy="186" r="6" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <circle cx="292" cy="186" r="6" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
              </g>
            ) : isClassicQuad ? (
              /* ========================================================= */
              /* 6. FIRST-GEN QUAD-JET (BOEING 707-320B / DOUGLAS DC-8-62) */
              /* ========================================================= */
              <g id="classicQuadProfile">
                {/* Slender 1960s Classic Narrowbody Fuselage */}
                <path
                  d="M610 120 C590 92 500 86 240 86 L130 88 L80 32 L54 32 L74 116 L100 134 C220 134 500 134 575 128 Z"
                  fill="url(#fuselagePaint)"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />

                {/* Classic HF Antenna Probe on Top of Fin */}
                <line x1="80" y1="32" x2="115" y2="28" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Cockpit with Eyebrow Windows */}
                <polygon points="585,97 568,94 570,102 585,102" fill="url(#cockpitGlass)" stroke="#0f172a" strokeWidth="0.8" />
                <line x1="555" y1="112" x2="150" y2="112" stroke="#0f172a" strokeWidth="2.5" strokeDasharray="3 2" />
                <path d="M580 117 L110 117" stroke="url(#liveryRoyal)" strokeWidth="3" />
                <path d="M580 120 L110 120" stroke="url(#liveryGold)" strokeWidth="1.2" />

                {/* 4x Slender Pratt & Whitney JT3D Turbofans */}
                {/* Outboard Engine 1 */}
                <g transform="translate(250, 150)">
                  <rect x="0" y="0" width="36" height="15" rx="3" fill="url(#engineNacelle)" stroke="#475569" strokeWidth="1" />
                  <rect x="31" y="0" width="5" height="15" rx="1.5" fill="url(#chromeInlet)" />
                  <ellipse cx="33" cy="7.5" rx="1.5" ry="6" fill="#0f172a" />
                  <rect x="-4" y="1.5" width="5" height="12" fill="url(#titaniumExhaust)" />
                  <path d="M12 0 L18 -10" stroke="#64748b" strokeWidth="2" />
                </g>
                {/* Inboard Engine 2 */}
                <g transform="translate(325, 138)">
                  <rect x="0" y="0" width="38" height="16" rx="3" fill="url(#engineNacelle)" stroke="#475569" strokeWidth="1" />
                  <rect x="33" y="0" width="5" height="16" rx="1.5" fill="url(#chromeInlet)" />
                  <ellipse cx="35" cy="8" rx="1.5" ry="6.5" fill="#0f172a" />
                  <rect x="-4" y="2" width="5" height="12" fill="url(#titaniumExhaust)" />
                  <path d="M14 0 L20 -12" stroke="#64748b" strokeWidth="2.5" />
                </g>

                {/* Swept Main Wing */}
                <path d="M400 124 L275 178 L225 178 L310 124 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1.2" />

                {/* Vertical Tail Fin with Classic Golden Striping */}
                <path d="M130 88 L80 32 L54 32 L74 116 Z" fill="url(#tailFinGrad)" stroke="#1e3a8a" strokeWidth="1.2" />

                {/* Landing Gear */}
                <line x1="535" y1="128" x2="535" y2="186" stroke="#94a3b8" strokeWidth="2.5" />
                <circle cx="535" cy="186" r="5" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <line x1="290" y1="135" x2="285" y2="186" stroke="#94a3b8" strokeWidth="3" />
                <circle cx="280" cy="186" r="6" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <circle cx="292" cy="186" r="6" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
              </g>
            ) : isFutureTech ? (
              /* ========================================================= */
              /* 7. FUTURE & HYPERSONIC (TESLA AEROSTAR / SPACEX STARSHIP) */
              /* ========================================================= */
              <g id="futureTechProfile">
                {/* Mirror-Finish Lifting Body / Stainless Hull */}
                <path
                  d="M630 120 C610 85 500 70 260 70 L140 76 L90 26 L60 26 L76 116 L110 136 C240 136 520 136 600 128 Z"
                  fill="url(#mirrorSteel)"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />
                {/* Underside Hexagonal Ceramic Thermal Heat Shield Tiles */}
                <path d="M110 136 L600 128 L590 134 L110 136 Z" fill="#0f172a" />

                {/* Futuristic Panoramic Flight Deck Visor with Cyan Sheen */}
                <polygon points="605,102 580,96 584,106 605,107" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
                <polygon points="602,102 590,98 592,103 602,104" fill="#ffffff" opacity="0.6" />

                {/* Ambient Cyan LED Light Ribbon Along Beltline */}
                <line x1="590" y1="116" x2="160" y2="116" stroke="#38bdf8" strokeWidth="2.5" />
                <line x1="590" y1="116" x2="160" y2="116" stroke="#ffffff" strokeWidth="0.8" />

                {/* Forward & Aft Actuated Aerodynamic Steering Flaps */}
                <polygon points="560,90 530,86 520,95 555,96" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                <polygon points="170,126 130,126 110,146 160,146" fill="#334155" stroke="#94a3b8" strokeWidth="1" />

                {/* Raptor Engine Bells Cluster */}
                <ellipse cx="64" cy="116" rx="5" ry="12" fill="#020617" stroke="#475569" strokeWidth="1.5" />
                <ellipse cx="60" cy="116" rx="4" ry="8" fill="#d97706" opacity="0.8" />
              </g>
            ) : (
              /* ========================================================= */
              /* 8. MODERN TWIN-ENGINE AIRLINER (WIDEBODY & NARROWBODY)    */
              /* (B777, B787, A350, A330, A300, B767, A320, B737, A321XLR)*/
              /* ========================================================= */
              <g id="modernTwinjetProfile">
                {/* Modern Aerodynamic Streamlined Fuselage */}
                <path
                  d="M610 120 C590 92 510 82 250 82 L130 84 L80 30 L55 30 L74 116 L104 136 C220 136 500 136 580 128 Z"
                  fill="url(#fuselagePaint)"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />

                {/* Cockpit Flight Deck Windshield with Faceted Eyebrow */}
                <polygon points="585,98 568,95 570,103 585,103" fill="url(#cockpitGlass)" stroke="#0f172a" strokeWidth="0.8" />
                <polygon points="583,98 574,96 575,100 583,101" fill="#ffffff" opacity="0.5" />

                {/* Passenger Cabin Windows Belt */}
                <line x1="555" y1="112" x2="160" y2="112" stroke="#0f172a" strokeWidth={isWidebodyTwin ? '3' : '2.5'} strokeDasharray="3.5 2" />
                {/* Aerodynamic Airline Cheatline */}
                <path d="M580 117 L120 117" stroke="url(#liveryRoyal)" strokeWidth="3" />
                <path d="M580 120 L120 120" stroke="url(#liveryGold)" strokeWidth="1.2" />

                {/* Entry & Emergency Doors */}
                {[555, 460, 320, 180].map((dx, i) => (
                  <rect key={i} x={dx} y="104" width="6" height="18" rx="1.5" fill="#f8fafc" stroke="#475569" strokeWidth="0.8" />
                ))}

                {/* High-Efficiency Supercritical Wing with Blended Sharklet / Raked Tip */}
                <path
                  d="M400 126 L270 178 L220 178 L310 126 Z"
                  fill="#cbd5e1"
                  stroke="#475569"
                  strokeWidth="1.2"
                />
                {/* Blended Sharklet / Raked Wingtip */}
                <path d="M220 178 L212 165 L218 165" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                {/* Flap Canoes */}
                {[260, 240, 226].map((cx, i) => (
                  <polygon key={i} points={`${cx},176 ${cx - 10},182 ${cx - 3},176`} fill="#64748b" />
                ))}

                {/* Massive High-Bypass GE90 / Trent XWB / CFM Turbofan Engine */}
                <g transform={`translate(${isWidebodyTwin ? 310 : 320}, ${isWidebodyTwin ? 134 : 138})`}>
                  <rect
                    x="0"
                    y="0"
                    width={isWidebodyTwin ? 52 : 42}
                    height={isWidebodyTwin ? 25 : 19}
                    rx="4"
                    fill="url(#engineNacelle)"
                    stroke="#475569"
                    strokeWidth="1.2"
                  />
                  {/* Polished Chrome Cowl Lip */}
                  <rect
                    x={isWidebodyTwin ? 45 : 36}
                    y="0"
                    width="7"
                    height={isWidebodyTwin ? 25 : 19}
                    rx="2"
                    fill="url(#chromeInlet)"
                  />
                  {/* Intake Throat with Titanium Fan Blades & Spinner Swirl */}
                  <ellipse
                    cx={isWidebodyTwin ? 48 : 39}
                    cy={isWidebodyTwin ? 12.5 : 9.5}
                    rx={2.5}
                    ry={isWidebodyTwin ? 10.5 : 8}
                    fill="#0f172a"
                  />
                  <circle
                    cx={isWidebodyTwin ? 48 : 39}
                    cy={isWidebodyTwin ? 12.5 : 9.5}
                    r={isWidebodyTwin ? 2.5 : 2}
                    fill="#ffffff"
                  />
                  {/* Titanium Hot Exhaust Nozzle */}
                  <rect
                    x="-5"
                    y="2"
                    width="6"
                    height={isWidebodyTwin ? 20 : 15}
                    fill="url(#titaniumExhaust)"
                  />
                  {/* Pylon attaching to wing */}
                  <path
                    d={`M${isWidebodyTwin ? 16 : 14} 0 L${isWidebodyTwin ? 24 : 20} -12`}
                    stroke="#64748b"
                    strokeWidth={isWidebodyTwin ? '3.5' : '2.5'}
                  />
                </g>

                {/* Vertical Tail Stabilizer with Royal Tailfin Livery */}
                <path d="M130 84 L80 30 L55 30 L74 116 Z" fill="url(#tailFinGrad)" stroke="#1e3a8a" strokeWidth="1.2" />
                <polygon points="76,42 62,64 68,64 80,46" fill="#f59e0b" />
                <line x1="80" y1="30" x2="74" y2="116" stroke="#f8fafc" strokeWidth="1" strokeDasharray="4 2" />

                {/* Main & Nose Landing Gear */}
                <line x1="535" y1="128" x2="535" y2="186" stroke="#94a3b8" strokeWidth="2.5" />
                <circle cx="535" cy="186" r="5" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                <circle cx="535" cy="186" r="2" fill="#cbd5e1" />
                {/* Main Bogie (6-Wheel Truck for Widebody, Dual for Narrowbody) */}
                <line x1="295" y1="135" x2="290" y2="186" stroke="#94a3b8" strokeWidth={isWidebodyTwin ? '3.5' : '2.5'} />
                {isWidebodyTwin ? (
                  <>
                    <circle cx="280" cy="186" r="6" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                    <circle cx="280" cy="186" r="2.5" fill="#cbd5e1" />
                    <circle cx="292" cy="186" r="6" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                    <circle cx="292" cy="186" r="2.5" fill="#cbd5e1" />
                    <circle cx="304" cy="186" r="6" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                    <circle cx="304" cy="186" r="2.5" fill="#cbd5e1" />
                  </>
                ) : (
                  <>
                    <circle cx="284" cy="186" r="6" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                    <circle cx="284" cy="186" r="2.5" fill="#cbd5e1" />
                    <circle cx="296" cy="186" r="6" fill="url(#rubberTire)" stroke="#475569" strokeWidth="1" />
                    <circle cx="296" cy="186" r="2.5" fill="#cbd5e1" />
                  </>
                )}
              </g>
            )}
          </svg>
        </div>
      </div>
      )}

      {/* 4. Engineering Telemetry Specifications Grid (High-Contrast, Senior-Friendly) */}
      <div className="relative shrink-0 px-5 py-3.5 bg-slate-950 border-t border-slate-800 backdrop-blur-md z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Passenger Capacity */}
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80 shadow">
            <div className="flex items-center gap-1.5 text-sky-300 font-mono text-[10px] mb-0.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>PASSENGERS</span>
            </div>
            <div className="text-xl font-black font-mono text-white">
              {model.capacity}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">{bp.cabinAisle.split('(')[0]}</div>
          </div>

          {/* Maximum Flight Range */}
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80 shadow">
            <div className="flex items-center gap-1.5 text-emerald-300 font-mono text-[10px] mb-0.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>MAX RANGE</span>
            </div>
            <div className="text-xl font-black font-mono text-emerald-300">
              {model.rangeKm.toLocaleString()} <span className="text-xs font-normal">km</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              {model.rangeKm >= 11000 ? 'Intercontinental' : model.rangeKm >= 6000 ? 'Transoceanic' : 'Regional / Medium'}
            </div>
          </div>

          {/* Cruise Velocity */}
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80 shadow">
            <div className="flex items-center gap-1.5 text-amber-300 font-mono text-[10px] mb-0.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>CRUISE SPEED</span>
            </div>
            <div className="text-xl font-black font-mono text-amber-300">
              {model.speedKmh} <span className="text-xs font-normal">km/h</span>
            </div>
            <div className="text-[10px] text-amber-400 font-mono">{bp.machNumber}</div>
          </div>

          {/* Fuel Efficiency */}
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80 shadow">
            <div className="flex items-center gap-1.5 text-rose-300 font-mono text-[10px] mb-0.5">
              <Fuel className="w-3.5 h-3.5 text-rose-400" />
              <span>FUEL BURN</span>
            </div>
            <div className="text-xl font-black font-mono text-rose-300">
              {model.fuelBurnPerKm} <span className="text-xs font-normal">L/km</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {model.fuelBurnPerKm < 4 ? 'High Efficiency' : model.fuelBurnPerKm < 9 ? 'Moderate Burn' : 'Heavy Burner'}
            </div>
          </div>

          {/* Maintenance Factor */}
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80 shadow">
            <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[10px] mb-0.5">
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              <span>MAINTENANCE</span>
            </div>
            <div className="text-xl font-black font-mono text-cyan-300">
              ${model.maintCostPerHour} <span className="text-xs font-normal">/hr</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Per Flight Hour</div>
          </div>

          {/* Max Takeoff Weight */}
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80 shadow">
            <div className="flex items-center gap-1.5 text-purple-300 font-mono text-[10px] mb-0.5">
              <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
              <span>MAX TAKE-OFF</span>
            </div>
            <div className="text-xl font-black font-mono text-purple-300">
              {bp.mtowTon} <span className="text-xs font-normal">tonnes</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">FL{Math.round(bp.serviceCeilingFt / 100)} Ceiling</div>
          </div>
        </div>

        {/* Engine Specification & Historical Overview */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-mono">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              <strong className="text-sky-300">PROPULSION:</strong> {bp.engineType}
            </span>
          </div>
          <div className="text-slate-400 italic text-[11px] line-clamp-1">
            "{bp.historicalNote}"
          </div>
        </div>
      </div>
    </div>
  );
};
