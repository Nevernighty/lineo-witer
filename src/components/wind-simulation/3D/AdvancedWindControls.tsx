import React, { useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wind, Waves, Thermometer, Mountain, RotateCcw, Target, Info } from 'lucide-react';
import { WindPhysicsConfig, DEFAULT_WIND_PHYSICS, calculateAirDensity, calculateWindShear } from './WindPhysicsEngine';
import { OBSTACLE_CATEGORIES, ObstacleType, GeneratorSubtype, GENERATOR_SUBTYPES } from '../types';
import { t, getObstacleLabel, type Lang } from '@/utils/i18n';

interface AdvancedWindControlsProps {
  config: WindPhysicsConfig;
  onConfigChange: (config: WindPhysicsConfig) => void;
  selectedObstacleType: string;
  onObstacleTypeChange: (type: string) => void;
  selectedGeneratorSubtype: GeneratorSubtype;
  onGeneratorSubtypeChange: (subtype: GeneratorSubtype) => void;
  onClearObstacles: () => void;
  showHotspots?: boolean;
  onToggleHotspots?: () => void;
  showWakeZones?: boolean;
  onToggleWakeZones?: () => void;
  showLocalHits?: boolean;
  onToggleLocalHits?: () => void;
  lang: Lang;
  particleCount?: number;
  onParticleCountChange?: (count: number) => void;
  particleImpact?: number;
  onParticleImpactChange?: (v: number) => void;
  particleTrailLength?: number;
  onParticleTrailLengthChange?: (v: number) => void;
  wobbliness?: number;
  onWobblinessChange?: (v: number) => void;
  particleGlow?: number;
  onParticleGlowChange?: (v: number) => void;
}

const GlowSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  displayValue: string;
  infoText?: string;
}> = ({ value, onChange, min, max, step, label, displayValue, infoText }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-primary/90 uppercase tracking-wider">{label}</span>
          {infoText && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-primary/50 hover:text-primary cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[280px] bg-[#0d1117] border-primary/40 text-xs leading-relaxed z-50">
                  <p>{infoText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="text-xs font-mono text-primary font-semibold">{displayValue}</span>
      </div>
      <div className="relative h-2">
        <div className="absolute inset-0 bg-background/60 rounded-full border border-primary/20" />
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary rounded-full shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
          style={{ width: `${percentage}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background shadow-[0_0_12px_hsl(var(--primary)/0.8)] transition-all"
          style={{ left: `calc(${percentage}% - 6px)` }} />
        <Slider value={[value]} onValueChange={(v) => onChange(v[0])} min={min} max={max} step={step}
          className="absolute inset-0 opacity-0 cursor-pointer" />
      </div>
    </div>
  );
};

export const AdvancedWindControls: React.FC<AdvancedWindControlsProps> = ({
  config, onConfigChange, selectedObstacleType, onObstacleTypeChange,
  selectedGeneratorSubtype, onGeneratorSubtypeChange,
  onClearObstacles, showHotspots = false, onToggleHotspots,
  showWakeZones = false, onToggleWakeZones, showLocalHits = false,
  onToggleLocalHits, lang, particleCount = 250, onParticleCountChange,
  particleImpact = 1.0, onParticleImpactChange,
  particleTrailLength = 1.0, onParticleTrailLengthChange,
  wobbliness = 1.0, onWobblinessChange,
  particleGlow = 1.0, onParticleGlowChange
}) => {
  const updateConfig = (key: keyof WindPhysicsConfig, value: number) => {
    const newConfig = { ...config, [key]: value };
    if (key === 'altitude' || key === 'temperature') {
      newConfig.airDensity = parseFloat(calculateAirDensity(
        key === 'altitude' ? value : config.altitude,
        key === 'temperature' ? value : config.temperature
      ).toFixed(3));
    }
    onConfigChange(newConfig);
  };

  const resetToDefaults = () => onConfigChange(DEFAULT_WIND_PHYSICS);

  const heightProfile = useMemo(() => {
    return [10, 30, 50, 80, 100].map(h => ({
      height: h,
      speed: calculateWindShear(config.windSpeed, config.referenceHeight, h, config.surfaceRoughness)
    }));
  }, [config.windSpeed, config.referenceHeight, config.surfaceRoughness]);

  return (
    <div className="bg-[#0d1117]/95 backdrop-blur-md rounded-lg border border-primary/40 shadow-[0_0_20px_rgba(57,255,20,0.15)]" style={{ overflow: 'visible' }}>
      <Tabs defaultValue="turb" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-9 rounded-none bg-background/40 border-b border-primary/30 p-0">
          {(['wind', 'turb', 'atmo', 'terrain'] as const).map((tab, i) => {
            const icons = [Wind, Waves, Thermometer, Mountain];
            const Icon = icons[i];
            return (
              <TabsTrigger key={tab} value={tab}
                className="rounded-none border-r border-primary/20 last:border-r-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_-2px_0_hsl(var(--primary))] transition-all">
                <Icon className="w-4 h-4" />
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="wind" className="p-3 space-y-3 mt-0">
          <GlowSlider value={config.windSpeed} onChange={(v) => updateConfig('windSpeed', v)}
            min={0} max={30} step={0.5} label={t('speed', lang)} displayValue={`${config.windSpeed.toFixed(1)} m/s`}
            infoText={t('infoSpeed', lang)} />
          <GlowSlider value={config.windAngle} onChange={(v) => updateConfig('windAngle', v)}
            min={0} max={360} step={5} label={t('direction', lang)} displayValue={`${config.windAngle}°`}
            infoText={t('infoDirection', lang)} />
          <GlowSlider value={config.windElevation} onChange={(v) => updateConfig('windElevation', v)}
            min={-45} max={45} step={5} label={t('elevation', lang)} displayValue={`${config.windElevation}°`}
            infoText={t('infoElevation', lang)} />
          {onParticleCountChange && (
            <GlowSlider value={particleCount} onChange={(v) => onParticleCountChange(v)}
              min={50} max={2000} step={50} label={t('particleCount', lang)} displayValue={`${particleCount}`}
              infoText={t('infoParticleCount', lang)} />
          )}
          {onParticleImpactChange && (
            <GlowSlider value={particleImpact} onChange={(v) => onParticleImpactChange(v)}
              min={0.1} max={3.0} step={0.1} label={t('particleImpact', lang)} displayValue={`${particleImpact.toFixed(1)}x`}
              infoText={t('infoParticleImpact', lang)} />
          )}
          {onParticleTrailLengthChange && (
            <GlowSlider value={particleTrailLength} onChange={(v) => onParticleTrailLengthChange(v)}
              min={0} max={10.0} step={0.5} label={t('particleTrail', lang)} displayValue={`${particleTrailLength.toFixed(1)}x`}
              infoText={t('infoParticleTrail', lang)} />
          )}
          {onParticleGlowChange && (
            <GlowSlider value={particleGlow} onChange={(v) => onParticleGlowChange(v)}
              min={0.2} max={3.0} step={0.1} label={t('particleGlow', lang)} displayValue={`${particleGlow.toFixed(1)}x`}
              infoText={t('infoParticleGlow', lang)} />
          )}
        </TabsContent>

        <TabsContent value="turb" className="p-3 space-y-3 mt-0">
          <GlowSlider value={config.turbulenceIntensity} onChange={(v) => updateConfig('turbulenceIntensity', v)}
            min={0} max={1} step={0.05} label={t('intensity', lang)} displayValue={`${(config.turbulenceIntensity * 100).toFixed(0)}%`}
            infoText={t('infoTurbulenceIntensity', lang)} />
          <GlowSlider value={config.turbulenceScale} onChange={(v) => updateConfig('turbulenceScale', v)}
            min={0.1} max={3} step={0.1} label={t('scale', lang)} displayValue={`${config.turbulenceScale.toFixed(1)}x`}
            infoText={t('infoTurbulenceScale', lang)} />
          <GlowSlider value={config.gustFrequency} onChange={(v) => updateConfig('gustFrequency', v)}
            min={0} max={20} step={1} label={t('gustFreq', lang)} displayValue={`${config.gustFrequency}/min`}
            infoText={t('infoGustFrequency', lang)} />
          <GlowSlider value={config.gustIntensity} onChange={(v) => updateConfig('gustIntensity', v)}
            min={0} max={1} step={0.05} label={t('gustPower', lang)} displayValue={`${(config.gustIntensity * 100).toFixed(0)}%`}
            infoText={t('infoGustPower', lang)} />
          {onWobblinessChange && (
            <GlowSlider value={wobbliness} onChange={(v) => onWobblinessChange(v)}
              min={0} max={3.0} step={0.1} label={t('wobbliness', lang)} displayValue={`${wobbliness.toFixed(1)}x`}
              infoText={t('infoWobbliness', lang)} />
          )}
        </TabsContent>

        <TabsContent value="atmo" className="p-3 space-y-3 mt-0">
          <GlowSlider value={config.temperature} onChange={(v) => updateConfig('temperature', v)}
            min={-20} max={45} step={1} label={t('temperature', lang)} displayValue={`${config.temperature}°C`}
            infoText={t('infoTemperature', lang)} />
          <div className="flex justify-between items-center text-[8px] -mt-0.5 px-0.5">
            {[
              { temp: -10, rho: 1.342, delta: '+9.5%' },
              { temp: 15, rho: 1.225, delta: '0%' },
              { temp: 40, rho: 1.127, delta: '-8.0%' },
            ].map(item => (
              <div key={item.temp} className={`text-center ${config.temperature >= item.temp - 10 && config.temperature < item.temp + 10 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                <div>{item.temp}°C</div>
                <div className="font-mono">{item.rho}</div>
                <div className="text-primary/70">{item.delta}</div>
              </div>
            ))}
          </div>
          <div className="text-[8px] text-muted-foreground px-0.5">{t('tempDensityFormula', lang)}</div>
          
          <GlowSlider value={config.humidity} onChange={(v) => updateConfig('humidity', v)}
            min={0} max={100} step={5} label={t('humidity', lang)} displayValue={`${config.humidity}%`}
            infoText={t('infoHumidity', lang)} />
          <GlowSlider value={config.altitude} onChange={(v) => updateConfig('altitude', v)}
            min={0} max={3000} step={100} label={t('altitude', lang)} displayValue={`${config.altitude}m`}
            infoText={t('infoAltitude', lang)} />
          <div className="text-[8px] text-muted-foreground px-0.5">
            {lang === 'ua' ? 'Висота → тиск → ρ: кожні 1000м ρ падає ~12%' : 'Altitude → pressure → ρ: every 1000m ρ drops ~12%'}
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] text-muted-foreground">{t('calculatedDensity', lang)}</span>
            <span className="text-[10px] font-mono text-primary">{config.airDensity.toFixed(3)} kg/m³</span>
          </div>
        </TabsContent>

        <TabsContent value="terrain" className="p-3 space-y-3 mt-0">
          <GlowSlider value={config.surfaceRoughness} onChange={(v) => updateConfig('surfaceRoughness', v)}
            min={0.001} max={2} step={0.01} label={t('surfaceRoughness', lang)} displayValue={config.surfaceRoughness.toFixed(2)}
            infoText={t('infoSurfaceRoughness', lang)} />
          <div className="flex justify-between text-[9px] text-muted-foreground -mt-1">
            <span>{t('water', lang)}</span><span>{t('open', lang)}</span><span>{t('urban', lang)}</span>
          </div>
          
          <GlowSlider value={config.referenceHeight} onChange={(v) => updateConfig('referenceHeight', v)}
            min={1} max={100} step={1} label={t('refHeight', lang)} displayValue={`${config.referenceHeight}m`}
            infoText={t('infoRefHeight', lang)} />

          <GlowSlider value={config.terrainSlopeX} onChange={(v) => updateConfig('terrainSlopeX', v)}
            min={-30} max={30} step={1} label={t('terrainSlopeX', lang)} displayValue={`${config.terrainSlopeX}°`}
            infoText={t('infoTerrainSlope', lang)} />
          <GlowSlider value={config.terrainSlopeZ} onChange={(v) => updateConfig('terrainSlopeZ', v)}
            min={-30} max={30} step={1} label={t('terrainSlopeZ', lang)} displayValue={`${config.terrainSlopeZ}°`}
            infoText={t('infoTerrainSlope', lang)} />

          <div className="pt-1 border-t border-primary/15">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[9px] font-semibold text-primary/70 uppercase tracking-wide">{t('heightProfile', lang)}</span>
            </div>
            <div className="grid grid-cols-5 gap-0.5">
              {heightProfile.map(hp => (
                <div key={hp.height} className="text-center">
                  <div className="text-[8px] text-muted-foreground">{hp.height}m</div>
                  <div className="text-[9px] font-mono text-primary">{hp.speed.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-primary/20">
            <Label className="text-xs text-primary/80 uppercase tracking-wide mb-1.5 block">{t('obstacleType', lang)}</Label>
            <Select value={selectedObstacleType} onValueChange={onObstacleTypeChange}>
              <SelectTrigger className="h-8 text-xs bg-background/40 border-primary/30 focus:border-primary focus:ring-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1117] border-primary/30">
                {Object.entries(OBSTACLE_CATEGORIES).map(([_, category]) => 
                  category.types.map(type => (
                    <SelectItem key={type} value={type} className="text-xs focus:bg-primary/20 focus:text-primary">
                      {getObstacleLabel(type, lang)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedObstacleType === 'wind_generator' && (
            <div>
              <Label className="text-[9px] text-primary/80 uppercase tracking-wide mb-1 block">{t('generatorType', lang)}</Label>
              <div className="flex gap-1">
                {(Object.keys(GENERATOR_SUBTYPES) as GeneratorSubtype[]).map(sub => (
                  <TooltipProvider key={sub} delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onGeneratorSubtypeChange(sub)}
                          className={`flex-1 px-1 py-1.5 rounded text-[8px] font-mono border transition-all ${
                            selectedGeneratorSubtype === sub 
                              ? 'bg-primary/25 border-primary/60 text-primary' 
                              : 'bg-background/30 border-primary/15 text-muted-foreground hover:border-primary/40'
                          }`}
                        >
                          {sub === 'hawt3' ? 'H3' : sub === 'hawt2' ? 'H2' : sub === 'darrieus' ? 'DR' : sub === 'savonius' ? 'SV' : 'μ'}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-[#0d1117] border-primary/40 text-[10px] z-50">
                        <p className="font-semibold">{t(sub, lang)}</p>
                        <p className="text-muted-foreground">Cp={GENERATOR_SUBTYPES[sub].cp}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Analysis Layers */}
      <div className="px-3 py-2 border-t border-primary/20 bg-background/20">
        <div className="flex items-center gap-1.5 mb-2">
          <Target className="w-3 h-3 text-orange-400" />
          <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide">{t('analysisLayers', lang)}</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { checked: showHotspots, toggle: onToggleHotspots, label: t('collisionHotspots', lang), borderColor: 'border-orange-500/50', checkedBg: 'data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500' },
            { checked: showWakeZones, toggle: onToggleWakeZones, label: t('wakeZones', lang), borderColor: 'border-cyan-500/50', checkedBg: 'data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500' },
            { checked: showLocalHits, toggle: onToggleLocalHits, label: t('localHits', lang), borderColor: 'border-yellow-500/50', checkedBg: 'data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500' },
          ].map((item, i) => (
            <label key={i} className="flex items-center justify-between cursor-pointer group p-1.5 rounded bg-background/30 hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-2">
                <Checkbox checked={item.checked} onCheckedChange={item.toggle}
                  className={`h-3.5 w-3.5 ${item.borderColor} ${item.checkedBg}`} />
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-2.5 border-t border-primary/20 bg-background/30">
        <Button onClick={onClearObstacles} variant="destructive" size="sm"
          className="text-xs flex-1 h-7 bg-destructive/80 hover:bg-destructive border border-destructive/50">
          {t('clearAll', lang)}
        </Button>
        <Button onClick={resetToDefaults} variant="outline" size="sm"
          className="text-xs h-7 px-2.5 border-primary/40 hover:bg-primary/20 hover:border-primary">
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <p className="text-[9px] text-muted-foreground/70 text-center py-1.5 border-t border-primary/10 bg-background/10">
        {t('footerHint', lang)}
      </p>
    </div>
  );
};
