export interface WindGeneratorSpecs {
  type: string;
  design: string;
  height: number;
  diameter: number;
  efficiency: number;
  cutInSpeed: number;
  ratedSpeed: number;
  ratedPower: number;
  sustainabilityFocus: string;
}

export const GENERATOR_PRESETS: Record<string, WindGeneratorSpecs> = {
  "GE Haliade-X": {
    type: "Horizontal Axis",
    design: "GE Haliade-X 14",
    height: 150,
    diameter: 220,
    efficiency: 0.63,
    cutInSpeed: 3,
    ratedSpeed: 13.5,
    ratedPower: 14000000,
    sustainabilityFocus: "Reduced rare-earth metals, recyclable blades"
  },
  "Siemens Gamesa": {
    type: "Horizontal Axis",
    design: "Siemens Gamesa SG 14-222 DD",
    height: 150,
    diameter: 222,
    efficiency: 0.61,
    cutInSpeed: 3,
    ratedSpeed: 13,
    ratedPower: 14000000,
    sustainabilityFocus: "94% recyclable components"
  },
  "Vestas": {
    type: "Horizontal Axis",
    design: "Vestas V236-15.0 MW",
    height: 150,
    diameter: 236,
    efficiency: 0.60,
    cutInSpeed: 3,
    ratedSpeed: 13.5,
    ratedPower: 15000000,
    sustainabilityFocus: "Carbon-neutral production focus"
  },
  "Tree Vent": {
    type: "Vertical Axis",
    design: "Tree Vent (Inspired by Aeroleaf)",
    height: 15,
    diameter: 2,
    efficiency: 0.40,
    cutInSpeed: 2,
    ratedSpeed: 9,
    ratedPower: 500000,
    sustainabilityFocus: "Aesthetic integration in public spaces"
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
