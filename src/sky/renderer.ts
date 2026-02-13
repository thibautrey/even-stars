// Sky chart renderer - draws stars and constellations on the glasses display

import type { 
  Star, 
  Constellation, 
  GeoLocation, 
  HeadOrientation, 
  HorizontalCoords,
  FieldOfView,
} from '../types';
import { ViewMode } from '../types';
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
}

export function renderSky(options: SkyRenderOptions): {
  visibleStars: number;
  visibleConstellations: number;
} {
  return renderSkyToBuffer(options);
}

/**
 * Render sky to an offscreen buffer (for glasses display)
 */
export function renderSkyToBuffer(options: SkyRenderOptions): {
  visibleStars: number;
  visibleConstellations: number;
} {
  const {
    ctx,
    location,
    orientation,
    viewMode,
    fov = DEFAULT_FOV,
    date = new Date(),
    selectedStar = null,
  } = options;
  
  // Clear canvas with BLACK background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Render horizon first (behind everything)
  renderHorizon(ctx, orientation, fov);
  
  let visibleConstellations = 0;
  
  // Render constellations first (so they appear behind stars)
  if (viewMode === ViewMode.Constellations || viewMode === ViewMode.Stars) {
    for (const constellation of CONSTELLATIONS) {
      renderConstellation(ctx, constellation, location, orientation, fov, date);
      visibleConstellations++;
    }
  }
  
  // Render stars
  let visibleStars = 0;
  for (const star of BRIGHT_STARS) {
    const coords = getStarHorizontalCoords(star, location, date);
    
    // Skip stars below horizon (with 5 degree margin)
    if (!isAboveHorizon(coords.altitude, -5)) continue;
    
    const wasRendered = renderStar(ctx, star, coords, orientation, fov);
    if (wasRendered) visibleStars++;
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
  
  // Render debug/info overlay
  renderInfoOverlay(ctx, location, orientation, visibleStars, viewMode);
  
  return { visibleStars, visibleConstellations };
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
  location: GeoLocation,
  orientation: HeadOrientation,
  visibleStars: number,
  viewMode: ViewMode
): void {
  // location and viewMode unused but kept for API consistency
  void location;
  void viewMode;
  // Simplified for small glasses display - just show direction
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const cardinal = cardinals[Math.round(orientation.azimuth / 45) % 8];
  
  ctx.font = '8px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  
  ctx.fillText(
    `${cardinal} ${orientation.azimuth.toFixed(0)}° | ${visibleStars} stars`,
    5, CANVAS_HEIGHT - 5
  );
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

export { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_FOV };
