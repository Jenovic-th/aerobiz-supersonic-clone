import React, { useState } from 'react';
import { BusinessVentureType } from '../types/game';
import { getVentureImage, getVentureThemeColor } from '../data/ventureVisuals';

interface VentureCardVisualProps {
  name: string;
  type: BusinessVentureType;
  icon: string;
  className?: string;
  showBadge?: boolean;
}

export const VentureCardVisual: React.FC<VentureCardVisualProps> = ({
  name,
  type,
  icon,
  className = '',
  showBadge = true,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imageUrl = getVentureImage(name, type);
  const theme = getVentureThemeColor(type);

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-950 border border-slate-700/80 shrink-0 group select-none ${className}`}
    >
      {/* Background Graphic / Fallback with vibrant gradient & icon */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} flex flex-col items-center justify-center p-2 text-center transition-transform duration-500`}
      >
        <span className="text-3xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
          {icon}
        </span>
        <span className="text-[10px] font-mono font-bold text-white/80 mt-1 uppercase tracking-wider">
          {type.replace(/_/g, ' ')}
        </span>
      </div>

      {/* High-Resolution Photographic Visual */}
      {!hasError && (
        <img
          src={imageUrl}
          alt={name}
          onLoad={() => setImageLoaded(true)}
          onError={() => setHasError(true)}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Cinematic Vignette for text overlay contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

      {/* Bottom Category Badge Tag */}
      {showBadge && (
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-slate-950/90 backdrop-blur-md text-[10px] font-mono font-bold text-slate-200 border border-slate-700/80 shadow flex items-center gap-1">
            <span>{icon}</span>
            <span className="truncate max-w-[100px]">{type.replace(/_/g, ' ')}</span>
          </span>
        </div>
      )}
    </div>
  );
};
