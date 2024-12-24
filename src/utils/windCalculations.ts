export interface WindGeneratorSpecs {
  type: string;
  height: number;
  efficiency: number;
  rotorDiameter: number;
  cutInSpeed: number;
  cutOutSpeed: number;
  optimalWindSpeed: number;
  axisOrientation: "horizontal" | "vertical";
  bladeDesign: "three-blade" | "two-blade" | "darrieus" | "savonius";
  installationType: "rooftop" | "freestanding" | "hybrid";
  powerCategory: "micro" | "small" | "medium";
  purpose: "off-grid" | "grid-tied";
  material: "lightweight" | "eco-friendly";
}

export const GENERATOR_PRESETS: Record<string, WindGeneratorSpecs> = {
  "Bergey Excel 10": {
    type: "Horizontal Axis",
    height: 30,
    efficiency: 0.45,
    rotorDiameter: 7,
    cutInSpeed: 2.5,
    cutOutSpeed: 25,
    optimalWindSpeed: 12,
    axisOrientation: "horizontal",
    bladeDesign: "three-blade",
    installationType: "freestanding",
    powerCategory: "medium",
    purpose: "grid-tied",
    material: "eco-friendly"
  },
  "Windspire 1.2": {
    type: "Vertical Axis",
    height: 20,
    efficiency: 0.35,
    rotorDiameter: 2,
    cutInSpeed: 3.5,
    cutOutSpeed: 25,
    optimalWindSpeed: 10,
    axisOrientation: "vertical",
    bladeDesign: "darrieus",
    installationType: "rooftop",
    powerCategory: "small",
    purpose: "grid-tied",
    material: "lightweight"
  },
  "GE Haliade-X 14": {
    type: "Horizontal Axis",
    height: 150,
    efficiency: 0.63,
    rotorDiameter: 220,
    cutInSpeed: 3,
    cutOutSpeed: 25,
    optimalWindSpeed: 13.5,
    axisOrientation: "horizontal",
    bladeDesign: "three-blade",
    installationType: "freestanding",
    powerCategory: "medium",
    purpose: "grid-tied",
    material: "eco-friendly"
  },
  "small": {
    type: "Small Wind Turbine",
    height: 30,
    efficiency: 0.4,
    rotorDiameter: 10,
    cutInSpeed: 3,
    cutOutSpeed: 25,
    optimalWindSpeed: 12,
    axisOrientation: "horizontal",
    bladeDesign: "three-blade",
    installationType: "rooftop",
    powerCategory: "micro",
    purpose: "off-grid",
    material: "lightweight"
  },
  "medium": {
    type: "Medium Wind Turbine",
    height: 50,
    efficiency: 0.5,
    rotorDiameter: 15,
    cutInSpeed: 3,
    cutOutSpeed: 25,
    optimalWindSpeed: 13,
    axisOrientation: "horizontal",
    bladeDesign: "three-blade",
    installationType: "freestanding",
    powerCategory: "small",
    purpose: "grid-tied",
    material: "eco-friendly"
  },
  "large": {
    type: "Large Wind Turbine",
    height: 80,
    efficiency: 0.6,
    rotorDiameter: 25,
    cutInSpeed: 3,
    cutOutSpeed: 25,
    optimalWindSpeed: 14,
    axisOrientation: "horizontal",
    bladeDesign: "three-blade",
    installationType: "freestanding",
    powerCategory: "medium",
    purpose: "grid-tied",
    material: "eco-friendly"
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
