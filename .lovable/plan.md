

## Grand Overhaul Plan

This plan addresses all requested improvements across 8 work areas.

### 1. Compact Analysis Checkboxes with Dropdown

**Current**: 9 checkboxes in a fixed 3x3 grid panel always visible at `top-12 left-[195px]`.

**Change**: Replace with a collapsible dropdown button ("📊 Аналіз ▾") that expands a compact panel. Each checkbox gets:
- Animated toggle with color-coded dot that pulses when active
- Info button (ⓘ) with rich tooltip containing formulas, units, and real-time values
- On-hover: highlight corresponding 3D visualization zone briefly
- Hidden by default, toggled by clicking the button

**Files**: `WindSimulation3D.tsx` (lines 752-787)

---

### 2. Particle Appearance Presets under "Хитавиця" Settings

**Current**: Single wobbliness slider in `AdvancedWindControls.tsx` turb tab.

**Change**: Add a new "Вигляд частинок" (Particle Appearance) section in turb tab with:
- **Preset selector** (dropdown): "Стандарт", "Димка", "Стріли", "Іскри", "Потоки" — each sets particle size, trail length, glow, and color profile
- **Default wobbliness per object type**: trees=1.5, buildings=0.3, fences=0.8, walls=0.1 (pass as map from controls)
- **New animated setting**: "Пульсація" (Pulsation) slider — controls particle size oscillation frequency/amplitude
- Tree wobbliness defaults reduced from current aggressive values

**Files**: `AdvancedWindControls.tsx`, `AdvancedParticleSystem.tsx`, `InstancedParticles.tsx`, `WindSimulation3D.tsx`

---

### 3. Enhanced Generator Suction Visibility

**Current**: Suction uses `attractK=7.0` but visual feedback is subtle (IntakeCone with 10% opacity cone).

**Changes**:
- **IntakeCone overhaul** in `WindGenerator3D.tsx`: Animated converging spiral lines using rotating ring groups, pulsing with wind speed. Opacity scales with `attractK`. Add particle-path funnel lines converging at rotor
- **Absorption flash**: When particle enters rotor radius, emit a brief bright flash sphere (0.3s lifetime) at rotor center
- **Power popup enhancement**: Show animated energy counter with spark icon, real kW/MW value, efficiency %, and capacity factor
- **Per-generator dropdown**: Add `Html` tooltip on hover/click showing detailed specs (Cp, cut-in/out, swept area, annual yield estimate)
- Increase `attractK` values by 40% across all types for more visible suction

**Files**: `WindGenerator3D.tsx`, `AdvancedParticleSystem.tsx`

---

### 4. Fix Tower Model (Upside Down)

**Current**: Tower legs use `Cylinder args={[legR * 0.7, legR * 1.5, ...]}` — first arg is top radius, second is bottom. Currently wider at bottom (1.5) and narrower at top (0.7), but the leg rotation `[sz * 0.08, 0, -sx * 0.08]` may invert visually because legs are positioned at `obstacle.height / 2` center.

**Fix**: The tower legs spread should taper from wide at ground to narrow at top. The issue is the cylinder renders centered at `obstacle.height/2`, so top=`legR*1.5` and bottom=`legR*0.7` would make legs wider at top. Swap to `args={[legR * 0.5, legR * 1.8, obstacle.height, 6]}` — narrower top, wider base. Also increase `legSpread` factor so legs visually spread outward from base, and fix the `(1 - 0.3)` constant to properly interpolate.

**File**: `Obstacle3D.tsx` (lines 394-456)

---

### 5. More Scenarios with Physics Explanations

**Current**: 12 scenarios with brief 1-line descriptions.

**Add 4 new scenarios**:
- **Долина** (Valley): Katabatic wind drainage, cold air pooling. Temperature inversion effects.
- **Острів** (Island): Sea-breeze circulation, thermal contrast, convergence zones.
- **Степ** (Steppe): Low roughness, high Weibull k, consistent power density.
- **Гірський хребет** (Mountain Ridge): Foehn effect, orographic lift, rotor turbulence.

Each gets 2-3 sentence description explaining the unique physics phenomenon. Add `physicsNote` field to `ScenarioPreset` interface shown in scenario picker.

**File**: `WindSimulation3D.tsx`

---

### 6. Generator Object Info Dropdown

**Current**: Generator shows floating label with type name and power. "мікро турбіна kW..." is static.

**Change**: Make the `Html` label clickable, expanding into a compact dropdown card showing:
- Generator type full name + icon
- Swept area, hub height, rotor diameter
- Cut-in / cut-out / rated speed
- Current power + capacity factor
- Estimated annual energy production (AEP)
- Betz limit comparison bar

**File**: `WindGenerator3D.tsx`

---

### 7. Info Page Overhaul + New Pages

**Current**: 6 tabs (fundamentals, potential, turbines, printing, components, specs).

**Add 2 new tabs**:
- **"Симуляція"** (Simulation Guide): Explains what each analysis overlay measures, how scenarios differ, keyboard shortcuts, placement strategies
- **"Зелена енергія"** (Green Energy): CO2 offset calculations, grid integration basics, storage overview, Ukraine green transition roadmap

**Link from settings/weather**: Add "📖 Детальніше" button in GeneratorSettings and WeatherDisplay that links to relevant InfoPage tab via URL params.

**Files**: `InfoPage.tsx`, new `src/components/info/SimulationGuide.tsx`, new `src/components/info/GreenEnergy.tsx`, `GeneratorSettings.tsx`, `WeatherDisplay.tsx`

---

### 8. Sound Effects + Visual Polish

**Current**: 4 basic oscillator sounds (place, rotate, clear, scale).

**Add**:
- `playAbsorbSound()`: High-pitched chirp when particle enters generator rotor
- `playWindGustSound()`: Low rumble during gust events
- Improve existing sounds with layered oscillators and reverb-like delay

**Visual**:
- Add animated pulsation setting that makes particles breathe
- Improve collision flash with expanding ring + directional sparks
- Better trail colors that inherit particle speed color instead of fixed green

**Files**: `sounds.ts`, `InstancedParticles.tsx`, `CollisionEffect.tsx`

---

### Implementation Priority

1. Fix tower model (quick fix)
2. Compact analysis dropdown + overhaul 9 checkboxes
3. Enhanced generator suction + popups + dropdown info
4. Particle presets + reduced tree wobble defaults + pulsation setting
5. New scenarios with physics explanations
6. Generator detail dropdown
7. Info page new tabs + interlinking
8. SFX improvements + visual polish

### Technical Notes

- Total files modified: ~12 files
- No new dependencies needed
- All changes are React/Three.js within existing architecture
- i18n strings added to `src/utils/i18n.ts` for all new labels

