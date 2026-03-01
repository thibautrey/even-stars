import type { CompassState, HorizontalCoords } from '../types';
import type { SearchableObject } from '../types/search';
import { getStarHorizontalCoords, gnomonicProject, normalizeDegrees } from './calculator';
import { BRIGHT_STARS } from './stars';

interface TextGridConfig {
  cols: number;
  rows: number;
}

const DEFAULT_GRID: TextGridConfig = {
  cols: 48,
  rows: 16,
};

const SKY_FOV = {
  horizontal: 25,
  vertical: 25 * (200 / 640),
};

interface UnicodeSkyRenderOptions {
  state: CompassState;
  date: Date;
  menuLabels: string[];
  selectedMenuIndex: number;
  finderTarget?: SearchableObject | null;
}

function createGrid(cols: number, rows: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ' '));
}

function setGrid(grid: string[][], x: number, y: number, ch: string): void {
  if (y < 0 || y >= grid.length) return;
  if (x < 0 || x >= grid[0].length) return;
  grid[y][x] = ch;
}

function putText(grid: string[][], x: number, y: number, text: string): void {
  for (let i = 0; i < text.length; i += 1) {
    setGrid(grid, x + i, y, text[i]);
  }
}

function projectToGrid(
  coords: HorizontalCoords,
  state: CompassState,
  cols: number,
  rows: number,
): { x: number; y: number } | null {
  const proj = gnomonicProject(coords, state.orientation, SKY_FOV, cols, rows);
  if (!proj.visible) return null;

  const gx = Math.max(0, Math.min(cols - 1, Math.round(proj.x)));
  const gy = Math.max(0, Math.min(rows - 1, Math.round(proj.y)));
  return { x: gx, y: gy };
}

function glyphForMagnitude(magnitude: number): string {
  if (magnitude <= 0) return '*';
  if (magnitude <= 1.5) return '+';
  if (magnitude <= 3) return 'o';
  return '.';
}

function cardinalLabel(azimuth: number): string {
  const az = normalizeDegrees(azimuth);
  if (az >= 337.5 || az < 22.5) return 'N';
  if (az < 67.5) return 'NE';
  if (az < 112.5) return 'E';
  if (az < 157.5) return 'SE';
  if (az < 202.5) return 'S';
  if (az < 247.5) return 'SW';
  if (az < 292.5) return 'W';
  return 'NW';
}

function menuLine(labels: string[], selectedIndex: number): string {
  return labels
    .map((label, idx) => (idx === selectedIndex ? `[${label}]` : ` ${label} `))
    .join(' | ');
}

function fitLine(text: string, width: number): string {
  if (text.length <= width) return text;
  if (width <= 3) return text.slice(0, width);
  return `${text.slice(0, width - 3)}...`;
}

function targetGuidance(target: SearchableObject | null | undefined, state: CompassState): string {
  if (!target) return '';

  const azDelta = normalizeDegrees(target.ra * 15 - state.orientation.azimuth);
  const shortDelta = azDelta > 180 ? azDelta - 360 : azDelta;
  const turn = shortDelta > 5 ? '->' : shortDelta < -5 ? '<-' : '^';
  return `${turn} ${target.name}`;
}

export function renderUnicodeSky(options: UnicodeSkyRenderOptions): string {
  const { state, date, menuLabels, selectedMenuIndex, finderTarget } = options;
  if (!state.location) {
    return 'Waiting for location...';
  }

  const { cols, rows } = DEFAULT_GRID;
  const grid = createGrid(cols, rows);

  const horizonRow = Math.min(rows - 2, Math.floor(rows * 0.72));
  for (let x = 0; x < cols; x += 1) {
    setGrid(grid, x, horizonRow, '-');
  }

  let visibleStars = 0;

  for (const star of BRIGHT_STARS) {
    const coords = getStarHorizontalCoords(star, state.location, date);
    if (coords.altitude < -2) continue;

    const pos = projectToGrid(coords, state, cols, rows);
    if (!pos) continue;

    setGrid(grid, pos.x, pos.y, glyphForMagnitude(star.magnitude));
    visibleStars += 1;
  }

  setGrid(grid, Math.floor(cols / 2), Math.floor(rows / 2), 'O');

  const heading = `AZ ${Math.round(normalizeDegrees(state.orientation.azimuth))}° ${cardinalLabel(state.orientation.azimuth)}`;
  const pitch = `ALT ${Math.round(state.orientation.pitch)}°`;
  const topLine = fitLine(`${heading}  ${pitch}`, cols);
  putText(grid, 0, 0, topLine);

  const targetLine = targetGuidance(finderTarget, state);
  if (targetLine) {
    putText(grid, 0, 1, fitLine(targetLine, cols));
  }

  const footer = fitLine(`Visible stars: ${visibleStars}`, cols);
  putText(grid, 0, rows - 1, footer);

  const lines = grid.map((row) => row.join(''));
  lines.push(fitLine(menuLine(menuLabels, selectedMenuIndex), cols));

  return lines.join('\n');
}
