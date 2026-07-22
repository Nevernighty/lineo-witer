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
}: Props) {
  const { camera } = useThree();
  const centre = useRef(new THREE.Vector3(...rotorCenter));

  useFrame(() => {
    if (!enabled || !cue) return;
    _target.set(...cue.pos);
    _look.set(...cue.look);

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

    const k = cue.lerp ?? 0.06;
    camera.position.lerp(_target, k);
    camera.lookAt(_look);
  });
  return null;
}
