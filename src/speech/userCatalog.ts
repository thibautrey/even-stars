// User Catalog Storage
// Persists celestial objects discovered via the OpenAI LLM fallback.
// Objects are stored in localStorage and merged into the searchable catalog
// at runtime so they can be found by name without hitting the API again.

import type { SearchableObject } from '../types/search';
import { SearchObjectType } from '../types/search';
import type { CelestialDescription } from '../sky/descriptions';
import { refreshCatalog } from '../sky/objectCatalog';

// ============================================================================
// Storage keys
// ============================================================================

const CATALOG_KEY = 'user_catalog_objects';
const DESCRIPTIONS_KEY = 'user_catalog_descriptions';

// ============================================================================
// Types (what the LLM returns)
// ============================================================================

/**
 * Structured response expected from the LLM.
 * Every field is required so the app can function without guessing.
 */
export interface LLMCelestialObject {
  /** Common name (e.g. "Barnard's Star") */
  name: string;
  /** Object type: star | planet | deepsky | constellation */
  type: 'star' | 'planet' | 'deepsky' | 'constellation';
  /** Right Ascension in decimal hours (0-24) */
  ra: number;
  /** Declination in decimal degrees (-90 to +90) */
  dec: number;
  /** Apparent visual magnitude */
  magnitude: number;
  /** Constellation abbreviation (IAU 3-letter, e.g. "Oph") */
  constellation: string;
  /** Short one-line summary (≤80 chars) for the overlay/banner */
  summary: string;
  /** Longer description (3-6 sentences) for the Explain sidebar */
  description: string;
  /** Distance from Earth as human-readable string (e.g. "6 light-years") */
  distance: string;
  /** Best observation season */
  season: string;
  /** A fun or cultural fact */
  funFact: string;
}

// ============================================================================
// Conversion helpers
// ============================================================================

function llmObjectToSearchable(obj: LLMCelestialObject): SearchableObject {
  const typeMap: Record<string, SearchObjectType> = {
    star: SearchObjectType.Star,
    planet: SearchObjectType.Planet,
    deepsky: SearchObjectType.DeepSky,
    constellation: SearchObjectType.Constellation,
  };

  return {
    id: `user_${obj.type}_${obj.name.toLowerCase().replace(/\s+/g, '_')}`,
    name: obj.name,
    type: typeMap[obj.type] ?? SearchObjectType.Star,
    ra: obj.ra,
    dec: obj.dec,
    magnitude: obj.magnitude,
    constellation: obj.constellation,
    info: obj.summary,
  };
}

function llmObjectToDescription(obj: LLMCelestialObject): CelestialDescription {
  return {
    name: obj.name,
    summary: obj.summary,
    description: obj.description,
    distance: obj.distance,
    constellation: obj.constellation,
    season: obj.season,
    funFact: obj.funFact,
  };
}

// ============================================================================
// In-memory caches (loaded once from storage)
// ============================================================================

let cachedObjects: SearchableObject[] | null = null;
let cachedDescriptions: Record<string, CelestialDescription> | null = null;

// ============================================================================
// Public API
// ============================================================================

/**
 * Load user-discovered objects from localStorage.
 */
export function getUserCatalogObjects(): SearchableObject[] {
  if (cachedObjects) return cachedObjects;
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    cachedObjects = raw ? (JSON.parse(raw) as SearchableObject[]) : [];
  } catch {
    cachedObjects = [];
  }
  return cachedObjects;
}

/**
 * Load user-discovered descriptions from localStorage.
 */
export function getUserDescriptions(): Record<string, CelestialDescription> {
  if (cachedDescriptions) return cachedDescriptions;
  try {
    const raw = localStorage.getItem(DESCRIPTIONS_KEY);
    cachedDescriptions = raw ? (JSON.parse(raw) as Record<string, CelestialDescription>) : {};
  } catch {
    cachedDescriptions = {};
  }
  return cachedDescriptions;
}

/**
 * Store a newly-discovered LLM object into both the searchable catalog
 * and the description catalog. Also invalidates the centralized object catalog.
 * Returns the SearchableObject that was added.
 */
export function addLLMObjectToCatalog(llmObj: LLMCelestialObject): SearchableObject {
  const searchable = llmObjectToSearchable(llmObj);
  const desc = llmObjectToDescription(llmObj);

  // --- objects ---
  const objects = getUserCatalogObjects();
  // Avoid duplicates (by id)
  const idx = objects.findIndex((o) => o.id === searchable.id);
  if (idx >= 0) {
    objects[idx] = searchable; // overwrite with latest data
  } else {
    objects.push(searchable);
  }
  cachedObjects = objects;
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(objects));
  } catch { /* quota */ }

  // --- descriptions ---
  const descriptions = getUserDescriptions();
  descriptions[desc.name] = desc;
  cachedDescriptions = descriptions;
  try {
    localStorage.setItem(DESCRIPTIONS_KEY, JSON.stringify(descriptions));
  } catch { /* quota */ }

  // Refresh the centralized catalog to include this new object
  refreshCatalog();

  return searchable;
}

/**
 * Look up a user-catalog description by name.
 */
export function getUserDescription(name: string): CelestialDescription | null {
  const descriptions = getUserDescriptions();
  return descriptions[name] ?? null;
}
