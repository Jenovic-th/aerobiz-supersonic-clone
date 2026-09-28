import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GameState, Airline, Route, GameMode, AirlineStanding } from '../types/game';
import { CITIES } from '../data/cities';
import { AIRCRAFTS } from '../data/aircrafts';
import { createDefaultNegotiators } from '../data/negotiators';
import { getDynamicAIRivals, assignDistributedHQs, createAIAirline } from '../simulation/aiCompetitor';
import { calculateDistance, calculateBaseFare } from '../simulation/engine';
import {
  getLatestAvailableSave,
  loadGameFromLocalStorage,
  importSaveFile,
  SaveMetadata,
} from '../utils/saveLoad';
import {
  Sparkles,
  Globe2,
  Shield,
  Rocket,
  Trophy,
  Infinity,
  Plane,
  Building2,
  CheckCircle2,
  Award,
  Zap,
  ChevronRight,
  Users,
  Shuffle,
  Settings2,
  Swords,
  Upload,
  FolderOpen,
} from 'lucide-react';

interface NewGameSetupModalProps {
  onStartGame: (initialState: GameState) => void;
}

export const NewGameSetupModal: React.FC<NewGameSetupModalProps> = ({ onStartGame }) => {
  const [gameMode, setGameMode] = useState<GameMode>('CAMPAIGN_20YR');
  const [selectedEra, setSelectedEra] = useState<1 | 2 | 3>(1);
  const [airlineName, setAirlineName] = useState<string>('Siam Supersonic Airways');
  const [homeCityId, setHomeCityId] = useState<string>('BKK');
  const [difficulty, setDifficulty] = useState<number>(2); // 1 = Easy, 2 = Medium, 3 = Expert

  // AI Rivals Configuration
  const [rivalCount, setRivalCount] = useState<1 | 2 | 3>(3);
  const [placementMode, setPlacementMode] = useState<'DISTRIBUTED' | 'CUSTOM'>('DISTRIBUTED');
  const [customHQs, setCustomHQs] = useState<Record<string, string>>({
    AIRLINE_AI_1: 'NYC',
    AIRLINE_AI_2: 'LON',
    AIRLINE_AI_3: 'TYO',
  });
  const [rerollSeed, setRerollSeed] = useState(0);

  // Dynamically generate AI rival profiles & personalities based on rerollSeed
  const currentRivalProfiles = useMemo(() => {
    return getDynamicAIRivals(rivalCount, rerollSeed);
  }, [rivalCount, rerollSeed]);

  // Compute distributed HQs dynamically so they never collide with the player's home continent
  const distributedHQs = useMemo(() => {
    return assignDistributedHQs(homeCityId, 3);
  }, [homeCityId, rerollSeed]);

  // Save & Load state
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
    const loaded = loadGameFromLocalStorage(availableSave.isAutoSave);
    if (loaded) {
      onStartGame(loaded);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
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
      subtitle: 'The golden age of 747 jumbos, DC-10, Concorde, and the collapse of the Eastern Bloc.',
      planes: 'B747-200B, B727-200, DC-10-30, Concorde SST, A300B4, Tu-154B',
      events: '1982/1986/1990/1994 World Cups, 1990 Gulf War, 1997 Asian Crisis',
      starterPlane: 'Boeing 727-200 Trijet',
      starterPlaneId: 'B727-200',
      icon: Shield,
      accent: 'border-blue-500 text-sky-400',
      badge: 'HISTORICAL GOLDEN ERA',
    },
    2: {
      yearRange: '2000 – 2020',
      title: '2000: Modern Mega-Jets & Composite Efficiency',
      subtitle: 'The dawn of the A380 Superjumbo, B787 Dreamliner, and A350 long-range cruising.',
      planes: 'Airbus A380-800, B787-8 Dreamliner, A350-900, B777-200ER',
      events: '2002/2006/2010/2014 World Cups, 2001 Aviation Shock, 2008 Financial Crisis',
      starterPlane: 'Boeing 777-200ER Twin-Jet',
      starterPlaneId: 'B777-200ER',
      icon: Globe2,
      accent: 'border-amber-500 text-amber-400',
      badge: 'MODERN JETLINER AGE',
    },
    3: {
      yearRange: '2020 – 2040+',
      title: '2020: Next-Gen, Supersonic & Future Tech',
      subtitle: 'Ultra long-range A321XLR, Boom Overture SST, Airbus ZEROe Hydrogen, Tesla AeroStar & SpaceX.',
      planes: 'Boom SST, A321XLR, B777X, Tesla AeroStar, SpaceX Starship P2P',
      events: '2022/2026/2030 World Cups, 2024 Olympics, Clean Hydrogen Energy, Suborbital Hops',
      starterPlane: 'Airbus A321neo-XLR Ultra-Range',
      starterPlaneId: 'A321XLR',
      icon: Rocket,
      accent: 'border-emerald-500 text-emerald-400',
      badge: 'HYPERSONIC & FUTURE TECH',
    },
  };

  const selectedHomeCity = CITIES.find((c) => c.id === homeCityId) || CITIES[0];
  const activeEraInfo = eraDescriptions[selectedEra];
  const starterModel = AIRCRAFTS.find((a) => a.id === activeEraInfo.starterPlaneId)!;

  const handleStart = () => {
    const startYear = selectedEra === 1 ? 1980 : selectedEra === 2 ? 2000 : 2020;
    const endYear = gameMode === 'CAMPAIGN_20YR' ? startYear + 20 : 9999;

    const initialCash = difficulty === 1 ? 100000 : difficulty === 2 ? 75000 : 50000;

    // Intelligently find top 2 partner cities that are strictly within starterModel's certified range
    const candidatePartnerCities = CITIES.filter((c) => c.id !== homeCityId)
      .map((c) => {
        const dist = calculateDistance(selectedHomeCity.lat, selectedHomeCity.lon, c.lat, c.lon);
        let score = c.population * 2.5 + c.businessIndex * 2 + c.tourismIndex * 1.5;
        if (c.region === selectedHomeCity.region) {
          score += 100; // Prefer establishing solid regional hub network first
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
      name: airlineName,
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
      ceoName: 'You (Chief Executive)',
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

    // Dynamically generate active AI Competitor Airlines
    const aiAirlines: Airline[] = [];
    const allInitialRoutes: Route[] = [route1, route2];

    for (let i = 0; i < rivalCount; i++) {
      const profile = currentRivalProfiles[i];
      const aiHQ =
        placementMode === 'DISTRIBUTED'
          ? distributedHQs[i]
          : customHQs[profile.id] || profile.defaultHQs[0];

      const { airline: aiAirline, initialRoutes: aiRoutes } = createAIAirline(
        profile,
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

  const namePresets = [
    'Siam Supersonic Airways',
    'Pan Pacific Airlines',
    'Trans-Global Airways',
    'SkyWings International',
  ];

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative select-none">
      {/* Dynamic Background Aerospace Grid & Radar Sweep Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(2,6,23,0.98))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* 1. TOP EXECUTIVE TITLE HEADER (shrink-0) */}
      <header className="relative shrink-0 bg-slate-900/90 border-b border-sky-900/50 backdrop-blur-md px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 z-10 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-lg border border-sky-400">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 font-mono px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/40">
                KOEI SUPERSONIC ENGINE • HD STANDALONE
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">v2.5.0</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2 mt-0.5 font-mono">
              AIROBIZ SUPERSONIC
              <span className="text-xs font-normal text-slate-400 font-sans hidden md:inline">
                — Commercial Airline Tycoon Simulation
              </span>
            </h1>
          </div>
        </div>

        {/* Top Import Save Button & Quick Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => importFileRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-bold font-mono transition cursor-pointer shadow active:scale-95"
            title="Load an exported Aerobiz save file from your PC"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Load Save File (.json)</span>
          </button>

          <div className="hidden lg:flex items-center gap-4 text-xs font-mono bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-2 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>STANDALONE DESKTOP SYSTEM READY</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-amber-300">1980 - 2046+ TIMELINE</span>
            <span className="text-slate-600">|</span>
            <span className="text-sky-300">28 AIRCRAFT MODELS</span>
          </div>
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

      {/* 2. MAIN WIDESCREEN DASHBOARD (flex-1, zero empty sidebars, adaptively responsive) */}
      <main className="relative flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-7 z-10">
        {/* Continue Saved Career Hero Banner */}
        {availableSave && (
          <div className="w-full max-w-[1600px] mx-auto mb-6 p-4 md:p-5 bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/90 border-2 border-sky-400 rounded-3xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl border-2"
                style={{ backgroundColor: availableSave.metadata.airlineColor, borderColor: '#38bdf8' }}
              >
                ✈️
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded font-black font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500">
                    {availableSave.isAutoSave ? 'AUTO-SAVE DETECTED' : 'SAVED CAREER'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Saved: {new Date(availableSave.metadata.savedAt).toLocaleString()}
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-black text-white font-mono mt-0.5">
                  {availableSave.metadata.airlineName}
                </h2>
                <div className="text-xs text-slate-300 flex items-center gap-3 flex-wrap mt-1 font-mono">
                  <span>
                    Year {availableSave.metadata.currentYear} • Q{availableSave.metadata.currentQuarter} (Turn {availableSave.metadata.turnNumber})
                  </span>
                  <span>•</span>
                  <span>
                    Cash: <strong className="text-emerald-400">${availableSave.metadata.cashK.toLocaleString()}K</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Fleet: <strong className="text-sky-300">{availableSave.metadata.fleetCount} planes</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Routes: <strong className="text-amber-300">{availableSave.metadata.routesCount} active</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => importFileRef.current?.click()}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl font-bold text-xs md:text-sm shadow transition cursor-pointer flex items-center gap-2"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Import (.json)</span>
              </button>

              <button
                onClick={handleResumeSave}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-sm md:text-base shadow-xl hover:shadow-emerald-500/30 border-2 border-emerald-400 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>▶ Resume Flight Operations (เล่นต่อ)</span>
                <ChevronRight className="w-5 h-5 text-emerald-200 animate-pulse" />
              </button>
            </div>
          </div>
        )}

        <div className="w-full h-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: SIMULATION MODE & TIMELINE ERA (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Step 1: Choose Simulation Mode */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs md:text-sm font-black uppercase tracking-wider text-sky-400 font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 text-xs flex items-center justify-center font-bold">1</span>
                  Select Simulation Game Mode
                </label>
                <span className="text-xs text-slate-400 font-mono">
                  {gameMode === 'CAMPAIGN_20YR' ? '🏆 20-Year Evaluation' : '♾️ Never-ending Empire'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Mode A: Classic 20-Year Campaign */}
                <div
                  onClick={() => setGameMode('CAMPAIGN_20YR')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    gameMode === 'CAMPAIGN_20YR'
                      ? 'bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border-sky-400 shadow-xl shadow-sky-500/15'
                      : 'bg-slate-850/60 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-black text-xs md:text-sm text-white">Classic 20-Year Campaign</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      80Q
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    เล่นครบ 20 ปี (80 ไตรมาส) วัดผลตัดสินผู้ชนะตามกติกา Koei ดั้งเดิม ชนะด้วยมูลค่าสายการบินและเครือข่ายโลก!
                  </p>
                </div>

                {/* Mode B: Infinite Sandbox Mode */}
                <div
                  onClick={() => setGameMode('SANDBOX_INFINITE')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    gameMode === 'SANDBOX_INFINITE'
                      ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border-indigo-400 shadow-xl shadow-indigo-500/15'
                      : 'bg-slate-850/60 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Infinity className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-black text-xs md:text-sm text-white">Infinite Sandbox Mode</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      UNLIMITED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    เล่นต่อเนื่องไร้ขีดจำกัด ไม่มีวันหมดเวลา! สู่ทศวรรษ 2030, 2040+ สัมผัส Tesla AeroStar และ SpaceX Starship
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Choose Era & Historical Timeline */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs md:text-sm font-black uppercase tracking-wider text-sky-400 font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 text-xs flex items-center justify-center font-bold">2</span>
                  Select Starting Era & Historical Timeline
                </label>
                <span className="text-xs text-amber-300 font-mono font-bold">
                  {activeEraInfo.yearRange}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {([1, 2, 3] as const).map((eraNum) => {
                  const info = eraDescriptions[eraNum];
                  const Icon = info.icon;
                  const isSelected = selectedEra === eraNum;

                  return (
                    <div
                      key={eraNum}
                      onClick={() => setSelectedEra(eraNum)}
                      className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-950/90 border-sky-400 shadow-xl shadow-sky-500/20'
                          : 'bg-slate-850/60 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-300' : 'text-slate-400'}`} />
                            <span className="font-black text-xs text-slate-100 font-mono">{info.yearRange}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <h3 className="font-bold text-xs text-white mb-1">{info.title.split(':')[1]}</h3>
                        <p className="text-[10px] text-slate-300 leading-snug line-clamp-2 mb-1.5">{info.subtitle}</p>
                      </div>

                      <div className="border-t border-slate-800 pt-1.5 text-[9px] text-slate-400 font-mono">
                        <span className="text-sky-300 font-bold mr-1">Plane:</span>
                        <span className="text-slate-200">{info.starterPlane}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Historical Fleet & Events Ticker */}
              <div className="mt-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sky-400 font-black">FLEET:</span>
                  <span className="text-slate-300 font-sans truncate max-w-sm">{activeEraInfo.planes}</span>
                </div>
                <div className="text-[10px] text-amber-300 font-mono">
                  {activeEraInfo.events.split(',')[0]}
                </div>
              </div>
            </div>

            {/* Step 3: AI Competitors & Rival Tycoons */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <label className="text-xs md:text-sm font-black uppercase tracking-wider text-sky-400 font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 text-xs flex items-center justify-center font-bold">3</span>
                  <Swords className="w-4 h-4 text-rose-400" />
                  <span>AI Competitors & Rival Tycoons (คู่แข่ง AI ดำเนินธุรกิจ)</span>
                </label>
                <span className="text-xs text-amber-300 font-mono font-bold">
                  {rivalCount === 3 ? '4 Airlines Total (Classic Koei)' : `${rivalCount + 1} Airlines Total`}
                </span>
              </div>

              {/* Sub-row: Competitor Count & HQ Placement Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* 1. Rival Count Selector */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                  <div className="text-[11px] font-mono font-black text-slate-400 uppercase mb-2 flex items-center justify-between">
                    <span>Number of Competitors:</span>
                    <span className="text-sky-300 font-bold">{rivalCount} Rivals</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([1, 2, 3] as const).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setRivalCount(cnt)}
                        className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                          rivalCount === cnt
                            ? 'bg-rose-950/90 text-rose-200 border-rose-500 shadow-md shadow-rose-900/30'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-mono">{cnt} {cnt === 1 ? 'Rival' : 'Rivals'}</span>
                        <span className="text-[10px] opacity-75 font-sans">
                          {cnt === 3 ? '4 Total ★' : `${cnt + 1} Total`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. HQ Placement Mode */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                  <div className="text-[11px] font-mono font-black text-slate-400 uppercase mb-2 flex items-center justify-between">
                    <span>HQ Placement Mode:</span>
                    {placementMode === 'DISTRIBUTED' && (
                      <button
                        type="button"
                        onClick={() => setRerollSeed((p) => p + 1)}
                        className="text-[10px] text-amber-300 hover:text-amber-200 flex items-center gap-1 font-mono transition cursor-pointer"
                        title="Randomize continental cities and rival personalities"
                      >
                        <Shuffle className="w-3 h-3" />
                        <span>Re-roll Rivals & Cities (สุ่มใหม่)</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlacementMode('DISTRIBUTED')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                        placementMode === 'DISTRIBUTED'
                          ? 'bg-sky-950/90 text-sky-200 border-sky-400 shadow-md shadow-sky-900/30'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <span>🎲 Distributed</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                        สุ่มกระจายคนละทวีป
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlacementMode('CUSTOM')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                        placementMode === 'CUSTOM'
                          ? 'bg-indigo-950/90 text-indigo-200 border-indigo-400 shadow-md shadow-indigo-900/30'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Settings2 className="w-3.5 h-3.5" />
                        <span>Custom HQ</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                        เลือกเมืองเอง
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Rival Dossier Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {currentRivalProfiles.map((rival, idx) => {
                  const effectiveHQId =
                    placementMode === 'DISTRIBUTED'
                      ? distributedHQs[idx]
                      : customHQs[rival.id] || rival.defaultHQs[0];
                  const hqCity = CITIES.find((c) => c.id === effectiveHQId) || CITIES[0];

                  return (
                    <div
                      key={rival.id}
                      className="p-3.5 rounded-xl border bg-slate-950/90 flex flex-col justify-between shadow-lg"
                      style={{ borderColor: `${rival.color}66` }}
                    >
                      <div>
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: rival.color }}
                            />
                            <span className="font-black text-xs text-white font-mono truncate">
                              {rival.name}
                            </span>
                          </div>
                          <span
                            className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded uppercase"
                            style={{
                              backgroundColor: `${rival.color}22`,
                              color: rival.color,
                              border: `1px solid ${rival.color}55`,
                            }}
                          >
                            AI #{idx + 1}
                          </span>
                        </div>

                        {/* CEO & Archetype */}
                        <div className="text-xs text-slate-300 font-bold mb-1">
                          CEO: <span className="text-slate-100">{rival.ceoName}</span>
                        </div>
                        <div className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-amber-300 mb-2">
                          {rival.personalityLabel}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mb-3">
                          {rival.personalityDesc}
                        </p>
                      </div>

                      {/* Headquarters Location */}
                      <div className="pt-2 border-t border-slate-800">
                        <label className="text-[10px] font-mono text-slate-400 block mb-1 uppercase font-bold">
                          Headquarters (Primary Hub):
                        </label>
                        {placementMode === 'DISTRIBUTED' ? (
                          <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-between text-xs">
                            <span className="font-bold text-white truncate">
                              {hqCity.name} ({hqCity.id})
                            </span>
                            <span className="text-[9px] font-mono text-sky-400 px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 shrink-0 ml-1">
                              {hqCity.region.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ) : (
                          <select
                            value={effectiveHQId}
                            onChange={(e) =>
                              setCustomHQs((prev) => ({ ...prev, [rival.id]: e.target.value }))
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-sky-400 cursor-pointer"
                          >
                            {CITIES.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.id}) — {c.region.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </select>
                        )}
                        <div className="text-[9px] text-slate-500 font-mono mt-1 flex justify-between">
                          <span>25 Initial Slots</span>
                          <span>• 3 Airliners</span>
                          <span>• 2 Active Routes</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: AIRLINE PROFILE & HEADQUARTERS (lg:col-span-5) */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 font-mono font-black text-xs md:text-sm text-sky-400 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  <span>4. Player Airline Executive Dossier</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                  NEW AIRLINE INC.
                </span>
              </div>

              {/* Airline Enterprise Name */}
              <div className="mt-4">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Airline Enterprise Brand Name:
                </label>
                <input
                  type="text"
                  value={airlineName}
                  onChange={(e) => setAirlineName(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-bold text-sm focus:outline-none focus:border-sky-400"
                />
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {namePresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAirlineName(preset)}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        airlineName === preset
                          ? 'bg-sky-600 text-white border-sky-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* World Headquarters Hub City */}
              <div className="mt-4">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  World Headquarters (Primary Hub City):
                </label>
                <select
                  value={homeCityId}
                  onChange={(e) => setHomeCityId(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-bold text-sm focus:outline-none focus:border-sky-400 cursor-pointer"
                >
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id}) — {c.country} • {c.population}M Citizens
                    </option>
                  ))}
                </select>

                {/* Selected City Dossier Card */}
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white text-sm">{selectedHomeCity.name}</span>
                    <span className="text-slate-400 ml-1.5 font-mono">({selectedHomeCity.country})</span>
                    <div className="text-[11px] text-sky-400 font-mono mt-0.5">
                      Region: {selectedHomeCity.region.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono font-bold text-[11px]">
                      25 Slots Granted
                    </span>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Pop: {selectedHomeCity.population}M
                    </div>
                  </div>
                </div>
              </div>

              {/* CEO Difficulty & Initial Capital */}
              <div className="mt-4">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  4. Initial Starting Capital & Difficulty:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { level: 1, name: 'Normal CEO', cash: '$100,000K' },
                    { level: 2, name: 'Seasoned Tycoon', cash: '$75,000K' },
                    { level: 3, name: 'Hardcore', cash: '$50,000K' },
                  ].map((d) => (
                    <div
                      key={d.level}
                      onClick={() => setDifficulty(d.level)}
                      className={`p-2.5 rounded-xl border-2 text-center cursor-pointer transition-all ${
                        difficulty === d.level
                          ? 'bg-emerald-950 border-emerald-400 text-emerald-200 font-black shadow-md'
                          : 'bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold">{d.name}</div>
                      <div className="font-mono text-xs text-emerald-400 font-black mt-0.5">
                        {d.cash}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Starter Fleet & Alliance Briefing */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/70 to-slate-900 border border-sky-800/60 text-xs">
              <div className="font-mono font-black text-sky-300 mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>INCORPORATION PACKAGE (DAY 1 PROVISIONS):</span>
              </div>
              <ul className="text-slate-300 space-y-1 font-mono text-[11px]">
                <li>• 3x Commercial Airliners: <span className="text-white font-bold">{starterModel.manufacturer} {starterModel.model}</span></li>
                <li>• 2x Turnkey International Routes open immediately from <span className="text-sky-300 font-bold">{selectedHomeCity.id}</span></li>
                <li>• Certified Airline Operating Certificate (AOC) with Global Slots</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* 3. BOTTOM COMMAND BAR (shrink-0, always in view, 100% visible, never cut off) */}
      <footer className="relative shrink-0 bg-slate-900/95 border-t border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 z-20 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 text-xs md:text-sm font-mono text-slate-300">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-sky-400 font-bold">
            {gameMode === 'CAMPAIGN_20YR' ? '🏆 20-Year Campaign (80Q)' : '♾️ Infinite Sandbox'}
          </span>
          <span className="hidden sm:inline text-slate-400">
            Era: <strong className="text-white">{activeEraInfo.yearRange}</strong>
          </span>
          <span className="hidden md:inline text-slate-400">
            HQ: <strong className="text-white">{selectedHomeCity.name}</strong>
          </span>
          <span className="text-slate-400">
            Cash: <strong className="text-emerald-400">${difficulty === 1 ? '100,000K' : difficulty === 2 ? '75,000K' : '50,000K'}</strong>
          </span>
          <span className="hidden lg:inline text-slate-400">
            Rivals: <strong className="text-rose-400">{rivalCount} AI Competitors</strong>
          </span>
        </div>

        {/* Big Launch Button */}
        <button
          onClick={handleStart}
          className="px-8 py-3.5 bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm md:text-base rounded-xl shadow-xl shadow-sky-500/25 transition-all active:scale-[0.98] border-2 border-sky-400 cursor-pointer flex items-center gap-2.5"
        >
          <span>COMMENCE AIRLINE OPERATION (START SIMULATION)</span>
          <ChevronRight className="w-5 h-5 text-sky-200" />
        </button>
      </footer>
    </div>
  );
};
