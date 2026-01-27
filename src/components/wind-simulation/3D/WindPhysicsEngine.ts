// Advanced Wind Physics Engine with real-world parameters
// Based on wind energy research and turbulence modeling

export interface WindPhysicsConfig {
  // Wind Parameters
  windSpeed: number;           // m/s
  windAngle: number;           // degrees (0-360)
  windElevation: number;       // degrees (-45 to 45)
  
  // Turbulence Parameters
  turbulenceIntensity: number; // 0-1 (low to high)
  turbulenceScale: number;     // spatial scale of turbulence
  gustFrequency: number;       // gusts per minute
  gustIntensity: number;       // 0-1 multiplier
  
  // Atmospheric Parameters
  airDensity: number;          // kg/m³ (sea level: 1.225)
  temperature: number;         // Celsius
  humidity: number;            // 0-100%
  altitude: number;            // meters above sea level
  
  // Wind Shear (height effect)
  surfaceRoughness: number;    // 0.0001 (water) to 1.0 (city)
  referenceHeight: number;     // meters
}

export interface ObstaclePhysics {
  dragCoefficient: number;     // Cd value
  porosityFactor: number;      // 0-1 (solid to porous)
  turbulenceGeneration: number; // how much turbulence it creates
  wakeLength: number;          // meters of wake behind obstacle
  separationAngle: number;     // degrees of flow separation
}

// Drag coefficients for different obstacle types
export const OBSTACLE_DRAG_COEFFICIENTS: Record<string, ObstaclePhysics> = {
  tree: {
    dragCoefficient: 0.4,
    porosityFactor: 0.6,
    turbulenceGeneration: 0.8,
    wakeLength: 15,
    separationAngle: 45
  },
  building: {
    dragCoefficient: 1.4,
    porosityFactor: 0.0,
    turbulenceGeneration: 1.2,
    wakeLength: 25,
    separationAngle: 15
  },
  skyscraper: {
    dragCoefficient: 1.6,
    porosityFactor: 0.0,
    turbulenceGeneration: 1.5,
    wakeLength: 50,
    separationAngle: 10
  },
  tower: {
    dragCoefficient: 0.8,
    porosityFactor: 0.3,
    turbulenceGeneration: 0.6,
    wakeLength: 20,
    separationAngle: 30
  },
  house: {
    dragCoefficient: 1.2,
    porosityFactor: 0.0,
    turbulenceGeneration: 0.9,
    wakeLength: 15,
    separationAngle: 20
  },
  wall: {
    dragCoefficient: 2.0,
    porosityFactor: 0.0,
    turbulenceGeneration: 1.3,
    wakeLength: 10,
    separationAngle: 5
  },
  fence: {
    dragCoefficient: 1.0,
    porosityFactor: 0.5,
    turbulenceGeneration: 0.7,
    wakeLength: 8,
    separationAngle: 25
  }
};

// Calculate air density based on altitude and temperature
export function calculateAirDensity(altitude: number, temperature: number): number {
  // Standard atmosphere model
  const T0 = 288.15; // Standard temperature at sea level (K)
  const P0 = 101325; // Standard pressure at sea level (Pa)
  const L = 0.0065;  // Temperature lapse rate (K/m)
  const g = 9.81;    // Gravitational acceleration (m/s²)
  const M = 0.0289644; // Molar mass of dry air (kg/mol)
  const R = 8.3145;  // Universal gas constant
  
  const T = T0 - L * altitude;
  const P = P0 * Math.pow(T / T0, g * M / (R * L));
  const rho = (P * M) / (R * (temperature + 273.15));
  
  return Math.max(0.5, Math.min(1.5, rho));
}

// Wind shear calculation using power law
export function calculateWindShear(
  baseSpeed: number,
  baseHeight: number,
  targetHeight: number,
  roughnessLength: number
): number {
  // Power law exponent based on surface roughness
  const alpha = 0.096 * Math.log10(roughnessLength) + 0.016 * Math.pow(Math.log10(roughnessLength), 2) + 0.24;
  const clampedAlpha = Math.max(0.1, Math.min(0.4, alpha));
  
  return baseSpeed * Math.pow(targetHeight / baseHeight, clampedAlpha);
}

// Turbulence intensity calculation
export function calculateTurbulenceIntensity(
  meanWindSpeed: number,
  surfaceRoughness: number,
  height: number
): number {
  // Based on IEC 61400-1 turbulence model
  const z0 = surfaceRoughness;
  const sigma = 1.0 / Math.log(height / z0);
  const Iref = 0.16; // Reference turbulence intensity
  
  return Iref * (0.75 + 5.6 / meanWindSpeed);
}

// Generate Perlin-like noise for turbulence
export function turbulenceNoise(x: number, y: number, z: number, time: number, scale: number): number {
  const freq1 = scale * 0.1;
  const freq2 = scale * 0.2;
  const freq3 = scale * 0.4;
  
  const noise1 = Math.sin(x * freq1 + time) * Math.cos(y * freq1 - time * 0.5) * Math.sin(z * freq1 + time * 0.3);
  const noise2 = Math.sin(x * freq2 - time * 1.3) * Math.cos(y * freq2 + time * 0.7) * Math.cos(z * freq2 - time * 0.2);
  const noise3 = Math.cos(x * freq3 + time * 0.8) * Math.sin(y * freq3 - time * 0.4) * Math.sin(z * freq3 + time * 1.1);
  
  return (noise1 + noise2 * 0.5 + noise3 * 0.25) / 1.75;
}

// Calculate gust effect
export function calculateGust(
  time: number,
  gustFrequency: number,
  gustIntensity: number,
  baseSpeed: number
): number {
  const gustPeriod = 60 / gustFrequency; // seconds per gust
  const phase = (time % gustPeriod) / gustPeriod;
  
  // Smooth gust profile (rise and fall)
  const gustProfile = phase < 0.3 
    ? Math.sin(phase / 0.3 * Math.PI / 2) 
    : phase < 0.5 
      ? 1 
      : phase < 0.8 
        ? Math.cos((phase - 0.5) / 0.3 * Math.PI / 2)
        : 0;
  
  return baseSpeed * (1 + gustIntensity * gustProfile);
}

// Calculate drag force on particle near obstacle
export function calculateDragForce(
  particleVelocity: { x: number; y: number; z: number },
  obstaclePhysics: ObstaclePhysics,
  airDensity: number,
  particleArea: number
): { x: number; y: number; z: number } {
  const speed = Math.sqrt(
    particleVelocity.x ** 2 + 
    particleVelocity.y ** 2 + 
    particleVelocity.z ** 2
  );
  
  if (speed < 0.01) return { x: 0, y: 0, z: 0 };
  
  // Drag force: F = 0.5 * ρ * v² * Cd * A
  const dragMagnitude = 0.5 * airDensity * speed * speed * obstaclePhysics.dragCoefficient * particleArea;
  
  // Apply porosity reduction
  const effectiveDrag = dragMagnitude * (1 - obstaclePhysics.porosityFactor);
  
  return {
    x: -effectiveDrag * (particleVelocity.x / speed),
    y: -effectiveDrag * (particleVelocity.y / speed),
    z: -effectiveDrag * (particleVelocity.z / speed)
  };
}

// Check if particle is in wake zone behind obstacle
export function isInWakeZone(
  particlePos: { x: number; y: number; z: number },
  obstaclePos: { x: number; y: number; z: number },
  obstacleSize: { width: number; height: number; depth: number },
  windDirection: { x: number; z: number },
  wakeLength: number
): boolean {
  // Direction from obstacle to particle
  const toParticle = {
    x: particlePos.x - obstaclePos.x,
    z: particlePos.z - obstaclePos.z
  };
  
  // Check if particle is downwind of obstacle
  const dotProduct = toParticle.x * windDirection.x + toParticle.z * windDirection.z;
  if (dotProduct < 0) return false; // Upwind
  
  const distance = Math.sqrt(toParticle.x ** 2 + toParticle.z ** 2);
  if (distance > wakeLength) return false;
  
  // Check if within wake cone
  const wakeWidth = Math.max(obstacleSize.width, obstacleSize.depth) * (1 + distance / wakeLength);
  const crossProduct = Math.abs(toParticle.x * windDirection.z - toParticle.z * windDirection.x);
  
  return crossProduct < wakeWidth / 2;
}

// Calculate wake velocity reduction
export function calculateWakeVelocity(
  distance: number,
  wakeLength: number,
  originalSpeed: number
): number {
  // Velocity deficit decreases with distance
  const normalizedDistance = distance / wakeLength;
  const velocityDeficit = Math.exp(-2 * normalizedDistance);
  
  return originalSpeed * (1 - 0.6 * velocityDeficit);
}

// Default physics configuration
export const DEFAULT_WIND_PHYSICS: WindPhysicsConfig = {
  windSpeed: 8,
  windAngle: 0,
  windElevation: 0,
  turbulenceIntensity: 0.3,
  turbulenceScale: 1.0,
  gustFrequency: 6,
  gustIntensity: 0.2,
  airDensity: 1.225,
  temperature: 15,
  humidity: 50,
  altitude: 0,
  surfaceRoughness: 0.3,
  referenceHeight: 10
};
