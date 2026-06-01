import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ActiveBladePreset } from '@/store/useBladePresetStore';
import {
  buildBladeGeometry,
  buildSavoniusBucketGeometry,
  buildVAWTBladeGeometry,
  buildArchimedesBladeGeometry,
} from '@/aero/buildBladeGeometry';

interface Props {
  preset: ActiveBladePreset;
  towerHeight: number;
  rotorDiameter: number;
  nacelleSize: number;
  adjustedSpeed: number;
  towerColor: string;
  nacelleColor: string;
}

export const BladePresetTurbine3D: React.FC<Props> = ({ preset, towerHeight, rotorDiameter, nacelleSize, adjustedSpeed, towerColor, nacelleColor }) => {
  const rotorRef = useRef<THREE.Group>(null);
  const isVAWT = preset.rotorType !== 'hawt';
  const isSavonius = preset.rotorType === 'vawt-savonius';
  const scale = useMemo(() => rotorDiameter / Math.max(0.1, preset.geometry.tipRadius * 2), [rotorDiameter, preset.geometry.tipRadius]);
  const height = preset.geometry.tipRadius * 2 * (preset.heightOverDiameter ?? (isSavonius ? 2 : 1));
  const mesh = useMemo(() => {
    if (isSavonius) return buildSavoniusBucketGeometry(preset.geometry, 'solid', { height }).geometry;
    if (isVAWT) return buildVAWTBladeGeometry(preset.geometry, 'solid', preset.rotorType as 'vawt-h' | 'vawt-helical' | 'vawt-tropo', { height, helicalTwist: preset.helicalTwistDeg }).geometry;
    return buildBladeGeometry(preset.geometry, 'solid', adjustedSpeed, 7).geometry;
  }, [preset, isVAWT, isSavonius, height, adjustedSpeed]);

  useFrame((_, delta) => {
    if (!rotorRef.current) return;
    if (isVAWT) rotorRef.current.rotation.y += adjustedSpeed * 0.14 * delta;
    else rotorRef.current.rotation.z += adjustedSpeed * 0.12 * delta;
  });

  if (isVAWT) {
    const n = isSavonius ? 2 : preset.geometry.nBlades;
    return (
      <>
        <mesh position={[0, towerHeight / 2, 0]}>
          <cylinderGeometry args={[0.18, 0.3, towerHeight, 10]} />
          <meshPhongMaterial color={towerColor} />
        </mesh>
        <group ref={rotorRef} position={[0, towerHeight * 0.58, 0]} scale={scale}>
          {Array.from({ length: n }).map((_, i) => (
            <mesh key={i} geometry={mesh} rotation={[0, (i * Math.PI * 2) / n, 0]} castShadow receiveShadow>
              <meshStandardMaterial vertexColors color="#d8f0e6" metalness={0.28} roughness={0.38} side={THREE.DoubleSide} />
            </mesh>
          ))}
          <mesh><cylinderGeometry args={[preset.geometry.tipRadius * 0.035, preset.geometry.tipRadius * 0.045, height * 1.08, 12]} /><meshPhongMaterial color={nacelleColor} /></mesh>
        </group>
      </>
    );
  }

  return (
    <>
      <mesh position={[0, towerHeight / 2, 0]}><cylinderGeometry args={[0.3, 0.5, towerHeight, 10]} /><meshPhongMaterial color={towerColor} /></mesh>
      <mesh position={[0, towerHeight, 0]}><boxGeometry args={[nacelleSize, nacelleSize * 0.5, nacelleSize * 0.75]} /><meshPhongMaterial color={nacelleColor} /></mesh>
      <group ref={rotorRef} position={[0, towerHeight, nacelleSize * 0.52]} scale={scale}>
        {Array.from({ length: preset.geometry.nBlades }).map((_, i) => (
          <mesh key={i} geometry={mesh} rotation={[0, 0, (i * Math.PI * 2) / preset.geometry.nBlades]} castShadow receiveShadow>
            <meshStandardMaterial vertexColors color="#eef5f2" metalness={0.22} roughness={0.36} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </>
  );
};