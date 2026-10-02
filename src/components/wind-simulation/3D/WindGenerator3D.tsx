import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Obstacle, GeneratorSubtype, GENERATOR_SUBTYPES } from '../types';
import { WindPhysicsConfig, calculateWindShear } from './WindPhysicsEngine';
import { useActiveBladePreset } from '@/store/useBladePresetStore';
import { computePowerFromBladeGeometry } from '@/components/wind-simulation/EnergyCalculator';
import { BladePresetTurbine3D } from './BladePresetTurbine3D';
import { TurbineHudCard } from './TurbineHudCard';
import { useEnergyState } from '@/store/useEnergyStore';
import { useGeneratorFocus, setHoveredGenerator, togglePinnedGenerator, clearPinnedGenerator } from '@/store/useGeneratorFocus';

/** A Blade Lab preset only replaces generators of the same rotor family. */
function presetFitsSubtype(preset: ReturnType<typeof useActiveBladePreset>, subtype: GeneratorSubtype) {
  if (!preset || !preset.geometry || !(preset.geometry.tipRadius > 0) || !(preset.geometry.nBlades > 0)) return false;
  const presetVertical = preset.rotorType !== 'hawt';
  return presetVertical === (GENERATOR_SUBTYPES[subtype].axis === 'vertical');
}

/** Falls back to the stock model if a preset rotor throws during build. */
class RotorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.warn('[WindGenerator3D] preset rotor failed, using stock model', err); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

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

export function calculateBladePresetPower(activePreset: ReturnType<typeof useActiveBladePreset>, airDensity: number, windSpeed: number, height: number, refHeight: number, surfaceRoughness: number): number | null {
  if (!activePreset) return null;
  const adjustedSpeed = calculateWindShear(windSpeed, refHeight, Math.max(1, height), surfaceRoughness);
  if (adjustedSpeed < 2 || adjustedSpeed > 30) return 0;
  return computePowerFromBladeGeometry(activePreset.geometry, activePreset.rotorType, adjustedSpeed, airDensity, { heightOverDiameter: activePreset.heightOverDiameter }).power;
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
const EnergyAbsorptionEffect: React.FC<{ towerHeight: number; rotorDiameter: number; rotorOffset: number; rotorRadius: number; power: number; adjustedSpeed: number }> = 
  ({ towerHeight, rotorDiameter, rotorOffset, rotorRadius, power, adjustedSpeed }) => {
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
      mat.opacity = isActive ? (0.02 + powerFactor * 0.08) * pulse : 0.01;
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
        const scale = 0.6 + progress * 0.45;
        ring.scale.set(scale, scale, scale);
        const mat = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - progress) * 0.18 * powerFactor;
        const hue = 0.5 - powerFactor * 0.35;
        mat.color.setHSL(hue, 0.8, 0.65);
      });
    }
  });

  const ringRadius = rotorRadius;
  void rotorDiameter;

  return (
    <group position={[0, towerHeight, rotorOffset]}>
      <mesh ref={discRef} rotation={[0, 0, 0]}>
        <circleGeometry args={[rotorRadius, 32]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <group ref={ringsRef}>
        {Array.from({ length: MAX_RINGS }).map((_, i) => (
          <mesh key={i} rotation={[0, 0, 0]}>
            <ringGeometry args={[ringRadius * 0.92, ringRadius, 48]} />
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
      mat.opacity = isActive ? (0.015 + powerFactor * 0.06) * pulse : 0.005;
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
  const r = rotorDiameter * (isVAWT_savonius ? 0.27 : 0.22);

  return (
    <group position={[0, centerY, 0]}>
      {/* Cylindrical glow around rotor body */}
      <mesh ref={glowRef}>
        <cylinderGeometry args={[r * 1.08, r * 1.08, rotorH, 24, 1, true]} />
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

export const WindGenerator3D: React.FC<WindGenerator3DProps> = ({ obstacle, config, isSelected = false }) => {
  const globalPreset = useActiveBladePreset();
  const subtype = obstacle.generatorSubtype || 'hawt3';
  const activePreset = presetFitsSubtype(globalPreset, subtype) ? globalPreset : null;
  const specs = GENERATOR_SUBTYPES[subtype];
  const towerHeight = obstacle.height;
  const rotorDiameter = obstacle.width * 1.8;
  const nacelleSize = obstacle.width * 0.35;
  const generatorId = obstacle.id || `${subtype}-${obstacle.x}-${obstacle.z}`;
  const wobbleRef = useRef<THREE.Group>(null);
  const wobblePhase = useRef(Math.random() * Math.PI * 2);
  const energy = useEnergyState();
  const focus = useGeneratorFocus();
  const telemetry = energy.generators[generatorId];
  const isHovered = focus.hoveredId === generatorId;
  const isPinned = focus.pinnedId === generatorId;
  // Generated electrical energy, integrated from rotor power over sim time.
  const generatedRef = useRef(0);
  const [generatedJ, setGeneratedJ] = useState(0);

  const power = useMemo(() => {
    const presetPower = calculateBladePresetPower(activePreset, config.airDensity, config.windSpeed, towerHeight + obstacle.y, config.referenceHeight, config.surfaceRoughness);
    if (presetPower !== null) return presetPower;
    return calculateGeneratorPower(
      config.airDensity, rotorDiameter, config.windSpeed,
      towerHeight + obstacle.y, config.referenceHeight, config.surfaceRoughness, subtype
    );
  }, [activePreset, config.airDensity, config.windSpeed, config.referenceHeight, config.surfaceRoughness, rotorDiameter, towerHeight, obstacle.y, subtype]);

  const adjustedSpeed = useMemo(() => {
    return calculateWindShear(config.windSpeed, config.referenceHeight, Math.max(1, towerHeight + obstacle.y), config.surfaceRoughness);
  }, [config.windSpeed, config.referenceHeight, config.surfaceRoughness, towerHeight, obstacle.y]);

  // Physical rotor dimensions — kept identical to the particle solver.
  const isVertical = specs.axis === 'vertical';
  const rotorRadius = subtype === 'darrieus' ? rotorDiameter * 0.22
    : subtype === 'savonius' ? rotorDiameter * 0.27
    : subtype === 'micro' ? rotorDiameter * 0.39
    : rotorDiameter * 0.49;
  const rotorOffset = isVertical ? 0 : subtype === 'micro' ? 0.8 : nacelleSize * (subtype === 'hawt2' ? 0.4 : 0.5);
  const rotorCenterY = towerHeight * (subtype === 'darrieus' ? 0.5 : subtype === 'savonius' ? 0.75 : 1);

  useFrame((state, rawDt) => {
    const time = state.clock.elapsedTime;
    const dt = Math.min(rawDt, 0.05);
    generatedRef.current += power * dt;
    if (Math.floor(time * 2) !== Math.floor((time - dt) * 2)) setGeneratedJ(generatedRef.current);
    if (!wobbleRef.current) return;
    const windStrength = Math.min(config.windSpeed / 20, 1);
    const wobbleIntensity = windStrength * 0.02;
    wobbleRef.current.rotation.x = Math.sin(time * 1.2 + wobblePhase.current) * wobbleIntensity * 0.4;
    wobbleRef.current.rotation.z = Math.cos(time * 0.8 + wobblePhase.current) * wobbleIntensity * 0.3;
  });

  const position: [number, number, number] = [
    obstacle.x + obstacle.width / 2, obstacle.y, obstacle.z + obstacle.depth / 2
  ];

  const towerColor = isSelected ? '#00ff00' : '#8899aa';
  const nacelleColor = isSelected ? '#00ff00' : '#ccddee';
  const isCutOut = adjustedSpeed > specs.cutOut;
  const isCutIn = adjustedSpeed < specs.cutIn;
  const rotationY = ((obstacle.rotation || 0) * Math.PI) / 180;
  const scaleVal = obstacle.scale || 1;
  const tsr = isCutIn || isCutOut ? 0 : specs.optimalTSR;
  const rpm = tsr * adjustedSpeed / Math.max(0.1, rotorRadius * scaleVal) * 60 / (2 * Math.PI);

  const stock = (
    <>
      {subtype === 'hawt3' && <HAWT3Model towerHeight={towerHeight} rotorDiameter={rotorDiameter} nacelleSize={nacelleSize} adjustedSpeed={adjustedSpeed} towerColor={towerColor} nacelleColor={nacelleColor} />}
      {subtype === 'hawt2' && <HAWT2Model towerHeight={towerHeight} rotorDiameter={rotorDiameter} nacelleSize={nacelleSize} adjustedSpeed={adjustedSpeed} towerColor={towerColor} nacelleColor={nacelleColor} />}
      {subtype === 'darrieus' && <DarrieusModel towerHeight={towerHeight} rotorDiameter={rotorDiameter} adjustedSpeed={adjustedSpeed} towerColor={towerColor} />}
      {subtype === 'savonius' && <SavoniusModel towerHeight={towerHeight} rotorDiameter={rotorDiameter} adjustedSpeed={adjustedSpeed} towerColor={towerColor} />}
      {subtype === 'micro' && <MicroModel towerHeight={towerHeight} rotorDiameter={rotorDiameter} adjustedSpeed={adjustedSpeed} towerColor={towerColor} />}
    </>
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scaleVal}>
      <group
        ref={wobbleRef}
        onPointerOver={(e) => { e.stopPropagation(); setHoveredGenerator(generatorId); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHoveredGenerator(null); document.body.style.cursor = ''; }}
        onClick={(e) => { e.stopPropagation(); togglePinnedGenerator(generatorId); }}
      >
        {activePreset ? (
          <RotorBoundary fallback={stock}>
            <BladePresetTurbine3D preset={activePreset} towerHeight={towerHeight} rotorDiameter={rotorDiameter} nacelleSize={nacelleSize} adjustedSpeed={adjustedSpeed} towerColor={towerColor} nacelleColor={nacelleColor} />
          </RotorBoundary>
        ) : stock}
        {/* Invisible, generous hit volume so hover works on thin blades too. */}
        <mesh position={[0, rotorCenterY, rotorOffset]} visible={false}>
          <sphereGeometry args={[Math.max(rotorRadius, 2) * 1.1, 12, 8]} />
          <meshBasicMaterial />
        </mesh>
      </group>

      {isVertical ? (
        <VAWTRotorGlow towerHeight={towerHeight} rotorDiameter={rotorDiameter} power={power} adjustedSpeed={adjustedSpeed} isVAWT_savonius={subtype === 'savonius'} />
      ) : (
        <EnergyAbsorptionEffect towerHeight={towerHeight} rotorDiameter={rotorDiameter} rotorOffset={rotorOffset} rotorRadius={rotorRadius} power={power} adjustedSpeed={adjustedSpeed} />
      )}

      <TurbineHudCard
        position={[0, rotorCenterY, 0]}
        radius={rotorRadius}
        height={towerHeight * 0.2}
        density={isSelected || isHovered ? 'full' : 'compact'}
        pinned={isPinned}
        onClose={clearPinnedGenerator}
        label={activePreset ? `Blade Lab · ${activePreset.nameUA}` : specs.nameUa}
        data={{
          power,
          generatedEnergy: generatedJ,
          measuredPower: telemetry?.power ?? 0,
          measuredEnergy: telemetry?.energy ?? 0,
          hitsPerSec: telemetry?.hitsPerSecond ?? 0,
          flowSpeed: telemetry?.flowSpeed,
          hubSpeed: adjustedSpeed,
          rpm,
          tsr,
          cp: activePreset ? undefined : specs.cp,
          ti: config.turbulenceIntensity,
          status: isCutOut ? 'cutout' : isCutIn ? 'low' : 'ok',
          history: telemetry?.history,
        }}
      />

      {(isSelected || isHovered || isPinned) && (
        <mesh position={[0, rotorCenterY, rotorOffset]} rotation={isVertical ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
          <ringGeometry args={[rotorRadius * 1.04, rotorRadius * 1.1, 48]} />
          <meshBasicMaterial color={isSelected ? '#00ffff' : '#39ff14'} transparent opacity={0.55} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};
