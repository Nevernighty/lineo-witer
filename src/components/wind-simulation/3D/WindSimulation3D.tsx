import React, { useState, Suspense, useCallback, useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { AdvancedParticleSystem } from './AdvancedParticleSystem';
import { Obstacle3D } from './Obstacle3D';
import { WindGenerator3D, calculateGeneratorPower } from './WindGenerator3D';
import { AdvancedMeasurementPanel } from './AdvancedMeasurementPanel';
import { AdvancedWindControls } from './AdvancedWindControls';
import { GhostObstacle } from './GhostObstacle';
import { CollisionEffectsManager } from './CollisionEffect';
import { CollisionHotspotManager } from './CollisionHotspot';
import { LocalHitManager } from './LocalHitPopup';
import { WindPhysicsConfig, DEFAULT_WIND_PHYSICS } from './WindPhysicsEngine';
import { Obstacle, OBSTACLE_CATEGORIES, ObstacleType, GeneratorSubtype } from '../types';
import { t, type Lang } from '@/utils/i18n';
import { playPlaceSound, playRotateSound, playClearSound, playScaleSound } from '@/utils/sounds';
import * as THREE from 'three';

interface WindSimulation3DProps {
  windSpeed?: number;
  onWindSpeedChange?: (speed: number) => void;
  lang: Lang;
}

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
    // Always use flat ground plane for object placement
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
  windSpeed: initialWindSpeed = 8,
  onWindSpeedChange,
  lang
}) => {
  const [physicsConfig, setPhysicsConfig] = useState<WindPhysicsConfig>({
    ...DEFAULT_WIND_PHYSICS,
    windSpeed: initialWindSpeed
  });
  const [particleCount, setParticleCount] = useState(250);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [selectedObstacleType, setSelectedObstacleType] = useState<string>('building');
  const [selectedGeneratorSubtype, setSelectedGeneratorSubtype] = useState<GeneratorSubtype>('hawt3');
  const [collisionEnergy, setCollisionEnergy] = useState(0);
  const [showHotspots, setShowHotspots] = useState(false);
  const [showWakeZones, setShowWakeZones] = useState(false);
  const [showLocalHits, setShowLocalHits] = useState(true);
  const [ghostPosition, setGhostPosition] = useState<[number, number, number] | null>(null);
  const [obstacleEnergies, setObstacleEnergies] = useState<Map<string, number>>(new Map());
  const [collisionEffects, setCollisionEffects] = useState<Array<{
    id: string; position: [number, number, number]; intensity: number;
  }>>([]);
  const [showHint, setShowHint] = useState(false);
  const [currentGhostRotation, setCurrentGhostRotation] = useState(0);
  const [currentGhostRotationX, setCurrentGhostRotationX] = useState(0);
  const [currentGhostRotationZ, setCurrentGhostRotationZ] = useState(0);
  const [currentGhostScale, setCurrentGhostScale] = useState(1);
  const lastPlacedIdRef = useRef<string | null>(null);

  useEffect(() => {
    setPhysicsConfig(prev => ({ ...prev, windSpeed: initialWindSpeed }));
  }, [initialWindSpeed]);

  const handleConfigChange = (newConfig: WindPhysicsConfig) => {
    setPhysicsConfig(newConfig);
    onWindSpeedChange?.(newConfig.windSpeed);
  };

  const simulationSize = { width: 100, height: 50, depth: 100 };

  const generatorPower = useMemo(() => {
    return obstacles
      .filter(o => o.type === 'wind_generator')
      .reduce((sum, o) => {
        return sum + calculateGeneratorPower(
          physicsConfig.airDensity, o.width * 1.8, physicsConfig.windSpeed,
          o.height + o.y, physicsConfig.referenceHeight, physicsConfig.surfaceRoughness,
          o.generatorSubtype || 'hawt3'
        );
      }, 0);
  }, [obstacles, physicsConfig]);

  // Keyboard controls: arrows=Y rotation, Q/E=scale, A/D=X tilt, Z/C=Z tilt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toLowerCase();
      const lastId = lastPlacedIdRef.current;
      
      const modifyObstacle = (fn: (obs: Obstacle) => Obstacle) => {
        if (lastId) {
          setObstacles(prev => prev.map(obs => obs.id === lastId ? fn(obs) : obs));
        }
      };

      const modifyGhostOrObstacle = (
        obsFn: (obs: Obstacle) => Obstacle,
        ghostFn: () => void
      ) => {
        if (lastId && obstacles.some(o => o.id === lastId)) {
          modifyObstacle(obsFn);
        } else {
          ghostFn();
        }
      };

      switch (key) {
        case 'arrowleft':
          e.preventDefault();
          modifyGhostOrObstacle(
            obs => ({ ...obs, rotation: ((obs.rotation || 0) - 15) % 360 }),
            () => setCurrentGhostRotation(prev => (prev - 15) % 360)
          );
          playRotateSound();
          break;
        case 'arrowright':
          e.preventDefault();
          modifyGhostOrObstacle(
            obs => ({ ...obs, rotation: ((obs.rotation || 0) + 15) % 360 }),
            () => setCurrentGhostRotation(prev => (prev + 15) % 360)
          );
          playRotateSound();
          break;
        case 'q':
          e.preventDefault();
          modifyGhostOrObstacle(
            obs => ({ ...obs, scale: Math.max(0.3, (obs.scale || 1) - 0.1) }),
            () => setCurrentGhostScale(prev => Math.max(0.3, prev - 0.1))
          );
          playScaleSound();
          break;
        case 'e':
          e.preventDefault();
          modifyGhostOrObstacle(
            obs => ({ ...obs, scale: Math.min(3.0, (obs.scale || 1) + 0.1) }),
            () => setCurrentGhostScale(prev => Math.min(3.0, prev + 0.1))
          );
          playScaleSound();
          break;
        case 'a':
          e.preventDefault();
          modifyGhostOrObstacle(
            obs => ({ ...obs, rotationX: ((obs.rotationX || 0) - 10 * Math.PI / 180) }),
            () => setCurrentGhostRotationX(prev => prev - 10 * Math.PI / 180)
          );
          playRotateSound();
          break;
        case 'd':
          e.preventDefault();
          modifyGhostOrObstacle(
            obs => ({ ...obs, rotationX: ((obs.rotationX || 0) + 10 * Math.PI / 180) }),
            () => setCurrentGhostRotationX(prev => prev + 10 * Math.PI / 180)
          );
          playRotateSound();
          break;
        case 'z':
          e.preventDefault();
          modifyGhostOrObstacle(
            obs => ({ ...obs, rotationZ: ((obs.rotationZ || 0) - 10 * Math.PI / 180) }),
            () => setCurrentGhostRotationZ(prev => prev - 10 * Math.PI / 180)
          );
          playRotateSound();
          break;
        case 'c':
          e.preventDefault();
          modifyGhostOrObstacle(
            obs => ({ ...obs, rotationZ: ((obs.rotationZ || 0) + 10 * Math.PI / 180) }),
            () => setCurrentGhostRotationZ(prev => prev + 10 * Math.PI / 180)
          );
          playRotateSound();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [obstacles]);

  const addObstacle = useCallback((x: number, y: number, z: number) => {
    const category = Object.entries(OBSTACLE_CATEGORIES).find(([_, cat]) => 
      cat.types.includes(selectedObstacleType as ObstacleType)
    );
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
      id: obstacleId,
      type: selectedObstacleType as ObstacleType,
      category: categoryKey as any,
      shape: 'regular',
      x: x - width / 2, y: 0, z: z - depth / 2,
      width, height, depth,
      density: categoryData.defaultProperties.density,
      material: categoryData.defaultProperties.material,
      resistance: categoryData.defaultProperties.resistance,
      rotation: currentGhostRotation,
      rotationX: currentGhostRotationX,
      rotationZ: currentGhostRotationZ,
      scale: currentGhostScale,
      ...(selectedObstacleType === 'wind_generator' ? { generatorSubtype: selectedGeneratorSubtype } : {})
    };
    
    setObstacles(prev => [...prev, newObstacle]);
    lastPlacedIdRef.current = obstacleId;
    playPlaceSound();
    
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  }, [selectedObstacleType, selectedGeneratorSubtype, currentGhostRotation, currentGhostRotationX, currentGhostRotationZ, currentGhostScale]);

  const clearObstacles = () => {
    setObstacles([]);
    setCollisionEnergy(0);
    setObstacleEnergies(new Map());
    lastPlacedIdRef.current = null;
    playClearSound();
  };

  const handleCollisionEvent = useCallback((event: { id: string; position: [number, number, number]; intensity: number }) => {
    setCollisionEffects(prev => [...prev, event]);
    if ((window as any).__localHitAdd) {
      const speed = event.intensity;
      const energy = 0.5 * 0.015 * speed * speed * physicsConfig.airDensity;
      (window as any).__localHitAdd(event.position, energy);
    }
  }, [physicsConfig.airDensity]);

  const handleRemoveCollision = useCallback((id: string) => {
    setCollisionEffects(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleObstacleEnergyUpdate = useCallback((energies: Map<string, number>) => {
    setObstacleEnergies(energies);
  }, []);

  const terrainRotation: [number, number, number] = [
    (physicsConfig.terrainSlopeZ * Math.PI) / 180,
    0,
    -(physicsConfig.terrainSlopeX * Math.PI) / 180
  ];

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [70, 45, 70], fov: 50 }}
        className="!absolute inset-0"
        style={{ pointerEvents: 'auto' }}
        onPointerDown={(e) => {
          if (e.altKey) return;
          if (ghostPosition) {
            addObstacle(ghostPosition[0], 0, ghostPosition[2]);
          }
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <directionalLight position={[30, 40, 20]} intensity={0.9} color="#ffffff" />
          <pointLight position={[-30, 25, -30]} intensity={0.5} color="#39ff14" />
          <pointLight position={[30, 15, 30]} intensity={0.4} color="#00ffff" />
          <hemisphereLight args={['#87CEEB', '#363636', 0.3]} />

          <MouseTracker onPositionChange={setGhostPosition} simulationSize={simulationSize} slopeX={physicsConfig.terrainSlopeX} slopeZ={physicsConfig.terrainSlopeZ} />

          {/* Grid tilts with terrain — separate from objects */}
          <group rotation={terrainRotation}>
            <Grid 
              args={[simulationSize.width, simulationSize.depth]}
              cellSize={5} cellThickness={0.5} cellColor="#1a4a3a"
              sectionSize={20} sectionThickness={1} sectionColor="#39ff14"
              fadeDistance={150} fadeStrength={1} followCamera={false} infiniteGrid={false}
            />
          </group>

          {/* Objects stay upright — no terrain rotation */}
          <group>
            {ghostPosition && (
              <GhostObstacle
                position={ghostPosition}
                obstacleType={selectedObstacleType as ObstacleType}
                visible={true}
                generatorSubtype={selectedGeneratorSubtype}
                rotation={currentGhostRotation}
                rotationX={currentGhostRotationX}
                rotationZ={currentGhostRotationZ}
                scale={currentGhostScale}
              />
            )}

            <AdvancedParticleSystem
              config={physicsConfig} particleCount={particleCount}
              obstacles={obstacles} width={simulationSize.width}
              height={simulationSize.height} depth={simulationSize.depth}
              onCollisionEnergyUpdate={setCollisionEnergy}
              onCollisionEvent={handleCollisionEvent}
              onObstacleEnergyUpdate={handleObstacleEnergyUpdate}
            />

            <CollisionEffectsManager collisions={collisionEffects} onRemoveCollision={handleRemoveCollision} />
            
            <CollisionHotspotManager
              obstacles={obstacles} obstacleEnergies={obstacleEnergies}
              showHotspots={showHotspots} showWakeZones={showWakeZones}
              windAngle={physicsConfig.windAngle} windSpeed={physicsConfig.windSpeed}
              turbulenceIntensity={physicsConfig.turbulenceIntensity}
              surfaceRoughness={physicsConfig.surfaceRoughness}
            />

            <LocalHitManager enabled={showLocalHits} />

            {obstacles.map((obstacle, index) => (
              obstacle.type === 'wind_generator' ? (
                <WindGenerator3D key={obstacle.id || index} obstacle={obstacle} config={physicsConfig} />
              ) : (
                <Obstacle3D key={obstacle.id || index} obstacle={obstacle} />
              )
            ))}
          </group>

          <OrbitControls 
            enablePan enableZoom enableRotate
            minDistance={25} maxDistance={180} maxPolarAngle={Math.PI / 2.1}
          />
        </Suspense>
      </Canvas>

      {/* Hint badge after placing object */}
      {showHint && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{ pointerEvents: 'none' }}>
          <div className="px-3 py-1.5 rounded-full bg-[#0d1117]/90 border border-primary/50 text-primary text-xs font-mono shadow-[0_0_15px_rgba(57,255,20,0.3)]">
            {t('hintRotateScale', lang)}
          </div>
        </div>
      )}

      {/* Controls panel */}
      <div className="absolute top-3 right-3 w-56 z-10" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
        <AdvancedWindControls
          config={physicsConfig} onConfigChange={handleConfigChange}
          selectedObstacleType={selectedObstacleType} onObstacleTypeChange={setSelectedObstacleType}
          selectedGeneratorSubtype={selectedGeneratorSubtype} onGeneratorSubtypeChange={setSelectedGeneratorSubtype}
          onClearObstacles={clearObstacles}
          showHotspots={showHotspots} onToggleHotspots={() => setShowHotspots(!showHotspots)}
          showWakeZones={showWakeZones} onToggleWakeZones={() => setShowWakeZones(!showWakeZones)}
          showLocalHits={showLocalHits} onToggleLocalHits={() => setShowLocalHits(!showLocalHits)}
          lang={lang}
          particleCount={particleCount}
          onParticleCountChange={setParticleCount}
        />
      </div>

      {/* Measurements */}
      <div style={{ pointerEvents: 'auto', overflow: 'visible' }}>
        <AdvancedMeasurementPanel
          config={physicsConfig} particleCount={particleCount}
          obstacles={obstacles} collisionEnergy={collisionEnergy}
          activeCollisions={obstacles.length} generatorPower={generatorPower}
          lang={lang}
        />
      </div>
    </div>
  );
};
