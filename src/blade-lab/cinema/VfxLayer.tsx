// VfxLayer — renders active VfxBus events inside the R3F canvas.

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { VfxBus, VfxEvent } from './VfxBus';

interface Props { bus: VfxBus; scale?: number; center?: [number, number, number]; }

export function VfxLayer({ bus, scale = 1, center = [0, 0, 0] }: Props) {
  const [, tick] = useState(0);
  useEffect(() => bus.subscribe(() => tick(n => n + 1)), [bus]);
  useFrame(() => {
    if (bus.prune(performance.now() / 1000)) tick(n => n + 1);
  });
  return (
    <group position={center}>
      <group scale={scale}>
        {bus.active.map(ev => <VfxItem key={ev.id} ev={ev} />)}
      </group>
    </group>
  );
}

function ageOf(ev: VfxEvent) {
  const a = performance.now() / 1000 - ev.born;
  return Math.max(0, Math.min(1, a / ev.ttl));
}

function VfxItem({ ev }: { ev: VfxEvent }) {
  switch (ev.kind) {
    case 'arrow': return <ArrowFx ev={ev} />;
    case 'pulse': return <PulseFx ev={ev} />;
    case 'shockwave': return <ShockFx ev={ev} />;
    case 'label3d': return <LabelFx ev={ev} />;
    case 'windPatch': return <WindPatchFx ev={ev} />;
    case 'highlightBlade': return null; // rendered via BladeMesh spotlight target
    default: return null;
  }
}

function ArrowFx({ ev }: { ev: Extract<VfxEvent, { kind: 'arrow' }> }) {
  const ref = useRef<THREE.Group>(null);
  const dir = new THREE.Vector3(...ev.dir);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  useFrame(() => {
    if (!ref.current) return;
    const a = ageOf(ev);
    const s = Math.sin(Math.min(1, a * 3) * Math.PI * 0.5); // ease-in then fade
    ref.current.scale.setScalar(s);
    (ref.current.children as any[]).forEach(c => {
      c.material && (c.material.opacity = (1 - a) * 0.9);
    });
  });
  return (
    <group ref={ref} position={ev.pos} quaternion={q}>
      <mesh position={[0, len * 0.4, 0]}>
        <cylinderGeometry args={[len * 0.03, len * 0.03, len * 0.8, 12]} />
        <meshBasicMaterial color={ev.color} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, len * 0.9, 0]}>
        <coneGeometry args={[len * 0.08, len * 0.2, 16]} />
        <meshBasicMaterial color={ev.color} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function PulseFx({ ev }: { ev: Extract<VfxEvent, { kind: 'pulse' }> }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const a = ageOf(ev);
    const s = 0.2 + a * 1.6;
    ref.current.scale.setScalar(s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - a) * 0.85;
  });
  return (
    <mesh ref={ref} position={ev.pos} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[ev.radius, ev.radius * 0.06, 8, 48]} />
      <meshBasicMaterial color={ev.color} transparent opacity={0.85} />
    </mesh>
  );
}

function ShockFx({ ev }: { ev: Extract<VfxEvent, { kind: 'shockwave' }> }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const a = ageOf(ev);
    const s = 0.1 + a * 2.5;
    ref.current.scale.setScalar(s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - a) * 0.55;
  });
  return (
    <mesh ref={ref} position={ev.pos}>
      <sphereGeometry args={[ev.radius, 24, 16]} />
      <meshBasicMaterial color={ev.color} transparent opacity={0.55} wireframe />
    </mesh>
  );
}

function LabelFx({ ev }: { ev: Extract<VfxEvent, { kind: 'label3d' }> }) {
  const color = ev.color ?? '#7be7ff';
  return (
    <mesh position={ev.pos}>
      <ringGeometry args={[0.08, 0.11, 24]} />
      <meshBasicMaterial color={color} transparent opacity={1 - ageOf(ev)} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function WindPatchFx({ ev }: { ev: Extract<VfxEvent, { kind: 'windPatch' }> }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const a = ageOf(ev);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - a) * 0.55;
  });
  return (
    <group position={ev.pos}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[ev.size, 32]} />
        <meshBasicMaterial color={ev.color} transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} wireframe />
      </mesh>
    </group>
  );
}
