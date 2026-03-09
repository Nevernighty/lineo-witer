

## Popup Color Differentiation + Enhanced Absorption VFX

### Problem
1. **Joule popups** are the same color for collisions and generator absorption — need RED for collisions, GREEN for generators
2. **Generator absorption VFX** needs more dramatic highlight + dissolve split animation
3. Currently `__localHitAdd` is only called from collision events — no separate popup for generator catches

### Changes

**File: `LocalHitPopup.tsx`**
- Add `isAbsorption: boolean` field to `LocalHit` interface
- When `isAbsorption = true`: popup is GREEN (`#22c55e`) with "+" prefix (e.g., "+0.12 Дж")
- When `isAbsorption = false` (collision): popup is RED (`#ef4444`) with scale-down animation
- Expose second global: `__localAbsorptionAdd` for generator catches
- Different animation: absorption popups float up faster with a green glow, collision popups shake slightly

**File: `AdvancedParticleSystem.tsx`**
- When a particle is absorbed (`shouldAbsorb && !particle.absorbed`), call `__localAbsorptionAdd` with the particle position and calculated energy
- Increase the initial flash size boost from 1.8× to 2.5× for more visible "catch" moment
- Add brief outward velocity burst on absorption (2-3 frames of particle expanding before spiral inward) — simulates "impact splash" before suction
- Slow down the spiral-in phase slightly (absorptionTimer 20→28) so the dissolve is more visible

**File: `InstancedParticles.tsx`**
- Make absorbed particles brighter WHITE at the very start (first 30% of timer), then vivid GREEN for the dissolve phase
- Increase size oscillation amplitude during dissolve for more dramatic "splitting" look
- Add a brief scale spike at the moment of absorption (frame 0-3) before the shrink begins

### Files Modified

| File | Changes |
|------|---------|
| `LocalHitPopup.tsx` | Add `isAbsorption` flag; RED for collisions, GREEN for generators; separate global callback |
| `AdvancedParticleSystem.tsx` | Call absorption popup, bigger flash, slower spiral dissolve, outward burst before inward pull |
| `InstancedParticles.tsx` | Brighter white→green transition, larger pulsation amplitude during dissolve |

