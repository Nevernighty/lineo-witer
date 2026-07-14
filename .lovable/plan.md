
## Goal

Level up the app from a set of screens into a guided, cinematic experience: real turbine GLBs as living backgrounds, Google sign-in that remembers presets and reading history, an animated hand-off from Blade Lab to the 3D simulation, and deeper, tooltip-guided scenarios where geometry visibly drives the physics.

---

## 1. Asset pipeline (uploaded GLBs)

Upload the 9 GLBs via `lovable-assets` (kept off the repo) and produce pointer JSONs under `src/assets/models/`:

| File | Role |
|---|---|
| `wind_turbine_animated.glb` | HAWT hero (menu bg, sim ambient) |
| `wind_turbine_animated-2.glb` | HAWT variant (Knowledge bg) |
| `wind_generator_animated.glb` | HAWT compact (Settings bg) |
| `phoenix_rising_eco_wind_generator.glb` | Cinematic hero (loading + Cinema stage) |
| `vertical_wind_turbine.glb` | VAWT hero (Blade Lab bg card) |
| `darrieus_rotor_for_vertical_wind_turbine_.stl.glb` | Darrieus reference in Cinema |
| `savonius3_main.glb` + `savonius3_top.glb` | Savonius reference pair |
| `archimedes_wind_turbine.glb` | Archimedes/Liam reference |

New `src/three/GlbModel.tsx` — a small `useGLTF` + `useAnimations` wrapper with:
- **Body/rotor auto-split**: on load, traverse the scene and detect the spinning subtree (largest child under root that isn't the tower/nacelle bounding box). Only that subtree gets rotated; the base stays static — solves the "spinning whole body" bug for models that don't ship with a proper animation clip.
- If the GLB has an animation clip, play it instead (Phoenix/animated ones).
- DRACO/Meshopt-safe loader init; suspense fallback = existing procedural mesh.

## 2. Cinematic 3D backgrounds

New `src/components/backgrounds/SceneBackdrop.tsx` — full-screen fixed `<Canvas>` at `z-0`, `pointer-events: none`, tone-mapped, slow parallax camera.

Placements (all behind existing UI, `absolute inset-0`, isolation-safe):
- **MainMenu**: 3-turbine skyline (HAWT hero centre-back + VAWT + Savonius mid). Camera slow-dolly + subtle wind streamlines.
- **InfoPage / Knowledge**: single HAWT far-right with tilt-shift blur, section-scroll-linked camera y-offset.
- **GeneratorSettings dialog**: small looping HAWT inside the header strip only (not full modal, so form remains readable).
- **Blade Lab card on MainMenu**: replaces current inline SVG with a live rotating `vertical_wind_turbine.glb` thumbnail.
- **Loading screen**: Phoenix Rising GLB with animation clip, dissolving into the menu.

Guardrails: all backdrops mount lazy, `<Suspense>`-gated, disabled on low quality preset (`useDiagnosticsStore.perf`), and `visibilitychange` pauses `requestAnimationFrame`.

## 3. Blade → Simulation animated teleport

- New `src/store/useTeleportStore.ts` — global "in-transit blade" state (source rect, target rect, preset payload).
- On **Apply preset** in `/blade-lab`, capture the blade thumbnail via `gl.domElement.toDataURL`, push to store, `navigate('/')` and set `appState='simulation'`.
- New `src/components/BladeTeleport.tsx` — framer-motion overlay: FLIP-animate the captured blade image from Blade Lab canvas rect → sim rotor centre in world→screen coordinates, with a shockwave ring and streamline sweep. Uses `layoutId` for continuity when the same rotor mesh becomes the sim rotor.
- Simulation view fades in over the teleport (crossfade), sim rotor pulses once "received".
- Reverse animation on `←` back button (rotor collapses into the tile).

## 4. Google sign-in + cloud presets

- Enable Lovable Cloud, activate **Google** provider in Cloud Auth.
- New button in `MainMenu` header **left of the UA/EN switch**: `GoogleAuthPill` — avatar+name when signed in, "Sign in with Google" chip otherwise. Uses `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- New tables (migration includes GRANTs + RLS, user-scoped):
  - `user_presets` — saved blade presets (jsonb geometry, rotor_type, material, thumbnail_url).
  - `user_history` — recent Blade Lab actions and Knowledge pages visited (kind, ref_id, opened_at). Used for "Recently opened" ribbon in menu.
  - `user_settings` — last simulation wind/site, generator spec, language.
- New `src/hooks/useCloudSync.ts` — mirrors `useBladePresetStore` and app settings to Supabase when signed in; falls back to localStorage otherwise. Debounced writes.
- New `src/components/RecentlyUsedRibbon.tsx` on MainMenu (only when signed in): last 4 presets + last 3 knowledge pages, one-click resume.

## 5. Geometry ↔ science coupling upgrades

- Extend `GeometryPanel` with **live delta strip**: as user drags `chord`, `twist`, `solidity`, `helical`, `overlap`, we recompute BEM `Cp(TSR)` and show ∆Cp / ∆torque / ∆stall margin next to each slider (colour-coded arrows).
- New `src/aero/geoImpact.ts` — cheap analytic sensitivity model per rotor family (already have BEM; wrap it with cached table lookup per param).
- Blade Lab HUD: overlay "You changed camber +2° → Cp_max +0.031, stall onset −1.2° AoA" using framer-motion pop-in.
- `BladeMesh` gets `morph-on-change` — geometry rebuild lerps vertex positions over 0.4 s instead of hard swap, so changes read as animated cause→effect.

## 6. Scenario library + tooltips

Add 3 new cinema scenarios (bringing the count to 6) that use the imported GLBs as background actors and stage props:

| id | Title | Story beats |
|---|---|---|
| `s04-tunnel` | Wind tunnel calibration | Uniform inflow, ramp V∞ 2→14 m/s, show Cp curve tracing under HUD, GLB tunnel walls. |
| `s05-urban-canyon` | Urban canyon gust | HAWT between two buildings (GLB proxies), asymmetric loading, yaw error tooltip. |
| `s06-coastal-shear` | Coastal shear + salt spray | Power-law shear inflow, particle salt effect, blade fatigue tooltip. |

New `src/blade-lab/cinema/Tooltip3D.tsx` — world-anchored tooltip with leader line to a target mesh; text pulled from scenario keyframe. Auto-fits within viewport; supports `pin` (stays until dismissed) and `beat` (auto-hides at next keyframe).

Update `CinemaPanel` with a scenario carousel using scenario thumbnails rendered from the GLBs.

## 7. Small polish + safety

- `SceneBackdrop` respects `prefers-reduced-motion` (freezes to a still frame).
- All new tables include `service_role` GRANTs and `authenticated` RLS by `auth.uid()`.
- Auth session restored via `onAuthStateChange` listener in `App.tsx`.
- Cookie/consent notice inside `GoogleAuthPill` popover (short UA/EN copy) before triggering OAuth.
- No new heavy deps beyond `@react-three/drei` (already installed) — `useGLTF` handles GLB.

## Technical section

- New files:
  - `src/three/GlbModel.tsx`, `src/three/detectRotorSubtree.ts`
  - `src/components/backgrounds/SceneBackdrop.tsx`
  - `src/components/BladeTeleport.tsx`, `src/store/useTeleportStore.ts`
  - `src/components/GoogleAuthPill.tsx`, `src/hooks/useCloudSync.ts`, `src/hooks/useAuthUser.ts`
  - `src/components/RecentlyUsedRibbon.tsx`
  - `src/aero/geoImpact.ts`
  - `src/blade-lab/cinema/Tooltip3D.tsx`, `s04-tunnel.ts`, `s05-urban-canyon.ts`, `s06-coastal-shear.ts`
  - `src/assets/models/*.asset.json` (9 pointer files)
- Edited: `Index.tsx`, `MainMenu.tsx`, `LoadingScreen.tsx`, `InfoPage.tsx`, `GeneratorSettings.tsx`, `BladeLab.tsx`, `CinemaPanel.tsx`, `GeometryPanel.tsx`, `BladeMesh.tsx`, `scenarios/index.ts`, `App.tsx`.
- Migration: `user_presets`, `user_history`, `user_settings` with GRANTs + RLS + updated_at triggers.
- Cloud: enable Cloud + configure Google provider.

## Rollout order

1. Enable Cloud + Google → migrations → auth pill (unblocks sync).
2. Upload GLBs → `GlbModel` + `SceneBackdrop` on MainMenu.
3. Teleport animation + `useTeleportStore`.
4. Cloud sync of presets + recently-used ribbon.
5. Backdrops on Info/Settings/Loading + geometry sensitivity HUD.
6. New scenarios + Tooltip3D.
