import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Wind, Waves, Thermometer, Mountain, RotateCcw, Target } from 'lucide-react';
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
  showHotspots?: boolean;
  onToggleHotspots?: () => void;
  showWakeZones?: boolean;
  onToggleWakeZones?: () => void;
}

// Custom slider with green glow effect
const GlowSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  displayValue: string;
}> = ({ value, onChange, min, max, step, label, displayValue }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-primary/90 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono text-muted-foreground">{displayValue}</span>
      </div>
      <div className="relative h-2">
        {/* Track background */}
        <div className="absolute inset-0 bg-background/60 rounded-full border border-primary/20" />
        {/* Filled track with glow */}
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary rounded-full shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
          style={{ width: `${percentage}%` }}
        />
        {/* Thumb glow effect */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background shadow-[0_0_12px_hsl(var(--primary)/0.8)] transition-all"
          style={{ left: `calc(${percentage}% - 6px)` }}
        />
        {/* Invisible slider for interaction */}
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          min={min}
          max={max}
          step={step}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

export const AdvancedWindControls: React.FC<AdvancedWindControlsProps> = ({
  config,
  onConfigChange,
  selectedObstacleType,
  onObstacleTypeChange,
  onClearObstacles,
  onToggleStats,
  showStats,
  showHotspots = false,
  onToggleHotspots,
  showWakeZones = false,
  onToggleWakeZones
}) => {
  const updateConfig = (key: keyof WindPhysicsConfig, value: number) => {
    onConfigChange({ ...config, [key]: value });
  };

  const resetToDefaults = () => {
    onConfigChange(DEFAULT_WIND_PHYSICS);
  };

  return (
    <div className="bg-[#0d1117]/95 backdrop-blur-md rounded-lg border border-primary/40 shadow-[0_0_20px_rgba(57,255,20,0.15)] overflow-hidden">
      {/* Tab Navigation */}
      <Tabs defaultValue="turb" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-9 rounded-none bg-background/40 border-b border-primary/30 p-0">
          <TabsTrigger 
            value="wind" 
            className="rounded-none border-r border-primary/20 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_-2px_0_hsl(var(--primary))] transition-all"
          >
            <Wind className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="turb" 
            className="rounded-none border-r border-primary/20 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_-2px_0_hsl(var(--primary))] transition-all"
          >
            <Waves className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="atmo" 
            className="rounded-none border-r border-primary/20 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_-2px_0_hsl(var(--primary))] transition-all"
          >
            <Thermometer className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="terrain" 
            className="rounded-none data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_-2px_0_hsl(var(--primary))] transition-all"
          >
            <Mountain className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        {/* Wind Tab */}
        <TabsContent value="wind" className="p-3 space-y-3 mt-0">
          <GlowSlider
            value={config.windSpeed}
            onChange={(v) => updateConfig('windSpeed', v)}
            min={0}
            max={30}
            step={0.5}
            label="Speed"
            displayValue={`${config.windSpeed.toFixed(1)} m/s`}
          />
          <GlowSlider
            value={config.windAngle}
            onChange={(v) => updateConfig('windAngle', v)}
            min={0}
            max={360}
            step={5}
            label="Direction"
            displayValue={`${config.windAngle}°`}
          />
          <GlowSlider
            value={config.windElevation}
            onChange={(v) => updateConfig('windElevation', v)}
            min={-45}
            max={45}
            step={5}
            label="Elevation"
            displayValue={`${config.windElevation}°`}
          />
        </TabsContent>

        {/* Turbulence Tab */}
        <TabsContent value="turb" className="p-3 space-y-3 mt-0">
          <GlowSlider
            value={config.turbulenceIntensity}
            onChange={(v) => updateConfig('turbulenceIntensity', v)}
            min={0}
            max={1}
            step={0.05}
            label="Intensity"
            displayValue={`${(config.turbulenceIntensity * 100).toFixed(0)}%`}
          />
          <GlowSlider
            value={config.turbulenceScale}
            onChange={(v) => updateConfig('turbulenceScale', v)}
            min={0.1}
            max={3}
            step={0.1}
            label="Scale"
            displayValue={`${config.turbulenceScale.toFixed(1)}x`}
          />
          <GlowSlider
            value={config.gustFrequency}
            onChange={(v) => updateConfig('gustFrequency', v)}
            min={0}
            max={20}
            step={1}
            label="Gust Freq"
            displayValue={`${config.gustFrequency}/min`}
          />
          <GlowSlider
            value={config.gustIntensity}
            onChange={(v) => updateConfig('gustIntensity', v)}
            min={0}
            max={1}
            step={0.05}
            label="Gust Power"
            displayValue={`${(config.gustIntensity * 100).toFixed(0)}%`}
          />
        </TabsContent>

        {/* Atmosphere Tab */}
        <TabsContent value="atmo" className="p-3 space-y-3 mt-0">
          <GlowSlider
            value={config.temperature}
            onChange={(v) => updateConfig('temperature', v)}
            min={-20}
            max={45}
            step={1}
            label="Temperature"
            displayValue={`${config.temperature}°C`}
          />
          <GlowSlider
            value={config.humidity}
            onChange={(v) => updateConfig('humidity', v)}
            min={0}
            max={100}
            step={5}
            label="Humidity"
            displayValue={`${config.humidity}%`}
          />
          <GlowSlider
            value={config.altitude}
            onChange={(v) => updateConfig('altitude', v)}
            min={0}
            max={3000}
            step={100}
            label="Altitude"
            displayValue={`${config.altitude}m`}
          />
          <GlowSlider
            value={config.airDensity}
            onChange={(v) => updateConfig('airDensity', v)}
            min={0.8}
            max={1.5}
            step={0.01}
            label="Air Density"
            displayValue={`${config.airDensity.toFixed(3)} kg/m³`}
          />
        </TabsContent>

        {/* Terrain Tab */}
        <TabsContent value="terrain" className="p-3 space-y-3 mt-0">
          <GlowSlider
            value={config.surfaceRoughness}
            onChange={(v) => updateConfig('surfaceRoughness', v)}
            min={0.001}
            max={2}
            step={0.01}
            label="Surface Roughness"
            displayValue={config.surfaceRoughness.toFixed(2)}
          />
          <div className="flex justify-between text-[9px] text-muted-foreground -mt-1">
            <span>Water</span>
            <span>Open</span>
            <span>Urban</span>
          </div>
          
          <GlowSlider
            value={config.referenceHeight}
            onChange={(v) => updateConfig('referenceHeight', v)}
            min={1}
            max={100}
            step={1}
            label="Ref. Height"
            displayValue={`${config.referenceHeight}m`}
          />

          <div className="pt-2 border-t border-primary/20">
            <Label className="text-xs text-primary/80 uppercase tracking-wide mb-1.5 block">Obstacle Type</Label>
            <Select value={selectedObstacleType} onValueChange={onObstacleTypeChange}>
              <SelectTrigger className="h-8 text-xs bg-background/40 border-primary/30 focus:border-primary focus:ring-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1117] border-primary/30">
                {Object.entries(OBSTACLE_CATEGORIES).map(([_, category]) => 
                  category.types.map(type => (
                    <SelectItem key={type} value={type} className="text-xs focus:bg-primary/20 focus:text-primary">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>

      {/* Visualization Options */}
      <div className="px-3 py-2 border-t border-primary/20 bg-background/20">
        <div className="flex items-center gap-1.5 mb-2">
          <Target className="w-3 h-3 text-orange-400" />
          <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide">Visualize</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <Checkbox 
              checked={showHotspots}
              onCheckedChange={onToggleHotspots}
              className="h-3.5 w-3.5 border-orange-500/50 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">Hotspots</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <Checkbox 
              checked={showWakeZones}
              onCheckedChange={onToggleWakeZones}
              className="h-3.5 w-3.5 border-cyan-500/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
            />
            <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">Wake Zones</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <Checkbox 
              checked={showStats}
              onCheckedChange={onToggleStats}
              className="h-3.5 w-3.5 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">FPS Stats</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-2.5 border-t border-primary/20 bg-background/30">
        <Button
          onClick={onClearObstacles}
          variant="destructive"
          size="sm"
          className="text-xs flex-1 h-7 bg-destructive/80 hover:bg-destructive border border-destructive/50"
        >
          Clear
        </Button>
        <Button
          onClick={resetToDefaults}
          variant="outline"
          size="sm"
          className="text-xs h-7 px-2.5 border-primary/40 hover:bg-primary/20 hover:border-primary"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Footer hint */}
      <p className="text-[9px] text-muted-foreground/70 text-center py-1.5 border-t border-primary/10 bg-background/10">
        Click to place • Alt+Drag to rotate
      </p>
    </div>
  );
};
