

## Knowledge Base Full Visual & Content Overhaul

### Problems Found
1. **ExpandableCards still look like ugly dropdowns** — flat dark bg, no visual distinction, tiny text, feel like accordion wrappers
2. **Scrollbar not consistently styled** — `eng-scrollbar` class applied but the main page `<main>` overflow isn't using it
3. **PrintingConsiderations** — content is good now but expandable sections at bottom are hard to discover
4. **BladeStressSVG** — hover works but the SVG is still cramped, legend overlaps tooltip area at bottom
5. **UkraineWindPotential** — bottom strategy section feels like plain cards, timeline is a basic flex row
6. **WindEnergyFundamentals** — "Поглиблені концепції" expandables at bottom look the worst — user specifically complained about these
7. **gl-matrix build errors** — pre-existing from node_modules, not our code

### Plan

**1. Create shared `ExpandableSection` component** — `src/components/info/ExpandableSection.tsx`
New reusable component replacing all per-file ExpandableCard duplicates:
- Larger padding, bigger font, colored left border (3px) matching section color
- Gradient header background on hover (subtle)
- Icon with glow when open
- Smooth spring animation (framer-motion layout)
- Badge showing section type (formula, concept, data)

**2. `WindEnergyFundamentals.tsx`** — Fix "Поглиблені концепції"
- Remove inline `ExpandableCard` definition, import shared one
- Make the 3 advanced concepts (Betz, Reynolds, TSR) into visually richer cards:
  - Each gets a colored left border + subtle gradient bg when open
  - Formula blocks get bigger font + glow
  - Add mini SVG illustrations (momentum disc for Betz, airfoil for Reynolds)
- Fix Betz gauge text clipping — increase viewBox width from 130 to 140

**3. `PrintingConsiderations.tsx`** — Structure improvement
- Remove inline `ExpandableCard`, import shared
- Group expandable sections under a clear header with numbered steps
- Add color-coded severity indicators (critical/recommended/optional) to each section

**4. `PrintableComponents.tsx`** — Blade stress visualization
- Increase BladeStressSVG viewBox height from 320 to 360 to prevent tooltip/legend overlap
- Add RPM slider to make it interactive (change omega dynamically)
- Move legend outside SVG into HTML below for better layout

**5. `UkraineWindPotential.tsx`** — Timeline enhancement
- Replace basic flex timeline with connected nodes (vertical line + glowing dots)
- Remove inline `ExpandableSection`, import shared

**6. `TechnicalSpecs.tsx`** — Import shared expandable
- Remove inline `ExpandableCard`, use shared component

**7. `InfoPage.tsx`** — Scrollbar
- Add `eng-scrollbar` to `<main>` with `overflow-y: auto` and `max-h-[calc(100vh-56px)]`

### Files Modified
| File | Changes |
|------|---------|
| `src/components/info/ExpandableSection.tsx` | NEW — shared expandable component |
| `WindEnergyFundamentals.tsx` | Import shared expandable, fix SVG clipping, enhance advanced concepts |
| `PrintingConsiderations.tsx` | Import shared expandable, add severity badges |
| `PrintableComponents.tsx` | Bigger blade SVG, add RPM slider, move legend to HTML |
| `UkraineWindPotential.tsx` | Import shared expandable, better timeline |
| `TechnicalSpecs.tsx` | Import shared expandable |
| `InfoPage.tsx` | Fix main scrollbar |

### Build Errors
The `gl-matrix` errors are from `node_modules` type declarations — not our code. They don't affect runtime. No action needed.

