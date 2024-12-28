import { WindTrail } from './types';

export class WindTrails {
  private trails: WindTrail[] = [];
  
  constructor(
    private ctx: CanvasRenderingContext2D,
    private canvasWidth: number,
    private canvasHeight: number
  ) {}

  public addWindTrail(x: number, y: number, angle: number, power: number) {
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
      const speed = trail.power * 2;
      
      const newX = lastPoint.x + Math.cos(angleRad) * speed;
      const newY = lastPoint.y + Math.sin(angleRad) * speed;
      
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
      
      for (let i = 1; i < trail.points.length; i++) {
        this.ctx.lineTo(trail.points[i].x, trail.points[i].y);
      }
      
      const alpha = trail.lifetime / 100;
      this.ctx.strokeStyle = `rgba(57, 255, 20, ${alpha})`;
      this.ctx.lineWidth = trail.power / 2;
      this.ctx.stroke();
    });
  }
}