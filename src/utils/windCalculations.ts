export interface WindGeneratorSpecs {
  type: 'small' | 'medium' | 'large';
  height: number;
  diameter: number;
  efficiency: number;
  cutInSpeed: number;
  cutOutSpeed: number;
  ratedSpeed: number;
  ratedPower: number;
}

export const GENERATOR_PRESETS: Record<string, WindGeneratorSpecs> = {
  small: {
    type: 'small',
    height: 10,
    diameter: 3,
    efficiency: 0.35,
    cutInSpeed: 3,
    cutOutSpeed: 25,
    ratedSpeed: 12,
    ratedPower: 1500
  },
  medium: {
    type: 'medium',
    height: 20,
    diameter: 7,
    efficiency: 0.40,
    cutInSpeed: 3.5,
    cutOutSpeed: 25,
    ratedSpeed: 13,
    ratedPower: 5000
  },
  large: {
    type: 'large',
    height: 40,
    diameter: 15,
    efficiency: 0.45,
    cutInSpeed: 4,
    cutOutSpeed: 25,
    ratedSpeed: 14,
    ratedPower: 10000
  }
};

export const calculatePowerOutput = (windSpeed: number, specs: WindGeneratorSpecs): number => {
  if (windSpeed < specs.cutInSpeed || windSpeed > specs.cutOutSpeed) {
    return 0;
  }

  const airDensity = 1.225; // kg/m³
  const rotorArea = Math.PI * Math.pow(specs.diameter / 2, 2);
  
  // Wind power formula: P = 1/2 * ρ * A * v³ * Cp
  let power = 0.5 * airDensity * rotorArea * Math.pow(windSpeed, 3) * specs.efficiency;
  
  // Cap at rated power
  return Math.min(power, specs.ratedPower);
};

export const calculateHeightAdjustedWindSpeed = (
  baseWindSpeed: number,
  baseHeight: number,
  targetHeight: number
): number => {
  // Wind shear coefficient (typical value for open land)
  const alpha = 0.143;
  
  // Power law wind profile equation
  return baseWindSpeed * Math.pow(targetHeight / baseHeight, alpha);
};