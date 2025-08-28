
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { NewParticleSystem } from "./NewParticleSystem";
import { ObstacleRenderer } from "./ObstacleRenderer";
import { Obstacle, SimulationMode } from "./types";

interface SimpleWindAnimationProps {
  windSpeed?: number;
  width?: number;
  height?: number;
}

export const SimpleWindAnimation: React.FC<SimpleWindAnimationProps> = ({
  windSpeed: initialWindSpeed = 5,
  width = 800,
  height = 400
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particleSystemRef = useRef<NewParticleSystem | null>(null);
  const animationRef = useRef<number | null>(null);

  const [windSpeed, setWindSpeed] = useState(initialWindSpeed);
  const [windAngle, setWindAngle] = useState(0);
  const [particleCount, setParticleCount] = useState(100);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [mode, setMode] = useState<SimulationMode>("add");
  const [selectedObstacle, setSelectedObstacle] = useState<string>("tree");

  // Initialize particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Create particle system
    particleSystemRef.current = new NewParticleSystem(
      ctx,
      width,
      height,
      windSpeed,
      windAngle,
      particleCount,
      obstacles
    );

    return () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.cleanup();
      }
    };
  }, [width, height]);

  // Update obstacles in particle system when they change
  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.setObstacles(obstacles);
    }
  }, [obstacles]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.update();
        
        // Draw obstacles on top of particles
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx && obstacles.length > 0) {
            ObstacleRenderer({ 
              ctx, 
              obstacles, 
              selectedObstacle: null, 
              hoveredObstacle: null 
            });
          }
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [obstacles]);

  // Update particle system when settings change
  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.updateSettings(windSpeed, windAngle, particleCount);
    }
  }, [windSpeed, windAngle, particleCount]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === "add") {
      // Add obstacle
      const newObstacle: Obstacle = {
        type: selectedObstacle as any,
        category: 'structure', // Default category
        shape: "regular",
        x: x - 25,
        y: y - 25,
        z: 0,
        width: 50,
        height: 50,
        depth: 1
      };
      setObstacles(prev => [...prev, newObstacle]);
    } else if (mode === "wind") {
      // Add wind blast
      if (particleSystemRef.current) {
        particleSystemRef.current.addWindBlast(x, y);
      }
    }
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Controls */}
      <div className="bg-slate-900/30 p-4 rounded-lg space-y-4 backdrop-blur-sm border border-green-500/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-green-400">Wind Speed: {windSpeed.toFixed(1)} m/s</Label>
            <Slider
              value={[windSpeed]}
              onValueChange={(value) => setWindSpeed(value[0])}
              min={0}
              max={20}
              step={0.1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-green-400">Wind Angle: {windAngle}°</Label>
            <Slider
              value={[windAngle]}
              onValueChange={(value) => setWindAngle(value[0])}
              min={0}
              max={360}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-green-400">Particles: {particleCount}</Label>
            <Slider
              value={[particleCount]}
              onValueChange={(value) => setParticleCount(value[0])}
              min={20}
              max={300}
              step={10}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === "add" ? "default" : "outline"}
            onClick={() => setMode("add")}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            Add Obstacles
          </Button>
          <Button
            variant={mode === "wind" ? "default" : "outline"}
            onClick={() => setMode("wind")}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Wind Blast
          </Button>
          <Button
            variant="destructive"
            onClick={() => setObstacles([])}
            size="sm"
          >
            Clear All
          </Button>
        </div>

        {mode === "add" && (
          <div className="flex gap-2">
            {["tree", "building", "skyscraper"].map((type) => (
              <Button
                key={type}
                variant={selectedObstacle === type ? "default" : "outline"}
                onClick={() => setSelectedObstacle(type)}
                size="sm"
                className={selectedObstacle === type ? "bg-green-600" : ""}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full bg-slate-900/90 rounded-lg cursor-crosshair border border-green-500/30"
          onClick={handleCanvasClick}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {/* Instructions */}
        <div className="absolute top-2 right-2 bg-slate-900/80 p-2 rounded text-xs text-green-400 border border-green-500/30">
          {mode === "add" ? "Click to add obstacles" : "Click to create wind blasts"}
        </div>
        
        {/* Collision Info */}
        <div className="absolute bottom-2 left-2 bg-slate-900/80 p-2 rounded text-xs text-orange-400 border border-orange-500/30">
          Orange particles = Active collisions | Yellow bursts = Wind blasts
        </div>
      </div>
    </div>
  );
};
