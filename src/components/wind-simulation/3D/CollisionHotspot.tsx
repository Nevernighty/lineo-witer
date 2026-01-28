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
  low: { threshold: 0.25, label: 'Low', color: '#22c55e' },
  medium: { threshold: 0.5, label: 'Medium', color: '#eab308' },
  high: { threshold: 0.75, label: 'High', color: '#f97316' },
  critical: { threshold: 1.0, label: 'Critical', color: '#ef4444' }
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
  const particleRef = useRef<THREE.Points>(null);
  
  // Calculate intensity based on energy
  const intensity = useMemo(() => {
    if (maxEnergy <= 0) return 0;
    return Math.min(energy / maxEnergy, 1);
  }, [energy, maxEnergy]);

  const energyLevel = useMemo(() => getEnergyLevel(intensity), [intensity]);

  // Create heatmap gradient geometry
  const heatmapGeometry = useMemo(() => {
    const size = Math.max(obstacle.width, obstacle.depth) * 1.5;
    const segments = 32;
    const geometry = new THREE.CircleGeometry(size, segments);
    
    // Add vertex colors for gradient effect
    const colors = [];
    const positions = geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const distance = Math.sqrt(x * x + z * z) / size;
      
      // Gradient from center (hot) to edge (cool)
      const r = 1 - distance * 0.5;
      const g = 0.3 - distance * 0.3;
      const b = 0;
      colors.push(r, g, b);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geometry;
  }, [obstacle.width, obstacle.depth]);

  // Create particle field for energy visualization
  const particleGeometry = useMemo(() => {
    const count = 50;
    const positions = new Float32Array(count * 3);
    const size = Math.max(obstacle.width, obstacle.depth);
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * size * 0.8;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * obstacle.height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [obstacle.width, obstacle.depth, obstacle.height]);

  // Animate the hotspot
  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Animate concentric rings
    ringRefs.current.forEach((ring, i) => {
      if (ring) {
        const phase = (time * 2 + i * 0.5) % 2;
        const scale = 0.5 + phase * 0.5;
        ring.scale.setScalar(scale);
        if (ring.material instanceof THREE.MeshBasicMaterial) {
          ring.material.opacity = (1 - phase / 2) * intensity * 0.4;
        }
      }
    });

    // Animate energy particles
    if (particleRef.current) {
      particleRef.current.rotation.y = time * 0.5;
      const positions = particleRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        positions.setY(i, y + Math.sin(time * 3 + i) * 0.02);
      }
      positions.needsUpdate = true;
    }
  });

  if (!visible || intensity < 0.05) return null;

  const position: [number, number, number] = [
    obstacle.x + obstacle.width / 2,
    obstacle.y + 0.1,
    obstacle.z + obstacle.depth / 2
  ];

  const color = new THREE.Color(energyLevel.color);
  const size = Math.max(obstacle.width, obstacle.depth);

  return (
    <group ref={groupRef} position={position}>
      {/* Ground heatmap */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <primitive object={heatmapGeometry} attach="geometry" />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={intensity * 0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Concentric pulse rings */}
      {[0, 1, 2].map((i) => (
        <mesh 
          key={i}
          ref={(el) => { if (el) ringRefs.current[i] = el; }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.05 + i * 0.02, 0]}
        >
          <ringGeometry args={[size * 0.3, size * 0.35, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={intensity * 0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Energy particle field */}
      <points ref={particleRef} geometry={particleGeometry}>
        <pointsMaterial
          color={color}
          size={0.5 + intensity * 0.5}
          transparent
          opacity={intensity * 0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Vertical energy column */}
      <mesh position={[0, obstacle.height / 2, 0]}>
        <cylinderGeometry args={[size * 0.1, size * 0.3, obstacle.height, 16, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={intensity * 0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Data label */}
      <Html
        position={[0, obstacle.height + 5, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded px-2 py-1 min-w-[80px] text-center">
          <div 
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: energyLevel.color }}
          >
            {energyLevel.label}
          </div>
          <div className="text-white text-xs font-mono">
            {energy.toFixed(1)} J
          </div>
          <div className="text-white/60 text-[9px]">
            {(intensity * 100).toFixed(0)}% capacity
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
  const flowFieldRef = useRef<THREE.Points>(null);
  const turbulenceRef = useRef<THREE.Group>(null);
  const streamlinesRef = useRef<THREE.Line[]>([]);
  
  const physics = OBSTACLE_DRAG_COEFFICIENTS[obstacle.type] || OBSTACLE_DRAG_COEFFICIENTS.building;
  const wakeLength = physics.wakeLength * Math.max(obstacle.width, obstacle.depth) * (1 + windSpeed * 0.05);
  const wakeWidth = Math.max(obstacle.width, obstacle.depth) * 1.2;
  
  const angleRad = (windAngle * Math.PI) / 180;

  // Create flow field particles
  const flowFieldGeometry = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Distribute particles in wake zone
      const progress = Math.random();
      const spread = (1 - Math.pow(1 - progress, 2)) * wakeWidth;
      
      positions[i * 3] = progress * wakeLength;
      positions[i * 3 + 1] = Math.random() * obstacle.height * 0.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
      
      // Store velocity for animation
      velocities[i * 3] = 0.5 + Math.random() * 0.5;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    return geometry;
  }, [wakeLength, wakeWidth, obstacle.height]);

  // Create streamline curves
  const streamlines = useMemo(() => {
    const lines: THREE.BufferGeometry[] = [];
    const numLines = 8;
    
    for (let i = 0; i < numLines; i++) {
      const points: THREE.Vector3[] = [];
      const offset = ((i / (numLines - 1)) - 0.5) * wakeWidth * 0.8;
      const segments = 20;
      
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const x = t * wakeLength;
        const turbulence = Math.sin(t * Math.PI * 3 + i) * (1 - t) * 2;
        const y = obstacle.height * 0.3 + turbulence;
        const z = offset + Math.sin(t * Math.PI * 2 + i * 0.5) * (1 - t) * wakeWidth * 0.3;
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(30));
      lines.push(geometry);
    }
    
    return lines;
  }, [wakeLength, wakeWidth, obstacle.height]);

  // Animate flow field
  useFrame((state) => {
    if (!visible) return;
    
    const time = state.clock.elapsedTime;
    
    // Animate flow field particles
    if (flowFieldRef.current) {
      const positions = flowFieldRef.current.geometry.attributes.position;
      const velocities = flowFieldRef.current.geometry.attributes.velocity;
      
      for (let i = 0; i < positions.count; i++) {
        let x = positions.getX(i);
        const vx = velocities.getX(i);
        
        x += vx * 0.3 * (windSpeed / 10);
        
        // Reset particle when it exits wake zone
        if (x > wakeLength) {
          x = 0;
          positions.setY(i, Math.random() * obstacle.height * 0.8);
          positions.setZ(i, (Math.random() - 0.5) * wakeWidth * 0.3);
        }
        
        // Add turbulence
        const progress = x / wakeLength;
        const turbFactor = 1 - progress;
        positions.setY(i, positions.getY(i) + Math.sin(time * 5 + i) * 0.05 * turbFactor);
        positions.setZ(i, positions.getZ(i) + Math.cos(time * 4 + i * 0.5) * 0.03 * turbFactor);
        
        positions.setX(i, x);
      }
      
      positions.needsUpdate = true;
    }

    // Rotate turbulence indicators
    if (turbulenceRef.current) {
      turbulenceRef.current.children.forEach((child, i) => {
        child.rotation.x = time * (2 + i * 0.3);
        child.rotation.z = time * (1.5 + i * 0.2);
      });
    }
  });

  if (!visible) return null;

  const obstacleCenter: [number, number, number] = [
    obstacle.x + obstacle.width / 2,
    0,
    obstacle.z + obstacle.depth / 2
  ];

  // Calculate velocity deficit zones
  const deficitZones = [
    { distance: 0.2, deficit: 0.7, color: '#ef4444' },
    { distance: 0.4, deficit: 0.5, color: '#f97316' },
    { distance: 0.6, deficit: 0.3, color: '#eab308' },
    { distance: 0.8, deficit: 0.15, color: '#22c55e' }
  ];

  return (
    <group position={obstacleCenter} rotation={[0, -angleRad + Math.PI, 0]}>
      {/* Wake zone boundary */}
      <mesh position={[wakeLength / 2, obstacle.height * 0.3, 0]}>
        <boxGeometry args={[wakeLength, obstacle.height * 0.6, wakeWidth]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.05}
          depthWrite={false}
        />
      </mesh>

      {/* Velocity deficit gradient planes */}
      {deficitZones.map((zone, i) => (
        <mesh
          key={i}
          position={[zone.distance * wakeLength, obstacle.height * 0.3, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[wakeWidth * (1 - zone.distance * 0.3), obstacle.height * 0.5]} />
          <meshBasicMaterial
            color={zone.color}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Animated flow field particles */}
      <points ref={flowFieldRef} geometry={flowFieldGeometry}>
        <pointsMaterial
          color="#00ffff"
          size={0.4}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Streamlines */}
      {streamlines.map((geometry, i) => (
        <lineSegments key={i}>
          <primitive object={geometry} attach="geometry" />
          <lineBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.3}
          />
        </lineSegments>
      ))}

      {/* Turbulence vortex indicators */}
      <group ref={turbulenceRef} position={[wakeLength * 0.3, obstacle.height * 0.3, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[i * wakeLength * 0.15, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * wakeWidth * 0.5]}
          >
            <torusGeometry args={[1.5 + i * 0.3, 0.15, 8, 16]} />
            <meshBasicMaterial
              color="#00ffff"
              transparent
              opacity={0.25 - i * 0.05}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* Wake zone data label */}
      <Html
        position={[wakeLength * 0.5, obstacle.height + 3, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-[#0a2a2a]/90 backdrop-blur-sm border border-[#00ffff]/30 rounded px-2.5 py-1.5 min-w-[100px]">
          <div className="text-[#00ffff] text-[10px] font-bold uppercase tracking-wide text-center mb-1">
            Wake Zone
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
            <span className="text-[#00ffff]/70">Length:</span>
            <span className="text-white font-mono">{wakeLength.toFixed(1)}m</span>
            <span className="text-[#00ffff]/70">Width:</span>
            <span className="text-white font-mono">{wakeWidth.toFixed(1)}m</span>
            <span className="text-[#00ffff]/70">Deficit:</span>
            <span className="text-[#f97316] font-mono">{((1 - physics.porosityFactor) * 100).toFixed(0)}%</span>
          </div>
        </div>
      </Html>

      {/* Velocity deficit legend on ground */}
      <Html
        position={[wakeLength * 0.5, 0.5, wakeWidth * 0.6]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex gap-1 text-[8px]">
          {deficitZones.map((zone, i) => (
            <div key={i} className="flex items-center gap-0.5">
              <div 
                className="w-2 h-2 rounded-sm" 
                style={{ backgroundColor: zone.color }}
              />
              <span className="text-white/70">-{(zone.deficit * 100).toFixed(0)}%</span>
            </div>
          ))}
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
