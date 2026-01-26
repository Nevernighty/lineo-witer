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
    const width = obstacleType === 'skyscraper' ? 15 : 10;
    const height = obstacleType === 'tree' ? 20 : obstacleType === 'skyscraper' ? 40 : 15;
    const depth = 10;
    return { width, height, depth };
  }, [obstacleType]);

  const ghostMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#39ff14',
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
  }, []);

  const wireframeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#39ff14',
      transparent: true,
      opacity: 0.6,
      wireframe: true,
    });
  }, []);

  if (!visible) return null;

  const renderGhost = () => {
    const centerPos: [number, number, number] = [
      position[0],
      position[1] + dimensions.height / 2,
      position[2]
    ];

    switch (obstacleType) {
      case 'tree':
        return (
          <group position={centerPos}>
            {/* Tree trunk ghost */}
            <Cylinder
              args={[dimensions.width * 0.2, dimensions.width * 0.3, dimensions.height * 0.6, 8]}
              position={[0, -dimensions.height * 0.2, 0]}
              material={ghostMaterial}
            />
            {/* Tree crown ghost */}
            <Sphere
              args={[dimensions.width * 0.4, 8, 8]}
              position={[0, dimensions.height * 0.2, 0]}
              material={ghostMaterial}
            />
            {/* Wireframe overlay */}
            <Cylinder
              args={[dimensions.width * 0.2, dimensions.width * 0.3, dimensions.height * 0.6, 8]}
              position={[0, -dimensions.height * 0.2, 0]}
              material={wireframeMaterial}
            />
            <Sphere
              args={[dimensions.width * 0.4, 8, 8]}
              position={[0, dimensions.height * 0.2, 0]}
              material={wireframeMaterial}
            />
          </group>
        );

      case 'tower':
        return (
          <group position={centerPos}>
            <Cylinder
              args={[dimensions.width * 0.3, dimensions.width * 0.5, dimensions.height, 8]}
              material={ghostMaterial}
            />
            <Cylinder
              args={[dimensions.width * 0.3, dimensions.width * 0.5, dimensions.height, 8]}
              material={wireframeMaterial}
            />
          </group>
        );

      default:
        return (
          <group position={centerPos}>
            <Box
              args={[dimensions.width, dimensions.height, dimensions.depth]}
              material={ghostMaterial}
            />
            <Box
              args={[dimensions.width, dimensions.height, dimensions.depth]}
              material={wireframeMaterial}
            />
          </group>
        );
    }
  };

  return (
    <group>
      {renderGhost()}
      {/* Ground marker */}
      <mesh position={[position[0], 0.1, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[dimensions.width * 0.4, dimensions.width * 0.5, 32]} />
        <meshBasicMaterial color="#39ff14" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
