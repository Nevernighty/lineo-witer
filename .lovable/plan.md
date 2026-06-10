
# Blade Lab — Expert Overhaul

The lab has the right ideas but ships wrong physics and wrong geometry for every non-HAWT family. This plan fixes the architecture once, then rebuilds each rotor family from the reference document, then adds the requested tooling (recording, A/B, diagnostics page, calibration UI, expanded VFX).

## 1. Fix the rotation/axis bug (root cause)

Symptom: "part static, part in mid-air, axes torn". Cause: `BladeMesh` rotates the entire `spinRef` on Y for VAWT / Z for HAWT, but several sub-meshes (struts, end caps, Archimedes shell) live **outside** the spin group, while the blade clones live inside. Strut clones are also rotated independently around Y with no parent spin.

Fix:
- One canonical scene graph for every rotor:
  ```
  <root>
    <staticGroup>      // mast, base, nacelle housing, tower
    <yawGroup>         // HAWT yaw only
      <spinGroup>      // ALL rotating geometry: hub, spinner cone, struts, end discs, blades, shroud caps
        <flexGroup>    // global flex on non-spin axes only
          per-blade <bladeGroup>  // detach/recover, flutter
  ```
- Strut/end-disc/spinner-cone meshes move **inside** `spinGroup`. Nothing rotating is left in world space.
- Spin axis is a single source of truth per family (`hawt → +Z`, all VAWT → +Y`). Detach pieces are re-parented to a `debrisGroup` (sibling of spinGroup) on fracture so they don't inherit further spin, and re-parented back to spinGroup on recovery after slerp-to-identity (kills the "wrong axis after crash" bug).
- The same architecture is mirrored in `BladePresetTurbine3D` (main simulation).

## 2. Scientifically correct geometry per family

Rewrite `src/aero/buildBladeGeometry.ts` builders using the reference doc. Each builder returns a `BuiltBlade` plus a `BuiltSupports` (hub disc(s), struts, end caps) so the mesh layer doesn't have to guess.

**HAWT (`buildHAWTBlade`)** — keep current NACA-4 + twist law, expose `chordRoot/chordTip` and Schmitz/Optimal/Linear twist (already OK). Add 3D-printed-rotor preset matching the uploaded HAWT-NEMA17 reference (3 blades, untwisted thin plate option).

**Φ-Darrieus / troposkein (`buildTroposkeinBlade`)** — replace the current `sin(πt)` placeholder with the actual troposkein. Use the standard parametric solution via Jacobi `sn` (small-amplitude expansion is enough for visuals): `r(s) = R · sn(K·(1−2s), m)` with `m≈0.5` and the height/radius ratio matched to `heightOverDiameter`. Result is the egg-beater curve, not the half-sine arc. Add top/bottom hub discs **inside spinGroup**.

**H-Darrieus / Giromill (`buildHDarrieusBlade`)** — straight constant-chord NACA-0018/0022 blade at radius R, with horizontal support struts at 25% and 75% span (inside spinGroup), proper toe-in pitch.

**Gorlov / QuietRevolution (`buildGorlovBlade`)** — true helical wrap: each blade sweeps 60–120° (slider) around the axis over the full height, blade chord rotates with the helix angle. Add an outer/inner hub ring. Reference image: yellow "Victory Drones" stacked helices.

**Savonius (`buildSavoniusBucket`)** — rebuild as a proper S-rotor:
  - Two/three half-cylinder buckets, each offset from the central axis by `overlap·R` (overlap ratio slider 0.0–0.30, default 0.15 per Table in §7.2).
  - Real shell thickness, capped top + bottom end plates (disc geometry).
  - Optional helical Savonius (Savonius-Gorlov hybrid in the uploaded "Savonius Gorlov" reference): twist parameter twists each bucket along Y.
  - Hybrid mode: combine with an outer Darrieus pair (matches "Savonius Darrieus" reference image).

**Archimedes (`buildArchimedesSpiral`)** — replace the cone "shell" with a proper Liam-F1-style triple-helix:
  - Use the parametric `X = a·t·sin(πt), Y = a·t·cos(πt), Z = b·t` from §3.1.
  - Build 3 ribbons at 120° (slider also accepts 2), each as a tapered swept quad strip from inner shaft radius to outer R, opening angle γ controlling the cone half-angle (slider).
  - Add a front hub ring and rear tail cone (passive yaw vane) — both inside spinGroup so the entire rotor turns coherently.
  - Mass estimate fix: current code reports 4 152 189 kg because volume is computed from `R²·H` solid instead of the thin ribbon. Use ribbon area × shell thickness.

## 3. Family-aware GeometryPanel

`GeometryPanel` becomes a switch on `rotorType` so users only see meaningful sliders:
- HAWT: R, chordRoot, chordTip, twistRoot, twistTip, twistLaw, pitch, nBlades(2–5).
- H-Darrieus: R, H/D, chord, pitch (toe-in), nBlades(2–4).
- Gorlov: R, H/D, chord, helical wrap °, nBlades(2–4).
- Tropo Φ: R, H/D, chord, nBlades(2–3).
- Savonius: R, H/D, bucket chord, **overlap ratio**, helical twist °, nBuckets(2 or 3).
- Archimedes: R, H/D, ribbon width, **opening angle γ**, turns, nBlades(2 or 3).

Validation badges from `calibration.validateGeometry` shown inline.

## 4. Recording (play/pause/scrub) + A/B compare

New `useSimRecorder` store: ring buffer (≤30 s @ 60 Hz) of `{t, omega, failure, perBlade[]}` snapshots. UI: bottom control strip with ▶ ⏸ ⏮ slider + frame count. When scrubbing, `BladeMesh` is set to "playback mode": it disables `useFrame` integration and reads state from the snapshot at the chosen `t`.

A/B mode: split-screen using existing `ResizablePanelGroup`. Each side has its own `BladeViewer3D` bound to slot A or slot B of a new `useABStore` (`presetA`, `presetB`, `paramsA`, `paramsB`). "Copy A→B" / "Swap" / "Diff" buttons. Synced camera optional.

## 5. Diagnostics page `/blade-lab/diagnostics`

Standalone route reusing `useDiagnosticsStore`. Recharts line chart (30 s window) with toggles for RPM, ω, TSR, torque (`τ = ½ρARV²·Cp/ω`), per-blade failure, tip Mach. Top toolbar: Wireframe ✓ (drives viewer `viewMode='wireframe'`), Freeze spin, Step 1 frame, Log to console, Export CSV. Useful for diagnosing wiggle/stutter.

## 6. Calibration UI

Surface the existing `calibrationFor(type)` profile in a "Калібрування" sheet (already in menu):
- Sliders: strength (=fracture threshold pct), bendStart (=bend threshold pct), reactionSpeed, recoverySpeed, flexGain, vibrationDamping.
- Presets dropdown: HAWT / Darrieus / Savonius / Archimedes (load defaults from `calibration.ts`).
- "Validate geometry" runs `validateGeometry` and shows warnings.
- Wired into `BladeMesh` props (already accepts reactionSpeed/recoverySpeed; add flexGain & vibrationDamping pass-through).

## 7. Expanded VFX + air-around-blades

`BladeViewer3D` already takes a `VfxConfig`. Extend it:
- Vortex: intensity, turns, radius, decay, **colorMode** (speed/age/none).
- Wake: density, swirl, **expansion**, **lifetime**.
- Streamlines: count, length, jitter, speed×, **bindToVInf** toggle, **turbulence** (driven from site scenario TI when bound).
- New "Air around blades" mode: spawn short-lived ribbon traces emitted from blade leading edges (HAWT: helical tip vortices; VAWT: cylindrical sheet around the swept envelope), velocity = `V∞·(1 − a·(1−r̂)) + ω×r`. All ribbon counts auto-scale on mobile via `useIsMobile()`.

## 8. Files

**New:** `src/store/useSimRecorder.ts`, `src/store/useABStore.ts`, `src/components/blade-lab/RecorderBar.tsx`, `src/components/blade-lab/ABCompare.tsx`, `src/components/blade-lab/CalibrationPanel.tsx`, `src/pages/BladeLabDiagnostics.tsx`, `src/aero/troposkein.ts` (Jacobi sn helper).
**Rewrite:** `src/aero/buildBladeGeometry.ts` (all 4 VAWT builders + supports), `src/components/blade-lab/BladeMesh.tsx` (new scene graph, debris re-parenting), `src/components/blade-lab/GeometryPanel.tsx` (family-aware).
**Edit:** `src/pages/BladeLab.tsx` (route, recorder bar, A/B toggle, calibration sheet, VFX sliders), `src/components/blade-lab/BladeViewer3D.tsx` (extended VfxConfig + air-around-blades layer), `src/components/wind-simulation/3D/BladePresetTurbine3D.tsx` (mirror scene graph fix), `src/App.tsx` (new diagnostics route).

## Out of scope (deferrable)
- CAWT/Magnus/Vortex-Bladeless/AWES rotors (the reference doc covers them but you have not asked for them as selectable families — say the word and they get added as separate presets in a follow-up).
- Full BEM/DMS solver upgrade (current colouring uses the existing simplified solver; only geometry & visuals change here).

Confirm and I'll execute it end-to-end.
