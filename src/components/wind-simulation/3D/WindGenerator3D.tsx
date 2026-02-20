import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Cylinder, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Obstacle, GeneratorSubtype, GENERATOR_SUBTYPES } from '../types';
import { WindPhysicsConfig, calculateWindShear } from './WindPhysicsEngine';

interface WindGenerator3DProps {
  obstacle: Obstacle;
  config: WindPhysicsConfig;
  isSelected?: boolean;
}

export function calculateGeneratorPower(
  airDensity: number,
  rotorDiameter: number,
  windSpeed: number,
  height: number,
  refHeight: number,
  surfaceRoughness: number,
  subtype: GeneratorSubtype = 'hawt3'
): number {
  const specs = GENERATOR_SUBTYPES[subtype];
  const adjustedSpeed = calculateWindShear(windSpeed, refHeight, Math.max(1, height), surfaceRoughness);
  if (adjustedSpeed < specs.cutIn || adjustedSpeed > specs.cutOut) return 0;
  const area = Math.PI * Math.pow(rotorDiameter / 2, 2);
  return 0.5 * airDensity * area * Math.pow(adjustedSpeed, 3) * specs.cp;
}

// HAWT 3-blade model
const HAWT3Model: React.FC<{ towerHeight: number; rotorDiameter: number; nacelleSize: number; adjustedSpeed: number; towerColor: string; nacelleColor: string }> = 
  ({ towerHeight, rotorDiameter, nacelleSize, adjustedSpeed, towerColor, nacelleColor }) => {
  const bladesRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (bladesRef.current) bladesRef.current.rotation.z += adjustedSpeed * 0.15 * delta; });
  return (
    <>
      <Cylinder args={[0.3, 0.5, towerHeight, 8]} position={[0, towerHeight / 2, 0]}>
        <meshPhongMaterial color={towerColor} />
      </Cylinder>
      <Box args={[nacelleSize, nacelleSize * 0.5, nacelleSize * 0.7]} position={[0, towerHeight, 0]}>
        <meshPhongMaterial color={nacelleColor} />
      </Box>
      <mesh position={[0, towerHeight, nacelleSize * 0.4]}>
        <sphereGeometry args={[nacelleSize * 0.2, 8, 8]} />
        <meshPhongMaterial color="#ffffff" />
      </mesh>
      <group ref={bladesRef} position={[0, towerHeight, nacelleSize * 0.5]}>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <mesh position={[0, rotorDiameter * 0.25, 0]}>
              <boxGeometry args={[0.4, rotorDiameter * 0.48, 0.12]} />
              <meshPhongMaterial color="#e8e8e8" />
            </mesh>
            <mesh position={[0, rotorDiameter * 0.48, 0]}>
              <boxGeometry args={[0.25, rotorDiameter * 0.06, 0.08]} />
              <meshPhongMaterial color="#dddddd" />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
};

const HAWT2Model: React.FC<{ towerHeight: number; rotorDiameter: number; nacelleSize: number; adjustedSpeed: number; towerColor: string; nacelleColor: string }> = 
  ({ towerHeight, rotorDiameter, nacelleSize, adjustedSpeed, towerColor, nacelleColor }) => {
  const bladesRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (bladesRef.current) bladesRef.current.rotation.z += adjustedSpeed * 0.2 * delta; });
  return (
    <>
      <Cylinder args={[0.3, 0.5, towerHeight, 8]} position={[0, towerHeight / 2, 0]}>
        <meshPhongMaterial color={towerColor} />
      </Cylinder>
      <Box args={[nacelleSize * 1.2, nacelleSize * 0.4, nacelleSize * 0.6]} position={[0, towerHeight, 0]}>
        <meshPhongMaterial color={nacelleColor} />
      </Box>
      <group ref={bladesRef} position={[0, towerHeight, nacelleSize * 0.4]}>
        {[0, 1].map((i) => (
          <group key={i} rotation={[0, 0, i * Math.PI]}>
            <mesh position={[0, rotorDiameter * 0.25, 0]}>
              <boxGeometry args={[0.5, rotorDiameter * 0.48, 0.1]} />
              <meshPhongMaterial color="#d0d0d0" />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
};

const DarrieusModel: React.FC<{ towerHeight: number; rotorDiameter: number; adjustedSpeed: number; towerColor: string }> = 
  ({ towerHeight, rotorDiameter, adjustedSpeed, towerColor }) => {
  const rotorRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (rotorRef.current) rotorRef.current.rotation.y += adjustedSpeed * 0.12 * delta; });
  const rotorH = towerHeight * 0.6;
  return (
    <>
      <Cylinder args={[0.2, 0.3, towerHeight, 6]} position={[0, towerHeight / 2, 0]}>
        <meshPhongMaterial color={towerColor} />
      </Cylinder>
      <group ref={rotorRef} position={[0, towerHeight * 0.5, 0]}>
        {[0, 1, 2].map((i) => {
          const angle = (i * Math.PI * 2) / 3;
          const r = rotorDiameter * 0.4;
          return (
            <group key={i} rotation={[0, angle, 0]}>
              <mesh position={[r * 0.5, 0, 0]}>
                <boxGeometry args={[0.15, rotorH, r * 0.3]} />
                <meshPhongMaterial color="#c0c8d0" />
              </mesh>
              <mesh position={[r * 0.25, rotorH * 0.45, 0]}>
                <boxGeometry args={[r * 0.5, 0.12, 0.12]} />
                <meshPhongMaterial color="#aaaaaa" />
              </mesh>
              <mesh position={[r * 0.25, -rotorH * 0.45, 0]}>
                <boxGeometry args={[r * 0.5, 0.12, 0.12]} />
                <meshPhongMaterial color="#aaaaaa" />
              </mesh>
            </group>
          );
        })}
      </group>
    </>
  );
};

const SavoniusModel: React.FC<{ towerHeight: number; rotorDiameter: number; adjustedSpeed: number; towerColor: string }> = 
  ({ towerHeight, rotorDiameter, adjustedSpeed, towerColor }) => {
  const rotorRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (rotorRef.current) rotorRef.current.rotation.y += adjustedSpeed * 0.08 * delta; });
  const rotorH = towerHeight * 0.5;
  const r = rotorDiameter * 0.35;
  return (
    <>
      <Cylinder args={[0.2, 0.35, towerHeight, 6]} position={[0, towerHeight / 2, 0]}>
        <meshPhongMaterial color={towerColor} />
      </Cylinder>
      <Cylinder args={[r * 1.2, r * 1.2, 0.15, 16]} position={[0, towerHeight * 0.75 + rotorH / 2, 0]}>
        <meshPhongMaterial color="#888888" />
      </Cylinder>
      <Cylinder args={[r * 1.2, r * 1.2, 0.15, 16]} position={[0, towerHeight * 0.75 - rotorH / 2, 0]}>
        <meshPhongMaterial color="#888888" />
      </Cylinder>
      <group ref={rotorRef} position={[0, towerHeight * 0.75, 0]}>
        {[0, 1].map((i) => (
          <group key={i} rotation={[0, i * Math.PI, 0]}>
            <Cylinder args={[r * 0.5, r * 0.5, rotorH * 0.9, 8, 1, true, 0, Math.PI]} 
              position={[r * 0.25, 0, 0]}>
              <meshPhongMaterial color="#b0b8c0" side={THREE.DoubleSide} />
            </Cylinder>
          </group>
        ))}
      </group>
    </>
  );
};

const MicroModel: React.FC<{ towerHeight: number; rotorDiameter: number; adjustedSpeed: number; towerColor: string }> = 
  ({ towerHeight, rotorDiameter, adjustedSpeed, towerColor }) => {
  const bladesRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (bladesRef.current) bladesRef.current.rotation.z += adjustedSpeed * 0.25 * delta; });
  return (
    <>
      <Cylinder args={[0.15, 0.25, towerHeight, 6]} position={[0, towerHeight / 2, 0]}>
        <meshPhongMaterial color={towerColor} />
      </Cylinder>
      <Sphere args={[0.6, 8, 8]} position={[0, towerHeight, 0.3]}>
        <meshPhongMaterial color="#dddddd" />
      </Sphere>
      <mesh position={[0, towerHeight, -1.5]}>
        <boxGeometry args={[0.05, 1.2, 2]} />
        <meshPhongMaterial color="#aaaaaa" />
      </mesh>
      <group ref={bladesRef} position={[0, towerHeight, 0.8]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]}>
            <mesh position={[0, rotorDiameter * 0.2, 0]}>
              <boxGeometry args={[0.2, rotorDiameter * 0.38, 0.06]} />
              <meshPhongMaterial color="#f0f0f0" />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
};

// Intake visualization: semi-transparent cone in front of rotor
const IntakeCone: React.FC<{ towerHeight: number; rotorDiameter: number; windAngleRad: number }> = ({ towerHeight, rotorDiameter, windAngleRad }) => {
  const coneRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!coneRef.current) return;
    const mat = coneRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.06 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
  });

  const coneLength = rotorDiameter * 2.5;
  return (
    <group position={[0, towerHeight, 0]} rotation={[0, -windAngleRad, 0]}>
      <mesh ref={coneRef} position={[0, 0, coneLength / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[rotorDiameter * 0.6, coneLength, 12]} />
        <meshBasicMaterial color="#00ffaa" transparent opacity={0.08} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Flow arrows converging to center */}
      {[-1, 0, 1].map(i => (
        <mesh key={i} position={[i * rotorDiameter * 0.3, i * 0.5, rotorDiameter * 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.2, 0.8, 4]} />
          <meshBasicMaterial color="#00ffaa" transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  );
};

export const WindGenerator3D: React.FC<WindGenerator3DProps> = ({ obstacle, config, isSelected = false }) => {
  const subtype = obstacle.generatorSubtype || 'hawt3';
  const specs = GENERATOR_SUBTYPES[subtype];
  const towerHeight = obstacle.height;
  const rotorDiameter = obstacle.width * 1.8;
  const nacelleSize = obstacle.width * 0.35;

  const power = useMemo(() => {
    return calculateGeneratorPower(
      config.airDensity, rotorDiameter, config.windSpeed,
      towerHeight + obstacle.y, config.referenceHeight, config.surfaceRoughness, subtype
    );
  }, [config.airDensity, config.windSpeed, config.referenceHeight, config.surfaceRoughness, rotorDiameter, towerHeight, obstacle.y, subtype]);

  const adjustedSpeed = useMemo(() => {
    return calculateWindShear(config.windSpeed, config.referenceHeight, Math.max(1, towerHeight + obstacle.y), config.surfaceRoughness);
  }, [config.windSpeed, config.referenceHeight, config.surfaceRoughness, towerHeight, obstacle.y]);

  const position: [number, number, number] = [
    obstacle.x + obstacle.width / 2, obstacle.y, obstacle.z + obstacle.depth / 2
  ];

  const towerColor = isSelected ? '#00ff00' : '#8899aa';
  const nacelleColor = isSelected ? '#00ff00' : '#ccddee';
  const powerStr = power >= 1000 ? `${(power / 1000).toFixed(1)} kW` : `${power.toFixed(0)} W`;
  const subtypeName = specs.nameUa;

  const rotationY = ((obstacle.rotation || 0) * Math.PI) / 180;
  const rotX = obstacle.rotationX || 0;
  const rotZ = obstacle.rotationZ || 0;
  const scaleVal = obstacle.scale || 1;
  const windAngleRad = (config.windAngle * Math.PI) / 180;

  return (
    <group position={position} rotation={[rotX, rotationY, rotZ]} scale={scaleVal}>
      {subtype === 'hawt3' && <HAWT3Model towerHeight={towerHeight} rotorDiameter={rotorDiameter} nacelleSize={nacelleSize} adjustedSpeed={adjustedSpeed} towerColor={towerColor} nacelleColor={nacelleColor} />}
      {subtype === 'hawt2' && <HAWT2Model towerHeight={towerHeight} rotorDiameter={rotorDiameter} nacelleSize={nacelleSize} adjustedSpeed={adjustedSpeed} towerColor={towerColor} nacelleColor={nacelleColor} />}
      {subtype === 'darrieus' && <DarrieusModel towerHeight={towerHeight} rotorDiameter={rotorDiameter} adjustedSpeed={adjustedSpeed} towerColor={towerColor} />}
      {subtype === 'savonius' && <SavoniusModel towerHeight={towerHeight} rotorDiameter={rotorDiameter} adjustedSpeed={adjustedSpeed} towerColor={towerColor} />}
      {subtype === 'micro' && <MicroModel towerHeight={towerHeight} rotorDiameter={rotorDiameter} adjustedSpeed={adjustedSpeed} towerColor={towerColor} />}

      {/* Intake visualization cone */}
      <IntakeCone towerHeight={towerHeight} rotorDiameter={rotorDiameter} windAngleRad={windAngleRad} />

      {/* Power label */}
      <Html position={[0, towerHeight + 4, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="rounded px-1.5 py-0.5 text-center border shadow-lg" style={{
          backgroundColor: 'rgba(0,0,0,0.85)', borderColor: '#39ff1450', minWidth: '55px'
        }}>
          <div className="text-[7px] text-green-400/80 font-mono">{subtypeName}</div>
          <div className="text-[8px] text-green-400 font-semibold">⚡</div>
          <div className="text-white text-xs font-mono font-semibold">{powerStr}</div>
          <div className="text-[7px] text-green-400/60">Cp={specs.cp}</div>
        </div>
      </Html>

      {isSelected && (
        <mesh position={[0, towerHeight / 2, 0]}>
          <cylinderGeometry args={[rotorDiameter * 0.55, rotorDiameter * 0.55, towerHeight + 4, 16]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.1} wireframe />
        </mesh>
      )}
    </group>
  );
};
