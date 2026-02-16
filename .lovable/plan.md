

# Comprehensive Simulation Overhaul: Ukrainian-First, Wind Generators, Advanced Objects, Clean Wake Zones

## Overview

This plan transforms the wind simulation into a professionally informative, Ukrainian-first scientific tool with placeable wind generators, animated collision energy popups ("local hits"), improved obstacle shapes, proper wake zone visualization, and a clean compact UI.

---

## 1. Ukrainian Language as Default + EN/UA Toggle

**File: `src/pages/Index.tsx`**
- Add `useState<'ua' | 'en'>('ua')` for language state
- Add a small toggle button in the header (UA / EN pill switcher)
- Pass `lang` prop down to child components

**New file: `src/utils/i18n.ts`**
- Create a translations dictionary for all UI labels (controls, panel headers, obstacle names, tooltips, footer hints)
- Ukrainian as primary, English as secondary
- Example keys: `windSpeed`, `direction`, `elevation`, `clearAll`, `placeObstacle`, `collisionEnergy`, etc.

**Files updated with i18n:** `AdvancedWindControls.tsx`, `AdvancedMeasurementPanel.tsx`, `WindSimulation3D.tsx`, `Index.tsx`

---

## 2. Replace "Performance Stats" with "Local Hits" (Animated Collision Popups)

**File: `src/components/wind-simulation/3D/WindSimulation3D.tsx`**
- Remove `showStats` state and `<Stats />` component
- Replace with `showLocalHits` toggle
- When enabled, each collision event spawns an animated 3D popup (Html label) showing energy in Joules at the collision point, floating upward and fading out over ~1.5s

**File: `src/components/wind-simulation/3D/LocalHitPopup.tsx`** (NEW)
- React Three Fiber component using `<Html>` from drei
- Shows energy value (e.g., "0.42 J") with color-coded background
- Animates: position.y += over time, opacity fades to 0
- Auto-removes after animation completes
- Manager component tracks active popups (max ~15 to avoid clutter)

**File: `src/components/wind-simulation/3D/AdvancedWindControls.tsx`**
- Replace "Performance Stats" checkbox with "Локальні удари / Local Hits" checkbox

---

## 3. More Advanced Obstacle Shapes

**File: `src/components/wind-simulation/types.ts`**
- Add new obstacle types: `"wind_generator"` to ObstacleType
- Add `"energy"` to ObstacleCategory

**File: `src/components/wind-simulation/3D/Obstacle3D.tsx`** - Major overhaul
- **Building**: Add roof geometry (pyramid on top), window lines (thin box inserts)
- **House**: Pitched roof (ConeGeometry), chimney cylinder, distinct from building
- **Skyscraper**: Stepped/tapered shape, antenna on top, glass material with reflections
- **Tower**: Lattice-style look using thin cylinders for legs + cross-braces
- **Fence**: **Fix: position at y=0 on ground**, use multiple vertical posts (cylinders) + horizontal rails (thin boxes)
- **Wall**: Thick, grounded, brick-textured appearance
- **Tree**: Multi-sphere crown (3 overlapping spheres), more realistic trunk
- **Wind Generator**: Nacelle box + 3 rotating blades (animated with useFrame) + tower cylinder. Can be placed on ground or on top of buildings

**File: `src/components/wind-simulation/3D/WindGenerator3D.tsx`** (NEW)
- Dedicated component for wind turbine/generator 3D model
- Tower (tall cylinder), nacelle (small box at top), 3 blades (thin elongated geometries)
- Blades rotate based on current `windSpeed` from config
- Generates power readout: P = 0.5 * rho * A * v^3 * Cp (Betz limit Cp=0.40)
- Shows small power label above (e.g., "1.2 kW")

---

## 4. Wind Generator Placement System

**File: `src/components/wind-simulation/3D/WindSimulation3D.tsx`**
- When obstacle type is `wind_generator`, the addObstacle function creates a generator with appropriate dimensions
- Generators placed on ground get full tower height; generators placed on buildings get shorter mast
- Track generator power output and display in measurement panel

**File: `src/components/wind-simulation/3D/AdvancedWindControls.tsx`**
- Add "wind_generator" option in the obstacle type selector with label "Вітрогенератор / Wind Generator"
- Add elevation/height science info tooltip: "Wind speed increases with height following power law V = V_ref * (h/h_ref)^alpha. Doubling height increases power by ~40-80%."

**File: `src/components/wind-simulation/3D/WindPhysicsEngine.ts`**
- Add `wind_generator` to OBSTACLE_DRAG_COEFFICIENTS (low Cd ~0.3, cylindrical wake)
- Add power calculation function for generators

---

## 5. Better Wake Zone Visualization

**File: `src/components/wind-simulation/3D/CollisionHotspot.tsx`** - `WakeZoneVisualizer` rewrite
- Replace current messy approach with a **single clean tapered ribbon** per obstacle:
  - Use `ShapeGeometry` to create a tapered trapezoid (wide at obstacle, narrowing downstream)
  - Flat on the ground plane (y=0.15)
  - Gradient from semi-transparent blue at obstacle to fully transparent at end
  - Length proportional to obstacle size * drag coefficient
  - Width proportional to obstacle cross-section
- Add **velocity deficit markers**: small dashes at 2D, 5D, 10D distances with % labels (only when few obstacles, hidden when >5 to avoid clutter)
- Single thin center streamline with animated dash pattern
- No 3D cones, no floating labels, no overlapping geometry
- Wake zones merge/overlap gracefully due to transparency

---

## 6. Enhanced Particle Graphics

**File: `src/components/wind-simulation/3D/InstancedParticles.tsx`**
- Increase particle elongation based on velocity (faster = longer trail)
- Add subtle size pulsing for visual interest
- Improve collision color transition: smooth gradient from green -> yellow -> orange -> red based on collision energy
- Add faint secondary trail layer with longer persistence for flow visualization

---

## 7. Science-Based Elevation Info for Wind Energy

**File: `src/components/wind-simulation/3D/AdvancedWindControls.tsx`**
- Enhance info tooltips with Ukrainian text (primary) + English in parentheses
- Add elevation science to terrain tab: display calculated wind speed at different heights
- Show power law profile: "At 10m: X m/s, At 50m: Y m/s, At 100m: Z m/s"
- Add wind generator specific note about optimal placement height

---

## 8. Settings That Actually Influence the Simulation

Currently many settings already feed into `WindPhysicsConfig` and affect particle behavior. Enhancements:

**File: `src/components/wind-simulation/3D/AdvancedParticleSystem.tsx`**
- Make `humidity` affect particle visual size (higher humidity = slightly larger, more visible particles)
- Make `altitude` auto-calculate and update `airDensity` when changed (linked)
- Make `surfaceRoughness` visually change the ground grid color/density
- Ensure gust effects are visually dramatic (brief particle acceleration bursts)

**File: `src/components/wind-simulation/3D/AdvancedWindControls.tsx`**
- Link altitude slider to auto-compute air density (with override option)
- Show computed values: "Calculated rho: X.XXX kg/m3" when altitude changes

---

## 9. Clean, Compact UI

**File: `src/components/wind-simulation/3D/AdvancedMeasurementPanel.tsx`**
- Rename "Scene" section to "Середовище / Environment"
- Remove Reynolds number card (too specialized, clutters UI)
- Add "Генератори / Generators" section showing total power output from placed wind generators
- All labels bilingual: Ukrainian primary, abbreviations in English for scientific terms

**File: `src/components/wind-simulation/3D/WindSimulation3D.tsx`**
- Keep layout: controls right (w-56), measurements left (w-44)
- Ensure no overflow, no scrollbars

---

## 10. Hotspot Enhancement

**File: `src/components/wind-simulation/3D/CollisionHotspot.tsx`**
- Keep existing hotspot visualization (user said "hotspots are OK, enhance further")
- Add ground heatmap patch: colored circle on ground below obstacle matching energy level
- Add energy particle sparks: small particles emanating from hotspot proportional to energy

---

## Technical Sequence

1. `src/utils/i18n.ts` - Create translation system
2. `src/components/wind-simulation/types.ts` - Add wind_generator type
3. `src/components/wind-simulation/3D/WindPhysicsEngine.ts` - Add generator physics
4. `src/components/wind-simulation/3D/WindGenerator3D.tsx` - New 3D generator model
5. `src/components/wind-simulation/3D/LocalHitPopup.tsx` - New collision popup system
6. `src/components/wind-simulation/3D/Obstacle3D.tsx` - Advanced shapes + ground-fixed fence
7. `src/components/wind-simulation/3D/GhostObstacle.tsx` - Update for new types
8. `src/components/wind-simulation/3D/CollisionHotspot.tsx` - Clean wake zones + enhanced hotspots
9. `src/components/wind-simulation/3D/InstancedParticles.tsx` - Better particle effects
10. `src/components/wind-simulation/3D/AdvancedParticleSystem.tsx` - Humidity/altitude influence
11. `src/components/wind-simulation/3D/AdvancedWindControls.tsx` - UA labels, generator option, linked settings
12. `src/components/wind-simulation/3D/AdvancedMeasurementPanel.tsx` - UA labels, generator power
13. `src/components/wind-simulation/3D/WindSimulation3D.tsx` - Local hits, generator tracking
14. `src/pages/Index.tsx` - UA/EN toggle in header

