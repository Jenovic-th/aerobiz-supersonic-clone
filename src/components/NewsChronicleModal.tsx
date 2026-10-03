import React, { useState, useMemo } from 'react';
import { GameState, Airline, WorldEvent, AircraftDiscountDeal, RegionId } from '../types/game';
import { CITIES } from '../data/cities';
import { useEscapeKey } from '../hooks/useEscapeKey';
import {
  X,
  Newspaper,
  Globe2,
  Plane,
  AlertTriangle,
  Flame,
  Handshake,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Sparkles,
  Trophy,
  History,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Shield,
  Coins,
  Radio,
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { useI18n } from '../utils/i18n';

interface NewsChronicleModalProps {
  gameState: GameState;
  playerAirline: Airline;
  onClose: () => void;
  onOpenAircraftShop?: () => void;
  onOpenSlotModal?: () => void;
  onOpenRouteModal?: () => void;
}

type NewsCategoryFilter = 'ALL' | 'WORLD' | 'AVIATION' | 'RIVALS' | 'OPERATIONS';

export const NewsChronicleModal: React.FC<NewsChronicleModalProps> = ({
  gameState,
  playerAirline,
  onClose,
  onOpenAircraftShop,
  onOpenSlotModal,
  onOpenRouteModal,
}) => {
  const { t, lang } = useI18n();
  const isTh = lang === 'th';
  useEscapeKey(onClose);

  const [activeTab, setActiveTab] = useState<'BREAKING' | 'ARCHIVES'>('BREAKING');
  const [categoryFilter, setCategoryFilter] = useState<NewsCategoryFilter>('ALL');

  // Archive quarter selection (default to most recent archived quarter or 0)
  const history = gameState.quarterHistory || [];
  const [selectedArchiveIndex, setSelectedArchiveIndex] = useState<number>(
    history.length > 0 ? history.length - 1 : 0
  );

  const cityMap = useMemo(() => new Map(CITIES.map((c) => [c.id, c])), []);

  const quarterNames = isTh
    ? ['Q1 (ม.ค.-มี.ค.)', 'Q2 (เม.ย.-มิ.ย.)', 'Q3 (ก.ค.-ก.ย.)', 'Q4 (ต.ค.-ธ.ค.)']
    : ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
  const currentQuarterText = quarterNames[gameState.currentQuarter - 1];

  const activeEvents = gameState.activeEvents || [];
  const upcomingEvents = gameState.upcomingEvents || [];
  const discountDeal = gameState.activeDiscountDeal;
  const newPlanes = gameState.newlyIntroducedAircraft || [];
  const retiringPlanes = gameState.retiringAircraft || [];
  const retiredPlanes = gameState.retiredAircraft || [];
  const deliveries = gameState.aircraftDeliveries || [];
  const diplomaticReports = gameState.diplomaticReports || [];
  const closedRoutes = gameState.lastQuarterClosedRoutes || [];
  const newAIRoutes = gameState.lastQuarterNewRoutes || [];
  const competitorActions = gameState.competitorActions || [];
  const incidents = gameState.routeIncidents || [];
  const expansions = gameState.airportExpansions || [];

  // Standings
  const standings = gameState.airlineStandings || [];
  const playerStanding = standings.find((s) => s.isHuman);

  // Selected archived quarter data
  const selectedArchive = history[selectedArchiveIndex];

  // News counts calculation
  const worldNewsCount = activeEvents.length + upcomingEvents.length + (gameState.fuelPriceIndex !== 1.0 ? 1 : 0);
  const aviationNewsCount = (discountDeal ? 1 : 0) + newPlanes.length + retiringPlanes.length + deliveries.length;
  const rivalNewsCount = diplomaticReports.length + closedRoutes.length + newAIRoutes.length + competitorActions.length + expansions.length;
  const operationsNewsCount = incidents.length;
  const totalNewsCount = worldNewsCount + aviationNewsCount + rivalNewsCount + operationsNewsCount;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150 select-none"
      data-testid="news-chronicle-modal"
    >
      <div className="bg-slate-900 border-2 border-sky-500/80 rounded-3xl shadow-[0_0_80px_rgba(14,165,233,0.3)] w-[96vw] max-w-[1680px] h-[93vh] max-h-[95vh] flex flex-col text-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* 1. MODAL HEADER */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 px-6 sm:px-8 py-4.5 border-b border-sky-800/80 flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 border border-sky-300 text-white shadow-lg">
              <Newspaper className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  {t.news.headerTitle}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400 font-mono font-bold uppercase hidden sm:inline">
                  {t.news.headerBadge}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-sky-300 font-mono mt-1">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>
                  {gameState.currentYear} • {currentQuarterText}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-300 font-bold">
                  {gameState.gameMode === 'SANDBOX_INFINITE'
                    ? (isTh ? `เทิร์น ${gameState.turnNumber} ♾️` : `Turn ${gameState.turnNumber} ♾️`)
                    : (isTh ? `เทิร์น ${gameState.turnNumber}/80 🏆` : `Turn ${gameState.turnNumber}/80 🏆`)}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-bold">{t.news.bulletinsActive.replace('{count}', String(totalNewsCount))}</span>
              </div>
            </div>
          </div>

          {/* Standardized Header Close Button [X] */}
          <button
            onClick={() => {
              playSound.click();
              onClose();
            }}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition cursor-pointer shrink-0"
            title={isTh ? 'ปิดหน้าต่าง (Esc)' : 'Close (Esc)'}
            data-testid="modal-close-header-btn"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 2. TOP TABS: Breaking News vs. Historical Archives */}
        <div className="bg-slate-950 px-6 sm:px-8 border-b border-slate-800 flex items-center justify-between shrink-0 gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playSound.click();
                setActiveTab('BREAKING');
              }}
              data-testid="news-tab-breaking"
              className={`px-5 sm:px-6 py-3.5 font-mono text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'BREAKING'
                  ? 'border-sky-400 text-sky-300 bg-sky-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
              <span>{t.news.breakingNewsTab}</span>
              {totalNewsCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400 font-bold">
                  {totalNewsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                playSound.click();
                setActiveTab('ARCHIVES');
              }}
              data-testid="news-tab-archives"
              className={`px-5 sm:px-6 py-3.5 font-mono text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'ARCHIVES'
                  ? 'border-amber-400 text-amber-300 bg-amber-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>{t.news.historicalArchivesTab}</span>
              {history.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400 font-bold">
                  {t.news.quartersCount.replace('{count}', String(history.length))}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1 Category Filter Chips (Only shown in BREAKING tab) */}
          {activeTab === 'BREAKING' && (
            <div className="hidden md:flex items-center gap-2 py-2 overflow-x-auto text-xs font-mono">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer ${
                  categoryFilter === 'ALL'
                    ? 'bg-sky-600 text-white border-sky-400 shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                {isTh ? 'ทั้งหมด' : 'All'} ({totalNewsCount})
              </button>
              <button
                onClick={() => setCategoryFilter('WORLD')}
                className={`px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  categoryFilter === 'WORLD'
                    ? 'bg-purple-600 text-white border-purple-400 shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-purple-400 hover:text-purple-300'
                }`}
              >
                <span>🌍 {isTh ? 'เหตุการณ์โลก' : 'World'}</span>
                <span>({worldNewsCount})</span>
              </button>
              <button
                onClick={() => setCategoryFilter('AVIATION')}
                className={`px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  categoryFilter === 'AVIATION'
                    ? 'bg-amber-600 text-white border-amber-400 shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-amber-400 hover:text-amber-300'
                }`}
              >
                <span>✈️ {isTh ? 'เครื่องบิน' : 'Aircraft'}</span>
                <span>({aviationNewsCount})</span>
              </button>
              <button
                onClick={() => setCategoryFilter('RIVALS')}
                className={`px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  categoryFilter === 'RIVALS'
                    ? 'bg-blue-600 text-white border-blue-400 shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-blue-400 hover:text-blue-300'
                }`}
              >
                <span>⚔️ {isTh ? 'คู่แข่ง' : 'Rivals'}</span>
                <span>({rivalNewsCount})</span>
              </button>
              {operationsNewsCount > 0 && (
                <button
                  onClick={() => setCategoryFilter('OPERATIONS')}
                  className={`px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    categoryFilter === 'OPERATIONS'
                      ? 'bg-rose-600 text-white border-rose-400 shadow'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-rose-400 hover:text-rose-300'
                  }`}
                >
                  <span>⚠️ {isTh ? 'เหตุขัดข้อง' : 'Incidents'}</span>
                  <span>({operationsNewsCount})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. MODAL CONTENT BODY */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* ======================================================== */}
          {/* TAB 1: BREAKING NEWS (CURRENT QUARTER)                     */}
          {/* ======================================================== */}
          {activeTab === 'BREAKING' && (
            <div className="space-y-4">
              {/* FLASH DISCOUNT PROMOTION BANNER */}
              {(categoryFilter === 'ALL' || categoryFilter === 'AVIATION') && discountDeal && (
                <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950 via-slate-900 to-rose-950 border-2 border-amber-400 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-lg shrink-0">
                      <Flame className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded font-black font-mono bg-amber-500/20 text-amber-300 border border-amber-400 uppercase tracking-wider">
                          {isTh ? '🔥 ตลาดการบินพาณิชย์: ส่วนลดพิเศษส่งตรงจากโรงงานผู้ผลิต' : '🔥 Commercial Aviation Market: Special Factory Discount Promotion'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-rose-950 text-rose-300 border border-rose-600 animate-pulse">
                          {isTh ? `เหลือเวลาอีก ${discountDeal.quartersRemaining} ไตรมาส` : `${discountDeal.quartersRemaining} Quarters Left`}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-amber-300 mt-1">
                        {isTh
                          ? `แคมเปญลดกระหน่ำจาก ${discountDeal.manufacturer}: ลดราคาพิเศษ ${discountDeal.discountPct}% สำหรับ ${discountDeal.specificModelId ? discountDeal.specificModelId : 'เครื่องบินทุกรุ่น'}!`
                          : `${discountDeal.manufacturer} Clearance Sale: ${discountDeal.discountPct}% OFF ${discountDeal.specificModelId ? discountDeal.specificModelId : 'All Airframes'}!`}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                        {isTh
                          ? 'โรงงานผู้ผลิตได้จัดสรรโควตาราคาส่งพิเศษสำหรับการปรับปรุงฝูงบินด่วน สั่งซื้อหรือทำสัญญาจัดหาเครื่องบินในช่วงโปรโมชั่นนี้เพื่อประหยัดเงินทุนได้หลายล้านดอลลาร์'
                          : 'The manufacturer has released subsidized wholesale allocations for immediate fleet modernization. Purchase or finance aircraft during this promotional window to save millions in capital expenditure.'}
                      </p>
                    </div>
                  </div>

                  {onOpenAircraftShop && (
                    <button
                      onClick={() => {
                        playSound.click();
                        onClose();
                        onOpenAircraftShop();
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold font-mono text-xs shadow-lg transition active:scale-95 border border-amber-400 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    >
                      <Plane className="w-4 h-4" />
                      <span>{isTh ? 'ไปยังตลาดเครื่องบิน' : 'Open Aircraft Shop'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* SECTION: GLOBAL GEOPOLITICS & WORLD EVENTS */}
              {(categoryFilter === 'ALL' || categoryFilter === 'WORLD') && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2.5">
                      <Globe2 className="w-5 h-5 text-purple-400" />
                      <h3 className="font-mono text-sm font-black uppercase tracking-wider text-slate-200">
                        {isTh ? 'ภูมิรัฐศาสตร์ ดัชนีราคาน้ำมัน และเหตุการณ์โลก' : 'Global Geopolitics, Fuel & World Events'}
                      </h3>
                    </div>
                    <span className="text-xs text-purple-400 font-mono font-bold">
                      {isTh ? `กำลังมีผล ${activeEvents.length} • เรดาร์ล่วงหน้า ${upcomingEvents.length}` : `${activeEvents.length} Active • ${upcomingEvents.length} Upcoming`}
                    </span>
                  </div>

                  {/* ACTIVE WORLD EVENTS */}
                  {activeEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {activeEvents.map((event, idx) => {
                        const isCrisis =
                          event.type === 'WAR' ||
                          event.type === 'OIL_CRISIS' ||
                          event.type === 'EPIDEMIC' ||
                          event.type === 'ECONOMIC_CRISIS';
                        const isCelebration =
                          event.type === 'OLYMPICS' ||
                          event.type === 'WORLD_CUP' ||
                          event.type === 'EXPO';

                        return (
                          <div
                            key={idx}
                            className={`p-4 sm:p-5 rounded-2xl border-2 shadow transition ${
                              isCrisis
                                ? 'bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-900 border-rose-500/80 shadow-rose-950/50'
                                : isCelebration
                                ? 'bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-900 border-purple-500/80 shadow-purple-950/50'
                                : 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border-emerald-500/80 shadow-emerald-950/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">
                                  {isCrisis ? '⚠️' : isCelebration ? '🏅' : '📈'}
                                </span>
                                <div>
                                  <h4 className="font-black text-base sm:text-lg text-white">{event.title}</h4>
                                  <span className="text-xs font-mono text-slate-400 uppercase">
                                    {isTh ? 'ประเภท:' : 'Type:'} {event.type.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase border shrink-0 ${
                                  isCrisis
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                                    : isCelebration
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                                }`}
                              >
                                {isCrisis ? (isTh ? 'แจ้งเตือนวิกฤต' : 'CRISIS ALERT') : isCelebration ? (isTh ? 'มหกรรมระดับโลก' : 'MAJOR ATTRACTION') : (isTh ? 'เศรษฐกิจเฟื่องฟู' : 'GLOBAL BOOM')}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                              {event.description}
                            </p>

                            <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono gap-2">
                              <span className="text-slate-400">
                                {isTh ? 'ขอบเขต:' : 'Scope:'} <strong className="text-white">{(event.affectedRegionIds && event.affectedRegionIds.length > 0) ? event.affectedRegionIds.join(', ') : (isTh ? 'ทั่วโลก' : 'Worldwide')}</strong>
                              </span>
                              <span className="text-amber-300 font-bold">
                                {isTh ? `ระยะเวลา: ${event.durationQuarters} ไตรมาส` : `Duration: ${event.durationQuarters} Quarters`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-sm text-slate-400 italic flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{isTh ? 'น่านฟ้าโลกสงบราบรื่น ไม่มีวิกฤตการณ์ทางภูมิรัฐศาสตร์หรือสงครามรุนแรงในไตรมาสนี้' : 'Skies are clear. No geopolitical crises or severe conflicts recorded this quarter.'}</span>
                    </div>
                  )}

                  {/* FUEL MARKET & UPCOMING RADAR ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {/* Fuel Market Bar */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                          <Flame className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white font-mono">{isTh ? 'ดัชนีราคาน้ำมันเชื้อเพลิงโลก' : 'Global Fuel Index'}</div>
                          <div className="text-xs text-slate-400">
                            {gameState.fuelPriceIndex > 1.2
                              ? (isTh ? 'ราคาน้ำมันตลาดโลกพุ่งสูงขึ้น ส่งผลต่อต้นทุนต่อเที่ยวบิน' : 'Global crude prices spiking, increasing per-flight operating costs.')
                              : (isTh ? 'ราคาน้ำมันตลาดโลกอยู่ในเกณฑ์ปกติ' : 'Global fuel benchmark prices within stable standard range.')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div
                          className={`text-lg font-black ${
                            gameState.fuelPriceIndex > 1.2 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                          }`}
                        >
                          {gameState.fuelPriceIndex.toFixed(2)}x
                        </div>
                        <div className="text-xs text-slate-500">{isTh ? 'เกณฑ์อ้างอิง' : 'Benchmark'}</div>
                      </div>
                    </div>

                    {/* Upcoming Radar Forecast */}
                    {upcomingEvents.length > 0 && (
                      <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400 text-purple-300">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-purple-200 font-mono">
                              {isTh ? 'เรดาร์ข่าวกรองล่วงหน้า 1 ปี' : '1-Year Intelligence Radar'}
                            </div>
                            <div className="text-xs text-slate-300 truncate max-w-[280px]">
                              {upcomingEvents[0].event.title}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-xs px-2.5 py-1 rounded bg-purple-900 text-purple-200 font-bold border border-purple-700">
                            {isTh ? `จะเริ่มขึ้นในอีก ${upcomingEvents[0].quartersUntil * 3} เดือน` : `Arrives in ${upcomingEvents[0].quartersUntil * 3} mo`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: COMMERCIAL AIRCRAFT INDUSTRY DEVELOPMENTS */}
              {(categoryFilter === 'ALL' || categoryFilter === 'AVIATION') && (
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2.5">
                      <Plane className="w-5 h-5 text-sky-400" />
                      <h3 className="font-mono text-sm font-black uppercase tracking-wider text-slate-200">
                        {isTh ? 'ผู้ผลิตเครื่องบินและการพัฒนาฝูงบิน' : 'Aircraft Manufacturers & Fleet Modernization'}
                      </h3>
                    </div>
                    <span className="text-xs text-sky-400 font-mono font-bold">
                      {newPlanes.length + retiringPlanes.length + deliveries.length} {isTh ? 'รายการ' : 'Updates'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* Newly Introduced Models */}
                    {newPlanes.length > 0 &&
                      newPlanes.map((plane, idx) => (
                        <div
                          key={`new-${idx}`}
                          className="p-4 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/70 rounded-2xl flex items-center justify-between gap-3 shadow"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                              <Sparkles className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500">
                                  {isTh ? 'เครื่องบินรุ่นใหม่' : 'NEW MODEL'}
                                </span>
                                <h4 className="font-black text-sm sm:text-base text-white">{plane.model}</h4>
                              </div>
                              <p className="text-xs text-slate-300 mt-0.5">
                                {plane.manufacturer} • {plane.capacity} {isTh ? 'ที่นั่ง' : 'seats'} • {isTh ? `พิสัยบิน ${plane.rangeKm.toLocaleString()} กม.` : `${plane.rangeKm.toLocaleString()} km range`}
                              </p>
                            </div>
                          </div>
                          {onOpenAircraftShop && (
                            <button
                              onClick={() => {
                                playSound.click();
                                onClose();
                                onOpenAircraftShop();
                              }}
                              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold font-mono transition cursor-pointer shadow shrink-0"
                            >
                              {isTh ? 'ดูรายละเอียด' : 'Inspect'}
                            </button>
                          )}
                        </div>
                      ))}

                    {/* Retiring / Production Cease Notice */}
                    {retiringPlanes.length > 0 &&
                      retiringPlanes.map((plane, idx) => (
                        <div
                          key={`retire-${idx}`}
                          className="p-4 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border border-amber-500/70 rounded-2xl flex items-center justify-between gap-3 shadow"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300">
                              <AlertTriangle className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500">
                                  {isTh ? 'แจ้งยุติสายการผลิต' : 'END OF PRODUCTION NOTICE'}
                                </span>
                                <h4 className="font-black text-sm sm:text-base text-white">{plane.model}</h4>
                              </div>
                              <p className="text-xs text-slate-300 mt-0.5">
                                {isTh
                                  ? 'สายการผลิตกำลังจะปิดตัวลงเร็วๆ นี้ ยุติการรับคำสั่งซื้อใหม่'
                                  : 'Production assembly lines closing soon. Spare parts and new orders ceasing.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* Factory Deliveries Handover */}
                    {deliveries.length > 0 &&
                      deliveries.map((deliv, idx) => (
                        <div
                          key={`deliv-${idx}`}
                          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow ${
                            deliv.status === 'DELIVERED'
                              ? 'bg-slate-950/80 border-emerald-500/60'
                              : 'bg-rose-950/40 border-rose-500/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2.5 rounded-xl border ${
                                deliv.status === 'DELIVERED'
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                  : 'bg-rose-500/20 border-rose-400 text-rose-300'
                              }`}
                            >
                              <Plane className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                                    deliv.status === 'DELIVERED'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                                      : 'bg-rose-500/20 text-rose-300 border-rose-500'
                                  }`}
                                >
                                  {deliv.status === 'DELIVERED'
                                    ? (isTh ? 'ส่งมอบเข้าฝูงบินแล้ว' : 'DELIVERY RECEIVED')
                                    : (isTh ? 'โรงงานส่งมอบล่าช้า' : 'FACTORY DELAY')}
                                </span>
                                <h4 className="font-bold text-sm text-white">
                                  {deliv.quantity}x {deliv.modelName}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-300 mt-0.5">
                                {deliv.airlineName} • {deliv.status === 'DELIVERED' ? (isTh ? 'พร้อมประจำการในโรงเก็บ' : 'Ready in Hangars') : (isTh ? 'ล่าช้าจากผู้ผลิต' : 'Delayed by supplier')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {newPlanes.length === 0 && retiringPlanes.length === 0 && deliveries.length === 0 && !discountDeal && (
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-sm text-slate-400 italic">
                      {isTh
                        ? 'ไม่มีการเปิดตัวเครื่องบินรุ่นใหม่หรือหยุดสายการผลิตในไตรมาสนี้ ตลาดอากาศยานอยู่ในภาวะทรงตัว'
                        : 'No new aircraft models or production halts this quarter. Aviation market is stable.'}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: RIVAL AIRLINE OPERATIONS & DIPLOMATIC TREATIES */}
              {(categoryFilter === 'ALL' || categoryFilter === 'RIVALS') && (
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-5 h-5 text-blue-400" />
                      <h3 className="font-mono text-sm font-black uppercase tracking-wider text-slate-200">
                        {isTh ? 'ความเคลื่อนไหวคู่แข่ง สัญญาสิทธิการบิน และการขยายสนามบิน' : 'Rival Airline Operations, Treaties & Airport Expansions'}
                      </h3>
                    </div>
                    <span className="text-xs text-blue-400 font-mono font-bold">
                      {isTh ? 'ข่าวกรองคู่แข่ง' : 'Competitive Intel'}
                    </span>
                  </div>

                  {/* Diplomatic Envoy Mission Outcomes */}
                  {diplomaticReports.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="text-xs font-mono font-bold text-slate-400">
                        {isTh ? 'ผลการเจรจาสิทธิการบินทางการทูต:' : 'Diplomatic Slot Treaties & Envoys:'}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {diplomaticReports.map((report, idx) => (
                          <div
                            key={`diplo-${idx}`}
                            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-mono shadow ${
                              report.success
                                ? 'bg-slate-950/80 border-emerald-500/60'
                                : 'bg-slate-950/80 border-rose-500/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{report.success ? '📜' : '❌'}</span>
                              <div>
                                <div className="font-bold text-white text-xs sm:text-sm">
                                  {isTh ? `สิทธิการบิน ${report.targetCityName}` : `${report.targetCityName} Landing Rights Treaty`}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {report.success
                                    ? (isTh ? `ได้รับอนุมัติสิทธิการบิน +${report.slotsGranted || 0} สล็อต` : `Granted +${report.slotsGranted || 0} slots for commercial expansion`)
                                    : (isTh ? 'กระทรวงคมนาคมปฏิเสธคำขอของคณะผู้แทน' : 'Aviation ministry rejected delegation request')}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold border shrink-0 ${
                                report.success
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500'
                              }`}
                            >
                              {report.success ? (isTh ? 'อนุมัติสัญญา' : 'RATIFIED') : (isTh ? 'ปฏิเสธคำขอ' : 'DENIED')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Airport Runway & Terminal Expansions */}
                  {expansions.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="text-xs font-mono font-bold text-slate-400">
                        {isTh ? 'การขยายขีดความสามารถสนามบิน:' : 'Airport Capacity Expansions:'}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {expansions.map((exp, idx) => (
                          <div
                            key={`exp-${idx}`}
                            className="p-3.5 bg-slate-950/80 border border-sky-500/50 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono"
                          >
                            <div className="flex items-center gap-2.5">
                              <Building2 className="w-5 h-5 text-sky-400" />
                              <div>
                                <span className="font-bold text-white text-xs sm:text-sm">{exp.cityName}</span>
                                <span className="text-slate-400 ml-1.5">
                                  {isTh ? 'โครงการขยายทางวิ่งและอาคารผู้โดยสารเสร็จสมบูรณ์' : 'runway & terminal project completed'}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700 font-bold shrink-0">
                              {isTh ? `+${exp.addedSlots} สล็อตใหม่` : `+${exp.addedSlots} Slots Added`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Competitor Route Openings & Closures */}
                  {(newAIRoutes.length > 0 || closedRoutes.length > 0) && (
                    <div className="space-y-2.5">
                      <div className="text-xs font-mono font-bold text-slate-400">
                        {isTh ? 'การปรับเปลี่ยนเครือข่ายเส้นทางบินโลก:' : 'Global Route Network Adjustments:'}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {newAIRoutes.map((nr, idx) => {
                          const orig = cityMap.get(nr.originCityId)?.name || nr.originCityId;
                          const dest = cityMap.get(nr.destCityId)?.name || nr.destCityId;
                          return (
                            <div
                              key={`new-r-${idx}`}
                              className="p-3.5 bg-slate-950/80 border border-blue-500/40 rounded-2xl flex items-center justify-between gap-2.5 text-xs font-mono"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: nr.airlineColor }} />
                                <span className="font-bold text-white truncate text-xs sm:text-sm">{nr.airlineName}</span>
                                <span className="text-slate-400">{isTh ? 'เปิดบิน:' : 'opened:'}</span>
                                <span className="text-emerald-400 font-bold truncate">
                                  {orig} ⇄ {dest}
                                </span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-bold shrink-0">
                                {isTh ? 'เส้นทางใหม่' : 'NEW ROUTE'}
                              </span>
                            </div>
                          );
                        })}

                        {closedRoutes.map((cr, idx) => {
                          const orig = cityMap.get(cr.originCityId)?.name || cr.originCityId;
                          const dest = cityMap.get(cr.destCityId)?.name || cr.destCityId;
                          return (
                            <div
                              key={`closed-r-${idx}`}
                              className="p-3.5 bg-slate-950/80 border border-rose-500/40 rounded-2xl flex items-center justify-between gap-2.5 text-xs font-mono"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cr.airlineColor }} />
                                <span className="font-bold text-white truncate text-xs sm:text-sm">{cr.airlineName}</span>
                                <span className="text-slate-400">{isTh ? 'ปิดเส้นทาง:' : 'closed:'}</span>
                                <span className="text-rose-400 font-bold truncate">
                                  {orig} ⇄ {dest}
                                </span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold shrink-0">
                                {isTh ? 'ปิดเส้นทาง' : 'ROUTE CLOSED'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Competitor Actions Log */}
                  {competitorActions.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="text-xs font-mono font-bold text-slate-400">
                        {isTh ? 'การตัดสินใจเชิงกลยุทธ์ของคู่แข่ง:' : 'Competitor Strategic Decisions:'}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {competitorActions.map((ca, idx) => (
                          <div
                            key={`ca-${idx}`}
                            className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1.5"
                          >
                            <div className="flex items-center gap-2 font-bold text-white text-xs sm:text-sm">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ca.airlineColor }} />
                              <span>{isTh ? `การดำเนินงานของ ${ca.airlineName}` : `${ca.airlineName} Executive Actions`}</span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs pl-2">
                              {ca.actions.slice(0, 3).map((act, actIdx) => (
                                <li key={actIdx}>{act}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {diplomaticReports.length === 0 && expansions.length === 0 && newAIRoutes.length === 0 && closedRoutes.length === 0 && competitorActions.length === 0 && (
                    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 italic">
                      {isTh
                        ? 'ไม่มีการเปลี่ยนแปลงเครือข่ายเส้นทางบินหรือการเจรจาสิทธิการบินที่สำคัญในไตรมาสนี้'
                        : 'No major network changes or slot treaties recorded this quarter.'}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: FLIGHT DISRUPTIONS & INCIDENTS */}
              {(categoryFilter === 'ALL' || categoryFilter === 'OPERATIONS') && incidents.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <h3 className="font-mono text-xs font-black uppercase tracking-wider text-rose-300">
                        {isTh ? 'ปัญหาการดำเนินงานขัดข้องและเหตุขัดข้องทางเทคนิค' : 'Operational Flight Disruptions & Technical Incidents'}
                      </h3>
                    </div>
                    <span className="text-[11px] text-rose-400 font-mono font-bold">
                      {incidents.length} {isTh ? 'รายงาน' : 'Reported'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {incidents.map((inc, idx) => (
                      <div
                        key={`inc-${idx}`}
                        className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-900 border border-rose-500/70 shadow text-xs font-mono space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-bold text-rose-300">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: inc.airlineColor }} />
                            <span>{inc.incident.title}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-600 font-bold">
                            {inc.originCityName} - {inc.destCityName}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {inc.incident.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: HISTORICAL ARCHIVES (ย้อนหลังทุกไตรมาส)             */}
          {/* ======================================================== */}
          {activeTab === 'ARCHIVES' && (
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/80 border-2 border-slate-800 rounded-3xl space-y-3">
                  <History className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
                  <h3 className="text-base font-black text-white font-mono">
                    {isTh ? 'คลังบันทึกประวัติศาสตร์จะเริ่มต้นหลังจากจบไตรมาสแรก (Turn 1)' : 'Historical Archives Will Begin After Concluding Turn 1'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    {isTh
                      ? 'ระบบจะทำการบันทึกประวัติศาสตร์ เหตุการณ์สำคัญ ผลการดำเนินงาน และข่าวสารของทุกไตรมาสเก็บไว้ในคลังข้อมูลนี้อย่างถาวร เพื่อให้คุณสามารถย้อนกลับมาอ่านได้ตลอดเวลา'
                      : 'The system will record historical events, key milestones, financial performance, and quarterly chronicles in this permanent archive for review at any time.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Archived Quarter Timeline Bar / Selector */}
                  <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>{isTh ? 'เลือกไตรมาสย้อนหลังเพื่อเรียกดู:' : 'Select Past Quarter to Review:'}</span>
                      <span className="text-amber-400 font-bold">
                        {isTh ? `บันทึกไว้ ${history.length} ไตรมาส` : `${history.length} Quarters on Record`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {history.map((h, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            playSound.click();
                            setSelectedArchiveIndex(idx);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition shrink-0 cursor-pointer border ${
                            selectedArchiveIndex === idx
                              ? 'bg-amber-600 text-white border-amber-300 shadow-md ring-2 ring-amber-400/40'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
                          }`}
                        >
                          {h.year} Q{h.quarter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Archived Quarter Detail Card */}
                  {selectedArchive && (
                    <div className="bg-slate-950/90 border-2 border-amber-500/60 rounded-3xl p-5 space-y-4 shadow-xl">
                      {/* Archive Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-300 font-black">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-black text-white font-mono">
                              {isTh
                                ? `บันทึกประวัติศาสตร์: ${selectedArchive.year} ${quarterNames[selectedArchive.quarter - 1]}`
                                : `Historical Snapshot: ${selectedArchive.year} ${quarterNames[selectedArchive.quarter - 1]}`}
                            </h3>
                            <div className="text-xs text-amber-300 font-mono">
                              {isTh ? `บันทึกไตรมาสที่ #${selectedArchiveIndex + 1}` : `Turn Archive #${selectedArchiveIndex + 1}`}
                            </div>
                          </div>
                        </div>

                        {/* Player Performance in this archived quarter */}
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                            <span className="text-slate-400 block text-[10px]">{isTh ? 'กำไรสุทธิ' : 'Net Profit'}</span>
                            <span
                              className={`font-black ${
                                selectedArchive.humanProfitK >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {selectedArchive.humanProfitK >= 0 ? '+' : ''}${selectedArchive.humanProfitK.toLocaleString()}K
                            </span>
                          </div>
                          <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                            <span className="text-slate-400 block text-[10px]">{isTh ? 'รายได้รวม' : 'Revenue'}</span>
                            <span className="font-bold text-sky-300">
                              ${selectedArchive.humanRevenueK.toLocaleString()}K
                            </span>
                          </div>
                          <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                            <span className="text-slate-400 block text-[10px]">{isTh ? 'ผู้โดยสาร' : 'Passengers'}</span>
                            <span className="font-bold text-slate-200">
                              {selectedArchive.humanPassengers.toLocaleString()} {isTh ? 'คน' : 'pax'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Events during this archived quarter */}
                      <div className="space-y-2">
                        <h4 className="font-mono text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                          <Globe2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>{isTh ? 'เหตุการณ์ระดับโลกในไตรมาสนี้:' : 'World Events Recorded in this Quarter:'}</span>
                        </h4>
                        {selectedArchive.events && selectedArchive.events.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedArchive.events.map((ev, evIdx) => (
                              <span
                                key={evIdx}
                                className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/50 text-purple-200 font-mono text-xs font-bold"
                              >
                                🌍 {ev}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            {isTh
                              ? 'ไม่มีวิกฤตภูมิรัฐศาสตร์หรือเทศกาลระดับโลกในไตรมาสนี้'
                              : 'No major geopolitical crises or world festivals during this period.'}
                          </p>
                        )}
                      </div>

                      {/* Standings in this archived quarter */}
                      {selectedArchive.standings && selectedArchive.standings.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-mono text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isTh ? 'อันดับสายการบินเมื่อสิ้นสุดไตรมาส:' : 'Industry Rankings at Quarter End:'}</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {selectedArchive.standings.map((st, sIdx) => (
                              <div
                                key={sIdx}
                                className={`p-3 rounded-xl border font-mono text-xs space-y-1 ${
                                  st.isHuman
                                    ? 'bg-sky-950/50 border-sky-400/80 shadow'
                                    : 'bg-slate-900 border-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-amber-300">{isTh ? `อันดับ #${st.rank}` : `Rank #${st.rank}`}</span>
                                  {st.isHuman && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400">
                                      {isTh ? 'คุณ' : 'YOU'}
                                    </span>
                                  )}
                                </div>
                                <div className="font-bold text-white truncate">{st.airlineName}</div>
                                <div className="text-[11px] text-slate-400">
                                  {isTh
                                    ? `${st.quarterPassengers.toLocaleString()} คน • กำไร $${st.quarterProfitK.toLocaleString()}K`
                                    : `${st.quarterPassengers.toLocaleString()} pax • $${st.quarterProfitK.toLocaleString()}K profit`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Diplomatic Reports in this archived quarter */}
                      {selectedArchive.diplomaticReports && selectedArchive.diplomaticReports.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-mono text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <Handshake className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{isTh ? 'ผลการเจรจาสิทธิการบินทางการทูต:' : 'Diplomatic Treaty Outcomes:'}</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                            {selectedArchive.diplomaticReports.map((dr, drIdx) => (
                              <div
                                key={drIdx}
                                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                              >
                                <span>
                                  {dr.success ? '📜' : '❌'} {isTh ? `สิทธิการบิน ${dr.targetCityName}` : `${dr.targetCityName} Landing Rights`}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                    dr.success
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                      : 'bg-rose-950 text-rose-300 border border-rose-600'
                                  }`}
                                >
                                  {dr.success
                                    ? (isTh ? `+${dr.slotsGranted || 0} สล็อต` : `+${dr.slotsGranted || 0} Slots`)
                                    : (isTh ? 'ถูกปฏิเสธ' : 'Rejected')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. STANDARDIZED MODAL FOOTER */}
        <div className="bg-slate-950 px-5 sm:px-7 py-3.5 border-t border-slate-800 flex items-center justify-between shrink-0 font-mono">
          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isTh
                ? 'ข่าวสารและการวิเคราะห์ตลาดได้รับการตรวจสอบเรียบร้อยแล้ว'
                : 'Market intelligence & quarterly chronicle verified.'}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Standardized Bottom-Right Close Button */}
            <button
              onClick={() => {
                playSound.click();
                onClose();
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold font-mono transition cursor-pointer border border-slate-700 shadow flex items-center gap-2 active:scale-95"
              data-testid="modal-close-footer-btn"
            >
              <X className="w-4 h-4 text-slate-400" />
              <span>{t.common.close}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
