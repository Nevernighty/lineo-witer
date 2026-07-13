// VfxBus — declarative one-shot visual events fired by scenarios.
// Small bounded buffer; VfxLayer subscribes and auto-prunes on ttl.

export type Vec3 = [number, number, number];

export type VfxEvent =
  | { kind: 'arrow'; id: string; born: number; ttl: number; pos: Vec3; dir: Vec3; color: string; label?: string }
  | { kind: 'pulse'; id: string; born: number; ttl: number; pos: Vec3; radius: number; color: string }
  | { kind: 'shockwave'; id: string; born: number; ttl: number; pos: Vec3; radius: number; color: string }
  | { kind: 'label3d'; id: string; born: number; ttl: number; pos: Vec3; text: string; color?: string }
  | { kind: 'highlightBlade'; id: string; born: number; ttl: number; index: number; color?: string }
  | { kind: 'windPatch'; id: string; born: number; ttl: number; pos: Vec3; size: number; color: string; label?: string };

export type VfxEventInput = Omit<VfxEvent, 'id' | 'born'> & Partial<Pick<VfxEvent, 'id' | 'born'>>;

const MAX = 32;

export interface VfxBus {
  active: VfxEvent[];
  emit(e: VfxEventInput): void;
  clear(): void;
  prune(now: number): boolean;   // returns true if list changed
  subscribe(cb: () => void): () => void;
}

export function createVfxBus(): VfxBus {
  const listeners = new Set<() => void>();
  const bus: VfxBus = {
    active: [],
    emit(e) {
      const ev = {
        ...e,
        id: e.id ?? `${e.kind}-${Math.random().toString(36).slice(2, 9)}`,
        born: e.born ?? performance.now() / 1000,
      } as VfxEvent;
      bus.active = [...bus.active, ev].slice(-MAX);
      listeners.forEach(cb => cb());
    },
    clear() {
      if (bus.active.length === 0) return;
      bus.active = [];
      listeners.forEach(cb => cb());
    },
    prune(now) {
      const next = bus.active.filter(e => now - e.born < e.ttl);
      if (next.length === bus.active.length) return false;
      bus.active = next;
      listeners.forEach(cb => cb());
      return true;
    },
    subscribe(cb) { listeners.add(cb); return () => { listeners.delete(cb); }; },
  };
  return bus;
}
