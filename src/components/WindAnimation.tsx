
import React from "react";
import { SimpleWindAnimation } from "./wind-simulation/SimpleWindAnimation";

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
    <SimpleWindAnimation 
      windSpeed={initialWindSpeed}
      width={width}
      height={height}
    />
  );
};

export default WindAnimation;
