// GLB loader with body/rotor auto-split.
// If the GLB ships animation clips (Phoenix, animated variants), play them.
// Otherwise auto-detect the rotor subtree by name heuristics and spin only that.
import { useEffect, useMemo, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface GlbModelProps {
  url: string;
  scale?: number | [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** rad/s — used when the model has no animation clip. */
  spin?: number;
  /** Axis for procedural spin. Default 'y' (HAWT). */
  axis?: "x" | "y" | "z";
  /** Override rotor-node detector; return true for the node that should spin. */
  isRotorNode?: (obj: THREE.Object3D) => boolean;
}

const ROTOR_HINTS = /rotor|blade|prop|hub|spinner|impeller|savonius|darrieus|helix|fan/i;
const STATIC_HINTS = /tower|pole|mast|base|ground|nacelle|body|stand|frame/i;

function findRotor(root: THREE.Object3D, custom?: (o: THREE.Object3D) => boolean): THREE.Object3D | null {
  let hit: THREE.Object3D | null = null;
  root.traverse((o) => {
    if (hit) return;
    if (custom?.(o)) hit = o;
    else if (ROTOR_HINTS.test(o.name) && !STATIC_HINTS.test(o.name)) hit = o;
  });
  return hit;
}

export function GlbModel({
  url,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  spin = 0.6,
  axis = "y",
  isRotorNode,
}: GlbModelProps) {
  const gltf = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const rotorRef = useRef<THREE.Object3D | null>(null);

  // Clone the scene so multiple instances don't share transforms.
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const { actions, names } = useAnimations(gltf.animations, scene);

  useEffect(() => {
    if (names.length > 0) {
      names.forEach((n) => actions[n]?.reset().play());
      return;
    }
    rotorRef.current = findRotor(scene, isRotorNode);
  }, [actions, names, scene, isRotorNode]);

  useFrame((_, dt) => {
    if (names.length > 0) return;
    const target = rotorRef.current ?? scene;
    if (spin && target) {
      target.rotation[axis] += spin * dt;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale as any}>
      <primitive object={scene} />
    </group>
  );
}

// Preload helpers — call with the .url from a .asset.json pointer.
export const preloadGlb = (url: string) => useGLTF.preload(url);
