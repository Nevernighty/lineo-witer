

## Architecture Stabilization Plan

### Problem Summary

The simulation has three critical performance and maintainability issues:

1. **WindSimulation3D.tsx** is a 762-line monolith with ~30 `useState` calls. Every state change re-renders the entire Canvas tree.
2. **AdvancedParticleSystem** calls `forceUpdate()` inside `useFrame()` — triggering React reconciliation at 60fps. This is the single biggest performance killer.
3. Physics logic (wind field, wake, turbulence, collision) is scattered across `WindPhysicsEngine.ts` and inline in `AdvancedParticleSystem.tsx` — impossible to extend without touching rendering code.

### Architecture Changes

#### 1. Simulation Core — Pure Functions (`src/simulation/`)

Extract physics into stateless modules. These already exist as functions in `WindPhysicsEngine.ts` — we split them into focused files and add the missing wake model.

```text
src/simulation/
  windField.ts      — base wind vector, shear, gust noise (from WindPhysicsEngine lines 116-184)
  wakeModel.ts      — wake deficit + wake zone check (from WindPhysicsEngine lines 212-247)
  turbulenceModel.ts — turbulence noise + intensity calc (from WindPhysicsEngine lines 140-163)
  terrainModel.ts   — slope speedup, roughness, getTerrainYOffset (from WindPhysicsEngine + WindSimulation3D line 27-32)
  obstacleModel.ts  — collision check, surface normal, deflection (from AdvancedParticleSystem lines 119-168)
  types.ts          — SimulationParams, ParticleData, QualityPreset interfaces
```

Each module exports pure functions. `WindPhysicsEngine.ts` becomes a re-export barrel file for backward compatibility.

#### 2. Centralized Store (`src/store/useWindStore.ts`)

Use a `useRef`-based store pattern (no new dependencies) with selective subscriptions via `useSyncExternalStore`.

```text
State groups:
├── simulation: windSpeed, windAngle, windElevation, shear, turbulence, gustStrength
├── environment: terrainSlopeX/Z, roughness, obstacles[], altitude, temperature
├── turbines: (derived from obstacles where type='wind_generator')
├── particles: count, impact, trailLength, glow, pulsation, preset
├── visual: showWakeMap, showBetzOverlay, showCapacityFactor, ... (9 analysis toggles)
└── ui: interactionMode, selectedIndex, showScenarios, showAnalysis, activeScenario
```

This eliminates ~30 `useState` calls from WindSimulation3D. Components subscribe only to their slice — obstacle list changes don't re-render the analysis panel.

#### 3. Kill `forceUpdate` in Render Loop

The critical fix: `AdvancedParticleSystem` currently calls `forceUpdate(n => n+1)` every 2 frames to push particle positions to `InstancedParticles`. This triggers full React reconciliation.

**Fix**: Store particle data in a shared `useRef<Float32Array>` buffer. `InstancedParticles` reads from this ref directly inside its own `useFrame` — zero React state updates in the animation loop.

```text
AdvancedParticleSystem (useFrame):
  - Updates particle positions in Float32Array ref
  - Updates collision energy in ref
  - NO setState, NO forceUpdate

InstancedParticles (useFrame):
  - Reads particle positions from shared ref
  - Updates InstancedMesh matrices directly
  - Already does this partially — just remove the dependency on React props
```

The `onCollisionEnergyUpdate` and `onObstacleEnergyUpdate` callbacks get throttled to fire at most every 500ms via a timestamp check, not on every frame.

#### 4. Quality Presets (`src/simulation/qualityPresets.ts`)

```text
LOW:    2000 particles, no trails, no wake viz, simplified turbulence (scale=0.5)
MEDIUM: 6000 particles, 3-segment trails, basic wake viz
HIGH:   15000 particles, 5-segment trails, full wake + analysis overlays
```

Add a quality selector dropdown to `AdvancedWindControls` that sets particle count, trail segments, and enables/disables analysis overlays in one action.

#### 5. File Structure Reorganization

```text
src/
  simulation/          ← NEW: pure physics
    windField.ts
    wakeModel.ts
    turbulenceModel.ts
    terrainModel.ts
    obstacleModel.ts
    qualityPresets.ts
    types.ts
  store/               ← NEW: state management
    useWindStore.ts
  components/
    scene/             ← 3D components (moved from wind-simulation/3D/)
      WindSimulation3D.tsx  (slimmed down — delegates to store)
      AdvancedParticleSystem.tsx
      InstancedParticles.tsx
      Obstacle3D.tsx
      WindGenerator3D.tsx
      CollisionEffect.tsx
      ...
    ui/                ← existing UI components
    wind-simulation/   ← legacy 2D (keep as-is)
  overlays/            ← NEW: analysis overlay components extracted from WindSimulation3D
    HeightRuler.tsx
    WindProfile.tsx
    PressureMap.tsx
    EnergyDensity.tsx
    TurbulenceField.tsx
    WindShearLayer.tsx
  data/                ← NEW: scenario presets extracted
    scenarios.ts
  utils/               ← existing
```

### Implementation Order

1. **Create `src/simulation/` modules** — extract pure functions from `WindPhysicsEngine.ts` and `AdvancedParticleSystem.tsx`. Keep `WindPhysicsEngine.ts` as barrel re-export.
2. **Create `src/store/useWindStore.ts`** — migrate all 30 `useState` calls from `WindSimulation3D.tsx`.
3. **Fix render loop** — replace `forceUpdate` with shared `Float32Array` ref between particle system and instanced renderer.
4. **Extract overlays** to `src/overlays/` — the 6 inline JSX blocks (lines 582-687) become standalone components subscribing to store.
5. **Extract scenarios** to `src/data/scenarios.ts`.
6. **Add quality presets** — dropdown in controls, wired to store.
7. **Update imports** across consuming files.

### What We Do NOT Touch

- `Obstacle3D.tsx` wobble/rendering logic
- `WindGenerator3D.tsx` visual components
- `AdvancedWindControls.tsx` UI layout
- Any 2D simulation code (`ParticleSystem.ts`, `ParticlePhysics.ts`, etc.)
- UI components (`src/components/ui/`)
- Pages (`Index.tsx`, `InfoPage.tsx`)

### Risk Mitigation

- `WindPhysicsEngine.ts` kept as re-export barrel — no import breakage
- Store migration is mechanical (useState → store.get/set) — behavior unchanged
- The `forceUpdate` removal is the highest-risk change — we add a fallback: if shared ref is null, fall back to props (graceful degradation)

