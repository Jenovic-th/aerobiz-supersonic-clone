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

  // 1. Concorde & Super Concorde Supersonic
  if (id.includes('CONCORDE')) {
    return {
      photoUrl: './aircrafts/concorde.jpg',
      caption: model.model || 'Concorde Mach 2.04 Stratospheric Supersonic Cruise',
      airlineLivery: 'British Airways / Aérospatiale-BAC Supersonic Livery',
      flightContext: 'FL600 Stratospheric Transatlantic Corridor',
      manufacturerWatermark: 'AÉROSPATIALE / BAC',
      badgeType: 'SUPERSONIC',
    };
  }

  // 2. Boom Overture / Next-Gen Supersonic & QSST
  if (id.includes('BOOM') || id.includes('OVERTURE') || id.includes('QSST')) {
    return {
      photoUrl: './aircrafts/boom.jpg',
      caption: model.model || 'Boom Overture Mach 1.7 Next-Gen Supersonic Airliner',
      airlineLivery: 'Boom Commercial Flight Prototype Livery',
      flightContext: 'High-Altitude Transoceanic Supersonic Corridor',
      manufacturerWatermark: model.manufacturer.toUpperCase(),
      badgeType: 'SUPERSONIC',
    };
  }

  // 3. Sci-Fi Hypersonic, Suborbital & Futuristic Transports
  if (id.includes('STARLINER') || id.includes('STARSHIP')) {
    return {
      photoUrl: './aircrafts/spacex_starliner.jpg',
      caption: `${model.model} Commercial Suborbital StarLiner`,
      airlineLivery: 'SpaceX Commercial StarLiner Stainless Steel & Hex-Tile Hull',
      flightContext: 'Suborbital High-Earth Point-to-Point Orbit with Raptor Plumes',
      manufacturerWatermark: 'SPACEX COMMERCIAL SPACEFLIGHT',
      badgeType: 'FUTURE',
    };
  }
  if (id.includes('AEROSTAR') || id.includes('HYPERION')) {
    return {
      photoUrl: './aircrafts/tesla_aerostar.jpg',
      caption: `${model.model} Electric Hypersonic Transport`,
      airlineLivery: 'Tesla Aerospace Minimalist White & Red Ion Accents',
      flightContext: 'Stratospheric High-Speed Cruise at 65,000 ft with Plasma Thrusters',
      manufacturerWatermark: 'TESLA AEROSPACE',
      badgeType: 'FUTURE',
    };
  }
  if (id.includes('MACH4') || id.includes('SOLARIS') || id.includes('MACH6')) {
    return {
      photoUrl: './aircrafts/hyper_mach4.jpg',
      caption: `${model.model} Hypersonic Sovereign Transport`,
      airlineLivery: 'Lockheed Titanium Heat-Shield Polished Hull',
      flightContext: 'Mach 4.0+ High-Stratosphere Shockwave Cruise at 75,000 ft',
      manufacturerWatermark: 'LOCKHEED SKUNK WORKS',
      badgeType: 'FUTURE',
    };
  }
  if (id.includes('B797') || id.includes('TU404') || id.includes('404') || id.includes('808') || id.includes('QUANTUM')) {
    return {
      photoUrl: './aircrafts/b797_bwb.jpg',
      caption: `${model.model} Blended Wing Body Advanced Liner`,
      airlineLivery: 'Aerodynamic Lifting-Body Flagship Livery',
      flightContext: 'Smooth High-Efficiency Cruising Above Marine Clouds',
      manufacturerWatermark: model.manufacturer.toUpperCase(),
      badgeType: 'FUTURE',
    };
  }
  if (id.includes('ZEROE') || id.includes('CRYOFLEX')) {
    return {
      photoUrl: './aircrafts/airbus_zeroe.jpg',
      caption: `${model.model} Hydrogen Clean-Aero Airliner`,
      airlineLivery: 'Airbus Eco-Clean Cyan Hydrogen Livery',
      flightContext: 'Zero-Emission Hydrogen Turbofan Cruise at 38,000 ft',
      manufacturerWatermark: 'AIRBUS INDUSTRIE',
      badgeType: 'FUTURE',
    };
  }
  if (
    id.includes('ORBITAL') ||
    id.includes('GEN')
  ) {
    return {
      photoUrl: './aircrafts/future.jpg',
      caption: `${model.model}`,
      airlineLivery: 'Mirror-Finish Stainless Thermal Hull & Ion Thrusters',
      flightContext: 'Mesosphere Sub-Orbital Trajectory (Mach 5.0+)',
      manufacturerWatermark: model.manufacturer.toUpperCase(),
      badgeType: 'FUTURE',
    };
  }

  // 4. Boeing 747 Queen of the Skies
  if (id.includes('747-400') || id.includes('B747-400')) {
    return {
      photoUrl: './aircrafts/b747_400.jpg',
      caption: 'Boeing 747-400 Long-Haul Intercontinental Flagship',
      airlineLivery: 'British Airways World Flagship Livery',
      flightContext: 'Cruising at 39,000 ft with Angled Winglets Above Cloud Sea',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'JUMBO',
    };
  }
  if (id.includes('747-300') || id.includes('B747-300')) {
    return {
      photoUrl: './aircrafts/b747_300.jpg',
      caption: 'Boeing 747-300 Stretched Upper Deck (SUD)',
      airlineLivery: 'Swissair Classic Swiss Cross Livery',
      flightContext: 'High-Altitude Transcontinental Cruise (Clean Wingtips)',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'JUMBO',
    };
  }
  if (id.includes('747-8') || id.includes('B747-8')) {
    return {
      photoUrl: './aircrafts/b747_8i.jpg',
      caption: 'Boeing 747-8 Intercontinental Advanced Jumbo',
      airlineLivery: 'Lufthansa Modern Deep Blue Livery',
      flightContext: 'Cruising at FL390 with Scalloped Chevron GEnx-2B Engines',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'JUMBO',
    };
  }
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

  // 8. Lockheed L-1011 TriStar
  if (id.includes('L-1011')) {
    return {
      photoUrl: './aircrafts/l1011.jpg',
      caption: 'Lockheed L-1011 TriStar Advanced Widebody Trijet',
      airlineLivery: 'Eastern Air Lines Whisperliner Classic Livery',
      flightContext: 'Transcontinental Cruising Above Golden Cloudscape',
      manufacturerWatermark: 'LOCKHEED CORPORATION',
      badgeType: 'WIDEBODY',
    };
  }

  // 9. McDonnell Douglas MD-82
  if (id.includes('MD-82') || id.includes('MD82')) {
    return {
      photoUrl: './aircrafts/md82.jpg',
      caption: 'McDonnell Douglas MD-82 Twin-Jet Airliner',
      airlineLivery: 'American Airlines Classic Bare-Metal Livery',
      flightContext: 'High-Altitude Banking Cruise Over Cumulus Deck',
      manufacturerWatermark: 'MCDONNELL DOUGLAS',
      badgeType: 'NARROWBODY',
    };
  }

  // 10. McDonnell Douglas MD-11
  if (id.includes('MD-11') || id.includes('MD11')) {
    return {
      photoUrl: './aircrafts/md11.jpg',
      caption: 'McDonnell Douglas MD-11 Widebody Trijet Flagship',
      airlineLivery: 'KLM Royal Dutch Airlines Classic Clean Livery',
      flightContext: 'Cruising Above Extensive Stratocumulus at 38,000 ft',
      manufacturerWatermark: 'MCDONNELL DOUGLAS',
      badgeType: 'WIDEBODY',
    };
  }

  // 11. McDonnell Douglas DC-10 & MD2000
  if (
    id.includes('DC-10') ||
    id.includes('MD-80') ||
    id.includes('MD2000')
  ) {
    return {
      photoUrl: './aircrafts/dc10.jpg',
      caption: `${model.model}`,
      airlineLivery: 'Continental Airlines Golden Tail Jet Livery',
      flightContext: 'Transoceanic Crossing Over Deep Blue Waters',
      manufacturerWatermark: 'MCDONNELL DOUGLAS',
      badgeType: id.includes('MD-80') ? 'NARROWBODY' : 'WIDEBODY',
    };
  }

  // 11. Tupolev Tu-154B
  if (id.includes('154') || id.includes('TU-154')) {
    return {
      photoUrl: './aircrafts/tu154.jpg',
      caption: 'Tupolev Tu-154B Trijet Passenger Airliner',
      airlineLivery: 'Aeroflot Soviet Civil Aviation Classic Livery',
      flightContext: 'Cruising High Altitude Over Alpine Mountain Peaks',
      manufacturerWatermark: 'TUPOLEV DESIGN BUREAU',
      badgeType: 'NARROWBODY',
    };
  }

  // 12. Ilyushin Il-86
  if (id.includes('IL-86') || id.includes('IL86')) {
    return {
      photoUrl: './aircrafts/il86.jpg',
      caption: 'Ilyushin Il-86 Widebody Quadjet Heavy Airliner',
      airlineLivery: 'Aeroflot Soviet Civil Aviation Flagship Livery',
      flightContext: 'Cruising Above Extensive Cloud Sea in Sunlight',
      manufacturerWatermark: 'ILYUSHIN DESIGN BUREAU',
      badgeType: 'WIDEBODY',
    };
  }

  // 13. Ilyushin Il-96-300
  if (id.includes('IL-96') || id.includes('IL96')) {
    return {
      photoUrl: './aircrafts/il96_300.jpg',
      caption: 'Ilyushin Il-96-300 Long-Haul Quadjet Flagship',
      airlineLivery: 'Aeroflot Russian International Airlines Modern Livery',
      flightContext: 'Transpolar Long-Range Route with Winglets at FL380',
      manufacturerWatermark: 'ILYUSHIN AVIATION COMPLEX',
      badgeType: 'WIDEBODY',
    };
  }

  // 14. Tupolev Tu-204
  if (id.includes('204') || id.includes('TU-204')) {
    return {
      photoUrl: './aircrafts/tu204.jpg',
      caption: 'Tupolev Tu-204 Modern Medium-Haul Twinjet',
      airlineLivery: 'Rossiya Special Flight Squadron Flagship Livery',
      flightContext: 'Cruising Above Snow-Capped Alpine Mountain Ranges',
      manufacturerWatermark: 'TUPOLEV DESIGN BUREAU',
      badgeType: 'NARROWBODY',
    };
  }

  // 15. Soviet Aviation: Ilyushin Il-62, Tu-404
  if (
    id.includes('IL-') ||
    id.includes('404') ||
    model.manufacturer.toLowerCase().includes('ilyushin') ||
    model.manufacturer.toLowerCase().includes('tupolev')
  ) {
    return {
      photoUrl: './aircrafts/soviet.jpg',
      caption: `${model.model} Heavy Airliner`,
      airlineLivery: 'Aeroflot Civil Aviation Directorate',
      flightContext: 'Cruising Northern Airway Above Snow-Covered Terrain',
      manufacturerWatermark: `${model.manufacturer.toUpperCase()} DESIGN BUREAU`,
      badgeType: id.includes('404') ? 'WIDEBODY' : 'NARROWBODY',
    };
  }

  // 16. Boeing 777 Family
  if (id === 'B777-200' || (id.includes('777-200') && !id.includes('ER'))) {
    return {
      photoUrl: './aircrafts/b777_200.jpg',
      caption: 'Boeing 777-200 Original Triple-Seven Widebody',
      airlineLivery: 'United Airlines Battleship Gray / Blue Fleet Livery',
      flightContext: 'Cruising Above High Clouds with Massive GE90 Turbofans',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'WIDEBODY',
    };
  }
  if (id.includes('777-200ER') || id.includes('B777-200ER')) {
    return {
      photoUrl: './aircrafts/b777_200er.jpg',
      caption: 'Boeing 777-200ER Extended Range Flagship Twinjet',
      airlineLivery: 'Singapore Airlines Golden Bird Flagship Livery',
      flightContext: 'Transpacific High-Altitude Long-Haul Cruise at FL370',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'WIDEBODY',
    };
  }
  if (id.includes('777-300ER') || id.includes('B777-300ER')) {
    return {
      photoUrl: './aircrafts/b777_300er.jpg',
      caption: 'Boeing 777-300ER Stretched Flagship Twinjet',
      airlineLivery: 'Emirates Intercontinental Flagship Livery',
      flightContext: 'Golden Hour Cruise with Raked Wingtips and GE90-115B',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'WIDEBODY',
    };
  }

  // 17. Boeing 787 Dreamliner
  if (id.includes('787') || id.includes('B787')) {
    return {
      photoUrl: './aircrafts/b787_9.jpg',
      caption: 'Boeing 787-9 Dreamliner Advanced Composite Twinjet',
      airlineLivery: 'All Nippon Airways (ANA) Inspiration of Japan Livery',
      flightContext: 'High-Altitude Cruise with Swooping Flexed Wings at FL400',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'WIDEBODY',
    };
  }

  // 18. Modern Flagship Widebodies: A350-1000, A350-900, B777-9X
  if (id.includes('A350-1000') || id.includes('350-1000')) {
    return {
      photoUrl: './aircrafts/a350_1000.jpg',
      caption: 'Airbus A350-1000 Stretched Flagship Widebody',
      airlineLivery: 'Cathay Pacific Asian Intercontinental Livery',
      flightContext: 'Sunset Cruise with 6-Wheel Bogies & Rolls-Royce Trent XWB-97',
      manufacturerWatermark: 'AIRBUS INDUSTRIE',
      badgeType: 'WIDEBODY',
    };
  }
  if (id.includes('A350') || id.includes('350')) {
    return {
      photoUrl: './aircrafts/a350_900.jpg',
      caption: 'Airbus A350-900 XWB Modern Flagship Twinjet',
      airlineLivery: 'Airbus Carbon Composite Flagship House Livery',
      flightContext: 'Sunrise High-Altitude Cruise Above Clouds with Curved Winglets',
      manufacturerWatermark: 'AIRBUS INDUSTRIE',
      badgeType: 'WIDEBODY',
    };
  }
  if (id.includes('777-9') || id.includes('B777-9')) {
    return {
      photoUrl: './aircrafts/b777_9x.jpg',
      caption: 'Boeing 777-9X Folding-Wingtip Ultra-Widebody',
      airlineLivery: 'Boeing Commercial Commercial Next-Gen Livery',
      flightContext: 'Golden Hour Cruise with Folding Wingtips and Massive GE9X',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'WIDEBODY',
    };
  }
  if (
    id.includes('777') ||
    id.includes('B777')
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

  // 18. Boeing 767-300ER Stretched Widebody
  if (id.includes('767-300') || id.includes('B767-300')) {
    return {
      photoUrl: './aircrafts/b767_300er.jpg',
      caption: 'Boeing 767-300ER Extended-Range Widebody Twinjet',
      airlineLivery: 'Delta Air Lines Modern Flagship Livery',
      flightContext: 'Transatlantic ETOPS Crossing Above Ocean Cloudscape',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'WIDEBODY',
    };
  }

  // 19. Boeing 767-200
  if (id.includes('767') || id.includes('B767')) {
    return {
      photoUrl: './aircrafts/b767_200.jpg',
      caption: `${model.model} Transcontinental Twinjet`,
      airlineLivery: 'United Airlines Retro Saul Bass Tulip Livery',
      flightContext: 'Transcontinental ETOPS Corridor Above Stratocumulus',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'WIDEBODY',
    };
  }

  // 20. Airbus A340 Long-Haul Quadjet
  if (id.includes('A340') || id.includes('340')) {
    return {
      photoUrl: './aircrafts/a340_300.jpg',
      caption: 'Airbus A340-300 Long-Haul Widebody Quadjet',
      airlineLivery: 'Lufthansa Intercontinental German Livery',
      flightContext: 'Four-Engine Cruising Above Cloud Sea During Golden Sunset',
      manufacturerWatermark: 'AIRBUS INDUSTRIE',
      badgeType: 'WIDEBODY',
    };
  }

  // 21. Airbus A330 High-Efficiency Twinjet
  if (id.includes('A330') || id.includes('330')) {
    return {
      photoUrl: './aircrafts/a330_300.jpg',
      caption: 'Airbus A330-300 High-Efficiency Widebody Twinjet',
      airlineLivery: 'Cathay Pacific Airways Flagship Asian Livery',
      flightContext: 'Cruising at 37,000 ft Above Marine Clouds and Atolls',
      manufacturerWatermark: 'AIRBUS INDUSTRIE',
      badgeType: 'WIDEBODY',
    };
  }

  // 22. Airbus A300-600 Advanced Widebody
  if (id.includes('A300-600') || id.includes('A300_600')) {
    return {
      photoUrl: './aircrafts/a300_600.jpg',
      caption: 'Airbus A300-600 Advanced Widebody Twinjet',
      airlineLivery: 'Thai Airways International Royal Orchid Livery',
      flightContext: 'Cruising Smoothly with Wingtip Fences in Golden Skies',
      manufacturerWatermark: 'AIRBUS INDUSTRIE',
      badgeType: 'WIDEBODY',
    };
  }

  // 23. Airbus A310-300 Compact Widebody
  if (id.includes('310') || id.includes('A310')) {
    return {
      photoUrl: './aircrafts/a310_300.jpg',
      caption: 'Airbus A310-300 Compact Transcontinental Twinjet',
      airlineLivery: 'Lufthansa Classic European Twin-Aisle Livery',
      flightContext: 'Cruising Above Stratocumulus Deck at 37,000 ft',
      manufacturerWatermark: 'AIRBUS INDUSTRIE',
      badgeType: 'WIDEBODY',
    };
  }

  // 24. Early Airbus A300B4
  if (id.includes('A300')) {
    return {
      photoUrl: './aircrafts/a300.jpg',
      caption: `${model.model} Widebody Airliner`,
      airlineLivery: 'Air France European Intercity Livery',
      flightContext: 'Cruising Over European Alpine Mountains',
      manufacturerWatermark: model.manufacturer.toUpperCase(),
      badgeType: 'WIDEBODY',
    };
  }

  // 25. Boeing 757 High-Performance Twinjet
  if (id.includes('757') || id.includes('B757')) {
    return {
      photoUrl: './aircrafts/b757_200.jpg',
      caption: 'Boeing 757-200 High-Performance Twinjet',
      airlineLivery: 'British Airways Classic Landor Fleet Livery',
      flightContext: 'Power Climb Through High Stratosphere with RB211 Turbofans',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'NARROWBODY',
    };
  }

  // 26. Boeing 737-800 Next-Generation
  if (id.includes('737-800') || id.includes('B737-800')) {
    return {
      photoUrl: './aircrafts/b737_800.jpg',
      caption: 'Boeing 737-800 Next-Generation High-Bypass Twinjet',
      airlineLivery: 'American Airlines Polished Bare-Metal Fleet Livery',
      flightContext: 'Climbing with Blended Winglets in Crisp Blue Skies',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'NARROWBODY',
    };
  }

  // 27. Boeing 737-300 Classic High-Bypass
  if (id.includes('737-300') || id.includes('B737-300')) {
    return {
      photoUrl: './aircrafts/b737_300.jpg',
      caption: 'Boeing 737-300 Classic High-Bypass Twinjet',
      airlineLivery: 'Southwest Airlines Classic Canyon Blue Livery',
      flightContext: 'Cruising with CFM56 Flat-Nacelle Turbofans Above Clouds',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'NARROWBODY',
    };
  }

  // 28. Airbus A320-200 Fly-By-Wire Pioneer
  if (id.includes('A320-200') || (id.includes('A320') && !id.includes('NEO'))) {
    return {
      photoUrl: './aircrafts/a320_200.jpg',
      caption: 'Airbus A320-200 Fly-By-Wire Pioneer',
      airlineLivery: 'Air France Flagship European Tricolor Livery',
      flightContext: 'Cruising Smoothly with Wingtip Fences at Sunset Horizon',
      manufacturerWatermark: 'AIRBUS INDUSTRIE',
      badgeType: 'NARROWBODY',
    };
  }

  // 29. Embraer E-Jets: E190
  if (id.includes('E190') || id.includes('EMBRAER')) {
    return {
      photoUrl: './aircrafts/e190.jpg',
      caption: 'Embraer E190 Advanced Regional Twinjet',
      airlineLivery: 'JetBlue Airways Blue Tail Graphic Livery',
      flightContext: 'Coastal Banking Cruise Above Cumulus Clouds',
      manufacturerWatermark: 'EMBRAER S.A.',
      badgeType: 'NARROWBODY',
    };
  }

  // 30. Airbus A320neo Family
  if (id.includes('320NEO') || id.includes('A320NEO')) {
    return {
      photoUrl: './aircrafts/a320neo.jpg',
      caption: 'Airbus A320neo New Engine Option Narrowbody',
      airlineLivery: 'European Commercial Flagship Livery',
      flightContext: 'Cruising with Large LEAP Engines and Sharklets at FL380',
      manufacturerWatermark: 'AIRBUS INDUSTRIE',
      badgeType: 'NARROWBODY',
    };
  }

  // 31. Airbus A321XLR Extra Long Range
  if (id.includes('A321XLR') || id.includes('321XLR') || id.includes('A321')) {
    return {
      photoUrl: './aircrafts/a321xlr.jpg',
      caption: 'Airbus A321XLR Extra Long-Range Transatlantic Narrowbody',
      airlineLivery: 'Lufthansa Deep Blue Livery',
      flightContext: 'Transatlantic Long-Haul Cruise Above Marine Clouds',
      manufacturerWatermark: 'AIRBUS INDUSTRIE',
      badgeType: 'NARROWBODY',
    };
  }

  // 32. Boeing 737 MAX 8
  if (id.includes('MAX') || id.includes('MAX8') || id.includes('B737-MAX8')) {
    return {
      photoUrl: './aircrafts/b737_max8.jpg',
      caption: 'Boeing 737 MAX 8 Advanced Single-Aisle Twinjet',
      airlineLivery: 'Boeing Modern Sky-Blue Commercial Livery',
      flightContext: 'Cruising with Split-Scimitar Winglets and Serrated Nacelles',
      manufacturerWatermark: 'BOEING COMMERCIAL AIRPLANES',
      badgeType: 'NARROWBODY',
    };
  }

  // 33. Airbus A220-300
  if (id.includes('A220') || id.includes('220')) {
    return {
      photoUrl: './aircrafts/a220_300.jpg',
      caption: 'Airbus A220-300 High-Efficiency Regional Jet',
      airlineLivery: 'Coastal Blue Horizon Commercial Livery',
      flightContext: 'Cruising Above Island Coastline with Geared Turbofans',
      manufacturerWatermark: 'AIRBUS INDUSTRIE',
      badgeType: 'NARROWBODY',
    };
  }

  // 34. COMAC C919
  if (id.includes('C919') || id.includes('COMAC')) {
    return {
      photoUrl: './aircrafts/c919.jpg',
      caption: 'COMAC C919 Modern Commercial Airliner',
      airlineLivery: 'COMAC Flagship Green & Blue Ribbon Livery',
      flightContext: 'Cruising High Above Mountain Ridge and Clouds',
      manufacturerWatermark: 'COMAC COMMERCIAL AIRCRAFT',
      badgeType: 'NARROWBODY',
    };
  }

  // 35. Standard Narrowbody Airliners Fallback
  return {
    photoUrl: './aircrafts/b737.jpg',
    caption: `${model.model} High-Efficiency Narrowbody Jet`,
    airlineLivery: 'Alaska Airlines Modern Commercial Livery',
    flightContext: 'Cruising in Sunlight Above Towering Cumulus Clouds',
    manufacturerWatermark: model.manufacturer.toUpperCase(),
    badgeType: 'NARROWBODY',
  };
}
