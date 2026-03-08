// Simulation core types — decoupled from React/Three.js

export interface SimulationParams {
  windSpeed: number;
  windAngle: number;
  windElevation: number;
  turbulenceIntensity: number;
  turbulenceScale: number;
  gustFrequency: number;
  gustIntensity: number;
  airDensity: number;
  temperature: number;
  humidity: number;
  altitude: number;
  surfaceRoughness: number;
  referenceHeight: number;
  terrainSlopeX: number;
  terrainSlopeZ: number;
}

export interface ParticleData {
  x: number; y: number; z: number;
  size: number;
  speedX: number; speedY: number; speedZ: number;
  hasCollided: boolean;
  collisionTimer: number;
  power: number;
  mass: number;
  age: number;
  lastObstacleId?: string;
  absorbed: boolean;
  absorptionTimer: number;
}

export interface ObstacleData {
  id?: string;
  type: string;
  x: number; y: number; z: number;
  width: number; height: number; depth: number;
  rotation?: number;
  scale?: number;
  material?: string;
  resistance?: number;
  density?: number;
  generatorSubtype?: string;
}

export interface WindVector {
  x: number;
  y: number;
  z: number;
  magnitude: number;
}

export interface QualityPreset {
  id: 'low' | 'medium' | 'high';
  label: string;
  particleCount: number;
  trailSegments: number;
  turbulenceDetail: number; // scale multiplier
  enableWakeViz: boolean;
  enableAnalysisOverlays: boolean;
}
