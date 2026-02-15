// Find Target Overlay Renderer
// Renders the speech-to-text text area on the bottom 1/3 of the glasses display

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../ui/containers';

// ============================================================================
// Layout constants
// ============================================================================

/** Bottom 1/3 of the screen */
const OVERLAY_HEIGHT = Math.floor(CANVAS_HEIGHT / 3); // 96px
const OVERLAY_Y = CANVAS_HEIGHT - OVERLAY_HEIGHT;     // 192px
const OVERLAY_X = 0;
const OVERLAY_WIDTH = CANVAS_WIDTH; // 576px full width

/** Inner padding */
const PAD_X = 10;
const PAD_Y = 8;

/** Text area dimensions */
const TEXT_AREA_X = OVERLAY_X + PAD_X;
const TEXT_AREA_Y = OVERLAY_Y + PAD_Y;
const TEXT_AREA_WIDTH = OVERLAY_WIDTH - PAD_X * 2;

// ============================================================================
// Fonts & colors
// ============================================================================

const FONT_TRANSCRIPT = '14px sans-serif';
const FONT_HINT = '11px sans-serif';
const FONT_STATUS = 'bold 10px sans-serif';

const COLOR_BG = 'rgba(0, 0, 0, 0.85)';
const COLOR_BORDER = 'rgba(255, 255, 255, 0.3)';
const COLOR_TEXT = 'rgba(255, 255, 255, 0.95)';
const COLOR_HINT = 'rgba(255, 255, 255, 0.5)';
const COLOR_LISTENING = 'rgba(255, 100, 100, 0.9)';
const COLOR_PROCESSING = 'rgba(255, 200, 50, 0.9)';
const COLOR_MATCH = 'rgba(100, 255, 100, 0.9)';
const COLOR_ERROR = 'rgba(255, 80, 80, 0.9)';

// ============================================================================
// Display state
// ============================================================================

export enum FindTargetOverlayState {
  /** Waiting for user to activate (click) */
  Idle = 'idle',
  /** Listening for voice input */
  Listening = 'listening',
  /** Sending audio to API */
  Processing = 'processing',
  /** Local match failed, asking AI to identify the object */
  SearchingAI = 'searching_ai',
  /** Object matched successfully */
  Matched = 'matched',
  /** No match found */
  NoMatch = 'no_match',
  /** Error occurred */
  Error = 'error',
  /** No API key configured */
  NoApiKey = 'no_api_key',
  /** AI returned multiple candidates — user must pick one */
  SelectFromList = 'select_from_list',
}

export interface FindTargetOverlayData {
  state: FindTargetOverlayState;
  /** Live transcription text */
  transcription: string;
  /** Matched object name (if matched) */
  matchedName: string | null;
  /** Error message */
  errorMessage: string | null;
  /** Candidate names for SelectFromList state */
  candidateNames?: string[];
  /** Currently highlighted candidate index */
  selectedCandidateIndex?: number;
  /** When true, the idle-state hint text is hidden (user has used the feature enough) */
  hideIdleHint?: boolean;
}

// ============================================================================
// Main render function
// ============================================================================

/**
 * Render the Find Target speech overlay on the bottom 1/3 of the canvas.
 * Call this AFTER the sky and menu have been rendered.
 */
export function renderFindTargetOverlay(
  ctx: CanvasRenderingContext2D,
  data: FindTargetOverlayData,
): void {
  ctx.save();

  // Draw background
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(OVERLAY_X, OVERLAY_Y, OVERLAY_WIDTH, OVERLAY_HEIGHT);

  // Draw top border line
  ctx.strokeStyle = COLOR_BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(OVERLAY_X, OVERLAY_Y);
  ctx.lineTo(OVERLAY_X + OVERLAY_WIDTH, OVERLAY_Y);
  ctx.stroke();

  switch (data.state) {
    case FindTargetOverlayState.Idle:
      renderIdleState(ctx, data.hideIdleHint);
      break;
    case FindTargetOverlayState.NoApiKey:
      renderNoApiKeyState(ctx);
      break;
    case FindTargetOverlayState.Listening:
      renderListeningState(ctx, data.transcription);
      break;
    case FindTargetOverlayState.Processing:
      renderProcessingState(ctx, data.transcription);
      break;
    case FindTargetOverlayState.SearchingAI:
      renderSearchingAIState(ctx, data.transcription);
      break;
    case FindTargetOverlayState.Matched:
      renderMatchedState(ctx, data.transcription, data.matchedName);
      break;
    case FindTargetOverlayState.NoMatch:
      renderNoMatchState(ctx, data.transcription);
      break;
    case FindTargetOverlayState.Error:
      renderErrorState(ctx, data.errorMessage);
      break;
    case FindTargetOverlayState.SelectFromList:
      renderSelectFromListState(
        ctx,
        data.candidateNames || [],
        data.selectedCandidateIndex ?? 0,
      );
      break;
  }

  ctx.restore();
}

// ============================================================================
// State renderers
// ============================================================================

function renderIdleState(ctx: CanvasRenderingContext2D, hideHint?: boolean): void {
  if (hideHint) return; // User has used the feature enough — skip the hint

  ctx.font = FONT_HINT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOR_HINT;
  ctx.fillText(
    'Click to search by voice',
    OVERLAY_X + OVERLAY_WIDTH / 2,
    OVERLAY_Y + OVERLAY_HEIGHT / 2,
  );
}

function renderNoApiKeyState(ctx: CanvasRenderingContext2D): void {
  ctx.font = FONT_HINT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOR_ERROR;
  ctx.fillText(
    'Set OpenAI API key in Settings',
    OVERLAY_X + OVERLAY_WIDTH / 2,
    OVERLAY_Y + OVERLAY_HEIGHT / 2,
  );
}

function renderListeningState(ctx: CanvasRenderingContext2D, text: string): void {
  // Status indicator
  renderStatusBadge(ctx, '● LISTENING', COLOR_LISTENING);

  // Animated mic indicator
  const dotCount = (Math.floor(Date.now() / 400) % 3) + 1;
  const dots = '·'.repeat(dotCount);

  // Transcription text or placeholder
  ctx.font = FONT_TRANSCRIPT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  if (text) {
    ctx.fillStyle = COLOR_TEXT;
    wrapText(ctx, text, TEXT_AREA_X, TEXT_AREA_Y + 18, TEXT_AREA_WIDTH, 16);
  } else {
    ctx.fillStyle = COLOR_HINT;
    ctx.fillText(`Speak a star or object name${dots}`, TEXT_AREA_X, TEXT_AREA_Y + 18);
  }
}

function renderProcessingState(ctx: CanvasRenderingContext2D, text: string): void {
  renderStatusBadge(ctx, '◉ PROCESSING', COLOR_PROCESSING);

  ctx.font = FONT_TRANSCRIPT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLOR_TEXT;

  if (text) {
    wrapText(ctx, text, TEXT_AREA_X, TEXT_AREA_Y + 18, TEXT_AREA_WIDTH, 16);
  }
}

function renderMatchedState(
  ctx: CanvasRenderingContext2D,
  text: string,
  matchedName: string | null,
): void {
  renderStatusBadge(ctx, `★ ${matchedName || 'FOUND'}`, COLOR_MATCH);

  ctx.font = FONT_TRANSCRIPT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLOR_TEXT;

  if (text) {
    wrapText(ctx, `"${text}"`, TEXT_AREA_X, TEXT_AREA_Y + 18, TEXT_AREA_WIDTH, 16);
  }

  // Hint at bottom
  ctx.font = FONT_HINT;
  ctx.fillStyle = COLOR_HINT;
  ctx.textAlign = 'center';
  ctx.fillText(
    'Click to search again · Double-click to cancel',
    OVERLAY_X + OVERLAY_WIDTH / 2,
    OVERLAY_Y + OVERLAY_HEIGHT - PAD_Y - 4,
  );
}

function renderSearchingAIState(ctx: CanvasRenderingContext2D, text: string): void {
  const dotCount = (Math.floor(Date.now() / 500) % 3) + 1;
  const dots = '.'.repeat(dotCount);
  renderStatusBadge(ctx, `🤖 ASKING AI${dots}`, COLOR_PROCESSING);

  ctx.font = FONT_TRANSCRIPT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLOR_TEXT;

  if (text) {
    wrapText(ctx, `"${text}"`, TEXT_AREA_X, TEXT_AREA_Y + 18, TEXT_AREA_WIDTH, 16);
  }

  ctx.font = FONT_HINT;
  ctx.fillStyle = COLOR_HINT;
  ctx.textAlign = 'center';
  ctx.fillText(
    'Not in catalog — querying AI...',
    OVERLAY_X + OVERLAY_WIDTH / 2,
    OVERLAY_Y + OVERLAY_HEIGHT - PAD_Y - 4,
  );
}

function renderNoMatchState(ctx: CanvasRenderingContext2D, text: string): void {
  renderStatusBadge(ctx, '✕ NO MATCH', COLOR_ERROR);

  ctx.font = FONT_TRANSCRIPT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLOR_HINT;
  wrapText(ctx, `"${text}"`, TEXT_AREA_X, TEXT_AREA_Y + 18, TEXT_AREA_WIDTH, 16);

  ctx.font = FONT_HINT;
  ctx.fillStyle = COLOR_HINT;
  ctx.textAlign = 'center';
  ctx.fillText(
    'Click to try again',
    OVERLAY_X + OVERLAY_WIDTH / 2,
    OVERLAY_Y + OVERLAY_HEIGHT - PAD_Y - 4,
  );
}

function renderErrorState(ctx: CanvasRenderingContext2D, errorMsg: string | null): void {
  renderStatusBadge(ctx, '⚠ ERROR', COLOR_ERROR);

  ctx.font = FONT_HINT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLOR_ERROR;
  wrapText(
    ctx,
    errorMsg || 'Unknown error',
    TEXT_AREA_X,
    TEXT_AREA_Y + 18,
    TEXT_AREA_WIDTH,
    14,
  );

  ctx.fillStyle = COLOR_HINT;
  ctx.textAlign = 'center';
  ctx.fillText(
    'Click to retry',
    OVERLAY_X + OVERLAY_WIDTH / 2,
    OVERLAY_Y + OVERLAY_HEIGHT - PAD_Y - 4,
  );
}

// ============================================================================
// Select-from-list renderer (uses FULL screen, not just bottom overlay)
// ============================================================================

const LIST_FONT = 'bold 13px sans-serif';
const LIST_HINT_FONT = '10px sans-serif';
const LIST_LINE_HEIGHT = 22;
const LIST_PAD = 8;
const LIST_HIGHLIGHT_COLOR = 'rgba(100, 255, 100, 0.95)';
const LIST_NORMAL_COLOR = 'rgba(255, 255, 255, 0.6)';
const LIST_BG = 'rgba(0, 0, 0, 0.92)';
const LIST_HIGHLIGHT_BG = 'rgba(100, 255, 100, 0.15)';

/**
 * Render a centered selection list covering most of the screen.
 * The list is drawn on top of everything else.
 */
function renderSelectFromListState(
  ctx: CanvasRenderingContext2D,
  names: string[],
  selectedIndex: number,
): void {
  if (names.length === 0) return;

  // Determine list panel geometry — centered on the full canvas
  const maxVisibleItems = Math.min(names.length, 10);
  const listContentHeight = maxVisibleItems * LIST_LINE_HEIGHT;
  const headerHeight = 20; // "Select an object" title
  const footerHeight = 16; // scroll/confirm hint
  const panelHeight = headerHeight + listContentHeight + footerHeight + LIST_PAD * 3;
  const panelWidth = Math.min(CANVAS_WIDTH - 20, 440);
  const panelX = Math.floor((CANVAS_WIDTH - panelWidth) / 2);
  const panelY = Math.floor((CANVAS_HEIGHT - panelHeight) / 2);

  // Background
  ctx.fillStyle = LIST_BG;
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

  // Border
  ctx.strokeStyle = COLOR_BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

  // Header
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLOR_HINT;
  ctx.fillText('Select an object', panelX + panelWidth / 2, panelY + LIST_PAD);

  // List items — scroll window so the selected item is always visible
  const listStartY = panelY + LIST_PAD + headerHeight;
  const maxVisible = Math.floor(
    (panelHeight - headerHeight - footerHeight - LIST_PAD * 3) / LIST_LINE_HEIGHT,
  );

  // Determine scroll offset so selectedIndex stays visible
  let scrollOffset = 0;
  if (names.length > maxVisible) {
    // Keep selected item roughly centered, clamped to bounds
    scrollOffset = Math.max(
      0,
      Math.min(selectedIndex - Math.floor(maxVisible / 2), names.length - maxVisible),
    );
  }

  ctx.textAlign = 'left';
  for (let i = 0; i < maxVisible && scrollOffset + i < names.length; i++) {
    const itemIndex = scrollOffset + i;
    const y = listStartY + i * LIST_LINE_HEIGHT;

    if (itemIndex === selectedIndex) {
      // Highlight bar
      ctx.fillStyle = LIST_HIGHLIGHT_BG;
      ctx.fillRect(panelX + 4, y - 1, panelWidth - 8, LIST_LINE_HEIGHT);
      ctx.fillStyle = LIST_HIGHLIGHT_COLOR;
      ctx.font = LIST_FONT;
      ctx.fillText(`▸ ${names[itemIndex]}`, panelX + LIST_PAD + 4, y + 4);
    } else {
      ctx.fillStyle = LIST_NORMAL_COLOR;
      ctx.font = '12px sans-serif';
      ctx.fillText(`  ${names[itemIndex]}`, panelX + LIST_PAD + 4, y + 4);
    }
  }

  // Scroll indicators
  if (scrollOffset > 0) {
    ctx.fillStyle = COLOR_HINT;
    ctx.textAlign = 'right';
    ctx.font = '10px sans-serif';
    ctx.fillText('▲', panelX + panelWidth - LIST_PAD, listStartY + 4);
  }
  if (scrollOffset + maxVisible < names.length) {
    ctx.fillStyle = COLOR_HINT;
    ctx.textAlign = 'right';
    ctx.font = '10px sans-serif';
    ctx.fillText(
      '▼',
      panelX + panelWidth - LIST_PAD,
      listStartY + (maxVisible - 1) * LIST_LINE_HEIGHT + 4,
    );
  }

  // Footer hint
  ctx.font = LIST_HINT_FONT;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLOR_HINT;
  ctx.fillText(
    'Scroll to browse · Click to confirm · 2×Click to cancel',
    panelX + panelWidth / 2,
    panelY + panelHeight - LIST_PAD - 2,
  );
}

// ============================================================================
// Helpers
// ============================================================================

/** Render a small status badge at the top of the overlay */
function renderStatusBadge(
  ctx: CanvasRenderingContext2D,
  label: string,
  color: string,
): void {
  ctx.font = FONT_STATUS;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  ctx.fillText(label, TEXT_AREA_X, TEXT_AREA_Y + 2);
}

/** Simple word-wrap for canvas text */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;

      // Stop if we'd overflow the text area
      if (currentY > OVERLAY_Y + OVERLAY_HEIGHT - PAD_Y - 16) {
        ctx.fillText(line + '…', x, currentY);
        return;
      }
    } else {
      line = testLine;
    }
  }

  if (line) {
    ctx.fillText(line, x, currentY);
  }
}
