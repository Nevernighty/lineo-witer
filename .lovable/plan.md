

## Tree Wobble Fix + Analysis Layers Overhaul

### 1. Tree Wobble — Too Extreme at Max

**Problem:** At max wobbliness (3.0), trees get `windNorm * 0.22 * wb` = up to 1.65 radians (~95°). Completely unrealistic.

**Fix in `Obstacle3D.tsx`:**
- Cap tree wobble coefficient: `0.22` → `0.06` (trees are only ~2x more susceptible than buildings/generators)
- Cap lean amount: `0.18` → `0.05`
- Remove squash/stretch effect (unrealistic rubber-band behavior)
- Wind generators already have low vibration; trees will be ~2x that intensity

### 2. Three Analysis Layers Missing Rendering

`showWakeMap`, `showCapacityFactor`, `showBetzOverlay` have state + toggle but **zero rendering code** in the Canvas.

### 3. Overhaul All 9 Analysis Layers

**In `WindSimulation3D.tsx`**, replace/add rendering for each:

| Layer | Current State | Upgrade |
|-------|--------------|---------|
| 📏 Height Ruler | Basic pole + dots | Add gradient color bands (green→yellow→red by altitude), wind speed labels at each height tick, animated measurement dots |
| 🌬️ Wind Profile | 6 static arrows at corner | Animated arrows that pulse with gust cycle, speed gradient coloring (blue→cyan→white), profile curve line connecting tips |
| 🔴 Pressure | Static circles + labels | Animated pressure zones that pulse with wind speed, gradient opacity falloff, streamline deflection arrows around obstacles |
| ⚡ Energy W/m² | Static rings at corner | Full-field energy density grid (5×5 horizontal planes at different heights), heat-map colored rings, animated power flow indicators |
| 🌀 Turbulence | 5 static tori at fixed positions | Place tori dynamically around obstacles (where turbulence actually occurs), animate rotation speed proportional to TI, add swirl particle trails |
| 📊 Wind Shear α | Static bars at corner | Vertical gradient ribbon showing shear profile, α exponent displayed per layer, color transitions from surface (red/slow) to height (blue/fast) |
| 💨 Wake Map | **MISSING** | For each obstacle: render wake cone mesh (tapered triangle behind obstacle in wind direction), color-coded by deficit %, animated streamlines inside wake, Jensen model deficit labels at 3D, 5D, 10D downstream |
| 📈 Capacity Factor | **MISSING** | For each generator: floating gauge arc showing Cf (0–60%), color coded (red <20%, yellow 20-35%, green >35%), calculated from Weibull-integrated power at current wind speed |
| 🎯 Betz Zones | **MISSING** | For each generator: three concentric transparent spheres — inner (actual extraction ~30-40%), middle (Betz limit 59.3%), outer (total wind energy) — with labels and efficiency % |

### Files Modified

| File | Changes |
|------|---------|
| `Obstacle3D.tsx` | Reduce tree wobble coefficients to ~2x generator level, remove squash/stretch |
| `WindSimulation3D.tsx` | Add rendering for wake map, capacity factor, Betz zones; upgrade all 6 existing analysis visualizations with animations, better positioning, and richer data display |

