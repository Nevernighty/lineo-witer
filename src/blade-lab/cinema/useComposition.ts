// Per-scenario camera composition presets: framing, fov, and the last camera
// position the user parked on. Stored locally and mirrored to the cloud user
// settings row when signed in, so switching scenarios (or bouncing to the wind
// simulation and back) restores exactly the shot you left.
import { useCallback, useEffect, useState } from 'react';

export type Framing = 'wide' | 'medium' | 'detail';

export interface Composition {
  /** Vertical field of view in degrees. */
  fov: number;
  framing: Framing;
  /** Extra look-at bias in scene-scale units [x, y, z]. */
  lookBias: [number, number, number];
  /** Minimum radial clearance from the rotor axis, in rotor radii. */
  minDistanceR: number;
  /** Minimum camera height above the stage floor, in rotor radii. */
  floorClearance: number;
  /** Last parked camera position (world space) — restored on scenario load. */
  parked?: [number, number, number];
}

export const DEFAULT_COMPOSITION: Composition = {
  fov: 45,
  framing: 'medium',
  lookBias: [0, 0, 0],
  minDistanceR: 1.15,
  floorClearance: 0.12,
};

export const FRAMING_MUL: Record<Framing, number> = { wide: 1.85, medium: 1.35, detail: 0.95 };

const KEY = 'blade-lab.compositions.v1';

type Store = Record<string, Partial<Composition>>;

function readStore(): Store {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') as Store; } catch { return {}; }
}
function writeStore(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ }
}

export function resolveComposition(scenarioId: string | null, base?: Partial<Composition>): Composition {
  const saved = scenarioId ? readStore()[scenarioId] : undefined;
  return { ...DEFAULT_COMPOSITION, ...(base ?? {}), ...(saved ?? {}) };
}

/**
 * Live composition for the active scenario. Returns the resolved composition
 * plus setters that persist immediately.
 */
export function useComposition(scenarioId: string | null, base?: Partial<Composition>) {
  const [comp, setComp] = useState<Composition>(() => resolveComposition(scenarioId, base));

  // Reload whenever the scenario (or its authored base) changes.
  useEffect(() => {
    setComp(resolveComposition(scenarioId, base));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId, JSON.stringify(base ?? {})]);

  const patch = useCallback((p: Partial<Composition>) => {
    if (!scenarioId) { setComp((c) => ({ ...c, ...p })); return; }
    const store = readStore();
    store[scenarioId] = { ...(store[scenarioId] ?? {}), ...p };
    writeStore(store);
    setComp((c) => ({ ...c, ...p }));
  }, [scenarioId]);

  const reset = useCallback(() => {
    if (!scenarioId) return;
    const store = readStore();
    delete store[scenarioId];
    writeStore(store);
    setComp(resolveComposition(scenarioId, base));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId, JSON.stringify(base ?? {})]);

  /** Remember where the camera ended up (throttled by the caller). */
  const park = useCallback((pos: [number, number, number]) => {
    if (!scenarioId) return;
    const store = readStore();
    store[scenarioId] = { ...(store[scenarioId] ?? {}), parked: pos };
    writeStore(store);
  }, [scenarioId]);

  return { composition: comp, patch, reset, park };
}
