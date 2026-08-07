# Realistic wind, guided 3D highlights, scenario validation, stable Blade Lab

Four connected upgrades: a more physical wind/wake field in the simulator, step-by-step 3D highlights in Blade Lab cinematic mode that never block the view, an automatic pre-flight check for every scenario, and a rework of scenario staging so the blade never gets stuck and the transition to the simulation stays smooth.

## 1. More realistic wind, flow and influence zones

Current state: the simulator has both a power-law and a log-law shear profile plus a Jensen wake model in `src/simulation/`, but the particle system and obstacle wakes still use the older exponential deficit and a simple box-shadow wake test.

Changes:
- Make the log-law profile the default vertical speed profile, with a displacement height for urban/forest roughness so the flow above rooftops is not overspeeded.
- Route obstacle wakes through a proper expanding-cone model (near wake, transition, far wake) instead of the flat `computeWakeDeficit`, with roughness-dependent decay constants already defined in `wakeModel.ts`.
- Add a rooftop/ridge speed-up and separation-bubble term so particles accelerate over edges and stall in the recirculation zone behind them, instead of passing through unchanged.
- Add coherent gust structures (moving turbulence cells) rather than one global sine gust, so streams look organic and gust arrival is visible travelling through the domain.
- Tie streamline colour and particle speed to the locally sampled velocity, so influence zones (deficit, speed-up, recirculation) are readable directly from the flow.

## 2. Step-by-step 3D highlights in Blade Lab and cinematic modes

- Extend the VFX bus with a `step highlight` concept: each keyframe can declare flow arrows, a load zone on the blade, and control points (measurement markers) with short labels.
- Highlights render in 3D with depth-fade and always-on-top outlines, placed on the rotor envelope's free side relative to the camera, so they annotate without covering the rotor.
- A compact step rail (1..N) shows progress; the current step's highlights fade in, previous ones dim rather than vanish.
- Labels are billboarded, size-clamped, and pushed out of the HUD bands already tracked by `hudLayout.ts`.

## 3. Automatic scenario validation before playback

A validator runs when a scenario is selected and before playback starts, checking:
- Camera vs HUD collision — projected rotor bounds must fit the free viewport band.
- Camera vs geometry collision — camera path does not enter building/terrain meshes or drop below the floor.
- Subject visibility — rotor occupies a sane fraction of the frame at every camera cue.
- Scale sanity — rotor size vs stage building size vs mast height are in plausible ranges.
- Asset readiness — required GLBs resolved, otherwise fall back to primitives.

Results appear as a visible banner on the scenario card: green (ready), amber (auto-corrected, with the correction listed), red (blocked, with the reason). Auto-correctable issues (framing distance, look bias, mast offset) are fixed silently and reported in the amber state.

## 4. Stable scenario staging and transition

- Mount the rotor on an explicit stage anchor (roof deck, ridge crest, canyon floor) so it never intersects the building — anchors come from the stage definition, not from origin.
- Reset rotor transforms and animation state on every scenario change and on replay, clearing the "stuck blade" case.
- Clamp per-frame rotation/flex deltas so a scenario jump cannot leave the rotor mid-flex or spinning on a stale axis.
- Make the transition to the wind simulation deterministic: freeze the rotor pose, hand the exact geometry + site parameters to the teleport store, and resume in the simulator with the same pose and camera bearing.

## Technical notes

- Physics edits: `src/simulation/windField.ts`, `wakeModel.ts`, `obstacleModel.ts`, `terrainModel.ts`; consumers `AdvancedParticleSystem.tsx`, `WindPhysicsEngine.ts`, `WindSimulation3D.tsx`.
- Highlights: new `src/blade-lab/cinema/HighlightLayer.tsx` plus new event kinds in `VfxBus.ts`, keyframe field in `types.ts`, step rail in `CinemaPanel.tsx`.
- Validation: new `src/blade-lab/cinema/validateScenario.ts` called from `useDirector.ts`, using `hudLayout.ts` insets, `useComposition.ts` framing, and stage bounds from `ScenarioStage.tsx`.
- Staging/teleport: `ScenarioStage.tsx` anchors, `BladeMesh.tsx` reset guards, `useTeleportStore.ts` / `BladeTeleport.tsx` pose handoff.
- All six scenarios (`s01`..`s06`) get anchors, highlight steps, and validated compositions.
