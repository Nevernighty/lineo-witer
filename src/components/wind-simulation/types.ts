
export type ObstacleShape = "regular" | "L" | "T" | "Y" | "Z" | "Q" | "P" | "N" | "irregular" | "cylindrical" | "rectangular";
export type ObstacleType = "tree" | "building" | "skyscraper" | "tower" | "house" | "wall" | "fence" | "wind_generator";
export type ObstacleCategory = "vegetation" | "structure" | "barrier" | "energy";
export type ObstacleMaterial = "wood" | "concrete" | "steel" | "glass" | "brick";

export interface WindParticle {
  x: number;
  y: number;
  z: number;
  size: number;
  speedX: number;
  speedY: number;
  speedZ: number;
  color: string;
  lifetime: number;
  trail?: { x: number; y: number; z: number }[];
  hasCollided?: boolean;
  collisionTimer: number;
  power?: number;
  collisionEnergy?: number;
  originalColor?: string;
}

export interface Obstacle {
  id?: string;
  type: ObstacleType;
  category: ObstacleCategory;
  shape: ObstacleShape;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  density?: number;
  material?: ObstacleMaterial;
  resistance?: number;
  power?: number;
}

export interface ObstacleCategoryConfig {
  name: string;
  types: ObstacleType[];
  defaultProperties: {
    density: number;
    resistance: number;
    material: ObstacleMaterial;
  };
}

export const OBSTACLE_CATEGORIES: Record<ObstacleCategory, ObstacleCategoryConfig> = {
  vegetation: {
    name: 'Vegetation',
    types: ['tree'],
    defaultProperties: {
      density: 0.6,
      resistance: 0.8,
      material: 'wood'
    }
  },
  structure: {
    name: 'Structures', 
    types: ['building', 'skyscraper', 'tower', 'house'],
    defaultProperties: {
      density: 0.9,
      resistance: 1.2,
      material: 'concrete'
    }
  },
  barrier: {
    name: 'Barriers',
    types: ['wall', 'fence'],
    defaultProperties: {
      density: 0.7,
      resistance: 1.0,
      material: 'wood'
    }
  },
  energy: {
    name: 'Energy',
    types: ['wind_generator'],
    defaultProperties: {
      density: 0.5,
      resistance: 0.3,
      material: 'steel'
    }
  }
};

export type SimulationMode = "add" | "move" | "resize" | "draw" | "erase" | "wind";

export interface WindTrail {
  points: { x: number; y: number; z: number }[];
  power: number;
  angle: number;
  lifetime: number;
}

export interface EnergyMarker {
  position: 'left' | 'right' | 'top' | 'bottom';
  inflow: number;
  outflow: number;
}

export interface Material {
  name: string;
  efficiency: number;
  cost: number;
  durability: number;
  weight: number;
}
