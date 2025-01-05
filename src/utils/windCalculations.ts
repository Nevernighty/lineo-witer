export interface WindGeneratorSpecs {
  bladeLength: number;
  efficiency: number;
  ratedPower: number;
  cutInSpeed: number;
  cutOutSpeed: number;
  optimalWindSpeed: number;
  height: number;
  material: string;
  bladedesign: string;
  installationtype: string;
  powercategory: string;
  purpose: string;
}

export const calculateHeightAdjustedWindSpeed = (
  baseWindSpeed: number,
  baseHeight: number,
  targetHeight: number
): number => {
  // Wind shear coefficient (typical value for neutral stability conditions)
  const alpha = 0.143;
  
  // Power law equation for wind speed variation with height
  return baseWindSpeed * Math.pow(targetHeight / baseHeight, alpha);
};

export const calculatePowerOutput = (windSpeed: number, specs: WindGeneratorSpecs): number => {
  if (windSpeed < specs.cutInSpeed || windSpeed > specs.cutOutSpeed) {
    return 0;
  }

  // Air density at sea level (kg/m³)
  const airDensity = 1.225;
  
  // Swept area of the turbine (m²)
  const sweptArea = Math.PI * Math.pow(specs.bladeLength, 2);
  
  // Basic power calculation using the power equation
  // P = 0.5 * ρ * A * v³ * Cp
  // where ρ is air density, A is swept area, v is wind speed, Cp is power coefficient
  let power = 0.5 * airDensity * sweptArea * Math.pow(windSpeed, 3) * specs.efficiency;
  
  // Apply efficiency curve
  const normalizedSpeed = (windSpeed - specs.cutInSpeed) / (specs.optimalWindSpeed - specs.cutInSpeed);
  const efficiencyFactor = Math.exp(-Math.pow(normalizedSpeed - 1, 2));
  power *= efficiencyFactor;
  
  // Cap at rated power
  return Math.min(power, specs.ratedPower);
};

export const GENERATOR_PRESETS: { [key: string]: WindGeneratorSpecs } = {
  "GE Haliade-X 14": {
    bladeLength: 107,
    efficiency: 0.63,
    ratedPower: 14000000, // 14 MW
    cutInSpeed: 3,
    cutOutSpeed: 25,
    optimalWindSpeed: 12,
    height: 150,
    material: "composite",
    bladedesign: "three-blade",
    installationtype: "freestanding",
    powercategory: "medium",
    purpose: "grid-tied"
  }
};