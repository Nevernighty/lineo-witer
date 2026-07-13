import { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BladeMesh } from './BladeMesh';
import type { BladeGeometry } from '@/aero/bem';
import type { ViewMode, RotorType } from '@/aero/buildBladeGeometry';
import { useIsMobile } from '@/hooks/use-mobile';
import type { VfxBus } from '@/blade-lab/cinema/VfxBus';
import type { StageId, CameraCue } from '@/blade-lab/cinema/types';
import { VfxLayer } from '@/blade-lab/cinema/VfxLayer';
import { ScenarioStage } from '@/blade-lab/cinema/ScenarioStage';
import { CinemaCamera } from '@/blade-lab/cinema/CinemaCamera';

interface VfxConfig {
  vortexIntensity: number;  // 0..1.5
  vortexTurns: number;      // 1..6
  vortexRadiusFactor: number; // 0.6..1.4
  vortexDecay: number;      // 0..0.6 contraction along length
  wakeDensity: number;      // 0..1.5
  wakeSwirl: number;        // 0..1
  streamCount: number;      // 0..1 multiplier
  streamLength: number;     // 0.5..2 multiplier on advection length
  streamJitter: number;     // 0..1 turbulence shake
  streamSpeedMul: number;   // 0.2..3
  airAroundBlades: boolean; // dense near-blade streamers
}

interface Props {
  geometry: BladeGeometry;
  viewMode: ViewMode;
  windSpeed: number;
  tsr: number;
  cinematic: boolean;
  showTipVortex: boolean;
  showStreamlines: boolean;
  postFX?: boolean;
  helical?: number;
  rotorType?: RotorType;
  heightOverDiameter?: number;
  failureLevel?: number;
  /** Background tint from site scenario. */
  bgTint?: string;
  /** Turbulence intensity 0..1 from site scenario. */
  turbulence?: number;
  reactionSpeed?: number;
  recoverySpeed?: number;
  vfx: VfxConfig;
  cinema?: { stage?: StageId; vfxBus?: VfxBus; cameraCue?: CameraCue | null };
}

function TipVortexHAWT({ R, nBlades, V, tsr, color, intensity, turns, radiusFactor, decay }:
  { R: number; nBlades: number; V: number; tsr: number; color: string; intensity: number; turns: number; radiusFactor: number; decay: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * Math.min(2.5, (tsr * V) / Math.max(1, R)) * 0.25;
  });
  const tubes = useMemo(() => {
    const out: THREE.BufferGeometry[] = [];
    const len = R * 2.8;
    const R0 = R * radiusFactor;
    for (let b = 0; b < nBlades; b++) {
      const phase0 = (b * 2 * Math.PI) / nBlades;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 80; i++) {
        const tt = i / 80;
        const angle = phase0 + tt * turns * Math.PI * 2;
        const rr = R0 * (1 - tt * decay);
        pts.push(new THREE.Vector3(Math.cos(angle) * rr, Math.sin(angle) * rr, tt * len));
      }
      out.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, Math.max(0.015, R * 0.011), 6, false));
    }
    return out;
  }, [R, nBlades, turns, radiusFactor, decay]);
  return (
    <group ref={ref}>
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial color={color} transparent opacity={Math.min(0.7, 0.38 * intensity)} />
        </mesh>
      ))}
    </group>
  );
}

function TipVortexVAWT({ R, H, color, intensity, turns, swirl }:
  { R: number; H: number; color: string; intensity: number; turns: number; swirl: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * (0.3 + swirl * 0.6); });
  const tubes = useMemo(() => {
    const out: THREE.BufferGeometry[] = [];
    for (let s = 0; s < 2; s++) {
      const ySign = s === 0 ? 1 : -1;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 90; i++) {
        const tt = i / 90;
        const ang = tt * turns * Math.PI * 2;
        pts.push(new THREE.Vector3(tt * R * 2.6, (H / 2) * ySign - ySign * tt * H * 0.18, Math.sin(ang) * R * (1 - tt * 0.18) * 0.9));
      }
      out.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, Math.max(0.015, R * 0.010), 6, false));
    }
    return out;
  }, [R, H, turns]);
  return (
    <group ref={ref}>
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial color={color} transparent opacity={Math.min(0.7, 0.42 * intensity)} />
        </mesh>
      ))}
    </group>
  );
}

function StreamlinesHAWT({ R, V, vfx, turbulence }: { R: number; V: number; vfx: VfxConfig; turbulence: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = Math.max(40, Math.floor(220 * vfx.wakeDensity * vfx.streamCount));
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * R * 1.1;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = Math.sin(a) * r;
      arr[i * 3 + 2] = -R * 1.6 + Math.random() * R * 3.2 * vfx.streamLength;
    }
    return arr;
  }, [count, R, vfx.streamLength]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    const step = Math.max(0.5, V) * dt * 0.6 * vfx.streamSpeedMul;
    const jitter = (turbulence + vfx.streamJitter) * 0.05 * R;
    const maxZ = R * 1.8 * vfx.streamLength;
    const minZ = -R * 1.6;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 2] += step;
      if (jitter > 0) {
        arr[i]     += (Math.random() - 0.5) * jitter * dt;
        arr[i + 1] += (Math.random() - 0.5) * jitter * dt;
      }
      if (arr[i + 2] > maxZ) arr[i + 2] = minZ;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial color="#7be7ff" size={Math.max(0.04, R * 0.012)} sizeAttenuation transparent opacity={0.55} />
    </points>
  );
}

function StreamlinesVAWT({ R, H, V, vfx, turbulence }: { R: number; H: number; V: number; vfx: VfxConfig; turbulence: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = Math.max(40, Math.floor(260 * vfx.wakeDensity * vfx.streamCount));
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = -R * 1.6 + Math.random() * R * 3.2 * vfx.streamLength;
      arr[i * 3 + 1] = (Math.random() - 0.5) * H * 1.1;
      arr[i * 3 + 2] = (Math.random() - 0.5) * R * 2.2;
    }
    return arr;
  }, [count, R, H, vfx.streamLength]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    const step = Math.max(0.5, V) * dt * 0.6 * vfx.streamSpeedMul;
    const jitter = (turbulence + vfx.streamJitter) * 0.05 * R;
    const maxX = R * 1.8 * vfx.streamLength;
    const minX = -R * 1.6;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] += step;
      if (jitter > 0) {
        arr[i + 1] += (Math.random() - 0.5) * jitter * dt;
        arr[i + 2] += (Math.random() - 0.5) * jitter * dt;
      }
      if (arr[i] > maxX) arr[i] = minX;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial color="#7be7ff" size={Math.max(0.04, R * 0.012)} sizeAttenuation transparent opacity={0.55} />
    </points>
  );
}

/** Dense streamers hugging the rotor disc — air around blades. */
function AirAroundBlades({ R, isVAWT, V }: { R: number; isVAWT: boolean; V: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 220;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = R * (0.4 + Math.random() * 0.7);
      if (isVAWT) {
        arr[i * 3]     = Math.cos(a) * r;
        arr[i * 3 + 1] = (Math.random() - 0.5) * R * 1.6;
        arr[i * 3 + 2] = Math.sin(a) * r;
      } else {
        arr[i * 3]     = Math.cos(a) * r;
        arr[i * 3 + 1] = Math.sin(a) * r;
        arr[i * 3 + 2] = (Math.random() - 0.5) * R * 0.6;
      }
    }
    return arr;
  }, [count, R, isVAWT]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    const step = Math.max(0.5, V) * dt * 0.45;
    if (isVAWT) {
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] += step;
        if (arr[i] > R * 1.6) arr[i] = -R * 1.4;
      }
    } else {
      for (let i = 2; i < arr.length; i += 3) {
        arr[i] += step;
        if (arr[i] > R * 0.6) arr[i] = -R * 0.6;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial color="#bff7ff" size={Math.max(0.035, R * 0.010)} sizeAttenuation transparent opacity={0.75} />
    </points>
  );
}

function Cinematic({ enabled, R, isVAWT, H }: { enabled: boolean; R: number; isVAWT: boolean; H: number }) {
  useFrame((state) => {
    if (!enabled) return;
    const t = state.clock.elapsedTime * 0.18;
    if (isVAWT) {
      const dist = R * 3.2;
      state.camera.position.x = Math.cos(t) * dist;
      state.camera.position.y = Math.sin(t * 0.6) * (H * 0.25);
      state.camera.position.z = Math.sin(t) * dist;
    } else {
      const dist = R * 2.6;
      state.camera.position.x = Math.cos(t) * dist;
      state.camera.position.y = R * 0.4 + Math.sin(t * 0.6) * R * 0.3;
      state.camera.position.z = Math.sin(t) * dist;
    }
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

function CameraFit({ R, H, isVAWT }: { R: number; H: number; isVAWT: boolean }) {
  const { camera } = useThree();
  useEffect(() => {
    if (isVAWT) {
      const reach = Math.max(R * 4.2, H * 1.45);
      camera.position.set(reach * 0.95, H * 0.28, reach * 0.95);
      camera.near = Math.max(0.05, R * 0.01);
      camera.far = Math.max(500, reach * 20);
    } else {
      const d = Math.max(3, R) * 2.4;
      camera.position.set(d * 0.8, d * 0.45, d);
      camera.near = Math.max(0.05, R * 0.01);
      camera.far = Math.max(500, R * 20);
    }
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
  }, [R, H, isVAWT, camera]);
  return null;
}

function GroundDisc({ R, yPos }: { R: number; yPos: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, yPos, 0]} receiveShadow>
      <circleGeometry args={[R * 3.4, 64]} />
      <meshStandardMaterial color="#0c1218" metalness={0.0} roughness={1} />
    </mesh>
  );
}

export function BladeViewer3D({
  geometry, viewMode, windSpeed, tsr, cinematic, showTipVortex, showStreamlines, postFX = true, helical = 0,
  rotorType = 'hawt', heightOverDiameter, failureLevel = 0,
  bgTint, turbulence = 0, reactionSpeed = 1, recoverySpeed = 1, vfx, cinema,
}: Props) {
  const isVAWT = rotorType !== 'hawt';
  const R = geometry.tipRadius;
  const H = isVAWT ? R * 2 * (heightOverDiameter ?? 1) : R;
  const groundY = isVAWT ? -H / 2 - R * 0.1 : -R * 1.1;
  const isMobile = useIsMobile();
  const mobileMul = isMobile ? 0.45 : 1;
  const vortexColor =
    viewMode === 'pressure' ? '#ff6b6b' :
    viewMode === 'stall' ? '#ff7a00' :
    viewMode === 'stress' ? '#a78bfa' :
    failureLevel > 0.6 ? '#ff5533' :
    '#66e8ff';

  const bg = bgTint ?? '#07101a';
  const canvasStyle = useMemo(() => ({
    background: `radial-gradient(circle at center, ${bg} 0%, #02050a 70%, #000 100%)`,
  }), [bg]);

  return (
    <Canvas
      shadows
      camera={{ position: [R * 1.6, R * 0.8, R * 1.8], fov: 45 }}
      dpr={[1, isMobile ? 1.3 : 1.6]}
      style={canvasStyle}
    >
      <CameraFit R={R} H={H} isVAWT={isVAWT} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[R, R * 1.2, R * 0.8]} intensity={1.1} color="#bfeaff" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-R * 0.8, -R * 0.3, -R * 0.6]} intensity={0.45} color="#ff8866" />
      <Suspense fallback={null}>
        <Environment preset="city" />
        <BladeMesh
          geometry={geometry} viewMode={viewMode} windSpeed={windSpeed} tsr={tsr}
          helical={helical} rotorType={rotorType} heightOverDiameter={heightOverDiameter}
          failureLevel={failureLevel}
          flex={0.25 + Math.min(0.6, windSpeed / 30)}
          turbulence={turbulence}
          reactionSpeed={reactionSpeed}
          recoverySpeed={recoverySpeed}
        />

        {showTipVortex && (isVAWT
          ? <TipVortexVAWT R={R} H={H} color={vortexColor} intensity={vfx.vortexIntensity * mobileMul} turns={vfx.vortexTurns} swirl={vfx.wakeSwirl} />
          : <TipVortexHAWT R={R} nBlades={geometry.nBlades} V={windSpeed} tsr={tsr} color={vortexColor}
              intensity={vfx.vortexIntensity * mobileMul} turns={vfx.vortexTurns}
              radiusFactor={vfx.vortexRadiusFactor} decay={vfx.vortexDecay} />
        )}
        {showStreamlines && (isVAWT
          ? <StreamlinesVAWT R={R} H={H} V={windSpeed} vfx={{ ...vfx, wakeDensity: vfx.wakeDensity * mobileMul }} turbulence={turbulence} />
          : <StreamlinesHAWT R={R} V={windSpeed} vfx={{ ...vfx, wakeDensity: vfx.wakeDensity * mobileMul }} turbulence={turbulence} />
        )}
        {vfx.airAroundBlades && <AirAroundBlades R={R} isVAWT={isVAWT} V={windSpeed} />}
        {cinema?.stage && cinema.stage !== 'none' && (
          <ScenarioStage stage={cinema.stage} R={R} H={H} isVAWT={isVAWT} V={windSpeed} />
        )}
        {cinema?.vfxBus && <VfxLayer bus={cinema.vfxBus} />}
        <GroundDisc R={Math.max(R, H * 0.5)} yPos={groundY} />
        <Grid
          args={[Math.max(R, H) * 8, Math.max(R, H) * 8]}
          cellColor="#1a3a4a" sectionColor="#2a5a6a"
          position={[0, groundY + 0.001, 0]}
          fadeDistance={Math.max(R, H) * 6} fadeStrength={1.5}
          cellSize={Math.max(R, H) * 0.2} sectionSize={Math.max(R, H)}
        />
      </Suspense>
      <OrbitControls enableDamping dampingFactor={0.08} makeDefault target={[0, 0, 0]} minDistance={Math.max(R, H) * 0.45} maxDistance={Math.max(R, H) * 9} enabled={!cinema?.cameraCue} />
      <Cinematic enabled={cinematic && !cinema?.cameraCue} R={R} H={H} isVAWT={isVAWT} />
      <CinemaCamera cue={cinema?.cameraCue ?? null} enabled={!!cinema?.cameraCue} />
      {postFX && !isMobile && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.4} luminanceThreshold={0.6} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.65} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

export type { VfxConfig };
