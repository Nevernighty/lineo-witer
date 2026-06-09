// Per-family calibration defaults — applied automatically when the rotor family changes.

import type { RotorType } from './buildBladeGeometry';
import type { BladeGeometry } from './bem';

export interface CalibrationProfile {
  /** Visible bending starts at this fraction of material max tip-speed (0..1). */
  bendThresholdPct: number;
  /** Blades fracture at this fraction (1.0 = nominal, can exceed 1). */
  fractureThresholdPct: number;
  /** Reaction speed (lerp 1/s) for bending response. */
  reactionSpeed: number;
  /** Recovery speed (lerp 1/s) for blades coming back. */
  recoverySpeed: number;
  /** Multiplier for flex amplitude (visual). */
  flexGain: number;
  /** Damping factor 0..1 — lower means more vibration. */
  vibrationDamping: number;
}

export const HAWT_DEFAULT: CalibrationProfile = {
  bendThresholdPct: 0.70, fractureThresholdPct: 1.10,
  reactionSpeed: 1.8, recoverySpeed: 2.4, flexGain: 1.0, vibrationDamping: 0.55,
};
export const DARRIEUS_DEFAULT: CalibrationProfile = {
  bendThresholdPct: 0.55, fractureThresholdPct: 0.95,
  reactionSpeed: 1.3, recoverySpeed: 2.0, flexGain: 1.4, vibrationDamping: 0.35,
};
export const SAVONIUS_DEFAULT: CalibrationProfile = {
  bendThresholdPct: 0.85, fractureThresholdPct: 1.35,
  reactionSpeed: 0.9, recoverySpeed: 1.8, flexGain: 0.5, vibrationDamping: 0.75,
};
export const ARCHIMEDES_DEFAULT: CalibrationProfile = {
  bendThresholdPct: 0.80, fractureThresholdPct: 1.25,
  reactionSpeed: 1.1, recoverySpeed: 2.0, flexGain: 0.7, vibrationDamping: 0.65,
};

export function calibrationFor(type: RotorType): CalibrationProfile {
  if (type === 'vawt-savonius') return SAVONIUS_DEFAULT;
  if (type === 'vawt-archimedes') return ARCHIMEDES_DEFAULT;
  if (type === 'hawt') return HAWT_DEFAULT;
  return DARRIEUS_DEFAULT;
}

/** Per-family geometry validation. Returns human-readable warnings. */
export function validateGeometry(type: RotorType, g: BladeGeometry, lang: 'ua' | 'en' = 'ua'): string[] {
  const warn: string[] = [];
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  if (type === 'hawt') {
    if (g.nBlades < 2 || g.nBlades > 5) warn.push(L('HAWT: 2–5 лопатей оптимально', 'HAWT: 2–5 blades optimal'));
    if (g.chordTip > g.chordRoot) warn.push(L('Хорда тіпа повинна бути меншою за кореня', 'Tip chord should be smaller than root'));
    if (g.tipRadius / Math.max(0.01, g.rootRadius) < 3) warn.push(L('Малий розмах — перевір root/tip радіус', 'Low aspect — check root/tip radii'));
  } else if (type === 'vawt-savonius') {
    if (g.nBlades !== 2 && g.nBlades !== 3) warn.push(L('Savonius: 2 або 3 ковша', 'Savonius: 2 or 3 buckets'));
  } else if (type === 'vawt-archimedes') {
    if (g.tipRadius < 0.3) warn.push(L('Archimedes: занадто малий радіус', 'Archimedes: radius too small'));
  } else {
    // Darrieus family
    if (g.nBlades < 2 || g.nBlades > 4) warn.push(L('Darrieus: 2–4 лопаті', 'Darrieus: 2–4 blades'));
    if (Math.abs(g.pitch) > 8) warn.push(L('Великий toe-in погіршує самозапуск', 'Large toe-in hurts self-start'));
  }
  return warn;
}
