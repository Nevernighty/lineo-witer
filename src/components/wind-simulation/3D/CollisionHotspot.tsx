import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Obstacle } from '../types';
import { OBSTACLE_DRAG_COEFFICIENTS } from './WindPhysicsEngine';

interface CollisionHotspotProps {
  obstacle: Obstacle;
  energy: number;
  maxEnergy: number;
  visible: boolean;
}

export const CollisionHotspot: React.FC<CollisionHotspotProps> = ({
  obstacle,
  energy,
  maxEnergy,
  visible
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Calculate intensity based on energy
  const intensity = useMemo(() => {
    if (maxEnergy <= 0) return 0;
    return Math.min(energy / maxEnergy, 1);
  }, [energy, maxEnergy]);

  // Animate the hotspot
  useFrame((state) => {
    if (!visible || !meshRef.current || !glowRef.current) return;
    
    const time = state.clock.elapsedTime;
    const pulse = Math.sin(time * 3) * 0.1 + 0.9;
    
    meshRef.current.scale.setScalar(pulse);
    glowRef.current.scale.setScalar(pulse * 1.5);
    
    // Update opacity based on intensity
    if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
      meshRef.current.material.opacity = intensity * 0.7 * pulse;
    }
    if (glowRef.current.material instanceof THREE.MeshBasicMaterial) {
      glowRef.current.material.opacity = intensity * 0.3 * pulse;
    }
  });

  if (!visible || intensity < 0.05) return null;

  const position: [number, number, number] = [
    obstacle.x + obstacle.width / 2,
    obstacle.y + obstacle.height / 2,
    obstacle.z + obstacle.depth / 2
  ];

  // Color gradient from yellow to orange to red based on intensity
  const color = new THREE.Color().setHSL(
    0.1 - intensity * 0.1, // Hue: yellow (0.16) to red (0)
    1,
    0.5 + intensity * 0.2
  );

  const size = Math.max(obstacle.width, obstacle.depth) * 0.8;

  return (
    <group position={position}>
      {/* Core hotspot indicator */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={intensity * 0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={intensity * 0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Energy ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 0.8, size * 1.2, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={intensity * 0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

interface WakeZoneVisualizerProps {
  obstacle: Obstacle;
  windAngle: number;
  visible: boolean;
}

export const WakeZoneVisualizer: React.FC<WakeZoneVisualizerProps> = ({
  obstacle,
  windAngle,
  visible
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const physics = OBSTACLE_DRAG_COEFFICIENTS[obstacle.type] || OBSTACLE_DRAG_COEFFICIENTS.building;
  const wakeLength = physics.wakeLength * Math.max(obstacle.width, obstacle.depth);
  
  // Calculate wake direction (opposite to wind)
  const angleRad = (windAngle * Math.PI) / 180;
  
  useFrame((state) => {
    if (!visible || !meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
      meshRef.current.material.opacity = 0.15 + Math.sin(time * 2) * 0.05;
    }
  });

  if (!visible) return null;

  const obstacleCenter: [number, number, number] = [
    obstacle.x + obstacle.width / 2,
    obstacle.y + obstacle.height * 0.3,
    obstacle.z + obstacle.depth / 2
  ];

  // Wake zone extends downwind from obstacle
  const wakeOffset: [number, number, number] = [
    obstacleCenter[0] + Math.cos(angleRad) * wakeLength * 0.5,
    obstacleCenter[1],
    obstacleCenter[2] + Math.sin(angleRad) * wakeLength * 0.5
  ];

  return (
    <group position={wakeOffset} rotation={[0, -angleRad, 0]}>
      {/* Wake zone cone */}
      <mesh ref={meshRef} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[
          Math.max(obstacle.width, obstacle.depth) * 0.8,
          wakeLength,
          16,
          1,
          true
        ]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
          wireframe
        />
      </mesh>
      
      {/* Turbulence indicator lines */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh 
          key={i} 
          position={[wakeLength * 0.2 * i, Math.sin(i) * 2, Math.cos(i * 2) * 3]}
          rotation={[Math.random() * Math.PI, 0, 0]}
        >
          <torusGeometry args={[2 + i * 0.5, 0.1, 8, 16]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.1 * (1 - i / 5)}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};

interface CollisionHotspotManagerProps {
  obstacles: Obstacle[];
  obstacleEnergies: Map<string, number>;
  showHotspots: boolean;
  showWakeZones: boolean;
  windAngle: number;
}

export const CollisionHotspotManager: React.FC<CollisionHotspotManagerProps> = ({
  obstacles,
  obstacleEnergies,
  showHotspots,
  showWakeZones,
  windAngle
}) => {
  const maxEnergy = useMemo(() => {
    let max = 1;
    obstacleEnergies.forEach((energy) => {
      if (energy > max) max = energy;
    });
    return max;
  }, [obstacleEnergies]);

  return (
    <group>
      {obstacles.map((obstacle) => (
        <group key={obstacle.id || `${obstacle.x}-${obstacle.z}`}>
          {showHotspots && (
            <CollisionHotspot
              obstacle={obstacle}
              energy={obstacleEnergies.get(obstacle.id || '') || 0}
              maxEnergy={maxEnergy}
              visible={showHotspots}
            />
          )}
          {showWakeZones && (
            <WakeZoneVisualizer
              obstacle={obstacle}
              windAngle={windAngle}
              visible={showWakeZones}
            />
          )}
        </group>
      ))}
    </group>
  );
};
