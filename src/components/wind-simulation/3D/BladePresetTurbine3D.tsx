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
import { getMaterial } from '@/aero/materials';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  preset: ActiveBladePreset;
  towerHeight: number;
  rotorDiameter: number;
  nacelleSize: number;
  adjustedSpeed: number;
  towerColor: string;
  nacelleColor: string;
}

/**
 * Live preset rotor with full deformation + failure sync.
 * Failure level is derived from windSpeed vs. material maxTipSpeed and triggers:
 *   - shake / flutter
 *   - red-hot stress emissive
 *   - blade #0 detach + tumble drift downstream
 */
export const BladePresetTurbine3D: React.FC<Props> = ({
  preset, towerHeight, rotorDiameter, nacelleSize, adjustedSpeed, towerColor, nacelleColor,
}) => {
  const rotorRef = useRef<THREE.Group>(null);
  const bladeRefs = useRef<Array<THREE.Group | null>>([]);
  const detachStartRef = useRef<number | null>(null);

  const isVAWT = preset.rotorType !== 'hawt';
  const isSavonius = preset.rotorType === 'vawt-savonius';
  const isArchimedes = preset.rotorType === 'vawt-archimedes';
  const scale = useMemo(
    () => rotorDiameter / Math.max(0.1, preset.geometry.tipRadius * 2),
    [rotorDiameter, preset.geometry.tipRadius],
  );
  const height = preset.geometry.tipRadius * 2 *
    (preset.heightOverDiameter ?? (isSavonius ? 2 : isArchimedes ? 1.8 : 1));
  const mat = getMaterial(preset.materialId);

  const mesh = useMemo(() => {
    if (isSavonius) return buildSavoniusBucketGeometry(preset.geometry, 'solid', { height }).geometry;
    if (isArchimedes) return buildArchimedesBladeGeometry(preset.geometry, 'solid',
      { height, turns: 1 + (preset.helicalTwistDeg ?? 360) / 360 }).geometry;
    if (isVAWT) return buildVAWTBladeGeometry(preset.geometry, 'solid',
      preset.rotorType as 'vawt-h' | 'vawt-helical' | 'vawt-tropo',
      { height, helicalTwist: preset.helicalTwistDeg }).geometry;
    return buildBladeGeometry(preset.geometry, 'solid', adjustedSpeed, 7).geometry;
  }, [preset, isVAWT, isSavonius, isArchimedes, height, adjustedSpeed]);

  // Failure level — 0 below 70% of material tip-speed limit; saturates above 110%.
  const tsr = 7; // nominal
  const tipSpeed = isVAWT
    ? adjustedSpeed * Math.max(1, tsr * 0.5)
    : adjustedSpeed * tsr;
  const safety = mat.maxTipSpeed;
  const failureLevel = Math.max(0, Math.min(1.2, (tipSpeed - safety * 0.7) / (safety * 0.4)));

  const crackEmissive = useMemo(() => new THREE.Color(0xff3322), []);
  const crackIntensity = failureLevel > 0.35 ? (failureLevel - 0.35) * 1.4 : 0;

  useFrame((_, dt) => {
    const t = performance.now() * 0.001;
    if (rotorRef.current) {
      const spinFactor = Math.max(0, 1 - failureLevel * 0.5);
      if (isVAWT) rotorRef.current.rotation.y += adjustedSpeed * 0.14 * dt * spinFactor;
      else rotorRef.current.rotation.z += adjustedSpeed * 0.12 * dt * spinFactor;
      const shake = failureLevel > 0.1
        ? Math.sin(t * 42) * 0.025 * failureLevel
        : 0;
      rotorRef.current.position.x = (rotorRef.current.userData.bx ?? 0) + shake;
      rotorRef.current.position.y = (rotorRef.current.userData.by ?? rotorRef.current.position.y);
    }
    if (failureLevel >= 1 && detachStartRef.current == null) detachStartRef.current = t;
    if (failureLevel < 0.6) detachStartRef.current = null;
    bladeRefs.current.forEach((grp, i) => {
      if (!grp) return;
      const flutter = Math.sin(t * (6 + i * 1.3) + i) * 0.04 * (0.3 + failureLevel * 1.5);
      if (isVAWT) grp.rotation.z = flutter * 0.6;
      else grp.rotation.x = flutter;
      if (detachStartRef.current != null && i === 0) {
        const dt2 = t - detachStartRef.current;
        const drift = Math.min(preset.geometry.tipRadius * 1.6, dt2 * preset.geometry.tipRadius * 0.6);
        const fall = -Math.min(preset.geometry.tipRadius * 1.4, 0.5 * 2 * dt2 * dt2);
        if (isVAWT) grp.position.set(drift, fall, 0);
        else grp.position.set(0, fall, drift);
        grp.rotation.x += dt * 4;
        grp.rotation.y += dt * 2.4;
      } else {
        grp.position.set(0, 0, 0);
      }
    });
  });

  const bladeMaterialJSX = (color: string) => (
    <meshStandardMaterial
      vertexColors color={color}
      metalness={0.28} roughness={0.38}
      side={THREE.DoubleSide}
      emissive={crackEmissive}
      emissiveIntensity={crackIntensity}
    />
  );

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
            <group key={i} rotation={[0, (i * Math.PI * 2) / n, 0]}
                   ref={el => { bladeRefs.current[i] = el; }}>
              <mesh geometry={mesh} castShadow receiveShadow>
                {bladeMaterialJSX('#d8f0e6')}
              </mesh>
            </group>
          ))}
          <mesh>
            <cylinderGeometry args={[preset.geometry.tipRadius * 0.035, preset.geometry.tipRadius * 0.045, height * 1.08, 12]} />
            <meshPhongMaterial color={nacelleColor} />
          </mesh>
        </group>
      </>
    );
  }

  return (
    <>
      <mesh position={[0, towerHeight / 2, 0]}>
        <cylinderGeometry args={[0.3, 0.5, towerHeight, 10]} />
        <meshPhongMaterial color={towerColor} />
      </mesh>
      <mesh position={[0, towerHeight, 0]}>
        <boxGeometry args={[nacelleSize, nacelleSize * 0.5, nacelleSize * 0.75]} />
        <meshPhongMaterial color={nacelleColor} />
      </mesh>
      <group ref={rotorRef} position={[0, towerHeight, nacelleSize * 0.52]} scale={scale}>
        {Array.from({ length: preset.geometry.nBlades }).map((_, i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / preset.geometry.nBlades]}
                 ref={el => { bladeRefs.current[i] = el; }}>
            <mesh geometry={mesh} castShadow receiveShadow>
              {bladeMaterialJSX('#eef5f2')}
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
};
