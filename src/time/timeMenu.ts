// Time Menu for Even Stars
// Provides a right-side overlay menu for selecting time offsets
// Similar pattern to the explain mode sidebar

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../ui/containers';

// ============================================================================
// Types
// ============================================================================

/**
 * A time preset option
 */
export interface TimePreset {
  /** Display label */
  label: string;
  /** Offset in milliseconds from current time (0 = live) */
  offsetMs: number;
}

/**
 * Time menu display state
 */
export interface TimeMenuState {
  /** Whether the time menu overlay is visible */
  isOpen: boolean;
  /** Currently highlighted item index */
  selectedIndex: number;
  /** Current active time offset in ms */
  activeOffsetMs: number;
  /** Label of the currently active preset */
  activeLabel: string;
}

// ============================================================================
// Presets
// ============================================================================

const HOUR_MS = 60 * 60 * 1000;

export const TIME_PRESETS: TimePreset[] = [
  { label: 'Live',      offsetMs: 0 },
  { label: 'In 1h',     offsetMs: 1  * HOUR_MS },
  { label: 'In 5h',     offsetMs: 5  * HOUR_MS },
  { label: 'In 12h',    offsetMs: 12 * HOUR_MS },
  { label: 'Tomorrow',  offsetMs: 24 * HOUR_MS },
];

// ============================================================================
// State management
// ============================================================================

let state: TimeMenuState = {
  isOpen: false,
  selectedIndex: 0,
  activeOffsetMs: 0,
  activeLabel: 'Live',
};

/**
 * Get the current time menu state (read-only snapshot)
 */
export function getTimeMenuState(): Readonly<TimeMenuState> {
  return state;
}

/**
 * Open the time selection overlay
 */
export function openTimeMenu(): void {
  state.isOpen = true;
  // Pre-select the currently active preset
  const idx = TIME_PRESETS.findIndex(p => p.offsetMs === state.activeOffsetMs);
  state.selectedIndex = idx >= 0 ? idx : 0;
}

/**
 * Close the time selection overlay without changing offset
 */
export function closeTimeMenu(): void {
  state.isOpen = false;
}

/**
 * Move selection up in the time menu
 */
export function timeMenuSelectPrev(): void {
  if (!state.isOpen) return;
  state.selectedIndex =
    (state.selectedIndex - 1 + TIME_PRESETS.length) % TIME_PRESETS.length;
}

/**
 * Move selection down in the time menu
 */
export function timeMenuSelectNext(): void {
  if (!state.isOpen) return;
  state.selectedIndex = (state.selectedIndex + 1) % TIME_PRESETS.length;
}

/**
 * Confirm the currently highlighted preset.
 * Returns the new offset in ms, or null if menu wasn't open.
 */
export function timeMenuConfirm(): number | null {
  if (!state.isOpen) return null;
  const preset = TIME_PRESETS[state.selectedIndex];
  state.activeOffsetMs = preset.offsetMs;
  state.activeLabel = preset.label;
  state.isOpen = false;
  return preset.offsetMs;
}

/**
 * Get the effective Date to use for sky calculations.
 * Applies the current time offset to `now`.
 */
export function getEffectiveDate(): Date {
  return new Date(Date.now() + state.activeOffsetMs);
}

/**
 * Check if time menu is currently open
 */
export function isTimeMenuOpen(): boolean {
  return state.isOpen;
}

/**
 * Reset time menu to defaults (live, closed)
 */
export function resetTimeMenu(): void {
  state = {
    isOpen: false,
    selectedIndex: 0,
    activeOffsetMs: 0,
    activeLabel: 'Live',
  };
}

// ============================================================================
// Renderer
// ============================================================================

/** Menu panel dimensions (right side, similar to explain sidebar) */
const PANEL_WIDTH = Math.floor(CANVAS_WIDTH / 3); // 192px
const PANEL_X = CANVAS_WIDTH - PANEL_WIDTH;
const PANEL_Y = 0;
const PANEL_BOTTOM = CANVAS_HEIGHT - 40; // leave room for bottom menu bar
const PANEL_PAD = 8;

const FONT_TITLE = 'bold 12px sans-serif';
const FONT_ITEM = '12px sans-serif';
const LINE_HEIGHT = 22;
const ITEM_RADIUS = 3;

const COLOR_BG = 'rgba(0, 0, 0, 0.95)';
const COLOR_BORDER = 'rgba(255, 255, 255, 0.3)';
const COLOR_TEXT = 'rgba(255, 255, 255, 0.9)';
const COLOR_DIM = 'rgba(255, 255, 255, 0.5)';
const COLOR_SELECTED_BG = 'rgba(255, 255, 255, 0.15)';
const COLOR_ACTIVE_DOT = 'rgba(255, 255, 100, 0.9)';

/**
 * Render the time menu overlay onto the sky canvas.
 * Called AFTER the sky has been rendered, if the menu is open.
 */
export function renderTimeMenuOverlay(ctx: CanvasRenderingContext2D): void {
  if (!state.isOpen) return;

  const panelHeight = PANEL_BOTTOM - PANEL_Y;

  ctx.save();

  // ── Background ──
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(PANEL_X, PANEL_Y, PANEL_WIDTH, panelHeight);

  // Left edge line
  ctx.strokeStyle = COLOR_BORDER;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(PANEL_X, PANEL_Y);
  ctx.lineTo(PANEL_X, PANEL_BOTTOM);
  ctx.stroke();

  // ── Title ──
  ctx.font = FONT_TITLE;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOR_DIM;

  const titleY = PANEL_Y + PANEL_PAD + 8;
  ctx.fillText('Time', PANEL_X + PANEL_PAD, titleY);

  // Separator line under title
  const sepY = titleY + 12;
  ctx.strokeStyle = COLOR_BORDER;
  ctx.beginPath();
  ctx.moveTo(PANEL_X + PANEL_PAD, sepY);
  ctx.lineTo(PANEL_X + PANEL_WIDTH - PANEL_PAD, sepY);
  ctx.stroke();

  // ── Items ──
  ctx.font = FONT_ITEM;
  const startY = sepY + 10;

  TIME_PRESETS.forEach((preset, index) => {
    const itemY = startY + index * LINE_HEIGHT;
    const isSelected = index === state.selectedIndex;
    const isActive = preset.offsetMs === state.activeOffsetMs;

    // Highlight background for selected item
    if (isSelected) {
      ctx.fillStyle = COLOR_SELECTED_BG;
      ctx.beginPath();
      ctx.roundRect(
        PANEL_X + PANEL_PAD - 2,
        itemY - LINE_HEIGHT / 2 + 4,
        PANEL_WIDTH - PANEL_PAD * 2 + 4,
        LINE_HEIGHT - 2,
        ITEM_RADIUS,
      );
      ctx.fill();
    }

    // Active dot (indicates currently applied preset)
    if (isActive) {
      ctx.fillStyle = COLOR_ACTIVE_DOT;
      ctx.beginPath();
      ctx.arc(PANEL_X + PANEL_PAD + 4, itemY + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Label text
    ctx.fillStyle = isSelected ? COLOR_TEXT : COLOR_DIM;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const textX = PANEL_X + PANEL_PAD + (isActive ? 14 : 14);
    ctx.fillText(preset.label, textX, itemY + 4);
  });

  ctx.restore();
}

/**
 * Get the display label for the Time menu item.
 * Returns the preset label (e.g. "In 5h") when a non-live offset is active,
 * or "Time" when live.
 */
export function getTimeMenuDisplayLabel(): string {
  if (state.activeOffsetMs === 0) return 'Time';
  return state.activeLabel;
}
