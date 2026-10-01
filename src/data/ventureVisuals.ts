import { BusinessVentureType } from '../types/game';

export interface VentureTheme {
  gradient: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
}

// Named overrides for major world city landmarks and iconic ventures
const SPECIFIC_VENTURE_IMAGES: Record<string, string> = {
  // --- Tokyo (TYO) ---
  'Imperial Tokyo Grand Hotel':
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
  'Narita & Haneda Airport Limousine Bus':
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
  'Tokyo Bay Futuristic Theme Dome':
    'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=600&q=80',
  'Japan Travel Bureau (JTB)':
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
  'Mt. Fuji Vista Golf Country Club':
    'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=600&q=80',
  'Ginza Skyline Executive Tower':
    'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?auto=format&fit=crop&w=600&q=80',

  // --- New York (NYC) ---
  'Manhattan Grand Hotel':
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
  'Metro Airport Express':
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
  'Broadway Entertainment Center':
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  'Empire State Travel Bureau':
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
  'Aviation & Space Gallery':
    'https://images.unsplash.com/photo-1565034946487-077786996e27?auto=format&fit=crop&w=600&q=80',
  'Hudson Valley Country Club':
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=600&q=80',

  // --- London (LON) ---
  'The Ritz London Heritage Hotel':
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80',
  'Heathrow Express & Black Cab Fleet':
    'https://images.unsplash.com/photo-1520105072000-f44fc0832105?auto=format&fit=crop&w=600&q=80',
  'West End Royal Theatre District':
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80',
  'Thomas Cook Imperial Travel Agency':
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
  'St. Andrews Royal Golf Links':
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=600&q=80',

  // --- Paris (PAR) ---
  'Hôtel Ritz Paris (Place Vendôme)':
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
  'Charles de Gaulle Airport Shuttles':
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
  'Louvre Art & Antiquities Wing':
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80',

  // --- Bangkok (BKK) ---
  'Mandarin Oriental Chao Phraya':
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
  'Suvarnabhumi Airport Luxury Coaches':
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
  'Chao Phraya Princess Dinner Cruise Fleet':
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
  'Siam Royal Excursions Agency':
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
  'Alpine Golf & Sports Club':
    'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=600&q=80',
};

// Generic fallback high-quality photography by business category
const CATEGORY_DEFAULT_IMAGES: Record<BusinessVentureType, string> = {
  HOTEL:
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
  SHUTTLE_BUS:
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
  AMUSEMENT_PARK:
    'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=600&q=80',
  TRAVEL_AGENCY:
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
  GOLF_COURSE:
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=600&q=80',
  SKI_RESORT:
    'https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=600&q=80',
  MUSEUM:
    'https://images.unsplash.com/photo-1565034946487-077786996e27?auto=format&fit=crop&w=600&q=80',
  CONCERT_HALL:
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  ARTS_PAVILION:
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80',
  PLEASURE_BOAT:
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
  FERRY_BOAT:
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=600&q=80',
  COMMUTER_AIRLINE:
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80',
};

export function getVentureImage(name: string, type: BusinessVentureType): string {
  if (SPECIFIC_VENTURE_IMAGES[name]) {
    return SPECIFIC_VENTURE_IMAGES[name];
  }
  return CATEGORY_DEFAULT_IMAGES[type] || CATEGORY_DEFAULT_IMAGES.HOTEL;
}

export function getVentureThemeColor(type: BusinessVentureType): VentureTheme {
  switch (type) {
    case 'HOTEL':
      return {
        gradient: 'from-amber-950 via-slate-900 to-yellow-950',
        accent: 'text-amber-300',
        badgeBg: 'bg-amber-500/20 border-amber-500/50',
        badgeText: 'text-amber-300',
      };
    case 'SHUTTLE_BUS':
      return {
        gradient: 'from-sky-950 via-slate-900 to-blue-950',
        accent: 'text-sky-300',
        badgeBg: 'bg-sky-500/20 border-sky-500/50',
        badgeText: 'text-sky-300',
      };
    case 'AMUSEMENT_PARK':
      return {
        gradient: 'from-purple-950 via-slate-900 to-pink-950',
        accent: 'text-pink-300',
        badgeBg: 'bg-pink-500/20 border-pink-500/50',
        badgeText: 'text-pink-300',
      };
    case 'TRAVEL_AGENCY':
      return {
        gradient: 'from-emerald-950 via-slate-900 to-teal-950',
        accent: 'text-emerald-300',
        badgeBg: 'bg-emerald-500/20 border-emerald-500/50',
        badgeText: 'text-emerald-300',
      };
    case 'GOLF_COURSE':
      return {
        gradient: 'from-emerald-950 via-green-950 to-slate-900',
        accent: 'text-emerald-400',
        badgeBg: 'bg-emerald-600/20 border-emerald-500/50',
        badgeText: 'text-emerald-300',
      };
    case 'SKI_RESORT':
      return {
        gradient: 'from-cyan-950 via-slate-900 to-blue-950',
        accent: 'text-cyan-300',
        badgeBg: 'bg-cyan-500/20 border-cyan-500/50',
        badgeText: 'text-cyan-300',
      };
    case 'MUSEUM':
    case 'ARTS_PAVILION':
    case 'CONCERT_HALL':
      return {
        gradient: 'from-rose-950 via-slate-900 to-indigo-950',
        accent: 'text-rose-300',
        badgeBg: 'bg-rose-500/20 border-rose-500/50',
        badgeText: 'text-rose-300',
      };
    case 'PLEASURE_BOAT':
    case 'FERRY_BOAT':
      return {
        gradient: 'from-blue-950 via-cyan-950 to-slate-900',
        accent: 'text-cyan-300',
        badgeBg: 'bg-cyan-500/20 border-cyan-500/50',
        badgeText: 'text-cyan-300',
      };
    case 'COMMUTER_AIRLINE':
    default:
      return {
        gradient: 'from-indigo-950 via-slate-900 to-slate-950',
        accent: 'text-indigo-300',
        badgeBg: 'bg-indigo-500/20 border-indigo-500/50',
        badgeText: 'text-indigo-300',
      };
  }
}
