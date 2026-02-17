
export type ObstacleShape = "regular" | "L" | "T" | "Y" | "Z" | "Q" | "P" | "N" | "irregular" | "cylindrical" | "rectangular";
export type ObstacleType = "tree" | "building" | "skyscraper" | "tower" | "house" | "wall" | "fence" | "wind_generator";
export type ObstacleCategory = "vegetation" | "structure" | "barrier" | "energy";
export type ObstacleMaterial = "wood" | "concrete" | "steel" | "glass" | "brick";
export type GeneratorSubtype = 'hawt3' | 'hawt2' | 'darrieus' | 'savonius' | 'micro';

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
  generatorSubtype?: GeneratorSubtype;
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

// Generator specs per subtype
export interface GeneratorTypeSpecs {
  name: string;
  nameUa: string;
  cp: number;         // Power coefficient
  cutIn: number;      // m/s
  cutOut: number;     // m/s
  optimalTSR: number; // Tip-Speed Ratio
  bladeCount: number;
  axis: 'horizontal' | 'vertical';
  description: string;
  descriptionUa: string;
}

export const GENERATOR_SUBTYPES: Record<GeneratorSubtype, GeneratorTypeSpecs> = {
  hawt3: {
    name: '3-Blade HAWT',
    nameUa: '3-лопатевий HAWT',
    cp: 0.45,
    cutIn: 3,
    cutOut: 25,
    optimalTSR: 7,
    bladeCount: 3,
    axis: 'horizontal',
    description: 'Most common design. High efficiency, stable operation. Requires yaw mechanism.',
    descriptionUa: 'Найпоширеніший тип. Висока ефективність, стабільна робота. Потребує систему повороту.'
  },
  hawt2: {
    name: '2-Blade HAWT',
    nameUa: '2-лопатевий HAWT',
    cp: 0.42,
    cutIn: 3.5,
    cutOut: 28,
    optimalTSR: 9,
    bladeCount: 2,
    axis: 'horizontal',
    description: 'Faster rotation, lighter weight. More vibration, teetering hub needed.',
    descriptionUa: 'Швидше обертання, менша вага. Більше вібрацій, потрібен шарнірний хаб.'
  },
  darrieus: {
    name: 'Darrieus VAWT',
    nameUa: 'Дар\'є VAWT',
    cp: 0.35,
    cutIn: 4,
    cutOut: 20,
    optimalTSR: 5,
    bladeCount: 3,
    axis: 'vertical',
    description: 'Vertical axis, C-shaped blades. Omnidirectional, not self-starting.',
    descriptionUa: 'Вертикальна вісь, С-подібні лопаті. Всенаправлений, не самозапуск.'
  },
  savonius: {
    name: 'Savonius VAWT',
    nameUa: 'Савоніус VAWT',
    cp: 0.18,
    cutIn: 2,
    cutOut: 15,
    optimalTSR: 1.0,
    bladeCount: 2,
    axis: 'vertical',
    description: 'S-shaped drag-driven. Works at low speeds, self-starting, low efficiency.',
    descriptionUa: 'S-подібний, працює на опорі. Працює при малих швидкостях, самозапуск.'
  },
  micro: {
    name: 'Micro Turbine',
    nameUa: 'Мікро-турбіна',
    cp: 0.30,
    cutIn: 2.5,
    cutOut: 18,
    optimalTSR: 6,
    bladeCount: 5,
    axis: 'horizontal',
    description: 'Compact rooftop unit. Low power, easy installation, quiet.',
    descriptionUa: 'Компактний дахвий блок. Мала потужність, легке встановлення, тихий.'
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
