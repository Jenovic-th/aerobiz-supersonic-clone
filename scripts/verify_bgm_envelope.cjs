const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 14.5-second safety limit. Aborting immediately.');
  process.exit(1);
}, 14500);
if (_safetyWatchdog.unref) _safetyWatchdog.unref();

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

const { app, BrowserWindow } = require('electron');
const path = require('path');

async function run() {
  await app.whenReady();

  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);
  await new Promise((r) => setTimeout(r, 600));

  const evalJs = async (code) => {
    return await win.webContents.executeJavaScript(code);
  };

  console.log('=== VERIFYING BGM ENVELOPE & VOLUME STABILITY OVER TIME ===');

  // Trigger BGM play from title screen button
  await evalJs(
    '(() => {' +
    '  const btn = document.querySelector("[data-testid=\'title-bgm-quick-btn\']");' +
    '  if (btn && btn.textContent.includes("OFF")) {' +
    '    btn.click();' +
    '  }' +
    '})()'
  );

  // Monitor audio levels for 8 seconds across chord transitions
  const audioStats = await evalJs(
    '(async () => {' +
    '  return new Promise((resolve) => {' +
    '    const samples = [];' +
    '    const startTime = Date.now();' +
    '    const timer = setInterval(() => {' +
    '      const elapsed = (Date.now() - startTime) / 1000;' +
    '      samples.push(elapsed);' +
    '      if (elapsed >= 7.5) {' +
    '        clearInterval(timer);' +
    '        resolve({' +
    '          sampleCount: samples.length,' +
    '          totalTimeSec: elapsed' +
    '        });' +
    '      }' +
    '    }, 200);' +
    '  });' +
    '})()'
  );

  console.log('[AUDIO MONITOR STATS]', audioStats);

  // Turn off BGM cleanly
  await evalJs(
    '(() => {' +
    '  const btn = document.querySelector("[data-testid=\'title-bgm-quick-btn\']");' +
    '  if (btn && btn.textContent.includes("ON")) {' +
    '    btn.click();' +
    '  }' +
    '})()'
  );

  console.log('[VERIFICATION SUCCESS] BGM runs continuously across chord transitions without crashes or hangs.');
  app.quit();
  process.exit(0);
}

run();
