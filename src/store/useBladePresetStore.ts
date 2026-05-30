// Cross-page store: blade preset chosen in /blade-lab can be applied in the main 3D simulation.
import { useSyncExternalStore } from 'react';
import type { BladeGeometry } from '@/aero/bem';
import type { RotorType } from '@/aero/buildBladeGeometry';

export interface ActiveBladePreset {
  id: string;
  nameUA: string;
  nameEN: string;
  geometry: BladeGeometry;
  materialId: string;
  rotorType: RotorType;
  heightOverDiameter?: number;
  helicalTwistDeg?: number;
}

const KEY = 'lineo.bladePreset.v1';

function load(): ActiveBladePreset | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveBladePreset;
  } catch { return null; }
}

let state: ActiveBladePreset | null = load();
const listeners = new Set<() => void>();

export function setActiveBladePreset(p: ActiveBladePreset | null) {
  state = p;
  try { p ? localStorage.setItem(KEY, JSON.stringify(p)) : localStorage.removeItem(KEY); } catch {}
  listeners.forEach(l => l());
}
export function getActiveBladePreset() { return state; }
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
function getSnapshot() { return state; }

export function useActiveBladePreset(): ActiveBladePreset | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
