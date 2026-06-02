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
  failureLevel = 0,
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

  // Per-blade refs allow individual fracture/detach animation when overload is critical.
  const bladeRefs = useRef<Array<THREE.Group | null>>([]);
  const flexGroupRef = useRef<THREE.Group>(null);
  const detachStartRef = useRef<number | null>(null);

  // Subtle operational bending + structural shake.  Severity escalates with failure level.
  useFrame((_, dt) => {
    const t = performance.now() * 0.001;
    const k = Math.min(1, flex);
    const f = Math.max(0, Math.min(1.4, failureLevel));
    const shake = f > 0.05 ? (Math.sin(t * 38 + 1.7) * 0.04 + Math.cos(t * 51) * 0.03) * f : 0;

    if (flexGroupRef.current) {
      const oscillation = Math.sin(t * 4.2) * 0.05 * k;
      if (!isVAWT) {
        flexGroupRef.current.rotation.x = (0.10 * k + oscillation) * (windSpeed / 12) + shake * 0.4;
        flexGroupRef.current.rotation.z = shake * 0.35;
      } else {
        flexGroupRef.current.rotation.x = oscillation * 0.4 + shake * 0.25;
        flexGroupRef.current.rotation.z = -oscillation * 0.3 + shake * 0.25;
      }
    }

    // Trigger detach when severely overloaded.
    if (f >= 1 && detachStartRef.current == null) detachStartRef.current = t;
    if (f < 0.7) detachStartRef.current = null;

    bladeRefs.current.forEach((grp, i) => {
      if (!grp) return;
      // Per-blade tip-flutter, intensified by failure level.
      const flutter = Math.sin(t * (6 + i * 1.3) + i) * 0.04 * (k + f * 1.5);
      if (!isVAWT) {
        grp.rotation.x = flutter;
      } else {
        grp.rotation.z = flutter * 0.6;
      }
      // Single-blade fracture: blade #0 separates, tumbles, and drifts downstream.
      if (detachStartRef.current != null && i === 0) {
        const dt2 = t - detachStartRef.current;
        const drift = Math.min(g.tipRadius * 1.6, dt2 * g.tipRadius * 0.6);
        const fall = -Math.min(g.tipRadius * 1.4, 0.5 * 2 * dt2 * dt2);
        // detach direction: HAWT downstream (+Z), VAWT tangential drift +X
        if (!isVAWT) {
          grp.position.set(0, fall, drift);
        } else {
          grp.position.set(drift, fall, 0);
        }
        grp.rotation.x += dt * 4;
        grp.rotation.y += dt * 2.4;
      } else {
        grp.position.set(0, 0, 0);
      }
    });
  });

  // HAWT spinner radius engulfs blade root: must be >= rootRadius AND >= half-chord of root.
  const spinnerR = Math.max(g.rootRadius * 1.15, g.chordRoot * 0.55);
  const spinnerH = Math.max(g.rootRadius * 1.6, g.chordRoot * 0.9);

  // Stress-driven emissive: blades glow red-hot at the spar before fracture.
  const fClamped = Math.max(0, Math.min(1.2, failureLevel));
  const crackEmissive = useMemo(() => new THREE.Color(0xff3322), []);
  const crackIntensity = fClamped > 0.4 ? (fClamped - 0.4) * 1.6 : 0;

  return (
    <group>
      <group ref={flexGroupRef}>
        {Array.from({ length: nClones }).map((_, i) => (
          <group
            key={i}
            rotation={cloneRotation(i)}
            ref={el => { bladeRefs.current[i] = el; }}
          >
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
                  emissive={crackEmissive}
                  emissiveIntensity={crackIntensity}
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
