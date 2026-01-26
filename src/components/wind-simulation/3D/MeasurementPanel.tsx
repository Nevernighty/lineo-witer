import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Obstacle, OBSTACLE_CATEGORIES } from '../types';
import { Wind, Zap, Box, Activity } from 'lucide-react';

interface MeasurementPanelProps {
  windSpeed: number;
  windAngle: number;
  windElevation: number;
  particleCount: number;
  obstacles: Obstacle[];
  collisionEnergy: number;
  activeCollisions: number;
}

export const MeasurementPanel: React.FC<MeasurementPanelProps> = ({
  windSpeed,
  windAngle,
  windElevation,
  particleCount,
  obstacles,
  collisionEnergy,
  activeCollisions
}) => {
  const obstacleStats = Object.entries(OBSTACLE_CATEGORIES).map(([key, category]) => {
    const count = obstacles.filter(obs => 
      category.types.includes(obs.type)
    ).length;
    return { category: category.name, count, key };
  });

  const totalVolume = obstacles.reduce((sum, obs) => 
    sum + (obs.width * obs.height * obs.depth), 0
  );

  const averageResistance = obstacles.length > 0 
    ? obstacles.reduce((sum, obs) => sum + (obs.resistance || 1), 0) / obstacles.length
    : 0;

  return (
    <div className="absolute top-3 left-3 space-y-2 w-44 z-10">
      {/* Wind Parameters */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-primary/30 overflow-hidden shadow-lg shadow-primary/5">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 border-b border-primary/20">
          <Wind className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Wind</span>
        </div>
        <div className="p-2 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Speed</span>
            <span className="text-xs font-mono text-primary">{windSpeed.toFixed(1)} m/s</span>
          </div>
          <Progress value={(windSpeed / 25) * 100} className="h-1" />
          <div className="flex justify-between">
            <span className="text-[10px] text-muted-foreground">Dir</span>
            <span className="text-xs font-mono text-primary">{windAngle}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-muted-foreground">Elev</span>
            <span className="text-xs font-mono text-primary">{windElevation}°</span>
          </div>
        </div>
      </div>

      {/* Collision Analysis */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-orange-500/30 overflow-hidden shadow-lg shadow-orange-500/5">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-500/10 border-b border-orange-500/20">
          <Zap className="w-3 h-3 text-orange-400" />
          <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide">Collisions</span>
        </div>
        <div className="p-2 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Active</span>
            <span className="text-xs font-mono text-orange-400">{activeCollisions}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Energy</span>
            <span className="text-xs font-mono text-orange-400">{collisionEnergy.toFixed(1)} J</span>
          </div>
          <Progress value={Math.min((collisionEnergy / 500) * 100, 100)} className="h-1" />
          <div className="flex justify-between">
            <span className="text-[10px] text-muted-foreground">Resistance</span>
            <span className="text-xs font-mono text-orange-400">{averageResistance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-blue-500/30 overflow-hidden shadow-lg shadow-blue-500/5">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 border-b border-blue-500/20">
          <Box className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide">Environment</span>
        </div>
        <div className="p-2 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Particles</span>
            <span className="text-xs font-mono text-blue-400">{particleCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Volume</span>
            <span className="text-xs font-mono text-blue-400">{totalVolume.toFixed(0)} m³</span>
          </div>
          {obstacleStats.map(({ category, count, key }) => (
            count > 0 && (
              <div key={key} className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">{category}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-blue-400 border-blue-500/30">
                  {count}
                </Badge>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};
