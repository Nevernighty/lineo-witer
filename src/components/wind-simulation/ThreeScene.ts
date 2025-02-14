
import * as THREE from 'three';
import { Obstacle } from './types';

export class ThreeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private obstacles3D: THREE.Mesh[] = [];
  
  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    this.renderer.setSize(width, height);
    
    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    const directionalLight = new THREE.DirectionalLight(0x39ff14, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(ambientLight, directionalLight);
    
    // Position camera
    this.camera.position.z = 5;
  }

  public updateObstacles(obstacles: Obstacle[], progress: number) {
    // Clear existing obstacles
    this.obstacles3D.forEach(mesh => this.scene.remove(mesh));
    this.obstacles3D = [];

    // Create new obstacles with extrusion based on progress
    obstacles.forEach(obstacle => {
      const geometry = new THREE.BoxGeometry(
        obstacle.width / 50, 
        obstacle.height / 50, 
        1 * progress
      );
      
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x39ff14,
        opacity: 0.5,
        transparent: true,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = (obstacle.x - window.innerWidth / 2) / 50;
      mesh.position.y = -(obstacle.y - window.innerHeight / 2) / 50;
      mesh.position.z = 0;
      
      this.scene.add(mesh);
      this.obstacles3D.push(mesh);
    });
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public cleanup() {
    this.obstacles3D.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.obstacles3D = [];
  }
}
