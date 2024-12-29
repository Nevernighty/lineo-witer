export type ObstacleShape = "regular" | "L" | "T" | "Y" | "Z" | "Q" | "P" | "N";

export interface WindParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  lifetime: number;
  trail?: { x: number; y: number }[];
  hasCollided?: boolean;
  collisionTimer: number;
  power?: number;
}

export interface Obstacle {
  type: "tree" | "building" | "skyscraper" | "wind";
  shape: ObstacleShape;
  x: number;
  y: number;
  width: number;
  height: number;
  power?: number;
}

export type SimulationMode = "add" | "move" | "resize" | "draw" | "erase" | "wind";

export interface WindTrail {
  points: { x: number; y: number }[];
  power: number;
  angle: number;
  lifetime: number;
}

export interface EnergyMarker {
  position: 'left' | 'right' | 'top' | 'bottom';
  inflow: number;
  outflow: number;
}