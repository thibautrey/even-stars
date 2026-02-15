/**
 * Unified Celestial Object Catalog
 * 
 * Single source of truth for all information about celestial objects:
 * - Star specs (coordinates, magnitude, spectral type)
 * - Planet specs (orbital elements, magnitude)
 * - Constellation definitions
 * - Object descriptions (summary, detailed info, fun facts)
 * - User-discovered objects from LLM fallback
 * 
 * Provides a unified API for fetching complete object information for any object.
 */

import { SearchObjectType } from '../types/search';

// Import all existing catalogs
import { BRIGHT_STARS } from './stars';
import { PLANETS } from './planets';
import { CONSTELLATIONS } from './constellations';
import { DEEP_SKY_OBJECTS } from './deepsky';
import { STAR_DESCRIPTIONS, PLANET_DESCRIPTIONS, DEEPSKY_DESCRIPTIONS, getDefaultDescription as createDefaultDescription } from './descriptions';
import { 
  getUserCatalogObjects, 
  getUserDescriptions,
} from '../speech/userCatalog';

// ============================================================================
// UNIFIED OBJECT TYPES
// ============================================================================

/**
 * Complete metadata about a celestial object
 */
export interface CelestialObject {
  /** Unique identifier for the object */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Object type */
  type: SearchObjectType;
  
  /** Right Ascension in hours */
  ra: number;
  
  /** Declination in degrees */
  dec: number;
  
  /** Visual magnitude (lower = brighter) */
  magnitude: number;
  
  /** Constellation this object belongs to or is part of */
  constellation?: string;
  
  // === Description fields ===
  /** One-line summary for banners/headers */
  summary: string;
  
  /** Longer description for explain/detail views (3-6 sentences) */
  description: string;
  
  /** Distance from Earth (human-readable) */
  distance?: string;
  
  /** Best observation season */
  season?: string;
  
  /** Fun or cultural fact */
  funFact?: string;
  
  // === Source metadata ===
  /** Whether this object is user-discovered from LLM fallback */
  isUserDiscovered: boolean;
  
  /** Timestamp when this object was discovered (if user-discovered) */
  discoveredAt?: number;
  
  // === Optional specs for different object types ===
  /** For stars: HR catalog number */
  hrNumber?: number;
  
  /** For stars: spectral type (e.g., "A0V") */
  spectralType?: string;
  
  /** For planets: orbital period in years */
  orbitalPeriod?: number;
  
  /** For planets: symbol (e.g., "♃" for Jupiter) */
  symbol?: string;
  
  /** For deep sky objects: specific subtype */
  deepSkyType?: 'galaxy' | 'nebula' | 'cluster' | 'planetary_nebula' | 'supernova_remnant';
  
  /** For deep sky objects: catalog ID (e.g., "M31", "NGC 224") */
  catalogId?: string;
}

/**
 * Search/filter result for finding objects
 */
export interface ObjectSearchResult {
  objects: CelestialObject[];
  total: number;
}

// ============================================================================
// INTERNAL CACHES
// ============================================================================

let objectCache: Map<string, CelestialObject> | null = null;
let byTypeCache: Map<SearchObjectType, CelestialObject[]> | null = null;

// ============================================================================
// INITIALIZATION & INDEXING
// ============================================================================

/**
 * Build the complete object catalog from all sources
 * This is called lazily on first access
 */
function initializeCache(): void {
  if (objectCache) return;

  objectCache = new Map();
  byTypeCache = new Map();

  // Initialize type buckets
  for (const type of Object.values(SearchObjectType)) {
    byTypeCache!.set(type as SearchObjectType, []);
  }

  // Index built-in stars
  // =========================================================================
  for (const star of BRIGHT_STARS) {
    const desc = STAR_DESCRIPTIONS[star.name] || createDefaultDescription(star.name, 'star', star.magnitude, star.spectral);
    
    const celestialObj: CelestialObject = {
      id: `star_${star.hr}`,
      name: star.name,
      type: SearchObjectType.Star,
      ra: star.ra,
      dec: star.dec,
      magnitude: star.magnitude,
      constellation: desc.constellation,
      summary: desc.summary,
      description: desc.description,
      distance: desc.distance,
      season: desc.season,
      funFact: desc.funFact,
      isUserDiscovered: false,
      hrNumber: star.hr,
      spectralType: star.spectral,
    };
    
    objectCache.set(celestialObj.id, celestialObj);
    objectCache.set(celestialObj.name, celestialObj);
    byTypeCache!.get(SearchObjectType.Star)!.push(celestialObj);
  }

  // =========================================================================
  // Index built-in planets
  // =========================================================================
  for (const planet of PLANETS) {
    const desc = PLANET_DESCRIPTIONS[planet.name] || createDefaultDescription(planet.name, 'planet', planet.baseMagnitude);
    
    // Note: planets have dynamic positions, so these are placeholders
    const celestialObj: CelestialObject = {
      id: `planet_${planet.name.toLowerCase()}`,
      name: planet.name,
      type: SearchObjectType.Planet,
      ra: 0, // Will be calculated dynamically by renderer/calculator
      dec: 0,
      magnitude: planet.baseMagnitude,
      summary: desc.summary,
      description: desc.description,
      distance: desc.distance,
      season: desc.season,
      funFact: desc.funFact,
      isUserDiscovered: false,
      symbol: planet.symbol,
      orbitalPeriod: planet.period,
    };
    
    objectCache.set(celestialObj.id, celestialObj);
    objectCache.set(celestialObj.name, celestialObj);
    byTypeCache!.get(SearchObjectType.Planet)!.push(celestialObj);
  }

  // =========================================================================
  // Index deep sky objects (galaxies, nebulas, clusters)
  // =========================================================================
  for (const deepSky of DEEP_SKY_OBJECTS) {
    const desc = DEEPSKY_DESCRIPTIONS[deepSky.name] || createDefaultDescription(deepSky.name, deepSky.objectType, deepSky.magnitude);
    
    // Map deep sky object types to SearchObjectType
    const typeMap: Record<string, SearchObjectType> = {
      galaxy: SearchObjectType.DeepSky,
      nebula: SearchObjectType.DeepSky,
      cluster: SearchObjectType.DeepSky,
      planetary_nebula: SearchObjectType.DeepSky,
      supernova_remnant: SearchObjectType.DeepSky,
    };
    
    const celestialObj: CelestialObject = {
      id: `deepsky_${deepSky.catalogId}`,
      name: deepSky.name,
      type: typeMap[deepSky.objectType],
      ra: deepSky.ra,
      dec: deepSky.dec,
      magnitude: deepSky.magnitude,
      constellation: deepSky.constellation,
      summary: desc.summary,
      description: desc.description,
      distance: desc.distance,
      season: deepSky.season,
      funFact: desc.funFact,
      isUserDiscovered: false,
      deepSkyType: deepSky.objectType,
      catalogId: deepSky.catalogId,
    };
    
    objectCache.set(celestialObj.id, celestialObj);
    objectCache.set(celestialObj.name, celestialObj);
    objectCache.set(deepSky.catalogId, celestialObj); // Also index by Messier/NGC number (e.g., "M31")
    byTypeCache!.get(SearchObjectType.DeepSky)!.push(celestialObj);
  }

  // =========================================================================
  // Index constellations
  // =========================================================================
  for (const constellation of CONSTELLATIONS) {
    // TODO: Add constellation descriptions if available
    const celestialObj: CelestialObject = {
      id: `constellation_${constellation.abbr}`,
      name: constellation.name,
      type: SearchObjectType.Constellation,
      ra: 12, // Placeholder
      dec: 0,
      magnitude: 0,
      summary: `Constellation: ${constellation.name}`,
      description: `${constellation.name} is a constellation containing ${constellation.stars.length} stars.`,
      isUserDiscovered: false,
    };
    
    objectCache.set(celestialObj.id, celestialObj);
    objectCache.set(celestialObj.name, celestialObj);
    byTypeCache!.get(SearchObjectType.Constellation)!.push(celestialObj);
  }

  // =========================================================================
  // Index user-discovered objects
  // =========================================================================
  const userCatalogObjects = getUserCatalogObjects();
  const userDescriptions = getUserDescriptions();

  for (const userObj of userCatalogObjects) {
    const userDesc = userDescriptions[userObj.name];
    
    const celestialObj: CelestialObject = {
      id: userObj.id,
      name: userObj.name,
      type: userObj.type,
      ra: userObj.ra,
      dec: userObj.dec,
      magnitude: userObj.magnitude,
      constellation: userObj.constellation,
      summary: userDesc?.summary || userObj.info || 'User-discovered object',
      description: userDesc?.description || 'Object discovered and cataloged by the user',
      distance: userDesc?.distance,
      season: userDesc?.season,
      funFact: userDesc?.funFact,
      isUserDiscovered: true,
      discoveredAt: 0, // TODO: Store timestamp in userCatalog
    };
    
    // Use name as primary key for user objects (so they can override built-ins)
    objectCache.set(celestialObj.name, celestialObj);
    
    if (userObj.type !== SearchObjectType.Constellation) {
      byTypeCache!.get(userObj.type)!.push(celestialObj);
    }
  }
}

// ============================================================================
// PUBLIC API - RETRIEVAL
// ============================================================================

/**
 * Create a default description for an unknown object
 * Used when an object is not in the catalog
 */
export function getDefaultDescription(
  name: string,
  type: string,
  magnitude?: number,
  spectral?: string,
): Omit<CelestialObject, 'id' | 'ra' | 'dec' | 'type' | 'isUserDiscovered'> {
  const desc = createDefaultDescription(name, type, magnitude, spectral);
  return {
    name: desc.name,
    magnitude: magnitude ?? 0,
    summary: desc.summary,
    description: desc.description,
  };
}

/**
 * Get a complete celestial object by name
 * Returns the object with all specs and descriptions combined
 * User-discovered objects take precedence over built-ins with the same name
 */
export function getObject(name: string): CelestialObject | null {
  initializeCache();
  return objectCache!.get(name) ?? null;
}

/**
 * Get a complete celestial object by ID
 * IDs follow the format: `{type}_{identifier}`
 */
export function getObjectById(id: string): CelestialObject | null {
  initializeCache();
  return objectCache!.get(id) ?? null;
}

/**
 * Get only the specs/coordinate data for an object (lightweight)
 * Useful when you only need position info for calculations
 */
export function getObjectSpecs(name: string): Omit<CelestialObject, 'summary' | 'description' | 'distance' | 'season' | 'funFact'> | null {
  const obj = getObject(name);
  if (!obj) return null;
  
  const { summary, description, distance, season, funFact, ...specs } = obj;
  return specs;
}

/**
 * Get only the description/info for an object (lightweight)
 * Useful when you already have position info and just need descriptions
 */
export function getObjectInfo(name: string): Pick<CelestialObject, 'name' | 'summary' | 'description' | 'distance' | 'season' | 'funFact' | 'isUserDiscovered'> | null {
  const obj = getObject(name);
  if (!obj) return null;
  
  const { name: n, summary, description, distance, season, funFact, isUserDiscovered } = obj;
  return { name: n, summary, description, distance, season, funFact, isUserDiscovered };
}

/**
 * Check if an object exists in the catalog
 */
export function hasObject(name: string): boolean {
  return getObject(name) !== null;
}

// ============================================================================
// PUBLIC API - SEARCHING & FILTERING
// ============================================================================

/**
 * Get all objects of a specific type
 */
export function getObjectsByType(type: SearchObjectType): CelestialObject[] {
  initializeCache();
  return byTypeCache!.get(type) ?? [];
}

/**
 * Search for objects by name (substring match)
 * Case-insensitive
 */
export function searchObjects(query: string): ObjectSearchResult {
  initializeCache();
  const lowerQuery = query.toLowerCase();
  const results: CelestialObject[] = [];

  for (const obj of objectCache!.values()) {
    if (obj.name.toLowerCase().includes(lowerQuery)) {
      results.push(obj);
    }
  }

  // Deduplicate (in case same object indexed by id and name)
  const seen = new Set<string>();
  const unique = results.filter((obj) => {
    if (seen.has(obj.id)) return false;
    seen.add(obj.id);
    return true;
  });

  return {
    objects: unique,
    total: unique.length,
  };
}

/**
 * Search for deep sky objects by catalog ID (Messier or NGC number)
 * Examples: "M31", "M42", "NGC 224"
 */
export function getDeepSkyByCatalogId(catalogId: string): CelestialObject | null {
  initializeCache();
  return objectCache!.get(catalogId.toUpperCase()) ?? objectCache!.get(catalogId) ?? null;
}

/**
 * Get all deep sky objects of a specific sub-type
 */
export function getDeepSkyBySubType(subType: 'galaxy' | 'nebula' | 'cluster' | 'planetary_nebula' | 'supernova_remnant'): CelestialObject[] {
  initializeCache();
  const results: CelestialObject[] = [];
  
  // Filter deep sky objects by their subtype
  for (const obj of objectCache!.values()) {
    if (obj.type === SearchObjectType.DeepSky && obj.deepSkyType === subType) {
      results.push(obj);
    }
  }
  
  // Deduplicate
  const seen = new Set<string>();
  return results.filter((obj) => {
    if (seen.has(obj.id)) return false;
    seen.add(obj.id);
    return true;
  });
}

/**
 * Search for objects by constellation
 */
export function getObjectsByConstellation(constellation: string): CelestialObject[] {
  initializeCache();
  const results: CelestialObject[] = [];

  for (const obj of objectCache!.values()) {
    if (obj.constellation === constellation) {
      results.push(obj);
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return results.filter((obj) => {
    if (seen.has(obj.id)) return false;
    seen.add(obj.id);
    return true;
  });
}

/**
 * Filter objects by brightness (magnitude threshold)
 */
export function getObjectsBrighter(maxMagnitude: number): CelestialObject[] {
  initializeCache();
  const results: CelestialObject[] = [];

  for (const obj of objectCache!.values()) {
    if (obj.magnitude <= maxMagnitude) {
      results.push(obj);
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return results.filter((obj) => {
    if (seen.has(obj.id)) return false;
    seen.add(obj.id);
    return true;
  });
}

/**
 * Get only user-discovered objects
 */
export function getUserDiscoveredObjects(): CelestialObject[] {
  initializeCache();
  const results: CelestialObject[] = [];

  for (const obj of objectCache!.values()) {
    if (obj.isUserDiscovered) {
      results.push(obj);
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return results.filter((obj) => {
    if (seen.has(obj.id)) return false;
    seen.add(obj.id);
    return true;
  });
}

// ============================================================================
// PUBLIC API - AGGREGATIONS & STATS
// ============================================================================

/**
 * Get total number of unique objects in the catalog
 */
export function getCatalogSize(): number {
  initializeCache();
  const seen = new Set<string>();
  for (const obj of objectCache!.values()) {
    seen.add(obj.id);
  }
  return seen.size;
}

/**
 * Get count of objects by type
 */
export function getObjectCountByType(): Record<SearchObjectType, number> {
  initializeCache();
  return {
    [SearchObjectType.Star]: byTypeCache!.get(SearchObjectType.Star)!.length,
    [SearchObjectType.Planet]: byTypeCache!.get(SearchObjectType.Planet)!.length,
    [SearchObjectType.DeepSky]: byTypeCache!.get(SearchObjectType.DeepSky)!.length,
    [SearchObjectType.Constellation]: byTypeCache!.get(SearchObjectType.Constellation)!.length,
  };
}

/**
 * Get all unique constellations represented in the catalog
 */
export function getAllConstellations(): string[] {
  initializeCache();
  const constellations = new Set<string>();

  for (const obj of objectCache!.values()) {
    if (obj.constellation) {
      constellations.add(obj.constellation);
    }
  }

  return Array.from(constellations).sort();
}

// ============================================================================
// INVALIDATION & REFRESH
// ============================================================================

/**
 * Manually clear the cache to force a rebuild on next access
 * Call this after adding/updating user-discovered objects
 */
export function invalidateCache(): void {
  objectCache = null;
  byTypeCache = null;
}

/**
 * Refresh the cache after new objects have been added to the user catalog
 * This is called automatically when adding new LLM objects
 */
export function refreshCatalog(): void {
  invalidateCache();
  initializeCache();
}
