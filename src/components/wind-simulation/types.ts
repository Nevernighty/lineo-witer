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
}

export interface Obstacle {
  type: "tree" | "building" | "skyscraper";
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: "L" | "T" | "regular";
  selected?: boolean;
}

export type SimulationMode = "add" | "move" | "resize" | "draw" | "erase";