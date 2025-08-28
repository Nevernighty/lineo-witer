
import React from "react";
import { WindSimulation3D } from "./wind-simulation/3D/WindSimulation3D";

export interface WindAnimationProps {
  windSpeed: number;
  width?: number;
  height?: number;
  onWindSpeedChange?: (value: number) => void;
}

export const WindAnimation: React.FC<WindAnimationProps> = ({
  windSpeed: initialWindSpeed = 1,
  width = 800,
  height = 400,
  onWindSpeedChange
}) => {
  return (
    <WindSimulation3D 
      windSpeed={initialWindSpeed}
      width={width}
      height={height}
    />
  );
};

export default WindAnimation;
