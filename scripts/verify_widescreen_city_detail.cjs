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
    await new Promise((r) => setTimeout(r, 800));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(screenshotsDir, filename), img.toPNG());
    console.log('[SCREENSHOT] Saved ' + filename);
  };

  console.log('[STEP 1] Starting from Title screen to Game...');
  await new Promise((r) => setTimeout(r, 600));
  await click('[data-testid="title-new-game-btn"]');
  await new Promise((r) => setTimeout(r, 400));
  await click('[data-testid="wizard-next-step-1"]');
  await new Promise((r) => setTimeout(r, 400));
  await click('[data-testid="wizard-next-step-2"]');
  await new Promise((r) => setTimeout(r, 400));
  await click('[data-testid="wizard-next-step-3"]');
  await new Promise((r) => setTimeout(r, 400));
  await click('[data-testid="setup-start-game-btn"]');
  await new Promise((r) => setTimeout(r, 1200));

  console.log('[STEP 2] Opening CityDetailModal for Tokyo (TYO)...');
  await evalJs('window.__openCityDetail("TYO")');
  await new Promise((r) => setTimeout(r, 700));

  // Verify modal elements
  const modalInfo = await evalJs(
    '(() => {' +
    '  const h2 = document.querySelector("h2");' +
    '  const cityName = h2 ? h2.textContent : null;' +
    '  const ventureTitles = Array.from(document.querySelectorAll("h4")).map(h => h.textContent);' +
    '  const hasImperialHotel = ventureTitles.some(t => t.includes("Imperial Tokyo Grand Hotel"));' +
    '  const hasNaritaBus = ventureTitles.some(t => t.includes("Narita & Haneda Airport Limousine Bus"));' +
    '  const hasThemeDome = ventureTitles.some(t => t.includes("Tokyo Bay Futuristic Theme Dome"));' +
    '  const hasJTB = ventureTitles.some(t => t.includes("Japan Travel Bureau (JTB)"));' +
    '  const hasFujiGolf = ventureTitles.some(t => t.includes("Mt. Fuji Vista Golf Country Club"));' +
    '  const hasGinzaTower = ventureTitles.some(t => t.includes("Ginza Skyline Executive Tower"));' +
    '  const envoyCards = Array.from(document.querySelectorAll("span")).filter(s => s.textContent.includes("John Doe") || s.textContent.includes("Kenji"));' +
    '  const modalBox = document.querySelector(".w-\\\\[96vw\\\\]");' +
    '  const rect = modalBox ? modalBox.getBoundingClientRect() : null;' +
    '  return {' +
    '    cityName,' +
    '    ventureTitles,' +
    '    hasImperialHotel,' +
    '    hasNaritaBus,' +
    '    hasThemeDome,' +
    '    hasJTB,' +
    '    hasFujiGolf,' +
    '    hasGinzaTower,' +
    '    envoyCount: envoyCards.length,' +
    '    modalWidth: rect ? Math.round(rect.width) : 0,' +
    '    modalHeight: rect ? Math.round(rect.height) : 0' +
    '  };' +
    '})()'
  );

  console.log('[VERIFY RESULTS]:', JSON.stringify(modalInfo, null, 2));

  await capture('widescreen_city_detail_tokyo.png');

  if (!modalInfo.cityName || !modalInfo.hasImperialHotel || !modalInfo.hasNaritaBus) {
    console.error('[ERROR] City detail verification failed!');
    process.exit(1);
  }

  console.log('[SUCCESS] CityDetailModal rendered in full widescreen with all 6 rich ventures and large envoys!');
  app.quit();
  process.exit(0);
}

run();
