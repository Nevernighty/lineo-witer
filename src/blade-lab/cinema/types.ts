// Cinema types — a scenario is a pure data spec that the Director plays back.
// v2: adds VFX events, camera cues, HUD/chapter cards, and stage/geometry overrides.

import type { ViewMode, RotorType } from '@/aero/buildBladeGeometry';
import type { VfxEventInput } from './VfxBus';
import type { Composition } from './useComposition';

export interface HudMetric {
  label: string;
  value: string;
  unit?: string;
  warn?: boolean;
}

export interface HudCard {
  formula?: string;
  metrics?: HudMetric[];
  legend?: Array<{ labelUA: string; labelEN: string; color: string }>;
}

export interface CameraCue {
  /** Cue-space position. The viewer scales cue-space to the live rotor envelope. */
  pos: [number, number, number];
  /** World-space look-at point. */
  look: [number, number, number];
  /** Lerp factor per frame (0.02..0.2). Default 0.05. */
  lerp?: number;
}

/**
 * A guided highlight mark. Positions are authored in cue-space (units of ~1/3
 * of the rotor envelope) so a mark keeps its meaning on any rotor size.
 */
export type HighlightMark =
  /** Animated flow streak — shows where the air goes and how fast. */
  | { kind: 'flow'; pos: [number, number, number]; dir: [number, number, number]; color?: string; speed?: number; label?: string }
  /** Translucent influence zone (load, stall, wake, separation). Rim-lit, never opaque. */
  | { kind: 'zone'; pos: [number, number, number]; radius: number; height?: number; color?: string; label?: string }
  /** Control point with a leader line and a small billboarded caption. */
  | { kind: 'point'; pos: [number, number, number]; color?: string; label: string; sub?: string }
  /** Measurement span between two points with a numeric caption. */
  | { kind: 'span'; from: [number, number, number]; to: [number, number, number]; color?: string; label?: string };

/**
 * A guided step: a titled explanation that stays on screen for a window of the
 * timeline together with its 3D marks. Steps are what the user actually steps
 * through; keyframes remain the low-level simulation track.
 */
export interface CinemaStep {
  id: string;
  /** Start time in seconds. */
  at: number;
  titleUA: string;
  titleEN: string;
  bodyUA: string;
  bodyEN: string;
  /** 3D marks shown while the step is active. */
  marks?: HighlightMark[];
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
  /** Authored camera composition defaults (user overrides are persisted on top). */
  composition?: Partial<Composition>;
  keyframes: CinemaKeyframe[];
  /** Guided explanation steps with their 3D highlights. */
  steps?: CinemaStep[];
  /** Rotor mount in rotor-radius units. Camera, highlights and VFX share it. */
  anchor?: [number, number, number];
  /** Radius, in rotor radii, of stage geometry that must remain in the shot. */
  stageRadiusR?: number;
  reference?: string;
}
