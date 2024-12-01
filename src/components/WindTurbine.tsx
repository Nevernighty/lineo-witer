import { RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

interface WindTurbineProps {
  windSpeed: number;
  generatorType: string;
}

export const WindTurbine = ({ windSpeed, generatorType }: WindTurbineProps) => {
  const [rotationSpeed, setRotationSpeed] = useState(0);

  useEffect(() => {
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
    <div className="relative h-48 flex items-center justify-center bg-stalker-dark/50 rounded-lg overflow-hidden">
      {/* Wind path visualization */}
      <div className="absolute inset-0 flex items-center">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-px bg-gradient-to-r from-transparent via-stalker-accent/30 to-transparent w-full animate-wind-flow"
            style={{
              animationDelay: `${i * 0.2}s`,
              transform: `translateY(${Math.sin(i) * 20}px)`
            }}
          />
        ))}
      </div>
      
      {/* Turbine */}
      <div className="relative z-10 bg-stalker-dark/80 rounded-full p-8">
        <RotateCw 
          className="text-stalker-accent" 
          size={48}
          style={{
            animation: `spin ${Math.max(20 - rotationSpeed, 1)}s linear infinite`,
          }}
        />
      </div>
      
      {/* Wind speed indicator */}
      <div className="absolute bottom-4 left-4 text-sm text-stalker-accent/80">
        {windSpeed.toFixed(1)} m/s
      </div>
    </div>
  );
};