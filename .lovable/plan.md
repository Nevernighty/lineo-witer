## Blade Lab v2 — Scientific Rework, Polish & STL Export

The current viewer renders an absurd blob because of a real geometry bug, the slider ranges clamp the big presets, and the UI is under-detailed. This pass fixes the math, redesigns the studio UI, expands presets (including DIY/3D-printable rotors), adds advanced view modes + post-FX, and ships STL export for every blade.

### Part 1 — Fix the 3D blade math (root cause of the "blob")

In `BladeMesh.tsx`, span runs along **+Z** (`positions.push(x, y, sd.r)`), but blades are cloned with `rotation={[0, 0, rot]}` — a rotation **around Z** just spins the airfoil in its own cross-section, so all N blades stack on top of each other along +Z. That's exactly what the screenshot shows.

Fixes:
- Build the blade along **+Y** (span on Y, airfoil chord/thickness in X/Z), then clone with `rotation={[0, 0, k·2π/N]}` so blades fan out radially around the spin axis (Z = wind).
- Hub becomes a short cylinder on Z (nacelle stub), sized to `rootRadius`, not `rootRadius*0.9` sphere (which currently dominates small rotors).
- Add a real **nacelle + tower stub** (cylinder + cone) so the rotor reads as a turbine, not a flower.
- Camera framing: auto-fit on geometry change (`fitToObject(tipRadius)`), reset button.
- Grid offset = `-tipRadius*0.05` (was `*1.2`, pushing it off-screen for large rotors).

### Part 2 — Geometry panel: ranges, units, DIY support

- Extend slider ranges so all presets stay in bounds: span 0.3–130 m, chord root 0.05–8 m, chord tip 0.02–4 m, pitch −15 to +45°, blade count 1–7 (allow 1-bladed counterweighted designs).
- Add fields: **solidity σ** (read-out, computed), **aspect ratio AR**, **swept area A**, **rotor mass estimate** (using blade volume × material density).
- Add **Material** select (GFRP, CFRP, PLA-3D, PETG-3D, PA-CF, wood-laminate) → drives density, max tip speed, Young's modulus chip used in stress proxy.
- Add **planform shape**: rectangular / tapered-linear / tapered-optimal / Schmitz / inverse-taper (DIY VAWT-style straight blade).
- "Custom DIY" toggle: caps span at 3 m, hides industrial-only fields, surfaces print-bed warnings.

### Part 3 — Preset library (rework + DIY)

Replace the 4 broken presets with a 16-preset library, organized:
- **Utility HAWT**: NREL 5-MW (R=63), IEA 15-MW (R=120), Vestas V90 (R=45), Enercon E-126 (R=63), Siemens SWT-3.6-107, GE 1.5-MW.
- **Small commercial**: Bergey Excel 10, Aeolos H-10kW, SD6 (Wood/Sunderland).
- **Residential / DIY**: PicoTurbine 1.2 m, Hugh Piggott 2.4 m (classic DIY plans), Open-Source 1.6 m PLA.
- **VAWT/experimental**: Darrieus-H 3 m (rendered with straight blades, σ shown), Gorlov helical (visual approximation).
- **Reference**: Betz-ideal & Schmitz-ideal (analytic shapes).

Each preset writes **all** geometry fields **plus** airfoil + twist law. Bounds-check in `applyPreset()` to clamp into slider ranges. Add a **Reset to default** action.

### Part 4 — Viewer modes & VFX

Expand `VIEW_MODES` from 5 to 8:
- Solid · Wireframe · Pressure Cp · Stall zones · Stress · **Chord/twist heatmap** · **Reynolds number** · **X-ray (translucent + inner spar)**.

VFX additions (HIGH quality only, toggleable):
- HDRI `Environment preset="city"` (drei) with low intensity for PBR reflections.
- `EffectComposer` from `@react-three/postprocessing@^2.16.x`: Bloom (subtle), SSAO, Vignette, ChromaticAberration.
- Wind-direction arrow band ahead of rotor; ground shadow disc.
- Selection halo around the rotor + corner-bracket frame in cinematic mode.
- Replace flat tip vortex tube with **animated helical Cp-colored ribbons** per blade (already partly there, but recolored by current view mode).

### Part 5 — STL export

New util `src/aero/stlExport.ts`:
- Reuses `BladeMesh` buffer geometry generator (extracted into a pure `buildBladeGeometry(g)` function so export and render share code).
- Uses `three/examples/jsm/exporters/STLExporter` to emit ASCII STL.
- Header button **⤓ STL** with options: **single blade**, **full rotor (N blades + hub)**, **scale to mm** (×1000 for 3D printing).
- Browser download via Blob.

### Part 6 — Analysis panel additions

- Add **Reynolds at 70%R**, **Mach tip**, **solidity σ**, **rotor mass (kg)**, **first flap frequency (Hz)** rough estimate.
- AoA distribution sparkline along span.
- Color-coded warnings: tip Mach > 0.3, AoA > stall on > 30% of span, σ < 0.03, etc.
- Replace recharts default tooltip styling with token-themed (`hsl(var(--card))`).

### Part 7 — UI/UX polish (no ugly scrollbars)

- Global custom scrollbar utility in `index.css` (`.scrollbar-thin`, dark track, primary thumb) applied to all Blade Lab panels.
- Convert left panel to **sticky-headed scrollable groups** with collapsible sections (Geometry / Twist / Pitch / Material / DIY).
- Right panel: single scrollable column with semantic spacing and proper sticky tab list.
- Viewer overlay: glassmorphism cards with `backdrop-blur-xl`, primary-tinted borders, reduced opacity (clearer 3D underneath).
- Add a top-right HUD showing **live ω, RPM, tip-speed, Re, Cp** as small monospace chips.
- Mobile: bottom drawer for controls (existing tabs reused), STL button stays in header.

### Part 8 — i18n

Add UA/EN keys for: all new presets, new view modes, materials, planform shapes, STL menu, all new analysis metrics and warnings.

### Files

**New**
- `src/aero/stlExport.ts`
- `src/aero/materials.ts` (densities + E, max σ)
- `src/aero/presets.ts` (16-preset library, typed)
- `src/aero/buildBladeGeometry.ts` (shared mesh builder; replaces inline logic in BladeMesh)
- `src/components/blade-lab/ViewerHud.tsx`
- `src/components/blade-lab/StlExportMenu.tsx`

**Modified**
- `src/components/blade-lab/BladeMesh.tsx` — span on +Y, hub cylinder, fan-out rotation fix.
- `src/components/blade-lab/BladeViewer3D.tsx` — HDRI, post-FX, auto-fit camera, ground disc.
- `src/components/blade-lab/GeometryPanel.tsx` — extended ranges, material/planform/DIY, collapsibles.
- `src/components/blade-lab/AeroAnalysis.tsx` — new metrics, AoA sparkline, warnings.
- `src/components/blade-lab/MacroRegime.tsx` — themed tooltips, fit verdict tuned to material/mass.
- `src/pages/BladeLab.tsx` — preset loader (full overwrite + clamp), STL button, HUD, scrollbar class.
- `src/index.css` — `.scrollbar-thin` utility, blade-lab glass tokens.
- `src/utils/i18n.ts` — new keys.

### Dependencies

Add `@react-three/postprocessing@^2.16.3` (compatible with R3F v8). Three's STLExporter is bundled with `three` — no new dep.

### Out of scope

No changes to wind simulation, generator settings, or store. Macro scenarios list itself stays as-is (already 10 entries); only the verdict logic gets material awareness.
