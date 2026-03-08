

## Fix: Remove Laggy Trail System, Replace with Streak Rendering

### Problem

The current trail system renders **6 extra instanced meshes**, each with `count` instances. At 400 particles that's 2,400 extra matrix updates + color updates per frame — creating the "laggy ghost" effect visible in the screenshot. This approach is fundamentally wrong for wind streamlines and destroys performance.

### Solution: Velocity Streaks (Zero Extra Draw Calls)

Remove all 6 trail instanced meshes entirely. Instead, elongate the **main particle** along its velocity vector proportional to `trailLengthMultiplier`. This creates a motion-blur streak effect that looks like streamlines — with zero extra GPU overhead.

At `trailLengthMultiplier = 9.0` (from screenshot), particles become long thin streaks aligned to wind direction. At `0.01`, they're nearly round dots. This is how professional wind visualizations work.

### Changes — `InstancedParticles.tsx`

1. **Delete** all trail-related code: `trailRefs`, `posHistoryRef`, `frameCountRef`, `trailMaterials`, `TRAIL_SEGMENTS`, `TRAIL_OPACITY_BASE`, `TRAIL_FADE`, `FRAME_SKIP`, the entire trail update loop, and the trail `<instancedMesh>` elements
2. **Elongate main particles** based on `trailLengthMultiplier`:
   - Forward stretch: `1 + speed * 0.15 * trailLengthMultiplier` (capped at 8.0)
   - Lateral compress: `max(0.3, 1 - trailLengthMultiplier * 0.08)`
   - Particles `lookAt` velocity direction → streaks follow wind path
3. **Switch material** to additive blending with `depthWrite: false` for smoother glow overlap
4. **Use PlaneGeometry** instead of SphereGeometry — a flat billboard quad is cheaper to render and with elongation looks like a proper wind streak (2 triangles vs 24)

### Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| Instanced meshes | 7 (1 main + 6 trail) | 1 |
| Matrix updates/frame | 2,800 (400×7) | 400 |
| Draw calls | 7 | 1 |
| Visual quality | Laggy ghosts | Smooth streaks |

### Files Modified

| File | Change |
|------|--------|
| `InstancedParticles.tsx` | Remove trail system, add velocity-streak elongation, use PlaneGeometry + additive blending |

