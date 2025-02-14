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
import { Box, Recycle } from "lucide-react";
import { ThreeScene } from './wind-simulation/ThreeScene';

export interface WindAnimationProps {
  windSpeed: number;
  width?: number;
  height?: number;
  onWindSpeedChange?: (value: number) => void;
}

export const WindAnimation: React.FC<WindAnimationProps> = ({
  windSpeed: initialWindSpeed = 1, // Set default to 1 m/s
  width = 300,
  height = 300,
  onWindSpeedChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const interactionManagerRef = useRef<InteractionManager | null>(null);
  const [localWindSpeed, setLocalWindSpeed] = useState(initialWindSpeed);
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
  const [isTurboMode, setIsTurboMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [threeScene, setThreeScene] = useState<ThreeScene | null>(null);
  const canvas3DRef = useRef<HTMLCanvasElement>(null);

  // Effect for particle system initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(26, 31, 44, 0.97)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    interactionManagerRef.current = new InteractionManager(canvas);

    return () => {
      newParticleSystem.cleanup();
    };
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

    if (mode === "wind") {
      setMousePos({ x: e.clientX, y: e.clientY });
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

  // Effect for 3D scene management
  useEffect(() => {
    if (is3DMode && canvas3DRef.current && !threeScene) {
      const newThreeScene = new ThreeScene(
        canvas3DRef.current,
        containerRef.current?.clientWidth || window.innerWidth,
        containerRef.current?.clientHeight || window.innerHeight
      );
      setThreeScene(newThreeScene);
    }

    return () => {
      if (threeScene) {
        threeScene.cleanup();
      }
    };
  }, [is3DMode]);

  // Effect for 3D transition animation
  useEffect(() => {
    if (threeScene && is3DMode) {
      threeScene.updateObstacles(obstacles, transitionProgress);
      threeScene.render();
    }
  }, [transitionProgress, obstacles, is3DMode]);

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

  // Update particle density handler
  const handleParticleDensityChange = (value: number[]) => {
    const density = isTurboMode ? Math.min(value[0] * 2, 1000) : Math.min(value[0], 100);
    setParticleDensity(density);
    if (particleSystem) {
      particleSystem.updateSettings(localWindSpeed, windAngle, windCurve, density);
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
            <Box className="w-4 h-4" />
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
            <div 
              className="fixed pointer-events-none"
              style={{ 
                left: mousePos.x - 12,
                top: mousePos.y - 12,
                transition: 'all 0.1s ease-out'
              }}
            >
              <Recycle 
                className="w-6 h-6 text-stalker-accent/50 animate-spin"
                style={{ animationDuration: '2s' }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <Checkbox
            id="turboMode"
            checked={isTurboMode}
            onCheckedChange={(checked: boolean) => setIsTurboMode(checked)}
          />
          <Label htmlFor="turboMode">
            Turbo PC Mode 🚀
          </Label>
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
          onParticleDensityChange={handleParticleDensityChange}
          onModeChange={setMode}
          onObstacleTypeChange={setSelectedObstacleType}
          onClearAll={() => setObstacles([])}
          maxParticles={isTurboMode ? 1000 : 100}
        />
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`w-full bg-stalker-dark/97 rounded-lg transition-transform duration-500 ${
            is3DMode ? 'transform-gpu perspective-1000 rotate-x-12 opacity-50' : ''
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
          <>
            <canvas
              ref={canvas3DRef}
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: transitionProgress,
              }}
            />
            <div className="absolute inset-0 pointer-events-none">
              {/* Coordinate axes */}
              <div className="absolute left-4 bottom-4 flex items-end gap-2">
                <div className="h-16 w-0.5 bg-red-500 origin-bottom transform -rotate-90" />
                <div className="h-16 w-0.5 bg-green-500 origin-bottom" />
                <div className="h-16 w-0.5 bg-blue-500 origin-bottom transform rotate-45" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WindAnimation;
