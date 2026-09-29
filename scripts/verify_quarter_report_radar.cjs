const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15-second safety limit. Aborting immediately.');
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

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/jenov/.gemini/antigravity/brain/63562c7a-0932-4d51-a25b-3cbf9a2c46f1';

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  const distPath = path.join(__dirname, '..', 'dist', 'index.html');
  await win.loadFile(distPath);
  await new Promise((r) => setTimeout(r, 600));

  // Enter game: Click Resume Flight Operations or Start Simulation
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const enterBtn = buttons.find(b => {' +
    '    const t = b.textContent || "";' +
    '    return t.includes("Resume Flight Operations") || t.includes("COMMENCE AIRLINE OPERATION");' +
    '  });' +
    '  if (enterBtn) enterBtn.click();' +
    '})()'
  );

  // Poll until active
  for (let i = 0; i < 30; i++) {
    const isLoaded = await win.webContents.executeJavaScript(
      'Boolean(window.__gameState && window.__gameState.airlines && window.__gameState.airlines.length > 0)'
    );
    if (isLoaded) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 500));

  // Inject upcoming world spectacles to demonstrate 3-12 months advance warning
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const cur = window.__gameState;' +
    '  const testEvents = [' +
    '    {' +
    '      event: {' +
    '        id: "WC_1982",' +
    '        year: 1982,' +
    '        quarter: 2,' +
    '        type: "WORLD_CUP",' +
    '        title: "1982 FIFA World Cup (Spain)",' +
    '        description: "Football fans worldwide travel to Madrid and Spain to watch the historic World Cup.",' +
    '        affectedCityIds: ["MAD"],' +
    '        affectedRegionIds: ["EUROPE"],' +
    '        demandMultiplier: 2.2,' +
    '        durationQuarters: 1' +
    '      },' +
    '      quartersUntil: 2,' +
    '      estimatedDemandSurgePct: 120' +
    '    },' +
    '    {' +
    '      event: {' +
    '        id: "VISIT_THAILAND_1987",' +
    '        year: 1983,' +
    '        quarter: 1,' +
    '        type: "TOURISM_YEAR",' +
    '        title: "Visit Thailand Year 1987 (ปีท่องเที่ยวไทย)",' +
    '        description: "A historic global campaign celebrating the Royal 60th birthday triggers unprecedented tourist arrivals to Bangkok and Southeast Asia.",' +
    '        affectedCityIds: ["BKK", "HKT"],' +
    '        affectedRegionIds: ["EAST_SOUTHEAST_ASIA"],' +
    '        demandMultiplier: 2.1,' +
    '        durationQuarters: 4' +
    '      },' +
    '      quartersUntil: 4,' +
    '      estimatedDemandSurgePct: 110' +
    '    }' +
    '  ];' +
    '  window.__setGameState({ ...cur, upcomingEvents: testEvents });' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 500));

  // Open Quarter Report Modal directly
  await win.webContents.executeJavaScript('window.__setShowQuarterReport(true)');
  await new Promise((r) => setTimeout(r, 1000));

  // Click Aviation Bulletin & Sales tab (3rd button in tab bar)
  const switchRes = await win.webContents.executeJavaScript(
    '(() => {' +
    '  const navContainer = document.querySelector(".shrink-0.flex.items-center.justify-between.border-b");' +
    '  if (navContainer) {' +
    '    const tabBtns = navContainer.querySelectorAll("button");' +
    '    if (tabBtns.length >= 3) {' +
    '      tabBtns[2].click();' +
    '      return "CLICKED TAB 3: " + tabBtns[2].textContent.trim();' +
    '    }' +
    '  }' +
    '  const allBtns = Array.from(document.querySelectorAll("button"));' +
    '  const btn = allBtns.find(b => (b.textContent || "").includes("Bulletin") || (b.textContent || "").includes("ข่าว"));' +
    '  if (btn) {' +
    '    btn.click();' +
    '    return "CLICKED FALLBACK: " + btn.textContent.trim();' +
    '  }' +
    '  return "NOT FOUND";' +
    '})()'
  );
  console.log('[DEBUG switch]:', switchRes);
  await new Promise((r) => setTimeout(r, 1500));

  // Scroll to show Upcoming World Spectacles Radar
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const scrollable = document.querySelector(".overflow-y-auto");' +
    '  if (scrollable) scrollable.scrollTop = 450;' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 500));

  const calendarImg = await win.webContents.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'quarter_report_event_calendar.png'), calendarImg.toPNG());
  console.log('[OK] Captured quarter_report_event_calendar.png');

  console.log('[SUCCESS] Verification completed!');
  clearTimeout(_safetyWatchdog);
  app.exit(0);
});
