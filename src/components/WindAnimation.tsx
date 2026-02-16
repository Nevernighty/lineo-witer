import React from "react";
import { WindSimulation3D } from "./wind-simulation/3D/WindSimulation3D";
import { type Lang } from "@/utils/i18n";

export interface WindAnimationProps {
  windSpeed: number;
  width?: number;
  height?: number;
  onWindSpeedChange?: (value: number) => void;
  lang?: Lang;
}

export const WindAnimation: React.FC<WindAnimationProps> = ({
  windSpeed: initialWindSpeed = 8,
  onWindSpeedChange,
  lang = 'ua'
}) => {
  return (
    <WindSimulation3D 
      windSpeed={initialWindSpeed}
      onWindSpeedChange={onWindSpeedChange}
      lang={lang}
    />
  );
};

export default WindAnimation;
