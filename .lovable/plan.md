

## Fix Absorption VFX + Scale Joule Popups by Energy

### Problems
1. **Absorption particles grow chaotically** — the Phase 1 scale `2.5 - ap * 5` causes huge spike then erratic oscillations. Need smooth, controlled green glow transition instead of chaotic size changes.
2. **Particles don't visually turn green** — the color logic works but the scale chaos makes it unreadable. Need to tone down scale animation and make green color + glow dominant.
3. **Joule popups are all same size** — need energy-proportional sizing (bigger number = bigger popup, minimum = half current size).

### Changes

**File: `InstancedParticles.tsx`**

Scale animation (lines 258-273) — replace chaotic 3-phase with smooth controlled absorption:
- Phase 1 (0-15%): Gentle expand to 1.5× (not 2.5×), smooth ease-out
- Phase 2 (15-70%): Steady size ~1.0× with mild pulse, lateralMul stays 0.7 (not 0.4)
- Phase 3 (70-100%): Smooth shrink to 0.2× with slight jitter — no `Math.random()` spikes
- Remove the extreme `lateralMul = 0.3 + Math.random() * 0.2` — causes visual chaos

Color (lines 137-163) — make green more prominent and consistent:
- Phase 1 (0-15%): Bright green-white flash `c.setRGB(0.8, 1.8, 0.6)` — clearly GREEN, not white
- Phase 2 (15-70%): Strong saturated green `c.setRGB(0.1, 1.5, 0.2)` with smooth sine pulse
- Phase 3 (70-100%): Dim green fade `c.setRGB(0.0, 0.8 * fade, 0.1 * fade)` — no flicker on/off

**File: `LocalHitPopup.tsx`**

Energy-proportional popup size (lines 47-60):
- Calculate scale factor from energy: `const energyScale = Math.max(0.5, Math.min(1.5, 0.5 + hit.energy * 4))`
- Apply to font-size and padding: small energies (0.01) → half current size, large energies (0.3+) → 1.5× current size
- Multiply existing `transform: scale(...)` by `energyScale`

### Files Modified

| File | Changes |
|------|---------|
| `InstancedParticles.tsx` | Smooth scale animation (no chaos), vivid green color throughout absorption |
| `LocalHitPopup.tsx` | Energy-proportional popup size (min 0.5×, max 1.5×) |

