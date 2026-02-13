// Sky chart renderer - draws stars and constellations on the glasses display

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
  getViewOffset, 
  isInFieldOfView,
  projectToCanvas,
  normalizeDegrees
} from './calculator';
import { BRIGHT_STARS, getStarByHR } from './stars';
import { CONSTELLATIONS } from './constellations';
import { getAllPlanets, getInnerPlanets, getOuterPlanets, getVisiblePlanets, type Planet } from './planets';

// Glasses display dimensions (must match container size)
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../ui/containers';

// Default field of view (typical for AR glasses)
const DEFAULT_FOV: FieldOfView = {
  horizontal: 60,  // 60 degrees horizontal
  vertical: 35,    // 35 degrees vertical
};

/**
 * Calculate star size based on magnitude
 * @param magnitude Star magnitude
 * @returns Size in pixels
 */
function getStarSize(magnitude: number): number {
  // Brighter stars (lower magnitude) are larger
  if (magnitude < 0) return 5;
  if (magnitude < 1) return 4;
  if (magnitude < 2) return 3;
  if (magnitude < 3) return 2.5;
  return 2;
}

/**
 * Convert magnitude to opacity (brighter = more opaque)
 * @param magnitude Star magnitude
 * @returns Opacity value (0-1)
 */
function getStarOpacity(magnitude: number): number {
  if (magnitude < 0) return 1;
  if (magnitude < 1) return 0.95;
  if (magnitude < 2) return 0.85;
  if (magnitude < 3) return 0.75;
  return 0.6;
}

/**
 * Render a planet on the canvas
 */
function renderPlanet(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  coords: HorizontalCoords,
  orientation: HeadOrientation,
  fov: FieldOfView
): boolean {
  const offset = getViewOffset(coords, orientation.azimuth, orientation.pitch);
  
  // Check if planet is in field of view
  if (!isInFieldOfView(offset.deltaAz, offset.deltaAlt, fov.horizontal, fov.vertical)) {
    return false;
  }
  
  const pos = projectToCanvas(
    offset.deltaAz,
    offset.deltaAlt,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    fov.horizontal,
    fov.vertical
  );
  
  // Planets are larger than stars and have a different symbol
  const size = planet.isInner ? 4 : 5;
  
  // Draw planet as a circle with a ring for outer planets
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
  ctx.fill();
  
  // Draw ring for gas giants
  if (!planet.isInner && planet.name !== 'Mars') {
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, size + 2, size * 0.5, Math.PI / 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // Draw planet symbol
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
  fov: FieldOfView
): boolean {
  const offset = getViewOffset(coords, orientation.azimuth, orientation.pitch);
  
  // Check if star is in field of view
  if (!isInFieldOfView(offset.deltaAz, offset.deltaAlt, fov.horizontal, fov.vertical)) {
    return false;
  }
  
  const pos = projectToCanvas(
    offset.deltaAz,
    offset.deltaAlt,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    fov.horizontal,
    fov.vertical
  );
  
  const size = getStarSize(star.magnitude);
  const opacity = getStarOpacity(star.magnitude);
  
  // Draw star (WHITE on BLACK background)
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, Math.max(1, size * 0.5), 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.fill();
  
  return true;
}

/**
 * Render a constellation
 */
function renderConstellation(
  ctx: CanvasRenderingContext2D,
  constellation: Constellation,
  location: GeoLocation,
  orientation: HeadOrientation,
  fov: FieldOfView,
  date: Date
): void {
  const starPositions = new Map<number, { x: number; y: number; visible: boolean }>();
  
  // Calculate positions for all stars in the constellation
  for (const hr of constellation.stars) {
    const star = getStarByHR(hr);
    if (!star) continue;
    
    const coords = getStarHorizontalCoords(star, location, date);
    const offset = getViewOffset(coords, orientation.azimuth, orientation.pitch);
    
    if (isInFieldOfView(offset.deltaAz, offset.deltaAlt, fov.horizontal, fov.vertical)) {
      const pos = projectToCanvas(
        offset.deltaAz,
        offset.deltaAlt,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        fov.horizontal,
        fov.vertical
      );
      starPositions.set(hr, { x: pos.x, y: pos.y, visible: true });
    } else {
      // Store invisible positions for lines that go off-screen
      const pos = projectToCanvas(
        offset.deltaAz,
        offset.deltaAlt,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        fov.horizontal,
        fov.vertical
      );
      starPositions.set(hr, { x: pos.x, y: pos.y, visible: false });
    }
  }
  
  // Draw constellation lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  
  for (const [startIdx, endIdx] of constellation.lines) {
    const startHR = constellation.stars[startIdx];
    const endHR = constellation.stars[endIdx];
    
    const start = starPositions.get(startHR);
    const end = starPositions.get(endHR);
    
    if (start && end && (start.visible || end.visible)) {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }
}

/**
 * Render cardinal direction markers
 */
function renderCardinalMarkers(
  ctx: CanvasRenderingContext2D,
  orientation: HeadOrientation,
  fov: FieldOfView
): void {
  const directions = [
    { label: 'N', az: 0 },
    { label: 'E', az: 90 },
    { label: 'S', az: 180 },
    { label: 'W', az: 270 },
  ];
  
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (const dir of directions) {
    const deltaAz = normalizeDegrees(dir.az - orientation.azimuth);
    let adjustedDelta = deltaAz;
    if (adjustedDelta > 180) adjustedDelta -= 360;
    
    if (Math.abs(adjustedDelta) <= fov.horizontal / 2 + 10) {
      const pos = projectToCanvas(
        adjustedDelta,
        -fov.vertical / 2 + 5,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        fov.horizontal,
        fov.vertical
      );
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(dir.label, pos.x, pos.y);
    }
  }
}

/**
 * Render horizon line
 */
function renderHorizon(
  ctx: CanvasRenderingContext2D,
  orientation: HeadOrientation,
  fov: FieldOfView
): void {
  // Calculate where horizon would be based on pitch
  const horizonOffset = -orientation.pitch;
  
  if (Math.abs(horizonOffset) <= fov.vertical / 2) {
    const pos = projectToCanvas(
      0,
      horizonOffset,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      fov.horizontal,
      fov.vertical
    );
    
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, pos.y);
    ctx.lineTo(CANVAS_WIDTH, pos.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
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
  fov: FieldOfView
): boolean {
  const offset = getViewOffset(coords, orientation.azimuth, orientation.pitch);
  
  // Check if object is in field of view
  if (!isInFieldOfView(offset.deltaAz, offset.deltaAlt, fov.horizontal, fov.vertical)) {
    return false;
  }
  
  const pos = projectToCanvas(
    offset.deltaAz,
    offset.deltaAlt,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    fov.horizontal,
    fov.vertical
  );
  
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
    const offset = getViewOffset(coords, orientation.azimuth, orientation.pitch);
    
    if (isInFieldOfView(offset.deltaAz, offset.deltaAlt, fov.horizontal, fov.vertical)) {
      const pos = projectToCanvas(
        offset.deltaAz,
        offset.deltaAlt,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        fov.horizontal,
        fov.vertical
      );
      
      // Draw selection ring
      ctx.strokeStyle = 'rgba(255, 200, 50, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  // Render star name labels (with collision avoidance)
  renderStarLabels(ctx, location, orientation, fov, date);
  
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

/**
 * Render star name labels with collision avoidance
 */
function renderStarLabels(
  ctx: CanvasRenderingContext2D,
  location: GeoLocation,
  orientation: HeadOrientation,
  fov: FieldOfView,
  date: Date
): void {
  // Collect visible named stars with their positions and priority (brightness)
  const labelCandidates: Array<{
    star: Star;
    x: number;
    y: number;
    priority: number;
  }> = [];
  
  for (const star of BRIGHT_STARS) {
    // Only show names for stars with common names and brighter than magnitude 3
    if (!star.name || star.magnitude > 3.0) continue;
    
    const coords = getStarHorizontalCoords(star, location, date);
    
    // Skip stars below horizon
    if (!isAboveHorizon(coords.altitude, -5)) continue;
    
    const offset = getViewOffset(coords, orientation.azimuth, orientation.pitch);
    
    // Check if star is in field of view
    if (!isInFieldOfView(offset.deltaAz, offset.deltaAlt, fov.horizontal, fov.vertical)) {
      continue;
    }
    
    const pos = projectToCanvas(
      offset.deltaAz,
      offset.deltaAlt,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      fov.horizontal,
      fov.vertical
    );
    
    // Priority: brighter stars first (lower magnitude = higher priority)
    labelCandidates.push({
      star,
      x: pos.x,
      y: pos.y,
      priority: 10 - star.magnitude, // Sirius (-1.46) => ~11.5, mag 3 => 7
    });
  }
  
  // Sort by priority (brightest first)
  labelCandidates.sort((a, b) => b.priority - a.priority);
  
  // Place labels with collision detection
  const placedLabels: Array<{ x: number; y: number; width: number; height: number }> = [];
  const MAX_LABELS = 12; // Limit number of labels to avoid clutter
  
  ctx.font = '9px sans-serif';
  ctx.textBaseline = 'middle';
  
  let placedCount = 0;
  
  for (const candidate of labelCandidates) {
    if (placedCount >= MAX_LABELS) break;
    
    const name = candidate.star.name;
    const metrics = ctx.measureText(name);
    const textWidth = metrics.width;
    const textHeight = 9; // Approximate height for 9px font
    
    // Try positions: right, left, above, below the star
    const starRadius = getStarSize(candidate.star.magnitude);
    const margin = 4;
    
    const positions = [
      { x: candidate.x + starRadius + margin, y: candidate.y, align: 'left' as const },      // Right
      { x: candidate.x - starRadius - margin - textWidth, y: candidate.y, align: 'left' as const }, // Left
      { x: candidate.x - textWidth / 2, y: candidate.y - starRadius - margin - textHeight / 2, align: 'left' as const }, // Above
      { x: candidate.x - textWidth / 2, y: candidate.y + starRadius + margin + textHeight / 2, align: 'left' as const }, // Below
    ];
    
    for (const pos of positions) {
      // Keep within canvas bounds
      if (pos.x < 2 || pos.x + textWidth > CANVAS_WIDTH - 2) continue;
      if (pos.y - textHeight / 2 < 2 || pos.y + textHeight / 2 > CANVAS_HEIGHT - 2) continue;
      
      // Check collision with existing labels
      if (!rectOverlaps(pos.x, pos.y - textHeight / 2, textWidth, textHeight, placedLabels)) {
        // Draw label with black background for readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(pos.x - 1, pos.y - textHeight / 2 - 1, textWidth + 2, textHeight + 2);
        
        // Draw text in white
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = pos.align;
        ctx.fillText(name, pos.x, pos.y);
        
        placedLabels.push({
          x: pos.x,
          y: pos.y - textHeight / 2,
          width: textWidth,
          height: textHeight,
        });
        
        placedCount++;
        break;
      }
    }
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
  ctx.textBaseline = 'bottom';
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
  
  ctx.fillText(infoText, 5, CANVAS_HEIGHT - 5);
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
  // Get target's horizontal coordinates
  const targetCoords = getStarHorizontalCoords(
    { hr: 0, name: target.name, ra: target.ra, dec: target.dec, magnitude: target.magnitude },
    location,
    date
  );
  
  // Calculate offset from current view center
  const deltaAz = normalizeDegrees(targetCoords.azimuth - orientation.azimuth);
  const deltaAlt = targetCoords.altitude - orientation.pitch;
  
  // Normalize deltaAz to -180 to 180 range
  let adjustedDeltaAz = deltaAz;
  if (adjustedDeltaAz > 180) adjustedDeltaAz -= 360;
  if (adjustedDeltaAz < -180) adjustedDeltaAz += 360;
  
  // Calculate angle (0 = up/north, 90 = right/east, etc.)
  // In sky coords: azimuth increases eastward, altitude increases upward
  // Arrow should point FROM center TO target
  const angle = Math.atan2(adjustedDeltaAz, deltaAlt) * (180 / Math.PI);
  
  // Calculate distance in degrees
  const distance = Math.sqrt(adjustedDeltaAz * adjustedDeltaAz + deltaAlt * deltaAlt);
  
  // Check if target is in field of view
  const isInView = Math.abs(adjustedDeltaAz) <= fov.horizontal / 2 && 
                   Math.abs(deltaAlt) <= fov.vertical / 2 &&
                   targetCoords.altitude > 0;
  
  // Generate guidance text
  let guidance = '';
  if (isInView) {
    guidance = 'In view!';
  } else if (distance > 90) {
    guidance = 'Behind you';
  } else {
    // Cardinal direction guidance
    const directions = ['up', 'up-right', 'right', 'down-right', 'down', 'down-left', 'left', 'up-left'];
    const dirIndex = Math.round((angle + 180) / 45) % 8;
    guidance = `Go ${directions[dirIndex]}`;
  }
  
  return {
    angle,
    distance,
    isInView,
    guidance,
  };
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
    
    const offset = getViewOffset(targetCoords, orientation.azimuth, orientation.pitch);
    const pos = projectToCanvas(
      offset.deltaAz,
      offset.deltaAlt,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      fov.horizontal,
      fov.vertical
    );
    
    // Draw target crosshair
    ctx.strokeStyle = 'rgba(50, 255, 50, 0.9)';
    ctx.lineWidth = 2;
    const size = 15;
    
    // Crosshair
    ctx.beginPath();
    ctx.moveTo(pos.x - size, pos.y);
    ctx.lineTo(pos.x + size, pos.y);
    ctx.moveTo(pos.x, pos.y - size);
    ctx.lineTo(pos.x, pos.y + size);
    ctx.stroke();
    
    // Circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size + 5, 0, Math.PI * 2);
    ctx.stroke();
    
    // Label
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = 'rgba(50, 255, 50, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(target.name, pos.x, pos.y - size - 10);
    
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
