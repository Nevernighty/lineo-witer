import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Cylinder, Box } from '@react-three/drei';
import * as THREE from 'three';
import { Obstacle } from '../types';
import { WindPhysicsConfig, calculateWindShear } from './WindPhysicsEngine';

interface WindGenerator3DProps {
  obstacle: Obstacle;
  config: WindPhysicsConfig;
  isSelected?: boolean;
}

// P = 0.5 * ρ * A * v³ * Cp
function calculateGeneratorPower(
  airDensity: number,
  rotorDiameter: number,
  windSpeed: number,
  height: number,
  refHeight: number,
  surfaceRoughness: number
): number {
  const adjustedSpeed = calculateWindShear(windSpeed, refHeight, Math.max(1, height), surfaceRoughness);
  const area = Math.PI * Math.pow(rotorDiameter / 2, 2);
  const Cp = 0.40; // Practical efficiency (Betz limit ~0.593)
  return 0.5 * airDensity * area * Math.pow(adjustedSpeed, 3) * Cp;
}

export const WindGenerator3D: React.FC<WindGenerator3DProps> = ({ obstacle, config, isSelected = false }) => {
  const bladesRef = useRef<THREE.Group>(null);
  const towerHeight = obstacle.height;
  const rotorDiameter = obstacle.width * 1.8;
  const nacelleSize = obstacle.width * 0.35;

  const power = useMemo(() => {
    return calculateGeneratorPower(
      config.airDensity,
      rotorDiameter,
      config.windSpeed,
      towerHeight + obstacle.y,
      config.referenceHeight,
      config.surfaceRoughness
    );
  }, [config.airDensity, config.windSpeed, config.referenceHeight, config.surfaceRoughness, rotorDiameter, towerHeight, obstacle.y]);

  const adjustedSpeed = useMemo(() => {
    return calculateWindShear(config.windSpeed, config.referenceHeight, Math.max(1, towerHeight + obstacle.y), config.surfaceRoughness);
  }, [config.windSpeed, config.referenceHeight, config.surfaceRoughness, towerHeight, obstacle.y]);

  // Rotate blades based on wind speed
  useFrame((_, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += adjustedSpeed * 0.15 * delta;
    }
  });

  const position: [number, number, number] = [
    obstacle.x + obstacle.width / 2,
    obstacle.y,
    obstacle.z + obstacle.depth / 2
  ];

  const towerColor = isSelected ? '#00ff00' : '#8899aa';
  const nacelleColor = isSelected ? '#00ff00' : '#ccddee';

  const powerStr = power >= 1000 ? `${(power / 1000).toFixed(1)} kW` : `${power.toFixed(0)} W`;

  return (
    <group position={position}>
      {/* Tower - tapered cylinder */}
      <Cylinder
        args={[obstacle.width * 0.12, obstacle.width * 0.2, towerHeight, 8]}
        position={[0, towerHeight / 2, 0]}
      >
        <meshPhongMaterial color={towerColor} />
      </Cylinder>

      {/* Nacelle */}
      <Box args={[nacelleSize, nacelleSize * 0.5, nacelleSize * 0.7]} position={[0, towerHeight, 0]}>
        <meshPhongMaterial color={nacelleColor} />
      </Box>

      {/* Hub */}
      <mesh position={[0, towerHeight, nacelleSize * 0.4]}>
        <sphereGeometry args={[nacelleSize * 0.2, 8, 8]} />
        <meshPhongMaterial color="#ffffff" />
      </mesh>

      {/* Blades group - rotates */}
      <group ref={bladesRef} position={[0, towerHeight, nacelleSize * 0.5]}>
        {[0, 1, 2].map((i) => {
          const angle = (i * Math.PI * 2) / 3;
          return (
            <group key={i} rotation={[0, 0, angle]}>
              {/* Blade - elongated tapered shape */}
              <mesh position={[0, rotorDiameter * 0.25, 0]}>
                <boxGeometry args={[0.4, rotorDiameter * 0.48, 0.15]} />
                <meshPhongMaterial color="#e8e8e8" />
              </mesh>
              {/* Blade tip */}
              <mesh position={[0, rotorDiameter * 0.48, 0]}>
                <boxGeometry args={[0.25, rotorDiameter * 0.06, 0.1]} />
                <meshPhongMaterial color="#dddddd" />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Power label */}
      <Html position={[0, towerHeight + 4, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="rounded px-1.5 py-0.5 text-center border shadow-lg" style={{
          backgroundColor: 'rgba(0,0,0,0.85)',
          borderColor: '#39ff1450',
          minWidth: '50px'
        }}>
          <div className="text-[8px] text-green-400 font-semibold">⚡</div>
          <div className="text-white text-xs font-mono font-semibold">{powerStr}</div>
        </div>
      </Html>

      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, towerHeight / 2, 0]}>
          <cylinderGeometry args={[rotorDiameter * 0.55, rotorDiameter * 0.55, towerHeight + 4, 16]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.1} wireframe />
        </mesh>
      )}
    </group>
  );
};

export { calculateGeneratorPower };
