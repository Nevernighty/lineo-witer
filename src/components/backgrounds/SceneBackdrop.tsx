// Full-screen ambient 3D backdrop. Actors sit far behind the UI, drift with Float,
// and are heavily faded by fog + radial vignette so text stays crisp.
import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Float, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { GlbModel } from "@/three/GlbModel";
import { TURBINE_MODELS, type TurbineModelKey } from "@/assets/models";
import * as THREE from "three";

export interface BackdropActor {
  model: TurbineModelKey;
  position: [number, number, number];
  scale?: number;
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
  // On tiny screens the 3D backdrop just fights the UI — skip it.
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
        <PerspectiveCamera makeDefault position={[0, 2.5, 16]} fov={26} />
        {/* Fog kills the far turbines so they read as atmosphere, not props. */}
        <fog attach="fog" args={["#0d1117", 12, 26]} />
        <ambientLight intensity={0.28 * intensity} />
        <directionalLight position={[6, 8, 4]} intensity={0.9 * intensity} color="#e6f2ff" />
        <directionalLight position={[-6, 3, -4]} intensity={0.35 * intensity} color="#88a" />
        <Suspense fallback={null}>
          {actors.map((a, i) => (
            <Float
              key={i}
              speed={0.6}
              rotationIntensity={reduce ? 0 : 0.15}
              floatIntensity={reduce ? 0 : 0.25}
              floatingRange={[-0.15, 0.15]}
            >
              <GlbModel
                url={TURBINE_MODELS[a.model]}
                position={a.position}
                scale={a.scale ?? 0.5}
                spin={reduce ? 0 : a.spin ?? 0.25}
                axis={a.axis ?? "y"}
              />
            </Float>
          ))}
          <Environment preset="sunset" />
        </Suspense>
        <EffectComposer enableNormalPass={false}>
          <Bloom intensity={0.25} luminanceThreshold={0.72} luminanceSmoothing={0.25} />
          <Vignette eskil={false} offset={0.15} darkness={0.85} />
        </EffectComposer>
      </Canvas>
      {/* Centre radial mask keeps the UI panel legible. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 50%, hsl(var(--background) / 0.82) 0%, hsl(var(--background) / 0.5) 40%, hsl(var(--background) / 0.15) 75%, hsl(var(--background) / 0) 100%)",
        }}
      />
      {/* Bottom fade for stats bar / footer. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--background) / 0) 0%, hsl(var(--background) / 0.4) 55%, hsl(var(--background) / 0.92) 100%)",
        }}
      />
    </div>
  );
}
