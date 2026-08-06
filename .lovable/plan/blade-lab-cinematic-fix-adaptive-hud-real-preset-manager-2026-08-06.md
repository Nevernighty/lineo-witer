# Blade Lab: cinematic fix, adaptive HUD, real preset manager

## What is broken today (confirmed in code)

- **Scenario framing is guesswork.** `CinemaCamera` builds the shot each frame from a cue plus hardcoded offsets (`look.y -= sceneScale * 0.24/0.34`, portrait multiplier 1.08–1.28). There is no per-scenario composition, no FOV control, and nothing is remembered between scenario switches — so rooftop shots clip inside the building, the ridge scenario shows two floating blades, and the wake shot leaves a dead upper half.
- **Rotor and stage are placed independently.** Buildings/terrain in `ScenarioStage` and the rotor in `BladeMesh` are both anchored at origin, which is why the turbine appears buried in the 5-storey model.
- **HUD is fixed-size.** `CinemaPanel` is pinned to `bottom-14` with `max-w-[760px]` regardless of canvas height, rotor radius or sidebar width — empty band on top, overlap at the bottom on short viewports.
- **Preset saving is broken.** `applyToSimulation` in `BladeLab.tsx` calls `savePreset` on every non-silent apply with the fallback name `Користувацька` whenever no catalog preset is selected. Nothing dedupes, nothing lets you name/edit, so the profile fills with identical entries.

## What I will build

### 1. Camera composition presets per scenario (saved and restored)
- Add a `composition` block to the scenario spec: `{ fov, framing: 'wide' | 'medium' | 'detail', lookBias, minDistanceR, floorClearance, hudZone }`, plus optional per-keyframe overrides.
- `CinemaCamera` computes the shot from the rotor bounding sphere (radius, height, stage bounds) instead of magic numbers: it fits the actor into the free viewport area, applies the scenario FOV, clamps against stage geometry (building walls, ground, mast) so the camera can never enter a mesh.
- Persist the last used composition per scenario (`localStorage` + cloud settings when signed in) and restore it on scenario switch and on return from the wind simulation, including manual camera adjustments the user makes.

### 2. Adaptive HUD
- HUD measures its own height and reports it to the viewer; the camera uses the real free-rect (top telemetry card + bottom panel + open sidebars) as its composition frame.
- Panel width/density scale with canvas size: full two-column card on wide canvases, condensed single column under ~620px, auto-collapse to the transport bar under ~430px height. No fixed `bottom-14` / `max-w` constants.
- Top telemetry card and bottom panel share one layout store so neither overlaps the rotor at any resolution.

### 3. Scenario rebuild (s01–s06) with correct staging
- Every stage exposes a bounding box and a mount point; the rotor is placed on the mount (rooftop, parapet, mast, ridge crest, ground pad) instead of at origin — fixes the "turbine stuck in the building" case.
- Flow visuals per scenario become physically legible: separation bubble over the roof, Venturi acceleration in the canyon, Jackson–Hunt speed-up over the ridge, Jensen deficit cone in the wake case, torque build-up for the cold start.
- Guided highlights get real animation: sequenced pulse on the highlighted part, animated leader lines to labels, legend synced to the active step, dimmed background for non-focused geometry.

### 4. New turbine models
- Register the 9 uploaded GLBs as CDN assets and use them for stage dressing and menu/backdrop scenery, with the existing rotor-only spin detection so bodies never rotate. Auto-fit each by bounding box and align to the ground plane.

### 5. Preset manager (replaces "Користувацька" spam)
- Applying to the simulation no longer auto-saves. Saving is explicit: a "Save preset" dialog with name, optional note, rotor family, auto thumbnail from the viewport, and tags.
- A preset library panel (Blade Lab + Profile): list with thumbnail, rotor type, key geometry, created/updated dates, rename, duplicate, delete, and one-click apply or send to simulation.
- Deduplicate on save (same geometry hash updates the existing entry instead of creating a new one) and clean up existing duplicate auto-saves on first load.

### 6. Transition to the wind simulation
- The teleport hand-off carries scenario, wind speed, TSR and site so the simulation opens already matching the lab state, with the phase animation timed to the actual route load instead of a fixed 1.5s timer.

## Technical notes

Files touched: `src/blade-lab/cinema/{types,CinemaCamera,CinemaPanel,ScenarioStage,VfxLayer,useDirector}.tsx|ts`, `src/blade-lab/cinema/scenarios/s01–s06`, `src/components/blade-lab/{BladeViewer3D,BladeMesh}.tsx`, `src/pages/BladeLab.tsx`, `src/pages/Profile.tsx`, `src/hooks/useCloudSync.ts`, `src/store/useTeleportStore.ts`, new `src/blade-lab/cinema/useComposition.ts` and `src/components/blade-lab/PresetManager.tsx`, plus asset pointers under `src/assets/models/`.

Backend: preset table gains name/notes/thumbnail/geometry-hash usage; camera compositions stored in the existing user settings row. No schema redesign beyond that.

Verification: browser pass through all six scenarios at desktop, narrow-sidebar and short-viewport sizes, checking no camera clipping, no HUD overlap, and preset save/rename/delete round-trip.
