

## Fix: 3D Freeze + Particle Appearance + Suction

### Root Cause: CRASH

**Line 355-358 in `AdvancedParticleSystem.tsx`**: `g.center.x` and `g.center.z` — the generator objects use `g.cx` / `g.cz` (mapped at line 224), NOT `g.center`. This throws a TypeError the moment any generator exists, killing the `useFrame` animation loop and freezing the entire 3D canvas. The Html labels still render because they're CSS overlays outside the WebGL context.

### Fixes

#### 1. Fix crash — `AdvancedParticleSystem.tsx` (line 355-358)
Change `g.center.x` → `g.cx` and `g.center.z` → `g.cz`.

#### 2. Particle appearance cleanup — `InstancedParticles.tsx`
- The custom geometry (6-vertex diamond shape) looks jagged. Replace with a simple `SphereGeometry(0.3, 6, 4)` for cleaner round particles.
- Reduce excessive speed-based stretching: cap `speedScale` at 2.5 instead of 4.0 and reduce `lateralCompress` effect.
- Make trail segments scale down more smoothly.

#### 3. Suction radius sanity — `AdvancedParticleSystem.tsx`
The current `attractRadius = rotorDiameter * suctionRadius` where suctionRadius=15 creates a 135-unit radius (entire sim). Cap `attractRadius` to `rotorDiameter * 4` max — still very strong but won't engulf the whole field.

### Files Modified

| File | Change |
|------|--------|
| `AdvancedParticleSystem.tsx` | Fix `g.center.x` → `g.cx`, cap attractRadius |
| `InstancedParticles.tsx` | Sphere geometry, reduce stretch |

