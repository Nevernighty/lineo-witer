import React, { useMemo, useRef } from 'react';
import { Box, Cylinder, Sphere } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Obstacle } from '../types';

interface Obstacle3DProps {
  obstacle: Obstacle;
  windSpeed?: number;
  windAngle?: number;
  wobbliness?: number;
  isSelected?: boolean;
  isHovered?: boolean;
}

export const Obstacle3D: React.FC<Obstacle3DProps> = ({ 
  obstacle, 
  windSpeed = 0,
  windAngle = 0,
  wobbliness = 1.0,
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
  const scaleVal = obstacle.scale || 1;

  const treeGroupRef = useRef<THREE.Group>(null);
  const wobblePhase = useRef(Math.random() * Math.PI * 2);
  const buildingWobbleRef = useRef<THREE.Group>(null);
  const buildingPhase = useRef(Math.random() * Math.PI * 2);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const wb = wobbliness;

    // Trees: dramatic jelly wobble with rubber-band effect
    if (obstacle.type === 'tree' && treeGroupRef.current) {
      const windNorm = Math.min(windSpeed / 5, 2.5);
      const wobbleIntensity = windNorm * 0.22 * wb;
      const freq1 = 1.0 + Math.sin(time * 0.15 + wobblePhase.current) * 0.5;
      const freq2 = 2.1 + Math.cos(time * 0.35 + wobblePhase.current) * 0.4;
      const freq3 = 3.4 + Math.sin(time * 0.6 + wobblePhase.current * 1.5) * 0.3;
      const freq4 = 5.2 + Math.cos(time * 0.9 + wobblePhase.current * 0.7) * 0.2;
      const angleRad = (windAngle * Math.PI) / 180;
      
      // Multi-frequency jelly with higher harmonics for rubber-like feel
      const wobbleX = Math.sin(time * freq1 + wobblePhase.current) * wobbleIntensity
                     + Math.sin(time * freq2 * 1.7) * wobbleIntensity * 0.45
                     + Math.sin(time * freq3 * 2.3) * wobbleIntensity * 0.25
                     + Math.sin(time * freq4 * 3.1) * wobbleIntensity * 0.12
                     + Math.cos(angleRad) * wobbleIntensity * 0.5;
      const wobbleZ = Math.cos(time * freq2 + wobblePhase.current * 1.3) * wobbleIntensity * 0.8
                     + Math.cos(time * freq3 * 1.4 + 0.5) * wobbleIntensity * 0.35
                     + Math.cos(time * freq4 * 1.8 + 1.0) * wobbleIntensity * 0.15
                     + Math.sin(angleRad) * wobbleIntensity * 0.5;
      
      // Wind lean: strong directional bending
      const leanAmount = Math.min(windSpeed / 8, 0.8) * 0.18 * wb;
      const leanX = Math.cos(angleRad) * leanAmount;
      const leanZ = Math.sin(angleRad) * leanAmount;
      
      // Rubber-band squash & stretch
      const stretchY = 1 + Math.sin(time * freq1 * 1.5) * wobbleIntensity * 0.1;
      const squashX = 1 - Math.sin(time * freq1 * 1.5) * wobbleIntensity * 0.04;
      
      treeGroupRef.current.rotation.x = wobbleX + leanX;
      treeGroupRef.current.rotation.z = wobbleZ + leanZ;
      treeGroupRef.current.scale.set(squashX, stretchY, squashX);
    }

    // Buildings/structures: subtle vibration in strong winds
    if ((obstacle.type === 'building' || obstacle.type === 'skyscraper' || obstacle.type === 'tower') && buildingWobbleRef.current) {
      const windNorm = Math.min(windSpeed / 12, 1.2);
      const vibration = windNorm * 0.012 * wb;
      const angleRad = (windAngle * Math.PI) / 180;
      buildingWobbleRef.current.rotation.x = Math.sin(time * 2.5 + buildingPhase.current) * vibration
        + Math.sin(time * 4.2) * vibration * 0.3
        + Math.cos(angleRad) * vibration * 0.4;
      buildingWobbleRef.current.rotation.z = Math.cos(time * 1.8 + buildingPhase.current) * vibration * 0.6
        + Math.cos(time * 3.6) * vibration * 0.2
        + Math.sin(angleRad) * vibration * 0.4;
    }

    // Fences: moderate wobble with sway
    if (obstacle.type === 'fence' && treeGroupRef.current) {
      const windNorm = Math.min(windSpeed / 8, 1.5);
      const wobbleIntensity = windNorm * 0.08 * wb;
      const angleRad = (windAngle * Math.PI) / 180;
      treeGroupRef.current.rotation.x = Math.sin(time * 1.8 + wobblePhase.current) * wobbleIntensity
        + Math.sin(time * 3.2) * wobbleIntensity * 0.3
        + Math.cos(angleRad) * wobbleIntensity * 0.5;
      treeGroupRef.current.rotation.z = Math.cos(time * 1.2 + wobblePhase.current) * wobbleIntensity * 0.5
        + Math.cos(time * 2.6) * wobbleIntensity * 0.2;
    }

    // Walls: very subtle vibration
    if (obstacle.type === 'wall' && buildingWobbleRef.current) {
      const windNorm = Math.min(windSpeed / 18, 0.8);
      const vibration = windNorm * 0.005 * wb;
      buildingWobbleRef.current.rotation.x = Math.sin(time * 3.0 + buildingPhase.current) * vibration;
      buildingWobbleRef.current.rotation.z = Math.cos(time * 2.2 + buildingPhase.current) * vibration * 0.5;
    }

    // Houses: slight sway
    if (obstacle.type === 'house' && buildingWobbleRef.current) {
      const windNorm = Math.min(windSpeed / 15, 1);
      const vibration = windNorm * 0.006 * wb;
      const angleRad = (windAngle * Math.PI) / 180;
      buildingWobbleRef.current.rotation.x = Math.sin(time * 2.0 + buildingPhase.current) * vibration + Math.cos(angleRad) * vibration * 0.3;
      buildingWobbleRef.current.rotation.z = Math.cos(time * 1.5 + buildingPhase.current) * vibration * 0.5;
    }
  });

  const renderShape = () => {
    const cx = obstacle.x + obstacle.width / 2;
    const cz = obstacle.z + obstacle.depth / 2;

    switch (obstacle.type) {
      case 'tree': {
        const trunkH = obstacle.height * 0.5;
        const crownR = obstacle.width * 0.45;
        const treeVariant = ((obstacle.width * 7 + obstacle.height * 3) % 4);
        const crownColor1 = treeVariant < 1 ? '#1a7a1a' : treeVariant < 2 ? '#2d8f2d' : treeVariant < 3 ? '#1a6a2a' : '#3a9a1a';
        const crownColor2 = treeVariant < 1 ? '#228B22' : treeVariant < 2 ? '#1a7a1a' : treeVariant < 3 ? '#2d7a3d' : '#2d9a2d';
        const crownColor3 = treeVariant < 1 ? '#2d8f2d' : treeVariant < 2 ? '#3a8a2a' : treeVariant < 3 ? '#1a8a1a' : '#4aaa2a';
        const trunkColor = treeVariant < 2 ? '#6B3410' : '#7a4520';
        const hasLeafCluster = obstacle.height > 15;
        return (
          <group position={[cx, 0, cz]}>
            <group ref={treeGroupRef}>
              {/* Trunk with taper */}
              <Cylinder args={[obstacle.width * 0.06, obstacle.width * 0.16, trunkH, 8]} position={[0, trunkH / 2, 0]}>
                <meshPhongMaterial color={trunkColor} />
              </Cylinder>
              {/* Bark texture rings */}
              {[0.2, 0.4, 0.6, 0.8].map(frac => (
                <Cylinder key={frac} args={[obstacle.width * 0.065 + frac * 0.02, obstacle.width * 0.065 + frac * 0.02, 0.15, 8]}
                  position={[0, trunkH * frac, 0]}>
                  <meshPhongMaterial color="#5a2d0c" />
                </Cylinder>
              ))}
              {/* Main crown sphere */}
              <Sphere args={[crownR, 12, 12]} position={[0, trunkH + crownR * 0.5, 0]}>
                <meshPhongMaterial color={crownColor1} flatShading />
              </Sphere>
              {/* Secondary crowns */}
              <Sphere args={[crownR * 0.75, 10, 10]} position={[crownR * 0.5, trunkH + crownR * 0.3, crownR * 0.3]}>
                <meshPhongMaterial color={crownColor2} flatShading />
              </Sphere>
              <Sphere args={[crownR * 0.65, 10, 10]} position={[-crownR * 0.4, trunkH + crownR * 0.6, -crownR * 0.3]}>
                <meshPhongMaterial color={crownColor3} flatShading />
              </Sphere>
              <Sphere args={[crownR * 0.55, 8, 8]} position={[crownR * 0.2, trunkH + crownR * 0.9, crownR * 0.1]}>
                <meshPhongMaterial color={crownColor1} flatShading />
              </Sphere>
              {/* Extra leaf cluster for tall trees */}
              {hasLeafCluster && (
                <>
                  <Sphere args={[crownR * 0.5, 8, 8]} position={[-crownR * 0.6, trunkH + crownR * 0.2, crownR * 0.5]}>
                    <meshPhongMaterial color={crownColor2} flatShading />
                  </Sphere>
                  <Sphere args={[crownR * 0.4, 6, 6]} position={[crownR * 0.7, trunkH + crownR * 0.7, -crownR * 0.4]}>
                    <meshPhongMaterial color={crownColor3} flatShading />
                  </Sphere>
                </>
              )}
              {/* Branches */}
              <Cylinder args={[0.12, 0.06, trunkH * 0.4, 5]} position={[crownR * 0.3, trunkH * 0.7, 0]} rotation={[0, 0, -0.5]}>
                <meshPhongMaterial color="#5a2d0c" />
              </Cylinder>
              <Cylinder args={[0.1, 0.05, trunkH * 0.35, 5]} position={[-crownR * 0.25, trunkH * 0.6, crownR * 0.2]} rotation={[0.3, 0, 0.4]}>
                <meshPhongMaterial color="#5a2d0c" />
              </Cylinder>
              <Cylinder args={[0.08, 0.04, trunkH * 0.25, 4]} position={[crownR * 0.1, trunkH * 0.55, -crownR * 0.3]} rotation={[-0.4, 0, 0.2]}>
                <meshPhongMaterial color="#5a2d0c" />
              </Cylinder>
              {/* Root bumps */}
              {[0, 1, 2, 3, 4].map(ri => {
                const a = (ri / 5) * Math.PI * 2;
                return (
                  <Sphere key={`root-${ri}`} args={[obstacle.width * 0.09, 5, 5]}
                    position={[Math.cos(a) * obstacle.width * 0.14, 0.1, Math.sin(a) * obstacle.width * 0.14]}>
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
          <group position={[cx, 0, cz]} ref={buildingWobbleRef}>
            <Box args={[obstacle.width, wallH, obstacle.depth]} position={[0, wallH / 2, 0]} material={material} />
            {/* Pitched roof */}
            <mesh position={[0, wallH + roofH / 2, 0]}>
              <coneGeometry args={[obstacle.width * 0.75, roofH, 4]} />
              <meshPhongMaterial color="#8B4513" />
            </mesh>
            {/* Chimney */}
            <Cylinder args={[0.5, 0.5, roofH * 0.8, 6]} position={[obstacle.width * 0.25, wallH + roofH * 0.5, 0]}>
              <meshPhongMaterial color="#6b3a2a" />
            </Cylinder>
            {/* Chimney cap */}
            <Box args={[1.2, 0.15, 1.2]} position={[obstacle.width * 0.25, wallH + roofH * 0.9, 0]}>
              <meshPhongMaterial color="#555555" />
            </Box>
            {/* Door */}
            <Box args={[obstacle.width * 0.2, wallH * 0.45, 0.2]} position={[0, wallH * 0.22, obstacle.depth / 2 + 0.1]}>
              <meshPhongMaterial color="#5a3a1a" />
            </Box>
            {/* Door handle */}
            <Sphere args={[0.1, 6, 6]} position={[obstacle.width * 0.06, wallH * 0.22, obstacle.depth / 2 + 0.22]}>
              <meshPhongMaterial color="#daa520" />
            </Sphere>
            {/* Windows */}
            {[-1, 1].map(side => (
              <group key={side}>
                <Box args={[obstacle.width * 0.15, wallH * 0.2, 0.15]} position={[side * obstacle.width * 0.28, wallH * 0.55, obstacle.depth / 2 + 0.1]}>
                  <meshPhongMaterial color="#87CEEB" transparent opacity={0.7} />
                </Box>
                {/* Window frame */}
                <Box args={[obstacle.width * 0.17, 0.08, 0.16]} position={[side * obstacle.width * 0.28, wallH * 0.65, obstacle.depth / 2 + 0.1]}>
                  <meshPhongMaterial color="#f5f5dc" />
                </Box>
                <Box args={[obstacle.width * 0.17, 0.08, 0.16]} position={[side * obstacle.width * 0.28, wallH * 0.45, obstacle.depth / 2 + 0.1]}>
                  <meshPhongMaterial color="#f5f5dc" />
                </Box>
              </group>
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
            {/* Rain gutter */}
            <Cylinder args={[0.08, 0.08, wallH, 6]} position={[-obstacle.width / 2 - 0.1, wallH / 2, obstacle.depth * 0.3]}>
              <meshPhongMaterial color="#777777" />
            </Cylinder>
            {/* Foundation */}
            <Box args={[obstacle.width + 0.4, 0.3, obstacle.depth + 0.4]} position={[0, 0.15, 0]}>
              <meshPhongMaterial color="#696969" />
            </Box>
          </group>
        );
      }

      case 'building': {
        const floors = Math.max(2, Math.round(obstacle.height / 4));
        return (
          <group position={[cx, 0, cz]} ref={buildingWobbleRef}>
            <Box args={[obstacle.width, obstacle.height, obstacle.depth]} position={[0, obstacle.height / 2, 0]} material={material} />
            {/* Roof ledge */}
            <Box args={[obstacle.width + 0.5, 0.5, obstacle.depth + 0.5]} position={[0, obstacle.height, 0]}>
              <meshPhongMaterial color="#606060" />
            </Box>
            {/* Roof equipment */}
            <Box args={[obstacle.width * 0.3, 1.5, obstacle.width * 0.3]} position={[obstacle.width * 0.2, obstacle.height + 0.75, 0]}>
              <meshPhongMaterial color="#555555" />
            </Box>
            {/* Windows per floor */}
            {Array.from({ length: floors }).map((_, fi) => (
              [-1, 1].map(side => (
                <group key={`${fi}-${side}`}>
                  <Box args={[obstacle.width * 0.18, 1.2, 0.15]}
                    position={[side * obstacle.width * 0.28, 2 + fi * (obstacle.height / floors), obstacle.depth / 2 + 0.1]}>
                    <meshPhongMaterial color="#6ab8e8" transparent opacity={0.6} />
                  </Box>
                  {/* Window sill */}
                  <Box args={[obstacle.width * 0.2, 0.1, 0.2]}
                    position={[side * obstacle.width * 0.28, 1.4 + fi * (obstacle.height / floors), obstacle.depth / 2 + 0.12]}>
                    <meshPhongMaterial color="#aaaaaa" />
                  </Box>
                </group>
              ))
            ))}
            {/* Main door */}
            <Box args={[obstacle.width * 0.25, 2.5, 0.2]} position={[0, 1.25, obstacle.depth / 2 + 0.1]}>
              <meshPhongMaterial color="#4a3520" />
            </Box>
            {/* AC units */}
            {Array.from({ length: Math.min(floors, 3) }).map((_, fi) => (
              <group key={`ac-${fi}`}>
                <Box args={[0.8, 0.6, 0.5]}
                  position={[obstacle.width / 2 + 0.25, 3 + fi * (obstacle.height / floors), obstacle.depth * 0.2]}>
                  <meshPhongMaterial color="#aaaaaa" />
                </Box>
                <Box args={[0.7, 0.5, 0.08]}
                  position={[obstacle.width / 2 + 0.25, 3 + fi * (obstacle.height / floors), obstacle.depth * 0.2 + 0.26]}>
                  <meshPhongMaterial color="#888888" />
                </Box>
              </group>
            ))}
            {/* Balconies */}
            {Array.from({ length: Math.min(floors - 1, 2) }).map((_, fi) => (
              <group key={`balcony-${fi}`}>
                <Box args={[obstacle.width * 0.3, 0.12, 1.5]}
                  position={[0, 2.5 + (fi + 1) * (obstacle.height / floors), obstacle.depth / 2 + 0.75]}>
                  <meshPhongMaterial color="#999999" />
                </Box>
                <Box args={[0.06, 1, 0.06]}
                  position={[-obstacle.width * 0.14, 3 + (fi + 1) * (obstacle.height / floors), obstacle.depth / 2 + 1.45]}>
                  <meshPhongMaterial color="#777777" />
                </Box>
                <Box args={[0.06, 1, 0.06]}
                  position={[obstacle.width * 0.14, 3 + (fi + 1) * (obstacle.height / floors), obstacle.depth / 2 + 1.45]}>
                  <meshPhongMaterial color="#777777" />
                </Box>
              </group>
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
            {/* Main body */}
            <Box args={[obstacle.width, stepH, obstacle.depth]} position={[0, stepH / 2, 0]}>
              <meshPhongMaterial color="#7a8a9a" transparent opacity={0.85} />
            </Box>
            {/* Tapered top */}
            <Box args={[obstacle.width * 0.75, topH, obstacle.depth * 0.75]} position={[0, stepH + topH / 2, 0]}>
              <meshPhongMaterial color="#8899aa" transparent opacity={0.8} />
            </Box>
            {/* Glass stripe bands */}
            {Array.from({ length: 10 }).map((_, i) => (
              <Box key={i} args={[obstacle.width + 0.1, 0.15, obstacle.depth + 0.1]} position={[0, 2.5 + i * (stepH / 10), 0]}>
                <meshPhongMaterial color="#4488bb" transparent opacity={0.4} />
              </Box>
            ))}
            {/* Lit office windows at top */}
            {Array.from({ length: 5 }).map((_, i) => (
              [-1, 1].map(side => (
                <Box key={`glow-${i}-${side}`} args={[obstacle.width * 0.12, 0.8, 0.1]}
                  position={[side * obstacle.width * 0.25, stepH - 2 - i * 3, obstacle.depth / 2 + 0.1]}>
                  <meshBasicMaterial color="#ffdd66" />
                </Box>
              ))
            ))}
            {/* Antenna */}
            <Cylinder args={[0.15, 0.06, antennaH, 4]} position={[0, stepH + topH + antennaH / 2, 0]}>
              <meshPhongMaterial color="#cccccc" />
            </Cylinder>
            {/* Aviation warning light */}
            <mesh position={[0, stepH + topH + antennaH + 0.3, 0]}>
              <sphereGeometry args={[0.3, 8, 8]} />
              <meshBasicMaterial color="#ff3333" />
            </mesh>
            {/* Crane/mast on top */}
            <Cylinder args={[0.1, 0.1, topH * 0.8, 4]} position={[obstacle.width * 0.3, stepH + topH + topH * 0.4, 0]}>
              <meshPhongMaterial color="#ddaa00" />
            </Cylinder>
            <Box args={[topH * 0.6, 0.1, 0.1]} position={[obstacle.width * 0.3 + topH * 0.2, stepH + topH + topH * 0.8, 0]}>
              <meshPhongMaterial color="#ddaa00" />
            </Box>
            {/* Entrance canopy */}
            <Box args={[obstacle.width * 0.6, 0.15, 2]} position={[0, 3, obstacle.depth / 2 + 1]}>
              <meshPhongMaterial color="#666666" transparent opacity={0.7} />
            </Box>
          </group>
        );
      }

      case 'tower': {
        const legSpread = obstacle.width * 0.5;
        const legR = 0.25;
        return (
          <group position={[cx, 0, cz]} ref={buildingWobbleRef}>
            {/* Four legs — wider at base (bottom), narrower at top */}
            {[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx, sz], i) => {
              // Each leg tapers: bottom radius larger, top radius smaller
              // Position legs spread wider at base
              const bottomSpread = legSpread * 1.2;
              const topSpread = legSpread * 0.4;
              const midX = sx * (bottomSpread + topSpread) / 2;
              const midZ = sz * (bottomSpread + topSpread) / 2;
              // Tilt legs outward from center
              const tiltAngle = 0.12;
              return (
                <Cylinder key={i} args={[legR * 0.5, legR * 1.8, obstacle.height, 6]}
                  position={[midX, obstacle.height / 2, midZ]}
                  rotation={[sz * tiltAngle, 0, -sx * tiltAngle]}>
                  <meshPhongMaterial color="#aaaaaa" />
                </Cylinder>
              );
            })}
            {/* Cross braces */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = (i + 1) * obstacle.height / 6;
              const frac = y / obstacle.height;
              const spread = legSpread * (1.2 - frac * 0.8);
              return (
                <group key={i}>
                  <Box args={[spread * 2, 0.15, 0.15]} position={[0, y, 0]}>
                    <meshPhongMaterial color="#999999" />
                  </Box>
                  <Box args={[0.15, 0.15, spread * 2]} position={[0, y, 0]}>
                    <meshPhongMaterial color="#999999" />
                  </Box>
                  {i % 2 === 0 && (
                    <Box args={[0.1, spread * 2.2, 0.1]} position={[0, y, 0]} rotation={[0, 0, Math.PI / 4]}>
                      <meshPhongMaterial color="#888888" />
                    </Box>
                  )}
                </group>
              );
            })}
            {/* Platform */}
            <Box args={[obstacle.width * 0.5, 0.3, obstacle.depth * 0.5]} position={[0, obstacle.height, 0]}>
              <meshPhongMaterial color="#888888" />
            </Box>
            {/* Dish antenna */}
            <mesh position={[0, obstacle.height + 1.5, 0]} rotation={[Math.PI / 6, 0, 0]}>
              <circleGeometry args={[obstacle.width * 0.3, 16]} />
              <meshPhongMaterial color="#cccccc" side={THREE.DoubleSide} />
            </mesh>
            {/* Ladder steps */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const y = (i / 8) * obstacle.height * 0.9;
              return (
                <Box key={`stair-${i}`} args={[0.6, 0.1, 0.3]}
                  position={[Math.cos(angle) * legSpread * 0.3, y + 1, Math.sin(angle) * legSpread * 0.3]}
                  rotation={[0, angle, 0]}>
                  <meshPhongMaterial color="#888888" />
                </Box>
              );
            })}
            {/* Warning light */}
            <mesh position={[0, obstacle.height + 2.5, 0]}>
              <sphereGeometry args={[0.2, 6, 6]} />
              <meshBasicMaterial color="#ff4444" />
            </mesh>
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
              <group key={i}>
                <Cylinder args={[0.12, 0.18, postH, 6]}
                  position={[-obstacle.width / 2 + i * postSpacing, postH / 2, 0]}>
                  <meshPhongMaterial color="#8B6914" />
                </Cylinder>
                {/* Post cap */}
                <mesh position={[-obstacle.width / 2 + i * postSpacing, postH + 0.1, 0]}>
                  <coneGeometry args={[0.2, 0.3, 4]} />
                  <meshPhongMaterial color="#7a5a14" />
                </mesh>
              </group>
            ))}
            {/* Rails */}
            {[0.25, 0.55, 0.85].map((hFrac, i) => (
              <Box key={i} args={[obstacle.width, 0.14, 0.1]} position={[0, postH * hFrac, 0]}>
                <meshPhongMaterial color="#9a7a2a" />
              </Box>
            ))}
            {/* Pickets between posts */}
            {Array.from({ length: Math.max(0, (postCount - 1) * 2) }).map((_, i) => {
              const x = -obstacle.width / 2 + (i + 0.5) * (obstacle.width / ((postCount - 1) * 2));
              return (
                <Box key={`picket-${i}`} args={[0.08, postH * 0.7, 0.06]} position={[x, postH * 0.45, 0]}>
                  <meshPhongMaterial color="#aa8a3a" />
                </Box>
              );
            })}
          </group>
        );
      }

      case 'wall':
        return (
          <group position={[cx, 0, cz]} ref={buildingWobbleRef}>
            <Box args={[obstacle.width, obstacle.height, obstacle.depth * 0.3]} position={[0, obstacle.height / 2, 0]} material={material} />
            {/* Cap stone */}
            <Box args={[obstacle.width + 0.3, 0.3, obstacle.depth * 0.4]} position={[0, obstacle.height, 0]}>
              <meshPhongMaterial color="#8a3030" />
            </Box>
            {/* Mortar lines */}
            {Array.from({ length: Math.round(obstacle.height / 1.2) }).map((_, i) => (
              <Box key={i} args={[obstacle.width + 0.05, 0.04, obstacle.depth * 0.31]} position={[0, 0.6 + i * 1.2, 0]}>
                <meshPhongMaterial color="#4a1a1a" />
              </Box>
            ))}
            {/* Vertical mortar lines */}
            {Array.from({ length: Math.round(obstacle.width / 2) }).map((_, i) => (
              <Box key={`v-${i}`} args={[0.04, obstacle.height, obstacle.depth * 0.31]}
                position={[-obstacle.width / 2 + 1 + i * 2, obstacle.height / 2, 0]}>
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
