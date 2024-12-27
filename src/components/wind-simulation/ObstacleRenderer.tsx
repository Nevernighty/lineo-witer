import { useEffect, useRef } from "react";
import { Obstacle } from "./types";

interface ObstacleRendererProps {
  ctx: CanvasRenderingContext2D;
  obstacles: Obstacle[];
  selectedObstacle: number | null;
  hoveredObstacle: number | null;
}

export const ObstacleRenderer: React.FC<ObstacleRendererProps> = ({
  ctx,
  obstacles,
  selectedObstacle,
  hoveredObstacle,
}) => {
  const drawTree = (obstacle: Obstacle) => {
    const { x, y, width, height } = obstacle;
    ctx.fillStyle = "#2d4a1c";
    
    // Draw triangle for tree
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
    
    // Draw trunk
    ctx.fillStyle = "#4a3728";
    ctx.fillRect(x + width * 0.4, y + height * 0.8, width * 0.2, height * 0.2);
  };

  const drawBuilding = (obstacle: Obstacle) => {
    const { x, y, width, height, shape = "regular" } = obstacle;
    ctx.fillStyle = "#4a4a4a";
    
    if (shape === "L") {
      ctx.fillRect(x, y, width * 0.6, height);
      ctx.fillRect(x + width * 0.6, y + height * 0.4, width * 0.4, height * 0.6);
    } else if (shape === "T") {
      ctx.fillRect(x, y, width, height * 0.4);
      ctx.fillRect(x + width * 0.3, y + height * 0.4, width * 0.4, height * 0.6);
    } else {
      ctx.fillRect(x, y, width, height);
    }
    
    // Draw windows
    ctx.fillStyle = "#ffffff33";
    const windowSize = width * 0.15;
    const gap = width * 0.1;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        ctx.fillRect(
          x + gap + i * (windowSize + gap),
          y + gap + j * (windowSize + gap),
          windowSize,
          windowSize
        );
      }
    }
  };

  const drawSkyscraper = (obstacle: Obstacle) => {
    const { x, y, width, height } = obstacle;
    ctx.fillStyle = "#6e6e6e";
    ctx.fillRect(x, y, width, height);
    
    // Draw windows
    ctx.fillStyle = "#ffffff33";
    const windowSize = width * 0.1;
    const gap = width * 0.05;
    
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 10; j++) {
        ctx.fillRect(
          x + gap + i * (windowSize + gap),
          y + gap + j * (windowSize + gap),
          windowSize,
          windowSize
        );
      }
    }
  };

  const drawSelection = (obstacle: Obstacle) => {
    const { x, y, width, height } = obstacle;
    ctx.strokeStyle = "#39FF14";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
    ctx.setLineDash([]);
    
    // Draw resize handles
    ctx.fillStyle = "#39FF14";
    const handleSize = 8;
    [
      [x - handleSize/2, y - handleSize/2],
      [x + width - handleSize/2, y - handleSize/2],
      [x - handleSize/2, y + height - handleSize/2],
      [x + width - handleSize/2, y + height - handleSize/2]
    ].forEach(([hx, hy]) => {
      ctx.fillRect(hx, hy, handleSize, handleSize);
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