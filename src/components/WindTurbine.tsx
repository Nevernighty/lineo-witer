import { RotateCw, Compass } from "lucide-react";
import { useEffect, useState } from "react";
import { calculatePowerOutput, calculateHeightAdjustedWindSpeed, type WindGeneratorSpecs } from "@/utils/windCalculations";

interface WindTurbineProps {
  windSpeed: number;
  generatorSpecs: WindGeneratorSpecs;
}

export const WindTurbine = ({ windSpeed, generatorSpecs }: WindTurbineProps) => {
  const [rotationSpeed, setRotationSpeed] = useState(0);
  const [adjustedWindSpeed, setAdjustedWindSpeed] = useState(windSpeed);
  const [power, setPower] = useState(0);
  const MAX_ROTATION_SPEED = 20;

  useEffect(() => {
    const adjusted = calculateHeightAdjustedWindSpeed(windSpeed, 10, generatorSpecs.height);
    setAdjustedWindSpeed(adjusted);
    
    const powerOutput = calculatePowerOutput(adjusted, generatorSpecs);
    setPower(powerOutput);
    
    const speedFactor = Math.min(adjusted / generatorSpecs.optimalWindSpeed, 1);
    setRotationSpeed(MAX_ROTATION_SPEED * speedFactor);
  }, [windSpeed, generatorSpecs]);

  return (
    <div className="relative h-48 flex items-center justify-center bg-stalker-dark/50 rounded-lg overflow-hidden">
      {/* Wind vectors */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${50 + 30 * Math.cos(i * Math.PI / 4)}%`,
              top: `${50 + 30 * Math.sin(i * Math.PI / 4)}%`,
              transform: `rotate(${i * 45}deg)`,
            }}
          >
            <div
              className="h-px bg-stalker-accent/30"
              style={{
                width: `${Math.min(adjustedWindSpeed * 5, 30)}px`,
                transition: "width 0.3s ease-out"
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Compass marks */}
      <div className="absolute inset-0">
        <Compass className="absolute top-2 left-2 text-stalker-muted/30" size={16} />
        {["N", "E", "S", "W"].map((direction, i) => (
          <span
            key={direction}
            className="absolute text-xs text-stalker-muted/50"
            style={{
              left: `${50 + 40 * Math.cos(i * Math.PI / 2)}%`,
              top: `${50 + 40 * Math.sin(i * Math.PI / 2)}%`,
              transform: "translate(-50%, -50%)"
            }}
          >
            {direction}
          </span>
        ))}
      </div>
      
      {/* Interactive turbine */}
      <button 
        className="relative z-10 bg-stalker-dark/80 rounded-full p-8 hover:bg-stalker-dark transition-colors group"
        onClick={() => setRotationSpeed(prev => prev > 0 ? 0 : MAX_ROTATION_SPEED)}
      >
        <RotateCw 
          className="text-stalker-accent group-hover:scale-110 transition-transform" 
          size={48}
          style={{
            animation: rotationSpeed > 0 ? `spin ${Math.max(20 - rotationSpeed, 1)}s linear infinite` : "none",
          }}
        />
      </button>
      
      {/* Wind speed and power output indicators */}
      <div className="absolute bottom-4 left-4 space-y-1">
        <div className="text-sm text-stalker-accent/80">
          Wind: {adjustedWindSpeed.toFixed(1)} m/s
        </div>
        <div className="text-sm text-stalker-accent/80">
          Power: {power.toFixed(0)}W
        </div>
      </div>
    </div>
  );
};
