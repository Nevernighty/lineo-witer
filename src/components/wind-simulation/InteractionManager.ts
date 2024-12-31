import { Obstacle, SimulationMode, ObstacleType } from './types';

export class InteractionManager {
  private canvas: HTMLCanvasElement;
  private selectedObstacle: number | null = null;
  private hoveredObstacle: number | null = null;
  private isResizing: boolean = false;
  private resizeHandle: string | null = null;
  private dragOffset: { x: number; y: number } | null = null;
  private eraseRadius: number = 30;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  public getMousePosition(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  public findObstacleAtPosition(x: number, y: number, obstacles: Obstacle[]): number {
    return obstacles.findIndex(obstacle =>
      x >= obstacle.x && x <= obstacle.x + obstacle.width &&
      y >= obstacle.y && y <= obstacle.y + obstacle.height
    );
  }

  public handleMouseDown(
    e: React.MouseEvent<HTMLCanvasElement>,
    mode: SimulationMode,
    obstacles: Obstacle[],
    selectedObstacleType: ObstacleType,
    setObstacles: (obstacles: Obstacle[]) => void,
    setSelectedObstacle: (index: number | null) => void
  ) {
    const { x, y } = this.getMousePosition(e);

    switch (mode) {
      case "add":
        const newObstacle: Obstacle = {
          type: selectedObstacleType,
          x,
          y,
          width: selectedObstacleType === "tree" ? 30 : selectedObstacleType === "building" ? 60 : selectedObstacleType === "wind" ? 40 : 80,
          height: selectedObstacleType === "tree" ? 40 : selectedObstacleType === "building" ? 80 : selectedObstacleType === "wind" ? 40 : 120,
          shape: "regular"
        };
        setObstacles([...obstacles, newObstacle]);
        break;

      case "move":
        const obstacleIndex = this.findObstacleAtPosition(x, y, obstacles);
        if (obstacleIndex !== -1) {
          this.dragOffset = {
            x: x - obstacles[obstacleIndex].x,
            y: y - obstacles[obstacleIndex].y
          };
          setSelectedObstacle(obstacleIndex);
        }
        break;

      case "resize":
        const resizeIndex = this.findObstacleAtPosition(x, y, obstacles);
        if (resizeIndex !== -1) {
          this.isResizing = true;
          setSelectedObstacle(resizeIndex);
          // Determine which handle was clicked
          const obstacle = obstacles[resizeIndex];
          const handleSize = 8;
          const handles = [
            { name: 'nw', x: obstacle.x, y: obstacle.y },
            { name: 'ne', x: obstacle.x + obstacle.width, y: obstacle.y },
            { name: 'sw', x: obstacle.x, y: obstacle.y + obstacle.height },
            { name: 'se', x: obstacle.x + obstacle.width, y: obstacle.y + obstacle.height }
          ];
          
          const clickedHandle = handles.find(handle => 
            Math.abs(handle.x - x) < handleSize && Math.abs(handle.y - y) < handleSize
          );
          
          if (clickedHandle) {
            this.resizeHandle = clickedHandle.name;
          }
        }
        break;

      case "erase":
        const updatedObstacles = obstacles.filter(obstacle => {
          const centerX = obstacle.x + obstacle.width / 2;
          const centerY = obstacle.y + obstacle.height / 2;
          const distance = Math.sqrt(Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2));
          return distance > this.eraseRadius;
        });
        setObstacles(updatedObstacles);
        break;
    }
  }

  public handleMouseMove(
    e: React.MouseEvent<HTMLCanvasElement>,
    mode: SimulationMode,
    obstacles: Obstacle[],
    selectedObstacle: number | null,
    setObstacles: (obstacles: Obstacle[]) => void,
    setHoveredObstacle: (index: number | null) => void
  ) {
    const { x, y } = this.getMousePosition(e);

    if (mode === "move" && selectedObstacle !== null && this.dragOffset) {
      const newObstacles = [...obstacles];
      newObstacles[selectedObstacle] = {
        ...newObstacles[selectedObstacle],
        x: x - this.dragOffset.x,
        y: y - this.dragOffset.y
      };
      setObstacles(newObstacles);
    } else if (mode === "resize" && selectedObstacle !== null && this.isResizing && this.resizeHandle) {
      const newObstacles = [...obstacles];
      const obstacle = newObstacles[selectedObstacle];
      
      switch (this.resizeHandle) {
        case 'nw':
          obstacle.width += obstacle.x - x;
          obstacle.height += obstacle.y - y;
          obstacle.x = x;
          obstacle.y = y;
          break;
        case 'ne':
          obstacle.width = x - obstacle.x;
          obstacle.height += obstacle.y - y;
          obstacle.y = y;
          break;
        case 'sw':
          obstacle.width += obstacle.x - x;
          obstacle.height = y - obstacle.y;
          obstacle.x = x;
          break;
        case 'se':
          obstacle.width = x - obstacle.x;
          obstacle.height = y - obstacle.y;
          break;
      }
      
      // Ensure minimum size
      obstacle.width = Math.max(20, obstacle.width);
      obstacle.height = Math.max(20, obstacle.height);
      
      setObstacles(newObstacles);
    }

    // Update hovered state
    const hoveredIndex = this.findObstacleAtPosition(x, y, obstacles);
    setHoveredObstacle(hoveredIndex);
  }

  public handleMouseUp(setSelectedObstacle: (index: number | null) => void) {
    this.dragOffset = null;
    this.isResizing = false;
    this.resizeHandle = null;
    setSelectedObstacle(null);
  }

  public drawEraseRadius(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.beginPath();
    ctx.arc(x, y, this.eraseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}