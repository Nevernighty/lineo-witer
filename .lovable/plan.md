

## Fix Z-ordering, Particle Colors, and Analysis Layer Quality

### Issues Identified

1. **3D Html labels overlap UI menus** — `<Html>` elements from Canvas render on top of UI panels because they share the same stacking context. The UI panels need higher z-index and the Canvas Html elements need to be contained.
2. **Particle colors: collisions are green, absorbed are grey** — hard to distinguish. Need: collisions = RED, absorbed/generator = bright WHITE→GREEN transition.
3. **Analysis layers (Wind Profile, Pressure, Capacity Factor, Betz, Turbulence, Shear)** are static and minimal — need animation and richer visualization.
4. **Particle shapes** — current geometries are abstract diamonds/stars; need more natural wind-like forms.

### Changes

**File: `src/components/wind-simulation/3D/WindSimulation3D.tsx`**

1. **Z-index fix**: Bump all UI overlay `z-index` from `z-10`/`z-20`/`z-30` to `z-30`/`z-40`/`z-50`. Add `position: relative` and explicit z-index layering. Wrap Canvas in a container with lower z-index so `<Html>` elements from Three.js stay behind UI.

2. **Wind Profile overhaul**: Replace static arrows with animated `WindProfileViz` component using `useFrame` — arrows pulse length with gust cycle, color gradient blue→cyan→white by speed, add a smooth curve line connecting arrow tips via `<Line>` or tube geometry.

3. **Pressure Map overhaul**: Add `useFrame`-driven pulsing zones that scale with `sin(time * windSpeed)`, add deflection arrow meshes pointing around obstacles, gradient opacity falloff.

4. **Turbulence Field**: Place tori dynamically around actual obstacles instead of fixed positions. Animate rotation proportional to TI. Add swirl trails.

5. **Wind Shear**: Add animated vertical gradient ribbon with color transition segments. Pulse bar widths with gust.

6. **Betz Zones**: Animate sphere rotation + pulsing opacity. Add animated ring expanding from inner to outer.

7. **Capacity Factor**: Make gauge arc animated (sweep angle interpolates smoothly).

8. **Wake Map**: Add animated streamline particles flowing through wake cones.

**File: `src/components/wind-simulation/3D/InstancedParticles.tsx`**

9. **Color overhaul in `getSpeedColor`**:
   - `absorbed` → bright white transitioning to green (energy extracted = clean green glow, not grey)
   - `hasCollided` → RED/orange (clear collision indicator)
   - Normal wind → keep blue→cyan→green gradient
   - Especially for Savonius/Darrieus absorption: more intense white flash

10. **Particle geometry**: Make `createStandardGeometry` more elongated/natural (teardrop), reduce angular edges on smoke/stream presets for organic wind feel.

**File: `src/components/wind-simulation/3D/AdvancedMeasurementPanel.tsx`**

11. **Z-index**: Ensure panel uses `z-30` minimum to stay above Canvas Html overlays.

### Files Modified

| File | Changes |
|------|---------|
| `WindSimulation3D.tsx` | Fix z-ordering of all UI panels, overhaul all 9 analysis visualizations with animations |
| `InstancedParticles.tsx` | Collision=red, absorbed=white→green, more natural particle geometries |
| `AdvancedMeasurementPanel.tsx` | Higher z-index to prevent 3D label overlap |

