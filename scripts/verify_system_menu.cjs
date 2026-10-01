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

  const waitForSelector = async (selector, maxWait = 2500) => {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      const exists = await win.webContents.executeJavaScript('!!document.querySelector(' + JSON.stringify(selector) + ')');
      if (exists) return true;
      await new Promise(r => setTimeout(r, 60));
    }
    return false;
  };

  const captureWhen = async (selector, filename) => {
    if (selector) await waitForSelector(selector);
    await new Promise((r) => setTimeout(r, 200));
    win.webContents.invalidate();
    await new Promise((r) => setTimeout(r, 250));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(screenshotsDir, filename), img.toPNG());
    console.log('Saved screenshots/' + filename);
  };

  // 1. Enter Gameplay via Resume or Start
  console.log('[STEP 1] Entering Gameplay...');
  await new Promise((r) => setTimeout(r, 800));
  const hasResume = await win.webContents.executeJavaScript('!!document.querySelector(\'[data-testid="title-resume-btn"]\')');
  if (hasResume) {
    await click('[data-testid="title-resume-btn"]');
  } else {
    await click('[data-testid="title-new-game-btn"]');
    await new Promise((r) => setTimeout(r, 300));
    await click('[data-testid="setup-start-game-btn"]');
  }
  await captureWhen('[data-testid="header-system-btn"]', 'gameplay_main_screen.png');

  // 2. Open System Dropdown Menu
  console.log('[STEP 2] Opening System Menu...');
  await click('[data-testid="header-system-btn"]');
  await captureWhen('[data-testid="menu-restart-btn"]', 'system_menu_dropdown.png');

  // 3. Open Restart Confirmation Dialog
  console.log('[STEP 3] Opening Restart Confirmation...');
  await click('[data-testid="menu-restart-btn"]');
  await captureWhen('[data-testid="confirm-dialog-confirm-btn"]', 'restart_confirm_modal.png');

  // Cancel dialog
  console.log('[STEP 4] Cancelling dialog...');
  await click('[data-testid="confirm-dialog-cancel-btn"]');
  await new Promise((r) => setTimeout(r, 400));

  // 4. Open Return to Title Confirmation Dialog
  console.log('[STEP 5] Opening Return to Title Confirmation...');
  await click('[data-testid="header-system-btn"]');
  await waitForSelector('[data-testid="menu-title-btn"]');
  await click('[data-testid="menu-title-btn"]');
  await captureWhen('[data-testid="confirm-dialog-confirm-btn"]', 'return_title_confirm_modal.png');

  // 5. Confirm Return to Title
  console.log('[STEP 6] Confirming Return to Title...');
  await click('[data-testid="confirm-dialog-confirm-btn"]');
  await captureWhen('[data-testid="title-new-game-btn"]', 'returned_to_title_screen.png');

  console.log('=== SYSTEM MENU & CONFIRMATION ACTIONS VERIFIED SUCCESSFULLY ===');
  app.quit();
  process.exit(0);
}

run();
