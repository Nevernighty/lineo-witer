
# Grand Overhaul v2 — Blade Lab, Wind Sim, Teleport, Profile

Focused on the concrete regressions in the screenshots and the deferred scope from last turn. No new rotor families or physics rewrites — geometry stays as-is; this pass is UX, VFX, wiring, and content.

---

## 1. Main menu backdrop — kill the oversized turbine

**Symptom:** one GLB still spans the viewport and covers the central panel.

Fix in `SceneBackdrop.tsx` + `MainMenu.tsx`:
- Compute per-actor auto-fit: after GLB load, measure `Box3`, normalize to a target world size (0.8–1.2 units) via a wrapper `<group scale={target/bboxMax}>`. No more relying on hard-coded `scale`.
- Move actors to a ring at radius 6, y=1.2, behind the panel (never in front of camera frustum center). Camera fov 24, z=18.
- Add a **center exclusion mask**: any actor whose projected screen bbox intersects the central 42%×62% zone is culled that frame (cheap AABB test in `useFrame`).
- Strengthen radial vignette to `hsl(var(--background)/0.92)` at center.
- Keep mobile poster fallback.

## 2. Upload user buildings as CDN assets + city scenario stages

New assets from user upload (10 GLBs: apartments, panel buildings, kiosk, station, spire, university, palace of culture). Upload via `lovable-assets` into `src/assets/buildings/` as `.asset.json` pointers.

New registry `src/assets/buildings/index.ts` exposing `BUILDING_MODELS` typed keys with human labels + rough footprint metadata (width, depth, height in meters, roof type).

Wire into `ScenarioStage.tsx`:
- `stage: 'urban_canyon'` — two panel buildings + kiosk forming a Venturi funnel; add wake cones + turbulence VFX between them.
- `stage: 'rooftop_5floor'` — Slavutych 5-floor apartment as base, turbine on roof with parapet separation zone.
- `stage: 'ridge_spire'` — Kryvyi Rih spire as ridge silhouette.
- Extend `StageId` union in `cinema/types.ts`.

## 3. Cinema scenarios — actually illustrative

Add three richer scenarios and rewrite existing ones to spend more time in explanation, less in raw camera fly.

- `s04-urban-canyon.ts` — Venturi speed-up between two panel buildings. HUD shows `V_gap = V∞ × (A_open/A_gap)`; VFX: colored streamlines that compress through the gap, arrows accelerating, tip-vortex pulses on turbine.
- `s05-rooftop-parapet.ts` — replaces s01 role. Highlights recirculation bubble (rotating arrow band), shows why turbine placed <1.5×parapet fails; failure boost ramps as camera dips into the bubble.
- `s06-cold-start.ts` — Savonius/Darrieus self-start at low TSR. Shows Cp curve, torque needle, when the rotor "catches".

Each scenario:
- 6–10 keyframes with narrator text (UA/EN), formula card, and at least 3 VFX bursts.
- Highlighted DOM tooltip anchored to a 3D point (`Html` from drei) with fade+arrow — new component `CinemaTooltip.tsx`.
- Persistent left-side "chapter progress" rail (dots per keyframe) — added to `CinemaPanel.tsx`.

Also raise `CinemaCamera` `safeRadius` to `rotorRadius*1.6` and add a top clamp so it never tips upside-down.

## 4. 3D wind simulation HUD/popups — stop blocking the flow

**Symptom:** 2D popups sit on top of turbines and obscure particle flow.

New component `src/components/wind-simulation/3D/TurbineHudCard.tsx` (drei `Html` with `occlude` + `transform=false`, distance-attenuated):
- Anchored to a **fixed offset above+beside** each turbine (e.g. `[+1.4, +2.2, 0]` in turbine local frame), with a thin leader line drawn via `<Line>`.
- Auto-flip to the side away from camera-forward projection so it never overlaps rotor disk (compute each frame from `camera.position` vs turbine position).
- Compact metrics: current P (W), rolling avg P, cumulative kJ, hits/s, TI%, wake status. Expand-on-hover reveals full breakdown (per-blade load, RPM, TSR, Cp).
- Small sparkline (last 60 s) rendered in SVG.

Replace inline popup usage in `WindSimulation3D.tsx` and remove any DOM overlays sitting on the canvas center.

Add a "HUD density" toggle in `AdvancedWindControls.tsx`: Off / Compact / Full.

Collision popups (`LocalHitPopup.tsx`): move to a screen-edge stack (top-right toast rail) instead of anchoring to particle world position; keep a tiny 3D pulse at the hit point so causality remains visible.

## 5. Aerodynamics detail bump (visualization only)

Not a physics rewrite. Enhancements in `AnalysisVisualizations.tsx` + particle system:
- Color particles by local speed magnitude (blue→cyan→amber→red LUT), not uniform.
- Add optional **pressure ribbons** on blade suction side (already partly there — expose density/opacity in `AdvancedWindControls`).
- Wake ribbons: expose density, decay, radius, turbulence sliders (previous ask — verify all four bind to shader uniforms, not just density).
- Show total instantaneous kJ delivered to rotor as a large corner readout with color pulse on spikes.

## 6. 3-phase teleport rewrite

Rewrite `BladeTeleport.tsx` per prior plan:
- Phase A (0–0.55 s): captured thumbnail flies from Blade Lab canvas rect → screen center, spins, shockwave ring.
- Phase B (0.55–1.15 s): thumbnail bursts into `nBlades` silhouette blades that fan out into rotor arrangement.
- Phase C (1.15–1.8 s): silhouettes morph into a wireframe copy of the target turbine, then dissolve as `Index.tsx` fades in behind.

Extend `useTeleportStore.ts` payload:
```ts
geometry: BladeGeometryPayload;
rotorType: RotorType;
nBlades: number;
windSpeed: number;
tsr: number;
siteId?: string;
```

`useTeleportBridge.ts` new hook: `capture(canvasRef, presetInfo) → startTeleport(...) → navigate('/') → hydrate sim store`.

On sim entry: 1.5 s scripted camera pan onto the freshly placed turbine + "PRESET APPLIED" toast with preset name + Cp.

## 7. `/profile` page (Google-linked)

New route `/profile` + `Profile.tsx`. Sections:
- Header: avatar, name, email, sign-out, member-since.
- **Recent activity** — `user_history` grouped by kind (blade / scenario / weather / snapshot); each row re-opens exact context via a small router in `useCloudSync.ts`.
- **My presets** — `user_presets` grid using `PresetCard.tsx` (thumb, Cp, rotor type, material). Actions: Load, Send to Sim (fires teleport bridge), Duplicate, Rename, Delete, Export STL.
- **Settings sync** — inline editors for language, default wind speed, default site → upserts `user_settings`.
- **14-day activity sparkline** — `ActivitySparkline.tsx` from `user_history.opened_at`.

`GoogleAuthPill.tsx` grows a dropdown: Profile, Sign out.

No new tables this pass (snapshots deferred — `user_history` already covers re-open refs).

## 8. GeometryPanel sensitivity strip — wire it

`GeometryPanel.tsx`: mount `computeGeoImpact` on every slider change with a 120 ms debounce. Render a 5-bar sparkline strip per parameter (Cp Δ, torque Δ, vibration Δ, mass Δ, cost Δ) with color-coded delta arrows. This has been stubbed since v1 — this turn actually wires the hook and renders.

---

## Files

**New**
- `src/assets/buildings/index.ts` + 10 `.asset.json` pointers
- `src/blade-lab/cinema/scenarios/s04-urban-canyon.ts`
- `src/blade-lab/cinema/scenarios/s05-rooftop-parapet.ts`
- `src/blade-lab/cinema/scenarios/s06-cold-start.ts`
- `src/blade-lab/cinema/CinemaTooltip.tsx`
- `src/components/wind-simulation/3D/TurbineHudCard.tsx`
- `src/pages/Profile.tsx`
- `src/components/profile/PresetCard.tsx`
- `src/components/profile/HistoryList.tsx`
- `src/components/profile/ActivitySparkline.tsx`
- `src/hooks/useTeleportBridge.ts`

**Rewrite**
- `src/components/backgrounds/SceneBackdrop.tsx` — auto-fit + center-exclusion cull
- `src/components/BladeTeleport.tsx` — 3-phase FLIP
- `src/blade-lab/cinema/ScenarioStage.tsx` — building stages
- `src/store/useTeleportStore.ts` — extended payload

**Edit**
- `src/blade-lab/cinema/CinemaPanel.tsx` — chapter rail + tooltip host
- `src/blade-lab/cinema/CinemaCamera.tsx` — top clamp, larger safeRadius
- `src/blade-lab/cinema/types.ts` — extended StageId
- `src/blade-lab/cinema/scenarios/index.ts` — register new scenarios
- `src/blade-lab/cinema/scenarios/s01-rooftop.ts` — polish narrator text
- `src/components/MainMenu.tsx` — actor ring layout
- `src/components/GoogleAuthPill.tsx` — dropdown w/ Profile link
- `src/components/wind-simulation/3D/WindSimulation3D.tsx` — swap popups for `TurbineHudCard`
- `src/components/wind-simulation/3D/LocalHitPopup.tsx` — screen-edge stack
- `src/components/wind-simulation/3D/AdvancedWindControls.tsx` — HUD density, wake sliders bound
- `src/components/wind-simulation/3D/AnalysisVisualizations.tsx` — speed-LUT particles, pressure ribbon density
- `src/components/blade-lab/GeometryPanel.tsx` — sensitivity strip mount
- `src/pages/BladeLab.tsx` — use `useTeleportBridge`
- `src/pages/Index.tsx` — teleport receiver + entry cinematic
- `src/App.tsx` — `/profile` route

## Verification

- `bun run build` clean.
- Manual Playwright pass: menu (no oversized model over panel), Blade Lab scenario s04 (streamlines compress through building gap, narrator visible), Sim (HUD cards not over rotor, sparklines update), Apply-to-Sim (3 phases visible), `/profile` loads with presets + history + sparkline.

## Out of scope

- Snapshot table (`user_snapshots`).
- New rotor families or BEM revalidation.
- Full audio pass for new scenarios.
