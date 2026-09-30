const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15-second safety limit. Aborting immediately.');
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

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const artifactDir = process.env.ARTIFACT_DIR || path.join(__dirname, '../screenshots');
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
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

  win.webContents.on('console-message', (event, level, message) => {
    console.log('[RENDERER]', message);
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);

  await new Promise((r) => setTimeout(r, 1200));

  // 1. Click "COMMENCE AIRLINE OPERATION"
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.innerText.includes('COMMENCE AIRLINE OPERATION') || b.innerText.includes('START SIMULATION'));
      if (startBtn) {
        startBtn.click();
        console.log('Clicked start simulation');
      }
    })();
  `);

  await new Promise((r) => setTimeout(r, 1500));

  // 2. Open Aircraft Market
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const shopBtn = buttons.find(b => b.innerText.includes('Market'));
      if (shopBtn) {
        shopBtn.click();
        console.log('Clicked Market button');
      }
    })();
  `);

  await new Promise((r) => setTimeout(r, 1500));

  // 3. Inspect Manufacturer Chips
  const mfgReport = await win.webContents.executeJavaScript(`
    (() => {
      const modalHeader = document.querySelector('h2');
      const cards = Array.from(document.querySelectorAll('[data-model-id]'));
      const allModelIds = cards.map(c => c.getAttribute('data-model-id'));
      
      const showroomDeck = Array.from(document.querySelectorAll('div')).find(d => d.innerText && d.innerText.includes('MANUFACTURER SHOWROOM:'));
      let chips = [];
      if (showroomDeck) {
        const buttons = Array.from(showroomDeck.querySelectorAll('button'));
        chips = buttons.map(b => b.innerText.replace(/\\s+/g, ' ').trim());
      }

      return {
        header: modalHeader ? modalHeader.innerText : null,
        chips,
        totalInitialModels: cards.length,
        allModelIds
      };
    })();
  `);
  console.log('[TEST] Showroom Chips Report:', JSON.stringify(mfgReport, null, 2));

  // 4. Test clicking "McDonnell Douglas"
  const mcdonnellResult = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const mcdBtn = buttons.find(b => b.innerText.includes('McDonnell'));
      if (mcdBtn) {
        mcdBtn.click();
        return { clicked: true, text: mcdBtn.innerText.replace(/\\s+/g, ' ').trim() };
      }
      return { clicked: false };
    })();
  `);
  console.log('[TEST] Clicked McDonnell Douglas:', mcdonnellResult);

  await new Promise((r) => setTimeout(r, 600));

  const mcdModels = await win.webContents.executeJavaScript(`
    (() => {
      const cards = Array.from(document.querySelectorAll('[data-model-id]'));
      return cards.map(c => c.getAttribute('data-model-id'));
    })();
  `);
  console.log('[TEST] Models visible under McDonnell Douglas filter:', mcdModels);

  // 5. Test clicking "Ilyushin"
  const ilyushinResult = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const ilyBtn = buttons.find(b => b.innerText.includes('Ilyushin'));
      if (ilyBtn) {
        ilyBtn.click();
        return { clicked: true, text: ilyBtn.innerText.replace(/\\s+/g, ' ').trim() };
      }
      return { clicked: false };
    })();
  `);
  console.log('[TEST] Clicked Ilyushin:', ilyushinResult);

  await new Promise((r) => setTimeout(r, 600));

  const ilyushinModels = await win.webContents.executeJavaScript(`
    (() => {
      const cards = Array.from(document.querySelectorAll('[data-model-id]'));
      return cards.map(c => c.getAttribute('data-model-id'));
    })();
  `);
  console.log('[TEST] Models visible under Ilyushin filter:', ilyushinModels);

  // 6. Test clicking "Lockheed"
  const lockheedResult = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const lockheedBtn = buttons.find(b => b.innerText.includes('Lockheed'));
      if (lockheedBtn) {
        lockheedBtn.click();
        return { clicked: true, text: lockheedBtn.innerText.replace(/\\s+/g, ' ').trim() };
      }
      return { clicked: false };
    })();
  `);
  console.log('[TEST] Clicked Lockheed:', lockheedResult);

  await new Promise((r) => setTimeout(r, 600));

  const lockheedModels = await win.webContents.executeJavaScript(`
    (() => {
      const cards = Array.from(document.querySelectorAll('[data-model-id]'));
      return cards.map(c => c.getAttribute('data-model-id'));
    })();
  `);
  console.log('[TEST] Models visible under Lockheed filter:', lockheedModels);

  // 7. Click "All Models"
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const allBtn = buttons.find(b => b.innerText.includes('All Models'));
      if (allBtn) allBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 600));

  const image = await win.webContents.capturePage();
  const screenPath = path.join(artifactDir, 'manufacturer_showroom_verified.png');
  fs.writeFileSync(screenPath, image.toPNG());
  console.log('[TEST] Screenshot captured:', screenPath);

  clearTimeout(_safetyWatchdog);
  app.quit();
}

run();
