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
  isSelected?: boolean;
}

export const WakeZoneVisualizer: React.FC<WakeZoneVisualizerProps> = ({
  obstacle,
  windAngle,
  windSpeed,
  visible,
  isSelected = false
}) => {
  const flowFieldRef = useRef<THREE.Points>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  
  const physics = OBSTACLE_DRAG_COEFFICIENTS[obstacle.type] || OBSTACLE_DRAG_COEFFICIENTS.building;
  const baseSize = Math.max(obstacle.width, obstacle.depth);
  const wakeLength = physics.wakeLength * baseSize * (0.8 + windSpeed * 0.03);
  const wakeWidth = baseSize * 0.8;
  
  const angleRad = (windAngle * Math.PI) / 180;
  const velocityDeficit = ((1 - physics.porosityFactor) * 100).toFixed(0);

  // Create streamline particles for wake flow
  const streamlineGeometry = useMemo(() => {
    const count = 30;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const progress = Math.random();
      const spread = progress * wakeWidth * 0.4;
      const side = (Math.random() - 0.5) * 2;
      
      positions[i * 3] = progress * wakeLength * 0.9;
      positions[i * 3 + 1] = obstacle.height * 0.3 + Math.random() * obstacle.height * 0.4;
      positions[i * 3 + 2] = side * spread;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [wakeLength, wakeWidth, obstacle.height]);

  // Animate flow particles
  useFrame((state) => {
    if (!visible || !flowFieldRef.current) return;
    
    const positions = flowFieldRef.current.geometry.attributes.position;
    const speedFactor = windSpeed * 0.04;
    
    for (let i = 0; i < positions.count; i++) {
      let x = positions.getX(i);
      x += speedFactor;
      
      if (x > wakeLength * 0.9) {
        x = 0;
        positions.setY(i, obstacle.height * 0.3 + Math.random() * obstacle.height * 0.4);
        const spread = (x / wakeLength) * wakeWidth * 0.4;
        positions.setZ(i, (Math.random() - 0.5) * spread * 2);
      }
      
      positions.setX(i, x);
    }
    
    positions.needsUpdate = true;

    // Subtle cone animation
    if (coneRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      coneRef.current.scale.x = pulse;
    }
  });

  if (!visible) return null;

  const obstacleCenter: [number, number, number] = [
    obstacle.x + obstacle.width / 2,
    0,
    obstacle.z + obstacle.depth / 2
  ];

  return (
    <group position={obstacleCenter} rotation={[0, -angleRad + Math.PI, 0]}>
      {/* Wake cone - simple translucent shape */}
      <mesh 
        ref={coneRef}
        position={[wakeLength / 2, obstacle.height * 0.35, 0]} 
        rotation={[0, 0, Math.PI / 2]}
      >
        <coneGeometry args={[wakeWidth * 0.5, wakeLength, 16, 1, true]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Wake cone wireframe outline */}
      <lineSegments position={[wakeLength / 2, obstacle.height * 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <edgesGeometry args={[new THREE.ConeGeometry(wakeWidth * 0.5, wakeLength, 8, 1)]} />
        <lineBasicMaterial color="#0ea5e9" transparent opacity={0.3} />
      </lineSegments>

      {/* Animated flow particles */}
      <points ref={flowFieldRef} geometry={streamlineGeometry}>
        <pointsMaterial
          color="#0ea5e9"
          size={0.3}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Ground wake shadow - gradient fade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[wakeLength / 2, 0.1, 0]}>
        <planeGeometry args={[wakeLength, wakeWidth * 0.6]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>

      {/* Simple single marker at wake end showing velocity deficit */}
      <Html
        position={[wakeLength * 0.7, 0.5, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div 
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono"
          style={{ 
            backgroundColor: 'rgba(14,165,233,0.2)',
            border: '1px solid rgba(14,165,233,0.4)',
            color: '#0ea5e9'
          }}
        >
          <span className="opacity-70">−{velocityDeficit}%</span>
        </div>
      </Html>
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
