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
  // Tapered diamond: wide at center, pointed front and back
  const verts = new Float32Array([
    0, 0, -1.2,   // tail point (narrow)
    -0.3, 0, 0,   // left
    0, 0.08, 0,   // top center
    0.3, 0, 0,    // right
    0, -0.08, 0,  // bottom center
    0, 0, 0.3,    // head point
  ]);
  const indices = [
    0, 1, 2,  0, 2, 3,  0, 3, 4,  0, 4, 1, // tail cone
    5, 2, 1,  5, 3, 2,  5, 4, 3,  5, 1, 4, // head cone
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createSmokeGeometry(): THREE.BufferGeometry {
  // 8-sided soft circle — cloud puff
  const segments = 8;
  const verts: number[] = [0, 0, 0]; // center
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    verts.push(Math.cos(a) * 0.5, Math.sin(a) * 0.15, Math.sin(a) * 0.5);
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
  // Arrow/chevron shape
  const verts = new Float32Array([
    0, 0, 0.4,     // tip (front)
    -0.35, 0, -0.2, // left wing
    -0.1, 0, 0,     // left notch
    0, 0, -1.0,     // tail center
    0.1, 0, 0,      // right notch
    0.35, 0, -0.2,  // right wing
  ]);
  const indices = [
    0, 1, 2,  0, 2, 3,  0, 3, 4,  0, 4, 5, // top
    0, 2, 1,  0, 3, 2,  0, 4, 3,  0, 5, 4, // bottom (double-sided)
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createSparkGeometry(): THREE.BufferGeometry {
  // Tiny 4-pointed star
  const verts = new Float32Array([
    0, 0, 0.15,    // front
    -0.08, 0, 0,   // left
    0, 0, -0.15,   // back
    0.08, 0, 0,    // right
    0, 0.08, 0,    // top
    0, -0.08, 0,   // bottom
  ]);
  const indices = [
    0, 1, 4,  0, 4, 3,  2, 3, 4,  2, 4, 1,
    0, 5, 1,  0, 3, 5,  2, 1, 5,  2, 5, 3,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createStreamGeometry(): THREE.BufferGeometry {
  // Long tapered comet — wide head tapering to a thin tail
  const verts = new Float32Array([
    0, 0, 0.3,      // head tip
    -0.25, 0.06, 0,  // head left top
    0.25, 0.06, 0,   // head right top
    -0.25, -0.06, 0, // head left bottom
    0.25, -0.06, 0,  // head right bottom
    -0.06, 0, -1.5,  // tail left
    0.06, 0, -1.5,   // tail right
    0, 0, -2.0,      // tail tip
  ]);
  const indices = [
    0, 1, 2,  0, 3, 1,  0, 2, 4,  0, 4, 3, // head
    1, 5, 6,  1, 6, 2,  3, 6, 5,  3, 4, 6, // mid body
    5, 7, 6,  6, 7, 5, // tail tip
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
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
  // Glow: floor at 0.35, boost brightness above 1.0
  const glowFloor = Math.max(glow, 0.35);
  const glowBoost = glow > 1.0 ? 1.0 + (glow - 1.0) * 0.6 : glowFloor;

  if (absorbed) {
    // Grey/silver with subtle white pulse — "energy extracted" look
    const pulse = 0.55 + Math.sin(Date.now() * 0.015) * 0.15;
    const grey = pulse * 0.65;
    c.setRGB(grey, grey, grey * 1.05);
    return;
  }

  if (hasCollided) {
    const intensity = Math.min(t * impactMul, 1);
    c.setRGB(Math.min(1, (1 + intensity * 0.5) * glowBoost), 0.2 + (1 - intensity) * 0.3, 0.02);
    return;
  }

  if (t < 0.2) {
    const p = t / 0.2;
    c.setRGB(0.1 * glowBoost, 0.2 + p * 0.4, (0.9 + p * 0.1) * glowBoost);
  } else if (t < 0.4) {
    const p = (t - 0.2) / 0.2;
    c.setRGB(0.1 * glowBoost, (0.6 + p * 0.4) * glowBoost, (1 - p * 0.5) * glowBoost);
  } else if (t < 0.65) {
    const p = (t - 0.4) / 0.25;
    c.setRGB((0.1 + p * 0.15) * glowBoost, (1.0) * glowBoost, (0.5 - p * 0.3) * glowBoost);
  } else if (t < 0.85) {
    const p = (t - 0.65) / 0.2;
    c.setRGB((0.25 + p * 0.75) * glowBoost, (1 - p * 0.2) * glowBoost, (0.2 - p * 0.15) * glowBoost);
  } else {
    const p = (t - 0.85) / 0.15;
    c.setRGB(Math.min(1, (1 + p * 0.3) * glowBoost), (0.8 - p * 0.4) * glowBoost, 0.05 * glowBoost);
  }
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
    opacity: Math.min(1, presetCfg.opacity * Math.max(glowIntensity * 1.5, 0.4)),
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

      // Orient along velocity — tail trails behind
      if (speed > 0.1) {
        dummy.lookAt(px + vx, py + vy, pz + vz);
      }

      let baseScale = size * sizeMul * (hasCollided ? impactMultiplier * 1.4 : 1);
      if (isAbsorbed) {
        baseScale *= 1.6 + Math.sin(time * 12) * 0.35;
      }

      // Tail length grows with speed AND trailLengthMultiplier
      const tailLength = 1 + speed * 0.12 * tailMul;
      const cappedTail = Math.min(tailLength, 60.0);
      const lateralSize = baseScale * 0.8;
      const pulse = pulseMul * (1 + Math.sin(time * 3 + i * 0.5) * 0.03);

      // Z = forward (lookAt direction) = tail length
      // X,Y = lateral size
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
