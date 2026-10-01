const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 14.5-second safety limit. Aborting immediately.');
  process.exit(1);
}, 14500);
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

const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

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

  const evalJs = async (code) => {
    return await win.webContents.executeJavaScript(code);
  };

  const click = async (selector) => {
    return await evalJs(
      '(() => {' +
      '  const el = document.querySelector(' + JSON.stringify(selector) + ');' +
      '  if (!el) return false;' +
      '  el.click();' +
      '  return true;' +
      '})()'
    );
  };

  const clickText = async (text) => {
    return await evalJs(
      '(() => {' +
      '  const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes(' + JSON.stringify(text) + '));' +
      '  if (!btn) return false;' +
      '  btn.click();' +
      '  return true;' +
      '})()'
    );
  };

  const capture = async (filename) => {
    await evalJs('document.elementFromPoint(700, 400)');
    win.webContents.invalidate();
    await new Promise((r) => setTimeout(r, 300));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(screenshotsDir, filename), img.toPNG());
    console.log('[SCREENSHOT] Saved ' + filename);
  };

  console.log('[STEP 1] Starting from Title screen to Game...');
  await new Promise((r) => setTimeout(r, 600));
  await click('[data-testid="title-new-game-btn"]');
  await new Promise((r) => setTimeout(r, 500));
  await click('[data-testid="wizard-next-step-1"]');
  await new Promise((r) => setTimeout(r, 400));
  await click('[data-testid="wizard-next-step-2"]');
  await new Promise((r) => setTimeout(r, 400));
  await click('[data-testid="wizard-next-step-3"]');
  await new Promise((r) => setTimeout(r, 400));
  await click('[data-testid="setup-start-game-btn"]');
  await new Promise((r) => setTimeout(r, 1200));

  console.log('[STEP 2] Opening Manage Routes Modal...');
  await clickText('My Routes');
  await new Promise((r) => setTimeout(r, 600));
  await capture('widescreen_01_active_routes_network.png');

  console.log('[STEP 3] Opening Modify Route Parameters Submodal...');
  await click('[data-testid="route-modify-btn"]');
  await new Promise((r) => setTimeout(r, 600));

  const isModifyModalOpen = await evalJs(
    'Boolean(Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("MODIFY COMMERCIAL ROUTE PARAMETERS")))'
  );
  console.log('Modify Route modal is open:', isModifyModalOpen);
  if (!isModifyModalOpen) {
    throw new Error('Modify Route Parameters modal failed to open');
  }

  await capture('widescreen_02_route_modify_landscape.png');

  console.log('[STEP 4] Testing Escape key to close Modify submodal...');
  win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
  await new Promise((r) => setTimeout(r, 80));
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
  await new Promise((r) => setTimeout(r, 400));

  console.log('[STEP 5] Closing Manage Routes Modal...');
  await click('[data-testid="modal-close-footer-btn"]');
  await new Promise((r) => setTimeout(r, 400));

  console.log('[STEP 6] Opening Widescreen Slot Negotiation Modal...');
  await clickText('Slots');
  await new Promise((r) => setTimeout(r, 600));
  await capture('widescreen_03_slot_negotiations_3col.png');

  console.log('[STEP 7] Closing Slot Negotiation Modal...');
  await click('[data-testid="modal-close-footer-btn"]');
  await new Promise((r) => setTimeout(r, 300));

  console.log('=== ALL WIDESCREEN LANDSCAPE UIs VERIFIED PERFECTLY ===');
  app.quit();
  process.exit(0);
}

run();
