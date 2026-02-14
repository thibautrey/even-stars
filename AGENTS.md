# Even Stars - Sky Chart for Even Realities Smart Glasses

## Project Overview

Even Stars is a sky chart/skymap application for Even Realities smart glasses. It displays a real-time star map based on the user's geographic location and head orientation (using gyroscope data).

## Tech Stack

- **Language**: TypeScript
- **SDK**: `@evenrealities/even_hub_sdk` (v0.0.7+)
- **Node.js**: ^20.0.0 || >=22.0.0
- **Build Tool**: Vite (recommended) or similar modern bundler

## Core Features

1. **Real-time Sky Map**: Display stars, constellations, and celestial objects based on user's current view direction
2. **Gyroscope Integration**: Use head orientation to update the sky view in real-time
3. **Location-based Calculations**: Calculate celestial positions based on user's GPS coordinates
4. **Even Realities Integration**: Render UI on smart glasses using the Even Hub SDK

## SDK Key Information

> **IMPORTANT**: Toujours se référer au fichier `SDK_DOCUMENTATION.md` pour connaître les capacités complètes du SDK, les méthodes disponibles, les types et les bonnes pratiques officielles. Ce fichier contient la documentation de référence la plus à jour.

### Installation
```bash
npm install @evenrealities/even_hub_sdk
```

### Coordinate System
- **Canvas Size**: 576 x 288 pixels
- **Origin**: Top-left corner (0, 0)
- **X-axis**: Extends rightward (positive values to the right)
- **Y-axis**: Extends downward (positive values downward)

### Container Limits
- **Maximum containers per page**: 4 (total of list + text + image containers)
- **Exactly one container** must have `isEventCapture: 1` (others must be 0)

### Container Types
1. **ListContainer**: Scrollable list items
2. **TextContainer**: Static or dynamic text display
3. **ImageContainer**: For star charts, constellation images (requires `updateImageRawData` after creation)

### Important SDK Methods

```typescript
// Initialize bridge
const bridge = await waitForEvenAppBridge();

// Create UI (must be called first, only once)
await bridge.createStartUpPageContainer({
  containerTotalNum: 2,
  listObject: [...],
  textObject: [...],
  imageObject: [...]
});

// Update page (for subsequent updates)
await bridge.rebuildPageContainer({...});

// Update text content
await bridge.textContainerUpgrade({...});

// Update image data
await bridge.updateImageRawData({...});

// Listen to device status
bridge.onDeviceStatusChanged((status) => {...});

// Listen to user interactions
bridge.onEvenHubEvent((event) => {...});

// Audio control (microphone)
await bridge.audioControl(true/false);
```

## Sky Math & Calculations

### Required Calculations
1. **Local Sidereal Time (LST)**: Calculate based on longitude and current time
2. **Altitude/Azimuth**: Convert celestial coordinates (RA/Dec) to horizontal coordinates
3. **Viewport Clipping**: Determine which stars are visible in current field of view

### Key Formulas
- Hour Angle (HA) = LST - Right Ascension (RA)
- Altitude = arcsin(sin(δ)sin(φ) + cos(δ)cos(φ)cos(HA))
- Azimuth = arctan2(sin(HA), cos(HA)sin(φ) - tan(δ)cos(φ))

Where:
- δ = declination
- φ = observer's latitude
- HA = hour angle

## Architecture

```
src/
├── main.ts              # Entry point, bridge initialization
├── sky/
│   ├── calculator.ts    # Celestial coordinate calculations
│   ├── stars.ts         # Star catalog data
│   ├── constellations.ts # Constellation definitions
│   └── renderer.ts      # Render logic for glasses display
├── ui/
│   ├── containers.ts    # UI container definitions
│   └── layout.ts        # Layout management
├── sensors/
│   └── gyroscope.ts     # Head orientation tracking
├── location/
│   └── geolocation.ts   # GPS/location services
└── types/
    └── index.ts         # TypeScript interfaces
```

## UI Strategy for Glasses

Given the limited display area (576x288) and container constraints:

1. **Main View Container**: Large image container showing the current sky view
2. **Info Container**: Small text container showing selected object name/magnitude
3. **Navigation Container**: List container for mode selection (Stars, Constellations, Planets)
4. **Status Container**: Battery, connection status

### Image Update Strategy
- Use `updateImageRawData` to refresh sky view
- Implement throttling (max ~10-15fps to avoid overloading)
- Use monochrome/simple graphics for efficient transmission

## Development Guidelines

1. **Auto-initialization**: SDK auto-initializes, use `waitForEvenAppBridge()` before any SDK calls
2. **Event Cleanup**: Always unsubscribe from listeners when components unmount
3. **Image Queuing**: Never send images concurrently - queue them
4. **Error Handling**: Handle `StartUpPageCreateResult` errors appropriately
5. **Type Safety**: Use full TypeScript support provided by SDK

## Implementation Plan Workflow

The project uses an `IMPLEMENTATION_PLAN.md` file to track development tasks and progress.

### When the User Says "Continue Implementation"

If the user asks to "continue implementation" and your context is empty (not in the middle of an implementation), follow this workflow:

1. **Read the implementation plan** - Read `IMPLEMENTATION_PLAN.md` to understand the current state and pending tasks
2. **Implement the next task** - Identify and implement the next pending task from the plan
3. **Update the implementation plan** - After completing the task, update `IMPLEMENTATION_PLAN.md` to mark the task as done and reflect the current progress

This ensures continuity between sessions and maintains a clear record of what has been accomplished.

## Testing

- Use browser DevTools for initial UI layout testing
- Test on actual glasses for gyroscope and display accuracy
- Verify star positions against known astronomy apps

## Resources

- **SDK Documentation**: `SDK_DOCUMENTATION.md` - Documentation de référence complète du SDK (toujours consulter en premier pour les capacités du SDK)
- **SDK Package**: https://www.npmjs.com/package/@evenrealities/even_hub_sdk
- **Star Catalog**: Use Yale Bright Star Catalog or similar (subset of ~100-300 brightest stars)
- **Astronomy Algorithms**: Reference "Astronomical Algorithms" by Jean Meeus

## License

MIT (same as Even Hub SDK)
