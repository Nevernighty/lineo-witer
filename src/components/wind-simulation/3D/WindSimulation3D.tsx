import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Stats } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ParticleSystem3D } from './ParticleSystem3D';
import { Obstacle3D } from './Obstacle3D';
import { MeasurementPanel } from './MeasurementPanel';
import { Obstacle, OBSTACLE_CATEGORIES, ObstacleType } from '../types';
import * as THREE from 'three';

interface WindSimulation3DProps {
  windSpeed?: number;
  width?: number;
  height?: number;
}

export const WindSimulation3D: React.FC<WindSimulation3DProps> = ({
  windSpeed: initialWindSpeed = 8,
  width = 800,
  height = 600
}) => {
  const [windSpeed, setWindSpeed] = useState(initialWindSpeed);
  const [windAngle, setWindAngle] = useState(0);
  const [windElevation, setWindElevation] = useState(0);
  const [particleCount, setParticleCount] = useState(150);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [selectedObstacleType, setSelectedObstacleType] = useState<string>('tree');
  const [collisionEnergy, setCollisionEnergy] = useState(0);
  const [showStats, setShowStats] = useState(false);

  const simulationSize = {
    width: 100,
    height: 50,
    depth: 100
  };

  const activeCollisions = obstacles.filter(obs => 
    // This would be calculated from particles, simplified for now
    Math.random() < 0.1
  ).length;

  const addObstacle = (x: number, y: number, z: number) => {
    const category = Object.entries(OBSTACLE_CATEGORIES).find(([_, cat]) => 
      cat.types.includes(selectedObstacleType as ObstacleType)
    );
    
    if (!category) return;

    const [categoryKey, categoryData] = category;
    const newObstacle: Obstacle = {
      id: `obstacle-${Date.now()}`,
      type: selectedObstacleType as any,
      category: categoryKey as any,
      shape: 'regular',
      x: x - 5,
      y: y - 10,
      z: z - 5,
      width: selectedObstacleType === 'skyscraper' ? 15 : 10,
      height: selectedObstacleType === 'tree' ? 20 : selectedObstacleType === 'skyscraper' ? 40 : 15,
      depth: 10,
      density: categoryData.defaultProperties.density,
      material: categoryData.defaultProperties.material as any,
      resistance: categoryData.defaultProperties.resistance
    };
    
    setObstacles(prev => [...prev, newObstacle]);
  };

  const clearObstacles = () => {
    setObstacles([]);
  };

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [50, 30, 50], fov: 60 }}
        style={{ width: width, height: height }}
        onPointerDown={(e) => {
          if (e.altKey) return; // Allow camera controls with Alt
          
          try {
            // Convert screen coordinates to world coordinates
            const target = e.target as HTMLElement;
            if (!target || typeof target.getBoundingClientRect !== 'function') return;
            
            const rect = target.getBoundingClientRect();
            if (!rect) return;
            
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            // Simple 3D point calculation
            addObstacle(
              x * simulationSize.width / 2,
              0,
              y * simulationSize.depth / 2
            );
          } catch (error) {
            console.warn('Error handling canvas interaction:', error);
          }
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />

          {/* Environment */}
          <Grid 
            args={[simulationSize.width, simulationSize.depth]}
            cellSize={5}
            cellThickness={0.5}
            cellColor="#39ff14"
            sectionSize={20}
            sectionThickness={1}
            sectionColor="#39ff14"
            fadeDistance={100}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={false}
          />

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
          />

          {/* Obstacles */}
          {obstacles.map((obstacle, index) => (
            <Obstacle3D
              key={obstacle.id || index}
              obstacle={obstacle}
            />
          ))}

          {/* Controls */}
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          
          {/* Performance Stats */}
          {showStats && <Stats />}
        </Suspense>
      </Canvas>

      {/* Control Panel */}
      <div className="absolute top-4 right-4 space-y-3 max-w-xs">
        <div className="bg-slate-900/90 p-4 rounded-lg space-y-4 border border-green-500/20">
          <div className="space-y-3">
            <div>
              <Label className="text-green-400 text-xs">Wind Speed: {windSpeed.toFixed(1)} m/s</Label>
              <Slider
                value={[windSpeed]}
                onValueChange={(value) => setWindSpeed(value[0])}
                min={0}
                max={25}
                step={0.1}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-green-400 text-xs">Wind Direction: {windAngle}°</Label>
              <Slider
                value={[windAngle]}
                onValueChange={(value) => setWindAngle(value[0])}
                min={0}
                max={360}
                step={1}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-green-400 text-xs">Wind Elevation: {windElevation}°</Label>
              <Slider
                value={[windElevation]}
                onValueChange={(value) => setWindElevation(value[0])}
                min={-45}
                max={45}
                step={1}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-green-400 text-xs">Particles: {particleCount}</Label>
              <Slider
                value={[particleCount]}
                onValueChange={(value) => setParticleCount(value[0])}
                min={50}
                max={500}
                step={25}
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-blue-400 text-xs">Add Obstacle:</Label>
            <Select value={selectedObstacleType} onValueChange={setSelectedObstacleType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OBSTACLE_CATEGORIES).map(([categoryKey, category]) => 
                  category.types.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)} ({category.name})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={clearObstacles}
              variant="destructive"
              size="sm"
              className="text-xs flex-1"
            >
              Clear All
            </Button>
            <Button
              onClick={() => setShowStats(!showStats)}
              variant="outline"
              size="sm"
              className="text-xs flex-1"
            >
              {showStats ? 'Hide' : 'Show'} Stats
            </Button>
          </div>

          <div className="text-xs text-slate-400">
            Click to add obstacles • Alt+Drag to rotate view
          </div>
        </div>
      </div>

      {/* Measurement Panel */}
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