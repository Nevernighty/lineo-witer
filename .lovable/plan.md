

## Only Green Near Generators + White-Grey Default Wind + Enhanced Contrast

### Problem
1. **Red collision effects appear near generators** — the absorption code (line 388) fires `onCollisionEvent` which creates `CollisionEffect` (red sparks/rings) near turbines. Should only show green absorption VFX there.
2. **Default wind is blue-cyan-green** — user wants white-grey transparent by default, only coloring on interaction (green=absorbed, red=collision).
3. **Color transitions lack contrast and glow** — need much more visible state changes.

### Changes

**File: `AdvancedParticleSystem.tsx`**
- **Remove `onCollisionEvent` call from absorption block** (lines 388-395). Generator catches should NOT trigger red collision effects — only green popups via `__localAbsorptionAdd`.
- **Improve collision physics**: increase scatter on impact, add velocity-dependent bounce angle variation, make post-collision speed decay more realistic.

**File: `InstancedParticles.tsx`**
- **Default wind color → white-grey transparent**: Replace the blue→cyan→green gradient in `getSpeedColor` normal branch with a subtle white-grey palette (r≈0.6-0.8, g≈0.6-0.8, b≈0.7-0.85) that shifts slightly with speed but stays neutral.
- **Collision RED → much brighter**: Boost red channel, add slight pulsation via time-based modulation for glow effect.
- **Absorption GREEN → much brighter with glow**: Make the white flash phase brighter (full white r=1,g=1,b=1), green phase more saturated and vivid with stronger pulsation amplitude.
- **Increase material opacity** slightly for better visibility of color states.

### Files Modified

| File | Changes |
|------|---------|
| `AdvancedParticleSystem.tsx` | Remove collision event firing on absorption; improve collision bounce physics |
| `InstancedParticles.tsx` | Default=white-grey, collision=bright red glow, absorption=bright white→green glow, higher contrast |

