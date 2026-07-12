
# Blade Lab overhaul — Part A (bug fixes) + Part B (grand plan)

Two-part plan. Part A is a targeted round of geometry fixes so the visuals stop lying. Part B is a spec-driven roadmap (inspired by github/spec-kit's `constitution → specify → plan → tasks → implement` loop) for turning Blade Lab into a real cinematic-guided teaching tool.

---

## PART A — Immediate geometry & spin fixes

Only these files change in Part A. No feature deletions.

### A1. Gorlov / helical VAWT — real helical wrap (`src/aero/buildBladeGeometry.ts`)

**Bug (screenshot 1):** blades render as vertical straight strips because `buildVAWTBladeGeometry` places every section at `(+R, y, 0)` and only rotates the *chord* by `helAng`. The airfoil never travels around the shaft, so a "helical" blade looks identical to an H-Darrieus one plus a small twist.

**Fix:** for `vawt-helical` (and hybrid Savonius-Gorlov), position each ring at the helix point:
```
θ(t) = θ0 + helicalRad · (t − 0.5)
X = R·cos(θ(t)),  Z = R·sin(θ(t)),  Y = y
```
Then align the chord tangentially: chord axis = `(−sin θ, 0, cos θ)`, thickness axis = radial inward = `(−cos θ, 0, −sin θ)`. Assemble the section in this local basis. Result: the blade traces a real cylindrical helix (Gorlov / QuietRevolution QR5 silhouette).

Add small preset field `helicalMode: 'straight' | 'wrapped'` so the H-Darrieus preset stays straight and Gorlov/QR5 use the new wrapped path.

### A2. Archimedes / Liam F1 nautilus shell

**Bug (screenshot 4):** current builder makes a thin flat helical ribbon of constant radius, which renders as stacked plates + a straight fin instead of the recognisable Liam-F1 conical nautilus.

**Fix — rewrite `buildArchimedesBladeGeometry`:**
- Outer edge follows a **conical spiral**: `r_out(t) = R · (1 − 0.55·t)` (tapers ~55% top-to-bottom), inner edge on shaft `r_in(t) = R · 0.10`.
- Full wrap = `1.25` turns by default (Liam F1 is ≈ 1 turn per blade, 3 blades × 120°).
- Extrude the ribbon into a proper 3D shell with:
  - top face + bottom face + outer rim + inner rim + leading edge cap + trailing edge cap
  - smooth chord thickness `t(s) = 0.06 · R · (1 − 0.3·s)` so the shell is thicker at the base
- Wind the vertex order so `computeVertexNormals` gives a matte curved surface, not the current z-fighting shards.

Add preset field `archimedesTurns`, `archimedesInnerRatio`, `archimedesTaper` so the panel can tune it.

### A3. Darrieus troposkein — enable multi-blade + fix cap flip

**Bug (screenshot 2):** the troposkein blade renders correctly but only *one* blade is visible because `buildVAWTBladeGeometry` places the section at `(+rLocal, y, 0)` and then relies on `<group rotation={[0,a,0]}>` for cloning — which works, but the current `flip` argument on the two end caps is inverted for `vawt-tropo`, producing a black inner face that hides half the blade behind fog. Also the section chord is currently ~40% too thin at the equator.

**Fix:**
- Recompute cap winding based on `sign(rLocal)` so both caps face outward.
- Restore chord scaling: `chordHere = chord · max(0.55, sin(πt)^0.35)` (was 0.45 → made the equator look starved).
- Add tip endcap fillets (small `torusGeometry`) at the shaft junction so blades read as attached, not floating.

### A4. Savonius top plate offset (screenshot 3)

**Bug:** the copper-tinted disc floats above the buckets because the top end-plate uses `+vawtHeight/2` while the bucket ring goes only to `+height/2 − shellT`. When `heightOverDiameter` ≠ 2 they diverge.

**Fix:** derive `vawtHeight` from the same `heightOverDiameter` that `buildSavoniusBucketGeometry` uses (pass it explicitly rather than the two computing it independently). Recolour end-plates via `meshStandardMaterial color` to match the shell (`#2a3038`) so the copper artefact goes away — that was an old debug tint.

### A5. Rotor spin axis correctness after preset switch

The wobble that appears when switching to Gorlov is a stale `spinRef.rotation.z` from a previous HAWT session. Add:
```ts
useEffect(() => {
  if (spinRef.current) spinRef.current.rotation.set(0,0,0);
  for (const s of state.current) { s.detachT=0; s.pos.set(0,0,0); s.quatV.set(0,0,0); }
}, [rotorType]);
```
Guarantees a clean axis reset on preset change (no more mid-flight axis flip).

### A6. Preset table additions

Add these preset fields already implied by the code above:
- `harmony-h9` (Harmony Turbines, HAWT low-cut-in) — already present, tighten twist law.
- `liam-f1` → set `rotorType: 'vawt-archimedes'`, `archimedesTurns: 1.0`, `heightOverDiameter: 1.6`, 3 blades.
- `gorlov-qr5` → `rotorType: 'vawt-helical'`, `helicalTwistDeg: 60`, `heightOverDiameter: 3.0`, 3 blades, `helicalMode: 'wrapped'`.
- `darrieus-phi-3m` (troposkein) → `heightOverDiameter: 1.1`, `nBlades: 2`.

### A7. QA check

After Part A: click through Liam-F1, Gorlov QR5, Φ-Darrieus, Savonius, H-Darrieus and confirm (i) the mesh silhouette matches published photos, (ii) `Перевантаження` reads 0 % at rest, (iii) blades spin around the correct axis on preset switch and after a crash-and-recover cycle.

**Files touched in Part A:**
- `src/aero/buildBladeGeometry.ts` (rewrite VAWT sections + Archimedes)
- `src/aero/presets.ts` (fields + new presets)
- `src/components/blade-lab/BladeMesh.tsx` (axis reset effect, fillets, end-plate parity)
- `src/store/useBladePresetStore.ts` (add optional `archimedesTurns`, `helicalMode` passthrough)

---

## PART B — Spec-driven grand plan for cinematic Blade Lab

Modeled on spec-kit's phased flow. Every phase produces an artifact that future turns consume — nothing is thrown away.

### B0. Constitution (project-wide rules, one page)

Create `src/blade-lab/constitution.md` fixing invariants we must never break:
- Scientific fidelity first: every visual delta must map to a physical quantity.
- One canonical rotor scene graph: `world → spinRef → flexRef → bladeRef[i]`. All future effects hook into it.
- Every VAWT builder positions vertices in world basis (spin axis = +Y, wind = +X). No section-only rotation tricks.
- Every teaching overlay is a **narrated scenario**, not a passive tooltip.
- Mobile-parity: no scenario may cost > 4 ms/frame on iPhone 12.

### B1. Specify — scenario catalogue (`src/blade-lab/scenarios/*.spec.md`)

Each scenario is a Markdown spec with fixed sections: *what/why*, *trigger*, *physics*, *what the user sees*, *tooltip script*, *success signal*. Initial 12 specs:

| id | Scenario | Real problem taught |
|----|----------|--------------------|
| s01 | Rooftop turbulence | boundary-layer + eddy shedding from parapet |
| s02 | Rural ridge | speed-up factor over hills, yaw hunting |
| s03 | Coastal gust front | dynamic stall on leading edge |
| s04 | Urban canyon | vortex street between buildings |
| s05 | Arctic icing | mass imbalance → 1P vibration |
| s06 | Desert dust | leading-edge erosion, Cd creep |
| s07 | Storm shutdown | pitch-to-feather sequence |
| s08 | Grid loss / freewheel | overspeed → tip-loss cascade |
| s09 | Wake of upstream turbine | Cp collapse, TSR drop |
| s10 | Bird-strike overload | asymmetric blade root moment |
| s11 | Yaw misalignment | cos³ power law demo |
| s12 | Resonance sweep | Campbell diagram, 3P crossings |

Each spec's *tooltip script* is a JSON array of `{ atTime, target: 'blade0'|'hub'|'wake', message, cameraPose }` so the animation loop can drive both a camera and a subtitle track.

### B2. Plan — cinematic engine

`src/blade-lab/cinema/`:
- `Director.ts` — plays a scenario: advances virtual time, moves camera along a Catmull-Rom spline, triggers physics events at scripted marks.
- `VfxBus.ts` — declarative FX (`spawnVortex`, `flashOverload`, `showArrows({ from, to, label })`, `pulseBlade(index)`).
- `Narrator.tsx` — bottom-of-screen chip that types the tooltip line, with a "why" popover linking to the spec section.
- `RecordingBar.tsx` — play / pause / scrub / A-B compare (already partly stubbed in earlier turns; finish it here).
- Cinematic camera uses existing `PostFX` + a new depth-of-field pass so the highlighted blade stays sharp while the rest blurs.

### B3. Tasks — implementation slices

Ship in this order (one PR-sized slice each):
1. **Director + Narrator + s01 rooftop** end-to-end, no other scenarios. Proves the pipeline.
2. Add VfxBus effects (arrows, vortex burst, pulse). Hook into s02, s03.
3. Camera splines + DoF. Retro-fit s01–s03.
4. Scenarios s04–s07 (all normal-operation cases).
5. Scenarios s08–s10 (failure cases) — reuse existing `failureLevel` and `explosion` state.
6. Campbell diagram overlay for s12; icing mass overlay for s05.
7. A/B comparison scrubber (record two runs, split-screen viewer).
8. Export scenario as MP4 via `MediaRecorder` on the canvas + subtitle track.

### B4. Converge — quality gates before each slice ships

Borrowed from spec-kit's `analyze`:
- Every scenario must be reproducible from its JSON spec alone (no hidden state).
- Every camera pose must be reachable on 375-px-wide screens (mobile parity).
- Every tooltip must cite a physics reference (URL or textbook page) inside the spec.
- Frame time budget stays under 16 ms with 3 particles-per-blade-tip vortices.

### B5. UX polish rolled through all slices

- Unified typography scale already in `index.css`; audit `text-*` classes so no scenario introduces a new size.
- Cinema HUD lives in a single `<CinemaHud>` overlay, not scattered chips.
- All scenario controls collapsible into the DaVinci-style top menu we already have; nothing floats free.

---

## Deliverable this turn (once approved)

Part A (bug fixes) — implement immediately. Part B is documented as the grand plan and its first slice (`Director + Narrator + scenario s01`) is scheduled for the *next* approved turn so this response stays reviewable.
