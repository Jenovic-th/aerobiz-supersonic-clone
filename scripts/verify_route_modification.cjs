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

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);

  await new Promise((r) => setTimeout(r, 1200));

  // 1. Click "COMMENCE AIRLINE OPERATION"
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.innerText.includes('COMMENCE AIRLINE OPERATION') || b.innerText.includes('START SIMULATION'));
      if (startBtn) startBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 1500));

  // 2. Open "My Routes" (Manage Routes Modal)
  const openedManage = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageBtn = buttons.find(b => b.innerText.includes('My Routes'));
      if (manageBtn) {
        manageBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Opened My Routes modal:', openedManage);

  await new Promise((r) => setTimeout(r, 1200));

  // Capture Screenshot 1: Route list showing Modify Route buttons
  const img1 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'route_list_with_modify_buttons.png'), img1.toPNG());
  console.log('Saved route_list_with_modify_buttons.png');

  // 3. Click "Modify Route (ปรับแต่ง)" on the first route
  const clickedModify = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const modifyBtn = buttons.find(b => b.innerText.includes('Modify Route'));
      if (modifyBtn) {
        modifyBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Clicked Modify Route:', clickedModify);

  await new Promise((r) => setTimeout(r, 1000));

  // 4. In the Route Modification modal, adjust:
  // a) Frequency to 3x
  // b) Ticket Price to +20%
  // c) Maintenance Tier to Rigorous Premium (125%)
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));

      // Click frequency 3x preset
      const threeXBtn = buttons.find(b => b.innerText.trim() === '3x');
      if (threeXBtn) threeXBtn.click();

      // Click +20% price preset
      const twentyPctBtn = buttons.find(b => b.innerText.trim() === '+20%');
      if (twentyPctBtn) twentyPctBtn.click();

      // Click Rigorous Premium maintenance tier
      const divs = Array.from(document.querySelectorAll('div'));
      const rigorousCard = divs.find(d => d.innerText && d.innerText.includes('Rigorous Premium'));
      if (rigorousCard) rigorousCard.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 1000));

  // Capture Screenshot 2: Route Modification Modal with all adjusted parameters & projections
  const img2 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'route_modification_modal_verified.png'), img2.toPNG());
  console.log('Saved route_modification_modal_verified.png');

  // 5. Click "Save & Apply Modifications"
  const saved = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(b => b.innerText.includes('Save & Apply'));
      if (saveBtn) {
        saveBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Saved modifications:', saved);

  await new Promise((r) => setTimeout(r, 1200));

  // Capture Screenshot 3: Route list showing updated parameters (+20%, 3 flt/wk, Rigorous 125%)
  const img3 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'route_list_after_modification_verified.png'), img3.toPNG());
  console.log('Saved route_list_after_modification_verified.png');

  app.quit();
}

run().catch((err) => {
  console.error(err);
  app.quit();
});
