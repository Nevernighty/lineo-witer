# Blade Lab + 3D Simulator Reliability Overhaul

## Goal
Turn the current disconnected camera, VFX, model, HUD, and power paths into one scale-aware, deterministic simulation experience that remains readable across rotor families, building scenarios, and viewport sizes.

## Confirmed current problems
- Cinema camera/VFX coordinates are authored in fixed metres while rotors and scenario buildings scale with live rotor radius/height. This can put the camera inside geometry or make effects effectively invisible.
- Camera ownership is fragmented: scripted cues disable OrbitControls, while the separate auto-cinematic orbit can still compete with manual framing. Stop/pause does not reliably release the camera.
- `highlightBlade` exists as a VFX concept but is not connected to blade rendering, so several guided steps narrate changes that never appear visually.
- Scenario buildings use approximate metadata; their measured fitted bounds are not returned to camera logic, and there is no camera-to-target line-of-sight check.
- The uploaded GLB URLs sampled during the audit return valid `200 model/gltf-binary` responses. The robust fix is therefore scene-level error isolation and measured framing—not replacing valid assets based on an unconfirmed CDN failure.
- `TurbineHudCard` exists but is never mounted. Its current `occlude={false}` behavior would also keep it visually above geometry.
- Existing local hit labels are always-on DOM overlays and use global `window` callbacks without turbine/blade attribution.
- The renderer's rotor speed is independent from the aerodynamic TSR/omega used for power, and BEM/VAWT currently expose rotor totals rather than a normalized per-blade result.
- Particle hits and popup selection use unseeded randomness and frame-dependent gating, so identical scenarios do not produce repeatable speed/hit/kJ visuals.

## Implementation plan

### 1. Establish one normalized cinematic coordinate system
- Extend cinema types with normalized camera/framing metadata and an explicit step identity/legend payload.
- Resolve camera positions, look targets, VFX positions, radii, and safety clearances from live rotor `R`, `H`, ground level, and viewport aspect.
- Keep scenario definitions declarative while removing fixed-world-scale assumptions from all six scenarios.
- Give every cinematic step a stable title, short explanation, active target, legend entries, metric evidence, and reference citation.

### 2. Replace competing camera behaviors with one camera controller
- Make a single controller arbitrate between `scripted`, `manual`, and optional `ambient orbit` modes.
- Frame the full rotor plus active scenario actor rather than only lerping toward hardcoded points.
- Release camera ownership immediately on pause/stop or direct pointer interaction; provide a clear “return to guided view” action.
- Scale near/far planes, minimum distance, and floor clearance from scene bounds.
- Add portrait/mobile compensation so identical steps remain inspectable on narrow canvases.

### 3. Make building placement measured and occlusion-aware
- Add a measured-bounds callback to `GlbModel` after auto-fit and ground alignment.
- Feed fitted world-space bounds from `ScenarioStage` into the camera framing controller.
- Reject camera positions inside expanded actor bounds and test the camera-to-look-target segment against those bounds; push to a safe alternate angle when blocked.
- Keep main-menu actors in the existing distant ring, but apply measured center-exclusion and a maximum projected screen size so a malformed model cannot dominate the viewport.
- Wrap each optional stage GLB in an isolated loader/error boundary with a lightweight procedural fallback so one model cannot crash the entire R3F canvas.

### 4. Build actual guided condition modes
- Connect director step changes to visible 3D state rather than zoom-only narration.
- Implement targeted blade/rotor/hub/wake/inflow highlighting with emissive emphasis, outline/rim treatment, and reduced emphasis on non-target geometry.
- Add persistent analytical layers appropriate to each step: force vectors, angle-of-attack/stall bands, pressure/load distribution, wake deficit envelope, turbulence region, and recirculation direction.
- Make seek/previous/next rebuild deterministic step state and VFX instead of only changing time.
- Redesign the cinema overlay as a responsive, non-overlapping lower band containing step progress, legend, evidence metrics, citation, and transport controls; allow collapse without losing playback state.

### 5. Unify the aerodynamic result contract
- Extend BEM and VAWT output with normalized per-blade metrics: power, torque, thrust, efficiency/Cp contribution, angle of attack, stall fraction, and peak-load station.
- Preserve station-level `dT`/`dQ` data and aggregate it consistently for every rotor family.
- Use one authoritative physics result for visual omega/RPM, diagnostics, HUD values, stress highlights, and total power rather than independent display formulas.
- Represent simplified stock turbines as an explicit “estimated” calculation tier while imported Blade Lab geometry uses the detailed solver; label the tier in the UI instead of silently mixing formulas.

### 6. Replace popup chaos with professional telemetry
- Mount a revised turbine HUD in the simulation for selected/hovered turbines only, with a compact default and an inspect-expanded state.
- Anchor labels outside the rotor disk, fade by camera distance and view angle, and hide/fade behind geometry using measured occlusion rather than forcing DOM above the scene.
- Replace global hit callbacks with typed turbine/blade-attributed events carrying tick, position, local speed, force, energy, and event kind.
- Render hits as depth-tested 3D markers/trails near the physical contact point; keep DOM text in one side telemetry rail or selected-event inspector rather than over airflow.
- Compute rolling power, cumulative kJ, hit rate, TSR, RPM, Cp, thrust, and per-blade imbalance from the same event/physics stream.

### 7. Make visualization deterministic and frame-rate independent
- Add a fixed-step simulation clock for rotor phase, energy integration, and hit emission.
- Introduce a seeded scenario/turbine RNG for particle initialization and purely visual variation.
- Remove random suppression of valid collision/absorption events; use deterministic rate limiting and clustering to prevent overload.
- Drive rotor animation from physics omega so the visible axis, RPM, TSR, and generated power remain coherent after recovery, scrubbing, or scenario changes.

### 8. Wire Blade Lab transfer into the simulator
- Include geometry, solver tier, calibration, site/scenario, seed, and visualization settings in the transferred preset.
- During teleport, precompute the destination aerodynamic snapshot and transition into the matching rotor phase/camera frame instead of loading a disconnected default state.
- In the simulator, expose the same per-blade metrics and guided highlight vocabulary used in Blade Lab so diagnosis continues seamlessly.

## Validation
- Add numeric tests for BEM/VAWT per-blade sums: blade totals must reconcile with rotor torque, thrust, and power within tolerance.
- Add deterministic tests: identical seed + inputs + fixed ticks must produce identical rotor phase, events, and cumulative kJ.
- Add camera geometry tests for small/large HAWT, Darrieus, Gorlov, Savonius, and Archimedes rotors with all building stages; camera must remain outside actor bounds with a clear target line.
- Run browser scenarios at desktop and mobile aspect ratios: play, pause, scrub, previous/next, manual camera takeover, guided-view return, model fallback, and Blade Lab-to-simulator transfer.
- Capture visual checks proving: rotor and highlighted target remain visible, overlays do not cover controls, airflow remains readable through rotor disks, and no GLB exceeds its permitted projected footprint.

## Delivery order
1. Camera ownership + normalized framing + GLB error isolation.
2. Guided step/highlight/legend pipeline.
3. Unified per-blade solver result and omega synchronization.
4. Typed deterministic event stream + depth-aware HUD/markers.
5. Transfer continuity and complete desktop/mobile browser verification.