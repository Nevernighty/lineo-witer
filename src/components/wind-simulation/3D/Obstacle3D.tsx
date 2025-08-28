import React, { useMemo } from 'react';
import { Box, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Obstacle } from '../types';

interface Obstacle3DProps {
  obstacle: Obstacle;
  isSelected?: boolean;
  isHovered?: boolean;
}

export const Obstacle3D: React.FC<Obstacle3DProps> = ({ 
  obstacle, 
  isSelected = false, 
  isHovered = false 
}) => {
  // Material based on obstacle type and state
  const material = useMemo(() => {
    let baseColor = '#666666';
    
    switch (obstacle.material) {
      case 'wood':
        baseColor = '#8B4513';
        break;
      case 'concrete':
        baseColor = '#808080';
        break;
      case 'steel':
        baseColor = '#C0C0C0';
        break;
      case 'glass':
        baseColor = '#87CEEB';
        break;
      case 'brick':
        baseColor = '#B22222';
        break;
    }

    if (isSelected) baseColor = '#00ff00';
    else if (isHovered) baseColor = '#ffff00';

    return new THREE.MeshPhongMaterial({ 
      color: baseColor,
      transparent: obstacle.material === 'glass',
      opacity: obstacle.material === 'glass' ? 0.7 : 1.0
    });
  }, [obstacle.material, isSelected, isHovered]);

  // Render different shapes based on obstacle type
  const renderShape = () => {
    const position: [number, number, number] = [
      obstacle.x + obstacle.width / 2,
      obstacle.y + obstacle.height / 2, 
      obstacle.z + obstacle.depth / 2
    ];

    switch (obstacle.type) {
      case 'tree':
        return (
          <group position={position}>
            {/* Tree trunk */}
            <Cylinder
              args={[obstacle.width * 0.2, obstacle.width * 0.3, obstacle.height * 0.6, 8]}
              position={[0, -obstacle.height * 0.2, 0]}
            >
              <meshPhongMaterial color="#8B4513" />
            </Cylinder>
            {/* Tree crown */}
            <Sphere
              args={[obstacle.width * 0.4, 8, 8]}
              position={[0, obstacle.height * 0.2, 0]}
            >
              <meshPhongMaterial color="#228B22" />
            </Sphere>
          </group>
        );

      case 'tower':
        return (
          <Cylinder
            args={[obstacle.width * 0.3, obstacle.width * 0.5, obstacle.height, 8]}
            position={position}
            material={material}
          />
        );

      case 'fence':
        return (
          <Box
            args={[obstacle.width, obstacle.height * 0.3, obstacle.depth * 0.2]}
            position={position}
            material={material}
          />
        );

      default: // building, skyscraper, house, wall
        return (
          <Box
            args={[obstacle.width, obstacle.height, obstacle.depth]}
            position={position}
            material={material}
          />
        );
    }
  };

  return (
    <group>
      {renderShape()}
      
      {/* Selection indicator */}
      {isSelected && (
        <Box
          args={[obstacle.width + 2, obstacle.height + 2, obstacle.depth + 2]}
          position={[
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height / 2,
            obstacle.z + obstacle.depth / 2
          ]}
        >
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={0.2}
            wireframe
          />
        </Box>
      )}
    </group>
  );
};