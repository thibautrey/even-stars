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
}

/**
 * View modes for the sky chart
 */
export enum ViewMode {
  Stars = 'Stars',
  Constellations = 'Constellations',
  Planets = 'Planets',
}

/**
 * Device connection status
 */
export interface DeviceStatus {
  connected: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
}
