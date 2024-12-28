import { Obstacle } from "./types";

interface ObstacleRendererProps {
  ctx: CanvasRenderingContext2D;
  obstacles: Obstacle[];
  selectedObstacle: number | null;
  hoveredObstacle: number | null;
}

export const ObstacleRenderer = ({
  ctx,
  obstacles,
  selectedObstacle,
  hoveredObstacle,
}: ObstacleRendererProps) => {
  const drawGlassmorphism = (x: number, y: number, width: number, height: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.filter = 'blur(4px)';
    ctx.fillRect(x, y, width, height);
    ctx.filter = 'none';
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  };

  const drawTree = (obstacle: Obstacle) => {
    const { x, y, width, height } = obstacle;
    
    // Draw glassmorphism effect
    ctx.fillStyle = "rgba(45, 74, 28, 0.6)";
    ctx.filter = "blur(4px)";
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
    
    // Draw sharp edges
    ctx.filter = "none";
    ctx.strokeStyle = "rgba(57, 255, 20, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw trunk with glassmorphism
    ctx.fillStyle = "rgba(74, 55, 40, 0.7)";
    ctx.fillRect(x + width * 0.4, y + height * 0.8, width * 0.2, height * 0.2);
  };

  const drawBuilding = (obstacle: Obstacle) => {
    const { x, y, width, height } = obstacle;
    
    // Glassmorphism background
    ctx.fillStyle = "rgba(74, 74, 74, 0.4)";
    ctx.filter = "blur(4px)";
    ctx.fillRect(x, y, width, height);
    
    // Sharp edges
    ctx.filter = "none";
    ctx.strokeStyle = "rgba(57, 255, 20, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Windows with glow
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    const windowSize = width * 0.15;
    const gap = width * 0.1;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        ctx.beginPath();
        ctx.roundRect(
          x + gap + i * (windowSize + gap),
          y + gap + j * (windowSize + gap),
          windowSize,
          windowSize,
          4
        );
        ctx.fill();
      }
    }
  };

  const drawSkyscraper = (obstacle: Obstacle) => {
    const { x, y, width, height, shape } = obstacle;
    
    switch (shape) {
      case 'L':
        drawGlassmorphism(x, y, width * 0.3, height, 'rgba(110, 110, 110, 0.4)');
        drawGlassmorphism(x, y + height * 0.7, width, height * 0.3, 'rgba(110, 110, 110, 0.4)');
        break;
      case 'T':
        drawGlassmorphism(x, y, width, height * 0.3, 'rgba(110, 110, 110, 0.4)');
        drawGlassmorphism(x + width * 0.35, y, width * 0.3, height, 'rgba(110, 110, 110, 0.4)');
        break;
      // Add other shape implementations
      default:
        drawGlassmorphism(x, y, width, height, 'rgba(110, 110, 110, 0.4)');
    }
    
    // Add windows
    const windowSize = width * 0.1;
    const gap = width * 0.05;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 10; j++) {
        ctx.beginPath();
        ctx.roundRect(
          x + gap + i * (windowSize + gap),
          y + gap + j * (windowSize + gap),
          windowSize,
          windowSize,
          4
        );
        ctx.fill();
      }
    }
  };

  obstacles.forEach((obstacle, index) => {
    switch (obstacle.type) {
      case "tree":
        drawTree(obstacle);
        break;
      case "building":
        drawBuilding(obstacle);
        break;
      case "skyscraper":
        drawSkyscraper(obstacle);
        break;
    }
    
    if (index === selectedObstacle || index === hoveredObstacle) {
      drawSelection(obstacle);
    }
  });

  return null;
};
