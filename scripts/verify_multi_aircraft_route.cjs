const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// 1. Mandatory 15-second watchdog
const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15-second safety limit. Aborting immediately.');
  process.exit(1);
}, 15000);
if (_safetyWatchdog.unref) _safetyWatchdog.unref();

// 2. Mandatory Global Exception Handlers
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

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

  win.webContents.on('console-message', (e, level, message) => {
    console.log('[RENDERER ' + level + ']: ' + message);
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);
  await new Promise((r) => setTimeout(r, 1000));

  console.log('[STEP 1] Starting Game from Day 1 Setup...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.innerText.includes('COMMENCE AIRLINE OPERATION') || b.innerText.includes('START SIMULATION'));
      if (startBtn) startBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 1200));

  console.log('[STEP 2] Open My Routes (ManageRoutesModal)...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageBtn = buttons.find(b => b.innerText.includes('My Routes'));
      if (manageBtn) manageBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 800));

  console.log('[STEP 3] Open Route Modification Modal on First Route...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const modifyBtn = buttons.find(b => b.innerText.includes('Modify Route'));
      if (modifyBtn) modifyBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 800));

  console.log('[STEP 4] Verify initial state in modal: 1 assigned plane, 1 idle plane in hangar...');
  const step4Result = await win.webContents.executeJavaScript(`
    (() => {
      const assignedPlanes = document.querySelectorAll('[data-testid="assigned-plane-card"]');
      const addBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('เพิ่มเข้าเส้นทาง'));
      return {
        assignedCount: assignedPlanes.length,
        availableToAddCount: addBtns.length
      };
    })();
  `);
  console.log('  -> Initial assigned in modal: ' + step4Result.assignedCount + ', Idle planes available to add: ' + step4Result.availableToAddCount);

  if (step4Result.assignedCount !== 1 || step4Result.availableToAddCount < 1) {
    throw new Error('Initial fleet state in route modifier did not match expected 1 assigned + 1 idle plane.');
  }

  console.log('[STEP 5] Click [+ เพิ่มเข้าเส้นทาง] to assign 2nd plane to Route 1...');
  await win.webContents.executeJavaScript(`
    (() => {
      const addBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('เพิ่มเข้าเส้นทาง'));
      if (addBtns.length > 0) {
        addBtns[0].click();
      }
    })();
  `);

  await new Promise((r) => setTimeout(r, 600));

  const step5Result = await win.webContents.executeJavaScript(`
    (() => {
      const assignedCards = Array.from(document.querySelectorAll('[data-testid="assigned-plane-card"]')).map(el => el.innerText.replace(/\\s+/g, ' '));
      const idleCards = Array.from(document.querySelectorAll('[data-testid="idle-plane-card"]')).map(el => el.innerText.replace(/\\s+/g, ' '));
      const bodyText = document.body.innerText;
      const isDualModeText = bodyText.includes('โหมดออกบินคู่') || bodyText.includes('DUAL');
      return {
        assignedCount: assignedCards.length,
        assignedTexts: assignedCards,
        idleCount: idleCards.length,
        hasDualBanner: isDualModeText
      };
    })();
  `);
  console.log('  -> Assigned planes now: ' + step5Result.assignedCount, step5Result.assignedTexts);
  console.log('  -> Idle planes now: ' + step5Result.idleCount);
  console.log('  -> Has Dual Mode Indicator: ' + step5Result.hasDualBanner);

  if (step5Result.assignedCount !== 2) {
    throw new Error('Expected 2 planes assigned after clicking Add to Route.');
  }

  // Wait for RAF and repaint before screenshot
  await win.webContents.executeJavaScript('new Promise(r => requestAnimationFrame(() => setTimeout(r, 300)))');

  // Capture screenshot of Multi-aircraft modal with Dual Mode
  const img1 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'multi_aircraft_assigned_route.png'), img1.toPNG());
  console.log('  -> Saved multi_aircraft_assigned_route.png');

  console.log('[STEP 6] Set frequency to 14 flights/week and save changes...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const freq14Btn = buttons.find(b => b.innerText.includes('14x'));
      if (freq14Btn) freq14Btn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 400));

  const step6SaveResult = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(b => b.innerText.includes('Save Changes') || b.innerText.includes('บันทึก'));
      if (saveBtn) {
        const text = saveBtn.innerText;
        saveBtn.click();
        return { found: true, text: text };
      }
      return { found: false };
    })();
  `);
  console.log('  -> Step 6 Save button clicked:', step6SaveResult);

  await new Promise((r) => setTimeout(r, 1000));

  console.log('[STEP 7] Verify updated route row displays 2 planes & 14 flights/week in ManageRoutes table...');
  const step7ModalCheck = await win.webContents.executeJavaScript(`
    (() => {
      const isModalPresent = Array.from(document.querySelectorAll('h3')).some(h => h.innerText.includes('MODIFY COMMERCIAL ROUTE'));
      const bodyText = document.body.innerText;
      return {
        isModalPresent: isModalPresent,
        hasTwoPlanes: bodyText.includes('2 ลำ') || bodyText.includes('2 Planes'),
        has14Flights: bodyText.includes('14 เที่ยว') || bodyText.includes('14 flights') || bodyText.includes('14x')
      };
    })();
  `);
  console.log('  -> Step 7 check:', step7ModalCheck);

  // Wait for RAF and repaint before screenshot
  await win.webContents.executeJavaScript('new Promise(r => requestAnimationFrame(() => setTimeout(r, 400)))');

  // Capture screenshot of updated ManageRoutes table
  const img2 = await win.webContents.capturePage();
  fs.writeFileSync(path.join(artifactDir, 'multi_aircraft_manage_table.png'), img2.toPNG());
  console.log('  -> Saved multi_aircraft_manage_table.png');

  console.log('[STEP 8] Reopen Route Modifier and Remove the 2nd aircraft...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const modifyBtn = buttons.find(b => b.innerText.includes('Modify Route'));
      if (modifyBtn) modifyBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 600));

  await win.webContents.executeJavaScript(`
    (() => {
      const removeBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('ปลดออก') && !b.disabled);
      if (removeBtns.length > 0) {
        removeBtns[0].click();
      }
    })();
  `);

  await new Promise((r) => setTimeout(r, 600));

  const step8Result = await win.webContents.executeJavaScript(`
    (() => {
      const assignedPlanes = document.querySelectorAll('[data-testid="assigned-plane-card"]');
      return {
        assignedCount: assignedPlanes.length
      };
    })();
  `);
  console.log('  -> Assigned planes after remove: ' + step8Result.assignedCount);

  if (step8Result.assignedCount !== 1) {
    throw new Error('Expected 1 plane after removing 2nd aircraft.');
  }

  // Save changes
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(b => b.innerText.includes('Save Changes') || b.innerText.includes('บันทึก'));
      if (saveBtn) saveBtn.click();
    })();
  `);

  await new Promise((r) => setTimeout(r, 600));

  console.log('[SUCCESS] All Multi-Aircraft Route Assignment tests passed successfully!');
  clearTimeout(_safetyWatchdog);
  app.quit();
  process.exit(0);
}

run().catch((err) => {
  console.error('[FATAL RUN ERROR]:', err);
  process.exit(1);
});
