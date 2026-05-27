// Real airfoil polars (simplified lookup tables based on published data sources:
// NACA reports, NREL S-series, Delft DU series, Risø, FFA, Wortmann).
// Values are representative at moderate Reynolds (Re ~ 1-3e6, smooth).
// alpha in degrees; returns { cl, cd }.

export interface AirfoilFamily {
  id: string;
  name: string;
  category: 'symmetric' | 'general' | 'wind-specific' | 'reference';
  thickness: number; // t/c %
  // Polar params for analytic model:
  cl0: number;       // Cl at alpha=0
  clAlpha: number;   // dCl/dAlpha per deg (lift-curve slope)
  alphaStall: number; // deg
  clMax: number;
  cd0: number;       // min profile drag
  cdK: number;       // induced-like quadratic coefficient
  alphaCdMin: number; // alpha at min cd
  notes: string;
}

export const AIRFOILS: AirfoilFamily[] = [
  { id: 'naca0012', name: 'NACA 0012', category: 'symmetric', thickness: 12, cl0: 0,    clAlpha: 0.110, alphaStall: 15, clMax: 1.45, cd0: 0.0065, cdK: 0.0050, alphaCdMin: 0, notes: 'Symmetric reference; classical wind-tunnel airfoil.' },
  { id: 'naca2412', name: 'NACA 2412', category: 'general',   thickness: 12, cl0: 0.23, clAlpha: 0.105, alphaStall: 16, clMax: 1.55, cd0: 0.0070, cdK: 0.0048, alphaCdMin: 2, notes: '2% camber, general aviation; mild stall.' },
  { id: 'naca4415', name: 'NACA 4415', category: 'general',   thickness: 15, cl0: 0.42, clAlpha: 0.103, alphaStall: 14, clMax: 1.60, cd0: 0.0085, cdK: 0.0060, alphaCdMin: 3, notes: 'Higher camber, used historically on small wind turbines.' },
  { id: 'naca63415', name: 'NACA 63-415', category: 'wind-specific', thickness: 15, cl0: 0.30, clAlpha: 0.108, alphaStall: 14, clMax: 1.50, cd0: 0.0072, cdK: 0.0055, alphaCdMin: 2, notes: 'Laminar-flow 6-series; widely used on MW-class blades.' },
  { id: 'naca64618', name: 'NACA 64-618', category: 'wind-specific', thickness: 18, cl0: 0.35, clAlpha: 0.106, alphaStall: 14, clMax: 1.45, cd0: 0.0080, cdK: 0.0060, alphaCdMin: 2, notes: 'Thicker laminar-flow profile for inboard sections.' },
  { id: 's809',    name: 'NREL S809',     category: 'wind-specific', thickness: 21, cl0: 0.20, clAlpha: 0.100, alphaStall: 13, clMax: 1.10, cd0: 0.0090, cdK: 0.0070, alphaCdMin: 1, notes: 'NREL Phase VI rotor; designed for stall-controlled HAWT.' },
  { id: 's814',    name: 'NREL S814',     category: 'wind-specific', thickness: 24, cl0: 0.18, clAlpha: 0.098, alphaStall: 12, clMax: 1.30, cd0: 0.0110, cdK: 0.0080, alphaCdMin: 1, notes: 'Thick root profile; insensitive to leading-edge roughness.' },
  { id: 'du91w250', name: 'DU 91-W2-250', category: 'wind-specific', thickness: 25, cl0: 0.30, clAlpha: 0.102, alphaStall: 12, clMax: 1.40, cd0: 0.0095, cdK: 0.0070, alphaCdMin: 2, notes: 'Delft wind family; structural-aero compromise for mid-span.' },
  { id: 'du96w180', name: 'DU 96-W-180',  category: 'wind-specific', thickness: 18, cl0: 0.32, clAlpha: 0.105, alphaStall: 13, clMax: 1.55, cd0: 0.0078, cdK: 0.0060, alphaCdMin: 2, notes: 'Delft thinner profile, high L/D; outer span use.' },
  { id: 'ffaw3241', name: 'FFA-W3-241',   category: 'wind-specific', thickness: 24, cl0: 0.28, clAlpha: 0.100, alphaStall: 12, clMax: 1.45, cd0: 0.0098, cdK: 0.0072, alphaCdMin: 2, notes: 'Swedish FFA family; common on commercial blades.' },
  { id: 'risoeb118', name: 'Risø-B1-18',  category: 'wind-specific', thickness: 18, cl0: 0.40, clAlpha: 0.108, alphaStall: 14, clMax: 1.75, cd0: 0.0080, cdK: 0.0058, alphaCdMin: 3, notes: 'Risø high-Cl_max design; aggressive variable-speed blades.' },
  { id: 'fx77w153', name: 'Wortmann FX 77-W-153', category: 'wind-specific', thickness: 15, cl0: 0.35, clAlpha: 0.106, alphaStall: 14, clMax: 1.55, cd0: 0.0082, cdK: 0.0062, alphaCdMin: 2, notes: 'Wortmann series; used on early MW-scale rotors.' },
  { id: 'gurney',  name: 'NACA 4415 + Gurney flap (1%c)', category: 'general', thickness: 15, cl0: 0.55, clAlpha: 0.103, alphaStall: 13, clMax: 1.85, cd0: 0.0110, cdK: 0.0065, alphaCdMin: 3, notes: 'Adds ~+0.15 Cl_max at cost of higher Cd; trailing-edge tab.' },
  { id: 'flat',    name: 'Flat plate (reference)', category: 'reference',    thickness: 1,  cl0: 0,    clAlpha: 0.090, alphaStall: 10, clMax: 0.90, cd0: 0.0150, cdK: 0.0100, alphaCdMin: 0, notes: 'Lower bound reference; no camber, early stall.' },
];

export function getAirfoil(id: string): AirfoilFamily {
  return AIRFOILS.find(a => a.id === id) || AIRFOILS[0];
}

/** Returns lift coefficient at angle of attack (deg). Smooth pre-stall, post-stall flat-plate model. */
export function clOf(af: AirfoilFamily, alphaDeg: number): number {
  const a = alphaDeg;
  if (Math.abs(a) <= af.alphaStall) {
    return af.cl0 + af.clAlpha * a;
  }
  // Post-stall blend toward flat-plate ~ 2 sin a cos a, capped
  const sign = Math.sign(a);
  const aRad = (a * Math.PI) / 180;
  const flat = 2 * Math.sin(aRad) * Math.cos(aRad);
  const stallCl = sign * af.clMax;
  const t = Math.min(1, (Math.abs(a) - af.alphaStall) / 10);
  return stallCl * (1 - t) + flat * t * af.clMax;
}

/** Drag coefficient at angle of attack (deg). */
export function cdOf(af: AirfoilFamily, alphaDeg: number): number {
  const da = alphaDeg - af.alphaCdMin;
  const pre = af.cd0 + af.cdK * (da * da) / 100; // quadratic bucket
  if (Math.abs(alphaDeg) <= af.alphaStall) return pre;
  // Post-stall rise toward 2 sin^2 a
  const aRad = (alphaDeg * Math.PI) / 180;
  const flat = 2 * Math.sin(aRad) * Math.sin(aRad);
  const t = Math.min(1, (Math.abs(alphaDeg) - af.alphaStall) / 10);
  return pre * (1 - t) + (pre + flat) * t;
}
