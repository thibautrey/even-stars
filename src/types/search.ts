// Types for the search/locator system

/**
 * Type of searchable object
 */
export enum SearchObjectType {
  Star = 'star',
  Planet = 'planet',
  DeepSky = 'deepsky',
  Constellation = 'constellation',
}

/**
 * A searchable object for the finder/locator feature
 */
export interface SearchableObject {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Object type */
  type: SearchObjectType;
  /** Right Ascension in hours */
  ra: number;
  /** Declination in degrees */
  dec: number;
  /** Visual magnitude (lower is brighter) */
  magnitude: number;
  /** Optional: constellation this object belongs to */
  constellation?: string;
  /** Optional: additional info (e.g., "Red Giant", "Spiral Galaxy") */
  info?: string;
  /** For planets: whether it's currently visible (calculated at runtime) */
  isVisible?: boolean;
}

/**
 * Current search/finder state
 */
export interface SearchState {
  /** Currently selected target object (null = no target) */
  selectedTarget: SearchableObject | null;
  /** Current category filter for the search list */
  categoryFilter: SearchCategory;
  /** Whether the target overlay is active */
  isFinderActive: boolean;
}

/**
 * Search categories for filtering the object list
 */
export enum SearchCategory {
  All = 'all',
  BrightStars = 'bright_stars',
  Planets = 'planets',
  DeepSky = 'deepsky',
  Constellations = 'constellations',
}

/**
 * Direction indicator for the finder arrow
 */
export interface DirectionIndicator {
  /** Angle in degrees (0 = up/north, 90 = right/east, etc.) */
  angle: number;
  /** Distance from center in degrees */
  distance: number;
  /** Whether the target is currently in the field of view */
  isInView: boolean;
  /** Recommended text: "Turn left", "Look up", "In view!", etc. */
  guidance: string;
}

/**
 * Create initial search state
 */
export function createInitialSearchState(): SearchState {
  return {
    selectedTarget: null,
    categoryFilter: SearchCategory.All,
    isFinderActive: false,
  };
}
