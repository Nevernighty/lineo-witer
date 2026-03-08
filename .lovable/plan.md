

## Grand Overhaul: Engineering Panel + Weather + Knowledge Base

### Scope
Three areas need deep rework: (1) Generator Engineering Panel polish, (2) Weather page with interactive wind map, (3) Knowledge Base restyling to match app aesthetic.

---

### 1. Generator Engineering Panel — Polish & Fix

**Current issues:** The panel has good SVG content but needs refinement.

**Changes to `GeneratorSettings.tsx`:**
- Add a compact **status header bar** below the title showing live V, P, RPM as glowing badges (always visible context)
- **Aero tab**: Add TSR optimization mini-curve SVG — a small chart showing optimal TSR range with current TSR marked. Add animated wind particle trails on the blade profile that react to wind speed
- **Struct tab**: Add a **fatigue lifecycle ring** — circular SVG progress showing years consumed (20yr scale). Radar chart labels get better contrast
- **Elec tab**: Add a **phase diagram** SVG showing 3-phase AC waveforms (3 offset sine waves). Generator type cards become clickable with animated selection glow instead of a dropdown
- **Curve tab**: Power curve gets **animated drawing** on tab entry (stroke-dasharray animation). Add zoom region labels on axes
- **Calc tab**: Add a **live power needle animation** on the gauge (smooth spring). Add sparkline mini-charts next to torque/force/RPM cards showing how values change with V
- Fix all `text-[9px]` to minimum `text-[10px]` for readability
- Add `DialogDescription` to fix accessibility warning

### 2. Weather Page — Interactive Wind Map + Visual Overhaul

**Current state:** Plain cards in a `stalker-card` wrapper. No map, no visual wind data.

**Changes to `WeatherDisplay.tsx`:**
- Add an **embedded Windy.com iframe** map (free, no API key, beautiful wind visualization). URL format: `https://embed.windy.com/embed.html?type=map&location=coordinates&metricWind=m%2Fs&metricTemp=%C2%B0C&zoom=7&overlay=wind&product=ecmwf&level=surface&lat={lat}&lon={lon}`
- Map takes top 40% of the weather view, data cards below
- Add Line-O-Witer styled overlay on the map: semi-transparent dark header strip with location name + live badge
- Replace flat metric cards with **animated ring gauges** for wind speed, temperature, humidity
- 24h forecast bar chart gets **hover tooltips** showing exact speed values
- Add **wind rose compass** SVG — a polar chart showing wind direction with an animated arrow
- Add animated background wind lines (CSS) to the weather page

**Changes to `Index.tsx` (weather view):**
- Weather view goes full-width (remove `max-w-2xl` constraint)
- Split layout: map on top, scrollable data panel below
- Add Windy attribution link

### 3. Knowledge Base — Dark Stalker Aesthetic

**Current state:** Uses default Radix `TabsList` with light gray tabs — same ugly problem as the old generator panel. Content components use basic `Card` styling.

**Changes to `InfoPage.tsx`:**
- Replace default `TabsList` with **custom dark tabs** matching the generator panel style (dark bg, colored active glow, icon coloring, animated indicator)
- Add animated background pattern (reuse body SVG pattern)
- Add `framer-motion` page entry animation
- Tabs get color-coded icons (each tab a different hue)

**Changes to info sub-components** (`WindEnergyFundamentals.tsx`, `TurbineCategories.tsx`, `UkraineWindPotential.tsx`, `TechnicalSpecs.tsx`, `PrintableComponents.tsx`, `PrintingConsiderations.tsx`):
- Replace plain `Card` components with **stalker-card** styled containers (dark bg, green border glow on hover)
- Add `framer-motion` stagger animations on card entry
- Formula cards get animated glow treatment
- Accordion items get custom dark styling with green accent borders
- Progress bars get glow effect treatment matching the GlowSlider pattern
- Badge components get dark stalker styling

---

### Files Modified

| File | Change |
|------|--------|
| `GeneratorSettings.tsx` | Status bar, TSR curve, phase diagram, lifecycle ring, sparklines, accessibility fix |
| `WeatherDisplay.tsx` | Windy.com map embed, wind rose compass, ring gauges, hover tooltips |
| `Index.tsx` | Full-width weather layout |
| `InfoPage.tsx` | Custom dark tabs, animated entry, color-coded icons |
| `WindEnergyFundamentals.tsx` | Stalker-card styling, motion animations |
| `TurbineCategories.tsx` | Dark cards, animated entries, styled accordions |
| `UkraineWindPotential.tsx` | Glow progress bars, stalker styling |
| `TechnicalSpecs.tsx` | Dark theme cards, animations |
| `PrintableComponents.tsx` | Stalker aesthetic |
| `PrintingConsiderations.tsx` | Stalker aesthetic |

### Technical Notes
- Windy.com embed is 100% free, no API key, provides beautiful animated wind visualization globally
- All SVG additions are inline React — no new dependencies
- `framer-motion` already installed — used for stagger animations and spring transitions
- Mapbox is already in the project but Windy provides much better wind-specific visualization

