import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Obstacle } from '../types';
import { OBSTACLE_DRAG_COEFFICIENTS } from './WindPhysicsEngine';

interface CollisionHotspotProps {
  obstacle: Obstacle;
  energy: number;
  maxEnergy: number;
  visible: boolean;
}

// Energy classification thresholds
const ENERGY_LEVELS = {
  low: { threshold: 0.25, label: 'LOW', color: '#22c55e' },
  medium: { threshold: 0.5, label: 'MED', color: '#eab308' },
  high: { threshold: 0.75, label: 'HIGH', color: '#f97316' },
  critical: { threshold: 1.0, label: 'CRIT', color: '#ef4444' }
};

const getEnergyLevel = (intensity: number) => {
  if (intensity < ENERGY_LEVELS.low.threshold) return ENERGY_LEVELS.low;
  if (intensity < ENERGY_LEVELS.medium.threshold) return ENERGY_LEVELS.medium;
  if (intensity < ENERGY_LEVELS.high.threshold) return ENERGY_LEVELS.high;
  return ENERGY_LEVELS.critical;
};

export const CollisionHotspot: React.FC<CollisionHotspotProps> = ({
  obstacle,
  energy,
  maxEnergy,
  visible
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRefs = useRef<THREE.Mesh[]>([]);
  const pulseRef = useRef<THREE.Mesh>(null);
  
  const intensity = useMemo(() => {
    if (maxEnergy <= 0) return 0;
    return Math.min(energy / maxEnergy, 1);
  }, [energy, maxEnergy]);

  const energyLevel = useMemo(() => getEnergyLevel(intensity), [intensity]);

  // Animate the hotspot
  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Animate concentric rings - expanding outward
    ringRefs.current.forEach((ring, i) => {
      if (ring) {
        const phase = (time * 1.5 + i * 0.3) % 1.5;
        const scale = 0.8 + phase * 0.6;
        ring.scale.setScalar(scale);
        if (ring.material instanceof THREE.MeshBasicMaterial) {
          ring.material.opacity = (1 - phase / 1.5) * intensity * 0.5;
        }
      }
    });

    // Pulse the center indicator
    if (pulseRef.current) {
      const pulse = 0.9 + Math.sin(time * 4) * 0.1;
      pulseRef.current.scale.setScalar(pulse);
    }
  });

  if (!visible || intensity < 0.02) return null;

  const position: [number, number, number] = [
    obstacle.x + obstacle.width / 2,
    obstacle.y + obstacle.height + 0.5,
    obstacle.z + obstacle.depth / 2
  ];

  const color = new THREE.Color(energyLevel.color);
  const size = Math.max(obstacle.width, obstacle.depth) * 0.4;

  return (
    <group ref={groupRef} position={position}>
      {/* Central energy indicator - glowing sphere */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[size * 0.15, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8 + intensity * 0.2}
        />
      </mesh>

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[size * 0.25, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={intensity * 0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Concentric pulse rings - horizontal */}
      {[0, 1, 2].map((i) => (
        <mesh 
          key={i}
          ref={(el) => { if (el) ringRefs.current[i] = el; }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.5, 0]}
        >
          <ringGeometry args={[size * 0.4, size * 0.45, 24]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={intensity * 0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Vertical beam indicator */}
      <mesh position={[0, -obstacle.height / 2 - 0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.15, obstacle.height, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={intensity * 0.25}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Compact data label */}
      <Html
        position={[0, 2, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div 
          className="rounded px-2 py-1 text-center border shadow-lg"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.85)',
            borderColor: `${energyLevel.color}50`,
            minWidth: '60px'
          }}
        >
          <div 
            className="text-[9px] font-bold tracking-wider"
            style={{ color: energyLevel.color }}
          >
            {energyLevel.label}
          </div>
          <div className="text-white text-sm font-mono font-semibold">
            {energy.toFixed(1)}
            <span className="text-[9px] ml-0.5 opacity-70">J</span>
          </div>
          <div className="text-[8px] opacity-60 text-white">
            {(intensity * 100).toFixed(0)}%
          </div>
        </div>
      </Html>
    </group>
  );
};

interface WakeZoneVisualizerProps {
  obstacle: Obstacle;
  windAngle: number;
  windSpeed: number;
  visible: boolean;
}

export const WakeZoneVisualizer: React.FC<WakeZoneVisualizerProps> = ({
  obstacle,
  windAngle,
  windSpeed,
  visible
}) => {
  const trailRef = useRef<THREE.Mesh>(null);
  
  const physics = OBSTACLE_DRAG_COEFFICIENTS[obstacle.type] || OBSTACLE_DRAG_COEFFICIENTS.building;
  const baseSize = Math.max(obstacle.width, obstacle.depth);
  const wakeLength = physics.wakeLength * baseSize * (0.6 + windSpeed * 0.02);
  
  const angleRad = (windAngle * Math.PI) / 180;

  // Create gradient trail geometry
  const trailGeometry = useMemo(() => {
    const segments = 12;
    const geometry = new THREE.PlaneGeometry(wakeLength, baseSize * 0.6, segments, 1);
    
    // Add vertex colors for gradient fade
    const colors = [];
    const positions = geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const progress = (x / wakeLength + 0.5); // 0 at start, 1 at end
      
      // Fade from cyan to transparent
      const alpha = Math.pow(1 - progress, 1.5);
      colors.push(0.05, 0.65, 0.9, alpha * 0.4);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    return geometry;
  }, [wakeLength, baseSize]);

  // Subtle animation
  useFrame((state) => {
    if (!visible || !trailRef.current) return;
    const time = state.clock.elapsedTime;
    // Very subtle pulse
    const material = trailRef.current.material as THREE.MeshBasicMaterial;
    if (material) {
      material.opacity = 0.15 + Math.sin(time * 2) * 0.03;
    }
  });

  if (!visible) return null;

  const obstacleCenter: [number, number, number] = [
    obstacle.x + obstacle.width / 2,
    obstacle.height * 0.4,
    obstacle.z + obstacle.depth / 2
  ];

  return (
    <group position={obstacleCenter} rotation={[0, -angleRad + Math.PI, 0]}>
      {/* Simple gradient trail on ground */}
      <mesh 
        ref={trailRef}
        position={[wakeLength / 2, -obstacle.height * 0.35, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[wakeLength, baseSize * 0.5, 8, 1]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Thin trailing lines - simple streamlines */}
      {[-0.15, 0, 0.15].map((offset, i) => (
        <mesh 
          key={i}
          position={[wakeLength / 2, 0, offset * baseSize]} 
          rotation={[0, 0, 0]}
        >
          <boxGeometry args={[wakeLength, 0.08, 0.08]} />
          <meshBasicMaterial
            color="#0ea5e9"
            transparent
            opacity={0.25 - Math.abs(offset) * 0.5}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Arrow indicator at end */}
      <mesh position={[wakeLength - 1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.3, 0.8, 4]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

interface CollisionHotspotManagerProps {
  obstacles: Obstacle[];
  obstacleEnergies: Map<string, number>;
  showHotspots: boolean;
  showWakeZones: boolean;
  windAngle: number;
  windSpeed?: number;
}

export const CollisionHotspotManager: React.FC<CollisionHotspotManagerProps> = ({
  obstacles,
  obstacleEnergies,
  showHotspots,
  showWakeZones,
  windAngle,
  windSpeed = 8
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
              windSpeed={windSpeed}
              visible={showWakeZones}
            />
          )}
        </group>
      ))}
    </group>
  );
};
