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

  // 1. Start Simulation
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.innerText.includes('COMMENCE AIRLINE OPERATION') || b.innerText.includes('START SIMULATION'));
      if (startBtn) startBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 1200));

  // 2. Open Market
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const marketBtn = buttons.find(b => b.innerText.includes('Market'));
      if (marketBtn) marketBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 1200));

  // 3. Click "R&D Roadmap" Tab
  const roadmapClick = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const roadmapTab = buttons.find(b => b.innerText.includes('R&D Roadmap'));
      if (roadmapTab) {
        roadmapTab.click();
        return { success: true, text: roadmapTab.innerText };
      }
      return { success: false };
    })();
  `);
  console.log('[TEST] Roadmap Tab Clicked:', roadmapClick);

  await new Promise((r) => setTimeout(r, 1000));

  // 4. Inspect Roadmap Content
  const roadmapInfo = await win.webContents.executeJavaScript(`
    (() => {
      const pills = Array.from(document.querySelectorAll('button')).filter(b => 
        b.innerText.includes('All (') || 
        b.innerText.includes('In Market') || 
        b.innerText.includes('Upcoming') || 
        b.innerText.includes('Retired')
      ).map(b => b.innerText);

      const statusStrong = document.querySelector('strong.text-purple-300');

      return {
        filterPills: pills,
        selectedPreviewModel: statusStrong ? statusStrong.innerText : 'NONE'
      };
    })();
  `);
  console.log('[TEST] Roadmap Info:', JSON.stringify(roadmapInfo, null, 2));

  // 5. Click "Upcoming" filter
  const upcomingClick = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const upcomingBtn = buttons.find(b => b.innerText.includes('Upcoming'));
      if (upcomingBtn) {
        upcomingBtn.click();
        return { success: true, text: upcomingBtn.innerText };
      }
      return { success: false };
    })();
  `);
  console.log('[TEST] Upcoming Filter Clicked:', upcomingClick);

  await new Promise((r) => setTimeout(r, 800));

  // Capture Screenshot of R&D Roadmap
  const image = await win.webContents.capturePage();
  const screenPath = path.join(artifactDir, 'aircraft_rd_roadmap_verified.png');
  fs.writeFileSync(screenPath, image.toPNG());
  console.log('[TEST] Screenshot saved to:', screenPath);

  clearTimeout(_safetyWatchdog);
  app.quit();
}

run();
