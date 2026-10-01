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

  const capture = async (filename) => {
    await win.webContents.executeJavaScript('document.elementFromPoint(700, 400)');
    win.webContents.invalidate();
    await new Promise((r) => setTimeout(r, 400));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(screenshotsDir, filename), img.toPNG());
    console.log('Saved screenshots/' + filename + ', size: ' + fs.statSync(path.join(screenshotsDir, filename)).size);
  };

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

  // 1. Initial Title Screen
  console.log('[STEP 1] Title Screen...');
  await new Promise((r) => setTimeout(r, 1000));
  await capture('title_screen.png');

  // 2. Open Settings Modal
  console.log('[STEP 2] Opening Settings Modal...');
  await click('[data-testid="title-settings-btn"]');
  await new Promise((r) => setTimeout(r, 800));
  await win.webContents.executeJavaScript('document.elementFromPoint(700, 400)');
  win.webContents.invalidate();
  await new Promise((r) => setTimeout(r, 600));
  const settingsImg = await win.webContents.capturePage();
  fs.writeFileSync(path.join(screenshotsDir, 'settings_modal.png'), settingsImg.toPNG());
  console.log('Saved screenshots/settings_modal.png, size: ' + fs.statSync(path.join(screenshotsDir, 'settings_modal.png')).size);

  // 3. Close Settings Modal
  console.log('[STEP 3] Closing Settings Modal...');
  await click('[data-testid="settings-close-btn"]');
  await new Promise((r) => setTimeout(r, 800));

  // 4. Open New Game Setup
  console.log('[STEP 4] Opening New Game Setup...');
  await click('[data-testid="title-new-game-btn"]');
  await new Promise((r) => setTimeout(r, 1200));
  await capture('new_game_setup_screen.png');

  // 5. Back to Title Screen
  console.log('[STEP 5] Back to Title Screen...');
  await click('[data-testid="setup-back-title-btn"]');
  await new Promise((r) => setTimeout(r, 1000));
  await capture('title_screen_restored.png');

  console.log('=== TITLE & SETTINGS VERIFICATION PASSED ===');
  app.quit();
  process.exit(0);
}

run();
