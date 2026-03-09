import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Cylinder, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Obstacle, GeneratorSubtype, GENERATOR_SUBTYPES } from '../types';
import { WindPhysicsConfig, calculateWindShear } from './WindPhysicsEngine';

interface WindGenerator3DProps {
  obstacle: Obstacle;
  config: WindPhysicsConfig;
  isSelected?: boolean;
  isHovered?: boolean;
}

export function calculateGeneratorPower(
  airDensity: number, rotorDiameter: number, windSpeed: number,
  height: number, refHeight: number, surfaceRoughness: number,
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

// Energy absorption glow effect — for HAWT only (disc at rotor plane)
const MAX_RINGS = 3;
const EnergyAbsorptionEffect: React.FC<{ towerHeight: number; rotorDiameter: number; windAngleRad: number; power: number; adjustedSpeed: number }> = 
  ({ towerHeight, rotorDiameter, windAngleRad, power, adjustedSpeed }) => {
  const discRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const ringTimers = useRef<number[]>(Array(MAX_RINGS).fill(-1));
  const spawnCooldown = useRef(0);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const powerFactor = Math.min(power / 8000, 1);
    const isActive = adjustedSpeed > 0.5 && power > 0;

    if (discRef.current) {
      const mat = discRef.current.material as THREE.MeshBasicMaterial;
      const pulse = Math.sin(time * 6) * 0.3 + 0.7;
      mat.opacity = isActive ? (0.05 + powerFactor * 0.25) * pulse : 0.02;
      const hue = 0.5 - powerFactor * 0.35;
      mat.color.setHSL(hue, 0.9, 0.6);
      const s = 1 + Math.sin(time * 4) * 0.08 * powerFactor;
      discRef.current.scale.set(s, s, 1);
    }

    spawnCooldown.current -= delta;
    if (isActive && spawnCooldown.current <= 0 && powerFactor > 0.05) {
      const freeSlot = ringTimers.current.findIndex(t => t < 0);
      if (freeSlot >= 0) {
        ringTimers.current[freeSlot] = 0;
        spawnCooldown.current = 0.3 + (1 - powerFactor) * 0.7;
      }
    }

    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        const t = ringTimers.current[i];
        if (t < 0) { ring.visible = false; return; }
        ring.visible = true;
        ringTimers.current[i] += delta * 2.5;
        const progress = ringTimers.current[i];
        if (progress > 1) { ringTimers.current[i] = -1; ring.visible = false; return; }
        const scale = 0.3 + progress * 1.2;
        ring.scale.set(scale, scale, scale);
        const mat = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - progress) * 0.4 * powerFactor;
        const hue = 0.5 - powerFactor * 0.35;
        mat.color.setHSL(hue, 0.8, 0.65);
      });
    }
  });

  const ringRadius = rotorDiameter * 0.45;

  return (
    <group position={[0, towerHeight, 0]} rotation={[0, -windAngleRad, 0]}>
      <mesh ref={discRef} rotation={[0, 0, 0]}>
        <circleGeometry args={[rotorDiameter * 0.35, 16]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <group ref={ringsRef}>
        {Array.from({ length: MAX_RINGS }).map((_, i) => (
          <mesh key={i} rotation={[0, 0, 0]}>
            <ringGeometry args={[ringRadius * 0.85, ringRadius, 24]} />
            <meshBasicMaterial color="#00ffaa" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// Cylindrical glow for VAWT generators (Darrieus/Savonius)
const VAWTRotorGlow: React.FC<{ towerHeight: number; rotorDiameter: number; power: number; adjustedSpeed: number; isVAWT_savonius?: boolean }> = 
  ({ towerHeight, rotorDiameter, power, adjustedSpeed, isVAWT_savonius = false }) => {
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const powerFactor = Math.min(power / 5000, 1);
    const isActive = adjustedSpeed > 0.5 && power > 0;

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const pulse = Math.sin(time * 5 + adjustedSpeed) * 0.3 + 0.7;
      mat.opacity = isActive ? (0.03 + powerFactor * 0.15) * pulse : 0.01;
      const hue = 0.35 - powerFactor * 0.2; // green → yellow-green
      mat.color.setHSL(hue, 0.9, 0.6);
    }

    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      const pulse2 = Math.sin(time * 8 + 1.5) * 0.4 + 0.6;
      mat.opacity = isActive ? powerFactor * 0.12 * pulse2 : 0;
      const scale = 1 + Math.sin(time * 3) * 0.06 * powerFactor;
      ringRef.current.scale.set(scale, 1, scale);
    }
  });

  const rotorH = isVAWT_savonius ? towerHeight * 0.5 : towerHeight * 0.6;
  const centerY = isVAWT_savonius ? towerHeight * 0.75 : towerHeight * 0.5;
  const r = rotorDiameter * 0.45;

  return (
    <group position={[0, centerY, 0]}>
      {/* Cylindrical glow around rotor body */}
      <mesh ref={glowRef}>
        <cylinderGeometry args={[r * 1.3, r * 1.3, rotorH * 1.1, 16, 1, true]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.03} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Subtle ring at mid-height */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 1.0, r * 1.4, 24]} />
        <meshBasicMaterial color="#44ffaa" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const WindGenerator3D: React.FC<WindGenerator3DProps> = ({ obstacle, config, isSelected = false, isHovered = false }) => {
  const subtype = obstacle.generatorSubtype || 'hawt3';
  const specs = GENERATOR_SUBTYPES[subtype];
  const towerHeight = obstacle.height;
  const rotorDiameter = obstacle.width * 1.8;
  const nacelleSize = obstacle.width * 0.35;
  const wobbleRef = useRef<THREE.Group>(null);
  const wobblePhase = useRef(Math.random() * Math.PI * 2);
  const [showDetails, setShowDetails] = useState(false);

  const power = useMemo(() => {
    return calculateGeneratorPower(
      config.airDensity, rotorDiameter, config.windSpeed,
      towerHeight + obstacle.y, config.referenceHeight, config.surfaceRoughness, subtype
    );
  }, [config.airDensity, config.windSpeed, config.referenceHeight, config.surfaceRoughness, rotorDiameter, towerHeight, obstacle.y, subtype]);

  const adjustedSpeed = useMemo(() => {
    return calculateWindShear(config.windSpeed, config.referenceHeight, Math.max(1, towerHeight + obstacle.y), config.surfaceRoughness);
  }, [config.windSpeed, config.referenceHeight, config.surfaceRoughness, towerHeight, obstacle.y]);

  const detailData = useMemo(() => {
    const sweptArea = Math.PI * Math.pow(rotorDiameter / 2, 2);
    const betzPower = 0.5 * config.airDensity * sweptArea * Math.pow(adjustedSpeed, 3) * 0.593;
    const efficiency = betzPower > 0 ? (power / betzPower * 100) : 0;
    const capacityFactor = power > 0 ? Math.min(power / (betzPower * 1.2), 1) : 0;
    const aep = power * capacityFactor * 8760 / 1000;
    return {
      sweptArea: sweptArea.toFixed(1),
      hubHeight: (towerHeight + obstacle.y).toFixed(0),
      efficiency: efficiency.toFixed(1),
      capacityFactor: (capacityFactor * 100).toFixed(1),
      aep: aep > 1000 ? `${(aep / 1000).toFixed(1)} MWh` : `${aep.toFixed(0)} kWh`,
      betzPower: betzPower >= 1000 ? `${(betzPower / 1000).toFixed(1)} kW` : `${betzPower.toFixed(0)} W`,
    };
  }, [power, adjustedSpeed, rotorDiameter, config.airDensity, towerHeight, obstacle.y]);

  useFrame((state) => {
    if (!wobbleRef.current) return;
    const time = state.clock.elapsedTime;
    const windStrength = Math.min(config.windSpeed / 20, 1);
    const wobbleIntensity = windStrength * 0.025;
    const angleRad = (config.windAngle * Math.PI) / 180;
    wobbleRef.current.rotation.x = Math.sin(time * 1.2 + wobblePhase.current) * wobbleIntensity
      + Math.cos(angleRad) * wobbleIntensity * 0.5;
    wobbleRef.current.rotation.z = Math.cos(time * 0.8 + wobblePhase.current) * wobbleIntensity * 0.6
      + Math.sin(angleRad) * wobbleIntensity * 0.5;
  });

  const position: [number, number, number] = [
    obstacle.x + obstacle.width / 2, obstacle.y, obstacle.z + obstacle.depth / 2
  ];

  const towerColor = isSelected ? '#00ff00' : '#8899aa';
  const nacelleColor = isSelected ? '#00ff00' : '#ccddee';
  const powerStr = power >= 1000000 ? `${(power / 1000000).toFixed(2)} MW` : power >= 1000 ? `${(power / 1000).toFixed(1)} kW` : `${power.toFixed(0)} W`;
  const isCutOut = adjustedSpeed > specs.cutOut;
  const isCutIn = adjustedSpeed < specs.cutIn;
  const statusLabel = isCutOut ? '⛔ CUTOUT' : isCutIn ? '⏸ LOW WIND' : null;
  const statusColor = isCutOut ? '#ff4444' : isCutIn ? '#ffaa00' : '#39ff14';
  const subtypeName = specs.nameUa;

  const rotationY = ((obstacle.rotation || 0) * Math.PI) / 180;
  const scaleVal = obstacle.scale || 1;
  const windAngleRad = (config.windAngle * Math.PI) / 180;

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scaleVal}>
      <group ref={wobbleRef}>
        {subtype === 'hawt3' && <HAWT3Model towerHeight={towerHeight} rotorDiameter={rotorDiameter} nacelleSize={nacelleSize} adjustedSpeed={adjustedSpeed} towerColor={towerColor} nacelleColor={nacelleColor} />}
        {subtype === 'hawt2' && <HAWT2Model towerHeight={towerHeight} rotorDiameter={rotorDiameter} nacelleSize={nacelleSize} adjustedSpeed={adjustedSpeed} towerColor={towerColor} nacelleColor={nacelleColor} />}
        {subtype === 'darrieus' && <DarrieusModel towerHeight={towerHeight} rotorDiameter={rotorDiameter} adjustedSpeed={adjustedSpeed} towerColor={towerColor} />}
        {subtype === 'savonius' && <SavoniusModel towerHeight={towerHeight} rotorDiameter={rotorDiameter} adjustedSpeed={adjustedSpeed} towerColor={towerColor} />}
        {subtype === 'micro' && <MicroModel towerHeight={towerHeight} rotorDiameter={rotorDiameter} adjustedSpeed={adjustedSpeed} towerColor={towerColor} />}
      </group>

      <EnergyAbsorptionEffect towerHeight={towerHeight} rotorDiameter={rotorDiameter} windAngleRad={windAngleRad} power={power} adjustedSpeed={adjustedSpeed} />

      <Html position={[0, towerHeight + 4, 0]} center style={{ pointerEvents: 'auto' }}>
        <div 
          className="rounded px-1.5 py-0.5 text-center border shadow-lg cursor-pointer transition-all hover:scale-105"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', borderColor: `${statusColor}40`, minWidth: '55px' }}
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="text-[6px] font-mono" style={{ color: `${statusColor}cc` }}>{subtypeName}</div>
          {statusLabel ? (
            <div className="text-[9px] font-bold" style={{ color: statusColor }}>{statusLabel}</div>
          ) : (
            <div className="text-[9px] font-semibold" style={{ color: statusColor }}>⚡ {powerStr}</div>
          )}
          <div className="text-[6px]" style={{ color: `${statusColor}99` }}>{adjustedSpeed.toFixed(1)} m/s</div>
          
          {showDetails && (
            <div className="mt-1 pt-1 border-t text-left space-y-0.5" style={{ borderColor: `${statusColor}20` }}>
              <div className="text-[6px] text-cyan-400">📐 {detailData.sweptArea} m² | H={detailData.hubHeight}m</div>
              <div className="text-[6px] text-yellow-400">η={detailData.efficiency}% | CF={detailData.capacityFactor}%</div>
              <div className="text-[6px] text-orange-400">AEP ≈ {detailData.aep}</div>
              <div className="text-[5px] text-muted-foreground">
                {specs.cutIn}-{specs.cutOut} m/s
              </div>
            </div>
          )}
        </div>
      </Html>

      {/* Neomorphic glow selection */}
      {isSelected && (
        <mesh position={[0, towerHeight / 2, 0]}>
          <sphereGeometry args={[rotorDiameter * 0.7, 16, 16]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
      {isHovered && !isSelected && (
        <mesh position={[0, towerHeight / 2, 0]}>
          <sphereGeometry args={[rotorDiameter * 0.65, 16, 16]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};
