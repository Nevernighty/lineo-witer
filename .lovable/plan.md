

## Remove Pulsating Disc from VAWT Generators + Enhanced Absorption VFX

### Problem
1. Darrieus and Savonius generators show a flat pulsating circle (`EnergyAbsorptionEffect`) on top — looks unnatural for vertical-axis turbines
2. Particles that get absorbed don't have a visually distinct highlight → dissolve effect
3. Particles can jam inside generators instead of being ejected
4. VAWT attraction is too weak compared to HAWT — needs stronger swirl pulling

### Changes

**File: `WindGenerator3D.tsx`**
- For VAWT subtypes (darrieus, savonius): skip rendering `EnergyAbsorptionEffect` entirely — no pulsating disc
- Instead, add a subtle cylindrical glow around the rotor body that pulses with power (using existing rotor geometry dimensions)
- Keep `EnergyAbsorptionEffect` for HAWT types (hawt2, hawt3, micro) where a frontal disc makes physical sense

**File: `AdvancedParticleSystem.tsx`**
- **Stronger VAWT attraction**: Increase `darrieus.attractK` from 40→70, `savonius.attractK` from 30→55, increase `suctionRadius` for both
- **Anti-jamming**: When a particle is inside a generator's rotor radius for more than a few frames without being absorbed, force-eject it outward (add velocity away from center + downwind)
- **Absorption highlight**: When `particle.absorbed = true`, set initial absorption size boost (1.8×) before shrinking — creates a brief "flash" moment
- **Smoother spiral**: Increase tangential swirl for VAWT absorption (particles orbit around vertical axis before dissolving), reduce inward pull speed so the spiral is more visible

**File: `InstancedParticles.tsx`**
- **Absorption color**: Make absorbed particles flash bright WHITE (r=1,g=1,b=1) at start of absorption, then transition to bright GREEN as they dissolve — more dramatic than current subtle transition
- **Size pulsation during absorption**: Add rapid size oscillation during absorption phase for a "dissolving energy" look

### Files Modified

| File | Changes |
|------|---------|
| `WindGenerator3D.tsx` | Skip `EnergyAbsorptionEffect` for darrieus/savonius; add subtle cylindrical rotor glow instead |
| `AdvancedParticleSystem.tsx` | Boost VAWT attraction force, add anti-jam ejection, absorption flash + smoother spiral |
| `InstancedParticles.tsx` | Brighter white→green absorption transition, size pulsation during dissolve |

