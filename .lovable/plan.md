# Real 3D-Printed Turbine Library + Part Explorer

Replace the invented turbine choices with a library of real, documented 3D-printed wind turbines from the uploaded archives, add a guided part-by-part 3D explorer (explode, hover/click highlights, assembly animation), and rebuild the left settings panel on real physics.

## 1. Model set (first stage: 7 turbines)

From the uploaded archives, each with per-part STLs and a source page:

| Turbine | Family | Source |
| --- | --- | --- |
| Functional 450W windturbine (From Waste To Wind) | HAWT, 3-blade, axial-flux PMG | Printables |
| Functional 100W windturbine | HAWT small | Printables |
| Double wind turbine MK3 (counter-rotating) | Twin HAWT | Printables |
| Savonius & Gorlov VAWT | Savonius + helical Darrieus | Thingiverse |
| Darrieus/Savonius Turbine Ver.2 | Hybrid VAWT | Thingiverse |
| HEL3D vertical wind power v8 | Helical VAWT | Printables |
| Project Aeolus VAWT v2 | Darrieus VAWT | Printables |

For each: name, author, license, family, rated power, rotor diameter/height, swept area, TSR band, cut-in/rated wind, blade count, printed-part list, hardware BOM (bearings, magnets, NEMA/axle), and the original model URL — extracted from the archived PDFs/HTML plus the line-o `3dwinde.html` link table. Stored in a new `src/data/realTurbines.ts`.

## 2. STL → GLB conversion pipeline

- Extract nested `*-model_files.zip` archives, convert each part STL to GLB (decimated, welded, ~<1.5 MB per part), and upload each part with `lovable-assets` so nothing binary lands in the repo.
- Group parts per turbine into a manifest: part id, display name UA/EN, role (rotor / hub / blade / generator / bearing / tower / hardware), assembly order, explode direction/offset, print notes (layer height, supports, material), quantity.
- Assemble-transform per part is authored so the union of parts forms the complete turbine at rest.

## 3. Part Explorer (new tab in Blade Lab)

A new "Реальні моделі" tab, separate from the existing rotor-family/preset selectors so nothing conflicts:

- **Picker**: card grid with preview thumbnails, family/power filters, and a short spec strip — friendly, guided selection.
- **Viewer**: full turbine in 3D with an explode slider (0 → 1), per-part hover glow + label, click to isolate a part (dim others, focus camera, open a detail card with its role, physics function, print notes, and download link to the source page).
- **Assembly animation**: play/pause timeline that assembles parts in real build order with staged camera moves and step captions.
- **Cross-use**: any explored model can be sent into the normal Blade Lab (rotor geometry + material feed the BEM sim) and teleported into the 3D wind simulation, replacing the synthetic rotor.

## 4. Physics-grounded left settings panel

Rebuild the rotor/blade section so every control maps to a measurable quantity, seeded from the selected real model:

- Rotor: diameter, hub radius, blade count, swept area (derived), solidity σ = Nc/(2πR), H/D for VAWT.
- Blade: chord root/tip, twist law, pitch, airfoil selection with Cl/Cd from the airfoil tables, Reynolds number readout (small rotors sit at Re 5e4–2e5, which is shown and warned about).
- Operating point: TSR, RPM, tip speed with material limit, Cp from BEM (not a fixed constant), thrust coefficient.
- Output chain: mechanical power ½ρAv³Cp → generator efficiency → electrical power, with cut-in/rated/furling markers on the power curve.
- Live validation chips when values leave the physically sensible band for the chosen family (e.g. Savonius TSR > 1.2, HAWT solidity too high for the requested TSR).

## 5. Link integrity

All external links (Printables, Cults3D, Thingiverse, Hackster, fromwastetowind) come from the archived pages, are stored once in the model data, open in a new tab with `rel="noopener"`, and are checked for reachability during the build step.

## Technical notes

- New: `src/data/realTurbines.ts`, `src/data/turbineParts/<model>.ts` manifests, `src/components/turbine-explorer/*` (Picker, PartViewer, PartInspector, AssemblyTimeline), `src/three/PartsModel.tsx` (multi-part GLB group with per-part refs, hover raycast, explode/assemble interpolation).
- Reuses the existing `GlbModel` bbox auto-fit, `hudLayout`, and cinema camera helpers so framing stays consistent with Blade Lab.
- Settings rework touches `GeneratorSettings.tsx` and `GeometryPanel.tsx` presentation plus `src/aero/bem.ts` readouts; no change to the simulation store contracts.
- Part GLBs are CDN assets (`.asset.json` pointers), loaded lazily per model with a Suspense skeleton and preloading only the selected turbine.
