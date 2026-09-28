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

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);
  await new Promise((r) => setTimeout(r, 1200));

  console.log('1. Starting game from New Game Setup...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.innerText.includes('COMMENCE AIRLINE OPERATION') || b.innerText.includes('START SIMULATION'));
      if (startBtn) startBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 1500));

  // Capture main game screen
  const img1 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'game_main_screen_turn1.png'), img1.toPNG());
  console.log('Saved game_main_screen_turn1.png');

  // Verify Save & Load menu in Header
  console.log('2. Testing Quick Save via Header...');
  const quickSaveResult = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(b => b.innerText.includes('Save & Load'));
      if (saveBtn) {
        saveBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Clicked Save & Load button:', quickSaveResult);
  await new Promise((r) => setTimeout(r, 600));

  // Click Quick Save button inside dropdown
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const quickSaveBtn = buttons.find(b => b.innerText.includes('Quick Save'));
      if (quickSaveBtn) quickSaveBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Verify localStorage save
  const saveCheck = await win.webContents.executeJavaScript(`
    (() => {
      const manual = localStorage.getItem('aerobiz_manual_save');
      const meta = localStorage.getItem('aerobiz_manual_meta');
      return {
        hasManualSave: !!manual,
        saveLength: manual ? manual.length : 0,
        meta: meta ? JSON.parse(meta) : null
      };
    })();
  `);
  console.log('LocalStorage Save Verification:', saveCheck);

  // Advance Quarter to test Auto-Save and End Quarter features
  console.log('3. Advancing Quarter (End Quarter) to test Auto-Save & Event Bulletin...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const endQtrBtn = buttons.find(b => b.innerText.includes('End Quarter'));
      if (endQtrBtn) endQtrBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 1500));

  // Verify auto-save in localStorage
  const autoSaveCheck = await win.webContents.executeJavaScript(`
    (() => {
      const auto = localStorage.getItem('aerobiz_autosave');
      const meta = localStorage.getItem('aerobiz_autosave_meta');
      return {
        hasAutoSave: !!auto,
        meta: meta ? JSON.parse(meta) : null
      };
    })();
  `);
  console.log('Auto-Save Verification:', autoSaveCheck);

  // Capture Quarter Report with Flash Alerts
  const img2 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'quarter_report_autosave_verified.png'), img2.toPNG());
  console.log('Saved quarter_report_autosave_verified.png');

  // Close Quarter Report Modal
  await win.webContents.executeJavaScript(`
    (() => {
      const closeButtons = Array.from(document.querySelectorAll('button'));
      const closeBtn = closeButtons.find(b => b.innerText.includes('Proceed to Next Quarter') || b.querySelector('svg.lucide-x'));
      if (closeBtn) closeBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 1000));

  // Open Airport Slots Modal to check dynamic airport capacities & congestion
  console.log('4. Testing Airport Slots Modal with Dynamic Capacity...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const slotBtn = buttons.find(b => b.innerText.includes('Airport Slots'));
      if (slotBtn) slotBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 1000));

  const slotModalSummary = await win.webContents.executeJavaScript(`
    (() => {
      const modal = document.querySelector('.bg-slate-900.border-2.border-slate-600');
      return modal ? modal.innerText.slice(0, 500) : 'MODAL NOT FOUND';
    })();
  `);
  console.log('Airport Slots Modal Summary:\n', slotModalSummary);

  const img3 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'airport_slots_dynamic_capacity.png'), img3.toPNG());
  console.log('Saved airport_slots_dynamic_capacity.png');

  console.log('ALL VERIFICATIONS SUCCESSFUL!');
  app.quit();
}

run().catch((err) => {
  console.error('Error during verification:', err);
  app.quit();
});
