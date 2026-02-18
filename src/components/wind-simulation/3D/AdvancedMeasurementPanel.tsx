import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Obstacle, OBSTACLE_CATEGORIES } from '../types';
import { WindPhysicsConfig, OBSTACLE_DRAG_COEFFICIENTS } from './WindPhysicsEngine';
import { Wind, Zap, Box, Thermometer, ArrowUpRight } from 'lucide-react';
import { t, type Lang } from '@/utils/i18n';

interface AdvancedMeasurementPanelProps {
  config: WindPhysicsConfig;
  particleCount: number;
  obstacles: Obstacle[];
  collisionEnergy: number;
  activeCollisions: number;
  generatorPower?: number;
  lang: Lang;
}

export const AdvancedMeasurementPanel: React.FC<AdvancedMeasurementPanelProps> = ({
  config, particleCount, obstacles, collisionEnergy, activeCollisions, generatorPower = 0, lang
}) => {
  const metrics = useMemo(() => {
    const windPowerDensity = 0.5 * config.airDensity * Math.pow(config.windSpeed, 3);
    const totalDrag = obstacles.reduce((sum, obs) => {
      const physics = OBSTACLE_DRAG_COEFFICIENTS[obs.type] || OBSTACLE_DRAG_COEFFICIENTS.building;
      return sum + physics.dragCoefficient * obs.width * obs.height;
    }, 0);
    const totalArea = 100 * 50;
    const obstacleArea = obstacles.reduce((sum, obs) => sum + obs.width * obs.height, 0);
    const blockageRatio = (obstacleArea / totalArea) * 100;
    return { windPowerDensity, totalDrag, blockageRatio };
  }, [config, obstacles]);

  const obstacleStats = Object.entries(OBSTACLE_CATEGORIES).map(([key, category]) => {
    const count = obstacles.filter(obs => category.types.includes(obs.type)).length;
    return { category: t(key === 'structure' ? 'structures' : key, lang), count, key };
  });

  const totalVolume = obstacles.reduce((sum, obs) => sum + (obs.width * obs.height * obs.depth), 0);
  const generatorCount = obstacles.filter(o => o.type === 'wind_generator').length;

  const powerStr = generatorPower >= 1000 ? `${(generatorPower / 1000).toFixed(1)} kW` : `${generatorPower.toFixed(0)} W`;

  return (
    <div className="absolute top-3 left-3 space-y-1.5 w-44 z-10">
      {/* Wind Power */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-primary/30 overflow-hidden shadow-lg">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border-b border-primary/20">
          <Wind className="w-3 h-3 text-primary" />
          <span className="text-[9px] font-semibold text-primary uppercase tracking-wide">{t('windPower', lang)}</span>
        </div>
        <div className="p-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">{t('speed', lang)}</span>
            <span className="text-[10px] font-mono text-primary">{config.windSpeed.toFixed(1)} m/s</span>
          </div>
          <Progress value={(config.windSpeed / 30) * 100} className="h-0.5" />
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">{t('powerDensity', lang)}</span>
            <span className="text-[10px] font-mono text-primary">{metrics.windPowerDensity.toFixed(0)} W/m²</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">{t('direction', lang)}</span>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-primary" style={{ transform: `rotate(${config.windAngle - 45}deg)` }} />
              <span className="text-[10px] font-mono text-primary">{config.windAngle}°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Atmosphere */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-cyan-500/30 overflow-hidden shadow-lg">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border-b border-cyan-500/20">
          <Thermometer className="w-3 h-3 text-cyan-400" />
          <span className="text-[9px] font-semibold text-cyan-400 uppercase tracking-wide">{t('atmosphere', lang)}</span>
        </div>
        <div className="p-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">{t('density', lang)}</span>
            <span className="text-[10px] font-mono text-cyan-400">{config.airDensity.toFixed(3)} kg/m³</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">{t('turbulence', lang)}</span>
            <span className="text-[10px] font-mono text-cyan-400">{(config.turbulenceIntensity * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">{t('roughness', lang)}</span>
            <span className="text-[10px] font-mono text-cyan-400">{config.surfaceRoughness.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">{t('tempImpactTitle', lang)}</span>
            <span className="text-[10px] font-mono text-cyan-400">
              {((config.airDensity / 1.225 - 1) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Collisions */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-orange-500/30 overflow-hidden shadow-lg">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 border-b border-orange-500/20">
          <Zap className="w-3 h-3 text-orange-400" />
          <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide">{t('collisions', lang)}</span>
        </div>
        <div className="p-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">{t('collisionEnergy', lang)}</span>
            <span className="text-[10px] font-mono text-orange-400">{collisionEnergy.toFixed(1)} J</span>
          </div>
          <Progress value={Math.min((collisionEnergy / 1000) * 100, 100)} className="h-0.5" />
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">{t('totalCd', lang)}</span>
            <span className="text-[10px] font-mono text-orange-400">{metrics.totalDrag.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">{t('blockage', lang)}</span>
            <span className="text-[10px] font-mono text-orange-400">{metrics.blockageRatio.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-blue-500/30 overflow-hidden shadow-lg">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border-b border-blue-500/20">
          <Box className="w-3 h-3 text-blue-400" />
          <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide">{t('environment', lang)}</span>
        </div>
        <div className="p-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">{t('particles', lang)}</span>
            <span className="text-[10px] font-mono text-blue-400">{particleCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">{t('volume', lang)}</span>
            <span className="text-[10px] font-mono text-blue-400">{totalVolume.toFixed(0)} m³</span>
          </div>
          {obstacleStats.map(({ category, count, key }) => (
            count > 0 && (
              <div key={key} className="flex justify-between items-center">
                <span className="text-[9px] text-muted-foreground">{category}</span>
                <Badge variant="outline" className="text-[9px] h-3.5 px-1 text-blue-400 border-blue-500/30">{count}</Badge>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Generators */}
      {generatorCount > 0 && (
        <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-green-500/30 overflow-hidden shadow-lg">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border-b border-green-500/20">
            <Zap className="w-3 h-3 text-green-400" />
            <span className="text-[9px] font-semibold text-green-400 uppercase tracking-wide">{t('generators', lang)}</span>
          </div>
          <div className="p-2 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-muted-foreground">×{generatorCount}</span>
              <span className="text-[10px] font-mono text-green-400">⚡ {powerStr}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
