# Unified Object Catalog - User Guide

## Overview

The **Unified Object Catalog** (`src/sky/objectCatalog.ts`) is the single, centralized source of truth for all information about celestial objects in the Even Stars application.

Before this refactor, object information was scattered across multiple files:
- `descriptions.ts` - Star and planet descriptions
- `stars.ts` - Star catalog with coordinates and magnitude
- `planets.ts` - Planet orbital data
- `constellations.ts` - Constellation definitions and star connections
- `userCatalog.ts` - User-discovered objects from LLM fallback

Now, all of this is unified into a single, queryable catalog with a comprehensive API.

## Architecture

### Data Sources

The object catalog aggregates data from these sources:

```
┌─────────────────────────────────────────┐
│       Unified Object Catalog            │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ Built-in     │  │ Built-in     │    │
│  │ Stars        │  │ Planets      │    │
│  │ (BRIGHT_     │  │ (PLANETS)    │    │
│  │  STARS)      │  │              │    │
│  └──────────────┘  └──────────────┘    │
│         │                 │             │
│         └────────┬────────┘             │
│                  v                      │
│  ┌──────────────────────────────────┐   │
│  │  STAR_DESCRIPTIONS +             │   │
│  │  PLANET_DESCRIPTIONS             │   │
│  └──────────────────────────────────┘   │
│                  │                      │
│                  v                      │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ Built-in     │  │ User-        │    │
│  │ Constellations│  │ Discovered   │    │
│  │ (CONSTELLATIONS)│ Objects      │    │
│  │               │  │              │    │
│  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
         Searchable Index
```

### Core Type: `CelestialObject`

Every object in the catalog is represented as a `CelestialObject` which combines:

```typescript
export interface CelestialObject {
  // Identification
  id: string;                    // Unique ID
  name: string;                  // Display name
  type: SearchObjectType;        // star | planet | constellation | deepsky
  
  // Coordinates
  ra: number;                    // Right Ascension (hours)
  dec: number;                   // Declination (degrees)
  magnitude: number;             // Visual magnitude
  constellation?: string;        // Parent constellation
  
  // Description
  summary: string;               // One-liner for banners
  description: string;           // Full description (3-6 sentences)
  distance?: string;             // Human-readable distance
  season?: string;               // Best observation season
  funFact?: string;              // Cultural/interesting fact
  
  // Metadata
  isUserDiscovered: boolean;     // From user LLM fallback?
  discoveredAt?: number;        // When user discovered it
  
  // Optional specs
  hrNumber?: number;             // For stars: HR catalog number
  spectralType?: string;         // For stars: e.g., "A0V"
  orbitalPeriod?: number;        // For planets: in years
  symbol?: string;               // For planets: e.g., "♃"
}
```

## Usage Examples

### 1. Get a Single Object

```typescript
import { getObject } from './src/sky/objectCatalog';

// Get by name (case-insensitive, searches within name)
const sirius = getObject('Sirius');
if (sirius) {
  console.log(`${sirius.name}: ${sirius.summary}`);
  console.log(`Magnitude: ${sirius.magnitude}`);
  console.log(`${sirius.description}`);
}
```

**User-discovered objects take precedence:** If a user discovers an object with the same name as a built-in object, the user version is returned.

### 2. Get Lightweight Specs Only

When you only need coordinates for calculations:

```typescript
import { getObjectSpecs } from './src/sky/objectCatalog';

const specs = getObjectSpecs('Vega');
if (specs) {
  const alt = calculateAltitude(specs.ra, specs.dec, location);
  // ...
}
```

### 3. Get Description/Info Only

When you already have position data:

```typescript
import { getObjectInfo } from './src/sky/objectCatalog';

const info = getObjectInfo('Mars');
if (info) {
  ui.showSummary(info.summary);
  ui.showDetail(info.description);
}
```

### 4. Search for Objects

```typescript
import { searchObjects } from './src/sky/objectCatalog';

const results = searchObjects('Ori');  // Search for "Ori"
console.log(`Found ${results.total} objects`);
results.objects.forEach((obj) => {
  console.log(`${obj.name} (${obj.type})`);
});
```

### 5. Get All Objects of a Type

```typescript
import { getObjectsByType, SearchObjectType } from './src/sky/objectCatalog';

const allStars = getObjectsByType(SearchObjectType.Star);
const brightStars = allStars.filter((s) => s.magnitude < 2);
```

### 6. Get Objects by Constellation

```typescript
import { getObjectsByConstellation } from './src/sky/objectCatalog';

const orionStars = getObjectsByConstellation('Orion');
// Returns all stars in constellation Orion
```

### 7. Filter by Brightness

```typescript
import { getObjectsBrighter } from './src/sky/objectCatalog';

const visible = getObjectsBrighter(3.5);  // All stars brighter than 3.5 mag
```

### 8. Get User-Discovered Objects

```typescript
import { getUserDiscoveredObjects } from './src/sky/objectCatalog';

const userObjects = getUserDiscoveredObjects();
console.log(`User has discovered ${userObjects.length} objects`);
```

### 9. Check Catalog Statistics

```typescript
import { 
  getCatalogSize, 
  getObjectCountByType,
  getAllConstellations 
} from './src/sky/objectCatalog';

console.log(`Total objects: ${getCatalogSize()}`);
console.log(getObjectCountByType());
// {
//   star: 150,
//   planet: 8,
//   deepsky: 0,
//   constellation: 88
// }

const constellations = getAllConstellations();
```

## Integration Points

### Current Integration

The catalog is integrated at these locations:

1. **Explain Mode** (`src/explain/explainMode.ts`)
   - Uses `getObject()` to fetch complete object info when displaying explanations
   - Automatically includes user-discovered objects
   - Generates defaults for unknown objects

2. **Speech Module Exports** (`src/speech/index.ts`)
   - Exports all object catalog functions
   - Makes it easier to import: `import { getObject } from '../speech'`

3. **User Catalog** (`src/speech/userCatalog.ts`)
   - Calls `refreshCatalog()` after adding new objects
   - Ensures user-discovered objects appear immediately in searches

### How to Use in Other Modules

```typescript
// Option 1: Direct import
import { getObject, searchObjects } from '../sky/objectCatalog';

// Option 2: Via speech module
import { getObject, searchObjects } from '../speech';

// Both are equivalent - use whichever is more convenient
```

## Adding User-Discovered Objects

When the LLM fallback finds a new object, it's automatically integrated:

```typescript
import { addLLMObjectToCatalog } from '../speech/userCatalog';

// This LLM object came from the API
const llmObject = {
  name: "Barnard's Star",
  type: 'star',
  ra: 18.5,
  dec: 20.5,
  magnitude: 9.5,
  constellation: 'Ophiuchus',
  summary: 'Fast-moving red dwarf',
  description: '...',
  distance: '6 light-years',
  season: 'Summer',
  funFact: '...'
};

// Add to user catalog
addLLMObjectToCatalog(llmObject);

// Object is now searchable and appears in all queries
const found = getObject("Barnard's Star");
```

## Performance Characteristics

- **First access:** ~10-50ms (builds index from all sources)
- **Subsequent accesses:** <1ms (cached)
- **Invalidation:** Automatic when user objects are added
- **Memory:** ~50-100KB for ~250 objects (~400 bytes per object)

## Caching & Invalidation

```typescript
import { 
  invalidateCache,  // Clear cache, rebuild on next access
  refreshCatalog    // Clear cache and rebuild immediately
} from '../sky/objectCatalog';

// After major updates
refreshCatalog();

// Or let it rebuild automatically on next query
invalidateCache();
const obj = getObject('Sirius');  // Rebuilds cache here
```

## Migration from Old API

### Old way (don't use)
```typescript
import { getObjectDescription } from '../sky/descriptions';
import { BRIGHT_STARS } from '../sky/stars';

const desc = getObjectDescription('Sirius');
const star = BRIGHT_STARS.find((s) => s.name === 'Sirius');
```

### New way (use this)
```typescript
import { getObject } from '../sky/objectCatalog';

const obj = getObject('Sirius');
// Has all data: description, magnitude, spectral type, everything
```

## Files Modified

### New Files
- `src/sky/objectCatalog.ts` - The centralized catalog

### Modified Files
- `src/speech/userCatalog.ts` - Calls `refreshCatalog()` after adding objects
- `src/speech/index.ts` - Exports catalog functions
- `src/explain/explainMode.ts` - Uses `getObject()` instead of scattered functions

### Unchanged Files (Still Available)
- `src/sky/descriptions.ts` - Still used by catalog internally
- `src/sky/stars.ts` - Still used by catalog internally
- `src/sky/planets.ts` - Still used by catalog internally
- `src/sky/constellations.ts` - Still used by catalog internally

These files are now primarily internal implementation details. Don't import from them directly; use the catalog instead.

## Future Improvements

1. **Constellation Descriptions** - Add detailed descriptions for constellations
2. **Deep Sky Objects** - Integrate Messier/NGC catalog
3. **Variable Stars** - Track magnitude variations
4. **Binary/Multiple Systems** - Store companion data
5. **Historical Names** - Support alternate names/spellings
6. **Categories** - Add custom user-defined categories

## Troubleshooting

### Object not found
- Check exact name spelling: `getObject()` does exact matching, use `searchObjects()` for substring matches
- Is it user-discovered? Call `getUserDiscoveredObjects()` to check

### Stale data after adding user object
- Call `refreshCatalog()` to force rebuild
- Usually happens automatically, but explicitly calling ensures freshness

### Performance issues
- Profile the cache initialization: `Date.now()` around first `getObject()` call
- Consider lazy-loading if catalog grows significantly
- Currently loads ~250 objects in <50ms

---

**Latest Update:** February 15, 2026 - Initial implementation with stars, planets, constellations, and user-discovered objects.
