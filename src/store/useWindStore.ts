// Centralized simulation store using useSyncExternalStore — zero dependencies
import { useSyncExternalStore, useCallback, useRef } from 'react';
import type { SimulationParams } from '@/simulation/types';

// ── State shape ──────────────────────────────────────────────

export interface WindStoreState {
  // Simulation parameters
  simulation: SimulationParams;

  // Particle visuals
  particles: {
    count: number;
    impact: number;
    trailLength: number;
    glow: number;
    pulsation: number;
    preset: string;
    wobbliness: number;
  };

  // Analysis layers (9 toggles)
  visual: {
    showHeightRuler: boolean;
    showWindProfile: boolean;
    showPressureMap: boolean;
    showEnergyDensity: boolean;
    showTurbulenceField: boolean;
    showWindShear: boolean;
    showWakeMap: boolean;
    showCapacityFactor: boolean;
    showBetzOverlay: boolean;
    showHotspots: boolean;
    showWakeZones: boolean;
    showLocalHits: boolean;
    showAnalysisPanel: boolean;
  };

  // UI interaction
  ui: {
    interactionMode: 'place' | 'select';
    selectedObstacleIndex: number | null;
    showScenarios: boolean;
    activeScenario: string | null;
    showHint: boolean;
    ghostRotation: number;
    ghostScale: number;
    selectedObstacleType: string;
    selectedGeneratorSubtype: string;
  };

  // Quality
  qualityPreset: string;
}

// ── Default state ────────────────────────────────────────────

const DEFAULT_STATE: WindStoreState = {
  simulation: {
    windSpeed: 8,
    windAngle: 0,
    windElevation: 0,
    turbulenceIntensity: 0.3,
    turbulenceScale: 1.0,
    gustFrequency: 6,
    gustIntensity: 0.2,
    airDensity: 1.225,
    temperature: 15,
    humidity: 50,
    altitude: 0,
    surfaceRoughness: 0.3,
    referenceHeight: 10,
    terrainSlopeX: 0,
    terrainSlopeZ: 0,
  },
  particles: {
    count: 250,
    impact: 1.0,
    trailLength: 3.0,
    glow: 1.0,
    pulsation: 0,
    preset: 'standard',
    wobbliness: 1.0,
  },
  visual: {
    showHeightRuler: false,
    showWindProfile: false,
    showPressureMap: false,
    showEnergyDensity: false,
    showTurbulenceField: false,
    showWindShear: false,
    showWakeMap: false,
    showCapacityFactor: false,
    showBetzOverlay: false,
    showHotspots: false,
    showWakeZones: false,
    showLocalHits: true,
    showAnalysisPanel: false,
  },
  ui: {
    interactionMode: 'place',
    selectedObstacleIndex: null,
    showScenarios: false,
    activeScenario: null,
    showHint: false,
    ghostRotation: 0,
    ghostScale: 1,
    selectedObstacleType: 'building',
    selectedGeneratorSubtype: 'hawt3',
  },
  qualityPreset: 'medium',
};

// ── Store implementation ─────────────────────────────────────

type Listener = () => void;

let state: WindStoreState = { ...DEFAULT_STATE };
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach(l => l());
}

function getSnapshot() {
  return state;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ── Public API ───────────────────────────────────────────────

export function setWindState<K extends keyof WindStoreState>(
  group: K,
  updater: Partial<WindStoreState[K]> | ((prev: WindStoreState[K]) => Partial<WindStoreState[K]>)
) {
  const prev = state[group];
  const patch = typeof updater === 'function' ? updater(prev) : updater;
  state = { ...state, [group]: { ...prev, ...patch } };
  emitChange();
}

export function setQualityPreset(preset: string) {
  state = { ...state, qualityPreset: preset };
  emitChange();
}

export function getWindState(): WindStoreState {
  return state;
}

export function resetWindState() {
  state = { ...DEFAULT_STATE };
  emitChange();
}

// ── React hook: subscribe to a slice ─────────────────────────

export function useWindStore(): WindStoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Subscribe to a specific slice for minimal re-renders.
 * Usage: const sim = useWindSlice(s => s.simulation);
 */
export function useWindSlice<T>(selector: (s: WindStoreState) => T): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const cachedRef = useRef<T>(selector(state));

  const getSliceSnapshot = useCallback(() => {
    const next = selectorRef.current(state);
    // Shallow equality for objects
    if (typeof next === 'object' && next !== null && typeof cachedRef.current === 'object' && cachedRef.current !== null) {
      const keys = Object.keys(next as object);
      const prev = cachedRef.current as Record<string, unknown>;
      const curr = next as Record<string, unknown>;
      let same = keys.length === Object.keys(prev).length;
      if (same) {
        for (const k of keys) {
          if (curr[k] !== prev[k]) { same = false; break; }
        }
      }
      if (same) return cachedRef.current;
    }
    cachedRef.current = next;
    return next;
  }, []);

  return useSyncExternalStore(subscribe, getSliceSnapshot, getSliceSnapshot);
}
