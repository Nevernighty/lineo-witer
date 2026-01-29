import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wind, Waves, Thermometer, Mountain, RotateCcw, Target, Info } from 'lucide-react';
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

// Setting descriptions for info tooltips
const SETTING_INFO: Record<string, string> = {
  speed: "Wind velocity affects particle speed and collision energy (E = 0.5mv²). Higher speeds = more energy transfer to obstacles.",
  direction: "Horizontal wind angle in degrees. 0° = East, 90° = South, 180° = West, 270° = North. Controls flow direction.",
  elevation: "Vertical wind angle. Positive = upward slope, negative = downward. Affects vertical particle distribution.",
  turbulenceIntensity: "Random velocity variations as % of wind speed. Higher values create chaotic, swirling particle motion.",
  turbulenceScale: "Size of turbulence eddies. Larger scale = broader swirling patterns, smaller = fine-grain fluctuations.",
  gustFrequency: "Number of wind gusts per minute. Gusts temporarily increase wind speed by the Gust Power percentage.",
  gustPower: "Maximum gust strength as % increase over base wind speed. 50% = gusts can be 1.5x normal speed.",
  temperature: "Air temperature affects density calculation. Cold air is denser = more energy per particle collision.",
  humidity: "Atmospheric moisture. Higher humidity slightly reduces air density and affects visual particle appearance.",
  altitude: "Height above sea level. Higher altitudes = lower air pressure = reduced air density and collision energy.",
  airDensity: "Mass per volume (kg/m³). Directly affects collision energy. Sea level ≈ 1.225, mountains ≈ 1.0.",
  surfaceRoughness: "Terrain friction coefficient. Water ≈ 0.001, grassland ≈ 0.03, urban ≈ 0.5-2.0. Affects wind shear profile.",
  refHeight: "Reference measurement height for wind shear calculations. Wind speed reduces logarithmically closer to ground.",
  hotspots: "Shows energy concentration at obstacles. Colors indicate intensity: Green (low) → Yellow → Orange → Red (critical).",
  wakeZones: "Visualizes turbulent wake regions behind obstacles. Shows velocity deficit and recovery distance downstream."
};

// Custom slider with green glow effect and info icon
const GlowSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  displayValue: string;
  infoKey?: string;
}> = ({ value, onChange, min, max, step, label, displayValue, infoKey }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-primary/90 uppercase tracking-wider">{label}</span>
          {infoKey && SETTING_INFO[infoKey] && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-primary/50 hover:text-primary cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  className="max-w-[280px] bg-[#0d1117] border-primary/40 text-xs leading-relaxed"
                >
                  <p>{SETTING_INFO[infoKey]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="text-xs font-mono text-primary font-semibold">{displayValue}</span>
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
            infoKey="speed"
          />
          <GlowSlider
            value={config.windAngle}
            onChange={(v) => updateConfig('windAngle', v)}
            min={0}
            max={360}
            step={5}
            label="Direction"
            displayValue={`${config.windAngle}°`}
            infoKey="direction"
          />
          <GlowSlider
            value={config.windElevation}
            onChange={(v) => updateConfig('windElevation', v)}
            min={-45}
            max={45}
            step={5}
            label="Elevation"
            displayValue={`${config.windElevation}°`}
            infoKey="elevation"
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
            infoKey="turbulenceIntensity"
          />
          <GlowSlider
            value={config.turbulenceScale}
            onChange={(v) => updateConfig('turbulenceScale', v)}
            min={0.1}
            max={3}
            step={0.1}
            label="Scale"
            displayValue={`${config.turbulenceScale.toFixed(1)}x`}
            infoKey="turbulenceScale"
          />
          <GlowSlider
            value={config.gustFrequency}
            onChange={(v) => updateConfig('gustFrequency', v)}
            min={0}
            max={20}
            step={1}
            label="Gust Freq"
            displayValue={`${config.gustFrequency}/min`}
            infoKey="gustFrequency"
          />
          <GlowSlider
            value={config.gustIntensity}
            onChange={(v) => updateConfig('gustIntensity', v)}
            min={0}
            max={1}
            step={0.05}
            label="Gust Power"
            displayValue={`${(config.gustIntensity * 100).toFixed(0)}%`}
            infoKey="gustPower"
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
            infoKey="temperature"
          />
          <GlowSlider
            value={config.humidity}
            onChange={(v) => updateConfig('humidity', v)}
            min={0}
            max={100}
            step={5}
            label="Humidity"
            displayValue={`${config.humidity}%`}
            infoKey="humidity"
          />
          <GlowSlider
            value={config.altitude}
            onChange={(v) => updateConfig('altitude', v)}
            min={0}
            max={3000}
            step={100}
            label="Altitude"
            displayValue={`${config.altitude}m`}
            infoKey="altitude"
          />
          <GlowSlider
            value={config.airDensity}
            onChange={(v) => updateConfig('airDensity', v)}
            min={0.8}
            max={1.5}
            step={0.01}
            label="Air Density"
            displayValue={`${config.airDensity.toFixed(3)} kg/m³`}
            infoKey="airDensity"
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
            infoKey="surfaceRoughness"
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
            infoKey="refHeight"
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
          <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide">Analysis Layers</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <label className="flex items-center justify-between cursor-pointer group p-1.5 rounded bg-background/30 hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={showHotspots}
                onCheckedChange={onToggleHotspots}
                className="h-3.5 w-3.5 border-orange-500/50 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
              />
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">Collision Hotspots</span>
            </div>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-orange-500/50 hover:text-orange-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[240px] bg-[#0d1117] border-orange-500/40 text-xs">
                  <p>{SETTING_INFO.hotspots}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
          <label className="flex items-center justify-between cursor-pointer group p-1.5 rounded bg-background/30 hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={showWakeZones}
                onCheckedChange={onToggleWakeZones}
                className="h-3.5 w-3.5 border-cyan-500/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
              />
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">Wake Zones</span>
            </div>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-cyan-500/50 hover:text-cyan-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[240px] bg-[#0d1117] border-cyan-500/40 text-xs">
                  <p>{SETTING_INFO.wakeZones}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group p-1.5 rounded bg-background/30 hover:bg-background/50 transition-colors">
            <Checkbox 
              checked={showStats}
              onCheckedChange={onToggleStats}
              className="h-3.5 w-3.5 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">Performance Stats</span>
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
          Clear All
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
        Click terrain to place obstacle • Alt+Drag to rotate view
      </p>
    </div>
  );
};
