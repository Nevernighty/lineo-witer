import React, { useState, Suspense, useCallback, useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import { AdvancedParticleSystem } from './AdvancedParticleSystem';
import { Obstacle3D } from './Obstacle3D';
import { WindGenerator3D, calculateGeneratorPower } from './WindGenerator3D';
import { AdvancedMeasurementPanel } from './AdvancedMeasurementPanel';
import { AdvancedWindControls } from './AdvancedWindControls';
import { GhostObstacle } from './GhostObstacle';
import { CollisionEffectsManager } from './CollisionEffect';
import { CollisionHotspotManager } from './CollisionHotspot';
import { LocalHitManager } from './LocalHitPopup';
import { WindPhysicsConfig, DEFAULT_WIND_PHYSICS, calculateWindShear } from './WindPhysicsEngine';
import { Obstacle, OBSTACLE_CATEGORIES, ObstacleType, GeneratorSubtype } from '../types';
import { t, type Lang } from '@/utils/i18n';
import { getTerrainYOffset } from '@/simulation/terrainModel';
import { SCENARIO_PRESETS, type ScenarioPreset } from '@/data/scenarios';
import { playPlaceSound, playRotateSound, playClearSound, playScaleSound } from '@/utils/sounds';
import { Crosshair, MousePointer, Map as MapIcon, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as THREE from 'three';

interface WindSimulation3DProps {
  windSpeed?: number;
  onWindSpeedChange?: (speed: number) => void;
  lang: Lang;
}

// getTerrainYOffset now imported from @/simulation/terrainModel

const HeightRuler: React.FC<{ maxHeight: number; config: WindPhysicsConfig }> = ({ maxHeight, config }) => {
  const heights = [0, 10, 30, 50, 80, 100];
  return (
    <group position={[52, 0, -48]}>
      <mesh position={[0, maxHeight / 2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, maxHeight, 6]} />
        <meshBasicMaterial color="#39ff14" transparent opacity={0.5} />
      </mesh>
      {heights.filter(h => h <= maxHeight).map(h => (
        <group key={h} position={[0, h, 0]}>
          <mesh position={[0.8, 0, 0]}>
            <boxGeometry args={[1.5, 0.06, 0.06]} />
            <meshBasicMaterial color="#39ff14" transparent opacity={0.4} />
          </mesh>
          <mesh><sphereGeometry args={[0.15, 6, 6]} /><meshBasicMaterial color="#39ff14" transparent opacity={0.6} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 12]} />
        <meshBasicMaterial color="#39ff14" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const HeightRulerLabels: React.FC<{ maxHeight: number; config: WindPhysicsConfig }> = ({ maxHeight, config }) => {
  const heights = [0, 10, 30, 50, 80, 100].filter(h => h <= maxHeight);
  return (
    <group position={[52, 0, -48]}>
      {heights.map(h => {
        const windAtH = calculateWindShear(config.windSpeed, config.referenceHeight, Math.max(1, h), config.surfaceRoughness);
        const power = 0.5 * config.airDensity * Math.pow(windAtH, 3);
        return (
          <Html key={h} position={[2.5, h, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="text-[8px] font-mono whitespace-nowrap px-1 py-0.5 rounded" style={{ 
              backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(57,255,20,0.3)', color: '#39ff14'
            }}>
              <span className="text-[7px] text-green-300/60">{h}m</span>{' '}
              <span>{windAtH.toFixed(1)}</span> m/s{' '}
              <span className="text-cyan-400">{power.toFixed(0)} W/m²</span>
            </div>
          </Html>
        );
      })}
    </group>
  );
};

// ScenarioPreset and SCENARIO_PRESETS now imported from @/data/scenarios

const MouseTracker: React.FC<{
  onPositionChange: (pos: [number, number, number] | null) => void;
  simulationSize: { width: number; height: number; depth: number };
  slopeX: number;
  slopeZ: number;
}> = ({ onPositionChange, simulationSize }) => {
  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectPoint = useRef(new THREE.Vector3());

  useFrame(({ mouse }) => {
    plane.current.normal.set(0, 1, 0);
    plane.current.constant = 0;
    raycaster.current.setFromCamera(mouse, camera);
    const didIntersect = raycaster.current.ray.intersectPlane(plane.current, intersectPoint.current);
    if (didIntersect) {
      const x = Math.max(-simulationSize.width / 2, Math.min(simulationSize.width / 2, intersectPoint.current.x));
      const z = Math.max(-simulationSize.depth / 2, Math.min(simulationSize.depth / 2, intersectPoint.current.z));
      onPositionChange([x, 0, z]);
    }
  });
  return null;
};

export const WindSimulation3D: React.FC<WindSimulation3DProps> = ({
  windSpeed: initialWindSpeed = 6,
  onWindSpeedChange,
  lang
}) => {
  const [physicsConfig, setPhysicsConfig] = useState<WindPhysicsConfig>({ ...DEFAULT_WIND_PHYSICS, windSpeed: initialWindSpeed });
  const [particleCount, setParticleCount] = useState(400);
  const [particleImpact, setParticleImpact] = useState(1.0);
  const [particleTrailLength, setParticleTrailLength] = useState(3.0);
  const [wobbliness, setWobbliness] = useState(0.6);
  const [particleGlow, setParticleGlow] = useState(0.2);
  const [pulsation, setPulsation] = useState(0);
  const [particlePreset, setParticlePreset] = useState('standard');
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [selectedObstacleType, setSelectedObstacleType] = useState<string>('building');
  const [selectedGeneratorSubtype, setSelectedGeneratorSubtype] = useState<GeneratorSubtype>('hawt3');
  const [collisionEnergy, setCollisionEnergy] = useState(0);
  const [showHotspots, setShowHotspots] = useState(false);
  const [showWakeZones, setShowWakeZones] = useState(false);
  const [showLocalHits, setShowLocalHits] = useState(true);
  const [showHeightRuler, setShowHeightRuler] = useState(false);
  const [showWindProfile, setShowWindProfile] = useState(false);
  const [showPressureMap, setShowPressureMap] = useState(false);
  const [showEnergyDensity, setShowEnergyDensity] = useState(false);
  const [showTurbulenceField, setShowTurbulenceField] = useState(false);
  const [showWindShear, setShowWindShear] = useState(false);
  const [showWakeMap, setShowWakeMap] = useState(false);
  const [showCapacityFactor, setShowCapacityFactor] = useState(false);
  const [showBetzOverlay, setShowBetzOverlay] = useState(false);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [ghostPosition, setGhostPosition] = useState<[number, number, number] | null>(null);
  const [obstacleEnergies, setObstacleEnergies] = useState<Map<string, number>>(new Map());
  const [collisionEffects, setCollisionEffects] = useState<Array<{
    id: string; position: [number, number, number]; intensity: number; deflection?: [number, number, number];
  }>>([]);
  const [showHint, setShowHint] = useState(false);
  const [currentGhostRotation, setCurrentGhostRotation] = useState(0);
  const [currentGhostScale, setCurrentGhostScale] = useState(1);
  const lastPlacedIdRef = useRef<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<'place' | 'select'>('place');
  const [selectedObstacleIndex, setSelectedObstacleIndex] = useState<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; z: number } | null>(null);
  const [showScenarios, setShowScenarios] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  // Apply particle presets
  const handlePresetChange = useCallback((preset: string) => {
    setParticlePreset(preset);
    switch (preset) {
      case 'smoke': setParticleGlow(0.15); setParticleTrailLength(6); setPulsation(0.5); break;
      case 'arrows': setParticleGlow(0.4); setParticleTrailLength(1); setPulsation(0); break;
      case 'sparks': setParticleGlow(0.8); setParticleTrailLength(4); setPulsation(1.5); break;
      case 'flows': setParticleGlow(0.3); setParticleTrailLength(8); setPulsation(0.8); break;
      default: setParticleGlow(0.2); setParticleTrailLength(3.0); setPulsation(0); break;
    }
  }, []);

  useEffect(() => {
    setPhysicsConfig(prev => ({ ...prev, windSpeed: initialWindSpeed }));
  }, [initialWindSpeed]);

  const handleConfigChange = (newConfig: WindPhysicsConfig) => {
    setPhysicsConfig(newConfig);
    onWindSpeedChange?.(newConfig.windSpeed);
  };

  const simulationSize = { width: 100, height: 50, depth: 100 };

  const generatorPower = useMemo(() => {
    return obstacles.filter(o => o.type === 'wind_generator').reduce((sum, o) => {
      return sum + calculateGeneratorPower(
        physicsConfig.airDensity, o.width * 1.8, physicsConfig.windSpeed,
        o.height + o.y, physicsConfig.referenceHeight, physicsConfig.surfaceRoughness,
        o.generatorSubtype || 'hawt3'
      );
    }, 0);
  }, [obstacles, physicsConfig]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      const targetId = interactionMode === 'select' && selectedObstacleIndex !== null
        ? obstacles[selectedObstacleIndex]?.id : lastPlacedIdRef.current;
      const modifyObstacle = (fn: (obs: Obstacle) => Obstacle) => {
        if (targetId) setObstacles(prev => prev.map(obs => obs.id === targetId ? fn(obs) : obs));
      };
      const modifyGhostOrObstacle = (obsFn: (obs: Obstacle) => Obstacle, ghostFn: () => void) => {
        if (targetId && obstacles.some(o => o.id === targetId)) modifyObstacle(obsFn);
        else if (interactionMode === 'place') ghostFn();
      };
      switch (key) {
        case 'arrowleft': e.preventDefault(); modifyGhostOrObstacle(obs => ({ ...obs, rotation: ((obs.rotation || 0) - 15) % 360 }), () => setCurrentGhostRotation(prev => (prev - 15) % 360)); playRotateSound(); break;
        case 'arrowright': e.preventDefault(); modifyGhostOrObstacle(obs => ({ ...obs, rotation: ((obs.rotation || 0) + 15) % 360 }), () => setCurrentGhostRotation(prev => (prev + 15) % 360)); playRotateSound(); break;
        case 'q': e.preventDefault(); modifyGhostOrObstacle(obs => ({ ...obs, scale: Math.max(0.3, (obs.scale || 1) - 0.1) }), () => setCurrentGhostScale(prev => Math.max(0.3, prev - 0.1))); playScaleSound(); break;
        case 'e': e.preventDefault(); modifyGhostOrObstacle(obs => ({ ...obs, scale: Math.min(3.0, (obs.scale || 1) + 0.1) }), () => setCurrentGhostScale(prev => Math.min(3.0, prev + 0.1))); playScaleSound(); break;
        case 'a': e.preventDefault(); modifyObstacle(obs => ({ ...obs, x: obs.x - 2 })); break;
        case 'd': e.preventDefault(); modifyObstacle(obs => ({ ...obs, x: obs.x + 2 })); break;
        case 'z': e.preventDefault(); modifyObstacle(obs => ({ ...obs, z: obs.z - 2 })); break;
        case 'c': e.preventDefault(); modifyObstacle(obs => ({ ...obs, z: obs.z + 2 })); break;
        case 'delete': case 'backspace':
          if (interactionMode === 'select' && selectedObstacleIndex !== null) {
            e.preventDefault(); setObstacles(prev => prev.filter((_, i) => i !== selectedObstacleIndex)); setSelectedObstacleIndex(null);
          } break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [obstacles, interactionMode, selectedObstacleIndex]);

  const addObstacle = useCallback((x: number, y: number, z: number) => {
    const category = Object.entries(OBSTACLE_CATEGORIES).find(([_, cat]) => cat.types.includes(selectedObstacleType as ObstacleType));
    if (!category) return;
    const [categoryKey, categoryData] = category;
    const obstacleId = `obstacle-${Date.now()}`;
    let width = 10, height = 15, depth = 10;
    switch (selectedObstacleType) {
      case 'skyscraper': width = 15; height = 45; break;
      case 'tower': width = 5; height = 35; depth = 5; break;
      case 'tree': height = 20; break;
      case 'fence': height = 3; depth = 1; break;
      case 'wall': height = 8; depth = 3; break;
      case 'house': height = 12; break;
      case 'wind_generator': width = 6; height = 30; depth = 6; break;
    }
    const newObstacle: Obstacle = {
      id: obstacleId, type: selectedObstacleType as ObstacleType, category: categoryKey as any, shape: 'regular',
      x: x - width / 2, y: 0, z: z - depth / 2, width, height, depth,
      density: categoryData.defaultProperties.density, material: categoryData.defaultProperties.material,
      resistance: categoryData.defaultProperties.resistance, rotation: currentGhostRotation, scale: currentGhostScale,
      ...(selectedObstacleType === 'wind_generator' ? { generatorSubtype: selectedGeneratorSubtype } : {})
    };
    setObstacles(prev => [...prev, newObstacle]);
    lastPlacedIdRef.current = obstacleId;
    playPlaceSound();
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  }, [selectedObstacleType, selectedGeneratorSubtype, currentGhostRotation, currentGhostScale]);

  const selectObstacleAt = useCallback((clickPos: [number, number, number]) => {
    let bestIdx = -1, bestDist = Infinity;
    obstacles.forEach((obs, idx) => {
      const cx = obs.x + obs.width / 2, cz = obs.z + obs.depth / 2;
      const dist = Math.sqrt((clickPos[0] - cx) ** 2 + (clickPos[2] - cz) ** 2);
      const maxReach = Math.max(obs.width, obs.depth) * (obs.scale || 1);
      if (dist < maxReach && dist < bestDist) { bestDist = dist; bestIdx = idx; }
    });
    setSelectedObstacleIndex(bestIdx >= 0 ? bestIdx : null);
  }, [obstacles]);

  const clearObstacles = () => { setObstacles([]); setCollisionEnergy(0); setObstacleEnergies(new Map()); lastPlacedIdRef.current = null; setSelectedObstacleIndex(null); setActiveScenario(null); playClearSound(); };

  const applyScenario = useCallback((preset: ScenarioPreset) => {
    setPhysicsConfig(prev => ({ ...prev, ...preset.config }));
    setObstacles(preset.obstacles.map(o => ({ ...o })));
    setParticleCount(preset.particleCount);
    setActiveScenario(preset.id);
    setSelectedObstacleIndex(null);
    setCollisionEnergy(0);
    setObstacleEnergies(new Map());
    onWindSpeedChange?.(preset.config.windSpeed || 8);
  }, [onWindSpeedChange]);

  const handleCollisionEvent = useCallback((event: { id: string; position: [number, number, number]; intensity: number; deflection?: [number, number, number] }) => {
    setCollisionEffects(prev => { const next = [...prev, event]; return next.length > 20 ? next.slice(-20) : next; });
    if ((window as any).__localHitAdd) {
      const speed = event.intensity;
      const energy = 0.5 * 0.015 * speed * speed * physicsConfig.airDensity;
      (window as any).__localHitAdd(event.position, energy);
    }
  }, [physicsConfig.airDensity]);

  const handleRemoveCollision = useCallback((id: string) => { setCollisionEffects(prev => prev.filter(c => c.id !== id)); }, []);
  const handleObstacleEnergyUpdate = useCallback((energies: Map<string, number>) => { setObstacleEnergies(energies); }, []);

  const terrainRotation: [number, number, number] = [
    (physicsConfig.terrainSlopeZ * Math.PI) / 180, 0, -(physicsConfig.terrainSlopeX * Math.PI) / 180
  ];

  // Second-click-hold drag: first click selects, second click on same object + hold = drag
  const selectClickCountRef = useRef(0);
  const lastSelectedIndexRef = useRef<number | null>(null);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.altKey) return;
    if (interactionMode === 'select') {
      if (ghostPosition) {
        // Find what we clicked
        let clickedIdx = -1;
        obstacles.forEach((obs, idx) => {
          const cx = obs.x + obs.width / 2, cz = obs.z + obs.depth / 2;
          const dist = Math.sqrt((ghostPosition[0] - cx) ** 2 + (ghostPosition[2] - cz) ** 2);
          const maxReach = Math.max(obs.width, obs.depth) * (obs.scale || 1);
          if (dist < maxReach && (clickedIdx === -1)) { clickedIdx = idx; }
        });

        if (clickedIdx >= 0 && clickedIdx === selectedObstacleIndex) {
          // Second click on already-selected → start drag
          dragStartRef.current = { x: ghostPosition[0], z: ghostPosition[2] };
          isDraggingRef.current = false;
        } else {
          // First click or different object → just select
          setSelectedObstacleIndex(clickedIdx >= 0 ? clickedIdx : null);
          dragStartRef.current = null;
        }
      }
    } else { if (ghostPosition) addObstacle(ghostPosition[0], 0, ghostPosition[2]); }
  }, [interactionMode, ghostPosition, addObstacle, obstacles, selectedObstacleIndex]);

  const handleCanvasPointerMove = useCallback(() => {
    if (interactionMode === 'select' && dragStartRef.current && selectedObstacleIndex !== null && ghostPosition) {
      isDraggingRef.current = true;
      setObstacles(prev => prev.map((obs, i) => i !== selectedObstacleIndex ? obs : { ...obs, x: ghostPosition[0] - obs.width / 2, z: ghostPosition[2] - obs.depth / 2 }));
    }
  }, [interactionMode, selectedObstacleIndex, ghostPosition]);

  const handleCanvasPointerUp = useCallback(() => { dragStartRef.current = null; isDraggingRef.current = false; }, []);

  // Analysis items config with confidence badges
  type ConfidenceBadge = 'visualization' | 'estimate' | 'theoretical';
  const badgeColors: Record<ConfidenceBadge, string> = { visualization: '#44aaff', estimate: '#ffaa00', theoretical: '#ff44aa' };

  const analysisItems: Array<{ key: string; checked: boolean; set: (v: boolean) => void; icon: string; label: string; dotColor: string; info: string; badge: ConfidenceBadge }> = [
    { key: 'ruler', checked: showHeightRuler, set: setShowHeightRuler, icon: '📏', label: t('heightRuler', lang), dotColor: '#39ff14', info: t('infoHeightRuler', lang), badge: 'visualization' },
    { key: 'vprofile', checked: showWindProfile, set: setShowWindProfile, icon: '🌬️', label: t('windProfile', lang), dotColor: '#00aaff', info: t('infoWindProfile', lang), badge: 'estimate' },
    { key: 'pressure', checked: showPressureMap, set: setShowPressureMap, icon: '🔴', label: t('pressureZones', lang), dotColor: '#ff6644', info: t('infoPressureZones', lang), badge: 'visualization' },
    { key: 'energy', checked: showEnergyDensity, set: setShowEnergyDensity, icon: '⚡', label: t('energyDensity', lang), dotColor: '#ffaa00', info: t('infoEnergyDensity', lang), badge: 'estimate' },
    { key: 'turbulence', checked: showTurbulenceField, set: setShowTurbulenceField, icon: '🌀', label: t('turbulenceField', lang), dotColor: '#aa44ff', info: t('infoTurbulenceField', lang), badge: 'visualization' },
    { key: 'shear', checked: showWindShear, set: setShowWindShear, icon: '📊', label: t('windShearLayer', lang), dotColor: '#22ff88', info: t('infoWindShear', lang), badge: 'estimate' },
    { key: 'wake', checked: showWakeMap, set: setShowWakeMap, icon: '💨', label: t('wakeMap', lang), dotColor: '#44aaff', info: t('infoWakeMap', lang), badge: 'visualization' },
    { key: 'capacity', checked: showCapacityFactor, set: setShowCapacityFactor, icon: '📈', label: t('capacityFactor', lang), dotColor: '#88ff00', info: t('infoCapacityFactor', lang), badge: 'estimate' },
    { key: 'betz', checked: showBetzOverlay, set: setShowBetzOverlay, icon: '🎯', label: t('betzOverlay', lang), dotColor: '#ff4488', info: t('infoBetzOverlay', lang), badge: 'theoretical' },
  ];

  const activeAnalysisCount = analysisItems.filter(i => i.checked).length;

  return (
    <div className="relative w-full h-full" style={{ isolation: 'isolate' }}>
      {/* Mode toggle + Scenario + Analysis buttons */}
      <div className="absolute top-3 left-[195px] z-50 flex gap-1" style={{ pointerEvents: 'auto' }}>
        <button onClick={() => { setInteractionMode('place'); setSelectedObstacleIndex(null); }}
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-mono border transition-all ${interactionMode === 'place' ? 'bg-primary/25 border-primary/60 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]' : 'bg-background/90 border-primary/20 text-muted-foreground hover:border-primary/40'}`}>
          <Crosshair className="w-3.5 h-3.5" />{t('placeMode', lang)}
        </button>
        <button onClick={() => setInteractionMode('select')}
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-mono border transition-all ${interactionMode === 'select' ? 'bg-primary/25 border-primary/60 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]' : 'bg-background/90 border-primary/20 text-muted-foreground hover:border-primary/40'}`}>
          <MousePointer className="w-3.5 h-3.5" />{t('selectMode', lang)}
        </button>
        <button onClick={() => setShowScenarios(!showScenarios)}
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-mono border transition-all ${showScenarios ? 'bg-cyan-500/25 border-cyan-500/60 text-cyan-400' : 'bg-background/90 border-primary/20 text-muted-foreground hover:border-primary/40'}`}>
          <MapIcon className="w-3.5 h-3.5" />{t('scenarios', lang)}
        </button>
        <button onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-mono border transition-all ${showAnalysisPanel ? 'bg-orange-500/25 border-orange-500/60 text-orange-400' : 'bg-background/90 border-primary/20 text-muted-foreground hover:border-primary/40'}`}>
          {t('analysisPanel', lang)}
          {activeAnalysisCount > 0 && <span className="ml-0.5 px-1 py-0 rounded-full bg-orange-500/30 text-orange-400 text-[8px] font-bold">{activeAnalysisCount}</span>}
          {showAnalysisPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Compact analysis dropdown */}
      {showAnalysisPanel && (
        <div className="absolute top-12 left-[195px] z-50 bg-background/95 backdrop-blur-md rounded-lg border border-orange-500/40 p-2 shadow-[0_0_15px_rgba(255,140,0,0.15)] w-64 animate-in fade-in slide-in-from-top-2 duration-200" style={{ pointerEvents: 'auto' }}>
          <div className="space-y-1">
            {analysisItems.map(item => (
              <label key={item.key} className={`flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded transition-all hover:bg-primary/10 ${item.checked ? 'bg-primary/10' : ''}`}>
                <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all flex-shrink-0`}
                  style={{ borderColor: item.dotColor, backgroundColor: item.checked ? item.dotColor : 'transparent', boxShadow: item.checked ? `0 0 6px ${item.dotColor}80` : 'none' }} />
                <input type="checkbox" checked={item.checked} onChange={(e) => item.set(e.target.checked)} className="hidden" />
                <span className="text-[9px]">{item.icon}</span>
                <span className={`text-[10px] font-mono flex-1 ${item.checked ? 'text-foreground' : 'text-muted-foreground'}`}>{item.label}</span>
                <span className="text-[6px] font-mono px-1 py-0 rounded-full uppercase tracking-wider" style={{ backgroundColor: `${badgeColors[item.badge]}20`, color: badgeColors[item.badge], border: `1px solid ${badgeColors[item.badge]}40` }}>{item.badge}</span>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground/40 hover:text-primary cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[260px] bg-[#0d1117] border-primary/40 text-[10px] z-50">
                      <p>{item.info}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Scenario picker */}
      {showScenarios && (
        <div className="absolute top-12 left-[195px] z-50 w-80 bg-background/95 backdrop-blur-md border border-cyan-500/40 rounded-lg shadow-[0_0_25px_rgba(0,200,255,0.2)] overflow-hidden" style={{ pointerEvents: 'auto' }}>
          <div className="px-3 py-2 border-b border-cyan-500/20 flex items-center gap-2">
            <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{t('scenarios', lang)}</span>
          </div>
          <div className="max-h-80 overflow-y-auto scenario-scrollbar">
            {SCENARIO_PRESETS.map(preset => (
              <button key={preset.id} onClick={() => { applyScenario(preset); setShowScenarios(false); }}
                className={`w-full text-left px-3 py-2.5 border-b border-primary/10 hover:bg-primary/10 transition-colors ${activeScenario === preset.id ? 'bg-primary/15 border-l-2 border-l-primary' : ''}`}>
                <div className="text-xs font-semibold text-foreground">{preset.name[lang]}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{preset.description[lang]}</div>
                {preset.physicsNote && (
                  <div className="text-[8px] text-cyan-400/70 mt-1 leading-tight italic">🔬 {preset.physicsNote[lang]}</div>
                )}
                <div className="flex gap-2 mt-1 text-[8px] font-mono text-primary/60">
                  <span>💨 {preset.config.windSpeed} m/s</span>
                  <span>🌡 {preset.config.temperature}°C</span>
                  <span>📐 z₀={preset.config.surfaceRoughness}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <Canvas camera={{ position: [70, 45, 70], fov: 50 }} className="!absolute inset-0" style={{ pointerEvents: 'auto', zIndex: 0 }}
        onPointerDown={handleCanvasPointerDown} onPointerMove={handleCanvasPointerMove} onPointerUp={handleCanvasPointerUp}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <directionalLight position={[30, 40, 20]} intensity={0.9} color="#ffffff" />
          <pointLight position={[-30, 25, -30]} intensity={0.5} color="#39ff14" />
          <pointLight position={[30, 15, 30]} intensity={0.4} color="#00ffff" />
          <hemisphereLight args={['#87CEEB', '#363636', 0.3]} />

          <MouseTracker onPositionChange={setGhostPosition} simulationSize={simulationSize} slopeX={physicsConfig.terrainSlopeX} slopeZ={physicsConfig.terrainSlopeZ} />

          <group rotation={terrainRotation}>
            <Grid args={[simulationSize.width, simulationSize.depth]} cellSize={5} cellThickness={0.5} cellColor="#1a4a3a"
              sectionSize={20} sectionThickness={1} sectionColor="#39ff14" fadeDistance={150} fadeStrength={1} followCamera={false} infiniteGrid={false} />
          </group>

          {showHeightRuler && (<><HeightRuler maxHeight={simulationSize.height} config={physicsConfig} /><HeightRulerLabels maxHeight={simulationSize.height} config={physicsConfig} /></>)}

          {showWindProfile && <WindProfileViz config={physicsConfig} />}

          {showPressureMap && <PressureMapViz config={physicsConfig} obstacles={obstacles} />}

          {showEnergyDensity && (
            <group position={[48, 0, 48]}>
              {[5, 15, 25, 35, 45].map(h => {
                const windAtH = calculateWindShear(physicsConfig.windSpeed, physicsConfig.referenceHeight, h, physicsConfig.surfaceRoughness);
                const power = 0.5 * physicsConfig.airDensity * Math.pow(windAtH, 3);
                const intensity = Math.min(power / 1500, 1);
                return (
                  <group key={`ed-${h}`}>
                    <mesh position={[0, h, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                      <ringGeometry args={[1, 3, 20]} /><meshBasicMaterial color={intensity > 0.5 ? '#ff8800' : '#00aaff'} transparent opacity={0.08 + intensity * 0.15} side={THREE.DoubleSide} />
                    </mesh>
                    <Html position={[4, h, 0]} center style={{ pointerEvents: 'none' }}>
                      <div className="text-[7px] font-mono px-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: intensity > 0.5 ? '#ffaa33' : '#44aaff', border: `1px solid ${intensity > 0.5 ? 'rgba(255,136,0,0.4)' : 'rgba(0,170,255,0.4)'}` }}>
                        {h}m: {power.toFixed(0)} W/m²
                      </div>
                    </Html>
                  </group>
                );
              })}
            </group>
          )}

          {showTurbulenceField && <TurbulenceFieldViz config={physicsConfig} obstacles={obstacles} />}

          {showWindShear && (
            <group position={[-48, 0, 48]}>
              {/* Vertical gradient ribbon */}
              <mesh position={[-1, 40, 0]}>
                <boxGeometry args={[0.3, 80, 0.3]} />
                <meshBasicMaterial color="#22ff88" transparent opacity={0.15} />
              </mesh>
              {[2, 10, 30, 50, 80].map((h) => {
                const speedH = calculateWindShear(physicsConfig.windSpeed, physicsConfig.referenceHeight, h, physicsConfig.surfaceRoughness);
                const shearExp = h > 1 ? Math.log(speedH / (physicsConfig.windSpeed || 1)) / Math.log(h / physicsConfig.referenceHeight) : 0;
                const norm = Math.min(speedH / 20, 1);
                const r = Math.round(255 * (1 - norm));
                const b = Math.round(255 * norm);
                const barColor = `rgb(${r}, ${Math.round(100 + 100 * norm)}, ${b})`;
                return (
                  <group key={`shear-${h}`}>
                    <mesh position={[0, h, 0]}><boxGeometry args={[speedH * 0.4, 0.2, 0.2]} /><meshBasicMaterial color={barColor} transparent opacity={0.4 + norm * 0.3} /></mesh>
                    <mesh position={[-1, h, 0]}><boxGeometry args={[0.6, 0.06, 0.06]} /><meshBasicMaterial color={barColor} transparent opacity={0.5} /></mesh>
                    <Html position={[speedH * 0.25 + 2, h, 0]} center style={{ pointerEvents: 'none' }}>
                      <div className="text-[7px] font-mono px-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.85)', color: barColor, border: `1px solid ${barColor}40` }}>
                        {h}m: {speedH.toFixed(1)}m/s α≈{Math.abs(shearExp).toFixed(2)}
                      </div>
                    </Html>
                  </group>
                );
              })}
            </group>
          )}

          {/* Wake Map: tapered cones behind obstacles */}
          {showWakeMap && obstacles.map((obs, i) => {
            const cx = obs.x + obs.width / 2, cz = obs.z + obs.depth / 2;
            const angleRad = (physicsConfig.windAngle * Math.PI) / 180;
            const obsSize = Math.max(obs.width, obs.depth) * (obs.scale || 1);
            const wakeLen = obsSize * 4;
            const dx = Math.cos(angleRad), dz = Math.sin(angleRad);
            return (
              <group key={`wake-${i}`}>
                {/* Wake cone mesh */}
                <mesh position={[cx + dx * wakeLen * 0.5, obs.height * 0.4, cz + dz * wakeLen * 0.5]} rotation={[0, -angleRad + Math.PI / 2, Math.PI / 2]}>
                  <coneGeometry args={[obsSize * 0.8, wakeLen, 8, 1, true]} />
                  <meshBasicMaterial color="#44aaff" transparent opacity={0.08} side={THREE.DoubleSide} wireframe />
                </mesh>
                {/* Deficit labels at 3D, 5D, 10D */}
                {[3, 5, 10].map(mult => {
                  const dist = obsSize * mult;
                  if (dist > wakeLen * 1.5) return null;
                  const deficit = Math.max(0, 1 - (1 - Math.sqrt(1 - 0.8)) / Math.pow(1 + 0.075 * dist / (obsSize / 2), 2));
                  const deficitPct = ((1 - deficit) * 100).toFixed(0);
                  return (
                    <Html key={mult} position={[cx + dx * dist, obs.height * 0.6, cz + dz * dist]} center style={{ pointerEvents: 'none' }}>
                      <div className="text-[7px] font-mono px-1 rounded" style={{ backgroundColor: 'rgba(0,20,40,0.85)', color: '#44aaff', border: '1px solid rgba(68,170,255,0.3)' }}>
                        {mult}D: -{deficitPct}%
                      </div>
                    </Html>
                  );
                })}
              </group>
            );
          })}

          {/* Capacity Factor for generators */}
          {showCapacityFactor && <CapacityFactorViz config={physicsConfig} obstacles={obstacles} />}

          {/* Betz Zones for generators */}
          {showBetzOverlay && <BetzOverlayViz config={physicsConfig} obstacles={obstacles} />}

          <group>
            {interactionMode === 'place' && ghostPosition && (
              <GhostObstacle position={[ghostPosition[0], getTerrainYOffset(ghostPosition[0], ghostPosition[2], physicsConfig.terrainSlopeX, physicsConfig.terrainSlopeZ), ghostPosition[2]]}
                obstacleType={selectedObstacleType as ObstacleType} visible={true} generatorSubtype={selectedGeneratorSubtype} rotation={currentGhostRotation} scale={currentGhostScale} />
            )}

            <AdvancedParticleSystem config={physicsConfig} particleCount={particleCount} obstacles={obstacles}
              width={simulationSize.width} height={simulationSize.height} depth={simulationSize.depth}
              onCollisionEnergyUpdate={setCollisionEnergy} onCollisionEvent={handleCollisionEvent}
              onObstacleEnergyUpdate={handleObstacleEnergyUpdate} particleImpact={particleImpact}
              particleTrailLength={particleTrailLength} glowIntensity={particleGlow} pulsation={pulsation}
              particlePreset={particlePreset} />

            <CollisionEffectsManager collisions={collisionEffects} onRemoveCollision={handleRemoveCollision} />
            <CollisionHotspotManager obstacles={obstacles} obstacleEnergies={obstacleEnergies}
              showHotspots={showHotspots} showWakeZones={showWakeZones} windAngle={physicsConfig.windAngle}
              windSpeed={physicsConfig.windSpeed} turbulenceIntensity={physicsConfig.turbulenceIntensity} surfaceRoughness={physicsConfig.surfaceRoughness} />
            <LocalHitManager enabled={showLocalHits} />

            {obstacles.map((obstacle, index) => {
              const offsetY = getTerrainYOffset(obstacle.x + obstacle.width / 2, obstacle.z + obstacle.depth / 2, physicsConfig.terrainSlopeX, physicsConfig.terrainSlopeZ);
              return obstacle.type === 'wind_generator' ? (
                <group key={obstacle.id || index} position={[0, offsetY, 0]}>
                  <WindGenerator3D obstacle={obstacle} config={physicsConfig} isSelected={interactionMode === 'select' && selectedObstacleIndex === index} />
                </group>
              ) : (
                <group key={obstacle.id || index} position={[0, offsetY, 0]}>
                  <Obstacle3D obstacle={obstacle} windSpeed={physicsConfig.windSpeed} windAngle={physicsConfig.windAngle} wobbliness={wobbliness} isSelected={interactionMode === 'select' && selectedObstacleIndex === index} />
                </group>
              );
            })}
          </group>

          <OrbitControls enablePan enableZoom enableRotate minDistance={25} maxDistance={180} maxPolarAngle={Math.PI / 2.1} enableDamping dampingFactor={0.1} rotateSpeed={0.6} />
        </Suspense>
      </Canvas>

      {showHint && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ pointerEvents: 'none' }}>
          <div className="px-3 py-1.5 rounded-full bg-background/90 border border-primary/50 text-primary text-xs font-mono shadow-[0_0_15px_rgba(57,255,20,0.3)]">
            {t('hintRotateScale', lang)}
          </div>
        </div>
      )}

      <div className="absolute top-3 right-3 w-56 z-50" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
        <AdvancedWindControls config={physicsConfig} onConfigChange={handleConfigChange}
          selectedObstacleType={selectedObstacleType} onObstacleTypeChange={setSelectedObstacleType}
          selectedGeneratorSubtype={selectedGeneratorSubtype} onGeneratorSubtypeChange={setSelectedGeneratorSubtype}
          onClearObstacles={clearObstacles} showHotspots={showHotspots} onToggleHotspots={() => setShowHotspots(!showHotspots)}
          showWakeZones={showWakeZones} onToggleWakeZones={() => setShowWakeZones(!showWakeZones)}
          showLocalHits={showLocalHits} onToggleLocalHits={() => setShowLocalHits(!showLocalHits)}
          lang={lang} particleCount={particleCount} onParticleCountChange={setParticleCount}
          particleImpact={particleImpact} onParticleImpactChange={setParticleImpact}
          particleTrailLength={particleTrailLength} onParticleTrailLengthChange={setParticleTrailLength}
          wobbliness={wobbliness} onWobblinessChange={setWobbliness}
          particleGlow={particleGlow} onParticleGlowChange={setParticleGlow}
          pulsation={pulsation} onPulsationChange={setPulsation}
          particlePreset={particlePreset} onParticlePresetChange={handlePresetChange} />
      </div>

      <div className="z-50" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
        <AdvancedMeasurementPanel config={physicsConfig} particleCount={particleCount}
          obstacles={obstacles} collisionEnergy={collisionEnergy}
          activeCollisions={obstacles.length} generatorPower={generatorPower} lang={lang} />
      </div>

      {activeAnalysisCount > 0 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40" style={{ pointerEvents: 'none' }}>
          <div className="px-3 py-1 rounded-full bg-background/80 border border-orange-500/40 text-[9px] font-mono text-orange-400/80 tracking-wide">
            {t('vizWarning', lang)}
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40" style={{ pointerEvents: 'none' }}>
        <p className="text-[9px] text-muted-foreground/70 text-center font-mono bg-background/60 px-3 py-1 rounded-full">
          {interactionMode === 'select' ? t('footerHintSelect', lang) : t('footerHint', lang)}
        </p>
      </div>
    </div>
  );
};
