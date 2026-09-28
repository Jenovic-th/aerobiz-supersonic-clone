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

  // 2. Open Aircraft Market
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const shopBtn = buttons.find(b => b.innerText.includes('Aircraft Market'));
      if (shopBtn) shopBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 1500));

  // 3. Click "2x" preset on bottom bar for DC-8 or 707
  const qState = await win.webContents.executeJavaScript(`
    (() => {
      // Find 2x button
      const buttons = Array.from(document.querySelectorAll('button'));
      const twoXBtn = buttons.find(b => b.innerText.trim() === '2x');
      if (twoXBtn) twoXBtn.click();

      // Return bottom bar text
      return {
        clicked2x: !!twoXBtn
      };
    })();
  `);
  console.log('Clicked 2x preset:', qState);

  await new Promise((r) => setTimeout(r, 1000));

  // Capture Screenshot 1: Quantity selector with 2x
  const img1 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'aircraft_shop_quantity_selector.png'), img1.toPNG());
  console.log('Saved aircraft_shop_quantity_selector.png');

  // 4. Click "Review & Order 2x" button to open confirmation contract modal
  const reviewOpened = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reviewBtn = buttons.find(b => b.innerText.includes('Review & Order'));
      if (reviewBtn) {
        reviewBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Review button clicked, opened modal:', reviewOpened);

  await new Promise((r) => setTimeout(r, 1000));

  // Capture Screenshot 2: Procurement Contract Review Modal
  const img2 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'aircraft_procurement_contract_modal.png'), img2.toPNG());
  console.log('Saved aircraft_procurement_contract_modal.png');

  // 5. Test Cancel button works without charging
  const cancelTest = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cancelBtn = buttons.find(b => b.innerText.includes('Cancel Order'));
      if (cancelBtn) {
        cancelBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Cancelled order review:', cancelTest);

  await new Promise((r) => setTimeout(r, 800));

  // Re-open review and confirm purchase
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reviewBtn = buttons.find(b => b.innerText.includes('Review & Order'));
      if (reviewBtn) reviewBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 800));

  // Click Confirm & Finalize Purchase
  const confirmed = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const confirmBtn = buttons.find(b => b.innerText.includes('Confirm & Finalize'));
      if (confirmBtn) {
        confirmBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Order confirmed and finalized:', confirmed);

  await new Promise((r) => setTimeout(r, 1200));

  // 6. Switch to Fleet Hangar tab to verify newly acquired aircraft
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const hangarTab = buttons.find(b => b.innerText.includes('Fleet Hangar'));
      if (hangarTab) hangarTab.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 1000));

  // Capture Screenshot 3: Fleet Hangar with new aircraft
  const img3 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'aircraft_fleet_post_purchase.png'), img3.toPNG());
  console.log('Saved aircraft_fleet_post_purchase.png');

  app.quit();
}

run().catch((err) => {
  console.error(err);
  app.quit();
});
