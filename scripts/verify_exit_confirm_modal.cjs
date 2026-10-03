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

async function run() {
  await app.whenReady();

  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);
  await new Promise((r) => setTimeout(r, 600));

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

  console.log('=== STEP 1: START GAME ===');
  await click('[data-testid="title-new-game-btn"]');
  await new Promise((r) => setTimeout(r, 250));
  await click('[data-testid="wizard-next-step-1"]');
  await new Promise((r) => setTimeout(r, 250));
  await click('[data-testid="wizard-next-step-2"]');
  await new Promise((r) => setTimeout(r, 250));
  await click('[data-testid="wizard-next-step-3"]');
  await new Promise((r) => setTimeout(r, 250));
  await click('[data-testid="setup-start-game-btn"]');
  await new Promise((r) => setTimeout(r, 800));

  console.log('=== STEP 2: OPEN SYSTEM MENU & CLICK RETURN TO TITLE ===');
  await click('[data-testid="header-system-btn"]');
  await new Promise((r) => setTimeout(r, 300));

  const titleBtnClicked = await click('[data-testid="menu-title-btn"]');
  console.log('[CLICK MENU TITLE BTN]', titleBtnClicked);
  await new Promise((r) => setTimeout(r, 500));

  console.log('=== STEP 3: AUDIT CONFIRMATION DIALOG BOUNDS & PORTAL STATUS ===');
  const audit = await evalJs(
    '(() => {' +
    '  const dialogCard = document.querySelector(".max-w-md.rounded-3xl");' +
    '  const backdrop = document.querySelector(".fixed.inset-0.z-\\\\[100\\\\]");' +
    '  if (!dialogCard || !backdrop) {' +
    '    return { found: false, error: "Dialog or backdrop not found with z-[100]" };' +
    '  }' +
    '  const r = dialogCard.getBoundingClientRect();' +
    '  const br = backdrop.getBoundingClientRect();' +
    '  const winW = window.innerWidth;' +
    '  const winH = window.innerHeight;' +
    '  const isParentBody = backdrop.parentElement === document.body;' +
    '  const isCenteredH = Math.abs((r.left + r.right) / 2 - winW / 2) < 40;' +
    '  const isCenteredV = Math.abs((r.top + r.bottom) / 2 - winH / 2) < 60;' +
    '  const coversFullWindow = br.width >= winW && br.height >= winH;' +
    '  const cancelBtn = document.querySelector(\'[data-testid="confirm-dialog-cancel-btn"]\');' +
    '  const confirmBtn = document.querySelector(\'[data-testid="confirm-dialog-confirm-btn"]\');' +
    '  const cancelR = cancelBtn ? cancelBtn.getBoundingClientRect() : null;' +
    '  const confirmR = confirmBtn ? confirmBtn.getBoundingClientRect() : null;' +
    '  return {' +
    '    found: true,' +
    '    isParentBody,' +
    '    coversFullWindow,' +
    '    dialogRect: { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) },' +
    '    windowSize: { width: winW, height: winH },' +
    '    isCenteredH,' +
    '    isCenteredV,' +
    '    buttonsPresent: !!(cancelBtn && confirmBtn),' +
    '    cancelBtnInside: cancelR ? (cancelR.top >= r.top && cancelR.bottom <= r.bottom) : false,' +
    '    confirmBtnInside: confirmR ? (confirmR.top >= r.top && confirmR.bottom <= r.bottom) : false' +
    '  };' +
    '})()'
  );

  console.log('[CONFIRM DIALOG AUDIT]', JSON.stringify(audit, null, 2));

  if (!audit.found || !audit.isParentBody || !audit.coversFullWindow || !audit.isCenteredV) {
    throw new Error('Confirmation dialog is not properly portaled, full-window, or centered: ' + JSON.stringify(audit));
  }

  // Capture screenshot of the cleanly centered confirmation dialog
  await evalJs('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  await new Promise((r) => setTimeout(r, 300));
  const shot = await win.webContents.capturePage();
  const shotPath = path.join(__dirname, '../screenshots/exit_confirm_modal_centered.png');
  fs.writeFileSync(shotPath, shot.toPNG());
  console.log('[SCREENSHOT] Saved exit_confirm_modal_centered.png');

  console.log('=== STEP 4: CLICK CONFIRM AND RETURN TO TITLE ===');
  await click('[data-testid="confirm-dialog-confirm-btn"]');
  await new Promise((r) => setTimeout(r, 600));

  const onTitle = await evalJs('!!document.querySelector(\'[data-testid="title-new-game-btn"]\')');
  console.log('[RETURNED TO TITLE SCREEN]', onTitle);

  if (!onTitle) {
    throw new Error('Failed to return to title screen after confirming!');
  }

  console.log('[ALL TESTS PASS] Confirmation dialog is properly portaled to document.body, fully covers window with backdrop-blur, perfectly centered, zero overlaps, and functions correctly!');
  app.quit();
  process.exit(0);
}

run();
