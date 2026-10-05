// Deterministic assembly layout for the real 3D-printed turbine parts.
// Positions are expressed in the model's own units (the `ext` field of each part),
// so the viewer only needs one uniform scale to frame any turbine.
//
// Printable archives ship ONE copy of each repeated part (one blade, one strut).
// The layout replicates ring members up to the machine's real blade count, orients
// every part by its principal extent, and re-centres the whole assembly on the origin.
import { turbineParts, getRealTurbine, type ResolvedPart } from '@/data/realTurbines';
import type { PartRole } from './types';

/** How a part's longest / shortest extent should be aligned. */
export type PartOrient = 'long-axial' | 'long-radial' | 'flat-axial' | 'none';

export interface PlacedPart {
  /** Unique render key (part id + copy index). */
  key: string;
  part: ResolvedPart;
  /** Copy index for replicated ring members. */
  copy: number;
  /** Assembled position, model units. */
  pos: [number, number, number];
  /** Angle of the part around the rotor axis. */
  spin: number;
  dir: [number, number, number];
  travel: number;
  ring: boolean;
  orient: PartOrient;
}

export interface TurbineLayout {
  axis: 'y' | 'z';
  unit: number;
  radius: number;
  parts: PlacedPart[];
}

const SLOT: Record<'y' | 'z', Record<PartRole, number>> = {
  z: {
    tool: -1.6, base: -0.55, tail: -1.05, shaft: -0.15, bearing: -0.05,
    generator: -0.3, hub: 0.12, arm: 0.12, blade: 0.14, cover: 0.3,
  },
  y: {
    tool: -0.9, base: -0.75, bearing: -0.5, generator: -0.62, shaft: 0.0,
    hub: 0.0, arm: 0.0, blade: 0.0, cover: 0.62, tail: 0.5,
  },
};

const RING_ROLES: PartRole[] = ['blade', 'arm'];

export function buildTurbineLayout(turbineId: string, axisKind: 'horizontal' | 'vertical'): TurbineLayout {
  const axis: 'y' | 'z' = axisKind === 'vertical' ? 'y' : 'z';
  const parts = turbineParts(turbineId);
  const spec = getRealTurbine(turbineId)?.spec;
  const nBlades = Math.max(2, spec?.blades ?? 3);
  const unit = Math.max(1e-6, ...parts.map(p => Math.max(p.ext[0], p.ext[1], p.ext[2])));
  const slots = SLOT[axis];

  // Expand ring members: each distinct printable is repeated so the rotor has
  // exactly nBlades copies in total (sectioned blades stay one per set).
  type Item = { p: ResolvedPart; copy: number };
  const items: Item[] = [];
  const ringCount = new Map<PartRole, number>();
  for (const p of parts) if (RING_ROLES.includes(p.role)) ringCount.set(p.role, (ringCount.get(p.role) ?? 0) + 1);

  // HAWT blades printed as sections (Wing01..Wing05): glue end-to-end radially,
  // then repeat the whole blade nBlades times.
  const bladeParts = parts.filter(p => p.role === 'blade');
  const sectioned = axis === 'z' && bladeParts.length > nBlades;
  const sectionPlaced: PlacedPart[] = [];
  if (sectioned) {
    const secs = [...bladeParts].sort((a, b) => a.id.localeCompare(b.id));
    const hubR = unit * 0.06;
    for (let b = 0; b < nBlades; b++) {
      const theta = (b / nBlades) * Math.PI * 2;
      let r = hubR;
      for (const s of secs) {
        const L = Math.max(...s.ext);
        const rc = r + L / 2;
        r += L * 0.98;
        const pos: [number, number, number] = [Math.cos(theta) * rc, Math.sin(theta) * rc, (slots.blade ?? 0) * unit];
        sectionPlaced.push({
          key: `${s.id}#${b}`, part: s, copy: b, pos, spin: theta,
          dir: [Math.cos(theta), Math.sin(theta), 0.1], travel: unit * 0.5, ring: true, orient: 'long-radial',
        });
      }
    }
  }

  const vawtRatio = spec && spec.rotorH > 0 ? (spec.rotorD / 2) / spec.rotorH : 0.45;
  for (const p of parts) {
    if (sectioned && p.role === 'blade') continue;
    if (RING_ROLES.includes(p.role)) {
      const distinct = ringCount.get(p.role) ?? 1;
      const copies = distinct >= nBlades ? 1 : Math.max(1, Math.round(nBlades / distinct));
      for (let c = 0; c < copies; c++) items.push({ p, copy: c });
    } else items.push({ p, copy: 0 });
  }

  const roleTotal = new Map<PartRole, number>();
  for (const it of items) roleTotal.set(it.p.role, (roleTotal.get(it.p.role) ?? 0) + 1);
  const seen = new Map<PartRole, number>();

  const placed: PlacedPart[] = items.map(({ p, copy }) => {
    const idx = seen.get(p.role) ?? 0;
    seen.set(p.role, idx + 1);
    const total = roleTotal.get(p.role) ?? 1;
    const ring = RING_ROLES.includes(p.role);
    const base = (slots[p.role] ?? 0) * unit;
    const key = `${p.id}#${copy}`;

    if (ring) {
      const long = Math.max(...p.ext);
      // HAWT blades: root at hub, so centre sits half a blade out.
      // VAWT blades: sit at rotor radius (from spec, scaled), arms halfway.
      const rotorR = axis === 'z'
        ? long * 0.5 + unit * 0.04
        : Math.max(unit * 0.18, long * vawtRatio);
      const r = p.role === 'arm' ? (axis === 'z' ? long * 0.5 : rotorR * 0.5) : rotorR;
      const theta = (idx / total) * Math.PI * 2;
      const cx = Math.cos(theta) * r;
      const cy = Math.sin(theta) * r;
      const pos: [number, number, number] = axis === 'y' ? [cx, base, cy] : [cx, cy, base];
      const len = Math.hypot(cx, cy) || 1;
      const dir: [number, number, number] = axis === 'y' ? [cx / len, 0.1, cy / len] : [cx / len, cy / len, 0.1];
      return {
        key, part: p, copy, pos, spin: theta, dir, travel: unit * 0.7, ring: true,
        orient: axis === 'y' && p.role === 'blade' ? 'long-axial' : 'long-radial',
      };
    }

    const step = 0.1 * unit;
    const along = base + (idx - (total - 1) / 2) * step;
    const pos: [number, number, number] = axis === 'y' ? [0, along, 0] : [0, 0, along];
    const sign = along >= 0 ? 1 : -1;
    const dir: [number, number, number] = axis === 'y' ? [0, sign, 0] : [0, 0, sign];
    const orient: PartOrient = p.role === 'shaft' ? 'long-axial'
      : p.role === 'tail' || p.role === 'tool' ? 'none' : 'flat-axial';
    return { key, part: p, copy, pos, spin: 0, dir, travel: unit * (0.6 + idx * 0.1), ring: false, orient };
  });

  placed.push(...sectionPlaced);

  // Re-centre on the assembly's bounding box (excluding jigs).
  const core = placed.filter(p => p.part.role !== 'tool');
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of core) {
    const h = Math.max(...p.part.ext) * 0.5;
    for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], p.pos[i] - h); max[i] = Math.max(max[i], p.pos[i] + h); }
  }
  const c = [0, 1, 2].map(i => (isFinite(min[i]) ? (min[i] + max[i]) / 2 : 0));
  for (const p of placed) p.pos = [p.pos[0] - c[0], p.pos[1] - c[1], p.pos[2] - c[2]];

  let radius = unit * 0.5;
  for (const p of core) {
    const half = Math.max(...p.part.ext) * 0.5;
    radius = Math.max(radius, Math.hypot(p.pos[0], p.pos[1], p.pos[2]) + half);
  }
  return { axis, unit, radius, parts: placed };
}

export const SPINNING_ROLES: PartRole[] = ['blade', 'hub', 'arm'];
