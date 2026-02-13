// Types for Even Stars sky chart application

/**
 * Represents a star with its celestial coordinates and properties
 */
export interface Star {
  /** HR (Harvard Revised) catalog number */
  hr: number;
  /** Common name of the star (if any) */
  name: string;
  /** Right Ascension in hours */
  ra: number;
  /** Declination in degrees */
  dec: number;
  /** Visual magnitude (lower is brighter) */
  magnitude: number;
  /** Spectral type */
  spectral?: string;
}

/**
 * Horizontal coordinates (Alt/Az) for a given observer location
 */
export interface HorizontalCoords {
  /** Altitude in degrees (0 = horizon, 90 = zenith) */
  altitude: number;
  /** Azimuth in degrees (0 = North, 90 = East, 180 = South, 270 = West) */
  azimuth: number;
}

/**
 * Observer's geographic location
 */
export interface GeoLocation {
  /** Latitude in degrees (-90 to 90) */
  latitude: number;
  /** Longitude in degrees (-180 to 180, positive East) */
  longitude: number;
  /** Altitude above sea level in meters (optional) */
  altitude?: number;
}

/**
 * Head orientation from gyroscope
 */
export interface HeadOrientation {
  /** Azimuth (compass direction) in degrees */
  azimuth: number;
  /** Pitch (elevation) in degrees */
  pitch: number;
  /** Roll (tilt) in degrees */
  roll: number;
}

/**
 * Field of view dimensions
 */
export interface FieldOfView {
  /** Horizontal FOV in degrees */
  horizontal: number;
  /** Vertical FOV in degrees */
  vertical: number;
}

/**
 * A constellation definition
 */
export interface Constellation {
  /** Abbreviation (e.g., "ORI" for Orion) */
  abbr: string;
  /** Full name */
  name: string;
  /** List of star HR numbers that form the constellation shape */
  stars: number[];
  /** Lines connecting stars, as pairs of indices into the stars array */
  lines: Array<[number, number]>;
}

/**
 * Render context for the sky canvas
 */
export interface SkyRenderContext {
  /** Canvas context for drawing */
  ctx: CanvasRenderingContext2D;
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Current field of view */
  fov: FieldOfView;
  /** Current head orientation */
  orientation: HeadOrientation;
}

/**
 * Application state
 */
export interface AppState {
  /** Whether connected to Even glasses */
  isConnected: boolean;
  /** Current location (if available) */
  location: GeoLocation | null;
  /** Current head orientation */
  orientation: HeadOrientation;
  /** Current view mode */
  viewMode: ViewMode;
  /** Selected star/object (if any) */
  selectedStar: Star | null;
  /** Primary (left) menu navigation state - for search/finder */
  menuState: MenuState;
  /** Secondary (right) menu navigation state */
  secondaryMenuState: MenuState;
  /** Which menu is currently active */
  activeMenu: ActiveMenu;
  /** Current star filter */
  starFilter: StarFilter;
  /** Current constellation filter */
  constellationFilter: ConstellationFilter;
  /** Current planet filter */
  planetFilter: PlanetFilter;
  /** Current deep sky filter */
  deepSkyFilter: DeepSkyFilter;
  /** Search/finder state for the left menu */
  searchState: import('./search').SearchState;
  /** Currently targeted object for finder (null = no target) */
  finderTarget: import('./search').SearchableObject | null;
}

/**
 * View modes for the sky chart
 */
export enum ViewMode {
  Stars = 'Stars',
  Constellations = 'Constellations',
  Planets = 'Planets',
  DeepSky = 'DeepSky',
}

/**
 * Deep sky object filter options
 */
export enum DeepSkyFilter {
  All = 'all',
  Galaxies = 'galaxies',
  Nebulae = 'nebulae',
  Clusters = 'clusters',
  Brightest = 'brightest',
}

/**
 * Star filter options
 */
export enum StarFilter {
  All = 'all',
  Brightest = 'brightest',
  Nearest = 'nearest',
  ByConstellation = 'by_constellation',
}

/**
 * Constellation filter options
 */
export enum ConstellationFilter {
  All = 'all',
  Zodiac = 'zodiac',
  Seasonal = 'seasonal',
  Northern = 'northern',
  Southern = 'southern',
}

/**
 * Planet filter options
 */
export enum PlanetFilter {
  All = 'all',
  Inner = 'inner',
  Outer = 'outer',
  Visible = 'visible',
}

/**
 * Menu item structure for hierarchical navigation
 */
export interface MenuItem {
  /** Display name */
  name: string;
  /** Optional action/value when selected */
  value?: string;
  /** Child items (for submenus) */
  children?: MenuItem[];
  /** Associated view mode */
  viewMode?: ViewMode;
  /** Optional description for the menu item */
  description?: string;
}

/**
 * Menu navigation state
 */
export interface MenuState {
  /** Current menu items being displayed */
  currentItems: MenuItem[];
  /** Navigation history stack */
  history: MenuItem[][];
  /** Current depth level (0 = root) */
  level: number;
  /** Breadcrumb path labels for current depth */
  path: string[];
}

/**
 * Which menu is currently active/focused
 */
export enum ActiveMenu {
  Left = 'left',
  Right = 'right',
}

/**
 * Secondary menu (right side) items for view type selection
 */
export interface SecondaryMenuItem {
  /** Display name */
  name: string;
  /** Associated view mode */
  viewMode: ViewMode;
  /** Optional children for filters */
  children?: MenuItem[];
}

/**
 * Device connection status
 */
export interface DeviceStatus {
  connected: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
}
