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

const aircraftsTs = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'aircrafts.ts'), 'utf8');

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
  const capMatch = block.match(/capacity:\s*(\d+)/);
  const rangeMatch = block.match(/rangeKm:\s*(\d+)/);

  if (idMatch) {
    models.push({
      id: idMatch[1],
      model: modelMatch ? modelMatch[1] : idMatch[1],
      manufacturer: mfgMatch ? mfgMatch[1] : '',
      introYear: introMatch ? parseInt(introMatch[1], 10) : 0,
      retireYear: retireMatch ? parseInt(retireMatch[1], 10) : null,
      era: eraMatch ? parseInt(eraMatch[1], 10) : 1,
      isSupersonic: isSSTMatch ? isSSTMatch[1] === 'true' : false,
      capacity: capMatch ? parseInt(capMatch[1], 10) : 0,
      rangeKm: rangeMatch ? parseInt(rangeMatch[1], 10) : 0
    });
  }
}

// Function matching src/data/aircraftVisuals.ts
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
    id.includes('300') ||
    id.includes('310') ||
    id.includes('330') ||
    id.includes('340') ||
    id.includes('767')
  ) {
    return 'a300.jpg';
  }
  return 'b737.jpg';
}

console.log('=== COMPLETE AIRCRAFT ROSTER & IMAGE MAPPING ===');
console.log('Total models:', models.length);

const groupedByEra = { 1: [], 2: [], 3: [] };
for (const m of models) {
  groupedByEra[m.era].push(m);
}

for (const era of [1, 2, 3]) {
  console.log('\n--- ERA ' + era + ' (' + groupedByEra[era].length + ' models) ---');
  for (const m of groupedByEra[era]) {
    const photo = getAircraftPhotoUrl(m);
    const status = m.introYear <= 1980 ? 'AVAILABLE 1980' : 'FUTURE (' + m.introYear + ')';
    console.log(
      m.id.padEnd(25) +
      ' | Year: ' + String(m.introYear).padStart(4) + ' - ' + (m.retireYear ? String(m.retireYear) : 'Now').padEnd(4) +
      ' | Status: ' + status.padEnd(16) +
      ' | Photo: ' + photo
    );
  }
}

clearTimeout(_safetyWatchdog);
process.exit(0);
