
# Unified Design + Physics/Graphics Overhaul

Goal: kill the "zoo" of inconsistent panels/sliders/typography, tighten physics glitches per rotor type, and overhaul the main 3D wind simulation (weather + settings + graphics + animation). Executed in one coordinated pass via 4 parallel background subagents so nothing regresses across pages.

## Act 1 — Design System (foundation, must land first)

Single source of truth in `src/index.css` + `tailwind.config.ts` + a new `src/components/ui/panel.tsx` primitive:

- **Type scale (tight, professional):** `--fs-xs 11px / --fs-sm 12px / --fs-base 13px / --fs-md 14px / --fs-lg 16px / --fs-xl 20px / --fs-2xl 26px`. Line-heights 1.25/1.4. No more mixed 20px labels next to 12px values.
- **Space scale:** 4 / 6 / 8 / 12 / 16 / 20 / 24 px only. Panels: 12px inner padding, 8px row gap, 6px control gap.
- **Slider redesign (global):** track 3px (was ~8), thumb 12×12 with 1px ring, value chip 40px min-width mono tabular numbers. New `[label | slider | value]` CSS grid row (`grid-cols-[minmax(90px,120px)_1fr_44px]`) applied via a `<ControlRow>` primitive so every panel matches.
- **Panel primitive:** `<Panel title actions collapsible density="compact|comfortable">` — glass bg, 1px hairline border `hsl(var(--border)/0.6)`, 10px radius, 12px header, sticky title. Replaces the ad-hoc panels in BladeLab, WindSimulation3D, GeneratorSettings, HeaderControls.
- **Menubar / Chip / Badge / Tab restyle** to 12–13px, uniform 28px height, single accent color usage.
- **Motion tokens:** `--ease-out: cubic-bezier(.2,.7,.2,1)`, `--dur-fast 140ms / --dur 220ms / --dur-slow 360ms`. All panel/menu transitions standardised.
- Removes hard-coded `text-white / bg-black / text-xl` scattered across components in favor of tokens.

## Act 2 — Main Wind Simulation Overhaul (graphics + physics + weather + settings)

- **Renderer:** enable `ACESFilmicToneMapping`, `outputColorSpace = SRGB`, physically correct lights, soft PCF shadows, subtle bloom on turbine LEDs / particle glow via `@react-three/postprocessing` (SSAO off on mobile).
- **Sky/atmosphere:** replace flat bg with Drei `<Sky>` driven by time-of-day + cloud cover from weather; ground gets a proper PBR grid material with anisotropic falloff.
- **Wind physics:** upgrade `WindPhysicsEngine` — add proper log-law shear (`u(z)=u_ref·ln(z/z0)/ln(z_ref/z0)`), Kaimal-based turbulence (already have `turbulenceModel.ts`) hooked into per-particle velocity; wake uses Jensen + Gaussian blend (extend `wakeModel.ts`). Fix particle stutter by decoupling physics tick (fixed 60Hz accumulator) from render.
- **Particles:** switch `AdvancedParticleSystem` to instanced points with velocity-colored streaks; density auto-scales from `qualityPresets`.
- **Turbine 3D:** apply the same "unified spinGroup" fix from BladeLab to `WindGenerator3D` / `BladePresetTurbine3D` so nacelle, hub, cone and blades rotate coherently on the correct axis; add yaw animation that tracks wind direction with a 2nd-order critically-damped spring.
- **Weather panel:** compact tabbed Panel (Now / 24h / 7d) with sparkline; wire wind speed/dir/temperature/pressure/cloud into the scene (sky, particle density, air density in power curve).
- **Settings panel:** collapsible sections (Environment, Physics, Visuals, Performance) using the new ControlRow — replaces the current overgrown sliders.

## Act 3 — Per-rotor glitch pass (BladeLab)

Fix the artifacts visible in the uploaded screenshot (floating cyan strut/wake ribbon detached from the Darrieus rotor, ground streamline out of scale):

- Clamp helper visuals (streamlines, wake ribbons, vortex rings) to be children of the turbine group and scaled by `tipRadius`, not world units.
- Rotor-family gating in `GeometryPanel` — Savonius hides "twist", HAWT hides "overlap", Archimedes hides "n blades".
- Recovery: fully reset `bladeRef.rotation` + quaternion to identity in one step once `detachT<1e-3` (prevents lingering axis drift on some presets).

## Execution — parallel background agents

Spawn 4 agents in parallel; act 1 must finish before acts 2/3 touch component styles, so agent A publishes tokens first, others rebase on it:

- **Agent A — Design System:** index.css tokens, tailwind extend, `ui/panel.tsx`, `ui/control-row.tsx`, slider.tsx restyle, menubar/tabs restyle. Refactors call sites in `BladeLab.tsx`, `WindSimulation3D.tsx`, `GeneratorSettings.tsx`, `HeaderControls.tsx`, `WeatherDisplay.tsx`, `AdvancedWindControls.tsx`.
- **Agent B — Sim graphics/physics:** renderer setup, Sky, postprocessing, `WindPhysicsEngine` upgrades, particle instancing, unified `spinGroup` in `WindGenerator3D`, yaw spring.
- **Agent C — Weather + Settings UX:** rebuild `WeatherDisplay` + settings panels using Panel/ControlRow, wire weather → scene.
- **Agent D — BladeLab glitch pass:** helper-visual reparenting, GeometryPanel gating, recovery reset, verify each rotor type with a Playwright screenshot sweep.

## Technical details

- New files: `src/components/ui/panel.tsx`, `src/components/ui/control-row.tsx`, `src/lib/design-tokens.ts` (TS mirror of CSS vars for JS access).
- `src/index.css`: add `--fs-*`, `--space-*`, `--dur-*`, `--ease-*`, restyle `[role=slider]` / `[data-radix-slider-*]`.
- `WindSimulation3D.tsx`: wrap Canvas with `gl={{ antialias:true, toneMapping: ACESFilmicToneMapping }}`, add `<EffectComposer><Bloom/></EffectComposer>`, `<Sky/>`.
- `WindPhysicsEngine.ts`: add `stepFixed(dt)` accumulator, log-law shear helper, expose `sampleTurbulence(x,y,z,t)`.
- Each agent ends with a Playwright screenshot at 1280×1800 of its page and posts it in its report for verification.

## Out of scope

- No backend / Lovable Cloud changes.
- No new routes.
- No changes to `useWindStore` shape (kept for compatibility).
