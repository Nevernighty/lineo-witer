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
  const [windMode, setWindMode] = useState<"normal" | "trails">("normal");
  const [selectedShape, setSelectedShape] = useState<ObstacleShape>("regular");
  const [showWindOnly, setShowWindOnly] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [particleSystem, setParticleSystem] = useState<ParticleSystem | null>(null);

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
      setParticleSystem(new ParticleSystem(
        canvasRef.current.getContext("2d")!,
        canvasRef.current.width,
        canvasRef.current.height,
        localWindSpeed,
        windAngle,
        windCurve,
        particleDensity,
        obstacles
      ));
    }

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === "wind") {
      const { x, y } = interactionManagerRef.current?.getMousePosition(e) || { x: 0, y: 0 };
      if (particleSystem) {
        particleSystem.addWindTrail(x, y, currentAngle);
        setCurrentAngle(prev => (prev + 30) % 360);
      }
      return;
    }

    if (!interactionManagerRef.current) return;
    
    interactionManagerRef.current.handleMouseDown(
      e as React.MouseEvent<HTMLCanvasElement>,
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
      e as React.MouseEvent<HTMLCanvasElement>,
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
    if (!canvas || !particleSystem) return;

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
      particleSystem.update();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [localWindSpeed, windAngle, windCurve, particleDensity, obstacles, selectedObstacle, hoveredObstacle, mode, particleSystem]);

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex flex-col space-y-4 bg-stalker-dark/30 p-4 rounded-lg">
        {/* Wind Controls */}
        <div className="flex items-center space-x-4">
          <Button
            variant={mode === "wind" ? "default" : "outline"}
            onClick={() => setMode("wind")}
            size="sm"
          >
            Подути
          </Button>
          {mode === "wind" && (
            <Select onValueChange={(val: "normal" | "trails") => setWindMode(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Виберіть режим вітру" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Звичайний вітер</SelectItem>
                <SelectItem value="trails">Вітрові сліди</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Obstacle Controls */}
        {mode === "add" && (
          <div className="flex items-center space-x-4">
            <Select onValueChange={(val: ObstacleShape) => setSelectedShape(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Форма перешкоди" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Звичайна</SelectItem>
                <SelectItem value="L">L-подібна</SelectItem>
                <SelectItem value="T">T-подібна</SelectItem>
                <SelectItem value="Y">Y-подібна</SelectItem>
                <SelectItem value="Z">Z-подібна</SelectItem>
                <SelectItem value="Q">Q-подібна</SelectItem>
                <SelectItem value="P">P-подібна</SelectItem>
                <SelectItem value="N">N-подібна</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Wind Generation Settings */}
        <div className="flex items-center space-x-4">
          <Checkbox
            id="windOnly"
            checked={showWindOnly}
            onCheckedChange={(checked: boolean) => setShowWindOnly(checked)}
          />
          <Label htmlFor="windOnly">Показувати вітер тільки по краях</Label>
        </div>

        {/* Existing Controls */}
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
      </div>

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
