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

async function run() {
  await app.whenReady();

  const win = new BrowserWindow({
    width: 1600,
    height: 960,
    show: true,
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
    await evalJs('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    await new Promise((r) => setTimeout(r, 600));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(screenshotsDir, filename), img.toPNG());
    console.log('[SCREENSHOT] Saved ' + filename);
  };

  console.log('[STEP 1] Starting game...');
  await new Promise((r) => setTimeout(r, 600));
  await click('[data-testid="title-new-game-btn"]');
  await new Promise((r) => setTimeout(r, 400));
  await click('[data-testid="wizard-next-step-1"]');
  await new Promise((r) => setTimeout(r, 400));
  await click('[data-testid="wizard-next-step-2"]');
  await new Promise((r) => setTimeout(r, 400));
  await click('[data-testid="wizard-next-step-3"]');
  await new Promise((r) => setTimeout(r, 400));
  await click('[data-testid="setup-start-game-btn"]');
  await new Promise((r) => setTimeout(r, 1200));

  console.log('[STEP 2] Opening Business / Ventures Modal...');
  await clickText('Ventures');
  await new Promise((r) => setTimeout(r, 600));

  await capture('widescreen_business_ventures_modal.png');

  console.log('[SUCCESS] BusinessModal captured cleanly.');
  app.quit();
  process.exit(0);
}

run();
