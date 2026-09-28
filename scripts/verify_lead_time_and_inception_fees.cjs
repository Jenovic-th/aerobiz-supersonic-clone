const { app, BrowserWindow } = require('electron');
const path = require('path');

// Mandatory safety watchdog: hard terminate process if it exceeds 15 seconds
const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15s limit. Terminating immediately.');
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

  console.log('Step 1: Commencing airline operation from setup screen...');
  const started = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => {
        const text = (b.textContent || '').toLowerCase();
        return text.includes('commence airline operation') || text.includes('start simulation');
      });
      if (startBtn) {
        startBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Simulation started:', started);
  await new Promise((r) => setTimeout(r, 1000));

  console.log('Step 2: Testing Aircraft Market & Factory Order Book...');
  // Open Aircraft Shop Modal
  const shopOpened = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const shopBtn = buttons.find(b => {
        const text = (b.textContent || '').toLowerCase();
        return text.includes('aircraft market') || text.includes('aircraft') || text.includes('shop');
      });
      if (shopBtn) {
        shopBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Aircraft shop opened:', shopOpened);
  if (!shopOpened) {
    throw new Error('Aircraft market button not found or could not be clicked!');
  }
  await new Promise((r) => setTimeout(r, 800));

  // Check Factory Order Book tab exists
  const tabCheck = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const pendingTab = buttons.find(b => (b.textContent || '').toLowerCase().includes('factory order book'));
      const catalogTab = buttons.find(b => (b.textContent || '').toLowerCase().includes('catalog'));
      const fleetTab = buttons.find(b => (b.textContent || '').toLowerCase().includes('fleet hangar'));
      return {
        hasPendingTab: !!pendingTab,
        hasCatalogTab: !!catalogTab,
        hasFleetTab: !!fleetTab
      };
    })();
  `);
  console.log('Aircraft shop tabs verified:', tabCheck);
  if (!tabCheck.hasPendingTab) {
    throw new Error('Factory Order Book tab not found in Aircraft Shop Modal!');
  }

  // Click on Factory Order Book tab and check empty state
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const pendingTab = buttons.find(b => (b.textContent || '').toLowerCase().includes('factory order book'));
      if (pendingTab) pendingTab.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 400));

  const emptyBookCheck = await win.webContents.executeJavaScript(`
    (() => {
      const bodyText = (document.body.textContent || '').toLowerCase();
      return bodyText.includes('no outstanding factory aircraft orders');
    })();
  `);
  console.log('Empty order book state verified:', emptyBookCheck);
  if (!emptyBookCheck) {
    throw new Error('Expected empty order book message not found!');
  }

  // Return to Catalog and place an order
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const catalogTab = buttons.find(b => (b.textContent || '').toLowerCase().includes('catalog'));
      if (catalogTab) catalogTab.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 400));

  // Click "Review & Order" button
  console.log('Step 3: Placing factory aircraft order...');
  const orderInitiated = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const orderBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('review & order'));
      if (orderBtn) {
        orderBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Order review modal initiated:', orderInitiated);
  if (!orderInitiated) {
    throw new Error('Review & Order button not found!');
  }
  await new Promise((r) => setTimeout(r, 500));

  // Verify Confirmation Modal explains Next Quarter delivery
  const confirmModalInfo = await win.webContents.executeJavaScript(`
    (() => {
      const text = (document.body.textContent || '').toLowerCase();
      const hasDeliveryNotice = text.includes('manufacturing lead time') || text.includes('scheduled handover');
      const has95PercentNotice = text.includes('95% on-time delivery rate') || text.includes('5% supply-chain');
      const buttons = Array.from(document.querySelectorAll('button'));
      const confirmBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('confirm & place factory order'));
      return {
        hasDeliveryNotice,
        has95PercentNotice,
        hasConfirmBtn: !!confirmBtn
      };
    })();
  `);
  console.log('Confirm modal lead-time verification:', confirmModalInfo);
  if (!confirmModalInfo.hasConfirmBtn) {
    throw new Error('Confirm & Place Factory Order button not found in review modal!');
  }

  // Click Confirm & Place Factory Order
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const confirmBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('confirm & place factory order'));
      if (confirmBtn) confirmBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Switch to Factory Order Book tab to confirm the order was registered
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const pendingTab = buttons.find(b => (b.textContent || '').toLowerCase().includes('factory order book'));
      if (pendingTab) pendingTab.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 400));

  const orderBookRegistered = await win.webContents.executeJavaScript(`
    (() => {
      const text = (document.body.textContent || '').toLowerCase();
      return {
        hasOrderBookHeader: text.includes('manufacturer factory order book'),
        hasInAssembly: text.includes('in assembly') || text.includes('scheduled handover'),
        hasTotalOnOrder: text.includes('total on order: 1 airframe')
      };
    })();
  `);
  console.log('Order book contains placed order:', orderBookRegistered);
  if (!orderBookRegistered.hasOrderBookHeader || !orderBookRegistered.hasTotalOnOrder) {
    throw new Error('Pending order not found in Order Book after purchase!');
  }

  // Close aircraft shop
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const closeBtn = buttons.find(b => {
        const text = (b.textContent || '').toLowerCase();
        return text.includes('close showroom') || text.includes('esc');
      });
      if (closeBtn) closeBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 500));

  // Step 4: Advance quarter and verify delivery in Quarter Report
  console.log('Step 4: Advancing to next quarter to verify factory delivery / postponement in Quarter Report...');
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const endBtn = buttons.find(b => {
        const text = (b.textContent || '').toLowerCase();
        return text.includes('end quarter') || text.includes('advance quarter');
      });
      if (endBtn) endBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 1200));

  const quarterReportCheck = await win.webContents.executeJavaScript(`
    (() => {
      const text = (document.body.textContent || '').toLowerCase();
      const hasOverviewDeliveryBanner = text.includes('factory order handover') || text.includes('delivery report');

      // Click to switch to NEWS / Bulletin tab to inspect detailed factory delivery cards
      const buttons = Array.from(document.querySelectorAll('button'));
      const newsTab = buttons.find(b => {
        const t = (b.textContent || '').toLowerCase();
        return t.includes('bulletin') || t.includes('news') || t.includes('intelligence');
      });
      if (newsTab) newsTab.click();

      const updatedText = (document.body.textContent || '').toLowerCase();
      const hasDeliveriesSection = updatedText.includes('commercial aircraft factory deliveries') || updatedText.includes('factory deliveries') || hasOverviewDeliveryBanner;
      const hasDeliveredOrDelayed = updatedText.includes('delivered') || updatedText.includes('factory delay') || updatedText.includes('handover complete') || updatedText.includes('delay notice');

      return {
        hasOverviewDeliveryBanner,
        hasDeliveriesSection,
        hasDeliveredOrDelayed
      };
    })();
  `);
  console.log('Quarter report delivery verification:', quarterReportCheck);
  if (!quarterReportCheck.hasDeliveriesSection) {
    throw new Error('Factory Deliveries section missing in Quarter Report modal!');
  }

  console.log('Step 5: Testing Route Inception Fee UI in Route Modal...');
  // Dismiss quarter report modal
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const dismissBtn = buttons.find(b => {
        const text = (b.textContent || '').toLowerCase();
        return text.includes('proceed to') || text.includes('dismiss') || text.includes('close');
      });
      if (dismissBtn) dismissBtn.click();
    })();
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Open Route Modal
  const routeOpened = await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const routeBtn = buttons.find(b => (b.textContent || '').toLowerCase().includes('open route'));
      if (routeBtn) {
        routeBtn.click();
        return true;
      }
      return false;
    })();
  `);
  console.log('Route modal opened:', routeOpened);
  await new Promise((r) => setTimeout(r, 600));

  // Check inception fee badge in route modal
  const routeModalFeeCheck = await win.webContents.executeJavaScript(`
    (() => {
      const text = (document.body.textContent || '').toLowerCase();
      return {
        hasStationFeeBadge: text.includes('station setup') || text.includes('inception fee') || text.includes('licensing'),
        hasLaunchRouteBtn: Array.from(document.querySelectorAll('button')).some(b => (b.textContent || '').toLowerCase().includes('launch route'))
      };
    })();
  `);
  console.log('Route modal inception fee check:', routeModalFeeCheck);
  if (!routeModalFeeCheck.hasStationFeeBadge) {
    throw new Error('Station inception fee badge missing in RouteModal!');
  }

  console.log('All verification checks PASSED successfully!');
  clearTimeout(_safetyWatchdog);
  app.quit();
  process.exit(0);
}

run().catch((err) => {
  console.error('[FATAL ERROR IN RUN]:', err);
  process.exit(1);
});
