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

console.log('=== VERIFYING ERA 1 1-TO-1 DEDICATED AIRCRAFT PHOTOS ===');

const publicDir = path.join(__dirname, '..', 'public', 'aircrafts');
const targetImages = [
  { file: 'l1011.jpg', model: 'Lockheed L-1011 TriStar' },
  { file: 'tu154.jpg', model: 'Tupolev Tu-154B' },
  { file: 'il86.jpg', model: 'Ilyushin Il-86' },
  { file: 'md82.jpg', model: 'McDonnell Douglas MD-82' },
  { file: 'b767_200.jpg', model: 'Boeing 767-200' },
  { file: 'b757_200.jpg', model: 'Boeing 757-200' },
  { file: 'b737_300.jpg', model: 'Boeing 737-300' },
  { file: 'a320_200.jpg', model: 'Airbus A320-200' },
  { file: 'b747_400.jpg', model: 'Boeing 747-400' }
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
  console.log('PASS: ' + target.file + ' (' + sizeKb + ' KB) exists and ready for ' + target.model);
  if (stat.size > 900 * 1024) {
    console.warn('WARN: ' + target.file + ' exceeds 900KB guideline');
  }
}

if (!allPassed) {
  process.exit(1);
}

console.log('ALL ' + targetImages.length + ' TARGET AIRCRAFT PHOTOS VERIFIED SUCCESSFULLY (100%)');
process.exit(0);
