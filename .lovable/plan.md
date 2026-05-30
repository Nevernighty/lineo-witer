## Blade Lab v3 + Simulation Integration + Impact UX Cleanup

Non-destructive — only add/refine. No file deletions.

### 1. Blade Lab — mobile layout & overlap fixes

`src/pages/BladeLab.tsx`
- Replace flex-wrap header with two-row header on `<md`: row 1 = back + title + lang, row 2 = horizontally scrollable chip-bar for preset select + STL buttons + scale switch + reset. Header height stays bounded; no overflow into 3D.
- Truncate title at `xs`, drop subtitle below `sm`.
- Mobile tabs: change 4-tab strip to a sticky bottom bar (`fixed bottom-0 inset-x-0`, safe-area padding) so tabs don't collide with viewer overlays. Add `pb-14` on tab content.
- `ViewerControls`: collapse into a single collapsible "Сцена / Scene" sheet on `<md` (Sheet from `ui/sheet`) triggered by a small floating button in the top-left of the viewer — removes the giant overlay seen in screenshot 2. Toggle labels go full text inside the sheet (no `...` ellipsis).
- `HUD`: on `<md`, switch to a single-line compact strip pinned top-right under the header (`text-[9px]`, horizontal), so it doesn't overlap the view-mode panel.
- Viewer min-height on mobile: `min-h-[55vh]` so 3D isn't squashed under controls.

### 2. True VAWT geometry (fix Darrieus showing as horizontal rotor)

Root cause: VAWT presets reuse HAWT mesh — blades fan around +Z (wind axis) as a horizontal disc.

`src/aero/presets.ts`
- Add `isVAWT?: boolean` and `helicalTwist?: number` fields on `RotorPreset`. Mark `darrieus`, `gorlov` as VAWT; gorlov gets `helicalTwist: 60`.
- Add 3 more VAWT presets: `savonius` (drag-type 2-bucket), `darrieus-eggbeater` (curved troposkein), `quietrevolution-qr5` (helical 5 m).

`src/aero/buildBladeGeometry.ts` — extend
- New builder branch `buildVAWTGeometry(g, viewMode, helical, type)` returning the same `BuiltBlade` interface.
  - Straight H-Darrieus: blades extruded along **+Z** (vertical), placed at radius `g.tipRadius` from the spin axis, chord tangential.
  - Helical (Gorlov / QR5): same but each station rotated about Z by `helical * (z / span)`.
  - Troposkein (eggbeater): blade follows `r(z) = R · sin(π z / H)` (catenary-like) along Z.
  - Savonius: two half-cylinder shells in S layout.
- Single export `buildRotorGeometry(g, viewMode, …, { type: 'hawt'|'vawt-h'|'vawt-helical'|'vawt-tropo'|'savonius' })` dispatches.

`src/components/blade-lab/BladeMesh.tsx`
- Accept `rotorType` prop. For VAWT types: spin axis = +Z vertical, clones rotate around **+Z** but blades already live offset on +X with span on +Z (no radial fan — they're parallel uprights).
- Hub: vertical cylinder (axis = Z) sized to rotor height for VAWT; existing horizontal nacelle for HAWT.
- Auto-fit camera passes `aspectMode: 'tall' | 'wide'` so CameraFit (in `BladeViewer3D.tsx`) frames a tall VAWT correctly (no more close-up of inner shell as in screenshot 3).

`BladeViewer3D.tsx`
- TipVortex + WindArrows: when VAWT, wind blows along +X horizontally past the vertical rotor; vortices shed downstream along +X instead of along +Z.
- Ground disc sits at `z = -height/2` for VAWT.

`BladeLab.tsx` — auto-set viewer `rotorType` from preset (`isVAWT` + `helicalTwist`) and pipe through `viewerProps`.

`src/aero/bem.ts`
- Add `solveVAWT(g, flow)` using double-multiple-streamtube (DMS) approximation — closed-form Cp(λ) with cubic fit calibrated to published Darrieus/Savonius curves. AeroAnalysis switches solver based on `rotorType` so power numbers stop showing NaN.

`src/components/blade-lab/AeroAnalysis.tsx`
- Branch metrics for VAWT (no AoA-at-tip, show λ_opt and σ instead). Replace `NaN kW` (screenshot 3) with graceful fallback + units.

### 3. Bridge presets into main simulation (Blade Lab → 3D sim)

New `src/store/useBladePresetStore.ts` (same `useSyncExternalStore` pattern as `useWindStore.ts`):
- Holds: `activeBladePreset: { id, nameUA, nameEN, geometry, materialId, rotorType } | null`
- Persists to `localStorage` ("lineo.bladePreset.v1") so it survives navigation between `/blade-lab` and `/`.

`src/pages/BladeLab.tsx`
- Add header button "**Застосувати в симуляції / Use in simulation**" → writes current geometry+material+rotorType to the store, toasts confirmation, optionally `navigate('/')`.

`src/components/wind-simulation/3D/WindGenerator3D.tsx` (and/or `WindTurbine.tsx`)
- Read `activeBladePreset`. When present:
  - Scale visual turbine blade length/chord to match `geometry.tipRadius` and `chordRoot`.
  - For VAWT presets, swap the 3D model to a vertical-axis variant (new `VerticalAxisTurbine3D.tsx` — small parametric mesh reusing `buildRotorGeometry`).
  - Surface a small badge "Custom blade · NREL 5-MW" near the turbine.

`src/components/wind-simulation/EnergyCalculator.ts` (or `windCalculations.ts`)
- Add `computePowerFromBladeGeometry(geometry, rotorType, windSpeed, airDensity)` calling `solveBEM`/`solveVAWT` and returning instantaneous power. Falls back to existing formula when no preset is active.

`src/components/wind-simulation/WindControls.tsx` (settings panel)
- Add an "Aero source" toggle: `Built-in` / `Blade Lab geometry`. When Blade Lab is selected, expose read-only summary (R, c, N, airfoil) + "Open Blade Lab" link.

### 4. Impact / energy-popup spam cleanup in main sim

Files: `src/components/wind-simulation/3D/LocalHitPopup.tsx`, `CollisionHotspot.tsx`, `CollisionEffect.tsx`, `WindSimulation3D.tsx`, `NewParticleSystem.ts`.

- Add a global rate-limiter inside `WindSimulation3D.tsx`:
  - Per-obstacle popup cooldown (default 350 ms), max 8 popups on screen, FIFO replacement.
  - Aggregate impacts within 200 ms window into a single popup showing `Σ J` and a small counter `×N` instead of stacking.
- `LocalHitPopup.tsx`: shorter lifetime (700 ms), float upward and fade, compact `text-[10px]` chip; auto-place with collision-avoidance against existing popups (track active rects).
- `CollisionHotspot.tsx`: switch from per-impact pulse to a smoothed heat ring whose intensity decays exponentially — no flicker spam.
- `CollisionEffect.tsx`: cap concurrent ripples to 6; reuse from a pool.
- Add a `useWindStore.particles.impactDensity` slider (0–1, default 0.5) wired to the rate-limiter so user can dial spam down further.
- Ensure popups respect the `visual.showLocalHits` toggle (already in store) and hide instantly when off.

### 5. Settings ↔ Blade Lab consistency

`src/components/GeneratorSettings.tsx`
- When `activeBladePreset` is set, pole-count / generator subtype defaults derive from preset (`materialId`, `tipRadius`) — e.g. small DIY → permanent-magnet 12-pole; utility → DFIG 4-pole. User can still override.
- Add a "Linked to Blade Lab preset: …" chip with a "Clear" button.

### 6. i18n

`src/utils/i18n.ts` — add keys for: Apply-in-Simulation, VAWT preset names, impact-density slider, Scene sheet title, Aero source toggle, "Linked to Blade Lab preset".

### 7. Files

**New:** `src/store/useBladePresetStore.ts`, `src/components/wind-simulation/3D/VerticalAxisTurbine3D.tsx`

**Modified:** `src/pages/BladeLab.tsx`, `src/components/blade-lab/{BladeMesh,BladeViewer3D,AeroAnalysis,GeometryPanel}.tsx`, `src/aero/{buildBladeGeometry,presets,bem}.ts`, `src/components/wind-simulation/3D/{WindSimulation3D,WindGenerator3D,LocalHitPopup,CollisionHotspot,CollisionEffect}.tsx`, `src/components/wind-simulation/{EnergyCalculator.ts,WindControls.tsx}`, `src/components/WindTurbine.tsx`, `src/components/GeneratorSettings.tsx`, `src/store/useWindStore.ts`, `src/utils/i18n.ts`.

### Technical notes (out-of-scope details)

- VAWT mesh uses the same NACA section builder; only the placement axis changes. Caps stay closed because we re-emit triangle fans at z-min/z-max stations.
- `solveVAWT` returns the same `BemResult` shape so Recharts panels need no changes.
- The preset store uses a versioned localStorage key so future schema changes can migrate or clear safely.
- Rate-limiter uses `performance.now()` and a `Map<obstacleId, lastTime>` kept inside a `useRef`, so it adds zero re-renders.
