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
  const material = useMemo(() => {
    let baseColor = '#666666';
    switch (obstacle.material) {
      case 'wood': baseColor = '#8B4513'; break;
      case 'concrete': baseColor = '#808080'; break;
      case 'steel': baseColor = '#C0C0C0'; break;
      case 'glass': baseColor = '#87CEEB'; break;
      case 'brick': baseColor = '#B22222'; break;
    }
    if (isSelected) baseColor = '#00ff00';
    else if (isHovered) baseColor = '#ffff00';

    return new THREE.MeshPhongMaterial({ 
      color: baseColor,
      transparent: obstacle.material === 'glass',
      opacity: obstacle.material === 'glass' ? 0.7 : 1.0
    });
  }, [obstacle.material, isSelected, isHovered]);

  const rotationY = ((obstacle.rotation || 0) * Math.PI) / 180;
  const rotX = obstacle.rotationX || 0;
  const rotZ = obstacle.rotationZ || 0;
  const scaleVal = obstacle.scale || 1;

  const renderShape = () => {
    const cx = obstacle.x + obstacle.width / 2;
    const cz = obstacle.z + obstacle.depth / 2;

    switch (obstacle.type) {
      case 'tree': {
        const trunkH = obstacle.height * 0.5;
        const crownR = obstacle.width * 0.45;
        return (
          <group position={[cx, 0, cz]}>
            {/* Trunk */}
            <Cylinder args={[obstacle.width * 0.1, obstacle.width * 0.18, trunkH, 8]} position={[0, trunkH / 2, 0]}>
              <meshPhongMaterial color="#6B3410" />
            </Cylinder>
            {/* Main crown */}
            <Sphere args={[crownR, 10, 10]} position={[0, trunkH + crownR * 0.5, 0]}>
              <meshPhongMaterial color="#1a7a1a" />
            </Sphere>
            {/* Sub-crowns */}
            <Sphere args={[crownR * 0.75, 8, 8]} position={[crownR * 0.5, trunkH + crownR * 0.3, crownR * 0.3]}>
              <meshPhongMaterial color="#228B22" />
            </Sphere>
            <Sphere args={[crownR * 0.7, 8, 8]} position={[-crownR * 0.4, trunkH + crownR * 0.6, -crownR * 0.3]}>
              <meshPhongMaterial color="#2d8f2d" />
            </Sphere>
            {/* Branches */}
            <Cylinder args={[0.12, 0.08, trunkH * 0.4, 4]} position={[crownR * 0.3, trunkH * 0.7, 0]} rotation={[0, 0, -0.5]}>
              <meshPhongMaterial color="#5a2d0c" />
            </Cylinder>
            <Cylinder args={[0.1, 0.06, trunkH * 0.35, 4]} position={[-crownR * 0.25, trunkH * 0.6, crownR * 0.2]} rotation={[0.3, 0, 0.4]}>
              <meshPhongMaterial color="#5a2d0c" />
            </Cylinder>
          </group>
        );
      }

      case 'house': {
        const wallH = obstacle.height * 0.65;
        const roofH = obstacle.height * 0.35;
        return (
          <group position={[cx, 0, cz]}>
            <Box args={[obstacle.width, wallH, obstacle.depth]} position={[0, wallH / 2, 0]} material={material} />
            {/* Roof */}
            <mesh position={[0, wallH + roofH / 2, 0]}>
              <coneGeometry args={[obstacle.width * 0.75, roofH, 4]} />
              <meshPhongMaterial color="#8B4513" />
            </mesh>
            {/* Chimney */}
            <Cylinder args={[0.5, 0.5, roofH * 0.8, 6]} position={[obstacle.width * 0.25, wallH + roofH * 0.5, 0]}>
              <meshPhongMaterial color="#6b3a2a" />
            </Cylinder>
            {/* Door */}
            <Box args={[obstacle.width * 0.2, wallH * 0.45, 0.2]} position={[0, wallH * 0.22, obstacle.depth / 2 + 0.1]}>
              <meshPhongMaterial color="#5a3a1a" />
            </Box>
            {/* Windows */}
            {[-1, 1].map(side => (
              <Box key={side} args={[obstacle.width * 0.15, wallH * 0.2, 0.15]} position={[side * obstacle.width * 0.28, wallH * 0.55, obstacle.depth / 2 + 0.1]}>
                <meshPhongMaterial color="#87CEEB" transparent opacity={0.7} />
              </Box>
            ))}
            {/* Porch */}
            <Box args={[obstacle.width * 0.4, 0.15, 1.5]} position={[0, 0.08, obstacle.depth / 2 + 0.75]}>
              <meshPhongMaterial color="#9a7a4a" />
            </Box>
            {[-1, 1].map(side => (
              <Cylinder key={`porch-${side}`} args={[0.12, 0.12, wallH * 0.4, 6]} position={[side * obstacle.width * 0.18, wallH * 0.2, obstacle.depth / 2 + 1.4]}>
                <meshPhongMaterial color="#8a6a3a" />
              </Cylinder>
            ))}
            {/* Drainpipe */}
            <Cylinder args={[0.08, 0.08, wallH, 6]} position={[-obstacle.width / 2 - 0.1, wallH / 2, obstacle.depth * 0.3]}>
              <meshPhongMaterial color="#777777" />
            </Cylinder>
          </group>
        );
      }

      case 'building': {
        const floors = Math.max(2, Math.round(obstacle.height / 4));
        return (
          <group position={[cx, 0, cz]}>
            <Box args={[obstacle.width, obstacle.height, obstacle.depth]} position={[0, obstacle.height / 2, 0]} material={material} />
            {/* Parapet */}
            <Box args={[obstacle.width + 0.5, 0.5, obstacle.depth + 0.5]} position={[0, obstacle.height, 0]}>
              <meshPhongMaterial color="#606060" />
            </Box>
            {/* Windows */}
            {Array.from({ length: floors }).map((_, fi) => (
              [-1, 1].map(side => (
                <Box key={`${fi}-${side}`} args={[obstacle.width * 0.18, 1.2, 0.15]}
                  position={[side * obstacle.width * 0.28, 2 + fi * (obstacle.height / floors), obstacle.depth / 2 + 0.1]}>
                  <meshPhongMaterial color="#6ab8e8" transparent opacity={0.6} />
                </Box>
              ))
            ))}
            {/* Door */}
            <Box args={[obstacle.width * 0.25, 2.5, 0.2]} position={[0, 1.25, obstacle.depth / 2 + 0.1]}>
              <meshPhongMaterial color="#4a3520" />
            </Box>
            {/* AC units on side walls */}
            {Array.from({ length: Math.min(floors, 3) }).map((_, fi) => (
              <Box key={`ac-${fi}`} args={[0.2, 0.8, 0.6]}
                position={[obstacle.width / 2 + 0.1, 3 + fi * (obstacle.height / floors), obstacle.depth * 0.2]}>
                <meshPhongMaterial color="#aaaaaa" />
              </Box>
            ))}
          </group>
        );
      }

      case 'skyscraper': {
        const stepH = obstacle.height * 0.7;
        const topH = obstacle.height * 0.25;
        const antennaH = obstacle.height * 0.12;
        return (
          <group position={[cx, 0, cz]}>
            <Box args={[obstacle.width, stepH, obstacle.depth]} position={[0, stepH / 2, 0]}>
              <meshPhongMaterial color="#7a8a9a" transparent opacity={0.85} />
            </Box>
            <Box args={[obstacle.width * 0.75, topH, obstacle.depth * 0.75]} position={[0, stepH + topH / 2, 0]}>
              <meshPhongMaterial color="#8899aa" transparent opacity={0.8} />
            </Box>
            {/* Horizontal bands */}
            {Array.from({ length: 8 }).map((_, i) => (
              <Box key={i} args={[obstacle.width + 0.1, 0.15, obstacle.depth + 0.1]} position={[0, 3 + i * (stepH / 8), 0]}>
                <meshPhongMaterial color="#4488bb" transparent opacity={0.4} />
              </Box>
            ))}
            {/* Emissive windows on upper floors */}
            {Array.from({ length: 4 }).map((_, i) => (
              [-1, 1].map(side => (
                <Box key={`glow-${i}-${side}`} args={[obstacle.width * 0.12, 0.8, 0.1]}
                  position={[side * obstacle.width * 0.25, stepH - 2 - i * 3, obstacle.depth / 2 + 0.1]}>
                  <meshBasicMaterial color="#ffdd66" />
                </Box>
              ))
            ))}
            {/* Antenna */}
            <Cylinder args={[0.15, 0.08, antennaH, 4]} position={[0, stepH + topH + antennaH / 2, 0]}>
              <meshPhongMaterial color="#cccccc" />
            </Cylinder>
            <mesh position={[0, stepH + topH + antennaH + 0.3, 0]}>
              <sphereGeometry args={[0.25, 8, 8]} />
              <meshBasicMaterial color="#ff3333" />
            </mesh>
            {/* Crane on roof */}
            <Cylinder args={[0.1, 0.1, topH * 0.8, 4]} position={[obstacle.width * 0.3, stepH + topH + topH * 0.4, 0]}>
              <meshPhongMaterial color="#ddaa00" />
            </Cylinder>
            <Box args={[topH * 0.6, 0.1, 0.1]} position={[obstacle.width * 0.3 + topH * 0.2, stepH + topH + topH * 0.8, 0]}>
              <meshPhongMaterial color="#ddaa00" />
            </Box>
          </group>
        );
      }

      case 'tower': {
        const legSpread = obstacle.width * 0.4;
        const legR = 0.25;
        return (
          <group position={[cx, 0, cz]}>
            {/* Legs */}
            {[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx, sz], i) => (
              <Cylinder key={i} args={[legR, legR * 1.5, obstacle.height, 6]}
                position={[sx * legSpread * (1 - 0.3), obstacle.height / 2, sz * legSpread * (1 - 0.3)]}
                rotation={[sz * 0.08, 0, -sx * 0.08]}>
                <meshPhongMaterial color="#aaaaaa" />
              </Cylinder>
            ))}
            {/* Cross braces */}
            {Array.from({ length: 4 }).map((_, i) => {
              const y = (i + 1) * obstacle.height / 5;
              const spread = legSpread * (1 - (y / obstacle.height) * 0.3);
              return (
                <group key={i}>
                  <Box args={[spread * 2, 0.15, 0.15]} position={[0, y, 0]}>
                    <meshPhongMaterial color="#999999" />
                  </Box>
                  <Box args={[0.15, 0.15, spread * 2]} position={[0, y, 0]}>
                    <meshPhongMaterial color="#999999" />
                  </Box>
                </group>
              );
            })}
            {/* Platform */}
            <Box args={[obstacle.width * 0.4, 0.3, obstacle.depth * 0.4]} position={[0, obstacle.height, 0]}>
              <meshPhongMaterial color="#888888" />
            </Box>
            {/* Parabolic antenna */}
            <mesh position={[0, obstacle.height + 1.5, 0]} rotation={[Math.PI / 6, 0, 0]}>
              <circleGeometry args={[obstacle.width * 0.3, 16]} />
              <meshPhongMaterial color="#cccccc" side={THREE.DoubleSide} />
            </mesh>
            {/* Spiral stairs (simplified) */}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              const y = (i / 6) * obstacle.height * 0.8;
              return (
                <Box key={`stair-${i}`} args={[0.6, 0.1, 0.3]}
                  position={[Math.cos(angle) * legSpread * 0.3, y + 1, Math.sin(angle) * legSpread * 0.3]}
                  rotation={[0, angle, 0]}>
                  <meshPhongMaterial color="#888888" />
                </Box>
              );
            })}
          </group>
        );
      }

      case 'fence': {
        const postCount = Math.max(2, Math.round(obstacle.width / 2));
        const postSpacing = obstacle.width / (postCount - 1);
        const postH = obstacle.height;
        return (
          <group position={[cx, 0, cz]}>
            {Array.from({ length: postCount }).map((_, i) => (
              <Cylinder key={i} args={[0.15, 0.18, postH, 6]}
                position={[-obstacle.width / 2 + i * postSpacing, postH / 2, 0]}>
                <meshPhongMaterial color="#8B6914" />
              </Cylinder>
            ))}
            {[0.3, 0.65, 0.95].map((hFrac, i) => (
              <Box key={i} args={[obstacle.width, 0.12, 0.1]} position={[0, postH * hFrac, 0]}>
                <meshPhongMaterial color="#9a7a2a" />
              </Box>
            ))}
          </group>
        );
      }

      case 'wall':
        return (
          <group position={[cx, 0, cz]}>
            <Box args={[obstacle.width, obstacle.height, obstacle.depth * 0.3]} position={[0, obstacle.height / 2, 0]} material={material} />
            <Box args={[obstacle.width + 0.3, 0.25, obstacle.depth * 0.35]} position={[0, obstacle.height, 0]}>
              <meshPhongMaterial color="#8a3030" />
            </Box>
            {Array.from({ length: Math.round(obstacle.height / 1.5) }).map((_, i) => (
              <Box key={i} args={[obstacle.width + 0.05, 0.05, obstacle.depth * 0.31]} position={[0, 0.75 + i * 1.5, 0]}>
                <meshPhongMaterial color="#4a1a1a" />
              </Box>
            ))}
          </group>
        );

      default:
        return (
          <Box args={[obstacle.width, obstacle.height, obstacle.depth]}
            position={[obstacle.x + obstacle.width / 2, obstacle.height / 2, obstacle.z + obstacle.depth / 2]}
            material={material} />
        );
    }
  };

  if (obstacle.type === 'wind_generator') return null;

  return (
    <group rotation={[rotX, rotationY, rotZ]} scale={scaleVal}>
      {renderShape()}
      {isSelected && (
        <Box args={[obstacle.width + 2, obstacle.height + 2, obstacle.depth + 2]}
          position={[obstacle.x + obstacle.width / 2, obstacle.height / 2, obstacle.z + obstacle.depth / 2]}>
          <meshBasicMaterial color="#00ff00" transparent opacity={0.2} wireframe />
        </Box>
      )}
    </group>
  );
};
