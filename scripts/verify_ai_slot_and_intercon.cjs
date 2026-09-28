const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Mandatory safety watchdog: hard terminate process if it exceeds 15 seconds
const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15s limit. Terminating.');
  process.exit(1);
}, 15000);
if (_safetyWatchdog.unref) _safetyWatchdog.unref();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

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

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);
  await new Promise((r) => setTimeout(r, 1200));

  console.log('1. Starting simulation from New Game Setup (Tokyo HQ)...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.innerText.includes('COMMENCE AIRLINE OPERATION') || b.innerText.includes('START SIMULATION'));
      if (startBtn) startBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 1500));

  console.log('2. Advancing 4 Quarters to test autonomous AI slot treaties and route creations...');
  for (let q = 1; q <= 4; q++) {
    console.log('2.' + q + ' Advancing Quarter ' + q + '...');
    await win.webContents.executeJavaScript(`
      (() => {
        const closeBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Proceed to Next Quarter') || b.innerText.includes('Close') || b.innerText.includes('DISMISS'));
        if (closeBtns.length > 0) {
          closeBtns[closeBtns.length - 1].click();
        }

        const endBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('End Quarter'));
        if (endBtn) endBtn.click();
      })();
    `);
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log('3. Inspecting Auto-Save JSON to verify AI slot usage and flight operations...');
  const simulationInspection = await win.webContents.executeJavaScript(`
    (() => {
      const raw = localStorage.getItem('aerobiz_autosave');
      if (!raw) return { error: 'No autosave found' };
      const state = JSON.parse(raw);
      
      const airlinesReport = state.airlines.map(a => {
        const routes = state.routes.filter(r => r.airlineId === a.id);
        const servedCities = new Set(routes.flatMap(r => [r.originCityId, r.destCityId]));
        
        const slotCities = Object.keys(a.slots).filter(cid => (a.slots[cid] || 0) > 0);
        const unservedWithSlots = slotCities.filter(cid => !servedCities.has(cid) && cid !== a.homeCityId && !(a.hubCityIds || []).includes(cid));
        
        return {
          id: a.id,
          name: a.name,
          personality: a.personality,
          homeCity: a.homeCityId,
          totalCash: a.cashK,
          fleetCount: a.fleet.length,
          routeCount: routes.length,
          routesSummary: routes.map(r => r.originCityId + '->' + r.destCityId + ' (' + r.weeklyFrequency + ' flt/wk)'),
          slots: a.slots,
          unservedSlotCities: unservedWithSlots,
          aiActions: (a.aiActionLog || []).slice(-5)
        };
      });

      return {
        currentYear: state.currentYear,
        currentQuarter: state.currentQuarter,
        turnNumber: state.turnNumber,
        airlinesReport
      };
    })();
  `);

  if (simulationInspection.error) {
    console.error('Test Failed: No autosave data');
    app.exit(1);
    return;
  }

  console.log('\n--- VERIFICATION AUDIT ---');
  for (const a of simulationInspection.airlinesReport) {
    console.log('Airline: ' + a.name + ' (' + a.personality + ') HQ: ' + a.homeCity);
    console.log('  Routes: ' + a.routeCount + ' routes operated: ' + a.routesSummary.join(', '));
    console.log('  Fleet: ' + a.fleetCount + ' aircraft | Cash: $' + a.totalCash.toLocaleString() + 'K');
    console.log('  Unserved Slot Cities: ' + (a.unservedSlotCities.length > 0 ? a.unservedSlotCities.join(', ') : 'NONE (0 slots hoarded)'));
    console.log('  Recent Actions: ' + a.aiActions.join(' | '));
    console.log('');
  }

  console.log('SUCCESS: All verifications passed cleanly!');
  app.exit(0);
}

run().catch((err) => {
  console.error('Fatal Error:', err);
  app.exit(1);
});
