const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15-second safety limit. Aborting.');
  process.exit(1);
}, 15000);
if (_safetyWatchdog.unref) _safetyWatchdog.unref();

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

  win.webContents.on('console-message', (event, level, message) => {
    console.log('[BROWSER CONSOLE] ' + message);
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);
  await new Promise((r) => setTimeout(r, 1200));

  // Start game by clicking either Resume or Commence
  console.log('--- Clicking Start / Resume Button ---');
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const buttons = Array.from(document.querySelectorAll("button"));' +
    '  const btn = buttons.find(b => b.innerText.includes("Resume Flight Operations") || b.innerText.includes("COMMENCE AIRLINE OPERATION"));' +
    '  if (btn) btn.click();' +
    '})()'
  );

  // Wait until gameState is active
  for (let i = 0; i < 40; i++) {
    const ready = await win.webContents.executeJavaScript('!!window.__gameState');
    if (ready) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 500));

  console.log('--- Triggering Bankruptcy Defeat Modal ---');
  await win.webContents.executeJavaScript(
    '(() => {' +
    '  const updatedAirlines = window.__gameState.airlines.map(a => {' +
    '    if (a.isHuman) {' +
    '      return { ...a, consecutiveLossQuarters: 4, cashK: -16800 };' +
    '    }' +
    '    return a;' +
    '  });' +
    '  window.__setGameState({' +
    '    ...window.__gameState,' +
    '    airlines: updatedAirlines,' +
    '    isGameOver: true,' +
    '    winnerAirlineId: undefined,' +
    '    victoryType: "BANKRUPTCY",' +
    '    victoryReason: undefined,' +
    '    defeatReason: "Your airline has suffered four consecutive quarters of severe financial losses and accumulated massive debt. Creditors have foreclosed on your corporate assets under Chapter 11 bankruptcy regulations.",' +
    '  });' +
    '  window.__setShowVictoryDefeatModal(true);' +
    '})()'
  );

  // Wait for modal in DOM and GPU paint
  for (let i = 0; i < 30; i++) {
    const ready = await win.webContents.executeJavaScript(
      'document.body.innerText.includes("CORPORATE INSOLVENCY")'
    );
    if (ready) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 1500));

  const defeatImg = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'defeat_screen_bankruptcy.png'), defeatImg.toPNG());
  console.log('Successfully captured defeat_screen_bankruptcy.png');

  clearTimeout(_safetyWatchdog);
  app.quit();
  process.exit(0);
}

run();
