import React, { useEffect, useRef, useState } from "react";
import { WindControls } from "./wind-simulation/WindControls";
import { ObstacleRenderer } from "./wind-simulation/ObstacleRenderer";
import { WindParticleSystem } from "./wind-simulation/WindParticleSystem";
import { Obstacle, SimulationMode } from "./wind-simulation/types";

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
  const [windAngle, setWindAngle] = useState(0);
  const [windCurve, setWindCurve] = useState(0.2);
  const [particleDensity, setParticleDensity] = useState(100);
  const [selectedObstacleType, setSelectedObstacleType] = useState<"tree" | "building" | "skyscraper">("tree");
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [selectedObstacle, setSelectedObstacle] = useState<number | null>(null);
  const [hoveredObstacle, setHoveredObstacle] = useState<number | null>(null);
  const [mode, setMode] = useState<SimulationMode>("add");
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

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

  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePosition(e);
    setDragStart({ x, y });

    if (mode === "add") {
      const newObstacle: Obstacle = {
        type: selectedObstacleType,
        x,
        y,
        width: selectedObstacleType === "tree" ? 30 : selectedObstacleType === "building" ? 60 : 80,
        height: selectedObstacleType === "tree" ? 40 : selectedObstacleType === "building" ? 80 : 120,
        shape: "regular"
      };
      setObstacles([...obstacles, newObstacle]);
    } else if (mode === "draw") {
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePosition(e);
    
    // Update cursor style based on mode and hover state
    const canvas = canvasRef.current;
    if (canvas) {
      if (mode === "move") {
        canvas.style.cursor = "move";
      } else if (mode === "resize") {
        canvas.style.cursor = "nw-resize";
      } else if (mode === "draw") {
        canvas.style.cursor = "crosshair";
      } else if (mode === "erase") {
        canvas.style.cursor = "no-drop";
      } else {
        canvas.style.cursor = "default";
      }
    }

    // Handle obstacle movement
    if (dragStart && selectedObstacle !== null && mode === "move") {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      
      setObstacles(obstacles.map((obstacle, index) => 
        index === selectedObstacle
          ? { ...obstacle, x: obstacle.x + dx, y: obstacle.y + dy }
          : obstacle
      ));
      setDragStart({ x, y });
    }

    // Handle drawing
    if (isDrawing && mode === "draw") {
      const newObstacle: Obstacle = {
        type: "building",
        x,
        y,
        width: 20,
        height: 20
      };
      setObstacles([...obstacles, newObstacle]);
    }

    // Update hovered obstacle
    const hoveredIndex = obstacles.findIndex(obstacle =>
      x >= obstacle.x && x <= obstacle.x + obstacle.width &&
      y >= obstacle.y && y <= obstacle.y + obstacle.height
    );
    setHoveredObstacle(hoveredIndex);
  };

  const handleMouseUp = () => {
    setDragStart(null);
    setIsDrawing(false);
  };

  const handleWindSpeedChange = (value: number[]) => {
    const newSpeed = value[0];
    setLocalWindSpeed(newSpeed);
    if (onWindSpeedChange) {
      onWindSpeedChange(newSpeed);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const animate = () => {
      ctx.fillStyle = "rgba(26, 31, 44, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render obstacles
      ObstacleRenderer({
        ctx,
        obstacles,
        selectedObstacle,
        hoveredObstacle
      });

      // Update and render particles
      WindParticleSystem({
        ctx,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        windSpeed: localWindSpeed,
        windAngle,
        windCurve,
        particleDensity,
        obstacles
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [localWindSpeed, windAngle, windCurve, particleDensity, obstacles, selectedObstacle, hoveredObstacle]);

  return (
    <div className="space-y-4" ref={containerRef}>
      <WindControls
        windSpeed={localWindSpeed}
        windAngle={windAngle}
        windCurve={windCurve}
        particleDensity={particleDensity}
        selectedMode={mode}
        selectedObstacle={selectedObstacleType}
        onWindSpeedChange={handleWindSpeedChange}
        onWindAngleChange={(value) => setWindAngle(value[0])}
        onWindCurveChange={(value) => setWindCurve(value[0])}
        onParticleDensityChange={(value) => setParticleDensity(value[0])}
        onModeChange={setMode}
        onObstacleTypeChange={setSelectedObstacleType}
        onClearAll={() => setObstacles([])}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full bg-stalker-dark/50 rounded-lg"
        style={{ minHeight: "300px" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default WindAnimation;