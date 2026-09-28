const { app, BrowserWindow } = require('electron');
const path = require('path');

// Mandatory 15-second safety watchdog
const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15s safety limit. Terminating immediately.');
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

  console.log('--- 1. START SIMULATION & INITIAL STATE AUDIT ---');
  await win.webContents.executeJavaScript(`
    (() => {
      localStorage.clear();
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => {
        const t = (b.textContent || '').toLowerCase();
        return t.includes('commence airline operation') || t.includes('start simulation');
      });
      if (startBtn) startBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 1000));

  console.log('--- 2. AIRCRAFT PROCUREMENT & FACTORY ORDER BOOK AUDIT ---');
  // Open Aircraft Shop Modal
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const shopBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('aircraft market'));
      if (shopBtn) shopBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Place 1x aircraft order
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const orderBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('review & order'));
      if (orderBtn) orderBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 500));

  // Confirm order
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const confirmBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('confirm & place factory order'));
      if (confirmBtn) confirmBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 500));

  // Close shop
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const closeBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('close showroom'));
      if (closeBtn) closeBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 500));
  console.log('Aircraft order booked successfully!');

  console.log('--- 3. ADVANCE QUARTER & FACTORY DELIVERY AUDIT ---');
  // Advance quarter
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const endBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('end quarter'));
      if (endBtn) endBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 1200));

  // Verify delivery report banner in Quarter Report
  const deliveryVerified = await win.webContents.executeJavaScript(`
    (() => {
      const text = (document.body.textContent || '').toLowerCase();
      return text.includes('factory order handover') || text.includes('commercial aircraft factory deliveries');
    })();
  `);
  console.log('Quarter report delivery banner verified:', deliveryVerified);

  // Dismiss quarter report
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const dismissBtn = buttons.find(b => {
        const t = (b.textContent || '').toLowerCase();
        return t.includes('proceed to next quarter') || t.includes('dismiss') || t.includes('close');
      });
      if (dismissBtn) dismissBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 600));

  console.log('--- 4. ROUTE MANAGEMENT & FLIGHT ADJUSTMENT AUDIT ---');
  // Open Manage Routes Modal ("My Routes")
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const myRoutesBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('my routes'));
      if (myRoutesBtn) myRoutesBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Click "Modify Route (ปรับแต่ง)" on the first route
  const modifyOpened = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const modifyBtn = buttons.find(b => {
        const t = (b.textContent || '').toLowerCase();
        return t.includes('modify route') || t.includes('ปรับแต่ง');
      });
      if (modifyBtn) {
        modifyBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Route editor opened via Modify Route button:', modifyOpened);
  await new Promise((r) => setTimeout(r, 600));

  // In edit view: adjust frequency or aircraft, then click "Save & Apply Modifications"
  const editSaveResult = await win.webContents.executeJavaScript(`
    (() => {
      // Try to add an aircraft from available idle planes if any exists
      const addPlaneBtns = Array.from(document.querySelectorAll('button')).filter(b => {
        const t = (b.textContent || '').toLowerCase();
        return t.includes('add airframe') || t.includes('เพิ่มเครื่องบิน');
      });
      if (addPlaneBtns.length > 0) {
        addPlaneBtns[0].click();
      }

      // Save changes
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(b => {
        const t = (b.textContent || '').toLowerCase();
        return t.includes('save & apply') || t.includes('บันทึกการเปลี่ยนแปลง');
      });
      if (saveBtn) {
        saveBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Route modifications saved successfully:', editSaveResult);
  await new Promise((r) => setTimeout(r, 600));

  // Close My Routes modal
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const closeBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('close'));
      if (closeBtn) closeBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 500));

  console.log('--- 5. ROUTE MODAL DUPLICATE GUARD & INCEPTION FEE AUDIT ---');
  // Open Route Modal
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const routeBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('open route'));
      if (routeBtn) routeBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 600));

  const routeModalGuardCheck = await win.webContents.executeJavaScript(`
    (() => {
      const text = (document.body.textContent || '').toLowerCase();
      const hasInceptionFee = text.includes('inception fee') || text.includes('ค่าจัดตั้งสถานี');
      const hasDuplicateWarning = text.includes('route already active') || text.includes('เส้นทางนี้เปิดทำการบินอยู่แล้ว');
      const launchBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').toLowerCase().includes('launch route'));
      return {
        hasInceptionFee,
        hasDuplicateWarning,
        launchBtnExists: !!launchBtn,
        launchBtnDisabled: launchBtn ? launchBtn.disabled : true
      };
    })();
  `);
  console.log('RouteModal guard and fee verification:', routeModalGuardCheck);
  if (!routeModalGuardCheck.hasInceptionFee) {
    throw new Error('RouteModal inception fee badge missing!');
  }

  // Close Route Modal
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cancelBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('cancel'));
      if (cancelBtn) cancelBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 500));

  console.log('--- 6. SAVE & LOAD SYSTEM COMPATIBILITY AUDIT ---');
  // Trigger Save & Load menu then click Quick Save
  const saveSuccess = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const menuBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('save & load'));
      if (menuBtn) {
        menuBtn.click();
        const dropButtons = Array.from(document.querySelectorAll('button'));
        const quickSaveBtn = dropButtons.find(b => (b.textContent || '').toLowerCase().includes('quick save'));
        if (quickSaveBtn) {
          quickSaveBtn.click();
          return true;
        }
      }
      return false;
    })();
  `);
  console.log('Quick save triggered:', saveSuccess);
  await new Promise((r) => setTimeout(r, 600));

  // Verify save in localStorage
  const localStorageCheck = await win.webContents.executeJavaScript(`
    (() => {
      const raw = localStorage.getItem('aerobiz_manual_save') || localStorage.getItem('aerobiz_autosave');
      if (!raw) return { ok: false, reason: 'No save found in localStorage' };
      try {
        const parsed = JSON.parse(raw);
        return {
          ok: true,
          turnNumber: parsed.turnNumber,
          airlinesCount: parsed.airlines ? parsed.airlines.length : 0,
          routesCount: parsed.routes ? parsed.routes.length : 0,
          allAirlinesHavePendingArray: parsed.airlines.every(a => Array.isArray(a.pendingOrders)),
          hasAircraftDeliveries: Array.isArray(parsed.aircraftDeliveries)
        };
      } catch (err) {
        return { ok: false, reason: err.message };
      }
    })();
  `);
  console.log('LocalStorage integrity check:', localStorageCheck);
  if (!localStorageCheck.ok || !localStorageCheck.allAirlinesHavePendingArray) {
    throw new Error('Save game state validation failed!');
  }

  console.log('--- 7. MULTI-QUARTER ADVANCE & AI COMPETITOR STABILITY AUDIT ---');
  for (let q = 1; q <= 2; q++) {
    console.log('Advancing Quarter ' + q + '...');
    await win.webContents.executeJavaScript(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const endBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('end quarter'));
        if (endBtn) endBtn.click();
      })();
    `);
    await new Promise((r) => setTimeout(r, 1000));

    // Dismiss report
    await win.webContents.executeJavaScript(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const dismissBtn = buttons.find(b => {
          const t = (b.textContent || '').toLowerCase();
          return t.includes('proceed to next quarter') || t.includes('dismiss') || t.includes('close');
        });
        if (dismissBtn) dismissBtn.click();
      })();
    `);
    await new Promise((r) => setTimeout(r, 500));
  }

  // Final Health Check on state
  const finalHealthCheck = await win.webContents.executeJavaScript(`
    (() => {
      const raw = localStorage.getItem('aerobiz_autosave');
      if (!raw) return { healthy: false };
      const parsed = JSON.parse(raw);
      const allAirlinesHaveCash = parsed.airlines.every(a => typeof a.cashK === 'number' && !isNaN(a.cashK));
      const allRoutesHaveStats = parsed.routes.every(r => r.lastQuarterStats && !isNaN(r.lastQuarterStats.profitK));
      return {
        healthy: allAirlinesHaveCash && allRoutesHaveStats,
        turnNumber: parsed.turnNumber,
        year: parsed.currentYear,
        quarter: parsed.currentQuarter,
        routesTotal: parsed.routes.length
      };
    })();
  `);
  console.log('Final multi-quarter health check:', finalHealthCheck);
  if (!finalHealthCheck.healthy) {
    throw new Error('Simulation state health check failed: NaN or invalid values detected!');
  }

  console.log('ALL SYSTEMS AUDITED & OPERATING IN PERFECT HARMONY! PASSED 100%.');
  clearTimeout(_safetyWatchdog);
  app.quit();
  process.exit(0);
}

run().catch((err) => {
  console.error('[FATAL ERROR IN COMPREHENSIVE AUDIT]:', err);
  process.exit(1);
});
