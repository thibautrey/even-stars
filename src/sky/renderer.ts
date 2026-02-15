// Sky chart renderer - draws stars and constellations on the glasses display
// Uses gnomonic (tangent-plane) projection for accurate star placement

import type { 
  Star, 
  Constellation, 
  GeoLocation, 
  HeadOrientation, 
  HorizontalCoords,
  FieldOfView,
} from '../types';
import { ViewMode, StarFilter, ConstellationFilter, PlanetFilter, DeepSkyFilter } from '../types';
import type { SearchableObject, DirectionIndicator } from '../types/search';
import { 
  getStarHorizontalCoords, 
  isAboveHorizon, 
  gnomonicProject,
  normalizeDegrees,
  type ProjectionResult,
} from './calculator';
import { BRIGHT_STARS, getStarByHR } from './stars';
import { CONSTELLATIONS } from './constellations';
import { getAllPlanets, getInnerPlanets, getOuterPlanets, getVisiblePlanets, type Planet } from './planets';

// Glasses display dimensions (must match container size)
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../ui/containers';

// ────────────────────────────────────────────────────────────────────────────
// Display spec: Even Realities G1
//   Physical display: 640×200 px, Micro-LED, 20 Hz
//   Field of view:    25° horizontal
//   Vertical FOV:     25° × (200/640) ≈ 7.8125°
//   SDK canvas:       576×288 (the SDK coordinate space we render into)
//
// The SDK canvas (576×288) is stretched to the physical display (640×200).
// We project the sky onto the SDK canvas; the FOV values map angular degrees
// to SDK pixels.  The gnomonic projection handles the non-linear mapping.
// ────────────────────────────────────────────────────────────────────────────

/** Accurate FOV matching the Even Realities G1 glasses */
const DEFAULT_FOV: FieldOfView = {
  horizontal: 25,                  // 25° horizontal FOV (from spec)
  vertical: 25 * (200 / 640),     // ≈ 7.8125° vertical, proportional to physical pixel ratio
};

// ────────────────────────────────────────────────────────────────────────────
// Star appearance helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Calculate star display radius based on magnitude.
 * Tuned for the small 576×288 canvas — at 25° FOV each pixel subtends
 * ~2.6 arcminutes, so even a 1-pixel dot is visible.
 */
function getStarSize(magnitude: number): number {
  if (magnitude < -1) return 4.5;
  if (magnitude <  0) return 4;
  if (magnitude <  1) return 3.5;
  if (magnitude <  2) return 2.5;
  if (magnitude <  3) return 2;
  return 1.5;
}

/** Opacity for star dot */
function getStarOpacity(magnitude: number): number {
  if (magnitude < 0) return 1;
  if (magnitude < 1) return 0.95;
  if (magnitude < 2) return 0.85;
  if (magnitude < 3) return 0.7;
  return 0.55;
}

/**
 * Project a sky object and return pixel position or null if not visible
 */
function projectObject(
  coords: HorizontalCoords,
  orientation: HeadOrientation,
  fov: FieldOfView,
): ProjectionResult | null {
  const proj = gnomonicProject(coords, orientation, fov, CANVAS_WIDTH, CANVAS_HEIGHT);
  return proj.visible ? proj : null;
}

// ────────────────────────────────────────────────────────────────────────────
// Core render helpers (all use gnomonic projection)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Render a planet on the canvas
 */
function renderPlanet(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  coords: HorizontalCoords,
  orientation: HeadOrientation,
  fov: FieldOfView,
): boolean {
  const pos = projectObject(coords, orientation, fov);
  if (!pos) return false;

  const size = planet.isInner ? 3.5 : 4.5;

  // Filled disc
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
  ctx.fill();

  // Ring for gas giants
  if (!planet.isInner && planet.name !== 'Mars') {
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, size + 2, size * 0.5, Math.PI / 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Symbol above
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(planet.symbol, pos.x, pos.y - size - 6);

  return true;
}

/**
 * Render a single star on the canvas
 */
function renderStar(
  ctx: CanvasRenderingContext2D,
  star: Star,
  coords: HorizontalCoords,
  orientation: HeadOrientation,
  fov: FieldOfView,
): boolean {
  const pos = projectObject(coords, orientation, fov);
  if (!pos) return false;

  const radius = getStarSize(star.magnitude) * 0.5;
  const opacity = getStarOpacity(star.magnitude);

  ctx.beginPath();
  ctx.arc(pos.x, pos.y, Math.max(0.8, radius), 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.fill();

  return true;
}

/**
 * Render a constellation (lines between stars)
 */
function renderConstellation(
  ctx: CanvasRenderingContext2D,
  constellation: Constellation,
  location: GeoLocation,
  orientation: HeadOrientation,
  fov: FieldOfView,
  date: Date,
): void {
  const starPositions = new Map<number, { x: number; y: number; visible: boolean }>();

  for (const hr of constellation.stars) {
    const star = getStarByHR(hr);
    if (!star) continue;

    const coords = getStarHorizontalCoords(star, location, date);
    const proj = gnomonicProject(coords, orientation, fov, CANVAS_WIDTH, CANVAS_HEIGHT);
    starPositions.set(hr, { x: proj.x, y: proj.y, visible: proj.visible });
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1;

  for (const [startIdx, endIdx] of constellation.lines) {
    const startHR = constellation.stars[startIdx];
    const endHR   = constellation.stars[endIdx];
    const start   = starPositions.get(startHR);
    const end     = starPositions.get(endHR);

    if (start && end && (start.visible || end.visible)) {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }
}

/**
 * Render cardinal direction markers at the bottom of the view.
 * Each cardinal direction is projected at its true azimuth.
 */
function renderCardinalMarkers(
  ctx: CanvasRenderingContext2D,
  orientation: HeadOrientation,
  fov: FieldOfView,
): void {
  const directions = [
    { label: 'N', az: 0 },
    { label: 'NE', az: 45 },
    { label: 'E', az: 90 },
    { label: 'SE', az: 135 },
    { label: 'S', az: 180 },
    { label: 'SW', az: 225 },
    { label: 'W', az: 270 },
    { label: 'NW', az: 315 },
  ];

  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  for (const dir of directions) {
    // Project at the same altitude as view centre minus half vertical FOV
    const altForLabel = orientation.pitch - fov.vertical / 2 + 1;
    const cardCoords: HorizontalCoords = { azimuth: dir.az, altitude: altForLabel };
    const proj = gnomonicProject(cardCoords, orientation, fov, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (proj.visible && proj.x >= -10 && proj.x <= CANVAS_WIDTH + 10) {
      ctx.fillStyle = dir.label.length === 1
        ? 'rgba(255, 255, 255, 0.9)'
        : 'rgba(255, 255, 255, 0.55)';
      ctx.fillText(dir.label, proj.x, CANVAS_HEIGHT - 2);
    }
  }
}

/**
 * Render horizon line.
 * Samples many azimuth points along the 0° altitude circle
 * and connects them via gnomonic projection.
 */
function renderHorizon(
  ctx: CanvasRenderingContext2D,
  orientation: HeadOrientation,
  fov: FieldOfView,
): void {
  const STEPS = 60;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= STEPS; i++) {
    const az = (orientation.azimuth - fov.horizontal) + (2 * fov.horizontal * i) / STEPS;
    const coords: HorizontalCoords = { azimuth: normalizeDegrees(az), altitude: 0 };
    const proj = gnomonicProject(coords, orientation, fov, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (proj.visible) {
      points.push({ x: proj.x, y: proj.y });
    }
  }

  if (points.length < 2) return;

  ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Main sky render function
 */
export interface SkyRenderOptions {
  ctx: CanvasRenderingContext2D;
  location: GeoLocation;
  orientation: HeadOrientation;
  viewMode: ViewMode;
  fov?: FieldOfView;
  date?: Date;
  selectedStar?: Star | null;
  starFilter?: StarFilter;
  constellationFilter?: ConstellationFilter;
  planetFilter?: PlanetFilter;
  deepSkyFilter?: DeepSkyFilter;
  /** Target object for the finder/locator feature */
  finderTarget?: SearchableObject | null;

}

export function renderSky(options: SkyRenderOptions): {
  visibleStars: number;
  visibleConstellations: number;
  visibleDeepSky: number;
} {
  return renderSkyToBuffer(options);
}

/**
 * Filter stars based on filter option
 */
function filterStars(stars: Star[], filter: StarFilter): Star[] {
  switch (filter) {
    case StarFilter.Brightest:
      // Only show brightest stars (magnitude < 1.5)
      return stars.filter(star => star.magnitude < 1.5);
    case StarFilter.ByConstellation:
      // Only show named stars
      return stars.filter(star => star.name && star.name.length > 0);
    case StarFilter.All:
    default:
      return stars;
  }
}

/**
 * Sample deep sky objects (placeholder data)
 * In a full implementation, this would come from a catalog like Messier or NGC
 */
interface DeepSkyObject {
  name: string;
  type: 'galaxy' | 'nebula' | 'cluster';
  ra: number;
  dec: number;
  magnitude: number;
  size?: number; // apparent size in arcminutes
}

// Sample bright deep sky objects
const DEEP_SKY_OBJECTS: DeepSkyObject[] = [
  { name: 'M31', type: 'galaxy', ra: 0.71, dec: 41.27, magnitude: 3.4, size: 178 },
  { name: 'M42', type: 'nebula', ra: 5.58, dec: -5.39, magnitude: 4.0, size: 85 },
  { name: 'M45', type: 'cluster', ra: 3.79, dec: 24.12, magnitude: 1.6, size: 110 },
  { name: 'M44', type: 'cluster', ra: 8.67, dec: 19.99, magnitude: 3.7, size: 95 },
  { name: 'M7', type: 'cluster', ra: 17.9, dec: -34.8, magnitude: 3.3, size: 80 },
  { name: 'M22', type: 'cluster', ra: 18.61, dec: -23.93, magnitude: 5.1, size: 32 },
  { name: 'M8', type: 'nebula', ra: 18.06, dec: -24.39, magnitude: 5.8, size: 90 },
  { name: 'M20', type: 'nebula', ra: 18.06, dec: -23.03, magnitude: 6.3, size: 28 },
  { name: 'M81', type: 'galaxy', ra: 9.93, dec: 69.07, magnitude: 6.9, size: 27 },
  { name: 'M51', type: 'galaxy', ra: 13.5, dec: 47.2, magnitude: 8.4, size: 11 },
  { name: 'M101', type: 'galaxy', ra: 14.05, dec: 54.35, magnitude: 7.9, size: 28 },
  { name: 'M27', type: 'nebula', ra: 19.99, dec: 22.72, magnitude: 7.5, size: 8 },
  { name: 'M57', type: 'nebula', ra: 18.89, dec: 33.03, magnitude: 8.8, size: 3.8 },
  { name: 'M13', type: 'cluster', ra: 16.69, dec: 36.46, magnitude: 5.8, size: 20 },
  { name: 'M3', type: 'cluster', ra: 13.42, dec: 28.38, magnitude: 6.2, size: 18 },
  { name: 'M5', type: 'cluster', ra: 15.31, dec: 2.08, magnitude: 5.6, size: 23 },
  { name: 'M64', type: 'galaxy', ra: 12.95, dec: 21.68, magnitude: 8.5, size: 10 },
  { name: 'M104', type: 'galaxy', ra: 12.67, dec: -11.62, magnitude: 8.0, size: 9 },
];

/**
 * Filter deep sky objects based on filter option
 */
function filterDeepSkyObjects(objects: DeepSkyObject[], filter: DeepSkyFilter): DeepSkyObject[] {
  switch (filter) {
    case DeepSkyFilter.Galaxies:
      return objects.filter(obj => obj.type === 'galaxy');
    case DeepSkyFilter.Nebulae:
      return objects.filter(obj => obj.type === 'nebula');
    case DeepSkyFilter.Clusters:
      return objects.filter(obj => obj.type === 'cluster');
    case DeepSkyFilter.Brightest:
      return objects.filter(obj => obj.magnitude < 6.0);
    case DeepSkyFilter.All:
    default:
      return objects;
  }
}

/**
 * Convert deep sky object equatorial coordinates to horizontal
 */
function getDSOHorizontalCoords(
  dso: DeepSkyObject,
  location: GeoLocation,
  date: Date
): HorizontalCoords {
  // Use the same calculation as stars (treating as distant objects)
  return getStarHorizontalCoords(
    { hr: 0, name: dso.name, ra: dso.ra, dec: dso.dec, magnitude: dso.magnitude },
    location,
    date
  );
}

/**
 * Render a deep sky object
 */
function renderDeepSkyObject(
  ctx: CanvasRenderingContext2D,
  dso: DeepSkyObject,
  coords: HorizontalCoords,
  orientation: HeadOrientation,
  fov: FieldOfView,
): boolean {
  const pos = projectObject(coords, orientation, fov);
  if (!pos) return false;
  
  // Render based on object type
  const size = Math.max(3, Math.min(8, (dso.size || 10) / 10));
  const opacity = Math.max(0.4, 1 - (dso.magnitude / 10));
  
  switch (dso.type) {
    case 'galaxy':
      // Draw as ellipse
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, size * 1.5, size * 0.6, Math.PI / 6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200, 200, 255, ${opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
      
    case 'nebula':
      // Draw as fuzzy circle with glow
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100, 200, 255, ${opacity * 0.3})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(150, 220, 255, ${opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
      
    case 'cluster':
      // Draw as group of dots
      ctx.fillStyle = `rgba(255, 255, 200, ${opacity})`;
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const r = size * 0.5;
        ctx.beginPath();
        ctx.arc(
          pos.x + Math.cos(angle) * r,
          pos.y + Math.sin(angle) * r,
          1.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      // Center dot
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  
  // Draw label for bright objects
  if (dso.magnitude < 5.5) {
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(200, 200, 200, ${opacity})`;
    ctx.fillText(dso.name, pos.x, pos.y - size - 5);
  }
  
  return true;
}

/**
 * Filter constellations based on filter option and current season/location
 */
function filterConstellations(
  constellations: Constellation[], 
  filter: ConstellationFilter,
  _location: GeoLocation,
  date: Date
): Constellation[] {
  switch (filter) {
    case ConstellationFilter.Zodiac:
      // Zodiac constellations
      return constellations.filter(c => 
        ['LEO', 'VIR', 'LIB', 'SCO', 'SGR', 'CAP', 'AQR', 'PSC', 'ARI', 'TAU', 'GEM', 'ORI'].includes(c.abbr)
      );
    case ConstellationFilter.Northern:
      // Northern hemisphere constellations
      return constellations.filter(c => 
        ['UMA', 'UMI', 'CAS', 'CEP', 'CYG', 'LYR', 'DRA', 'CAM'].includes(c.abbr)
      );
    case ConstellationFilter.Southern:
      // Southern hemisphere constellations
      return constellations.filter(c => 
        ['CMA', 'CRU', 'CAR', 'VEL', 'PUP', 'GRU', 'PAV'].includes(c.abbr)
      );
    case ConstellationFilter.Seasonal:
      // Show constellations visible in current season
      const month = date.getMonth(); // 0-11
      // Winter: Dec-Feb, Spring: Mar-May, Summer: Jun-Aug, Fall: Sep-Nov
      const seasonalConstellations: Record<number, string[]> = {
        0: ['ORI', 'CMA', 'GEM', 'TAU', 'AUR'], // Winter
        1: ['ORI', 'CMA', 'GEM', 'TAU', 'AUR'], // Winter
        2: ['LEO', 'VIR', 'UMA', 'UMI', 'CVN'], // Spring
        3: ['LEO', 'VIR', 'UMA', 'UMI', 'CVN'], // Spring
        4: ['LEO', 'VIR', 'UMA', 'UMI', 'CVN'], // Spring
        5: ['SCO', 'SGR', 'LYR', 'CYG', 'AQL'], // Summer
        6: ['SCO', 'SGR', 'LYR', 'CYG', 'AQL'], // Summer
        7: ['SCO', 'SGR', 'LYR', 'CYG', 'AQL'], // Summer
        8: ['PEG', 'AND', 'PSC', 'ARI', 'CET'], // Fall
        9: ['PEG', 'AND', 'PSC', 'ARI', 'CET'], // Fall
        10: ['PEG', 'AND', 'PSC', 'ARI', 'CET'], // Fall
        11: ['ORI', 'CMA', 'GEM', 'TAU', 'AUR'], // Winter
      };
      const currentSeasonal = seasonalConstellations[month] || [];
      return constellations.filter(c => currentSeasonal.includes(c.abbr));
    case ConstellationFilter.All:
    default:
      return constellations;
  }
}

/**
 * Render sky to an offscreen buffer (for glasses display)
 */
export function renderSkyToBuffer(options: SkyRenderOptions): {
  visibleStars: number;
  visibleConstellations: number;
  visibleDeepSky: number;
} {
  const {
    ctx,
    location,
    orientation,
    viewMode,
    fov = DEFAULT_FOV,
    date = new Date(),
    selectedStar = null,
    starFilter = StarFilter.All,
    constellationFilter = ConstellationFilter.All,
    planetFilter = PlanetFilter.All,
    deepSkyFilter = DeepSkyFilter.All,
    finderTarget = null,
  } = options;
  
  // Clear canvas with BLACK background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Render horizon first (behind everything)
  renderHorizon(ctx, orientation, fov);
  
  let visibleConstellations = 0;
  let visibleDeepSky = 0;
  
  // Filter and render constellations first (so they appear behind stars)
  if (viewMode === ViewMode.Constellations || viewMode === ViewMode.Stars) {
    const filteredConstellations = filterConstellations(CONSTELLATIONS, constellationFilter, location, date);
    for (const constellation of filteredConstellations) {
      renderConstellation(ctx, constellation, location, orientation, fov, date);
      visibleConstellations++;
    }
  }
  
  // Filter and render deep sky objects
  if (viewMode === ViewMode.DeepSky || viewMode === ViewMode.Stars) {
    const filteredDSOs = filterDeepSkyObjects(DEEP_SKY_OBJECTS, deepSkyFilter);
    for (const dso of filteredDSOs) {
      const coords = getDSOHorizontalCoords(dso, location, date);
      
      // Skip objects below horizon (with 5 degree margin)
      if (!isAboveHorizon(coords.altitude, -5)) continue;
      
      const wasRendered = renderDeepSkyObject(ctx, dso, coords, orientation, fov);
      if (wasRendered) visibleDeepSky++;
    }
  }
  
  // Filter and render stars (dimmer in deep sky mode to emphasize DSOs)
  let visibleStars = 0;
  const effectiveStarFilter = viewMode === ViewMode.DeepSky ? StarFilter.Brightest : starFilter;
  const filteredStars = filterStars(BRIGHT_STARS, effectiveStarFilter);
  for (const star of filteredStars) {
    const coords = getStarHorizontalCoords(star, location, date);
    
    // Skip stars below horizon (with 5 degree margin)
    if (!isAboveHorizon(coords.altitude, -5)) continue;
    
    const wasRendered = renderStar(ctx, star, coords, orientation, fov);
    if (wasRendered) visibleStars++;
  }
  
  // Render planets based on filter
  let visiblePlanets = 0;
  if (viewMode === ViewMode.Planets || viewMode === ViewMode.Stars) {
    let planetsToRender: Array<{ planet: Planet; coords: HorizontalCoords | null }>;
    
    switch (planetFilter) {
      case PlanetFilter.Inner:
        planetsToRender = getInnerPlanets(location, date);
        break;
      case PlanetFilter.Outer:
        planetsToRender = getOuterPlanets(location, date);
        break;
      case PlanetFilter.Visible:
        planetsToRender = getVisiblePlanets(location, date);
        break;
      case PlanetFilter.All:
      default:
        planetsToRender = getAllPlanets(location, date);
        break;
    }
    
    for (const { planet, coords } of planetsToRender) {
      if (!coords || !isAboveHorizon(coords.altitude, -5)) continue;
      
      const wasRendered = renderPlanet(ctx, planet, coords, orientation, fov);
      if (wasRendered) visiblePlanets++;
    }
  }
  
  // Highlight selected star
  if (selectedStar) {
    const coords = getStarHorizontalCoords(selectedStar, location, date);
    const proj = projectObject(coords, orientation, fov);
    
    if (proj) {
      // Draw selection ring
      ctx.strokeStyle = 'rgba(255, 200, 50, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  // Render object labels with pill overlay (AR-style identification)
  renderIdentifyOverlay(ctx, location, orientation, fov, date);
  
  // Render cardinal markers
  renderCardinalMarkers(ctx, orientation, fov);
  
  // Render finder arrow if target is selected
  if (finderTarget) {
    renderFinderArrow(ctx, finderTarget, location, orientation, fov, date);
  }
  
  // Render debug/info overlay
  renderInfoOverlay(ctx, location, orientation, visibleStars, viewMode, visibleConstellations, visiblePlanets, visibleDeepSky);
  
  return { visibleStars, visibleConstellations, visibleDeepSky };
}

/**
 * Check if a rectangle overlaps with any rectangle in a list
 */
function rectOverlaps(
  x1: number, y1: number, w1: number, h1: number,
  rects: Array<{ x: number; y: number; width: number; height: number }>
): boolean {
  for (const r of rects) {
    if (
      x1 < r.x + r.width + 2 &&
      x1 + w1 + 2 > r.x &&
      y1 < r.y + r.height + 2 &&
      y1 + h1 + 2 > r.y
    ) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// IDENTIFY MODE OVERLAY
// Renders object labels directly on the glasses canvas at projected positions
// Optimized for 576x288 monochrome display at ~10 FPS
// ============================================================================

/** Type symbol for different celestial object types */
function getIdentifySymbol(type: string): string {
  switch (type) {
    case 'star': return '★';
    case 'planet': return '●';
    case 'galaxy': return '⊕';
    case 'nebula': return '☁';
    case 'cluster': return '✦';
    default: return '·';
  }
}

/** A candidate object for labeling in identify mode */
interface IdentifyCandidate {
  name: string;
  type: string;
  x: number;      // projected screen x
  y: number;      // projected screen y
  priority: number; // higher = label first (based on brightness)
  magnitude: number;
}

/**
 * Render the Identify Mode overlay on the glasses canvas.
 * 
 * This draws labels next to every visible known celestial object
 * (bright stars, planets, bright DSOs) at their projected screen
 * positions. The wearer looks around the sky and sees names floating
 * next to the real objects — an AR-style star identification experience.
 * 
 * Design constraints:
 * - Max 8 labels to keep the 576x288 display readable
 * - 11px font for legibility on tiny display
 * - Black background pill behind each label for contrast
 * - Collision avoidance prevents overlapping text
 * - Sorted by brightness: brightest objects get labels first
 * - Includes stars (mag < 2.5), all visible planets, bright DSOs (mag < 6)
 */
function renderIdentifyOverlay(
  ctx: CanvasRenderingContext2D,
  location: GeoLocation,
  orientation: HeadOrientation,
  fov: FieldOfView,
  date: Date
): void {
  const candidates: IdentifyCandidate[] = [];

  // --- Collect bright named stars ---
  for (const star of BRIGHT_STARS) {
    if (!star.name || star.magnitude > 2.5) continue;

    const coords = getStarHorizontalCoords(star, location, date);
    if (!isAboveHorizon(coords.altitude, -2)) continue;

    const pos = projectObject(coords, orientation, fov);
    if (!pos) continue;

    candidates.push({
      name: star.name,
      type: 'star',
      x: pos.x,
      y: pos.y,
      priority: 10 - star.magnitude,
      magnitude: star.magnitude,
    });
  }

  // --- Collect visible planets ---
  for (const planetData of getAllPlanets(location, date)) {
    if (!planetData.coords || !isAboveHorizon(planetData.coords.altitude, -2)) continue;

    const pos = projectObject(planetData.coords, orientation, fov);
    if (!pos) continue;

    candidates.push({
      name: planetData.planet.name,
      type: 'planet',
      x: pos.x,
      y: pos.y,
      priority: 12 - planetData.planet.baseMagnitude,
      magnitude: planetData.planet.baseMagnitude,
    });
  }

  // --- Collect bright deep sky objects ---
  for (const dso of DEEP_SKY_OBJECTS) {
    if (dso.magnitude > 5.5) continue;

    const coords = getDSOHorizontalCoords(dso, location, date);
    if (!isAboveHorizon(coords.altitude, -2)) continue;

    const pos = projectObject(coords, orientation, fov);
    if (!pos) continue;

    candidates.push({
      name: dso.name,
      type: dso.type,
      x: pos.x,
      y: pos.y,
      priority: 8 - dso.magnitude,
      magnitude: dso.magnitude,
    });
  }

  // Sort: brightest first
  candidates.sort((a, b) => b.priority - a.priority);

  // --- Place labels with collision avoidance ---
  const MAX_LABELS = 6;  // Fewer labels for narrow 25° FOV
  const FONT_SIZE = 11;
  const LINE_HEIGHT = FONT_SIZE + 2;
  const LABEL_PADDING_H = 4; // horizontal padding inside pill
  const LABEL_PADDING_V = 2; // vertical padding inside pill
  const MARGIN = 5;          // gap between star dot and label
  
  ctx.font = `bold ${FONT_SIZE}px sans-serif`;
  ctx.textBaseline = 'middle';

  const placedRects: Array<{ x: number; y: number; width: number; height: number }> = [];
  let placedCount = 0;

  for (const candidate of candidates) {
    if (placedCount >= MAX_LABELS) break;

    // Build label text: "★ Sirius" or "● Jupiter"
    const symbol = getIdentifySymbol(candidate.type);
    const labelText = `${symbol} ${candidate.name}`;
    const textWidth = ctx.measureText(labelText).width;
    const pillW = textWidth + LABEL_PADDING_H * 2;
    const pillH = LINE_HEIGHT + LABEL_PADDING_V * 2;

    const starRadius = getStarSize(candidate.magnitude);

    // Try placement positions: right, left, above, below
    const placements = [
      { x: candidate.x + starRadius + MARGIN, y: candidate.y - pillH / 2 },                          // right
      { x: candidate.x - starRadius - MARGIN - pillW, y: candidate.y - pillH / 2 },                  // left
      { x: candidate.x - pillW / 2, y: candidate.y - starRadius - MARGIN - pillH },                  // above
      { x: candidate.x - pillW / 2, y: candidate.y + starRadius + MARGIN },                          // below
    ];

    let placed = false;
    for (const p of placements) {
      // Bounds check (keep within canvas, leaving room for cardinal markers)
      if (p.x < 2 || p.x + pillW > CANVAS_WIDTH - 2) continue;
      if (p.y < 14 || p.y + pillH > CANVAS_HEIGHT - 4) continue; // 14px top margin for info overlay

      // Collision check
      if (rectOverlaps(p.x, p.y, pillW, pillH, placedRects)) continue;

      // --- Draw connector line (subtle) ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(candidate.x, candidate.y);
      // Connect to nearest edge of pill
      const connectX = Math.max(p.x, Math.min(p.x + pillW, candidate.x));
      const connectY = Math.max(p.y, Math.min(p.y + pillH, candidate.y));
      ctx.lineTo(connectX, connectY);
      ctx.stroke();

      // --- Draw pill background ---
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      // Rounded rectangle (manual for compatibility)
      const r = 3; // border radius
      ctx.moveTo(p.x + r, p.y);
      ctx.lineTo(p.x + pillW - r, p.y);
      ctx.arcTo(p.x + pillW, p.y, p.x + pillW, p.y + r, r);
      ctx.lineTo(p.x + pillW, p.y + pillH - r);
      ctx.arcTo(p.x + pillW, p.y + pillH, p.x + pillW - r, p.y + pillH, r);
      ctx.lineTo(p.x + r, p.y + pillH);
      ctx.arcTo(p.x, p.y + pillH, p.x, p.y + pillH - r, r);
      ctx.lineTo(p.x, p.y + r);
      ctx.arcTo(p.x, p.y, p.x + r, p.y, r);
      ctx.fill();

      // --- Draw pill border ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // --- Draw label text ---
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.textAlign = 'left';
      ctx.fillText(labelText, p.x + LABEL_PADDING_H, p.y + pillH / 2);

      // Record placed rectangle
      placedRects.push({ x: p.x, y: p.y, width: pillW, height: pillH });
      placedCount++;
      placed = true;
      break;
    }

    // If no placement position worked, skip this candidate
    if (!placed) continue;
  }
}

/**
 * Render information overlay
 */
function renderInfoOverlay(
  ctx: CanvasRenderingContext2D,
  _location: GeoLocation,
  orientation: HeadOrientation,
  visibleStars: number,
  viewMode: ViewMode,
  _visibleConstellations: number = 0,
  visiblePlanets: number = 0,
  visibleDeepSky: number = 0
): void {
  // Simplified for small glasses display - just show direction
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const cardinal = cardinals[Math.round(orientation.azimuth / 45) % 8];
  
  ctx.font = '8px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top'; // Changed to top for top-left positioning
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  
  let infoText = `${cardinal} ${orientation.azimuth.toFixed(0)}°`;
  if (viewMode === ViewMode.DeepSky) {
    infoText += ` | ${visibleDeepSky} DSO`;
    if (visibleStars > 0) infoText += ` | ${visibleStars}★`;
  } else {
    infoText += ` | ${visibleStars}★`;
    if (visiblePlanets > 0) infoText += ` ${visiblePlanets}☿`;
    if (visibleDeepSky > 0) infoText += ` ${visibleDeepSky} DSO`;
  }
  
  // Position at top left corner (was bottom left)
  ctx.fillText(infoText, 5, 5);
}

/**
 * Generate binary image data for Even glasses
 * Converts canvas content to grayscale bitmap for SDK
 */
export function generateImageData(
  ctx: CanvasRenderingContext2D
): Uint8Array {
  const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const data = imageData.data;
  const grayData = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
  
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    // Convert RGB to grayscale
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    // Apply alpha
    const alpha = data[i + 3] / 255;
    grayData[j] = Math.round(gray * alpha);
  }
  
  return grayData;
}

/**
 * Calculate direction indicator for the finder arrow
 * Returns angle and distance to target from current view center
 */
function calculateDirectionToTarget(
  target: SearchableObject,
  location: GeoLocation,
  orientation: HeadOrientation,
  fov: FieldOfView,
  date: Date
): DirectionIndicator {
  // Get target's horizontal coordinates (with precession + refraction)
  const targetCoords = getStarHorizontalCoords(
    { hr: 0, name: target.name, ra: target.ra, dec: target.dec, magnitude: target.magnitude },
    location,
    date
  );

  // Use gnomonic projection to check if in view
  const proj = gnomonicProject(targetCoords, orientation, fov, CANVAS_WIDTH, CANVAS_HEIGHT);
  const isInView = proj.visible && targetCoords.altitude > -1;

  // For direction arrow, compute angular offsets on the sphere
  const deg2rad = Math.PI / 180;
  const az0 = orientation.azimuth * deg2rad;
  const alt0 = orientation.pitch * deg2rad;
  const az = targetCoords.azimuth * deg2rad;
  const alt = targetCoords.altitude * deg2rad;

  // Great-circle angular distance
  const cosC = Math.sin(alt0) * Math.sin(alt) + Math.cos(alt0) * Math.cos(alt) * Math.cos(az - az0);
  const distance = Math.acos(Math.max(-1, Math.min(1, cosC))) / deg2rad;

  // Bearing from view centre to target (position angle on the sphere)
  const dAz = az - az0;
  const angle = Math.atan2(Math.sin(dAz) * Math.cos(alt),
    Math.cos(alt0) * Math.sin(alt) - Math.sin(alt0) * Math.cos(alt) * Math.cos(dAz)
  ) / deg2rad;

  // Generate guidance text
  let guidance = '';
  if (isInView) {
    guidance = 'In view!';
  } else if (distance > 90) {
    guidance = 'Behind you';
  } else {
    const directions = ['up', 'up-right', 'right', 'down-right', 'down', 'down-left', 'left', 'up-left'];
    const dirIndex = Math.round(((angle % 360 + 360) % 360) / 45) % 8;
    guidance = `Go ${directions[dirIndex]}`;
  }

  return { angle, distance, isInView, guidance };
}

/**
 * Render the finder arrow pointing to target
 */
function renderFinderArrow(
  ctx: CanvasRenderingContext2D,
  target: SearchableObject,
  location: GeoLocation,
  orientation: HeadOrientation,
  fov: FieldOfView,
  date: Date
): void {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  
  // Calculate direction to target
  const direction = calculateDirectionToTarget(target, location, orientation, fov, date);
  
  // If target is in view, draw a marker instead of arrow
  if (direction.isInView) {
    const targetCoords = getStarHorizontalCoords(
      { hr: 0, name: target.name, ra: target.ra, dec: target.dec, magnitude: target.magnitude },
      location,
      date
    );

    const proj = gnomonicProject(targetCoords, orientation, fov, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (!proj.visible) return; // safety

    const px = proj.x;
    const py = proj.y;
    
    // Draw target crosshair
    ctx.strokeStyle = 'rgba(50, 255, 50, 0.9)';
    ctx.lineWidth = 2;
    const size = 15;
    
    // Crosshair
    ctx.beginPath();
    ctx.moveTo(px - size, py);
    ctx.lineTo(px + size, py);
    ctx.moveTo(px, py - size);
    ctx.lineTo(px, py + size);
    ctx.stroke();
    
    // Circle
    ctx.beginPath();
    ctx.arc(px, py, size + 5, 0, Math.PI * 2);
    ctx.stroke();
    
    // Label
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = 'rgba(50, 255, 50, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(target.name, px, py - size - 10);
    
    return;
  }
  
  // Target is outside view - draw arrow from center
  const arrowLength = 40;
  const arrowAngle = direction.angle * (Math.PI / 180);
  
  // Calculate arrow endpoint
  const endX = centerX + Math.sin(arrowAngle) * arrowLength;
  const endY = centerY - Math.cos(arrowAngle) * arrowLength;
  
  // Draw arrow shaft
  ctx.strokeStyle = 'rgba(50, 255, 50, 0.9)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  
  // Draw arrowhead
  const headLength = 12;
  const headAngle = 30 * (Math.PI / 180);
  
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.sin(arrowAngle - headAngle),
    endY + headLength * Math.cos(arrowAngle - headAngle)
  );
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.sin(arrowAngle + headAngle),
    endY + headLength * Math.cos(arrowAngle + headAngle)
  );
  ctx.stroke();
  
  // Draw distance circle around arrow tip
  ctx.beginPath();
  ctx.arc(endX, endY, 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(50, 255, 50, 0.3)';
  ctx.fill();
  ctx.stroke();
  
  // Draw target info box
  const boxWidth = 100;
  const boxHeight = 35;
  const boxX = CANVAS_WIDTH - boxWidth - 10;
  const boxY = 10;
  
  // Box background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  ctx.strokeStyle = 'rgba(50, 255, 50, 0.9)';
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
  
  // Target name
  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = 'rgba(50, 255, 50, 0.9)';
  ctx.textAlign = 'left';
  ctx.fillText(target.name.substring(0, 14), boxX + 5, boxY + 12);
  
  // Distance info
  ctx.font = '9px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(`${Math.round(direction.distance)}° away`, boxX + 5, boxY + 26);
  
  // Draw guidance at bottom center
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = 'rgba(50, 255, 50, 0.9)';
  ctx.textAlign = 'center';
  ctx.fillText(direction.guidance, centerX, CANVAS_HEIGHT - 15);
}

export { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_FOV };
