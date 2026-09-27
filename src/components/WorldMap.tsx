import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { City, Route, Airline, RegionId, Negotiator } from '../types/game';
import { CITIES } from '../data/cities';
import { WORLD_LAND_POLYGONS } from '../data/worldCoastlines';
import { REGION_ZONES, REGION_LIST, RegionZone, getRegionByCoordinates } from '../data/regions';
import { REGION_LAND_POLYGONS, getRegionAtPoint } from '../data/regionLandPolygons';
import { ZoomIn, ZoomOut, RotateCcw, Globe, ArrowLeft, MapPin, Plane, Building2, Briefcase, Navigation, Compass } from 'lucide-react';
import { calculateDistance } from '../simulation/engine';
import { AIRCRAFTS } from '../data/aircrafts';

interface WorldMapProps {
  playerAirline: Airline;
  airlines?: Airline[];
  routes: Route[];
  selectedCity: City | null;
  onSelectCity: (city: City) => void;
  onOpenRouteFromCity?: (city: City) => void;
}

// Directional offsets for city labels to prevent overlap in dense regions and continental views
const CITY_LABEL_OFFSETS: Record<
  string,
  { dx: number; dy: number; align: CanvasTextAlign; baseline: CanvasTextBaseline }
> = {
  // Dense European Cluster
  FRA: { dx: 14, dy: -8, align: 'left', baseline: 'bottom' },
  ZRH: { dx: 14, dy: 10, align: 'left', baseline: 'top' },
  LON: { dx: -14, dy: -8, align: 'right', baseline: 'bottom' },
  PAR: { dx: -14, dy: 10, align: 'right', baseline: 'top' },
  ROM: { dx: 14, dy: 8, align: 'left', baseline: 'top' },
  MAD: { dx: -14, dy: 8, align: 'right', baseline: 'top' },
  ATH: { dx: 14, dy: 8, align: 'left', baseline: 'top' },
  MOW: { dx: 0, dy: -14, align: 'center', baseline: 'bottom' },
  KEF: { dx: 14, dy: 0, align: 'left', baseline: 'middle' },

  // Dense East / Southeast Asia Cluster
  BJS: { dx: -14, dy: -8, align: 'right', baseline: 'bottom' },
  SEL: { dx: 14, dy: -8, align: 'left', baseline: 'bottom' },
  SHA: { dx: 14, dy: 8, align: 'left', baseline: 'top' },
  TYO: { dx: 14, dy: 0, align: 'left', baseline: 'middle' },
  HKG: { dx: -14, dy: 8, align: 'right', baseline: 'top' },
  MNL: { dx: 14, dy: 8, align: 'left', baseline: 'top' },
  BKK: { dx: -14, dy: -8, align: 'right', baseline: 'bottom' },
  SIN: { dx: 14, dy: 8, align: 'left', baseline: 'top' },
  HKT: { dx: 14, dy: 8, align: 'left', baseline: 'top' },
  DPS: { dx: 14, dy: 8, align: 'left', baseline: 'top' },

  // North America
  NYC: { dx: 14, dy: -6, align: 'left', baseline: 'bottom' },
  ORD: { dx: -14, dy: -6, align: 'right', baseline: 'bottom' },
  MIA: { dx: 14, dy: 8, align: 'left', baseline: 'top' },
  LAX: { dx: -14, dy: 8, align: 'right', baseline: 'top' },
  YVR: { dx: -14, dy: -8, align: 'right', baseline: 'bottom' },
  MEX: { dx: 14, dy: 8, align: 'left', baseline: 'top' },
  HNL: { dx: 14, dy: 0, align: 'left', baseline: 'middle' },
  CUN: { dx: 14, dy: 0, align: 'left', baseline: 'middle' },

  // South America
  BOG: { dx: 14, dy: -6, align: 'left', baseline: 'bottom' },
  SCL: { dx: -14, dy: 0, align: 'right', baseline: 'middle' },
  BUE: { dx: 14, dy: 8, align: 'left', baseline: 'top' },
  SAO: { dx: -14, dy: 8, align: 'right', baseline: 'top' },
  RIO: { dx: 14, dy: -6, align: 'left', baseline: 'bottom' },
  GPS: { dx: -14, dy: 0, align: 'right', baseline: 'middle' },

  // Middle East & South Asia
  DEL: { dx: 0, dy: -14, align: 'center', baseline: 'bottom' },
  BOM: { dx: -14, dy: 8, align: 'right', baseline: 'top' },
  DXB: { dx: 14, dy: -6, align: 'left', baseline: 'bottom' },
  THR: { dx: 14, dy: -8, align: 'left', baseline: 'bottom' },
  CAI: { dx: -14, dy: 8, align: 'right', baseline: 'top' },
  MLE: { dx: 14, dy: 0, align: 'left', baseline: 'middle' },

  // Africa
  JNB: { dx: 0, dy: 14, align: 'center', baseline: 'top' },
  LOS: { dx: -14, dy: 0, align: 'right', baseline: 'middle' },
  NBO: { dx: 14, dy: 0, align: 'left', baseline: 'middle' },
  CPT: { dx: -14, dy: 8, align: 'right', baseline: 'top' },

  // Oceania
  SYD: { dx: 14, dy: 8, align: 'left', baseline: 'top' },
  MEL: { dx: -14, dy: 8, align: 'right', baseline: 'top' },
  AKL: { dx: 14, dy: 0, align: 'left', baseline: 'middle' },
  GUM: { dx: 14, dy: 0, align: 'left', baseline: 'middle' },
  NAN: { dx: 14, dy: 0, align: 'left', baseline: 'middle' },
};

function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 56;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 189;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 248;
  return `${r}, ${g}, ${b}`;
}

/**
 * Draws a standing retro/anime business envoy directly on the map canvas.
 * Inspired by classic Koei Aerobiz: iconic red executive suit, briefcase, tie, and character portrait.
 */
function drawStandingDelegate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  envoy: Negotiator,
  index: number,
  total: number,
  zoomScale: number,
  flightTick: number,
  avatarImg: HTMLImageElement | undefined
) {
  const s = Math.min(1.4, Math.max(0.85, zoomScale));
  // Continuous 60fps breathing & subtle idle sway animation
  const bob = Math.sin(flightTick * Math.PI * 6 + index * 1.5) * (1.5 * s);

  ctx.save();

  // 1. Drop shadow under feet
  ctx.beginPath();
  ctx.ellipse(x, y, 9 * s, 3.2 * s, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fill();

  // 2. Polished Leather Shoes
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x - 5.5 * s, y - 2.5 * s, 4.5 * s, 3 * s, 1.2 * s);
    ctx.roundRect(x + 1 * s, y - 2.5 * s, 4.5 * s, 3 * s, 1.2 * s);
  } else {
    ctx.rect(x - 5.5 * s, y - 2.5 * s, 4.5 * s, 3 * s);
    ctx.rect(x + 1 * s, y - 2.5 * s, 4.5 * s, 3 * s);
  }
  ctx.fill();

  // 3. Tailored Suit Trousers
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x - 5.5 * s, y - 13 * s, 4 * s, 11 * s);
  ctx.fillRect(x + 1.5 * s, y - 13 * s, 4 * s, 11 * s);

  // Subtle trouser crease highlight
  ctx.fillStyle = '#334155';
  ctx.fillRect(x - 4 * s, y - 13 * s, 1 * s, 10 * s);
  ctx.fillRect(x + 3 * s, y - 13 * s, 1 * s, 10 * s);

  // 4. Iconic Executive Red Suit Jacket (Classic Koei Aerobiz)
  const torsoY = y - 26 * s + bob;
  const torsoH = 13 * s;
  const torsoW = 13 * s;

  // Main Blazer Body
  ctx.fillStyle = '#dc2626'; // Executive Crimson Red
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x - 6.5 * s, torsoY, torsoW, torsoH, 2 * s);
  } else {
    ctx.rect(x - 6.5 * s, torsoY, torsoW, torsoH);
  }
  ctx.fill();

  // Shaded right lapel & side
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(x + 1.5 * s, torsoY, 5 * s, torsoH);

  // White Dress Shirt V-Neck Collar
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x - 3 * s, torsoY);
  ctx.lineTo(x, torsoY + 6 * s);
  ctx.lineTo(x + 3 * s, torsoY);
  ctx.closePath();
  ctx.fill();

  // Golden Executive Tie
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(x - 1 * s, torsoY + 2 * s);
  ctx.lineTo(x + 1 * s, torsoY + 2 * s);
  ctx.lineTo(x + 1.5 * s, torsoY + 10 * s);
  ctx.lineTo(x, torsoY + 12 * s);
  ctx.lineTo(x - 1.5 * s, torsoY + 10 * s);
  ctx.closePath();
  ctx.fill();

  // Blazer Gold Double-Breasted Buttons
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(x - 1.5 * s, torsoY + 8 * s, 1 * s, 0, Math.PI * 2);
  ctx.arc(x - 1.5 * s, torsoY + 11 * s, 1 * s, 0, Math.PI * 2);
  ctx.fill();

  // 5. Left Arm (Relaxed at side)
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x - 9.5 * s, torsoY + 1 * s, 3.2 * s, 9 * s, 1.5 * s);
  } else {
    ctx.rect(x - 9.5 * s, torsoY + 1 * s, 3.2 * s, 9 * s);
  }
  ctx.fill();
  // Left hand
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(x - 8 * s, torsoY + 10.5 * s, 1.8 * s, 0, Math.PI * 2);
  ctx.fill();

  // 6. Right Arm & Executive Leather Briefcase
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x + 6.3 * s, torsoY + 1 * s, 3.2 * s, 7 * s, 1.5 * s);
  } else {
    ctx.rect(x + 6.3 * s, torsoY + 1 * s, 3.2 * s, 7 * s);
  }
  ctx.fill();
  // Right hand holding handle
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(x + 8 * s, torsoY + 8.5 * s, 1.8 * s, 0, Math.PI * 2);
  ctx.fill();

  // Briefcase Body
  const caseX = x + 4.5 * s;
  const caseY = torsoY + 9 * s;
  const caseW = 9.5 * s;
  const caseH = 7.5 * s;

  // Briefcase shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(caseX + 1 * s, caseY + 1 * s, caseW, caseH);

  // Briefcase Leather
  ctx.fillStyle = '#78350f'; // Rich mahogany leather
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(caseX, caseY, caseW, caseH, 1.5 * s);
  } else {
    ctx.rect(caseX, caseY, caseW, caseH);
  }
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1 * s;
  ctx.stroke();

  // Gold Latches
  ctx.fillStyle = '#fde047';
  ctx.fillRect(caseX + 2 * s, caseY + 2.5 * s, 1.5 * s, 2 * s);
  ctx.fillRect(caseX + 6 * s, caseY + 2.5 * s, 1.5 * s, 2 * s);

  // Briefcase Handle
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.arc(caseX + 4.75 * s, caseY - 0.5 * s, 2 * s, Math.PI, 0);
  ctx.stroke();

  // 7. Head & Portrait Badge
  const headCenterY = y - 32 * s + bob;
  const headRadius = 8 * s;

  if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, headCenterY, headRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      avatarImg,
      x - headRadius,
      headCenterY - headRadius,
      headRadius * 2,
      headRadius * 2
    );
    ctx.restore();

    // Golden diplomatic rim
    ctx.beginPath();
    ctx.arc(x, headCenterY, headRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.8 * s;
    ctx.stroke();
  } else {
    // Retro stylized face fallback
    ctx.beginPath();
    ctx.arc(x, headCenterY, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#fed7aa';
    ctx.fill();

    // Hair color based on character
    ctx.fillStyle =
      envoy.avatarId === 'kenji'
        ? '#18181b'
        : envoy.avatarId === 'sarah'
        ? '#fde047'
        : envoy.avatarId === 'elena'
        ? '#7c2d12'
        : '#451a03';
    ctx.beginPath();
    ctx.arc(x, headCenterY - 2 * s, headRadius, Math.PI, 0);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(x - 2.5 * s, headCenterY, 1 * s, 0, Math.PI * 2);
    ctx.arc(x + 2.5 * s, headCenterY, 1 * s, 0, Math.PI * 2);
    ctx.fill();

    // Golden rim
    ctx.beginPath();
    ctx.arc(x, headCenterY, headRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.6 * s;
    ctx.stroke();
  }

  // 8. Overhead Diplomat Star Badge
  const badgeY = headCenterY - headRadius - 3.5 * s;
  ctx.save();
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#facc15';
  ctx.font = `bold ${Math.max(9, 10 * s)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('★', x, badgeY + 1 * s);
  ctx.restore();

  // 9. Name Tag (Crisp first name)
  const nameText = envoy.name.split(' ')[0];
  ctx.font = `bold ${Math.max(9, 10 * s)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 3 * s;
  ctx.strokeText(nameText, x, y + 2 * s);
  ctx.fillStyle = '#fef08a';
  ctx.fillText(nameText, x, y + 2 * s);

  ctx.restore();
}

export const WorldMap: React.FC<WorldMapProps> = ({
  playerAirline,
  airlines,
  routes,
  selectedCity,
  onSelectCity,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Airline Network Display Filter ('ALL' | 'PLAYER' | rivalId)
  const [airlineFilter, setAirlineFilter] = useState<'ALL' | 'PLAYER' | string>('ALL');

  // Active Continental Region Mode (null = Global World Overview)
  const [activeRegion, setActiveRegion] = useState<RegionId | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionId | null>(null);

  // Hovered city
  const [hoveredCity, setHoveredCity] = useState<City | null>(null);

  // Mouse cursor coordinate on map for floating badge
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Pan and Zoom camera state
  const [zoom, setZoom] = useState<number>(1.05);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Continuous animation ticker for flight progress & holographic glowing pulses
  const [flightTick, setFlightTick] = useState<number>(0);

  // Satellite texture image loader
  const [satelliteImg, setSatelliteImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/world_satellite.jpg';
    img.onload = () => {
      setSatelliteImg(img);
    };
  }, []);

  // Delegate character avatar portrait loader cache
  const [avatarsLoaded, setAvatarsLoaded] = useState<number>(0);
  const avatarImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  useEffect(() => {
    const avatarIds = ['john', 'kenji', 'sarah', 'elena', 'david'];
    avatarIds.forEach((id) => {
      const img = new Image();
      img.src = `./characters/${id}.jpg`;
      img.onload = () => {
        avatarImagesRef.current.set(id, img);
        setAvatarsLoaded((prev) => prev + 1);
      };
    });
  }, []);

  const cityMap = useMemo(() => new Map(CITIES.map((c) => [c.id, c])), []);

  // Animation frame loop for continuous 60fps flight motion & holographic pulses
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      setFlightTick((prev) => (prev + delta * 0.14) % 1);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Equirectangular projection bounds
  const minLat = -58;
  const maxLat = 74;

  const projectCoords = useCallback(
    (lat: number, lon: number, width: number, height: number) => {
      const baseX = ((lon + 180) / 360) * width;
      const baseY = ((maxLat - lat) / (maxLat - minLat)) * height;

      // Apply zoom around center of canvas and pan offset
      const cx = width / 2;
      const cy = height / 2;
      const x = cx + (baseX - cx) * zoom + pan.x;
      const y = cy + (baseY - cy) * zoom + pan.y;

      return { x, y };
    },
    [zoom, pan]
  );

  const unprojectCoords = useCallback(
    (x: number, y: number, width: number, height: number) => {
      const cx = width / 2;
      const cy = height / 2;
      const baseX = (x - pan.x - cx) / zoom + cx;
      const baseY = (y - pan.y - cy) / zoom + cy;

      const lon = (baseX / width) * 360 - 180;
      const lat = maxLat - (baseY / height) * (maxLat - minLat);

      return { lat, lon };
    },
    [zoom, pan]
  );

  // Switch Continental Region / Return to Global World
  const handleSelectRegion = useCallback(
    (regionId: RegionId | null) => {
      const container = containerRef.current;
      const width = container?.clientWidth || 1200;
      const height = container?.clientHeight || 700;

      if (!regionId) {
        // Return to Global Overview
        setActiveRegion(null);
        setZoom(1.05);
        setPan({ x: 0, y: 0 });
        return;
      }

      const reg = REGION_ZONES[regionId];
      if (!reg) return;

      setActiveRegion(regionId);

      const cx = width / 2;
      const cy = height / 2;
      const baseX = ((reg.center.lon + 180) / 360) * width;
      const baseY = ((maxLat - reg.center.lat) / (maxLat - minLat)) * height;
      const newZoom = reg.targetZoom;

      const newPan = {
        x: -(baseX - cx) * newZoom,
        y: -(baseY - cy) * newZoom,
      };

      setZoom(newZoom);
      setPan(newPan);
    },
    [maxLat, minLat]
  );

  // Focus and Center smoothly on a specific City
  const focusCity = useCallback(
    (city: City) => {
      if (activeRegion !== city.region) {
        setActiveRegion(city.region);
      }
      const container = containerRef.current;
      const width = container?.clientWidth || 1200;
      const height = container?.clientHeight || 700;
      const cx = width / 2;
      const cy = height / 2;
      const reg = REGION_ZONES[city.region];
      const targetZoom = reg ? Math.max(1.85, reg.targetZoom) : 2.0;

      const baseX = ((city.lon + 180) / 360) * width;
      const baseY = ((maxLat - city.lat) / (maxLat - minLat)) * height;

      setZoom(targetZoom);
      setPan({
        x: -(baseX - cx) * targetZoom,
        y: -(baseY - cy) * targetZoom,
      });
      onSelectCity(city);
    },
    [activeRegion, maxLat, minLat, onSelectCity]
  );

  // Draw World Map Canvas
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Deep Space Cosmic Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // 2. Render Real Satellite Photography of Earth
    const cx = width / 2;
    const cy = height / 2;
    const targetX = cx + (0 - cx) * zoom + pan.x;
    const targetY = cy + (0 - cy) * zoom + pan.y;
    const targetW = width * zoom;
    const targetH = height * zoom;

    if (satelliteImg && satelliteImg.complete && satelliteImg.naturalWidth > 0) {
      const sy = ((90 - maxLat) / 180) * satelliteImg.naturalHeight;
      const sh = ((maxLat - minLat) / 180) * satelliteImg.naturalHeight;
      const sx = 0;
      const sw = satelliteImg.naturalWidth;

      if (!activeRegion) {
        // GLOBAL VIEW: Full World Satellite Photography
        ctx.save();
        ctx.drawImage(satelliteImg, sx, sy, sw, sh, targetX, targetY, targetW, targetH);

        // Atmospheric haze
        const atmoGrad = ctx.createLinearGradient(0, targetY, 0, targetY + targetH);
        atmoGrad.addColorStop(0, 'rgba(14, 165, 233, 0.10)');
        atmoGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.02)');
        atmoGrad.addColorStop(1, 'rgba(14, 165, 233, 0.08)');
        ctx.fillStyle = atmoGrad;
        ctx.fillRect(targetX, targetY, targetW, targetH);
        ctx.restore();
      } else {
        // REGIONAL CONTINENTAL VIEW:
        // Render full vibrant satellite photography so oceans remain beautiful, vivid royal/sky blue!
        ctx.save();
        ctx.drawImage(satelliteImg, sx, sy, sw, sh, targetX, targetY, targetW, targetH);

        // Atmospheric haze & ocean vibrancy boost
        const atmoGrad = ctx.createLinearGradient(0, targetY, 0, targetY + targetH);
        atmoGrad.addColorStop(0, 'rgba(14, 165, 233, 0.12)');
        atmoGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.04)');
        atmoGrad.addColorStop(1, 'rgba(14, 165, 233, 0.10)');
        ctx.fillStyle = atmoGrad;
        ctx.fillRect(targetX, targetY, targetW, targetH);

        // Soft, elegant translucent veil over OTHER continents' landmasses
        // so the active continent clearly stands out, while oceans remain bright and vibrant!
        REGION_LIST.forEach((r) => {
          if (r.id !== activeRegion) {
            const nonActivePolygons = REGION_LAND_POLYGONS[r.id] || [];
            nonActivePolygons.forEach((item) => {
              const pts = item.pts;
              if (pts.length < 3) return;
              ctx.beginPath();
              const p0 = projectCoords(pts[0][1], pts[0][0], width, height);
              ctx.moveTo(p0.x, p0.y);
              for (let i = 1; i < pts.length; i++) {
                const p = projectCoords(pts[i][1], pts[i][0], width, height);
                ctx.lineTo(p.x, p.y);
              }
              ctx.closePath();
              ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
              ctx.fill();
            });
          }
        });

        // Translucent tactical coordinate grid lines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        for (let lat = -60; lat <= 70; lat += 10) {
          const p1 = projectCoords(lat, -180, width, height);
          const p2 = projectCoords(lat, 180, width, height);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        for (let lon = -180; lon <= 180; lon += 15) {
          const p1 = projectCoords(-70, lon, width, height);
          const p2 = projectCoords(80, lon, width, height);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        ctx.restore();
      }
    } else {
      // Fallback while loading
      ctx.fillStyle = '#0d2238';
      ctx.fillRect(0, 0, width, height);

      if (!activeRegion) {
        WORLD_LAND_POLYGONS.forEach((polygon) => {
          if (polygon.length < 3) return;
          ctx.beginPath();
          const first = projectCoords(polygon[0][1], polygon[0][0], width, height);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < polygon.length; i++) {
            const pt = projectCoords(polygon[i][1], polygon[i][0], width, height);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.closePath();
          ctx.fillStyle = '#223c30';
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      } else {
        const activePolygons = REGION_LAND_POLYGONS[activeRegion] || [];
        activePolygons.forEach((item) => {
          const pts = item.pts;
          if (pts.length < 3) return;
          ctx.beginPath();
          const first = projectCoords(pts[0][1], pts[0][0], width, height);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < pts.length; i++) {
            const pt = projectCoords(pts[i][1], pts[i][0], width, height);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.closePath();
          ctx.fillStyle = '#223c30';
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      }
    }

    // 3. CONTINENTAL GEOGRAPHIC OUTLINES & ISLAND GLOW (No rectangular boxes!)
    // Render real geographical contours of continents, countries, and all archipelagos/islands!
    REGION_LIST.forEach((region) => {
      const isHovered = !activeRegion && hoveredRegion === region.id;
      const isActive = activeRegion === region.id;
      const isHighlighted = isHovered || isActive;

      const items = REGION_LAND_POLYGONS[region.id];
      if (!items || items.length === 0) return;

      const pulse = Math.sin(flightTick * Math.PI * 4) * 0.05 + 0.22;
      const rgb = hexToRgb(region.color);

      // Render each landmass & island polygon
      items.forEach((item) => {
        const pts = item.pts;
        if (pts.length < 3) return;

        const p0 = projectCoords(pts[0][1], pts[0][0], width, height);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < pts.length; i++) {
          const p = projectCoords(pts[i][1], pts[i][0], width, height);
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();

        if (isHighlighted) {
          // 1. Glowing Translucent Fill covering continent & all islands
          ctx.fillStyle = `rgba(${rgb}, ${pulse})`;
          ctx.fill();

          // 2. High-intensity Outer Neon Holographic Aura
          ctx.save();
          ctx.shadowColor = region.color;
          ctx.shadowBlur = 18;
          ctx.strokeStyle = region.color;
          ctx.lineWidth = 2.4;
          ctx.stroke();
          ctx.restore();

          // 3. Marching Animated Energy Dashes running along the continent/island borders!
          ctx.save();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -flightTick * 40;
          ctx.stroke();
          ctx.restore();
        } else if (!activeRegion) {
          // Subtle, ultra-clean tactical perimeter trace for other continents
          ctx.save();
          ctx.strokeStyle = `rgba(${rgb}, 0.12)`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.restore();
        }
      });
    });

    // 3b. Sleek Floating Holographic Pill Badge for Hovered Continent (Follows cursor, zero map obstruction)
    if (!activeRegion && hoveredRegion && !hoveredCity) {
      const region = REGION_ZONES[hoveredRegion];
      if (region) {
        ctx.save();
        const bannerW = 280;
        const bannerH = 40;

        // Position pill badge near mouse cursor (or center if mousePos not available)
        let bx: number;
        let by: number;

        if (mousePos) {
          bx = mousePos.x - bannerW / 2;
          by = mousePos.y - bannerH - 18;
        } else {
          const c = projectCoords(region.center.lat, region.center.lon, width, height);
          bx = c.x - bannerW / 2;
          by = c.y - bannerH / 2;
        }

        // Clamp inside canvas viewport
        bx = Math.max(16, Math.min(width - bannerW - 16, bx));
        by = Math.max(16, Math.min(height - bannerH - 16, by));

        // Pill shadow & glass background
        ctx.shadowColor = region.color;
        ctx.shadowBlur = 18;
        ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
        ctx.strokeStyle = region.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bx, by, bannerW, bannerH, 20);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Continent Name & Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${region.icon} ${region.name.toUpperCase()}`, bx + bannerW / 2, by + bannerH / 2 - 7);

        // Click Callout
        ctx.fillStyle = region.color;
        ctx.font = 'bold 10px monospace';
        ctx.fillText('CLICK TO ENTER SECTOR ◄', bx + bannerW / 2, by + bannerH / 2 + 8);

        ctx.restore();
      }
    }

    // 4. Flight Routes: Curved Great Circle Arcs & Animated Airliners
    routes.forEach((route) => {
      // Filter routes based on selected airline network
      if (airlineFilter !== 'ALL') {
        if (airlineFilter === 'PLAYER' && route.airlineId !== playerAirline.id) return;
        if (airlineFilter !== 'PLAYER' && route.airlineId !== airlineFilter) return;
      }

      const origin = cityMap.get(route.originCityId);
      const dest = cityMap.get(route.destCityId);
      if (!origin || !dest) return;

      const p1 = projectCoords(origin.lat, origin.lon, width, height);
      const p2 = projectCoords(dest.lat, dest.lon, width, height);

      // In continental view, ONLY draw routes where both origin and destination are in this continent!
      if (activeRegion && (origin.region !== activeRegion || dest.region !== activeRegion)) {
        return;
      }

      // Determine owning airline livery color
      const owningAirline =
        airlines?.find((a) => a.id === route.airlineId) ||
        (route.airlineId === playerAirline.id ? playerAirline : null);
      const normalRouteColor = owningAirline ? owningAirline.color : '#38bdf8';

      // Check if this route is operating at a loss (Koei Aerobiz Deficit Route)
      const isDeficit = !!(route.lastQuarterStats && route.lastQuarterStats.profitK < 0);
      const flashPulse = (Math.sin(flightTick * 10) + 1) / 2; // 0 to 1 pulsing cycle
      const routeColor = isDeficit
        ? (flashPulse > 0.5 ? '#ef4444' : '#fca5a5')
        : normalRouteColor;

      ctx.save();

      // Compute curved Bezier control point
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const curveHeight = Math.min(130, dist * 0.22);
      const controlY = midY - curveHeight;

      if (isDeficit) {
        // Red pulsating alarm glow for loss-making route
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(midX, controlY, p2.x, p2.y);
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + 0.45 * flashPulse})`;
        ctx.lineWidth = (5 + 3 * flashPulse) * Math.min(1.4, zoom);
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14 * flashPulse;
        ctx.stroke();

        // Sharp pulsing red core line
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(midX, controlY, p2.x, p2.y);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.4 * Math.min(1.4, zoom);
        ctx.stroke();

        // Pulsing warning indicator node at arc apex
        const apexX = midX;
        const apexY = midY - curveHeight * 0.5;
        ctx.beginPath();
        ctx.arc(apexX, apexY, 4 + 2 * flashPulse, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fill();
      } else {
        // Normal profitable route in livery color
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(midX, controlY, p2.x, p2.y);
        ctx.strokeStyle = `${routeColor}55`;
        ctx.lineWidth = 4 * Math.min(1.4, zoom);
        ctx.stroke();

        // Sharp core route line in airline company color
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(midX, controlY, p2.x, p2.y);
        ctx.strokeStyle = routeColor;
        ctx.lineWidth = 1.8 * Math.min(1.4, zoom);
        ctx.stroke();
      }

      // Animated Commercial Airliner flying along the curve with company livery color (or warning red)
      drawFlyingPlane(ctx, p1, p2, midX, controlY, flightTick, Math.min(1.4, zoom), isDeficit ? '#ef4444' : normalRouteColor);
      ctx.restore();
    });

    // 5. Equator & Coordinates Line
    if (!activeRegion) {
      const eqStart = projectCoords(0, -180, width, height);
      const eqEnd = projectCoords(0, 180, width, height);
      ctx.beginPath();
      ctx.moveTo(eqStart.x, eqStart.y);
      ctx.lineTo(eqEnd.x, eqEnd.y);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.22)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. CITIES: High-Contrast, Crystal-Clear Typography (Zero Opaque Boxes!)
    CITIES.forEach((city) => {
      // In continental view, ONLY draw cities belonging to this active continent!
      if (activeRegion && city.region !== activeRegion) return;

      const { x, y } = projectCoords(city.lat, city.lon, width, height);

      const isHome = playerAirline.homeCityId === city.id;
      const isHub = playerAirline.hubCityIds.includes(city.id);
      const slots = playerAirline.slots[city.id] || 0;
      const isSelected = selectedCity?.id === city.id;
      const isHovered = hoveredCity?.id === city.id;

      // Check if city is an AI rival's headquarters
      const rivalHQ = airlines?.find((a) => !a.isHuman && a.homeCityId === city.id);

      ctx.save();

      // Pulsing Hub Rings
      if (isHome || isHub || rivalHQ) {
        const ringColor = isHome ? '#facc15' : rivalHQ ? rivalHQ.color : '#38bdf8';
        ctx.beginPath();
        ctx.arc(x, y, (isHome || rivalHQ ? 13 : 10) * Math.min(1.5, zoom), 0, Math.PI * 2);
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 2 * Math.min(1.4, zoom);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, (isHome || rivalHQ ? 19 : 15) * Math.min(1.5, zoom), 0, Math.PI * 2);
        ctx.strokeStyle = `${ringColor}55`;
        ctx.lineWidth = 1.5 * Math.min(1.4, zoom);
        ctx.stroke();
      }

      // City Center Dot
      ctx.beginPath();
      const dotRadius =
        (isSelected || isHovered ? 7 : isHome || rivalHQ ? 6 : isHub ? 5 : 4) * Math.min(1.4, zoom);
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);

      if (isHome) {
        ctx.fillStyle = '#facc15';
      } else if (rivalHQ) {
        ctx.fillStyle = rivalHQ.color;
      } else if (isHub) {
        ctx.fillStyle = '#38bdf8';
      } else if (slots > 0) {
        ctx.fillStyle = '#10b981';
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fill();

      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Find any dispatched diplomats/envoys stationed at this city!
      const cityEnvoys = (playerAirline.negotiators || []).filter(
        (n) => n.status === 'DISPATCHED' && n.currentMission?.targetCityId === city.id
      );

      // Diplomatic Aura Ring for cities with Stationed Envoys
      if (cityEnvoys.length > 0) {
        const auraPulse = (Math.sin(flightTick * Math.PI * 6) + 1) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, (dotRadius + 6) + auraPulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      }

      const offset = CITY_LABEL_OFFSETS[city.id] || { dx: 14, dy: 8, align: 'left', baseline: 'top' };

      if (activeRegion) {
        // IN REGIONAL CONTINENTAL VIEW:
        // Crystal-clear transparent typography with dark halo outline.
        // ZERO black background boxes! No overlap!
        const cityNameText = `${city.name} (${city.id})`;
        const envoySubtext = cityEnvoys.length > 0
          ? ` • 💼 ${cityEnvoys.map((e) => e.name.split(' ')[0]).join(' & ')}`
          : '';
        const statusText = (isHome
          ? `★ HEADQUARTERS • ${slots} SLOTS`
          : isHub
          ? `◆ REGIONAL HUB • ${slots} SLOTS`
          : slots > 0
          ? `${city.country} • ${slots} SLOTS`
          : `${city.country} • NO SLOTS`) + envoySubtext;

        const lx = x + offset.dx;
        let line1Y: number;
        let line2Y: number;

        if (offset.baseline === 'bottom') {
          line2Y = y + offset.dy;
          line1Y = line2Y - 17;
        } else if (offset.baseline === 'top') {
          line1Y = y + offset.dy;
          line2Y = line1Y + 17;
        } else {
          // middle
          line1Y = y + offset.dy - 9;
          line2Y = y + offset.dy + 9;
        }

        ctx.textAlign = offset.align;
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';

        // 1. City Name (Bold 15.5px)
        ctx.font = 'bold 15.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 4.5;
        ctx.strokeText(cityNameText, lx, line1Y);

        ctx.fillStyle = isHome ? '#fde047' : isHub ? '#7dd3fc' : slots > 0 ? '#34d399' : '#ffffff';
        ctx.fillText(cityNameText, lx, line1Y);

        // 2. Country & Slots Subtext (Bold 11px)
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3.5;
        ctx.strokeText(statusText, lx, line2Y);

        ctx.fillStyle = isHome
          ? '#facc15'
          : isHub
          ? '#38bdf8'
          : cityEnvoys.length > 0
          ? '#fde047'
          : slots > 0
          ? '#6ee7b7'
          : '#94a3b8';
        ctx.fillText(statusText, lx, line2Y);
      } else {
        // IN GLOBAL VIEW: Crisp Outlined IATA Code with smart non-colliding offsets
        const lx = x + offset.dx * Math.min(1.3, zoom);
        const ly = y + offset.dy * Math.min(1.3, zoom);

        const labelText = isHovered || isSelected ? `${city.id} ${city.name}` : city.id;
        const fontSize = isHovered || isSelected ? Math.max(13, 14 * zoom) : Math.max(11, 12 * zoom);
        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = offset.align;
        ctx.textBaseline = offset.baseline;

        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(2, 6, 23, 0.98)';
        ctx.lineWidth = 4;
        ctx.strokeText(labelText, lx, ly);

        ctx.fillStyle = isHome
          ? '#fde047'
          : isHub
          ? '#7dd3fc'
          : cityEnvoys.length > 0
          ? '#fde047'
          : slots > 0
          ? '#6ee7b7'
          : '#f8fafc';
        ctx.fillText(labelText, lx, ly);
      }

      // 3. Render Standing Delegate Figures on the Map!
      // If 1, 2, 3, or 4 envoys are stationed in this city, render them standing proudly beside the city node!
      if (cityEnvoys.length > 0) {
        let envoyBaseX = x;
        let envoyBaseY = y - 26 * Math.min(1.3, zoom);

        if (offset.baseline === 'bottom') {
          // Label is above -> stand below
          envoyBaseY = y + 42 * Math.min(1.3, zoom);
        } else if (offset.baseline === 'top') {
          // Label is below -> stand above
          envoyBaseY = y - 26 * Math.min(1.3, zoom);
        } else {
          // Label is middle -> stand above
          envoyBaseY = y - 26 * Math.min(1.3, zoom);
        }

        // Draw connecting diplomatic tether line & pedestal
        ctx.save();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        const startY = offset.baseline === 'bottom' ? y + dotRadius : y - dotRadius;
        ctx.moveTo(x, startY);
        ctx.lineTo(envoyBaseX, offset.baseline === 'bottom' ? envoyBaseY - 2 : envoyBaseY + 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Calculate horizontal spacing so multiple delegates stand side-by-side
        const delegateZoom = Math.min(1.35, Math.max(0.85, zoom));
        const spacing = 22 * delegateZoom;
        const totalWidth = (cityEnvoys.length - 1) * spacing;

        cityEnvoys.forEach((envoy, idx) => {
          const figX = envoyBaseX - totalWidth / 2 + idx * spacing;
          const figY = envoyBaseY;
          const avatarImg = avatarImagesRef.current.get(envoy.avatarId);
          drawStandingDelegate(
            ctx,
            figX,
            figY,
            envoy,
            idx,
            cityEnvoys.length,
            delegateZoom,
            flightTick,
            avatarImg
          );
        });
      }

      ctx.restore();
    });

    ctx.restore();
  }, [
    routes,
    selectedCity,
    hoveredCity,
    hoveredRegion,
    activeRegion,
    mousePos,
    flightTick,
    zoom,
    pan,
    satelliteImg,
    avatarsLoaded,
    playerAirline,
    airlines,
    airlineFilter,
    projectCoords,
  ]);

  // Redraw whenever state changes
  useEffect(() => {
    drawMap();
  }, [drawMap]);

  // Responsive ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      drawMap();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [drawMap]);

  // Helper to draw an oriented airplane flying along Bezier curve
  const drawFlyingPlane = (
    ctx: CanvasRenderingContext2D,
    pStart: { x: number; y: number },
    pEnd: { x: number; y: number },
    midX: number,
    controlY: number,
    t: number,
    zoomScale: number,
    airlineColor: string = '#38bdf8'
  ) => {
    const curX = (1 - t) * (1 - t) * pStart.x + 2 * (1 - t) * t * midX + t * t * pEnd.x;
    const curY = (1 - t) * (1 - t) * pStart.y + 2 * (1 - t) * t * controlY + t * t * pEnd.y;

    const dx = 2 * (1 - t) * (midX - pStart.x) + 2 * t * (pEnd.x - midX);
    const dy = 2 * (1 - t) * (controlY - pStart.y) + 2 * t * (pEnd.y - controlY);
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(curX, curY);
    ctx.rotate(angle);

    const s = Math.max(1, zoomScale * 0.9);

    // Contrail particles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowColor = airlineColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(-9 * s, 0, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Airliner Silhouette
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = airlineColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(9 * s, 0);
    ctx.lineTo(2 * s, 9 * s);
    ctx.lineTo(-2 * s, 9 * s);
    ctx.lineTo(-2 * s, 3 * s);
    ctx.lineTo(-7 * s, 5 * s);
    ctx.lineTo(-8 * s, 0);
    ctx.lineTo(-7 * s, -5 * s);
    ctx.lineTo(-2 * s, -3 * s);
    ctx.lineTo(-2 * s, -9 * s);
    ctx.lineTo(2 * s, -9 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tail fin livery highlight
    ctx.fillStyle = airlineColor;
    ctx.beginPath();
    ctx.moveTo(-5 * s, 0);
    ctx.lineTo(-8 * s, 3 * s);
    ctx.lineTo(-8 * s, -3 * s);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Mouse Interaction: Hover detection & Pan drag
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setMousePos({ x: mouseX, y: mouseY });

    // 1. Check City Hover
    let foundCity: City | null = null;
    for (const city of CITIES) {
      // In regional view, only allow hovering active region's cities
      if (activeRegion && city.region !== activeRegion) continue;

      const { x, y } = projectCoords(city.lat, city.lon, rect.width, rect.height);
      const dist = Math.hypot(mouseX - x, mouseY - y);
      let isHit = dist <= 22 * Math.min(1.5, zoom);

      // Also check if mouse is over stationed envoys for this city
      const cityEnvoys = (playerAirline.negotiators || []).filter(
        (n) => n.status === 'DISPATCHED' && n.currentMission?.targetCityId === city.id
      );
      if (!isHit && cityEnvoys.length > 0) {
        const offset = CITY_LABEL_OFFSETS[city.id] || { dx: 14, dy: 8, align: 'left', baseline: 'top' };
        const envoyBaseY = offset.baseline === 'bottom'
          ? y + 42 * Math.min(1.3, zoom)
          : y - 26 * Math.min(1.3, zoom);
        const dEnvoy = Math.hypot(mouseX - x, mouseY - (envoyBaseY - 18));
        if (dEnvoy <= 30 * Math.min(1.5, zoom)) {
          isHit = true;
        }
      }

      if (isHit) {
        foundCity = city;
        break;
      }
    }
    setHoveredCity(foundCity);

    // 2. Check Continental Region Hover via real geographic land and islands (when in Global View)
    if (!activeRegion) {
      if (foundCity) {
        setHoveredRegion(null);
      } else {
        const { lat, lon } = unprojectCoords(mouseX, mouseY, rect.width, rect.height);
        const matchedRegionId = getRegionAtPoint(lon, lat);
        setHoveredRegion(matchedRegionId);
      }
    }

    canvas.style.cursor = foundCity || (!activeRegion && hoveredRegion) ? 'pointer' : isDragging ? 'grabbing' : 'grab';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setMousePos(null);
    setHoveredCity(null);
    setHoveredRegion(null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => Math.min(3.8, Math.max(0.8, prev + zoomDelta)));
  };

  const handleClick = () => {
    if (hoveredCity) {
      onSelectCity(hoveredCity);
    } else if (!activeRegion && hoveredRegion) {
      // Clicked highlighted continental zone on map -> enter regional sector!
      handleSelectRegion(hoveredRegion);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-0 min-w-0 bg-slate-950 overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      {/* TOP-RIGHT HUD: AIRLINE NETWORK FILTER */}
      <div className="absolute top-14 right-4 z-20 hidden md:flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl text-xs">
        <span className="text-[10px] font-mono font-black text-slate-400 px-1.5 uppercase">
          Network:
        </span>
        <button
          onClick={() => setAirlineFilter('ALL')}
          className={`px-2.5 py-1 rounded-xl font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
            airlineFilter === 'ALL'
              ? 'bg-sky-500 text-slate-950 font-black shadow-md'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>All Airlines</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/70 font-mono text-slate-200">
            {routes.length}
          </span>
        </button>

        <button
          onClick={() => setAirlineFilter('PLAYER')}
          className={`px-2.5 py-1 rounded-xl font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
            airlineFilter === 'PLAYER'
              ? 'bg-blue-600 text-white font-black shadow-md border border-sky-400'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: playerAirline.color }} />
          <span>My Airline</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/70 font-mono text-slate-200">
            {routes.filter((r) => r.airlineId === playerAirline.id).length}
          </span>
        </button>

        {airlines
          ?.filter((a) => !a.isHuman)
          .map((ai) => {
            const aiRouteCount = routes.filter((r) => r.airlineId === ai.id).length;
            const isSelected = airlineFilter === ai.id;
            return (
              <button
                key={ai.id}
                onClick={() => setAirlineFilter(ai.id)}
                className={`px-2.5 py-1 rounded-xl font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected ? 'text-white font-black shadow-md' : 'text-slate-400 hover:bg-slate-800'
                }`}
                style={{
                  backgroundColor: isSelected ? ai.color : undefined,
                  border: isSelected ? `1px solid ${ai.color}` : '1px solid transparent',
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ai.color }} />
                <span className="truncate max-w-[90px]">{ai.name.split(' ')[0]}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/70 font-mono text-slate-200">
                  {aiRouteCount}
                </span>
              </button>
            );
          })}
      </div>

      {/* TOP HUD: CONTINENTAL SECTOR SWITCHER BAR */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-sky-500/50 shadow-2xl overflow-x-auto max-w-[96vw]">
        {/* Global Overview Button */}
        <button
          onClick={() => handleSelectRegion(null)}
          className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            !activeRegion
              ? 'bg-sky-500 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Global World</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>

        {/* 7 Continental Region Buttons */}
        {REGION_LIST.map((reg) => {
          const isActive = activeRegion === reg.id;
          const cityCount = CITIES.filter((c) => c.region === reg.id).length;

          return (
            <button
              key={reg.id}
              onClick={() => handleSelectRegion(reg.id)}
              onMouseEnter={() => !activeRegion && setHoveredRegion(reg.id)}
              onMouseLeave={() => !activeRegion && setHoveredRegion(null)}
              className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{reg.icon}</span>
              <span>{reg.name.split('&')[0]}</span>
              <span className="text-[10px] opacity-75 font-normal">({cityCount})</span>
            </button>
          );
        })}
      </div>

      {/* BACK TO GLOBAL MAP BUTTON (When inside a region) */}
      {activeRegion && (
        <div className="absolute top-16 left-4 z-20">
          <button
            onClick={() => handleSelectRegion(null)}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl font-bold text-xs md:text-sm shadow-2xl border-2 border-sky-400 flex items-center gap-2 cursor-pointer animate-in fade-in transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>◄ Back to Global World Map</span>
          </button>
        </div>
      )}


      {/* Map Control Buttons */}
      <div className="absolute bottom-5 right-5 flex flex-col gap-1.5 z-10 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-2xl">
        <button
          onClick={() => setZoom((prev) => Math.min(3.8, prev + 0.25))}
          title="Zoom In"
          className="p-2.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg transition cursor-pointer"
        >
          <ZoomIn className="w-5 h-5 text-sky-400" />
        </button>
        <button
          onClick={() => setZoom((prev) => Math.max(0.8, prev - 0.25))}
          title="Zoom Out"
          className="p-2.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg transition cursor-pointer"
        >
          <ZoomOut className="w-5 h-5 text-sky-400" />
        </button>
        <button
          onClick={() => {
            if (activeRegion) {
              handleSelectRegion(activeRegion); // Re-center current region
            } else {
              setZoom(1.05);
              setPan({ x: 0, y: 0 });
            }
          }}
          title="Reset View"
          className="p-2.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg transition cursor-pointer"
        >
          <RotateCcw className="w-5 h-5 text-amber-400" />
        </button>
      </div>

      {/* RETRO DIPLOMATIC CORPS (4 ENVOYS) STATUS DOCK */}
      <div className="absolute bottom-5 left-5 z-10 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 border-r border-slate-700/80 shrink-0">
            <span className="text-lg">💼</span>
            <div>
              <div className="text-[11px] font-black uppercase text-sky-400 tracking-wider">
                Diplomatic Corps
              </div>
              <div className="text-[9px] text-slate-400 font-mono">4 Field Envoys</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(playerAirline.negotiators || [])
              .filter((n) => n.role === 'FIELD')
              .map((neg) => {
                const isDispatched = neg.status === 'DISPATCHED';
                const mission = neg.currentMission;
                const targetCity = mission ? CITIES.find((c) => c.id === mission.targetCityId) : null;

                return (
                  <button
                    key={neg.id}
                    onClick={() => {
                      if (isDispatched && targetCity) {
                        focusCity(targetCity);
                      }
                    }}
                    title={
                      isDispatched && mission
                        ? `${neg.name}: Stationed in ${mission.targetCityName} (${mission.type.replace(/_/g, ' ')}) • Click to Focus Map`
                        : `${neg.name}: On Standby at Headquarters`
                    }
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      isDispatched
                        ? 'bg-amber-950/40 border-amber-500/70 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:bg-amber-900/50'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80'
                    }`}
                  >
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-600 shrink-0">
                      <img
                        src={`./characters/${neg.avatarId}.jpg`}
                        alt={neg.name}
                        className="w-full h-full object-cover object-top"
                      />
                      {isDispatched && (
                        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse" />
                      )}
                    </div>
                    <div className="text-left text-xs leading-tight">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{neg.name.split(' ')[0]}</span>
                        {isDispatched ? (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/30 text-amber-300 font-mono font-bold">
                            {mission?.targetCityId}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-mono">HQ</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[85px]">
                        {isDispatched ? mission?.targetCityName : 'Ready'}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Map Legend Overlay (In Global View) */}
        {!activeRegion && (
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-1.5 rounded-xl text-xs md:text-sm text-slate-200 shadow-2xl flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow"></span>
              <span className="font-bold">Your HQ</span>
            </div>
            {airlines
              ?.filter((a) => !a.isHuman)
              .map((ai) => (
                <div key={ai.id} className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full inline-block shadow"
                    style={{ backgroundColor: ai.color }}
                  ></span>
                  <span className="font-bold text-slate-300">{ai.name.split(' ')[0]} HQ</span>
                </div>
              ))}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow"></span>
              <span className="font-bold">Slots Owned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 bg-sky-400 inline-block rounded"></span>
              <span className="font-bold">Air Routes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-1 bg-red-500 inline-block rounded animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              <span className="font-bold text-red-400">Deficit Route (ขาดทุน)</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Detailed City Card (on Hover) */}
      {hoveredCity && (
        <div
          className={`absolute left-4 bg-slate-900/95 backdrop-blur-md border-2 border-slate-600 p-4 rounded-2xl shadow-2xl text-slate-100 pointer-events-none z-10 w-84 md:w-96 animate-in fade-in transition-all duration-150 ${
            activeRegion ? 'top-28 md:top-32' : 'top-16'
          }`}
        >
          <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2.5">
            <div>
              <div className="font-black text-base text-sky-400">{hoveredCity.name}</div>
              <div className="text-xs text-slate-300">
                {hoveredCity.country} • {hoveredCity.region.replace(/_/g, ' ')}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-sky-300 font-mono font-black text-sm border border-slate-600">
              {hoveredCity.id}
            </span>
          </div>

          {/* Stationed Envoys Highlight */}
          {(() => {
            const cityEnvoys = (playerAirline.negotiators || []).filter(
              (n) => n.status === 'DISPATCHED' && n.currentMission?.targetCityId === hoveredCity.id
            );
            if (cityEnvoys.length === 0) return null;
            return (
              <div className="mb-2.5 p-2 bg-amber-950/40 border border-amber-500/60 rounded-xl">
                <div className="text-[11px] font-black text-amber-300 uppercase flex items-center gap-1.5 mb-1.5">
                  <span>💼</span>
                  <span>Stationed Envoys ({cityEnvoys.length})</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {cityEnvoys.map((env) => (
                    <div
                      key={env.id}
                      className="flex items-center gap-2 text-xs bg-slate-900/80 p-1.5 rounded-lg border border-amber-500/30"
                    >
                      <img
                        src={`./characters/${env.avatarId}.jpg`}
                        alt={env.name}
                        className="w-6 h-6 rounded-md object-cover object-top border border-amber-400/50 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-100 truncate">{env.name}</div>
                        <div className="text-[10px] text-amber-200/80 truncate">
                          {env.currentMission?.type === 'SLOT_NEGOTIATION'
                            ? `Negotiating ${env.currentMission.requestedSlots || 10} Slots`
                            : env.currentMission?.type === 'SUBSIDIARY_ACQUISITION'
                            ? `Acquiring ${env.currentMission.ventureName || 'Venture'}`
                            : 'Chartering Regional Hub'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Population:</span>
              <span className="font-black text-slate-100 font-mono text-sm">
                {hoveredCity.population}M
              </span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Your Slots:</span>
              <span className="font-black text-emerald-400 font-mono text-sm">
                {playerAirline.slots[hoveredCity.id] || 0} / {hoveredCity.baseSlots}
              </span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Business Index:</span>
              <span className="text-amber-300 font-black font-mono text-sm">
                {hoveredCity.businessIndex}/100
              </span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Tourism Index:</span>
              <span className="text-pink-300 font-black font-mono text-sm">
                {hoveredCity.tourismIndex}/100
              </span>
            </div>
          </div>

          {/* Full-width Distance from Player HQ & Fleet Reachability Assessment */}
          {(() => {
            const homeCity =
              CITIES.find((c) => c.id === playerAirline.homeCityId) ||
              CITIES.find((c) => c.id === 'BKK') ||
              CITIES[0];
            const isHomeHQ = hoveredCity.id === homeCity.id;
            if (isHomeHQ) {
              return (
                <div className="mt-2.5 p-2.5 bg-gradient-to-r from-sky-950/90 to-blue-950/90 border border-sky-500/60 rounded-xl flex items-center justify-between gap-2 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-base text-amber-400">★</span>
                    <div>
                      <span className="text-xs font-bold text-sky-300 block">Your Primary Home Base (HQ)</span>
                      <span className="text-[10px] text-slate-400">Main hub for airline network expansion</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400 font-black">
                    BASE HQ
                  </span>
                </div>
              );
            }

            const distKm = calculateDistance(homeCity.lat, homeCity.lon, hoveredCity.lat, hoveredCity.lon);
            const ownedModels = (playerAirline.fleet || [])
              .map((f) => AIRCRAFTS.find((a) => a.id === f.modelId))
              .filter(Boolean) as (typeof AIRCRAFTS)[0][];
            const maxFleetRange = ownedModels.length > 0 ? Math.max(...ownedModels.map((m) => m.rangeKm)) : 0;
            const capableModels = ownedModels.filter((m) => m.rangeKm >= distKm);
            const canReach = capableModels.length > 0;
            const uniqueCapableNames = Array.from(new Set(capableModels.map((m) => m.model)));

            // Popularity / Corridor potential score based on business, tourism, and population
            const demandFactor = Math.round(
              (hoveredCity.businessIndex * 0.5 + hoveredCity.tourismIndex * 0.5) *
                (hoveredCity.population >= 10 ? 1.15 : hoveredCity.population >= 5 ? 1.0 : 0.85)
            );
            const demandBadge =
              demandFactor >= 85
                ? { label: '🔥 Premier Golden Route (High Passenger Demand)', color: 'text-amber-300' }
                : demandFactor >= 60
                ? { label: '📈 High-Traffic Commercial Corridor', color: 'text-emerald-300' }
                : { label: '🌱 Developing Regional Feeder Route', color: 'text-sky-300' };

            return (
              <div className="mt-2.5 p-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl space-y-2 font-mono">
                {/* Full-width Distance Row */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Plane className="w-3.5 h-3.5 text-sky-400" />
                    <span>Distance from HQ ({homeCity.name}):</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-300 text-sm md:text-base">
                      {distKm.toLocaleString()} km
                    </span>
                  </div>
                </div>

                {/* Fleet Reachability Assessment */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Fleet Reachability:</span>
                  {canReach ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/50">
                      ✓ Flyable with Current Fleet
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/50">
                      ⚠️ Out of Range (Fleet Max: {maxFleetRange.toLocaleString()} km)
                    </span>
                  )}
                </div>

                {canReach ? (
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Capable Airframes:{' '}
                    <span className="text-slate-200 font-sans font-semibold">
                      {uniqueCapableNames.join(', ')}
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-amber-200/80 leading-tight italic">
                    Requires procuring long-range airframe from Aircraft Market (Catalog has models up to 12,400+ km).
                  </div>
                )}

                {/* Popularity / Route Potential */}
                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Route Potential:</span>
                  <span className={`font-bold ${demandBadge.color}`}>{demandBadge.label}</span>
                </div>
              </div>
            );
          })()}

          <div className="mt-2.5 text-center py-1.5 bg-sky-900/50 border border-sky-500/50 text-sky-200 rounded-lg font-bold text-xs">
            Click City to Inspect or Assign Envoys
          </div>
        </div>
      )}
    </div>
  );
};
