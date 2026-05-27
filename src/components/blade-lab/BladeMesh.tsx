import { useMemo } from 'react';
import * as THREE from 'three';
import type { BladeGeometry } from '@/aero/bem';
import { clOf, cdOf } from '@/aero/airfoils';

interface Props {
  geometry: BladeGeometry;
  viewMode: 'solid' | 'wireframe' | 'pressure' | 'stall' | 'stress';
  windSpeed: number;
  tsr: number;
}

/** Generate NACA-4-like profile coordinates as a fallback when only thickness is known. */
function naca4Coords(thicknessPct: number, camberPct = 2, camberPos = 0.4, nPts = 24): Array<[number, number]> {
  const t = thicknessPct / 100;
  const m = camberPct / 100;
  const p = camberPos;
  const pts: Array<[number, number]> = [];
  const upper: Array<[number, number]> = [];
  const lower: Array<[number, number]> = [];
  for (let i = 0; i <= nPts; i++) {
    const x = 0.5 * (1 - Math.cos((Math.PI * i) / nPts));
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1015 * x * x * x * x);
    let yc = 0, dyc = 0;
    if (x < p) { yc = (m / (p * p)) * (2 * p * x - x * x); dyc = (2 * m / (p * p)) * (p - x); }
    else { yc = (m / ((1 - p) * (1 - p))) * ((1 - 2 * p) + 2 * p * x - x * x); dyc = (2 * m / ((1 - p) * (1 - p))) * (p - x); }
    const th = Math.atan(dyc);
    upper.push([x - yt * Math.sin(th), yc + yt * Math.cos(th)]);
    lower.push([x + yt * Math.sin(th), yc - yt * Math.cos(th)]);
  }
  for (let i = upper.length - 1; i >= 0; i--) pts.push(upper[i]);
  for (let i = 1; i < lower.length; i++) pts.push(lower[i]);
  return pts;
}

export function BladeMesh({ geometry: g, viewMode, windSpeed, tsr }: Props) {
  const { geom, colors } = useMemo(() => {
    const nStations = 22;
    const nProfile = 48;
    const profile = naca4Coords(g.airfoil.thickness, g.airfoil.cl0 > 0 ? 4 : 0, 0.4, nProfile / 2);
    const positions: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];

    const stationData: Array<{ r: number; chord: number; twist: number; cp: number; stress: number; stalled: boolean }> = [];
    for (let s = 0; s < nStations; s++) {
      const t = s / (nStations - 1);
      const r = g.rootRadius + t * (g.tipRadius - g.rootRadius);
      const chord = g.chordRoot + t * (g.chordTip - g.chordRoot);
      const localTwist = g.twistLaw === 'linear'
        ? g.twistRoot + t * (g.twistTip - g.twistRoot)
        : (2 / 3) * Math.atan(1 / Math.max(0.05, tsr * (r / g.tipRadius))) * (180 / Math.PI) - 6;
      const twist = (localTwist + g.pitch) * (Math.PI / 180);
      // Approx local alpha for highlight only (pressure / stall coloring)
      const Vax = windSpeed;
      const Vt = (tsr * windSpeed) * (r / g.tipRadius);
      const phi = Math.atan2(Vax, Math.max(0.1, Vt));
      const alpha = (phi - twist) * (180 / Math.PI);
      const cl = clOf(g.airfoil, alpha);
      const cd = cdOf(g.airfoil, alpha);
      const cp = Math.max(-3, Math.min(1.2, 1 - cl)); // very approximate suction-side Cp
      // Bending stress proxy: integrate normal force from this station to tip
      const stress = (1 - t) * Math.max(0, cl) * windSpeed * windSpeed * 0.0005;
      stationData.push({ r, chord, twist: localTwist, cp, stress, stalled: Math.abs(alpha) > g.airfoil.alphaStall });
    }

    for (let s = 0; s < nStations; s++) {
      const sd = stationData[s];
      for (let p = 0; p < profile.length; p++) {
        const [px, py] = profile[p];
        // center profile around quarter-chord
        const xC = (px - 0.25) * sd.chord;
        const yC = py * sd.chord;
        const cos = Math.cos(sd.twist * Math.PI / 180);
        const sin = Math.sin(sd.twist * Math.PI / 180);
        const x = xC * cos - yC * sin;
        const y = xC * sin + yC * cos;
        positions.push(x, y, sd.r);

        let col = new THREE.Color(0x39ff14);
        if (viewMode === 'pressure') {
          // map cp ∈ [-3..1] to red(suction) -> blue
          const tt = (sd.cp + 3) / 4;
          col = new THREE.Color().setHSL(0.66 * tt, 1, 0.5);
        } else if (viewMode === 'stall') {
          col = sd.stalled ? new THREE.Color(0xff7a00) : new THREE.Color(0x2a8a3a);
        } else if (viewMode === 'stress') {
          const tt = Math.min(1, sd.stress * 8);
          col = new THREE.Color().setHSL(0.55 - 0.55 * tt, 1, 0.5);
        } else if (viewMode === 'wireframe') {
          col = new THREE.Color(0x66e8ff);
        }
        colors.push(col.r, col.g, col.b);
      }
    }

    const profN = profile.length;
    for (let s = 0; s < nStations - 1; s++) {
      for (let p = 0; p < profN; p++) {
        const a = s * profN + p;
        const b = s * profN + ((p + 1) % profN);
        const c = (s + 1) * profN + p;
        const d = (s + 1) * profN + ((p + 1) % profN);
        indices.push(a, c, b, b, c, d);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return { geom, colors };
  }, [g, viewMode, windSpeed, tsr]);

  return (
    <group>
      {Array.from({ length: g.nBlades }).map((_, i) => {
        const rot = (i * (2 * Math.PI)) / g.nBlades;
        return (
          <group key={i} rotation={[0, 0, rot]}>
            <mesh geometry={geom}>
              {viewMode === 'wireframe' ? (
                <meshBasicMaterial vertexColors wireframe />
              ) : (
                <meshStandardMaterial vertexColors metalness={0.25} roughness={0.45} side={THREE.DoubleSide} />
              )}
            </mesh>
          </group>
        );
      })}
      {/* hub */}
      <mesh>
        <sphereGeometry args={[g.rootRadius * 0.9, 32, 16]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}
