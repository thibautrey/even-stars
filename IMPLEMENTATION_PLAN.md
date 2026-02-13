# Even Stars - Implementation Plan

## Project Overview

Even Stars is a real-time sky chart application for Even Realities smart glasses. It displays a star map based on the user's geographic location and head orientation using gyroscope data.

**Current Status**: Foundation implemented, core features functional  
**Target**: Production-ready sky chart with accurate astronomical positioning

---

## Phase 1: Core Foundation ✅ COMPLETED

### 1.1 Project Setup ✅
- [x] Initialize TypeScript project with Vite
- [x] Install Even Hub SDK (`@evenrealities/even_hub_sdk` v0.0.7)
- [x] Configure build tools and TypeScript settings
- [x] Set up project structure (`src/`, `dist/`, `public/`)

### 1.2 Type System ✅
- [x] Define core types (`src/types/index.ts`)
  - [x] `Star` - HR number, name, RA/Dec, magnitude, spectral type
  - [x] `HorizontalCoords` - Altitude/azimuth
  - [x] `GeoLocation` - Latitude/longitude/altitude
  - [x] `HeadOrientation` - Azimuth/pitch/roll
  - [x] `Constellation` - Lines and star references
  - [x] `ViewMode` - Stars/Constellations/Planets enum
  - [x] `AppState` - Application state management

### 1.3 Location Services ✅
- [x] Implement geolocation wrapper (`src/location/geolocation.ts`)
  - [x] Browser geolocation API integration
  - [x] Position watching for real-time updates
  - [x] localStorage persistence for last known location
  - [x] Default fallback (Greenwich Observatory)
  - [x] Location formatting utilities

### 1.4 Sensor Integration ✅
- [x] Gyroscope handling (`src/sensors/gyroscope.ts`)
  - [x] DeviceOrientation API integration
  - [x] iOS 13+ permission handling
  - [x] Keyboard simulation fallback for desktop testing
  - [x] Arrow key controls (↑↓←→) + R (reset)
  - [x] Orientation normalization and formatting

---

## Phase 2: Sky Math & Data ✅ COMPLETED

### 2.1 Star Catalog ✅
- [x] Bright star dataset (`src/sky/stars.ts`)
  - [x] ~100 brightest stars (magnitude < 3.0)
  - [x] HR numbers, common names, RA/Dec coordinates
  - [x] Spectral types and magnitudes
  - [x] Helper functions: `getStarByHR()`, `getStarsByMagnitude()`

### 2.2 Constellation Definitions ✅
- [x] Line patterns for 12 major constellations (`src/sky/constellations.ts`)
  - [x] Orion, Ursa Major, Cassiopeia, Ursa Minor
  - [x] Gemini, Canis Major, Leo, Scorpius
  - [x] Crux, Cygnus, Aquila, Taurus
  - [x] Star-to-HR mapping for line connections

### 2.3 Celestial Calculations ✅
- [x] Coordinate transformation engine (`src/sky/calculator.ts`)
  - [x] Julian Date calculation
  - [x] Greenwich Mean Sidereal Time (GMST)
  - [x] Local Sidereal Time (LST) from longitude
  - [x] Hour Angle calculation
  - [x] Equatorial to Horizontal conversion (RA/Dec → Alt/Az)
  - [x] Angular distance between celestial objects
  - [x] Field of view clipping logic
  - [x] Canvas projection with FOV mapping
  - [x] Simplified Moon position calculation

---

## Phase 3: Rendering Engine ✅ COMPLETED

### 3.1 Canvas Rendering ✅
- [x] Browser canvas implementation (`src/sky/renderer.ts`)
  - [x] 576x288 pixel output (matching glasses resolution)
  - [x] Star rendering with magnitude-based sizing
  - [x] Opacity gradient for brightness levels
  - [x] Glow effect for bright stars (magnitude < 1.5)
  - [x] Constellation line drawing
  - [x] Cardinal direction markers (N/E/S/W)
  - [x] Horizon line rendering
  - [x] Selected star highlight ring

### 3.2 Image Generation ✅
- [x] Binary image data generation for SDK
  - [x] RGB to grayscale conversion
  - [x] Alpha channel application
  - [x] Uint8Array output for `updateImageRawData`

---

## Phase 4: UI & Glasses Integration ✅ COMPLETED

### 4.1 Container Layout ✅
- [x] UI container definitions (`src/ui/containers.ts`)
  - [x] Sky view container (576x220) - main display
  - [x] Info panel (280x58) - object data
  - [x] Mode selector (130x58) - Stars/Constellations/Planets
  - [x] Status bar (126x58) - connection/battery
  - [x] Proper `isEventCapture` assignment (only mode selector = 1)

### 4.2 SDK Integration ✅
- [x] Bridge initialization (`src/main.ts`)
  - [x] `waitForEvenAppBridge()` handling
  - [x] `createStartUpPageContainer()` with 4 containers
  - [x] Error handling for container creation (codes 0-3)
  - [x] Graceful fallback to browser-only mode

### 4.3 Event Handling ✅
- [x] Device status monitoring
  - [x] `onDeviceStatusChanged` listener
  - [x] Connection state tracking
- [x] User input handling
  - [x] `onEvenHubEvent` for list selections
  - [x] Mode switching (Stars/Constellations/Planets)

### 4.4 Update System ✅
- [x] Real-time display updates
  - [x] `updateImageRawData()` for sky view
  - [x] `textContainerUpgrade()` for info/status
  - [x] Image update queuing (prevents concurrent sends)
  - [x] 10 FPS render throttling

---

## Phase 5: Enhancements & Polish 🚧 IN PROGRESS

### 5.1 Extended Star Catalog 🚧
- [ ] Expand to 300+ stars (magnitude < 4.5)
- [ ] Add more named stars with common names
- [ ] Include double stars and variable stars
- [ ] Add deep sky objects (Messier catalog subset)
  - [ ] Andromeda Galaxy (M31)
  - [ ] Orion Nebula (M42)
  - [ ] Pleiades (M45)
  - [ ] Ring Nebula (M57)

### 5.2 Additional Constellations 📋
- [ ] Add 15+ more constellations
  - [ ] Draco, Hercules, Lyra
  - [ ] Pegasus, Perseus, Andromeda
  - [ ] Sagittarius, Capricornus, Aquarius
  - [ ] Virgo, Libra, Ophiuchus
  - [ ] Canis Minor, Lynx, Corona Borealis

### 5.3 Planet Rendering 📋
- [ ] Accurate planet position calculations
  - [ ] Mercury, Venus, Mars, Jupiter, Saturn
  - [ ] Ephemeris data or simplified orbital elements
- [ ] Special rendering for planets
  - [ ] Different icon/size from stars
  - [ ] Planet symbols or names
- [ ] Mode integration (Planets view)

### 5.4 Performance Optimization 📋
- [ ] Spatial indexing for stars (quadtree/octree)
- [ ] Visibility culling improvements
- [ ] Render only visible constellations
- [ ] Optimize canvas operations
- [ ] Reduce SDK update frequency when idle

### 5.5 UI Improvements 📋
- [ ] Add magnitude limit slider/control
- [ ] Constellation name labels
- [ ] Star name labels on selection
- [ ] Coordinates display (RA/Dec or Alt/Az)
- [ ] Time display (local/sidereal)
- [ ] Twilight/dark mode detection

### 5.6 Calibration & Accuracy 📋
- [ ] Compass calibration helper
- [ ] Magnetic declination correction
- [ ] Location accuracy indicator
- [ ] Time synchronization check

---

## Phase 6: Testing & Quality Assurance 📋

### 6.1 Unit Testing 📋
- [ ] Calculator function tests
  - [ ] Julian Date accuracy
  - [ ] LST calculation verification
  - [ ] Coordinate transformations
- [ ] Star catalog integrity
  - [ ] All HR numbers valid
  - [ ] Constellation lines reference existing stars

### 6.2 Integration Testing 📋
- [ ] End-to-end browser testing
  - [ ] Location services
  - [ ] Orientation tracking
  - [ ] Render loop performance
- [ ] SDK integration tests
  - [ ] Container creation
  - [ ] Image updates
  - [ ] Event handling

### 6.3 Accuracy Verification 📋
- [ ] Star position accuracy checks
  - [ ] Compare against Stellarium/Cartes du Ciel
  - [ ] Verify at different latitudes
  - [ ] Verify at different times
- [ ] Field of view calibration
  - [ ] Match actual glasses FOV

### 6.4 Device Testing 📋
- [ ] Even Realities glasses testing
  - [ ] Display clarity
  - [ ] Update latency
  - [ ] Battery impact
- [ ] Mobile device testing
  - [ ] iOS Safari
  - [ ] Android Chrome
  - [ ] Permission flows

---

## Phase 7: Advanced Features 📋

### 7.1 Interactive Features 📋
- [ ] Star/object selection system
  - [ ] Head-tracking selection (look to select)
  - [ ] Tap/gesture selection
  - [ ] Object details display
- [ ] Search functionality
  - [ ] Find star by name
  - [ ] Find constellation
  - [ ] Find planet

### 7.2 Time Controls 📋
- [ ] Time travel feature
  - [ ] Fast forward/rewind
  - [ ] Specific date/time input
  - [ ] Animation playback
- [ ] Rise/set times
  - [ ] Show when objects become visible

### 7.3 Data Enhancements 📋
- [ ] Star information database
  - [ ] Distance
  - [ ] Spectral class details
  - [ ] Historical/cultural info
- [ ] Satellite tracking (ISS, etc.)
- [ ] Meteor shower notifications

### 7.4 Settings & Preferences 📋
- [ ] User preferences
  - [ ] Magnitude limit
  - [ ] Constellation lines on/off
  - [ ] Cardinal markers on/off
  - [ ] Horizon display on/off
- [ ] Location presets
  - [ ] Save favorite locations
  - [ ] Quick-switch locations

---

## Technical Architecture

### File Structure
```
src/
├── main.ts                 # Entry point, lifecycle management
├── types/
│   └── index.ts            # TypeScript interfaces
├── sky/
│   ├── calculator.ts       # Celestial math
│   ├── stars.ts            # Star catalog
│   ├── constellations.ts   # Constellation patterns
│   └── renderer.ts         # Canvas rendering
├── ui/
│   ├── containers.ts       # SDK container definitions
│   └── layout.ts           # Layout helpers (if needed)
├── sensors/
│   └── gyroscope.ts        # Orientation tracking
└── location/
    └── geolocation.ts      # GPS services
```

### Key Dependencies
- `@evenrealities/even_hub_sdk` - Glasses communication
- TypeScript 5.x - Type safety
- Vite 7.x - Build tool

### SDK Constraints
- Canvas: 576x288 pixels
- Max 4 containers per page
- Exactly 1 container with `isEventCapture: 1`
- Image updates via `updateImageRawData()`
- Text updates via `textContainerUpgrade()`

### Performance Targets
- Render loop: 10 FPS (100ms interval)
- Image update queue: Single concurrent
- Star rendering: 100-300 stars visible
- Memory: < 50MB heap usage

---

## Development Workflow

### Build Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

### Testing Checklist (Per Release)
1. [ ] Browser mode renders correctly
2. [ ] Keyboard controls work (←↑↓→, R)
3. [ ] Geolocation acquires position
4. [ ] SDK connects to glasses
5. [ ] Mode switching works
6. [ ] Star positions accurate
7. [ ] Constellation lines render
8. [ ] No memory leaks (monitor heap)

---

## Known Issues & Limitations

### Current Limitations
1. **Star catalog limited** - Only ~100 brightest stars
2. **No planets** - Position calculation not implemented
3. **Limited constellations** - Only 12 defined
4. **No DSOs** - No galaxies/nebulae displayed
5. **Fixed FOV** - 60°×35° assumed, may not match actual glasses

### SDK Limitations
- Monochrome display only (grayscale)
- Limited update rate (~10-15 FPS max)
- Container constraints (4 max)
- No direct pixel access (must use image containers)

---

## Milestones

| Milestone | Status | Target Date |
|-----------|--------|-------------|
| Foundation Complete | ✅ | Done |
| Basic Star Chart | ✅ | Done |
| Glasses Integration | ✅ | Done |
| Extended Catalog | 🚧 | TBD |
| Planet Support | 📋 | TBD |
| Production Release | 📋 | TBD |

---

## Resources

- **Even Hub SDK**: https://www.npmjs.com/package/@evenrealities/even_hub_sdk
- **Astronomical Algorithms**: Jean Meeus
- **Yale Bright Star Catalog**: http://tdc-www.harvard.edu/catalogs/bsc5.html
- **Stellarium**: Reference for position verification

---

*Last Updated: 2026-02-13*
