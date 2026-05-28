import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BladeMesh } from './BladeMesh';
import type { BladeGeometry } from '@/aero/bem';
import type { ViewMode } from '@/aero/buildBladeGeometry';

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
  vawt?: boolean;
}

function TipVortex({ R, tsr, V, nBlades, color }: { R: number; tsr: number; V: number; nBlades: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * Math.min(2, (tsr * V) / Math.max(1, R)) * 0.2;
  });
  const turns = 5;
  const segs = 90;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const z = t * R * 2.4;
    const ang = t * turns * Math.PI * 2;
    const rad = R * (1 - t * 0.12);
    pts.push(new THREE.Vector3(Math.cos(ang) * rad, Math.sin(ang) * rad, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tubeR = Math.max(0.02, R * 0.012);
  const tube = new THREE.TubeGeometry(curve, 220, tubeR, 8, false);
  return (
    <group ref={ref}>
      {Array.from({ length: nBlades }).map((_, i) => (
        <group key={i} rotation={[0, 0, (i * 2 * Math.PI) / nBlades]}>
          <mesh geometry={tube}>
            <meshBasicMaterial color={color} transparent opacity={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Streamlines({ R }: { R: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.position.z = ((ref.current.position.z + dt * R * 0.4) % (R * 3)) - R * 1.5;
    }
  });
  const lines: JSX.Element[] = [];
  for (let i = -4; i <= 4; i++) {
    for (let j = -4; j <= 4; j++) {
      if (Math.hypot(i, j) > 4.5) continue;
      const x = (i / 4) * R * 1.4;
      const y = (j / 4) * R * 1.4;
      const pts = [new THREE.Vector3(x, y, -R * 1.5), new THREE.Vector3(x, y, R * 1.5)];
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      lines.push(
        <line key={`${i}-${j}`}>
          <bufferGeometry attach="geometry" {...geom} />
          <lineBasicMaterial color="#66e8ff" transparent opacity={0.18} />
        </line>
      );
    }
  }
  return <group ref={ref}>{lines}</group>;
}

function Cinematic({ enabled, R }: { enabled: boolean; R: number }) {
  useFrame((state) => {
    if (!enabled) return;
    const t = state.clock.elapsedTime * 0.18;
    const dist = R * 2.6;
    state.camera.position.x = Math.cos(t) * dist;
    state.camera.position.y = R * 0.4 + Math.sin(t * 0.6) * R * 0.3;
    state.camera.position.z = Math.sin(t) * dist;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

function CameraFit({ R }: { R: number }) {
  const { camera } = useThree();
  useEffect(() => {
    const d = Math.max(3, R) * 2.4;
    camera.position.set(d * 0.8, d * 0.45, d);
    camera.near = Math.max(0.05, R * 0.01);
    camera.far = Math.max(500, R * 20);
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
  }, [R, camera]);
  return null;
}

function GroundDisc({ R }: { R: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -R * 1.1, 0]} receiveShadow>
      <circleGeometry args={[R * 3, 64]} />
      <meshStandardMaterial color="#0c1218" metalness={0.0} roughness={1} />
    </mesh>
  );
}

function WindArrows({ R }: { R: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.position.z = ((ref.current.position.z + dt * R * 0.5) % (R * 1.5)) - R * 1.5;
  });
  const arr: JSX.Element[] = [];
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      arr.push(
        <mesh key={`${i}-${j}`} position={[(i / 2) * R * 1.4, (j / 2) * R * 1.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[R * 0.02, R * 0.08, 8]} />
          <meshBasicMaterial color="#66e8ff" transparent opacity={0.45} />
        </mesh>
      );
    }
  }
  return <group ref={ref}>{arr}</group>;
}

export function BladeViewer3D({
  geometry, viewMode, windSpeed, tsr, cinematic, showTipVortex, showStreamlines, postFX = true, helical = 0, vawt = false,
}: Props) {
  const R = geometry.tipRadius;
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
      <CameraFit R={R} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[R, R * 1.2, R * 0.8]} intensity={1.1} color="#bfeaff" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-R * 0.8, -R * 0.3, -R * 0.6]} intensity={0.45} color="#ff8866" />
      <Suspense fallback={null}>
        <Environment preset="city" />
        <BladeMesh geometry={geometry} viewMode={viewMode} windSpeed={windSpeed} tsr={tsr} helical={helical} vawt={vawt} />
        {showTipVortex && <TipVortex R={R} tsr={tsr} V={windSpeed} nBlades={geometry.nBlades} color={vortexColor} />}
        {showStreamlines && <Streamlines R={R} />}
        {showStreamlines && <WindArrows R={R} />}
        <GroundDisc R={R} />
        <Grid
          args={[R * 8, R * 8]}
          cellColor="#1a3a4a"
          sectionColor="#2a5a6a"
          position={[0, -R * 1.099, 0]}
          fadeDistance={R * 6}
          fadeStrength={1.5}
          cellSize={R * 0.2}
          sectionSize={R}
        />
      </Suspense>
      <OrbitControls enableDamping dampingFactor={0.08} makeDefault />
      <Cinematic enabled={cinematic} R={R} />
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
