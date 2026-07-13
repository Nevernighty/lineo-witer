
# Blade Lab Cinema v2 — s02 & s03 with real teaching VFX

The current cinema engine only tweens 4 scalars and shows a subtitle. That's why s01 feels primitive. v2 turns each scenario into a directed short film: scripted VFX bursts, camera cues, a live metrics/formula HUD, an event timeline, and per-scenario 3D actors (parapet block, ridge terrain, upstream rotor + wake cone) that visibly cause the numbers to change.

## 1. Engine upgrades (`src/blade-lab/cinema/`)

### `types.ts` — richer keyframe schema
Add optional per-keyframe fields (all backward compatible with s01):
- `helical?: number` — override rotor helical wrap (Gorlov demo).
- `rotorType?: RotorType`, `preset?: string` — scenario can force geometry.
- `viewMode?: ViewMode` — auto-switch to Stall / Stress / Pressure at teaching moments.
- `camera?: { pos: [x,y,z]; look: [x,y,z]; lerp?: number }` — smooth camera cues in R-normalised units.
- `vfx?: VfxEvent[]` — declarative burst list (see VfxBus).
- `hud?: { formula?: string; metrics?: Array<{ label: string; value: string; unit?: string; warn?: boolean }> }` — teaching card contents.
- `chapter?: { ua: string; en: string }` — big chapter title card.

### `VfxBus.ts` (new)
Tiny pub/sub with a bounded ring buffer of active events. Event kinds:
- `arrow` — 3D vector arrow (dir, magnitude, color, ttl) e.g. "gust +4 m/s from parapet"
- `pulse` — expanding ring at a world point (e.g. shed vortex birth)
- `shockwave` — spherical wave to mark blade fracture
- `label3d` — floating billboard text pinned to a world point
- `highlightBlade` — pulsing rim on blade N
- `windPatch` — coloured patch on the ground plane showing local speed-up/slow-down

`useVfxBus()` returns `{ emit, subscribe, active }`. Events auto-expire on their `ttl`.

### `useDirector.ts` — v2
- Keep existing scalar interpolation.
- On keyframe crossing (t passes kf.t), fire `vfx` events into VfxBus (one-shot, not interpolated).
- Apply `viewMode`, `rotorType`, `preset`, `helical` when defined at a kf (once, on crossing).
- Feed `camera` cues to a `CinemaCamera` component via a ref/subscription — lerp the r3f camera when `cinematic` is on; suppress orbit controls during a cue.
- Expose `hud` and `chapter` in returned state.
- Add `speed: 0.5|1|2` playback rate control.

### `CinemaPanel.tsx` — v2 layout
- **Chapter card** (large title, fades in top-centre when `chapter` present).
- **Narrator subtitle** (existing, restyled two-line: title + body).
- **Metrics HUD** on the right: formula pretty-printed (`P = ½ρAV³·Cp`), plus live metric chips coloured by `warn`.
- **Timeline bar** with tick marks at each keyframe, click-to-jump, tooltip = first 40 chars of that kf's message.
- Playback: play / pause / stop / speed (0.5×/1×/2×) / prev-kf / next-kf.

## 2. In-scene renderers (`src/blade-lab/cinema/`)

### `VfxLayer.tsx` (new, mounted inside `<Canvas>`)
Subscribes to `VfxBus.active` and renders each active event with a small dedicated three.js component:
- Arrows: `<mesh>` cone + cylinder along `dir`, `sizeAttenuation` so far arrows read.
- Pulses: expanding torus with fade-out.
- Shockwave: expanding transparent sphere.
- `label3d`: `<Html>` from drei with a compact glass card.
- `highlightBlade`: emissive rim shader overlay on `spinRef.children[b]`.
- `windPatch`: instanced coloured planes on the ground.

All events lerp scale/opacity on `1 - age/ttl` so they animate independently of the director tick.

### `ScenarioStage.tsx` (new)
Loads scenario-specific 3D actors. Renders based on `scenario.stage`:
- `'rooftop'`: parapet block + roof slab in world coords upstream of the rotor.
- `'ridge'`: low ridge profile (gentle bump) with a coloured "speed-up zone" ground patch above its crest.
- `'wake'`: upstream ghost rotor (semi-transparent), spinning slower, plus a translucent wake cone (expanding + swirling) that visibly hits the main rotor.

### `CinemaCamera.tsx` (new)
When a `camera` cue is active and `cinematic` is on, replaces the roaming orbit with a lerp to the cue's `pos`/`look`. Auto-releases after `1/lerp` seconds.

## 3. BladeViewer3D integration
- Accept new prop `cinema?: { stage?: string; vfxBus: VfxBusApi; cameraCue?: CameraCue }`.
- Mount `<ScenarioStage stage=... />` and `<VfxLayer bus=... />` inside the existing Suspense tree.
- Mount `<CinemaCamera />` next to `<Cinematic />` — cue takes precedence over the auto-roam.

## 4. BladeLab page glue
- Add `useMemo(() => createVfxBus(), [])`.
- Pass extra director hooks: `setViewMode`, `setRotorType`, `setPreset`, `setHelical`, `emitVfx`.
- Feed `director.hud` and `director.chapter` into the upgraded `CinemaPanel`.
- Pipe `stage` and `vfxBus` down to `BladeViewer3D`.

## 5. Content — s02 & s03

### `s02-ridge.ts` — "Ridge speed-up"
Duration 34s, site `ridge_open`, stage `'ridge'`. Teaches Jackson–Hunt speed-up: `ΔS = 2·H/L` over a low hill; power scales with V³ so a +25 % speed-up ≈ +95 % power, but the flow also tilts (angle of attack shifts up-slope) and separation on the lee side creates a wake pocket.

Keyframes (abridged):
- t0  V=6, TSR=6, chapter "Ridge speed-up", camera side view of ridge + rotor at crest. HUD formula `ΔS ≈ 2·H/L`.
- t4  arrow "flow accelerates over crest", windPatch green above crest (`+25 %`). V ramps 6→7.5.
- t8  label3d at rotor "α_local +3°" — viewMode → 'stall' to show mild root warming.
- t14 V→8.4, TSR held, HUD chip "P/P₀ ≈ 1.9× (V³)". Camera moves in on rotor.
- t18 windPatch red on lee side (`−30 %`). arrow curling down = separation bubble. failureBoost 0.05.
- t22 pulse at blade tip when a lee-side gust hits (turb 0.35), highlightBlade 0. failureBoost 0.15.
- t26 shockwave suppressed, chapter card fades: "Position matters more than a bigger blade".
- t30 V smooths back to 7, viewMode → 'solid'. HUD: net gain +40 % vs plain, wake loss −8 %.
- t34 end.

### `s03-wake.ts` — "Wake interference"
Duration 40s, site `wind_farm`, stage `'wake'`. Teaches Jensen wake: `V_w = V·[1 − (1 − √(1−Ct))·(D/(D+2kx))²]`, with `k=0.075` (onshore) and `Ct≈0.8`. At x/D = 3, V_w ≈ 0.72·V; at x/D = 7, ≈ 0.88·V. Also shows +2× turbulence intensity inside the wake and blade-passing frequency (3P) buffet.

Keyframes:
- t0  chapter "Wake interference", upstream ghost rotor at 5D. V=9, TSR=7. HUD formula (Jensen). Camera behind main rotor looking upstream.
- t5  windPatch coloured cone (0.9·V faded blue → 0.7·V at core). arrow along wake axis.
- t10 V effective drops to 6.5 (interpolated). label3d "V_eff = 0.72·V₀". turbulence 0.35.
- t15 highlightBlade rotates each blade as it clips the wake edge (1 kf per blade). viewMode → 'pressure'.
- t22 pulse per blade pass to show 3P buffet, failureBoost 0.15. HUD chip "3P at 4.2 Hz" warn.
- t28 camera cuts to top-down showing rotor inside wake cone.
- t32 wake meanders (turbulence 0.5, streamJitter 0.6). failureBoost 0.35.
- t36 chapter "Solution: stagger rows > 7D or offset by 0.5D lateral".
- t40 end, boosts to 0.

### Update `scenarios/index.ts`
Export `[scenarioRooftop, scenarioRidge, scenarioWake]`; ensure `site` ids exist (add `ridge_open` and `wind_farm` to `sitePresets.ts` if missing).

## 6. Small polish
- CinemaPanel: increase width to `min(920px, 100vw − 32px)` to fit HUD.
- Timeline: keyframe ticks styled with `bg-primary/60`.
- Auto-enable `cinematic` when a scenario loads (user can still toggle off).
- Auto-restore user's prior `viewMode` / `rotorType` on scenario stop.

## Technical notes
- All new files live under `src/blade-lab/cinema/`; existing s01 stays untouched (still valid, gains chapter + HUD by adding fields).
- VfxBus keeps a hard cap (32 active events) to protect the render loop; overflow drops oldest.
- Camera cues are gated behind `cinematic=true` so users who scrub manually keep orbit control.
- No changes to physics/geometry files — this slice is purely presentation and content.

## Deliverables
- new: `src/blade-lab/cinema/VfxBus.ts`
- new: `src/blade-lab/cinema/VfxLayer.tsx`
- new: `src/blade-lab/cinema/ScenarioStage.tsx`
- new: `src/blade-lab/cinema/CinemaCamera.tsx`
- new: `src/blade-lab/cinema/scenarios/s02-ridge.ts`
- new: `src/blade-lab/cinema/scenarios/s03-wake.ts`
- edit: `src/blade-lab/cinema/types.ts`
- edit: `src/blade-lab/cinema/useDirector.ts`
- edit: `src/blade-lab/cinema/CinemaPanel.tsx`
- edit: `src/blade-lab/cinema/scenarios/index.ts`
- edit: `src/blade-lab/cinema/scenarios/s01-rooftop.ts` (add chapter/hud/vfx, no breaking changes)
- edit: `src/components/blade-lab/BladeViewer3D.tsx` (mount VfxLayer + ScenarioStage + CinemaCamera)
- edit: `src/pages/BladeLab.tsx` (create bus, extended director adapters, pipe stage/hud)
- edit: `src/aero/sitePresets.ts` (ensure `ridge_open`, `wind_farm` presets)
