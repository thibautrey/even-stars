// Hierarchical menu system for Even Stars

import type { MenuItem, MenuState } from '../types';
import { ViewMode, StarFilter, ConstellationFilter, PlanetFilter, DeepSkyFilter, ActiveMenu } from '../types';

/**
 * Secondary (right) menu structure for view type selection
 * Stars vs Deep Sky with their respective filters
 */
export const SECONDARY_ROOT_MENU: MenuItem[] = [
  {
    name: 'Stars',
    viewMode: ViewMode.Stars,
    children: [
      { 
        name: 'Brightest', 
        value: StarFilter.Brightest, 
        viewMode: ViewMode.Stars,
        description: 'Show only brightest stars (mag < 1.5)'
      },
      { 
        name: 'Standard', 
        value: StarFilter.All, 
        viewMode: ViewMode.Stars,
        description: 'Show all catalog stars'
      },
      { 
        name: 'By Name', 
        value: StarFilter.ByConstellation, 
        viewMode: ViewMode.Stars,
        description: 'Show named stars only'
      },
    ],
  },
  {
    name: 'Deep Sky',
    viewMode: ViewMode.DeepSky,
    children: [
      { 
        name: 'All', 
        value: DeepSkyFilter.All, 
        viewMode: ViewMode.DeepSky,
        description: 'Show all deep sky objects'
      },
      { 
        name: 'Galaxies', 
        value: DeepSkyFilter.Galaxies, 
        viewMode: ViewMode.DeepSky,
        description: 'Show galaxies only'
      },
      { 
        name: 'Nebulae', 
        value: DeepSkyFilter.Nebulae, 
        viewMode: ViewMode.DeepSky,
        description: 'Show nebulae only'
      },
      { 
        name: 'Clusters', 
        value: DeepSkyFilter.Clusters, 
        viewMode: ViewMode.DeepSky,
        description: 'Show star clusters only'
      },
      { 
        name: 'Brightest', 
        value: DeepSkyFilter.Brightest, 
        viewMode: ViewMode.DeepSky,
        description: 'Show brightest deep sky objects'
      },
    ],
  },
];

/**
 * Root menu structure with complete submenu hierarchy (left menu)
 */
export const ROOT_MENU: MenuItem[] = [
  {
    name: 'Stars',
    viewMode: ViewMode.Stars,
    children: [
      { 
        name: 'Brightest', 
        value: StarFilter.Brightest, 
        viewMode: ViewMode.Stars,
        description: 'Show only brightest stars (mag < 1.5)'
      },
      { 
        name: 'Standard', 
        value: StarFilter.All, 
        viewMode: ViewMode.Stars,
        description: 'Show all catalog stars'
      },
      { 
        name: 'By Name', 
        value: StarFilter.ByConstellation, 
        viewMode: ViewMode.Stars,
        description: 'Show named stars only'
      },
    ],
  },
  {
    name: 'Constellations',
    viewMode: ViewMode.Constellations,
    children: [
      { 
        name: 'All', 
        value: ConstellationFilter.All, 
        viewMode: ViewMode.Constellations,
        description: 'Show all constellations'
      },
      { 
        name: 'Zodiac', 
        value: ConstellationFilter.Zodiac, 
        viewMode: ViewMode.Constellations,
        description: 'Show zodiac constellations'
      },
      { 
        name: 'Seasonal', 
        value: ConstellationFilter.Seasonal, 
        viewMode: ViewMode.Constellations,
        description: 'Show current season constellations'
      },
      { 
        name: 'Northern', 
        value: ConstellationFilter.Northern, 
        viewMode: ViewMode.Constellations,
        description: 'Show northern hemisphere constellations'
      },
      { 
        name: 'Southern', 
        value: ConstellationFilter.Southern, 
        viewMode: ViewMode.Constellations,
        description: 'Show southern hemisphere constellations'
      },
    ],
  },
  {
    name: 'Planets',
    viewMode: ViewMode.Planets,
    children: [
      { 
        name: 'All', 
        value: PlanetFilter.All, 
        viewMode: ViewMode.Planets,
        description: 'Show all planets'
      },
      { 
        name: 'Inner', 
        value: PlanetFilter.Inner, 
        viewMode: ViewMode.Planets,
        description: 'Show inner planets (Mercury, Venus)'
      },
      { 
        name: 'Outer', 
        value: PlanetFilter.Outer, 
        viewMode: ViewMode.Planets,
        description: 'Show outer planets (Mars, Jupiter, Saturn, etc.)'
      },
      { 
        name: 'Visible', 
        value: PlanetFilter.Visible, 
        viewMode: ViewMode.Planets,
        description: 'Show currently visible planets'
      },
    ],
  },
];

/**
 * Zodiac constellation abbreviations
 */
export const ZODIAC_CONSTELLATIONS = [
  'ARI', 'TAU', 'GEM', 'CNC', 'LEO', 'VIR',
  'LIB', 'SCO', 'SGR', 'CAP', 'AQR', 'PSC'
];

/**
 * Northern hemisphere constellations (declination > 0)
 */
export const NORTHERN_CONSTELLATIONS = [
  'UMa', 'UMi', 'CAS', 'CEP', 'CYG', 'LYR', 
  'HER', 'BOO', 'DRA', 'CAM'
];

/**
 * Southern hemisphere constellations (declination < -30)
 */
export const SOUTHERN_CONSTELLATIONS = [
  'Cru', 'CEN', 'CAR', 'VEL', 'PUP', 'GRU', 
  'PAV', 'TUC', 'APS', 'TRA'
];

/**
 * Create initial menu state
 */
export function createInitialMenuState(): MenuState {
  return {
    currentItems: ROOT_MENU,
    history: [],
    level: 0,
    path: [],
  };
}

/**
 * Navigate into a submenu
 * @returns true if navigation occurred, false if item has no children
 */
export function navigateInto(menuState: MenuState, itemName: string): boolean {
  const item = menuState.currentItems.find(i => i.name === itemName);
  
  if (!item || !item.children || item.children.length === 0) {
    return false;
  }
  
  // Save current state to history
  menuState.history.push([...menuState.currentItems]);
  menuState.currentItems = item.children;
  menuState.level++;
  menuState.path.push(item.name);
  
  return true;
}

/**
 * Navigate back to parent menu
 * @returns true if navigation occurred, false if already at root
 */
export function navigateBack(menuState: MenuState): boolean {
  if (menuState.level === 0 || menuState.history.length === 0) {
    return false;
  }
  
  const parentItems = menuState.history.pop();
  if (parentItems) {
    menuState.currentItems = parentItems;
    menuState.level--;
    menuState.path.pop();
    return true;
  }
  
  return false;
}

/**
 * Get current menu item names for display
 */
export function getCurrentMenuNames(menuState: MenuState): string[] {
  return menuState.currentItems.map(item => item.name);
}

/**
 * Find a menu item by name in the current level
 */
export function findMenuItem(menuState: MenuState, name: string): MenuItem | undefined {
  return menuState.currentItems.find(item => item.name === name);
}

/**
 * Check if current menu level has a parent (can go back)
 */
export function canGoBack(menuState: MenuState): boolean {
  return menuState.level > 0;
}

/**
 * Get breadcrumb path for display
 */
export function getBreadcrumb(menuState: MenuState): string {
  if (menuState.path.length === 0) {
    return 'Main';
  }
  return menuState.path.join(' > ');
}

/**
 * Get the current menu category (root menu name)
 */
export function getCurrentMenuCategory(menuState: MenuState): string | null {
  if (menuState.level === 0) {
    return null;
  }
  
  // The first item in currentItems should tell us the category by its viewMode
  const firstItem = menuState.currentItems[0];
  if (firstItem?.viewMode) {
    return firstItem.viewMode;
  }
  
  return null;
}

/**
 * Get filter value from current menu items
 * Returns the filter value if we're in a submenu, null otherwise
 */
export function getSelectedFilterValue(menuState: MenuState): string | null {
  if (menuState.level === 0) {
    return null;
  }
  
  // In submenu - need to find which item was selected
  // This is called after navigation, so we need to track selection separately
  // Return the first item's value as default for the submenu
  const firstItem = menuState.currentItems[0];
  return firstItem?.value || null;
}

/**
 * Map a menu value to StarFilter
 */
export function toStarFilter(value: string | undefined): StarFilter {
  if (!value) return StarFilter.All;
  const filter = Object.values(StarFilter).find(f => f === value);
  return filter || StarFilter.All;
}

/**
 * Map a menu value to ConstellationFilter
 */
export function toConstellationFilter(value: string | undefined): ConstellationFilter {
  if (!value) return ConstellationFilter.All;
  const filter = Object.values(ConstellationFilter).find(f => f === value);
  return filter || ConstellationFilter.All;
}

/**
 * Map a menu value to PlanetFilter
 */
export function toPlanetFilter(value: string | undefined): PlanetFilter {
  if (!value) return PlanetFilter.All;
  const filter = Object.values(PlanetFilter).find(f => f === value);
  return filter || PlanetFilter.All;
}

/**
 * Map a menu value to DeepSkyFilter
 */
export function toDeepSkyFilter(value: string | undefined): DeepSkyFilter {
  if (!value) return DeepSkyFilter.All;
  const filter = Object.values(DeepSkyFilter).find(f => f === value);
  return filter || DeepSkyFilter.All;
}

/**
 * Create initial secondary menu state
 */
export function createInitialSecondaryMenuState(): MenuState {
  return {
    currentItems: SECONDARY_ROOT_MENU,
    history: [],
    level: 0,
    path: [],
  };
}

/**
 * Check if both menus are at their root level (for menu switching)
 */
export function canSwitchMenus(menuState: MenuState, secondaryMenuState: MenuState): boolean {
  return menuState.level === 0 && secondaryMenuState.level === 0;
}

/**
 * Switch active menu focus
 */
export function switchActiveMenu(currentActive: ActiveMenu): ActiveMenu {
  return currentActive === ActiveMenu.Left ? ActiveMenu.Right : ActiveMenu.Left;
}
