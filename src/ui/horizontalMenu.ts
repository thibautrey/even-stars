// Horizontal Menu Image Renderer for Even Glasses
// Displays menu items horizontally with inverted colors for selected item

import { 
  MENU_HEIGHT, 
  MENU_Y_POSITION,
  SINGLE_MENU_WIDTH,
} from './containers';

// Menu appearance constants
const MENU_ITEM_PADDING = 8;
const MENU_BORDER_RADIUS = 3;
const MENU_FONT_SIZE = 12;
const MENU_FONT_FAMILY = 'sans-serif';

// Colors (grayscale for glasses display)
const COLOR_BORDER = 100;       // Gray border for unselected items

/**
 * Menu item definition
 */
export interface HorizontalMenuItem {
  id: string;
  label: string;
}

/**
 * Menu state
 */
export interface HorizontalMenuState {
  items: HorizontalMenuItem[];
  selectedIndex: number;
}

/**
 * Calculate the width needed for each menu item
 * Distributes available width evenly among items
 */
function calculateItemWidths(
  items: HorizontalMenuItem[],
  totalWidth: number,
  padding: number
): number[] {
  const itemCount = items.length;
  if (itemCount === 0) return [];
  
  // Available width after padding between items
  const availableWidth = totalWidth - (padding * (itemCount + 1));
  const itemWidth = Math.floor(availableWidth / itemCount);
  
  // Distribute any remainder to the last item
  const widths = items.map(() => itemWidth);
  const remainder = availableWidth - (itemWidth * itemCount);
  if (remainder > 0 && widths.length > 0) {
    widths[widths.length - 1] += remainder;
  }
  
  return widths;
}

/**
 * Render a horizontal menu to a canvas context
 * 
 * @param ctx - Canvas context to render to
 * @param state - Current menu state
 * @param x - X position (default: 8 for margin)
 * @param y - Y position (default: MENU_Y_POSITION)
 * @param width - Total menu width (default: SINGLE_MENU_WIDTH)
 * @param height - Menu height (default: MENU_HEIGHT)
 */
export function renderHorizontalMenu(
  ctx: CanvasRenderingContext2D,
  state: HorizontalMenuState,
  x: number = 8,
  y: number = MENU_Y_POSITION,
  width: number = SINGLE_MENU_WIDTH,
  height: number = MENU_HEIGHT
): void {
  const { items, selectedIndex } = state;
  
  if (items.length === 0) return;
  
  // Clear the menu area (black background)
  ctx.fillStyle = '#000000';
  ctx.fillRect(x, y, width, height);
  
  // Calculate item widths
  const itemWidths = calculateItemWidths(items, width, MENU_ITEM_PADDING);
  
  // Draw outer border around entire menu
  ctx.strokeStyle = `rgb(${COLOR_BORDER}, ${COLOR_BORDER}, ${COLOR_BORDER})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, MENU_BORDER_RADIUS);
  ctx.stroke();
  
  // Draw each menu item
  let currentX = x + MENU_ITEM_PADDING;
  
  items.forEach((item, index) => {
    const itemWidth = itemWidths[index] || 100;
    const isSelected = index === selectedIndex;
    
    // Draw item background
    if (isSelected) {
      // Selected: white background
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(currentX, y + 4, itemWidth, height - 8, 2);
      ctx.fill();
    } else {
      // Unselected: transparent/black background, optional border
      ctx.strokeStyle = `rgb(${COLOR_BORDER}, ${COLOR_BORDER}, ${COLOR_BORDER})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(currentX, y + 4, itemWidth, height - 8, 2);
      ctx.stroke();
    }
    
    // Draw item text
    ctx.font = `${MENU_FONT_SIZE}px ${MENU_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (isSelected) {
      // Selected: black text
      ctx.fillStyle = '#000000';
    } else {
      // Unselected: white text
      ctx.fillStyle = '#ffffff';
    }
    
    const textX = currentX + itemWidth / 2;
    const textY = y + height / 2;
    ctx.fillText(item.label, textX, textY);
    
    currentX += itemWidth + MENU_ITEM_PADDING;
  });
}

/**
 * Create a horizontal menu state from item labels
 */
export function createMenuState(labels: string[]): HorizontalMenuState {
  return {
    items: labels.map((label, index) => ({
      id: `menu-${index}`,
      label,
    })),
    selectedIndex: 0,
  };
}

/**
 * Select the next menu item (cycles back to start)
 */
export function selectNextItem(state: HorizontalMenuState): number {
  state.selectedIndex = (state.selectedIndex + 1) % state.items.length;
  return state.selectedIndex;
}

/**
 * Select the previous menu item (cycles to end)
 */
export function selectPreviousItem(state: HorizontalMenuState): number {
  state.selectedIndex = (state.selectedIndex - 1 + state.items.length) % state.items.length;
  return state.selectedIndex;
}

/**
 * Select a specific menu item by index
 */
export function selectItemByIndex(state: HorizontalMenuState, index: number): boolean {
  if (index >= 0 && index < state.items.length) {
    state.selectedIndex = index;
    return true;
  }
  return false;
}

/**
 * Get the currently selected item
 */
export function getSelectedItem(state: HorizontalMenuState): HorizontalMenuItem | null {
  if (state.selectedIndex >= 0 && state.selectedIndex < state.items.length) {
    return state.items[state.selectedIndex];
  }
  return null;
}

/**
 * Get the currently selected item label
 */
export function getSelectedLabel(state: HorizontalMenuState): string | null {
  const item = getSelectedItem(state);
  return item?.label || null;
}
