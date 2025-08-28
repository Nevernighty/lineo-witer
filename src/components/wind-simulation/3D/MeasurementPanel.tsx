import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Obstacle, OBSTACLE_CATEGORIES } from '../types';

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
  // Calculate obstacle statistics
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
    <div className="absolute top-4 left-4 space-y-3 max-w-xs">
      {/* Wind Parameters */}
      <Card className="bg-slate-900/90 border-green-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-green-400">Wind Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Speed:</span>
            <span className="text-green-400">{windSpeed.toFixed(1)} m/s</span>
          </div>
          <Progress value={(windSpeed / 20) * 100} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Direction:</span>
            <span className="text-green-400">{windAngle}°</span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Elevation:</span>
            <span className="text-green-400">{windElevation}°</span>
          </div>
        </CardContent>
      </Card>

      {/* Collision Analysis */}
      <Card className="bg-slate-900/90 border-orange-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-orange-400">Collision Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Active:</span>
            <span className="text-orange-400">{activeCollisions}</span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Energy:</span>
            <span className="text-orange-400">{collisionEnergy.toFixed(1)} J</span>
          </div>
          <Progress value={Math.min((collisionEnergy / 1000) * 100, 100)} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Avg Resistance:</span>
            <span className="text-orange-400">{averageResistance.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Obstacle Statistics */}
      <Card className="bg-slate-900/90 border-blue-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-400">Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Particles:</span>
            <span className="text-blue-400">{particleCount}</span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Total Volume:</span>
            <span className="text-blue-400">{totalVolume.toFixed(0)} m³</span>
          </div>
          
          {obstacleStats.map(({ category, count, key }) => (
            count > 0 && (
              <div key={key} className="flex justify-between items-center text-xs">
                <span className="text-slate-300">{category}:</span>
                <Badge variant="outline" className="text-xs h-4">
                  {count}
                </Badge>
              </div>
            )
          ))}
        </CardContent>
      </Card>
    </div>
  );
};