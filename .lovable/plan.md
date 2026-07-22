
# Grand Overhaul Plan — Blade Lab, Cinema, Menu, Auth

This plan addresses everything visible in the screenshots plus the connective tissue that was skipped: cinematic backdrop that doesn't dominate the menu, correct Savonius bucket facing, working cinema camera/scenarios that respect side panels, a real animated Blade→Simulation teleport, and a deep Google-linked profile page with preset/history management.

---

## 1. Main menu backdrop — fix the huge ugly turbines

**Problem:** GLB actors are too large, spin visibly wrong through their own bodies, and dominate the UI.

**Fix in `SceneBackdrop.tsx` + `MainMenu.tsx`:**
- Push camera back (fov 28, z=14), tilt down slightly, and move actors to the outer edges (behind logo/panel).
- Reduce actor scale to 0.4–0.7; slow spin to 0.15–0.35 rad/s.
- Add a **radial vignette mask** and a stronger bottom→top gradient so the center (where menu lives) is dim and legible.
- Add subtle `Float` (drei) drift instead of forced spin on the whole model.
- Add heavy **DoF blur** (via `MeshTransmissionMaterial`-free approach: postprocessing `DepthOfField`) so backdrop reads as ambience, not content.
- Cap dpr at 1.0 on the backdrop canvas for perf.
- Add reduced-motion + mobile fallback: static poster image (a rendered snapshot) instead of Canvas.

## 2. Savonius facing bug

**Problem:** Two of three buckets face the same direction (screenshot 2). In `buildBladeGeometry.ts` the S-rotor buckets get rotation `(i / n) * 2π`, but the arc's own opening is not counter-rotated per bucket, so the concave side lands on the same hemisphere for adjacent buckets.

**Fix:** In the Savonius builder, generate each bucket as a half-cylinder whose local +X is the concave normal, then rotate around Y by `i * (2π/n)`. Alternate buckets get a `π` flip only when `n=2` (classic S). For `n>=3` remove the flip entirely — every bucket is offset by `2π/n` from the previous. Also apply the correct overlap offset along the concave-normal (−X_local), not along world X. Verify visually with `n=3` (screenshot case).

## 3. Cinema camera & panel — usability meltdown

**Problems from screenshot 3 & 4:**
- Camera sinks into the ground / inside the tower (no clamp, no framing of the rotor).
- Cinema panel is covered by left/right side panels.
- Scenario labels, chapter card, and HUD stack on top of each other and get clipped.
- Play controls appear to work but scrubbing overshoots.

**Fixes:**

**`CinemaCamera.tsx`:**
- Clamp `camera.position.y >= 0.6` (never below floor) and enforce `distance(camera, rotorCenter) >= rotorRadius * 1.4`.
- If a cue targets inside the rotor, project it outward along the horizontal vector from center.
- Save/restore user's orbit position on scenario stop so returning to free camera doesn't leave it inside geometry.
- Disable `OrbitControls` when a cue is active; re-enable on stop with a smooth handoff (copy final `look` into `controls.target`).

**`CinemaPanel.tsx` — responsive layout:**
- Panel width becomes `min(760px, calc(100vw - <side panels width>))` using CSS vars set by `BladeLab.tsx` when panels open/collapse (`--panel-l`, `--panel-r`).
- On <900px viewport: collapse chapter+HUD into a single tabbed drawer above controls; auto-hide HUD when scenario has no metrics.
- Move panel to `bottom: 16px` on mobile with `left/right: var(--panel-l/r)` so it never underlaps side panels.
- Add a **hide/show toggle** (chevron) so user can dismiss the cinema HUD entirely.

**Scenario stability:**
- On scenario switch, reset director state (elapsed=0, playing=false), fire `resetTransforms()` on the blade root, and re-run camera cue.
- Add error boundary around `<ScenarioStage/>` so a broken actor doesn't blank the canvas.

## 4. Blade → Simulation teleport — properly animated hand-off

**Current state:** `BladeTeleport.tsx` exists but the transition is a flash; the sim starts with no continuity.

**Overhaul:**
1. **Capture** — on "Apply to simulation", render the current blade to an offscreen canvas (`gl.domElement.toDataURL`) and grab its bounding rect. Save into `useTeleportStore` along with the full geometry payload.
2. **FLIP overlay** (`BladeTeleport.tsx` rewrite):
   - Phase A (0–0.6s): thumbnail flies from Blade Lab rect → center, spinning, with streamline sweep + shockwave.
   - Phase B (0.6–1.2s): thumbnail explodes into 3 blade silhouettes that fan out to form the turbine rotor.
   - Phase C (1.2–1.8s): silhouettes fade into a wireframe of the real turbine (`BladePresetTurbine3D`), then dissolve as the sim scene fades in.
3. **Route transition** — navigate to `/` (sim) at Phase B start with a Framer `AnimatePresence` cross-fade so the sim renders behind the overlay.
4. **Continuity data** — pass current wind speed, TSR, and site preset through the store so the sim boots with matching conditions (no jarring reset).
5. **Sim entry cinematic** — 2s scripted camera zoom-in on the newly-placed turbine with a "PRESET APPLIED" toast showing preset name + Cp.

## 5. Google profile page — deep, structured, actionable

**New route `/profile` (linked from `GoogleAuthPill` when signed in).**

Sections:
- **Header**: avatar, name, email, sign-out, "since" date.
- **Recent activity** (from `user_history`): grouped by kind (blade / scenario / weather site), each row clickable → re-opens exact context (loads preset, jumps to scenario, restores wind).
- **My presets** (`user_presets`): grid of blade cards with thumbnail, Cp, rotor type, material, actions: **Load**, **Send to Sim** (triggers teleport), **Duplicate**, **Rename**, **Delete**, **Export STL**.
- **Simulation snapshots** (new table `user_snapshots`): saved sim states (wind speed, site, turbine layout, camera cue) with thumbnail; **Restore** action.
- **Settings sync**: preferred language, default wind speed, default site — pulled from `user_settings`, editable inline, upserted on change.
- **Activity chart**: 14-day sparkline of actions per day (uses existing `user_history.opened_at`).

Wire deeply into cloud sync:
- Every apply/save/scenario-play/weather-open logs a `user_history` row with a rich `label` and a re-open ref.
- `GoogleAuthPill` grows a dropdown: profile link, snapshots, sign-out.
- Anonymous users see a "Sign in to save your work" CTA that preserves current action and resumes after auth.

## 6. Auxiliary polish (skipped previously)

- **`GeometryPanel` sensitivity strip**: verify it's rendering; if not, hook `computeGeoImpact` on every slider change with a 120ms debounce (already stubbed, needs mounting).
- **`BladeMesh` axis reset**: extend the reset effect to also clear `spinGroup.rotation` and any inherited scale poisoning when switching *material* (fixes some Gorlov post-crash spin bugs).
- **Cinema scenarios**: add `cameraSafeRadius` field to `types.ts` and honor it in `CinemaCamera`.
- **Backdrop** on `/info` and `/settings`: reuse the same lightened backdrop, but with different actor sets (Archimedes on info, Phoenix on settings) at the same reduced intensity.

---

## Technical details

**Files to add**
- `src/pages/Profile.tsx`
- `src/components/profile/PresetCard.tsx`, `HistoryList.tsx`, `SnapshotGrid.tsx`, `ActivitySparkline.tsx`
- `src/hooks/useTeleportBridge.ts` — encapsulates capture→navigate→hydrate flow

**Files to rewrite**
- `src/components/backgrounds/SceneBackdrop.tsx` — DoF, vignette, mobile poster fallback, `Float` drift
- `src/components/BladeTeleport.tsx` — 3-phase FLIP with wireframe morph
- `src/blade-lab/cinema/CinemaCamera.tsx` — clamps + safe-radius + controls handoff
- `src/blade-lab/cinema/CinemaPanel.tsx` — responsive width via CSS vars, collapse toggle, mobile tabs
- `src/store/useTeleportStore.ts` — extend payload (geometry, wind, tsr, site)

**Files to edit**
- `src/aero/buildBladeGeometry.ts` — Savonius bucket facing fix (n>=3 branch)
- `src/components/MainMenu.tsx` — actor scale/positions
- `src/pages/BladeLab.tsx` — expose `--panel-l/--panel-r` CSS vars; wire teleport bridge
- `src/pages/Index.tsx` — sim entry cinematic + teleport receiver
- `src/components/GoogleAuthPill.tsx` — dropdown menu with profile link
- `src/App.tsx` — `/profile` route

**Migration**
- Add `user_snapshots` table (user_id, name, thumbnail_url, wind_speed, site_id, turbine_config jsonb, camera jsonb, timestamps) with RLS + GRANTs per Cloud rules.

**Verification**
- Manual Playwright pass: menu screenshot (no huge turbines), Savonius render with n=3 (buckets face 120° apart), scenario play (camera stays outside rotor, panel not clipped), Apply-to-Sim (3-phase overlay visible), /profile loads with data.
- Typecheck must be clean.

## Out of scope (this plan)

- New scenarios beyond the existing s01–s03.
- New rotor families.
- Real BEM revalidation — only visualization/UX fixes here.
