// Cinema types — a scenario is a pure data spec that the Director plays back.
// No hidden state: everything the user sees is reproducible from this object.

export interface CinemaKeyframe {
  /** Seconds from scenario start. Keyframes must be sorted. */
  t: number;
  windSpeed?: number;      // m/s, sets rotor freestream
  tsr?: number;            // tip-speed ratio
  turbulence?: number;     // 0..1 extra jitter added on top of site preset
  failureBoost?: number;   // 0..1 extra load pushed into the failure model
  message?: { ua: string; en: string };
  /** Which visual element to spotlight in the narrator ("blade0"|"hub"|"wake"|null). */
  target?: 'blade' | 'hub' | 'wake' | 'inflow' | null;
}

export interface CinemaScenario {
  id: string;
  nameUA: string;
  nameEN: string;
  synopsisUA: string;
  synopsisEN: string;
  /** Total duration in seconds. */
  duration: number;
  /** Suggested site preset id, if any (matches SITE_SCENARIOS ids). */
  site?: string;
  /** Suggested rotor preset id, if any. */
  preset?: string;
  keyframes: CinemaKeyframe[];
  /** Reference URL / textbook for the physics being taught. */
  reference?: string;
}
