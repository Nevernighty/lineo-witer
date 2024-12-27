import React, { useEffect, useRef, useState } from "react";
import { WindControls } from "./wind-simulation/WindControls";
import { ObstacleRenderer } from "./wind-simulation/ObstacleRenderer";
import { ParticleSystem } from "./wind-simulation/ParticleSystem";
import { InteractionManager } from "./wind-simulation/InteractionManager";
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
  const interactionManagerRef = useRef<InteractionManager | null>(null);
  const [localWindSpeed, setLocalWindSpeed] = useState(windSpeed);
  const [windAngle, setWindAngle] = useState(0);
  const [windCurve, setWindCurve] = useState(0.2);
  const [particleDensity, setParticleDensity] = useState(50);
  const [selectedObstacleType, setSelectedObstacleType] = useState<"tree" | "building" | "skyscraper">("tree");
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [selectedObstacle, setSelectedObstacle] = useState<number | null>(null);
  const [hoveredObstacle, setHoveredObstacle] = useState<number | null>(null);
  const [mode, setMode] = useState<SimulationMode>("add");

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
    
    if (canvasRef.current) {
      interactionManagerRef.current = new InteractionManager(canvasRef.current);
    }

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactionManagerRef.current) return;
    
    interactionManagerRef.current.handleMouseDown(
      e,
      mode,
      obstacles,
      selectedObstacleType,
      setObstacles,
      setSelectedObstacle
    );
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactionManagerRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
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

    interactionManagerRef.current.handleMouseMove(
      e,
      mode,
      obstacles,
      selectedObstacle,
      setObstacles,
      setHoveredObstacle
    );
  };

  const handleMouseUp = () => {
    if (!interactionManagerRef.current) return;
    interactionManagerRef.current.handleMouseUp(setSelectedObstacle);
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
    let particleSystem: ParticleSystem;

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
      if (!particleSystem) {
        particleSystem = new ParticleSystem(
          ctx,
          canvas.width,
          canvas.height,
          localWindSpeed,
          windAngle,
          windCurve,
          particleDensity,
          obstacles
        );
      } else {
        particleSystem.update();
      }

      // Draw erase radius if in erase mode
      if (mode === "erase" && interactionManagerRef.current) {
        const { x, y } = interactionManagerRef.current.getMousePosition(
          new MouseEvent('mousemove', { clientX: 0, clientY: 0 })
        );
        interactionManagerRef.current.drawEraseRadius(ctx, x, y);
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [localWindSpeed, windAngle, windCurve, particleDensity, obstacles, selectedObstacle, hoveredObstacle, mode]);

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