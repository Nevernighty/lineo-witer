// Simplified Blade-Element-Momentum (BEM) solver with Prandtl tip-loss.
// Educational fidelity, not certification-grade.

import { AirfoilFamily, clOf, cdOf } from './airfoils';

export interface BladeGeometry {
  airfoil: AirfoilFamily;
  rootRadius: number;
  tipRadius: number;
  chordRoot: number;
  chordTip: number;
  twistRoot: number;
  twistTip: number;
  pitch: number;
  nBlades: number;
  twistLaw: 'linear' | 'optimal' | 'schmitz';
}

export interface FlowConditions {
  V: number;
  omega: number;
  rho: number;
}

export interface BemElementResult {
  r: number; chord: number; twist: number;
  a: number; aPrime: number; alpha: number;
  cl: number; cd: number;
  dT: number; dQ: number; F: number; stalled: boolean;
}

export interface BemResult {
  elements: BemElementResult[];
  thrust: number; torque: number; power: number;
  cp: number; ct: number; tsr: number; rotorRadius: number;
  sweptArea?: number;
  rotorType?: 'hawt' | 'vawt';
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
  const rR = Math.max(0.05, r / g.tipRadius);
  const phiDeg = (2 / 3) * Math.atan(1 / (tsr * rR)) * (180 / Math.PI);
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
    const beta = localTwist(g, r, tsr) + g.pitch;

    let a = 0.1, aPrime = 0.01;
    let alpha = 0, cl = 0, cd = 0, F = 1, phi = 0;
    for (let it = 0; it < 30; it++) {
      const Vax = flow.V * (1 - a);
      const Vt = flow.omega * r * (1 + aPrime);
      phi = Math.atan2(Vax, Vt);
      alpha = phi * (180 / Math.PI) - beta;
      cl = clOf(g.airfoil, alpha);
      cd = cdOf(g.airfoil, alpha);
      const f = (g.nBlades / 2) * ((R - r) / (r * Math.max(1e-3, Math.sin(phi))));
      F = (2 / Math.PI) * Math.acos(Math.min(1, Math.exp(-f)));
      const cn = cl * Math.cos(phi) + cd * Math.sin(phi);
      const ctan = cl * Math.sin(phi) - cd * Math.cos(phi);
      const sigma = (g.nBlades * c) / (2 * Math.PI * r);
      const sinPhi2 = Math.max(1e-4, Math.sin(phi) * Math.sin(phi));
      const cosPhi = Math.cos(phi);
      const newA = 1 / (1 + (4 * F * sinPhi2) / (sigma * cn));
      const newAp = 1 / ((4 * F * Math.sin(phi) * cosPhi) / (sigma * ctan) - 1);
      const aClamped = Math.min(0.95, Math.max(-0.2, newA));
      const apClamped = Math.min(0.95, Math.max(-0.2, isFinite(newAp) ? newAp : 0));
      if (Math.abs(aClamped - a) < 1e-4 && Math.abs(apClamped - aPrime) < 1e-4) {
        a = aClamped; aPrime = apClamped; break;
      }
      a = 0.7 * a + 0.3 * aClamped;
      aPrime = 0.7 * aPrime + 0.3 * apClamped;
    }

    const Vrel2 = Math.pow(flow.V * (1 - a), 2) + Math.pow(flow.omega * r * (1 + aPrime), 2);
    const cn = cl * Math.cos(phi) + cd * Math.sin(phi);
    const ctan = cl * Math.sin(phi) - cd * Math.cos(phi);
    const dT = 0.5 * flow.rho * Vrel2 * g.nBlades * c * cn;
    const dQ = 0.5 * flow.rho * Vrel2 * g.nBlades * c * ctan * r;
    thrust += dT * dr;
    torque += dQ * dr;
    elements.push({ r, chord: c, twist: beta, a, aPrime, alpha, cl, cd, dT, dQ, F, stalled: Math.abs(alpha) > g.airfoil.alphaStall });
  }

  const power = torque * flow.omega;
  const sweptArea = Math.PI * R * R;
  const pAvail = 0.5 * flow.rho * sweptArea * Math.pow(flow.V, 3);
  const cp = Math.max(0, Math.min(0.593, power / Math.max(1, pAvail)));
  const ct = thrust / Math.max(1, 0.5 * flow.rho * sweptArea * flow.V * flow.V);
  return { elements, thrust, torque, power, cp, ct, tsr, rotorRadius: R };
}

/** Power curve P(V) sweeping a fixed TSR controller until rated, then pitch-limited flat. */
export function powerCurve(g: BladeGeometry, rho: number, ratedPower = 0, designTsr = 7): { V: number; P: number; cp: number }[] {
  const out: { V: number; P: number; cp: number }[] = [];
  for (let V = 2; V <= 25; V += 0.5) {
    const omega = (designTsr * V) / g.tipRadius;
    const r = solveBEM(g, { V, omega, rho });
    let P = r.power;
    if (ratedPower > 0 && P > ratedPower) P = ratedPower;
    out.push({ V, P, cp: r.cp });
  }
  return out;
}

/** Cp(lambda) sweep at fixed V. */
export function cpLambdaCurve(g: BladeGeometry, V = 10, rho = 1.225): { lambda: number; cp: number; ct: number }[] {
  const out: { lambda: number; cp: number; ct: number }[] = [];
  for (let lam = 1; lam <= 14; lam += 0.5) {
    const omega = (lam * V) / g.tipRadius;
    const r = solveBEM(g, { V, omega, rho }, 16);
    out.push({ lambda: lam, cp: r.cp, ct: r.ct });
  }
  return out;
}

export interface VAWTOptions {
  rotorType?: 'vawt-h' | 'vawt-helical' | 'vawt-tropo' | 'vawt-savonius';
  heightOverDiameter?: number;
}

function vawtCpModel(lambda: number, sigma: number, rotorType: VAWTOptions['rotorType'] = 'vawt-h') {
  const lam = Math.max(0.05, lambda);
  const sig = Math.max(0.03, Math.min(0.65, sigma));
  if (rotorType === 'vawt-savonius') {
    const peak = 0.18 + Math.min(0.06, sig * 0.08);
    const shape = Math.exp(-Math.pow((lam - 0.9) / 0.78, 2));
    return Math.max(0, Math.min(0.24, peak * shape - Math.max(0, lam - 2.2) * 0.035));
  }
  const lambdaOpt = rotorType === 'vawt-helical' ? 4.2 : rotorType === 'vawt-tropo' ? 5.0 : 4.7;
  const peakBase = rotorType === 'vawt-helical' ? 0.38 : rotorType === 'vawt-tropo' ? 0.34 : 0.35;
  const solidityPenalty = Math.exp(-Math.pow((sig - 0.18) / 0.22, 2));
  const lowTsrLoss = 1 - Math.exp(-lam / 1.15);
  const highTsrLoss = Math.exp(-Math.pow((lam - lambdaOpt) / 3.1, 2));
  return Math.max(0, Math.min(0.43, peakBase * (0.72 + 0.28 * solidityPenalty) * lowTsrLoss * highTsrLoss));
}

/** Educational DMS-inspired VAWT model: same output shape as BEM for UI integration. */
export function solveVAWT(g: BladeGeometry, flow: FlowConditions, options: VAWTOptions = {}, nStations = 24): BemResult {
  const R = Math.max(0.05, g.tipRadius);
  const H = R * 2 * (options.heightOverDiameter ?? (options.rotorType === 'vawt-savonius' ? 2 : 1.2));
  const tsr = (flow.omega * R) / Math.max(0.1, flow.V);
  const chord = Math.max(0.02, (g.chordRoot + g.chordTip) / 2);
  const sweptArea = Math.max(0.01, 2 * R * H);
  const sigma = (g.nBlades * chord) / Math.max(0.01, R);
  const cp = vawtCpModel(tsr, sigma, options.rotorType);
  const pAvail = 0.5 * flow.rho * sweptArea * Math.pow(flow.V, 3);
  const power = cp * pAvail;
  const torque = power / Math.max(0.05, flow.omega);
  const ct = Math.min(1.15, Math.max(0.05, cp * 1.7 + sigma * 0.18));
  const thrust = ct * 0.5 * flow.rho * sweptArea * flow.V * flow.V;
  const elements: BemElementResult[] = [];
  for (let i = 0; i < nStations; i++) {
    const az = ((i + 0.5) / nStations) * Math.PI * 2;
    const rel = Math.sqrt(flow.V * flow.V + Math.pow(flow.omega * R, 2) + 2 * flow.V * flow.omega * R * Math.sin(az));
    const alpha = Math.atan2(flow.V * Math.cos(az), Math.max(0.1, flow.omega * R + flow.V * Math.sin(az))) * 180 / Math.PI - g.pitch;
    const cl = clOf(g.airfoil, alpha);
    const cd = cdOf(g.airfoil, alpha);
    const dQ = torque / nStations;
    elements.push({
      r: R, chord, twist: g.pitch, a: 0.18, aPrime: 0, alpha, cl, cd,
      dT: thrust / nStations, dQ, F: 1, stalled: Math.abs(alpha) > g.airfoil.alphaStall || rel < flow.V * 0.35,
    });
  }
  return { elements, thrust, torque, power, cp, ct, tsr, rotorRadius: R, sweptArea, rotorType: 'vawt' };
}

export function cpLambdaCurveVAWT(g: BladeGeometry, V = 10, rho = 1.225, options: VAWTOptions = {}): { lambda: number; cp: number; ct: number }[] {
  const out: { lambda: number; cp: number; ct: number }[] = [];
  const maxLam = options.rotorType === 'vawt-savonius' ? 4 : 10;
  for (let lam = 0.5; lam <= maxLam; lam += 0.25) {
    const omega = (lam * V) / g.tipRadius;
    const r = solveVAWT(g, { V, omega, rho }, options, 18);
    out.push({ lambda: lam, cp: r.cp, ct: r.ct });
  }
  return out;
}

export function powerCurveVAWT(g: BladeGeometry, rho: number, options: VAWTOptions = {}, designTsr = 4.5): { V: number; P: number; cp: number }[] {
  const out: { V: number; P: number; cp: number }[] = [];
  for (let V = 2; V <= 25; V += 0.5) {
    const omega = (designTsr * V) / g.tipRadius;
    const r = solveVAWT(g, { V, omega, rho }, options);
    out.push({ V, P: r.power, cp: r.cp });
  }
  return out;
}
