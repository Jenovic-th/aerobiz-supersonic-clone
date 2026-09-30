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

export interface SlotNegotiationLimitInfo {
  totalAirportCap: number;
  totalAllocated: number;
  remainingFreeSlots: number;
  isAirportFull: boolean;
  isCongested: boolean;
  isAntiMonopolyActive: boolean;
  antiMonopolyReason?: string;
  minSlots: number;
  maxRequestableSlots: number;
  presetOptions: number[];
  recommendedSlots: number;
}

/**
 * Calculates flexible slot negotiation boundaries and enforces the Anti-Monopoly Fair-Share rule.
 * - In abundant phases, airlines can request large chunks (15-35 slots) at once.
 * - When congested or newly expanded (+25 slots), slot requests are capped to a 4-way fair share (7-8 slots) to prevent monopolies.
 */
export function calculateSlotNegotiationLimits(
  city: City,
  totalAirportCap: number,
  totalAllocated: number,
  playerOwnedSlots: number,
  isHomeHQ: boolean,
  isHub: boolean,
  recentExpansionSlots: number = 0,
  numAirlines: number = 4
): SlotNegotiationLimitInfo {
  const remainingFreeSlots = Math.max(0, totalAirportCap - totalAllocated);
  const isAirportFull = remainingFreeSlots <= 0;
  const isCongested = !isAirportFull && (remainingFreeSlots <= 15 || totalAllocated / totalAirportCap >= 0.75);

  if (isAirportFull) {
    return {
      totalAirportCap,
      totalAllocated,
      remainingFreeSlots: 0,
      isAirportFull: true,
      isCongested: true,
      isAntiMonopolyActive: false,
      minSlots: 0,
      maxRequestableSlots: 0,
      presetOptions: [],
      recommendedSlots: 0,
    };
  }

  // Check if Anti-Monopoly / Fair-Share regulation triggers:
  // 1. Airport was recently expanded (+slots added to a congested airport)
  // 2. Remaining slots are scarce (R <= 35) or high utilization (>= 75%)
  // 3. Player already holds high proportion of total airport capacity
  const isScarce = remainingFreeSlots <= 35 || (totalAllocated / totalAirportCap) >= 0.75;
  const isRecentlyExpanded = recentExpansionSlots > 0;
  const isHighShare = isHomeHQ
    ? playerOwnedSlots / totalAirportCap >= 0.65
    : playerOwnedSlots / totalAirportCap >= 0.45;

  const isAntiMonopolyActive = isScarce || isRecentlyExpanded || isHighShare;

  let maxRequestableSlots: number;
  let antiMonopolyReason: string | undefined;

  if (isAntiMonopolyActive) {
    // Fair-share formula: Share remaining pool equally among the 4 competitor airlines
    // E.g. If 25 slots available: ceil(25 / 4) = 7 or 8 slots
    const fairShare = Math.max(4, Math.ceil(remainingFreeSlots / numAirlines));
    maxRequestableSlots = Math.min(remainingFreeSlots, fairShare);

    if (isRecentlyExpanded) {
      antiMonopolyReason = `สนามบินเพิ่งขยายสล็อต (+${recentExpansionSlots}) • กฎหมายป้องกันการผูกขาดแบ่งสรรสูงสุดไม่เกิน ${maxRequestableSlots} สล็อต/สายการบิน (หาร 4 บริษัท)`;
    } else if (isHighShare) {
      antiMonopolyReason = `สายการบินถือครองสล็อตใกล้เพดานโควตาสูงสุด • ถูกจำกัดไม่เกิน ${maxRequestableSlots} สล็อตเพื่อเปิดโอกาสให้คู่แข่ง`;
    } else {
      antiMonopolyReason = `สล็อตสนามบินเริ่มเหลือน้อย (${remainingFreeSlots} สล็อต) • กฎหมายแบ่งสรรโควตาอย่างเป็นธรรม จำกัดไม่เกิน ${maxRequestableSlots} สล็อต/ครั้ง`;
    }
  } else {
    // Abundant / Open Phase: Player can request generous amounts!
    // Corporate HQ: up to 35 slots
    // Regional Hub: up to 25 slots
    // Regular destination: up to 20 slots
    const baseCap = isHomeHQ ? 35 : isHub ? 25 : 20;
    maxRequestableSlots = Math.min(remainingFreeSlots, baseCap);
  }

  const minSlots = Math.min(4, maxRequestableSlots);

  // Generate sensible preset options up to maxRequestableSlots
  const candidatePresets = isAntiMonopolyActive
    ? [4, 6, 7, 8, 10, maxRequestableSlots]
    : [5, 10, 15, 20, 25, 30, maxRequestableSlots];

  const presetOptions = Array.from(
    new Set(
      candidatePresets
        .filter((p) => p >= minSlots && p <= maxRequestableSlots)
        .sort((a, b) => a - b)
    )
  );

  if (!presetOptions.includes(maxRequestableSlots) && maxRequestableSlots >= minSlots) {
    presetOptions.push(maxRequestableSlots);
  }

  const recommendedSlots = Math.min(
    maxRequestableSlots,
    isHomeHQ ? (isAntiMonopolyActive ? maxRequestableSlots : 25) : isAntiMonopolyActive ? maxRequestableSlots : 10
  );

  return {
    totalAirportCap,
    totalAllocated,
    remainingFreeSlots,
    isAirportFull: false,
    isCongested,
    isAntiMonopolyActive,
    antiMonopolyReason,
    minSlots,
    maxRequestableSlots,
    presetOptions,
    recommendedSlots,
  };
}
