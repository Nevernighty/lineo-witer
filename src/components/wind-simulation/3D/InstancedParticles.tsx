import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  hasCollided: boolean;
  speedX?: number;
  speedY?: number;
  speedZ?: number;
}

interface InstancedParticlesProps {
  particles: Particle[];
}

const createParticleGeometry = () => {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0, 0, 0.8,
    -0.18, 0, 0,
    0, 0.18, 0,
    0.18, 0, 0,
    0, -0.18, 0,
    0, 0, -0.25,
  ]);
  const indices = new Uint16Array([
    0, 1, 2,  0, 2, 3,  0, 3, 4,  0, 4, 1,
    5, 2, 1,  5, 3, 2,  5, 4, 3,  5, 1, 4,
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return geometry;
};

// Color interpolation: green -> yellow -> orange -> red
const lerpColor = (c: THREE.Color, intensity: number) => {
  if (intensity < 0.33) {
    c.setRGB(0.22 + intensity * 2, 1, 0.08);
  } else if (intensity < 0.66) {
    const t2 = (intensity - 0.33) / 0.33;
    c.setRGB(0.9 + t2 * 0.1, 1 - t2 * 0.4, 0.08);
  } else {
    const t2 = (intensity - 0.66) / 0.34;
    c.setRGB(1, 0.6 - t2 * 0.35, 0.08 + t2 * 0.05);
  }
};

export const InstancedParticles: React.FC<InstancedParticlesProps> = ({ particles }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const trailMeshRef = useRef<THREE.InstancedMesh>(null);
  const glowMeshRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particleGeometry = useMemo(() => createParticleGeometry(), []);
  
  const normalColor = useMemo(() => new THREE.Color('#39ff14'), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  useFrame((state) => {
    if (!meshRef.current || !trailMeshRef.current || !glowMeshRef.current) return;
    const time = state.clock.elapsedTime;

    particles.forEach((particle, i) => {
      const vx = particle.speedX || 0;
      const vy = particle.speedY || 0;
      const vz = particle.speedZ || 0;
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      
      dummy.position.set(particle.x, particle.y, particle.z);
      if (speed > 0.1) {
        dummy.lookAt(particle.x + vx, particle.y + vy, particle.z + vz);
      }
      
      // Velocity-based elongation — stronger at high speeds (ribbon effect)
      const baseScale = particle.size;
      const speedScale = Math.min(1 + speed * 0.18, 3.5);
      const pulse = 1 + Math.sin(time * 3 + i * 0.5) * 0.05;
      // At high speed, compress lateral axes for ribbon-like appearance
      const lateralCompress = Math.max(0.5, 1 - speed * 0.03);
      dummy.scale.set(baseScale * speedScale * pulse, baseScale * pulse * lateralCompress, baseScale * pulse * lateralCompress);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Trail - longer at high speed
      const trailLength = Math.min(0.4 + speed * 0.06, 1.2);
      dummy.position.set(particle.x - vx * trailLength, particle.y - vy * trailLength, particle.z - vz * trailLength);
      dummy.scale.set(baseScale * 0.6 * speedScale * 0.8, baseScale * 0.3, baseScale * 0.3);
      dummy.updateMatrix();
      trailMeshRef.current!.setMatrixAt(i, dummy.matrix);

      // Glow
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.scale.setScalar(baseScale * 2.8);
      dummy.updateMatrix();
      glowMeshRef.current!.setMatrixAt(i, dummy.matrix);

      // Color: collision intensity + scatter visual
      if (meshRef.current!.instanceColor) {
        if (particle.hasCollided) {
          const collisionIntensity = Math.min(speed * 0.15, 1);
          lerpColor(tempColor, collisionIntensity);
          meshRef.current!.instanceColor.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
        } else {
          meshRef.current!.instanceColor.setXYZ(i, normalColor.r, normalColor.g, normalColor.b);
        }
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    trailMeshRef.current.instanceMatrix.needsUpdate = true;
    glowMeshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  const count = Math.max(particles.length, 1);
  const instanceColors = useMemo(() => {
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = normalColor.r;
      colors[i * 3 + 1] = normalColor.g;
      colors[i * 3 + 2] = normalColor.b;
    }
    return colors;
  }, [count, normalColor]);

  return (
    <group>
      <instancedMesh ref={trailMeshRef} args={[particleGeometry, undefined, count]} frustumCulled={false}>
        <meshBasicMaterial color="#00ff88" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>

      <instancedMesh ref={meshRef} args={[particleGeometry, undefined, count]} frustumCulled={false}>
        <meshBasicMaterial vertexColors transparent opacity={0.95} />
        <instancedBufferAttribute attach="instanceColor" args={[instanceColors, 3]} />
      </instancedMesh>

      <instancedMesh ref={glowMeshRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshBasicMaterial color="#39ff14" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>
    </group>
  );
};