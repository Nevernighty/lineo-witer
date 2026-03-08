

## Simulation Physics Upgrade Plan

### Summary

Upgrade the simulation core with research-grade heuristic models (Jensen wake, log-law shear, exponential obstacle shadow) and dramatically enhance generator suction visibility. Add scientific disclaimer overlay.

### 1. Jensen/Park Wake Model — `wakeModel.ts`

Replace the current exponential wake deficit with a proper Jensen single-wake model:

```
velocityDeficit = 1 - (1 - sqrt(1 - Ct)) / (1 + k * x / r0)²
```

- Add `computeJensenWakeDeficit(downstreamDistance, rotorDiameter, thrustCoefficient, wakeDecayK)` 
- Add `ROUGHNESS_WAKE_CONSTANTS` map: `offshore: 0.04`, `grassland: 0.075`, `forest: 0.10`, `urban: 0.12`
- Add `computeTurbineWakeZone()` — specialized version using rotor swept area for wake width expansion
- Keep existing `isInWakeZone` and `computeWakeDeficit` for backward compat, but have particle system use Jensen model for turbines

### 2. Logarithmic Wind Shear — `windField.ts`

Add `computeLogWindShear()` alongside existing power-law:

```
U(z) = Uref * ln(z/z0) / ln(zref/z0)
```

Add `ROUGHNESS_LENGTHS` map:
- `water: 0.0002`
- `grassland: 0.03`  
- `forest: 0.8`
- `urban: 1.5`

The existing power-law remains default; add a `shearModel: 'power' | 'log'` option to `SimulationParams`.

### 3. Terrain Speed-Up — `terrainModel.ts`

Add `computeSlopeSpeedup()`:
```
multiplier = 1 + slopeAngle * 0.2, capped at 1.4
```

Replace existing `computeTerrainSpeedup` which uses tan() and caps at 1.8 — the new version is simpler and more predictable.

### 4. Obstacle Shadow Model — `obstacleModel.ts`

Add `computeObstacleShadow(distance, obstacleSize)`:
```
shadowFactor = exp(-distance / obstacleSize)
```

Returns wind speed reduction factor (0-1) behind buildings. Used in particle system alongside existing wake zone logic for non-generator obstacles.

### 5. Enhanced Generator Suction — `AdvancedParticleSystem.tsx`

Make suction visually dramatic:
- Increase `attractK` by 2× for all subtypes (hawt3: 20, hawt2: 17, etc.)
- Increase `suctionRadius` by 50% (hawt3: 7.5, etc.)
- Add stronger convergence: when particle is within 2× rotor radius, apply exponential force increase
- Add velocity boost toward rotor center — particles accelerate visibly as they approach
- Reduce absorption threshold from `rotorRadius * 1.2` to `rotorRadius * 0.8` for tighter visual
- Increase absorption flash probability from 25% to 60%

### 6. IntakeCone Enhancement — `WindGenerator3D.tsx`

- Double spiral ring count (5→10) with faster rotation
- Increase cone opacity by 2× for visibility
- Add pulsing glow on the flash sphere that scales with power output
- Add more converging flow arrows (3→6)
- Scale visual effects with `windSpeed` more aggressively

### 7. Scientific Disclaimer — `WindSimulation3D.tsx`

Add a disclaimer label at bottom when any analysis overlay is active:
```
"⚠ Visualization model — not CFD accurate"
```
Styled as a subtle monospace label, shown conditionally.

### 8. Visualization Output Types — `types.ts`

Add interfaces for overlay data:
```ts
interface VectorFieldSample { position: [x,y,z]; direction: [x,y,z]; magnitude: number; }
interface WakeZoneData { center: [x,y,z]; length: number; width: number; deficit: number; }
interface TurbulenceFieldSample { position: [x,y,z]; intensity: number; }
```

### Files Modified

1. `src/simulation/wakeModel.ts` — Add Jensen model + roughness constants
2. `src/simulation/windField.ts` — Add log-law shear + roughness lengths  
3. `src/simulation/terrainModel.ts` — Add simplified slope speedup
4. `src/simulation/obstacleModel.ts` — Add exponential shadow model
5. `src/simulation/types.ts` — Add visualization data interfaces + shearModel param
6. `src/components/wind-simulation/3D/AdvancedParticleSystem.tsx` — Enhanced suction forces, use Jensen wake for turbines, use shadow model for obstacles
7. `src/components/wind-simulation/3D/WindGenerator3D.tsx` — Enhanced IntakeCone visuals
8. `src/components/wind-simulation/3D/WindSimulation3D.tsx` — Scientific disclaimer overlay

### What We Do NOT Touch

- Obstacle3D wobble/rendering
- AdvancedWindControls UI
- InstancedParticles rendering
- Scenarios/presets
- Info pages
- Sound effects

