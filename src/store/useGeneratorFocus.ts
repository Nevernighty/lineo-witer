// Which generator is hovered / pinned in the 3D simulation.
// Lets the canvas ignore placement clicks that land on a turbine and lets
// HUD cards expand on hover and stay open on click.
import { useSyncExternalStore } from 'react';

interface FocusState { hoveredId: string | null; pinnedId: string | null }

let state: FocusState = { hoveredId: null, pinnedId: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export function setHoveredGenerator(id: string | null) {
  if (state.hoveredId === id) return;
  state = { ...state, hoveredId: id };
  emit();
}

export function togglePinnedGenerator(id: string) {
  state = { ...state, pinnedId: state.pinnedId === id ? null : id };
  emit();
}

export function clearPinnedGenerator() {
  if (!state.pinnedId) return;
  state = { ...state, pinnedId: null };
  emit();
}

export const getGeneratorFocus = () => state;

function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

export function useGeneratorFocus(): FocusState {
  return useSyncExternalStore(subscribe, getGeneratorFocus, getGeneratorFocus);
}
