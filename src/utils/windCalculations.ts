export interface WindGeneratorSpecs {
  type: string;
  height: number;
  efficiency: number;
  ratedPower: number;
  rotorDiameter: number;
  cutInSpeed: number;
  cutOutSpeed: number;
  optimalWindSpeed: number;
  sustainabilityFocus: string;
}

export const GENERATOR_PRESETS: Record<string, WindGeneratorSpecs> = {
  "GE Haliade-X 14": {
    type: "Horizontal Axis",
    height: 150,
    efficiency: 0.63,
    ratedPower: 14000000, // 14 MW in watts
    rotorDiameter: 220,
    cutInSpeed: 3,
    cutOutSpeed: 25,
    optimalWindSpeed: 13.5,
    sustainabilityFocus: "Reduced rare-earth metals, recyclable blades"
  },
  "small": {
    type: "Small Wind Turbine",
    height: 30,
    efficiency: 0.4,
    ratedPower: 5000, // 5 kW in watts
    rotorDiameter: 10,
    cutInSpeed: 3,
    cutOutSpeed: 25,
    optimalWindSpeed: 12,
    sustainabilityFocus: "Compact design, suitable for residential use"
  },
  "medium": {
    type: "Medium Wind Turbine",
    height: 50,
    efficiency: 0.5,
    ratedPower: 20000, // 20 kW in watts
    rotorDiameter: 15,
    cutInSpeed: 3,
    cutOutSpeed: 25,
    optimalWindSpeed: 13,
    sustainabilityFocus: "Balanced performance for small communities"
  },
  "large": {
    type: "Large Wind Turbine",
    height: 80,
    efficiency: 0.6,
    ratedPower: 100000, // 100 kW in watts
    rotorDiameter: 25,
    cutInSpeed: 3,
    cutOutSpeed: 25,
    optimalWindSpeed: 14,
    sustainabilityFocus: "High output for commercial use"
  },
};

export const calculateHeightAdjustedWindSpeed = (
  windSpeed: number,
  referenceHeight: number,
  actualHeight: number
): number => {
  // Wind shear coefficient (typically 0.143 for open land)
  const alpha = 0.143;
  return windSpeed * Math.pow(actualHeight / referenceHeight, alpha);
};

export const calculatePowerOutput = (
  windSpeed: number,
  specs: WindGeneratorSpecs
): number => {
  // Air density at sea level (kg/m³)
  const airDensity = 1.225;
  
  // Rotor swept area (m²)
  const area = Math.PI * Math.pow(specs.rotorDiameter / 2, 2);
  
  // Check if wind speed is within operational range
  if (windSpeed < specs.cutInSpeed || windSpeed > specs.cutOutSpeed) {
    return 0;
  }
  
  // Calculate theoretical power
  const theoreticalPower = 0.5 * airDensity * area * Math.pow(windSpeed, 3);
  
  // Apply efficiency and limit to rated power
  const actualPower = theoreticalPower * specs.efficiency;
  return Math.min(actualPower, specs.ratedPower);
};
