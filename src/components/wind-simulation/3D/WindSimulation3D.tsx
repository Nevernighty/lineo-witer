import React, { useState, Suspense, useCallback, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Stats } from '@react-three/drei';
import { AdvancedParticleSystem } from './AdvancedParticleSystem';
import { Obstacle3D } from './Obstacle3D';
import { AdvancedMeasurementPanel } from './AdvancedMeasurementPanel';
import { AdvancedWindControls } from './AdvancedWindControls';
import { GhostObstacle } from './GhostObstacle';
import { CollisionEffectsManager } from './CollisionEffect';
import { CollisionHotspotManager } from './CollisionHotspot';
import { WindPhysicsConfig, DEFAULT_WIND_PHYSICS } from './WindPhysicsEngine';
import { Obstacle, OBSTACLE_CATEGORIES, ObstacleType } from '../types';
import * as THREE from 'three';

interface WindSimulation3DProps {
  windSpeed?: number;
  onWindSpeedChange?: (speed: number) => void;
}

// Mouse tracker component for ghost preview
const MouseTracker: React.FC<{
  onPositionChange: (pos: [number, number, number] | null) => void;
  simulationSize: { width: number; height: number; depth: number };
}> = ({ onPositionChange, simulationSize }) => {
  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectPoint = useRef(new THREE.Vector3());

  useFrame(({ mouse }) => {
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
  onWindSpeedChange
}) => {
  const [physicsConfig, setPhysicsConfig] = useState<WindPhysicsConfig>({
    ...DEFAULT_WIND_PHYSICS,
    windSpeed: initialWindSpeed
  });
  const [particleCount, setParticleCount] = useState(250);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [selectedObstacleType, setSelectedObstacleType] = useState<string>('building');
  const [collisionEnergy, setCollisionEnergy] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showHotspots, setShowHotspots] = useState(false);
  const [showWakeZones, setShowWakeZones] = useState(false);
  const [ghostPosition, setGhostPosition] = useState<[number, number, number] | null>(null);
  const [obstacleEnergies, setObstacleEnergies] = useState<Map<string, number>>(new Map());
  const [collisionEffects, setCollisionEffects] = useState<Array<{
    id: string;
    position: [number, number, number];
    intensity: number;
  }>>([]);

  // Sync with parent wind speed
  useEffect(() => {
    setPhysicsConfig(prev => ({ ...prev, windSpeed: initialWindSpeed }));
  }, [initialWindSpeed]);

  const handleConfigChange = (newConfig: WindPhysicsConfig) => {
    setPhysicsConfig(newConfig);
    onWindSpeedChange?.(newConfig.windSpeed);
  };

  const simulationSize = {
    width: 100,
    height: 50,
    depth: 100
  };

  const activeCollisions = obstacles.length;

  const addObstacle = useCallback((x: number, y: number, z: number) => {
    const category = Object.entries(OBSTACLE_CATEGORIES).find(([_, cat]) => 
      cat.types.includes(selectedObstacleType as ObstacleType)
    );
    
    if (!category) return;

    const [categoryKey, categoryData] = category;
    const obstacleId = `obstacle-${Date.now()}`;
    const newObstacle: Obstacle = {
      id: obstacleId,
      type: selectedObstacleType as ObstacleType,
      category: categoryKey as "vegetation" | "structure" | "barrier",
      shape: 'regular',
      x: x - 5,
      y: 0,
      z: z - 5,
      width: selectedObstacleType === 'skyscraper' ? 15 : selectedObstacleType === 'tower' ? 5 : 10,
      height: selectedObstacleType === 'tree' ? 20 : selectedObstacleType === 'skyscraper' ? 45 : selectedObstacleType === 'tower' ? 35 : 15,
      depth: selectedObstacleType === 'tower' ? 5 : 10,
      density: categoryData.defaultProperties.density,
      material: categoryData.defaultProperties.material,
      resistance: categoryData.defaultProperties.resistance
    };
    
    setObstacles(prev => [...prev, newObstacle]);
  }, [selectedObstacleType]);

  const clearObstacles = () => {
    setObstacles([]);
    setCollisionEnergy(0);
    setObstacleEnergies(new Map());
  };

  const handleCollisionEvent = useCallback((event: { id: string; position: [number, number, number]; intensity: number }) => {
    setCollisionEffects(prev => [...prev, event]);
  }, []);

  const handleRemoveCollision = useCallback((id: string) => {
    setCollisionEffects(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleObstacleEnergyUpdate = useCallback((energies: Map<string, number>) => {
    setObstacleEnergies(energies);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas - Full size */}
      <Canvas
        camera={{ position: [70, 45, 70], fov: 50 }}
        className="!absolute inset-0"
        onPointerDown={(e) => {
          if (e.altKey) return;
          if (ghostPosition) {
            addObstacle(ghostPosition[0], 0, ghostPosition[2]);
          }
        }}
      >
        <Suspense fallback={null}>
          {/* Enhanced Lighting */}
          <ambientLight intensity={0.35} />
          <directionalLight position={[30, 40, 20]} intensity={0.9} color="#ffffff" />
          <pointLight position={[-30, 25, -30]} intensity={0.5} color="#39ff14" />
          <pointLight position={[30, 15, 30]} intensity={0.4} color="#00ffff" />
          <hemisphereLight args={['#87CEEB', '#363636', 0.3]} />

          {/* Mouse Tracker */}
          <MouseTracker 
            onPositionChange={setGhostPosition} 
            simulationSize={simulationSize} 
          />

          {/* Environment Grid */}
          <Grid 
            args={[simulationSize.width, simulationSize.depth]}
            cellSize={5}
            cellThickness={0.5}
            cellColor="#1a4a3a"
            sectionSize={20}
            sectionThickness={1}
            sectionColor="#39ff14"
            fadeDistance={150}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={false}
          />

          {/* Ghost Preview */}
          {ghostPosition && (
            <GhostObstacle
              position={ghostPosition}
              obstacleType={selectedObstacleType as ObstacleType}
              visible={true}
            />
          )}

          {/* Advanced Particle System */}
          <AdvancedParticleSystem
            config={physicsConfig}
            particleCount={particleCount}
            obstacles={obstacles}
            width={simulationSize.width}
            height={simulationSize.height}
            depth={simulationSize.depth}
            onCollisionEnergyUpdate={setCollisionEnergy}
            onCollisionEvent={handleCollisionEvent}
            onObstacleEnergyUpdate={handleObstacleEnergyUpdate}
          />

          {/* Collision Effects */}
          <CollisionEffectsManager
            collisions={collisionEffects}
            onRemoveCollision={handleRemoveCollision}
          />

          {/* Collision Hotspots & Wake Zones */}
          <CollisionHotspotManager
            obstacles={obstacles}
            obstacleEnergies={obstacleEnergies}
            showHotspots={showHotspots}
            showWakeZones={showWakeZones}
            windAngle={physicsConfig.windAngle}
          />

          {/* Obstacles */}
          {obstacles.map((obstacle, index) => (
            <Obstacle3D
              key={obstacle.id || index}
              obstacle={obstacle}
            />
          ))}

          {/* Controls */}
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            minDistance={25}
            maxDistance={180}
            maxPolarAngle={Math.PI / 2.1}
          />
          
          {showStats && <Stats />}
        </Suspense>
      </Canvas>

      {/* Advanced Control Panel - Right side */}
      <div className="absolute top-3 right-3 w-56 z-10">
        <AdvancedWindControls
          config={physicsConfig}
          onConfigChange={handleConfigChange}
          selectedObstacleType={selectedObstacleType}
          onObstacleTypeChange={setSelectedObstacleType}
          onClearObstacles={clearObstacles}
          onToggleStats={() => setShowStats(!showStats)}
          showStats={showStats}
          showHotspots={showHotspots}
          onToggleHotspots={() => setShowHotspots(!showHotspots)}
          showWakeZones={showWakeZones}
          onToggleWakeZones={() => setShowWakeZones(!showWakeZones)}
        />
      </div>

      {/* Advanced Measurement Panel - Left side */}
      <AdvancedMeasurementPanel
        config={physicsConfig}
        particleCount={particleCount}
        obstacles={obstacles}
        collisionEnergy={collisionEnergy}
        activeCollisions={activeCollisions}
      />
    </div>
  );
};
