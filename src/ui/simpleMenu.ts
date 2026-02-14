// Simplified menu system for Even Stars - Astronomical Compass
// Replaces the dual-menu system with a single mode selector

import { AppMode, CompassState } from '../types';

/**
 * Simple menu item structure
 */
export interface SimpleMenuItem {
  /** Display name */
  name: string;
  /** Associated app mode */
  appMode: AppMode;
  /** Description shown in UI */
  description: string;
}

/**
 * Root menu items - simple mode selector
 */
export const SIMPLE_MENU_ITEMS: SimpleMenuItem[] = [
  {
    name: 'Identify',
    appMode: AppMode.Identify,
    description: 'Auto-detect what\'s in view',
  },
  {
    name: 'Find Target',
    appMode: AppMode.TargetFinder,
    description: 'Guide to selected object',
  },
  {
    name: 'Constellations',
    appMode: AppMode.ConstellationHints,
    description: 'Show constellation hints',
  },
];

/**
 * Get menu item names for display
 */
export function getMenuItemNames(): string[] {
  return SIMPLE_MENU_ITEMS.map(item => item.name);
}

/**
 * Get app mode from menu item name
 */
export function getAppModeFromName(name: string): AppMode | null {
  const item = SIMPLE_MENU_ITEMS.find(i => i.name === name);
  return item?.appMode || null;
}

/**
 * Get menu item by app mode
 */
export function getMenuItemByMode(mode: AppMode): SimpleMenuItem | null {
  return SIMPLE_MENU_ITEMS.find(i => i.appMode === mode) || null;
}

/**
 * Get menu item by name
 */
export function getMenuItemByName(name: string): SimpleMenuItem | null {
  return SIMPLE_MENU_ITEMS.find(i => i.name === name) || null;
}

/**
 * Get index of menu item by app mode
 */
export function getMenuIndexByMode(mode: AppMode): number {
  return SIMPLE_MENU_ITEMS.findIndex(i => i.appMode === mode);
}

/**
 * Get next mode in cycle
 */
export function getNextMode(currentMode: AppMode): AppMode {
  const currentIndex = getMenuIndexByMode(currentMode);
  const nextIndex = (currentIndex + 1) % SIMPLE_MENU_ITEMS.length;
  return SIMPLE_MENU_ITEMS[nextIndex].appMode;
}

// Note: Using CompassState from types/index.ts instead of SimpleMenuState

/**
 * Handle menu selection
 * Returns the new app mode when a menu item is selected
 */
export function handleMenuSelect(
  state: CompassState,
  itemName: string
): AppMode | null {
  const newMode = getAppModeFromName(itemName);
  if (newMode !== null) {
    state.appMode = newMode;
    state.selectedMenuIndex = getMenuIndexByMode(newMode);
  }
  return newMode;
}

/**
 * Cycle to next mode
 */
export function cycleMode(state: CompassState): AppMode {
  const newMode = getNextMode(state.appMode);
  state.appMode = newMode;
  state.selectedMenuIndex = getMenuIndexByMode(newMode);
  return newMode;
}
