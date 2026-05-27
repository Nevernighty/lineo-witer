## Grand Continuation: Blade Geometry Lab + Camera Fix + VFX Polish + Macro Regime

This plan completes outstanding items from prior overhauls and adds the major new feature you requested: a dedicated **Blade Geometry / Aerodynamics Lab** ("Форма / Geometry") accessible from the Main Menu, plus camera/selection fixes and a deep VFX uplift across the 3D simulation.

---

### Part 1 — Camera lock during object drag (bug fix)

**Problem:** In Select mode (`вибрати`), left-click + drag to move a placed building also rotates the OrbitControls camera.

**Fix in `WindSimulation3D.tsx` + `InteractionManager`:**
- When pointer-down hits a selected/movable obstacle, set `controls.enabled = false` and capture the pointer.
- Re-enable on pointer-up / pointer-cancel / `Escape`.
- Add a small `dragGuard` ref so OrbitControls never gets the same event (stopPropagation on the mesh pointer handlers).
- Apply the same lock when scaling (Q/E) or rotating (arrow keys) is initiated by mouse drag handles.
- Cursor changes: `grab` on hover of selected, `grabbing` while dragging.

---

### Part 2 — New Main Menu entry: "Форма / Geometry"

**Placement:** In `MainMenu.tsx`, add a new tile **above** the 3D Simulation primary button, styled as a **half-transparent** premium card with a multi-label header showing 10+ scientific synonyms cycling/listed in small caps:

> ФОРМА · GEOMETRY · AEROFOIL · PROFILE · PLANFORM · CAMBER · CHORD · TWIST · SOLIDITY · MORPHOLOGY · TOPOLOGY · BLADE LAB

- Glassmorphism: `bg-card/30 backdrop-blur-md border-primary/20`
- Animated subtle shimmer; icon: stylized airfoil SVG
- Route: `/blade-lab` (new page)
- Fully i18n (UA/EN) and responsive (full-width on mobile, taller on desktop)

---

### Part 3 — New page: `/blade-lab` (Blade Geometry & Aerodynamics Lab)

A new React page (lazy-loaded) inspired by **AirShaper**-style aero tools, scientifically grounded.

**3.1 Layout (responsive, dark glass UI)**
```text
┌──────────────────────────────────────────────────────────────┐
│ Header: Back · Title · Lang · Preset selector · Macro toggle │
├────────────────┬──────────────────────────┬──────────────────┤
│ Geometry Panel │  3D Blade Viewer (R3F)   │  Aero Analysis   │
│ (left, scroll) │  (center, full height)   │  (right, scroll) │
└────────────────┴──────────────────────────┴──────────────────┘
```
Mobile: stacked tabs (Geometry · Viewer · Analysis · Macro).

**3.2 Geometry Panel — parameters (real aero data ranges)**
- **Airfoil family selector** (12+ profiles, scientifically real):
  NACA 0012, NACA 2412, NACA 4415, NACA 63-415, NACA 64-618, S809 (NREL), S814, DU 91-W2-250, DU 96-W-180, FFA-W3-241, Risø-B1-18, Wortmann FX 77-W-153, Gurney-flap variant, flat-plate (reference).
- **Planform**: chord root/tip (m), span (m), aspect ratio (auto), taper ratio, sweep angle (deg).
- **Twist distribution**: root twist, tip twist, twist law (linear / optimal-Betz / Schmitz).
- **Thickness**: t/c ratio per station, max-thickness location.
- **Pitch**: collective pitch (deg), pitch control mode (fixed / active stall / pitch-to-feather).
- **Number of blades**: 1–5 (with solidity recompute).
- **Tip device**: none / winglet / Gurney flap / serrated trailing edge (noise).
- **Surface**: roughness (mm), leading-edge erosion (%).
- **Material**: GFRP / CFRP / hybrid / wood-epoxy → drives mass + stiffness.

All sliders show units, scientific labels, and tooltips with the equation they affect.

**3.3 3D Blade Viewer (center)**
- React Three Fiber scene rebuilding the blade mesh live from parameters using parametric lofting between airfoil stations.
- View modes (toggle row):
  - **Solid** (PBR, anisotropic)
  - **Wireframe** (cyan grid)
  - **Pressure (Cp)** color map (red→blue)
  - **Streamlines** (animated tubes flowing over the surface)
  - **Vortex/Tip-loss** (helical particle ribbons off tip)
  - **Stall regions** (orange highlight where local α > α_stall)
  - **Stress / strain** (von-Mises-ish heatmap from bending load)
- VFX:
  - Postprocessing **Bloom + SSAO + Vignette + ChromaticAberration** (lightweight `@react-three/postprocessing`).
  - Selection halo: animated dual-ring + scanline shader.
  - Hover highlight: emissive pulse with fresnel rim.
  - Particles use additive blending; tip vortex spirals with HSL shift.
- Camera: OrbitControls with damping; "Cinematic" auto-orbit toggle; preset views (Root, Tip, Suction, Pressure, Iso).

**3.4 Aero Analysis Panel (right)**
Live computed from geometry + freestream V∞ (slider) + air density:
- **Polar curves**: Cl(α), Cd(α), Cl/Cd(α) using thin-airfoil + empirical correction per family (lookup tables for the listed NACA/S/DU/Risø profiles, interpolated).
- **Power curve** P(V) using BEM-lite (blade-element momentum, simplified per-element with Prandtl tip-loss).
- **Cp–λ curve** (power coefficient vs tip-speed ratio) with Betz limit line (0.593).
- **Thrust coefficient Ct(λ)**.
- **Reynolds & Mach** at tip; **AoA distribution** along span.
- **Noise estimate** (Brooks-Pope simplified TE noise, dB).
- **Mass + first-mode frequency** (cantilever beam estimate).
- Each chart has a small "?" with the formula.

**3.5 Macro Regime (scenario mode)**
A toggle/tab "Макро · Macro" that drops the current blade design into a real-world scenario:
- **Scenarios** (preset, science-based, drawn from `scenarios.ts` style):
  - Urban rooftop (10–30 m, high turbulence, gusty)
  - Suburban (50 m, moderate roughness)
  - Open plain / steppe (80 m, low TI)
  - Coastal / sea-breeze (90 m, cyclic)
  - Offshore (120 m, high V, low TI, salt erosion)
  - Mountain ridge (orographic speed-up)
  - Valley katabatic (downslope, cold)
  - Forest edge (high shear)
  - Arctic (cold-dense air, icing)
  - Desert (high temp, dust erosion)
- For each: shows AEP (annual energy production) using Weibull (k, c) parameters, capacity factor, expected fatigue cycles, recommended pitch schedule, and a verdict ("Good fit / Suboptimal / Not recommended") with reasoning.
- Mini 3D preview of the turbine at correct hub height with environment (urban skyline / sea / mountains) using simple instanced meshes + skybox.

**3.6 Presets**
Quick-load real turbine blades: NREL 5-MW reference, IEA 15-MW, Vestas V90-class, Enercon E-126-class, small urban VAWT (Savonius/Darrieus). Loading a preset fills all sliders.

---

### Part 4 — Advanced highlight / selection graphics (main simulation)

In existing `WindSimulation3D` Select mode:
- Replace flat outline with **animated dual-ring halo + corner brackets** (shader or sprite).
- Add **floating info card** above selected object: type, dimensions, drag coefficient, local wind speed at object height, computed force.
- Hover: subtle fresnel rim + ground projection shadow ring.
- Multi-select support (Shift-click) with grouped bbox.

---

### Part 5 — VFX uplift in main 3D scene

- Add `@react-three/postprocessing` pipeline: **Bloom (selective on particles + emissive), SSAO, Vignette, subtle ChromaticAberration**, guarded behind quality preset (HIGH only by default; toggle in settings).
- Particle trails: switch additive blend + HSL-shifted gradient per wind type (ties into the wind-type system from previous overhaul — Mistral = white arrows, Foehn = warm orange, Sea Breeze = cyan waves, Katabatic = pale blue, Trade = green, Mountain wave = violet).
- Generator absorption VFX: add a brief radial shockwave ring + spark burst.
- Obstacle collisions: red pulse already exists — add a small debris-spark sprite burst.

---

### Part 6 — i18n + responsiveness pass

- Add UA/EN keys for: every blade-lab label, airfoil families, view modes, macro scenarios, analysis chart titles, formula tooltips, "Geometry" menu tile synonyms.
- Verify all new panels collapse cleanly on ≤640px (tabs, sticky headers, scroll areas).
- LoadingScreen shown while `/blade-lab` lazy chunk loads.

---

### Technical details

**New files**
- `src/pages/BladeLab.tsx` — page shell, tabs/layout, lazy-loaded route in `App.tsx`.
- `src/components/blade-lab/GeometryPanel.tsx`
- `src/components/blade-lab/BladeViewer3D.tsx` (R3F canvas + postprocessing)
- `src/components/blade-lab/BladeMesh.tsx` (parametric loft from airfoil stations)
- `src/components/blade-lab/ViewModes.tsx` (Cp/streamlines/stall/stress shaders)
- `src/components/blade-lab/AeroAnalysis.tsx` (charts via Recharts)
- `src/components/blade-lab/MacroRegime.tsx` (scenario picker + mini-scene + AEP)
- `src/components/blade-lab/PresetSelect.tsx`
- `src/aero/airfoils.ts` — airfoil coordinate tables + Cl/Cd polars (NACA/S/DU/Risø)
- `src/aero/bem.ts` — simplified BEM solver with Prandtl tip loss
- `src/aero/weibull.ts` — AEP / capacity factor
- `src/aero/noise.ts` — Brooks-Pope TE noise (simplified)

**Modified files**
- `src/App.tsx` — add `/blade-lab` lazy route
- `src/components/MainMenu.tsx` — new "Форма / Geometry" tile above primary
- `src/components/wind-simulation/3D/WindSimulation3D.tsx` — camera lock on drag, advanced selection halo, postprocessing wiring
- `src/components/wind-simulation/InteractionManager.ts` — `controls.enabled` toggling, pointer capture
- `src/components/wind-simulation/3D/AdvancedParticleSystem.tsx` — wind-type colored trails + additive blending
- `src/utils/i18n.ts` — all new keys (UA/EN)

**Dependencies**
- `@react-three/postprocessing@^2.16.x` (compatible with @react-three/fiber 8 / three 0.155-ish already in project)
- No version bumps to fiber/drei/three.

**Performance guards**
- Postprocessing only on HIGH quality.
- Blade Lab uses its own isolated Canvas (won't affect main sim FPS).
- Heavy aero recompute is debounced (150 ms) and memoized per parameter hash.

---

### What I will NOT change
- Existing scenarios/store/physics core stay as-is (read-only consumers).
- No backend / Lovable Cloud needed for this feature set.

Ready to switch to build mode and implement on approval.