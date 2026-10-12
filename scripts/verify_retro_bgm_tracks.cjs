const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15-second safety limit. Aborting immediately.');
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

const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING RETRO BGM JUKEBOX TRACKS ===');

const tracksFile = path.join(__dirname, '..', 'src', 'utils', 'retroMusicTracks.ts');
if (!fs.existsSync(tracksFile)) {
  console.error('FAIL: retroMusicTracks.ts does not exist');
  process.exit(1);
}

const content = fs.readFileSync(tracksFile, 'utf8');

// Check that all 6 track IDs are defined
const expectedTracks = [
  'executive_lounge',
  'pacific_horizon',
  'rio_samba',
  'tokyo_funk',
  'supersonic_march',
  'neon_expressway'
];

for (const id of expectedTracks) {
  if (!content.includes("id: '" + id + "'")) {
    console.error('FAIL: Missing track ID definition: ' + id);
    process.exit(1);
  }
  console.log('PASS: Track ' + id.padEnd(20) + ' is defined in catalog');
}

// Check that dist bundle built cleanly with these tracks
const distJsDir = path.join(__dirname, '..', 'dist', 'assets');
const distFiles = fs.readdirSync(distJsDir);
const mainBundle = distFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));
if (!mainBundle) {
  console.error('FAIL: No main js bundle found in dist');
  process.exit(1);
}

const bundleContent = fs.readFileSync(path.join(distJsDir, mainBundle), 'utf8');
for (const id of expectedTracks) {
  if (!bundleContent.includes(id)) {
    console.error('FAIL: Track ' + id + ' not found compiled into dist bundle');
    process.exit(1);
  }
}
console.log('PASS: All 6 tracks compiled and bundled into production dist output');

clearTimeout(_safetyWatchdog);
console.log('ALL 6 RETRO BGM TRACKS VERIFIED SUCCESSFULLY');
process.exit(0);
