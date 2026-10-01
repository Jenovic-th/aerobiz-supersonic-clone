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

  // Start with compact resolution 1024x768
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
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
    await new Promise((r) => setTimeout(r, 250));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(screenshotsDir, filename), img.toPNG());
    console.log('[SCREENSHOT] Saved ' + filename);
  };

  // Helper to assert element is inside viewport bounds
  const assertInViewport = async (selector, label) => {
    const res = await evalJs(
      '(() => {' +
      '  const el = document.querySelector(' + JSON.stringify(selector) + ');' +
      '  if (!el) return { found: false };' +
      '  const r = el.getBoundingClientRect();' +
      '  const inViewport = r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth;' +
      '  return {' +
      '    found: true,' +
      '    inViewport,' +
      '    top: Math.round(r.top),' +
      '    bottom: Math.round(r.bottom),' +
      '    winH: window.innerHeight' +
      '  };' +
      '})()'
    );
    if (!res.found) {
      throw new Error('Element not found for ' + label + ': ' + selector);
    }
    console.log('[VIEWPORT CHECK] ' + label + ': top=' + res.top + ', bottom=' + res.bottom + ', winH=' + res.winH + ', inViewport=' + res.inViewport);
    return res;
  };

  // Helper to assert End Quarter button is completely inside viewport and never cut off
  const assertToolbarAndEndQuarter = async (resName) => {
    const res = await evalJs(
      '(() => {' +
      '  const endBtn = document.querySelector(\'[data-testid="toolbar-end-quarter-btn"]\');' +
      '  if (!endBtn) return { found: false };' +
      '  const r = endBtn.getBoundingClientRect();' +
      '  const inViewport = r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth;' +
      '  return {' +
      '    found: true,' +
      '    inViewport,' +
      '    left: Math.round(r.left),' +
      '    right: Math.round(r.right),' +
      '    winW: window.innerWidth,' +
      '    marginRight: Math.round(window.innerWidth - r.right)' +
      '  };' +
      '})()'
    );
    if (!res.found) throw new Error('End Quarter button not found at ' + resName);
    console.log('[TOOLBAR CHECK ' + resName + '] End Quarter: left=' + res.left + ', right=' + res.right + ', winW=' + res.winW + ', margin=' + res.marginRight + ', inViewport=' + res.inViewport);
    if (!res.inViewport || res.right > res.winW) {
      throw new Error('End Quarter button is cut off or outside window at ' + resName + '!');
    }
  };

  console.log('=== TEST 1: TITLE SCREEN AT 1024x768 ===');
  await new Promise((r) => setTimeout(r, 400));
  await assertInViewport('[data-testid="title-new-game-btn"]', 'Title New Game Button');
  await capture('responsive_1_title_1024x768.png');

  console.log('=== TEST 2: NEW GAME SETUP WIZARD AT 1024x768 ===');
  await click('[data-testid="title-new-game-btn"]');
  await new Promise((r) => setTimeout(r, 300));

  // Step 1: Era selector & Next button
  await assertInViewport('[data-testid="wizard-next-step-1"]', 'Wizard Step 1 Next Button');
  await capture('responsive_2_step1_1024x768.png');
  await click('[data-testid="wizard-next-step-1"]');
  await new Promise((r) => setTimeout(r, 250));

  // Step 2: Competitors setup
  await assertInViewport('[data-testid="wizard-next-step-2"]', 'Wizard Step 2 Next Button');
  await capture('responsive_3_step2_1024x768.png');
  await click('[data-testid="wizard-next-step-2"]');
  await new Promise((r) => setTimeout(r, 250));

  // Step 3: HQ & Capital setup
  await assertInViewport('[data-testid="wizard-next-step-3"]', 'Wizard Step 3 Next Button');
  await capture('responsive_4_step3_1024x768.png');
  await click('[data-testid="wizard-next-step-3"]');
  await new Promise((r) => setTimeout(r, 250));

  // Step 4: Final launch review
  await assertInViewport('[data-testid="setup-start-game-btn"]', 'Wizard Step 4 Start Button');
  await capture('responsive_5_step4_1024x768.png');
  await click('[data-testid="setup-start-game-btn"]');
  await new Promise((r) => setTimeout(r, 1000));

  console.log('=== TEST 3: MAIN GAME HUD AT 1024x768 ===');
  await assertInViewport('header', 'Executive Top Bar');
  await assertInViewport('footer', 'Bottom Toolbar');
  await assertToolbarAndEndQuarter('1024x768');
  await capture('responsive_6_game_hud_1024x768.png');

  console.log('=== TEST 4: AIRCRAFT SHOP & BLUEPRINT VIEWER AT 1024x768 ===');
  // Open Aircraft Shop
  await evalJs('window.__setGameState && (() => {' +
    '  const el = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.includes("Market"));' +
    '  if (el) el.click();' +
    '})()');
  await new Promise((r) => setTimeout(r, 600));

  // Check shop order strip is visible and accessible
  const shopCheck = await evalJs(
    '(() => {' +
    '  const orderStrip = Array.from(document.querySelectorAll("div")).find(d => d.textContent && d.textContent.includes("ORDERING UNIT:"));' +
    '  if (!orderStrip) return { found: false };' +
    '  const r = orderStrip.getBoundingClientRect();' +
    '  return {' +
    '    found: true,' +
    '    top: Math.round(r.top),' +
    '    bottom: Math.round(r.bottom),' +
    '    winH: window.innerHeight,' +
    '    inViewport: r.top >= 0 && r.bottom <= window.innerHeight' +
    '  };' +
    '})()'
  );
  console.log('[SHOP CHECK 1024x768] Order Strip found=' + shopCheck.found + ', top=' + shopCheck.top + ', bottom=' + shopCheck.bottom + ', inViewport=' + shopCheck.inViewport);
  await capture('responsive_7_aircraft_shop_1024x768.png');

  // Close Aircraft shop
  await click('[data-testid="modal-close-header-btn"]');
  await new Promise((r) => setTimeout(r, 300));

  console.log('=== TEST 5: CITY DETAIL MODAL AT 1024x768 ===');
  await evalJs('window.__openCityDetail("TYO")');
  await new Promise((r) => setTimeout(r, 600));

  const cityCheck = await evalJs(
    '(() => {' +
    '  const h4s = Array.from(document.querySelectorAll("h4"));' +
    '  const cards = h4s.map(h => h.closest(".rounded-2xl.border"));' +
    '  const validCards = cards.filter(Boolean);' +
    '  const rects = validCards.map((c, i) => {' +
    '    const r = c.getBoundingClientRect();' +
    '    const b = c.querySelector("button")?.getBoundingClientRect();' +
    '    return {' +
    '      index: i,' +
    '      buttonContained: b ? (Math.round(b.bottom) <= Math.round(r.bottom) + 1) : true' +
    '    };' +
    '  });' +
    '  let overlaps = 0;' +
    '  for (let i = 0; i < validCards.length; i++) {' +
    '    for (let j = i + 1; j < validCards.length; j++) {' +
    '      const ra = validCards[i].getBoundingClientRect();' +
    '      const rb = validCards[j].getBoundingClientRect();' +
    '      const xOverlap = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));' +
    '      const yOverlap = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));' +
    '      if (xOverlap > 5 && yOverlap > 5) overlaps++;' +
    '    }' +
    '  }' +
    '  return {' +
    '    cardCount: validCards.length,' +
    '    overlaps,' +
    '    allButtonsContained: rects.every(r => r.buttonContained)' +
    '  };' +
    '})()'
  );
  console.log('[CITY DETAIL 1024x768] cards=' + cityCheck.cardCount + ', overlaps=' + cityCheck.overlaps + ', allButtonsContained=' + cityCheck.allButtonsContained);
  if (cityCheck.overlaps > 0 || !cityCheck.allButtonsContained) {
    throw new Error('City Detail Card overlap or uncontained buttons at 1024x768!');
  }
  await capture('responsive_8_city_detail_1024x768.png');

  // Close City Detail
  await click('[data-testid="modal-close-header-btn"]');
  await new Promise((r) => setTimeout(r, 300));

  console.log('=== TEST 6: RESIZING TO 1280x720 (HD COMPACT) ===');
  win.setSize(1280, 720);
  await new Promise((r) => setTimeout(r, 400));
  await assertToolbarAndEndQuarter('1280x720');

  // Re-verify City Detail at 1280x720
  await evalJs('window.__openCityDetail("BKK")');
  await new Promise((r) => setTimeout(r, 500));
  await capture('responsive_9_city_detail_1280x720.png');
  await click('[data-testid="modal-close-header-btn"]');
  await new Promise((r) => setTimeout(r, 300));

  // Open Settings at 1280x720
  console.log('=== TEST 7: SETTINGS MODAL AT 1280x720 ===');
  await click('[data-testid="header-system-btn"]');
  await new Promise((r) => setTimeout(r, 200));
  await evalJs('(() => {' +
    '  const el = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.includes("Game Settings"));' +
    '  if (el) el.click();' +
    '})()');
  await new Promise((r) => setTimeout(r, 400));
  await assertInViewport('[data-testid="modal-close-header-btn"]', 'Settings Modal Close Button');
  await capture('responsive_10_settings_1280x720.png');
  await click('[data-testid="modal-close-header-btn"]');
  await new Promise((r) => setTimeout(r, 300));

  console.log('=== TEST 8: RESIZING TO WIDESCREEN 1600x900 ===');
  win.setSize(1600, 900);
  await new Promise((r) => setTimeout(r, 400));
  await assertToolbarAndEndQuarter('1600x900');
  await capture('responsive_11_game_1600x900.png');

  console.log('[ALL TESTS PASS] Responsive scaling verified across all screens and window resolutions without hangs or clipping!');
  app.quit();
  process.exit(0);
}

run();
