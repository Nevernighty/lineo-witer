import { useMemo } from 'react';
import * as THREE from 'three';
import type { BladeGeometry } from '@/aero/bem';
import {
  buildBladeGeometry,
  buildVAWTBladeGeometry,
  buildSavoniusBucketGeometry,
  ViewMode,
  RotorType,
} from '@/aero/buildBladeGeometry';

interface Props {
  geometry: BladeGeometry;
  viewMode: ViewMode;
  windSpeed: number;
  tsr: number;
  helical?: number;
  rotorType?: RotorType;
  heightOverDiameter?: number;
}

/**
 * Dispatches between HAWT and VAWT mesh builders. HAWT span is +Y (cloned around +Z = wind axis);
 * VAWT blades are vertical (span +Y, placed at +X radius) and cloned around the vertical +Y axis.
 */
export function BladeMesh({
  geometry: g, viewMode, windSpeed, tsr, helical = 0, rotorType = 'hawt', heightOverDiameter,
}: Props) {
  const isVAWT = rotorType !== 'hawt';
  const isSavonius = rotorType === 'vawt-savonius';

  const built = useMemo(() => {
    if (rotorType === 'vawt-savonius') {
      return buildSavoniusBucketGeometry(g, viewMode, { height: g.tipRadius * 2 * (heightOverDiameter ?? 2) });
    }
    if (isVAWT) {
      return buildVAWTBladeGeometry(g, viewMode, rotorType as 'vawt-h' | 'vawt-helical' | 'vawt-tropo', {
        helicalTwist: helical,
        height: g.tipRadius * 2 * (heightOverDiameter ?? 1),
      });
    }
    return buildBladeGeometry(g, viewMode, windSpeed, tsr, { helicalTwist: helical });
  }, [g, viewMode, windSpeed, tsr, helical, rotorType, heightOverDiameter, isVAWT]);

  const isXray = viewMode === 'xray';
  const isWire = viewMode === 'wireframe';
  const nClones = isSavonius ? 2 : g.nBlades;
  const vawtHeight = g.tipRadius * 2 * (heightOverDiameter ?? (isSavonius ? 2 : 1));
  // VAWT clones rotate around +Y (vertical); HAWT clones rotate around +Z (wind axis).
  const cloneRotation = (k: number): [number, number, number] => {
    const a = (k * 2 * Math.PI) / nClones;
    if (isVAWT) return [0, a, 0];
    return [0, 0, a];
  };

  return (
    <group>
      {Array.from({ length: nClones }).map((_, i) => (
        <group key={i} rotation={cloneRotation(i)}>
          <mesh geometry={built.geometry} castShadow receiveShadow>
            {isWire ? (
              <meshBasicMaterial vertexColors wireframe />
            ) : isXray ? (
              <meshStandardMaterial
                vertexColors transparent opacity={0.35}
                emissive={new THREE.Color(0x39ff14)} emissiveIntensity={0.6}
                metalness={0.1} roughness={0.6} side={THREE.DoubleSide}
              />
            ) : (
              <meshStandardMaterial
                vertexColors metalness={0.35} roughness={0.42} side={THREE.DoubleSide}
              />
            )}
          </mesh>
          {isXray && (
            <mesh geometry={built.geometry}>
              <meshBasicMaterial color="#39ff14" wireframe transparent opacity={0.25} />
            </mesh>
          )}
        </group>
      ))}

      {/* Hub / tower */}
      {isVAWT ? (
        <>
          {/* Vertical spindle */}
          <mesh>
            <cylinderGeometry args={[g.tipRadius * 0.035, g.tipRadius * 0.045, vawtHeight * 1.08, 20]} />
            <meshStandardMaterial color="#1a1f26" metalness={0.7} roughness={0.35} />
          </mesh>
          {/* Top/bottom mounting plates */}
          <mesh position={[0, vawtHeight / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[g.tipRadius * 0.14, g.tipRadius * 0.14, g.tipRadius * 0.045, 28]} />
            <meshStandardMaterial color="#2a3038" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, -vawtHeight / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[g.tipRadius * 0.14, g.tipRadius * 0.14, g.tipRadius * 0.045, 28]} />
            <meshStandardMaterial color="#2a3038" metalness={0.6} roughness={0.4} />
          </mesh>
          {!isSavonius && Array.from({ length: nClones }).map((_, i) => {
            const a = (i * 2 * Math.PI) / nClones;
            return (
              <group key={`strut-${i}`} rotation={[0, a, 0]}>
                <mesh position={[g.tipRadius * 0.52, vawtHeight * 0.47, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[g.tipRadius * 0.012, g.tipRadius * 0.012, g.tipRadius * 0.96, 8]} />
                  <meshStandardMaterial color="#46515f" metalness={0.55} roughness={0.45} />
                </mesh>
                <mesh position={[g.tipRadius * 0.52, -vawtHeight * 0.47, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[g.tipRadius * 0.012, g.tipRadius * 0.012, g.tipRadius * 0.96, 8]} />
                  <meshStandardMaterial color="#46515f" metalness={0.55} roughness={0.45} />
                </mesh>
              </group>
            );
          })}
        </>
      ) : (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[g.rootRadius * 0.7, g.rootRadius * 0.85, g.rootRadius * 1.4, 32]} />
            <meshStandardMaterial color="#1a1f26" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, g.rootRadius * 0.95, 0]}>
            <coneGeometry args={[g.rootRadius * 0.7, g.rootRadius * 0.9, 32]} />
            <meshStandardMaterial color="#2a3038" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )}
    </group>
  );
}
