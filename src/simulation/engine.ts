import { City, AircraftModel, AircraftInstance, Route, RouteIncident, Airline, WorldEvent, GameState, DiplomaticReport, BusinessVenture, AirlineStanding, AircraftDiscountDeal } from '../types/game';
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
  aircraft: AircraftModel,
  aircraftInstance: AircraftInstance | undefined,
  currentQuarter: 1 | 2 | 3 | 4,
  fuelPriceIndex: number,
  totalMarketDemand: number,
  competingRoutesOnPair: Route[] = []
): {
  stats: NonNullable<Route['lastQuarterStats']>;
  incident?: RouteIncident;
} {
  const distance = calculateDistance(origin.lat, origin.lon, dest.lat, dest.lon);
  const weeks = 12; // 12 weeks per quarter
  const scheduledFlights = route.weeklyFrequency * weeks;

  // 1. Aircraft Aging & Maintenance Cost Escalation
  const ageYears = aircraftInstance?.ageYears || 0;
  let maintMultiplier = 1.0;
  if (ageYears > 24) maintMultiplier = 2.1;
  else if (ageYears > 18) maintMultiplier = 1.65;
  else if (ageYears > 12) maintMultiplier = 1.35;
  else if (ageYears > 6) maintMultiplier = 1.15;

  // 2. Flight Disruption Simulation (Weather & Aging Mechanical Breakdowns)
  let incident: RouteIncident | undefined = undefined;
  let lostFlights = 0;
  let emergencyCostK = 0;

  // Mechanical fault probability (scales with airframe age and long-haul wear)
  let mechRisk = 0.015;
  if (ageYears > 20) mechRisk += 0.08;
  else if (ageYears > 15) mechRisk += 0.05;
  else if (ageYears > 10) mechRisk += 0.025;
  if (distance > 8000) mechRisk += 0.02;

  const rollMech = Math.random();
  if (rollMech < mechRisk) {
    const flightLossRatio = 0.12 + Math.random() * 0.15; // 12% - 27% flights grounded
    lostFlights = Math.max(2, Math.round(scheduledFlights * flightLossRatio));
    emergencyCostK = Math.round((aircraft.priceK * 0.007 + distance * 0.025) * (1 + ageYears * 0.035));

    incident = {
      type: 'MECHANICAL',
      title: ageYears > 15 ? 'Engine & Airframe Fatigue Breakdown' : 'Hydraulic & Avionics System Fault',
      description: `Aging ${ageYears}-year-old ${aircraft.model} suffered technical breakdown on ${origin.name} - ${dest.name}, grounding ${lostFlights} flights for emergency depot repairs.`,
      lostFlights,
      emergencyCostK,
    };
  } else {
    // Seasonal Weather Incident (Typhoons in East Asia Q3, Blizzards in Europe/North America Q1/Q4, Monsoons in South Asia Q2/Q3)
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
      const flightLossRatio = 0.08 + Math.random() * 0.12; // 8% - 20% cancelled
      lostFlights = Math.max(2, Math.round(scheduledFlights * flightLossRatio));
      emergencyCostK = Math.round(lostFlights * 12 + 80); // Passenger meals, hotel accommodation & de-icing fees

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
  const seatCapacity = actualFlights * aircraft.capacity;

  // If route is explicitly suspended or paused, it operates 0 flights with 0 expenses
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

  // Safety range check: if distance exceeds aircraft capability, ground route and record incident
  if (distance > aircraft.rangeKm) {
    const rangeIncident: RouteIncident = {
      type: 'RANGE_EXCEEDED',
      title: 'Route Grounded: Aircraft Range Exceeded',
      description: `Flight rotation between ${origin.name} and ${dest.name} (${distance.toLocaleString()} km) grounded. The assigned ${aircraft.model} has a maximum certified range of ${aircraft.rangeKm.toLocaleString()} km. Please reassign a longer-range airframe.`,
      lostFlights: scheduledFlights,
      emergencyCostK: 0,
    };
    return {
      stats: {
        passengers: 0,
        capacity: seatCapacity,
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

  // Utility calculation (aging aircraft slightly reduces comfort utility)
  const effectiveComfort = Math.max(30, aircraft.comfortRating - Math.floor(ageYears * 0.7));
  const priceRatio = effectivePrice / baseFare;
  let utility =
    -2.0 * priceRatio +
    0.65 * Math.log(Math.max(1, route.weeklyFrequency)) +
    0.015 * effectiveComfort;
  if (aircraft.isSupersonic) utility += 0.8; // High-paying business travelers love Supersonic
  if (route.serviceQuality > 1.0) utility += 0.25;

  // Market share resolver against competing airlines
  let share = 1.0;
  if (competingRoutesOnPair.length > 0) {
    const totalExp = Math.exp(utility) + competingRoutesOnPair.length * Math.exp(-0.5);
    share = Math.exp(utility) / totalExp;
  } else {
    // Single operator on route: price elasticity determines demand conversion
    if (route.priceModifierPct > 0) {
      share = Math.max(0.4, 1.0 - (route.priceModifierPct / 100) * 0.7);
    } else {
      share = Math.min(1.4, 1.0 + (Math.abs(route.priceModifierPct) / 100) * 0.6);
    }
  }

  const demandedPax = Math.round(totalMarketDemand * share);
  const actualPassengers = Math.min(demandedPax, seatCapacity);
  const loadFactorPct = Math.round((actualPassengers / seatCapacity) * 100);

  // Revenue in $K
  const revenueK = Math.round((actualPassengers * effectivePrice) / 1000);

  // Expenses in $K (scaled by actual flights flown + age maintenance multiplier + emergency cost)
  const totalDistance = actualFlights * distance;
  const fuelCostK = Math.round((totalDistance * aircraft.fuelBurnPerKm * 0.85 * fuelPriceIndex) / 1000);

  const flightHours = totalDistance / aircraft.speedKmh;
  const maintCostK = Math.round((flightHours * aircraft.maintCostPerHour * maintMultiplier) / 1000);

  const airportFeesK = Math.round((actualFlights * (distance * 0.035 + 450)) / 1000);

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

    // Find assigned aircraft model
    let instance = intermediateAirlines
      .flatMap((a) => a.fleet)
      .find((f) => route.assignedAircraftIds.includes(f.instanceId));
    let model = instance ? aircraftMap.get(instance.modelId) : null;

    // Safety fallback: If assignedAircraftIds became detached or unlinked, locate the owning airline's fleet
    if (!model) {
      const owningAirline = intermediateAirlines.find((a) => a.id === route.airlineId);
      if (owningAirline && owningAirline.fleet.length > 0) {
        instance = owningAirline.fleet[0];
        model = aircraftMap.get(instance.modelId) || null;
      }
    }

    if (!model) return route;

    const baseDemand = calculateRouteDemand(origin, dest, nextYear, nextQuarter, newActiveEvents);

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
      model,
      instance,
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
  const isNewYear = nextQuarter === 1 && nextYear !== currentState.currentYear;

  const updatedAirlines: Airline[] = intermediateAirlines.map((airline) => {
    const airlineRoutes = updatedRoutes.filter((r) => r.airlineId === airline.id);
    let netRouteProfitK = 0;

    // Increment aircraft age and update condition on new calendar year
    const updatedFleet = airline.fleet.map((plane) => {
      const newAge = isNewYear ? (plane.ageYears || 0) + 1 : (plane.ageYears || 0);
      const newCondition = Math.max(35, Math.round(100 - newAge * 2.5));
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
            const slotsToAdd = mission.requestedSlots || 10;
            updatedSlots[mission.targetCityId] = (updatedSlots[mission.targetCityId] || 0) + slotsToAdd;

            if (airline.isHuman) {
              diplomaticReports.push({
                id: `DIP_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                negotiatorName: neg.name,
                avatarId: neg.avatarId,
                targetCityName: mission.targetCityName,
                type: 'SLOT_NEGOTIATION',
                success: true,
                slotsGranted: slotsToAdd,
                message: `Treaty negotiations concluded with civil aviation officials in ${mission.targetCityName}! Officially awarded ${slotsToAdd} landing slots.`,
              });
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

    return {
      ...airline,
      fleet: updatedFleet,
      cashK: newCash,
      slots: updatedSlots,
      businesses: updatedBusinesses,
      hubCityIds: updatedHubs,
      negotiators: updatedNegotiators,
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

  // 5. Evaluate Victory Condition for 20-Year Campaign Mode
  let isGameOver = false;
  let winnerAirlineId: string | undefined = undefined;
  let victoryReason: string | undefined = undefined;

  const isCampaign = currentState.gameMode === 'CAMPAIGN_20YR';
  if (isCampaign && nextTurn > 80) {
    isGameOver = true;
    const champion = standings[0];
    winnerAirlineId = champion.airlineId;
    if (champion.isHuman) {
      victoryReason = `VICTORY! You have conquered the skies across 20 intense years (80 Quarters)! Crowned World Airline Champion with a total empire valuation of $${champion.totalValuationK.toLocaleString()}K!`;
    } else {
      const humanRank = standings.find((s) => s.isHuman)?.rank || 2;
      victoryReason = `20-YEAR CAMPAIGN CONCLUDED! Rival airline "${champion.airlineName}" led by ${champion.ceoName || 'Rival Tycoon'} won 1st Place with $${champion.totalValuationK.toLocaleString()}K valuation. Your airline placed #${humanRank}.`;
    }
  }

  const eventTitles = newActiveEvents.map((e) => e.title);

  return {
    ...currentState,
    currentYear: nextYear,
    currentQuarter: nextQuarter,
    turnNumber: nextTurn,
    fuelPriceIndex: fuelMultiplier,
    activeEvents: newActiveEvents,
    airlines: updatedAirlines,
    routes: updatedRoutes,
    diplomaticReports,
    airlineStandings: standings,
    isGameOver,
    winnerAirlineId,
    victoryReason,
    newlyIntroducedAircraft: newlyIntroduced,
    upcomingAircraft: upcomingAircraft,
    retiringAircraft: retiringAircraft,
    retiredAircraft: newlyRetired,
    activeDiscountDeal: nextDiscountDeal,
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
