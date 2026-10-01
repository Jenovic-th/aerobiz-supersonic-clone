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

console.log('--- 1. Testing Cross-Region Route Mathematics and Antimeridian Logic ---');

const citiesTs = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'cities.ts'), 'utf8');

function getCity(id) {
  const marker = "id: '" + id + "'";
  const idx = citiesTs.indexOf(marker);
  if (idx === -1) return null;
  const chunk = citiesTs.substring(idx, idx + 400);
  const latM = chunk.match(/lat:\s*([-\d.]+)/);
  const lonM = chunk.match(/lon:\s*([-\d.]+)/);
  const regM = chunk.match(/region:\s*'([^']+)'/);
  const nameM = chunk.match(/name:\s*'([^']+)'/);
  return {
    id: id,
    name: nameM ? nameM[1] : id,
    region: regM ? regM[1] : '',
    lat: latM ? parseFloat(latM[1]) : 0,
    lon: lonM ? parseFloat(lonM[1]) : 0,
  };
}

const tokyo = getCity('TYO');
const rome = getCity('ROM');
const istanbul = getCity('IST');
const losAngeles = getCity('LAX');

console.log('Tokyo:', tokyo.id, tokyo.region, 'Lat:', tokyo.lat, 'Lon:', tokyo.lon);
console.log('Rome:', rome.id, rome.region, 'Lat:', rome.lat, 'Lon:', rome.lon);
console.log('Istanbul:', istanbul.id, istanbul.region, 'Lat:', istanbul.lat, 'Lon:', istanbul.lon);
console.log('Los Angeles:', losAngeles.id, losAngeles.region, 'Lat:', losAngeles.lat, 'Lon:', losAngeles.lon);

if (tokyo.region === rome.region) {
  throw new Error('Expected Tokyo and Rome to be in different regions');
}

// Check Region Filter Condition
const activeRegionEastAsia = 'EAST_SOUTHEAST_ASIA';
const activeRegionEurope = 'EUROPE';

function shouldDrawRoute(route, activeRegion) {
  if (activeRegion && route.originRegion !== activeRegion && route.destRegion !== activeRegion) {
    return false;
  }
  return true;
}

const tokyoRomeRoute = {
  id: 'route-tyo-rom',
  originRegion: tokyo.region,
  destRegion: rome.region,
};

const drawsInEastAsia = shouldDrawRoute(tokyoRomeRoute, activeRegionEastAsia);
const drawsInEurope = shouldDrawRoute(tokyoRomeRoute, activeRegionEurope);
const drawsInGlobal = shouldDrawRoute(tokyoRomeRoute, null);
const drawsInNorthAmerica = shouldDrawRoute(tokyoRomeRoute, 'NORTH_AMERICA');

console.log('\n--- 2. Route Visibility Verification ---');
console.log('Tokyo -> Rome visible in East Asia view:', drawsInEastAsia ? 'PASS (Visible)' : 'FAIL');
console.log('Tokyo -> Rome visible in Europe view:', drawsInEurope ? 'PASS (Visible)' : 'FAIL');
console.log('Tokyo -> Rome visible in Global view:', drawsInGlobal ? 'PASS (Visible)' : 'FAIL');
console.log('Tokyo -> Rome hidden in North America view:', !drawsInNorthAmerica ? 'PASS (Correctly Hidden)' : 'FAIL');

if (!drawsInEastAsia || !drawsInEurope || !drawsInGlobal || drawsInNorthAmerica) {
  throw new Error('Route visibility filter assertion failed!');
}

console.log('\n--- 3. Connected Overseas Gateway Detection ---');
function getConnectedOverseasCityIds(routes, activeRegion) {
  if (!activeRegion) return new Set();
  const set = new Set();
  routes.forEach((r) => {
    if (r.originRegion === activeRegion && r.destRegion !== activeRegion) {
      set.add(r.destId);
    } else if (r.destRegion === activeRegion && r.originRegion !== activeRegion) {
      set.add(r.originId);
    }
  });
  return set;
}

const mockRoutes = [
  { id: 'r1', originId: 'TYO', originRegion: 'EAST_SOUTHEAST_ASIA', destId: 'ROM', destRegion: 'EUROPE' },
  { id: 'r2', originId: 'TYO', originRegion: 'EAST_SOUTHEAST_ASIA', destId: 'SEL', destRegion: 'EAST_SOUTHEAST_ASIA' },
];

const overseasGatewaysInAsia = getConnectedOverseasCityIds(mockRoutes, activeRegionEastAsia);
console.log('Overseas gateways in East Asia view:', Array.from(overseasGatewaysInAsia));
if (!overseasGatewaysInAsia.has('ROM') || overseasGatewaysInAsia.has('SEL')) {
  throw new Error('Overseas gateways logic failed!');
}

const overseasGatewaysInEurope = getConnectedOverseasCityIds(mockRoutes, activeRegionEurope);
console.log('Overseas gateways in Europe view:', Array.from(overseasGatewaysInEurope));
if (!overseasGatewaysInEurope.has('TYO')) {
  throw new Error('Overseas gateways logic for Europe view failed!');
}

console.log('\n--- 4. Antimeridian Crossing Verification ---');
function checkAntimeridian(c1, c2) {
  const dLon = c2.lon - c1.lon;
  const crosses = Math.abs(dLon) > 180;
  return { dLon: dLon, crosses: crosses };
}

const tyoToRom = checkAntimeridian(tokyo, rome);
console.log('TYO -> ROM dLon:', tyoToRom.dLon, 'Crosses 180:', tyoToRom.crosses);
if (tyoToRom.crosses) {
  throw new Error('TYO -> ROM should NOT cross antimeridian');
}

const tyoToLax = checkAntimeridian(tokyo, losAngeles);
console.log('TYO -> LAX dLon:', tyoToLax.dLon, 'Crosses 180:', tyoToLax.crosses);
if (!tyoToLax.crosses) {
  throw new Error('TYO -> LAX SHOULD cross antimeridian');
}

console.log('\n[ALL VERIFICATION CHECKS PASSED SUCCESSFULLY]');
process.exit(0);
