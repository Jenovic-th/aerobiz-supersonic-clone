import React, { useState } from 'react';
import { City } from '../types/game';
import { CityVisualData } from '../data/cityVisuals';
import { Sparkles, MapPin } from 'lucide-react';

interface CityLandmarkDioramaProps {
  city: City;
  visualData: CityVisualData;
  className?: string;
}

// Map each city to its breathtaking scenic photograph
function getCityScenicImage(cityId: string): string {
  // Tropical island & resort destinations
  if (['MLE', 'HKT', 'DPS', 'HNL', 'CUN', 'NAN', 'GUM', 'GPS'].includes(cityId)) {
    return './cities/tropical.jpg';
  }

  // Major global hubs with dedicated custom landmarks
  if (cityId === 'BKK') return './cities/bangkok.jpg';
  if (cityId === 'SYD') return './cities/sydney.jpg';
  if (cityId === 'TYO') return './cities/tokyo.jpg';
  if (cityId === 'PAR') return './cities/paris.jpg';
  if (cityId === 'NYC') return './cities/newyork.jpg';
  if (cityId === 'LON') return './cities/london.jpg';
  if (cityId === 'DXB') return './cities/dubai.jpg';

  // East / Southeast Asia hubs
  if (['SIN', 'HKG', 'SHA', 'BJS', 'MNL'].includes(cityId)) {
    return './cities/bangkok.jpg';
  }
  if (['SEL'].includes(cityId)) {
    return './cities/tokyo.jpg';
  }

  // Oceania cities
  if (['MEL', 'AKL'].includes(cityId)) {
    return './cities/sydney.jpg';
  }

  // European cities
  if (['ROM', 'MAD'].includes(cityId)) {
    return './cities/paris.jpg';
  }
  if (['FRA', 'ZRH', 'ATH', 'MOW', 'KEF'].includes(cityId)) {
    return './cities/london.jpg';
  }

  // Middle East & Africa & South Asia
  if (['BOM', 'DEL', 'THR', 'CAI', 'JNB', 'LOS', 'NBO', 'CPT'].includes(cityId)) {
    return './cities/dubai.jpg';
  }

  // Americas
  return './cities/newyork.jpg';
}

export const CityLandmarkDiorama: React.FC<CityLandmarkDioramaProps> = ({
  city,
  visualData,
  className = '',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageSrc = getCityScenicImage(city.id);

  return (
    <div
      className={`relative w-full h-full rounded-2xl overflow-hidden border-2 border-sky-500/70 shadow-2xl bg-slate-950 group select-none ${className}`}
    >
      {/* High-Resolution Scenic Wallpaper Image */}
      <img
        src={imageSrc}
        alt={visualData.landmarkName}
        onLoad={() => setImageLoaded(true)}
        className={`w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Cinematic Vignette & Bottom Shading Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-transparent to-transparent pointer-events-none" />

      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <span className="px-3 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-sky-400/80 text-xs font-bold text-sky-300 font-mono shadow-lg flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-sky-400" />
          <span>{city.country} • {city.region.replace(/_/g, ' ')}</span>
        </span>

        <span className="px-2.5 py-1 rounded-lg bg-blue-600/90 backdrop-blur-md text-xs font-black text-white font-mono shadow">
          {city.id}
        </span>
      </div>

      {/* Landmark Title Glassmorphic Banner (Retro Koei aesthetic) */}
      <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
        <div className="bg-slate-950/90 backdrop-blur-md border border-sky-500/50 px-4 py-2.5 rounded-xl shadow-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <h4 className="text-sm sm:text-base font-black text-amber-300 tracking-wide font-mono truncate">
              {visualData.landmarkName}
            </h4>
          </div>
          <div className="text-xs sm:text-sm text-slate-300 truncate mt-0.5">
            {visualData.landmarkSubtitle}
          </div>
        </div>
      </div>
    </div>
  );
};
