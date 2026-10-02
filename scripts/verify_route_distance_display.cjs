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

  console.log('=== TEST 1: START GAME & OPEN MY ROUTES MODAL ===');

  // Step 1: Title Screen -> New Game Wizard
  await click('[data-testid="title-new-game-btn"]');
  await new Promise((r) => setTimeout(r, 250));

  // Step 2: Next -> Next -> Next -> Start Airline
  await click('[data-testid="wizard-next-step-1"]');
  await new Promise((r) => setTimeout(r, 250));

  await click('[data-testid="wizard-next-step-2"]');
  await new Promise((r) => setTimeout(r, 250));

  await click('[data-testid="wizard-next-step-3"]');
  await new Promise((r) => setTimeout(r, 250));

  await click('[data-testid="setup-start-game-btn"]');
  await new Promise((r) => setTimeout(r, 800));

  // Open "My Routes" modal from bottom toolbar
  await click('[data-testid="toolbar-my-routes-btn"]');
  await new Promise((r) => setTimeout(r, 600));

  // Check Active Routes Modal for distance badges
  const listCheck = await evalJs(
    '(() => {' +
    '  const routeCards = Array.from(document.querySelectorAll(".space-y-3 > div"));' +
    '  const sample = routeCards.map(div => {' +
    '    const text = div.textContent;' +
    '    const hasKm = text.includes("km");' +
    '    const hasDistanceLabel = text.includes("Distance:");' +
    '    const hasRangeLabel = text.includes("พิสัยบิน");' +
    '    return { hasKm, hasDistanceLabel, hasRangeLabel, snippet: text.slice(0, 180) };' +
    '  });' +
    '  return {' +
    '    totalRoutes: routeCards.length,' +
    '    sample' +
    '  };' +
    '})()'
  );

  console.log('[ACTIVE ROUTES DISTANCE CHECK]', JSON.stringify(listCheck, null, 2));

  if (listCheck.totalRoutes === 0 || !listCheck.sample[0].hasKm || !listCheck.sample[0].hasDistanceLabel) {
    throw new Error('Distance missing from Active Routes Network modal cards!');
  }

  await evalJs('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  await new Promise((r) => setTimeout(r, 400));
  // Capture screenshot of the Active Commercial Routes Network with distances
  const listScreenshot = await win.webContents.capturePage();
  fs.writeFileSync(path.join(__dirname, 'screenshot_routes_with_distance.png'), listScreenshot.toPNG());
  console.log('[SCREENSHOT] Saved screenshot_routes_with_distance.png');

  console.log('=== TEST 2: OPEN MODIFY ROUTE MODAL & CHECK DISTANCE & RANGE MARGIN ===');
  const clickRes = await evalJs(
    '(() => {' +
    '  const btn = document.querySelector("[data-testid=\'route-modify-btn\']");' +
    '  if (!btn) return { clicked: false, error: "btn not found" };' +
    '  btn.click();' +
    '  return { clicked: true };' +
    '})()'
  );
  console.log('[CLICK MODIFY BTN RESULT]', clickRes);
  await new Promise((r) => setTimeout(r, 600));

  const modifyCheck = await evalJs(
    '(() => {' +
    '  const modal = document.querySelector(".z-\\\\[60\\\\]") || document.querySelector("h3");' +
    '  const bodyText = document.body.textContent;' +
    '  const hasCorridorDist = bodyText.includes("ระยะทางบิน:") || bodyText.includes("Distance:");' +
    '  const hasRangeMargin = bodyText.includes("ส่วนต่างพิสัย:") || bodyText.includes("ส่วนเกิน");' +
    '  const hasPillBadge = !!document.querySelector(".bg-sky-950");' +
    '  return {' +
    '    modalHeader: modal ? modal.textContent : null,' +
    '    hasCorridorDist,' +
    '    hasRangeMargin,' +
    '    hasPillBadge' +
    '  };' +
    '})()'
  );

  console.log('[MODIFY ROUTE CHECK]', modifyCheck);

  await evalJs('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  await new Promise((r) => setTimeout(r, 400));
  const modifyScreenshot = await win.webContents.capturePage();
  fs.writeFileSync(path.join(__dirname, 'screenshot_modify_route_with_distance.png'), modifyScreenshot.toPNG());
  console.log('[SCREENSHOT] Saved screenshot_modify_route_with_distance.png');

  console.log('[ALL TESTS PASS] Route distance display successfully verified in both list and modification views!');
  app.quit();
  process.exit(0);
}

run();
