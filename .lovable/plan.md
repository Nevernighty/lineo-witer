

## "Деталі" & "Технічне" Tabs — Full Interactive Overhaul

### Problems
1. **Material chart** — bars missing for PETG/Nylon (no animation fallback), layout cramped, material cards below are flat boring grid
2. **Blade stress SVG** — too small, legend cramped inside SVG, hover tooltip overlaps, no visual drama
3. **Component expandables** — decent but text-heavy, no visual differentiation between stress/orientation/assembly
4. **TechnicalSpecs bottom** — ExpandableSection dropdowns for AEP/Stall/Wake/Noise are basic text dumps, need interactive visuals inside them
5. **Economic metrics** — plain number grid, no visual impact
6. **Rotor comparison** — decent but could use hover interactivity

### Plan

**1. `PrintableComponents.tsx` — Complete rewrite**

**Material Comparison** — Replace SVG bar chart with interactive radar/spider chart approach:
- Full-width horizontal bars with animated fills, glow on hover
- Each bar shows a gradient from left (weak) to right (strong) with color coding per property rating
- Below bars: interactive material cards that expand on click showing radar-style property breakdown (5 properties: Tensile, UV, Temp, Fatigue, Cost) as a mini SVG pentagon
- Hover on any material highlights it across ALL visualizations

**Blade Stress SVG** — Major upgrade:
- Increase to h-96 (from h-64), viewBox 440×420
- Add animated rotating blade tip with RPM-driven animation speed
- Stress heatmap: smooth gradient instead of discrete blocks
- Add centrifugal force vector arrows that scale with RPM dynamically (animated length)
- Bending moment area fill with smooth gradient (red→transparent)
- Move legend to HTML grid below SVG (3 items with colored dots)
- Tooltip: bigger, positioned above blade, shows force diagram mini-SVG
- Add "critical zone" pulsing highlight at root

**Component Cards** — Visual upgrade:
- Add small icon per component type (blade icon, hub icon, etc.)
- Stress analysis gets a red/yellow/green severity indicator dot
- Orientation gets a small SVG showing print direction arrow
- Grid layout for tolerancing/assembly with monospace values highlighted

**2. `TechnicalSpecs.tsx` — Interactive upgrades**

**Replace bottom ExpandableSections with rich interactive cards:**

- **AEP Method** → Interactive Weibull distribution SVG: slider for shape parameter k (1.5–3.0), shows f(V) curve overlaid with power curve P(V), shaded intersection = AEP. Real-time calculation as k changes.

- **Stall vs Pitch** → Interactive SVG showing two power curves overlaid: stall (drops after rated) vs pitch (flat after rated). Hover shows power at any wind speed. Toggle between them.

- **Wake Effects** → Top-down SVG showing 2 turbines with wake cone visualization. Slider for spacing (3D–15D), shows deficit % at downstream turbine position. Animated wind particles flowing through.

- **Noise** → Distance slider (100m–2000m): shows dB(A) level dropping with distance on a gauge/arc. Reference levels (conversation, library, traffic) marked.

**Economic Metrics** — Replace plain grid with:
- Animated counter numbers on mount
- Each metric card gets a small sparkline-style trend arrow (up/down/stable) with color coding
- Hover shows tooltip with context

**Rotor Comparison** — Add hover state showing turbine silhouette outline + key stats tooltip

### Files Modified
| File | Changes |
|------|---------|
| `PrintableComponents.tsx` | Interactive material radar, bigger blade SVG with animations, component card visual upgrades |
| `TechnicalSpecs.tsx` | Replace 4 expandable dropdowns with rich interactive SVG visualizations (Weibull, power curves, wake cone, noise distance) |

