import { describe, expect, test } from 'bun:test';
import { buildFlowChannels, sampleChannelSpeedup } from './channelFlow';
import type { Obstacle } from '../components/wind-simulation/types';

const building = (z: number): Obstacle => ({ type: 'building', category: 'structure', shape: 'regular', x: 0, y: 0, z, width: 20, depth: 10, height: 10 });
describe('urban channel approximation', () => {
  test('only positive gaps below 30 metres form channels', () => {
    expect(buildFlowChannels([building(0), building(20)], 1, 0)).toHaveLength(1);
    expect(buildFlowChannels([building(0), building(40)], 1, 0)).toHaveLength(0);
    expect(buildFlowChannels([building(0), building(5)], 1, 0)).toHaveLength(0);
  });
  test('speedup is capped at 1.4 and overlapping channels do not compound', () => {
    const ch = { start: 0, end: 20, left: 0, right: 1, bottom: 0, top: 10 };
    expect(sampleChannelSpeedup([ch, ch], 10, 0.5, 5)).toBe(1.4);
  });
  test('flow outside the channel and at its boundaries stays unchanged', () => {
    const ch = buildFlowChannels([building(0), building(20)], 1, 0);
    expect(sampleChannelSpeedup(ch, 10, 15, 5)).toBeCloseTo(4 / 3);
    expect(sampleChannelSpeedup(ch, 0, 15, 5)).toBe(1);
    expect(sampleChannelSpeedup(ch, 10, 25, 5)).toBe(1);
    expect(sampleChannelSpeedup(ch, 10, 15, 11)).toBe(1);
  });
  test('rotated wind basis retains the same physical channel', () => {
    const rotated = [building(0), building(20)].map(o => ({ ...o, x: o.z, z: o.x, width: o.depth, depth: o.width }));
    expect(sampleChannelSpeedup(buildFlowChannels(rotated, 0, 1), 10, -15, 5)).toBeCloseTo(4 / 3);
  });
});