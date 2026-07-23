// ScenarioStage — 3D actors specific to a scenario. Now supports urban stages
// backed by the user-uploaded building GLBs.

import { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StageId } from './types';
import { GlbModel } from '@/three/GlbModel';
import { BUILDING_MODELS } from '@/assets/buildings';

interface Props { stage: StageId; R: number; H: number; isVAWT: boolean; V: number; }

export function ScenarioStage({ stage, R, H, isVAWT, V }: Props) {
  if (stage === 'rooftop')        return <RooftopStage R={R} H={H} isVAWT={isVAWT} />;
  if (stage === 'rooftop_5floor') return <Rooftop5Stage R={R} H={H} isVAWT={isVAWT} />;
  if (stage === 'ridge')          return <RidgeStage R={R} H={H} isVAWT={isVAWT} />;
  if (stage === 'ridge_spire')    return <RidgeSpireStage R={R} H={H} isVAWT={isVAWT} />;
  if (stage === 'urban_canyon')   return <UrbanCanyonStage R={R} H={H} isVAWT={isVAWT} V={V} />;
  if (stage === 'wake')           return <WakeStage R={R} H={H} isVAWT={isVAWT} V={V} />;
  return null;
}

function groundY(R: number, H: number, isVAWT: boolean) {
  return isVAWT ? -H / 2 - R * 0.1 : -R * 1.1;
}

function RooftopStage({ R, H, isVAWT }: { R: number; H: number; isVAWT: boolean }) {
  const gY = groundY(R, H, isVAWT);
  return (
    <group>
      <mesh position={[0, gY + R * 0.05, R * 1.2]}>
        <boxGeometry args={[R * 6, R * 0.1, R * 4]} />
        <meshStandardMaterial color="#2a2a30" roughness={0.9} />
      </mesh>
      <mesh position={[0, gY + R * 0.55, -R * 0.8]}>
        <boxGeometry args={[R * 6, R * 0.9, R * 0.15]} />
        <meshStandardMaterial color="#3a3a40" roughness={0.85} />
      </mesh>
    </group>
  );
}

// Real 5-storey apartment block underneath, turbine sits on the roof plane.
function Rooftop5Stage({ R, H, isVAWT }: { R: number; H: number; isVAWT: boolean }) {
  const gY = groundY(R, H, isVAWT);
  const spec = BUILDING_MODELS.slavutych5;
  const targetSize = R * 6; // scale building so it dwarfs the rotor
  return (
    <group>
      <Suspense fallback={null}>
        <GlbModel url={spec.url} position={[0, gY, 0]} fitSize={targetSize} groundAlign spin={0} />
      </Suspense>
      {/* Parapet upstream to keep the recirculation lesson intact */}
      <mesh position={[0, gY + spec.roofHeight * (targetSize / spec.targetSize) + R * 0.35, -R * 0.9]}>
        <boxGeometry args={[R * 5, R * 0.7, R * 0.15]} />
        <meshStandardMaterial color="#3a3a40" roughness={0.85} />
      </mesh>
    </group>
  );
}

function RidgeStage({ R, H, isVAWT }: { R: number; H: number; isVAWT: boolean }) {
  const gY = groundY(R, H, isVAWT);
  const geom = useMemo(() => {
    const w = R * 12, d = R * 10, seg = 64;
    const g = new THREE.PlaneGeometry(w, d, seg, seg);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const h = R * 1.2 * Math.exp(-(y * y) / (2 * (R * 1.6) * (R * 1.6)));
      pos.setZ(i, h);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [R]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, gY, 0]} geometry={geom}>
      <meshStandardMaterial color="#1a2820" roughness={1} />
    </mesh>
  );
}

// Ridge with a real spire silhouette instead of an abstract Gaussian bump.
function RidgeSpireStage({ R, H, isVAWT }: { R: number; H: number; isVAWT: boolean }) {
  const gY = groundY(R, H, isVAWT);
  const spec = BUILDING_MODELS.krSpire;
  return (
    <group>
      <RidgeStage R={R} H={H} isVAWT={isVAWT} />
      <Suspense fallback={null}>
        <GlbModel url={spec.url} position={[-R * 4, gY, -R * 3]} fitSize={R * 4} groundAlign spin={0} />
      </Suspense>
    </group>
  );
}

// Two panel blocks flanking the rotor to demonstrate Venturi speed-up.
function UrbanCanyonStage({ R, H, isVAWT, V }: { R: number; H: number; isVAWT: boolean; V: number }) {
  const gY = groundY(R, H, isVAWT);
  const left  = BUILDING_MODELS.panelKT;
  const right = BUILDING_MODELS.panel12160;
  const kiosk = BUILDING_MODELS.kiosk;
  return (
    <group>
      <Suspense fallback={null}>
        <GlbModel url={left.url}  position={[-R * 3.2, gY, -R * 0.5]} fitSize={R * 5} groundAlign spin={0} />
        <GlbModel url={right.url} position={[ R * 3.2, gY, -R * 0.5]} fitSize={R * 5} groundAlign spin={0} />
        <GlbModel url={kiosk.url} position={[ R * 0.0, gY,  R * 3.8]} fitSize={R * 1.4} groundAlign spin={0} />
      </Suspense>
      {/* Air-gap indicator: subtle green plane between the buildings */}
      <mesh position={[0, gY + R * 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[R * 2.4, R * 4]} />
        <meshBasicMaterial color="#33ff99" transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function WakeStage({ R, H, isVAWT }: { R: number; H: number; isVAWT: boolean; V: number }) {
  const spinRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (spinRef.current) spinRef.current.rotation.z += dt * 0.6; });
  const upstreamZ = -R * 10;
  const coneGeom = useMemo(() => {
    const len = Math.abs(upstreamZ) + R * 2;
    const g = new THREE.CylinderGeometry(R * 0.95, R * 1.6, len, 32, 1, true);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, upstreamZ + len / 2);
    return g;
  }, [R, upstreamZ]);
  return (
    <group>
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
      <mesh geometry={coneGeom}>
        <meshBasicMaterial color="#4488cc" transparent opacity={0.10} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}
