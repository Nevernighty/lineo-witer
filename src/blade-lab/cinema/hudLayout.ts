// Shared HUD layout store — every overlay reports the vertical band it occupies
// so the cinema camera can compose the shot inside the *free* viewport area
// instead of guessing with hardcoded offsets.
import { useSyncExternalStore } from 'react';

export interface HudInsets {
  /** px consumed by overlays anchored to the top of the canvas. */
  top: number;
  /** px consumed by overlays anchored to the bottom of the canvas. */
  bottom: number;
}

let insets: HudInsets = { top: 0, bottom: 0 };
const parts: Record<string, Partial<HudInsets>> = {};
const listeners = new Set<() => void>();

function recompute() {
  let top = 0;
  let bottom = 0;
  Object.values(parts).forEach((p) => {
    top = Math.max(top, p.top ?? 0);
    bottom = Math.max(bottom, p.bottom ?? 0);
  });
  if (top === insets.top && bottom === insets.bottom) return;
  insets = { top, bottom };
  listeners.forEach((l) => l());
}

/** Report (or clear, with null) the band a named overlay occupies. */
export function reportHudBand(id: string, band: Partial<HudInsets> | null) {
  if (band === null) delete parts[id];
  else parts[id] = band;
  recompute();
}

function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
function getSnapshot() { return insets; }

export function useHudInsets(): HudInsets {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getHudInsets(): HudInsets { return insets; }
