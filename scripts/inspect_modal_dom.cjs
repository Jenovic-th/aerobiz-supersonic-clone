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
  const win = new BrowserWindow({ width: 1280, height: 720, show: false });
  await win.loadFile(path.join(__dirname, '../dist/index.html'));

  const evalJs = async (code) => win.webContents.executeJavaScript(code);

  await new Promise((r) => setTimeout(r, 500));
  await evalJs('document.querySelector("[data-testid=\\"title-new-game-btn\\"]").click()');
  await new Promise((r) => setTimeout(r, 300));
  await evalJs('document.querySelector("[data-testid=\\"wizard-next-step-1\\"]").click()');
  await new Promise((r) => setTimeout(r, 300));
  await evalJs('document.querySelector("[data-testid=\\"wizard-next-step-2\\"]").click()');
  await new Promise((r) => setTimeout(r, 300));
  await evalJs('document.querySelector("[data-testid=\\"wizard-next-step-3\\"]").click()');
  await new Promise((r) => setTimeout(r, 300));
  await evalJs('document.querySelector("[data-testid=\\"setup-start-game-btn\\"]").click()');
  await new Promise((r) => setTimeout(r, 1200));

  await evalJs('window.__openCityDetail("TYO")');
  await new Promise((r) => setTimeout(r, 600));

  const info = await evalJs(
    '(() => {' +
    '  const envoyBox = document.querySelector(".space-y-1\\\\.5");' +
    '  const ventureGrid = document.querySelector(".content-start");' +
    '  return {' +
    '    envoyChildren: envoyBox ? Array.from(envoyBox.children).map(c => {' +
    '      const r = c.getBoundingClientRect();' +
    '      return { name: c.querySelector(".font-bold")?.textContent, top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };' +
    '    }) : [],' +
    '    ventureCards: ventureGrid ? Array.from(ventureGrid.children).map(c => {' +
    '      const r = c.getBoundingClientRect();' +
    '      const b = c.querySelector("button")?.getBoundingClientRect();' +
    '      return { h4: c.querySelector("h4")?.textContent, top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), btnBottom: b ? Math.round(b.bottom) : null, isButtonInside: b ? (Math.round(b.bottom) <= Math.round(r.bottom)) : true };' +
    '    }) : []' +
    '  };' +
    '})()'
  );

  console.log('ENVOY CHILDREN:', JSON.stringify(info.envoyChildren, null, 2));
  console.log('VENTURE CARDS:', JSON.stringify(info.ventureCards, null, 2));

  // Take a fresh screenshot
  const img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(__dirname, '../screenshots/city_detail_1280x720_perfect.png'), img.toPNG());
  console.log('[SCREENSHOT] Saved city_detail_1280x720_perfect.png');

  app.quit();
  process.exit(0);
}

run();
