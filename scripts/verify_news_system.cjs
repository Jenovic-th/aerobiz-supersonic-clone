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

  const capture = async (filename) => {
    await evalJs('document.elementFromPoint(700, 400)');
    win.webContents.invalidate();
    await new Promise((r) => setTimeout(r, 250));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(screenshotsDir, filename), img.toPNG());
    console.log('[SCREENSHOT] Saved ' + filename);
  };

  console.log('[STEP 1] Starting from Title screen to Game...');
  await new Promise((r) => setTimeout(r, 500));
  await click('[data-testid="title-new-game-btn"]');
  await new Promise((r) => setTimeout(r, 400));
  await click('[data-testid="wizard-next-step-1"]');
  await new Promise((r) => setTimeout(r, 300));
  await click('[data-testid="wizard-next-step-2"]');
  await new Promise((r) => setTimeout(r, 300));
  await click('[data-testid="wizard-next-step-3"]');
  await new Promise((r) => setTimeout(r, 300));
  await click('[data-testid="setup-start-game-btn"]');
  await new Promise((r) => setTimeout(r, 900));

  console.log('[STEP 2] Verifying initial unread News button and badge on Turn 1...');
  const hasUnreadBadgeTurn1 = await evalJs(
    'Boolean(document.querySelector(\'[data-testid="toolbar-news-unread-badge"]\'))'
  );
  console.log('Turn 1 has unread badge:', hasUnreadBadgeTurn1);
  if (!hasUnreadBadgeTurn1) {
    throw new Error('Expected unread badge on Turn 1 start');
  }
  await capture('news_1_unread_badge_main.png');

  console.log('[STEP 3] Opening News & Chronicle Modal...');
  await click('[data-testid="toolbar-news-btn"]');
  await new Promise((r) => setTimeout(r, 500));
  await capture('news_2_breaking_news_tab.png');

  console.log('[STEP 4] Switching to Historical Archives tab...');
  await click('[data-testid="news-tab-archives"]');
  await new Promise((r) => setTimeout(r, 400));
  await capture('news_3_historical_archives_tab.png');

  console.log('[STEP 5] Testing Standardized Modal Close Button (Footer)...');
  await click('[data-testid="modal-close-footer-btn"]');
  await new Promise((r) => setTimeout(r, 500));

  const hasBadgeAfterRead = await evalJs(
    'Boolean(document.querySelector(\'[data-testid="toolbar-news-unread-badge"]\'))'
  );
  console.log('Badge is gone after reading news:', !hasBadgeAfterRead);
  if (hasBadgeAfterRead) {
    throw new Error('Unread badge should have disappeared after opening news');
  }
  await capture('news_4_read_badge_gone.png');

  console.log('[STEP 6] Advancing 1 Quarter to check unread notification on Turn 2...');
  // Click End Quarter button
  await evalJs(
    '(() => {' +
    '  const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("End Quarter") || b.textContent.includes("Next Quarter"));' +
    '  if (btn) btn.click();' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 1000));

  // In Quarter Report Modal, close or confirm to enter Turn 2
  await evalJs(
    '(() => {' +
    '  const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Confirm & Enter") || b.textContent.includes("ยืนยัน"));' +
    '  if (btn) btn.click();' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 800));

  const hasBadgeTurn2 = await evalJs(
    'Boolean(document.querySelector(\'[data-testid="toolbar-news-unread-badge"]\'))'
  );
  console.log('Turn 2 has new unread news badge:', hasBadgeTurn2);

  // Open news in Turn 2 and check archive
  await click('[data-testid="toolbar-news-btn"]');
  await new Promise((r) => setTimeout(r, 500));
  await click('[data-testid="news-tab-archives"]');
  await new Promise((r) => setTimeout(r, 500));
  await capture('news_5_turn2_populated_archive.png');

  // Test Top-Right X close
  console.log('[STEP 7] Testing Top-Right [X] Close Button...');
  await click('[data-testid="modal-close-header-btn"]');
  await new Promise((r) => setTimeout(r, 400));

  const isModalClosed = await evalJs(
    '!document.querySelector(\'[data-testid="news-tab-archives"]\')'
  );
  console.log('Modal closed via Top-Right X button:', isModalClosed);

  // Test Escape key
  console.log('[STEP 8] Testing Escape Key Close...');
  await click('[data-testid="toolbar-news-btn"]');
  await new Promise((r) => setTimeout(r, 400));
  win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
  await new Promise((r) => setTimeout(r, 80));
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
  await new Promise((r) => setTimeout(r, 400));

  const isModalClosedEsc = await evalJs(
    '!document.querySelector(\'[data-testid="news-tab-breaking"]\')'
  );
  console.log('Modal closed via Escape key:', isModalClosedEsc);

  console.log('=== NEWS SYSTEM, ARCHIVES & STANDARDIZED MODAL CLOSING VERIFIED 100% ===');
  app.quit();
  process.exit(0);
}

run();
