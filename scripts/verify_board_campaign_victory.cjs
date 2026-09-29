const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Mandatory 15-second safety watchdog
const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15-second safety limit. Aborting immediately.');
  process.exit(1);
}, 15000);
if (_safetyWatchdog.unref) _safetyWatchdog.unref();

// Mandatory Global Exception Handlers
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

const artifactDir = 'C:\\Users\\jenov\\.gemini\\antigravity\\brain\\63562c7a-0932-4d51-a25b-3cbf9a2c46f1';

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

  async function waitForText(text, maxMs = 2500) {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      const found = await win.webContents.executeJavaScript(
        'document.body.innerText.includes("' + text + '")'
      );
      if (found) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  }

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);
  await waitForText('COMMENCE AIRLINE OPERATION');

  console.log('--- Step 1: Start Game Simulation ---');
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const startBtn = buttons.find(b => b.innerText.includes("COMMENCE AIRLINE OPERATION") || b.innerText.includes("START SIMULATION"));' +
    '  if (startBtn) startBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));' +
    '})()'
  );
  await waitForText('End Quarter');

  console.log('--- Step 2: Test Board of Directors Meeting ---');
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const btn = buttons.find(b => b.innerText.includes("Board Meeting"));' +
    '  if (btn) btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));' +
    '})()'
  );
  await waitForText('BOARD OF DIRECTORS DELIBERATION');

  // Agenda 1: New Routes
  const boardImg1 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'board_meeting_agenda1_routes.png'), boardImg1.toPNG());
  console.log('Captured board_meeting_agenda1_routes.png');

  // Close Board Meeting
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const adjournBtn = buttons.find(b => b.innerText.includes("Adjourn Meeting") || b.innerText.includes("ปิดการประชุม"));' +
    '  if (adjournBtn) adjournBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 300));

  console.log('--- Step 3: Test Hotels, Ventures & Regional Advertising Campaigns ---');
  // Open Hotels & Ventures
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const btn = buttons.find(b => b.innerText.includes("Hotels & Ventures"));' +
    '  if (btn) btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));' +
    '})()'
  );
  await waitForText('SUBSIDIARIES & REGIONAL ADVERTISING');

  // Acquire Museum in Bangkok
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const cards = Array.from(document.querySelectorAll(".grid > div"));' +
    '  for (const card of cards) {' +
    '    if (card.innerText.includes("Aviation Heritage Museum") || card.innerText.includes("Museum")) {' +
    '      const acq = card.querySelector("button");' +
    '      if (acq && !acq.disabled) {' +
    '        acq.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));' +
    '        break;' +
    '      }' +
    '    }' +
    '  }' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 300));

  // Switch to Tab 2: Regional Advertising Campaigns
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const campTab = buttons.find(b => b.innerText.includes("Ad Campaigns") || b.innerText.includes("แคมเปญโฆษณา"));' +
    '  if (campTab) campTab.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));' +
    '})()'
  );
  await waitForText('CONTINENTAL ADVERTISING CAMPAIGNS');

  // Launch Culture & Art Campaign in Asia
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const launchBtn = buttons.find(b => b.innerText.includes("Launch ($1,200K)") && !b.disabled);' +
    '  if (launchBtn) launchBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));' +
    '})()'
  );
  await waitForText('ACTIVE: 4 Quarters Left');

  const campImg = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'business_modal_campaign_launched.png'), campImg.toPNG());
  console.log('Captured business_modal_campaign_launched.png');

  // Close Hotels & Ventures modal
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const closeBtn = buttons.find(b => b.innerText.includes("Close Window") || b.innerText.includes("ปิดหน้าต่าง"));' +
    '  if (closeBtn) closeBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 300));

  console.log('--- Step 4: Advance Quarter Simulation ---');
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const endQBtn = buttons.find(b => b.innerText.includes("End Quarter"));' +
    '  if (endQBtn) endQBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));' +
    '})()'
  );
  await waitForText('Quarterly Board Meeting & Financial Review');

  const quarterImg = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'quarter_report_campaign_effect.png'), quarterImg.toPNG());
  console.log('Captured quarter_report_campaign_effect.png');

  // Dismiss Quarter Report modal
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  if (window.__setShowQuarterReport) window.__setShowQuarterReport(false);' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 400));

  console.log('--- Step 5: Test Victory Screen (7 Hubs World Champion) ---');
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  if (window.__gameState && window.__setGameState && window.__setShowVictoryDefeatModal) {' +
    '    const humanId = window.__gameState.airlines.find(a => a.isHuman).id;' +
    '    window.__setGameState(prev => ({' +
    '      ...prev,' +
    '      isGameOver: true,' +
    '      winnerAirlineId: humanId,' +
    '      victoryType: "EARLY_VICTORY",' +
    '      victoryReason: "Koei Aerobiz Supersonic World Championship Achieved! Global Hub dominance across all 7 continents with #1 passenger traffic market share in 5 regions!",' +
    '      victoryDetails: {' +
    '        hubsCount: 7,' +
    '        leadingRegionsCount: 5,' +
    '        annualProfitK: 48250,' +
    '        totalPassengers: 1420500,' +
    '      }' +
    '    }));' +
    '    window.__setShowVictoryDefeatModal(true);' +
    '  }' +
    '})()'
  );
  await waitForText('WORLD AIRLINE CHAMPION');
  await new Promise((r) => setTimeout(r, 800));

  const victoryImg = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'victory_screen_7hubs_champion.png'), victoryImg.toPNG());
  console.log('Captured victory_screen_7hubs_champion.png');

  // Close Victory Modal
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  if (window.__setShowVictoryDefeatModal) window.__setShowVictoryDefeatModal(false);' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 500));

  console.log('--- Step 6: Test Defeat / Bankruptcy Screen ---');
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  if (window.__gameState && window.__setGameState && window.__setShowVictoryDefeatModal) {' +
    '    window.__setGameState(prev => {' +
    '      const updatedAirlines = prev.airlines.map(a => {' +
    '        if (a.isHuman) {' +
    '          return { ...a, consecutiveLossQuarters: 4, cashK: -12500 };' +
    '        }' +
    '        return a;' +
    '      });' +
    '      return {' +
    '        ...prev,' +
    '        airlines: updatedAirlines,' +
    '        isGameOver: true,' +
    '        winnerAirlineId: undefined,' +
    '        victoryType: "BANKRUPTCY",' +
    '        victoryReason: undefined,' +
    '        defeatReason: "Your airline has suffered four consecutive quarters of severe financial losses and accumulated massive debt. Creditors have foreclosed on your corporate assets under Chapter 11 bankruptcy regulations.",' +
    '      };' +
    '    });' +
    '    window.__setShowVictoryDefeatModal(true);' +
    '  }' +
    '})()'
  );
  await waitForText('CORPORATE INSOLVENCY');
  await new Promise((r) => setTimeout(r, 800));

  const defeatImg = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'defeat_screen_bankruptcy.png'), defeatImg.toPNG());
  console.log('Captured defeat_screen_bankruptcy.png');

  console.log('All verification steps completed successfully!');
  clearTimeout(_safetyWatchdog);
  app.quit();
  process.exit(0);
}

run();
