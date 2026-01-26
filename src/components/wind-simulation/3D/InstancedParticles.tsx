import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  hasCollided: boolean;
}

interface InstancedParticlesProps {
  particles: Particle[];
}

export const InstancedParticles: React.FC<InstancedParticlesProps> = ({ particles }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const glowMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorArray = useMemo(() => new Float32Array(Math.max(particles.length, 1) * 3), [particles.length]);

  // Particle material - bright neon green
  const particleMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#00ff88',
      transparent: true,
      opacity: 0.95,
    });
  }, []);

  // Glow material
  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#39ff14',
      transparent: true,
      opacity: 0.3,
    });
  }, []);

  // Collision material
  const collisionMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#ff4400',
      transparent: true,
      opacity: 0.95,
    });
  }, []);

  useFrame(() => {
    if (!meshRef.current || !glowMeshRef.current) return;

    particles.forEach((particle, i) => {
      // Position main particle
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.scale.setScalar(particle.hasCollided ? particle.size * 1.5 : particle.size);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Position glow
      dummy.scale.setScalar((particle.hasCollided ? particle.size * 2.5 : particle.size * 1.8));
      dummy.updateMatrix();
      glowMeshRef.current!.setMatrixAt(i, dummy.matrix);

      // Set color based on collision state
      const color = particle.hasCollided ? new THREE.Color('#ff4400') : new THREE.Color('#00ff88');
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    glowMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  const count = Math.max(particles.length, 1);

  return (
    <group>
      {/* Main particles */}
      <instancedMesh 
        ref={meshRef} 
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.95}
        />
      </instancedMesh>

      {/* Glow layer */}
      <instancedMesh 
        ref={glowMeshRef} 
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial
          color="#39ff14"
          transparent
          opacity={0.25}
        />
      </instancedMesh>
    </group>
  );
};
