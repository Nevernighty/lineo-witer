

## Replace Industrial Turbines with Household/Residential Models

### Problem
Current turbine specs section shows industrial giants (GE Haliade-X 14MW, Vestas V150) irrelevant to the app's audience. Users need household-scale turbines (400W–20kW) they could actually install.

### Changes — `TechnicalSpecs.tsx`

**1. Replace `turbineSpecs` data** with real residential turbines:
- **Rutland 504** — 30W, 0.51m rotor, pole-mount, marine/off-grid
- **Air Breeze** (Primus) — 400W, 1.17m rotor, residential rooftop
- **Automaxx 1500W** — 1.5kW, 1.5m rotor, hybrid solar+wind
- **Bergey Excel 6** — 6kW, 6.17m rotor, farm/rural, guyed tower
- **Ryse E20** — 20kW, 10m rotor, commercial small, freestanding

Each entry: model, rated power, rotor diameter, hub height (6–30m), cut-in/cut-out, regulation type, estimated AEP (100–50,000 kWh/yr), price range, typical use-case, noise level

**2. Replace `RotorComparisonSVG`** — scale bars to 0.5–10m range instead of 138–220m. Add household reference silhouettes (person 1.8m, house 6m) as dotted outlines behind bars for scale context.

**3. Upgrade expandable turbine cards** — each card shows:
- Power curve mini-SVG (unique per turbine showing cut-in ramp to rated)
- Installation type icon (roof/pole/tower)
- Noise level badge with color coding (quiet green < 35dB, moderate yellow, loud red)
- Use-case tag (off-grid, backup, grid-tied)
- Cost-per-watt indicator

**4. Update `AEPCalculator`** sliders to household range:
- Rotor diameter: 0.5m–12m (was 80–240m)
- Adjust power formula scaling for small turbines
- Show monthly bill savings estimate (at ~€0.20/kWh)

**5. Update `economicMetrics`** for household context:
- Replace LCOE onshore/offshore with: LCOE small wind (€0.15–0.40/kWh), payback 5–15yr, installation cost €2k–25k, maintenance €100–500/yr, grid connection cost, battery storage cost

**6. Section title/description** — change from "Специфікації сучасних вітротурбін / Промислові турбіни" to "Побутові вітрогенератори / Residential wind turbines for home installation"

### Files Modified
| File | Changes |
|------|---------|
| `TechnicalSpecs.tsx` | Replace all turbine data with household models, rescale rotor chart, update AEP calculator range, household economics |

