import type { QualityPreset } from './types';

export const QUALITY_PRESETS: Record<string, QualityPreset> = {
  low: {
    id: 'low',
    label: 'LOW',
    particleCount: 2000,
    trailSegments: 0,
    turbulenceDetail: 0.5,
    enableWakeViz: false,
    enableAnalysisOverlays: false,
  },
  medium: {
    id: 'medium',
    label: 'MEDIUM',
    particleCount: 6000,
    trailSegments: 3,
    turbulenceDetail: 1.0,
    enableWakeViz: true,
    enableAnalysisOverlays: true,
  },
  high: {
    id: 'high',
    label: 'HIGH',
    particleCount: 15000,
    trailSegments: 5,
    turbulenceDetail: 1.5,
    enableWakeViz: true,
    enableAnalysisOverlays: true,
  },
};

export function getQualityPreset(id: string): QualityPreset {
  return QUALITY_PRESETS[id] || QUALITY_PRESETS.medium;
}
