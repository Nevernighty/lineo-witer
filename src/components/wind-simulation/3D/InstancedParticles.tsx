import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ParticleBuffer } from './AdvancedParticleSystem';

interface InstancedParticlesProps {
  bufferRef: React.RefObject<ParticleBuffer>;
  impactMultiplier?: number;
  trailLengthMultiplier?: number;
  windAngle?: number;
  glowIntensity?: number;
  pulsation?: number;
  preset?: string;
}

// --- 5 custom geometries ---

function createStandardGeometry(): THREE.BufferGeometry {
  // Smooth elongated teardrop — natural wind particle
  const segments = 10;
  const verts: number[] = [];
  const indices: number[] = [];
  // Generate teardrop profile: wide front tapering to thin tail
  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0=head, 1=tail
    // Radius: max at 0.2, tapering to 0 at both ends
    const r = Math.sin(t * Math.PI) * (1 - t * 0.6) * 0.18;
    const z = 0.3 - t * 1.5; // head at +0.3, tail at -1.2
    for (let j = 0; j < 6; j++) {
      const a = (j / 6) * Math.PI * 2;
      verts.push(Math.cos(a) * r, Math.sin(a) * r, z);
    }
  }
  // Connect rings
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < 6; j++) {
      const c = i * 6 + j;
      const n = i * 6 + ((j + 1) % 6);
      const c2 = (i + 1) * 6 + j;
      const n2 = (i + 1) * 6 + ((j + 1) % 6);
      indices.push(c, n, c2, n, n2, c2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createSmokeGeometry(): THREE.BufferGeometry {
  // Soft rounded puff — 12-sided for smoothness
  const segments = 12;
  const verts: number[] = [0, 0, 0];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const wobble = 0.9 + Math.sin(a * 3) * 0.1;
    verts.push(Math.cos(a) * 0.4 * wobble, Math.sin(a) * 0.12, Math.sin(a) * 0.4 * wobble);
  }
  const indices: number[] = [];
  for (let i = 1; i <= segments; i++) {
    indices.push(0, i, i < segments ? i + 1 : 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createArrowGeometry(): THREE.BufferGeometry {
  const verts = new Float32Array([
    0, 0, 0.4, -0.35, 0, -0.2, -0.1, 0, 0, 0, 0, -1.0, 0.1, 0, 0, 0.35, 0, -0.2,
  ]);
  const indices = [0,1,2, 0,2,3, 0,3,4, 0,4,5, 0,2,1, 0,3,2, 0,4,3, 0,5,4];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createSparkGeometry(): THREE.BufferGeometry {
  const verts = new Float32Array([
    0,0,0.15, -0.08,0,0, 0,0,-0.15, 0.08,0,0, 0,0.08,0, 0,-0.08,0,
  ]);
  const indices = [0,1,4, 0,4,3, 2,3,4, 2,4,1, 0,5,1, 0,3,5, 2,1,5, 2,5,3];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createStreamGeometry(): THREE.BufferGeometry {
  // Smooth tapered comet using rings
  const segments = 8;
  const verts: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const r = (1 - t) * 0.2 + 0.02;
    const z = 0.3 - t * 2.3;
    for (let j = 0; j < 5; j++) {
      const a = (j / 5) * Math.PI * 2;
      verts.push(Math.cos(a) * r, Math.sin(a) * r, z);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < 5; j++) {
      const c = i * 5 + j, n = i * 5 + ((j + 1) % 5);
      const c2 = (i + 1) * 5 + j, n2 = (i + 1) * 5 + ((j + 1) % 5);
      indices.push(c, n, c2, n, n2, c2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const PRESET_CONFIG: Record<string, { baseSizeMul: number; opacity: number; tailScale: number }> = {
  standard: { baseSizeMul: 1.0, opacity: 0.85, tailScale: 0.8 },
  smoke:    { baseSizeMul: 1.8, opacity: 0.45, tailScale: 0.4 },
  arrows:   { baseSizeMul: 1.1, opacity: 0.9, tailScale: 1.0 },
  sparks:   { baseSizeMul: 0.5, opacity: 0.95, tailScale: 0.3 },
  streams:  { baseSizeMul: 0.9, opacity: 0.8, tailScale: 1.2 },
};

const getSpeedColor = (c: THREE.Color, speed: number, hasCollided: boolean, absorbed: boolean, impactMul: number, glow: number) => {
  const maxSpeed = 18;
  const t = Math.min(speed / maxSpeed, 1);
  const time = Date.now() * 0.001;

  if (absorbed) {
    // Bright WHITE flash (first 30%) → vivid GREEN glow dissolve
    const phase = (Math.sin(time * 12) + 1) * 0.5;
    if (phase < 0.3) {
      // Pure white flash
      const w = 1.0 + (0.3 - phase) * 1.5;
      c.setRGB(w, w, w);
    } else {
      // Vivid saturated green with strong pulsation
      const gPulse = 0.85 + Math.sin(time * 18) * 0.35;
      c.setRGB(
        0.05,
        Math.min(1.5, (1.1 + Math.sin(time * 24) * 0.2) * gPulse),
        0.1
      );
    }
    return;
  }

  if (hasCollided) {
    // Bright RED glow with pulsation — very high contrast vs white wind
    const pulse = 0.9 + Math.sin(time * 15) * 0.15;
    const intensity = Math.min(t * impactMul, 1);
    c.setRGB(
      Math.min(1.5, (1.0 + intensity * 0.5) * pulse),
      Math.max(0, 0.08 - intensity * 0.06),
      0.02
    );
    return;
  }

  // Default wind: white-grey transparent, subtle speed shift
  const base = 0.55 + t * 0.25; // 0.55 → 0.80
  const blueShift = 0.6 + t * 0.2; // slightly cooler tone
  c.setRGB(base * 0.95, base * 0.95, blueShift);
};

export const InstancedParticles: React.FC<InstancedParticlesProps> = ({
  bufferRef,
  impactMultiplier = 1.0,
  trailLengthMultiplier = 1.0,
  windAngle = 0,
  glowIntensity = 1.0,
  pulsation = 0,
  preset = 'standard'
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const particleGeometry = useMemo(() => {
    switch (preset) {
      case 'smoke': return createSmokeGeometry();
      case 'arrows': return createArrowGeometry();
      case 'sparks': return createSparkGeometry();
      case 'streams': return createStreamGeometry();
      default: return createStandardGeometry();
    }
  }, [preset]);

  const presetCfg = PRESET_CONFIG[preset] || PRESET_CONFIG.standard;

  const particleMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: Math.min(1, presetCfg.opacity * Math.max(glowIntensity * 1.8, 0.5)),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [presetCfg.opacity, glowIntensity]);

  const maxCount = useRef(2000);
  const arrowAngleRad = (windAngle * Math.PI) / 180;

  useFrame((state) => {
    if (!meshRef.current || !bufferRef.current) return;
    const buf = bufferRef.current;
    const count = buf.count;
    const time = state.clock.elapsedTime;

    if (count > maxCount.current) maxCount.current = count;

    const pulseMul = pulsation > 0 ? 1 + Math.sin(time * (2 + pulsation * 3)) * pulsation * 0.15 : 1;
    const tailMul = trailLengthMultiplier * presetCfg.tailScale;
    const sizeMul = presetCfg.baseSizeMul;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const px = buf.positions[i3];
      const py = buf.positions[i3 + 1];
      const pz = buf.positions[i3 + 2];
      const vx = buf.velocities[i3];
      const vy = buf.velocities[i3 + 1];
      const vz = buf.velocities[i3 + 2];
      const size = buf.sizes[i];
      const flags = buf.flags[i];
      const hasCollided = (flags & 1) !== 0;
      const isAbsorbed = (flags & 2) !== 0;

      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

      dummy.position.set(px, py, pz);

      if (speed > 0.1) {
        dummy.lookAt(px + vx, py + vy, pz + vz);
      }

      let baseScale = size * sizeMul * (hasCollided ? impactMultiplier * 1.4 : 1);
      if (isAbsorbed) {
        // Dramatic pulsation during dissolve — energy extraction VFX with splitting look
        const absorbPhase = Math.sin(time * 22 + i * 0.7);
        baseScale *= 1.6 + absorbPhase * 0.7 + Math.sin(time * 35 + i * 1.3) * 0.25;
      }

      const tailLength = 1 + speed * 0.12 * tailMul;
      const cappedTail = Math.min(tailLength, 60.0);
      const lateralSize = baseScale * 0.8;
      const pulse = pulseMul * (1 + Math.sin(time * 3 + i * 0.5) * 0.03);

      dummy.scale.set(
        lateralSize * pulse,
        lateralSize * pulse,
        baseScale * cappedTail * pulse
      );

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      if (meshRef.current!.instanceColor) {
        getSpeedColor(tempColor, speed, hasCollided, isAbsorbed, impactMultiplier, glowIntensity);
        meshRef.current!.instanceColor.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  const count = Math.max(maxCount.current, 1);
  const instanceColors = useMemo(() => {
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = 0.1;
      colors[i * 3 + 1] = 0.5;
      colors[i * 3 + 2] = 0.9;
    }
    return colors;
  }, [count]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[particleGeometry, particleMaterial, count]} frustumCulled={false}>
        <instancedBufferAttribute attach="instanceColor" args={[instanceColors, 3]} />
      </instancedMesh>

      {/* Wind direction arrow */}
      <group position={[-45, 1, -45]}>
        <mesh position={[Math.cos(arrowAngleRad) * 3, 0.5, Math.sin(arrowAngleRad) * 3]} rotation={[0, -arrowAngleRad + Math.PI / 2, 0]}>
          <coneGeometry args={[0.6, 1.5, 6]} />
          <meshBasicMaterial color="#39ff14" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, 0.5, 0]} rotation={[0, -arrowAngleRad + Math.PI / 2, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 6, 6]} />
          <meshBasicMaterial color="#39ff14" transparent opacity={0.3} />
        </mesh>
      </group>
    </group>
  );
};
