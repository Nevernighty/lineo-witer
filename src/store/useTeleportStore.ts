// Ephemeral store to drive the Blade→Simulation animated hand-off.
import { useSyncExternalStore } from "react";

export interface TeleportPayload {
  thumbnail?: string;       // dataURL
  presetName?: string;
  fromRect?: { x: number; y: number; w: number; h: number };
  /** How many silhouette blades to fan out in phase B. */
  nBlades?: number;
  /** Rotor family — controls silhouette shape. */
  rotorType?: string;
  /** Optional wind speed carried over so sim can hydrate. */
  windSpeed?: number;
  /** Optional TSR. */
  tsr?: number;
  /** Optional site id (e.g. 'roof'). */
  siteId?: string;
  startedAt: number;
}

let state: TeleportPayload | null = null;
const listeners = new Set<() => void>();

export function startTeleport(p: Omit<TeleportPayload, "startedAt">) {
  state = { ...p, startedAt: performance.now() };
  listeners.forEach((l) => l());
  // auto-clear after 2.6s (matches BladeTeleport phase C end + buffer)
  setTimeout(() => {
    if (state && performance.now() - state.startedAt >= 2400) {
      state = null;
      listeners.forEach((l) => l());
    }
  }, 2600);
}

export function clearTeleport() {
  state = null;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
function getSnapshot() { return state; }

export function useTeleport() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
