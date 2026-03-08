

## Fix: Particle Ground Accumulation, Trails, Wind Physics, Translation

### Problems Identified

1. **Particles pile up at the bottom**: Line 375 in `AdvancedParticleSystem.tsx` bounces particles at y=0.5 with `speedY = abs * 0.3`. Combined with gravity (`speedY -= 0.05 * delta` at line 367), particles slowly sink and accumulate near ground — never dissipating.

2. **Trails too short/invisible**: The trail system stores only 5 frames of position history (1 per frame at 60fps = 83ms visible trail). At `trailLengthMultiplier=1.0`, trail segments scale down to `size * 0.12` — nearly invisible. Frame-by-frame history means trail segments cluster together rather than stretching.

3. **Wind not realistic**: Constant gravity pull + weak damping (0.998) + low `lerpFactor` (0.12) makes wind feel sluggish. Particles don't flow — they drift and sink.

4. **Untranslated strings**: Line 614 hardcoded English "⚠ Visualization model — not CFD accurate". `analysisPanel` key used but not in i18n.

### Fixes

#### 1. Particle lifecycle — respawn instead of bounce (`AdvancedParticleSystem.tsx`)
- **Line 375**: When `particle.y < 0.5`, respawn at random height (15-80% of `height`) with fresh wind-aligned velocity instead of bouncing. This prevents ground accumulation.
- **Line 367**: Reduce gravity from `0.05` to `0.01` — particles are air, not rain.
- **Line 376**: When `particle.y > height`, also respawn instead of teleporting to 50%.

#### 2. Better trails — store every Nth frame (`InstancedParticles.tsx`)
- Increase `TRAIL_SEGMENTS` from 5 to 8 for longer visible trails.
- Add frame skip counter: store position history every 3rd frame instead of every frame. This spaces trail segments apart, creating 8 × 3 = 24 frames (~400ms) of visible trail instead of 83ms.
- Increase `TRAIL_FADE` values so trail segments are larger and more visible.
- Scale trail opacity more aggressively with `trailLengthMultiplier`.

#### 3. Wind physics tuning (`AdvancedParticleSystem.tsx`)
- Increase base `lerpFactor` from 0.12 to 0.18 for snappier wind response.
- Reduce damping from 0.998 to 0.999 — less energy loss.
- Increase movement multiplier from `delta * 2.5` to `delta * 3.5` for faster flow.
- Add slight random age-based respawn: when `particle.age > 15 + random*10`, respawn particle at wind entry side for fresh flow.

#### 4. Translation fixes
- Add missing i18n keys: `analysisPanel`, `vizWarning`.
- Translate hardcoded English string at line 614.

### Files Modified

| File | Changes |
|------|---------|
| `AdvancedParticleSystem.tsx` | Respawn instead of bounce, reduce gravity, faster wind response, particle age respawn |
| `InstancedParticles.tsx` | 8 trail segments, frame-skip storage, larger trail sizes |
| `src/utils/i18n.ts` | Add `analysisPanel`, `vizWarning` keys |
| `WindSimulation3D.tsx` | Use translated `vizWarning` string |

