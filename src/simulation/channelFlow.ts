import type { Obstacle } from '../components/wind-simulation/types';

export interface FlowChannel {
  start: number; end: number; left: number; right: number; bottom: number; top: number;
}

/** Project rotated footprints onto the wind basis once per layout/heading change. */
export function buildFlowChannels(obstacles: Obstacle[], wx: number, wz: number): FlowChannel[] {
  const buildings = obstacles.filter(o => o.category === 'structure').map(o => {
    const a = (o.rotation ?? 0) * Math.PI / 180;
    const c = Math.cos(a), s = Math.sin(a), scale = o.scale ?? 1;
    const x = o.x + o.width / 2, z = o.z + o.depth / 2;
    const alongHalf = (Math.abs(wx * c - wz * s) * o.width + Math.abs(wx * s + wz * c) * o.depth) * scale / 2;
    const crossHalf = (Math.abs(-wz * c - wx * s) * o.width + Math.abs(-wz * s + wx * c) * o.depth) * scale / 2;
    const along = x * wx + z * wz, cross = -x * wz + z * wx;
    return { start: along - alongHalf, end: along + alongHalf, left: cross - crossHalf, right: cross + crossHalf, bottom: o.y, top: o.y + o.height * scale };
  });
  const channels: FlowChannel[] = [];
  for (let i = 0; i < buildings.length; i++) {
    for (let j = i + 1; j < buildings.length; j++) {
      const a = buildings[i], b = buildings[j];
      const [left, right] = a.left < b.left ? [a, b] : [b, a];
      const gap = right.left - left.right;
      const start = Math.max(a.start, b.start), end = Math.min(a.end, b.end);
      const bottom = Math.max(a.bottom, b.bottom), top = Math.min(a.top, b.top);
      if (gap > 0 && gap < 30 && end > start && top > bottom) {
        channels.push({ start, end, left: left.right, right: right.left, bottom, top });
      }
    }
  }
  return channels;
}

/** Bounded visualization heuristic, not a CFD/Bernoulli solution. No stacking. */
export function sampleChannelSpeedup(channels: FlowChannel[], along: number, cross: number, y: number): number {
  let factor = 1;
  for (const ch of channels) {
    if (along <= ch.start || along >= ch.end || cross <= ch.left || cross >= ch.right || y <= ch.bottom || y >= ch.top) continue;
    const stream = Math.sin(Math.PI * (along - ch.start) / (ch.end - ch.start));
    const lateral = Math.sin(Math.PI * (cross - ch.left) / (ch.right - ch.left));
    const vertical = Math.sin(Math.PI * (y - ch.bottom) / (ch.top - ch.bottom));
    factor = Math.max(factor, 1 + Math.min(0.4, 0.5 * (1 - (ch.right - ch.left) / 30)) * stream * lateral * vertical);
  }
  return factor;
}