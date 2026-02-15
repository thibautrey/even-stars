# Even Stars – Implementation Plan (v3 - Actionable)

## Project Overview

Even Stars is a **heads-up astronomical compass** for Even Realities smart glasses.

**Current Status**: Codebase has a functional dense sky-chart implementation  
**Target**: Pivot to minimal "astronomical compass" optimized for glanceable AR

---

# ⚠️ Strategic Pivot Summary

| Before (Current Code) | After (Target) |
|----------------------|----------------|
| Dense real-time sky chart (~100 stars rendered) | Contextual guidance (1-3 labels max) |
| Image-based rendering (canvas sky map) | Text-first rendering, minimal icons |
| Complex dual-menu navigation | Simple mode switching |
| 10 FPS image streaming | Text updates preferred, throttled images |
| Full star catalog visualization | Nearest bright object identification only |

**Core Principle**: *The sky is the UI. Overlays are hints.*

---

# Gap Analysis: Current Code vs Plan

## ✅ What's Already Implemented

### Foundation (Phase 1)
- [x] TypeScript + Vite setup
- [x] Even Hub SDK integration (`waitForEvenAppBridge`, `createStartUpPageContainer`)
- [x] Type system (`Star`, `HorizontalCoords`, `GeoLocation`, `HeadOrientation`)
- [x] Location services (GPS, fallback to Greenwich, localStorage persistence)
- [x] Gyroscope integration (device + keyboard simulation fallback)

### Sky Math & Data (Phase 2)
- [x] Complete celestial calculations (`calculator.ts`)
  - Julian Date, GMST, LST
  - RA/Dec → Alt/Az conversion
  - Hour angle calculations
  - Field of view clipping
- [x] Star catalog (100+ bright stars from Yale catalog)
- [x] Constellation definitions (12 major constellations with line patterns)
- [x] Planet orbital calculations (Mercury through Saturn)
- [x] Deep sky object catalog (Messier objects)

### Accuracy Overhaul (Completed)
- [x] **Gnomonic (tangent-plane) projection** – replaces naive linear delta-Az/Alt mapping; correctly handles spherical geometry, azimuth convergence near zenith, and head roll (`calculator.ts` → `gnomonicProject()`)
- [x] **IAU 1976 precession (Lieske)** – corrects J2000.0 catalog positions to the observation date (~0.36° by 2026) (`calculator.ts` → `precessJ2000()`)
- [x] **Saemundsson atmospheric refraction** – lifts objects near the horizon by ~0.5° to match visual reality (`calculator.ts` → `applyRefraction()`)
- [x] **Correct FOV** – updated from 60°×35° to 25°×7.8125° matching Even Realities G1 spec (25° horizontal, 200/640 aspect ratio)
- [x] **Full renderer rewrite** – every render function (`renderStar`, `renderPlanet`, `renderConstellation`, `renderCardinalMarkers`, `renderHorizon`, `renderDeepSkyObject`, `renderStarLabels`, `renderIdentifyOverlay`, `renderFinderArrow`, `calculateDirectionToTarget`) now uses gnomonic projection
- [x] **Detector FOV update** – `identify/detector.ts` default FOV updated to 25°×7.8125°, max identification distance reduced to 8°

### Current Rendering (Phase 3 - To be refactored)
- [x] Canvas-based sky renderer (`renderer.ts`)
- [x] Star rendering with magnitude-based sizing
- [x] Constellation line rendering
- [x] Planet rendering with symbols
- [x] Deep sky object rendering
- [x] Cardinal direction markers (N/NE/E/SE/S/SW/W/NW)
- [x] Label collision avoidance
- [x] Finder arrow guidance to targets
- [x] Image streaming to glasses (`updateImageRawData`)

### UI & Menus (Phase 4 - To be simplified)
- [x] Dual menu system (left + right)
- [x] Search/finder menu with categories (Stars, Planets, DSO, Constellations)
- [x] View filter menu (Stars vs Deep Sky with sub-filters)
- [x] Menu navigation with back functionality
- [x] SDK container management (3 containers: sky view + 2 menus)

### Target Finder (Phase 5 - Partial)
- [x] Searchable object catalog (`searchCatalog.ts`)
- [x] Target selection via menu
- [x] Arrow rendering pointing to target
- [x] Distance calculation and guidance text

## ❌ What's Missing / Misaligned

### Critical Gaps

1. **AppMode System** ✅ - Implemented `AppMode` enum (`Identify`, `TargetFinder`, `ConstellationHints`)

2. **FocusTarget Model** ✅ - Implemented `FocusTarget` type with id, name, type, ra, dec, magnitude, info, and direction properties

3. **Text-First Rendering** - Current code renders full canvas sky map. Plan requires:
   - Text overlays as primary
   - Images only for arrows/icons
   - Max 1-3 labeled objects visible

4. **Identify Mode** - Plan calls for "auto-detect nearest bright object, show name only if confident" - NOT IMPLEMENTED

5. **Simplified Container Strategy** 🔄 - Partially implemented:
   - Single menu container for mode selection ✅
   - Image container for sky view (to be replaced with text-first rendering)
   - Text container for info display (to be added)

6. **Performance Optimizations** - Plan specifies:
   - 5-10 FPS logic (✓ partially done)
   - Prefer text updates over images
   - Auto-throttle on low battery
   - Pause when not wearing

7. **Glanceable UX** - Current renders dense star field. Target is:
   - < 1 second to read
   - No dense visuals
   - Contextual overlays only

---

# Implementation Roadmap

## Phase 1: Type System Alignment ✅

**Goal**: Align types with new "astronomical compass" architecture

### Task 1.1: Add AppMode Enum ✅
```typescript
// Add to types/index.ts
export enum AppMode {
  Identify = 'identify',       // Auto-detect what's being looked at
  TargetFinder = 'finder',     // Guide to selected target
  ConstellationHints = 'hints' // Show constellation outlines only
}
```

**Files modified**: `src/types/index.ts`

### Task 1.2: Create FocusTarget Model ✅
```typescript
// Add to types/index.ts
export interface FocusTarget {
  id: string;
  name: string;
  type: 'star' | 'planet' | 'constellation' | 'deepsky';
  ra: number;
  dec: number;
  magnitude?: number;
  info?: string;
  // For rendering guidance
  direction?: {
    azimuth: number;
    altitude: number;
    distance: number;
  };
}
```

**Files modified**: `src/types/index.ts`

### Task 1.3: Update AppState Interface ✅
Created new `CompassState` interface replacing `ViewMode`-centric state:
- Replaced `viewMode: ViewMode` with `appMode: AppMode`
- Replaced `finderTarget: SearchableObject | null` with `focusTarget: FocusTarget | null`
- Simplified menu state to single selector

**Files modified**: `src/types/index.ts`

---

## Phase 2: Identify Mode Implementation 🆕

**Goal**: Implement "Identify what I'm looking at" - the primary compass feature

### Task 2.1: Create Object Detection Engine ✅
```typescript
// src/identify/detector.ts
export function findNearestObject(
  orientation: HeadOrientation,
  location: GeoLocation,
  options: Partial<DetectionOptions>
): IdentifiedObject | null;

export function calculateConfidence(
  angularDistance: number,
  maxDistance: number
): number; // 0-1 confidence score
```

**New files**: 
- `src/identify/detector.ts` - Core detection engine
- `src/identify/index.ts` - Public API exports

**Features implemented**:
- `findNearestObject()` - Finds the nearest bright object to current view direction
- `findObjectsInView()` - Returns all objects within FOV, sorted by distance
- `getCandidateObjects()` - Filters visible objects by magnitude and altitude
- `calculateConfidence()` - Calculates confidence score (0-1) based on angular distance
- `formatIdentificationText()` - Formats object info for display
- `isConfidentIdentification()` - Checks if confidence exceeds threshold
- `sphericalDistance()` - Haversine formula for accurate angular distance
- Supports stars (from BRIGHT_STARS catalog) and planets
- Configurable FOV, magnitude limit, altitude threshold, and max identification distance

### Task 2.2: Implement Identify Logic ✅
- Query visible objects based on head orientation
- Calculate angular distance to each
- Return nearest object with confidence score
- Filter by magnitude (only bright objects)

**Logic**:
1. Get all stars above horizon with magnitude < 2.5
2. Calculate angular distance from current view center
3. Return closest if within FOV, null otherwise
4. Confidence = 1 - (angular_distance / max_distance)

**New file**: `src/identify/identifyMode.ts`

**Features implemented**:
- `IdentifyModeManager` class - State machine for identification process
  - States: Idle → Scanning → Identified → Lost → Idle
  - Sustained confidence tracking (requires multiple consecutive confident reads)
  - Lost timeout (maintains "Lost" state briefly before resetting)
  - Throttling (configurable update interval)
- `IdentifyState` enum: Idle, Scanning, Identified, Lost
- `IdentifyModeConfig` - Configuration for behavior tuning
- `updateIdentifyMode()` - Main integration point with `CompassState`
- Global singleton pattern via `getIdentifyManager()` for app-wide state
- Automatic state transitions with hysteresis to prevent flickering

### Task 2.3: Add Text-Based Info Panel ✅
Replace dense sky rendering with text overlay:
```
┌─────────────────────────┐
│  ★ SIRIUS              │  <- Primary text (bright, large)
│  Mag -1.5 · Canis Major │  <- Secondary text (smaller)
└─────────────────────────┘
```

**New files**: 
- `src/ui/infoPanel.ts` - Info panel manager and rendering
- `src/ui/index.ts` - UI module exports

**Modified files**:
- `src/ui/containers.ts` - Added `createInfoTextContainer()` and updated `createSimplifiedStartupConfig()` to include text container
- `src/main.ts` - Integrated info panel updates into render loop and glasses display update

**Features implemented**:
- `InfoPanelManager` class - Manages text content for different app modes
  - `updateFromAppState()` - Gets appropriate content based on current app mode
  - `renderToCanvas()` - Renders panel to browser companion display
  - Supports all modes: Identify, TargetFinder, ConstellationHints
- `InfoPanelState` enum: Idle, Scanning, Identified, Lost, TargetFinder
- `InfoPanelContent` interface: primary, secondary, tertiary text lines
- `updateInfoPanel()` - Convenience function for main loop
- `formatForSDK()` - Converts content to SDK text format
- SDK integration via `textContainerUpgrade` for glasses display
- Automatic text update throttling (only sends when content changes)

---

## Phase 3: Text-First Rendering Engine 🆕

**Goal**: Replace canvas sky map with minimal text/icon overlay

### Task 3.1: Create Text Renderer
```typescript
// src/rendering/textRenderer.ts
export interface TextOverlay {
  primary: string;      // "SIRIUS"
  secondary?: string;   // "Mag -1.5 · Canis Major"
  direction?: string;   // "← 15° up" (for off-center targets)
}

export function renderTextOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: TextOverlay,
  position: 'center' | 'top' | 'bottom'
): void;
```

**New file**: `src/rendering/textRenderer.ts`

### Task 3.2: Create Arrow/Icon Renderer
```typescript
// src/rendering/iconRenderer.ts
export function renderDirectionArrow(
  ctx: CanvasRenderingContext2D,
  angle: number,        // Direction to target
  distance: number,     // Angular distance
  isInView: boolean
): void;

export function renderConstellationHint(
  ctx: CanvasRenderingContext2D,
  constellation: Constellation,
  orientation: HeadOrientation
): void; // Minimal dotted lines
```

**New file**: `src/rendering/iconRenderer.ts`

### Task 3.3: Refactor Main Render Loop
Replace `renderSkyToBuffer` with mode-aware renderer:
```typescript
export function renderCompassView(
  ctx: CanvasRenderingContext2D,
  state: {
    appMode: AppMode;
    focusTarget: FocusTarget | null;
    identifiedObject: IdentifiedObject | null;
    orientation: HeadOrientation;
    location: GeoLocation;
  }
): void {
  // Clear canvas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  switch (state.appMode) {
    case AppMode.Identify:
      renderIdentifyMode(ctx, state.identifiedObject);
      break;
    case AppMode.TargetFinder:
      renderFinderMode(ctx, state.focusTarget, state.orientation);
      break;
    case AppMode.ConstellationHints:
      renderConstellationMode(ctx, state.orientation, state.location);
      break;
  }
}
```

**Files to modify**: `src/sky/renderer.ts` (major refactor)

---

## Phase 4: Simplified Container Architecture 🔄

**Goal**: Reduce from 3 containers to simpler layout

### Task 4.1: Redesign Container Layout
**Current**: Image (sky) + Left Menu + Right Menu = 3 containers

**New**: 
```
┌─────────────────────────────────────────┐
│                                         │
│     [Text Info - Center or Top]        │  <- Text container
│                                         │
│         [Arrow/Icon if needed]         │  <- Part of text or minimal image
│                                         │
└─────────────────────────────────────────┘
│  [Mode: Identify ▼]                     │  <- Single list container
└─────────────────────────────────────────┘
```

**Files to modify**: `src/ui/containers.ts`

### Task 4.2: Simplify Menu System ✅
Replaced dual-menu with single mode selector:
- Menu items: `["Identify", "Find Target", "Constellations"]`
- Click to select mode directly
- No submenus in initial version

**Files created**:
- `src/ui/simpleMenu.ts` - New simplified menu module

**Files modified**:
- `src/ui/containers.ts` - Added `createSingleMenuContainer()` and `createSimplifiedStartupConfig()`
- `src/main.ts` - Refactored to use simplified menu system and `CompassState`

### Task 4.3: Implement Text Container Upgrades
Use SDK's `textContainerUpgrade` for updates instead of image streaming:
```typescript
await bridge.textContainerUpgrade({
  containerID: CONTAINER_IDS.INFO,
  content: identifiedObject 
    ? `${identifiedObject.name}\nMag ${identifiedObject.magnitude}`
    : "Looking..."
});
```

**Files to modify**: `src/main.ts`, `src/ui/containers.ts`

---

## Phase 5: Target Finder Refinement 🔄

**Goal**: Improve existing finder with simpler UX

### Task 5.1: Simplify Target Selection
Instead of hierarchical menu:
1. Mode: Find Target
2. Click to show list of brightest objects (top 20)
3. Click object to select
4. Arrow guides to target

### Task 5.2: Enhance Arrow Guidance
Current has basic arrow. Enhance with:
- Distance readout ("23° away")
- Simple direction text ("Look up and left")
- Green crosshair when target in view

**Files to modify**: `src/sky/renderer.ts` (refactor arrow rendering)

---

## Phase 6: Constellation Hints Mode 🆕

**Goal**: Minimal constellation overlay

### Task 6.1: Contextual Constellation Display
- Only show constellation currently being faced
- 3-5 dotted lines max
- Auto-fade when looking away
- Show constellation name only

**Files to modify**: `src/sky/constellations.ts` (add visibility check)

---

## Phase 7: Performance & Polish 🔄

### Task 7.1: Implement Throttling
- Render loop: 5 FPS max for images
- Text updates: immediate via SDK
- Image updates: only when necessary

### Task 7.2: Battery Awareness
```typescript
// Monitor battery and reduce update rate
if (batteryLevel < 20) {
  RENDER_INTERVAL = 500; // 2 FPS
}
```

### Task 7.3: Pause When Not Wearing
Use device status to pause updates when glasses not worn.

**Files to modify**: `src/main.ts`, `src/sensors/gyroscope.ts`

---

## Phase 8: Cleanup & Deprecation 🧹

### Task 8.1: Remove Deprecated Code
- [ ] Remove `ViewMode` enum (after migration)
- [ ] Remove complex filter enums (if not needed)
- [ ] Remove dual-menu system
- [ ] Remove dense star rendering code (or move to debug mode)
- [ ] Remove deep sky object rendering (optional for v1)

### Task 8.2: Consolidate Types
- Merge `SearchableObject` into `FocusTarget`
- Remove unused type definitions
- Clean up `types/search.ts`

---

# Task Priority Queue

## Week 1: Foundation
1. ✅ **Task 1.1**: Add AppMode enum
2. ✅ **Task 1.2**: Create FocusTarget model  
3. ✅ **Task 1.3**: Update AppState
4. ✅ **Task 4.2**: Simplify menu to single selector

## Week 2: Identify Mode
5. ✅ **Task 2.1**: Create object detection engine
6. ✅ **Task 2.2**: Implement identify logic
7. ✅ **Task 2.3**: Add text info panel

## Week 3: Rendering Refactor
8. 🆕 **Task 3.1**: Create text renderer
9. 🆕 **Task 3.2**: Create icon renderer
10. 🔄 **Task 3.3**: Refactor main render loop

## Week 4: Polish
11. 🔄 **Task 5.2**: Enhance arrow guidance
12. 🆕 **Task 6.1**: Constellation hints mode
13. 🔄 **Task 7.1**: Implement throttling

## Week 5: Finalize
14. 🔄 **Task 4.1**: Final container layout
15. 🔄 **Task 4.3**: Text container upgrades
16. 🧹 **Task 8.1**: Remove deprecated code

---

# Testing Checklist

- [ ] Identify mode shows nearest bright star within 2 seconds
- [ ] Target finder arrow points correctly (verify with known objects)
- [ ] Constellation mode only shows relevant constellation
- [ ] Text is readable on actual glasses display
- [ ] Menu navigation works with single click
- [ ] Battery lasts > 2 hours of continuous use
- [ ] App pauses when glasses are removed

---

# Migration Notes

## Preserving Current Code
The current sky chart implementation is valuable for:
- Browser debugging/companion view
- Future "detailed view" mode
- Desktop simulation

**Recommendation**: Keep `renderer.ts` as `detailedRenderer.ts` for debug builds.

## SDK Compatibility
Current SDK usage patterns remain valid:
- `waitForEvenAppBridge()` - keep
- `createStartUpPageContainer()` - keep
- `rebuildPageContainer()` - keep
- `updateImageRawData()` - minimize usage
- `textContainerUpgrade()` - use more frequently

---

# Success Criteria

1. **Glanceability**: User can identify what they're looking at in < 1 second
2. **Simplicity**: No more than 3 interactive elements
3. **Performance**: 5+ hour battery life with typical use
4. **Accuracy**: Object identification accurate to within 5 degrees
5. **Reliability**: Works without internet, only needs GPS + gyro

---

*Last Updated: 2026-02-14*  
*Status: Ready for implementation*
