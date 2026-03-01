import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Particle {
  x: number; y: number; z: number;
  size: number;
  hasCollided: boolean;
  speedX?: number; speedY?: number; speedZ?: number;
  absorbed?: boolean;
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
    0, 0, 0.8,  -0.18, 0, 0,  0, 0.18, 0,
    0.18, 0, 0,  0, -0.18, 0,  0, 0, -0.25,
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
const getSpeedColor = (c: THREE.Color, speed: number, hasCollided: boolean, absorbed: boolean, impactMul: number) => {
  const maxSpeed = 15;
  const t = Math.min(speed / maxSpeed, 1);

  if (absorbed) {
    // Absorption: bright yellow-white pulse
    c.setRGB(1, 0.95, 0.4);
    return;
  }

  if (hasCollided) {
    const intensity = Math.min(t * impactMul, 1);
    c.setRGB(1, 0.3 + (1 - intensity) * 0.4, 0.05);
    return;
  }

  if (t < 0.33) {
    const p = t / 0.33;
    c.setRGB(0.1, 0.3 + p * 0.5, 0.8 + p * 0.2);
  } else if (t < 0.66) {
    const p = (t - 0.33) / 0.33;
    c.setRGB(0.1 + p * 0.1, 0.8, 1 - p * 0.7);
  } else {
    const p = (t - 0.66) / 0.34;
    c.setRGB(0.2 + p * 0.8, 0.8 - p * 0.3, 0.3 - p * 0.25);
  }
};

const TRAIL_SEGMENTS = 4;

export const InstancedParticles: React.FC<InstancedParticlesProps> = ({
  particles,
  impactMultiplier = 1.0,
  trailLengthMultiplier = 1.0,
  windAngle = 0
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  // 4 trail segment meshes
  const trailRefs = useRef<(THREE.InstancedMesh | null)[]>([null, null, null, null]);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particleGeometry = useMemo(() => createParticleGeometry(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  // Position history buffer: [particleIndex][segmentIndex] = {x,y,z}
  const posHistoryRef = useRef<Float32Array[]>([]);

  const particleMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.95
  }), []);

  const trailMaterials = useMemo(() => [
    new THREE.MeshBasicMaterial({ color: '#00ff88', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: '#00ff88', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: '#00ff88', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: '#00ff88', transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false }),
  ], []);

  const arrowAngleRad = (windAngle * Math.PI) / 180;

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const count = particles.length;

    // Initialize position history if needed
    if (posHistoryRef.current.length !== TRAIL_SEGMENTS || 
        (posHistoryRef.current[0] && posHistoryRef.current[0].length !== count * 3)) {
      posHistoryRef.current = Array.from({ length: TRAIL_SEGMENTS }, () => new Float32Array(count * 3));
      // Fill with current positions
      for (let seg = 0; seg < TRAIL_SEGMENTS; seg++) {
        for (let i = 0; i < count; i++) {
          const p = particles[i];
          if (p) {
            posHistoryRef.current[seg][i * 3] = p.x;
            posHistoryRef.current[seg][i * 3 + 1] = p.y;
            posHistoryRef.current[seg][i * 3 + 2] = p.z;
          }
        }
      }
    }

    // Shift history: move each segment back one
    for (let seg = TRAIL_SEGMENTS - 1; seg > 0; seg--) {
      posHistoryRef.current[seg].set(posHistoryRef.current[seg - 1]);
    }
    // Store current positions in segment 0
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      if (p) {
        posHistoryRef.current[0][i * 3] = p.x;
        posHistoryRef.current[0][i * 3 + 1] = p.y;
        posHistoryRef.current[0][i * 3 + 2] = p.z;
      }
    }

    // Main particles
    for (let i = 0; i < count; i++) {
      const particle = particles[i];
      if (!particle) continue;

      const vx = particle.speedX || 0;
      const vy = particle.speedY || 0;
      const vz = particle.speedZ || 0;
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      
      dummy.position.set(particle.x, particle.y, particle.z);
      if (speed > 0.1) {
        dummy.lookAt(particle.x + vx, particle.y + vy, particle.z + vz);
      }
      
      const isAbsorbed = particle.absorbed || false;
      let baseScale = particle.size * (particle.hasCollided ? impactMultiplier * 1.3 : 1);
      if (isAbsorbed) {
        baseScale *= 1.5 + Math.sin(time * 10) * 0.3;
      }
      const speedScale = Math.min(1 + speed * 0.18, 3.5);
      const pulse = 1 + Math.sin(time * 3 + i * 0.5) * 0.05;
      const lateralCompress = Math.max(0.5, 1 - speed * 0.03);
      dummy.scale.set(baseScale * speedScale * pulse, baseScale * pulse * lateralCompress, baseScale * pulse * lateralCompress);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Speed-based coloring
      if (meshRef.current!.instanceColor) {
        getSpeedColor(tempColor, speed, particle.hasCollided, isAbsorbed, impactMultiplier);
        meshRef.current!.instanceColor.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // Trail segments
    const trailActive = trailLengthMultiplier > 0.01;
    const trailScales = [0.7, 0.5, 0.35, 0.2];

    for (let seg = 0; seg < TRAIL_SEGMENTS; seg++) {
      const trailMesh = trailRefs.current[seg];
      if (!trailMesh) continue;

      // Update material opacity based on trailLengthMultiplier
      const baseMat = trailMaterials[seg];
      baseMat.opacity = trailActive ? [0.35, 0.22, 0.12, 0.06][seg] * trailLengthMultiplier : 0;

      for (let i = 0; i < count; i++) {
        if (!trailActive) {
          dummy.position.set(0, -1000, 0);
          dummy.scale.setScalar(0);
        } else {
          const hx = posHistoryRef.current[seg][i * 3];
          const hy = posHistoryRef.current[seg][i * 3 + 1];
          const hz = posHistoryRef.current[seg][i * 3 + 2];
          dummy.position.set(hx, hy, hz);

          const p = particles[i];
          const s = p ? p.size * trailScales[seg] * trailLengthMultiplier : 0;
          dummy.scale.setScalar(s);

          if (p) {
            const vx = p.speedX || 0;
            const vy = p.speedY || 0;
            const vz = p.speedZ || 0;
            if (Math.abs(vx) + Math.abs(vy) + Math.abs(vz) > 0.1) {
              dummy.lookAt(hx + vx, hy + vy, hz + vz);
            }
          }
        }
        dummy.updateMatrix();
        trailMesh.setMatrixAt(i, dummy.matrix);
      }
      trailMesh.instanceMatrix.needsUpdate = true;
    }
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
      {/* Trail segments (rendered behind particles) */}
      {trailMaterials.map((mat, seg) => (
        <instancedMesh
          key={`trail-${seg}`}
          ref={(el) => { trailRefs.current[seg] = el; }}
          args={[particleGeometry, mat, count]}
          frustumCulled={false}
        />
      ))}

      {/* Main particles */}
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
