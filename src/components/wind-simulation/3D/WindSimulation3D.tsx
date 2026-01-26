import React, { useState, Suspense, useCallback, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Stats } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ParticleSystem3D } from './ParticleSystem3D';
import { Obstacle3D } from './Obstacle3D';
import { MeasurementPanel } from './MeasurementPanel';
import { GhostObstacle } from './GhostObstacle';
import { CollisionEffectsManager } from './CollisionEffect';
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
  const [windSpeed, setWindSpeed] = useState(initialWindSpeed);
  const [windAngle, setWindAngle] = useState(0);
  const [windElevation, setWindElevation] = useState(0);
  const [particleCount, setParticleCount] = useState(200);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [selectedObstacleType, setSelectedObstacleType] = useState<string>('building');
  const [collisionEnergy, setCollisionEnergy] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [ghostPosition, setGhostPosition] = useState<[number, number, number] | null>(null);
  const [collisionEffects, setCollisionEffects] = useState<Array<{
    id: string;
    position: [number, number, number];
    intensity: number;
  }>>([]);

  // Sync with parent wind speed
  useEffect(() => {
    setWindSpeed(initialWindSpeed);
  }, [initialWindSpeed]);

  const handleWindSpeedChange = (value: number) => {
    setWindSpeed(value);
    onWindSpeedChange?.(value);
  };

  const simulationSize = {
    width: 100,
    height: 50,
    depth: 100
  };

  const activeCollisions = obstacles.filter(() => Math.random() < 0.1).length;

  const addObstacle = useCallback((x: number, y: number, z: number) => {
    const category = Object.entries(OBSTACLE_CATEGORIES).find(([_, cat]) => 
      cat.types.includes(selectedObstacleType as ObstacleType)
    );
    
    if (!category) return;

    const [categoryKey, categoryData] = category;
    const newObstacle: Obstacle = {
      id: `obstacle-${Date.now()}`,
      type: selectedObstacleType as ObstacleType,
      category: categoryKey as "vegetation" | "structure" | "barrier",
      shape: 'regular',
      x: x - 5,
      y: 0,
      z: z - 5,
      width: selectedObstacleType === 'skyscraper' ? 15 : 10,
      height: selectedObstacleType === 'tree' ? 20 : selectedObstacleType === 'skyscraper' ? 40 : 15,
      depth: 10,
      density: categoryData.defaultProperties.density,
      material: categoryData.defaultProperties.material,
      resistance: categoryData.defaultProperties.resistance
    };
    
    setObstacles(prev => [...prev, newObstacle]);
  }, [selectedObstacleType]);

  const clearObstacles = () => {
    setObstacles([]);
  };

  const handleCollisionEvent = useCallback((event: { id: string; position: [number, number, number]; intensity: number }) => {
    setCollisionEffects(prev => [...prev, event]);
  }, []);

  const handleRemoveCollision = useCallback((id: string) => {
    setCollisionEffects(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas - Full size */}
      <Canvas
        camera={{ position: [60, 40, 60], fov: 55 }}
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
          <ambientLight intensity={0.3} />
          <directionalLight position={[20, 30, 10]} intensity={0.8} color="#ffffff" />
          <pointLight position={[-20, 20, -20]} intensity={0.4} color="#39ff14" />
          <pointLight position={[20, 10, 20]} intensity={0.3} color="#00ffff" />

          {/* Mouse Tracker */}
          <MouseTracker 
            onPositionChange={setGhostPosition} 
            simulationSize={simulationSize} 
          />

          {/* Environment Grid */}
          <Grid 
            args={[simulationSize.width, simulationSize.depth]}
            cellSize={5}
            cellThickness={0.6}
            cellColor="#1a4a3a"
            sectionSize={20}
            sectionThickness={1.2}
            sectionColor="#39ff14"
            fadeDistance={120}
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

          {/* Particle System */}
          <ParticleSystem3D
            windSpeed={windSpeed}
            windAngle={windAngle}
            windElevation={windElevation}
            particleCount={particleCount}
            obstacles={obstacles}
            width={simulationSize.width}
            height={simulationSize.height}
            depth={simulationSize.depth}
            onCollisionEnergyUpdate={setCollisionEnergy}
            onCollisionEvent={handleCollisionEvent}
          />

          {/* Collision Effects */}
          <CollisionEffectsManager
            collisions={collisionEffects}
            onRemoveCollision={handleRemoveCollision}
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
            minDistance={20}
            maxDistance={150}
          />
          
          {showStats && <Stats />}
        </Suspense>
      </Canvas>

      {/* Control Panel - Right side - Compact */}
      <div className="absolute top-3 right-3 w-52 z-10">
        <div className="bg-card/95 backdrop-blur-sm p-2.5 rounded-lg space-y-2 border border-primary/30 shadow-lg">
          <div className="space-y-1.5">
            <div>
              <Label className="text-primary text-[10px] font-semibold uppercase tracking-wide">
                Wind Speed: {windSpeed.toFixed(1)} m/s
              </Label>
              <Slider
                value={[windSpeed]}
                onValueChange={(value) => handleWindSpeedChange(value[0])}
                min={0}
                max={25}
                step={0.5}
                className="mt-0.5"
              />
            </div>
            
            <div>
              <Label className="text-primary text-[10px] font-semibold uppercase tracking-wide">
                Direction: {windAngle}°
              </Label>
              <Slider
                value={[windAngle]}
                onValueChange={(value) => setWindAngle(value[0])}
                min={0}
                max={360}
                step={5}
                className="mt-0.5"
              />
            </div>
            
            <div>
              <Label className="text-primary text-[10px] font-semibold uppercase tracking-wide">
                Elevation: {windElevation}°
              </Label>
              <Slider
                value={[windElevation]}
                onValueChange={(value) => setWindElevation(value[0])}
                min={-45}
                max={45}
                step={5}
                className="mt-0.5"
              />
            </div>
            
            <div>
              <Label className="text-primary text-[10px] font-semibold uppercase tracking-wide">
                Particles: {particleCount}
              </Label>
              <Slider
                value={[particleCount]}
                onValueChange={(value) => setParticleCount(value[0])}
                min={50}
                max={500}
                step={25}
                className="mt-0.5"
              />
            </div>
          </div>

          <div className="pt-1.5 border-t border-border/30">
            <Label className="text-muted-foreground text-[10px] uppercase tracking-wide">Add Obstacle</Label>
            <Select value={selectedObstacleType} onValueChange={setSelectedObstacleType}>
              <SelectTrigger className="h-7 text-xs mt-0.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OBSTACLE_CATEGORIES).map(([categoryKey, category]) => 
                  category.types.map(type => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-1.5 pt-1">
            <Button
              onClick={clearObstacles}
              variant="destructive"
              size="sm"
              className="text-[10px] flex-1 h-6 px-2"
            >
              Clear
            </Button>
            <Button
              onClick={() => setShowStats(!showStats)}
              variant="outline"
              size="sm"
              className="text-[10px] flex-1 h-6 px-2"
            >
              Stats
            </Button>
          </div>

          <p className="text-[9px] text-muted-foreground text-center pt-1 border-t border-border/20">
            Click to place • Alt+Drag to rotate
          </p>
        </div>
      </div>

      {/* Measurement Panel - Left side */}
      <MeasurementPanel
        windSpeed={windSpeed}
        windAngle={windAngle}
        windElevation={windElevation}
        particleCount={particleCount}
        obstacles={obstacles}
        collisionEnergy={collisionEnergy}
        activeCollisions={activeCollisions}
      />
    </div>
  );
};
