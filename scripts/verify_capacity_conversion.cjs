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

  // 1. In New Game Setup, ensure 1980 Era is selected (which has 727, A300, DC-10) and click Start
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.innerText.includes('COMMENCE AIRLINE OPERATION') || b.innerText.includes('START SIMULATION'));
      if (startBtn) startBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 1500));

  // 2. Open Aircraft Market to purchase a larger widebody aircraft (e.g. A300 or DC-10)
  const openedMarket = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const shopBtn = buttons.find(b => b.innerText.includes('Aircraft Market') || b.innerText.includes('ตลาดซื้อเครื่องบิน'));
      if (shopBtn) {
        shopBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Opened Aircraft Market:', openedMarket);

  await new Promise((r) => setTimeout(r, 1200));

  // 3. In Aircraft Market, select DC-10-30 (290 seats) and purchase 1 unit
  const purchasedAircraft = await win.webContents.executeJavaScript(`
    (async () => {
      // Find all aircraft cards in shop
      const cards = Array.from(document.querySelectorAll('div')).filter(d => 
        d.innerText && d.innerText.includes('DC-10-30') && d.className && d.className.includes('cursor-pointer')
      );
      
      const dc10Card = cards[0];
      if (dc10Card) {
        dc10Card.click();
        await new Promise(r => setTimeout(r, 600));

        // Click "Review & Order" button
        const reviewBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.innerText.includes('Review & Order')
        );
        if (reviewBtn) {
          reviewBtn.click();
          await new Promise(r => setTimeout(r, 600));

          // Click "Confirm & Finalize Purchase"
          const finalizeBtn = Array.from(document.querySelectorAll('button')).find(b => 
            b.innerText.includes('Confirm & Finalize Purchase')
          );
          if (finalizeBtn) {
            finalizeBtn.click();
            await new Promise(r => setTimeout(r, 600));
            return true;
          }
        }
      }
      return false;
    })();
  `);
  console.log('Purchased DC-10-30 aircraft:', purchasedAircraft);

  await new Promise((r) => setTimeout(r, 1200));

  // Close aircraft market modal
  await win.webContents.executeJavaScript(`
    (() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => {
        const svg = b.querySelector('svg.lucide-x');
        return !!svg;
      });
      if (closeBtn) closeBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 800));

  // 4. Open "My Routes"
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

  // 5. Click "Modify Route (ปรับแต่ง)" on the first route (currently Boeing 727-200 with 160 seats)
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

  await new Promise((r) => setTimeout(r, 1200));

  // 6. In the Route Modification modal, click on the DC-10-30 card (290 seats)
  const swapped = await win.webContents.executeJavaScript(`
    (async () => {
      const cards = Array.from(document.querySelectorAll('div.cursor-pointer')).filter(d => 
        d.innerText && d.innerText.includes('DC-10-30') && d.innerText.includes('290 Seats')
      );
      if (cards.length > 0) {
        const target = cards[0];
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        await new Promise(r => setTimeout(r, 1000));
        return target.innerText.slice(0, 100);
      }
      return null;
    })();
  `);
  console.log('Swapped to DC-10-30:', swapped);

  await new Promise((r) => setTimeout(r, 1200));

  // Extract analysis text from the UI
  const analysisSummary = await win.webContents.executeJavaScript(`
    (() => {
      const allDivs = Array.from(document.querySelectorAll('div'));
      const analysisCard = allDivs.find(d => d.innerText && d.innerText.includes('CAPACITY & PASSENGER UTILIZATION ANALYSIS'));
      return analysisCard ? analysisCard.innerText : 'CARD NOT FOUND';
    })();
  `);
  console.log('Analysis Summary:\n', analysisSummary);

  // Capture screenshot of the Route Modification modal showing the capacity analysis & visual bars
  const screenshot = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'route_capacity_and_load_factor_conversion.png'), screenshot.toPNG());
  console.log('Saved route_capacity_and_load_factor_conversion.png');

  app.quit();
}

run().catch((err) => {
  console.error('Error during capacity conversion verification:', err);
  app.quit();
});
