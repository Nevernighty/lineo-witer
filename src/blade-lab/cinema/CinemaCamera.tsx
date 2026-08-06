// CinemaCamera — composes the shot from the scenario composition preset instead
// of raw cue coordinates. Distance is solved so the subject fits the *free*
// viewport band (canvas minus HUD insets), the look point is biased so the
// subject sits in the optical centre of that band, and the result is clamped
// against the stage floor and the rotor envelope so the camera can never sink
// into geometry.

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraCue } from './types';
import { FRAMING_MUL, type Composition } from './useComposition';
import type { HudInsets } from './hudLayout';

interface Props {
  cue: CameraCue | null;
  enabled: boolean;
  composition: Composition;
  hudInsets: HudInsets;
  /** Rotor centre in world space (stage mount aware). */
  rotorCenter?: [number, number, number];
  /** Radius of the sphere that must stay in frame. */
  subjectRadius: number;
  /** Stage floor height. */
  floorY?: number;
  sceneScale: number;
  onPark?: (pos: [number, number, number]) => void;
}

const _dir = new THREE.Vector3();
const _target = new THREE.Vector3();
const _look = new THREE.Vector3();
const _radial = new THREE.Vector3();

export function CinemaCamera({
  cue,
  enabled,
  composition,
  hudInsets,
  rotorCenter = [0, 0, 0],
  subjectRadius,
  floorY = 0,
  sceneScale,
  onPark,
}: Props) {
  const { camera, size } = useThree();
  const centre = useRef(new THREE.Vector3());
  const smoothLook = useRef(new THREE.Vector3());
  const parkedAt = useRef(0);
  const inited = useRef(false);

  centre.current.set(rotorCenter[0], rotorCenter[1], rotorCenter[2]);

  // Restore the parked camera position on scenario / composition change.
  useEffect(() => {
    if (!enabled || !composition.parked || inited.current) return;
    camera.position.set(...composition.parked);
    inited.current = true;
  }, [enabled, composition.parked, camera]);

  useEffect(() => { if (!enabled) inited.current = false; }, [enabled]);

  useFrame(() => {
    if (!enabled || !cue) return;

    const persp = camera as THREE.PerspectiveCamera;
    if (persp.isPerspectiveCamera && Math.abs(persp.fov - composition.fov) > 0.01) {
      persp.fov = composition.fov;
    }

    const cueScale = Math.max(0.15, sceneScale / 3);
    _dir.set(cue.pos[0], cue.pos[1], cue.pos[2]).multiplyScalar(cueScale);
    if (_dir.lengthSq() < 1e-6) _dir.set(0.7, 0.35, 1);
    _dir.normalize();

    const fovRad = (composition.fov * Math.PI) / 180;
    const aspect = Math.max(0.35, size.width / Math.max(1, size.height));
    const freeH = Math.max(120, size.height - hudInsets.top - hudInsets.bottom);
    const fit = Math.max(0.4, subjectRadius) * FRAMING_MUL[composition.framing];
    const tanHalf = Math.tan(fovRad / 2);
    // Vertical fit uses the free band only; horizontal fit uses the full width.
    const distV = (fit / tanHalf) * (size.height / freeH);
    const distH = fit / (tanHalf * aspect);
    const dist = Math.max(distV, distH);

    _target.copy(centre.current).addScaledVector(_dir, dist);
    // The authored cue also carries a height intent — respect its elevation ratio.
    const elevation = cue.pos[1] === 0 ? 0.28 : Math.max(-0.2, Math.min(0.85, cue.pos[1] / Math.max(0.001, Math.hypot(cue.pos[0], cue.pos[2]))));
    _target.y = centre.current.y + dist * elevation * 0.55;

    _look
      .set(cue.look[0], cue.look[1], cue.look[2])
      .multiplyScalar(cueScale)
      .add(centre.current)
      .addScaledVector(new THREE.Vector3(...composition.lookBias), sceneScale);

    // Push the subject into the optical centre of the free band.
    const shift = dist * tanHalf * ((hudInsets.bottom - hudInsets.top) / Math.max(1, size.height));
    _look.y -= shift;

    // Clamp: floor clearance.
    const minY = floorY + subjectRadius * composition.floorClearance;
    if (_target.y < minY) _target.y = minY;

    // Clamp: keep a minimum horizontal distance from the rotor axis.
    const safeRadius = Math.max(0.3, subjectRadius * composition.minDistanceR);
    _radial.set(_target.x - centre.current.x, 0, _target.z - centre.current.z);
    const d = _radial.length();
    if (d < safeRadius) {
      if (d < 1e-3) _radial.set(0, 0, 1);
      _radial.setLength(safeRadius);
      _target.x = centre.current.x + _radial.x;
      _target.z = centre.current.z + _radial.z;
    }

    const k = 1 - Math.pow(1 - (cue.lerp ?? 0.06), 1.5);
    camera.position.lerp(_target, k);
    if (smoothLook.current.lengthSq() === 0) smoothLook.current.copy(_look);
    smoothLook.current.lerp(_look, k);
    camera.near = Math.max(0.02, sceneScale * 0.004);
    camera.far = Math.max(500, sceneScale * 40);
    camera.updateProjectionMatrix();
    camera.lookAt(smoothLook.current);

    // Park the shot roughly once a second so it can be restored later.
    const now = performance.now();
    if (onPark && now - parkedAt.current > 1200) {
      parkedAt.current = now;
      onPark([camera.position.x, camera.position.y, camera.position.z]);
    }
  });
  return null;
}
