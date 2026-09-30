import { City, AircraftModel, AircraftInstance, Route, RouteIncident, Airline, WorldEvent, UpcomingWorldEvent, GameState, DiplomaticReport, BusinessVenture, AirlineStanding, AircraftDiscountDeal, PendingAircraftOrder, AircraftDeliveryReport, RegionalCampaign, RegionId, OngoingAirportExpansion } from '../types/game';
import { CITIES } from '../data/cities';
import { AIRCRAFTS } from '../data/aircrafts';
import { HISTORICAL_EVENTS } from '../data/events';
import { createDefaultNegotiators } from '../data/negotiators';
import { getCityVisual } from '../data/cityVisuals';
import { simulateAITurn } from './aiCompetitor';

/**
 * Great Circle distance between two lat/lon coordinates in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Standard base ticket fare ($) based on distance
 */
export function calculateBaseFare(distanceKm: number): number {
  return Math.round(distanceKm * 0.11 + 65);
}

/**
 * Calculates Route Inception & Station Establishment Cost in $K
 * Realistic breakdown: Station setup + bilateral licensing + ground handling contracts + launch marketing
 */
export function calculateRouteInceptionCostK(
  origin: City,
  dest: City,
  distanceKm: number
): number {
  const baseStationCostK = 1200; // Base airport counter, ground handling contracts & station license
  const distanceFactorK = Math.round((distanceKm / 1000) * 150); // $150K per 1,000 km for crew dispatch & long-haul slots
  const destScaleK = Math.round(dest.population * 25 + dest.businessIndex * 12); // Major hub terminal fees
  return Math.round(baseStationCostK + distanceFactorK + destScaleK);
}

/**
 * Calculate potential quarterly passenger demand between two cities using Gravity Model
 */
export function calculateRouteDemand(
  origin: City,
  dest: City,
  year: number,
  quarter: 1 | 2 | 3 | 4,
  activeEvents: WorldEvent[],
  diplomaticRel: number = 1.0
): number {
  const distance = calculateDistance(origin.lat, origin.lon, dest.lat, dest.lon);
  if (distance < 100) return 0;

  // City Mass calculation (Population, Business, Tourism)
  const mass1 = origin.population * 0.45 + origin.businessIndex * 0.35 + origin.tourismIndex * 0.25;
  const mass2 = dest.population * 0.45 + dest.businessIndex * 0.35 + dest.tourismIndex * 0.25;

  const K = 24.0;
  const gamma = 0.72; // Distance decay factor

  let baseDemand = K * ((mass1 * mass2) / Math.pow(distance, gamma)) * 100;

  // Seasonality modifier
  let seasonFactor = 1.0;
  if (quarter === 3) seasonFactor = 1.25; // Peak summer season
  if (quarter === 1) seasonFactor = 0.85; // Low winter season

  // Active Events multiplier
  let eventMultiplier = 1.0;
  for (const ev of activeEvents) {
    const cityMatch =
      ev.affectedCityIds &&
      (ev.affectedCityIds.includes(origin.id) || ev.affectedCityIds.includes(dest.id));
    const regionMatch =
      ev.affectedRegionIds &&
      (ev.affectedRegionIds.includes(origin.region) || ev.affectedRegionIds.includes(dest.region));

    if (cityMatch && ev.demandMultiplier) {
      eventMultiplier = Math.max(eventMultiplier, ev.demandMultiplier);
    } else if (regionMatch && ev.demandMultiplier) {
      eventMultiplier = Math.max(eventMultiplier, 1.0 + (ev.demandMultiplier - 1.0) * 0.5);
    }
  }

  const finalDemand = Math.round(baseDemand * diplomaticRel * seasonFactor * eventMultiplier);
  return Math.max(600, finalDemand);
}

/**
 * Simulate one route's quarterly financial performance, factoring in
 * aircraft age, maintenance escalation, and flight disruptions (storms/breakdowns).
 */
export function simulateRoutePerformance(
  route: Route,
  origin: City,
  dest: City,
  aircraft: AircraftModel | AircraftModel[],
  aircraftInstance: AircraftInstance | AircraftInstance[] | undefined,
  currentQuarter: 1 | 2 | 3 | 4,
  fuelPriceIndex: number,
  totalMarketDemand: number,
  competingRoutesOnPair: Route[] = []
): {
  stats: NonNullable<Route['lastQuarterStats']>;
  incident?: RouteIncident;
} {
  const models: AircraftModel[] = Array.isArray(aircraft) ? aircraft : [aircraft];
  const instances: (AircraftInstance | undefined)[] = Array.isArray(aircraftInstance)
    ? aircraftInstance
    : [aircraftInstance];
  const primaryModel = models[0];

  if (!primaryModel) {
    return {
      stats: {
        passengers: 0,
        capacity: 0,
        loadFactorPct: 0,
        revenueK: 0,
        expensesK: 0,
        profitK: 0,
        actualFlightsCompleted: 0,
        scheduledFlights: 0,
      },
    };
  }

  const distance = calculateDistance(origin.lat, origin.lon, dest.lat, dest.lon);
  const weeks = 12; // 12 weeks per quarter
  const scheduledFlights = route.weeklyFrequency * weeks;
  const numAirframes = Math.max(1, models.length);

  // Helper for age maintenance multiplier
  const getMaintMultiplier = (age: number) => {
    if (age > 24) return 2.1;
    if (age > 18) return 1.65;
    if (age > 12) return 1.35;
    if (age > 6) return 1.15;
    return 1.0;
  };

  const avgAgeYears =
    instances.reduce((sum, inst) => sum + (inst?.ageYears || 0), 0) / Math.max(1, instances.length);

  // 2. Flight Disruption Simulation (Weather & Aging Mechanical Breakdowns)
  let incident: RouteIncident | undefined = undefined;
  let lostFlights = 0;
  let emergencyCostK = 0;

  // Mechanical fault probability (scales with airframe age and long-haul wear)
  let mechRisk = 0.015;
  if (avgAgeYears > 20) mechRisk += 0.08;
  else if (avgAgeYears > 15) mechRisk += 0.05;
  else if (avgAgeYears > 10) mechRisk += 0.025;
  if (distance > 8000) mechRisk += 0.02;

  // Impact of route maintenance & service budget
  const serviceMultiplier = route.serviceQuality !== undefined ? route.serviceQuality : 1.0;
  if (serviceMultiplier >= 1.2) {
    mechRisk *= 0.5;
  } else if (serviceMultiplier < 1.0) {
    mechRisk *= 1.75;
  }

  const rollMech = Math.random();
  if (rollMech < mechRisk) {
    const flightLossRatio = 0.12 + Math.random() * 0.15;
    lostFlights = Math.max(2, Math.round(scheduledFlights * flightLossRatio));
    emergencyCostK = Math.round(
      (primaryModel.priceK * 0.007 + distance * 0.025) * (1 + avgAgeYears * 0.035)
    );

    incident = {
      type: 'MECHANICAL',
      title: avgAgeYears > 15 ? 'Engine & Airframe Fatigue Breakdown' : 'Hydraulic & Avionics System Fault',
      description: `Aging (${Math.round(avgAgeYears)} yr avg) fleet on ${origin.name} - ${dest.name} suffered technical breakdown, grounding ${lostFlights} flights for emergency depot repairs.`,
      lostFlights,
      emergencyCostK,
    };
  } else {
    // Seasonal Weather Incident
    let weatherRisk = 0.015;
    const isEastAsiaTyphoon =
      (origin.region === 'EAST_SOUTHEAST_ASIA' || dest.region === 'EAST_SOUTHEAST_ASIA') &&
      currentQuarter === 3;
    const isWinterStorm =
      (origin.region === 'NORTH_AMERICA' ||
        origin.region === 'EUROPE' ||
        dest.region === 'NORTH_AMERICA' ||
        dest.region === 'EUROPE') &&
      (currentQuarter === 1 || currentQuarter === 4);
    const isMonsoon =
      (origin.region === 'MIDDLE_EAST_SOUTH_ASIA' || dest.region === 'MIDDLE_EAST_SOUTH_ASIA') &&
      (currentQuarter === 2 || currentQuarter === 3);

    if (isEastAsiaTyphoon || isWinterStorm || isMonsoon) weatherRisk += 0.045;

    const rollWeather = Math.random();
    if (rollWeather < weatherRisk) {
      const flightLossRatio = 0.08 + Math.random() * 0.12;
      lostFlights = Math.max(2, Math.round(scheduledFlights * flightLossRatio));
      emergencyCostK = Math.round(lostFlights * 12 + 80);

      let weatherType = 'Severe Crosswind & Storm Warning';
      if (isEastAsiaTyphoon) weatherType = 'Tropical Typhoon Gale';
      else if (isWinterStorm) weatherType = 'Sub-Zero Blizzard & Runway Icing';
      else if (isMonsoon) weatherType = 'Torrential Monsoon Downpour';

      incident = {
        type: 'WEATHER',
        title: weatherType,
        description: `${weatherType} disrupted scheduled rotations between ${origin.name} and ${dest.name}, causing ${lostFlights} flight cancellations and passenger accommodation expenditures.`,
        lostFlights,
        emergencyCostK,
      };
    }
  }

  const actualFlights = Math.max(1, scheduledFlights - lostFlights);

  // If route is explicitly suspended or paused
  if (route.status === 'SUSPENDED' || (route.status as string) === 'PAUSED') {
    return {
      stats: {
        passengers: 0,
        capacity: 0,
        loadFactorPct: 0,
        revenueK: 0,
        expensesK: 0,
        profitK: 0,
        actualFlightsCompleted: 0,
        scheduledFlights: 0,
      },
    };
  }

  // Safety range check
  const minRange = Math.min(...models.map((m) => m.rangeKm));
  if (distance > minRange) {
    const offendingModel = models.find((m) => m.rangeKm < distance) || primaryModel;
    const rangeIncident: RouteIncident = {
      type: 'RANGE_EXCEEDED',
      title: 'Route Grounded: Aircraft Range Exceeded',
      description: `Flight rotation between ${origin.name} and ${dest.name} (${distance.toLocaleString()} km) grounded. The assigned ${offendingModel.model} has a maximum certified range of ${offendingModel.rangeKm.toLocaleString()} km. Please reassign a longer-range airframe.`,
      lostFlights: scheduledFlights,
      emergencyCostK: 0,
    };
    return {
      stats: {
        passengers: 0,
        capacity: 0,
        loadFactorPct: 0,
        revenueK: 0,
        expensesK: 0,
        profitK: 0,
        actualFlightsCompleted: 0,
        scheduledFlights,
      },
      incident: rangeIncident,
    };
  }

  // Seat Capacity Calculation:
  // If weeklyFrequency <= 7 and numAirframes > 1: dual/multi-aircraft tandem operation
  // Each departure carries sum of capacities of all assigned aircraft!
  // If weeklyFrequency > 7: flights are distributed across airframes.
  let seatCapacity = 0;
  if (route.weeklyFrequency <= 7) {
    const totalFleetSeats = models.reduce((sum, m) => sum + m.capacity, 0);
    seatCapacity = actualFlights * totalFleetSeats;
  } else {
    const avgSeats = models.reduce((sum, m) => sum + m.capacity, 0) / numAirframes;
    seatCapacity = Math.round(actualFlights * avgSeats);
  }

  if (seatCapacity <= 0) {
    return {
      stats: {
        passengers: 0,
        capacity: 0,
        loadFactorPct: 0,
        revenueK: 0,
        expensesK: 0,
        profitK: 0,
        actualFlightsCompleted: 0,
        scheduledFlights,
      },
      incident,
    };
  }

  const baseFare = calculateBaseFare(distance);
  const effectivePrice = Math.round(baseFare * (1 + route.priceModifierPct / 100));

  const avgComfort = Math.round(models.reduce((sum, m) => sum + m.comfortRating, 0) / numAirframes);
  const effectiveComfort = Math.max(30, avgComfort - Math.floor(avgAgeYears * 0.7));
  const hasSupersonic = models.some((m) => m.isSupersonic);

  const priceRatio = effectivePrice / baseFare;
  let utility =
    -2.0 * priceRatio +
    0.65 * Math.log(Math.max(1, route.weeklyFrequency)) +
    0.015 * effectiveComfort;
  if (hasSupersonic) utility += 0.8;
  if (serviceMultiplier >= 1.2) utility += 0.30;
  else if (serviceMultiplier < 1.0) utility -= 0.25;

  let share = 1.0;
  if (competingRoutesOnPair.length > 0) {
    const totalExp = Math.exp(utility) + competingRoutesOnPair.length * Math.exp(-0.5);
    share = Math.exp(utility) / totalExp;
  } else {
    if (route.priceModifierPct > 0) {
      share = Math.max(0.4, 1.0 - (route.priceModifierPct / 100) * 0.7);
    } else {
      share = Math.min(1.4, 1.0 + (Math.abs(route.priceModifierPct) / 100) * 0.6);
    }
  }

  const demandedPax = Math.round(totalMarketDemand * share);
  const actualPassengers = Math.min(demandedPax, seatCapacity);
  const loadFactorPct = Math.round((actualPassengers / seatCapacity) * 100);

  const revenueK = Math.round((actualPassengers * effectivePrice) / 1000);

  // Expenses: Fuel and Maintenance for each plane
  const flightsPerPlane = route.weeklyFrequency <= 7 ? actualFlights : actualFlights / numAirframes;
  let fuelCostK = 0;
  let maintCostK = 0;

  for (let i = 0; i < models.length; i++) {
    const m = models[i];
    const inst = instances[i];
    const planeAge = inst?.ageYears || 0;
    const planeMaintMult = getMaintMultiplier(planeAge);

    const planeDistance = flightsPerPlane * distance;
    const planeFuelK = Math.round((planeDistance * m.fuelBurnPerKm * 0.85 * fuelPriceIndex) / 1000);
    const planeHours = planeDistance / m.speedKmh;
    const planeMaintK = Math.round(
      (planeHours * m.maintCostPerHour * planeMaintMult * serviceMultiplier) / 1000
    );

    fuelCostK += planeFuelK;
    maintCostK += planeMaintK;
  }

  const airportFeesK = Math.round(
    (actualFlights * (distance * 0.035 + 450) * (route.weeklyFrequency <= 7 ? numAirframes : 1)) / 1000
  );

  const expensesK = fuelCostK + maintCostK + airportFeesK + emergencyCostK;
  const profitK = revenueK - expensesK;

  return {
    stats: {
      passengers: actualPassengers,
      capacity: seatCapacity,
      loadFactorPct,
      revenueK,
      expensesK,
      profitK,
      actualFlightsCompleted: actualFlights,
      scheduledFlights,
    },
    incident,
  };
}

/**
 * Forecast major world spectacles, sport cups, expos, and tourism campaigns coming up
 * in the next 1 to 4 quarters (3 to 12 months) so players and the board can prepare in advance.
 */
export function getUpcomingWorldEvents(
  currentYear: number,
  currentQuarter: 1 | 2 | 3 | 4,
  maxQuartersAhead: number = 4
): UpcomingWorldEvent[] {
  const upcoming: UpcomingWorldEvent[] = [];

  for (let qAhead = 1; qAhead <= maxQuartersAhead; qAhead++) {
    let targetQuarter = currentQuarter + qAhead;
    let targetYear = currentYear;
    while (targetQuarter > 4) {
      targetQuarter -= 4;
      targetYear += 1;
    }

    const matchingEvents = HISTORICAL_EVENTS.filter(
      (e) => e.year === targetYear && e.quarter === targetQuarter
    );

    for (const ev of matchingEvents) {
      // Forecast sports cups, expos, tourism campaigns, and historic events
      if (['WORLD_CUP', 'OLYMPICS', 'EURO', 'EXPO', 'TOURISM_YEAR', 'HISTORIC_EVENT'].includes(ev.type)) {
        const surgePct = ev.demandMultiplier ? Math.round((ev.demandMultiplier - 1.0) * 100) : 80;
        upcoming.push({
          event: ev,
          quartersUntil: qAhead,
          estimatedDemandSurgePct: surgePct,
        });
      }
    }

    // Dynamic recurring events for Sandbox / Future Years (>= 2030)
    if (targetYear >= 2030 && matchingEvents.length === 0) {
      if (targetYear % 4 === 2 && targetQuarter === 2) {
        upcoming.push({
          event: {
            id: `WC_${targetYear}`,
            year: targetYear,
            quarter: 2,
            type: 'WORLD_CUP',
            title: `FIFA World Cup ${targetYear}`,
            description: `The ${targetYear} World Cup attracts millions of international football travelers worldwide!`,
            demandMultiplier: 1.85,
            durationQuarters: 1,
          },
          quartersUntil: qAhead,
          estimatedDemandSurgePct: 85,
        });
      } else if (targetYear % 4 === 0 && targetQuarter === 3) {
        upcoming.push({
          event: {
            id: `OLY_${targetYear}`,
            year: targetYear,
            quarter: 3,
            type: 'OLYMPICS',
            title: `Summer Olympic Games ${targetYear}`,
            description: `Athletes and spectators from 200+ nations converge for the global Olympic Games!`,
            demandMultiplier: 1.70,
            durationQuarters: 1,
          },
          quartersUntil: qAhead,
          estimatedDemandSurgePct: 70,
        });
      } else if (targetYear % 4 === 0 && targetQuarter === 2) {
        upcoming.push({
          event: {
            id: `EURO_${targetYear}`,
            year: targetYear,
            quarter: 2,
            type: 'EURO',
            title: `UEFA European Championship ${targetYear}`,
            description: `European continent experiences surging intercontinental passenger demand!`,
            demandMultiplier: 1.55,
            durationQuarters: 1,
          },
          quartersUntil: qAhead,
          estimatedDemandSurgePct: 55,
        });
      }
    }
  }

  return upcoming;
}

/**
 * Advance Game State by 1 Quarter
 */
export function advanceQuarter(currentState: GameState): GameState {
  const nextTurn = currentState.turnNumber + 1;
  let nextQuarter = (currentState.currentQuarter + 1) as 1 | 2 | 3 | 4;
  let nextYear = currentState.currentYear;

  if (nextQuarter > 4) {
    nextQuarter = 1;
    nextYear += 1;
  }

  // Determine active events for the new quarter
  const newActiveEvents = HISTORICAL_EVENTS.filter((e) => {
    return e.year === nextYear && e.quarter === nextQuarter;
  });

  // Dynamic recurring events for Sandbox / Future Years (>= 2030)
  if (nextYear >= 2030 && newActiveEvents.length === 0) {
    if (nextYear % 4 === 2 && nextQuarter === 2) {
      newActiveEvents.push({
        id: `WC_${nextYear}`,
        year: nextYear,
        quarter: 2,
        type: 'WORLD_CUP',
        title: `FIFA World Cup ${nextYear}`,
        description: `The ${nextYear} World Cup attracts millions of international football travelers worldwide!`,
        demandMultiplier: 1.85,
        durationQuarters: 1,
      });
    } else if (nextYear % 4 === 0 && nextQuarter === 3) {
      newActiveEvents.push({
        id: `OLY_${nextYear}`,
        year: nextYear,
        quarter: 3,
        type: 'OLYMPICS',
        title: `Summer Olympic Games ${nextYear}`,
        description: `Athletes and spectators from 200+ nations converge for the global Olympic Games!`,
        demandMultiplier: 1.70,
        durationQuarters: 1,
      });
    } else if (nextYear % 4 === 0 && nextQuarter === 2) {
      newActiveEvents.push({
        id: `EURO_${nextYear}`,
        year: nextYear,
        quarter: 2,
        type: 'EURO',
        title: `UEFA European Championship ${nextYear}`,
        description: `European continent experiences surging intercontinental passenger demand!`,
        demandMultiplier: 1.55,
        durationQuarters: 1,
      });
    }
  }

  // Check for newly introduced aircraft entering service
  const newlyIntroduced = AIRCRAFTS.filter((a) => a.introYear === nextYear && nextQuarter === 1);
  const newlyRetired = AIRCRAFTS.filter((a) => a.retireYear === nextYear && nextQuarter === 1);

  // Check for 1-year advance preview notice for aircraft in development
  const upcomingAircraft = AIRCRAFTS.filter((a) => a.introYear === nextYear + 1);

  // Check for 1-year advance notice for aircraft ceasing commercial production
  const retiringAircraft = AIRCRAFTS.filter((a) => a.retireYear === nextYear + 1);

  // Process Realistic Manufacturer Promotions (Tiered by market frequency)
  let nextDiscountDeal: AircraftDiscountDeal | undefined = undefined;
  if (currentState.activeDiscountDeal && currentState.activeDiscountDeal.quartersRemaining > 1) {
    nextDiscountDeal = {
      ...currentState.activeDiscountDeal,
      quartersRemaining: currentState.activeDiscountDeal.quartersRemaining - 1,
    };
  } else {
    const roll = Math.random();
    const activeEraModels = AIRCRAFTS.filter(
      (a) => a.introYear <= nextYear && (!a.retireYear || a.retireYear >= nextYear)
    );

    if (activeEraModels.length > 0) {
      if (roll < 0.04) {
        // 1. RARE DEEP CLEARANCE (40% - 50% OFF): Once every 2-4 years
        // Specifically targets mature/aging aircraft models in service for 6+ years
        const matureModels = activeEraModels.filter((m) => nextYear - m.introYear >= 6);
        const targetPool = matureModels.length > 0 ? matureModels : activeEraModels;
        const chosenModel = targetPool[Math.floor(Math.random() * targetPool.length)];
        const discountRate = [40, 50][Math.floor(Math.random() * 2)];

        nextDiscountDeal = {
          id: `DEAL_${nextYear}_Q${nextQuarter}_${chosenModel.id}`,
          manufacturer: chosenModel.manufacturer,
          specificModelId: chosenModel.id,
          discountPct: discountRate,
          modelName: chosenModel.model,
          quartersRemaining: 1,
          reason: `End-of-Series Airframe Clearance & Manufacturer Inventory Liquidation (${discountRate}% OFF on ${chosenModel.model})`,
        };
      } else if (roll < 0.14) {
        // 2. MEDIUM REBATE (25% - 30% OFF): Once every 1-2 years
        const makers = Array.from(new Set(activeEraModels.map((a) => a.manufacturer)));
        const chosenMaker = makers[Math.floor(Math.random() * makers.length)];
        const discountRate = [25, 30][Math.floor(Math.random() * 2)];

        nextDiscountDeal = {
          id: `DEAL_${nextYear}_Q${nextQuarter}_${chosenMaker}`,
          manufacturer: chosenMaker,
          discountPct: discountRate,
          modelName: `${chosenMaker} Fleet Models`,
          quartersRemaining: 1,
          reason: `International Airshow Strategic Fleet Procurement Rebate (${discountRate}% OFF)`,
        };
      } else if (roll < 0.32) {
        // 3. REGULAR FACTORY INCENTIVE (10% - 20% OFF): 1-2 times per year
        const makers = Array.from(new Set(activeEraModels.map((a) => a.manufacturer)));
        const chosenMaker = makers[Math.floor(Math.random() * makers.length)];
        const discountRate = [10, 15, 20][Math.floor(Math.random() * 3)];

        nextDiscountDeal = {
          id: `DEAL_${nextYear}_Q${nextQuarter}_${chosenMaker}`,
          manufacturer: chosenMaker,
          discountPct: discountRate,
          modelName: `${chosenMaker} Fleet Models`,
          quartersRemaining: 1,
          reason: `Quarterly Factory Production Incentive & Early Delivery Rebate (${discountRate}% OFF)`,
        };
      }
    }
  }

  // Calculate global fuel price multiplier from events
  let fuelMultiplier = 1.0;
  for (const ev of newActiveEvents) {
    if (ev.fuelPriceMultiplier) {
      fuelMultiplier = Math.max(fuelMultiplier, ev.fuelPriceMultiplier);
    }
  }

  // Dynamic Airport Slot Capacities & Periodic Infrastructure Expansions
  const currentAirportSlots: Record<string, number> = {
    ...(currentState.airportSlots ||
      CITIES.reduce((acc, c) => {
        acc[c.id] = c.baseSlots;
        return acc;
      }, {} as Record<string, number>)),
  };

  const airportExpansionNotices: NonNullable<GameState['airportExpansions']> = [];
  const updatedOngoingExpansions: OngoingAirportExpansion[] = [];

  // 1. Progress active runway & terminal construction projects (3, 6, 9, 12 months duration)
  (currentState.ongoingAirportExpansions || []).forEach((exp) => {
    const rem = exp.quartersRemaining - 1;
    if (rem <= 0) {
      // Construction successfully finished! Runways & terminals officially open!
      const city = CITIES.find((c) => c.id === exp.cityId);
      const prevSlots = currentAirportSlots[exp.cityId] || (city?.baseSlots ?? 100);
      currentAirportSlots[exp.cityId] = prevSlots + exp.addedSlots;

      airportExpansionNotices.push({
        cityId: exp.cityId,
        cityName: exp.cityName,
        addedSlots: exp.addedSlots,
        newTotalSlots: currentAirportSlots[exp.cityId],
        reason: `${exp.cityName} International Airport completes new runway and terminal complex (+${exp.addedSlots} slots). New slots now open under 4-way Anti-Monopoly allocation!`,
      });
    } else {
      updatedOngoingExpansions.push({
        ...exp,
        quartersRemaining: rem,
      });
    }
  });

  // 2. Dynamic Congestion Trigger: Detect airports near capacity (<= 15 free slots or >= 85% utilized)
  // and initiate a realistic civil aviation construction project (1 to 3 quarters lead time)
  const activeExpansionCityIds = new Set(updatedOngoingExpansions.map((e) => e.cityId));

  CITIES.forEach((city) => {
    if (activeExpansionCityIds.has(city.id)) return;

    const totalCap = currentAirportSlots[city.id] || city.baseSlots;
    const totalAllocated = currentState.airlines.reduce(
      (sum, a) => sum + (a.slots[city.id] || 0),
      0
    );
    const freeSlots = Math.max(0, totalCap - totalAllocated);

    // Congestion trigger condition: free slots <= 15 or >= 85% utilized, and hasn't reached maximum airport ceiling (<= 250)
    if (freeSlots <= 15 && totalCap < 250) {
      const isMega = city.population >= 10 || city.baseSlots >= 120;
      // Construction duration: 1 to 3 quarters (3 to 9 months)
      const quarters = isMega ? 3 : city.population >= 5 ? 2 : 1;
      const addedSlots = isMega ? 35 : city.population >= 5 ? 25 : 20;

      updatedOngoingExpansions.push({
        cityId: city.id,
        cityName: city.name,
        addedSlots,
        quartersRemaining: quarters,
        totalQuarters: quarters,
        reason: `${city.name} Civil Aviation Authority breaks ground on new runway & terminal expansion (+${addedSlots} slots in ${quarters * 3} months) to alleviate congestion.`,
      });
      activeExpansionCityIds.add(city.id);
    }
  });

  const cityMap = new Map(CITIES.map((c) => [c.id, c]));
  const aircraftMap = new Map(AIRCRAFTS.map((a) => [a.id, a]));

  // 1. Autonomous AI Competitor Decision Phase
  const intermediateAirlines: Airline[] = [];
  let allRoutes: Route[] = [...currentState.routes];
  const allClosedRoutes: {
    airlineId: string;
    airlineName: string;
    airlineColor: string;
    originCityId: string;
    destCityId: string;
    lossK: number;
  }[] = [];

  for (const airline of currentState.airlines) {
    if (!airline.isHuman) {
      const aiTurnResult = simulateAITurn(airline, {
        ...currentState,
        currentYear: nextYear,
        currentQuarter: nextQuarter,
        activeDiscountDeal: nextDiscountDeal,
        airportSlots: currentAirportSlots,
      });
      intermediateAirlines.push(aiTurnResult.updatedAirline);
      allClosedRoutes.push(...aiTurnResult.closedRoutes);

      // Keep other airline routes and replace this airline's routes with surviving + new routes
      const otherAirlineRoutes = allRoutes.filter((r) => r.airlineId !== airline.id);
      allRoutes = [...otherAirlineRoutes, ...aiTurnResult.updatedExistingRoutes, ...aiTurnResult.newRoutes];
    } else {
      intermediateAirlines.push(airline);
    }
  }

  // 2. Process all routes with competing airline market share resolution
  const routeIncidents: NonNullable<GameState['routeIncidents']> = [];
  const updatedRoutes: Route[] = allRoutes.map((route) => {
    const origin = cityMap.get(route.originCityId);
    const dest = cityMap.get(route.destCityId);
    if (!origin || !dest) return route;

    // Find all assigned aircraft models and instances
    const owningAirline = intermediateAirlines.find((a) => a.id === route.airlineId);
    let assignedInstances = (owningAirline?.fleet || []).filter((f) =>
      route.assignedAircraftIds.includes(f.instanceId)
    );
    if (assignedInstances.length === 0 && owningAirline && owningAirline.fleet.length > 0) {
      assignedInstances = [owningAirline.fleet[0]];
    }
    const assignedModels = assignedInstances
      .map((inst) => aircraftMap.get(inst.modelId))
      .filter(Boolean) as AircraftModel[];

    if (assignedModels.length === 0) return route;

    let baseDemand = calculateRouteDemand(origin, dest, nextYear, nextQuarter, newActiveEvents);

    // Regional Advertising Campaign Bonus:
    // If owning airline has an active marketing campaign in origin or destination region,
    // apply demand boost (+12% to +25%)
    if (owningAirline?.activeCampaigns && owningAirline.activeCampaigns.length > 0) {
      const activeCamp = owningAirline.activeCampaigns.find(
        (c) => c.quartersRemaining > 0 && (c.regionId === origin.region || c.regionId === dest.region)
      );
      if (activeCamp) {
        baseDemand = Math.round(baseDemand * (1 + activeCamp.demandBoostPct / 100));
      }
    }

    // Hub Transit / Connecting Passenger Bonus:
    // If route touches an established Regional Hub of the owning airline,
    // and that Hub has an active feeder route connecting back to HQ or other network nodes,
    // grant an +18% passenger demand bonus representing connecting transit passengers!
    if (owningAirline && (owningAirline.hubCityIds || []).length > 1) {
      const hubSet = new Set(owningAirline.hubCityIds);
      const isOriginHub = hubSet.has(origin.id) && origin.id !== owningAirline.homeCityId;
      const isDestHub = hubSet.has(dest.id) && dest.id !== owningAirline.homeCityId;

      if (isOriginHub || isDestHub) {
        const hubId = isOriginHub ? origin.id : dest.id;
        const hasFeeder = allRoutes.some(
          (r) =>
            r.airlineId === owningAirline.id &&
            r.id !== route.id &&
            (r.originCityId === hubId || r.destCityId === hubId) &&
            (r.originCityId === owningAirline.homeCityId || r.destCityId === owningAirline.homeCityId)
        );
        if (hasFeeder) {
          baseDemand = Math.round(baseDemand * 1.18); // +18% connecting transit passengers
        }
      }
    }

    // Competing routes on same pair from other airlines
    const competingRoutesOnPair = allRoutes.filter(
      (r) =>
        r.id !== route.id &&
        ((r.originCityId === route.originCityId && r.destCityId === route.destCityId) ||
          (r.originCityId === route.destCityId && r.destCityId === route.originCityId))
    );

    const result = simulateRoutePerformance(
      route,
      origin,
      dest,
      assignedModels,
      assignedInstances,
      nextQuarter,
      fuelMultiplier,
      baseDemand,
      competingRoutesOnPair
    );

    if (result.incident) {
      const owningAirline = intermediateAirlines.find((a) => a.id === route.airlineId);
      routeIncidents.push({
        routeId: route.id,
        airlineId: route.airlineId,
        airlineName: owningAirline?.name || 'Airline',
        airlineColor: owningAirline?.color || '#38bdf8',
        originCityName: origin.name,
        destCityName: dest.name,
        incident: result.incident,
      });
    }

    return {
      ...route,
      lastQuarterStats: result.stats,
      lastQuarterIncident: result.incident,
    };
  });

  // 3. Update airlines financial balance sheets and process negotiator diplomatic missions
  let humanProfit = 0;
  let humanRevenue = 0;
  let humanPassengers = 0;
  const diplomaticReports: DiplomaticReport[] = [];
  const allAircraftDeliveries: AircraftDeliveryReport[] = [];
  const isNewYear = nextQuarter === 1 && nextYear !== currentState.currentYear;

  const updatedAirlines: Airline[] = intermediateAirlines.map((airline) => {
    const airlineRoutes = updatedRoutes.filter((r) => r.airlineId === airline.id);
    let netRouteProfitK = 0;

    // Increment aircraft age and update condition on new calendar year or quarterly route wear
    const updatedFleet = airline.fleet.map((plane) => {
      const newAge = isNewYear ? (plane.ageYears || 0) + 1 : (plane.ageYears || 0);
      let conditionDelta = isNewYear ? 2.5 : 0;

      // Maintenance service quality impact on airframe condition
      if (plane.assignedRouteId) {
        const assignedRoute = updatedRoutes.find((r) => r.id === plane.assignedRouteId);
        if (assignedRoute && assignedRoute.status === 'ACTIVE') {
          const sq = assignedRoute.serviceQuality ?? 1.0;
          if (sq < 1.0) {
            // Budget maintenance (0.8x): cuts costs but causes extra quarterly wear (+1.5% condition loss)
            conditionDelta += 1.5;
          } else if (sq >= 1.2) {
            // Rigorous preventative maintenance (1.25x): repairs & preserves airframe (-1% wear reduction)
            conditionDelta = Math.max(-0.5, conditionDelta - 1.0);
          }
        }
      }

      const currentCond = plane.conditionPct ?? Math.max(35, Math.round(100 - (plane.ageYears || 0) * 2.5));
      const newCondition = Math.max(25, Math.min(100, Math.round(currentCond - conditionDelta)));
      return {
        ...plane,
        ageYears: newAge,
        conditionPct: newCondition,
      };
    });

    for (const r of airlineRoutes) {
      if (r.lastQuarterStats) {
        netRouteProfitK += r.lastQuarterStats.profitK;
        if (airline.isHuman) {
          humanProfit += r.lastQuarterStats.profitK;
          humanRevenue += r.lastQuarterStats.revenueK;
          humanPassengers += r.lastQuarterStats.passengers;
        }
      }
    }

    // Passive dividends from business ventures
    let businessDividendsK = 0;
    for (const b of airline.businesses) {
      businessDividendsK += b.quarterlyDividendK;
    }
    if (airline.isHuman) humanProfit += businessDividendsK;

    const newCash = airline.cashK + netRouteProfitK + businessDividendsK;

    // Process Negotiator Mission Timers & Fulfillment
    const updatedSlots = { ...airline.slots };
    const updatedBusinesses = [...airline.businesses];
    const updatedHubs = [...airline.hubCityIds];

    const currentNegotiators = airline.negotiators && airline.negotiators.length > 0
      ? airline.negotiators
      : createDefaultNegotiators();

    const updatedNegotiators = currentNegotiators.map((neg) => {
      if (neg.status === 'DISPATCHED' && neg.currentMission) {
        const remaining = neg.currentMission.quartersRemaining - 1;
        if (remaining <= 0) {
          // Mission successfully concluded this quarter!
          const mission = neg.currentMission;

          if (mission.type === 'SLOT_NEGOTIATION') {
            const requested = mission.requestedSlots || 10;
            const cityCap = currentAirportSlots[mission.targetCityId] || cityMap.get(mission.targetCityId)?.baseSlots || 100;
            const usedSlotsAcrossAirlines = intermediateAirlines.reduce(
              (sum, a) => sum + (a.id === airline.id ? (updatedSlots[mission.targetCityId] || 0) : (a.slots[mission.targetCityId] || 0)),
              0
            );
            const remainingFreeSlots = Math.max(0, cityCap - usedSlotsAcrossAirlines);
            const slotsToAdd = Math.min(requested, remainingFreeSlots);
            if (slotsToAdd > 0) {
              updatedSlots[mission.targetCityId] = (updatedSlots[mission.targetCityId] || 0) + slotsToAdd;
            }

            if (airline.isHuman) {
              if (slotsToAdd <= 0) {
                diplomaticReports.push({
                  id: `DIP_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                  negotiatorName: neg.name,
                  avatarId: neg.avatarId,
                  targetCityName: mission.targetCityName,
                  type: 'SLOT_NEGOTIATION',
                  success: false,
                  slotsGranted: 0,
                  message: `Bilateral negotiations stalled in ${mission.targetCityName}! The airport has reached absolute capacity (0 free slots available out of ${cityCap}). No landing slots could be awarded.`,
                });
              } else {
                const isCongested = slotsToAdd < requested;
                diplomaticReports.push({
                  id: `DIP_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                  negotiatorName: neg.name,
                  avatarId: neg.avatarId,
                  targetCityName: mission.targetCityName,
                  type: 'SLOT_NEGOTIATION',
                  success: true,
                  slotsGranted: slotsToAdd,
                  message: isCongested
                    ? `Bilateral treaty concluded! Due to heavy airport congestion in ${mission.targetCityName}, civil aviation authorities awarded ${slotsToAdd} landing slots (Total capacity: ${cityCap}).`
                    : `Treaty negotiations concluded with civil aviation officials in ${mission.targetCityName}! Officially awarded ${slotsToAdd} landing slots (Total airport capacity: ${cityCap}).`,
                });
              }
            }
          } else if (mission.type === 'SUBSIDIARY_ACQUISITION') {
            const visual = getCityVisual(mission.targetCityId);
            const ventureInfo =
              visual.ventures.find((v) => v.name === mission.ventureName) ||
              visual.ventures.find((v) => v.type === mission.ventureType) ||
              visual.ventures[0];
            const newVenture: BusinessVenture = {
              id: `VENTURE_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              cityId: mission.targetCityId,
              airlineId: airline.id,
              type: ventureInfo.type,
              name: ventureInfo.name,
              purchaseCostK: ventureInfo.costK,
              quarterlyDividendK: ventureInfo.dividendK,
              tourismBoost: ventureInfo.tourismBoost,
            };
            updatedBusinesses.push(newVenture);

            if (airline.isHuman) {
              diplomaticReports.push({
                id: `DIP_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                negotiatorName: neg.name,
                avatarId: neg.avatarId,
                targetCityName: mission.targetCityName,
                type: 'SUBSIDIARY_ACQUISITION',
                success: true,
                message: `Commercial venture acquisition finalized! Acquired "${ventureInfo.name}" in ${mission.targetCityName}.`,
              });
            }
          } else if (mission.type === 'ESTABLISH_HUB') {
            if (!updatedHubs.includes(mission.targetCityId)) {
              updatedHubs.push(mission.targetCityId);
            }

            if (airline.isHuman) {
              diplomaticReports.push({
                id: `DIP_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                negotiatorName: neg.name,
                avatarId: neg.avatarId,
                targetCityName: mission.targetCityName,
                type: 'ESTABLISH_HUB',
                success: true,
                message: `Regional Operations Hub chartered and cleared in ${mission.targetCityName}!`,
              });
            }
          }

          // Negotiator returns home to AVAILABLE
          return {
            ...neg,
            status: 'AVAILABLE' as const,
            currentMission: undefined,
          };
        } else {
          // Mission still ongoing with decremented remaining quarters
          return {
            ...neg,
            currentMission: {
              ...neg.currentMission,
              quartersRemaining: remaining,
            },
          };
        }
      }
      return neg;
    });

    // Process Factory Aircraft Orders & Deliveries (Next-Quarter lead time with 5% delay risk)
    const pendingOrders = airline.pendingOrders || [];
    const remainingPendingOrders: PendingAircraftOrder[] = [];
    const newlyDeliveredPlanes: AircraftInstance[] = [];

    for (const order of pendingOrders) {
      const isDue =
        order.deliveryYear < nextYear ||
        (order.deliveryYear === nextYear && order.deliveryQuarter <= nextQuarter);

      if (isDue) {
        // 5% chance of manufacturer delay (only roll once if not already delayed)
        const isDelayed = Math.random() < 0.05;

        if (isDelayed && order.status !== 'DELAYED') {
          const nextDelivQ = order.deliveryQuarter === 4 ? 1 : ((order.deliveryQuarter + 1) as 1 | 2 | 3 | 4);
          const nextDelivY = order.deliveryQuarter === 4 ? order.deliveryYear + 1 : order.deliveryYear;
          const delayReason = `${order.manufacturer} Factory Notice: Supply chain bottlenecks and avionics quality inspections have postponed delivery of ${order.quantity}x ${order.modelName} to ${nextDelivY} Q${nextDelivQ}!`;

          remainingPendingOrders.push({
            ...order,
            deliveryYear: nextDelivY,
            deliveryQuarter: nextDelivQ,
            status: 'DELAYED',
            delayReason,
          });

          allAircraftDeliveries.push({
            orderId: order.orderId,
            airlineId: airline.id,
            airlineName: airline.name,
            modelName: order.modelName,
            quantity: order.quantity,
            status: 'DELAYED',
            message: delayReason,
          });
        } else {
          // Delivered!
          for (let i = 0; i < order.quantity; i++) {
            newlyDeliveredPlanes.push({
              instanceId: `PLANE_${airline.id}_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
              modelId: order.modelId,
              ageYears: 0,
              purchaseYear: nextYear,
              conditionPct: 100,
              assignedRouteId: null, // Ready in hangar
            });
          }

          allAircraftDeliveries.push({
            orderId: order.orderId,
            airlineId: airline.id,
            airlineName: airline.name,
            modelName: order.modelName,
            quantity: order.quantity,
            status: 'DELIVERED',
            message: `Factory Delivery Complete! ${order.quantity}x ${order.modelName} delivered from ${order.manufacturer} to ${airline.name}'s fleet hangar ready for service!`,
          });
        }
      } else {
        remainingPendingOrders.push(order);
      }
    }

    const finalFleet = [...updatedFleet, ...newlyDeliveredPlanes];

    // Process active marketing campaigns (decrement quarters remaining, filter expired)
    const updatedCampaigns: RegionalCampaign[] = (airline.activeCampaigns || [])
      .map((c) => ({ ...c, quartersRemaining: c.quartersRemaining - 1 }))
      .filter((c) => c.quartersRemaining > 0);

    // Track consecutive unprofitable quarters (for Chapter 11 defeat condition)
    const isQuarterDeficit = netRouteProfitK + businessDividendsK < 0;
    const consecutiveLossQuarters = isQuarterDeficit ? (airline.consecutiveLossQuarters || 0) + 1 : 0;

    return {
      ...airline,
      fleet: finalFleet,
      pendingOrders: remainingPendingOrders,
      cashK: newCash,
      slots: updatedSlots,
      businesses: updatedBusinesses,
      hubCityIds: updatedHubs,
      negotiators: updatedNegotiators,
      activeCampaigns: updatedCampaigns,
      consecutiveLossQuarters,
    };
  });

  // 4. Compute 4-Way Airline Standings & Valuation Leaderboard (Classic Koei Aerobiz)
  const standings: AirlineStanding[] = updatedAirlines.map((airline) => {
    const airlineRoutes = updatedRoutes.filter((r) => r.airlineId === airline.id);
    let qRev = 0;
    let qExp = 0;
    let qProf = 0;
    let qPax = 0;

    airlineRoutes.forEach((r) => {
      if (r.lastQuarterStats) {
        qRev += r.lastQuarterStats.revenueK;
        qExp += r.lastQuarterStats.expensesK;
        qProf += r.lastQuarterStats.profitK;
        qPax += r.lastQuarterStats.passengers;
      }
    });

    let bizDiv = 0;
    let bizVal = 0;
    airline.businesses.forEach((b) => {
      bizDiv += b.quarterlyDividendK;
      bizVal += b.purchaseCostK;
    });
    qProf += bizDiv;

    let fleetVal = 0;
    airline.fleet.forEach((f) => {
      const m = aircraftMap.get(f.modelId);
      if (m) fleetVal += Math.round(m.priceK * 0.7);
    });

    const totalValuationK = airline.cashK + fleetVal + bizVal;

    return {
      rank: 1,
      airlineId: airline.id,
      airlineName: airline.name,
      airlineColor: airline.color,
      isHuman: airline.isHuman,
      ceoName: airline.ceoName,
      personality: airline.personality,
      homeCityId: airline.homeCityId,
      totalValuationK,
      cashK: airline.cashK,
      fleetValueK: fleetVal,
      businessValueK: bizVal,
      quarterProfitK: qProf,
      quarterRevenueK: qRev,
      quarterExpensesK: qExp,
      quarterPassengers: qPax,
      activeRoutesCount: airlineRoutes.length,
      fleetCount: airline.fleet.length,
    };
  });

  standings.sort((a, b) => b.totalValuationK - a.totalValuationK);
  standings.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  // 5. Evaluate Victory and Defeat Conditions (Classic Koei Aerobiz Supersonic Rules)
  let isGameOver = false;
  let victoryType: GameState['victoryType'] = undefined;
  let winnerAirlineId: string | undefined = undefined;
  let victoryReason: string | undefined = undefined;
  let victoryDetails: GameState['victoryDetails'] = undefined;
  let defeatReason: string | undefined = undefined;

  const ALL_REGIONS: RegionId[] = [
    'NORTH_AMERICA',
    'SOUTH_AMERICA',
    'EUROPE',
    'AFRICA',
    'MIDDLE_EAST_SOUTH_ASIA',
    'EAST_SOUTHEAST_ASIA',
    'OCEANIA',
  ];

  // Calculate passenger leadership per region for this quarter
  const regionalPax: Record<RegionId, Record<string, number>> = {
    NORTH_AMERICA: {},
    SOUTH_AMERICA: {},
    EUROPE: {},
    AFRICA: {},
    MIDDLE_EAST_SOUTH_ASIA: {},
    EAST_SOUTHEAST_ASIA: {},
    OCEANIA: {},
  };

  updatedRoutes.forEach((r) => {
    if (r.lastQuarterStats && r.lastQuarterStats.passengers > 0) {
      const orig = cityMap.get(r.originCityId);
      const dst = cityMap.get(r.destCityId);
      const pax = r.lastQuarterStats.passengers;
      if (orig) {
        regionalPax[orig.region][r.airlineId] = (regionalPax[orig.region][r.airlineId] || 0) + pax;
      }
      if (dst && dst.region !== orig?.region) {
        regionalPax[dst.region][r.airlineId] = (regionalPax[dst.region][r.airlineId] || 0) + pax;
      }
    }
  });

  // Determine leading airline per region
  const leadingAirlinePerRegion: Record<RegionId, string | null> = {
    NORTH_AMERICA: null,
    SOUTH_AMERICA: null,
    EUROPE: null,
    AFRICA: null,
    MIDDLE_EAST_SOUTH_ASIA: null,
    EAST_SOUTHEAST_ASIA: null,
    OCEANIA: null,
  };

  ALL_REGIONS.forEach((reg) => {
    const scores = regionalPax[reg];
    let topAirline: string | null = null;
    let topScore = 0;
    Object.entries(scores).forEach(([aId, pax]) => {
      if (pax > topScore) {
        topScore = pax;
        topAirline = aId;
      }
    });
    leadingAirlinePerRegion[reg] = topAirline;
  });

  // Evaluate each airline for Koei Victory Conditions:
  // Condition A: Regional Hubs in ALL 7 Regions
  // Condition B: #1 in passenger traffic in at least 5 regions (including home region)
  // Condition C: Airline is profitable (net profit > 0)
  for (const airline of updatedAirlines) {
    const standing = standings.find((s) => s.airlineId === airline.id);
    const isProfitable = (standing?.quarterProfitK || 0) > 0;

    // Check unique regions covered by hub cities (home base + regional hubs)
    const allHubIds = Array.from(new Set([airline.homeCityId, ...(airline.hubCityIds || [])]));
    const hubRegions = new Set(allHubIds.map((cId) => cityMap.get(cId)?.region).filter(Boolean));
    const hubsInAllRegions = ALL_REGIONS.every((reg) => hubRegions.has(reg));

    // Count regions where airline is #1
    const leadingRegions = ALL_REGIONS.filter((reg) => leadingAirlinePerRegion[reg] === airline.id);
    const homeCity = cityMap.get(airline.homeCityId);
    const leadsHomeRegion = homeCity ? leadingAirlinePerRegion[homeCity.region] === airline.id : false;
    const leadsTargetRegions = leadingRegions.length >= 5 && leadsHomeRegion;

    if (hubsInAllRegions && leadsTargetRegions && isProfitable) {
      isGameOver = true;
      winnerAirlineId = airline.id;
      victoryType = airline.isHuman ? 'EARLY_VICTORY' : 'RIVAL_VICTORY';
      victoryReason = airline.isHuman
        ? `SUPREME VICTORY! Your airline has conquered the global skies! You established Regional Hubs in all 7 continents, captured #1 passenger market share in ${leadingRegions.length}/7 global regions, and achieved stellar profitability!`
        : `GLOBAL DOMINATION BY RIVAL! ${airline.name} led by ${airline.ceoName || 'Rival Tycoon'} has established Hubs across all 7 continents and captured #1 passenger market share in ${leadingRegions.length} regions to win the game!`;

      victoryDetails = {
        winnerAirlineName: airline.name,
        isHuman: airline.isHuman,
        hubsCount: hubRegions.size,
        leadingRegionsCount: leadingRegions.length,
        totalPassengers: standing?.quarterPassengers || 0,
        totalValuationK: standing?.totalValuationK || 0,
        year: nextYear,
        quarter: nextQuarter,
      };
      break;
    }
  }

  // Check Defeat Conditions for Human Player:
  // 1. Unprofitable for 4 consecutive quarters (1 full calendar year)
  // 2. Severe debt / bankruptcy (cash < -$10,000K)
  const humanAirline = updatedAirlines.find((a) => a.isHuman);
  if (!isGameOver && humanAirline) {
    if ((humanAirline.consecutiveLossQuarters || 0) >= 4) {
      isGameOver = true;
      victoryType = 'BANKRUPTCY';
      defeatReason = `Your airline operated at a net financial loss for 4 consecutive quarters (1 full calendar year). The Board of Directors has declared insolvency and filed for bankruptcy.`;
      victoryReason = `AIRLINE BANKRUPTCY & FORECLOSURE! Unable to maintain operating profitability for 4 consecutive quarters.`;
    } else if (humanAirline.cashK < -10000) {
      isGameOver = true;
      victoryType = 'BANKRUPTCY';
      defeatReason = `Your airline exhausted all emergency liquidity reserves and accumulated -$${Math.abs(humanAirline.cashK).toLocaleString()}K in unserviceable debt. Creditors have foreclosed operations.`;
      victoryReason = `LIQUIDITY FORECLOSURE! Excessive debt obligations forced operations to shut down.`;
    }
  }

  // 20-Year Campaign Time Limit Expiration (Turn > 80)
  const isCampaign = currentState.gameMode === 'CAMPAIGN_20YR';
  if (!isGameOver && isCampaign && nextTurn > 80) {
    isGameOver = true;
    const champion = standings[0];
    winnerAirlineId = champion.airlineId;
    victoryType = champion.isHuman ? 'TIME_LIMIT_EXPIRED' : 'RIVAL_VICTORY';
    if (champion.isHuman) {
      victoryReason = `20-YEAR CAMPAIGN VICTORY! You conquered the skies across 20 intense years (80 Quarters)! Crowned World Airline Champion with a total empire valuation of $${champion.totalValuationK.toLocaleString()}K!`;
    } else {
      const humanRank = standings.find((s) => s.isHuman)?.rank || 2;
      victoryReason = `20-YEAR CAMPAIGN CONCLUDED! Rival airline "${champion.airlineName}" led by ${champion.ceoName || 'Rival Tycoon'} won 1st Place with $${champion.totalValuationK.toLocaleString()}K valuation. Your airline placed #${humanRank}.`;
    }
    victoryDetails = {
      winnerAirlineName: champion.airlineName,
      isHuman: champion.isHuman,
      hubsCount: new Set([champion.homeCityId, ...(champion.airlineId === humanAirline?.id ? humanAirline?.hubCityIds || [] : [])]).size,
      leadingRegionsCount: 0,
      totalPassengers: champion.quarterPassengers,
      totalValuationK: champion.totalValuationK,
      year: nextYear,
      quarter: nextQuarter,
    };
  }

  const eventTitles = [
    ...newActiveEvents.map((e) => e.title),
    ...airportExpansionNotices.map((n) => `🏗️ Airport Expansion: ${n.cityName} (+${n.addedSlots} slots)`),
    ...allAircraftDeliveries
      .filter((d) => d.status === 'DELIVERED')
      .map((d) => `✈️ Factory Delivery: ${d.airlineName} received ${d.quantity}x ${d.modelName}`),
    ...allAircraftDeliveries
      .filter((d) => d.status === 'DELAYED')
      .map((d) => `⚠️ Delivery Delay: ${d.airlineName}'s order of ${d.quantity}x ${d.modelName} postponed by manufacturer`),
  ];

  return {
    ...currentState,
    currentYear: nextYear,
    currentQuarter: nextQuarter,
    turnNumber: nextTurn,
    fuelPriceIndex: fuelMultiplier,
    activeEvents: newActiveEvents,
    upcomingEvents: getUpcomingWorldEvents(nextYear, nextQuarter, 4),
    airlines: updatedAirlines,
    routes: updatedRoutes,
    diplomaticReports,
    aircraftDeliveries: allAircraftDeliveries,
    airlineStandings: standings,
    isGameOver,
    victoryType,
    winnerAirlineId,
    victoryReason,
    victoryDetails,
    defeatReason,
    newlyIntroducedAircraft: newlyIntroduced,
    upcomingAircraft: upcomingAircraft,
    retiringAircraft: retiringAircraft,
    retiredAircraft: newlyRetired,
    activeDiscountDeal: nextDiscountDeal,
    airportSlots: currentAirportSlots,
    airportExpansions: airportExpansionNotices,
    ongoingAirportExpansions: updatedOngoingExpansions,
    lastQuarterClosedRoutes: allClosedRoutes,
    routeIncidents: routeIncidents,
    quarterHistory: [
      ...(currentState.quarterHistory || []),
      {
        year: currentState.currentYear,
        quarter: currentState.currentQuarter,
        humanProfitK: humanProfit,
        humanRevenueK: humanRevenue,
        humanPassengers: humanPassengers,
        events: eventTitles,
        standings,
      },
    ],
  };
}
