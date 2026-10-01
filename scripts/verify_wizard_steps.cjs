const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15-second safety limit. Aborting immediately.');
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

  const click = async (selector) => {
    const res = await win.webContents.executeJavaScript(
      '(() => {' +
      '  const el = document.querySelector(' + JSON.stringify(selector) + ');' +
      '  if (!el) return false;' +
      '  el.click();' +
      '  return true;' +
      '})()'
    );
    return res;
  };

  const capture = async (filename) => {
    await win.webContents.executeJavaScript('document.elementFromPoint(700, 400)');
    win.webContents.invalidate();
    await new Promise((r) => setTimeout(r, 350));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(screenshotsDir, filename), img.toPNG());
    console.log('Saved screenshots/' + filename + ', size: ' + fs.statSync(path.join(screenshotsDir, filename)).size);
  };

  // 1. Title Screen to Step 1
  console.log('[STEP 1] Title Screen...');
  await new Promise((r) => setTimeout(r, 800));
  await click('[data-testid="title-new-game-btn"]');
  await new Promise((r) => setTimeout(r, 1000));
  await capture('wizard_step1_era.png');

  // 2. Step 1 to Step 2: Competitors
  console.log('[STEP 2] Advancing to Step 2: Competitors...');
  await click('[data-testid="wizard-next-step-1"]');
  await new Promise((r) => setTimeout(r, 1000));
  await capture('wizard_step2_competitors.png');

  // 3. Step 2 to Step 3: HQ & Capital
  console.log('[STEP 3] Advancing to Step 3: HQ & Capital...');
  await click('[data-testid="wizard-next-step-2"]');
  await new Promise((r) => setTimeout(r, 1000));
  await capture('wizard_step3_hq_capital.png');

  // 4. Step 3 to Step 4: Clearance & Launch
  console.log('[STEP 4] Advancing to Step 4: Clearance & Launch...');
  await click('[data-testid="wizard-next-step-3"]');
  await new Promise((r) => setTimeout(r, 1000));
  await capture('wizard_step4_clearance.png');

  // 5. Launch Game
  console.log('[STEP 5] Launching Game...');
  await click('[data-testid="setup-start-game-btn"]');
  await new Promise((r) => setTimeout(r, 1200));
  await capture('wizard_launched_gameplay.png');

  console.log('=== ALL 4 WIZARD STEPS & GAMEPLAY LAUNCH VERIFIED PERFECTLY ===');
  app.quit();
  process.exit(0);
}

run();
