// Canvas stage for the real-turbine part explorer.
import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { PartMesh } from './PartMesh';
import { buildTurbineLayout, SPINNING_ROLES, type PlacedPart } from '@/data/turbineParts/layout';
import type { RealTurbine } from '@/data/realTurbines';

interface Props {
  turbine: RealTurbine;
  explode: number;
  spin: boolean;
  xray: boolean;
  hoveredId: string | null;
  selectedId: string | null;
  /** Roles the user has switched off in the legend. */
  hiddenRoles: string[];
  /** When set, everything except this role is ghosted. */
  focusRole: string | null;
  /** Guided assembly placement per part id (0..1). Null = manual explode mode. */
  placement?: Map<string, number> | null;
  /** Part ids belonging to the step being explained. */
  activeIds?: string[];
  /** Ids matching the search query — softly highlighted. */
  matchIds?: string[];
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

function Rotor({ children, spin, axis }: { children: React.ReactNode; spin: boolean; axis: 'y' | 'z' }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current && spin) ref.current.rotation[axis] += dt * 1.1;
  });
  return <group ref={ref}>{children}</group>;
}

/** Softly re-frames the orbit target onto the sub-assembly being explained. */
function Framing({ point, radius }: { point: [number, number, number] | null; radius: number }) {
  const controls = useThree(s => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null;
  const { camera } = useThree();
  const want = useRef(new THREE.Vector3());
  const dirV = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    if (!controls) return;
    want.current.set(point?.[0] ?? 0, point?.[1] ?? 0, point?.[2] ?? 0);
    const k = Math.min(1, dt * 2.2);
    controls.target.lerp(want.current, k);

    if (point) {
      const wantDist = THREE.MathUtils.clamp(radius * 3.1, 2.8, 11);
      dirV.current.copy(camera.position).sub(controls.target);
      const d = dirV.current.length() || 1;
      const nd = THREE.MathUtils.lerp(d, wantDist, k);
      dirV.current.multiplyScalar(nd / d);
      camera.position.copy(controls.target).add(dirV.current);
      if (camera.position.y < -1.4) camera.position.y = -1.4;
    }
    controls.update();
  });
  return null;
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="px-2.5 py-1.5 rounded-md bg-card/85 border border-primary/25 text-[11px] text-muted-foreground backdrop-blur">
        <div className="mb-1 font-mono text-primary tabular-nums">{Math.round(progress)}%</div>
        <div className="h-1 w-24 rounded bg-border/50 overflow-hidden">
          <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </Html>
  );
}

/** One failed CDN part must never blank the whole stage. */
class PartBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export function TurbineExplorer3D({
  turbine, explode, spin, xray, hoveredId, selectedId, hiddenRoles, focusRole,
  placement, activeIds, matchIds, onHover, onSelect,
}: Props) {
  const layout = useMemo(
    () => buildTurbineLayout(turbine.id, turbine.axis),
    [turbine.id, turbine.axis],
  );

  // Normalise any model (mm STLs or cm exports) to a ~3.4 unit tall stage subject.
  const scale = 3.4 / Math.max(0.001, layout.radius * 2);
  const camDist = 6.4;
  const yOffset = turbine.axis === 'vertical' ? -1.4 : 0;

  const stat = layout.parts.filter(p => !SPINNING_ROLES.includes(p.part.role));
  const rot = layout.parts.filter(p => SPINNING_ROLES.includes(p.part.role));

  // Focus point of the active step, in stage (scaled) space.
  const focus = useMemo<{ point: [number, number, number] | null; radius: number }>(() => {
    if (!activeIds?.length) return { point: null, radius: layout.radius * scale };
    const sel = layout.parts.filter(p => activeIds.includes(p.part.id));
    if (!sel.length) return { point: null, radius: layout.radius * scale };
    const c = sel.reduce((a, p) => [a[0] + p.pos[0], a[1] + p.pos[1], a[2] + p.pos[2]] as [number, number, number], [0, 0, 0] as [number, number, number]);
    const n = sel.length;
    const centre: [number, number, number] = [c[0] / n * scale, c[1] / n * scale + yOffset, c[2] / n * scale];
    let r = 0;
    for (const p of sel) {
      const half = Math.max(...p.part.ext) * 0.5 * scale;
      r = Math.max(r, half + Math.hypot(p.pos[0] * scale - centre[0], p.pos[1] * scale + yOffset - centre[1], p.pos[2] * scale - centre[2]));
    }
    return { point: centre, radius: Math.max(0.9, r) };
  }, [activeIds, layout, scale, yOffset]);

  const render = (p: PlacedPart) => (
    <PartBoundary key={p.part.id}>
      <PartMesh
        placed={p}
        explode={explode}
        place={placement ? placement.get(p.part.id) ?? 0 : undefined}
        active={activeIds?.includes(p.part.id) || matchIds?.includes(p.part.id)}
        xray={xray && p.part.role !== 'blade'}
        hidden={hiddenRoles.includes(p.part.role)}
        dim={(!!focusRole && p.part.role !== focusRole) || (!!matchIds?.length && !matchIds.includes(p.part.id))}
        selected={selectedId === p.part.id}
        hovered={hoveredId === p.part.id}
        onHover={onHover}
        onSelect={onSelect}
      />
    </PartBoundary>
  );

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [camDist * 0.75, camDist * 0.45, camDist * 0.8], fov: 42 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onPointerMissed={() => onHover(null)}
    >
      <color attach="background" args={['#0b0f14']} />
      <hemisphereLight intensity={0.55} groundColor="#0b0f14" />
      <directionalLight position={[5, 8, 4]} intensity={1.5} castShadow
        shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 3, -5]} intensity={0.5} color="#7fd1b9" />

      <Suspense fallback={<Loader />}>
        <group scale={scale} position={[0, yOffset, 0]}>
          {stat.map(render)}
          <Rotor spin={spin && explode < 0.02 && !placement} axis={layout.axis}>
            {rot.map(render)}
          </Rotor>
        </group>
        <Environment preset="city" />
      </Suspense>

      <ContactShadows position={[0, -1.9, 0]} opacity={0.45} scale={12} blur={2.6} far={5} />
      <OrbitControls
        makeDefault enablePan={false} enableDamping dampingFactor={0.08}
        minDistance={2.4} maxDistance={14} maxPolarAngle={Math.PI * 0.52}
      />
      <Framing point={focus.point} radius={focus.radius} />
    </Canvas>
  );
}
