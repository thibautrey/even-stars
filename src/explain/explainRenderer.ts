// Explain Mode Renderer for Even Stars
// Renders the banner + auto-scrolling sidebar on the glasses canvas

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../ui/containers';
import type { ExplainDisplay } from './explainMode';
import { ExplainState, getExplainManager } from './explainMode';

// ============================================================================
// Layout constants
// ============================================================================

/** Banner height in pixels */
const BANNER_HEIGHT = 26;
/** Banner Y position (top of screen) */
const BANNER_Y = 0;
/** Banner left padding */
const BANNER_PAD_LEFT = 6;

/** Sidebar width = ~1/3 of screen */
const SIDEBAR_WIDTH = Math.floor(CANVAS_WIDTH / 3); // 192px
/** Sidebar X position (right edge) */
const SIDEBAR_X = CANVAS_WIDTH - SIDEBAR_WIDTH;
/** Sidebar starts below banner */
const SIDEBAR_Y = BANNER_HEIGHT + 2;
/** Sidebar extends to screen bottom minus menu area */
const SIDEBAR_BOTTOM = CANVAS_HEIGHT - 40; // leave room for menu
/** Sidebar inner padding */
const SIDEBAR_PAD = 6;

// ============================================================================
// Fonts & colors
// ============================================================================

const FONT_BANNER_NAME = 'bold 14px sans-serif';
const FONT_BANNER_STATS = '10px sans-serif';
const FONT_SIDEBAR = '10px sans-serif';
const FONT_SCANNING = 'bold 12px sans-serif';

const COLOR_WHITE = 'rgba(255, 255, 255, 0.95)';
const COLOR_DIM = 'rgba(255, 255, 255, 0.6)';
const COLOR_DIMMER = 'rgba(255, 255, 255, 0.4)';
const COLOR_LOCK_BORDER = 'rgba(255, 255, 100, 0.5)';

// ============================================================================
// Main render function
// ============================================================================

/**
 * Render the Explain mode overlay onto the sky canvas.
 * This is called AFTER the sky has been rendered, so it draws on top.
 *
 * @param ctx - Canvas 2D context (576x288)
 * @param display - Current explain mode display state
 */
export function renderExplainOverlay(
  ctx: CanvasRenderingContext2D,
  display: ExplainDisplay,
): void {
  if (display.state === ExplainState.Scanning) {
    renderScanningState(ctx);
    return;
  }

  // Draw banner
  if (display.banner) {
    renderBanner(ctx, display);
  }

  // Draw sidebar
  if (display.sidebar) {
    renderSidebar(ctx, display);
  }
}

// ============================================================================
// Scanning state
// ============================================================================

function renderScanningState(ctx: CanvasRenderingContext2D): void {
  // Subtle centered text
  ctx.save();
  ctx.font = FONT_SCANNING;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOR_DIM;

  // Animate dots based on time
  const dotCount = (Math.floor(Date.now() / 500) % 3) + 1;
  const dots = '.'.repeat(dotCount);
  ctx.fillText(`Looking${dots}`, CANVAS_WIDTH / 2, 14);
  ctx.restore();
}

// ============================================================================
// Banner
// ============================================================================

function renderBanner(
  ctx: CanvasRenderingContext2D,
  display: ExplainDisplay,
): void {
  const banner = display.banner!;

  ctx.save();

  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, BANNER_Y, CANVAS_WIDTH, BANNER_HEIGHT);

  // Bottom edge line
  ctx.strokeStyle = COLOR_DIMMER;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, BANNER_Y + BANNER_HEIGHT);
  ctx.lineTo(CANVAS_WIDTH, BANNER_Y + BANNER_HEIGHT);
  ctx.stroke();

  // Symbol + Name (left aligned)
  const nameText = `${banner.symbol} ${banner.name}`;
  ctx.font = FONT_BANNER_NAME;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOR_WHITE;
  const bannerMidY = BANNER_Y + BANNER_HEIGHT / 2;
  ctx.fillText(nameText, BANNER_PAD_LEFT, bannerMidY);

  // Stats (right of name, or right-aligned)
  if (banner.stats) {
    const nameWidth = ctx.measureText(nameText).width;
    ctx.font = FONT_BANNER_STATS;
    ctx.fillStyle = COLOR_DIM;

    // If stats fit after name, place them there
    const statsX = BANNER_PAD_LEFT + nameWidth + 12;
    const statsWidth = ctx.measureText(banner.stats).width;
    
    if (statsX + statsWidth < CANVAS_WIDTH - 40) {
      ctx.textAlign = 'left';
      ctx.fillText(banner.stats, statsX, bannerMidY);
    } else {
      // Right-align
      ctx.textAlign = 'right';
      ctx.fillText(banner.stats, CANVAS_WIDTH - 6, bannerMidY);
    }
  }

  ctx.restore();
}

// ============================================================================
// Sidebar
// ============================================================================

/**
 * Word-wrap text to fit within a given pixel width.
 * Returns an array of lines.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  // Split on explicit newlines first
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push(''); // Preserve empty lines as spacing
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function renderSidebar(
  ctx: CanvasRenderingContext2D,
  display: ExplainDisplay,
): void {
  const sidebar = display.sidebar!;
  const sidebarHeight = SIDEBAR_BOTTOM - SIDEBAR_Y;
  const textAreaWidth = SIDEBAR_WIDTH - SIDEBAR_PAD * 2;

  ctx.save();

  // Sidebar background
  ctx.fillStyle = '#000000';
  ctx.fillRect(SIDEBAR_X, SIDEBAR_Y, SIDEBAR_WIDTH, sidebarHeight);

  // Left edge line
  ctx.strokeStyle = display.isLocked ? COLOR_LOCK_BORDER : COLOR_DIMMER;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(SIDEBAR_X, SIDEBAR_Y);
  ctx.lineTo(SIDEBAR_X, SIDEBAR_BOTTOM);
  ctx.stroke();

  // Prepare text
  ctx.font = FONT_SIDEBAR;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const wrappedLines = wrapText(ctx, sidebar.text, textAreaWidth);
  const lineHeight = 13; // 10px font + 3px spacing
  const totalTextHeight = wrappedLines.length * lineHeight;

  // Update the manager with accurate text height
  getExplainManager().setTotalTextHeight(totalTextHeight);

  // Clip to sidebar area
  ctx.beginPath();
  ctx.rect(SIDEBAR_X, SIDEBAR_Y, SIDEBAR_WIDTH, sidebarHeight);
  ctx.clip();

  // Draw text with scroll offset
  const textX = SIDEBAR_X + SIDEBAR_PAD;
  const textStartY = SIDEBAR_Y + SIDEBAR_PAD - sidebar.scrollOffset;

  for (let i = 0; i < wrappedLines.length; i++) {
    const lineY = textStartY + i * lineHeight;

    // Skip lines above visible area
    if (lineY + lineHeight < SIDEBAR_Y) continue;
    // Stop drawing below visible area
    if (lineY > SIDEBAR_BOTTOM) break;

    // Fade lines near edges for smooth scroll feel
    let alpha = 0.9;
    const distFromTop = lineY - SIDEBAR_Y;
    const distFromBottom = SIDEBAR_BOTTOM - (lineY + lineHeight);

    if (distFromTop < 15) {
      alpha *= Math.max(0, distFromTop / 15);
    }
    if (distFromBottom < 15) {
      alpha *= Math.max(0, distFromBottom / 15);
    }

    ctx.fillStyle = wrappedLines[i] === '' 
      ? 'transparent' 
      : `rgba(255, 255, 255, ${alpha})`;
    ctx.fillText(wrappedLines[i], textX, lineY);
  }

  // Draw subtle scroll indicator if text overflows
  if (totalTextHeight > sidebarHeight) {
    const scrollRatio = sidebar.scrollOffset / Math.max(1, totalTextHeight - sidebarHeight + 20);
    const indicatorTrackH = sidebarHeight - 8;
    const indicatorH = Math.max(10, (sidebarHeight / totalTextHeight) * indicatorTrackH);
    const indicatorY = SIDEBAR_Y + 4 + scrollRatio * (indicatorTrackH - indicatorH);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(
      SIDEBAR_X + SIDEBAR_WIDTH - 3,
      indicatorY,
      2,
      indicatorH,
    );
  }

  ctx.restore();
}
