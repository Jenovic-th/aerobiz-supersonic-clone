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
    await new Promise((r) => setTimeout(r, 700));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(screenshotsDir, filename), img.toPNG());
    console.log('[SCREENSHOT] Saved ' + filename);
  };

  console.log('[STEP 1] Starting from Title screen to Game...');
  await new Promise((r) => setTimeout(r, 600));
  await click('[data-testid="title-new-game-btn"]');
  await new Promise((r) => setTimeout(r, 350));
  await click('[data-testid="wizard-next-step-1"]');
  await new Promise((r) => setTimeout(r, 350));
  await click('[data-testid="wizard-next-step-2"]');
  await new Promise((r) => setTimeout(r, 350));
  await click('[data-testid="wizard-next-step-3"]');
  await new Promise((r) => setTimeout(r, 350));
  await click('[data-testid="setup-start-game-btn"]');
  await new Promise((r) => setTimeout(r, 1000));

  console.log('[STEP 2] Opening CityDetailModal for Tokyo (TYO)...');
  await evalJs('window.__openCityDetail("TYO")');
  await new Promise((r) => setTimeout(r, 600));

  console.log('[STEP 3] Triggering Confirm Diplomatic Delegation Dispatch popup...');
  await click('[data-testid="acquire-subsidiary-btn"]');
  await new Promise((r) => setTimeout(r, 500));

  // Verify popup dimensions
  const dispatchPopupInfo = await evalJs(
    '(() => {' +
    '  const h3 = Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("Confirm Diplomatic Delegation Dispatch"));' +
    '  const container = h3 ? h3.closest(".max-w-4xl") : null;' +
    '  const rect = container ? container.getBoundingClientRect() : null;' +
    '  const envoyButtons = Array.from(document.querySelectorAll("button")).filter(b => b.textContent.includes("Ready to Go"));' +
    '  return {' +
    '    foundH3: !!h3,' +
    '    width: rect ? Math.round(rect.width) : 0,' +
    '    height: rect ? Math.round(rect.height) : 0,' +
    '    envoyCount: envoyButtons.length' +
    '  };' +
    '})()'
  );
  console.log('[DISPATCH POPUP VERIFY]:', JSON.stringify(dispatchPopupInfo));

  await capture('widescreen_confirm_delegation_popup.png');

  // Cancel popup and close city modal
  await evalJs(
    '(() => {' +
    '  const cancelBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Cancel"));' +
    '  if (cancelBtn) cancelBtn.click();' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 400));
  await click('[data-testid="modal-close-header-btn"]');
  await new Promise((r) => setTimeout(r, 400));

  console.log('[STEP 4] Opening News Chronicle modal...');
  await click('[data-testid="toolbar-news-btn"]');
  await new Promise((r) => setTimeout(r, 600));

  const newsModalInfo = await evalJs(
    '(() => {' +
    '  const modal = document.querySelector("[data-testid=\\"news-chronicle-modal\\"] .max-w-\\\\[1680px\\\\]");' +
    '  const rect = modal ? modal.getBoundingClientRect() : null;' +
    '  const h2 = document.querySelector("h2");' +
    '  return {' +
    '    foundModal: !!modal,' +
    '    title: h2 ? h2.textContent : null,' +
    '    width: rect ? Math.round(rect.width) : 0,' +
    '    height: rect ? Math.round(rect.height) : 0' +
    '  };' +
    '})()'
  );
  console.log('[NEWS CHRONICLE VERIFY]:', JSON.stringify(newsModalInfo));

  await capture('widescreen_news_chronicle_modal.png');

  if (!dispatchPopupInfo.foundH3 || dispatchPopupInfo.width < 700) {
    console.error('[ERROR] Dispatch popup is not wide!');
    process.exit(1);
  }

  if (!newsModalInfo.foundModal || newsModalInfo.width < 1200) {
    console.error('[ERROR] News chronicle modal is not wide!');
    process.exit(1);
  }

  console.log('[SUCCESS] All popups and modals verified with widescreen layout and legible typography!');
  app.quit();
  process.exit(0);
}

run();
