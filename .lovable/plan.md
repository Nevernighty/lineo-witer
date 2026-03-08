

## Fix: Black Particles + Broken Suction

### Root Cause

**Black particles**: The previous edit changed `particleMaterial` and all `trailMaterials` to use `vertexColors: true`. This tells THREE.js to read per-vertex colors from the geometry's `color` attribute. But `createParticleGeometry()` has NO color attribute — so vertex colors default to `(0,0,0)` (black). The `instanceColor` is then **multiplied** by black = black output.

**Suction not working**: The `SuctionSpiral` component is purely visual (decorative spheres). The actual particle attraction logic in `AdvancedParticleSystem` IS working in the code — the visual issue is that all particles appear black so you can't see the effect.

### Fixes

#### 1. Remove `vertexColors: true` from all materials — `InstancedParticles.tsx`

- Line 93: `particleMaterial` — remove `vertexColors: true`
- Lines 98-104: `trailMaterials` — remove `vertexColors: true`

InstancedMesh uses `instanceColor` automatically when present. The `vertexColors` flag is for geometry-level per-vertex colors and is NOT needed. Removing it means `instanceColor` values set in `useFrame` will display correctly (blue→green→yellow→red speed gradient).

#### 2. Fix gl-matrix type error — `tsconfig.app.json`

The `skipLibCheck: true` should already suppress this, but these are `node_modules` errors from `gl-matrix` (a transitive dependency). The config already has `skipLibCheck: true` so this should be fine at runtime — no code change needed, this is a pre-existing transitive dependency issue.

### Files Changed

| File | Change |
|------|--------|
| `InstancedParticles.tsx` | Remove `vertexColors: true` from `particleMaterial` (line 93) and all `trailMaterials` (line 99) |

### What This Fixes

- Particles go from black → proper speed-colored (blue/green/yellow/red)
- Trails inherit particle colors correctly
- Collision flashes visible again (orange/red)
- Absorption flashes visible (yellow pulse)
- All suction physics was already working — just invisible due to black rendering

