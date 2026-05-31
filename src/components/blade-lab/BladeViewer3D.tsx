import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BladeMesh } from './BladeMesh';
import type { BladeGeometry } from '@/aero/bem';
import type { ViewMode, RotorType } from '@/aero/buildBladeGeometry';

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
}

/** Vortex helix for HAWT — along +Z wind axis. */
function TipVortexHAWT({ R, tsr, V, nBlades, color }: { R: number; tsr: number; V: number; nBlades: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * Math.min(2, (tsr * V) / Math.max(1, R)) * 0.2;
  });
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90;
    pts.push(new THREE.Vector3(Math.cos(t * 5 * Math.PI * 2) * R * (1 - t * 0.12), Math.sin(t * 5 * Math.PI * 2) * R * (1 - t * 0.12), t * R * 2.4));
  }
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, Math.max(0.02, R * 0.012), 8, false);
  return (
    <group ref={ref}>
      {Array.from({ length: nBlades }).map((_, i) => (
        <group key={i} rotation={[0, 0, (i * 2 * Math.PI) / nBlades]}>
          <mesh geometry={tube}><meshBasicMaterial color={color} transparent opacity={0.55} /></mesh>
        </group>
      ))}
    </group>
  );
}

/** Vortex helix for VAWT — wraps around the vertical Y-axis spindle and drifts downstream along +X. */
function TipVortexVAWT({ R, H, color }: { R: number; H: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.4; });
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const ang = t * 4 * Math.PI * 2;
    const drift = t * R * 2.5; // downwind (+X) drift
    pts.push(new THREE.Vector3(Math.cos(ang) * R * 1.05 + drift, -H / 2 + t * H, Math.sin(ang) * R * 1.05));
  }
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, Math.max(0.015, R * 0.01), 8, false);
  return (
    <group ref={ref}>
      <mesh geometry={tube}><meshBasicMaterial color={color} transparent opacity={0.5} /></mesh>
    </group>
  );
}

function StreamlinesHAWT({ R }: { R: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.position.z = ((ref.current.position.z + dt * R * 0.4) % (R * 3)) - R * 1.5; });
  const lines: JSX.Element[] = [];
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    if (Math.hypot(i, j) > 4.5) continue;
    const pts = [new THREE.Vector3((i / 4) * R * 1.4, (j / 4) * R * 1.4, -R * 1.5), new THREE.Vector3((i / 4) * R * 1.4, (j / 4) * R * 1.4, R * 1.5)];
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    lines.push(<line key={`${i}-${j}`}><bufferGeometry attach="geometry" {...geom} /><lineBasicMaterial color="#66e8ff" transparent opacity={0.18} /></line>);
  }
  return <group ref={ref}>{lines}</group>;
}

/** VAWT wind comes from -X to +X. Streamlines run along X past the vertical rotor. */
function StreamlinesVAWT({ R, H }: { R: number; H: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.position.x = ((ref.current.position.x + dt * R * 0.6) % (R * 3)) - R * 1.5; });
  const lines: JSX.Element[] = [];
  for (let j = -3; j <= 3; j++) for (let k = -3; k <= 3; k++) {
    if (Math.hypot(j, k) > 3.5) continue;
    const y = (j / 3) * (H / 2 + R * 0.4);
    const z = (k / 3) * R * 1.5;
    const pts = [new THREE.Vector3(-R * 2, y, z), new THREE.Vector3(R * 2, y, z)];
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    lines.push(<line key={`${j}-${k}`}><bufferGeometry attach="geometry" {...geom} /><lineBasicMaterial color="#66e8ff" transparent opacity={0.18} /></line>);
  }
  return <group ref={ref}>{lines}</group>;
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
  rotorType = 'hawt', heightOverDiameter,
}: Props) {
  const isVAWT = rotorType !== 'hawt';
  const R = geometry.tipRadius;
  const H = isVAWT ? R * 2 * (heightOverDiameter ?? 1) : R;
  const groundY = isVAWT ? -H / 2 - R * 0.1 : -R * 1.1;
  const vortexColor =
    viewMode === 'pressure' ? '#ff6b6b' :
    viewMode === 'stall' ? '#ff7a00' :
    viewMode === 'stress' ? '#a78bfa' :
    '#66e8ff';

  return (
    <Canvas
      shadows
      camera={{ position: [R * 1.6, R * 0.8, R * 1.8], fov: 45 }}
      dpr={[1, 1.6]}
      style={{ background: 'radial-gradient(circle at center, #07101a 0%, #02050a 70%, #000 100%)' }}
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
        />
        {showTipVortex && (isVAWT
          ? <TipVortexVAWT R={R} H={H} color={vortexColor} />
          : <TipVortexHAWT R={R} tsr={tsr} V={windSpeed} nBlades={geometry.nBlades} color={vortexColor} />
        )}
        {showStreamlines && (isVAWT ? <StreamlinesVAWT R={R} H={H} /> : <StreamlinesHAWT R={R} />)}
        <GroundDisc R={Math.max(R, H * 0.5)} yPos={groundY} />
        <Grid
          args={[Math.max(R, H) * 8, Math.max(R, H) * 8]}
          cellColor="#1a3a4a" sectionColor="#2a5a6a"
          position={[0, groundY + 0.001, 0]}
          fadeDistance={Math.max(R, H) * 6} fadeStrength={1.5}
          cellSize={Math.max(R, H) * 0.2} sectionSize={Math.max(R, H)}
        />
      </Suspense>
      <OrbitControls enableDamping dampingFactor={0.08} makeDefault target={[0, 0, 0]} minDistance={Math.max(R, H) * 0.45} maxDistance={Math.max(R, H) * 9} />
      <Cinematic enabled={cinematic} R={R} H={H} isVAWT={isVAWT} />
      {postFX && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.45} luminanceThreshold={0.55} luminanceSmoothing={0.3} mipmapBlur />
          <ChromaticAberration offset={[0.0006, 0.0008] as any} radialModulation={false} modulationOffset={0} />
          <Vignette eskil={false} offset={0.2} darkness={0.65} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
