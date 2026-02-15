# Quick Reference - Using Deep Sky Objects

## Import the Functions

```typescript
import {
  getObject,
  getDeepSkyByCatalogId,
  getDeepSkyBySubType,
  getObjectsByType,
  SearchObjectType,
} from '../speech';
```

## Common Queries

### Get Objects by Catalog ID (Messier/NGC)
```typescript
// Exact match
const andromeda = getDeepSkyByCatalogId('M31');
const orion = getDeepSkyByCatalogId('m42');  // Case-insensitive
```

### Get All Galaxies
```typescript
const galaxies = getDeepSkyBySubType('galaxy');
// M31, M33, M51, M64, M74, M77, M81, M82, M104
```

### Get All Nebulas
```typescript
const nebulas = getDeepSkyBySubType('nebula');
// M42, M43, M20, M8, M17
```

### Get All Clusters
```typescript
const clusters = getDeepSkyBySubType('cluster');
// M2, M3, M5, M10, M13, M15, M22, M92 (globular)
// M6, M7, M11, M35, M37, M44, M45 (open)
```

### Get All Deep Sky Objects
```typescript
const allDeepSky = getObjectsByType(SearchObjectType.DeepSky);
```

### Search by Name (Substring)
```typescript
const results = searchObjects('orion');
// Finds: Orion Nebula (M42), etc.

const galaxies = searchObjects('galaxy');
// Finds: Andromeda Galaxy, Triangulum Galaxy, Whirlpool Galaxy, etc.
```

### Search by Constellation
```typescript
const sagittariusObjects = getObjectsByConstellation('Sagittarius');
// Includes: Lagoon Nebula (M8), Omega Nebula (M17), Wild Duck (M11), etc.
```

## Object Details

Once you have an object:

```typescript
const obj = getDeepSkyByCatalogId('M31');

// Summary and description
console.log(obj.summary);       // "Nearest major galaxy, larger than the Milky Way"
console.log(obj.description);   // Full 3-6 sentence description
console.log(obj.distance);      // "2.5 million light-years"

// Coordinates
console.log(obj.ra);            // 0.7125 (hours)
console.log(obj.dec);           // 41.2688 (degrees)
console.log(obj.magnitude);     // 3.4

// Metadata
console.log(obj.deepSkyType);   // "galaxy"
console.log(obj.catalogId);     // "M31"
console.log(obj.season);        // "Autumn/Winter"
console.log(obj.funFact);       // "Andromeda is so large that under dark skies..."
```

## Rendering Examples

### Star Field Display
```typescript
const deepSky = getObjectsByType(SearchObjectType.DeepSky);

deepSky.forEach((obj) => {
  // Plot on star chart
  plotter.addObject({
    x: calculateScreenX(obj.ra),
    y: calculateScreenY(obj.dec),
    symbol: getSymbolForType(obj.deepSkyType),  // Different for galaxy/nebula/cluster
    brightness: obj.magnitude,
  });
});
```

### Info Card Display
```typescript
function displayObjectInfo(obj: CelestialObject) {
  if (obj.deepSkyType) {
    // Deep sky object
    card.title = `${obj.catalogId} - ${obj.name}`;
    card.subtitle = `${obj.deepSkyType.replace('_', ' ')} · Mag ${obj.magnitude}`;
  }
  
  card.summary = obj.summary;
  card.details = obj.description;
  card.season = obj.season;
  card.distance = obj.distance;
  card.funFact = obj.funFact;
}
```

### Search Interface
```typescript
function handleSearch(query: string) {
  const results = searchObjects(query);
  
  results.objects.forEach((obj) => {
    const type = obj.deepSkyType || obj.type;  // Use deepSkyType if available
    addSearchResult({
      name: obj.name,
      icon: getIconFor(type),
      subtitle: obj.summary,
      catalogId: obj.catalogId,  // Show M/NGC number if available
    });
  });
}
```

## Available Deep Sky Objects (Quick List)

### Messier Galaxies
M31, M33, M51, M64, M74, M77, M81, M82, M104

### Messier Nebulas
M1, M8, M17, M20, M27, M42, M43, M57, M97

### Messier Clusters
M2, M3, M5, M6, M7, M10, M11, M13, M15, M22, M35, M37, M44, M45, M92

## Notes

- All objects are in the unified catalog alongside stars and planets
- Case-insensitive search (both 'm31' and 'M31' work)
- All contain distance, season, and fun fact information
- Suitable for amateur observation with binoculars or small telescopes
- All coordinates are in J2000 epoch
