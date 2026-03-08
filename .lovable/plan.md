

## Knowledge Base Full Overhaul

### Problems Identified
- Text clipping on Betz limit gauge and other SVGs (viewBox too tight, text overflows)
- Default Radix accordions look like ugly dropdowns - need custom styled expandable sections
- No custom scrollbar on info page content areas
- PrintingConsiderations content is generic/primitive - not specific enough to wind energy manufacturing
- BladeStressSVG is too small (h-28) with poor interactivity - needs to be the centerpiece
- UkraineWindPotential accordion sections at bottom are basic
- Inconsistent card styling across sections

### Plan (6 files modified)

**1. `src/components/info/WindEnergyFundamentals.tsx`**
- Fix BetzGauge SVG: increase viewBox to prevent text clipping, add padding
- Replace all `<Accordion>` with custom styled expandable cards (animated chevron, glow border on open, no default underline hover)
- Add `eng-scrollbar` class to any overflow containers
- Fix PowerCurveSVG tooltip clipping at edges (clamp tooltip position)

**2. `src/components/info/TurbineCategories.tsx`**
- Replace Accordion with custom collapsible cards styled with colored left borders per turbine type
- Bigger TurbineSilhouette SVGs
- Fix Betz limit label clipping in EfficiencyComparisonSVG

**3. `src/components/info/UkraineWindPotential.tsx`**
- Replace bottom accordions with always-visible styled cards with expandable details
- Add wind rose simplified SVG visualization (directional arrows showing NW winter / SW summer)
- Better timeline visualization with connecting glow lines

**4. `src/components/info/PrintingConsiderations.tsx` — Major content overhaul**
- Replace generic content with wind-energy-specific 3D printing engineering data:
  - **Blade aerodynamic profile printing**: NACA airfoil preservation, surface roughness impact on Cl/Cd, layer line orientation relative to airflow
  - **Structural FDM analysis for rotating parts**: centrifugal stress calculations, creep under sustained load at temperature
  - **Material selection matrix**: specific to outdoor rotating components (UV, fatigue cycles at RPM, moisture absorption)
- Add interactive infill vs strength visualization (SVG with slider showing infill % → estimated tensile strength curve)
- Bigger LayerOrientationSVG with animated load arrows
- Replace accordion sections with custom expandable cards

**5. `src/components/info/PrintableComponents.tsx` — Blade stress visualization overhaul**
- **BladeStressSVG**: Make 2-3x bigger (h-48+), add:
  - Interactive hover: show stress magnitude at hover position along blade span
  - Animated bending moment curve with gradient fill showing stress concentration
  - Shear force diagram below (second SVG)
  - Color-coded stress heatmap on blade surface (green at tip → red at root)
  - Tooltip showing F = mω²r calculation at hovered radial position
- MaterialStrengthChart: add interactive hover showing full material properties
- Replace Accordion with custom styled expandable sections

**6. `src/pages/InfoPage.tsx`**
- Add `eng-scrollbar` class to main content area and tab scroll container
- Ensure all overflow areas use custom scrollbar

### Custom Accordion Replacement Pattern
Instead of Radix Accordion, use a custom component pattern throughout:
```tsx
const [openSection, setOpenSection] = useState<string | null>(null);
// Render as clickable cards with AnimatePresence for content
// Styled with glow border when open, smooth height animation via framer-motion
```

### Files Modified
| File | Changes |
|------|---------|
| `WindEnergyFundamentals.tsx` | Fix SVG clipping, replace accordions with custom expandables |
| `TurbineCategories.tsx` | Custom expandables, fix chart clipping |
| `UkraineWindPotential.tsx` | Replace accordions, add wind rose SVG |
| `PrintingConsiderations.tsx` | Major content rewrite with wind-energy-specific 3D print engineering |
| `PrintableComponents.tsx` | Interactive blade stress visualization overhaul, hover tooltips |
| `InfoPage.tsx` | Add eng-scrollbar to content areas |

