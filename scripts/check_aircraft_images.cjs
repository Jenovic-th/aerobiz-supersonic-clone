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

// Read public/aircrafts directory
const publicAircraftDir = path.join(__dirname, '..', 'public', 'aircrafts');
const imageFiles = fs.readdirSync(publicAircraftDir);
console.log('Available Image Files in public/aircrafts (' + imageFiles.length + ' files):');
console.log(imageFiles.join(', '));
console.log('---');

// Parse src/data/aircrafts.ts
const aircraftsTs = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'aircrafts.ts'), 'utf8');

// Simple regex parser for models
const modelBlocks = aircraftsTs.split(/\{\s*id:\s*'/).slice(1);
const models = [];

for (const block of modelBlocks) {
  const idMatch = block.match(/^([^']+)'/);
  const modelMatch = block.match(/model:\s*'([^']+)'/);
  const mfgMatch = block.match(/manufacturer:\s*'([^']+)'/);
  const introMatch = block.match(/introYear:\s*(\d+)/);
  const retireMatch = block.match(/retireYear:\s*(\d+)/);
  const eraMatch = block.match(/era:\s*(\d+)/);
  const isSSTMatch = block.match(/isSupersonic:\s*(true|false)/);

  if (idMatch) {
    models.push({
      id: idMatch[1],
      model: modelMatch ? modelMatch[1] : idMatch[1],
      manufacturer: mfgMatch ? mfgMatch[1] : '',
      introYear: introMatch ? parseInt(introMatch[1], 10) : 0,
      retireYear: retireMatch ? parseInt(retireMatch[1], 10) : null,
      era: eraMatch ? parseInt(eraMatch[1], 10) : 1,
      isSupersonic: isSSTMatch ? isSSTMatch[1] === 'true' : false
    });
  }
}

console.log('Total Aircraft Models Found in HISTORICAL_AIRCRAFTS: ' + models.length);

// Replicate getAircraftPhotoInfo logic
function getAircraftPhotoUrl(model) {
  const id = model.id.toUpperCase();
  if (id.includes('CONCORDE')) return 'concorde.jpg';
  if (id.includes('BOOM') || id.includes('OVERTURE') || id.includes('QSST')) return 'boom.jpg';
  if (
    id.includes('STARLINER') ||
    id.includes('STARSHIP') ||
    id.includes('AEROSTAR') ||
    id.includes('MACH4') ||
    id.includes('MACH6') ||
    id.includes('B797') ||
    id.includes('808') ||
    id.includes('ZEROE') ||
    id.includes('CRYOFLEX') ||
    id.includes('HYPERION') ||
    id.includes('ORBITAL') ||
    id.includes('SOLARIS') ||
    id.includes('404') ||
    id.includes('QUANTUM') ||
    id.includes('GEN')
  ) {
    return 'future.jpg';
  }
  if (id.includes('747')) return 'b747.jpg';
  if (id.includes('380')) return 'a380.jpg';
  if (id.includes('707')) return 'b707.jpg';
  if (id.includes('DC-8')) return 'dc8.jpg';
  if (id.includes('727')) return 'b727.jpg';
  if (id.includes('L-1011')) return 'dc10.jpg';
  if (
    id.includes('DC-10') ||
    id.includes('MD-11') ||
    id.includes('MD-80') ||
    id.includes('MD-82') ||
    id.includes('MD2000')
  ) {
    return 'dc10.jpg';
  }
  if (
    id.includes('IL-') ||
    id.includes('154') ||
    id.includes('204') ||
    id.includes('404') ||
    model.manufacturer.toLowerCase().includes('ilyushin') ||
    model.manufacturer.toLowerCase().includes('tupolev')
  ) {
    return 'soviet.jpg';
  }
  if (
    id.includes('777') ||
    id.includes('787') ||
    id.includes('350') ||
    id.includes('B777') ||
    id.includes('A350')
  ) {
    return 'b777.jpg';
  }
  if (
    id.includes('A300') ||
    id.includes('310') ||
    id.includes('330') ||
    id.includes('340') ||
    id.includes('767')
  ) {
    return 'a300.jpg';
  }
  return 'b737.jpg';
}

const photoUsage = {};
for (const file of imageFiles) {
  photoUsage[file] = [];
}

const unmapped = [];
const startYear = 1980; // Default Era 1 start year

const activeIn1980 = [];
const upcomingAfter1980 = [];
const retiredBefore1980 = [];

for (const m of models) {
  const photo = getAircraftPhotoUrl(m);
  if (!imageFiles.includes(photo)) {
    unmapped.push({ model: m, photo: photo });
  } else {
    photoUsage[photo].push(m);
  }

  if (m.retireYear && m.retireYear < startYear) {
    retiredBefore1980.push(m);
  } else if (m.introYear <= startYear) {
    activeIn1980.push(m);
  } else {
    upcomingAfter1980.push(m);
  }
}

console.log('Unmapped or Missing Photos: ' + unmapped.length);
if (unmapped.length > 0) {
  console.log(JSON.stringify(unmapped, null, 2));
}

console.log('--- Breakdown by Availability in 1980 ---');
console.log('Active in 1980 (Currently on sale at start): ' + activeIn1980.length);
console.log('Upcoming after 1980 (Future/Not yet sold): ' + upcomingAfter1980.length);
console.log('Retired before 1980: ' + retiredBefore1980.length);

console.log('--- Image File Distribution ---');
for (const [file, list] of Object.entries(photoUsage)) {
  console.log(file + ' (' + list.length + ' models): ' + list.map(m => m.id).join(', '));
}

clearTimeout(_safetyWatchdog);
process.exit(0);
