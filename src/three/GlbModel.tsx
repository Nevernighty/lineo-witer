// GLB loader with body/rotor auto-split + optional bbox auto-fit.
// If the GLB ships animation clips, play them.
// Otherwise auto-detect the rotor subtree by name heuristics and spin only that.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  /** If set, normalise the model so its largest bbox axis equals this many world units. */
  fitSize?: number;
  /** If true, drop the model so its lowest bbox point sits on y=position[1]. */
  groundAlign?: boolean;
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
  fitSize,
  groundAlign,
}: GlbModelProps) {
  const gltf = useGLTF(url);
  const outerRef = useRef<THREE.Group>(null);
  const fitRef = useRef<THREE.Group>(null);
  const rotorRef = useRef<THREE.Object3D | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [fitOffsetY, setFitOffsetY] = useState(0);

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

  // Measure bbox after mount to derive auto-fit + ground alignment.
  useLayoutEffect(() => {
    if (!fitSize && !groundAlign) return;
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    const s = fitSize ? fitSize / maxAxis : 1;
    setFitScale(s);
    if (groundAlign) {
      // After scaling by `s`, lift so lowest point sits at y=0 (inside outer group).
      setFitOffsetY(-box.min.y * s);
    } else {
      setFitOffsetY(0);
    }
  }, [scene, fitSize, groundAlign]);

  useFrame((_, dt) => {
    if (names.length > 0) return;
    const target = rotorRef.current ?? scene;
    if (spin && target) {
      target.rotation[axis] += spin * dt;
    }
  });

  return (
    <group ref={outerRef} position={position} rotation={rotation} scale={scale as any}>
      <group ref={fitRef} scale={fitScale} position={[0, fitOffsetY, 0]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

export const preloadGlb = (url: string) => useGLTF.preload(url);
