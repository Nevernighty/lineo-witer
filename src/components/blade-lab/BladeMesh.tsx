import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { BladeGeometry } from '@/aero/bem';
import {
  buildBladeGeometry,
  buildVAWTBladeGeometry,
  buildSavoniusBucketGeometry,
  buildArchimedesBladeGeometry,
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
  /** Operational bending: 0 = rigid, 1 = max realistic flex. */
  flex?: number;
  /**
   * Structural overload 0..1. >0 starts heavy vibration & visible cracks,
   * >=1 triggers a blade fracturing/detaching animation. Synced between
   * the Blade Lab viewer and the main simulation rotor.
   */
  failureLevel?: number;
}

/**
 * Dispatches between HAWT and VAWT mesh builders, then assembles a full rotor:
 *  - HAWT: blades + nacelle spinner + hub plate (root attaches inside the spinner so blades never appear "detached")
 *  - VAWT-h / helical / tropo: vertical airfoil blades + vertical shaft + top/bottom plates + radial struts
 *  - Savonius: two half-buckets + center shaft + end-plates
 *  - Archimedes: spiral ribbons around shaft + end-plates
 */
export function BladeMesh({
  geometry: g, viewMode, windSpeed, tsr, helical = 0, rotorType = 'hawt', heightOverDiameter, flex = 0.25,
}: Props) {
  const isVAWT = rotorType !== 'hawt';
  const isSavonius = rotorType === 'vawt-savonius';
  const isArchimedes = rotorType === 'vawt-archimedes';

  const built = useMemo(() => {
    if (isSavonius) {
      return buildSavoniusBucketGeometry(g, viewMode, { height: g.tipRadius * 2 * (heightOverDiameter ?? 2) });
    }
    if (isArchimedes) {
      return buildArchimedesBladeGeometry(g, viewMode, {
        height: g.tipRadius * 2 * (heightOverDiameter ?? 1.8),
        turns: 1.0 + helical / 360,
      });
    }
    if (isVAWT) {
      return buildVAWTBladeGeometry(g, viewMode, rotorType as 'vawt-h' | 'vawt-helical' | 'vawt-tropo', {
        helicalTwist: helical,
        height: g.tipRadius * 2 * (heightOverDiameter ?? 1),
      });
    }
    return buildBladeGeometry(g, viewMode, windSpeed, tsr, { helicalTwist: helical });
  }, [g, viewMode, windSpeed, tsr, helical, rotorType, heightOverDiameter, isVAWT, isSavonius, isArchimedes]);

  const isXray = viewMode === 'xray';
  const isWire = viewMode === 'wireframe';
  const nClones = isSavonius ? 2 : g.nBlades;
  const vawtHeight = g.tipRadius * 2 * (heightOverDiameter ?? (isSavonius ? 2 : isArchimedes ? 1.8 : 1));

  // VAWT clones rotate around +Y (vertical); HAWT clones rotate around +Z (wind axis).
  const cloneRotation = (k: number): [number, number, number] => {
    const a = (k * 2 * Math.PI) / nClones;
    if (isVAWT) return [0, a, 0];
    return [0, 0, a];
  };

  // Subtle operational bending — HAWT blades flex backward (along +Z, downwind),
  // VAWT struts/blades show minimal wobble. Scaled by tipSpeed × wind energy proxy.
  const flexGroupRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!flexGroupRef.current) return;
    const k = Math.min(1, flex);
    const t = performance.now() * 0.001;
    const oscillation = Math.sin(t * 4.2) * 0.05 * k;
    if (!isVAWT) {
      // bend backward; rotation around X-axis tilts blade tips downwind
      flexGroupRef.current.rotation.x = (0.10 * k + oscillation) * (windSpeed / 12);
    } else {
      flexGroupRef.current.rotation.x = oscillation * 0.4;
      flexGroupRef.current.rotation.z = -oscillation * 0.3;
    }
  });

  // HAWT spinner radius engulfs blade root: must be >= rootRadius AND >= half-chord of root.
  const spinnerR = Math.max(g.rootRadius * 1.15, g.chordRoot * 0.55);
  const spinnerH = Math.max(g.rootRadius * 1.6, g.chordRoot * 0.9);

  return (
    <group>
      <group ref={flexGroupRef}>
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
                  vertexColors metalness={0.42} roughness={0.38} side={THREE.DoubleSide}
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
      </group>

      {/* Hub / shaft / supports */}
      {isVAWT ? (
        <>
          {/* Vertical spindle */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[g.tipRadius * 0.04, g.tipRadius * 0.05, vawtHeight * 1.10, 24]} />
            <meshStandardMaterial color="#1a1f26" metalness={0.78} roughness={0.32} />
          </mesh>
          {/* Top/bottom mounting plates */}
          {([1, -1] as const).map(s => (
            <mesh key={s} position={[0, (vawtHeight / 2) * s, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[g.tipRadius * (isArchimedes ? 0.32 : 0.18), g.tipRadius * (isArchimedes ? 0.32 : 0.18), g.tipRadius * 0.05, 32]} />
              <meshStandardMaterial color="#2a3038" metalness={0.65} roughness={0.38} />
            </mesh>
          ))}
          {/* Radial support struts for H-Darrieus / helical (skip on Savonius/Archimedes) */}
          {!isSavonius && !isArchimedes && Array.from({ length: nClones }).map((_, i) => {
            const a = (i * 2 * Math.PI) / nClones;
            return (
              <group key={`strut-${i}`} rotation={[0, a, 0]}>
                {[1, -1].map(s => (
                  <mesh key={s} position={[g.tipRadius * 0.5, vawtHeight * 0.47 * s, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[g.tipRadius * 0.014, g.tipRadius * 0.014, g.tipRadius * 1.0, 10]} />
                    <meshStandardMaterial color="#46515f" metalness={0.6} roughness={0.42} />
                  </mesh>
                ))}
              </group>
            );
          })}
          {/* Tower stub below rotor */}
          <mesh position={[0, -vawtHeight / 2 - g.tipRadius * 0.5, 0]} castShadow>
            <cylinderGeometry args={[g.tipRadius * 0.08, g.tipRadius * 0.11, g.tipRadius * 1.0, 16]} />
            <meshStandardMaterial color="#2c333d" metalness={0.55} roughness={0.5} />
          </mesh>
        </>
      ) : (
        <>
          {/* HAWT nacelle spinner — large enough to engulf blade root cuffs (no "floating" blades) */}
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[spinnerR, spinnerR * 0.85, spinnerH, 32]} />
              <meshStandardMaterial color="#1a1f26" metalness={0.78} roughness={0.3} />
            </mesh>
            {/* nose cone */}
            <mesh position={[0, spinnerH * 0.55, 0]} castShadow>
              <coneGeometry args={[spinnerR, spinnerR * 1.1, 32]} />
              <meshStandardMaterial color="#23292f" metalness={0.7} roughness={0.35} />
            </mesh>
            {/* rear plate */}
            <mesh position={[0, -spinnerH * 0.55, 0]} castShadow>
              <cylinderGeometry args={[spinnerR * 0.95, spinnerR * 0.7, spinnerR * 0.4, 32]} />
              <meshStandardMaterial color="#2a3038" metalness={0.65} roughness={0.38} />
            </mesh>
          </group>
          {/* Blade root cuffs/bolts — visible attachment ring at each blade base */}
          {Array.from({ length: g.nBlades }).map((_, i) => {
            const a = (i * 2 * Math.PI) / g.nBlades;
            const r = g.rootRadius * 0.92;
            return (
              <mesh key={`cuff-${i}`} position={[Math.cos(a + Math.PI / 2) * r, Math.sin(a + Math.PI / 2) * r, 0]}
                    rotation={[0, 0, a]} castShadow>
                <cylinderGeometry args={[g.chordRoot * 0.55, g.chordRoot * 0.5, g.rootRadius * 0.35, 24]} />
                <meshStandardMaterial color="#3a4250" metalness={0.7} roughness={0.4} />
              </mesh>
            );
          })}
        </>
      )}
    </group>
  );
}
