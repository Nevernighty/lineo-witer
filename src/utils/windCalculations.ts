export interface WindGeneratorSpecs {
  bladeLength: number;
  efficiency: number;
  ratedPower: number;
  cutInSpeed: number;
  cutOutSpeed: number;
  optimalWindSpeed: number;
  materialType: string;
}

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

export const getMaterialEfficiency = (materialType: string): number => {
  const efficiencies: { [key: string]: number } = {
    'composite': 0.85,
    'aluminum': 0.75,
    'steel': 0.70,
    'wood': 0.60,
    'plastic': 0.65,
    'carbon-fiber': 0.90
  };
  
  return efficiencies[materialType] || 0.70;
};

export const calculateAnnualEnergy = (
  averageWindSpeed: number,
  specs: WindGeneratorSpecs
): number => {
  const hoursInYear = 8760;
  const availabilityFactor = 0.95; // Typical availability factor
  
  // Calculate power output at average wind speed
  const averagePower = calculatePowerOutput(averageWindSpeed, specs);
  
  // Annual energy in kWh
  return averagePower * hoursInYear * availabilityFactor / 1000;
};

export const getOptimalTowerHeight = (
  bladeLength: number,
  terrainRoughness: number
): number => {
  // Minimum tower height based on blade length
  const minHeight = bladeLength * 1.5;
  
  // Additional height based on terrain roughness (0-1)
  const additionalHeight = terrainRoughness * bladeLength * 2;
  
  return minHeight + additionalHeight;
};

export const calculatePaybackPeriod = (
  installationCost: number,
  annualEnergy: number,
  electricityPrice: number
): number => {
  const annualRevenue = annualEnergy * electricityPrice;
  return installationCost / annualRevenue;
};

export const getWindSpeedAtHeight = (
  referenceWindSpeed: number,
  referenceHeight: number,
  targetHeight: number,
  roughnessLength: number
): number => {
  // Wind shear calculation using log law
  return referenceWindSpeed * 
    (Math.log(targetHeight / roughnessLength) / Math.log(referenceHeight / roughnessLength));
};