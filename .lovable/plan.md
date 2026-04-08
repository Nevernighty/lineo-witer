

## Continue Overhauls: Dynamic Waveforms + Scientific Wind Types + Remaining Responsiveness/i18n

### Part 1: Dynamic Waveform & Curve Animations (GeneratorSettings.tsx)

**Problem:** PhaseDiagramSVG and FrequencyWaveform always render at hardcoded `frequency=50`, ignoring pole count, RPM, and generator type. Animation speeds are static.

**Changes in `GeneratorSettings.tsx`:**

1. **Compute actual electrical frequency** in `liveCalc`:
   - `elecFreq = (rps * 60 * poleCount) / 120`
   - For DFIG: apply gearbox ratio (~50×) so frequency approaches 50Hz grid
   - For PMSG: show raw low frequency (direct drive)

2. **PhaseDiagramSVG** (line 1135): pass `elecFreq` instead of `50`
   - Scale sine wavelength by frequency: `x / (3500 / frequency)` instead of fixed `/70`
   - Add dynamic CSS animation speed: `animationDuration: ${Math.max(0.3, 10/frequency)}s`
   - Show label: "Generator: X Hz" + "Grid: 50 Hz" comparison

3. **FrequencyWaveform** (line 1191): pass `elecFreq` instead of `50`
   - Already uses `frequency / 10` for cycles — auto-adjusts
   - Add dynamic animation speed matching frequency

4. **GeneratorSchematicSVG**: scale `animateMotion dur` inversely with RPM
   - `dur={Math.max(0.5, 3 / (1 + rps))}s`

5. **EfficiencyChainSVG**: scale animation speed by power output ratio for visual energy flow feedback

### Part 2: Scientific Wind Types in Simulation

**Add a "Wind Type" selector** to AdvancedWindControls Wind tab that auto-configures physics parameters to match real meteorological wind phenomena.

**New wind types** (added to `scenarios.ts` as wind type presets, or inline in AdvancedWindControls):

| Wind Type | UA | Key Physics |
|-----------|----|----|
| Trade Wind | Пасатний | Steady, low turbulence, moderate speed, elevation 0° |
| Katabatic | Катабатичний | Downslope, cold, negative elevation, low TI |
| Sea Breeze | Бризовий | Cyclic, moderate, from sea, high humidity |
| Foehn | Фен | Warm, dry, strong gusts, terrain speedup |
| Mountain Wave | Гірська хвиля | High altitude oscillations, high turb scale |
| Mistral | Містраль | Very strong, channeled, low humidity |

**Implementation:**
- Add `windType` state to `WindSimulation3D.tsx`
- Add wind type selector buttons in AdvancedWindControls Wind tab (below speed slider)
- Each wind type sets: windSpeed, windAngle, windElevation, turbulenceIntensity, turbulenceScale, gustFrequency, gustIntensity, temperature, humidity, surfaceRoughness
- Add i18n keys for all wind type names and descriptions
- Cross-influence: changing individual sliders after selecting a type shows "Custom" badge

### Part 3: Remaining Responsiveness & i18n

**Already done in previous commit:** Index.tsx header flex-wrap, MainMenu grid, GeneratorSettings dialog sizing, WeatherDisplay responsive, WindSimulation3D panel widths, AdvancedWindControls preset grid, LoadingScreen lang prop, i18n keys for LCOE/powerFactor/reactive/blade labels.

**Still needed:**

1. **GeneratorSettings.tsx Elec tab** — hardcoded strings remain:
   - Line 931: `"Cl (Lift)"` and line 942: `"Cd (Drag)"` — replace with `label()` using existing i18n keys `liftCoeff`/`dragCoeff`
   - Line 952: `"Cl/Cd = "` — add i18n key
   - SVG labels in BladeProfileSVG: "LOW P"/"HIGH P" — use existing `lowPressure`/`highPressure` keys

2. **GeneratorSettings.tsx** — SVG text labels that remain English-only:
   - Line 415: `n_sync = ... RPM @ 50Hz` — translate
   - Lines 581-584: "OFF", "RAMP", "RATED" in PowerCurveSVG — add i18n

3. **i18n.ts** — add missing keys:
   - `clCdRatio`, `syncSpeed`, `off`, `ramp`, `rated`, `generatorFreq`, `gridFreq`
   - Wind type keys: `tradeWind`, `katabatic`, `seaBreeze`, `foehn`, `mountainWave`, `mistral` + descriptions
   - `windType`, `custom` (for modified preset indicator)

### Files Modified

| File | Changes |
|------|---------|
| `GeneratorSettings.tsx` | Dynamic frequency in waveforms, responsive animation speeds, remaining i18n fixes for SVG labels |
| `AdvancedWindControls.tsx` | Wind type selector in Wind tab with science-based presets |
| `WindSimulation3D.tsx` | Wind type state, pass to controls |
| `i18n.ts` | All new translation keys for wind types, waveform labels, SVG text |

