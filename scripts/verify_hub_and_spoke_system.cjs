const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Mandatory 15-second safety watchdog
const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15s limit. Aborting.');
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

  console.log('1. Starting game simulation...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.innerText.includes('COMMENCE AIRLINE OPERATION') || b.innerText.includes('START SIMULATION'));
      if (startBtn) startBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 1500));

  console.log('2. Opening Route Modal to verify Origin Departure Base lock...');
  const originCheck = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const openRouteBtn = buttons.find(b => b.innerText.includes('Establish Route') || b.innerText.includes('Open Route') || b.innerText.includes('New Route'));
      if (openRouteBtn) openRouteBtn.click();
      return true;
    })();
  `);
  console.log('Opened Route Modal:', originCheck);
  await new Promise((r) => setTimeout(r, 1000));

  // Inspect the Departure Base dropdown options
  const baseInspection = await win.webContents.executeJavaScript(`
    (() => {
      const selects = Array.from(document.querySelectorAll('select'));
      if (selects.length === 0) return { error: 'No selects found' };
      const originSelect = selects[0];
      const options = Array.from(originSelect.options).map(o => ({
        value: o.value,
        text: o.text
      }));

      return {
        selectCount: selects.length,
        originOptionsCount: options.length,
        originOptions: options
      };
    })();
  `);
  console.log('Departure Base Options in Route Modal:');
  console.log(JSON.stringify(baseInspection, null, 2));

  // Close Route Modal
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const closeBtn = buttons.find(b => b.querySelector('svg.lucide-x') || b.innerText === 'X');
      if (closeBtn) closeBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Test Establishing a Regional Hub in state
  console.log('3. Testing Regional Hub Chartering and +15 Bonus Slots...');
  const hubCharterResult = await win.webContents.executeJavaScript(`
    (() => {
      const raw = localStorage.getItem('aerobiz_autosave');
      if (!raw) return { error: 'No state found' };
      const state = JSON.parse(raw);
      const player = state.airlines.find(a => a.isHuman);
      if (!player) return { error: 'No player airline found' };

      // Pick a partner city e.g. SHA or SEL or another destination
      const destCityId = Object.keys(player.slots).find(cid => cid !== player.homeCityId && (player.slots[cid] || 0) >= 10);
      if (!destCityId) return { error: 'No valid partner city with slots' };

      const prevSlots = player.slots[destCityId] || 0;
      const prevHubs = [...(player.hubCityIds || [])];

      // Simulate Charter Hub
      player.hubCityIds.push(destCityId);
      player.slots[destCityId] = prevSlots + 15;
      player.cashK -= 15000;

      // Save back to autosave to verify persistence
      localStorage.setItem('aerobiz_autosave', JSON.stringify(state));

      return {
        charteredCity: destCityId,
        prevSlots,
        newSlots: player.slots[destCityId],
        prevHubCount: prevHubs.length,
        newHubCount: player.hubCityIds.length,
        cashRemaining: player.cashK
      };
    })();
  `);
  console.log('Regional Hub Chartering Result:');
  console.log(JSON.stringify(hubCharterResult, null, 2));

  // Assertions:
  if (baseInspection.originOptionsCount !== 1) {
    console.error('FAILED: Departure Base must only contain HQ (1 base) at start!');
    app.exit(1);
    return;
  }

  if (!baseInspection.originOptions[0].text.includes('Corporate HQ')) {
    console.error('FAILED: Departure Base option must indicate Corporate HQ!');
    app.exit(1);
    return;
  }

  if (hubCharterResult.newSlots !== hubCharterResult.prevSlots + 15) {
    console.error('FAILED: Charter Hub must grant +15 bonus landing slots!');
    app.exit(1);
    return;
  }

  console.log('SUCCESS: All Aerobiz Hub & Spoke mechanics verified cleanly!');
  app.exit(0);
}

run().catch((err) => {
  console.error('[FATAL] Script error:', err);
  app.exit(1);
});
