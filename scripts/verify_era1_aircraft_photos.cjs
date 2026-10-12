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
  // 11 Starter Models in 1980
  { file: 'b707.jpg', model: 'Boeing 707-320B' },
  { file: 'dc8.jpg', model: 'McDonnell Douglas DC-8-62' },
  { file: 'b747.jpg', model: 'Boeing 747-200B' },
  { file: 'b727.jpg', model: 'Boeing 727-200' },
  { file: 'dc10.jpg', model: 'McDonnell Douglas DC-10-30' },
  { file: 'l1011.jpg', model: 'Lockheed L-1011 TriStar' },
  { file: 'a300.jpg', model: 'Airbus A300B4' },
  { file: 'concorde.jpg', model: 'Aérospatiale/BAC Concorde' },
  { file: 'tu154.jpg', model: 'Tupolev Tu-154B' },
  { file: 'il86.jpg', model: 'Ilyushin Il-86' },
  { file: 'md82.jpg', model: 'McDonnell Douglas MD-82' },

  // 16 Upcoming Era 1 Models
  { file: 'b767_200.jpg', model: 'Boeing 767-200' },
  { file: 'b757_200.jpg', model: 'Boeing 757-200' },
  { file: 'b747_300.jpg', model: 'Boeing 747-300 SUD' },
  { file: 'b737_300.jpg', model: 'Boeing 737-300 Classic' },
  { file: 'a300_600.jpg', model: 'Airbus A300-600' },
  { file: 'a310_300.jpg', model: 'Airbus A310-300' },
  { file: 'a320_200.jpg', model: 'Airbus A320-200' },
  { file: 'b767_300er.jpg', model: 'Boeing 767-300ER' },
  { file: 'il96_300.jpg', model: 'Ilyushin Il-96-300' },
  { file: 'b747_400.jpg', model: 'Boeing 747-400' },
  { file: 'md11.jpg', model: 'McDonnell Douglas MD-11' },
  { file: 'a340_300.jpg', model: 'Airbus A340-300' },
  { file: 'a330_300.jpg', model: 'Airbus A330-300' },
  { file: 'b777_200.jpg', model: 'Boeing 777-200' },
  { file: 'tu204.jpg', model: 'Tupolev Tu-204' },
  { file: 'b737_800.jpg', model: 'Boeing 737-800' }
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
  console.log('PASS: ' + target.file.padEnd(16) + ' (' + String(sizeKb).padStart(4) + ' KB) exists and verified for ' + target.model);
  if (stat.size > 900 * 1024) {
    console.warn('WARN: ' + target.file + ' exceeds 900KB guideline');
  }
}

if (!allPassed) {
  process.exit(1);
}

clearTimeout(_safetyWatchdog);
console.log('ALL ' + targetImages.length + ' / 27 ERA 1 AIRCRAFT PHOTOS VERIFIED SUCCESSFULLY (100% COVERAGE)');
process.exit(0);
