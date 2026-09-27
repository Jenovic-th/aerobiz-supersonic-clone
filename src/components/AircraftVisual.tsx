import React from 'react';

interface AircraftVisualProps {
  modelId: string;
  isSupersonic?: boolean;
  className?: string;
}

export const AircraftVisual: React.FC<AircraftVisualProps> = ({
  modelId,
  isSupersonic,
  className = 'w-24 h-12',
}) => {
  // Determine airframe shape profile based on aircraft family
  const isJumbo747 = modelId.includes('747');
  const isSuperjumboA380 = modelId.includes('380');
  const isSST = isSupersonic || modelId.includes('CONCORDE') || modelId.includes('BOOM') || modelId.includes('MACH4');
  const isTrijet = modelId.includes('727') || modelId.includes('154') || modelId.includes('DC-10') || modelId.includes('MD-11');

  if (isSST) {
    // Sleek Supersonic Delta Wing Needle Profile with Painted White/Royal Livery
    return (
      <svg viewBox="0 0 160 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sstGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
        {/* Needle Nose & Long Slender Fuselage */}
        <path d="M156 24 L100 20 L35 21 L22 13 L16 22 L10 22 L5 24 L22 28 L100 27 Z" fill="url(#sstGrad)" stroke="#475569" strokeWidth="1" />
        {/* Royal Blue Cheatline */}
        <path d="M135 23 L28 23" stroke="#2563eb" strokeWidth="1.5" />
        <path d="M130 24.5 L32 24.5" stroke="#f59e0b" strokeWidth="0.8" />
        {/* Delta Wing */}
        <path d="M95 24 L45 38 L36 38 L45 25 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
        {/* Cockpit Window */}
        <polygon points="144,23 132,21 134,24 144,24" fill="#0f172a" />
        {/* Tail Fin with Blue Accent */}
        <polygon points="22,13 14,7 10,7 13,22" fill="#1e3a8a" />
        {/* Afterburner flame glow */}
        <ellipse cx="6" cy="24" rx="4" ry="2" fill="#f59e0b" opacity="0.8" />
      </svg>
    );
  }

  if (isJumbo747) {
    // Iconic Boeing 747 with distinctive Upper Deck "Hump" & 4 Pods
    return (
      <svg viewBox="0 0 160 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="jumboGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
        {/* 747 Fuselage with Upper Deck Hump */}
        <path d="M150 25 C145 19 122 15 95 17 C85 19 45 19 25 21 L15 8 L10 8 L15 25 L20 29 C50 29 110 29 140 28 Z" fill="url(#jumboGrad)" stroke="#475569" strokeWidth="1" />
        {/* Swept Main Wing & 4 Engines */}
        <path d="M90 28 L60 42 L52 42 L65 28 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
        <rect x="74" y="32" width="8" height="3.5" rx="1.5" fill="#f8fafc" stroke="#475569" strokeWidth="0.8" />
        <rect x="61" y="36" width="8" height="3.5" rx="1.5" fill="#f8fafc" stroke="#475569" strokeWidth="0.8" />
        {/* Cockpit & Upper Deck Windows */}
        <polygon points="140,20 134,18 135,21 140,21" fill="#0f172a" />
        <path d="M125 18 L100 18" stroke="#0f172a" strokeWidth="1.2" strokeDasharray="2 1.5" />
        {/* Lower Main Deck Window Stripe with Cheatline */}
        <path d="M138 24 L25 24" stroke="#2563eb" strokeWidth="1.5" />
        <path d="M135 24 L35 24" stroke="#0f172a" strokeWidth="1.2" strokeDasharray="2.5 1.5" />
        {/* Tailfin Livery */}
        <polygon points="15,8 10,8 13,24 20,24" fill="#1e3a8a" />
      </svg>
    );
  }

  if (isSuperjumboA380) {
    // Airbus A380 Full Double Decker Profile
    return (
      <svg viewBox="0 0 160 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="a380Grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
        {/* Massive Double-Decker Fuselage */}
        <path d="M148 24 C140 14 115 13 60 13 C40 13 30 17 20 19 L15 5 L10 5 L15 24 L25 31 C60 31 120 31 140 28 Z" fill="url(#a380Grad)" stroke="#475569" strokeWidth="1" />
        {/* Heavy Wing & Engines */}
        <path d="M92 29 L58 43 L48 43 L68 29 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
        <rect x="75" y="33" width="9" height="4" rx="1.5" fill="#f8fafc" stroke="#475569" strokeWidth="0.8" />
        <rect x="61" y="38" width="9" height="4" rx="1.5" fill="#f8fafc" stroke="#475569" strokeWidth="0.8" />
        {/* Double-Decker Windows (Upper & Lower) */}
        <path d="M125 17 L35 17" stroke="#0f172a" strokeWidth="1.2" strokeDasharray="2 1.5" />
        <path d="M135 24 L22 24" stroke="#2563eb" strokeWidth="1.5" />
        <path d="M132 24 L32 24" stroke="#0f172a" strokeWidth="1.2" strokeDasharray="2 1.5" />
        {/* Giant Tail Fin */}
        <polygon points="15,5 10,5 13,22 20,22" fill="#1e3a8a" />
      </svg>
    );
  }

  if (isTrijet) {
    // Trijet Profile (B727 / DC-10 / Tu-154) with Center Tail Engine
    return (
      <svg viewBox="0 0 160 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="trijetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
        {/* Fuselage */}
        <path d="M150 24 C144 19 120 18 55 18 L24 19 L16 6 L10 6 L14 24 L22 28 C60 28 120 28 140 27 Z" fill="url(#trijetGrad)" stroke="#475569" strokeWidth="1" />
        {/* T-Tail Cap or Center Tail Engine */}
        <rect x="12" y="11" width="10" height="4.5" rx="1.5" fill="#f8fafc" stroke="#475569" strokeWidth="0.8" />
        <ellipse cx="21" cy="13" rx="1" ry="2" fill="#0f172a" />
        {/* Swept Main Wing */}
        <path d="M88 26 L55 39 L47 39 L65 26 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
        {/* Window Stripe & Cheatline */}
        <path d="M135 23 L25 23" stroke="#2563eb" strokeWidth="1.5" />
        <path d="M132 23 L35 23" stroke="#0f172a" strokeWidth="1.2" strokeDasharray="2 1.5" />
        {/* Cockpit */}
        <polygon points="142,21 136,19 137,22 142,22" fill="#0f172a" />
        {/* Tail Fin */}
        <polygon points="16,6 10,6 12,22 18,22" fill="#1e3a8a" />
      </svg>
    );
  }

  // Modern Twin-Engine Widebody / Narrowbody (A350, B787, A320, B737)
  return (
    <svg viewBox="0 0 160 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="twinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      {/* Aerodynamic Streamlined Fuselage */}
      <path d="M152 24 C145 19 125 18 60 18 L25 19 L15 8 L10 8 L14 24 L22 28 C60 28 120 28 142 27 Z" fill="url(#twinGrad)" stroke="#475569" strokeWidth="1" />
      {/* Swept Wing with Sharklet / Raked Wingtip */}
      <path d="M90 26 L55 39 L47 39 L65 26 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
      {/* Modern High-Bypass Turbofan Engine */}
      <rect x="68" y="29" width="10" height="5.5" rx="2" fill="#f8fafc" stroke="#475569" strokeWidth="0.8" />
      <ellipse cx="77" cy="31.5" rx="1.2" ry="2.2" fill="#0f172a" />
      {/* Cockpit Window & Passenger Windows with Blue Cheatline */}
      <polygon points="144,21 138,19 139,22 144,22" fill="#0f172a" />
      <path d="M138 23.5 L25 23.5" stroke="#2563eb" strokeWidth="1.5" />
      <path d="M135 23.5 L32 23.5" stroke="#0f172a" strokeWidth="1.2" strokeDasharray="2.5 1.5" />
      {/* Tail Fin with Royal Blue Finish */}
      <polygon points="15,8 10,8 12,24 18,24" fill="#1e3a8a" />
    </svg>
  );
};
