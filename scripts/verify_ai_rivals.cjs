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

  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[BROWSER CONSOLE] ${message} (line ${line})`);
  });

  win.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('Failed to load:', code, desc);
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);

  await win.webContents.executeJavaScript(`
    window.addEventListener('error', (e) => {
      console.log('WINDOW ERROR:', e.message, e.filename, e.lineno);
    });
    window.addEventListener('unhandledrejection', (e) => {
      console.log('UNHANDLED REJECTION:', e.reason);
    });
  `);

  // Wait for initial render
  await new Promise((r) => setTimeout(r, 1200));

  // 1. Capture NewGameSetupModal with AI Rivals
  const setupImage = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'ai_rivals_setup_screen.png'), setupImage.toPNG());
  console.log('Saved ai_rivals_setup_screen.png');

  // 2. Click "COMMENCE AIRLINE OPERATION (START SIMULATION)"
  const clickResult = await win.webContents.executeJavaScript(`
    try {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('COMMENCE AIRLINE OPERATION'));
      if (btn) {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        'DISPATCHED_CLICK';
      } else {
        'BUTTON_NOT_FOUND';
      }
    } catch(err) {
      'ERR: ' + err.message;
    }
  `);
  console.log('Click result:', clickResult);

  await new Promise((r) => setTimeout(r, 1500));

  const afterState = await win.webContents.executeJavaScript(`
    ({
      hasCanvas: !!document.querySelector('canvas'),
      headerText: document.querySelector('header')?.textContent || '',
      bodyTextSnippet: document.body.textContent?.slice(0, 300) || '',
      hasNewGameSetup: !!document.querySelector('h1')?.textContent?.includes('AIROBIZ SUPERSONIC')
    })
  `);
  console.log('DOM State after clicking:', afterState);
  win.setSize(1440, 901);
  await new Promise((r) => setTimeout(r, 500));
  win.setSize(1440, 900);
  await new Promise((r) => setTimeout(r, 1000));
  const mapImage = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'ai_world_map_multi_airline.png'), mapImage.toPNG());
  console.log('Saved ai_world_map_multi_airline.png');

  // 4. Click "End Quarter" in BottomToolbar to advance 1 quarter and trigger AI decisions + Leaderboard
  const clickEndQResult = await win.webContents.executeJavaScript(`
    try {
      const endQBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.includes('End Quarter') || b.textContent.includes('Next Quarter')
      );
      if (endQBtn) {
        endQBtn.click();
        'END_QUARTER_CLICKED';
      } else {
        'END_QUARTER_NOT_FOUND';
      }
    } catch(err) {
      'ERR: ' + err.message;
    }
  `);
  console.log('End Quarter click result:', clickEndQResult);

  await new Promise((r) => setTimeout(r, 2000));

  // 5. Capture Quarter Report with Global Airline Industry Standings
  const reportImage = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'ai_quarter_report_leaderboard.png'), reportImage.toPNG());
  console.log('Saved ai_quarter_report_leaderboard.png');

  app.quit();
}

run().catch((err) => {
  console.error(err);
  app.quit();
});
