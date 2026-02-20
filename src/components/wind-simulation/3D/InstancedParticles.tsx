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
  impactMultiplier?: number;
  trailLengthMultiplier?: number;
  windAngle?: number;
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

// Speed-based color: blue (slow) -> green (medium) -> orange/red (fast)
const getSpeedColor = (c: THREE.Color, speed: number, hasCollided: boolean, impactMul: number) => {
  const maxSpeed = 15;
  const t = Math.min(speed / maxSpeed, 1);

  if (hasCollided) {
    // Collision: bright orange-red, amplified by impact multiplier
    const intensity = Math.min(t * impactMul, 1);
    c.setRGB(1, 0.3 + (1 - intensity) * 0.4, 0.05);
    return;
  }

  if (t < 0.33) {
    // Slow: blue to cyan
    const p = t / 0.33;
    c.setRGB(0.1, 0.3 + p * 0.5, 0.8 + p * 0.2);
  } else if (t < 0.66) {
    // Medium: cyan to green
    const p = (t - 0.33) / 0.33;
    c.setRGB(0.1 + p * 0.1, 0.8, 1 - p * 0.7);
  } else {
    // Fast: green to orange
    const p = (t - 0.66) / 0.34;
    c.setRGB(0.2 + p * 0.8, 0.8 - p * 0.3, 0.3 - p * 0.25);
  }
};

export const InstancedParticles: React.FC<InstancedParticlesProps> = ({
  particles,
  impactMultiplier = 1.0,
  trailLengthMultiplier = 1.0,
  windAngle = 0
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const trailMeshRef = useRef<THREE.InstancedMesh>(null);
  const glowMeshRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particleGeometry = useMemo(() => createParticleGeometry(), []);
  const glowGeometry = useMemo(() => new THREE.SphereGeometry(0.15, 6, 6), []);
  
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  const trailMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#00ff88', transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const particleMaterial = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }), []);
  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#39ff14', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }), []);

  // Wind direction arrow geometry
  const arrowAngleRad = (windAngle * Math.PI) / 180;

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
      
      const baseScale = particle.size * (particle.hasCollided ? impactMultiplier : 1);
      const speedScale = Math.min(1 + speed * 0.18, 3.5);
      const pulse = 1 + Math.sin(time * 3 + i * 0.5) * 0.05;
      const lateralCompress = Math.max(0.5, 1 - speed * 0.03);
      dummy.scale.set(baseScale * speedScale * pulse, baseScale * pulse * lateralCompress, baseScale * pulse * lateralCompress);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Trail - controlled by trailLengthMultiplier
      const trailLength = Math.min(0.4 + speed * 0.06, 1.2) * trailLengthMultiplier;
      if (trailLengthMultiplier > 0.01) {
        dummy.position.set(particle.x - vx * trailLength, particle.y - vy * trailLength, particle.z - vz * trailLength);
        dummy.scale.set(baseScale * 0.6 * speedScale * 0.8, baseScale * 0.3, baseScale * 0.3);
      } else {
        dummy.position.set(particle.x, particle.y, particle.z);
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      trailMeshRef.current!.setMatrixAt(i, dummy.matrix);

      // Glow
      dummy.position.set(particle.x, particle.y, particle.z);
      const glowScale = particle.hasCollided ? baseScale * 3.5 * impactMultiplier : baseScale * 2.8;
      dummy.scale.setScalar(glowScale);
      dummy.updateMatrix();
      glowMeshRef.current!.setMatrixAt(i, dummy.matrix);

      // Speed-based coloring
      if (meshRef.current!.instanceColor) {
        getSpeedColor(tempColor, speed, particle.hasCollided, impactMultiplier);
        meshRef.current!.instanceColor.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
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
      colors[i * 3] = 0.1;
      colors[i * 3 + 1] = 0.5;
      colors[i * 3 + 2] = 0.9;
    }
    return colors;
  }, [count]);

  return (
    <group>
      <instancedMesh ref={trailMeshRef} args={[particleGeometry, trailMaterial, count]} frustumCulled={false} />
      <instancedMesh ref={meshRef} args={[particleGeometry, particleMaterial, count]} frustumCulled={false}>
        <instancedBufferAttribute attach="instanceColor" args={[instanceColors, 3]} />
      </instancedMesh>
      <instancedMesh ref={glowMeshRef} args={[glowGeometry, glowMaterial, count]} frustumCulled={false} />

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
