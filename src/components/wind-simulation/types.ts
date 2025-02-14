
export type ObstacleShape = "regular" | "L" | "T" | "Y" | "Z" | "Q" | "P" | "N";
export type ObstacleType = "tree" | "building" | "skyscraper" | "wind";

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
}

export interface Obstacle {
  type: ObstacleType;
  shape: ObstacleShape;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  power?: number;
}

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
