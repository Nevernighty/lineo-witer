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
      <mesh ref={pulseRef}>
        <sphereGeometry args={[size * 0.15, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.8 + intensity * 0.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[size * 0.25, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={intensity * 0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0, -cy + 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={intensity * 0.2} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -cy + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * (0.5 + intensity * 1.5), 32]} />
        <meshBasicMaterial color={new THREE.Color().lerpColors(new THREE.Color('#1a1aff'), new THREE.Color('#ff4400'), intensity)} transparent opacity={intensity * 0.15} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
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

// Enhanced wake zone with animated streamlines
interface WakeZoneVisualizerProps {
  obstacle: Obstacle;
  windAngle: number;
  windSpeed: number;
  visible: boolean;
  obstacleCount: number;
  turbulenceIntensity?: number;
  surfaceRoughness?: number;
}

// Animated streamline component
const AnimatedStreamline: React.FC<{ length: number; offset: number; yOffset: number }> = ({ length, offset, yOffset }) => {
  const lineRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!lineRef.current) return;
    const mat = lineRef.current.material as THREE.MeshBasicMaterial;
    // Animate dash effect via opacity pulsing along length
    mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 3 + offset * 5) * 0.1;
  });

  return (
    <mesh ref={lineRef} position={[length / 2, 0.08, yOffset]}>
      <boxGeometry args={[length, 0.04, 0.04]} />
      <meshBasicMaterial color="#0ea5e9" transparent opacity={0.2} depthWrite={false} />
    </mesh>
  );
};

export const WakeZoneVisualizer: React.FC<WakeZoneVisualizerProps> = ({
  obstacle, windAngle, windSpeed, visible, obstacleCount,
  turbulenceIntensity = 0.3, surfaceRoughness = 0.3
}) => {
  const trailRef = useRef<THREE.Mesh>(null);
  
  const physics = OBSTACLE_DRAG_COEFFICIENTS[obstacle.type] || OBSTACLE_DRAG_COEFFICIENTS.building;
  const baseSize = Math.max(obstacle.width, obstacle.depth);
  
  const cdFactor = physics.dragCoefficient / 1.4;
  const speedFactor = 0.8 + windSpeed * 0.04;
  const heightFactor = Math.min(obstacle.height / 15, 2.5);
  const roughnessFactor = 1 + surfaceRoughness * 0.3;
  const wakeLength = physics.wakeLength * speedFactor * cdFactor * heightFactor / roughnessFactor * Math.min(baseSize * 0.3, 15);
  
  const turbWidthFactor = 1 + turbulenceIntensity * 0.8;
  const wakeWidth = baseSize * 0.5 * turbWidthFactor;
  
  const angleRad = (windAngle * Math.PI) / 180;
  const recoveryDist = wakeLength * 0.85;

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -wakeWidth / 2);
    s.lineTo(0, wakeWidth / 2);
    s.lineTo(wakeLength, wakeWidth * 0.15);
    s.lineTo(wakeLength, -wakeWidth * 0.15);
    s.closePath();
    return s;
  }, [wakeLength, wakeWidth]);

  useFrame((state) => {
    if (!visible || !trailRef.current) return;
    const time = state.clock.elapsedTime;
    const mat = trailRef.current.material as THREE.MeshBasicMaterial;
    if (mat) mat.opacity = 0.18 + Math.sin(time * 1.5) * 0.04;
  });

  if (!visible) return null;

  const cx = obstacle.x + obstacle.width / 2;
  const cz = obstacle.z + obstacle.depth / 2;
  const showMarkers = obstacleCount <= 6;

  const deficitMarkers = [2, 5, 10].map(multiplier => {
    const dist = baseSize * multiplier * 0.3;
    if (dist > wakeLength) return null;
    const deficit = Math.round(60 * Math.exp(-2 * dist / wakeLength) * cdFactor);
    return { multiplier, dist, deficit };
  }).filter(Boolean) as { multiplier: number; dist: number; deficit: number }[];

  return (
    <group position={[cx, 0.15, cz]} rotation={[0, -angleRad + Math.PI, 0]}>
      {/* Ground ribbon */}
      <mesh ref={trailRef} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Ground shadow under wake */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[wakeLength * 0.3, -0.1, 0]}>
        <circleGeometry args={[wakeWidth * 0.8, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Animated streamlines */}
      {[-0.3, 0, 0.3].map((offset, i) => (
        <AnimatedStreamline key={i} length={wakeLength * 0.8} offset={offset} yOffset={wakeWidth * offset} />
      ))}

      {/* Boundary lines */}
      <mesh position={[wakeLength / 2, 0.06, wakeWidth / 2]}>
        <boxGeometry args={[wakeLength, 0.03, 0.03]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <mesh position={[wakeLength / 2, 0.06, -wakeWidth / 2]}>
        <boxGeometry args={[wakeLength, 0.03, 0.03]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {/* Center streamline */}
      <mesh position={[wakeLength / 2, 0.05, 0]}>
        <boxGeometry args={[wakeLength, 0.06, 0.06]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Recovery zone marker */}
      {showMarkers && recoveryDist < wakeLength && (
        <group position={[recoveryDist, 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, wakeWidth * 0.3]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <Html position={[0, 0.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="text-[7px] font-mono px-1 rounded" style={{
              backgroundColor: 'rgba(0,0,0,0.7)', color: '#22c55e', whiteSpace: 'nowrap'
            }}>90%</div>
          </Html>
        </group>
      )}

      {/* Velocity deficit markers */}
      {showMarkers && deficitMarkers.map(({ multiplier, dist, deficit }) => (
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
      ))}

      {showMarkers && (
        <Html position={[1, 1, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="text-[7px] font-mono px-1 rounded" style={{
            backgroundColor: 'rgba(0,0,0,0.75)', color: '#67e8f9', whiteSpace: 'nowrap'
          }}>
            L={wakeLength.toFixed(0)}m Cd={physics.dragCoefficient}
          </div>
        </Html>
      )}

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
  turbulenceIntensity?: number;
  surfaceRoughness?: number;
}

export const CollisionHotspotManager: React.FC<CollisionHotspotManagerProps> = ({
  obstacles, obstacleEnergies, showHotspots, showWakeZones, windAngle, 
  windSpeed = 8, turbulenceIntensity = 0.3, surfaceRoughness = 0.3
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
              turbulenceIntensity={turbulenceIntensity}
              surfaceRoughness={surfaceRoughness}
            />
          )}
        </group>
      ))}
    </group>
  );
};
