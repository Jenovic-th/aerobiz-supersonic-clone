import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GameState, Airline, Route, GameMode, AirlineStanding } from '../types/game';
import { CITIES } from '../data/cities';
import { AIRCRAFTS } from '../data/aircrafts';
import { createDefaultNegotiators } from '../data/negotiators';
import { getDynamicAIRivals, assignDistributedHQs, createAIAirline } from '../simulation/aiCompetitor';
import { calculateDistance, calculateBaseFare, getUpcomingWorldEvents } from '../simulation/engine';
import {
  getLatestAvailableSave,
  loadGameFromLocalStorage,
  importSaveFile,
  SaveMetadata,
} from '../utils/saveLoad';
import { playSound } from '../utils/audio';
import {
  Sparkles,
  Globe2,
  Shield,
  Rocket,
  Trophy,
  Plane,
  Building2,
  CheckCircle2,
  Zap,
  ChevronRight,
  ChevronLeft,
  Users,
  Shuffle,
  Upload,
  ArrowLeft,
  DollarSign,
  Calendar,
  MapPin,
  Bot,
  User,
  Sliders,
  Check,
} from 'lucide-react';

interface NewGameSetupModalProps {
  onStartGame: (initialState: GameState) => void;
  onBackToTitle?: () => void;
}

export const NewGameSetupModal: React.FC<NewGameSetupModalProps> = ({
  onStartGame,
  onBackToTitle,
}) => {
  // Wizard Navigation Step: 1 = Era & Mode, 2 = Competitors, 3 = HQ & Capital, 4 = Review & Launch
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Configuration States
  const [gameMode, setGameMode] = useState<GameMode>('CAMPAIGN_20YR');
  const [selectedEra, setSelectedEra] = useState<1 | 2 | 3>(1);
  const [airlineName, setAirlineName] = useState<string>('Siam Supersonic Airways');
  const [playerCeoName, setPlayerCeoName] = useState<string>('You (Chief Executive)');
  const [homeCityId, setHomeCityId] = useState<string>('BKK');
  const [difficulty, setDifficulty] = useState<number>(2); // 1 = $100M, 2 = $75M, 3 = $50M

  // AI Rivals Configuration
  const [rivalCount, setRivalCount] = useState<1 | 2 | 3>(3);
  const [placementMode, setPlacementMode] = useState<'DISTRIBUTED' | 'CUSTOM'>('DISTRIBUTED');
  const [customHQs, setCustomHQs] = useState<Record<string, string>>({
    AIRLINE_AI_1: 'NYC',
    AIRLINE_AI_2: 'LON',
    AIRLINE_AI_3: 'TYO',
  });
  const [rerollSeed, setRerollSeed] = useState(0);

  // Editable names for AI rivals
  const [customAiNames, setCustomAiNames] = useState<Record<string, string>>({});
  const [customAiCeos, setCustomAiCeos] = useState<Record<string, string>>({});

  // Region filter for HQ selector in Step 3
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('ALL');

  // Dynamically generate AI rival profiles & personalities based on rerollSeed
  const currentRivalProfiles = useMemo(() => {
    return getDynamicAIRivals(rivalCount, rerollSeed);
  }, [rivalCount, rerollSeed]);

  // Compute distributed HQs dynamically so they never collide with the player's home continent
  const distributedHQs = useMemo(() => {
    return assignDistributedHQs(homeCityId, 3);
  }, [homeCityId, rerollSeed]);

  // Save & Load state for optional fast-resume
  const [availableSave, setAvailableSave] = useState<{
    isAutoSave: boolean;
    metadata: SaveMetadata;
  } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const save = getLatestAvailableSave();
    if (save) {
      setAvailableSave(save);
    }
  }, []);

  const handleResumeSave = () => {
    if (!availableSave) return;
    playSound.confirm();
    const loaded = loadGameFromLocalStorage(availableSave.isAutoSave);
    if (loaded) {
      onStartGame(loaded);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      playSound.confirm();
      const imported = await importSaveFile(file);
      onStartGame(imported);
    } catch (err: any) {
      alert(err.message || 'Failed to import save file');
    }
    e.target.value = '';
  };

  const eraDescriptions = {
    1: {
      yearRange: '1980 – 2000',
      title: '1980: Widebody Jets & Cold War',
      tagline: 'ยุคสงครามเย็น & เครื่องบินลำตัวกว้าง',
      subtitle: 'The golden age of 747 jumbos, DC-10, Concorde, and the collapse of the Eastern Bloc.',
      planes: 'B747-200B, B727-200, DC-10-30, Concorde SST, A300B4, Tu-154B',
      events: '1982/1986/1990/1994 World Cups, 1990 Gulf War, 1997 Asian Crisis',
      starterPlane: 'Boeing 727-200 Trijet',
      starterPlaneId: 'B727-200',
      icon: Shield,
      accent: 'border-sky-500 text-sky-400 bg-sky-950/30',
      glow: 'shadow-[0_0_30px_rgba(56,189,248,0.25)]',
      badge: 'HISTORICAL GOLDEN ERA',
    },
    2: {
      yearRange: '2000 – 2020',
      title: '2000: Modern Mega-Jets & Efficiency',
      tagline: 'ยุคเมกะเจ็ต & ประสิทธิภาพคอมโพสิต',
      subtitle: 'The dawn of the A380 Superjumbo, B787 Dreamliner, and A350 long-range cruising.',
      planes: 'Airbus A380-800, B787-8 Dreamliner, A350-900, B777-200ER',
      events: '2002/2006/2010/2014 World Cups, 2001 Aviation Shock, 2008 Financial Crisis',
      starterPlane: 'Boeing 777-200ER Twin-Jet',
      starterPlaneId: 'B777-200ER',
      icon: Globe2,
      accent: 'border-amber-500 text-amber-400 bg-amber-950/30',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]',
      badge: 'MODERN JETLINER AGE',
    },
    3: {
      yearRange: '2020 – 2040+',
      title: '2020: Next-Gen, Supersonic & Future Tech',
      tagline: 'ยุคอนาคต & ความเร็วเหนือเสียงยุคใหม่',
      subtitle: 'Ultra long-range A321XLR, Boom Overture SST, Airbus ZEROe Hydrogen, Tesla AeroStar & SpaceX.',
      planes: 'Boom SST, A321XLR, B777X, Tesla AeroStar, SpaceX Starship P2P',
      events: '2022/2026/2030 World Cups, 2024 Olympics, Clean Hydrogen Energy, Suborbital Hops',
      starterPlane: 'Airbus A321neo-XLR Ultra-Range',
      starterPlaneId: 'A321XLR',
      icon: Rocket,
      accent: 'border-emerald-500 text-emerald-400 bg-emerald-950/30',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.25)]',
      badge: 'HYPERSONIC & FUTURE TECH',
    },
  };

  const selectedHomeCity = CITIES.find((c) => c.id === homeCityId) || CITIES[0];
  const activeEraInfo = eraDescriptions[selectedEra];
  const starterModel = AIRCRAFTS.find((a) => a.id === activeEraInfo.starterPlaneId)!;

  // Randomize helper pools
  const playerPresets = [
    'Siam Supersonic Airways',
    'Pan Pacific Airlines',
    'Trans-Global Airways',
    'SkyWings International',
    'Royal Horizon Air',
    'AeroWorld Express',
    'Imperial Pacific',
    'Starlight Airlines',
  ];

  const handleRandomizePlayerName = () => {
    playSound.click();
    const remaining = playerPresets.filter((p) => p !== airlineName);
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    setAirlineName(pick);
  };

  const handleRandomizeAiName = (rivalIndex: number) => {
    playSound.click();
    const profile = currentRivalProfiles[rivalIndex];
    if (!profile) return;
    const aiPool = [
      'Nova Continental',
      'Solaris Aero',
      'Vanguard International',
      'Atlas Global Air',
      'Condor World Express',
      'Polaris Orient',
      'Zephyr Airways',
      'AeroDynamic International',
    ];
    const pick = aiPool[Math.floor(Math.random() * aiPool.length)];
    setCustomAiNames((prev) => ({ ...prev, [profile.id]: pick }));
  };

  const handleRerollAllRivals = () => {
    playSound.click();
    setRerollSeed((prev) => prev + 1);
    setCustomAiNames({});
    setCustomAiCeos({});
  };

  const handleNextStep = () => {
    playSound.confirm();
    if (wizardStep < 4) {
      setWizardStep((prev) => (prev + 1) as any);
    }
  };

  const handlePrevStep = () => {
    playSound.click();
    if (wizardStep > 1) {
      setWizardStep((prev) => (prev - 1) as any);
    } else if (onBackToTitle) {
      onBackToTitle();
    }
  };

  // Launch Game Simulation
  const handleStart = () => {
    playSound.confirm();
    const startYear = selectedEra === 1 ? 1980 : selectedEra === 2 ? 2000 : 2020;
    const endYear = gameMode === 'CAMPAIGN_20YR' ? startYear + 20 : 9999;
    const initialCash = difficulty === 1 ? 100000 : difficulty === 2 ? 75000 : 50000;

    // Intelligently find top 2 partner cities strictly within starterModel's certified range
    const candidatePartnerCities = CITIES.filter((c) => c.id !== homeCityId)
      .map((c) => {
        const dist = calculateDistance(selectedHomeCity.lat, selectedHomeCity.lon, c.lat, c.lon);
        let score = c.population * 2.5 + c.businessIndex * 2 + c.tourismIndex * 1.5;
        if (c.region === selectedHomeCity.region) {
          score += 100;
        }
        return { city: c, dist, score };
      })
      .filter((item) => item.dist <= starterModel.rangeKm && item.dist >= 350)
      .sort((a, b) => b.score - a.score);

    const partnerCity1 = candidatePartnerCities[0]?.city.id || (homeCityId === 'BKK' ? 'SIN' : 'HKG');
    const partnerCity2 = candidatePartnerCities[1]?.city.id || candidatePartnerCities[0]?.city.id || (homeCityId === 'NYC' ? 'ORD' : 'BOS');

    const partnerCity1Obj = CITIES.find((c) => c.id === partnerCity1) || selectedHomeCity;
    const partnerCity2Obj = CITIES.find((c) => c.id === partnerCity2) || selectedHomeCity;
    const dist1 = calculateDistance(selectedHomeCity.lat, selectedHomeCity.lon, partnerCity1Obj.lat, partnerCity1Obj.lon);
    const dist2 = calculateDistance(selectedHomeCity.lat, selectedHomeCity.lon, partnerCity2Obj.lat, partnerCity2Obj.lon);

    const baseSeatsPerQuarter = starterModel.capacity * 7 * 12;
    const initialPax1 = Math.round(baseSeatsPerQuarter * 0.84);
    const initialPax2 = Math.round(baseSeatsPerQuarter * 0.89);
    const fare1 = calculateBaseFare(dist1);
    const fare2 = calculateBaseFare(dist2);
    const rev1K = Math.round((initialPax1 * fare1) / 1000);
    const rev2K = Math.round((initialPax2 * fare2) / 1000);
    const exp1K = Math.round(rev1K * 0.54);
    const exp2K = Math.round(rev2K * 0.52);

    const plane1Id = 'PLANE_INIT_1';
    const plane2Id = 'PLANE_INIT_2';
    const plane3Id = 'PLANE_INIT_3';

    const playerAirline: Airline = {
      id: 'AIRLINE_PLAYER',
      name: airlineName.trim() || 'Siam Supersonic Airways',
      color: '#38bdf8',
      isHuman: true,
      homeCityId: homeCityId,
      hubCityIds: [homeCityId],
      cashK: initialCash,
      slots: {
        [homeCityId]: 25,
        [partnerCity1]: 14,
        [partnerCity2]: 14,
      },
      fleet: [
        {
          instanceId: plane1Id,
          modelId: starterModel.id,
          ageYears: 1,
          purchaseYear: startYear - 1,
          conditionPct: 96,
          assignedRouteId: 'ROUTE_INIT_1',
        },
        {
          instanceId: plane2Id,
          modelId: starterModel.id,
          ageYears: 1,
          purchaseYear: startYear - 1,
          conditionPct: 96,
          assignedRouteId: 'ROUTE_INIT_2',
        },
        {
          instanceId: plane3Id,
          modelId: starterModel.id,
          ageYears: 0,
          purchaseYear: startYear,
          conditionPct: 100,
          assignedRouteId: null,
        },
      ],
      businesses: [],
      pendingOrders: [],
      negotiators: createDefaultNegotiators(),
      ceoName: playerCeoName.trim() || 'You (Chief Executive)',
      personality: 'BALANCED',
    };

    const route1: Route = {
      id: 'ROUTE_INIT_1',
      airlineId: 'AIRLINE_PLAYER',
      originCityId: homeCityId,
      destCityId: partnerCity1,
      assignedAircraftIds: [plane1Id],
      weeklyFrequency: 7,
      priceModifierPct: 0,
      serviceQuality: 1.0,
      status: 'ACTIVE',
      lastQuarterStats: {
        passengers: initialPax1,
        capacity: baseSeatsPerQuarter,
        loadFactorPct: 84,
        revenueK: rev1K,
        expensesK: exp1K,
        profitK: rev1K - exp1K,
      },
    };

    const route2: Route = {
      id: 'ROUTE_INIT_2',
      airlineId: 'AIRLINE_PLAYER',
      originCityId: homeCityId,
      destCityId: partnerCity2,
      assignedAircraftIds: [plane2Id],
      weeklyFrequency: 7,
      priceModifierPct: 0,
      serviceQuality: 1.0,
      status: 'ACTIVE',
      lastQuarterStats: {
        passengers: initialPax2,
        capacity: baseSeatsPerQuarter,
        loadFactorPct: 89,
        revenueK: rev2K,
        expensesK: exp2K,
        profitK: rev2K - exp2K,
      },
    };

    // Dynamically generate AI Competitor Airlines
    const aiAirlines: Airline[] = [];
    const allInitialRoutes: Route[] = [route1, route2];

    for (let i = 0; i < rivalCount; i++) {
      const profile = currentRivalProfiles[i];
      const aiHQ =
        placementMode === 'DISTRIBUTED'
          ? distributedHQs[i]
          : customHQs[profile.id] || profile.defaultHQs[0];

      const effectiveProfile = {
        ...profile,
        name: (customAiNames[profile.id] || profile.name).trim(),
        ceoName: (customAiCeos[profile.id] || profile.ceoName).trim(),
      };

      const { airline: aiAirline, initialRoutes: aiRoutes } = createAIAirline(
        effectiveProfile,
        aiHQ,
        starterModel.id,
        initialCash,
        selectedEra
      );
      aiAirlines.push(aiAirline);
      allInitialRoutes.push(...aiRoutes);
    }

    const allAirlines = [playerAirline, ...aiAirlines];

    // Compute Initial Day 1 Standings
    const initialStandings: AirlineStanding[] = allAirlines.map((airline, idx) => {
      const airlineRoutes = allInitialRoutes.filter((r) => r.airlineId === airline.id);
      let fleetVal = 0;
      airline.fleet.forEach((f) => {
        fleetVal += Math.round(starterModel.priceK * 0.7);
      });
      return {
        rank: idx + 1,
        airlineId: airline.id,
        airlineName: airline.name,
        airlineColor: airline.color,
        isHuman: airline.isHuman,
        ceoName: airline.ceoName,
        personality: airline.personality,
        homeCityId: airline.homeCityId,
        totalValuationK: airline.cashK + fleetVal,
        cashK: airline.cashK,
        fleetValueK: fleetVal,
        businessValueK: 0,
        quarterProfitK: 0,
        quarterRevenueK: 0,
        quarterExpensesK: 0,
        quarterPassengers: 0,
        activeRoutesCount: airlineRoutes.length,
        fleetCount: airline.fleet.length,
      };
    });

    initialStandings.sort((a, b) => b.totalValuationK - a.totalValuationK);
    initialStandings.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    const initialGameState: GameState = {
      gameMode,
      era: selectedEra,
      startYear,
      endYear,
      currentYear: startYear,
      currentQuarter: 1,
      turnNumber: 1,
      maxTurns: gameMode === 'CAMPAIGN_20YR' ? 80 : undefined,
      fuelPriceIndex: 1.0,
      airlines: allAirlines,
      routes: allInitialRoutes,
      activeEvents: [],
      upcomingEvents: getUpcomingWorldEvents(startYear, 1, 4),
      airlineStandings: initialStandings,
      quarterHistory: [],
      airportSlots: CITIES.reduce((acc, c) => {
        acc[c.id] = c.baseSlots;
        return acc;
      }, {} as Record<string, number>),
      airportExpansions: [],
    };

    onStartGame(initialGameState);
  };

  // Regions list for HQ filter
  const regions = [
    { id: 'ALL', label: 'All Continents (ทั้งหมด)' },
    { id: 'EAST_SOUTHEAST_ASIA', label: 'East & SE Asia' },
    { id: 'EUROPE', label: 'Europe' },
    { id: 'NORTH_AMERICA', label: 'North America' },
    { id: 'MIDDLE_EAST_SOUTH_ASIA', label: 'Middle East & South Asia' },
    { id: 'SOUTH_AMERICA', label: 'South America' },
    { id: 'OCEANIA', label: 'Oceania' },
  ];

  const filteredCities = useMemo(() => {
    if (selectedRegionFilter === 'ALL') return CITIES;
    return CITIES.filter((c) => c.region === selectedRegionFilter);
  }, [selectedRegionFilter]);

  const stepLabels = [
    { num: 1, title: 'Choose Era', thai: 'เลือกยุค' },
    { num: 2, title: 'Competitors', thai: 'ผู้เล่น & คู่แข่ง' },
    { num: 3, title: 'HQ & Capital', thai: 'สำนักงานใหญ่ & ทุน' },
    { num: 4, title: 'Launch', thai: 'สรุป & เริ่มการบิน' },
  ];

  return (
    <div className="w-screen h-screen max-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none relative">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#060e1d] to-[#020612] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* 1. TOP HEADER & STEP PROGRESS BAR */}
      <header className="relative z-10 w-full px-6 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md flex items-center justify-between shrink-0 shadow-md">
        {/* Left: Back / Title button & Logo */}
        <div className="flex items-center gap-4">
          {onBackToTitle && (
            <button
              onClick={() => {
                playSound.click();
                onBackToTitle();
              }}
              data-testid="setup-back-title-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-sky-400 rounded-xl text-xs font-bold font-mono transition cursor-pointer active:scale-95 shadow"
              title="Return to Title Screen (กลับหน้าปก)"
            >
              <ArrowLeft className="w-4 h-4 text-sky-400" />
              <span>Title Screen</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black font-mono tracking-wide text-white">
                AEROBIZ SUPERSONIC
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                NEW AIRLINE FOUNDATION WIZARD
              </div>
            </div>
          </div>
        </div>

        {/* Center: Step Stepper Indicators */}
        <div className="flex items-center gap-2 sm:gap-4">
          {stepLabels.map((s, idx) => {
            const isActive = wizardStep === s.num;
            const isCompleted = wizardStep > s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (s.num < wizardStep) {
                      playSound.click();
                      setWizardStep(s.num as any);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-mono font-bold transition ${
                    isActive
                      ? 'bg-sky-500/20 border border-sky-400 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                      : isCompleted
                      ? 'bg-slate-800/80 border border-emerald-500/40 text-emerald-400 cursor-pointer hover:bg-slate-700'
                      : 'bg-slate-900 border border-slate-800 text-slate-500'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      isActive
                        ? 'bg-sky-500 text-slate-950 font-black'
                        : isCompleted
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
                  </span>
                  <span className="hidden md:inline">{s.title}</span>
                </button>
                {idx < stepLabels.length - 1 && (
                  <div
                    className={`w-4 h-0.5 ${
                      isCompleted ? 'bg-emerald-500/60' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Quick Import & Status */}
        <div className="flex items-center gap-3">
          {availableSave && (
            <button
              onClick={handleResumeSave}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-400/60 rounded-xl text-xs font-bold font-mono transition cursor-pointer shadow active:scale-95"
              title="Resume existing save"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resume Saved</span>
            </button>
          )}

          <button
            onClick={() => importFileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold font-mono transition cursor-pointer shadow active:scale-95"
            title="Import Save File (.json)"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Import .json</span>
          </button>
        </div>
      </header>

      {/* Hidden File Input for Importing Save */}
      <input
        type="file"
        ref={importFileRef}
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* 2. MAIN WIZARD CONTENT AREA (flex-1, zero vertical scroll, perfectly centered) */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col justify-center px-6 lg:px-12 py-3 overflow-hidden">
        {/* ========================================================================= */}
        {/* STEP 1: CHOOSE STARTING ERA & GAME MODE                                    */}
        {/* ========================================================================= */}
        {wizardStep === 1 && (
          <div className="w-full max-w-6xl mx-auto flex flex-col justify-between h-full py-2 animate-in fade-in duration-200">
            {/* Step Heading */}
            <div className="text-center mb-3 shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/70 border border-sky-400/40 text-sky-300 font-mono text-xs font-bold mb-1">
                <span>STEP 1 / 4</span>
                <span>•</span>
                <span>HISTORICAL TIMELINE & SCENARIO</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-black font-mono text-white tracking-wide">
                SELECT STARTING ERA & CHRONOLOGY
              </h2>
              <p className="text-xs text-slate-400">
                เลือกยุคประวัติศาสตร์การบินและโหมดการจำลองเพื่อเริ่มต้นก่อตั้งสายการบิน
              </p>
            </div>

            {/* 3 Era Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 flex-1 min-h-0 items-stretch my-2">
              {[1, 2, 3].map((eraNum) => {
                const eraKey = eraNum as 1 | 2 | 3;
                const era = eraDescriptions[eraKey];
                const isSelected = selectedEra === eraKey;
                const IconComponent = era.icon;

                return (
                  <div
                    key={eraNum}
                    onClick={() => {
                      playSound.click();
                      setSelectedEra(eraKey);
                    }}
                    className={`relative rounded-3xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between text-left group ${
                      isSelected
                        ? `bg-slate-900/95 ${era.accent} ${era.glow} ring-2 ring-sky-400/40 scale-[1.02]`
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    {/* Top Era Badge & Radio Check */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-700 text-slate-300 tracking-wider">
                          {era.badge}
                        </span>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition ${
                            isSelected
                              ? 'border-sky-400 bg-sky-400 text-slate-950 font-bold'
                              : 'border-slate-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>

                      {/* Era Icon & Year Range */}
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2.5 rounded-2xl border ${
                            isSelected ? era.accent : 'border-slate-700 text-slate-400 bg-slate-800'
                          }`}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xl font-black font-mono text-white tracking-wide">
                            {era.yearRange}
                          </div>
                          <div className="text-xs font-bold text-sky-400">{era.tagline}</div>
                        </div>
                      </div>

                      {/* Subtitle / Context */}
                      <p className="text-xs text-slate-300 leading-relaxed mt-2">{era.subtitle}</p>
                    </div>

                    {/* Starter Aircraft & Events Preview */}
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-[11px] font-mono">
                        <span className="text-slate-400 block text-[10px]">STARTER JETLINER:</span>
                        <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                          <Plane className="w-3 h-3 text-sky-400" />
                          {era.starterPlane}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        <span className="text-slate-500 font-bold">Fleet:</span> {era.planes}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Game Mode Selector Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-4 mt-2 shrink-0">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white font-mono uppercase">
                    Simulation Mode (โหมดการเล่น)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    เลือกเงื่อนไขชัยชนะตามกฎเดิม Koei 20 ปี หรือเล่นแบบไม่จำกัดเวลา
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playSound.click();
                    setGameMode('CAMPAIGN_20YR');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                    gameMode === 'CAMPAIGN_20YR'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  🏆 Classic 20-Year Campaign (80 Quarters)
                </button>
                <button
                  onClick={() => {
                    playSound.click();
                    setGameMode('SANDBOX_INFINITE');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                    gameMode === 'SANDBOX_INFINITE'
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  ♾️ Infinite Sandbox Mode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PLAYERS & COMPETITOR AIRLINES (4 SLOTS TOTAL)                      */}
        {/* ========================================================================= */}
        {wizardStep === 2 && (
          <div className="w-full max-w-6xl mx-auto flex flex-col justify-between h-full py-2 animate-in fade-in duration-200">
            {/* Step Heading */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2 shrink-0">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-sky-950/70 border border-sky-400/40 text-sky-300 font-mono text-xs font-bold mb-1">
                  <span>STEP 2 / 4</span>
                  <span>•</span>
                  <span>AIRLINE CONGLOMERATES & RIVALS</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-black font-mono text-white tracking-wide">
                  PLAYERS & COMPETITORS SETUP
                </h2>
                <p className="text-xs text-slate-400">
                  รองรับการแข่งขันสูงสุด 4 สายการบินในตลาดโลก (สามารถตั้งชื่อหรือใช้ชื่อสุ่มได้ทันที)
                </p>
              </div>

              {/* Competitors Count Selector & Re-roll */}
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 flex items-center gap-1">
                  <span className="text-[11px] font-mono text-slate-400 px-2 font-bold">
                    Competitors:
                  </span>
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        playSound.click();
                        setRivalCount(num as 1 | 2 | 3);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                        rivalCount === num
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {num} Rival{num > 1 ? 's' : ''} ({num + 1} Total)
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleRerollAllRivals}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-sky-400 rounded-xl text-xs font-bold font-mono transition cursor-pointer shadow active:scale-95"
                  title="Randomize all AI rival airlines and personalities"
                >
                  <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Re-roll Rivals</span>
                </button>
              </div>
            </div>

            {/* 4 Airline Slots Grid (4 Columns side by side, 100% no scroll) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-0 my-2">
              {/* SLOT 1: PLAYER 1 (HUMAN) */}
              <div className="bg-slate-900/90 border-2 border-sky-400/90 rounded-3xl p-4 shadow-[0_0_25px_rgba(56,189,248,0.2)] flex flex-col justify-between">
                <div>
                  {/* Slot Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                      <span className="font-mono text-xs font-black text-sky-400 tracking-wider">
                        SLOT 1 • PLAYER (HUMAN)
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-sky-950 text-sky-300 border border-sky-400/40 rounded-full font-mono font-bold">
                      YOU
                    </span>
                  </div>

                  {/* Airline Name Input */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 font-mono">
                        AIRLINE NAME:
                      </label>
                      <button
                        onClick={handleRandomizePlayerName}
                        className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                        title="Randomize name"
                      >
                        <Shuffle className="w-3 h-3" />
                        <span>Random</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={airlineName}
                      onChange={(e) => setAirlineName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                      placeholder="Enter airline name"
                      maxLength={32}
                    />
                  </div>

                  {/* CEO Name Input */}
                  <div className="space-y-1 mb-3">
                    <label className="text-[11px] font-bold text-slate-400 font-mono">
                      CEO / EXECUTIVE:
                    </label>
                    <input
                      type="text"
                      value={playerCeoName}
                      onChange={(e) => setPlayerCeoName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                      placeholder="CEO Name"
                      maxLength={28}
                    />
                  </div>
                </div>

                {/* Slot Footer Meta */}
                <div className="pt-3 border-t border-slate-800 space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Executive Role:</span>
                    <span className="text-white font-bold">Airline President</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Headquarters:</span>
                    <span className="text-sky-400 font-bold">{selectedHomeCity.name}</span>
                  </div>
                </div>
              </div>

              {/* SLOTS 2, 3, 4: AI COMPETITORS */}
              {[0, 1, 2].map((idx) => {
                const slotNum = idx + 2;
                const isEnabled = idx < rivalCount;
                const profile = currentRivalProfiles[idx];

                if (!isEnabled || !profile) {
                  return (
                    <div
                      key={idx}
                      className="bg-slate-950/40 border-2 border-dashed border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-center text-slate-600 font-mono text-xs space-y-2 opacity-50"
                    >
                      <Bot className="w-8 h-8 stroke-1 text-slate-700" />
                      <div className="font-bold text-slate-500">SLOT {slotNum} INACTIVE</div>
                      <div className="text-[10px] text-center text-slate-600">
                        เพิ่มจำนวนคู่แข่งด้านบนเพื่อเปิดสล็อตนี้
                      </div>
                    </div>
                  );
                }

                const currentAiName = customAiNames[profile.id] || profile.name;
                const currentAiCeo = customAiCeos[profile.id] || profile.ceoName;

                return (
                  <div
                    key={profile.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-4 flex flex-col justify-between shadow-md"
                  >
                    <div>
                      {/* Slot Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: profile.color }}
                          />
                          <span className="font-mono text-xs font-black text-slate-300 tracking-wider">
                            SLOT {slotNum} • RIVAL #{idx + 1}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-full font-mono font-bold">
                          AI TYCOON
                        </span>
                      </div>

                      {/* Airline Name Input */}
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-400 font-mono">
                            AIRLINE NAME:
                          </label>
                          <button
                            onClick={() => handleRandomizeAiName(idx)}
                            className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                            title="Randomize AI name"
                          >
                            <Shuffle className="w-3 h-3" />
                            <span>Random</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={currentAiName}
                          onChange={(e) =>
                            setCustomAiNames((prev) => ({
                              ...prev,
                              [profile.id]: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                          maxLength={32}
                        />
                      </div>

                      {/* CEO Name Input */}
                      <div className="space-y-1 mb-3">
                        <label className="text-[11px] font-bold text-slate-500 font-mono">
                          CEO / RIVAL TYCOON:
                        </label>
                        <input
                          type="text"
                          value={currentAiCeo}
                          onChange={(e) =>
                            setCustomAiCeos((prev) => ({
                              ...prev,
                              [profile.id]: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none font-mono"
                          maxLength={28}
                        />
                      </div>
                    </div>

                    {/* Personality Badge & Description */}
                    <div className="pt-3 border-t border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-amber-400 font-mono">
                          {profile.personalityLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {profile.personalityDesc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Tip */}
            <div className="text-center text-[11px] text-slate-500 font-mono shrink-0">
              💡 ทิป: ทั้ง 4 สายการบินสามารถแก้ไขชื่อและซีอีโอได้ หรือใช้ชื่อที่ระบบสุ่มมาให้พร้อมเริ่มเล่นได้ทันที
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: HEADQUARTERS & STARTING CAPITAL                                   */}
        {/* ========================================================================= */}
        {wizardStep === 3 && (
          <div className="w-full max-w-6xl mx-auto flex flex-col justify-between h-full py-2 animate-in fade-in duration-200">
            {/* Step Heading */}
            <div className="text-center mb-2 shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-sky-950/70 border border-sky-400/40 text-sky-300 font-mono text-xs font-bold mb-1">
                <span>STEP 3 / 4</span>
                <span>•</span>
                <span>GLOBAL BASE & VENTURE CAPITAL</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-black font-mono text-white tracking-wide">
                SELECT HEADQUARTERS & STARTING CAPITAL
              </h2>
              <p className="text-xs text-slate-400">
                เลือกเมืองหลวงศูนย์กลางการบินโลกและระดับเงินทุนในการก่อตั้งสายการบิน
              </p>
            </div>

            {/* Two Balanced Panels (Left & Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 my-2 items-stretch">
              {/* LEFT: WORLD HEADQUARTERS SELECTOR (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-sky-400" />
                      <span className="font-bold text-sm font-mono text-white">
                        WORLD HEADQUARTERS (PRIMARY HUB)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 bg-sky-950 text-sky-300 border border-sky-500/40 rounded-full font-bold">
                      25 Slots Granted
                    </span>
                  </div>

                  {/* Continent Filter Tabs */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {regions.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          playSound.click();
                          setSelectedRegionFilter(r.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer border ${
                          selectedRegionFilter === r.id
                            ? 'bg-sky-600 border-sky-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  {/* City Select Dropdown */}
                  <div className="mb-4">
                    <select
                      value={homeCityId}
                      onChange={(e) => {
                        playSound.click();
                        setHomeCityId(e.target.value);
                      }}
                      className="w-full bg-slate-950 border-2 border-slate-700 focus:border-sky-400 rounded-2xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none cursor-pointer"
                    >
                      {filteredCities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.id}) — {c.country} • Pop: {c.population}M
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected City Highlight Card */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-xl font-black font-mono text-white flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-sky-400" />
                          <span>{selectedHomeCity.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-sky-900/60 text-sky-300 rounded-md">
                            {selectedHomeCity.id}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {selectedHomeCity.country} • {selectedHomeCity.region.replace(/_/g, ' ')}
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-lg font-black text-emerald-400">
                          {selectedHomeCity.population}M
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">
                          Metropolitan Pop
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center font-mono text-xs">
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Business Rating</span>
                        <span className="font-bold text-amber-400">{selectedHomeCity.businessIndex}/100</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Tourism Rating</span>
                        <span className="font-bold text-sky-400">{selectedHomeCity.tourismIndex}/100</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Starting Slots</span>
                        <span className="font-bold text-emerald-400">25 Base Slots</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Placement Strategy */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">AI Rivals Placement:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlacementMode('DISTRIBUTED')}
                      className={`px-3 py-1 rounded-xl font-bold border transition ${
                        placementMode === 'DISTRIBUTED'
                          ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      🎲 Distributed (คนละทวีป)
                    </button>
                    <button
                      onClick={() => setPlacementMode('CUSTOM')}
                      className={`px-3 py-1 rounded-xl font-bold border transition ${
                        placementMode === 'CUSTOM'
                          ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      ⚙️ Preset Hubs
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT: STARTING CAPITAL & FINANCIAL DIFFICULTY (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-sm font-mono text-white">
                      INITIAL CAPITAL & DIFFICULTY
                    </span>
                  </div>

                  {/* 3 Difficulty Options */}
                  <div className="space-y-2.5">
                    {[
                      {
                        level: 1,
                        title: 'Normal CEO',
                        cash: '$100,000K',
                        desc: 'Casual & Forgiving. เหมาะสำหรับผู้เริ่มต้น บริหารกระแสเงินสดคล่องตัว',
                        border: 'border-emerald-500/60',
                        color: 'text-emerald-400',
                      },
                      {
                        level: 2,
                        title: 'Seasoned Tycoon',
                        cash: '$75,000K',
                        desc: 'Authentic Koei Standard. สมดุล ท้าทาย และสมจริง (แนะนำ)',
                        border: 'border-sky-500/60',
                        color: 'text-sky-400',
                        recommended: true,
                      },
                      {
                        level: 3,
                        title: 'Hardcore Tycoon',
                        cash: '$50,000K',
                        desc: 'Strict Budget & High Stakes. เงินทุนจำกัด ผิดพลาดไม่ได้แม้แต่เที่ยวบินเดียว',
                        border: 'border-rose-500/60',
                        color: 'text-rose-400',
                      },
                    ].map((opt) => {
                      const isSelected = difficulty === opt.level;
                      return (
                        <div
                          key={opt.level}
                          onClick={() => {
                            playSound.click();
                            setDifficulty(opt.level);
                          }}
                          className={`p-3 rounded-2xl border-2 transition cursor-pointer ${
                            isSelected
                              ? `bg-slate-950 ${opt.border} ring-2 ring-sky-400/30`
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-white text-xs">
                                {opt.title}
                              </span>
                              {opt.recommended && (
                                <span className="text-[9px] px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500/50 rounded-full font-mono font-bold">
                                  RECOMMENDED
                                </span>
                              )}
                            </div>
                            <span className={`font-mono font-black text-sm ${opt.color}`}>
                              {opt.cash}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">{opt.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Starter Aircraft Info Box */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 mt-3">
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-slate-400">Initial Fleet:</span>
                    <span className="text-sky-300 font-bold">3 Aircraft Included</span>
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-sky-400" />
                    <span>{starterModel.model}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>Capacity: {starterModel.capacity} seats</span>
                    <span>•</span>
                    <span>Range: {starterModel.rangeKm.toLocaleString()} km</span>
                    <span>•</span>
                    <span>Speed: {starterModel.speedKmh} km/h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: FLIGHT CLEARANCE & EXECUTIVE LAUNCH                                */}
        {/* ========================================================================= */}
        {wizardStep === 4 && (
          <div className="w-full max-w-6xl mx-auto flex flex-col justify-between h-full py-2 animate-in fade-in duration-200">
            {/* Step Heading */}
            <div className="text-center mb-2 shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/60 text-emerald-300 font-mono text-xs font-bold mb-1">
                <span>STEP 4 / 4</span>
                <span>•</span>
                <span>FINAL DOSSIER & CLEARANCE</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-black font-mono text-white tracking-wide">
                EXECUTIVE FLIGHT CLEARANCE
              </h2>
              <p className="text-xs text-slate-400">
                ตรวจสอบความถูกต้องของแผนธุรกิจและข้อมูลสายการบินก่อนเริ่มเปิดเส้นทางบิน
              </p>
            </div>

            {/* 4 Summary Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-0 my-2 items-stretch">
              {/* 1. ERA & TIMELINE */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-bold uppercase mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>1. TIMELINE & MODE</span>
                  </div>
                  <div className="text-lg font-black font-mono text-white mb-1">
                    {activeEraInfo.yearRange}
                  </div>
                  <div className="text-xs text-sky-300 font-bold mb-2">{activeEraInfo.tagline}</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {gameMode === 'CAMPAIGN_20YR'
                      ? 'Classic 20-Year Campaign (80 Quarters) ประเมินผลแพ้ชนะเมื่อครบ 20 ปี'
                      : 'Infinite Sandbox Mode เล่นต่อเนื่องแบบไม่จำกัดเวลา'}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  Start: <span className="text-white font-bold">{selectedEra === 1 ? '1980 Q1' : selectedEra === 2 ? '2000 Q1' : '2020 Q1'}</span>
                </div>
              </div>

              {/* 2. YOUR AIRLINE */}
              <div className="bg-slate-900/80 border-2 border-sky-400/60 rounded-3xl p-4 flex flex-col justify-between shadow-[0_0_20px_rgba(56,189,248,0.15)]">
                <div>
                  <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-bold uppercase mb-2">
                    <Plane className="w-4 h-4" />
                    <span>2. YOUR AIRLINE</span>
                  </div>
                  <div className="text-base font-black font-mono text-white mb-1 truncate">
                    {airlineName}
                  </div>
                  <div className="text-xs text-slate-300 mb-2">
                    CEO: <span className="text-white font-bold">{playerCeoName}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Headquarters:</span>
                      <span className="text-sky-300 font-bold">{selectedHomeCity.name} ({selectedHomeCity.id})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Starting Slots:</span>
                      <span className="text-emerald-400 font-bold">25 Slots</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Capital:</span>
                      <span className="text-emerald-400 font-bold">
                        ${(difficulty === 1 ? 100000 : difficulty === 2 ? 75000 : 50000).toLocaleString()}K
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  Fleet: <span className="text-white font-bold">3x {starterModel.model}</span>
                </div>
              </div>

              {/* 3. COMPETITOR ROSTER */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase mb-2">
                    <Users className="w-4 h-4" />
                    <span>3. RIVALS ({rivalCount} AI)</span>
                  </div>
                  <div className="space-y-2">
                    {currentRivalProfiles.slice(0, rivalCount).map((p, i) => {
                      const name = customAiNames[p.id] || p.name;
                      const hq = placementMode === 'DISTRIBUTED' ? distributedHQs[i] : (customHQs[p.id] || p.defaultHQs[0]);
                      return (
                        <div key={p.id} className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 text-[11px] font-mono">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white truncate max-w-[120px]">{name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {hq}
                            </span>
                          </div>
                          <div className="text-[10px] text-amber-400 mt-0.5">{p.personalityLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  Total Industry: <span className="text-white font-bold">{rivalCount + 1} Airlines</span>
                </div>
              </div>

              {/* 4. VICTORY CONDITIONS */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase mb-2">
                    <Trophy className="w-4 h-4" />
                    <span>4. VICTORY MATRIX</span>
                  </div>
                  <div className="text-sm font-bold text-white mb-2">
                    Koei Tycoon Evaluation
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>ขยายเส้นทางบินเชื่อมต่อทุกทวีปทั่วโลก</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>รักษาผลกำไรต่อเนื่องและเลี่ยงภาวะล้มละลาย</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>ครองอันดับ 1 มูลค่ากิจการในไตรมาสที่ 80</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                  Ready for take-off clearance.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. BOTTOM WIZARD NAVIGATION BAR (Always Visible, 100% fits in viewport) */}
      <footer className="relative z-10 w-full px-6 py-3.5 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md flex items-center justify-between shrink-0 shadow-2xl">
        {/* Left: Previous / Back button */}
        <div>
          <button
            onClick={handlePrevStep}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-500 rounded-2xl text-xs font-bold font-mono transition cursor-pointer shadow active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>
              {wizardStep === 1
                ? 'Back to Title (กลับหน้าปก)'
                : `Back to Step ${wizardStep - 1} (ย้อนกลับ)`}
            </span>
          </button>
        </div>

        {/* Center: Current Step Summary text */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>Era: <strong className="text-sky-400">{activeEraInfo.yearRange}</strong></span>
          <span>•</span>
          <span>Airline: <strong className="text-white">{airlineName}</strong></span>
          <span>•</span>
          <span>HQ: <strong className="text-emerald-400">{selectedHomeCity.name}</strong></span>
          <span>•</span>
          <span>Cash: <strong className="text-emerald-300">${(difficulty === 1 ? 100000 : difficulty === 2 ? 75000 : 50000).toLocaleString()}K</strong></span>
        </div>

        {/* Right: Next Step or Launch Game Button */}
        <div>
          {wizardStep < 4 ? (
            <button
              onClick={handleNextStep}
              data-testid={`wizard-next-step-${wizardStep}`}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-2xl text-xs font-black font-mono transition cursor-pointer shadow-lg shadow-sky-950/50 hover:shadow-sky-500/25 active:scale-95"
            >
              <span>Next: {stepLabels[wizardStep].title} (ถัดไป)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleStart}
              data-testid="setup-start-game-btn"
              className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 text-white rounded-2xl text-sm font-black font-mono transition cursor-pointer shadow-2xl shadow-emerald-950/80 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95"
            >
              <Plane className="w-5 h-5 text-emerald-200" />
              <span>COMMENCE AIRLINE OPERATION (เริ่มต้นการบิน)</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
