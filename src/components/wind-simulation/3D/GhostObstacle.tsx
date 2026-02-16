import React, { useMemo } from 'react';
import { Box, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { ObstacleType } from '../types';

interface GhostObstacleProps {
  position: [number, number, number];
  obstacleType: ObstacleType;
  visible: boolean;
}

export const GhostObstacle: React.FC<GhostObstacleProps> = ({ 
  position, 
  obstacleType,
  visible 
}) => {
  const dimensions = useMemo(() => {
    switch (obstacleType) {
      case 'skyscraper': return { width: 15, height: 45, depth: 10 };
      case 'tree': return { width: 10, height: 20, depth: 10 };
      case 'tower': return { width: 5, height: 35, depth: 5 };
      case 'fence': return { width: 10, height: 3, depth: 1 };
      case 'wall': return { width: 10, height: 8, depth: 3 };
      case 'house': return { width: 10, height: 12, depth: 10 };
      case 'wind_generator': return { width: 6, height: 30, depth: 6 };
      default: return { width: 10, height: 15, depth: 10 };
    }
  }, [obstacleType]);

  const ghostMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#39ff14', transparent: true, opacity: 0.15, side: THREE.DoubleSide,
  }), []);

  const wireMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#39ff14', transparent: true, opacity: 0.5, wireframe: true,
  }), []);

  if (!visible) return null;

  const renderGhost = () => {
    const p: [number, number, number] = [position[0], 0, position[2]];

    switch (obstacleType) {
      case 'tree':
        return (
          <group position={p}>
            <Cylinder args={[dimensions.width * 0.1, dimensions.width * 0.18, dimensions.height * 0.5, 8]} 
              position={[0, dimensions.height * 0.25, 0]} material={wireMat} />
            <Sphere args={[dimensions.width * 0.45, 8, 8]} 
              position={[0, dimensions.height * 0.7, 0]} material={wireMat} />
          </group>
        );

      case 'tower':
        return (
          <group position={p}>
            <Cylinder args={[dimensions.width * 0.2, dimensions.width * 0.4, dimensions.height, 6]} 
              position={[0, dimensions.height / 2, 0]} material={wireMat} />
          </group>
        );

      case 'fence':
        return (
          <group position={p}>
            <Box args={[dimensions.width, dimensions.height, 0.2]} 
              position={[0, dimensions.height / 2, 0]} material={wireMat} />
          </group>
        );

      case 'wind_generator':
        return (
          <group position={p}>
            <Cylinder args={[0.3, 0.5, dimensions.height, 6]} 
              position={[0, dimensions.height / 2, 0]} material={wireMat} />
            {/* Rotor circle */}
            <mesh position={[0, dimensions.height, 0]} rotation={[0, 0, 0]}>
              <ringGeometry args={[dimensions.width * 0.8, dimensions.width * 0.9, 24]} />
              <meshBasicMaterial color="#39ff14" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );

      case 'house':
        return (
          <group position={p}>
            <Box args={[dimensions.width, dimensions.height * 0.65, dimensions.depth]} 
              position={[0, dimensions.height * 0.325, 0]} material={wireMat} />
            <mesh position={[0, dimensions.height * 0.65 + dimensions.height * 0.175, 0]}>
              <coneGeometry args={[dimensions.width * 0.75, dimensions.height * 0.35, 4]} />
              <meshBasicMaterial color="#39ff14" transparent opacity={0.5} wireframe />
            </mesh>
          </group>
        );

      default:
        return (
          <group position={p}>
            <Box args={[dimensions.width, dimensions.height, dimensions.depth]} 
              position={[0, dimensions.height / 2, 0]} material={wireMat} />
          </group>
        );
    }
  };

  return (
    <group>
      {renderGhost()}
      <mesh position={[position[0], 0.1, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[dimensions.width * 0.4, dimensions.width * 0.5, 32]} />
        <meshBasicMaterial color="#39ff14" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
