

## Comprehensive Fix & Enhancement Plan

### Issues Identified from Code Review

1. **Terrain slope**: `getTerrainYOffset` uses `Math.sin(slopeRad)` which is correct math, but the `terrainRotation` at line 282-284 swaps X and Z axes incorrectly — `rotation={[slopeZ, 0, -slopeX]}` rotates the grid visually but obstacles use a different formula via `getTerrainYOffset`. The grid and objects diverge at high slopes.

2. **IntakeCone visual clutter**: The current IntakeCone renders 10 ring geometries + 6 cone arrows + 6 cylinder lines + 1 sphere — all static green meshes that look like "rings and triangles". No actual rotor-aligned spiral animation.

3. **Select mode drag**: Currently drags immediately on first pointerDown (line 289-296). No second-click-hold requirement.

4. **Weather**: Uses synthetic `generateSyntheticWeather()` — no real API connected.

5. **Particle trails**: Trail materials are hardcoded green (`#00ff88`) regardless of particle speed color.

---

### Changes by File

#### 1. Fix Terrain Slope — `terrainModel.ts` + `WindSimulation3D.tsx`

- Fix `terrainRotation` calculation at line 282-284: currently `[slopeZ_rad, 0, -slopeX_rad]` — this is correct for the grid visual but the conversion uses degrees directly in a confusing way. The real issue: slopes above ~15° cause objects to clip through the grid because `getTerrainYOffset` clamps to ±8 but the grid rotates further. **Fix**: Increase clamp to ±15 and ensure grid rotation matches the offset formula exactly.

#### 2. Replace IntakeCone with Rotor-Based Spiral Suction — `WindGenerator3D.tsx`

Remove the current `IntakeCone` component entirely. Replace with:
- **SuctionSpiral**: Animated particle paths that spiral inward toward the spinning rotor plane using `useFrame` to rotate and translate ring positions along the wind axis
- The spiral particles match the wind direction and converge at the actual blade rotation center
- Color transitions from cyan (far) to bright yellow-green (absorbed) with additive blending
- Power-scaled: spiral intensity, count, and glow scale with `windSpeed` and `adjustedSpeed`
- Impact popup flashes positioned at rotor center when absorption events happen
- No more static cones/rings/cylinders — all animated

#### 3. Select Mode: Second-Click-Hold Drag — `WindSimulation3D.tsx`

Current behavior (line 286-300): pointerDown in select mode immediately selects + starts drag tracking.

**New behavior**:
- First click: select the object (highlight it)
- Second click on already-selected object + hold: begin drag
- Track `selectedObstacleIndex` and a `clickCountRef` — if clicking the same already-selected object, enter drag mode
- Release: stop drag

#### 4. Neomorphic Blur Selection — `Obstacle3D.tsx` + `WindGenerator3D.tsx`

Replace the current wireframe cylinder selection indicator with a glassmorphic glow effect:
- Selected objects get a soft blurred outer glow sphere using `meshBasicMaterial` with additive blending, cyan color, `opacity: 0.12`
- Hovered objects get a subtle yellow glow
- Apply to both obstacles and generators

#### 5. Connect Real Weather API — `WeatherDisplay.tsx`

Add OpenWeatherMap API integration:
- Use the free tier endpoint: `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={key}&units=metric`
- Fallback to existing synthetic data when API key is not set or request fails
- Add environment variable `VITE_OPENWEATHER_API_KEY`
- Display "Live" / "Synthetic" badge to indicate data source
- Keep the "Apply to Simulation" button

#### 6. Trail Color Inheritance — `InstancedParticles.tsx`

Currently trail materials use hardcoded green colors (lines 94-100). Change:
- Make trail meshes use `vertexColors: true` with `instanceColor`
- In the trail update loop, inherit the main particle's speed-based color with reduced saturation per trail segment
- This makes trails match particle color (blue → green → yellow → red) instead of fixed green

#### 7. Compact UI + Realistic Defaults — `AdvancedWindControls.tsx` + `WindSimulation3D.tsx`

- Reduce default wind speed from 8 to 6 m/s (more realistic average)
- Default turbulence intensity: 0.18 (typical land)
- Default particle count: 400
- Default wobbliness: 0.6 (less jelly)
- Tighter padding in control panel: reduce `p-3` to `p-2` in tabs content
- Reduce GlowSlider label text from `text-xs` to `text-[10px]`

#### 8. Optimization — `InstancedParticles.tsx` + `AdvancedParticleSystem.tsx`

- Pre-allocate `maxCount` to 2000 and reuse — avoid re-creating `instanceColors` on count change
- Move `instanceColors` allocation outside `useMemo` with count dependency — use a stable ref
- Reduce trail segments from 5 to 3 for LOW quality
- Skip obstacle energy map copy when no obstacles have generators

#### 9. Scenario Knowledge Cards — `data/scenarios.ts`

Add `knowledgeCard` field to `ScenarioPreset`:
```ts
knowledgeCard?: {
  phenomenon: Record<Lang, string>;
  approximates: Record<Lang, string>;
  limitations: Record<Lang, string>;
};
```

Add cards for urban, coastal, mountain, katabatic, sea breeze scenarios.

#### 10. Analysis Overlay Confidence Badges — `WindSimulation3D.tsx`

Add a badge type to each analysis item: `'visualization' | 'estimate' | 'theoretical'`
- Wake map → VISUALIZATION
- Capacity factor → ESTIMATE
- Betz → THEORETICAL
- Display as a tiny colored badge next to each toggle label

---

### Files Modified

| File | Changes |
|------|---------|
| `WindSimulation3D.tsx` | Fix terrain, select mode logic, analysis badges, realistic defaults, disclaimer |
| `WindGenerator3D.tsx` | Replace IntakeCone with SuctionSpiral, rotor-aligned animation |
| `Obstacle3D.tsx` | Neomorphic glow selection effect |
| `InstancedParticles.tsx` | Trail color inheritance, optimization |
| `AdvancedParticleSystem.tsx` | Minor optimization |
| `AdvancedWindControls.tsx` | Compact UI, tighter spacing |
| `WeatherDisplay.tsx` | OpenWeatherMap API integration with fallback |
| `terrainModel.ts` | Fix clamp range |
| `data/scenarios.ts` | Add knowledge cards |

### What We Do NOT Touch
- Simulation core modules (`simulation/*.ts`)
- Store (`useWindStore.ts`)
- Info pages
- Sound effects
- 2D simulation components

