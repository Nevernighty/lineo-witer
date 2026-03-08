

## Remove Generator Particles, Add Energy Absorption Burst Effect

### Problem
The `SuctionSpiral` component renders 24 individual sphere meshes per generator — these are the "particles generators emit" visible in the screenshot. They clutter the scene and conflict with the actual wind particle system. The energy transfer should be shown by wind particles being caught and absorbed, not by generators emitting their own particles.

### Solution

**1. Remove SuctionSpiral entirely from `WindGenerator3D.tsx`**
- Delete the `SuctionSpiral` component (~80 lines) and its render call
- Replace with a subtle **energy absorption glow ring** at the rotor hub that pulses based on power output — a single mesh, not 24 particles

**2. Add Rotor Catch Zone Visual — `EnergyAbsorptionEffect`**
A new lightweight component rendered at each generator's rotor position:
- **Glowing disc** at rotor plane that brightens when particles are absorbed (power > 0)
- **Expanding ring burst** — when a particle hits the rotor zone, a quick ring expands outward and fades (like a ripple). Max 3 concurrent rings for performance
- **Color shift**: ring color goes from cyan (low power) → green (medium) → yellow (high power)
- Uses only 1-4 simple meshes total, not 24 sphere objects

**3. Improve particle absorption visual in `AdvancedParticleSystem.tsx`**
- When `particle.absorbed = true`, rapidly shrink the particle size toward 0 over `absorptionTimer` frames (instead of just flagging it)
- Add a brief velocity swirl: particles spiral inward in the last few frames before respawn, creating a visible "catch" motion
- Write shrinking size to the shared buffer so `InstancedParticles` renders the fade-out

### Files Modified

| File | Change |
|------|--------|
| `WindGenerator3D.tsx` | Remove `SuctionSpiral` (lines 185-265), add `EnergyAbsorptionEffect` — pulsing disc + burst rings |
| `AdvancedParticleSystem.tsx` | Shrink absorbed particles + spiral inward during absorption timer |

### Performance Impact
- **Before**: 24 sphere meshes × N generators = 96 meshes for 4 generators, each with per-frame position updates
- **After**: 1 disc + up to 3 ring meshes per generator = 4-16 meshes total, simpler animation

