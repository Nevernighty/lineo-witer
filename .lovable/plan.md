

## Fix: Real Particle Shapes + Real Trail Tails (Not Width Stretch)

### Problem

Current code just stretches a flat square wider along X — that's not a trail, that's a fat rectangle. No directionality, no taper, no comet-tail effect. All 5 presets look nearly identical.

### Solution: Tapered Geometry + 5 Distinct Preset Shapes

Use **custom BufferGeometry per preset** — each with a genuinely different shape. The "Слід" multiplier controls the **tail length** of a tapered wedge, not the width.

**Key insight**: Create a tapered quad geometry (wide head → narrow tail point) that naturally looks like a wind streak. Scale the tail length with `trailLengthMultiplier`. Still 1 draw call, 1 instanced mesh.

### 5 Preset Geometries

| Preset | Shape | Description |
|--------|-------|-------------|
| **Стандарт** | Small tapered diamond | Compact wind particle, short tail |
| **Димка** | Large soft circle (8-sided) | Big, faded, cloud-like puffs |
| **Стріли** | Arrow/chevron shape | Pointed arrowhead with notch |
| **Іскри** | Tiny bright dot | Very small, high glow, minimal tail |
| **Потоки** | Long tapered comet tail | Extended wedge, strong directional flow |

### How Tapered Trail Works

Instead of PlaneGeometry(0.6, 0.6), create a custom triangle/trapezoid:
```text
    ●  (wide head)
   / \
  /   \
 /     \
●───────● (narrow tail point)
```

The "Слід" slider scales the **tail length** (Z-axis of this shape), so at high values particles have long comet tails following their velocity vector. At low values they're compact dots.

Each particle still uses `dummy.lookAt(velocity)` to orient along wind direction, so the tail always points backward relative to motion.

### Changes

#### `InstancedParticles.tsx` — Complete rewrite of geometry + scale logic
1. Add `preset` prop (string)
2. Create 5 geometry builder functions returning custom `BufferGeometry`
3. `useMemo` on `preset` to rebuild geometry when preset changes
4. Trail scale: `scaleZ = baseSize * (1 + trailLengthMultiplier * 0.8)` for tail length, `scaleX = baseSize * 0.5` for lateral width — tapered naturally by geometry vertices
5. Each preset also tweaks opacity and base size

#### `AdvancedParticleSystem.tsx` — Pass preset prop
- Forward `particlePreset` string to `InstancedParticles`

#### `WindSimulation3D.tsx` — Pass preset through
- Pass `particlePreset` to `AdvancedParticleSystem`

### Files Modified

| File | Change |
|------|--------|
| `InstancedParticles.tsx` | 5 custom geometries, tapered trail scaling, preset prop |
| `AdvancedParticleSystem.tsx` | Forward preset prop |
| `WindSimulation3D.tsx` | Pass preset to particle system |

