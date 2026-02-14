
Arrows guide your head movement until the object is centered.

---

## 🌌 Constellation Hints

- Major constellations only  
- Soft dotted lines  
- Only visible when facing them  
- Auto-fade when not relevant  

---

## 🌙 Future Extensions

- Moon phase & direction  
- Planet visibility  
- ISS pass alerts  
- Deep-sky object pointers  

---

# 🎮 Input Model

## Gyroscope (Primary Input)

Used for:

- Sky orientation  
- Object detection  
- Automatic context switching  

User mostly interacts by looking.

---

## Smart Ring (Secondary Input)

Minimal actions:

### Click
- Cycle modes  
  - Identify  
  - Find Target  
  - Constellations  

### Double Click
- Select / confirm target  

### Up / Down
- Scroll target list  
- Adjust label density  

---

# 🖥️ Display Constraints

Optimized for:

- ~500×200 resolution  
- Monochrome green LED  
- Transparent waveguide optics  
- Low bandwidth streaming  

---

# 🧮 Technical Details

## Update Rate
- 5–10 FPS (power & bandwidth efficient)

---

## Coordinate Systems

- RA/Dec → Alt/Az conversion  
- Local Sidereal Time  
- FOV clipping  
- Minimal projection math  

---

## Object Filtering

Only render objects that are:

- Above horizon  
- Within FOV  
- Brighter than threshold  
- Contextually relevant  

---

# 🏗️ Architecture

src/
├── main.ts
├── sky/
│ ├── calculator.ts
│ ├── stars.ts
│ ├── constellations.ts
│ └── visibility.ts
├── sensors/
│ ├── gyroscope.ts
│ └── orientation.ts
├── interaction/
│ └── ring.ts
├── rendering/
│ └── minimalist.ts
└── location/
└── geolocation.ts


---

# 👓 Even SDK Integration

Uses `@evenrealities/even_hub_sdk` for:

- Container management  
- Image streaming  
- Ring input events  
- Device state monitoring  

---

# 🚀 Quick Start

```bash
npm install
npm run dev
npm run build
```

# 🗺️ Roadmap
## V1

Bright star identification

Target finder

Minimal constellation hints

## V2

Planets

Moon tracking

Smart filtering

## V3

Event-based alerts

Personal observing lists

Adaptive brightness
