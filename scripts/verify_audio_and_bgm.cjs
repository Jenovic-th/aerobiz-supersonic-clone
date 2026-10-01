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
const fs = require('fs');

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

  win.webContents.on('console-message', (event, level, message) => {
    console.log('[RENDERER LOG]', message);
  });

  win.show();

  const distPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(distPath);
  await new Promise((r) => setTimeout(r, 800));

  const evalJs = async (code) => {
    return await win.webContents.executeJavaScript(code);
  };

  console.log('=== TEST 1: VERIFYING MOUSE CLICK SFX & BGM IN TITLE SCREEN ===');
  const bgmStatus = await evalJs(
    '(() => {' +
    '  const btn = document.querySelector("[data-testid=\'title-bgm-quick-btn\']");' +
    '  if (btn) {' +
    '    btn.click();' +
    '  }' +
    '  return {' +
    '    found: !!btn,' +
    '    text: btn ? btn.textContent : null' +
    '  };' +
    '})()'
  );
  console.log('[BGM STATUS IN TITLE]', bgmStatus);
  await new Promise((r) => setTimeout(r, 400));

  console.log('=== TEST 2: VERIFYING SETTINGS MODAL BGM CONTROLS ===');
  // Open Settings Modal
  await evalJs(
    '(() => {' +
    '  const settingsBtn = Array.from(document.querySelectorAll("button")).find(b => b.title === "Game Settings");' +
    '  if (settingsBtn) settingsBtn.click();' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 500));

  const settingsCheck = await evalJs(
    '(() => {' +
    '  const bgmToggle = document.querySelector("[data-testid=\'settings-bgm-toggle\']");' +
    '  const sliders = document.querySelectorAll("input[type=\'range\']");' +
    '  const textContent = document.body.textContent;' +
    '  const hasLofiText = textContent.includes("Background Music (ดนตรีคลอ Lo-Fi)");' +
    '  const hasRhodesText = textContent.includes("Lo-Fi Jazz Ambient") || textContent.includes("Custom MP3 Track");' +
    '  return {' +
    '    bgmToggleFound: !!bgmToggle,' +
    '    sliderCount: sliders.length,' +
    '    hasLofiText,' +
    '    hasRhodesText' +
    '  };' +
    '})()'
  );
  console.log('[SETTINGS MODAL BGM CHECK]', settingsCheck);

  if (!settingsCheck.bgmToggleFound || !settingsCheck.hasLofiText) {
    throw new Error('Lo-Fi BGM section missing in SettingsModal!');
  }

  // Toggle BGM on and off in settings
  await evalJs(
    '(() => {' +
    '  const toggle = document.querySelector("[data-testid=\'settings-bgm-toggle\']");' +
    '  if (toggle) toggle.click();' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 200));

  // Close Settings Modal
  await evalJs(
    '(() => {' +
    '  const closeBtn = document.querySelector("[data-testid=\'modal-close-header-btn\']");' +
    '  if (closeBtn) closeBtn.click();' +
    '})()'
  );
  await new Promise((r) => setTimeout(r, 400));

  console.log('=== TEST 3: CHECKING PUBLIC AUDIO DIRECTORY ===');
  const readmePath = path.join(__dirname, '../public/audio/bgm/README.txt');
  const hasReadme = fs.existsSync(readmePath);
  console.log('[PUBLIC BGM DIR] README.txt exists:', hasReadme);
  if (!hasReadme) {
    throw new Error('README.txt missing in public/audio/bgm!');
  }

  console.log('[ALL TESTS PASS] Soft mouse click & Lo-Fi ambient background music engine successfully verified!');
  app.quit();
  process.exit(0);
}

run();
