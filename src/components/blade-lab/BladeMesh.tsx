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
import { pushDiag } from '@/store/useDiagnosticsStore';

interface Props {
  geometry: BladeGeometry;
  viewMode: ViewMode;
  windSpeed: number;
  tsr: number;
  helical?: number;
  rotorType?: RotorType;
  heightOverDiameter?: number;
  flex?: number;
  failureLevel?: number;
  spin?: boolean;
  /** Extra turbulence jitter (0..1) from selected site scenario. */
  turbulence?: number;
  /** Recovery speed multiplier (1 = default). */
  recoverySpeed?: number;
  /** Reaction speed multiplier for entering failure. */
  reactionSpeed?: number;
}

/**
 * Architecture:
 *   <group> ← world (static parts: hub, struts, shaft)
 *     <group ref=spinRef>           continuous omega rotation, ONLY spin axis is touched
 *       <group ref=flexRef>          tiny global flex (NEVER on spin axis)
 *         per-blade <group ref=bladeRefs[i]> — local flutter, fracture trajectories
 *       </group>
 *     </group>
 *
 * Detach model (fix for "wrong-axis-after-crash"):
 *   • each blade has its own stable Euler offset (eulerRef) that grows during detach
 *     and is interpolated back to (0,0,0) on recovery — we no longer accumulate
 *     rotation.x/y straight on the group object, which was the source of the bug.
 *   • position is interpolated the same way through targetPos/curPos vectors.
 *   • all blades fracture together (with small phase delay 0..0.18) and each gets
 *     a UNIQUE explosion vector + tumble axis so pieces fly in different directions.
 *   • on recovery: position lerps to (0,0,0), rotation slerps to identity quaternion
 *     before the blade is fully re-shown. Result: blades return correctly aligned
 *     with the spin axis, no axis flip.
 */
export function BladeMesh({
  geometry: g, viewMode, windSpeed, tsr, helical = 0, rotorType = 'hawt', heightOverDiameter,
  flex = 0.25, failureLevel = 0, spin = true,
  turbulence = 0, recoverySpeed = 1, reactionSpeed = 1,
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
  // Savonius geometry already contains both buckets in one mesh → no cloning.
  const nClones = isSavonius ? 1 : g.nBlades;
  const vawtHeight = g.tipRadius * 2 * (heightOverDiameter ?? (isSavonius ? 2 : isArchimedes ? 1.8 : 1));

  const cloneRotation = (k: number): [number, number, number] => {
    const a = (k * 2 * Math.PI) / nClones;
    if (isVAWT) return [0, a, 0];
    return [0, 0, a];
  };

  const spinRef = useRef<THREE.Group>(null);
  const flexRef = useRef<THREE.Group>(null);
  const bladeRefs = useRef<Array<THREE.Group | null>>([]);

  // Stable per-blade explosion vectors (random but reproducible per index).
  const explosion = useMemo(() => {
    const arr: Array<{
      drift: THREE.Vector3;    // direction the piece flies (in clone-local space)
      tumble: THREE.Euler;     // angular velocity (rad/s)
      delay: number;           // 0..0.25 staggered phase
      gravity: number;         // m/s² visible
    }> = [];
    for (let i = 0; i < nClones; i++) {
      // Pseudo-random but deterministic per i & nClones.
      const seed = (i * 1664525 + nClones * 1013904223) >>> 0;
      const r1 = ((seed & 0xffff) / 0xffff) * 2 - 1;
      const r2 = (((seed >> 8) & 0xffff) / 0xffff) * 2 - 1;
      const r3 = (((seed >> 16) & 0xffff) / 0xffff) * 2 - 1;
      // Outward (centrifugal) tendency along +Y (span), plus downwind +Z (HAWT) / +X (VAWT)
      // and a sideways component to spread directions visibly.
      const downwind = isVAWT ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
      const sideways = isVAWT ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
      const drift = new THREE.Vector3()
        .add(downwind.clone().multiplyScalar(1.2 + 0.5 * Math.abs(r1)))
        .add(sideways.clone().multiplyScalar(0.8 * r2))
        .add(new THREE.Vector3(0, 1, 0).multiplyScalar(0.6 + 0.5 * r3)); // outward along span
      drift.normalize().multiplyScalar(g.tipRadius * (1.5 + 0.6 * Math.abs(r1)));
      const tumble = new THREE.Euler(
        (3 + 2 * r1),
        (2.5 + 2 * r2),
        (3.5 + 2 * r3),
      );
      arr.push({ drift, tumble, delay: 0.18 * (i / Math.max(1, nClones - 1)), gravity: g.tipRadius * 1.4 });
    }
    return arr;
  }, [nClones, g.tipRadius, isVAWT]);

  // Per-blade state, all initialised to zero (no detach).
  const state = useRef<Array<{
    detachT: number;        // 0..1
    pos: THREE.Vector3;     // current displacement
    quat: THREE.Quaternion; // current rotation offset on top of clone rotation
    quatV: THREE.Vector3;   // accumulated tumble Euler angles (for slerp back)
  }>>([]);

  if (state.current.length !== nClones) {
    state.current = Array.from({ length: nClones }, () => ({
      detachT: 0,
      pos: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      quatV: new THREE.Vector3(),
    }));
  }

  const frameCounterRef = useRef(0);
  const mobileScale = isMobile ? 0.55 : 1;
  const frameSkip = isMobile ? 2 : 1;

  // Aero ω (rad/s).
  const omega = useMemo(() => {
    const o = (tsr * windSpeed) / Math.max(0.1, g.tipRadius);
    return isVAWT ? Math.min(o, 6) : Math.min(o, 8);
  }, [tsr, windSpeed, g.tipRadius, isVAWT]);

  useFrame((_, dt) => {
    frameCounterRef.current = (frameCounterRef.current + 1) % 1024;
    const t = performance.now() * 0.001;
    const f = Math.max(0, Math.min(1.4, failureLevel));

    // 1) Stable spin — damped when detached.
    let detachedFrac = 0;
    for (const s of state.current) detachedFrac += s.detachT;
    detachedFrac /= Math.max(1, nClones);
    const spinDamp = 1 - detachedFrac * 0.85;
    if (spin && spinRef.current) {
      const axis: 'y' | 'z' = isVAWT ? 'y' : 'z';
      spinRef.current.rotation[axis] += omega * dt * spinDamp;
    }

    // Diagnostics emit (throttled inside the store).
    pushDiag({
      t,
      omega: omega * spinDamp,
      rpm: (omega * spinDamp * 60) / (2 * Math.PI),
      tipSpeed: tsr * windSpeed,
      failure: f,
      detachedFrac,
      flexAmp: Math.min(1, flex) + turbulence * 0.5,
    });

    if (frameCounterRef.current % frameSkip !== 0) return;

    // 2) Global flex/shake — non-spin axes only.
    if (flexRef.current) {
      const k = Math.min(1, flex);
      const tj = 1 + turbulence * 1.5;
      const shake = f > 0.05
        ? (Math.sin(t * 38 + 1.7) * 0.025 + Math.cos(t * 51) * 0.018) * f * mobileScale * tj
        : 0;
      const oscillation = Math.sin(t * 4.2) * 0.035 * k * mobileScale * tj;
      if (!isVAWT) {
        flexRef.current.rotation.x = oscillation + shake * 0.4;
        flexRef.current.rotation.y = shake * 0.3;
        flexRef.current.rotation.z = 0; // never touch spin axis
      } else {
        flexRef.current.rotation.x = oscillation * 0.4 + shake * 0.25;
        flexRef.current.rotation.z = -oscillation * 0.3 + shake * 0.25;
        flexRef.current.rotation.y = 0;
      }
    }

    // 3) Per-blade detach / recovery — all blades together with phase stagger.
    bladeRefs.current.forEach((grp, i) => {
      if (!grp) return;
      const st = state.current[i];
      const ex = explosion[i];
      // Trigger ALL blades at f >= 1 (with small per-blade delay so they don't snap at the same instant)
      // Allow recovery whenever f drops to a safe margin.
      const targetTrigger = f - ex.delay >= 1.0;
      const targetSafe = f < 0.55;
      const target = targetTrigger ? 1 : targetSafe ? 0 : st.detachT;

      const speed = (target > st.detachT ? 1.4 * reactionSpeed : 2.6 * recoverySpeed);
      st.detachT += (target - st.detachT) * Math.min(1, dt * speed);
      const d = st.detachT;

      // Local flutter on non-spin axis only, scaled down as detach grows.
      const flutter = Math.sin(t * (6 + i * 1.3) + i) * 0.05 * (Math.min(1, flex) + f * 1.2) * mobileScale * (1 + turbulence);
      const flutterScale = (1 - d);

      if (d > 0.001) {
        // Accumulate tumble (radians) using stable angular velocities.
        st.quatV.x += ex.tumble.x * dt * d;
        st.quatV.y += ex.tumble.y * dt * d;
        st.quatV.z += ex.tumble.z * dt * d;
        // Position: explosion drift + gravity (downward in world-Y).
        st.pos.copy(ex.drift).multiplyScalar(d * d);
        st.pos.y -= ex.gravity * d * d * 0.9;
      } else {
        // Recovery: lerp back to identity smoothly, then snap once close enough.
        st.pos.multiplyScalar(0.78);
        st.quatV.multiplyScalar(0.78);
        if (st.pos.lengthSq() < 1e-4) st.pos.set(0, 0, 0);
        if (st.quatV.lengthSq() < 1e-4) st.quatV.set(0, 0, 0);
      }

      // HARD RESET once fully recovered — kills residual axis drift bug.
      if (st.detachT < 1e-3 && st.pos.lengthSq() === 0 && st.quatV.lengthSq() === 0) {
        grp.position.set(0, 0, 0);
        grp.rotation.set(0, 0, 0);
        grp.quaternion.identity();
        grp.scale.setScalar(1);
        return;
      }

      grp.position.copy(st.pos);
      grp.rotation.set(
        st.quatV.x + (!isVAWT ? flutter * flutterScale : 0),
        st.quatV.y,
        st.quatV.z + (isVAWT ? flutter * 0.6 * flutterScale : 0),
      );

      const sc = 1 - d * 0.20;
      grp.scale.setScalar(sc);
    });
  });

  // HAWT spinner radius engulfs blade root.
  const spinnerR = Math.max(g.rootRadius * 1.15, g.chordRoot * 0.55);
  const spinnerH = Math.max(g.rootRadius * 1.6, g.chordRoot * 0.9);

  // Stress emissive — fades down as blades detach (less heat once they're gone).
  const fClamped = Math.max(0, Math.min(1.2, failureLevel));
  const crackEmissive = useMemo(() => new THREE.Color(0xff3322), []);
  const crackIntensity = fClamped > 0.4 ? (fClamped - 0.4) * 1.6 : 0;

  const showStruts = isVAWT && !isSavonius && !isArchimedes;
  const showEndPlates = isSavonius; // Savonius end discs improve the Coanda jet visualisation.

  return (
    <group>
      {/* All rotating geometry lives under spinRef: hub, spinner, struts, end-plates, blades.
          This is what fixes the "struts static while blades fly" bug. */}
      <group ref={spinRef}>
        {/* HAWT hub/spinner — rotates with rotor. */}
        {!isVAWT && (
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[spinnerR, spinnerR * 0.85, spinnerH, 32]} />
              <meshStandardMaterial color="#1a1f26" metalness={0.78} roughness={0.3} />
            </mesh>
            <mesh position={[0, spinnerH * 0.55, 0]} castShadow>
              <coneGeometry args={[spinnerR, spinnerR * 1.1, 32]} />
              <meshStandardMaterial color="#23292f" metalness={0.7} roughness={0.35} />
            </mesh>
          </group>
        )}

        {/* VAWT struts — inside spin so they rotate together with the blades. */}
        {showStruts && Array.from({ length: nClones }).map((_, i) => {
          const a = (i * 2 * Math.PI) / nClones;
          return (
            <group key={`strut-${i}`} rotation={[0, a, 0]}>
              {[1, -1].map(s => (
                <mesh key={s} position={[g.tipRadius * 0.5, vawtHeight * 0.45 * s, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[g.tipRadius * 0.02, g.tipRadius * 0.02, g.tipRadius * 1.0, 12]} />
                  <meshStandardMaterial color="#46515f" metalness={0.6} roughness={0.42} />
                </mesh>
              ))}
            </group>
          );
        })}

        {/* Savonius end discs — required by S-rotor physics. */}
        {showEndPlates && ([1, -1] as const).map(s => (
          <mesh key={`endplate-${s}`} position={[0, (vawtHeight / 2) * s, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[g.tipRadius * 1.04, g.tipRadius * 1.04, g.tipRadius * 0.03, 48]} />
            <meshStandardMaterial color="#2a3038" metalness={0.55} roughness={0.5} />
          </mesh>
        ))}

        {/* Compact hub discs for non-Savonius VAWT (Tropo, Gorlov, H-Darrieus, Archimedes). */}
        {isVAWT && !isSavonius && ([1, -1] as const).map(s => (
          <mesh key={`disc-${s}`} position={[0, (vawtHeight / 2) * s, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[g.tipRadius * (isArchimedes ? 0.30 : 0.18), g.tipRadius * (isArchimedes ? 0.30 : 0.18), g.tipRadius * 0.05, 32]} />
            <meshStandardMaterial color="#2a3038" metalness={0.65} roughness={0.38} />
          </mesh>
        ))}

        {/* Blades. */}
        <group ref={flexRef}>
          {Array.from({ length: nClones }).map((_, i) => (
            <group key={i} rotation={cloneRotation(i)}>
              <group ref={el => { bladeRefs.current[i] = el; }}>
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
                      emissive={crackEmissive} emissiveIntensity={crackIntensity}
                    />
                  )}
                </mesh>
                {isXray && (
                  <mesh geometry={built.geometry}>
                    <meshBasicMaterial color="#39ff14" wireframe transparent opacity={0.25} />
                  </mesh>
                )}
              </group>
            </group>
          ))}
        </group>
      </group>

      {/* Static (non-rotating) world geometry: mast & base. */}
      {isVAWT ? (
        <>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[g.tipRadius * 0.04, g.tipRadius * 0.05, vawtHeight * 1.10, 24]} />
            <meshStandardMaterial color="#1a1f26" metalness={0.78} roughness={0.32} />
          </mesh>
          <mesh position={[0, -vawtHeight / 2 - g.tipRadius * 0.5, 0]} castShadow>
            <cylinderGeometry args={[g.tipRadius * 0.08, g.tipRadius * 0.11, g.tipRadius * 1.0, 16]} />
            <meshStandardMaterial color="#2c333d" metalness={0.55} roughness={0.5} />
          </mesh>
        </>
      ) : null}
    </group>
  );
}
