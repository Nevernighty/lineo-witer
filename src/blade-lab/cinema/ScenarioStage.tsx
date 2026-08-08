// ScenarioStage — 3D actors specific to a scenario. Now supports urban stages
// backed by the user-uploaded building GLBs.

import { Component, type ErrorInfo, type ReactNode, useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StageId } from './types';
import { GlbModel } from '@/three/GlbModel';
import { BUILDING_MODELS } from '@/assets/buildings';

interface Props { stage: StageId; R: number; H: number; isVAWT: boolean; V: number; }

class StageAssetBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* procedural fallback keeps the canvas alive */ }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function BuildingFallback({ position, size }: { position: [number, number, number]; size: number }) {
  return (
    <group position={position}>
      <mesh position={[0, size * 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[size * 0.8, size * 0.84, size * 0.38]} />
        <meshStandardMaterial color="#303943" roughness={0.92} />
      </mesh>
      {[-0.22, 0, 0.22].map((x) => [-0.16, 0.08, 0.32, 0.56].map((y) => (
        <mesh key={`${x}-${y}`} position={[x * size, y * size, size * 0.195]}>
          <planeGeometry args={[size * 0.11, size * 0.1]} />
          <meshBasicMaterial color="#7d9dad" />
        </mesh>
      )))}
    </group>
  );
}

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
  const targetSize = Math.min(R * 4.2, Math.max(R, H) * 3.4);
  return (
    <group>
      <StageAssetBoundary fallback={<BuildingFallback position={[0, gY, R * 2.4]} size={targetSize} />}>
        <Suspense fallback={<BuildingFallback position={[0, gY, R * 2.4]} size={targetSize} />}>
          <GlbModel url={spec.url} position={[0, gY, R * 2.4]} fitSize={targetSize} groundAlign spin={0} />
        </Suspense>
      </StageAssetBoundary>
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
    const w = R * 8, d = R * 7, seg = 48;
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
      <StageAssetBoundary fallback={<BuildingFallback position={[-R * 4, gY, -R * 3]} size={R * 4} />}>
        <Suspense fallback={<BuildingFallback position={[-R * 4, gY, -R * 3]} size={R * 4} />}>
          <GlbModel url={spec.url} position={[-R * 4, gY, -R * 3]} fitSize={R * 4} groundAlign spin={0} />
        </Suspense>
      </StageAssetBoundary>
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
      <StageAssetBoundary fallback={<><BuildingFallback position={[-R * 4.1, gY, -R * 0.5]} size={R * 3} /><BuildingFallback position={[R * 4.1, gY, -R * 0.5]} size={R * 3} /></>}>
        <Suspense fallback={<><BuildingFallback position={[-R * 4.1, gY, -R * 0.5]} size={R * 3} /><BuildingFallback position={[R * 4.1, gY, -R * 0.5]} size={R * 3} /></>}>
          <GlbModel url={left.url} position={[-R * 4.1, gY, -R * 0.5]} fitSize={Math.min(R * 4, H * 3)} groundAlign spin={0} />
          <GlbModel url={right.url} position={[R * 4.1, gY, -R * 0.5]} fitSize={Math.min(R * 4, H * 3)} groundAlign spin={0} />
          <GlbModel url={kiosk.url} position={[0, gY, R * 3.8]} fitSize={R * 1.4} groundAlign spin={0} />
        </Suspense>
      </StageAssetBoundary>
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
  const upstreamZ = -R * 4.6;
  const coneGeom = useMemo(() => {
    const len = Math.abs(upstreamZ) + R * 1.3;
    const g = new THREE.CylinderGeometry(R * 0.9, R * 1.42, len, 48, 1, true);
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
        <meshBasicMaterial color="#4488cc" transparent opacity={0.11} side={THREE.DoubleSide} depthWrite={false} wireframe />
      </mesh>
      {Array.from({ length: 7 }).map((_, i) => {
        const z = upstreamZ + (i + 1) * (Math.abs(upstreamZ) / 8);
        const radius = R * (0.92 + i * 0.065);
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius, R * 0.012, 6, 64]} />
            <meshBasicMaterial color={i > 4 ? '#ff8844' : '#4f8fe8'} transparent opacity={0.28} depthWrite={false} />
          </mesh>
        );
      })}
      {[-0.62, 0, 0.62].map((x, i) => (
        <mesh key={x} position={[x * R, 0, upstreamZ * 0.45]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[R * 0.018, R * 0.018, Math.abs(upstreamZ) * 0.82, 8]} />
          <meshBasicMaterial color={i === 1 ? '#7be7ff' : '#4f8fe8'} transparent opacity={0.38} />
        </mesh>
      ))}
    </group>
  );
}
