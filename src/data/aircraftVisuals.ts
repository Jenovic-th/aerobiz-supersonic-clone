import { AircraftModel } from '../types/game';

export interface AircraftPhotoInfo {
  photoUrl: string;
  caption: string;
  airlineLivery: string;
  flightContext: string;
  manufacturerWatermark: string;
  badgeType: 'SUPERSONIC' | 'WIDEBODY' | 'NARROWBODY' | 'JUMBO' | 'FUTURE';
}

export function getAircraftPhotoInfo(model: AircraftModel): AircraftPhotoInfo {
  const id = model.id.toUpperCase();

  // 1. Concorde Supersonic
  if (id.includes('CONCORDE')) {
    return {
      photoUrl: './aircrafts/concorde.jpg',
      caption: 'Concorde Mach 2.04 Stratospheric Supersonic Cruise',
      airlineLivery: 'British Airways / Aérospatiale-BAC Supersonic Livery',
      flightContext: 'FL600 Stratospheric Transatlantic Corridor',
      manufacturerWatermark: 'AÉROSPATIALE / BAC',
      badgeType: 'SUPERSONIC',
    };
  }

  // 2. Boom Overture / Next-Gen Supersonic
  if (id.includes('BOOM') || id.includes('OVERTURE')) {
    return {
      photoUrl: './aircrafts/boom.jpg',
      caption: 'Boom Overture Mach 1.7 Next-Gen Supersonic Airliner',
      airlineLivery: 'Boom Commercial Flight Prototype Livery',
      flightContext: 'High-Altitude Transoceanic Supersonic Corridor',
      manufacturerWatermark: 'BOOM SUPERSONIC AEROSPACE',
      badgeType: 'SUPERSONIC',
    };
  }

  // 3. Sci-Fi Hypersonic & Point-to-Point Spaceplanes
  if (
    id.includes('STARLINER') ||
    id.includes('AEROSTAR') ||
    id.includes('MACH4') ||
    id.includes('B797') ||
    id.includes('ZEROE')
  ) {
    return {
      photoUrl: './aircrafts/future.jpg',
      caption: 'Hypersonic Sub-Orbital Point-to-Point Spaceplane',
      airlineLivery: 'Mirror-Finish Stainless Thermal Hull & Ion Thrusters',
      flightContext: 'Mesosphere Sub-Orbital Trajectory (Mach 5.0+)',
      manufacturerWatermark: 'ADVANCED AEROSPACE INITIATIVE',
      badgeType: 'FUTURE',
    };
  }

  // 4. Boeing 747 Queen of the Skies
  if (id.includes('747')) {
    return {
      photoUrl: './aircrafts/b747.jpg',
      caption: 'Boeing 747 Queen of the Skies Intercontinental Jumbo',
      airlineLivery: 'Lufthansa Intercontinental Double-Deck Livery',
      flightContext: 'Cruising at 38,000 ft High-Density Long-Haul Corridor',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'JUMBO',
    };
  }

  // 5. Airbus A380 Superjumbo
  if (id.includes('380')) {
    return {
      photoUrl: './aircrafts/a380.jpg',
      caption: 'Airbus A380-800 Double-Decker Superjumbo',
      airlineLivery: 'Emirates Ultra-Long-Range Flagship Livery',
      flightContext: 'Cruising Above High Clouds Transcontinental Hub Route',
      manufacturerWatermark: 'AIRBUS INDUSTRIE',
      badgeType: 'JUMBO',
    };
  }

  // 6. First-Gen Classic Quadjets: DC-8 & Boeing 707
  if (id.includes('707')) {
    return {
      photoUrl: './aircrafts/b707.jpg',
      caption: 'Boeing 707-320B Intercontinental Quad-Jet',
      airlineLivery: 'Pan American World Airways Classic Globe Livery',
      flightContext: 'Pioneer Transatlantic Jet Route in Blue Skies',
      manufacturerWatermark: 'BOEING AIRPLANE COMPANY',
      badgeType: 'NARROWBODY',
    };
  }
  if (id.includes('DC-8')) {
    return {
      photoUrl: './aircrafts/dc8.jpg',
      caption: 'McDonnell Douglas DC-8-62 Super Long-Range Quad-Jet',
      airlineLivery: 'Braniff International Polished Bare-Metal Livery',
      flightContext: 'Cruising Above Pacific Coastal Clouds',
      manufacturerWatermark: 'MCDONNELL DOUGLAS',
      badgeType: 'NARROWBODY',
    };
  }

  // 7. T-Tail Trijet: Boeing 727 & Tupolev Tu-154
  if (id.includes('727')) {
    return {
      photoUrl: './aircrafts/b727.jpg',
      caption: 'Boeing 727-200 Advanced Trijet T-Tail',
      airlineLivery: 'American Airlines Polished Aluminum Retro Livery',
      flightContext: 'High-Speed Transcontinental Route Above Cloud Deck',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'NARROWBODY',
    };
  }

  // 8. Widebody Trijets: DC-10, MD-11, L-1011 TriStar
  if (id.includes('DC-10') || id.includes('MD-11') || id.includes('L-1011')) {
    return {
      photoUrl: './aircrafts/dc10.jpg',
      caption: 'McDonnell Douglas DC-10-30 Intercontinental Trijet',
      airlineLivery: 'Continental Airlines Golden Tail Jet Livery',
      flightContext: 'Transoceanic Crossing Over Deep Blue Waters',
      manufacturerWatermark: 'MCDONNELL DOUGLAS',
      badgeType: 'WIDEBODY',
    };
  }

  // 9. Soviet Aviation: Ilyushin Il-86, Il-96, Tu-154, Tu-204
  if (id.includes('IL-86') || id.includes('IL-96') || id.includes('154') || id.includes('204')) {
    return {
      photoUrl: './aircrafts/soviet.jpg',
      caption: `${model.model} Heavy Airliner`,
      airlineLivery: 'Aeroflot Soviet Civil Aviation Directorate',
      flightContext: 'Cruising Northern Airway Above Snow-Covered Terrain',
      manufacturerWatermark: 'ILYUSHIN / TUPOLEV DESIGN BUREAU',
      badgeType: id.includes('IL') ? 'WIDEBODY' : 'NARROWBODY',
    };
  }

  // 10. Modern Flagship Twinjets: Boeing 777, 787, Airbus A350
  if (
    id.includes('777') ||
    id.includes('787') ||
    id.includes('350') ||
    id.includes('B777') ||
    id.includes('A350')
  ) {
    return {
      photoUrl: './aircrafts/b777.jpg',
      caption: `${model.model} Twin-Aisle Long-Range Airliner`,
      airlineLivery: 'Emirates Commercial Long-Haul Livery',
      flightContext: 'Climbing Through Warm Sunset Cloudscape',
      manufacturerWatermark: model.manufacturer.toUpperCase(),
      badgeType: 'WIDEBODY',
    };
  }

  // 11. Early & Mid Widebody Twinjets: Airbus A300, A330, Boeing 767
  if (id.includes('300') || id.includes('330') || id.includes('767')) {
    return {
      photoUrl: './aircrafts/a300.jpg',
      caption: `${model.model} Widebody Twinjet`,
      airlineLivery: 'Air France European Intercity Livery',
      flightContext: 'Cruising Over European Alpine Mountains',
      manufacturerWatermark: model.manufacturer.toUpperCase(),
      badgeType: 'WIDEBODY',
    };
  }

  // 12. Standard Narrowbody Airliners: Boeing 737, 757, Airbus A320, A320neo, A321XLR
  return {
    photoUrl: '/aircrafts/b737.jpg',
    caption: `${model.model} High-Efficiency Narrowbody Jet`,
    airlineLivery: 'Alaska Airlines Modern Commercial Livery',
    flightContext: 'Cruising in Sunlight Above Towering Cumulus Clouds',
    manufacturerWatermark: model.manufacturer.toUpperCase(),
    badgeType: 'NARROWBODY',
  };
}
