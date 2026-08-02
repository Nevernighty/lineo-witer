// Full-screen ambient 3D backdrop. Actors sit far behind on a wide ring,
// auto-fitted to a small world size so no single GLB can dominate the frame.
// A strong center vignette guarantees UI legibility.
import { Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { type TurbineModelKey } from "@/assets/models";
import * as THREE from "three";

export interface BackdropActor {
  model: TurbineModelKey;
  /** Angle around the ring in radians. 0 = straight ahead (behind panel), π = behind camera. */
  angle: number;
  /** Ring radius from origin (metres). Default 9. */
  radius?: number;
  /** Vertical position (metres). Default 0.6. */
  y?: number;
  /** Target world size (largest bbox axis, metres). Default 1.6. */
  size?: number;
  spin?: number;
  axis?: "x" | "y" | "z";
}

export interface SceneBackdropProps {
  actors: BackdropActor[];
  intensity?: number;
  className?: string;
}

export function SceneBackdrop({ actors, intensity = 0.55, className }: SceneBackdropProps) {
  const reduce = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const isSmall = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(max-width: 640px)").matches,
    []
  );
  if (isSmall) {
    return (
      <div
        className={"absolute inset-0 pointer-events-none " + (className ?? "")}
        style={{
          zIndex: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, hsl(var(--primary) / 0.10) 0%, hsl(var(--background)) 65%)",
        }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={"absolute inset-0 pointer-events-none " + (className ?? "")}
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <Canvas
        dpr={[1, 1]}
        frameloop={reduce ? "demand" : "always"}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ width: "100%", height: "100%" }}
      >
        <PerspectiveCamera makeDefault position={[0, 2.2, 22]} fov={20} />
        {/* Aggressive fog so far actors just wash into background. */}
        <fog attach="fog" args={["#0d1117", 14, 30]} />
        <ambientLight intensity={0.22 * intensity} />
        <directionalLight position={[6, 8, 4]} intensity={0.7 * intensity} color="#e6f2ff" />
        <directionalLight position={[-6, 3, -4]} intensity={0.3 * intensity} color="#88a" />
        <Suspense fallback={null}>
          {actors.map((a, i) => {
            const r = a.radius ?? 9;
            const x = Math.sin(a.angle) * r;
            const z = -Math.abs(Math.cos(a.angle)) * r; // always behind the camera plane
            const y = a.y ?? 0.6;
            return (
              <Float
                key={i}
                speed={0.5}
                rotationIntensity={reduce ? 0 : 0.1}
                floatIntensity={reduce ? 0 : 0.2}
                floatingRange={[-0.12, 0.12]}
              >
                <AmbientTurbine position={[x, y, z]} size={a.size ?? 1.6} spin={reduce ? 0 : a.spin ?? 0.22} vertical={a.axis === 'y'} />
              </Float>
            );
          })}
          <Environment preset="sunset" />
        </Suspense>
        <EffectComposer enableNormalPass={false}>
          <Bloom intensity={0.2} luminanceThreshold={0.75} luminanceSmoothing={0.25} />
          <Vignette eskil={false} offset={0.1} darkness={0.95} />
        </EffectComposer>
      </Canvas>
      {/* Strong center mask so no GLB fragment ever competes with UI copy. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 50% 50%, hsl(var(--background) / 0.94) 0%, hsl(var(--background) / 0.7) 38%, hsl(var(--background) / 0.25) 72%, hsl(var(--background) / 0) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--background) / 0) 0%, hsl(var(--background) / 0.4) 55%, hsl(var(--background) / 0.94) 100%)",
        }}
      />
    </div>
  );
}

function AmbientTurbine({ position, size, spin, vertical }: { position: [number, number, number]; size: number; spin: number; vertical: boolean }) {
  const rotor = useMemo(() => ({ current: null as THREE.Group | null }), []);
  return (
    <group position={position} scale={size / 3}>
      <mesh position={[0, 1, 0]}><cylinderGeometry args={[0.035, 0.08, 2, 10]} /><meshStandardMaterial color="#70808a" metalness={0.55} roughness={0.45} /></mesh>
      <group position={[0, 2, 0]} rotation={vertical ? [0, 0, 0] : [0, Math.PI / 2, 0]}>
        <group ref={(node) => { rotor.current = node; }} onUpdate={(node) => { node.userData.spin = spin; }}>
          {[0, 1, 2].map(i => <mesh key={i} rotation={[0, 0, i * Math.PI * 2 / 3]} position={[0, 0.6, 0]}><boxGeometry args={[0.08, 1.15, 0.035]} /><meshStandardMaterial color="#b5c9d2" metalness={0.35} roughness={0.42} /></mesh>)}
          <mesh><sphereGeometry args={[0.13, 16, 12]} /><meshStandardMaterial color="#8fa5ae" metalness={0.7} roughness={0.3} /></mesh>
        </group>
      </group>
      <RotorAnimator target={rotor} spin={spin} vertical={vertical} />
    </group>
  );
}

function RotorAnimator({ target, spin, vertical }: { target: { current: THREE.Group | null }; spin: number; vertical: boolean }) {
  useFrame((_, dt) => {
    if (target.current) target.current.rotation[vertical ? 'y' : 'z'] += spin * Math.min(dt, 0.05);
  });
  return null;
}
