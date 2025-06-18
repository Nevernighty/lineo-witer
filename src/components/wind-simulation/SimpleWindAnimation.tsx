
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
  const [particleCount, setParticleCount] = useState(50);
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

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.update();
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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
      <div className="bg-stalker-dark/30 p-4 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Wind Speed: {windSpeed.toFixed(1)} m/s</Label>
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
            <Label>Wind Angle: {windAngle}°</Label>
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
            <Label>Particles: {particleCount}</Label>
            <Slider
              value={[particleCount]}
              onValueChange={(value) => setParticleCount(value[0])}
              min={10}
              max={200}
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
          >
            Add Obstacles
          </Button>
          <Button
            variant={mode === "wind" ? "default" : "outline"}
            onClick={() => setMode("wind")}
            size="sm"
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
          className="w-full bg-stalker-dark/97 rounded-lg cursor-crosshair border border-stalker-accent/20"
          onClick={handleCanvasClick}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {/* Instructions */}
        <div className="absolute top-2 right-2 bg-stalker-dark/80 p-2 rounded text-xs text-stalker-muted">
          {mode === "add" ? "Click to add obstacles" : "Click to create wind blasts"}
        </div>
      </div>
    </div>
  );
};
