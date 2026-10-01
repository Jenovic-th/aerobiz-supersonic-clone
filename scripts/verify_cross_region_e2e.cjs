const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15-second safety limit. Aborting immediately.');
  process.exit(1);
}, 14000);
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

const screenshotDir = path.join(__dirname, '../screenshots');

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

  await new Promise((r) => setTimeout(r, 1000));

  // Resume saved game
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const resumeBtn = buttons.find(b => b.innerText.includes('Resume') || b.innerText.includes('เล่นต่อ'));
      if (resumeBtn) resumeBtn.click();
    })();
  `);

  // Wait for React to mount the main screen
  await new Promise((r) => setTimeout(r, 2000));

  // Now click on the Europe button to see Europe view
  const res = await win.webContents.executeJavaScript(`
    (() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const targetBtn = allButtons.find(b => b.textContent && b.textContent.includes('Europe'));
      if (targetBtn) {
        targetBtn.click();
        return { success: true, text: targetBtn.textContent };
      }
      return { success: false, buttons: allButtons.map(b => b.textContent.trim()).slice(0, 10) };
    })();
  `);

  console.log('Result of clicking Europe tab:', res);

  await new Promise((r) => setTimeout(r, 1200));

  const image = await win.capturePage();
  const scPath = path.join(screenshotDir, 'europe_regional_verified.png');
  fs.writeFileSync(scPath, image.toPNG());
  console.log('Saved Europe regional screenshot to: ' + scPath);

  app.quit();
  process.exit(0);
}

run();
