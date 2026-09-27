import React, { useState } from 'react';
import { GameState, City, Route, AircraftModel, BusinessVenture, NegotiatorMission } from './types/game';
import { advanceQuarter } from './simulation/engine';
import { createDefaultNegotiators } from './data/negotiators';
import { WorldMap } from './components/WorldMap';
import { ExecutiveHeader } from './components/ExecutiveHeader';
import { BottomToolbar } from './components/BottomToolbar';
import { RouteModal } from './components/RouteModal';
import { AircraftShopModal } from './components/AircraftShopModal';
import { SlotNegotiationModal } from './components/SlotNegotiationModal';
import { BusinessModal } from './components/BusinessModal';
import { ManageRoutesModal } from './components/ManageRoutesModal';
import { FinancialReportModal } from './components/FinancialReportModal';
import { QuarterReportModal } from './components/QuarterReportModal';
import { NewGameSetupModal } from './components/NewGameSetupModal';
import { CityDetailModal } from './components/CityDetailModal';

export function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Modal display toggles
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showManageRoutes, setShowManageRoutes] = useState(false);
  const [showAircraftShop, setShowAircraftShop] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showFinancialReport, setShowFinancialReport] = useState(false);
  const [showQuarterReport, setShowQuarterReport] = useState(false);

  // Selected city on map and inspecting city modal
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [inspectingCity, setInspectingCity] = useState<City | null>(null);

  // If no game initialized, show setup
  if (!gameState) {
    return <NewGameSetupModal onStartGame={(state) => setGameState(state)} />;
  }

  const playerAirline = gameState.airlines.find((a) => a.isHuman)!;

  // Add new route
  const handleAddRoute = (newRoute: Route) => {
    // Mark aircraft as assigned
    const updatedFleet = playerAirline.fleet.map((plane) => {
      if (newRoute.assignedAircraftIds.includes(plane.instanceId)) {
        return { ...plane, assignedRouteId: newRoute.id };
      }
      return plane;
    });

    const updatedAirlines = gameState.airlines.map((a) => {
      if (a.id === playerAirline.id) {
        return { ...a, fleet: updatedFleet };
      }
      return a;
    });

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
      routes: [...gameState.routes, newRoute],
    });
  };

  // Update existing route (pause/resume)
  const handleUpdateRoute = (updatedRoute: Route) => {
    setGameState({
      ...gameState,
      routes: gameState.routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
    });
  };

  // Close/Delete route (frees assigned aircraft back to fleet)
  const handleDeleteRoute = (routeId: string) => {
    const route = gameState.routes.find((r) => r.id === routeId);
    if (!route) return;

    const updatedFleet = playerAirline.fleet.map((plane) => {
      if (route.assignedAircraftIds.includes(plane.instanceId)) {
        return { ...plane, assignedRouteId: null };
      }
      return plane;
    });

    const updatedAirlines = gameState.airlines.map((a) => {
      if (a.id === playerAirline.id) {
        return { ...a, fleet: updatedFleet };
      }
      return a;
    });

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
      routes: gameState.routes.filter((r) => r.id !== routeId),
    });
  };

  // Buy new aircraft (supports promotional discount deals)
  const handleBuyAircraft = (model: AircraftModel, effectivePriceK?: number) => {
    const finalPriceK = effectivePriceK !== undefined ? effectivePriceK : model.priceK;
    if (playerAirline.cashK < finalPriceK) return;

    const newInstance = {
      instanceId: `PLANE_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      modelId: model.id,
      ageYears: 0,
      purchaseYear: gameState.currentYear,
      conditionPct: 100,
      assignedRouteId: null,
    };

    const updatedAirlines = gameState.airlines.map((a) => {
      if (a.id === playerAirline.id) {
        return {
          ...a,
          cashK: a.cashK - finalPriceK,
          fleet: [...a.fleet, newInstance],
        };
      }
      return a;
    });

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
    });
  };

  // Sell idle aircraft
  const handleSellAircraft = (instanceId: string, sellPriceK: number) => {
    const updatedFleet = playerAirline.fleet.filter((f) => f.instanceId !== instanceId);
    const updatedAirlines = gameState.airlines.map((a) => {
      if (a.id === playerAirline.id) {
        return {
          ...a,
          cashK: a.cashK + sellPriceK,
          fleet: updatedFleet,
        };
      }
      return a;
    });

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
    });
  };

  // Ensure player airline negotiators exist
  if (playerAirline && (!playerAirline.negotiators || playerAirline.negotiators.length === 0)) {
    playerAirline.negotiators = createDefaultNegotiators();
  }

  // Dispatch field negotiator on mission (Quarters-based treaty / acquisition)
  const handleDispatchNegotiator = (negotiatorId: string, mission: NegotiatorMission) => {
    if (playerAirline.cashK < mission.costK) return;

    const currentNegotiators = playerAirline.negotiators && playerAirline.negotiators.length > 0
      ? playerAirline.negotiators
      : createDefaultNegotiators();

    const updatedNegotiators = currentNegotiators.map((neg) => {
      if (neg.id === negotiatorId) {
        return {
          ...neg,
          status: 'DISPATCHED' as const,
          currentMission: mission,
        };
      }
      return neg;
    });

    const updatedAirlines = gameState.airlines.map((a) => {
      if (a.id === playerAirline.id) {
        return {
          ...a,
          cashK: a.cashK - mission.costK,
          negotiators: updatedNegotiators,
        };
      }
      return a;
    });

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
    });
  };

  // Instant HQ Action by David Sterling: Surrender unused slots
  const handleInstantReturnSlots = (cityId: string, count: number) => {
    const currentSlots = playerAirline.slots[cityId] || 0;
    const remaining = Math.max(0, currentSlots - count);

    const updatedAirlines = gameState.airlines.map((a) => {
      if (a.id === playerAirline.id) {
        return {
          ...a,
          slots: {
            ...a.slots,
            [cityId]: remaining,
          },
        };
      }
      return a;
    });

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
    });
  };

  // Instant HQ Action by David Sterling: Liquidate/Divest subsidiary venture
  const handleInstantSellBusiness = (businessId: string, refundK: number) => {
    const updatedBusinesses = playerAirline.businesses.filter((b) => b.id !== businessId);

    const updatedAirlines = gameState.airlines.map((a) => {
      if (a.id === playerAirline.id) {
        return {
          ...a,
          cashK: a.cashK + refundK,
          businesses: updatedBusinesses,
        };
      }
      return a;
    });

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
    });
  };

  // Establish regional hub
  const handleEstablishHub = (cityId: string, costK: number) => {
    if (playerAirline.cashK < costK) return;

    const updatedAirlines = gameState.airlines.map((a) => {
      if (a.id === playerAirline.id) {
        return {
          ...a,
          cashK: a.cashK - costK,
          hubCityIds: [...a.hubCityIds, cityId],
        };
      }
      return a;
    });

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
    });
  };

  // Buy business venture (fallback or direct)
  const handleBuyBusiness = (venture: BusinessVenture) => {
    if (playerAirline.cashK < venture.purchaseCostK) return;

    const updatedAirlines = gameState.airlines.map((a) => {
      if (a.id === playerAirline.id) {
        return {
          ...a,
          cashK: a.cashK - venture.purchaseCostK,
          businesses: [...a.businesses, venture],
        };
      }
      return a;
    });

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
    });
  };

  // Advance to next quarter
  const handleAdvanceQuarter = () => {
    const nextState = advanceQuarter(gameState);
    setGameState(nextState);
    setShowQuarterReport(true); // Open executive briefing modal!
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-slate-950 overflow-hidden text-slate-100 font-sans">
      {/* 1. Executive Top Bar */}
      <ExecutiveHeader gameState={gameState} playerAirline={playerAirline} />

      {/* 2. Interactive World Map */}
      <main className="flex-1 min-h-0 min-w-0 relative w-full overflow-hidden">
        <WorldMap
          playerAirline={playerAirline}
          airlines={gameState.airlines}
          routes={gameState.routes}
          selectedCity={selectedCity}
          onSelectCity={(city) => {
            setSelectedCity(city);
            setInspectingCity(city);
          }}
        />
      </main>

      {/* 3. Executive Bottom Toolbar */}
      <BottomToolbar
        onOpenRouteModal={() => setShowRouteModal(true)}
        onOpenFleetModal={() => setShowManageRoutes(true)}
        onOpenAircraftShop={() => setShowAircraftShop(true)}
        onOpenBusinessModal={() => setShowBusinessModal(true)}
        onOpenSlotModal={() => setShowSlotModal(true)}
        onOpenFinancialReport={() => setShowFinancialReport(true)}
        onAdvanceQuarter={handleAdvanceQuarter}
      />

      {/* MODALS */}
      {showRouteModal && (
        <RouteModal
          playerAirline={playerAirline}
          onClose={() => setShowRouteModal(false)}
          onAddRoute={handleAddRoute}
          onOpenAircraftShop={() => {
            setShowRouteModal(false);
            setShowAircraftShop(true);
          }}
          initialOriginCity={selectedCity}
          fuelPriceIndex={gameState.fuelPriceIndex}
          currentYear={gameState.currentYear}
          currentQuarter={gameState.currentQuarter}
        />
      )}

      {showManageRoutes && (
        <ManageRoutesModal
          playerAirline={playerAirline}
          routes={gameState.routes}
          onClose={() => setShowManageRoutes(false)}
          onUpdateRoute={handleUpdateRoute}
          onDeleteRoute={handleDeleteRoute}
        />
      )}

      {showAircraftShop && (
        <AircraftShopModal
          playerAirline={playerAirline}
          onClose={() => setShowAircraftShop(false)}
          onBuyAircraft={handleBuyAircraft}
          onSellAircraft={handleSellAircraft}
          currentYear={gameState.currentYear}
          currentEra={gameState.era}
          activeDiscountDeal={gameState.activeDiscountDeal}
        />
      )}

      {showSlotModal && (
        <SlotNegotiationModal
          playerAirline={playerAirline}
          onClose={() => setShowSlotModal(false)}
          onDispatchNegotiator={handleDispatchNegotiator}
          onEstablishHub={handleEstablishHub}
          initialCityId={selectedCity?.id}
        />
      )}

      {showBusinessModal && (
        <BusinessModal
          playerAirline={playerAirline}
          onClose={() => setShowBusinessModal(false)}
          onBuyBusiness={handleBuyBusiness}
        />
      )}

      {showFinancialReport && (
        <FinancialReportModal
          gameState={gameState}
          playerAirline={playerAirline}
          onClose={() => setShowFinancialReport(false)}
        />
      )}

      {showQuarterReport && (
        <QuarterReportModal
          gameState={gameState}
          playerAirline={playerAirline}
          onClose={() => setShowQuarterReport(false)}
          onOpenAircraftShop={() => setShowAircraftShop(true)}
          onContinueSandbox={() => {
            setGameState({
              ...gameState,
              gameMode: 'SANDBOX_INFINITE',
              isGameOver: false,
            });
          }}
        />
      )}

      {/* City Detail & Inspector Modal */}
      {inspectingCity && (
        <CityDetailModal
          city={inspectingCity}
          playerAirline={playerAirline}
          routes={gameState.routes}
          onClose={() => setInspectingCity(null)}
          onOpenRouteFromCity={(city) => {
            setSelectedCity(city);
            setShowRouteModal(true);
          }}
          onDispatchNegotiator={handleDispatchNegotiator}
          onInstantReturnSlots={handleInstantReturnSlots}
          onInstantSellBusiness={handleInstantSellBusiness}
        />
      )}
    </div>
  );
}

export default App;
