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
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER] ${message}`);
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

  // 2. Click "Aircraft Market"
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const shopBtn = buttons.find(b => b.innerText.includes('Aircraft Market'));
      if (shopBtn) {
        shopBtn.click();
        console.log('Clicked Aircraft Market');
      }
    })();
  `);

  await new Promise((r) => setTimeout(r, 1500));

  // 3. Inspect cards and click DC-8
  const diag = await win.webContents.executeJavaScript(`
    (() => {
      const cards = Array.from(document.querySelectorAll('[data-model-id]'));
      console.log('Cards found:', cards.map(c => c.getAttribute('data-model-id')));
      const dc8 = document.querySelector('[data-model-id="DC-8-62"]');
      if (dc8) {
        console.log('Clicking DC-8 card...');
        dc8.click();
        return { count: cards.length, dc8Found: true };
      }
      return { count: cards.length, dc8Found: false };
    })();
  `);
  console.log('Diagnostics:', diag);

  await new Promise((r) => setTimeout(r, 1500));

  const selectedTitle = await win.webContents.executeJavaScript(`
    (() => {
      const h1 = document.querySelector('h1');
      const orderStrong = document.querySelector('strong.text-sky-300');
      const activeCard = document.querySelector('[data-model-id].border-2');
      return {
        h1: h1 ? h1.innerText : 'NO H1',
        orderStrong: orderStrong ? orderStrong.innerText : 'NO STRONG',
        activeCard: activeCard ? activeCard.getAttribute('data-model-id') : 'NONE'
      };
    })();
  `);
  console.log('Right pane and card state:', selectedTitle);

  const image = await win.webContents.capturePage();
  const screenPath = path.join(artifactDir, 'dc8_model_view_verified.png');
  fs.writeFileSync(screenPath, image.toPNG());
  console.log(`DC-8 Screenshot saved to: ${screenPath}`);

  app.quit();
}

run().catch((err) => {
  console.error(err);
  app.quit();
});
