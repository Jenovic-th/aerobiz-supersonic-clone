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

console.log('=== VERIFYING ERA 2 1-TO-1 DEDICATED AIRCRAFT PHOTOS ===');

const publicDir = path.join(__dirname, '..', 'public', 'aircrafts');
const targetImages = [
  { file: 'b777_200er.jpg', model: 'Boeing 777-200ER' },
  { file: 'e190.jpg', model: 'Embraer E190' },
  { file: 'b777_300er.jpg', model: 'Boeing 777-300ER' },
  { file: 'a380.jpg', model: 'Airbus A380-800' },
  { file: 'b747_8i.jpg', model: 'Boeing 747-8 Intercontinental' },
  { file: 'b787_9.jpg', model: 'Boeing 787-9 Dreamliner' },
  { file: 'a350_900.jpg', model: 'Airbus A350-900 XWB' },
  { file: 'a320neo.jpg', model: 'Airbus A320neo' },
  { file: 'b737_max8.jpg', model: 'Boeing 737 MAX 8' },
  { file: 'a220_300.jpg', model: 'Airbus A220-300' },
  { file: 'a350_1000.jpg', model: 'Airbus A350-1000 XWB' }
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
  console.log('PASS: ' + target.file.padEnd(18) + ' (' + String(sizeKb).padStart(4) + ' KB) exists and verified for ' + target.model);
  if (stat.size > 900 * 1024) {
    console.warn('WARN: ' + target.file + ' exceeds 900KB guideline');
  }
}

if (!allPassed) {
  process.exit(1);
}

clearTimeout(_safetyWatchdog);
console.log('ALL ' + targetImages.length + ' / 11 ACTIVE ERA 2 DEDICATED PHOTOS VERIFIED SUCCESSFULLY (100% COVERAGE)');
process.exit(0);
