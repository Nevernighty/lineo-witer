# Overhaul: presets & profile, wind particles/energy, sound, real turbine explorer

Four problem areas from the screenshots, fixed properly rather than patched.

## 1. Presets named "Користувацька" — full naming + profile overhaul

Confirmed: two saved presets in the database are literally named "Користувацька" (legacy auto-save rows) and the profile only lets you delete them.

- Rename via an inline editable field (name + note + tags) everywhere — in the preset library dialog and in the profile list. No `window.prompt`.
- Legacy unnamed rows get a one-click "Назвати пресет" action with a smart suggestion (rotor family · R · blades · site).
- Profile page becomes a real workspace: search, sort (date/name/family), family filter chips, richer cards (thumbnail, rotor type, radius, blades, wind/TSR, site, note), and actions: apply, open in Blade Lab, send to simulation, duplicate, rename, delete with undo toast.
- Preset detail drawer with the full parameter table and "what changed vs current" diff.

## 2. Wind particles, energy readout and the joule spam

- Remove the per-hit "+0.32 Дж" popups entirely (they were rendered per collision and stacked on top of each other).
- Replace with one aggregated energy readout per generator: accumulates continuously, commits a smoothly animated update every ~2 s, shows instantaneous power (W) and accumulated energy (kWh/J) in a compact, depth-faded HUD chip.
- Clicking the chip opens a live chart window — draggable, snappable to screen edges, resizable, with power/energy series over a rolling window, and it can be enlarged.
- Particle motion: replace the random jitter with a geometry-aware flow field — particles accelerate along smooth streamlines, bend around the rotor disc/blades and get drawn in (suction) instead of jumping. Trails become readable flow paths whose colour/thickness encode local flow strength, so path and force are visible.

## 3. Sound

- Global mute + volume control, persisted, exposed in the simulation header and settings.
- Wind ambience becomes type-dependent (calm/gust/storm and particle appearance preset), layered noise with slow modulation instead of the current repeated harsh burst; per-event sounds are rate-limited so they never machine-gun.

## 4. Real 3D-printed turbines — black models, wrong placement, no highlight

- Fix the black parts: parts currently get a single opaque standard material with no reliable image-based lighting; the stage will get local light shaping plus corrected material setup (recomputed normals, no double-sided z-fighting, correct tone mapping) so every part renders lit.
- Robust per-part loading: progressive load with per-part fallback and retry instead of a silhouette.
- Correct orientation/placement: derive each part's up-axis and seat position from its bounding box and role rather than a generic ring layout, so blades, generator discs and hub parts sit as they do in the real assembly.
- Hover/selection: animated rim highlight + label tether on hover, focus-dim of the rest on select, smooth camera focus, and part list ↔ 3D two-way sync.
- Explode/assembly animation gets eased, staggered motion per sub-assembly.

## Technical notes

- Files touched: `src/components/blade-lab/PresetManager.tsx`, `src/pages/Profile.tsx`, `src/hooks/useCloudSync.ts`; `src/components/wind-simulation/3D/LocalHitPopup.tsx` (replaced by an aggregated energy store + HUD), `AdvancedParticleSystem.tsx`, `WindGenerator3D.tsx`, new draggable chart window component; `src/utils/sounds.ts` (+ mute store); `src/components/turbine-explorer/PartMesh.tsx`, `TurbineExplorer3D.tsx`, `RealTurbineExplorer.tsx`, `src/data/turbineParts/layout.ts`.
- No schema change needed; preset notes/tags go into the existing `extra` JSON column.
- Verification: Playwright screenshots of the simulation (no popup spam, energy chip + chart) and of the real-turbine explorer (lit parts, working hover highlight).
