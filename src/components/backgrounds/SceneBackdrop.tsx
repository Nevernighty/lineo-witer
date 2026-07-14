// Full-screen, pointer-events-none 3D backdrop with a slow parallax camera.
// Renders behind UI (z-0). Auto-freezes on prefers-reduced-motion.
import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Cloud, Clouds, PerspectiveCamera } from "@react-three/drei";
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
  clouds?: boolean;
  className?: string;
}

export function SceneBackdrop({ actors, intensity = 0.6, clouds = true, className }: SceneBackdropProps) {
  const reduce = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  return (
    <div
      className={"absolute inset-0 pointer-events-none " + (className ?? "")}
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <Canvas
        dpr={[1, 1.5]}
        frameloop={reduce ? "demand" : "always"}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ width: "100%", height: "100%" }}
      >
        <PerspectiveCamera makeDefault position={[0, 2.2, 9]} fov={38} />
        <ambientLight intensity={0.35 * intensity} />
        <directionalLight position={[6, 8, 4]} intensity={1.2 * intensity} color="#e6f2ff" />
        <directionalLight position={[-6, 3, -4]} intensity={0.4 * intensity} color="#88a" />
        <Suspense fallback={null}>
          {actors.map((a, i) => (
            <GlbModel
              key={i}
              url={TURBINE_MODELS[a.model]}
              position={a.position}
              scale={a.scale ?? 1}
              spin={reduce ? 0 : a.spin ?? 0.6}
              axis={a.axis ?? "y"}
            />
          ))}
          {clouds && (
            <Clouds material={THREE.MeshBasicMaterial}>
              <Cloud seed={1} bounds={[14, 2, 8]} volume={6} color="#8ea6c6" opacity={0.18} position={[-4, 5, -6]} />
              <Cloud seed={2} bounds={[10, 2, 6]} volume={5} color="#7a94b8" opacity={0.14} position={[5, 4, -8]} />
            </Clouds>
          )}
          <Environment preset="sunset" />
        </Suspense>
        <EffectComposer enableNormalPass={false}>
          <Bloom intensity={0.35} luminanceThreshold={0.65} luminanceSmoothing={0.2} />
          <Vignette eskil={false} offset={0.2} darkness={0.65} />
        </EffectComposer>
      </Canvas>
      {/* Bottom fade so UI stays legible */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to bottom, hsl(var(--background) / 0) 0%, hsl(var(--background) / 0.55) 55%, hsl(var(--background) / 0.9) 100%)",
      }} />
    </div>
  );
}
