// Shared, pure blade-mesh builder. Span runs along +Y so that cloning blades with
// rotation around +Z (the rotor spin axis / wind axis) fans them out radially.
// Chord direction = X, thickness = Z (after local twist).

import * as THREE from 'three';
import type { BladeGeometry } from './bem';
import { clOf, cdOf } from './airfoils';

export type ViewMode = 'solid' | 'wireframe' | 'pressure' | 'stall' | 'stress' | 'chord' | 'reynolds' | 'xray';

export interface StationSample {
  r: number; chord: number; twistDeg: number;
  alpha: number; cl: number; cd: number; cp: number;
  reynolds: number; stress: number; stalled: boolean;
}

/** NACA-4 profile coordinates ordered around the section (upper LE→TE then lower TE→LE). */
function naca4Coords(thicknessPct: number, camberPct = 0, camberPos = 0.4, nHalf = 28): Array<[number, number]> {
  const t = thicknessPct / 100;
  const m = camberPct / 100;
  const p = camberPos;
  const upper: Array<[number, number]> = [];
  const lower: Array<[number, number]> = [];
  for (let i = 0; i <= nHalf; i++) {
    const x = 0.5 * (1 - Math.cos((Math.PI * i) / nHalf));
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1015 * x * x * x * x);
    let yc = 0, dyc = 0;
    if (m > 0) {
      if (x < p) { yc = (m / (p * p)) * (2 * p * x - x * x); dyc = (2 * m / (p * p)) * (p - x); }
      else { yc = (m / ((1 - p) * (1 - p))) * ((1 - 2 * p) + 2 * p * x - x * x); dyc = (2 * m / ((1 - p) * (1 - p))) * (p - x); }
    }
    const th = Math.atan(dyc);
    upper.push([x - yt * Math.sin(th), yc + yt * Math.cos(th)]);
    lower.push([x + yt * Math.sin(th), yc - yt * Math.cos(th)]);
  }
  const pts: Array<[number, number]> = [];
  for (let i = upper.length - 1; i >= 0; i--) pts.push(upper[i]);
  for (let i = 1; i < lower.length - 1; i++) pts.push(lower[i]);
  return pts;
}

function localChord(g: BladeGeometry, t: number): number {
  return g.chordRoot + (g.chordTip - g.chordRoot) * t;
}
function localTwist(g: BladeGeometry, t: number, r: number, tsr: number): number {
  if (g.twistLaw === 'linear') return g.twistRoot + (g.twistTip - g.twistRoot) * t;
  const rR = Math.max(0.05, r / g.tipRadius);
  const phiDeg = (2 / 3) * Math.atan(1 / Math.max(0.1, tsr * rR)) * (180 / Math.PI);
  if (g.twistLaw === 'schmitz') return phiDeg - 4;
  return phiDeg - 6;
}

export interface BuiltBlade {
  geometry: THREE.BufferGeometry;
  stations: StationSample[];
  volume: number;
  helicalTwistDeg: number; // for VAWT helical visualisation
}

/**
 * Build a single blade mesh. Returns a non-indexed BufferGeometry with vertex colors
 * coloured by the requested viewMode, plus per-station physical data.
 */
export function buildBladeGeometry(
  g: BladeGeometry,
  viewMode: ViewMode,
  windSpeed: number,
  tsr: number,
  opts: { nStations?: number; helicalTwist?: number; vawt?: boolean; rho?: number; nu?: number } = {}
): BuiltBlade {
  const nStations = opts.nStations ?? 26;
  const helical = opts.helicalTwist ?? 0;
  const vawt = !!opts.vawt;
  const rho = opts.rho ?? 1.225;
  const nu = opts.nu ?? 1.5e-5;

  const camber = g.airfoil.cl0 > 0 ? Math.min(6, 100 * g.airfoil.cl0 / 4) : 0;
  const profile = naca4Coords(Math.max(2, g.airfoil.thickness), camber, 0.4, 26);
  const profN = profile.length;

  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const stations: StationSample[] = [];

  // ---- 1) collect station data
  for (let s = 0; s < nStations; s++) {
    const t = s / (nStations - 1);
    const r = vawt ? g.tipRadius : g.rootRadius + t * (g.tipRadius - g.rootRadius);
    const chord = localChord(g, t);
    const tw = localTwist(g, t, r, tsr);
    const helicalAdd = helical * t;

    // Aerodynamic state at this station (rough, for colouring only)
    const Vax = windSpeed;
    const Vt = Math.max(0.1, (tsr * windSpeed) * (r / g.tipRadius));
    const phi = Math.atan2(Vax, Vt);
    const alpha = phi * (180 / Math.PI) - (tw + g.pitch);
    const cl = clOf(g.airfoil, alpha);
    const cd = cdOf(g.airfoil, alpha);
    const Vrel = Math.sqrt(Vax * Vax + Vt * Vt);
    const reynolds = (Vrel * chord) / nu;
    const cp = Math.max(-3, Math.min(1.2, 1 - cl));
    const stress = (1 - t) * Math.max(0, cl) * Vrel * Vrel * 0.5 * rho * chord * 1e-6; // MPa proxy
    stations.push({ r, chord, twistDeg: tw + g.pitch + helicalAdd, alpha, cl, cd, cp, reynolds, stress, stalled: Math.abs(alpha) > g.airfoil.alphaStall });
  }

  // ---- 2) per-station ring colour
  const colorAt = (sd: StationSample, sNorm: number): THREE.Color => {
    switch (viewMode) {
      case 'pressure':  return new THREE.Color().setHSL(0.66 * ((sd.cp + 3) / 4), 1, 0.55);
      case 'stall':     return new THREE.Color(sd.stalled ? 0xff7a00 : 0x2a8a3a);
      case 'stress':    return new THREE.Color().setHSL(Math.max(0, 0.55 - Math.min(1, sd.stress / 8) * 0.55), 1, 0.55);
      case 'chord':     return new THREE.Color().setHSL(0.55 - sNorm * 0.55, 0.95, 0.55);
      case 'reynolds':  return new THREE.Color().setHSL(0.6 - Math.min(1, Math.log10(Math.max(1, sd.reynolds)) / 8) * 0.6, 0.95, 0.55);
      case 'wireframe': return new THREE.Color(0x66e8ff);
      case 'xray':      return new THREE.Color(0x39ff14);
      default:          return new THREE.Color(0xdfe7f1);
    }
  };

  // ---- 3) vertex grid (span along +Y, chord = X, thickness = Z, then twist about Y)
  for (let s = 0; s < nStations; s++) {
    const sd = stations[s];
    const sNorm = s / (nStations - 1);
    const col = colorAt(sd, sNorm);
    const twRad = sd.twistDeg * Math.PI / 180;
    const cos = Math.cos(twRad), sin = Math.sin(twRad);
    for (let p = 0; p < profN; p++) {
      const [px, py] = profile[p];
      // place quarter-chord at origin so blade rotates around its 1/4-chord
      const xC = (px - 0.25) * sd.chord;
      const zC = py * sd.chord;
      // twist around Y (span axis)
      const x = xC * cos + zC * sin;
      const z = -xC * sin + zC * cos;
      positions.push(x, sd.r, z);
      normals.push(0, 0, 0); // recomputed later
      colors.push(col.r, col.g, col.b);
    }
  }

  // ---- 4) caps (root + tip) using triangle fans around the section centroid
  const addCap = (sIdx: number, flip: boolean) => {
    const base = sIdx * profN;
    // centroid
    let cx = 0, cy = 0, cz = 0;
    for (let p = 0; p < profN; p++) {
      cx += positions[(base + p) * 3];
      cy += positions[(base + p) * 3 + 1];
      cz += positions[(base + p) * 3 + 2];
    }
    cx /= profN; cy /= profN; cz /= profN;
    const centerIdx = positions.length / 3;
    positions.push(cx, cy, cz);
    normals.push(0, 0, 0);
    const col = colors.slice(base * 3, (base + 1) * 3);
    colors.push(col[0] ?? 1, col[1] ?? 1, col[2] ?? 1);
    for (let p = 0; p < profN; p++) {
      const a = base + p;
      const b = base + ((p + 1) % profN);
      if (flip) indices.push(centerIdx, b, a); else indices.push(centerIdx, a, b);
    }
  };
  addCap(0, true);
  addCap(nStations - 1, false);

  // ---- 5) side panels
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

  // crude volume estimate = average area × span (NACA area ≈ 0.685 * t * c)
  const span = g.tipRadius - g.rootRadius;
  const avgChord = (g.chordRoot + g.chordTip) / 2;
  const volume = 0.685 * (g.airfoil.thickness / 100) * avgChord * avgChord * span * 0.35; // hollow shell factor

  return { geometry: geom, stations, volume, helicalTwistDeg: helical };
}
