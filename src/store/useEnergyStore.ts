// Aggregated energy accounting for the 3D wind simulation.
// Replaces the per-collision "+0.32 Дж" popups: absorption events are summed
// continuously and committed to the UI on a slow, animated cadence.
import { useSyncExternalStore } from 'react';

export interface EnergySample {
  /** ms timestamp of the commit */
  t: number;
  /** instantaneous mechanical power over the window, W */
  power: number;
  /** cumulative absorbed energy, J */
  total: number;
}

export interface EnergyState {
  /** Committed cumulative energy, J. */
  total: number;
  /** Committed average power of the last window, W. */
  power: number;
  /** Rolling history (max 120 samples ≈ 4 min at 2 s cadence). */
  history: EnergySample[];
  /** Per-generator committed energy, J. */
  perGenerator: Record<string, number>;
  /** Commit counter — lets the HUD animate value changes. */
  tick: number;
}

const COMMIT_MS = 2000;
const MAX_HISTORY = 120;

let state: EnergyState = { total: 0, power: 0, history: [], perGenerator: {}, tick: 0 };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

// Pending (uncommitted) accumulation.
let pending = 0;
const pendingPer: Record<string, number> = {};
let lastCommit = typeof performance !== 'undefined' ? performance.now() : 0;

/** Record absorbed kinetic energy (J) from a particle hitting a rotor. */
export function reportAbsorbedEnergy(joules: number, generatorId = 'all') {
  if (!Number.isFinite(joules) || joules <= 0) return;
  pending += joules;
  pendingPer[generatorId] = (pendingPer[generatorId] ?? 0) + joules;

  const now = performance.now();
  const dt = now - lastCommit;
  if (dt < COMMIT_MS) return;
  lastCommit = now;

  const total = state.total + pending;
  const power = pending / (dt / 1000);
  const perGenerator = { ...state.perGenerator };
  for (const [k, v] of Object.entries(pendingPer)) {
    perGenerator[k] = (perGenerator[k] ?? 0) + v;
    delete pendingPer[k];
  }
  pending = 0;

  const history = [...state.history, { t: now, power, total }].slice(-MAX_HISTORY);
  state = { total, power, history, perGenerator, tick: state.tick + 1 };
  emit();
}

export function resetEnergy() {
  pending = 0;
  for (const k of Object.keys(pendingPer)) delete pendingPer[k];
  lastCommit = performance.now();
  state = { total: 0, power: 0, history: [], perGenerator: {}, tick: 0 };
  emit();
}

function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
const getSnapshot = () => state;

export function useEnergyState(): EnergyState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Human-readable energy: J → kJ → kWh. */
export function formatEnergy(j: number): string {
  if (j >= 3.6e6) return `${(j / 3.6e6).toFixed(2)} кВт·год`;
  if (j >= 1000) return `${(j / 1000).toFixed(1)} кДж`;
  return `${j.toFixed(1)} Дж`;
}

export function formatPower(w: number): string {
  if (w >= 1000) return `${(w / 1000).toFixed(2)} кВт`;
  return `${w.toFixed(1)} Вт`;
}
