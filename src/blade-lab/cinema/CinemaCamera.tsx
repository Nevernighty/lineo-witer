// CinemaCamera — smoothly lerps the R3F camera to a scripted cue when active.

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraCue } from './types';

interface Props { cue: CameraCue | null; enabled: boolean; }

export function CinemaCamera({ cue, enabled }: Props) {
  const target = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const { camera } = useThree();
  useFrame(() => {
    if (!enabled || !cue) return;
    target.current.set(...cue.pos);
    look.current.set(...cue.look);
    const k = cue.lerp ?? 0.06;
    camera.position.lerp(target.current, k);
    camera.lookAt(look.current);
  });
  return null;
}
