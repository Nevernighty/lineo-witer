// Weibull AEP for a power curve.
// pdf: f(V) = (k/c)(V/c)^(k-1) exp(-(V/c)^k)
export function weibullPDF(V: number, k: number, c: number): number {
  if (V <= 0) return 0;
  return (k / c) * Math.pow(V / c, k - 1) * Math.exp(-Math.pow(V / c, k));
}

export function annualEnergy(curve: { V: number; P: number }[], k: number, c: number): number {
  // Trapezoidal integration weighted by Weibull.
  let aep = 0;
  const hours = 8760;
  for (let i = 1; i < curve.length; i++) {
    const dV = curve[i].V - curve[i - 1].V;
    const f1 = weibullPDF(curve[i - 1].V, k, c);
    const f2 = weibullPDF(curve[i].V, k, c);
    aep += 0.5 * (curve[i - 1].P * f1 + curve[i].P * f2) * dV;
  }
  return aep * hours; // Wh/year
}

export function capacityFactor(aepWh: number, ratedW: number): number {
  return aepWh / (ratedW * 8760);
}
