// Deterministic assembly layout for the real 3D-printed turbine parts.
// Positions are expressed in the model's own units (the `ext` field of each part),
// so the viewer only needs one uniform scale to frame any turbine.
import { turbineParts, type ResolvedPart } from '@/data/realTurbines';
import type { PartRole } from './types';

export interface PlacedPart {
  part: ResolvedPart;
  /** Assembled position, model units. */
  pos: [number, number, number];
  /** Yaw of the part around the rotor axis (ring members face outward). */
  spin: number;
  /** Unit vector the part travels along when the assembly explodes. */
  dir: [number, number, number];
  /** Explode travel in model units at slider = 1. */
  travel: number;
  ring: boolean;
}

export interface TurbineLayout {
  axis: 'y' | 'z';
  /** Reference unit — the largest single-part extent. */
  unit: number;
  /** Bounding radius of the assembled model, model units. */
  radius: number;
  parts: PlacedPart[];
}

/** Axial slot per role, in units of U, measured along the rotor axis. */
const SLOT: Record<'y' | 'z', Record<PartRole, number>> = {
  // Horizontal-axis machines: nose (+z) points into the wind, tail sits at -z.
  z: {
    tool: -1.55, base: -0.95, tail: -0.80, shaft: -0.12, bearing: 0.10,
    generator: 0.00, hub: 0.34, arm: 0.34, blade: 0.44, cover: 0.66,
  },
  // Vertical-axis machines stack from the ground up.
  y: {
    tool: -0.60, base: 0.00, bearing: 0.22, generator: 0.16, shaft: 0.55,
    hub: 0.52, arm: 0.52, blade: 0.62, cover: 1.15, tail: 0.90,
  },
};

/** Ring radius per role, in units of U. */
const RING_R: Partial<Record<PartRole, number>> = { blade: 0.60, arm: 0.46 };

/** Roles that are arranged in a ring around the axis rather than stacked. */
const RING_ROLES: PartRole[] = ['blade', 'arm'];

export function buildTurbineLayout(turbineId: string, axisKind: 'horizontal' | 'vertical'): TurbineLayout {
  const axis: 'y' | 'z' = axisKind === 'vertical' ? 'y' : 'z';
  const parts = turbineParts(turbineId);
  const unit = Math.max(1e-6, ...parts.map(p => Math.max(p.ext[0], p.ext[1], p.ext[2])));
  const slots = SLOT[axis];

  // Per-role running index so stacked duplicates never interpenetrate.
  const seen = new Map<PartRole, number>();
  const roleTotal = new Map<PartRole, number>();
  for (const p of parts) roleTotal.set(p.role, (roleTotal.get(p.role) ?? 0) + 1);

  const placed: PlacedPart[] = parts.map((p) => {
    const idx = seen.get(p.role) ?? 0;
    seen.set(p.role, idx + 1);
    const total = roleTotal.get(p.role) ?? 1;
    const ring = RING_ROLES.includes(p.role);
    const base = slots[p.role] ?? 0;

    if (ring) {
      const r = (RING_R[p.role] ?? 0.5) * unit;
      const theta = (idx / total) * Math.PI * 2;
      const along = base * unit;
      const cx = Math.cos(theta) * r;
      const cy = Math.sin(theta) * r;
      const pos: [number, number, number] = axis === 'y'
        ? [cx, along, cy]
        : [cx, cy, along];
      const len = Math.hypot(cx, cy) || 1;
      const dir: [number, number, number] = axis === 'y'
        ? [cx / len, 0.12, cy / len]
        : [cx / len, cy / len, 0.1];
      return { part: p, pos, spin: theta, dir, travel: unit * 0.85, ring: true };
    }

    // Stacked: offset successive same-role parts along the axis, with a small
    // lateral fan so identical discs stay individually clickable.
    const step = 0.17 * unit;
    const along = base * unit + (idx - (total - 1) / 2) * step;
    const lateral = total > 1 ? (idx - (total - 1) / 2) * 0.06 * unit : 0;
    const pos: [number, number, number] = axis === 'y'
      ? [lateral, along, 0]
      : [lateral, 0, along];
    const sign = along >= 0 ? 1 : -1;
    const dir: [number, number, number] = axis === 'y'
      ? [0.22 * (idx % 2 ? 1 : -1), sign, 0]
      : [0.22 * (idx % 2 ? 1 : -1), 0.1, sign];
    const n = Math.hypot(dir[0], dir[1], dir[2]) || 1;
    return {
      part: p,
      pos,
      spin: 0,
      dir: [dir[0] / n, dir[1] / n, dir[2] / n],
      travel: unit * (0.7 + idx * 0.12),
      ring: false,
    };
  });

  let radius = unit * 0.5;
  for (const p of placed) {
    const half = Math.max(p.part.ext[0], p.part.ext[1], p.part.ext[2]) * 0.5;
    radius = Math.max(radius, Math.hypot(p.pos[0], p.pos[1], p.pos[2]) + half);
  }

  return { axis, unit, radius, parts: placed };
}

/** Roles that spin with the rotor during the animated assembly preview. */
export const SPINNING_ROLES: PartRole[] = ['blade', 'hub', 'arm'];
