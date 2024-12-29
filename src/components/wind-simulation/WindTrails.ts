import { WindTrail } from './types';

export class WindTrails {
  private trails: WindTrail[] = [];
  private readonly MAX_TRAILS = 50;
  
  constructor(
    private ctx: CanvasRenderingContext2D,
    private canvasWidth: number,
    private canvasHeight: number
  ) {}

  public updateDimensions(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  public addWindTrail(x: number, y: number, angle: number, power: number) {
    if (this.trails.length >= this.MAX_TRAILS) {
      this.trails.shift();
    }

    this.trails.push({
      points: [{ x, y }],
      power,
      angle,
      lifetime: 100
    });
  }

  public update() {
    this.trails = this.trails.filter(trail => {
      if (trail.lifetime <= 0) return false;
      
      const lastPoint = trail.points[trail.points.length - 1];
      const angleRad = (trail.angle * Math.PI) / 180;
      const speed = trail.power * 0.5; // Reduced speed for smoother movement
      
      // Add some natural variation
      const turbulence = Math.sin(performance.now() * 0.001 + lastPoint.x * 0.1) * 2;
      
      const newX = lastPoint.x + Math.cos(angleRad) * speed + turbulence;
      const newY = lastPoint.y + Math.sin(angleRad) * speed + turbulence;
      
      trail.points.push({ x: newX, y: newY });
      if (trail.points.length > 50) trail.points.shift();
      
      trail.lifetime--;
      return true;
    });
  }

  public draw() {
    this.trails.forEach(trail => {
      if (trail.points.length < 2) return;
      
      this.ctx.beginPath();
      this.ctx.moveTo(trail.points[0].x, trail.points[0].y);
      
      // Use quadratic curves for smoother trails
      for (let i = 1; i < trail.points.length - 1; i++) {
        const xc = (trail.points[i].x + trail.points[i + 1].x) / 2;
        const yc = (trail.points[i].y + trail.points[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(
          trail.points[i].x,
          trail.points[i].y,
          xc,
          yc
        );
      }
      
      const alpha = (trail.lifetime / 100) * 0.8; // Fade out gradually
      this.ctx.strokeStyle = `rgba(57, 255, 20, ${alpha})`;
      this.ctx.lineWidth = trail.power / 4;
      this.ctx.stroke();
    });
  }
}