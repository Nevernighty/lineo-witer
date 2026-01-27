import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wind, Waves, Thermometer, Mountain, RotateCcw } from 'lucide-react';
import { WindPhysicsConfig, DEFAULT_WIND_PHYSICS } from './WindPhysicsEngine';
import { OBSTACLE_CATEGORIES, ObstacleType } from '../types';

interface AdvancedWindControlsProps {
  config: WindPhysicsConfig;
  onConfigChange: (config: WindPhysicsConfig) => void;
  selectedObstacleType: string;
  onObstacleTypeChange: (type: string) => void;
  onClearObstacles: () => void;
  onToggleStats: () => void;
  showStats: boolean;
}

export const AdvancedWindControls: React.FC<AdvancedWindControlsProps> = ({
  config,
  onConfigChange,
  selectedObstacleType,
  onObstacleTypeChange,
  onClearObstacles,
  onToggleStats,
  showStats
}) => {
  const updateConfig = (key: keyof WindPhysicsConfig, value: number) => {
    onConfigChange({ ...config, [key]: value });
  };

  const resetToDefaults = () => {
    onConfigChange(DEFAULT_WIND_PHYSICS);
  };

  return (
    <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-primary/30 shadow-lg overflow-hidden">
      <Tabs defaultValue="wind" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-8 rounded-none border-b border-border/30">
          <TabsTrigger value="wind" className="text-[10px] data-[state=active]:bg-primary/20">
            <Wind className="w-3 h-3" />
          </TabsTrigger>
          <TabsTrigger value="turb" className="text-[10px] data-[state=active]:bg-primary/20">
            <Waves className="w-3 h-3" />
          </TabsTrigger>
          <TabsTrigger value="atmo" className="text-[10px] data-[state=active]:bg-primary/20">
            <Thermometer className="w-3 h-3" />
          </TabsTrigger>
          <TabsTrigger value="terrain" className="text-[10px] data-[state=active]:bg-primary/20">
            <Mountain className="w-3 h-3" />
          </TabsTrigger>
        </TabsList>

        {/* Wind Tab */}
        <TabsContent value="wind" className="p-2.5 space-y-2 mt-0">
          <div>
            <Label className="text-[10px] text-primary font-semibold uppercase tracking-wide flex justify-between">
              <span>Speed</span>
              <span className="text-muted-foreground font-mono">{config.windSpeed.toFixed(1)} m/s</span>
            </Label>
            <Slider
              value={[config.windSpeed]}
              onValueChange={(v) => updateConfig('windSpeed', v[0])}
              min={0}
              max={30}
              step={0.5}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-[10px] text-primary font-semibold uppercase tracking-wide flex justify-between">
              <span>Direction</span>
              <span className="text-muted-foreground font-mono">{config.windAngle}°</span>
            </Label>
            <Slider
              value={[config.windAngle]}
              onValueChange={(v) => updateConfig('windAngle', v[0])}
              min={0}
              max={360}
              step={5}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-[10px] text-primary font-semibold uppercase tracking-wide flex justify-between">
              <span>Elevation</span>
              <span className="text-muted-foreground font-mono">{config.windElevation}°</span>
            </Label>
            <Slider
              value={[config.windElevation]}
              onValueChange={(v) => updateConfig('windElevation', v[0])}
              min={-45}
              max={45}
              step={5}
              className="mt-1"
            />
          </div>
        </TabsContent>

        {/* Turbulence Tab */}
        <TabsContent value="turb" className="p-2.5 space-y-2 mt-0">
          <div>
            <Label className="text-[10px] text-primary font-semibold uppercase tracking-wide flex justify-between">
              <span>Intensity</span>
              <span className="text-muted-foreground font-mono">{(config.turbulenceIntensity * 100).toFixed(0)}%</span>
            </Label>
            <Slider
              value={[config.turbulenceIntensity]}
              onValueChange={(v) => updateConfig('turbulenceIntensity', v[0])}
              min={0}
              max={1}
              step={0.05}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-[10px] text-primary font-semibold uppercase tracking-wide flex justify-between">
              <span>Scale</span>
              <span className="text-muted-foreground font-mono">{config.turbulenceScale.toFixed(1)}x</span>
            </Label>
            <Slider
              value={[config.turbulenceScale]}
              onValueChange={(v) => updateConfig('turbulenceScale', v[0])}
              min={0.1}
              max={3}
              step={0.1}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-[10px] text-primary font-semibold uppercase tracking-wide flex justify-between">
              <span>Gust Freq</span>
              <span className="text-muted-foreground font-mono">{config.gustFrequency}/min</span>
            </Label>
            <Slider
              value={[config.gustFrequency]}
              onValueChange={(v) => updateConfig('gustFrequency', v[0])}
              min={0}
              max={20}
              step={1}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-[10px] text-primary font-semibold uppercase tracking-wide flex justify-between">
              <span>Gust Power</span>
              <span className="text-muted-foreground font-mono">{(config.gustIntensity * 100).toFixed(0)}%</span>
            </Label>
            <Slider
              value={[config.gustIntensity]}
              onValueChange={(v) => updateConfig('gustIntensity', v[0])}
              min={0}
              max={1}
              step={0.05}
              className="mt-1"
            />
          </div>
        </TabsContent>

        {/* Atmosphere Tab */}
        <TabsContent value="atmo" className="p-2.5 space-y-2 mt-0">
          <div>
            <Label className="text-[10px] text-primary font-semibold uppercase tracking-wide flex justify-between">
              <span>Temperature</span>
              <span className="text-muted-foreground font-mono">{config.temperature}°C</span>
            </Label>
            <Slider
              value={[config.temperature]}
              onValueChange={(v) => updateConfig('temperature', v[0])}
              min={-20}
              max={45}
              step={1}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-[10px] text-primary font-semibold uppercase tracking-wide flex justify-between">
              <span>Humidity</span>
              <span className="text-muted-foreground font-mono">{config.humidity}%</span>
            </Label>
            <Slider
              value={[config.humidity]}
              onValueChange={(v) => updateConfig('humidity', v[0])}
              min={0}
              max={100}
              step={5}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-[10px] text-primary font-semibold uppercase tracking-wide flex justify-between">
              <span>Altitude</span>
              <span className="text-muted-foreground font-mono">{config.altitude}m</span>
            </Label>
            <Slider
              value={[config.altitude]}
              onValueChange={(v) => updateConfig('altitude', v[0])}
              min={0}
              max={3000}
              step={100}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-[10px] text-primary font-semibold uppercase tracking-wide flex justify-between">
              <span>Air Density</span>
              <span className="text-muted-foreground font-mono">{config.airDensity.toFixed(3)} kg/m³</span>
            </Label>
            <Slider
              value={[config.airDensity]}
              onValueChange={(v) => updateConfig('airDensity', v[0])}
              min={0.8}
              max={1.5}
              step={0.01}
              className="mt-1"
            />
          </div>
        </TabsContent>

        {/* Terrain Tab */}
        <TabsContent value="terrain" className="p-2.5 space-y-2 mt-0">
          <div>
            <Label className="text-[10px] text-primary font-semibold uppercase tracking-wide flex justify-between">
              <span>Surface Roughness</span>
              <span className="text-muted-foreground font-mono">{config.surfaceRoughness.toFixed(2)}</span>
            </Label>
            <Slider
              value={[config.surfaceRoughness]}
              onValueChange={(v) => updateConfig('surfaceRoughness', v[0])}
              min={0.001}
              max={2}
              step={0.01}
              className="mt-1"
            />
            <div className="flex justify-between text-[8px] text-muted-foreground mt-0.5">
              <span>Water</span>
              <span>Open</span>
              <span>Urban</span>
            </div>
          </div>
          
          <div>
            <Label className="text-[10px] text-primary font-semibold uppercase tracking-wide flex justify-between">
              <span>Ref. Height</span>
              <span className="text-muted-foreground font-mono">{config.referenceHeight}m</span>
            </Label>
            <Slider
              value={[config.referenceHeight]}
              onValueChange={(v) => updateConfig('referenceHeight', v[0])}
              min={1}
              max={100}
              step={1}
              className="mt-1"
            />
          </div>

          <div className="pt-1.5 border-t border-border/30">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Obstacle</Label>
            <Select value={selectedObstacleType} onValueChange={onObstacleTypeChange}>
              <SelectTrigger className="h-7 text-xs mt-0.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OBSTACLE_CATEGORIES).map(([_, category]) => 
                  category.types.map(type => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-1.5 p-2 pt-0 border-t border-border/20">
        <Button
          onClick={onClearObstacles}
          variant="destructive"
          size="sm"
          className="text-[10px] flex-1 h-6 px-2"
        >
          Clear
        </Button>
        <Button
          onClick={resetToDefaults}
          variant="outline"
          size="sm"
          className="text-[10px] h-6 px-2"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
        <Button
          onClick={onToggleStats}
          variant="outline"
          size="sm"
          className="text-[10px] flex-1 h-6 px-2"
        >
          Stats
        </Button>
      </div>

      <p className="text-[9px] text-muted-foreground text-center py-1.5 border-t border-border/20">
        Click to place • Alt+Drag to rotate
      </p>
    </div>
  );
};
