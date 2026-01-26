import React from "react";
import { WindSimulation3D } from "./wind-simulation/3D/WindSimulation3D";

export interface WindAnimationProps {
  windSpeed: number;
  width?: number;
  height?: number;
  onWindSpeedChange?: (value: number) => void;
}

export const WindAnimation: React.FC<WindAnimationProps> = ({
  windSpeed: initialWindSpeed = 8,
  onWindSpeedChange
}) => {
  return (
    <WindSimulation3D 
      windSpeed={initialWindSpeed}
      onWindSpeedChange={onWindSpeedChange}
    />
  );
};

export default WindAnimation;
