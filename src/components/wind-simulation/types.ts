export interface WindParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
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

export interface WindSimulationProps {
  windSpeed: number;
  width?: number;
  height?: number;
  onWindSpeedChange?: (value: number) => void;
}

export type SimulationMode = "add" | "move" | "resize" | "draw" | "erase";