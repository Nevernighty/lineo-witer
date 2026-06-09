// Tiny ring buffer for live diagnostics samples. Updated by BladeMesh, read by overlay.
import { useSyncExternalStore } from 'react';

export interface DiagSample {
  t: number;
  omega: number;
  rpm: number;
  tipSpeed: number;
  failure: number;
  detachedFrac: number;
  flexAmp: number;
}

const MAX = 240; // ~12 s at 20 Hz
const buf: DiagSample[] = [];
const listeners = new Set<() => void>();
let lastEmit = 0;

export function pushDiag(s: DiagSample) {
  const now = performance.now();
  if (now - lastEmit < 50) return; // throttle to 20 Hz
  lastEmit = now;
  buf.push(s);
  if (buf.length > MAX) buf.shift();
  listeners.forEach(l => l());
}

export function getDiagSnapshot() {
  return buf;
}

function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

export function useDiagnostics(): DiagSample[] {
  return useSyncExternalStore(subscribe, getDiagSnapshot, getDiagSnapshot);
}
