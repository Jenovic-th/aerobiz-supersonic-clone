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
    width: 1600,
    height: 960,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  win.show();

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

  const capture = async (filename) => {
    await evalJs('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    await new Promise((r) => setTimeout(r, 600));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(screenshotsDir, filename), img.toPNG());
    console.log('[SCREENSHOT] Saved ' + filename);
  };

  console.log('[STEP 1] Starting game...');
  await new Promise((r) => setTimeout(r, 600));
  await click('[data-testid="title-new-game-btn"]');
  await new Promise((r) => setTimeout(r, 300));
  await click('[data-testid="wizard-next-step-1"]');
  await new Promise((r) => setTimeout(r, 300));
  await click('[data-testid="wizard-next-step-2"]');
  await new Promise((r) => setTimeout(r, 300));
  await click('[data-testid="wizard-next-step-3"]');
  await new Promise((r) => setTimeout(r, 300));
  await click('[data-testid="setup-start-game-btn"]');
  await new Promise((r) => setTimeout(r, 1000));

  console.log('[STEP 2] Opening CityDetailModal for Tokyo (TYO)...');
  await evalJs('window.__openCityDetail("TYO")');
  await new Promise((r) => setTimeout(r, 600));

  console.log('[STEP 3] Triggering slot negotiation confirmation dispatch...');
  const clickedDispatch = await evalJs(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const btn = buttons.find(b => b.textContent.includes("Negotiate") && b.textContent.includes("Slots"));' +
    '  if (btn) { btn.click(); return true; }' +
    '  return false;' +
    '})()'
  );
  console.log('Clicked dispatch trigger:', clickedDispatch);
  await new Promise((r) => setTimeout(r, 600));

  const dispatchInfo = await evalJs(
    '(() => {' +
    '  const h3 = Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("Confirm Diplomatic Delegation"));' +
    '  const dialog = document.querySelector(".max-w-\\\\[1600px\\\\]");' +
    '  const rect = dialog ? dialog.getBoundingClientRect() : null;' +
    '  const envoyButtons = Array.from(document.querySelectorAll("button")).filter(b => b.textContent.includes("Ready for Mission"));' +
    '  return {' +
    '    foundModal: Boolean(h3),' +
    '    dialogWidth: rect ? Math.round(rect.width) : 0,' +
    '    dialogHeight: rect ? Math.round(rect.height) : 0,' +
    '    envoyCount: envoyButtons.length' +
    '  };' +
    '})()'
  );

  console.log('[DISPATCH MODAL VERIFY RESULTS]:', JSON.stringify(dispatchInfo, null, 2));

  await capture('widescreen_dispatch_confirmation.png');

  if (!dispatchInfo.foundModal || dispatchInfo.dialogWidth < 1000) {
    console.error('[ERROR] Dispatch confirmation modal was not found or not widescreen!');
    process.exit(1);
  }

  console.log('[SUCCESS] Dispatch confirmation modal is successfully expansive and widescreen!');
  app.quit();
  process.exit(0);
}

run();
