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
}

const createParticleGeometry = () => {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0, 0, 1.2,
    -0.15, 0.1, 0,
    0.15, 0.1, 0,
    0.15, -0.1, 0,
    -0.15, -0.1, 0,
    0, 0, -0.4,
  ]);
  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1,
    5, 2, 1, 5, 3, 2, 5, 4, 3, 5, 1, 4,
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return geometry;
};

const getSpeedColor = (c: THREE.Color, speed: number, hasCollided: boolean, absorbed: boolean, impactMul: number, glow: number) => {
  const maxSpeed = 18;
  const t = Math.min(speed / maxSpeed, 1);

  if (absorbed) {
    const pulse = 0.8 + Math.sin(Date.now() * 0.02) * 0.2;
    c.setRGB(1 * pulse * glow, 0.95 * pulse * glow, 0.3 * pulse);
    return;
  }

  if (hasCollided) {
    const intensity = Math.min(t * impactMul, 1);
    c.setRGB(Math.min(1, (1 + intensity * 0.5) * glow), 0.2 + (1 - intensity) * 0.3, 0.02);
    return;
  }

  if (t < 0.2) {
    const p = t / 0.2;
    c.setRGB(0.1 * glow, 0.2 + p * 0.4, (0.9 + p * 0.1) * glow);
  } else if (t < 0.4) {
    const p = (t - 0.2) / 0.2;
    c.setRGB(0.1 * glow, (0.6 + p * 0.4) * glow, (1 - p * 0.5) * glow);
  } else if (t < 0.65) {
    const p = (t - 0.4) / 0.25;
    c.setRGB((0.1 + p * 0.15) * glow, (1.0) * glow, (0.5 - p * 0.3) * glow);
  } else if (t < 0.85) {
    const p = (t - 0.65) / 0.2;
    c.setRGB((0.25 + p * 0.75) * glow, (1 - p * 0.2) * glow, (0.2 - p * 0.15) * glow);
  } else {
    const p = (t - 0.85) / 0.15;
    c.setRGB(Math.min(1, (1 + p * 0.3) * glow), (0.8 - p * 0.4) * glow, 0.05 * glow);
  }
};

const TRAIL_SEGMENTS = 5;

export const InstancedParticles: React.FC<InstancedParticlesProps> = ({
  bufferRef,
  impactMultiplier = 1.0,
  trailLengthMultiplier = 1.0,
  windAngle = 0,
  glowIntensity = 1.0,
  pulsation = 0
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const trailRefs = useRef<(THREE.InstancedMesh | null)[]>(Array(TRAIL_SEGMENTS).fill(null));
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particleGeometry = useMemo(() => createParticleGeometry(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  const posHistoryRef = useRef<Float32Array[]>([]);
  // Track last known count to detect resizes
  const lastCountRef = useRef(0);

  const particleMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 1.0
  }), []);

  const trailMaterials = useMemo(() => [
    new THREE.MeshBasicMaterial({ color: '#00ff88', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: '#00ff88', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: '#00ff66', transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: '#00ff44', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: '#00ff22', transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }),
  ], []);

  const arrowAngleRad = (windAngle * Math.PI) / 180;

  // Use a stable max count for instanced meshes to avoid re-allocation
  const maxCount = useRef(2000);

  useFrame((state) => {
    if (!meshRef.current || !bufferRef.current) return;
    const buf = bufferRef.current;
    const count = buf.count;
    const time = state.clock.elapsedTime;

    // Ensure instanced mesh has enough capacity
    if (count > maxCount.current) {
      maxCount.current = count;
      // Mesh will be re-created on next render via key change
    }

    // Rebuild position history if count changed
    if (lastCountRef.current !== count) {
      lastCountRef.current = count;
      posHistoryRef.current = Array.from({ length: TRAIL_SEGMENTS }, () => {
        const arr = new Float32Array(count * 3);
        arr.set(buf.positions.subarray(0, count * 3));
        return arr;
      });
    }

    // Shift history
    for (let seg = TRAIL_SEGMENTS - 1; seg > 0; seg--) {
      posHistoryRef.current[seg].set(posHistoryRef.current[seg - 1]);
    }
    posHistoryRef.current[0].set(buf.positions.subarray(0, count * 3));

    const pulseMul = pulsation > 0 ? 1 + Math.sin(time * (2 + pulsation * 3)) * pulsation * 0.15 : 1;

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
      
      let baseScale = size * (hasCollided ? impactMultiplier * 1.4 : 1);
      if (isAbsorbed) {
        baseScale *= 1.6 + Math.sin(time * 12) * 0.35;
      }
      const speedScale = Math.min(1 + speed * 0.22, 4.0);
      const pulse = pulseMul * (1 + Math.sin(time * 3 + i * 0.5) * 0.04);
      const lateralCompress = Math.max(0.4, 1 - speed * 0.04);
      dummy.scale.set(baseScale * speedScale * pulse, baseScale * pulse * lateralCompress, baseScale * pulse * lateralCompress);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      if (meshRef.current!.instanceColor) {
        getSpeedColor(tempColor, speed, hasCollided, isAbsorbed, impactMultiplier, glowIntensity);
        meshRef.current!.instanceColor.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // Trails
    const trailActive = trailLengthMultiplier > 0.01;
    const trailScales = [0.65, 0.5, 0.35, 0.22, 0.12];

    for (let seg = 0; seg < TRAIL_SEGMENTS; seg++) {
      const trailMesh = trailRefs.current[seg];
      if (!trailMesh) continue;

      const baseMat = trailMaterials[seg];
      baseMat.opacity = trailActive ? [0.55, 0.4, 0.28, 0.16, 0.08][seg] * Math.min(trailLengthMultiplier, 4) * glowIntensity : 0;

      for (let i = 0; i < count; i++) {
        if (!trailActive) {
          dummy.position.set(0, -1000, 0);
          dummy.scale.setScalar(0);
        } else {
          const i3 = i * 3;
          const hx = posHistoryRef.current[seg][i3];
          const hy = posHistoryRef.current[seg][i3 + 1];
          const hz = posHistoryRef.current[seg][i3 + 2];
          dummy.position.set(hx, hy, hz);

          const s = buf.sizes[i] * trailScales[seg] * trailLengthMultiplier;
          dummy.scale.setScalar(s);

          const vx = buf.velocities[i3];
          const vy = buf.velocities[i3 + 1];
          const vz = buf.velocities[i3 + 2];
          if (Math.abs(vx) + Math.abs(vy) + Math.abs(vz) > 0.1) {
            dummy.lookAt(hx + vx, hy + vy, hz + vz);
          }
        }
        dummy.updateMatrix();
        trailMesh.setMatrixAt(i, dummy.matrix);
      }
      trailMesh.instanceMatrix.needsUpdate = true;
    }
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
      {trailMaterials.map((mat, seg) => (
        <instancedMesh
          key={`trail-${seg}`}
          ref={(el) => { trailRefs.current[seg] = el; }}
          args={[particleGeometry, mat, count]}
          frustumCulled={false}
        />
      ))}

      <instancedMesh ref={meshRef} args={[particleGeometry, particleMaterial, count]} frustumCulled={false}>
        <instancedBufferAttribute attach="instanceColor" args={[instanceColors, 3]} />
      </instancedMesh>

      {/* Wind direction arrow indicator */}
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
