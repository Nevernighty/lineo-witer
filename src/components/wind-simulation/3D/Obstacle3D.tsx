import React, { useMemo, useRef } from 'react';
import { Box, Cylinder, Sphere } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Obstacle } from '../types';

interface Obstacle3DProps {
  obstacle: Obstacle;
  windSpeed?: number;
  windAngle?: number;
  isSelected?: boolean;
  isHovered?: boolean;
}

export const Obstacle3D: React.FC<Obstacle3DProps> = ({ 
  obstacle, 
  windSpeed = 0,
  windAngle = 0,
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

  // Only Y rotation — no X/Z tilt on objects
  const rotationY = ((obstacle.rotation || 0) * Math.PI) / 180;
  const scaleVal = obstacle.scale || 1;

  // Wobble refs for trees
  const treeGroupRef = useRef<THREE.Group>(null);
  const wobblePhase = useRef(Math.random() * Math.PI * 2);

  // Wobble ref for buildings too
  const buildingWobbleRef = useRef<THREE.Group>(null);
  const buildingPhase = useRef(Math.random() * Math.PI * 2);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Trees: dramatic jelly wobble
    if (obstacle.type === 'tree' && treeGroupRef.current) {
      const windNorm = Math.min(windSpeed / 6, 2.0);
      const wobbleIntensity = windNorm * 0.2;
      const freq1 = 1.2 + Math.sin(time * 0.2 + wobblePhase.current) * 0.4;
      const freq2 = 2.3 + Math.cos(time * 0.4 + wobblePhase.current) * 0.3;
      const freq3 = 3.7 + Math.sin(time * 0.7 + wobblePhase.current * 1.5) * 0.2;
      const angleRad = (windAngle * Math.PI) / 180;
      
      // Multi-frequency jelly effect with higher harmonics
      const wobbleX = Math.sin(time * freq1 + wobblePhase.current) * wobbleIntensity
                     + Math.sin(time * freq2 * 1.7) * wobbleIntensity * 0.5
                     + Math.sin(time * freq3 * 2.3) * wobbleIntensity * 0.2
                     + Math.cos(angleRad) * wobbleIntensity * 0.4;
      const wobbleZ = Math.cos(time * freq2 + wobblePhase.current * 1.3) * wobbleIntensity * 0.8
                     + Math.cos(time * freq3 * 1.4 + 0.5) * wobbleIntensity * 0.3
                     + Math.sin(angleRad) * wobbleIntensity * 0.4;
      
      // Wind lean: trees bend more in wind direction
      const leanAmount = Math.min(windSpeed / 10, 0.6) * 0.15;
      const leanX = Math.cos(angleRad) * leanAmount;
      const leanZ = Math.sin(angleRad) * leanAmount;
      
      // Scale-based wobble at crown (rubber-band effect)
      const stretchY = 1 + Math.sin(time * freq1 * 1.5) * wobbleIntensity * 0.08;
      
      treeGroupRef.current.rotation.x = wobbleX + leanX;
      treeGroupRef.current.rotation.z = wobbleZ + leanZ;
      treeGroupRef.current.scale.y = stretchY;
    }

    // Buildings/structures: subtle vibration in strong winds
    if ((obstacle.type === 'building' || obstacle.type === 'skyscraper' || obstacle.type === 'tower') && buildingWobbleRef.current) {
      const windNorm = Math.min(windSpeed / 15, 1);
      const vibration = windNorm * 0.008;
      const angleRad = (windAngle * Math.PI) / 180;
      buildingWobbleRef.current.rotation.x = Math.sin(time * 2.5 + buildingPhase.current) * vibration + Math.cos(angleRad) * vibration * 0.3;
      buildingWobbleRef.current.rotation.z = Math.cos(time * 1.8 + buildingPhase.current) * vibration * 0.6 + Math.sin(angleRad) * vibration * 0.3;
    }

    // Fences: moderate wobble
    if (obstacle.type === 'fence' && treeGroupRef.current) {
      const windNorm = Math.min(windSpeed / 10, 1.2);
      const wobbleIntensity = windNorm * 0.06;
      const angleRad = (windAngle * Math.PI) / 180;
      treeGroupRef.current.rotation.x = Math.sin(time * 1.8 + wobblePhase.current) * wobbleIntensity + Math.cos(angleRad) * wobbleIntensity * 0.5;
      treeGroupRef.current.rotation.z = Math.cos(time * 1.2 + wobblePhase.current) * wobbleIntensity * 0.5;
    }
  });

  const renderShape = () => {
    const cx = obstacle.x + obstacle.width / 2;
    const cz = obstacle.z + obstacle.depth / 2;

    switch (obstacle.type) {
      case 'tree': {
        const trunkH = obstacle.height * 0.5;
        const crownR = obstacle.width * 0.45;
        // Use obstacle width variation for diverse trees
        const treeVariant = ((obstacle.width * 7 + obstacle.height * 3) % 4);
        const crownColor1 = treeVariant < 1 ? '#1a7a1a' : treeVariant < 2 ? '#2d8f2d' : treeVariant < 3 ? '#1a6a2a' : '#3a9a1a';
        const crownColor2 = treeVariant < 1 ? '#228B22' : treeVariant < 2 ? '#1a7a1a' : treeVariant < 3 ? '#2d7a3d' : '#2d9a2d';
        const crownColor3 = treeVariant < 1 ? '#2d8f2d' : treeVariant < 2 ? '#3a8a2a' : treeVariant < 3 ? '#1a8a1a' : '#4aaa2a';
        return (
          <group position={[cx, 0, cz]}>
            <group ref={treeGroupRef}>
              <Cylinder args={[obstacle.width * 0.08, obstacle.width * 0.15, trunkH, 8]} position={[0, trunkH / 2, 0]}>
                <meshPhongMaterial color="#6B3410" />
              </Cylinder>
              <Sphere args={[crownR, 10, 10]} position={[0, trunkH + crownR * 0.5, 0]}>
                <meshPhongMaterial color={crownColor1} />
              </Sphere>
              <Sphere args={[crownR * 0.75, 8, 8]} position={[crownR * 0.5, trunkH + crownR * 0.3, crownR * 0.3]}>
                <meshPhongMaterial color={crownColor2} />
              </Sphere>
              <Sphere args={[crownR * 0.65, 8, 8]} position={[-crownR * 0.4, trunkH + crownR * 0.6, -crownR * 0.3]}>
                <meshPhongMaterial color={crownColor3} />
              </Sphere>
              {/* Extra crown cluster for variety */}
              <Sphere args={[crownR * 0.55, 6, 6]} position={[crownR * 0.2, trunkH + crownR * 0.9, crownR * 0.1]}>
                <meshPhongMaterial color={crownColor1} />
              </Sphere>
              <Cylinder args={[0.12, 0.08, trunkH * 0.4, 4]} position={[crownR * 0.3, trunkH * 0.7, 0]} rotation={[0, 0, -0.5]}>
                <meshPhongMaterial color="#5a2d0c" />
              </Cylinder>
              <Cylinder args={[0.1, 0.06, trunkH * 0.35, 4]} position={[-crownR * 0.25, trunkH * 0.6, crownR * 0.2]} rotation={[0.3, 0, 0.4]}>
                <meshPhongMaterial color="#5a2d0c" />
              </Cylinder>
              {/* Root bumps */}
              {[0, 1, 2, 3].map(ri => {
                const a = (ri / 4) * Math.PI * 2;
                return (
                  <Sphere key={`root-${ri}`} args={[obstacle.width * 0.08, 4, 4]}
                    position={[Math.cos(a) * obstacle.width * 0.12, 0.1, Math.sin(a) * obstacle.width * 0.12]}>
                    <meshPhongMaterial color="#5a3010" />
                  </Sphere>
                );
              })}
            </group>
          </group>
        );
      }

      case 'house': {
        const wallH = obstacle.height * 0.65;
        const roofH = obstacle.height * 0.35;
        return (
          <group position={[cx, 0, cz]}>
            <Box args={[obstacle.width, wallH, obstacle.depth]} position={[0, wallH / 2, 0]} material={material} />
            <mesh position={[0, wallH + roofH / 2, 0]}>
              <coneGeometry args={[obstacle.width * 0.75, roofH, 4]} />
              <meshPhongMaterial color="#8B4513" />
            </mesh>
            <Cylinder args={[0.5, 0.5, roofH * 0.8, 6]} position={[obstacle.width * 0.25, wallH + roofH * 0.5, 0]}>
              <meshPhongMaterial color="#6b3a2a" />
            </Cylinder>
            <Box args={[obstacle.width * 0.2, wallH * 0.45, 0.2]} position={[0, wallH * 0.22, obstacle.depth / 2 + 0.1]}>
              <meshPhongMaterial color="#5a3a1a" />
            </Box>
            {[-1, 1].map(side => (
              <Box key={side} args={[obstacle.width * 0.15, wallH * 0.2, 0.15]} position={[side * obstacle.width * 0.28, wallH * 0.55, obstacle.depth / 2 + 0.1]}>
                <meshPhongMaterial color="#87CEEB" transparent opacity={0.7} />
              </Box>
            ))}
            <Box args={[obstacle.width * 0.4, 0.15, 1.5]} position={[0, 0.08, obstacle.depth / 2 + 0.75]}>
              <meshPhongMaterial color="#9a7a4a" />
            </Box>
            {[-1, 1].map(side => (
              <Cylinder key={`porch-${side}`} args={[0.12, 0.12, wallH * 0.4, 6]} position={[side * obstacle.width * 0.18, wallH * 0.2, obstacle.depth / 2 + 1.4]}>
                <meshPhongMaterial color="#8a6a3a" />
              </Cylinder>
            ))}
            <Cylinder args={[0.08, 0.08, wallH, 6]} position={[-obstacle.width / 2 - 0.1, wallH / 2, obstacle.depth * 0.3]}>
              <meshPhongMaterial color="#777777" />
            </Cylinder>
          </group>
        );
      }

      case 'building': {
        const floors = Math.max(2, Math.round(obstacle.height / 4));
        return (
          <group position={[cx, 0, cz]} ref={buildingWobbleRef}>
            <Box args={[obstacle.width, obstacle.height, obstacle.depth]} position={[0, obstacle.height / 2, 0]} material={material} />
            <Box args={[obstacle.width + 0.5, 0.5, obstacle.depth + 0.5]} position={[0, obstacle.height, 0]}>
              <meshPhongMaterial color="#606060" />
            </Box>
            {Array.from({ length: floors }).map((_, fi) => (
              [-1, 1].map(side => (
                <Box key={`${fi}-${side}`} args={[obstacle.width * 0.18, 1.2, 0.15]}
                  position={[side * obstacle.width * 0.28, 2 + fi * (obstacle.height / floors), obstacle.depth / 2 + 0.1]}>
                  <meshPhongMaterial color="#6ab8e8" transparent opacity={0.6} />
                </Box>
              ))
            ))}
            <Box args={[obstacle.width * 0.25, 2.5, 0.2]} position={[0, 1.25, obstacle.depth / 2 + 0.1]}>
              <meshPhongMaterial color="#4a3520" />
            </Box>
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
          <group position={[cx, 0, cz]} ref={buildingWobbleRef}>
            <Box args={[obstacle.width, stepH, obstacle.depth]} position={[0, stepH / 2, 0]}>
              <meshPhongMaterial color="#7a8a9a" transparent opacity={0.85} />
            </Box>
            <Box args={[obstacle.width * 0.75, topH, obstacle.depth * 0.75]} position={[0, stepH + topH / 2, 0]}>
              <meshPhongMaterial color="#8899aa" transparent opacity={0.8} />
            </Box>
            {Array.from({ length: 8 }).map((_, i) => (
              <Box key={i} args={[obstacle.width + 0.1, 0.15, obstacle.depth + 0.1]} position={[0, 3 + i * (stepH / 8), 0]}>
                <meshPhongMaterial color="#4488bb" transparent opacity={0.4} />
              </Box>
            ))}
            {Array.from({ length: 4 }).map((_, i) => (
              [-1, 1].map(side => (
                <Box key={`glow-${i}-${side}`} args={[obstacle.width * 0.12, 0.8, 0.1]}
                  position={[side * obstacle.width * 0.25, stepH - 2 - i * 3, obstacle.depth / 2 + 0.1]}>
                  <meshBasicMaterial color="#ffdd66" />
                </Box>
              ))
            ))}
            <Cylinder args={[0.15, 0.08, antennaH, 4]} position={[0, stepH + topH + antennaH / 2, 0]}>
              <meshPhongMaterial color="#cccccc" />
            </Cylinder>
            <mesh position={[0, stepH + topH + antennaH + 0.3, 0]}>
              <sphereGeometry args={[0.25, 8, 8]} />
              <meshBasicMaterial color="#ff3333" />
            </mesh>
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
          <group position={[cx, 0, cz]} ref={buildingWobbleRef}>
            {[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx, sz], i) => (
              <Cylinder key={i} args={[legR, legR * 1.5, obstacle.height, 6]}
                position={[sx * legSpread * (1 - 0.3), obstacle.height / 2, sz * legSpread * (1 - 0.3)]}
                rotation={[sz * 0.08, 0, -sx * 0.08]}>
                <meshPhongMaterial color="#aaaaaa" />
              </Cylinder>
            ))}
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
            <Box args={[obstacle.width * 0.4, 0.3, obstacle.depth * 0.4]} position={[0, obstacle.height, 0]}>
              <meshPhongMaterial color="#888888" />
            </Box>
            <mesh position={[0, obstacle.height + 1.5, 0]} rotation={[Math.PI / 6, 0, 0]}>
              <circleGeometry args={[obstacle.width * 0.3, 16]} />
              <meshPhongMaterial color="#cccccc" side={THREE.DoubleSide} />
            </mesh>
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
          <group position={[cx, 0, cz]} ref={treeGroupRef}>
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
    <group rotation={[0, rotationY, 0]} scale={scaleVal}>
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
