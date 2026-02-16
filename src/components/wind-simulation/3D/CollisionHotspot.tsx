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
  obstacle, energy, maxEnergy, visible
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  
  const intensity = useMemo(() => maxEnergy <= 0 ? 0 : Math.min(energy / maxEnergy, 1), [energy, maxEnergy]);
  const energyLevel = useMemo(() => getEnergyLevel(intensity), [intensity]);

  useFrame((state) => {
    if (!visible || !pulseRef.current) return;
    const time = state.clock.elapsedTime;
    const pulse = 0.9 + Math.sin(time * 4) * 0.1;
    pulseRef.current.scale.setScalar(pulse);
  });

  if (!visible || intensity < 0.02) return null;

  const cx = obstacle.x + obstacle.width / 2;
  const cy = obstacle.y + obstacle.height + 0.5;
  const cz = obstacle.z + obstacle.depth / 2;
  const color = new THREE.Color(energyLevel.color);
  const size = Math.max(obstacle.width, obstacle.depth) * 0.3;

  return (
    <group ref={groupRef} position={[cx, cy, cz]}>
      {/* Central glow */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[size * 0.15, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.8 + intensity * 0.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[size * 0.25, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={intensity * 0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Ground heatmap circle */}
      <mesh position={[0, -cy + 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={intensity * 0.2} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Compact label */}
      <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="rounded px-1.5 py-0.5 text-center border shadow-lg"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', borderColor: `${energyLevel.color}50`, minWidth: '50px' }}>
          <div className="text-[8px] font-bold tracking-wider" style={{ color: energyLevel.color }}>{energyLevel.label}</div>
          <div className="text-white text-xs font-mono font-semibold">{energy.toFixed(1)}<span className="text-[8px] ml-0.5 opacity-70">J</span></div>
        </div>
      </Html>
    </group>
  );
};

// Clean wake zone visualization - tapered ribbon on ground
interface WakeZoneVisualizerProps {
  obstacle: Obstacle;
  windAngle: number;
  windSpeed: number;
  visible: boolean;
  obstacleCount: number;
}

export const WakeZoneVisualizer: React.FC<WakeZoneVisualizerProps> = ({
  obstacle, windAngle, windSpeed, visible, obstacleCount
}) => {
  const trailRef = useRef<THREE.Mesh>(null);
  
  const physics = OBSTACLE_DRAG_COEFFICIENTS[obstacle.type] || OBSTACLE_DRAG_COEFFICIENTS.building;
  const baseSize = Math.max(obstacle.width, obstacle.depth);
  const wakeLength = physics.wakeLength * (0.8 + windSpeed * 0.04) * Math.min(baseSize * 0.3, 15);
  const wakeWidth = baseSize * 0.5;
  
  const angleRad = (windAngle * Math.PI) / 180;

  // Create tapered shape geometry
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // Trapezoid: wide at obstacle, narrow at end
    s.moveTo(0, -wakeWidth / 2);
    s.lineTo(0, wakeWidth / 2);
    s.lineTo(wakeLength, wakeWidth * 0.15);
    s.lineTo(wakeLength, -wakeWidth * 0.15);
    s.closePath();
    return s;
  }, [wakeLength, wakeWidth]);

  const shapeGeometry = useMemo(() => {
    const geo = new THREE.ShapeGeometry(shape);
    // Add vertex colors for gradient fade
    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 4);
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const progress = x / wakeLength;
      const alpha = Math.pow(1 - progress, 2) * 0.3;
      colors[i * 4] = 0.05;
      colors[i * 4 + 1] = 0.55;
      colors[i * 4 + 2] = 0.85;
      colors[i * 4 + 3] = alpha;
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    return geo;
  }, [shape, wakeLength]);

  useFrame((state) => {
    if (!visible || !trailRef.current) return;
    const time = state.clock.elapsedTime;
    const mat = trailRef.current.material as THREE.MeshBasicMaterial;
    if (mat) mat.opacity = 0.18 + Math.sin(time * 1.5) * 0.04;
  });

  if (!visible) return null;

  const cx = obstacle.x + obstacle.width / 2;
  const cz = obstacle.z + obstacle.depth / 2;

  // Show velocity deficit markers only when few obstacles
  const showMarkers = obstacleCount <= 5;

  return (
    <group position={[cx, 0.15, cz]} rotation={[0, -angleRad + Math.PI, 0]}>
      {/* Ground ribbon */}
      <mesh ref={trailRef} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Center streamline with animated dash */}
      <mesh position={[wakeLength / 2, 0.05, 0]}>
        <boxGeometry args={[wakeLength, 0.06, 0.06]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Velocity deficit markers at 2D, 5D, 10D */}
      {showMarkers && [2, 5, 10].map(multiplier => {
        const dist = baseSize * multiplier * 0.3;
        if (dist > wakeLength) return null;
        const deficit = Math.round(60 * Math.exp(-2 * dist / wakeLength));
        return (
          <group key={multiplier} position={[dist, 0, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.15, wakeWidth * (1 - dist / wakeLength) * 0.8]} />
              <meshBasicMaterial color="#0ea5e9" transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            <Html position={[0, 0.5, 0]} center style={{ pointerEvents: 'none' }}>
              <div className="text-[7px] font-mono px-1 rounded" style={{
                backgroundColor: 'rgba(0,0,0,0.7)', color: '#38bdf8', whiteSpace: 'nowrap'
              }}>
                {multiplier}D: -{deficit}%
              </div>
            </Html>
          </group>
        );
      })}

      {/* Terminal arrow */}
      <mesh position={[wakeLength - 0.5, 0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.2, 0.6, 4]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.25} depthWrite={false} />
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
  obstacles, obstacleEnergies, showHotspots, showWakeZones, windAngle, windSpeed = 8
}) => {
  const maxEnergy = useMemo(() => {
    let max = 1;
    obstacleEnergies.forEach((energy) => { if (energy > max) max = energy; });
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
              obstacleCount={obstacles.length}
            />
          )}
        </group>
      ))}
    </group>
  );
};
