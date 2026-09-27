import { Negotiator, City } from '../types/game';

export const INITIAL_NEGOTIATORS: Negotiator[] = [
  {
    id: 'NEG_JOHN',
    name: 'John Miller',
    title: 'Senior Diplomatic Delegate',
    avatarId: 'john',
    role: 'FIELD',
    status: 'AVAILABLE',
  },
  {
    id: 'NEG_KENJI',
    name: 'Kenji Sato',
    title: 'Senior Commercial Delegate',
    avatarId: 'kenji',
    role: 'FIELD',
    status: 'AVAILABLE',
  },
  {
    id: 'NEG_SARAH',
    name: 'Sarah Jenkins',
    title: 'International Relations Specialist',
    avatarId: 'sarah',
    role: 'FIELD',
    status: 'AVAILABLE',
  },
  {
    id: 'NEG_ELENA',
    name: 'Elena Vance',
    title: 'Regional Expansion Envoy',
    avatarId: 'elena',
    role: 'FIELD',
    status: 'AVAILABLE',
  },
  {
    id: 'NEG_DAVID',
    name: 'David Sterling',
    title: 'HQ Operations Director',
    avatarId: 'david',
    role: 'HQ',
    status: 'AVAILABLE',
  },
];

export function createDefaultNegotiators(): Negotiator[] {
  return INITIAL_NEGOTIATORS.map((n) => ({ ...n }));
}

/**
 * Calculates realistic negotiation duration in Quarters based on geopolitics & country ties
 */
export function calculateNegotiationQuarters(homeCity: City, targetCity: City): number {
  // 1. Domestic city (Same country) -> Fast 1 Quarter (3 months)
  if (homeCity.country === targetCity.country) {
    return 1;
  }

  // 2. Strict / Socialist / Difficult regulatory clearance (Moscow, Beijing, Tehran)
  if (['MOW', 'BJS', 'THR'].includes(targetCity.id)) {
    return 3; // 9 months
  }

  // 3. Same Geopolitical Bloc (e.g. WEST with WEST) -> 1 Quarter
  if (homeCity.bloc === targetCity.bloc && homeCity.bloc !== 'NEUTRAL') {
    return 1;
  }

  // 4. Opposing Blocs (WEST vs EAST or vice versa) -> 3 Quarters
  if (
    (homeCity.bloc === 'WEST' && targetCity.bloc === 'EAST') ||
    (homeCity.bloc === 'EAST' && targetCity.bloc === 'WEST')
  ) {
    return 3;
  }

  // 5. Neutral or International cross-bloc -> 2 Quarters (6 months)
  return 2;
}

/**
 * Calculates slot negotiation fees and diplomatic delegation cost
 */
export function calculateNegotiationCostK(targetCity: City, requestedSlots: number = 10): number {
  const baseCost = Math.round(targetCity.population * 60 + targetCity.businessIndex * 15);
  const slotMultiplier = requestedSlots / 10;
  return Math.round(Math.max(800, baseCost * slotMultiplier));
}
