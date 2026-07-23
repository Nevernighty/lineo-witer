// Cinema types — a scenario is a pure data spec that the Director plays back.
// v2: adds VFX events, camera cues, HUD/chapter cards, and stage/geometry overrides.

import type { ViewMode, RotorType } from '@/aero/buildBladeGeometry';
import type { VfxEventInput } from './VfxBus';

export interface HudMetric {
  label: string;
  value: string;
  unit?: string;
  warn?: boolean;
}

export interface HudCard {
  formula?: string;
  metrics?: HudMetric[];
}

export interface CameraCue {
  /** World-space camera position (in metres, same frame as rotor). */
  pos: [number, number, number];
  /** World-space look-at point. */
  look: [number, number, number];
  /** Lerp factor per frame (0.02..0.2). Default 0.05. */
  lerp?: number;
}

export interface CinemaKeyframe {
  /** Seconds from scenario start. Keyframes must be sorted. */
  t: number;
  windSpeed?: number;      // m/s
  tsr?: number;
  turbulence?: number;     // 0..1 added on top of site preset
  failureBoost?: number;   // 0..1 pushed into failure model
  helical?: number;        // deg — override rotor helical wrap
  rotorType?: RotorType;
  preset?: string;         // preset id
  viewMode?: ViewMode;
  camera?: CameraCue;
  vfx?: VfxEventInput[];   // one-shot burst
  hud?: HudCard;
  chapter?: { ua: string; en: string };
  message?: { ua: string; en: string };
  target?: 'blade' | 'hub' | 'wake' | 'inflow' | null;
}

export type StageId = 'none' | 'rooftop' | 'ridge' | 'wake' | 'urban_canyon' | 'rooftop_5floor' | 'ridge_spire';

export interface CinemaScenario {
  id: string;
  nameUA: string;
  nameEN: string;
  synopsisUA: string;
  synopsisEN: string;
  duration: number;
  site?: string;
  preset?: string;
  stage?: StageId;
  keyframes: CinemaKeyframe[];
  reference?: string;
}
