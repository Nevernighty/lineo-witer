
## Blade Lab — Diagnostics, Calibration, Spectacular Crash & Site Scenarios

### 1. Spin/Stability Diagnostics page
New route `/blade-lab/diagnostics` (also opened as a side panel via top menu → View → Diagnostics).
- Live readouts: ω (rad/s), RPM, TSR (commanded vs effective), torque proxy (Q ≈ ½ρV²·A·Cp/ω), tip Mach, per-blade state (OK / bending / detached / recovering), failureLevel, spinDamp.
- Rolling time-series chart (Recharts, dark theme) — 30 s window, toggles for RPM, torque, failureLevel, vibration amplitude.
- Wireframe toggle (forces `viewMode='wireframe'` locally) + “Freeze spin”, “Step frame”, “Log to console” buttons for debugging wiggle/stutter.
- Source: small `useDiagnosticsStore` that `BladeMesh` pushes samples into each frame (throttled to 20 Hz).

### 2. Calibration system (per-family presets + validation)
New module `src/aero/calibration.ts`:
- `CalibrationProfile { strength, bendThresholdPct, fractureThresholdPct, reactionSpeed, recoverySpeed, flexGain, vibrationDamping }`.
- Built-ins: `HAWT_DEFAULT`, `DARRIEUS_DEFAULT`, `SAVONIUS_DEFAULT`, `ARCHIMEDES_DEFAULT` with realistic ranges.
- `validateGeometry(rotorType, geometry)` → returns warnings (e.g. Savonius needs overlap, Archimedes needs turns, HAWT needs nBlades∈[2,5]).
- Stored in `useBladePresetStore`; auto-applied when the rotor family changes; user can override via new “Calibration” submenu in top menu.
- GeometryPanel shows inline validation badges so each family’s controls actually drive the mesh.

### 3. Fix crash-recovery axis bug
In `BladeMesh.tsx` the recovery path currently lerps `position` to zero but leaves accumulated `rotation.x/y` on the per-blade group, so when blades return they spin around the wrong local axis (visible in the screenshot).
- Track `detachT` plus a separate `detachRot` quaternion per blade; on recovery, slerp it back to identity before re-parenting visuals to the spin group.
- Reset `flexRef` non-spin axes to 0 when `failureLevel < 0.05` for ≥ 0.5 s.
- Ensure spin axis stays HAWT=Z / VAWT=Y exclusively on `spinRef`; per-blade groups only carry local flutter offsets, never global rotation.

### 4. Spectacular multi-piece fracture
Replace single-rigid-detach with shard breakup at the highest-stress span:
- `buildBladeShards(geometry, nShards=3)` splits each blade into root/mid/tip pieces along span; stress at each cut is sampled from BEM bending moment.
- At fracture, each shard gets its own velocity vector: tip flies tangentially (centrifugal direction × ω×r), mid drifts downwind, root falls. Add angular velocity per shard, gravity, air drag.
- Particle burst (sparks + dust) at the break point using existing `AdvancedParticleSystem` style.
- On recovery, shards fade out and the original blade fades back in at the hub.
- Mobile: 1 shard per blade, no particles.

### 5. Site/Scenario macro presets
New `src/aero/sitePresets.ts`:
- `roof_pitched`, `roof_flat`, `near_roof_edge`, `balcony`, `lowland_open`, `lowland_urban`, `highland_ridge`, `coastal`, `forest_clearing`.
- Each defines: wind profile (mean V, turbulence intensity, gust factor, shear exponent α), inflow angle distribution, obstacle proxies, recommended rotor families, scene dressing (ground texture tint, skybox tone, ambient particles).
- New top-menu submenu “Сценарій” + a card grid in the Simulation panel. Selecting a scenario:
  - drives `windSpeed`, turbulence and gust sliders,
  - swaps a lightweight 3D environment (roof slab, balcony rail, ridge silhouette, tree line) as instanced meshes around the rotor,
  - feeds turbulence into `BladeMesh` flex and into Streamlines jitter so blades visibly react.

### 6. Bottom ribbon + Settings UI fix (screenshot #2)
Current ribbon clips text “Швидкість вітру V∞” and the slider thumbs overflow.
- Rebuild as a CSS grid: `[label | slider | value]` with `min-width:0`, `truncate`, `clamp()` font-size, slider min-width 120 px, value monospace.
- Move secondary controls into a popover (“Більше…”) to keep the bar compact at 1024 px.
- GeometryPanel + SimMenuPanel: unify input/Slider/Label sizing tokens (`--bl-control-h`, `--bl-label-fs`, `--bl-value-fs`), remove ad-hoc paddings, ensure all panels use `bl-dark-tabs` and `bl-analysis-surface` for contrast. Virtualize long parameter lists with `<ScrollArea>` so the panels don’t reflow the page.

### 7. Expanded Vortex / Wake / Streamlines controls
Extend the Simulation → VFX submenu:
- Vortex: intensity, turns, radius factor, decay length, color mode (speed/pressure/stress).
- Wake: density, swirl strength, expansion ratio, lifetime.
- Streamlines: count, length, jitter (turbulence), speed multiplier, “bind to V∞” toggle so particle speed = real windSpeed × multiplier.
- New mode “Air around blades”: short streamlines sampled near each blade surface, advected by a simple potential-flow proxy around the airfoil cross-section, visualising attached vs separated flow (ties into existing stall view).
- All controls persist in `useBladePresetStore.vfx` and stream into `BladeViewer3D` props.

### 8. Files to add / modify
Add:
- `src/pages/BladeLabDiagnostics.tsx`
- `src/components/blade-lab/DiagnosticsPanel.tsx`
- `src/store/useDiagnosticsStore.ts`
- `src/aero/calibration.ts`
- `src/aero/sitePresets.ts`
- `src/components/blade-lab/SiteScenarioPicker.tsx`
- `src/components/blade-lab/SceneDressing.tsx`
- `src/components/blade-lab/BladeShards.tsx`

Modify:
- `src/pages/BladeLab.tsx` (top menu entries, ribbon rebuild, route hook)
- `src/components/blade-lab/BladeMesh.tsx` (axis-correct recovery, shard fracture, diagnostics emit)
- `src/components/blade-lab/BladeViewer3D.tsx` (extra vortex/wake/streamline props, scenario env, near-blade flow)
- `src/components/blade-lab/GeometryPanel.tsx` (family validation badges, calibration sliders)
- `src/components/wind-simulation/3D/BladePresetTurbine3D.tsx` (mirror shard fracture + axis fix)
- `src/store/useBladePresetStore.ts` (calibration + vfx + scenario state)
- `src/index.css` (ribbon grid tokens, unified control sizing)
- `src/App.tsx` (diagnostics route)

### Technical notes
- Diagnostics sampling uses `requestAnimationFrame` throttle to avoid React re-render storms; chart reads from a ring buffer.
- Shard geometry is precomputed per preset and cached in a `useMemo` keyed by geometry hash.
- Site scenarios only swap dressing meshes + wind params; physics core stays the same to keep changes UI/presentation-scoped.
