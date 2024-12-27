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
    const { x, y, width, height } = obstacle;
    
    // Glassmorphism background
    ctx.fillStyle = "rgba(110, 110, 110, 0.4)";
    ctx.filter = "blur(4px)";
    ctx.fillRect(x, y, width, height);
    
    // Sharp edges
    ctx.filter = "none";
    ctx.strokeStyle = "rgba(57, 255, 20, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Windows with glow
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    const windowSize = width * 0.1;
    const gap = width * 0.05;
    
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

  const drawSelection = (obstacle: Obstacle) => {
    const { x, y, width, height } = obstacle;
    
    // Glowing border
    ctx.strokeStyle = "rgba(57, 255, 20, 0.8)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
    ctx.setLineDash([]);
    
    // Resize handles with glow
    ctx.fillStyle = "rgba(57, 255, 20, 0.8)";
    const handleSize = 8;
    [
      [x - handleSize/2, y - handleSize/2],
      [x + width - handleSize/2, y - handleSize/2],
      [x - handleSize/2, y + height - handleSize/2],
      [x + width - handleSize/2, y + height - handleSize/2]
    ].forEach(([hx, hy]) => {
      ctx.beginPath();
      ctx.roundRect(hx, hy, handleSize, handleSize, 2);
      ctx.fill();
    });
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