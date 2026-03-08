

## Wind Particle & Physics Improvements

### Changes Required

**1. Absorbed particles turn grey (not yellow)** — `InstancedParticles.tsx`
- In `getSpeedColor`, change the absorbed branch from yellow pulse to grey/silver with subtle white highlight
- Grey = desaturated, dimmer — visually reads as "energy extracted"

**2. VAWT (Savonius/Darrieus) absorption hitbox** — `AdvancedParticleSystem.tsx`
- Currently VAWTs use a horizontal-distance-based circle but absorption check (line 334) uses `dist < gen.rotorRadius * 0.8` which is a sphere around the hub — wrong for VAWTs
- For VAWTs: absorption zone should be a vertical cylinder (check horizontal distance only, ignore Y beyond rotor height range) matching their actual swept volume
- For Darrieus: tall narrow cylinder; for Savonius: shorter wider cylinder
- If horizontal distance is too far, skip — wind should flow around them realistically

**3. Wobbliness tied to wind direction** — `Obstacle3D.tsx`
- Currently wobble uses `angleRad` from `windAngle` prop but the lean direction is already somewhat wind-aware
- Make the primary wobble axis align with wind direction vector (lean downwind), secondary axis perpendicular
- Scale wobble amplitude by `cos(windAngle - objectFacing)` for directional response

**4. Trail slider max → 100x** — `AdvancedWindControls.tsx`
- Change trail slider `max` from 10.0 to 100.0
- Change step from 0.5 to 1.0 for high range
- Update `cappedTail` in `InstancedParticles.tsx` from 10.0 to 50.0 to allow longer tails

**5. Glow intensity actually affects visuals** — `InstancedParticles.tsx`
- Currently `glowIntensity` multiplies color channels in `getSpeedColor` — but at low values (default 0.2x) it just dims everything
- Make glow control particle brightness/bloom more meaningfully:
  - Scale material opacity by glow (higher glow = more opaque/bright)
  - Add emissive-like brightness boost: at high glow, particles become overexposed white-hot
  - At low glow, particles are subtle/dim but still visible (floor at 0.3 brightness)

### Files Modified
| File | Change |
|------|--------|
| `InstancedParticles.tsx` | Grey absorbed color, glow controls brightness+opacity, raise tail cap to 50 |
| `AdvancedParticleSystem.tsx` | VAWT cylindrical absorption zone, proper geometry-aware hitbox |
| `AdvancedWindControls.tsx` | Trail max=100, step=1 |
| `Obstacle3D.tsx` | Wobble direction aligned with wind vector |

