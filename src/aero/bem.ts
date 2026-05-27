// Simplified Blade-Element-Momentum (BEM) solver with Prandtl tip-loss.
// Educational fidelity, not certification-grade.

import { AirfoilFamily, clOf, cdOf } from './airfoils';

export interface BladeGeometry {
  airfoil: AirfoilFamily;
  rootRadius: number;   // m (hub start)
  tipRadius: number;    // m
  chordRoot: number;    // m
  chordTip: number;     // m
  twistRoot: number;    // deg (geometric, positive nose-up)
  twistTip: number;     // deg
  pitch: number;        // deg collective offset
  nBlades: number;
  twistLaw: 'linear' | 'optimal' | 'schmitz';
}

export interface FlowConditions {
  V: number;      // freestream m/s
  omega: number;  // rad/s rotor speed
  rho: number;    // kg/m^3
}

export interface BemElementResult {
  r: number;
  chord: number;
  twist: number; // total local pitch (deg)
  a: number;     // axial induction
  aPrime: number; // tangential induction
  alpha: number; // local AoA deg
  cl: number; cd: number;
  dT: number;    // thrust per unit span (N/m)
  dQ: number;    // torque per unit span (N·m/m)
  F: number;     // tip-loss factor
  stalled: boolean;
}

export interface BemResult {
  elements: BemElementResult[];
  thrust: number;       // N
  torque: number;       // N·m
  power: number;        // W
  cp: number;
  ct: number;
  tsr: number;
  rotorRadius: number;
}

function localChord(g: BladeGeometry, r: number): number {
  const t = (r - g.rootRadius) / (g.tipRadius - g.rootRadius);
  return g.chordRoot + (g.chordTip - g.chordRoot) * Math.max(0, Math.min(1, t));
}

function localTwist(g: BladeGeometry, r: number, tsr: number): number {
  const t = (r - g.rootRadius) / (g.tipRadius - g.rootRadius);
  if (g.twistLaw === 'linear') {
    return g.twistRoot + (g.twistTip - g.twistRoot) * t;
  }
  // Optimal (Betz) / Schmitz: phi_opt = (2/3) atan(1 / (tsr * r/R))
  const rR = Math.max(0.05, r / g.tipRadius);
  let phiDeg;
  if (g.twistLaw === 'schmitz') {
    phiDeg = (2 / 3) * Math.atan(1 / (tsr * rR)) * (180 / Math.PI);
  } else {
    phiDeg = (2 / 3) * Math.atan(1 / (tsr * rR)) * (180 / Math.PI);
  }
  // Subtract design AoA (~6 deg) to get geometric twist
  return phiDeg - 6;
}

export function solveBEM(g: BladeGeometry, flow: FlowConditions, nStations = 20): BemResult {
  const R = g.tipRadius;
  const tsr = (flow.omega * R) / Math.max(0.1, flow.V);
  const elements: BemElementResult[] = [];
  let thrust = 0, torque = 0;

  for (let i = 0; i < nStations; i++) {
    const r = g.rootRadius + ((i + 0.5) / nStations) * (R - g.rootRadius);
    const dr = (R - g.rootRadius) / nStations;
    const c = localChord(g, r);
    const beta = localTwist(g, r, tsr) + g.pitch; // total geometric pitch

    // Iterate induction factors
    let a = 0.1, aPrime = 0.01;
    let alpha = 0, cl = 0, cd = 0, F = 1, phi = 0;
    for (let it = 0; it < 30; it++) {
      const Vax = flow.V * (1 - a);
      const Vt = flow.omega * r * (1 + aPrime);
      phi = Math.atan2(Vax, Vt); // rad
      alpha = phi * (180 / Math.PI) - beta;
      cl = clOf(g.airfoil, alpha);
      cd = cdOf(g.airfoil, alpha);
      // Prandtl tip-loss
      const f = (g.nBlades / 2) * ((R - r) / (r * Math.max(1e-3, Math.sin(phi))));
      F = (2 / Math.PI) * Math.acos(Math.min(1, Math.exp(-f)));
      const cn = cl * Math.cos(phi) + cd * Math.sin(phi);
      const ct = cl * Math.sin(phi) - cd * Math.cos(phi);
      const sigma = (g.nBlades * c) / (2 * Math.PI * r);
      const sinPhi2 = Math.max(1e-4, Math.sin(phi) * Math.sin(phi));
      const cosPhi = Math.cos(phi);
      const newA = 1 / (1 + (4 * F * sinPhi2) / (sigma * cn));
      const newAp = 1 / ((4 * F * Math.sin(phi) * cosPhi) / (sigma * ct) - 1);
      // Glauert correction for high a
      const aClamped = Math.min(0.95, Math.max(-0.2, newA));
      const apClamped = Math.min(0.95, Math.max(-0.2, isFinite(newAp) ? newAp : 0));
      if (Math.abs(aClamped - a) < 1e-4 && Math