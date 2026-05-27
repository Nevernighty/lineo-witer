import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { BladeMesh } from './BladeMesh';
import type { BladeGeometry } from '@/aero/bem';

interface Props {
  geometry: BladeGeometry;
  viewMode: 'solid' | 'wireframe' | 'pressure' | 'stall' | 'stress';
  windSpeed: number;
  tsr: number;
  cinematic: boolean;
  showTipVortex: boolean;
  showStreamlines: boolean;
}

function TipVortex({ R, tsr, V, nBlades }: { R: number; tsr: number; V: number; nBlades: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    if (ref.current) ref.current.rotation.z += dt * (tsr * V / R) * 0.15;
  });
  const turns = 6;
  const segs = 80;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const z = t * R * 2.5;
    const ang = t * turns * Math.PI * 2;
    const rad = R * (1 - t * 0.1);
    pts.push(new THREE.Vector3(Math.cos(ang) * rad, Math.sin(ang) * rad, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.TubeGeometry(curve, 200, 0.08, 8, false);
  return (
    <group ref={ref}>
      {Array.from({ length: nBlades }).map((_, i) => (
        <group key={i} rotation={[0, 0, (i * 2 * Math.PI) / nBlades]}>
          <mesh geometry={tube}>
            <meshBasicMaterial color="#66e8ff" transparent opacity={0.45} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Streamlines({ R }: { R: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.position.z = (ref.current.position.z + dt * 4) % (R * 3); });
  const lines: JSX.Element[] = [];
  for (let i = -4; i <= 4; i++) {
    for (let j = -4; j <= 4; j++) {
      const x = (i / 4) * R * 1.2;
      const y = (j / 4) * R * 1.2;
      const pts = [new THREE.Vector3(x, y, -R * 2), new THREE.Vector3(x, y, R * 2)];
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      lines.push(
        <line key={`${i}-${j}`}>
          <bufferGeometry attach="geometry" {...geom} />
          <lineBasicMaterial color="#39ff14" transparent opacity={0.22} />
        </line>
      );
    }
  }
  return <group ref={ref}>{lines}</group>;
}

function Cinematic({ enabled }: { enabled: boolean }) {
  useFrame((state) => {
    if (!enabled) return;
    const t = state.clock.elapsedTime * 0.15;
    state.camera.position.x = Math.cos(t) * 80;
    state.camera.position.y = 20 + Math.sin(t * 0.7) * 10;
    state.camera.position.z = Math.sin(t) * 80;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export function BladeViewer3D({ geometry, viewMode, windSpeed, tsr, cinematic, showTipVortex, showStreamlines }: Props) {
  return (
    <Canvas camera={{ position: [60, 30, 60], fov: 50 }} dpr={[1, 1.5]} style={{ background: 'radial-gradient(circle at center, #07101a, #000)' }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[40, 50, 30]} intensity={1.0} color="#bfeaff" />
      <directionalLight position={[-30, -10, -20]} intensity={0.4} color="#ff8866" />
      <Suspense fallback={null}>
        <BladeMesh geometry={geometry} viewMode={viewMode} windSpeed={windSpeed} tsr={tsr} />
        {showTipVortex && <TipVortex R={geometry.tipRadius} tsr={tsr} V={windSpeed} nBlades={geometry.nBlades} />}
        {showStreamlines && <Streamlines R={geometry.tipRadius} />}
        <Grid args={[200, 200]} cellColor="#1a3a4a" sectionColor="#2a5a6a" position={[0, -geometry.tipRadius * 1.2, 0]} infiniteGrid fadeDistance={250} />
      </Suspense>
      <OrbitControls enableDamping dampingFactor={0.08} />
      <Cinematic enabled={cinematic} />
    </Canvas>
  );
}
