

## Fix: 0W Generators, Weak Suction, Cluttered UI

### Root Cause Analysis

**Why all generators show 0W**: The screenshot shows wind speed at 30 m/s. With `calculateWindShear` at hub height (~30m), the adjusted speed is ~37 m/s. ALL generator subtypes have `cutOut` values below that (Darrieus: 20, hawt3: 25, hawt2: 28, Savonius: 15). When `adjustedSpeed > cutOut`, power returns 0. This is physically correct but the UI gives zero feedback about WHY.

**Why suction feels weak**: The `lerpFactor = 0.12` (line 357) limits how fast particles respond to forces — only 12% of the target velocity is applied per frame. Combined with moderate `attractK` values and the `dotWind > 0` gate for HAWTs (particles behind the rotor are ignored), suction appears invisible.

**Cluttered UI**: 10+ generators each with `<Html>` labels overlap massively.

### Changes

#### 1. Generator Power Labels — `WindGenerator3D.tsx`
- When `adjustedSpeed > cutOut`: show "⛔ CUTOUT" in red instead of "0 W"
- When `adjustedSpeed < cutIn`: show "⏸ LOW WIND" in yellow
- Make label smaller when showing 0W (reduce clutter)

#### 2. Stronger Suction Physics — `AdvancedParticleSystem.tsx`
- Increase `lerpFactor` from 0.12 to 0.25 near generators (within `attractRadius`)
- Triple `attractK` values: hawt3: 60, hawt2: 50, darrieus: 40, savonius: 30, micro: 42
- Double `suctionRadius`: hawt3: 15, hawt2: 13, darrieus: 10, savonius: 9, micro: 12
- Remove `dotWind > 0` gate for HAWTs — particles should be attracted from all directions within suction radius (real rotors create low pressure zones that pull air from ahead AND sides)
- Add stronger exponential boost at close range: `exp((2*rotorRadius - dist) / rotorRadius)`

#### 3. Realistic Defaults — `WindPhysicsEngine.ts`
- `windSpeed: 8` (already 8 in DEFAULT_WIND_PHYSICS, but WindSimulation3D overrides to 6 — keep 6)
- The real issue: slider max should indicate cutOut zones

#### 4. Compact Generator Labels — `WindGenerator3D.tsx`
- Reduce label font sizes
- Hide detailed stats by default (only show power + subtype name)
- Only show detailed popup for selected/hovered generators

#### 5. SuctionSpiral Enhancement — `WindGenerator3D.tsx`
- Increase spiral particle count from 16 to 24
- Make particles bigger and brighter
- Scale opacity more aggressively with wind speed (visible even at low speeds)
- Fix: when power is 0 (above cutOut), still show particles but in red to indicate shutdown

### Files Modified

| File | Changes |
|------|---------|
| `AdvancedParticleSystem.tsx` | 3x attractK, 2x suctionRadius, higher lerpFactor near generators, remove dotWind gate |
| `WindGenerator3D.tsx` | CutOut/CutIn status labels, compact labels, enhanced SuctionSpiral (24 particles, brighter) |

