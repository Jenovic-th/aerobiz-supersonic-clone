import { AircraftModel } from '../types/game';

export interface AircraftBlueprintInfo {
  wingspanM: number;
  lengthM: number;
  heightM: number;
  mtowTon: number;
  engineType: string;
  cabinAisle: string;
  serviceCeilingFt: number;
  machNumber: string;
  blueprintCode: string;
  category: 'SUPERSONIC' | 'WIDEBODY_QUAD' | 'WIDEBODY_TWIN' | 'DOUBLE_DECKER' | 'NARROWBODY' | 'TRIJET' | 'SOVIET_CLASSIC';
  description: string;
  historicalNote: string;
}

export const BLUEPRINT_SPECS: Record<string, AircraftBlueprintInfo> = {
  // ERA 1
  'B737-300': {
    wingspanM: 28.9,
    lengthM: 33.4,
    heightM: 11.1,
    mtowTon: 63.3,
    engineType: '2x CFM International CFM56-3B Turbofans',
    cabinAisle: 'Single Aisle (3-3 Standard Economy)',
    serviceCeilingFt: 37000,
    machNumber: 'Mach 0.74',
    blueprintCode: 'DWG-BA-737-CL-REV3',
    category: 'NARROWBODY',
    description: 'The Classic Generation short-to-medium range twin-engine airliner featuring high-bypass CFM56 engines with flattened bottom nacelles.',
    historicalNote: 'Became the backbone of regional trunk routes worldwide throughout the 1980s and 1990s.'
  },
  'B757-200': {
    wingspanM: 38.0,
    lengthM: 47.3,
    heightM: 13.6,
    mtowTon: 115.7,
    engineType: '2x Rolls-Royce RB211-535E4 / P&W PW2000',
    cabinAisle: 'Single Aisle High Capacity (3-3)',
    serviceCeilingFt: 42000,
    machNumber: 'Mach 0.80',
    blueprintCode: 'DWG-BA-757-200-REV2',
    category: 'NARROWBODY',
    description: 'Long-range narrowbody "flying pencil" renowned for extraordinary high-altitude takeoff performance and transcontinental range.',
    historicalNote: 'Equipped with muscular turbofans that allowed hot-and-high operations and transatlantic ETOPS certification.'
  },
  'B767-300ER': {
    wingspanM: 47.6,
    lengthM: 54.9,
    heightM: 15.8,
    mtowTon: 186.9,
    engineType: '2x General Electric CF6-80C2 / PW4060',
    cabinAisle: 'Twin Aisle (2-3-2 Passenger Comfort)',
    serviceCeilingFt: 43000,
    machNumber: 'Mach 0.80',
    blueprintCode: 'DWG-BA-767-300ER-REV4',
    category: 'WIDEBODY_TWIN',
    description: 'Extended Range twin-aisle widebody with exceptionally popular 7-abreast 2-3-2 passenger seating with only one middle seat per row.',
    historicalNote: 'Pioneered twin-engine ETOPS transatlantic crossings, displacing classic tri-jets.'
  },
  'B747-300': {
    wingspanM: 59.6,
    lengthM: 70.6,
    heightM: 19.3,
    mtowTon: 377.8,
    engineType: '4x Pratt & Whitney JT9D-7R4G2 / GE CF6',
    cabinAisle: 'Double Deck (Upper Deck 3-3, Main Deck 3-4-3)',
    serviceCeilingFt: 45000,
    machNumber: 'Mach 0.84',
    blueprintCode: 'DWG-BA-747-300-REV1',
    category: 'WIDEBODY_QUAD',
    description: 'Stretched Upper Deck (SUD) Queen of the Skies, offering expanded upper deck business-class seating and classic spiral staircase.',
    historicalNote: 'Transitional heavy flagship between the original classic 747s and the computerized glass-cockpit 747-400.'
  },
  'B747-400': {
    wingspanM: 64.4,
    lengthM: 70.6,
    heightM: 19.4,
    mtowTon: 396.9,
    engineType: '4x General Electric CF6-80C2B1F (62,100 lbf each)',
    cabinAisle: 'Double Deck (Upper Deck 3-3, Main Deck 3-4-3)',
    serviceCeilingFt: 45100,
    machNumber: 'Mach 0.855',
    blueprintCode: 'DWG-BA-747-400-ENG-REV5',
    category: 'WIDEBODY_QUAD',
    description: 'The quintessential long-range Jumbo Jet featuring 6-foot canted winglets, 2-crew glass cockpit, tail fuel tank, and 13,450 km range.',
    historicalNote: 'The supreme ruler of long-haul transpacific and Eurasian corridors from 1989 through the 2010s.'
  },
  'A300-600': {
    wingspanM: 44.8,
    lengthM: 54.1,
    heightM: 16.5,
    mtowTon: 171.7,
    engineType: '2x General Electric CF6-80C2A1 / PW4158',
    cabinAisle: 'Twin Aisle (2-4-2 Widebody)',
    serviceCeilingFt: 40000,
    machNumber: 'Mach 0.78',
    blueprintCode: 'DWG-AB-A300-600-REV2',
    category: 'WIDEBODY_TWIN',
    description: 'Airbus Industrie modern widebody pioneer with twin-aisle 8-abreast fuselage and high-capacity LD3 cargo container capability.',
    historicalNote: 'Established Airbus as a serious global contender against McDonnell Douglas and Boeing.'
  },
  'A320-200': {
    wingspanM: 34.1,
    lengthM: 37.6,
    heightM: 11.8,
    mtowTon: 78.0,
    engineType: '2x CFM International CFM56-5A / IAE V2500',
    cabinAisle: 'Single Aisle (3-3 Wide-Cabin Single Aisle)',
    serviceCeilingFt: 39000,
    machNumber: 'Mach 0.78',
    blueprintCode: 'DWG-AB-A320-200-REV3',
    category: 'NARROWBODY',
    description: 'Revolutionary digital fly-by-wire commercial jet with side-stick controllers, composite materials, and spacious cabin cross-section.',
    historicalNote: 'Became the best-selling commercial jetliner family in civil aviation history.'
  },
  'MD-11': {
    wingspanM: 51.7,
    lengthM: 61.2,
    heightM: 17.6,
    mtowTon: 286.0,
    engineType: '3x General Electric CF6-80C2D1F / PW4460 (1 Tail-Mounted)',
    cabinAisle: 'Twin Aisle Tri-Jet (2-5-2 or 3-3-3)',
    serviceCeilingFt: 43000,
    machNumber: 'Mach 0.82',
    blueprintCode: 'DWG-MDC-MD11-TRIJET-REV3',
    category: 'TRIJET',
    description: 'Long-range widebody tri-jet with distinctive vertical stabilizer center engine, winglets, and advanced glass avionics.',
    historicalNote: 'Celebrated for its long intercontinental legs and immense high-density cargo and passenger lift capability.'
  },
  'CONCORDE': {
    wingspanM: 25.6,
    lengthM: 61.7,
    heightM: 12.2,
    mtowTon: 185.0,
    engineType: '4x Rolls-Royce/Snecma Olympus 593 Mk 610 with Reheat (38,050 lbf)',
    cabinAisle: 'Single Aisle Supersonic (2-2 Luxury Seating)',
    serviceCeilingFt: 60000,
    machNumber: 'Mach 2.04 (Supersonic Supercruise)',
    blueprintCode: 'DWG-SST-CONCORDE-ENG-REV9',
    category: 'SUPERSONIC',
    description: 'The pinnacle of commercial supersonic flight with ogival delta wing, droop-snoot nose, reheat afterburners, and Mach 2 cruise at 60,000 ft.',
    historicalNote: 'Crossed the Atlantic in under 3.5 hours, carrying VIPs and executives faster than the rotation of the Earth.'
  },
  'TU-154B': {
    wingspanM: 37.5,
    lengthM: 48.0,
    heightM: 11.4,
    mtowTon: 98.0,
    engineType: '3x Kuznetsov NK-8-2U Low-Bypass Turbofans',
    cabinAisle: 'Single Aisle Tri-Jet (3-3)',
    serviceCeilingFt: 39000,
    machNumber: 'Mach 0.80',
    blueprintCode: 'DWG-TUP-154B-SOVIET-REV1',
    category: 'SOVIET_CLASSIC',
    description: 'Rugged Soviet tri-jet designed for unpaved Arctic runways, heavy snow conditions, and reliable performance across Eastern bloc routes.',
    historicalNote: 'Carried millions of passengers across Aeroflot global network and allied nations throughout the Cold War.'
  },
  'IL-86': {
    wingspanM: 48.1,
    lengthM: 60.2,
    heightM: 15.8,
    mtowTon: 215.0,
    engineType: '4x Kuznetsov NK-86 Turbofans',
    cabinAisle: 'Widebody Quad-Jet (3-4-3 High Density)',
    serviceCeilingFt: 36000,
    machNumber: 'Mach 0.80',
    blueprintCode: 'DWG-ILY-86-WIDEBODY-REV2',
    category: 'SOVIET_CLASSIC',
    description: 'First Soviet widebody jetliner with unique passenger self-service lower baggage deck ("Luggage at Hand") and four engines.',
    historicalNote: 'Celebrated for having an extraordinarily robust safety and structural airframe record.'
  },
  'IL-96-300': {
    wingspanM: 60.1,
    lengthM: 55.3,
    heightM: 17.5,
    mtowTon: 250.0,
    engineType: '4x Aviadvigatel PS-90A High-Bypass Turbofans',
    cabinAisle: 'Twin Aisle (3-3-3 Long Range)',
    serviceCeilingFt: 43000,
    machNumber: 'Mach 0.82',
    blueprintCode: 'DWG-ILY-96-300-REV3',
    category: 'SOVIET_CLASSIC',
    description: 'Advanced Russian widebody quad-jet with supercritical wing, fly-by-wire systems, and intercontinental range up to 11,500 km.',
    historicalNote: 'Serves as the prestigious state transport and presidential VIP transport aircraft for the Russian Federation.'
  },

  // ERA 2
  'B777-200ER': {
    wingspanM: 60.9,
    lengthM: 63.7,
    heightM: 18.5,
    mtowTon: 297.5,
    engineType: '2x GE90-94B / Rolls-Royce Trent 895 (93,700 lbf)',
    cabinAisle: 'Twin Aisle Widebody (3-3-3 or 3-4-3)',
    serviceCeilingFt: 43100,
    machNumber: 'Mach 0.84',
    blueprintCode: 'DWG-BA-777-200ER-REV4',
    category: 'WIDEBODY_TWIN',
    description: 'The Boeing "Triple Seven", the worlds largest twinjet with massive fan diameters matching the fuselage width of a Boeing 737.',
    historicalNote: 'Pioneered long-haul ETOPS-330 minute certifications for trans-polar and remote ocean routes.'
  },
  'B777-300ER': {
    wingspanM: 64.8,
    lengthM: 73.9,
    heightM: 18.5,
    mtowTon: 351.5,
    engineType: '2x General Electric GE90-115B (World Record 115,300 lbf each)',
    cabinAisle: 'Twin Aisle Widebody (3-4-3)',
    serviceCeilingFt: 43100,
    machNumber: 'Mach 0.84',
    blueprintCode: 'DWG-BA-777-300ER-FLAGSHIP-REV6',
    category: 'WIDEBODY_TWIN',
    description: 'Stretched ultra-long range heavy twinjet with raked wingtips, semilevered gear, and the most powerful jet engines in commercial service.',
    historicalNote: 'The undisputed heavy international flagship of the worlds premier airlines, replacing older 4-engine jets.'
  },
  'B787-9': {
    wingspanM: 60.1,
    lengthM: 62.8,
    heightM: 17.0,
    mtowTon: 254.0,
    engineType: '2x GEnx-1B / Rolls-Royce Trent 1000 (Chevrons Nacelles)',
    cabinAisle: 'Twin Aisle Composite (3-3-3)',
    serviceCeilingFt: 43000,
    machNumber: 'Mach 0.85',
    blueprintCode: 'DWG-BA-787-9-DREAMLINER-REV5',
    category: 'WIDEBODY_TWIN',
    description: 'The Dreamliner: 50% carbon-fiber composite airframe, higher cabin pressurization (6,000 ft), electrochromic dimming windows, and 20% less fuel.',
    historicalNote: 'Revolutionized point-to-point "long and thin" secondary city pairings without requiring massive hubs.'
  },
  'A330-300': {
    wingspanM: 60.3,
    lengthM: 63.7,
    heightM: 16.8,
    mtowTon: 242.0,
    engineType: '2x Rolls-Royce Trent 700 / GE CF6-80E1',
    cabinAisle: 'Twin Aisle (2-4-2 High Density)',
    serviceCeilingFt: 41100,
    machNumber: 'Mach 0.82',
    blueprintCode: 'DWG-AB-A330-300-REV3',
    category: 'WIDEBODY_TWIN',
    description: 'Extremely efficient twinjet medium-to-long haul workhorse with beloved 2-4-2 seating and outstanding dispatch reliability.',
    historicalNote: 'The workhorse of Asian regional and transcontinental passenger routes.'
  },
  'A350-900': {
    wingspanM: 64.75,
    lengthM: 66.8,
    heightM: 17.05,
    mtowTon: 280.0,
    engineType: '2x Rolls-Royce Trent XWB-84 (84,200 lbf)',
    cabinAisle: 'Extra Wide Body Composite (3-3-3)',
    serviceCeilingFt: 43100,
    machNumber: 'Mach 0.85',
    blueprintCode: 'DWG-AB-A350-900-XWB-REV5',
    category: 'WIDEBODY_TWIN',
    description: 'Airbus Xtra Wide Body clean-sheet design made with 53% carbon-fiber composites, distinctive "bandit mask" cockpit, and curved sharklets.',
    historicalNote: 'Features the quietest twin-aisle cabin in the sky and phenomenal fuel economics.'
  },
  'A380-800': {
    wingspanM: 79.75,
    lengthM: 72.72,
    heightM: 24.09,
    mtowTon: 575.0,
    engineType: '4x Rolls-Royce Trent 900 / Engine Alliance GP7200 (70,000 lbf each)',
    cabinAisle: 'Full Double Deck (Main 3-4-3, Upper 2-4-2)',
    serviceCeilingFt: 43000,
    machNumber: 'Mach 0.85',
    blueprintCode: 'DWG-AB-A380-800-SUPERJUMBO-REV8',
    category: 'DOUBLE_DECKER',
    description: 'The worlds only full double-decker passenger airliner with 550+ seats, monumental wingspan, multi-class lounges, and luxury staterooms.',
    historicalNote: 'Unsurpassed passenger luxury and slot-constrained megahub powerhouse between London, Dubai, Tokyo, and Bangkok.'
  },
  'A320NEO': {
    wingspanM: 35.8,
    lengthM: 37.57,
    heightM: 11.76,
    mtowTon: 79.0,
    engineType: '2x CFM LEAP-1A / Pratt & Whitney PW1100G Geared Turbofans',
    cabinAisle: 'Single Aisle (3-3 Airspace Cabin)',
    serviceCeilingFt: 39800,
    machNumber: 'Mach 0.78',
    blueprintCode: 'DWG-AB-A320NEO-REV2',
    category: 'NARROWBODY',
    description: 'New Engine Option featuring 2.4-meter sharklets and geared turbofans delivering a 20% reduction in fuel consumption and 50% noise reduction.',
    historicalNote: 'The fastest-selling commercial aircraft in history.'
  },
  'TU-204': {
    wingspanM: 41.8,
    lengthM: 46.1,
    heightM: 13.9,
    mtowTon: 105.0,
    engineType: '2x Aviadvigatel PS-90A High-Bypass Turbofans',
    cabinAisle: 'Single Aisle (3-3)',
    serviceCeilingFt: 40000,
    machNumber: 'Mach 0.80',
    blueprintCode: 'DWG-TUP-204-100-REV2',
    category: 'SOVIET_CLASSIC',
    description: 'Modern Russian fly-by-wire narrowbody twinjet comparable to the Boeing 757, featuring supercritical wings and winglets.',
    historicalNote: 'Mainstay of post-Soviet modern medium-range passenger and express postal routes.'
  },

  // ERA 3
  'A321XLR': {
    wingspanM: 35.8,
    lengthM: 44.51,
    heightM: 11.76,
    mtowTon: 101.0,
    engineType: '2x CFM LEAP-1A / PW1100G-JM with Permanent Rear Center Tank',
    cabinAisle: 'Single Aisle (3-3 Transcontinental/Transatlantic)',
    serviceCeilingFt: 39800,
    machNumber: 'Mach 0.78',
    blueprintCode: 'DWG-AB-A321XLR-ULTRA-REV3',
    category: 'NARROWBODY',
    description: 'eXtra Long Range narrowbody with integrated rear center fuel tank delivering 8,700 km range, flying single-aisle planes across the Atlantic.',
    historicalNote: 'Redefines airline economics by replacing older widebody jets on long, thin intercontinental routes with single-aisle fuel efficiency.'
  },
  'B777-9X': {
    wingspanM: 71.75, // with folding wingtips (64.8m folded)
    lengthM: 76.72,
    heightM: 19.7,
    mtowTon: 351.5,
    engineType: '2x General Electric GE9X-105B1A (World Record 134-inch Fan)',
    cabinAisle: 'Twin Aisle Next-Gen Widebody (3-4-3 Wide-Cabin)',
    serviceCeilingFt: 43100,
    machNumber: 'Mach 0.85',
    blueprintCode: 'DWG-BA-777-9X-FOLDING-WING-REV4',
    category: 'WIDEBODY_TWIN',
    description: 'The longest passenger airliner in history with folding carbon-fiber wingtips, 426 seats, and the giant GE9X engines.',
    historicalNote: 'Next-generation flagship combining twin-engine fuel thrift with 747-class massive capacity.'
  },
  'A350-1000': {
    wingspanM: 64.75,
    lengthM: 73.79,
    heightM: 17.08,
    mtowTon: 319.0,
    engineType: '2x Rolls-Royce Trent XWB-97 (97,000 lbf)',
    cabinAisle: 'Extra Wide Body (3-3-3 Long Range)',
    serviceCeilingFt: 43100,
    machNumber: 'Mach 0.85',
    blueprintCode: 'DWG-AB-A350-1000-SUNRISE-REV5',
    category: 'WIDEBODY_TWIN',
    description: 'Stretched A350 with 6-wheel main landing gear bogies, modified wing trailing edge, and 16,100 km ultra-long-haul capability.',
    historicalNote: 'Selected for Project Sunrise non-stop 20-hour flights connecting London and New York directly with Sydney.'
  },
  'BOOM-OVERTURE': {
    wingspanM: 32.3,
    lengthM: 61.3,
    heightM: 11.0,
    mtowTon: 77.0,
    engineType: '4x Symphony Medium-Bypass Supersonic Turbofans without Afterburners',
    cabinAisle: 'Supersonic All-Business Class (1-1 or 2-2)',
    serviceCeilingFt: 60000,
    machNumber: 'Mach 1.7 (Supercruise)',
    blueprintCode: 'DWG-BOOM-OVERTURE-SST-REV7',
    category: 'SUPERSONIC',
    description: 'Next-generation commercial supersonic airliner flying at Mach 1.7 on 100% Sustainable Aviation Fuel (SAF) without noisy afterburners.',
    historicalNote: 'Revives commercial supersonic travel for modern business executives, cutting transatlantic flight times in half.'
  },
  'HYPER-MACH4': {
    wingspanM: 36.0,
    lengthM: 78.5,
    heightM: 14.5,
    mtowTon: 140.0,
    engineType: 'Combined Cycle Turboramjet / Scramjet Propulsion Array',
    cabinAisle: 'Hypersonic Sealed Capsule (2-2 Augmented Glass)',
    serviceCeilingFt: 85000,
    machNumber: 'Mach 3.8 - 4.2 (Hypersonic)',
    blueprintCode: 'DWG-HYPER-MACH4-AERO-X1',
    category: 'SUPERSONIC',
    description: 'Hypersonic sub-orbital transport concept reaching the edge of space at 85,000 feet, enabling Tokyo to New York in under 2.5 hours.',
    historicalNote: 'The ultimate pinnacle of aerospace engineering in the 2030s and beyond.'
  },
  'AIRBUS-ZEROE': {
    wingspanM: 42.0,
    lengthM: 52.0,
    heightM: 14.0,
    mtowTon: 110.0,
    engineType: '2x Cryogenic Liquid Hydrogen Turbofans + Fuel Cells',
    cabinAisle: 'Twin Aisle Zero-Emission (2-3-2)',
    serviceCeilingFt: 41000,
    machNumber: 'Mach 0.80',
    blueprintCode: 'DWG-AIRBUS-ZEROE-CRYO-REV1',
    category: 'WIDEBODY_TWIN',
    description: 'Clean-sheet liquid hydrogen powered airliner with zero carbon emissions and ultra-clean water vapor exhaust.',
    historicalNote: 'Pioneered the green hydrogen aviation revolution in commercial transport.'
  },
  'TESLA-AEROSTAR': {
    wingspanM: 58.0,
    lengthM: 64.0,
    heightM: 15.2,
    mtowTon: 160.0,
    engineType: '4x Tesla Magnetoplasmadynamic (MPD) Ion Drives + Graphene Battery',
    cabinAisle: 'Tesla Glass-Panoramic Widebody (2-4-2)',
    serviceCeilingFt: 52000,
    machNumber: 'Mach 0.88',
    blueprintCode: 'DWG-TESLA-AEROSTAR-ION-X',
    category: 'WIDEBODY_TWIN',
    description: 'Tesla Aerospace commercial flagship featuring superconducting electromagnetic plasma thrusters and solar photovoltaic fuselage skin.',
    historicalNote: 'Reduces operating and fuel costs by 70%, operating almost silently with zero direct fossil emissions.'
  },
  'BOEING-B797-BWB': {
    wingspanM: 78.5,
    lengthM: 56.0,
    heightM: 12.8,
    mtowTon: 360.0,
    engineType: '3x GE Unducted Open-Rotor Fans (Aft-Mounted)',
    cabinAisle: 'Theater Amphitheater Flying Wing (4 Aisles)',
    serviceCeilingFt: 46000,
    machNumber: 'Mach 0.88',
    blueprintCode: 'DWG-BA-797-BWB-FLYINGWING-REV2',
    category: 'WIDEBODY_QUAD',
    description: 'Blended Wing Body commercial transport providing 35% less aerodynamic drag, immense internal volume, and a panoramic theater cabin.',
    historicalNote: 'A revolutionary architectural departure from the traditional tube-and-wing fuselage layout.'
  },
  'SPACEX-STARLINER': {
    wingspanM: 18.0,
    lengthM: 121.0,
    heightM: 18.0,
    mtowTon: 1200.0,
    engineType: '33x SpaceX Raptor 3 Full-Flow Staged Combustion Methalox Engines',
    cabinAisle: 'Suborbital Multi-Deck Pressurized Capsule',
    serviceCeilingFt: 350000,
    machNumber: 'Mach 25 (Suborbital Orbital Insertion)',
    blueprintCode: 'DWG-SPACEX-STARSHIP-E2E-V3',
    category: 'SUPERSONIC',
    description: 'Starship Earth-to-Earth point-to-point suborbital rocket liner capable of carrying 600 passengers anywhere on Earth in under 40 minutes.',
    historicalNote: 'Crossed oceans outside the atmosphere, making any two cities on Earth reachable in minutes.'
  },
  'B727-200': {
    wingspanM: 32.9,
    lengthM: 46.7,
    heightM: 10.4,
    mtowTon: 95.0,
    engineType: '3x Pratt & Whitney JT8D-17R Turbofans',
    cabinAisle: 'Single Aisle Trijet (3-3)',
    serviceCeilingFt: 42000,
    machNumber: 'Mach 0.82',
    blueprintCode: 'DWG-BA-727-200-ADV-REV1',
    category: 'TRIJET',
    description: 'Iconic T-tail tri-jet with high-lift trailing edge flaps and S-duct center engine, capable of operating from short runways.',
    historicalNote: 'The most popular short-to-medium range airliner throughout the 1970s and 1980s.'
  },
  'B747-200B': {
    wingspanM: 59.6,
    lengthM: 70.6,
    heightM: 19.3,
    mtowTon: 377.8,
    engineType: '4x Pratt & Whitney JT9D-7R4G2 / GE CF6-50E2',
    cabinAisle: 'Double Deck (Upper 3-3, Main 3-4-3)',
    serviceCeilingFt: 45000,
    machNumber: 'Mach 0.84',
    blueprintCode: 'DWG-BA-747-200B-CLASSIC-REV1',
    category: 'WIDEBODY_QUAD',
    description: 'The definitive classic long-range Jumbo Jet that democratized intercontinental travel across the Atlantic and Pacific.',
    historicalNote: 'Flagship of Pan Am, BOAC, TWA, and Asian flag carriers during the golden widebody era.'
  },
  'DC-10-30': {
    wingspanM: 50.4,
    lengthM: 55.5,
    heightM: 17.7,
    mtowTon: 263.0,
    engineType: '3x General Electric CF6-50C2 (1 Tail S-Duct)',
    cabinAisle: 'Twin Aisle Tri-Jet (2-5-2)',
    serviceCeilingFt: 42000,
    machNumber: 'Mach 0.82',
    blueprintCode: 'DWG-MDC-DC10-30-REV2',
    category: 'TRIJET',
    description: 'Intercontinental widebody tri-jet designed for transoceanic routes with spacious twin-aisle cabin comfort.',
    historicalNote: 'Key workhorse across global airline fleets alongside the 747 in the 1970s and 1980s.'
  },
  'L-1011': {
    wingspanM: 47.3,
    lengthM: 54.2,
    heightM: 16.9,
    mtowTon: 231.0,
    engineType: '3x Rolls-Royce RB211-524B Turbofans',
    cabinAisle: 'Twin Aisle Widebody (2-4-2)',
    serviceCeilingFt: 42000,
    machNumber: 'Mach 0.83',
    blueprintCode: 'DWG-LOCKHEED-L1011-TRISTAR-REV1',
    category: 'TRIJET',
    description: 'The Lockheed TriStar, celebrated as the most technologically advanced widebody of its era with full Autoland capability.',
    historicalNote: 'Beloved by pilots and passengers for smooth ride quality and quiet RB211 engines.'
  }
};

export function getAircraftBlueprintData(model: AircraftModel): AircraftBlueprintInfo {
  if (BLUEPRINT_SPECS[model.id]) {
    return BLUEPRINT_SPECS[model.id];
  }
  // Fallback estimation
  const isSST = model.isSupersonic || model.speedKmh > 1200;
  return {
    wingspanM: Math.round(model.capacity * 0.12 + 20),
    lengthM: Math.round(model.capacity * 0.14 + 22),
    heightM: 12.5,
    mtowTon: Math.round(model.capacity * 0.6 + 40),
    engineType: isSST ? 'Supersonic Turbojet Array' : 'High-Bypass Turbofans',
    cabinAisle: model.capacity > 250 ? 'Twin Aisle Widebody' : 'Single Aisle',
    serviceCeilingFt: isSST ? 60000 : 41000,
    machNumber: isSST ? 'Mach 2.0' : 'Mach 0.82',
    blueprintCode: `DWG-${model.id}-REV1`,
    category: isSST ? 'SUPERSONIC' : model.capacity > 350 ? 'WIDEBODY_QUAD' : 'WIDEBODY_TWIN',
    description: `${model.model} commercial airliner designed for high reliability and revenue service.`,
    historicalNote: `Introduced in ${model.introYear} by ${model.manufacturer}.`
  };
}
