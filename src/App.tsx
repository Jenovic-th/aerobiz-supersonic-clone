import React, { useState } from 'react';
import { GameState, City, Route, AircraftModel, BusinessVenture, NegotiatorMission, PendingAircraftOrder, RegionalCampaign } from './types/game';
import { advanceQuarter } from './simulation/engine';
import { createDefaultNegotiators } from './data/negotiators';
import { saveGameToLocalStorage, exportSaveFile, importSaveFile } from './utils/saveLoad';
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
import { BoardMeetingModal } from './components/BoardMeetingModal';
import { VictoryDefeatModal } from './components/VictoryDefeatModal';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Modal display toggles
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showManageRoutes, setShowManageRoutes] = useState(false);
  const [showAircraftShop, setShowAircraftShop] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showFinancialReport, setShowFinancialReport] = useState(false);
  const [showQuarterReport, setShowQuarterReport] = useState(false);
  const [showBoardMeeting, setShowBoardMeeting] = useState(false);
  const [showVictoryDefeatModal, setShowVictoryDefeatModal] = useState(false);

  // Selected city on map and inspecting city modal
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [inspectingCity, setInspectingCity] = useState<City | null>(null);
  const [routeOriginCity, setRouteOriginCity] = useState<City | null>(null);
  const [routeDestCity, setRouteDestCity] = useState<City | null>(null);

  React.useEffect(() => {
    (window as any).__gameState = gameState;
    (window as any).__setGameState = setGameState;
    (window as any).__setShowVictoryDefeatModal = setShowVictoryDefeatModal;
    (window as any).__setShowQuarterReport = setShowQuarterReport;
  }, [gameState]);

  // If no game initialized, show setup
  if (!gameState) {
    return <NewGameSetupModal onStartGame={(state) => setGameState(state)} />;
  }

  const playerAirline = gameState.airlines.find((a) => a.isHuman)!;

  // Add new route
  const handleAddRoute = (newRoute: Route, inceptionCostK: number = 0) => {
    if (playerAirline.cashK < inceptionCostK) {
      showToast(`Cannot inaugurate route: Insufficient treasury ($${inceptionCostK.toLocaleString()}K required)`);
      return;
    }

    // Mark aircraft as assigned
    const updatedFleet = playerAirline.fleet.map((plane) => {
      if (newRoute.assignedAircraftIds.includes(plane.instanceId)) {
        return { ...plane, assignedRouteId: newRoute.id };
      }
      return plane;
    });

    const updatedAirlines = gameState.airlines.map((a) => {
      if (a.id === playerAirline.id) {
        return {
          ...a,
          cashK: a.cashK - inceptionCostK,
          fleet: updatedFleet,
        };
      }
      return a;
    });

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
      routes: [...gameState.routes, newRoute],
    });

    if (inceptionCostK > 0) {
      showToast(
        `Commercial route inaugurated! Paid $${inceptionCostK.toLocaleString()}K station setup fee.`
      );
    }
  };

  // Update existing route (pause/resume or operational modification)
  const handleUpdateRoute = (updatedRoute: Route, prevAssignedIds?: string[]) => {
    const oldRoute = gameState.routes.find((r) => r.id === updatedRoute.id);
    const oldAssignedIds = prevAssignedIds || oldRoute?.assignedAircraftIds || [];
    const newAssignedIds = updatedRoute.assignedAircraftIds;

    const hasAircraftChanged =
      oldAssignedIds.length !== newAssignedIds.length ||
      oldAssignedIds.some((id) => !newAssignedIds.includes(id));

    let updatedAirlines = gameState.airlines;
    if (hasAircraftChanged) {
      updatedAirlines = gameState.airlines.map((a) => {
        if (a.id === updatedRoute.airlineId) {
          const updatedFleet = a.fleet.map((plane) => {
            if (oldAssignedIds.includes(plane.instanceId) && !newAssignedIds.includes(plane.instanceId)) {
              return { ...plane, assignedRouteId: null };
            }
            if (newAssignedIds.includes(plane.instanceId)) {
              return { ...plane, assignedRouteId: updatedRoute.id };
            }
            return plane;
          });
          return { ...a, fleet: updatedFleet };
        }
        return a;
      });
    }

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
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

  // Order new aircraft (1 quarter lead time factory delivery with 5% delay risk)
  const handleBuyAircraft = (model: AircraftModel, effectivePriceK?: number, quantity: number = 1) => {
    const unitPriceK = effectivePriceK !== undefined ? effectivePriceK : model.priceK;
    const count = Math.max(1, Math.floor(quantity));
    const totalCostK = unitPriceK * count;
    if (playerAirline.cashK < totalCostK) {
      showToast(`Cannot order aircraft: Insufficient treasury ($${totalCostK.toLocaleString()}K required)`);
      return;
    }

    const delivYear = gameState.currentQuarter === 4 ? gameState.currentYear + 1 : gameState.currentYear;
    const delivQuarter = gameState.currentQuarter === 4 ? 1 : ((gameState.currentQuarter + 1) as 1 | 2 | 3 | 4);

    const newOrder: PendingAircraftOrder = {
      orderId: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      airlineId: playerAirline.id,
      modelId: model.id,
      modelName: model.model,
      manufacturer: model.manufacturer,
      quantity: count,
      unitPriceK,
      totalCostK,
      orderYear: gameState.currentYear,
      orderQuarter: gameState.currentQuarter,
      deliveryYear: delivYear,
      deliveryQuarter: delivQuarter,
      status: 'PENDING',
    };

    const currentPending = playerAirline.pendingOrders || [];

    const updatedAirlines = gameState.airlines.map((a) => {
      if (a.id === playerAirline.id) {
        return {
          ...a,
          cashK: a.cashK - totalCostK,
          pendingOrders: [...currentPending, newOrder],
        };
      }
      return a;
    });

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
    });

    showToast(
      `Placed order for ${count}x ${model.model}! Scheduled factory delivery: ${delivYear} Q${delivQuarter}.`
    );
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

    showToast(
      `Dispatched diplomatic envoy to ${mission.targetCityName}! (Treaty fee: $${mission.costK.toLocaleString()}K)`
    );
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

    const bonusSlots = 15;
    const currentSlots = playerAirline.slots[cityId] || 0;
    const newSlots = currentSlots + bonusSlots;

    const currentAirportCap = gameState.airportSlots?.[cityId] ?? 100;
    const updatedAirportSlots = {
      ...(gameState.airportSlots || {}),
      [cityId]: currentAirportCap + bonusSlots,
    };

    const updatedAirlines = gameState.airlines.map((a) => {
      if (a.id === playerAirline.id) {
        return {
          ...a,
          cashK: a.cashK - costK,
          hubCityIds: [...a.hubCityIds, cityId],
          slots: {
            ...a.slots,
            [cityId]: newSlots,
          },
        };
      }
      return a;
    });

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
      airportSlots: updatedAirportSlots,
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

  // Launch regional advertising campaign
  const handleLaunchCampaign = (campaign: RegionalCampaign) => {
    if (playerAirline.cashK < campaign.costK) {
      showToast(`Cannot launch campaign: Insufficient treasury ($${campaign.costK.toLocaleString()}K required)`);
      return;
    }

    const existing = (playerAirline.activeCampaigns || []).filter((c) => c.regionId !== campaign.regionId);

    const updatedAirlines = gameState.airlines.map((a) => {
      if (a.id === playerAirline.id) {
        return {
          ...a,
          cashK: a.cashK - campaign.costK,
          activeCampaigns: [...existing, campaign],
        };
      }
      return a;
    });

    setGameState({
      ...gameState,
      airlines: updatedAirlines,
    });

    showToast(`📢 Launched ${campaign.name} in ${campaign.regionName}! (Demand Boost: +${campaign.demandBoostPct}%)`);
  };

  // Sell business venture from BusinessModal
  const handleSellBusiness = (ventureId: string, refundK: number) => {
    const venture = playerAirline.businesses.find((b) => b.id === ventureId);
    const updatedBusinesses = playerAirline.businesses.filter((b) => b.id !== ventureId);

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

    showToast(`🏢 Divested ${venture?.name || 'Venture'} for +$${refundK.toLocaleString()}K liquidation proceeds!`);
  };

  // Advance to next quarter (Auto-saves to localStorage!)
  const handleAdvanceQuarter = () => {
    const nextState = advanceQuarter(gameState);
    setGameState(nextState);
    saveGameToLocalStorage(nextState, true);
    showToast('💾 Auto-saved (บันทึกอัตโนมัติ)');
    if (nextState.isGameOver) {
      setShowVictoryDefeatModal(true);
    } else {
      setShowQuarterReport(true); // Open executive briefing modal!
    }
  };

  const handleQuickSave = () => {
    if (!gameState) return;
    saveGameToLocalStorage(gameState, false);
    showToast('💾 Game Saved to Local Storage (บันทึกเซฟเรียบร้อย)');
  };

  const handleExportSave = () => {
    if (!gameState) return;
    exportSaveFile(gameState);
    showToast('📥 Save File Exported (ดาวน์โหลดไฟล์เซฟสำเร็จ)');
  };

  const handleImportSave = async (file: File) => {
    try {
      const imported = await importSaveFile(file);
      setGameState(imported);
      showToast(
        `📂 Loaded Save: ${imported.airlines.find((a) => a.isHuman)?.name || 'Airline'} (Turn ${imported.turnNumber})`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to import save file');
    }
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-slate-950 overflow-hidden text-slate-100 font-sans relative">
      {/* 1. Executive Top Bar */}
      <ExecutiveHeader
        gameState={gameState}
        playerAirline={playerAirline}
        onQuickSave={handleQuickSave}
        onExportSave={handleExportSave}
        onImportSave={handleImportSave}
      />

      {/* Floating System Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2 bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 rounded-xl shadow-2xl font-black text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

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
        onOpenRouteModal={() => {
          setRouteOriginCity(selectedCity);
          setRouteDestCity(null);
          setShowRouteModal(true);
        }}
        onOpenFleetModal={() => setShowManageRoutes(true)}
        onOpenAircraftShop={() => setShowAircraftShop(true)}
        onOpenBusinessModal={() => setShowBusinessModal(true)}
        onOpenSlotModal={() => setShowSlotModal(true)}
        onOpenFinancialReport={() => setShowFinancialReport(true)}
        onOpenBoardMeeting={() => setShowBoardMeeting(true)}
        onAdvanceQuarter={handleAdvanceQuarter}
      />

      {/* MODALS */}
      {showRouteModal && (
        <RouteModal
          playerAirline={playerAirline}
          existingRoutes={gameState.routes}
          onClose={() => setShowRouteModal(false)}
          onAddRoute={handleAddRoute}
          onOpenAircraftShop={() => {
            setShowRouteModal(false);
            setShowAircraftShop(true);
          }}
          initialOriginCity={routeOriginCity}
          initialDestCity={routeDestCity}
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
          gameState={gameState}
        />
      )}

      {showAircraftShop && (
        <AircraftShopModal
          playerAirline={playerAirline}
          onClose={() => setShowAircraftShop(false)}
          onBuyAircraft={handleBuyAircraft}
          onSellAircraft={handleSellAircraft}
          currentYear={gameState.currentYear}
          currentQuarter={gameState.currentQuarter}
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
          gameState={gameState}
        />
      )}

      {showBusinessModal && (
        <BusinessModal
          playerAirline={playerAirline}
          onClose={() => setShowBusinessModal(false)}
          onBuyBusiness={handleBuyBusiness}
          onSellBusiness={handleSellBusiness}
          onLaunchCampaign={handleLaunchCampaign}
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
          onClose={() => {
            setShowQuarterReport(false);
            if (gameState.isGameOver) {
              setShowVictoryDefeatModal(true);
            }
          }}
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

      {/* Board of Directors Meeting Modal */}
      {showBoardMeeting && (
        <BoardMeetingModal
          gameState={gameState}
          playerAirline={playerAirline}
          onClose={() => setShowBoardMeeting(false)}
          onOpenRouteModal={(originCity, destCity) => {
            setShowBoardMeeting(false);
            setRouteOriginCity(originCity || null);
            setRouteDestCity(destCity || null);
            setShowRouteModal(true);
          }}
          onOpenManageRoutes={() => {
            setShowBoardMeeting(false);
            setShowManageRoutes(true);
          }}
          onOpenAircraftShop={() => {
            setShowBoardMeeting(false);
            setShowAircraftShop(true);
          }}
          onOpenBusinessModal={() => {
            setShowBoardMeeting(false);
            setShowBusinessModal(true);
          }}
        />
      )}

      {/* Victory / Defeat Modal */}
      {showVictoryDefeatModal && (
        <VictoryDefeatModal
          gameState={gameState}
          playerAirline={playerAirline}
          onClose={() => setShowVictoryDefeatModal(false)}
          onContinueSandbox={() => {
            setGameState({
              ...gameState,
              gameMode: 'SANDBOX_INFINITE',
              isGameOver: false,
            });
            setShowVictoryDefeatModal(false);
          }}
          onRestartGame={() => {
            setGameState(null);
            setShowVictoryDefeatModal(false);
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
            setRouteOriginCity(city);
            setRouteDestCity(null);
            setShowRouteModal(true);
          }}
          onDispatchNegotiator={handleDispatchNegotiator}
          onInstantReturnSlots={handleInstantReturnSlots}
          onInstantSellBusiness={handleInstantSellBusiness}
          onEstablishHub={handleEstablishHub}
          gameState={gameState}
        />
      )}
    </div>
  );
}

export default App;
