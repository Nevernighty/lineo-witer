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

// Create elongated particle geometry for motion blur effect
const createParticleGeometry = () => {
  const geometry = new THREE.BufferGeometry();
  
  // Elongated diamond shape for speed appearance
  const vertices = new Float32Array([
    0, 0, 0.6,    // front tip (elongated)
    -0.15, 0, 0,  // left
    0, 0.15, 0,   // top
    0.15, 0, 0,   // right
    0, -0.15, 0,  // bottom
    0, 0, -0.2,   // back (shorter)
  ]);
  
  const indices = new Uint16Array([
    0, 1, 2,  0, 2, 3,  0, 3, 4,  0, 4, 1,  // front faces
    5, 2, 1,  5, 3, 2,  5, 4, 3,  5, 1, 4,  // back faces
  ]);
  
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  
  return geometry;
};

export const InstancedParticles: React.FC<InstancedParticlesProps> = ({ particles }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const trailMeshRef = useRef<THREE.InstancedMesh>(null);
  const glowMeshRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particleGeometry = useMemo(() => createParticleGeometry(), []);
  
  // Colors
  const normalColor = useMemo(() => new THREE.Color('#39ff14'), []); // Bright neon green
  const collisionColor = useMemo(() => new THREE.Color('#ff6b35'), []); // Orange-red
  const trailColor = useMemo(() => new THREE.Color('#00ff88'), []); // Lighter green for trail
  
  useFrame(() => {
    if (!meshRef.current || !trailMeshRef.current || !glowMeshRef.current) return;

    particles.forEach((particle, i) => {
      // Calculate velocity for rotation alignment
      const vx = particle.speedX || 0;
      const vy = particle.speedY || 0;
      const vz = particle.speedZ || 0;
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      
      // Position main particle
      dummy.position.set(particle.x, particle.y, particle.z);
      
      // Rotate particle to face movement direction
      if (speed > 0.1) {
        dummy.lookAt(
          particle.x + vx,
          particle.y + vy,
          particle.z + vz
        );
      }
      
      // Scale based on speed and collision state
      const baseScale = particle.hasCollided ? particle.size * 1.3 : particle.size;
      const speedScale = Math.min(1 + speed * 0.08, 2);
      dummy.scale.set(baseScale * speedScale, baseScale, baseScale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Trail particle - slightly behind
      dummy.position.set(
        particle.x - vx * 0.15,
        particle.y - vy * 0.15,
        particle.z - vz * 0.15
      );
      dummy.scale.set(baseScale * 0.7 * speedScale, baseScale * 0.5, baseScale * 0.5);
      dummy.updateMatrix();
      trailMeshRef.current!.setMatrixAt(i, dummy.matrix);

      // Glow - larger, follows main particle
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.scale.setScalar(baseScale * 2.5);
      dummy.updateMatrix();
      glowMeshRef.current!.setMatrixAt(i, dummy.matrix);

      // Update color based on collision state
      if (meshRef.current!.instanceColor) {
        const color = particle.hasCollided ? collisionColor : normalColor;
        meshRef.current!.instanceColor.setXYZ(i, color.r, color.g, color.b);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    trailMeshRef.current.instanceMatrix.needsUpdate = true;
    glowMeshRef.current.instanceMatrix.needsUpdate = true;
    
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  const count = Math.max(particles.length, 1);

  // Initialize instance colors
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
      {/* Motion trail layer */}
      <instancedMesh 
        ref={trailMeshRef} 
        args={[particleGeometry, undefined, count]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          color={trailColor}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Main particles with per-instance color */}
      <instancedMesh 
        ref={meshRef} 
        args={[particleGeometry, undefined, count]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.95}
        />
        <instancedBufferAttribute
          attach="instanceColor"
          args={[instanceColors, 3]}
        />
      </instancedMesh>

      {/* Glow layer */}
      <instancedMesh 
        ref={glowMeshRef} 
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshBasicMaterial
          color="#39ff14"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
};
