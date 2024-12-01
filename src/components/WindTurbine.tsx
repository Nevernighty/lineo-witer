import { RotateCw, Wind } from "lucide-react";
import { useEffect, useState } from "react";

interface WindTurbineProps {
  windSpeed: number;
  generatorType: string;
}

export const WindTurbine = ({ windSpeed, generatorType }: WindTurbineProps) => {
  const [rotationSpeed, setRotationSpeed] = useState(0);

  useEffect(() => {
    // Calculate rotation speed based on wind speed and generator type
    let speedMultiplier = 1;
    switch (generatorType) {
      case "small":
        speedMultiplier = 2;
        break;
      case "medium":
        speedMultiplier = 1.5;
        break;
      case "large":
        speedMultiplier = 1;
        break;
      default:
        speedMultiplier = 1;
    }
    
    setRotationSpeed(windSpeed * speedMultiplier);
  }, [windSpeed, generatorType]);

  return (
    <div className="relative flex items-center justify-center p-4">
      <Wind className="absolute text-stalker-accent/30 animate-pulse" size={48} />
      <RotateCw 
        className="text-stalker-accent" 
        size={32}
        style={{
          animation: `spin ${Math.max(20 - rotationSpeed, 1)}s linear infinite`,
        }}
      />
    </div>
  );
};