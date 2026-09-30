export type RegionId = 
  | 'NORTH_AMERICA'
  | 'SOUTH_AMERICA'
  | 'EUROPE'
  | 'AFRICA'
  | 'MIDDLE_EAST_SOUTH_ASIA'
  | 'EAST_SOUTHEAST_ASIA'
  | 'OCEANIA';

export interface City {
  id: string;
  name: string;
  country: string;
  region: RegionId;
  lat: number;
  lon: number;
  population: number; // Millions (e.g. 14.0 for Tokyo)
  businessIndex: number; // 1 - 100
  tourismIndex: number; // 1 - 100
  baseSlots: number;
  bloc: 'WEST' | 'EAST' | 'NEUTRAL';
}

export type Manufacturer = 
  | 'Boeing' 
  | 'Airbus' 
  | 'McDonnell Douglas' 
  | 'Lockheed' 
  | 'Ilyushin' 
  | 'Tupolev' 
  | 'Aérospatiale' 
  | 'Boom Supersonic'
  | 'Tesla Aerospace'
  | 'SpaceX';

export type GameMode = 'CAMPAIGN_20YR' | 'SANDBOX_INFINITE';

export interface AircraftModel {
  id: string;
  model: string;
  manufacturer: Manufacturer;
  originBloc: 'WEST' | 'EAST';
  introYear: number;
  retireYear?: number;
  capacity: number; // Passenger seats
  rangeKm: number; // Max range in km
  speedKmh: number; // Speed km/h (Concorde/Boom ~1800-2200, Subsonic ~850-920)
  fuelBurnPerKm: number; // Fuel rating
  maintCostPerHour: number; // Maintenance cost factor
  priceK: number; // Price in $K (e.g. 135000 = $135M)
  comfortRating: number; // 1 - 100
  isSupersonic?: boolean;
  era: 1 | 2 | 3;
  wingspanM?: number;
  lengthM?: number;
  heightM?: number;
  mtowTon?: number;
  engineType?: string;
  cabinAisle?: string;
  serviceCeilingFt?: number;
}

export interface AircraftInstance {
  instanceId: string;
  modelId: string;
  ageYears: number;
  purchaseYear?: number;
  conditionPct?: number; // 0 - 100% mechanical health
  assignedRouteId: string | null;
}

export interface RouteIncident {
  type: 'WEATHER' | 'MECHANICAL' | 'AIR_TRAFFIC' | 'RANGE_EXCEEDED';
  title: string;
  description: string;
  lostFlights: number; // Number of cancelled flights this quarter
  emergencyCostK: number; // Repair & passenger care expense in $K
}

export interface Route {
  id: string;
  airlineId: string;
  originCityId: string;
  destCityId: string;
  assignedAircraftIds: string[]; // List of aircraft instance IDs
  weeklyFrequency: number; // 1 - 14 flights / week
  priceModifierPct: number; // -50% to +50% (0 = normal base fare)
  serviceQuality: number; // 1.0 = standard, 1.2 = premium
  status: 'ACTIVE' | 'SUSPENDED';
  consecutiveLossQuarters?: number; // Quarters consecutively running at a loss
  lastQuarterIncident?: RouteIncident; // Incident recorded in last quarter
  
  // Last quarter results
  lastQuarterStats?: {
    passengers: number;
    capacity: number;
    loadFactorPct: number;
    revenueK: number;
    expensesK: number;
    profitK: number;
    actualFlightsCompleted?: number;
    scheduledFlights?: number;
  };
}

export interface AircraftDiscountDeal {
  id: string;
  manufacturer: Manufacturer;
  discountPct: number; // e.g. 30, 40, 50%
  specificModelId?: string; // If omitted, applies to all models of this manufacturer
  modelName: string;
  quartersRemaining: number;
  reason: string;
}

export type BusinessVentureType =
  | 'HOTEL'
  | 'SHUTTLE_BUS'
  | 'TRAVEL_AGENCY'
  | 'AMUSEMENT_PARK'
  | 'GOLF_COURSE'
  | 'SKI_RESORT'
  | 'MUSEUM'
  | 'CONCERT_HALL'
  | 'ARTS_PAVILION'
  | 'PLEASURE_BOAT'
  | 'FERRY_BOAT'
  | 'COMMUTER_AIRLINE';

export interface BusinessVenture {
  id: string;
  cityId: string;
  airlineId: string;
  type: BusinessVentureType;
  name: string;
  purchaseCostK: number;
  quarterlyDividendK: number;
  tourismBoost: number;
}

export type CampaignCategory = 'CULTURE_ART' | 'LEISURE_SPORTS' | 'TRAVEL_NETWORK';

export interface RegionalCampaign {
  id: string;
  airlineId: string;
  regionId: RegionId;
  regionName?: string;
  category: CampaignCategory;
  name: string;
  quartersRemaining: number; // 4 quarters (1 year duration)
  demandBoostPct: number; // e.g. 15 = +15%
  costK: number;
}

export interface WorldEvent {
  id: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  type: 'WORLD_CUP' | 'EURO' | 'OLYMPICS' | 'WAR' | 'OIL_CRISIS' | 'EPIDEMIC' | 'ECONOMIC_CRISIS' | 'EXPO' | 'TOURISM_YEAR' | 'HISTORIC_EVENT';
  title: string;
  description: string;
  affectedCityIds?: string[];
  affectedRegionIds?: RegionId[];
  demandMultiplier?: number; // e.g. 2.0 = +100% demand
  fuelPriceMultiplier?: number; // e.g. 1.8 = oil crisis
  durationQuarters: number;
}

export interface UpcomingWorldEvent {
  event: WorldEvent;
  quartersUntil: number; // 1 = 3 months, 2 = 6 months, 3 = 9 months, 4 = 12 months
  estimatedDemandSurgePct: number; // e.g. +120%
}

export interface NegotiatorMission {
  type: 'SLOT_NEGOTIATION' | 'SUBSIDIARY_ACQUISITION' | 'ESTABLISH_HUB';
  targetCityId: string;
  targetCityName: string;
  requestedSlots?: number;
  ventureType?: BusinessVenture['type'];
  ventureName?: string;
  costK: number;
  quartersRemaining: number;
  totalQuarters: number;
}

export interface Negotiator {
  id: string;
  name: string;
  title: string;
  avatarId: 'john' | 'kenji' | 'sarah' | 'elena' | 'david';
  role: 'FIELD' | 'HQ';
  status: 'AVAILABLE' | 'DISPATCHED';
  currentMission?: NegotiatorMission;
}

export interface DiplomaticReport {
  id: string;
  negotiatorName: string;
  avatarId: string;
  targetCityName: string;
  type: 'SLOT_NEGOTIATION' | 'SUBSIDIARY_ACQUISITION' | 'ESTABLISH_HUB';
  success: boolean;
  slotsGranted?: number;
  message: string;
}

export interface PendingAircraftOrder {
  orderId: string;
  airlineId: string;
  modelId: string;
  modelName: string;
  manufacturer: Manufacturer;
  quantity: number;
  unitPriceK: number;
  totalCostK: number;
  orderYear: number;
  orderQuarter: 1 | 2 | 3 | 4;
  deliveryYear: number;
  deliveryQuarter: 1 | 2 | 3 | 4;
  status: 'PENDING' | 'DELAYED' | 'DELIVERED';
  delayReason?: string;
}

export interface AircraftDeliveryReport {
  orderId: string;
  airlineId: string;
  airlineName: string;
  modelName: string;
  quantity: number;
  status: 'DELIVERED' | 'DELAYED';
  message: string;
}

export interface Airline {
  id: string;
  name: string;
  color: string;
  isHuman: boolean;
  homeCityId: string;
  hubCityIds: string[]; // Cities with established regional hubs
  cashK: number;
  slots: Record<string, number>; // cityId -> count of slots owned
  fleet: AircraftInstance[];
  pendingOrders?: PendingAircraftOrder[]; // Factory orders awaiting delivery in next quarter
  businesses: BusinessVenture[];
  negotiators: Negotiator[];
  ceoName?: string;
  personality?: 'AGGRESSIVE' | 'BALANCED' | 'LUXURY' | 'REGIONAL' | 'BUDGET_DISCOUNTER' | 'GLOBAL_FLAGSHIP';
  activeCampaigns?: RegionalCampaign[];
  consecutiveLossQuarters?: number;
  avatarId?: string;
  aiActionLog?: string[]; // Decisions and actions performed in recent quarter
}

export interface AirlineStanding {
  rank: number;
  airlineId: string;
  airlineName: string;
  airlineColor: string;
  isHuman: boolean;
  ceoName?: string;
  personality?: string;
  homeCityId: string;
  totalValuationK: number; // Cash + Fleet value + Business venture value
  cashK: number;
  fleetValueK: number;
  businessValueK: number;
  quarterProfitK: number;
  quarterRevenueK: number;
  quarterExpensesK: number;
  quarterPassengers: number;
  activeRoutesCount: number;
  fleetCount: number;
}

export interface AirportExpansionNotice {
  cityId: string;
  cityName: string;
  addedSlots: number;
  newTotalSlots: number;
  reason: string;
}

export interface OngoingAirportExpansion {
  cityId: string;
  cityName: string;
  addedSlots: number;
  quartersRemaining: number;
  totalQuarters: number;
  reason: string;
}

export interface GameState {
  gameMode: GameMode;
  era: 1 | 2 | 3;
  startYear: number;
  endYear: number;
  currentYear: number;
  currentQuarter: 1 | 2 | 3 | 4;
  turnNumber: number; // 1 to 80 (or unlimited in Sandbox)
  maxTurns?: number; // 80 for Campaign, undefined for Sandbox
  fuelPriceIndex: number; // Base 1.0, fluctuates with wars/crises
  airlines: Airline[];
  routes: Route[];
  activeEvents: WorldEvent[];
  upcomingEvents?: UpcomingWorldEvent[]; // Forecast of major events arriving in the next 1-4 quarters (3-12 months)
  airlineStandings?: AirlineStanding[];
  quarterHistory: {
    year: number;
    quarter: number;
    humanProfitK: number;
    humanRevenueK: number;
    humanPassengers: number;
    events: string[];
    standings?: AirlineStanding[];
  }[];
  diplomaticReports?: DiplomaticReport[];
  isGameOver?: boolean;
  victoryType?: 'EARLY_VICTORY' | 'BANKRUPTCY' | 'TIME_LIMIT_EXPIRED' | 'RIVAL_VICTORY';
  winnerAirlineId?: string;
  victoryReason?: string;
  victoryDetails?: {
    winnerAirlineName: string;
    isHuman: boolean;
    hubsCount: number;
    leadingRegionsCount: number;
    totalPassengers: number;
    totalValuationK: number;
    year: number;
    quarter: number;
  };
  defeatReason?: string;
  newlyIntroducedAircraft?: AircraftModel[];
  upcomingAircraft?: AircraftModel[]; // Aircraft entering service in 1 year (advance notice)
  retiringAircraft?: AircraftModel[]; // Aircraft ceasing commercial production in 1 year (end-of-production advance notice!)
  retiredAircraft?: AircraftModel[]; // Aircraft that have ceased production this quarter
  activeDiscountDeal?: AircraftDiscountDeal; // Special flash manufacturer discount promotion
  airportSlots?: Record<string, number>; // Dynamic total airport slot capacity per city
  airportExpansions?: AirportExpansionNotice[]; // Airport expansion events this quarter
  ongoingAirportExpansions?: OngoingAirportExpansion[]; // Runway & terminal projects currently under construction
  lastQuarterClosedRoutes?: {
    airlineId: string;
    airlineName: string;
    airlineColor: string;
    originCityId: string;
    destCityId: string;
    lossK: number;
  }[];
  routeIncidents?: {
    routeId: string;
    airlineId: string;
    airlineName: string;
    airlineColor: string;
    originCityName: string;
    destCityName: string;
    incident: RouteIncident;
  }[];
  aircraftDeliveries?: AircraftDeliveryReport[]; // Aircraft delivered or delayed this quarter
}

