import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Obstacle, OBSTACLE_CATEGORIES } from '../types';
import { WindPhysicsConfig, OBSTACLE_DRAG_COEFFICIENTS, calculateAirDensity } from './WindPhysicsEngine';
import { Wind, Zap, Box, Gauge, Thermometer, ArrowUpRight } from 'lucide-react';

interface AdvancedMeasurementPanelProps {
  config: WindPhysicsConfig;
  particleCount: number;
  obstacles: Obstacle[];
  collisionEnergy: number;
  activeCollisions: number;
}

export const AdvancedMeasurementPanel: React.FC<AdvancedMeasurementPanelProps> = ({
  config,
  particleCount,
  obstacles,
  collisionEnergy,
  activeCollisions
}) => {
  // Calculate advanced metrics
  const metrics = useMemo(() => {
    // Wind power density: P = 0.5 * ρ * v³ (W/m²)
    const windPowerDensity = 0.5 * config.airDensity * Math.pow(config.windSpeed, 3);
    
    // Calculate total drag coefficient of obstacles
    const totalDrag = obstacles.reduce((sum, obs) => {
      const physics = OBSTACLE_DRAG_COEFFICIENTS[obs.type] || OBSTACLE_DRAG_COEFFICIENTS.building;
      return sum + physics.dragCoefficient * obs.width * obs.height;
    }, 0);
    
    // Blockage ratio
    const totalArea = 100 * 50; // simulation area
    const obstacleArea = obstacles.reduce((sum, obs) => sum + obs.width * obs.height, 0);
    const blockageRatio = (obstacleArea / totalArea) * 100;
    
    // Reynolds number approximation
    const characteristicLength = obstacles.length > 0 
      ? obstacles.reduce((sum, obs) => sum + obs.width, 0) / obstacles.length 
      : 10;
    const kinematicViscosity = 1.5e-5; // m²/s for air at 20°C
    const reynoldsNumber = (config.windSpeed * characteristicLength) / kinematicViscosity;
    
    // Calculated air density based on altitude
    const calculatedDensity = calculateAirDensity(config.altitude, config.temperature);
    
    return {
      windPowerDensity,
      totalDrag,
      blockageRatio,
      reynoldsNumber,
      calculatedDensity
    };
  }, [config, obstacles]);

  const obstacleStats = Object.entries(OBSTACLE_CATEGORIES).map(([key, category]) => {
    const count = obstacles.filter(obs => category.types.includes(obs.type)).length;
    return { category: category.name, count, key };
  });

  const totalVolume = obstacles.reduce((sum, obs) => 
    sum + (obs.width * obs.height * obs.depth), 0
  );

  return (
    <div className="absolute top-3 left-3 space-y-1.5 w-44 z-10">
      {/* Wind Power */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-primary/30 overflow-hidden shadow-lg">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border-b border-primary/20">
          <Wind className="w-3 h-3 text-primary" />
          <span className="text-[9px] font-semibold text-primary uppercase tracking-wide">Wind Power</span>
        </div>
        <div className="p-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">Speed</span>
            <span className="text-[10px] font-mono text-primary">{config.windSpeed.toFixed(1)} m/s</span>
          </div>
          <Progress value={(config.windSpeed / 30) * 100} className="h-0.5" />
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">Power Density</span>
            <span className="text-[10px] font-mono text-primary">{metrics.windPowerDensity.toFixed(0)} W/m²</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">Direction</span>
            <div className="flex items-center gap-1">
              <ArrowUpRight 
                className="w-3 h-3 text-primary" 
                style={{ transform: `rotate(${config.windAngle - 45}deg)` }}
              />
              <span className="text-[10px] font-mono text-primary">{config.windAngle}°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Atmospheric */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-cyan-500/30 overflow-hidden shadow-lg">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border-b border-cyan-500/20">
          <Thermometer className="w-3 h-3 text-cyan-400" />
          <span className="text-[9px] font-semibold text-cyan-400 uppercase tracking-wide">Atmosphere</span>
        </div>
        <div className="p-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">ρ (density)</span>
            <span className="text-[10px] font-mono text-cyan-400">{config.airDensity.toFixed(3)} kg/m³</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">Turbulence</span>
            <span className="text-[10px] font-mono text-cyan-400">{(config.turbulenceIntensity * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">Roughness</span>
            <span className="text-[10px] font-mono text-cyan-400">{config.surfaceRoughness.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Collision Physics */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-orange-500/30 overflow-hidden shadow-lg">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 border-b border-orange-500/20">
          <Zap className="w-3 h-3 text-orange-400" />
          <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide">Collisions</span>
        </div>
        <div className="p-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">Energy</span>
            <span className="text-[10px] font-mono text-orange-400">{collisionEnergy.toFixed(1)} J</span>
          </div>
          <Progress value={Math.min((collisionEnergy / 1000) * 100, 100)} className="h-0.5" />
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">Total Cd</span>
            <span className="text-[10px] font-mono text-orange-400">{metrics.totalDrag.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">Blockage</span>
            <span className="text-[10px] font-mono text-orange-400">{metrics.blockageRatio.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-blue-500/30 overflow-hidden shadow-lg">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border-b border-blue-500/20">
          <Box className="w-3 h-3 text-blue-400" />
          <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide">Scene</span>
        </div>
        <div className="p-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">Particles</span>
            <span className="text-[10px] font-mono text-blue-400">{particleCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">Volume</span>
            <span className="text-[10px] font-mono text-blue-400">{totalVolume.toFixed(0)} m³</span>
          </div>
          {obstacleStats.map(({ category, count, key }) => (
            count > 0 && (
              <div key={key} className="flex justify-between items-center">
                <span className="text-[9px] text-muted-foreground">{category}</span>
                <Badge variant="outline" className="text-[9px] h-3.5 px-1 text-blue-400 border-blue-500/30">
                  {count}
                </Badge>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Reynolds Number (small indicator) */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-purple-500/30 px-2 py-1.5 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Gauge className="w-3 h-3 text-purple-400" />
            <span className="text-[9px] text-muted-foreground">Re</span>
          </div>
          <span className="text-[10px] font-mono text-purple-400">
            {metrics.reynoldsNumber >= 1e6 
              ? `${(metrics.reynoldsNumber / 1e6).toFixed(1)}M` 
              : `${(metrics.reynoldsNumber / 1e3).toFixed(0)}k`}
          </span>
        </div>
      </div>
    </div>
  );
};
