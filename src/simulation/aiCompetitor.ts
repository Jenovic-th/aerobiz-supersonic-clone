import { Airline, Route, GameState, AircraftModel, City, BusinessVenture, AircraftInstance, PendingAircraftOrder } from '../types/game';
import { CITIES } from '../data/cities';
import { AIRCRAFTS } from '../data/aircrafts';
import { createDefaultNegotiators, calculateNegotiationCostK, calculateNegotiationQuarters } from '../data/negotiators';
import { getCityVisual } from '../data/cityVisuals';
import { calculateDistance, calculateRouteDemand, calculateRouteInceptionCostK } from './engine';

export interface AIRivalProfile {
  id: string;
  name: string;
  color: string;
  ceoName: string;
  avatarId: string;
  personality: 'AGGRESSIVE' | 'BALANCED' | 'LUXURY' | 'REGIONAL' | 'BUDGET_DISCOUNTER' | 'GLOBAL_FLAGSHIP';
  personalityLabel: string;
  personalityDesc: string;
  defaultHQs: string[];
}

export const AI_RIVAL_ARCHETYPES: AIRivalProfile[] = [
  {
    id: 'AIRLINE_AI_1',
    name: 'Global Atlantic Airways',
    color: '#ef4444', // Executive Crimson Red
    ceoName: 'Sir Richard Sterling',
    avatarId: 'david',
    personality: 'AGGRESSIVE',
    personalityLabel: 'Aggressive Expansionist',
    personalityDesc: 'ขยายเส้นทางบินดุดัน แย่งชิงสล็อตเมืองใหญ่ ตัดราคาตั๋วเพื่อดึงส่วนแบ่งตลาด',
    defaultHQs: ['NYC', 'LAX', 'ORD'],
  },
  {
    id: 'AIRLINE_AI_2',
    name: 'EuroWings Continental',
    color: '#10b981', // Emerald Green
    ceoName: 'Helena Van Der Bilt',
    avatarId: 'elena',
    personality: 'LUXURY',
    personalityLabel: 'Prestige & Luxury Fleet',
    personalityDesc: 'เน้นเครื่องบินหรู อากาศยานความเร็วสูง Supersonic และการบริการระดับเฟิร์สคลาส',
    defaultHQs: ['LON', 'PAR', 'FRA'],
  },
  {
    id: 'AIRLINE_AI_3',
    name: 'Pacific Orient Aviation',
    color: '#f59e0b', // Royal Amber Gold
    ceoName: 'Kenzo Takahashi',
    avatarId: 'kenji',
    personality: 'REGIONAL',
    personalityLabel: 'Regional Hub Dominator',
    personalityDesc: 'สร้างฐานฮับภูมิภาคเหนียวแน่น เพิ่มความถี่เที่ยวบิน และเน้นเส้นทางในทวีปตนเองก่อน',
    defaultHQs: ['TYO', 'SYD', 'SIN'],
  },
  {
    id: 'AIRLINE_AI_4',
    name: 'Nordic Trans-Polar',
    color: '#3b82f6', // Cobalt Blue
    ceoName: 'Astrid Lindqvist',
    avatarId: 'sarah',
    personality: 'GLOBAL_FLAGSHIP',
    personalityLabel: 'Global Flagship Carrier',
    personalityDesc: 'เน้นเปิดเที่ยวบินข้ามทวีประยะไกล เชื่อมต่อมหานครเศรษฐกิจระดับโลก',
    defaultHQs: ['FRA', 'LON', 'NYC'],
  },
  {
    id: 'AIRLINE_AI_5',
    name: 'Southern Cross Express',
    color: '#f97316', // Deep Coral
    ceoName: 'Marcus Thornton',
    avatarId: 'john',
    personality: 'BUDGET_DISCOUNTER',
    personalityLabel: 'Low-Cost Volume Pioneer',
    personalityDesc: 'ลดราคาตั๋วเพื่อสร้างปริมาณผู้โดยสารมหาศาล ใช้เครื่องบินความจุสูง',
    defaultHQs: ['SYD', 'BOM', 'CAI'],
  },
  {
    id: 'AIRLINE_AI_6',
    name: 'Imperial Dynastic Air',
    color: '#a855f7', // Royal Violet
    ceoName: 'Lin Chen',
    avatarId: 'elena',
    personality: 'BALANCED',
    personalityLabel: 'Conservative Tycoon',
    personalityDesc: 'บริหารความเสี่ยงอย่างรอบคอบ รักษากระแสเงินสดสำรอง และเติบโตอย่างมั่นคง',
    defaultHQs: ['BJS', 'HKG', 'SIN'],
  },
];

// Fallback constant for backwards compatibility
export const AI_RIVAL_PROFILES = AI_RIVAL_ARCHETYPES.slice(0, 3);

/**
 * Generate randomized or dynamically shuffled AI rivals so colors, traits and personalities vary
 */
export function getDynamicAIRivals(rivalCount: number, seed: number = 0): AIRivalProfile[] {
  // Shuffle archetypes deterministically based on seed
  const shuffled = [...AI_RIVAL_ARCHETYPES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.abs(Math.sin(seed + i * 997)) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, rivalCount).map((arch, idx) => ({
    ...arch,
    id: `AIRLINE_AI_${idx + 1}`,
  }));
}

/**
 * Prime flagship cities for each global region
 */
const REGION_PRIME_CITIES: Record<string, string[]> = {
  NORTH_AMERICA: ['NYC', 'LAX', 'ORD', 'MIA'],
  EUROPE: ['LON', 'PAR', 'FRA', 'ROM'],
  EAST_SOUTHEAST_ASIA: ['TYO', 'BKK', 'SIN', 'HKG'],
  MIDDLE_EAST_SOUTH_ASIA: ['DXB', 'DEL', 'CAI', 'BOM'],
  OCEANIA: ['SYD', 'MEL', 'AKL'],
  SOUTH_AMERICA: ['GRU', 'BOG', 'EZE'],
  AFRICA: ['CAI', 'JNB', 'LOS', 'NBO'],
};

/**
 * Assign distinct continent headquarters for AI rivals so they don't immediately cannibalize each other
 */
export function assignDistributedHQs(playerHomeCityId: string, rivalCount: number): string[] {
  const cityMap = new Map(CITIES.map((c) => [c.id, c]));
  const playerCity = cityMap.get(playerHomeCityId);
  const playerRegion = playerCity ? playerCity.region : 'EAST_SOUTHEAST_ASIA';

  // Priority pool of regions other than the player's region
  const allRegions = [
    'NORTH_AMERICA',
    'EUROPE',
    'EAST_SOUTHEAST_ASIA',
    'MIDDLE_EAST_SOUTH_ASIA',
    'OCEANIA',
    'SOUTH_AMERICA',
    'AFRICA',
  ].filter((r) => r !== playerRegion);

  const assignedCityIds: string[] = [];

  for (let i = 0; i < rivalCount; i++) {
    const targetRegion = allRegions[i % allRegions.length];
    const primeCities = REGION_PRIME_CITIES[targetRegion] || ['NYC'];
    const chosenCity =
      primeCities.find((cId) => cId !== playerHomeCityId && !assignedCityIds.includes(cId)) ||
      primeCities[0];
    assignedCityIds.push(chosenCity);
  }

  return assignedCityIds;
}

/**
 * Create a fully initialized AI Airline with starter aircraft and 2 initial routes
 */
export function createAIAirline(
  profile: AIRivalProfile,
  homeCityId: string,
  starterModelId: string,
  initialCash: number,
  selectedEra: 1 | 2 | 3
): { airline: Airline; initialRoutes: Route[] } {
  const cityMap = new Map(CITIES.map((c) => [c.id, c]));
  const homeCity = cityMap.get(homeCityId) || CITIES[0];

  const otherCities = CITIES.filter((c) => c.id !== homeCityId);
  const sortedByDistance = [...otherCities].sort((a, b) => {
    const distA = calculateDistance(homeCity.lat, homeCity.lon, a.lat, a.lon);
    const distB = calculateDistance(homeCity.lat, homeCity.lon, b.lat, b.lon);
    return distA - distB;
  });

  const regionalPartner = sortedByDistance.find((c) => c.region === homeCity.region) || sortedByDistance[0];
  const globalMegahubs = ['NYC', 'LON', 'TYO', 'PAR', 'DXB', 'SIN', 'FRA', 'LAX'];
  const interconPartner =
    sortedByDistance.find((c) => globalMegahubs.includes(c.id) && c.id !== regionalPartner.id) ||
    sortedByDistance[1];

  const p1Id = `${profile.id}_P1`;
  const p2Id = `${profile.id}_P2`;
  const p3Id = `${profile.id}_P3`;

  const route1Id = `ROUTE_${profile.id}_1`;
  const route2Id = `ROUTE_${profile.id}_2`;

  const fleet: AircraftInstance[] = [
    {
      instanceId: p1Id,
      modelId: starterModelId,
      ageYears: 1,
      assignedRouteId: route1Id,
    },
    {
      instanceId: p2Id,
      modelId: starterModelId,
      ageYears: 1,
      assignedRouteId: route2Id,
    },
    {
      instanceId: p3Id,
      modelId: starterModelId,
      ageYears: 0,
      assignedRouteId: null, // Ready for autonomous expansion in turn 1
    },
  ];

  const starterAircraft = AIRCRAFTS.find((a) => a.id === starterModelId) || AIRCRAFTS[0];

  const route1: Route = {
    id: route1Id,
    airlineId: profile.id,
    originCityId: homeCityId,
    destCityId: regionalPartner.id,
    assignedAircraftIds: [p1Id],
    weeklyFrequency: 7,
    priceModifierPct:
      profile.personality === 'AGGRESSIVE' || profile.personality === 'BUDGET_DISCOUNTER'
        ? -10
        : profile.personality === 'LUXURY'
        ? 10
        : 0,
    serviceQuality:
      profile.personality === 'LUXURY'
        ? 1.25
        : profile.personality === 'BUDGET_DISCOUNTER'
        ? 0.8
        : 1.0,
    status: 'ACTIVE',
    consecutiveLossQuarters: 0,
    lastQuarterStats: {
      passengers: Math.round(starterAircraft.capacity * 7 * 12 * 0.82),
      capacity: starterAircraft.capacity * 7 * 12,
      loadFactorPct: 82,
      revenueK: Math.round(starterAircraft.capacity * 7 * 12 * 0.82 * 0.12),
      expensesK: Math.round(starterAircraft.capacity * 7 * 12 * 0.82 * 0.07),
      profitK: Math.round(starterAircraft.capacity * 7 * 12 * 0.82 * 0.05),
    },
  };

  const route2: Route = {
    id: route2Id,
    airlineId: profile.id,
    originCityId: homeCityId,
    destCityId: interconPartner.id,
    assignedAircraftIds: [p2Id],
    weeklyFrequency: 7,
    priceModifierPct:
      profile.personality === 'AGGRESSIVE'
        ? -5
        : profile.personality === 'LUXURY'
        ? 15
        : 0,
    serviceQuality:
      profile.personality === 'LUXURY'
        ? 1.25
        : profile.personality === 'BUDGET_DISCOUNTER'
        ? 0.8
        : 1.0,
    status: 'ACTIVE',
    consecutiveLossQuarters: 0,
    lastQuarterStats: {
      passengers: Math.round(starterAircraft.capacity * 7 * 12 * 0.88),
      capacity: starterAircraft.capacity * 7 * 12,
      loadFactorPct: 88,
      revenueK: Math.round(starterAircraft.capacity * 7 * 12 * 0.88 * 0.15),
      expensesK: Math.round(starterAircraft.capacity * 7 * 12 * 0.88 * 0.08),
      profitK: Math.round(starterAircraft.capacity * 7 * 12 * 0.88 * 0.07),
    },
  };

  const slots: Record<string, number> = {
    [homeCityId]: 25,
    [regionalPartner.id]: 14,
    [interconPartner.id]: 14,
  };

  const airline: Airline = {
    id: profile.id,
    name: profile.name,
    color: profile.color,
    isHuman: false,
    homeCityId: homeCityId,
    hubCityIds: [homeCityId],
    cashK: initialCash,
    slots,
    fleet,
    businesses: [],
    negotiators: createDefaultNegotiators(),
    ceoName: profile.ceoName,
    personality: profile.personality,
    avatarId: profile.avatarId,
    aiActionLog: [`Established corporate headquarters in ${homeCity.name} with starter fleet of 3 aircraft`],
  };

  return { airline, initialRoutes: [route1, route2] };
}

export interface AISimulationResult {
  updatedAirline: Airline;
  newRoutes: Route[];
  updatedExistingRoutes: Route[];
  closedRoutes: {
    airlineId: string;
    airlineName: string;
    airlineColor: string;
    originCityId: string;
    destCityId: string;
    lossK: number;
  }[];
  aiActions: string[];
}

/**
 * Autonomous AI Tycoon Turn Simulation
 * Executes slot diplomacy, aircraft purchases, route expansions, business investments, and loss cutting.
 */
export function simulateAITurn(
  airline: Airline,
  gameState: GameState
): AISimulationResult {
  let currentCash = airline.cashK;
  const currentSlots = { ...airline.slots };
  const currentFleet: AircraftInstance[] = airline.fleet.map((f) => ({ ...f }));
  const currentPendingOrders: PendingAircraftOrder[] = [...(airline.pendingOrders || [])];
  const currentBusinesses = [...airline.businesses];
  const currentHubs = [...airline.hubCityIds];
  let negotiators = [...(airline.negotiators || createDefaultNegotiators())];
  const newRoutes: Route[] = [];
  const existingRoutes = gameState.routes.filter((r) => r.airlineId === airline.id);
  const updatedExistingRoutes: Route[] = [...existingRoutes];
  const aiActions: string[] = [];
  const closedRoutes: AISimulationResult['closedRoutes'] = [];

  const cityMap = new Map(CITIES.map((c) => [c.id, c]));
  const aircraftMap = new Map(AIRCRAFTS.map((a) => [a.id, a]));
  const homeCity = cityMap.get(airline.homeCityId) || CITIES[0];

  const safetyReserveK = 15000; // Minimum cash buffer to prevent bankruptcy

  // ========================================================
  // 1. ROUTE HEALTH MANAGEMENT & DYNAMIC STRATEGIC ADAPTATION
  // ========================================================
  const survivingRoutes: Route[] = [];

  for (let i = 0; i < updatedExistingRoutes.length; i++) {
    const route: Route = { ...updatedExistingRoutes[i] };
    const origCity = cityMap.get(route.originCityId);
    const destCity = cityMap.get(route.destCityId);
    if (!origCity || !destCity) {
      survivingRoutes.push(route);
      continue;
    }
    const origName = origCity.name;
    const destName = destCity.name;
    const routeDistance = calculateDistance(origCity.lat, origCity.lon, destCity.lat, destCity.lon);
    const personality = airline.personality || 'BALANCED';
    const isRegionalRoute = origCity.region === homeCity.region && destCity.region === homeCity.region;

    const currentPlane = currentFleet.find((f) => route.assignedAircraftIds.includes(f.instanceId));
    const currentModel = currentPlane ? aircraftMap.get(currentPlane.modelId) : null;

    if (route.lastQuarterStats) {
      const stats = route.lastQuarterStats;
      const profitK = stats.profitK;
      const lf = stats.loadFactorPct;

      if (profitK < 0) {
        // Track consecutive loss quarters
        route.consecutiveLossQuarters = (route.consecutiveLossQuarters || 0) + 1;

        // CUT LOSSES: If route is bleeding cash for 2+ quarters, or lost > $1,500K with low load factor
        if (
          (route.consecutiveLossQuarters >= 2 && profitK < -350) ||
          profitK < -1500
        ) {
          // Terminate route and release aircraft back to hangar
          for (const planeId of route.assignedAircraftIds) {
            const plane = currentFleet.find((f) => f.instanceId === planeId);
            if (plane) {
              plane.assignedRouteId = null;
            }
          }

          closedRoutes.push({
            airlineId: airline.id,
            airlineName: airline.name,
            airlineColor: airline.color,
            originCityId: route.originCityId,
            destCityId: route.destCityId,
            lossK: Math.abs(profitK),
          });

          aiActions.push(
            `⚠️ Terminated loss-making route ${origName} ➔ ${destName} to stop bleeding cash (-$${Math.abs(
              profitK
            ).toLocaleString()}K)`
          );
          // Omit from surviving routes -> closed!
          continue;
        }
      } else {
        // Profitable route: reset loss counter
        route.consecutiveLossQuarters = 0;
      }

      // ----------------------------------------------------
      // A. AIRCRAFT SWAPPING & FLEET RIGHTSIZING
      // ----------------------------------------------------
      // Check idle aircraft in the fleet that have certified range >= routeDistance
      const idleAircraftPool = currentFleet.filter((f) => f.assignedRouteId === null);
      const capableIdlePlanes = idleAircraftPool.filter((f) => {
        const m = aircraftMap.get(f.modelId);
        return m && m.rangeKm >= routeDistance;
      });

      if (capableIdlePlanes.length > 0 && currentModel && currentPlane) {
        // High load factor (>88%): look for a larger capacity aircraft to capture overflow
        if (lf >= 88) {
          const largerPlanes = capableIdlePlanes.filter((f) => {
            const m = aircraftMap.get(f.modelId);
            return m && m.capacity > currentModel.capacity * 1.15;
          });

          if (largerPlanes.length > 0) {
            largerPlanes.sort((a, b) => {
              const mA = aircraftMap.get(a.modelId)!;
              const mB = aircraftMap.get(b.modelId)!;
              if (personality === 'LUXURY') {
                return (mB.comfortRating + (mB.isSupersonic ? 50 : 0)) - (mA.comfortRating + (mA.isSupersonic ? 50 : 0));
              }
              return mB.capacity - mA.capacity;
            });

            const bestSwap = largerPlanes[0];
            const bestModel = aircraftMap.get(bestSwap.modelId)!;

            // Release current plane and assign new plane
            currentPlane.assignedRouteId = null;
            bestSwap.assignedRouteId = route.id;
            route.assignedAircraftIds = [bestSwap.instanceId];

            aiActions.push(
              `🔄 Upgraded aircraft on ${origName} ➔ ${destName} from ${currentModel.model} to ${bestModel.model} (${bestModel.capacity} seats) due to heavy passenger demand (LF ${lf}%)`
            );
          }
        } else if (lf < 50 && profitK < 200 && currentModel.capacity > 150) {
          // Low load factor (<50%): downsize to a smaller, more economical aircraft to cut fuel/maint
          const smallerPlanes = capableIdlePlanes.filter((f) => {
            const m = aircraftMap.get(f.modelId);
            return (
              m &&
              m.capacity < currentModel.capacity * 0.8 &&
              m.capacity >= Math.round((stats.passengers / (route.weeklyFrequency * 12)) * 1.1)
            );
          });

          if (smallerPlanes.length > 0) {
            smallerPlanes.sort((a, b) => {
              const mA = aircraftMap.get(a.modelId)!;
              const mB = aircraftMap.get(b.modelId)!;
              return mA.fuelBurnPerKm - mB.fuelBurnPerKm; // Pick most fuel-efficient
            });

            const bestSwap = smallerPlanes[0];
            const bestModel = aircraftMap.get(bestSwap.modelId)!;

            currentPlane.assignedRouteId = null;
            bestSwap.assignedRouteId = route.id;
            route.assignedAircraftIds = [bestSwap.instanceId];

            aiActions.push(
              `🔄 Downsized aircraft on ${origName} ➔ ${destName} to ${bestModel.model} (${bestModel.capacity} seats) to trim fuel and operating expenses (LF ${lf}%)`
            );
          }
        }
      }

      // ----------------------------------------------------
      // B. MAINTENANCE & SERVICE QUALITY MANAGEMENT
      // ----------------------------------------------------
      let targetServiceQuality = route.serviceQuality ?? 1.0;

      if (profitK < 0 || currentCash < safetyReserveK + 10000 || personality === 'BUDGET_DISCOUNTER') {
        // Cut maintenance overhead by 20% to stem losses or maintain low-cost model
        targetServiceQuality = 0.8;
      } else if (
        (personality === 'LUXURY' && profitK > 200) ||
        (personality === 'GLOBAL_FLAGSHIP' && profitK > 600) ||
        (personality === 'BALANCED' && profitK > 1200 && currentCash >= safetyReserveK + 25000)
      ) {
        // Upgrade to Rigorous Maintenance (1.25x) to boost prestige and protect airframe
        targetServiceQuality = 1.25;
      } else if (profitK >= 0 && targetServiceQuality === 0.8) {
        // Restore standard maintenance once profitable
        targetServiceQuality = 1.0;
      }

      if (targetServiceQuality !== route.serviceQuality) {
        const qualityName =
          targetServiceQuality === 0.8
            ? 'Budget (0.8x, cuts maintenance costs 20%)'
            : targetServiceQuality === 1.25
            ? 'Rigorous Premium (1.25x, preserves airframe & boosts brand appeal)'
            : 'Standard (1.0x)';
        const motive =
          targetServiceQuality === 0.8
            ? 'to stop financial bleed'
            : targetServiceQuality === 1.25
            ? 'to enhance premium traveler utility'
            : 'as normal profitability returned';
        aiActions.push(`⚙️ Adjusted maintenance on ${origName} ➔ ${destName} to ${qualityName} ${motive}`);
        route.serviceQuality = targetServiceQuality;
      }

      // ----------------------------------------------------
      // C. DYNAMIC YIELD MANAGEMENT & TICKET PRICING
      // ----------------------------------------------------
      let priceChange = 0;
      const currentPrice = route.priceModifierPct;

      if (lf >= 88) {
        // High load factor: raise fares to harvest high margin
        let maxAllowed = 15;
        if (personality === 'LUXURY') maxAllowed = 25;
        else if (personality === 'GLOBAL_FLAGSHIP') maxAllowed = 20;
        else if (personality === 'AGGRESSIVE') maxAllowed = 5;
        else if (personality === 'BUDGET_DISCOUNTER') maxAllowed = 0;

        if (currentPrice < maxAllowed) {
          priceChange = +5;
        }
      } else if (lf < 65 || profitK < 0) {
        // Soft load factor or deficit: discount fares to stimulate demand
        let minAllowed = -15;
        if (personality === 'BUDGET_DISCOUNTER') minAllowed = -25;
        else if (personality === 'AGGRESSIVE') minAllowed = -20;
        else if (personality === 'LUXURY') minAllowed = 0;

        if (currentPrice > minAllowed) {
          priceChange = -5;
        }
      }

      if (priceChange !== 0) {
        route.priceModifierPct = Math.max(-50, Math.min(50, route.priceModifierPct + priceChange));
        const sign = route.priceModifierPct > 0 ? '+' : '';
        const actionVerb = priceChange > 0 ? '📈 Raised airfares' : '📉 Discounted airfares';
        const reasonStr =
          priceChange > 0
            ? `surging passenger demand (LF ${lf}%)`
            : `stimulate passenger volume and fill seats (LF ${lf}%)`;
        aiActions.push(
          `${actionVerb} on ${origName} ➔ ${destName} to ${sign}${route.priceModifierPct}% due to ${reasonStr}`
        );
      }

      // ----------------------------------------------------
      // D. WEEKLY FREQUENCY & AIRPORT SLOT SCALING
      // ----------------------------------------------------
      const origSlots = currentSlots[route.originCityId] || 0;
      const destSlots = currentSlots[route.destCityId] || 0;
      const maxSlotsAllowed = Math.min(14, origSlots, destSlots);
      let freqChange = 0;

      if (lf >= 85 && route.weeklyFrequency < maxSlotsAllowed) {
        // High demand and slots available: increase weekly departures
        if (personality === 'AGGRESSIVE' || (personality === 'REGIONAL' && isRegionalRoute)) {
          freqChange = Math.min(2, maxSlotsAllowed - route.weeklyFrequency);
        } else {
          freqChange = 1;
        }
      } else if (
        (lf < 50 || (profitK < 0 && lf < 60)) &&
        route.weeklyFrequency > 2
      ) {
        // Low demand or losses: reduce frequency to save fuel and airport fees
        freqChange = -1;
      }

      if (route.weeklyFrequency > maxSlotsAllowed) {
        // Cap to slots if slots were reduced
        route.weeklyFrequency = Math.max(1, maxSlotsAllowed);
      } else if (freqChange !== 0) {
        route.weeklyFrequency = Math.max(1, Math.min(maxSlotsAllowed, route.weeklyFrequency + freqChange));
        const dir = freqChange > 0 ? '🛫 Expanded flight frequency' : '🛬 Reduced frequency';
        const rationale =
          freqChange > 0
            ? `capture excess passenger volume (LF ${lf}%)`
            : `curb empty flight rotations (LF ${lf}%)`;
        aiActions.push(`${dir} on ${origName} ➔ ${destName} to ${route.weeklyFrequency} flt/wk to ${rationale}`);
      }
    }

    survivingRoutes.push(route);
  }

  // ========================================================
  // 2. INTELLIGENT DIPLOMATIC SLOT ACQUISITION
  // ========================================================
  const freeFieldEnvoys = negotiators.filter((n) => n.role === 'FIELD' && n.status === 'AVAILABLE');
  const activeSlotMissions = negotiators.filter(
    (n) => n.status === 'DISPATCHED' && n.currentMission?.type === 'SLOT_NEGOTIATION'
  );

  // Check 1: Financial health & single-treaty discipline (AI focuses on at most 1 slot treaty at a time)
  if (freeFieldEnvoys.length > 0 && activeSlotMissions.length === 0 && currentCash >= safetyReserveK + 3000) {
    // Check 2: Strict Anti-Hoarding Rule
    // Do not request new foreign slots if AI already holds >= 4 slots in any city where it has ZERO active routes!
    const activeRouteCityIds = new Set(
      survivingRoutes.flatMap((r) => [r.originCityId, r.destCityId])
    );
    const unservedSlotCities = Object.keys(currentSlots).filter((cityId) => {
      return (
        (currentSlots[cityId] || 0) >= 4 &&
        !activeRouteCityIds.has(cityId) &&
        cityId !== airline.homeCityId &&
        !currentHubs.includes(cityId)
      );
    });

    // If AI already has unserved landing slots, it MUST NOT hoard more slots elsewhere.
    // Instead, it must dedicate resources to operating flights on its existing slots first!
    if (unservedSlotCities.length === 0) {
      const operationalBases = [airline.homeCityId, ...currentHubs];

      // Determine which bases have spare slot capacity to anchor a new service
      const basesWithCapacity = operationalBases.filter((baseId) => {
        const slotsAtBase = currentSlots[baseId] || 0;
        const usedAtBase = survivingRoutes
          .filter((r) => r.originCityId === baseId || r.destCityId === baseId)
          .reduce((sum, r) => sum + r.weeklyFrequency, 0);
        return slotsAtBase - usedAtBase >= 4; // Needs at least 4 free weekly departures
      });

      // If home base is choked, dispatch envoy to expand home hub capacity first!
      if (basesWithCapacity.length === 0) {
        const homeSlots = currentSlots[airline.homeCityId] || 0;
        const totalHomeAirportSlots = gameState.airportSlots?.[airline.homeCityId] ?? homeCity.baseSlots;
        const totalAllocatedHome = (gameState.airlines || []).reduce(
          (sum, a) => sum + (a.slots[airline.homeCityId] || 0),
          0
        );
        const freeAtHomeAirport = Math.max(0, totalHomeAirportSlots - totalAllocatedHome);

        if (freeAtHomeAirport >= 4 && homeSlots < 60) {
          const envoyToDispatch = freeFieldEnvoys[0];
          const reqSlots = Math.min(10, freeAtHomeAirport);
          const costK = calculateNegotiationCostK(homeCity, reqSlots);
          const quarters = calculateNegotiationQuarters(homeCity, homeCity);

          if (currentCash - costK >= safetyReserveK) {
            currentCash -= costK;
            negotiators = negotiators.map((neg) => {
              if (neg.id === envoyToDispatch.id) {
                return {
                  ...neg,
                  status: 'DISPATCHED' as const,
                  currentMission: {
                    type: 'SLOT_NEGOTIATION' as const,
                    targetCityId: homeCity.id,
                    targetCityName: homeCity.name,
                    requestedSlots: reqSlots,
                    costK,
                    quartersRemaining: quarters,
                    totalQuarters: quarters,
                  },
                };
              }
              return neg;
            });
            aiActions.push(
              `🏛️ Dispatched diplomatic envoy to expand home hub capacity at ${homeCity.name} (+${reqSlots} slots)`
            );
          }
        }
      } else {
        // AI has available slots at base: search for target expansion cities
        const primaryBaseId = basesWithCapacity[0];
        const primaryBaseCity = cityMap.get(primaryBaseId) || homeCity;
        const homeRegion = homeCity.region;

        const homeRegionRoutes = survivingRoutes.filter((r) => {
          const orig = cityMap.get(r.originCityId);
          const dest = cityMap.get(r.destCityId);
          return orig?.region === homeRegion && dest?.region === homeRegion;
        });

        // Aircraft range reach check:
        // What is the longest range of planes in AI fleet, or affordable in current era?
        const longestFleetRange = Math.max(
          0,
          ...currentFleet.map((f) => aircraftMap.get(f.modelId)?.rangeKm || 0)
        );

        const activeEraModels = AIRCRAFTS.filter(
          (a) => a.introYear <= gameState.currentYear && (!a.retireYear || a.retireYear >= gameState.currentYear)
        );
        const maxAffordableMarketRange = Math.max(
          0,
          ...activeEraModels
            .filter((a) => currentCash - a.priceK >= safetyReserveK)
            .map((a) => a.rangeKm)
        );

        const maxOperationalReachKm = Math.max(longestFleetRange, maxAffordableMarketRange);
        const personality = airline.personality || 'BALANCED';

        const negotiatingCityIds = new Set(
          negotiators
            .filter((n) => n.status === 'DISPATCHED' && n.currentMission)
            .map((n) => n.currentMission!.targetCityId)
        );

        const candidateCities = CITIES.filter((c) => {
          if (c.id === airline.homeCityId || currentHubs.includes(c.id)) return false;
          if (negotiatingCityIds.has(c.id)) return false;

          const slotsOwned = currentSlots[c.id] || 0;
          if (slotsOwned >= 10) return false; // Already has 10+ slots, plenty for high frequency

          // Check destination airport capacity
          const totalAirportSlots = gameState.airportSlots?.[c.id] ?? c.baseSlots;
          const totalAllocated = (gameState.airlines || []).reduce(
            (sum, a) => sum + (a.slots[c.id] || 0),
            0
          );
          const remainingSlots = Math.max(0, totalAirportSlots - totalAllocated);
          if (remainingSlots < 4) return false; // Destination airport is congested or full!

          // Distance from primary base
          const distFromBase = calculateDistance(primaryBaseCity.lat, primaryBaseCity.lon, c.lat, c.lon);

          // Physical range feasibility: AI must physically be able to reach the city!
          if (distFromBase > maxOperationalReachKm || distFromBase < 400) return false;

          const isSameRegion = c.region === primaryBaseCity.region;

          // AI Personality & Intercontinental Readiness
          if (!isSameRegion) {
            // Intercontinental expansion logic:
            // - GLOBAL_FLAGSHIP: Eager to link global megahubs as soon as aircraft range and capital allow!
            // - AGGRESSIVE: Ready to contest high-yield foreign corridors if cash >= $25M.
            // - LUXURY: Targets high-yield business/wealth capitals (business index >= 70).
            // - REGIONAL: Stays strictly within its home region until it has >= 3 regional routes and cash >= $40M.
            // - BALANCED / BUDGET: Needs at least 2 home routes and cash >= $30M.

            if (personality === 'REGIONAL') {
              if (homeRegionRoutes.length < 3 || currentCash < 40000) return false;
            } else if (personality === 'BALANCED' || personality === 'BUDGET_DISCOUNTER') {
              if (homeRegionRoutes.length < 2 || currentCash < 30000) return false;
            } else if (personality === 'AGGRESSIVE') {
              if (currentCash < 25000) return false;
            } else if (personality === 'LUXURY') {
              if (c.businessIndex < 70 && c.tourismIndex < 70) return false;
            }

            // Target must be a major gateway or prominent hub
            const primeCities = REGION_PRIME_CITIES[c.region] || [];
            const isGateway = primeCities.includes(c.id) || c.baseSlots >= 90 || c.population >= 6;
            if (!isGateway) return false;
          }

          return true;
        });

        if (candidateCities.length > 0) {
          candidateCities.sort((a, b) => {
            let scoreA = a.population * 2.5 + a.businessIndex * 2 + a.tourismIndex;
            let scoreB = b.population * 2.5 + b.businessIndex * 2 + b.tourismIndex;

            const isSameRegionA = a.region === primaryBaseCity.region;
            const isSameRegionB = b.region === primaryBaseCity.region;

            if (personality === 'REGIONAL') {
              if (isSameRegionA) scoreA += 200;
              if (isSameRegionB) scoreB += 200;
            } else if (personality === 'GLOBAL_FLAGSHIP') {
              if (!isSameRegionA) scoreA += 150;
              if (!isSameRegionB) scoreB += 150;
              const megahubs = ['NYC', 'LON', 'TYO', 'PAR', 'DXB', 'SIN', 'FRA', 'LAX'];
              if (megahubs.includes(a.id)) scoreA += 200;
              if (megahubs.includes(b.id)) scoreB += 200;
            } else if (personality === 'LUXURY') {
              scoreA += a.businessIndex * 1.5;
              scoreB += b.businessIndex * 1.5;
            } else {
              if (isSameRegionA) scoreA += 60;
              if (isSameRegionB) scoreB += 60;
            }

            const demandA = calculateRouteDemand(
              primaryBaseCity,
              a,
              gameState.currentYear,
              gameState.currentQuarter,
              gameState.activeEvents || []
            );
            const demandB = calculateRouteDemand(
              primaryBaseCity,
              b,
              gameState.currentYear,
              gameState.currentQuarter,
              gameState.activeEvents || []
            );
            scoreA += demandA * 0.01;
            scoreB += demandB * 0.01;

            return scoreB - scoreA;
          });

          const targetCity = candidateCities[0];
          const envoyToDispatch = freeFieldEnvoys[0];

          // Determine modest, operational request size: 7 to 10 slots
          const totalAirportSlots = gameState.airportSlots?.[targetCity.id] ?? targetCity.baseSlots;
          const totalAllocated = (gameState.airlines || []).reduce(
            (sum, a) => sum + (a.slots[targetCity.id] || 0),
            0
          );
          const remainingSlots = Math.max(0, totalAirportSlots - totalAllocated);
          const requestedSlots = Math.min(
            remainingSlots,
            personality === 'AGGRESSIVE' ? 10 : 7
          );

          const costK = calculateNegotiationCostK(targetCity, requestedSlots);
          const quarters = calculateNegotiationQuarters(homeCity, targetCity);

          if (requestedSlots >= 4 && currentCash - costK >= safetyReserveK) {
            currentCash -= costK;

            negotiators = negotiators.map((neg) => {
              if (neg.id === envoyToDispatch.id) {
                return {
                  ...neg,
                  status: 'DISPATCHED' as const,
                  currentMission: {
                    type: 'SLOT_NEGOTIATION' as const,
                    targetCityId: targetCity.id,
                    targetCityName: targetCity.name,
                    requestedSlots,
                    costK,
                    quartersRemaining: quarters,
                    totalQuarters: quarters,
                  },
                };
              }
              return neg;
            });

            const isIntercontinental = targetCity.region !== primaryBaseCity.region;
            const dist = calculateDistance(primaryBaseCity.lat, primaryBaseCity.lon, targetCity.lat, targetCity.lon);
            const phaseLabel = isIntercontinental
              ? `Intercontinental corridor (${primaryBaseCity.name} ➔ ${targetCity.name}, ${dist.toLocaleString()} km)`
              : `Regional hub expansion in ${targetCity.name}`;

            aiActions.push(
              `🏛️ Dispatched diplomatic envoy to ${targetCity.name} requesting ${requestedSlots} airport slots [${phaseLabel}]`
            );
          }
        }
      }
    }
  }

  // Autonomous Regional Hub Establishment
  if (currentCash >= safetyReserveK + 25000 && currentHubs.length < 5) {
    const hubCandidates = Object.keys(currentSlots).filter((cid) => {
      if (cid === airline.homeCityId || currentHubs.includes(cid)) return false;
      const slots = currentSlots[cid] || 0;
      if (slots < 10) return false;
      // Must have active connected route from existing network
      const hasRoute = survivingRoutes.some(
        (r) => r.originCityId === cid || r.destCityId === cid
      );
      return hasRoute;
    });

    if (hubCandidates.length > 0) {
      hubCandidates.sort((a, b) => {
        const cA = cityMap.get(a);
        const cB = cityMap.get(b);
        return (cB?.businessIndex || 0) - (cA?.businessIndex || 0);
      });
      const chosenHubId = hubCandidates[0];
      const hubCity = cityMap.get(chosenHubId);
      currentCash -= 15000;
      currentHubs.push(chosenHubId);
      currentSlots[chosenHubId] = (currentSlots[chosenHubId] || 0) + 15;
      aiActions.push(
        `🌐 Established Regional Hub at ${hubCity?.name || chosenHubId} ($15,000K • +15 Bonus Slots) to anchor regional spoke network`
      );
    }
  }

  // ========================================================
  // 3. FLEET PROCUREMENT (TAKE ADVANTAGE OF FLASH DISCOUNTS!)
  // ========================================================
  // 5. Fleet Procurement (Aircraft Purchase)
  // ========================================================
  const idleAircraft = currentFleet.filter((f) => f.assignedRouteId === null);
  const activeDeal = gameState.activeDiscountDeal;

  const isModelDiscounted = (model: AircraftModel) => {
    if (!activeDeal) return false;
    if (activeDeal.specificModelId) {
      return activeDeal.specificModelId === model.id;
    }
    return activeDeal.manufacturer.toLowerCase() === model.manufacturer.toLowerCase();
  };

  if (idleAircraft.length === 0 && currentCash >= safetyReserveK + 20000) {
    const availableModels = AIRCRAFTS.filter((a) => {
      const inService =
        a.introYear <= gameState.currentYear && (!a.retireYear || a.retireYear >= gameState.currentYear);
      let effectivePrice = a.priceK;
      if (isModelDiscounted(a) && activeDeal) {
        effectivePrice = Math.round(a.priceK * (1 - activeDeal.discountPct / 100));
      }
      const affordable = currentCash - effectivePrice >= safetyReserveK;
      return inService && affordable;
    });

    // Check if AI holds unserved landing slots in a destination city requiring long-haul range
    const activeRouteCityIds = new Set(
      survivingRoutes.flatMap((r) => [r.originCityId, r.destCityId])
    );
    const unservedCities = Object.keys(currentSlots).filter((cityId) => {
      return (
        (currentSlots[cityId] || 0) >= 4 &&
        !activeRouteCityIds.has(cityId) &&
        cityId !== airline.homeCityId &&
        !currentHubs.includes(cityId)
      );
    });
    const maxNeededDist = unservedCities.length > 0
      ? Math.max(
          ...unservedCities.map((cid) => {
            const c = cityMap.get(cid);
            return c ? calculateDistance(homeCity.lat, homeCity.lon, c.lat, c.lon) : 0;
          })
        )
      : 0;

    if (availableModels.length > 0) {
      availableModels.sort((a, b) => {
        let priceA = a.priceK;
        let priceB = b.priceK;
        let isDealA = isModelDiscounted(a);
        let isDealB = isModelDiscounted(b);

        if (isDealA && activeDeal) {
          priceA = Math.round(a.priceK * (1 - activeDeal.discountPct / 100));
        }
        if (isDealB && activeDeal) {
          priceB = Math.round(b.priceK * (1 - activeDeal.discountPct / 100));
        }

        let scoreA = 0;
        let scoreB = 0;

        if (airline.personality === 'LUXURY') {
          scoreA = a.comfortRating + (a.isSupersonic ? 45 : 0);
          scoreB = b.comfortRating + (b.isSupersonic ? 45 : 0);
        } else if (airline.personality === 'AGGRESSIVE' || airline.personality === 'BUDGET_DISCOUNTER') {
          scoreA = a.capacity / (priceA / 1000);
          scoreB = b.capacity / (priceB / 1000);
        } else {
          scoreA = a.rangeKm / 100 + a.comfortRating - priceA / 5000;
          scoreB = b.rangeKm / 100 + b.comfortRating - priceB / 5000;
        }

        // Substantial incentive for active flash deals!
        if (isDealA) scoreA *= 1.6;
        if (isDealB) scoreB *= 1.6;

        // If AI holds unserved slots in a distant city, heavily prioritize aircraft that can reach it!
        if (maxNeededDist > 0) {
          if (a.rangeKm >= maxNeededDist) scoreA += 250;
          if (b.rangeKm >= maxNeededDist) scoreB += 250;
        }

        return scoreB - scoreA;
      });

      const chosenModel = availableModels[0];
      let purchasePrice = chosenModel.priceK;
      let hasDiscount = isModelDiscounted(chosenModel);

      if (hasDiscount && activeDeal) {
        purchasePrice = Math.round(chosenModel.priceK * (1 - activeDeal.discountPct / 100));
      }

      currentCash -= purchasePrice;

      const delivYear = gameState.currentQuarter === 4 ? gameState.currentYear + 1 : gameState.currentYear;
      const delivQuarter = gameState.currentQuarter === 4 ? 1 : ((gameState.currentQuarter + 1) as 1 | 2 | 3 | 4);
      const pendingOrder: PendingAircraftOrder = {
        orderId: `ORDER_${airline.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        airlineId: airline.id,
        modelId: chosenModel.id,
        modelName: chosenModel.model,
        manufacturer: chosenModel.manufacturer,
        quantity: 1,
        unitPriceK: purchasePrice,
        totalCostK: purchasePrice,
        orderYear: gameState.currentYear,
        orderQuarter: gameState.currentQuarter,
        deliveryYear: delivYear,
        deliveryQuarter: delivQuarter,
        status: 'PENDING',
      };

      currentPendingOrders.push(pendingOrder);

      if (hasDiscount && activeDeal) {
        aiActions.push(
          `✈️ Seized ${activeDeal.discountPct}% OFF deal to order 1x ${chosenModel.model} ($${purchasePrice.toLocaleString()}K from ${chosenModel.manufacturer} - Delivery: ${delivYear} Q${delivQuarter})`
        );
      } else {
        aiActions.push(
          `✈️ Placed order for 1x ${chosenModel.model} ($${purchasePrice.toLocaleString()}K from ${chosenModel.manufacturer} - Delivery: ${delivYear} Q${delivQuarter})`
        );
      }
    }
  }

  // ========================================================
  // 4. ROUTE OPERATIONS & EXPANSION
  // ========================================================
  const allAirlineRoutes = [...survivingRoutes, ...newRoutes];
  const intraContinentRoutes = allAirlineRoutes.filter((r) => {
    const orig = cityMap.get(r.originCityId);
    const dest = cityMap.get(r.destCityId);
    return orig && dest && orig.region === homeCity.region && dest.region === homeCity.region;
  });

  for (const plane of idleAircraft) {
    const model = aircraftMap.get(plane.modelId);
    if (!model) continue;

    const originCityIds = [airline.homeCityId, ...currentHubs].filter((id) => (currentSlots[id] || 0) >= 2);
    const potentialDestCityIds = Object.keys(currentSlots).filter((id) => (currentSlots[id] || 0) >= 2);

    interface CandidateRoutePair {
      origin: City;
      dest: City;
      distance: number;
      demand: number;
      score: number;
    }

    const candidatePairs: CandidateRoutePair[] = [];

    for (const origId of originCityIds) {
      const origCity = cityMap.get(origId);
      if (!origCity) continue;

      for (const destId of potentialDestCityIds) {
        if (origId === destId) continue;
        const destCity = cityMap.get(destId);
        if (!destCity) continue;

        const alreadyFlies = allAirlineRoutes.some(
          (r) =>
            (r.originCityId === origId && r.destCityId === destId) ||
            (r.originCityId === destId && r.destCityId === origId)
        );
        if (alreadyFlies) continue;

        const distance = calculateDistance(origCity.lat, origCity.lon, destCity.lat, destCity.lon);
        if (distance > model.rangeKm || distance < 300) continue;

        const demand = calculateRouteDemand(
          origCity,
          destCity,
          gameState.currentYear,
          gameState.currentQuarter,
          gameState.activeEvents
        );

        const competitors = gameState.routes.filter(
          (r) =>
            (r.originCityId === origId && r.destCityId === destId) ||
            (r.originCityId === destId && r.destCityId === origId)
        ).length;

        let score = demand - competitors * 800;

        // Personality strategic bias
        if (
          (airline.personality === 'REGIONAL' || airline.personality === 'BALANCED') &&
          intraContinentRoutes.length < 3
        ) {
          // Strongly prioritize regional hub & domestic routes first
          if (destCity.region === homeCity.region) {
            score += 1200;
          }
        } else if (airline.personality === 'GLOBAL_FLAGSHIP' || airline.personality === 'AGGRESSIVE') {
          // Prioritize megahub corridors
          const megahubs = ['NYC', 'LON', 'TYO', 'PAR', 'DXB', 'SIN', 'FRA', 'LAX'];
          if (megahubs.includes(destCity.id)) {
            score += 900;
          }
        }

        // Anti-Hoarding & Immediate Slot Deployment:
        // If AI holds landing slots in this destination but has NO active route yet, give massive priority!
        const hasUnservedSlots =
          (currentSlots[destCity.id] || 0) >= 4 &&
          !allAirlineRoutes.some((r) => r.originCityId === destCity.id || r.destCityId === destCity.id);
        if (hasUnservedSlots) {
          score += 2500;
        }

        candidatePairs.push({ origin: origCity, dest: destCity, distance, demand, score });
      }
    }

    if (candidatePairs.length > 0) {
      candidatePairs.sort((a, b) => b.score - a.score);
      const bestPair = candidatePairs[0];

      const maxSlotsForNew = Math.min(14, currentSlots[bestPair.origin.id] || 0, currentSlots[bestPair.dest.id] || 0);
      const desiredFlights = Math.min(
        maxSlotsForNew,
        Math.max(2, Math.round(bestPair.demand / (model.capacity * 12 * 0.8)))
      );
      const routeId = `ROUTE_${airline.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

      const priceMod =
        airline.personality === 'AGGRESSIVE' || airline.personality === 'BUDGET_DISCOUNTER'
          ? -10
          : airline.personality === 'LUXURY'
          ? 10
          : 0;

      const initialServiceQuality =
        airline.personality === 'LUXURY'
          ? 1.25
          : airline.personality === 'BUDGET_DISCOUNTER'
          ? 0.8
          : 1.0;

      const inceptionCostK = calculateRouteInceptionCostK(bestPair.origin, bestPair.dest, bestPair.distance);
      if (currentCash < safetyReserveK + inceptionCostK) {
        break; // Conserve cash if cannot afford route inception setup fees
      }
      currentCash -= inceptionCostK;

      const newRoute: Route = {
        id: routeId,
        airlineId: airline.id,
        originCityId: bestPair.origin.id,
        destCityId: bestPair.dest.id,
        assignedAircraftIds: [plane.instanceId],
        weeklyFrequency: desiredFlights,
        priceModifierPct: priceMod,
        serviceQuality: initialServiceQuality,
        status: 'ACTIVE',
        consecutiveLossQuarters: 0,
      };

      plane.assignedRouteId = routeId;
      newRoutes.push(newRoute);
      allAirlineRoutes.push(newRoute);

      aiActions.push(
        `🌐 Opened flight route ${bestPair.origin.name} ➔ ${bestPair.dest.name} (${desiredFlights} flt/wk with ${model.model} - Station inception fee: $${inceptionCostK.toLocaleString()}K)`
      );
    }
  }

  // ========================================================
  // 5. SUBSIDIARY BUSINESS VENTURES (HOTELS & RESORTS)
  // ========================================================
  if (currentCash >= safetyReserveK + 20000) {
    const servedCityIds = Array.from(
      new Set(allAirlineRoutes.flatMap((r) => [r.originCityId, r.destCityId]))
    );

    for (const cityId of servedCityIds) {
      const visual = getCityVisual(cityId);
      const ownedVentureNames = currentBusinesses.filter((b) => b.cityId === cityId).map((b) => b.name);

      const availableVenture = visual.ventures.find(
        (v) => !ownedVentureNames.includes(v.name) && currentCash - v.costK >= safetyReserveK
      );

      if (availableVenture) {
        currentCash -= availableVenture.costK;

        const newVenture: BusinessVenture = {
          id: `VENTURE_${airline.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          cityId,
          airlineId: airline.id,
          type: availableVenture.type,
          name: availableVenture.name,
          purchaseCostK: availableVenture.costK,
          quarterlyDividendK: availableVenture.dividendK,
          tourismBoost: availableVenture.tourismBoost,
        };

        currentBusinesses.push(newVenture);
        aiActions.push(
          `🏨 Acquired subsidiary venture "${availableVenture.name}" in ${cityMap.get(cityId)?.name || cityId} ($${availableVenture.costK.toLocaleString()}K)`
        );
        break;
      }
    }
  }

  // ========================================================
  // 6. ANTI-HOARDING & SLOT RELINQUISHMENT ("USE-IT-OR-LOSE-IT")
  // ========================================================
  // If an AI airline holds excess idle slots in foreign cities far beyond its operations,
  // voluntarily return them to civil aviation authority so airports remain open for competitors
  for (const cityId of Object.keys(currentSlots)) {
    if (cityId === airline.homeCityId || currentHubs.includes(cityId)) continue;
    const owned = currentSlots[cityId] || 0;
    if (owned <= 0) continue;

    const routesUsingCity = allAirlineRoutes.filter(
      (r) => r.originCityId === cityId || r.destCityId === cityId
    );
    const activeFreq = routesUsingCity.reduce((sum, r) => sum + r.weeklyFrequency, 0);

    // If airline holds > 12 slots but uses only a fraction, release excess idle slots
    if (owned > 12 && activeFreq > 0 && owned - activeFreq >= 6) {
      const surrendered = owned - (activeFreq + 2);
      currentSlots[cityId] = activeFreq + 2;
      const c = cityMap.get(cityId);
      aiActions.push(
        `🏛️ Relinquished ${surrendered} excess idle slots in ${c?.name || cityId} back to airport authority (Anti-hoarding regulation)`
      );
    }
  }

  const updatedAirline: Airline = {
    ...airline,
    cashK: currentCash,
    slots: currentSlots,
    fleet: currentFleet,
    pendingOrders: currentPendingOrders,
    businesses: currentBusinesses,
    hubCityIds: currentHubs,
    negotiators,
    aiActionLog: aiActions,
  };

  return {
    updatedAirline,
    newRoutes,
    updatedExistingRoutes: survivingRoutes,
    closedRoutes,
    aiActions,
  };
}
