
# Fix Simulation Error + Overhaul Info Pages

## Part 1: Fix the Simulation Crash

The `componentTagger` plugin was re-enabled in `vite.config.ts` during the template update. This conflicts with `@react-three/fiber` because the tagger injects `data-lov-*` DOM attributes into Three.js mesh elements, which are WebGL objects and do not support DOM properties.

**Fix:** Disable `componentTagger` again in `vite.config.ts`. This is a hard constraint for this project due to the Three.js dependency.

## Part 2: Overhaul Info Pages (Mobile-First, Science-Rich)

The current info pages have several issues:
- Tables are not mobile-friendly (horizontal scroll required)
- Content is sparse in some sections (PrintableComponents, TurbineCategories, PrintingConsiderations)
- Not enough scientific depth (missing formulas, diagrams, real-world data)
- Layout not optimized for mobile-first viewing

### Changes by file:

**`src/pages/InfoPage.tsx`** - Restructure for mobile-first
- Convert tab navigation from 5-column grid to scrollable horizontal tabs on mobile
- Add more prominent section headers with scientific context
- Add two new tabs: "Simulation Guide" and "Wind Models" (consolidating existing unused components)

**`src/components/info/WindEnergyFundamentals.tsx`** - Enhance scientific content
- Add wind shear profile explanation with power law formula (V = V_ref * (h/h_ref)^alpha)
- Add Weibull distribution visual explanation with k and c parameter effects
- Add turbulence intensity classification (IEC categories A, B, C)
- Convert card grid to stacked layout on mobile
- Add Reynolds number explanation and its effect on blade aerodynamics

**`src/components/info/TurbineCategories.tsx`** - Mobile-first redesign
- Replace table with card-based layout (each turbine type gets its own expandable card)
- Add power curve description per turbine type
- Add tip-speed ratio (TSR) data and optimal operating ranges
- Add visual comparison of HAWT vs VAWT with pros/cons
- Include noise levels (dB) and minimum setback distances

**`src/components/info/PrintableComponents.tsx`** - Expand with engineering data
- Replace table with mobile-friendly cards
- Add stress analysis considerations (centrifugal force on blades)
- Add material property comparison (tensile strength, UV resistance, temperature range)
- Add print orientation recommendations with reasoning
- Add assembly tips and tolerancing guidance

**`src/components/info/UkraineWindPotential.tsx`** - More scientific rigor
- Add seasonal wind variation data (monthly averages)
- Add wind rose explanation
- Expand grid integration section with frequency regulation details
- Mobile-optimize the region cards to stack vertically

**`src/components/info/TechnicalSpecs.tsx`** - Deepen technical content
- Replace table with expandable cards per turbine model
- Add power curve shape explanations (stall vs pitch regulation)
- Add Annual Energy Production (AEP) calculation formula
- Add wake effect spacing guidelines (5-10D rule)
- Add noise propagation model basics

**`src/components/info/PrintingConsiderations.tsx`** - Major expansion
- Add FEA (Finite Element Analysis) basics for printed blades
- Add fatigue life considerations for rotating parts
- Add post-processing steps (annealing, coating)
- Add balancing procedures for printed rotors
- Mobile-friendly card layout

## Technical Details

- All info components will use stacked card layouts instead of tables for mobile compatibility
- Accordion components will be used for detailed explanations to keep pages scannable
- Scientific formulas will be displayed in `font-mono` styled blocks
- Color-coded badges for classification levels (IEC classes, material grades)
- Each section header will include a brief scientific context sentence
- `vite.config.ts` will have `componentTagger` removed with a comment explaining the Three.js constraint
