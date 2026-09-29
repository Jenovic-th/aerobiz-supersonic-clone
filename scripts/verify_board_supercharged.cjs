const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15-second safety limit. Aborting.');
  process.exit(1);
}, 15000);
if (_safetyWatchdog.unref) _safetyWatchdog.unref();

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

const artifactDir = 'C:\\Users\\jenov\\.gemini\\antigravity\\brain\\63562c7a-0932-4d51-a25b-3cbf9a2c46f1';

async function run() {
  await app.whenReady();

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  win.webContents.on('console-message', (event, level, message) => {
    console.log('[BROWSER] ' + message);
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);
  await new Promise((r) => setTimeout(r, 1000));

  // Click start / resume
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const btn = buttons.find(b => (b.textContent || "").includes("Resume Flight Operations") || (b.textContent || "").includes("COMMENCE AIRLINE OPERATION"));' +
    '  if (btn) btn.click();' +
    '})()'
  );

  // Poll until active
  for (let i = 0; i < 40; i++) {
    const isLoaded = await win.webContents.executeJavaScript(
      'Boolean(window.__gameState && window.__gameState.airlines && window.__gameState.airlines.length > 0)'
    );
    if (isLoaded) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 400));

  // Enrich game state so all 5 agendas display rich, realistic data:
  // 1. Give player 10 unserved slots in Tokyo (TYO) and Singapore (SIN)
  // 2. Set 1 route as deficit (BKK-HKG) and 1 as saturated (BKK-SHA)
  // 3. Set rival diplomat mission & factory order & bleeding route
  console.log('Injecting realistic test scenarios for comprehensive Board review...');
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const cur = window.__gameState;' +
    '  const updatedAirlines = cur.airlines.map((a, idx) => {' +
    '    if (a.isHuman) {' +
    '      return {' +
    '        ...a,' +
    '        slots: { ...a.slots, TYO: 10, SIN: 8 },' +
    '        fleet: a.fleet.map((f, fIdx) => fIdx === 0 ? { ...f, conditionPct: 76 } : f)' +
    '      };' +
    '    } else if (idx === 1) {' +
    '      return {' +
    '        ...a,' +
    '        negotiators: [{' +
    '          id: "NEG_RIVAL_1",' +
    '          name: "Elena Rostova",' +
    '          title: "Senior Envoy",' +
    '          avatarId: "elena",' +
    '          role: "FIELD",' +
    '          status: "DISPATCHED",' +
    '          currentMission: {' +
    '            type: "SLOT_NEGOTIATION",' +
    '            targetCityId: "TYO",' +
    '            targetCityName: "Tokyo",' +
    '            requestedSlots: 10,' +
    '            costK: 3500,' +
    '            quartersRemaining: 1,' +
    '            totalQuarters: 2' +
    '          }' +
    '        }],' +
    '        pendingOrders: [{' +
    '          orderId: "ORD_RIVAL_1",' +
    '          airlineId: a.id,' +
    '          modelId: "B747-200B",' +
    '          modelName: "Boeing 747-200B",' +
    '          manufacturer: "Boeing",' +
    '          quantity: 2,' +
    '          unitPriceK: 45000,' +
    '          totalCostK: 90000,' +
    '          orderYear: cur.currentYear,' +
    '          orderQuarter: cur.currentQuarter,' +
    '          deliveryYear: cur.currentYear + 1,' +
    '          deliveryQuarter: 1,' +
    '          status: "PENDING"' +
    '        }]' +
    '      };' +
    '    }' +
    '    return a;' +
    '  });' +
    '  const updatedRoutes = cur.routes.map((r, rIdx) => {' +
    '    if (r.airlineId === "AIRLINE_PLAYER" && rIdx === 1) {' +
    '      return {' +
    '        ...r,' +
    '        lastQuarterStats: {' +
    '          passengers: 820,' +
    '          capacity: 2400,' +
    '          loadFactorPct: 34,' +
    '          revenueK: 1200,' +
    '          expensesK: 2450,' +
    '          profitK: -1250' +
    '        }' +
    '      };' +
    '    }' +
    '    return r;' +
    '  });' +
    '  window.__setGameState({ ...cur, airlines: updatedAirlines, routes: updatedRoutes });' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 400));

  // Open Board Meeting Modal directly
  console.log('Opening Board Meeting Modal directly via React setter...');
  await win.webContents.executeJavaScript('window.__setShowBoardMeeting(true)');
  await new Promise((r) => setTimeout(r, 1500));

  // 1. Capture Agenda 1: New Routes
  console.log('Capturing Agenda 1 (New Routes)...');
  const agenda1Img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'board_supercharged_agenda1_routes.png'), agenda1Img.toPNG());
  console.log('Saved board_supercharged_agenda1_routes.png');

  // 2. Click Agenda 2: Route Yield
  console.log('Clicking Agenda 2 (Route Yield)...');
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const btn = buttons.find(b => (b.textContent || "").includes("ROUTE YIELD"));' +
    '  if (btn) btn.click();' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 1500));
  const agenda2Img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'board_supercharged_agenda2_yield.png'), agenda2Img.toPNG());
  console.log('Saved board_supercharged_agenda2_yield.png');

  // 3. Click Agenda 3: Planes & Fleet
  console.log('Clicking Agenda 3 (Planes & Fleet)...');
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const btn = buttons.find(b => (b.textContent || "").includes("FLEET & ORDERS"));' +
    '  if (btn) btn.click();' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 1500));
  const agenda3Img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'board_supercharged_agenda3_fleet.png'), agenda3Img.toPNG());
  console.log('Saved board_supercharged_agenda3_fleet.png');

  // 4. Click Agenda 4: Ventures & Synergies
  console.log('Clicking Agenda 4 (Ventures)...');
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const btn = buttons.find(b => (b.textContent || "").includes("VENTURES"));' +
    '  if (btn) btn.click();' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 1500));
  const agenda4Img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'board_supercharged_agenda4_ventures.png'), agenda4Img.toPNG());
  console.log('Saved board_supercharged_agenda4_ventures.png');

  // 5. Click Agenda 5: Competitor Intel Radar (NEW!)
  console.log('Clicking Agenda 5 (Competitor Intel Radar)...');
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const btn = buttons.find(b => (b.textContent || "").includes("COMPETITOR INTEL"));' +
    '  if (btn) btn.click();' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 1500));
  const agenda5Img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'board_supercharged_agenda5_competitor_intel.png'), agenda5Img.toPNG());
  console.log('Saved board_supercharged_agenda5_competitor_intel.png');

  clearTimeout(_safetyWatchdog);
  app.quit();
  process.exit(0);
}

run();
