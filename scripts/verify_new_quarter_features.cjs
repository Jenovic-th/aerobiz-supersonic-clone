const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:\\Users\\Jeno\\.gemini\\antigravity\\brain\\a6b60bc5-b9cf-431a-b571-e08131f17473';

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
    console.log(`[BROWSER CONSOLE] ${message}`);
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);

  await new Promise((r) => setTimeout(r, 1500));

  // 1. Click "COMMENCE AIRLINE OPERATION (START SIMULATION)"
  await win.webContents.executeJavaScript(`
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('COMMENCE AIRLINE OPERATION'));
    if (btn) btn.click();
  `);

  await new Promise((r) => setTimeout(r, 1500));

  // 2. Advance 1 Quarter to simulate all airlines
  await win.webContents.executeJavaScript(`
    const endQBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent.includes('End Quarter') || b.textContent.includes('Next Quarter')
    );
    if (endQBtn) endQBtn.click();
  `);

  await new Promise((r) => setTimeout(r, 2000));

  // 3. Capture Tab 1: Global Overview with Koei Aerobiz Retro Comparison
  const tab1Image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'quarter_report_tab1_overview.png'), tab1Image.toPNG());
  console.log('Saved quarter_report_tab1_overview.png');

  // 4. Click Tab 2: "Airlines & Continents (เจาะลึกรายทวีป)"
  await win.webContents.executeJavaScript(`
    const tab2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Airlines & Continents'));
    if (tab2) tab2.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  `);
  win.setSize(1440, 901);
  await new Promise((r) => setTimeout(r, 300));
  win.setSize(1440, 900);
  await new Promise((r) => setTimeout(r, 800));
  const tab2Image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'quarter_report_tab2_continents.png'), tab2Image.toPNG());
  console.log('Saved quarter_report_tab2_continents.png');

  // 5. Click Tab 3: "Aviation Bulletin & Sales"
  await win.webContents.executeJavaScript(`
    const tab3 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Aviation Bulletin'));
    if (tab3) tab3.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  `);
  win.setSize(1440, 901);
  await new Promise((r) => setTimeout(r, 300));
  win.setSize(1440, 900);
  await new Promise((r) => setTimeout(r, 800));
  const tab3Image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'quarter_report_tab3_bulletin.png'), tab3Image.toPNG());
  console.log('Saved quarter_report_tab3_bulletin.png');

  // 6. Close Quarter Report and view World Map (shows flashing red routes if deficit)
  await win.webContents.executeJavaScript(`
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirm & Enter Next Quarter'));
    if (confirmBtn) confirmBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  `);
  win.setSize(1440, 901);
  await new Promise((r) => setTimeout(r, 300));
  win.setSize(1440, 900);
  await new Promise((r) => setTimeout(r, 1200));
  const mapImage = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'world_map_with_deficit_routes.png'), mapImage.toPNG());
  console.log('Saved world_map_with_deficit_routes.png');

  // 7. Open Aircraft Market to verify Flash Sale banner or catalog
  await win.webContents.executeJavaScript(`
    const shopBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Aircraft Market'));
    if (shopBtn) shopBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  `);
  win.setSize(1440, 901);
  await new Promise((r) => setTimeout(r, 300));
  win.setSize(1440, 900);
  await new Promise((r) => setTimeout(r, 1200));
  const shopImage = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'aircraft_market_flash_sales.png'), shopImage.toPNG());
  console.log('Saved aircraft_market_flash_sales.png');

  app.quit();
}

run().catch((err) => {
  console.error(err);
  app.quit();
});
