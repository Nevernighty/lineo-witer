import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WindControls } from "./wind-simulation/WindControls";
import { ObstacleRenderer } from "./wind-simulation/ObstacleRenderer";
import { ParticleSystem } from "./wind-simulation/ParticleSystem";
import { InteractionManager } from "./wind-simulation/InteractionManager";
import { Obstacle, SimulationMode, ObstacleShape } from "./wind-simulation/types";
import { Cube } from "lucide-react";

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
  const [selectedObstacleType, setSelectedObstacleType] = useState<"tree" | "building" | "skyscraper" | "wind">("tree");
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [selectedObstacle, setSelectedObstacle] = useState<number | null>(null);
  const [hoveredObstacle, setHoveredObstacle] = useState<number | null>(null);
  const [mode, setMode] = useState<SimulationMode>("add");
  const [windMode, setWindMode] = useState<"normal" | "trails">("normal");
  const [selectedShape, setSelectedShape] = useState<ObstacleShape>("regular");
  const [showWindOnly, setShowWindOnly] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [particleSystem, setParticleSystem] = useState<ParticleSystem | null>(null);
  const [collisionEnergy, setCollisionEnergy] = useState(0);
  const [is3DMode, setIs3DMode] = useState(false);
  const [canvasRef3D, setCanvasRef3D] = useState<HTMLCanvasElement | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Add title
    ctx.font = '24px monospace';
    ctx.fillStyle = 'rgba(57, 255, 20, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('СИМУЛЯЦІЯ', canvas.width / 2, 30);

    // Initialize ParticleSystem with updated physics
    const newParticleSystem = new ParticleSystem(
      ctx,
      canvas.width,
      canvas.height,
      localWindSpeed,
      windAngle,
      windCurve,
      particleDensity,
      obstacles
    );

    setParticleSystem(newParticleSystem);

    // Initialize InteractionManager
    interactionManagerRef.current = new InteractionManager(canvas);
  }, []);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && canvasRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = Math.min(window.innerHeight * 0.5, containerWidth * 0.6);
        
        canvasRef.current.width = containerWidth;
        canvasRef.current.height = containerHeight;
        
        if (particleSystem) {
          particleSystem.updateDimensions(containerWidth, containerHeight);
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [particleSystem]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === "wind") {
      const { x, y } = interactionManagerRef.current?.getMousePosition(e) || { x: 0, y: 0 };
      if (particleSystem) {
        const blastPower = windMode === "normal" ? localWindSpeed * 2 : localWindSpeed * 4;
        particleSystem.addWindTrail(x, y, windAngle, blastPower);
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
      // Update collision energy
      if (particleSystem) {
        setCollisionEnergy(particleSystem.getCollisionEnergy());
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [localWindSpeed, windAngle, windCurve, particleDensity, obstacles, selectedObstacle, hoveredObstacle, mode, particleSystem]);

  const handle3DToggle = () => {
    setIs3DMode(prev => !prev);
    // Trigger transition animation
    if (!is3DMode) {
      // Start transition to 3D
      setTransitionProgress(0);
      const animate = () => {
        setTransitionProgress(prev => {
          if (prev >= 1) return prev;
          requestAnimationFrame(animate);
          return prev + 0.02;
        });
      };
      animate();
    } else {
      // Reverse transition
      setTransitionProgress(1);
      const animate = () => {
        setTransitionProgress(prev => {
          if (prev <= 0) return prev;
          requestAnimationFrame(animate);
          return prev - 0.02;
        });
      };
      animate();
    }
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex flex-col space-y-4 bg-stalker-dark/30 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <Button
            variant={is3DMode ? "default" : "outline"}
            onClick={handle3DToggle}
            className="flex items-center gap-2"
          >
            <Cube className="w-4 h-4" />
            3D Mode
          </Button>
        </div>

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

        <div className="flex items-center space-x-4">
          <Checkbox
            id="windOnly"
            checked={showWindOnly}
            onCheckedChange={(checked: boolean) => setShowWindOnly(checked)}
          />
          <Label htmlFor="windOnly">Показувати вітер тільки по краях</Label>
        </div>

        <WindControls
          windSpeed={localWindSpeed}
          windAngle={windAngle}
          windCurve={windCurve}
          particleDensity={particleDensity}
          selectedMode={mode}
          selectedObstacle={selectedObstacleType}
          collisionEnergy={collisionEnergy}
          onWindSpeedChange={handleWindSpeedChange}
          onWindAngleChange={(value) => {
            setWindAngle(value[0]);
            if (particleSystem) {
              particleSystem.updateSettings(localWindSpeed, value[0], windCurve, particleDensity);
            }
          }}
          onWindCurveChange={(value) => {
            setWindCurve(value[0]);
            if (particleSystem) {
              particleSystem.updateSettings(localWindSpeed, windAngle, value[0], particleDensity);
            }
          }}
          onParticleDensityChange={(value) => {
            setParticleDensity(value[0]);
            if (particleSystem) {
              particleSystem.updateSettings(localWindSpeed, windAngle, windCurve, value[0]);
            }
          }}
          onModeChange={setMode}
          onObstacleTypeChange={setSelectedObstacleType}
          onClearAll={() => setObstacles([])}
        />
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`w-full bg-stalker-dark/50 rounded-lg transition-transform duration-500 ${
            is3DMode ? 'transform-gpu perspective-1000 rotate-x-12' : ''
          }`}
          style={{ 
            height: "50vh",
            transform: is3DMode ? `perspective(1000px) rotateX(${12 * transitionProgress}deg)` : 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {is3DMode && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(rgba(57, 255, 20, ${0.1 * transitionProgress}), transparent)`,
              boxShadow: `0 0 20px rgba(57, 255, 20, ${0.2 * transitionProgress})`
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WindAnimation;
