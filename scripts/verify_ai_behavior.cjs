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

  // 1. Click "COMMENCE AIRLINE OPERATION"
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.innerText.includes('COMMENCE AIRLINE OPERATION') || b.innerText.includes('START SIMULATION'));
      if (startBtn) startBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 1500));

  // 2. Advance 2 quarters to let AI airlines analyze their routes, financials, and optimize
  for (let q = 1; q <= 2; q++) {
    console.log('Advancing quarter', q, '...');
    await win.webContents.executeJavaScript(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const endQBtn = buttons.find(b => 
          b.innerText.includes('End Quarter') || 
          b.innerText.includes('Next Quarter') || 
          b.innerText.includes('Confirm & Enter Next Quarter')
        );
        if (endQBtn) endQBtn.click();
      })();
    `);
    await new Promise((r) => setTimeout(r, 2000));
  }

  // 3. Switch to "Airlines & Continents (เจาะลึกรายทวีป)" tab
  const switchedTab = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tabBtn = buttons.find(b => b.innerText.includes('Airlines & Continents') || b.innerText.includes('เจาะลึกรายทวีป'));
      if (tabBtn) {
        tabBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Switched to Inspector Tab:', switchedTab);

  await new Promise((r) => setTimeout(r, 1000));

  // 4. Find all rival airline buttons and click on the first AI competitor
  const rivalInfo = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      // Find buttons in the airline switcher row (they have round colored badges)
      const airlineButtons = buttons.filter(b => {
        const hasColorSpan = !!b.querySelector('span.rounded-full');
        return hasColorSpan && !b.innerText.includes('YOU');
      });

      if (airlineButtons.length > 0) {
        airlineButtons[0].click();
        return {
          clickedName: airlineButtons[0].innerText,
          totalRivals: airlineButtons.length
        };
      }
      return null;
    })();
  `);
  console.log('Rival selected:', rivalInfo);

  await new Promise((r) => setTimeout(r, 1000));

  // Scroll down the modal content to show the Strategic Operations & Decisions section
  await win.webContents.executeJavaScript(`
    (() => {
      const scrollable = document.querySelector('.overflow-y-auto');
      if (scrollable) {
        scrollable.scrollTop = scrollable.scrollHeight;
      }
    })();
  `);

  await new Promise((r) => setTimeout(r, 800));

  // Extract all AI decision log entries across all AI rivals
  const allRivalLogs = await win.webContents.executeJavaScript(`
    (async () => {
      const results = {};
      const buttons = Array.from(document.querySelectorAll('button'));
      const airlineButtons = buttons.filter(b => {
        const hasColorSpan = !!b.querySelector('span.rounded-full');
        return hasColorSpan && !b.innerText.includes('YOU');
      });

      for (const btn of airlineButtons) {
        btn.click();
        await new Promise(r => setTimeout(r, 400));
        const listItems = Array.from(document.querySelectorAll('ul li')).map(li => li.innerText.trim());
        results[btn.innerText] = listItems;
      }

      // Select Imperial Dynastic Air specifically for detailed maintenance & pricing screenshot
      const imperialBtn = airlineButtons.find(b => b.innerText.includes('Imperial'));
      if (imperialBtn) {
        imperialBtn.click();
        await new Promise(r => setTimeout(r, 600));
        const scrollable = document.querySelector('.overflow-y-auto');
        if (scrollable) {
          scrollable.scrollTop = 99999;
        }
      }

      return results;
    })();
  `);

  console.log('ALL AI RIVAL STRATEGIC OPERATIONS:');
  console.log(JSON.stringify(allRivalLogs, null, 2));

  await new Promise((r) => setTimeout(r, 800));

  // Capture screenshot of AI decisions log
  const screenshot = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'ai_competitor_maintenance_and_yield.png'), screenshot.toPNG());
  console.log('Saved ai_competitor_maintenance_and_yield.png');

  app.quit();
}

run().catch((err) => {
  console.error('Error during AI verification:', err);
  app.quit();
});
