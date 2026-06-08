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
import { useIsMobile } from '@/hooks/use-mobile';

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
  /** Structural overload 0..1.2 — drives stress emissive, vibration, fracture+recovery. */
  failureLevel?: number;
  /** Whether the rotor should actively spin (off in static thumbnails). */
  spin?: boolean;
}

/**
 * Full rotor renderer.
 * Architecture (very important — fixes the "wiggle, no spin" bug):
 *
 *   <group>                          ← world
 *     <group ref=spinRef>            ← rotates continuously (omega from V·λ/R)
 *       <group ref=flexRef>          ← tiny global flex/shake (NEVER overrides spin)
 *         {blades.map → bladeRef}    ← per-blade flutter + detach/recovery
 *       </group>
 *     </group>
 *     {hub/spinner/struts}           ← non-spinning shell parts where appropriate
 *   </group>
 */
export function BladeMesh({
  geometry: g, viewMode, windSpeed, tsr, helical = 0, rotorType = 'hawt', heightOverDiameter,
  flex = 0.25, failureLevel = 0, spin = true,
}: Props) {
  const isVAWT = rotorType !== 'hawt';
  const isSavonius = rotorType === 'vawt-savonius';
  const isArchimedes = rotorType === 'vawt-archimedes';
  const isMobile = useIsMobile();

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

  const cloneRotation = (k: number): [number, number, number] => {
    const a = (k * 2 * Math.PI) / nClones;
    if (isVAWT) return [0, a, 0];
    return [0, 0, a];
  };

  const spinRef = useRef<THREE.Group>(null);
  const flexRef = useRef<THREE.Group>(null);
  const bladeRefs = useRef<Array<THREE.Group | null>>([]);

  // Per-blade detach progress 0..1 (1 = fully detached + tumbling).
  const detachT = useRef<number[]>([]);
  const frameCounterRef = useRef(0);

  const mobileScale = isMobile ? 0.55 : 1;
  const frameSkip = isMobile ? 2 : 1;

  // Aero ω (rad/s). For VAWT we cap the visible spin a bit to avoid blur.
  const omega = useMemo(() => {
    const o = (tsr * windSpeed) / Math.max(0.1, g.tipRadius);
    return isVAWT ? Math.min(o, 6) : Math.min(o, 8);
  }, [tsr, windSpeed, g.tipRadius, isVAWT]);

  useFrame((_, dt) => {
    frameCounterRef.current = (frameCounterRef.current + 1) % 1024;
    const stepDt = dt; // spin always uses real dt — never throttle rotation
    const t = performance.now() * 0.001;
    const f = Math.max(0, Math.min(1.4, failureLevel));

    // Init detach state buffer.
    if (detachT.current.length !== nClones) detachT.current = new Array(nClones).fill(0);

    // 1) Stable spin — damped when most blades have detached.
    const detachedFrac = detachT.current.reduce((a, x) => a + x, 0) / Math.max(1, nClones);
    const spinDamp = 1 - detachedFrac * 0.85;
    if (spin && spinRef.current) {
      const axis = isVAWT ? 'y' : 'z';
      spinRef.current.rotation[axis] += omega * stepDt * spinDamp;
    }

    // Skip the cosmetic per-blade math on mobile alternating frames.
    if (frameCounterRef.current % frameSkip !== 0) return;

    // 2) Global flex/shake — small, never replaces spin.
    if (flexRef.current) {
      const k = Math.min(1, flex);
      const shake = f > 0.05
        ? (Math.sin(t * 38 + 1.7) * 0.025 + Math.cos(t * 51) * 0.018) * f * mobileScale
        : 0;
      const oscillation = Math.sin(t * 4.2) * 0.035 * k * mobileScale;
      // Apply only to non-spin axes so blades still rotate cleanly.
      if (!isVAWT) {
        flexRef.current.rotation.x = oscillation + shake * 0.4;
        flexRef.current.rotation.y = shake * 0.3;
      } else {
        flexRef.current.rotation.x = oscillation * 0.4 + shake * 0.25;
        flexRef.current.rotation.z = -oscillation * 0.3 + shake * 0.25;
      }
    }

    // 3) Per-blade detach / recovery.
    //    - Each blade has a staggered fracture threshold (0.95..1.15·fLevel).
    //    - detachT[i] eases towards 1 when over threshold, eases back to 0 when safe.
    //    - When detachT > 0, blade drifts downwind, falls, tumbles, fades.
    const stagger = (i: number) => 1 + (i / Math.max(1, nClones - 1)) * 0.18;
    bladeRefs.current.forEach((grp, i) => {
      if (!grp) return;
      const target = f >= stagger(i) ? 1 : (f < 0.55 ? 0 : detachT.current[i]);
      // ease towards target
      const speed = target > detachT.current[i] ? 1.2 : 2.4; // recovery is faster than failure
      detachT.current[i] += (target - detachT.current[i]) * Math.min(1, stepDt * speed);
      const d = detachT.current[i];

      // Local flutter (independent of spin)
      const flutter = Math.sin(t * (6 + i * 1.3) + i) * 0.05 * (Math.min(1, flex) + f * 1.2) * mobileScale;
      if (!isVAWT) grp.rotation.x = flutter * (1 - d);
      else grp.rotation.z = flutter * 0.6 * (1 - d);

      if (d > 0.001) {
        // Drift downwind, fall, tumble. Wind axis: HAWT = +Z, VAWT = +X.
        const driftMax = g.tipRadius * 1.8;
        const fallMax = g.tipRadius * 1.6;
        const drift = driftMax * d;
        const fall = -fallMax * d * d;
        if (!isVAWT) grp.position.set(0, fall, drift);
        else grp.position.set(drift, fall, 0);
        grp.rotation.x = (grp.rotation.x || 0) + dt * 3.5 * d;
        grp.rotation.y = (grp.rotation.y || 0) + dt * 2.2 * d;
        // shrink slightly to hint at fading debris
        const sc = 1 - d * 0.18;
        grp.scale.set(sc, sc, sc);
      } else {
        grp.position.set(0, 0, 0);
        grp.scale.set(1, 1, 1);
      }
    });
  });

  // HAWT spinner radius engulfs blade root.
  const spinnerR = Math.max(g.rootRadius * 1.15, g.chordRoot * 0.55);
  const spinnerH = Math.max(g.rootRadius * 1.6, g.chordRoot * 0.9);

  // Stress emissive — fades down as blades detach (less heat once they're gone).
  const fClamped = Math.max(0, Math.min(1.2, failureLevel));
  const crackEmissive = useMemo(() => new THREE.Color(0xff3322), []);
  const crackIntensity = fClamped > 0.4 ? (fClamped - 0.4) * 1.6 : 0;

  return (
    <group>
      <group ref={spinRef}>
        <group ref={flexRef}>
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
      </group>

      {/* Hub / shaft / supports (static — don't spin so non-rotating parts stay put) */}
      {isVAWT ? (
        <>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[g.tipRadius * 0.04, g.tipRadius * 0.05, vawtHeight * 1.10, 24]} />
            <meshStandardMaterial color="#1a1f26" metalness={0.78} roughness={0.32} />
          </mesh>
          {([1, -1] as const).map(s => (
            <mesh key={s} position={[0, (vawtHeight / 2) * s, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[g.tipRadius * (isArchimedes ? 0.32 : 0.18), g.tipRadius * (isArchimedes ? 0.32 : 0.18), g.tipRadius * 0.05, 32]} />
              <meshStandardMaterial color="#2a3038" metalness={0.65} roughness={0.38} />
            </mesh>
          ))}
          <mesh position={[0, -vawtHeight / 2 - g.tipRadius * 0.5, 0]} castShadow>
            <cylinderGeometry args={[g.tipRadius * 0.08, g.tipRadius * 0.11, g.tipRadius * 1.0, 16]} />
            <meshStandardMaterial color="#2c333d" metalness={0.55} roughness={0.5} />
          </mesh>
        </>
      ) : (
        <>
          {/* HAWT spinner stays on the spin group so it rotates with the blades; struts/cone outside don't. */}
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[spinnerR, spinnerR * 0.85, spinnerH, 32]} />
              <meshStandardMaterial color="#1a1f26" metalness={0.78} roughness={0.3} />
            </mesh>
            <mesh position={[0, spinnerH * 0.55, 0]} castShadow>
              <coneGeometry args={[spinnerR, spinnerR * 1.1, 32]} />
              <meshStandardMaterial color="#23292f" metalness={0.7} roughness={0.35} />
            </mesh>
            <mesh position={[0, -spinnerH * 0.55, 0]} castShadow>
              <cylinderGeometry args={[spinnerR * 0.95, spinnerR * 0.7, spinnerR * 0.4, 32]} />
              <meshStandardMaterial color="#2a3038" metalness={0.65} roughness={0.38} />
            </mesh>
          </group>
        </>
      )}

      {/* VAWT radial struts — kept static so they don't smear under spin */}
      {isVAWT && !isSavonius && !isArchimedes && Array.from({ length: nClones }).map((_, i) => {
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
    </group>
  );
}
