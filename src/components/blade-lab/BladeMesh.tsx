import { useMemo } from 'react';
import * as THREE from 'three';
import type { BladeGeometry } from '@/aero/bem';
import { buildBladeGeometry, ViewMode } from '@/aero/buildBladeGeometry';

interface Props {
  geometry: BladeGeometry;
  viewMode: ViewMode;
  windSpeed: number;
  tsr: number;
  helical?: number;
  vawt?: boolean;
}

/**
 * Span = +Y (built into geometry). Blades fan out by rotating each clone about +Z
 * (the spin / wind axis). This fixes the previous bug where all blades stacked.
 */
export function BladeMesh({ geometry: g, viewMode, windSpeed, tsr, helical = 0, vawt = false }: Props) {
  const built = useMemo(
    () => buildBladeGeometry(g, viewMode, windSpeed, tsr, { helicalTwist: helical, vawt }),
    [g, viewMode, windSpeed, tsr, helical, vawt]
  );

  const isXray = viewMode === 'xray';
  const isWire = viewMode === 'wireframe';

  return (
    <group>
      {Array.from({ length: g.nBlades }).map((_, i) => {
        const rot = (i * 2 * Math.PI) / g.nBlades;
        return (
          <group key={i} rotation={[0, 0, rot]}>
            <mesh geometry={built.geometry} castShadow receiveShadow>
              {isWire ? (
                <meshBasicMaterial vertexColors wireframe />
              ) : isXray ? (
                <meshStandardMaterial
                  vertexColors
                  transparent
                  opacity={0.35}
                  emissive={new THREE.Color(0x39ff14)}
                  emissiveIntensity={0.6}
                  metalness={0.1}
                  roughness={0.6}
                  side={THREE.DoubleSide}
                />
              ) : (
                <meshStandardMaterial
                  vertexColors
                  metalness={0.35}
                  roughness={0.42}
                  side={THREE.DoubleSide}
                />
              )}
            </mesh>
            {isXray && (
              <mesh geometry={built.geometry}>
                <meshBasicMaterial color="#39ff14" wireframe transparent opacity={0.25} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Hub spinner (nacelle-aligned with wind axis = Z) */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[g.rootRadius * 0.7, g.rootRadius * 0.85, g.rootRadius * 1.4, 32]} />
          <meshStandardMaterial color="#1a1f26" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, g.rootRadius * 0.95, 0]}>
          <coneGeometry args={[g.rootRadius * 0.7, g.rootRadius * 0.9, 32]} />
          <meshStandardMaterial color="#2a3038" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}
