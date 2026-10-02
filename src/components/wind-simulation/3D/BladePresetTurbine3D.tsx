import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ActiveBladePreset } from '@/store/useBladePresetStore';
import {
  buildBladeGeometry,
  buildSavoniusBucketGeometry,
  buildVAWTBladeGeometry,
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
 * Live preset rotor with stable spin + per-blade failure & recovery.
 * Mirrors the architecture in <BladeMesh>: one rotating group + nested per-blade
 * groups whose detach progress eases in (failure) and out (recovery).
 */
export const BladePresetTurbine3D: React.FC<Props> = ({
  preset, towerHeight, rotorDiameter, nacelleSize, adjustedSpeed, towerColor, nacelleColor,
}) => {
  const spinRef = useRef<THREE.Group>(null);
  const bladeRefs = useRef<Array<THREE.Group | null>>([]);
  const detachT = useRef<number[]>([]);

  // Archimedes (Liam F1) is a horizontal-axis conical screw rotor facing the wind.
  const isArchimedes = preset.rotorType === 'vawt-archimedes';
  const isVAWT = preset.rotorType !== 'hawt' && !isArchimedes;
  const isSavonius = preset.rotorType === 'vawt-savonius';
  const scale = useMemo(
    () => rotorDiameter / Math.max(0.1, preset.geometry.tipRadius * 2),
    [rotorDiameter, preset.geometry.tipRadius],
  );
  const height = preset.geometry.tipRadius * 2 *
    (preset.heightOverDiameter ?? (isSavonius ? 2 : isArchimedes ? 1.8 : 1));
  const mat = getMaterial(preset.materialId);

  const mesh = useMemo(() => {
    if (isSavonius) return buildSavoniusBucketGeometry(preset.geometry, 'solid', { height }).geometry;
    if (isArchimedes) return buildArchimedesConeGeometry(preset.geometry.tipRadius,
      preset.geometry.tipRadius * 1.25, (preset.helicalTwistDeg ?? 360) / 360 * 0.75);
    if (isVAWT) return buildVAWTBladeGeometry(preset.geometry, 'solid',
      preset.rotorType as 'vawt-h' | 'vawt-helical' | 'vawt-tropo',
      { height, helicalTwist: preset.helicalTwistDeg }).geometry;
    return buildBladeGeometry(preset.geometry, 'solid', adjustedSpeed, 7).geometry;
  }, [preset, isVAWT, isSavonius, isArchimedes, height, adjustedSpeed]);

  const bendStart = preset.bendThresholdPct ?? 0.7;
  const fractureAt = preset.fractureThresholdPct ?? 1.1;
  const tsr = 7;
  const tipSpeed = isVAWT ? adjustedSpeed * Math.max(1, tsr * 0.5) : adjustedSpeed * tsr;
  const safety = mat.maxTipSpeed;
  const failureLevel = Math.max(0, Math.min(1.3,
    (tipSpeed - safety * bendStart) / Math.max(0.05, safety * (fractureAt - bendStart))
  ));

  const crackEmissive = useMemo(() => new THREE.Color(0xff3322), []);
  const crackIntensity = failureLevel > 0.35 ? (failureLevel - 0.35) * 1.4 : 0;

  const isMobile = useIsMobile();
  const mobileScale = isMobile ? 0.5 : 1;
  const n = isSavonius ? 2 : isArchimedes ? 3 : preset.geometry.nBlades;

  useFrame((_, dt) => {
    const t = performance.now() * 0.001;
    if (detachT.current.length !== n) detachT.current = new Array(n).fill(0);
    const detachedFrac = detachT.current.reduce((a, x) => a + x, 0) / Math.max(1, n);
    const spinDamp = 1 - detachedFrac * 0.85;

    if (spinRef.current) {
      if (isVAWT) spinRef.current.rotation.y += adjustedSpeed * 0.14 * dt * spinDamp;
      else spinRef.current.rotation.z += adjustedSpeed * (isArchimedes ? 0.07 : 0.12) * dt * spinDamp;
    }

    // Per-blade detach state with stagger
    const stagger = (i: number) => 1 + (i / Math.max(1, n - 1)) * 0.18;
    bladeRefs.current.forEach((grp, i) => {
      if (!grp) return;
      const target = failureLevel >= stagger(i) ? 1 : (failureLevel < 0.55 ? 0 : detachT.current[i]);
      const speed = target > detachT.current[i] ? 1.2 : 2.4;
      detachT.current[i] += (target - detachT.current[i]) * Math.min(1, dt * speed);
      const d = detachT.current[i];
      const flutter = Math.sin(t * (6 + i * 1.3) + i) * 0.03 * (0.3 + failureLevel * 1.4) * mobileScale * (1 - d);
      if (isVAWT) grp.rotation.z = flutter * 0.6;
      else grp.rotation.x = flutter;

      if (d > 0.001) {
        const driftMax = preset.geometry.tipRadius * 1.8;
        const fallMax = preset.geometry.tipRadius * 1.6;
        if (isVAWT) grp.position.set(driftMax * d, -fallMax * d * d, 0);
        else grp.position.set(0, -fallMax * d * d, driftMax * d);
        grp.rotation.x += dt * 3.5 * d;
        grp.rotation.y += dt * 2.2 * d;
        const sc = 1 - d * 0.18;
        grp.scale.set(sc, sc, sc);
      } else {
        grp.position.set(0, 0, 0);
        grp.scale.set(1, 1, 1);
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
    return (
      <>
        <mesh position={[0, towerHeight / 2, 0]}>
          <cylinderGeometry args={[0.18, 0.3, towerHeight, 10]} />
          <meshPhongMaterial color={towerColor} />
        </mesh>
        <group position={[0, towerHeight * 0.58, 0]} scale={scale}>
          <group ref={spinRef}>
            {Array.from({ length: n }).map((_, i) => (
              <group key={i} rotation={[0, (i * Math.PI * 2) / n, 0]}
                     ref={el => { bladeRefs.current[i] = el; }}>
                <mesh geometry={mesh} castShadow receiveShadow>
                  {bladeMaterialJSX('#d8f0e6')}
                </mesh>
              </group>
            ))}
          </group>
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
      <group ref={spinRef} position={[0, towerHeight, nacelleSize * 0.52]} scale={scale}>
        {isArchimedes && (
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, preset.geometry.tipRadius * 0.62]}>
            <cylinderGeometry args={[preset.geometry.tipRadius * 0.05, preset.geometry.tipRadius * 0.05, preset.geometry.tipRadius * 1.3, 12]} />
            <meshStandardMaterial color={nacelleColor} metalness={0.5} roughness={0.4} />
          </mesh>
        )}
        {Array.from({ length: n }).map((_, i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / n]}
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

/**
 * Liam-F1 style blade: a conical helicoid along +Z (upwind nose at z=0, wide
 * rear at z=L). Radius grows toward the rear; blade wraps `turns` revolutions.
 * Three copies rotated 120° about Z form the full rotor.
 */
function buildArchimedesConeGeometry(R: number, L: number, turns: number) {
  const nT = 64, nS = 10;
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  for (let i = 0; i <= nT; i++) {
    const t = i / nT;
    const a = t * turns * Math.PI * 2;
    const r = R * (0.12 + 0.88 * Math.pow(t, 0.65));
    const z = t * L;
    for (let j = 0; j <= nS; j++) {
      const s = 0.06 + 0.94 * (j / nS);
      // slight forward cupping of the outer edge (shell curvature)
      const cup = -Math.sin(s * Math.PI * 0.5) * R * 0.08 * t;
      pos.push(s * r * Math.cos(a), s * r * Math.sin(a), z + cup);
      const shade = 0.75 + 0.25 * s;
      col.push(0.85 * shade, 0.95 * shade, 0.92 * shade);
    }
  }
  const row = nS + 1;
  for (let i = 0; i < nT; i++) for (let j = 0; j < nS; j++) {
    const a = i * row + j, b = a + row;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
