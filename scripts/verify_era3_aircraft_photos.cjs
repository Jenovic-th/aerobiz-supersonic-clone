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

console.log('=== VERIFYING ERA 3 AIRCRAFT PHOTOS ===');

const publicDir = path.join(__dirname, '..', 'public', 'aircrafts');
const targetImages = [
  { file: 'c919.jpg', model: 'COMAC C919' },
  { file: 'a321xlr.jpg', model: 'Airbus A321XLR' },
  { file: 'b777_9x.jpg', model: 'Boeing 777-9X' },
  { file: 'boom.jpg', model: 'Boom Overture' },
  { file: 'airbus_zeroe.jpg', model: 'Airbus ZEROe' },
  { file: 'tesla_aerostar.jpg', model: 'Tesla AeroStar' },
  { file: 'b797_bwb.jpg', model: 'Boeing B797 Blended Wing Body' },
  { file: 'hyper_mach4.jpg', model: 'Lockheed Hyper-Mach 4' },
  { file: 'spacex_starliner.jpg', model: 'SpaceX StarLiner' }
];

let allPassed = true;

for (const target of targetImages) {
  const fullPath = path.join(publicDir, target.file);
  const exists = fs.existsSync(fullPath);
  if (!exists) {
    console.error('FAIL: Missing photo ' + target.file + ' for ' + target.model);
    allPassed = false;
    continue;
  }
  const stat = fs.statSync(fullPath);
  const sizeKb = Math.round(stat.size / 1024);
  console.log('PASS: ' + target.file.padEnd(22) + ' (' + String(sizeKb).padStart(4) + ' KB) exists and verified for ' + target.model);
  if (stat.size > 950 * 1024) {
    console.warn('WARN: ' + target.file + ' exceeds 950KB guideline');
  }
}

if (!allPassed) {
  process.exit(1);
}

clearTimeout(_safetyWatchdog);
console.log('ALL ' + targetImages.length + ' ERA 3 KEY PHOTOS VERIFIED SUCCESSFULLY');
process.exit(0);
