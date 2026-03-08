

## Grand Overhaul: Generator Engineering Panel

### Problem
The GeneratorSettings dialog uses default Radix `TabsList` with ugly light gray inactive tabs that clash with the dark stalker aesthetic. Content is static text-heavy, lacks animations, and feels disconnected from the 3D simulation. The panel needs the same GlowSlider treatment as AdvancedWindControls.

### Design Overhaul

**1. Tab Styling — Match simulation panel aesthetic**
- Replace default `TabsList` with custom styled tabs matching `AdvancedWindControls` (dark bg, green glow on active, no gray)
- Active tab: `bg-primary/20` + bottom green border glow + colored icon
- Inactive tab: transparent bg, `text-muted-foreground`, no gray fill
- Add subtle transition animations between tabs

**2. Replace all Sliders with GlowSlider**
- Every slider in all 5 tabs gets the same glowing green bar + floating thumb as the simulation controls
- Consistent look across the entire app

**3. Enhanced Aero Tab — Interactive Blade Profile Visualizer**
- SVG blade cross-section that morphs when you change the NACA profile
- Lift/Drag ratio visualized as animated bars, not just text
- Attack angle shown as a rotating SVG airfoil with stall warning animation when >15°
- Betz limit comparison: animated radial gauge (not plain progress bar)

**4. Enhanced Struct Tab — Material Comparison Radar**
- Replace plain text cards with an SVG radar/spider chart comparing all 4 materials on 3 axes (E, σ, ρ)
- Material cards get colored left borders and hover glow
- Add blade mass estimate: `mass ≈ 0.5 × R × ρ_material` with live calculation

**5. Enhanced Elec Tab — Generator Schematic**
- Simple SVG schematic showing PMSG/DFIG/SCIG topology (magnets, coils, gearbox)
- Pole count → sync speed → frequency chain shown as animated flow diagram
- Efficiency comparison bar chart across all 3 generator types (not just the selected one)

**6. Enhanced Curve Tab — Interactive Power Curve**
- Power curve SVG gets hover crosshair — mouse position shows V and P values
- Weibull probability density overlay on the same chart (dual Y-axis)
- AEP shaded area under the combined P(V)×f(V) curve
- Wind rose integration hint (link to simulation)

**7. Enhanced Calc Tab — Live Dashboard**
- Cards get subtle pulse animation when values change
- Add efficiency chain: Wind → Rotor (Cp) → Generator (η_gen) → Grid (η_conv) with animated flow arrows
- Add comparison row: "Your turbine vs industry average"
- Animated counter for AEP value

**8. Deep Research Data Additions**
- **Aero**: Reynolds number estimate (`Re = ρVc/μ`), tip speed ratio optimization curve
- **Struct**: Fatigue cycle estimate (20yr × rotations), blade deflection estimate
- **Elec**: Grid frequency matching, power factor, reactive power estimate  
- **Curve**: Capacity factor benchmarks by region (Ukraine coast/steppe/Carpathians)
- **Calc**: LCOE (Levelized Cost of Energy) estimate, CO₂ offset calculation

### Files Modified

| File | Change |
|------|--------|
| `GeneratorSettings.tsx` | Complete rewrite — new tab styling, GlowSliders, SVG visualizations, deep data, animations |

### Key Technical Details
- Reuse the `GlowSlider` pattern from `AdvancedWindControls` (inline copy to avoid circular deps)
- All SVG visualizations are inline React components (no external libs)
- `framer-motion` `AnimatePresence` for tab content transitions
- All new data computed via `useMemo` from existing `currentSettings` + `windSpeed`
- Full UA/EN localization maintained via existing `label()` helper
- Dialog styling: `bg-[#0d1117]` dark bg, `border-primary/30` green border (matching simulation panel)

