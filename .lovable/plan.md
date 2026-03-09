

## Enhanced Green Absorption VFX — Brighter Impact + Particle Dissolve

### Changes

**File: `InstancedParticles.tsx`**

**Color (`getSpeedColor` absorbed branch):**
- Replace the sine-based phase toggle with a progressive timeline using the particle's per-instance time offset
- Phase 1 (0-20%): Intense white-green flash — `c.setRGB(1.2, 1.5, 1.0)` — bright highlight moment
- Phase 2 (20-60%): Saturated emerald green with strong glow pulsation — `c.setRGB(0.1, 1.8, 0.3)` with rapid sine modulation
- Phase 3 (60-100%): Fade to cyan-green sparks — `c.setRGB(0.0, 1.0, 0.6)` dimming with high-frequency flicker

**Scale (absorbed block in useFrame):**
- Phase 1: Spike to 2.5× with rapid expansion
- Phase 2: Split into elongated shape — increase Z-scale by 3× while shrinking X/Y to 0.4× (stretching effect like particle splitting apart)
- Phase 3: Rapid shrink with high-frequency jitter (`Math.random() * 0.3`) — looks like dissolving into tiny sparks
- Use `absorptionTimer` from flags to determine phase (encode timer in a new buffer field, or derive from size changes)

**New buffer field:**
- Add `absorbProgress` float array to `ParticleBuffer` interface — tracks 0→1 progress through absorption lifecycle
- Set in `AdvancedParticleSystem` each frame as `1 - (timer / 28)`

**File: `AdvancedParticleSystem.tsx`**

- Write `absorbProgress` to buffer: `buffer.absorbProgress[i] = particle.absorbed ? 1 - (particle.absorptionTimer / 28) : 0`
- During absorption spiral: increase tangential velocity more aggressively in final frames for a "fling apart" look
- Add size jitter in last 8 frames: `particle.size *= 0.85 + Math.random() * 0.3`

### Files Modified

| File | Changes |
|------|---------|
| `AdvancedParticleSystem.tsx` | Add `absorbProgress` to buffer, size jitter in final frames, stronger end-spiral fling |
| `InstancedParticles.tsx` | 3-phase color ramp (white-green → emerald → cyan fade), stretch+dissolve scale animation using absorbProgress |

