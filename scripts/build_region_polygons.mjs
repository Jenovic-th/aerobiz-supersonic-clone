// scripts/build_region_polygons.mjs
import fs from 'fs';

// Sutherland-Hodgman polygon clipper for lon <= maxLon
function clipPolyLonMax(poly, maxLon) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i - 1 + poly.length) % poly.length];
    const curIn = cur[0] <= maxLon;
    const prevIn = prev[0] <= maxLon;
    if (curIn) {
      if (!prevIn) {
        const t = (maxLon - prev[0]) / (cur[0] - prev[0]);
        out.push([maxLon, prev[1] + t * (cur[1] - prev[1])]);
      }
      out.push(cur);
    } else if (prevIn) {
      const t = (maxLon - prev[0]) / (cur[0] - prev[0]);
      out.push([maxLon, prev[1] + t * (cur[1] - prev[1])]);
    }
  }
  return out;
}

// Sutherland-Hodgman polygon clipper for lon >= minLon
function clipPolyLonMin(poly, minLon) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i - 1 + poly.length) % poly.length];
    const curIn = cur[0] >= minLon;
    const prevIn = prev[0] >= minLon;
    if (curIn) {
      if (!prevIn) {
        const t = (minLon - prev[0]) / (cur[0] - prev[0]);
        out.push([minLon, prev[1] + t * (cur[1] - prev[1])]);
      }
      out.push(cur);
    } else if (prevIn) {
      const t = (minLon - prev[0]) / (cur[0] - prev[0]);
      out.push([minLon, prev[1] + t * (cur[1] - prev[1])]);
    }
  }
  return out;
}

async function main() {
  console.log('Fetching Natural Earth 110m countries...');
  const res = await fetch('https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/110m/cultural/ne_110m_admin_0_countries.json');
  const data = await res.json();

  function getRegion(f) {
    const name = f.properties.NAME || f.properties.ADMIN;
    const cont = f.properties.CONTINENT;
    const sub = f.properties.SUBREGION;

    if (name === 'Egypt') return 'MIDDLE_EAST_SOUTH_ASIA'; // Cairo is in Middle East in Koei Aerobiz
    if (cont === 'South America') return 'SOUTH_AMERICA';
    if (cont === 'North America') return 'NORTH_AMERICA';
    if (cont === 'Africa') return 'AFRICA';
    if (cont === 'Oceania') return 'OCEANIA';

    if (name === 'Russia') {
      return 'RUSSIA_SPECIAL';
    }

    if (cont === 'Europe') {
      return 'EUROPE';
    }

    if (cont === 'Asia') {
      if (sub === 'Eastern Asia' || sub === 'South-Eastern Asia') {
        return 'EAST_SOUTHEAST_ASIA';
      }
      if (sub === 'Southern Asia' || sub === 'Western Asia' || sub === 'Central Asia') {
        return 'MIDDLE_EAST_SOUTH_ASIA';
      }
      return 'EAST_SOUTHEAST_ASIA';
    }

    return null;
  }

  const regionPolygons = {
    EUROPE: [],
    EAST_SOUTHEAST_ASIA: [],
    NORTH_AMERICA: [],
    SOUTH_AMERICA: [],
    MIDDLE_EAST_SOUTH_ASIA: [],
    AFRICA: [],
    OCEANIA: []
  };

  function cleanRing(ring) {
    return ring.map(([lon, lat]) => [Math.round(lon * 100) / 100, Math.round(lat * 100) / 100]);
  }

  for (const f of data.features) {
    const regionId = getRegion(f);
    if (!regionId) continue;

    const name = f.properties.NAME || f.properties.ADMIN;
    const geom = f.geometry;
    if (!geom) continue;

    let rings = [];
    if (geom.type === 'Polygon') {
      if (geom.coordinates[0] && geom.coordinates[0].length >= 3) {
        rings.push(geom.coordinates[0]);
      }
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        if (poly[0] && poly[0].length >= 3) {
          rings.push(poly[0]);
        }
      }
    }

    if (regionId === 'RUSSIA_SPECIAL') {
      // Split Russia at Ural Mountains (lon 60 E)
      for (const ring of rings) {
        // European side (lon <= 60)
        const euroPart = clipPolyLonMax(ring, 60);
        if (euroPart.length >= 3) {
          regionPolygons.EUROPE.push(cleanRing(euroPart));
        }
        // Asian Siberia side (lon >= 60)
        const asiaPart = clipPolyLonMin(ring, 60);
        if (asiaPart.length >= 3) {
          regionPolygons.EAST_SOUTHEAST_ASIA.push(cleanRing(asiaPart));
        }
      }
    } else {
      for (const ring of rings) {
        regionPolygons[regionId].push(cleanRing(ring));
      }
    }
  }

  // Precompute bounding box for each polygon for ultra-fast point-in-polygon
  const regionData = {};
  for (const r in regionPolygons) {
    regionData[r] = regionPolygons[r].map(poly => {
      let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
      for (const [lon, lat] of poly) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      return {
        bbox: [minLon, minLat, maxLon, maxLat],
        pts: poly
      };
    });
  }

  console.log('Polygons processed:');
  for (const r in regionData) {
    console.log(`- ${r}: ${regionData[r].length} polygons`);
  }

  const tsContent = `// Real geographic land & island boundaries per continent/region from Natural Earth 110m
import { RegionId } from '../types/game';

export interface RegionPolygonItem {
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  pts: [number, number][]; // [lon, lat][]
}

export const REGION_LAND_POLYGONS: Record<RegionId, RegionPolygonItem[]> = ${JSON.stringify(regionData, null, 2)};

// Ray casting algorithm with bounding-box pre-check to detect if point (lon, lat) is inside a region
export function isPointInRegion(lon: number, lat: number, regionId: RegionId): boolean {
  const items = REGION_LAND_POLYGONS[regionId];
  if (!items) return false;

  for (let k = 0; k < items.length; k++) {
    const item = items[k];
    const [minLon, minLat, maxLon, maxLat] = item.bbox;
    // Fast Bounding Box test with small tolerance for coastal shores
    if (lon < minLon - 1.5 || lon > maxLon + 1.5 || lat < minLat - 1.5 || lat > maxLat + 1.5) {
      continue;
    }

    const pts = item.pts;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1];
      const xj = pts[j][0], yj = pts[j][1];

      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    if (inside) return true;
  }

  return false;
}

// Find region containing (lon, lat)
export function getRegionAtPoint(lon: number, lat: number): RegionId | null {
  const regionOrder: RegionId[] = [
    'EUROPE',
    'EAST_SOUTHEAST_ASIA',
    'NORTH_AMERICA',
    'SOUTH_AMERICA',
    'MIDDLE_EAST_SOUTH_ASIA',
    'AFRICA',
    'OCEANIA',
  ];

  for (const reg of regionOrder) {
    if (isPointInRegion(lon, lat, reg)) {
      return reg;
    }
  }
  return null;
}
`;

  fs.writeFileSync('src/data/regionLandPolygons.ts', tsContent);
  console.log('Saved to src/data/regionLandPolygons.ts! Size:', (tsContent.length / 1024).toFixed(1), 'KB');
}

main().catch(console.error);
