// Canvas stage for the real-turbine part explorer.
import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PartMesh } from './PartMesh';
import { buildTurbineLayout, SPINNING_ROLES } from '@/data/turbineParts/layout';
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

function Loader() {
  return (
    <Html center>
      <div className="px-2 py-1 rounded bg-card/80 border border-primary/25 text-[11px] text-muted-foreground">
        …
      </div>
    </Html>
  );
}

export function TurbineExplorer3D({
  turbine, explode, spin, xray, hoveredId, selectedId, hiddenRoles, focusRole, onHover, onSelect,
}: Props) {
  const layout = useMemo(
    () => buildTurbineLayout(turbine.id, turbine.axis),
    [turbine.id, turbine.axis],
  );

  // Normalise any model (mm STLs or cm exports) to a ~3.4 unit tall stage subject.
  const scale = 3.4 / Math.max(0.001, layout.radius * 2);
  const camDist = 6.4;

  const stat = layout.parts.filter(p => !SPINNING_ROLES.includes(p.part.role));
  const rot = layout.parts.filter(p => SPINNING_ROLES.includes(p.part.role));

  const render = (p: typeof layout.parts[number]) => (
    <PartMesh
      key={p.part.id}
      placed={p}
      explode={explode}
      xray={xray && p.part.role !== 'blade'}
      hidden={hiddenRoles.includes(p.part.role)}
      dim={!!focusRole && p.part.role !== focusRole}
      selected={selectedId === p.part.id}
      hovered={hoveredId === p.part.id}
      onHover={onHover}
      onSelect={onSelect}
    />
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
        <group scale={scale} position={[0, turbine.axis === 'vertical' ? -1.4 : 0, 0]}>
          {stat.map(render)}
          <Rotor spin={spin && explode < 0.02} axis={layout.axis}>
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
    </Canvas>
  );
}
