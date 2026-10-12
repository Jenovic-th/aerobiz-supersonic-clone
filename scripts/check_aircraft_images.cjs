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
  if (id.includes('STARLINER') || id.includes('STARSHIP')) return 'spacex_starliner.jpg';
  if (id.includes('AEROSTAR') || id.includes('HYPERION')) return 'tesla_aerostar.jpg';
  if (id.includes('MACH4') || id.includes('SOLARIS') || id.includes('MACH6')) return 'hyper_mach4.jpg';
  if (id.includes('B797') || id.includes('TU404') || id.includes('404') || id.includes('808') || id.includes('QUANTUM')) return 'b797_bwb.jpg';
  if (id.includes('ZEROE') || id.includes('CRYOFLEX')) return 'airbus_zeroe.jpg';
  if (
    id.includes('ORBITAL') ||
    id.includes('GEN')
  ) {
    return 'future.jpg';
  }
  if (id.includes('747-400') || id.includes('B747-400')) return 'b747_400.jpg';
  if (id.includes('747-300') || id.includes('B747-300')) return 'b747_300.jpg';
  if (id.includes('747-8') || id.includes('B747-8')) return 'b747_8i.jpg';
  if (id.includes('747')) return 'b747.jpg';
  if (id.includes('380')) return 'a380.jpg';
  if (id.includes('707')) return 'b707.jpg';
  if (id.includes('DC-8')) return 'dc8.jpg';
  if (id.includes('727')) return 'b727.jpg';
  if (id.includes('L-1011')) return 'l1011.jpg';
  if (id.includes('MD-82') || id.includes('MD82')) return 'md82.jpg';
  if (id.includes('MD-11') || id.includes('MD11')) return 'md11.jpg';
  if (
    id.includes('DC-10') ||
    id.includes('MD-80') ||
    id.includes('MD2000')
  ) {
    return 'dc10.jpg';
  }
  if (id.includes('154') || id.includes('TU-154')) return 'tu154.jpg';
  if (id.includes('IL-86') || id.includes('IL86')) return 'il86.jpg';
  if (id.includes('IL-96') || id.includes('IL96')) return 'il96_300.jpg';
  if (id.includes('204') || id.includes('TU-204')) return 'tu204.jpg';
  if (id === 'B777-200' || (id.includes('777-200') && !id.includes('ER'))) return 'b777_200.jpg';
  if (id.includes('777-200ER') || id.includes('B777-200ER')) return 'b777_200er.jpg';
  if (id.includes('777-300ER') || id.includes('B777-300ER')) return 'b777_300er.jpg';
  if (id.includes('777-9') || id.includes('B777-9')) return 'b777_9x.jpg';
  if (id.includes('787') || id.includes('B787')) return 'b787_9.jpg';
  if (id.includes('A350-1000') || id.includes('350-1000')) return 'a350_1000.jpg';
  if (id.includes('A350') || id.includes('350')) return 'a350_900.jpg';
  if (id.includes('777') || id.includes('B777')) return 'b777.jpg';
  if (id.includes('767-300') || id.includes('B767-300')) return 'b767_300er.jpg';
  if (id.includes('767') || id.includes('B767')) return 'b767_200.jpg';
  if (id.includes('A340') || id.includes('340')) return 'a340_300.jpg';
  if (id.includes('A330') || id.includes('330')) return 'a330_300.jpg';
  if (id.includes('A300-600') || id.includes('A300_600')) return 'a300_600.jpg';
  if (id.includes('310') || id.includes('A310')) return 'a310_300.jpg';
  if (id.includes('A300')) return 'a300.jpg';
  if (id.includes('757') || id.includes('B757')) return 'b757_200.jpg';
  if (id.includes('737-800') || id.includes('B737-800')) return 'b737_800.jpg';
  if (id.includes('737-300') || id.includes('B737-300')) return 'b737_300.jpg';
  if (id.includes('A320-200') || (id.includes('A320') && !id.includes('NEO'))) return 'a320_200.jpg';
  if (id.includes('320NEO') || id.includes('A320NEO')) return 'a320neo.jpg';
  if (id.includes('A321XLR') || id.includes('321XLR') || id.includes('A321')) return 'a321xlr.jpg';
  if (id.includes('MAX') || id.includes('MAX8') || id.includes('B737-MAX8')) return 'b737_max8.jpg';
  if (id.includes('A220') || id.includes('220')) return 'a220_300.jpg';
  if (id.includes('C919') || id.includes('COMAC')) return 'c919.jpg';
  if (id.includes('E190') || id.includes('EMBRAER')) return 'e190.jpg';
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
