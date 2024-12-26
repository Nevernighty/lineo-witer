import React, { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Obstacle {
  type: "tree" | "building" | "skyscraper";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindAnimationProps {
  windSpeed: number;
  width?: number;
  height?: number;
  onWindSpeedChange?: (value: number) => void;
}

export const WindAnimation: React.FC<WindAnimationProps> = ({ 
  windSpeed, 
  width = 300, 
  height = 300,
  onWindSpeedChange 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [localWindSpeed, setLocalWindSpeed] = useState(windSpeed);
  const [selectedObstacle, setSelectedObstacle] = useState<"tree" | "building" | "skyscraper">("tree");
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draggedObstacle, setDraggedObstacle] = useState<number | null>(null);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add new obstacle
    const newObstacle: Obstacle = {
      type: selectedObstacle,
      x,
      y,
      width: selectedObstacle === "tree" ? 20 : selectedObstacle === "building" ? 40 : 60,
      height: selectedObstacle === "tree" ? 30 : selectedObstacle === "building" ? 60 : 100
    };

    setObstacles([...obstacles, newObstacle]);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on existing obstacle
    const clickedObstacleIndex = obstacles.findIndex(obstacle => 
      x >= obstacle.x && x <= obstacle.x + obstacle.width &&
      y >= obstacle.y && y <= obstacle.y + obstacle.height
    );

    if (clickedObstacleIndex !== -1) {
      setDraggedObstacle(clickedObstacleIndex);
    } else {
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && draggedObstacle === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedObstacle !== null) {
      const newObstacles = [...obstacles];
      newObstacles[draggedObstacle] = {
        ...newObstacles[draggedObstacle],
        x,
        y
      };
      setObstacles(newObstacles);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setDraggedObstacle(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
    }> = [];

    const createParticles = () => {
      particles = [];
      const particleCount = Math.min(Math.floor(localWindSpeed * 10), 100);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: (localWindSpeed / 10) * (Math.random() + 0.5),
          speedY: (Math.random() - 0.5) * localWindSpeed / 5
        });
      }
    };

    const drawObstacles = () => {
      obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.type === "tree" ? "#2d4a1c" : 
                       obstacle.type === "building" ? "#4a4a4a" : "#6e6e6e";
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      });
    };

    const checkCollision = (particle: { x: number; y: number; speedX: number; speedY: number }) => {
      obstacles.forEach(obstacle => {
        if (
          particle.x >= obstacle.x - 5 && 
          particle.x <= obstacle.x + obstacle.width + 5 &&
          particle.y >= obstacle.y - 5 && 
          particle.y <= obstacle.y + obstacle.height + 5
        ) {
          // Reflect particles based on collision side
          if (particle.x <= obstacle.x || particle.x >= obstacle.x + obstacle.width) {
            particle.speedX *= -0.5;
          }
          if (particle.y <= obstacle.y || particle.y >= obstacle.y + obstacle.height) {
            particle.speedY *= -0.5;
          }
          
          // Add turbulence
          particle.speedY += (Math.random() - 0.5) * localWindSpeed / 2;
        }
      });
    };

    const animate = () => {
      ctx.fillStyle = "rgba(26, 31, 44, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawObstacles();

      particles.forEach((particle, i) => {
        ctx.fillStyle = `rgba(57, 255, 20, ${0.5 + Math.random() * 0.5})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        checkCollision(particle);

        particles[i].x += particle.speedX;
        particles[i].y += particle.speedY;

        if (particles[i].x > canvas.width) particles[i].x = 0;
        if (particles[i].y > canvas.height) particles[i].y = 0;
        if (particles[i].y < 0) particles[i].y = canvas.height;
      });

      requestAnimationFrame(animate);
    };

    createParticles();
    animate();
  }, [localWindSpeed, obstacles]);

  const handleWindSpeedChange = (value: number[]) => {
    const newSpeed = value[0];
    setLocalWindSpeed(newSpeed);
    if (onWindSpeedChange) {
      onWindSpeedChange(newSpeed);
    }
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex items-center gap-4">
        <span className="text-sm text-stalker-muted">Wind Speed: {localWindSpeed.toFixed(1)} m/s</span>
        <Slider
          defaultValue={[windSpeed]}
          max={20}
          min={0}
          step={0.1}
          onValueChange={handleWindSpeedChange}
          className="flex-1"
        />
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <Label className="text-sm text-stalker-muted">Obstacles:</Label>
        <RadioGroup
          defaultValue="tree"
          onValueChange={(value) => setSelectedObstacle(value as "tree" | "building" | "skyscraper")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="tree" id="tree" />
            <Label htmlFor="tree">Trees</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="building" id="building" />
            <Label htmlFor="building">Buildings</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="skyscraper" id="skyscraper" />
            <Label htmlFor="skyscraper">Skyscrapers</Label>
          </div>
        </RadioGroup>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full bg-stalker-dark/50 rounded-lg cursor-crosshair"
        style={{ minHeight: "200px" }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default WindAnimation;