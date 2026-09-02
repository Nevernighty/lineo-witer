// One CDN-hosted turbine part: auto-centred, role-coloured, hover/select aware.
import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PlacedPart } from '@/data/turbineParts/layout';
import { ROLE_COLOR } from '@/data/turbineParts/types';

interface Props {
  placed: PlacedPart;
  explode: number;
  /** 'assembled' | 'ghosted' | 'hidden' visual state driven by the UI. */
  dim: boolean;
  hidden: boolean;
  selected: boolean;
  hovered: boolean;
  xray: boolean;
  /** Guided assembly: 0 = parked outside, 1 = seated. Overrides `explode` when set. */
  place?: number;
  /** Part belongs to the sub-assembly currently being explained. */
  active?: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

export function PartMesh({
  placed, explode, dim, hidden, selected, hovered, xray, place, active, onHover, onSelect,
}: Props) {
  const { scene } = useGLTF(placed.part.url);
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const color = ROLE_COLOR[placed.part.role];

  // Clone, centre AND re-scale each GLB to its catalogued extent, so parts
  // exported in different units (mm vs m) all share one layout space.
  const { model, fit } = useMemo(() => {
    const c = scene.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const centre = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(centre);
    box.getSize(size);
    c.position.sub(centre);
    const measured = Math.max(size.x, size.y, size.z) || 1;
    const wanted = Math.max(...placed.part.ext) || measured;
    return { model: c, fit: wanted / measured };
  }, [scene, placed.part.ext]);

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness: 0.15,
    roughness: 0.6,
    transparent: true,
    side: THREE.DoubleSide,
  }), [color]);


  useEffect(() => {
    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.material = material; m.castShadow = true; m.receiveShadow = true; }
    });
  }, [model, material]);

  useEffect(() => () => material.dispose(), [material]);

  const target = useRef(new THREE.Vector3());
  const scaleTarget = useRef(new THREE.Vector3(1, 1, 1));
  const emissive = useRef(0);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const k = Math.min(1, dt * 6);
    const off = place != null ? 1 - place : explode;
    target.current.set(
      placed.pos[0] + placed.dir[0] * placed.travel * off,
      placed.pos[1] + placed.dir[1] * placed.travel * off,
      placed.pos[2] + placed.dir[2] * placed.travel * off,
    );
    g.position.lerp(target.current, k);

    const pulse = active ? 0.25 + 0.2 * Math.sin(state.clock.elapsedTime * 3.4) : 0;
    const wantEm = selected ? 0.85 : hovered ? 0.5 : pulse;
    emissive.current += (wantEm - emissive.current) * k;
    material.emissive.set(color);
    material.emissiveIntensity = emissive.current;

    const parked = place != null && place < 0.02 && !active;
    const wantOpacity = hidden ? 0 : xray ? 0.28 : dim ? 0.18 : parked ? 0.12 : 1;
    material.opacity += (wantOpacity - material.opacity) * k;
    material.depthWrite = material.opacity > 0.9;
    g.visible = material.opacity > 0.02;

    const s = selected ? 1.04 : hovered ? 1.02 : 1;
    if (inner.current) {
      scaleTarget.current.set(s, s, s);
      inner.current.scale.lerp(scaleTarget.current, k);
    }
  });

  return (
    <group
      ref={group}
      position={placed.pos}
      onPointerOver={(e) => { e.stopPropagation(); onHover(placed.part.id); }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
      onClick={(e) => { e.stopPropagation(); onSelect(placed.part.id); }}
    >
      <group ref={inner} rotation={[0, placed.spin, 0]}>
        <primitive object={model} />
      </group>
    </group>
  );
}
