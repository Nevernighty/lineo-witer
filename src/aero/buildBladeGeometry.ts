// Shared, pure blade-mesh builder. Span runs along +Y so that cloning blades with
// rotation around +Z (the rotor spin axis / wind axis) fans them out radially.
// Chord direction = X, thickness = Z (after local twist).

import * as THREE from 'three';
import type { BladeGeometry } from './bem';
import { clOf, cdOf } from './airfoils';

export type ViewMode = 'solid' | 'wireframe' | 'pressure' | 'stall' | 'stress' | 'chord' | 'reynolds' | 'xray';

// Rotor topology — drives mesh placement and which solver/visuals are used.
//   hawt           — horizontal-axis (spin axis = Z = wind axis, blades span +Y radially)
//   vawt-h         — H-Darrieus straight vertical blades (spin axis = Y, wind = +X)
//   vawt-helical   — Gorlov / QuietRevolution helical blades
//   vawt-tropo     — Phi/eggbeater Darrieus (troposkein-shaped blades)
//   vawt-savonius  — drag-type S-rotor with two half-cylinder buckets
export type RotorType = 'hawt' | 'vawt-h' | 'vawt-helical' | 'vawt-tropo' | 'vawt-savonius' | 'vawt-archimedes';

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

// ─────────────────────────────────────────────────────────────────────────────
// VAWT geometry builders
// All VAWT meshes use:  spin axis = +Y (vertical),  wind direction = +X.
// The "tipRadius" field is reused as the rotor radius; "rootRadius" as half-height
// (we use chordRoot/chordTip for blade chord; twistRoot/twistTip become preset/pitch).
// ─────────────────────────────────────────────────────────────────────────────

function vawtColorAt(viewMode: ViewMode, tNorm: number, stalled: boolean, cp: number): THREE.Color {
  switch (viewMode) {
    case 'pressure':  return new THREE.Color().setHSL(0.66 * ((cp + 3) / 4), 1, 0.55);
    case 'stall':     return new THREE.Color(stalled ? 0xff7a00 : 0x2a8a3a);
    case 'stress':    return new THREE.Color().setHSL(Math.max(0, 0.55 - tNorm * 0.55), 1, 0.55);
    case 'chord':     return new THREE.Color().setHSL(0.55 - tNorm * 0.55, 0.95, 0.55);
    case 'reynolds':  return new THREE.Color().setHSL(0.6 - tNorm * 0.4, 0.95, 0.55);
    case 'wireframe': return new THREE.Color(0x66e8ff);
    case 'xray':      return new THREE.Color(0x39ff14);
    default:          return new THREE.Color(0xdfe7f1);
  }
}

/** One vertical airfoil blade for an H-Darrieus / helical VAWT. Returned geometry
 *  is centred at the rotor axis: chord lies tangentially (in X-Z plane) and span
 *  is along +Y. Caller rotates a single blade clone around +Y to fan them out. */
export function buildVAWTBladeGeometry(
  g: BladeGeometry,
  viewMode: ViewMode,
  type: 'vawt-h' | 'vawt-helical' | 'vawt-tropo',
  opts: { nStations?: number; helicalTwist?: number; height?: number } = {}
): BuiltBlade {
  const nStations = opts.nStations ?? 32;
  const height = opts.height ?? (g.tipRadius * 2);  // sensible default: H = D
  const helical = opts.helicalTwist ?? 0;            // total wrap (deg) over full span
  const R = g.tipRadius;
  const chord = (g.chordRoot + g.chordTip) / 2;
  const pitch = g.pitch * Math.PI / 180;             // collective pitch toe-in
  const camber = g.airfoil.cl0 > 0 ? Math.min(6, 100 * g.airfoil.cl0 / 4) : 0;
  const profile = naca4Coords(Math.max(2, g.airfoil.thickness), camber, 0.4, 22);
  const profN = profile.length;

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const stations: StationSample[] = [];

  for (let s = 0; s < nStations; s++) {
    const tN = s / (nStations - 1);
    const y = -height / 2 + tN * height;

    // Local radius: H-Darrieus + helical are constant R, troposkein follows a real
    // egg-beater curve (Jacobi-sn / catenary-of-rotation approximation).
    let rLocal = R;
    if (type === 'vawt-tropo') {
      // (sin πt)^0.62 produces the characteristic fat-middle / sharp-taper troposkein
      // silhouette, much closer to the published Φ-Darrieus shape than plain sin.
      rLocal = R * Math.max(0.04, Math.pow(Math.sin(Math.PI * tN), 0.62));
    }
    const chordHere = chord * (type === 'vawt-tropo' ? Math.max(0.45, Math.pow(Math.sin(Math.PI * tN), 0.35)) : 1);


    // Helical rotation (about Y) for Gorlov / QuietRevolution.
    const helAng = (helical * Math.PI / 180) * tN + pitch;

    // Aerodynamic colouring sample (representative; not a full DMS solve).
    const Vrel = 1; // unit ref so colours don't depend on freestream slider noise
    const stalled = false;
    const cp = -0.5;

    const col = vawtColorAt(viewMode, tN, stalled, cp);
    stations.push({ r: rLocal, chord: chordHere, twistDeg: helAng * 180 / Math.PI, alpha: 0, cl: 0, cd: 0, cp, reynolds: 0, stress: 0, stalled });

    // Section is placed at (+rLocal, y, 0), chord runs tangentially along local Z (rotated by helAng).
    // Build ring of profN vertices in world space directly so caps stay closed.
    const cosA = Math.cos(helAng), sinA = Math.sin(helAng);
    for (let p = 0; p < profN; p++) {
      const [px, py] = profile[p];
      // local chord (tangential) and thickness (radial)
      const xLocal = (px - 0.25) * chordHere;     // chord direction in local frame
      const yLocal = py * chordHere;              // thickness in local frame
      // rotate around vertical by helAng so chord vector follows helix
      const tangential = xLocal * cosA - yLocal * sinA;
      const radialIn   = xLocal * sinA + yLocal * cosA;
      const X = rLocal + radialIn;
      const Z = tangential;
      positions.push(X, y, Z);
      colors.push(col.r, col.g, col.b);
    }
  }

  // Side panels
  for (let s = 0; s < nStations - 1; s++) {
    for (let p = 0; p < profN; p++) {
      const a = s * profN + p;
      const b = s * profN + ((p + 1) % profN);
      const c = (s + 1) * profN + p;
      const d = (s + 1) * profN + ((p + 1) % profN);
      indices.push(a, c, b, b, c, d);
    }
  }
  // Caps top & bottom
  const addCap = (sIdx: number, flip: boolean) => {
    const base = sIdx * profN;
    let cx = 0, cy = 0, cz = 0;
    for (let p = 0; p < profN; p++) {
      cx += positions[(base + p) * 3];
      cy += positions[(base + p) * 3 + 1];
      cz += positions[(base + p) * 3 + 2];
    }
    cx /= profN; cy /= profN; cz /= profN;
    const centerIdx = positions.length / 3;
    positions.push(cx, cy, cz);
    const cs = colors.slice(base * 3, (base + 1) * 3);
    colors.push(cs[0] ?? 1, cs[1] ?? 1, cs[2] ?? 1);
    for (let p = 0; p < profN; p++) {
      const a = base + p;
      const b = base + ((p + 1) % profN);
      if (flip) indices.push(centerIdx, b, a); else indices.push(centerIdx, a, b);
    }
  };
  addCap(0, true);
  addCap(nStations - 1, false);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  const volume = 0.685 * (g.airfoil.thickness / 100) * chord * chord * height * 0.35;
  return { geometry: geom, stations, volume, helicalTwistDeg: helical };
}

/**
 * Savonius S-rotor — TWO half-cylinder buckets returned in a single mesh.
 * Includes shell thickness (outer + inner faces) and follows the overlap-ratio
 * convention from the reference (default 0.15 ≈ peak Cp band).
 * Optional helical twist along Y produces the Savonius-Gorlov hybrid.
 *
 * Geometry: each bucket is a half-cylinder of radius R·0.5 with its straight edge
 * offset from the central axis by `overlap·R·0.5`. The two buckets are mirrored
 * across the axis so their concave faces oppose each other — that's the S-shape.
 */
export function buildSavoniusBucketGeometry(
  g: BladeGeometry, viewMode: ViewMode, opts: {
    height?: number; segments?: number; overlap?: number; helicalDeg?: number;
  } = {}
): BuiltBlade {
  const height = opts.height ?? g.tipRadius * 2.2;
  const segments = opts.segments ?? 30;
  const ringCount = 18;
  const overlap = Math.max(0, Math.min(0.30, opts.overlap ?? 0.15));
  const helicalDeg = opts.helicalDeg ?? 0;
  const R = g.tipRadius;
  const rb = R * 0.5;                       // bucket radius
  const offset = rb * (1 - overlap);        // distance from axis to bucket centre
  const shellT = Math.max(0.04, R * 0.03);  // visible shell thickness
  const col = vawtColorAt(viewMode, 0.5, false, -0.4);

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  // Build one bucket as outer + inner rings, then mirror across axis.
  const buildBucket = (sign: 1 | -1) => {
    const startIdx = positions.length / 3;
    // outer ring + inner ring per height level
    for (let yi = 0; yi <= ringCount; yi++) {
      const tN = yi / ringCount;
      const y = -height / 2 + tN * height;
      // Helical twist: rotate this ring's angular range about Y.
      const twist = (helicalDeg * Math.PI / 180) * (tN - 0.5);
      for (let i = 0; i <= segments; i++) {
        const ang = -Math.PI / 2 + (i / segments) * Math.PI; // half circle
        // outer
        const xo = sign * offset + Math.cos(ang) * rb;
        const zo = Math.sin(ang) * rb;
        const cx = xo * Math.cos(twist) - zo * Math.sin(twist);
        const cz = xo * Math.sin(twist) + zo * Math.cos(twist);
        positions.push(cx, y, cz);
        colors.push(col.r, col.g, col.b);
        // inner (shrunk towards bucket centre)
        const inset = rb - shellT;
        const xi = sign * offset + Math.cos(ang) * inset;
        const zi = Math.sin(ang) * inset;
        const cxi = xi * Math.cos(twist) - zi * Math.sin(twist);
        const czi = xi * Math.sin(twist) + zi * Math.cos(twist);
        positions.push(cxi, y, czi);
        colors.push(col.r * 0.78, col.g * 0.78, col.b * 0.78);
      }
    }
    const rowLen = (segments + 1) * 2; // 2 = outer+inner
    for (let yi = 0; yi < ringCount; yi++) {
      for (let i = 0; i < segments; i++) {
        const a = startIdx + yi * rowLen + i * 2;
        const a2 = a + 1;
        const b = a + 2;
        const b2 = a + 3;
        const c = startIdx + (yi + 1) * rowLen + i * 2;
        const c2 = c + 1;
        const d = c + 2;
        const d2 = c + 3;
        // outer face
        if (sign > 0) { indices.push(a, c, b, b, c, d); }
        else          { indices.push(a, b, c, b, d, c); }
        // inner face (flipped winding)
        if (sign > 0) { indices.push(a2, b2, c2, b2, d2, c2); }
        else          { indices.push(a2, c2, b2, b2, c2, d2); }
        // rim caps along the straight edges (i=0 and i=segments) — close shell
        if (i === 0) {
          indices.push(a, a2, c, c, a2, c2);
        }
        if (i === segments - 1) {
          indices.push(b, c2 + 0, a2 + 2 /* =b2 */, b, d2, c2 + 0);
        }
      }
    }
  };
  buildBucket(1);
  buildBucket(-1);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  const volume = 2 * Math.PI * rb * shellT * height * 0.5; // two half-cylinder shells
  return { geometry: geom, stations: [], volume, helicalTwistDeg: helicalDeg };
}


/**
 * Archimedes-spiral rotor blade: a helical ribbon wrapped around the vertical axis
 * with the inner edge close to the shaft and outer edge at radius R. Real Archimedes
 * urban turbines (e.g. Liam F1) use 2–3 such ribbons stacked at 120°.
 */
export function buildArchimedesBladeGeometry(
  g: BladeGeometry,
  viewMode: ViewMode,
  opts: { nStations?: number; height?: number; turns?: number; innerRatio?: number } = {}
): BuiltBlade {
  const nStations = opts.nStations ?? 64;
  const height = opts.height ?? g.tipRadius * 2 * 1.8;
  const turns = opts.turns ?? 1.0;
  const innerR = (opts.innerRatio ?? 0.18) * g.tipRadius;
  const R = g.tipRadius;
  const thickness = Math.max(0.005, R * 0.04);

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  // Build a quad strip: inner edge near shaft, outer edge at R, spiraling height.
  for (let s = 0; s <= nStations; s++) {
    const tN = s / nStations;
    const y = -height / 2 + tN * height;
    const ang = tN * turns * Math.PI * 2;
    const col = vawtColorAt(viewMode, tN, false, -0.4);
    for (let edge = 0; edge < 2; edge++) {
      // inner edge along shaft (slightly raised), outer at R
      const rr = edge === 0 ? innerR : R;
      const x = Math.cos(ang) * rr;
      const z = Math.sin(ang) * rr;
      positions.push(x, y, z);
      colors.push(col.r, col.g, col.b);
      // thickness shell — extrude the same edge slightly outward radially
      const nx = Math.cos(ang) * thickness * 0.5;
      const nz = Math.sin(ang) * thickness * 0.5;
      positions.push(x + nx, y + thickness * 0.5, z + nz);
      colors.push(col.r * 0.85, col.g * 0.85, col.b * 0.85);
    }
  }

  const rowLen = 4; // [innerTop, innerBot, outerTop, outerBot]
  for (let s = 0; s < nStations; s++) {
    const a = s * rowLen;
    const b = (s + 1) * rowLen;
    // top face (inner-outer along chord direction)
    indices.push(a + 0, b + 0, a + 2, a + 2, b + 0, b + 2);
    // bottom face
    indices.push(a + 1, a + 3, b + 1, b + 1, a + 3, b + 3);
    // outer edge
    indices.push(a + 2, b + 2, a + 3, a + 3, b + 2, b + 3);
    // inner edge
    indices.push(a + 0, a + 1, b + 0, b + 0, a + 1, b + 1);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  const volume = (Math.PI * R * R - Math.PI * innerR * innerR) * thickness * turns;
  return { geometry: geom, stations: [], volume, helicalTwistDeg: turns * 360 };
}
