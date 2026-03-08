

## Knowledge Base Deep Overhaul — Bigger Charts, Better Visuals, More Interactivity

### Core Problem
The PowerCurveSVG and all SVG charts use tiny font sizes (6-8px in SVG units) with cramped viewBoxes (`h-32`, `h-16`). Text is unreadable. Charts feel like thumbnails, not informational graphics. The whole knowledge base needs more visual depth, larger interactive elements, and proper sizing.

### Changes

#### 1. `WindEnergyFundamentals.tsx` — Major SVG & Content Overhaul

**PowerCurveSVG:**
- Enlarge from `h-32` to `h-56`, viewBox from `300×160` to `400×220`
- Font sizes from 6-8 → 10-12
- Add colored operating zones (cut-in gray, cubic green, rated orange, cut-out red) as filled rects behind curve
- Add hover-interactive vertical crosshair line with tooltip (useState for hovered speed)
- Add animated current-point dot on curve
- Add dashed cut-in and rated speed vertical lines with labels
- Add V³ cubic exponent annotation with arrow

**BetzGauge:**
- Enlarge from `w-28 h-28` to `w-40 h-40`
- Add animated stroke-dasharray transition on mount
- Add percentage labels for both rings

**New: WeibullDistributionSVG** — interactive chart showing f(V) distribution with adjustable k parameter via simple buttons (k=1.5, 2.0, 2.5, 3.0), curve redraws with spring animation

**New: WindShearProfileSVG** — vertical height vs wind speed profile showing logarithmic increase, with terrain type markers

**Increase all text:** `text-[10px]` → `text-xs`, `text-[11px]` → `text-sm` where appropriate

#### 2. `TechnicalSpecs.tsx` — Bigger Rotor Chart + Interactive AEP Calculator

**RotorComparisonSVG:**
- Enlarge from `h-16` to `h-32`, viewBox from `300×80` to `400×140`
- Font sizes 7 → 11
- Add animated bar growth on mount
- Add swept area annotation (πr² values)

**New: Simple AEP Calculator** — interactive section with sliders for wind speed (5-10 m/s) and rotor diameter (100-220m), shows calculated AEP in real-time with formula breakdown

**New: PowerCurveComparisonSVG** — overlay power curves for 2-3 turbine models showing how larger rotors capture more at low wind

#### 3. `TurbineCategories.tsx` — Larger Silhouettes + Efficiency Comparison

**TurbineSilhouette:**
- Enlarge from `w-8 h-10` to `w-14 h-16`
- Add animated rotation on the HAWT blades (CSS animation)
- More detail in silhouettes

**New: EfficiencyComparisonSVG** — horizontal bar chart comparing Cp of all turbine types with animated bars

#### 4. `UkraineWindPotential.tsx` — Animated Seasonal Chart + More Detail

**Seasonal chart:** Convert from grid of small cards to proper bar chart SVG (`h-40`) with animated bars, labels, and hover values

**New: WeibullSeasonalSVG** — small chart showing winter vs summer Weibull distributions overlaid

#### 5. `PrintableComponents.tsx` — Larger Stress Diagram

**BladeStressSVG:**
- Enlarge from `h-16` to `h-28`, viewBox from `200×80` to `300×120`
- Font sizes 6 → 10
- Add animated force arrow pulsing
- Add bending moment distribution curve along blade span

**New: MaterialStrengthBarChart** — horizontal bars comparing tensile strength of all materials with color coding

#### 6. `PrintingConsiderations.tsx` — Visual Print Parameter Guide

**New: LayerOrientationSVG** — shows correct vs incorrect print orientation for structural loads with clear visual

### Files Modified

| File | Key Changes |
|------|-------------|
| `WindEnergyFundamentals.tsx` | PowerCurve h-56 with zones/hover, BetzGauge w-40, WeibullSVG, WindShearSVG |
| `TechnicalSpecs.tsx` | RotorComparison h-32, AEP calculator, PowerCurve comparison |
| `TurbineCategories.tsx` | Larger silhouettes, efficiency comparison chart |
| `UkraineWindPotential.tsx` | Seasonal bar chart SVG, Weibull seasonal overlay |
| `PrintableComponents.tsx` | BladeStress h-28, material strength bars |
| `PrintingConsiderations.tsx` | Layer orientation SVG |

