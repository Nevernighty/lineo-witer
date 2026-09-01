# Next phase: Turbine Explorer v2 — guided assembly, comparison, polish

The real-turbine library now shows 7 machines with 87 parts, an explode slider, role filters and a part inspector. The next phase turns that static explorer into a guided, animated engineering tool and cleans up the remaining rough edges.

## 1. Guided assembly sequence (the headline feature)

Each turbine gets an ordered build sequence grouped by sub-assembly (base → shaft/bearings → hub → blades → nacelle/generator → tail/cowling).

- A playable timeline: play / pause / step forward / step back / scrub.
- Parts fly from their exploded position into place with staggered, eased motion; the active sub-assembly is rim-lit, already-placed parts dim slightly, future parts stay ghosted.
- The camera softly re-frames onto the active sub-assembly (no hard cuts, clamped so it never dives through the floor or the model).
- Each step shows a short caption: what the part does, how it mounts, and the relevant build note from the source documentation (UA/EN).
- The explode slider stays available and is driven by the timeline while playing, released back to manual on pause.

## 2. Part-level engineering data

Extend the inspector with practical data per part: quantity needed, mirrored/handed pairs, suggested print orientation, supports yes/no, and the sub-assembly it belongs to. Add a per-turbine bill of materials view (printed parts count, estimated print volume, non-printed hardware list) with copy-to-clipboard.

## 3. Search, filter and compare

- Type-ahead search over part names across the current turbine, with 3D highlight on match.
- Compare mode: pick two turbines side by side and see rated power, swept area, Cp, TSR, cut-in, part count and wind-power curve in one table, plus a small power-vs-wind chart driven by the existing physics helpers.

## 4. Interaction and design polish

- Hover/click micro-interactions on the library list and legend chips (elevation, accent underline, spring scale) consistent with the existing dark glass style.
- Keyboard support: arrows to move through parts, space to play/pause the assembly, Esc to deselect, X for x-ray.
- Responsive: on narrow screens the library becomes a horizontal chip row and the inspector a bottom sheet, so the 3D stage keeps most of the viewport.
- Shareable state: turbine, selected part and assembly step encoded in the URL so a link reopens the exact view.
- Loading: skeleton and per-part progress while GLBs stream, plus a graceful fallback if a part fails to load.

## 5. Cleanup

- Replace the ad-hoc `RAWCOUNT` helper in the explorer with a memoised part-count map.
- Memoise per-turbine layout/part lookups so switching turbines does not recompute on every render.

## Technical notes

- New `src/data/turbineParts/assembly.ts`: ordered step definitions per turbine referencing existing part ids and roles; derived from `partMeta` roles so no new asset work is needed.
- New `src/components/turbine-explorer/AssemblyTimeline.tsx` (UI) and an `useAssembly` hook holding step index, progress and playback clock.
- `PartMesh.tsx` gains a per-part `placement` prop (0..1) blending between exploded and assembled transforms; animation runs in `useFrame` with damped interpolation — no React state per frame.
- Camera framing reuses the existing clamped-framing approach from the cinema camera, applied to the active step's bounding box.
- Compare view and BOM are pure derivations of `REAL_TURBINES` + `turbineParts`; no backend or schema changes.
- URL state via existing router search params; no new dependencies.

## Out of scope

No changes to Blade Lab aero physics, the wind simulation, or cloud sync in this phase.
