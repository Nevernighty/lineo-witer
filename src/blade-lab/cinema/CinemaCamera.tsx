// CinemaCamera — smoothly lerps the R3F camera to a scripted cue while keeping it
// outside the rotor and above the floor. Prevents the "camera sinks into the tower"
// bug seen when cues target points that clip geometry.

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraCue } from './types';

interface Props {
  cue: CameraCue | null;
  enabled: boolean;
  /** Rotor centre in world space (default 0,1,0). */
  rotorCenter?: [number, number, number];
  /** Minimum radial distance from the rotor axis. */
  safeRadius?: number;
  /** Minimum camera Y (floor clearance). */
  floorY?: number;
  sceneScale: number;
}

const _target = new THREE.Vector3();
const _look = new THREE.Vector3();
const _radial = new THREE.Vector3();

export function CinemaCamera({
  cue,
  enabled,
  rotorCenter = [0, 1, 0],
  safeRadius = 3.2,
  floorY = 0.6,
  sceneScale,
}: Props) {
  const { camera, size } = useThree();
  const centre = useRef(new THREE.Vector3(...rotorCenter));

  useFrame(() => {
    if (!enabled || !cue) return;
    const cueScale = Math.max(0.15, sceneScale / 3);
    _target.set(...cue.pos).multiplyScalar(cueScale);
    _look.set(...cue.look).multiplyScalar(cueScale);
    // The cinematic telemetry occupies the lower viewport. Aim slightly below
    // the physical target so the active rotor/stage sits in the clear upper 62%.
    _look.y -= sceneScale * (size.height < 760 ? 0.34 : 0.24);
    if (size.width < size.height) {
      // Resizable sidebars can make the canvas extremely tall and narrow.
      // Unbounded aspect compensation used to zoom 2–3× away, leaving a dead
      // upper half. A modest cap preserves framing without shrinking the actors.
      const radial = Math.min(1.28, Math.max(1.08, size.height / Math.max(1, size.width)));
      _target.x *= radial;
      _target.z *= radial;
    }

    // Clamp: never below the floor.
    if (_target.y < floorY) _target.y = floorY;

    // Clamp: keep a minimum horizontal distance from the rotor axis.
    _radial.set(_target.x - centre.current.x, 0, _target.z - centre.current.z);
    const d = _radial.length();
    if (d < safeRadius) {
      if (d < 1e-3) {
        // If cue is exactly on the axis, push it back on +Z.
        _radial.set(0, 0, 1);
      } else {
        _radial.multiplyScalar(safeRadius / d);
      }
      _target.x = centre.current.x + _radial.x;
      _target.z = centre.current.z + _radial.z;
    }

    const k = 1 - Math.pow(1 - (cue.lerp ?? 0.06), 1.5);
    camera.position.lerp(_target, k);
    camera.near = Math.max(0.02, sceneScale * 0.004);
    camera.far = Math.max(500, sceneScale * 40);
    camera.updateProjectionMatrix();
    camera.lookAt(_look);
  });
  return null;
}
