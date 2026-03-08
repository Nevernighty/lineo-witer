

## Deep Overhaul: Weather Layers + Knowledge Base Translation + Visual Depth

### Problems Found

1. **Windy map too small** (280px height) — needs ~350-400px, remove duplicate Windy attribution links
2. **No Windy layer controls** — user wants styled checkboxes/dropdowns to switch map overlays (wind/rain/clouds/temp/pressure/waves)
3. **Knowledge Base has ZERO Ukrainian translation** — all 6 info components (`WindEnergyFundamentals`, `UkraineWindPotential`, `TurbineCategories`, `TechnicalSpecs`, `PrintableComponents`, `PrintingConsiderations`) have 100% hardcoded English text despite receiving a `lang` prop
4. **Insufficient depth and visualization** in both weather and knowledge base pages

---

### 1. Weather Page — Windy Layer Controls + Visual Depth

**`WeatherDisplay.tsx` changes:**
- Increase Windy iframe height to `380px`
- Remove duplicate Windy.com external link/attribution overlay
- Add **Windy layer control panel** below the map overlay — styled dropdown and checkboxes in Line-O-Witer dark theme:
  - Dropdown: overlay type (`wind`, `rain`, `clouds`, `temp`, `pressure`, `waves`, `gusts`) — changes the `overlay=` parameter in the Windy embed URL
  - The Windy embed URL supports switching overlays: `&overlay=wind`, `&overlay=rain`, `&overlay=clouds`, `&overlay=temp`, `&overlay=pressure`
- Add **air density calculation card** with formula visualization
- Add **wind power density visual** — animated bar showing W/m² classification
- Expand weather physics section to be visible by default with more detail
- All text properly bilingual UA/EN

**`Index.tsx` changes:**
- Remove `max-w-4xl` constraint for weather view — use full width

### 2. Knowledge Base — Full Ukrainian Translation + Deeper Content

**All 6 info components** need complete UA/EN bilingual content using inline `lang === 'ua' ? 'UA text' : 'EN text'` pattern (same as weather page). This is the biggest change.

**`WindEnergyFundamentals.tsx`:**
- Translate all titles, descriptions, formula explanations, accordion content to Ukrainian
- Add SVG visualization: animated power curve showing P vs V cubic relationship
- Add interactive Betz limit gauge with animated fill

**`UkraineWindPotential.tsx`:**
- Translate all region names, strategy text, seasonal labels, accordion content
- Translate region statuses (operational → діючий, developing → розвивається, planned → плановий)
- Add wind speed map legend with color gradient

**`TurbineCategories.tsx`:**
- Translate turbine types, pros/cons, power curve descriptions
- Add simple SVG silhouettes for each turbine type (HAWT/VAWT/Savonius)

**`TechnicalSpecs.tsx`:**
- Translate all spec labels, economic metrics, accordion content
- Add comparative bar chart for turbine rotor sizes

**`PrintableComponents.tsx`:**
- Translate material names, properties, assembly instructions
- Add visual stress diagram (simple SVG showing force arrows on blade)

**`PrintingConsiderations.tsx`:**
- Translate all print parameters, post-processing steps, QC checks

### Files Modified

| File | Change |
|------|--------|
| `WeatherDisplay.tsx` | Bigger map, layer controls, remove extra Windy links, more detail, full UA translation |
| `Index.tsx` | Full-width weather layout |
| `WindEnergyFundamentals.tsx` | Full UA/EN bilingual content, power curve SVG |
| `UkraineWindPotential.tsx` | Full UA/EN bilingual content, translated regions |
| `TurbineCategories.tsx` | Full UA/EN bilingual content, turbine silhouettes |
| `TechnicalSpecs.tsx` | Full UA/EN bilingual content, comparative visuals |
| `PrintableComponents.tsx` | Full UA/EN bilingual content |
| `PrintingConsiderations.tsx` | Full UA/EN bilingual content |

### Technical Notes
- Windy embed `overlay` parameter is changed by rebuilding the iframe URL — React state controls which overlay is active
- All translations inline (no i18n file changes needed — content is component-specific, not reusable UI labels)
- SVG visualizations are inline React — no new dependencies
- This is primarily a content + translation task — no structural changes to component architecture

