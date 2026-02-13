# Even Stars 🌟

A real-time sky chart application for Even Realities smart glasses. Displays stars and constellations based on your location and head orientation.

## Features

- 🌌 Real-time star map based on GPS location
- 📱 Gyroscope/head tracking for immersive experience
- ⭐ 100+ brightest stars from Yale Bright Star Catalog
- 🔭 Major constellations with connecting lines
- 🎮 Browser simulation mode (keyboard controls)
- 👓 Native Even Realities glasses integration

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Controls

### Browser Mode (Keyboard)
- **Arrow Keys**: Look around (change azimuth/altitude)
- **R**: Reset view to default

### Glasses Mode
- **Head Movement**: Look around naturally
- **Menu Selection**: Use glasses controls to switch modes

## Modes

1. **Stars**: Display brightest stars with magnitude-based sizing
2. **Constellations**: Show constellation lines connecting stars
3. **Planets**: Future support for planets (currently shows stars)

## Technical Details

### Display
- Canvas: 576x288 pixels (Even glasses display)
- FOV: 60° horizontal × 35° vertical
- Update rate: 10 FPS (optimized for glasses bandwidth)

### Coordinate Systems
- **Celestial**: Right Ascension / Declination
- **Horizontal**: Altitude / Azimuth
- **Canvas**: X/Y pixels (0,0 at top-left)

### Sky Calculations
- Local Sidereal Time (LST) calculation
- RA/Dec to Alt/Az conversion
- Field of view clipping
- Perspective projection to canvas

## Architecture

```
src/
├── main.ts              # Entry point & bridge init
├── sky/
│   ├── calculator.ts    # Celestial coordinate math
│   ├── stars.ts         # Star catalog (~100 stars)
│   ├── constellations.ts # Constellation patterns
│   └── renderer.ts      # Canvas rendering
├── ui/
│   └── containers.ts    # Even glasses UI config
├── sensors/
│   └── gyroscope.ts     # Head tracking + keyboard sim
├── location/
│   └── geolocation.ts   # GPS handling
└── types/
    └── index.ts         # TypeScript interfaces
```

## SDK Integration

Uses `@evenrealities/even_hub_sdk` for:
- Container management (4 max: sky, info, mode selector, status)
- Image data streaming to glasses
- Event handling (menu selections)
- Device status monitoring

## License

MIT
