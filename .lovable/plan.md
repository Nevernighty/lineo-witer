

## Fix Generator Engineering Panel — Deep Overhaul

### Problems Identified
1. **Ugly default scrollbar** — `overflow-y-auto` on DialogContent uses browser-default scrollbar. Horizontal scrollbar also visible
2. **SVG visualizations too small and static** — blade profile is tiny (h-20), radar chart cramped (h-36), power curve small (h-40)
3. **Lack of animated interactivity** — SVGs are static, no hover states on materials, no animated data flows
4. **Poor spacing/layout** — content crammed, cards too small, text too tiny (8-10px everywhere)
5. **No scroll styling** — needs the `scenario-scrollbar` class or custom scrollbar CSS

### Changes — `GeneratorSettings.tsx`

**Layout & Scrollbar:**
- Apply `scenario-scrollbar` class to DialogContent for styled scrollbar
- Add `overflow-x-hidden` to kill horizontal scrollbar
- Increase dialog to `max-w-4xl`, give content more breathing room
- Increase all text sizes (9px→11px, 10px→12px minimum)

**Aero Tab — Deeper & More Interactive:**
- Enlarge blade profile SVG to `h-32` with animated flow lines (CSS animation on stroke-dashoffset)
- Add animated pressure distribution overlay (upper/lower surface colored zones)
- Lift/Drag animated bar chart that reacts to profile selection with spring animation
- Attack angle slider with animated stall turbulence vortices (CSS keyframe rotation)
- Add TSR optimization curve (small inline SVG showing optimal TSR range)
- Betz gauge enlarged with animated stroke transition

**Struct Tab — Interactive Material Selection:**
- Enlarge radar chart to `h-48`
- Make material cards clickable/selectable with animated border glow on active
- Add animated bar comparison for each property (E, σ, ρ) with spring transitions
- Add blade deflection visualization — simple SVG showing bent blade proportional to calculated deflection
- Fatigue lifecycle visual — circular progress showing years consumed

**Elec Tab — Animated Flow Diagram:**
- Enlarge schematic to `h-24`
- Add animated dashed-line flow between nodes (CSS stroke-dashoffset animation)
- Pulsing energy dots moving along connection lines
- Efficiency bars get animated fill on tab enter
- Add frequency waveform SVG showing 50Hz sine wave

**Curve Tab — Richer Interactive Chart:**
- Enlarge power curve to `h-56` for proper readability
- Add animated current-point glow trail
- Hover shows vertical crosshair + tooltip with both P(V) and f(V) values
- Operating regions labeled (below cut-in, ramp-up, rated, cut-out) with colored zones
- AEP shaded area with gradient fill

**Calc Tab — Live Dashboard:**
- Larger cards with animated number counters (framer-motion)
- Efficiency chain enlarged with animated energy dots flowing between stages
- Add real-time power gauge (semicircle SVG)
- Color-code industry comparison (green=better, red=worse than average)

**Global CSS:**
- Add custom scrollbar styles to `index.css` for dialog content

### Files Modified

| File | Change |
|------|--------|
| `GeneratorSettings.tsx` | Complete rewrite — larger SVGs, animated flows, better spacing, interactive elements |
| `index.css` | Add dialog scrollbar styles |

