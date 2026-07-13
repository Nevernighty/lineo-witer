// ScenarioStage — 3D actors specific to a scenario (parapet, ridge, upstream rotor + wake).

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StageId } from './types';

interface Props { stage: StageId; R: number; H: number; isVAWT: boolean; V: number; }

export function ScenarioStage({ stage, R, H, isVAWT, V }: Props) {
  if (stage === 'rooftop') return <RooftopStage R={R} H={H} isVAWT={isVAWT} />;
  if (stage === 'ridge')   return <RidgeStage R={R} H={H} isVAWT={isVAWT} />;
  if (stage === 'wake')    return <WakeStage R={R} H={H} isVAWT={isVAWT} V={V} />;
  return null;
}

function RooftopStage({ R, H, isVAWT }: { R: number; H: number; isVAWT: boolean }) {
  const groundY = isVAWT ? -H / 2 - R * 0.1 : -R * 1.1;
  return (
    <group>
      {/* Roof slab */}
      <mesh position={[0, groundY + R * 0.05, R * 1.2]}>
        <boxGeometry args={[R * 6, R * 0.1, R * 4]} />
        <meshStandardMaterial color="#2a2a30" roughness={0.9} />
      </mesh>
      {/* Parapet upstream */}
      <mesh position={[0, groundY + R * 0.55, -R * 0.8]}>
        <boxGeometry args={[R * 6, R * 0.9, R * 0.15]} />
        <meshStandardMaterial color="#3a3a40" roughness={0.85} />
      </mesh>
    </group>
  );
}

function RidgeStage({ R, H, isVAWT }: { R: number; H: number; isVAWT: boolean }) {
  const groundY = isVAWT ? -H / 2 - R * 0.1 : -R * 1.1;
  const geom = useMemo(() => {
    const w = R * 12, d = R * 10, seg = 64;
    const g = new THREE.PlaneGeometry(w, d, seg, seg);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // gentle Gaussian ridge running along X, peak near z=0
      const h = R * 1.2 * Math.exp(-(y * y) / (2 * (R * 1.6) * (R * 1.6)));
      pos.setZ(i, h);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [R]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY, 0]} geometry={geom}>
        <meshStandardMaterial color="#1a2820" roughness={1} />
      </mesh>
    </group>
  );
}

function WakeStage({ R, H, isVAWT, V }: { R: number; H: number; isVAWT: boolean; V: number }) {
  const spinRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (spinRef.current) spinRef.current.rotation.z += dt * 0.6; });
  // Upstream ghost rotor at 5D on -Z
  const upstreamZ = -R * 10;
  // Wake cone travelling +Z (freestream direction assumed)
  const coneGeom = useMemo(() => {
    const len = Math.abs(upstreamZ) + R * 2;
    const g = new THREE.CylinderGeometry(R * 0.95, R * 1.6, len, 32, 1, true);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, upstreamZ + len / 2);
    return g;
  }, [R, upstreamZ]);
  return (
    <group>
      {/* Upstream ghost rotor */}
      <group position={[0, 0, upstreamZ]}>
        <mesh>
          <cylinderGeometry args={[R * 0.06, R * 0.06, H, 12]} />
          <meshBasicMaterial color="#8899aa" transparent opacity={0.35} />
        </mesh>
        <group ref={spinRef}>
          {[0, 1, 2].map(i => (
            <mesh key={i} rotation={[0, 0, (i * 2 * Math.PI) / 3]}>
              <boxGeometry args={[R * 0.08, R * 1.9, R * 0.03]} />
              <meshBasicMaterial color="#a0b8c8" transparent opacity={0.35} />
            </mesh>
          ))}
        </group>
      </group>
      {/* Wake cone */}
      <mesh geometry={coneGeom}>
        <meshBasicMaterial color="#4488cc" transparent opacity={0.10} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}
