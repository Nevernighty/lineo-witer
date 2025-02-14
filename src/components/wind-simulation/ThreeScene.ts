
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Obstacle } from './types';

export class ThreeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private obstacles3D: THREE.Mesh[] = [];
  private axes: THREE.AxesHelper;
  private animationProgress: number = 0;
  private gridHelper: THREE.GridHelper;
  
  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    // Initialize scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    const directionalLight = new THREE.DirectionalLight(0x39ff14, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(ambientLight, directionalLight);
    
    // Setup camera and controls
    this.camera.position.set(5, 5, 5);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    
    // Add axes helper
    this.axes = new THREE.AxesHelper(5);
    this.axes.visible = false;
    this.scene.add(this.axes);

    // Add grid helper
    this.gridHelper = new THREE.GridHelper(10, 10);
    this.gridHelper.visible = false;
    this.scene.add(this.gridHelper);

    // Start animation loop
    this.animate();
  }

  public updateObstacles(obstacles: Obstacle[], progress: number) {
    this.animationProgress = progress;
    
    // Remove existing obstacles
    this.obstacles3D.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.obstacles3D = [];

    // Create new obstacles with proper 3D extrusion
    obstacles.forEach(obstacle => {
      const geometry = new THREE.BoxGeometry(
        obstacle.width / 50,
        obstacle.height / 50,
        obstacle.depth || 1
      );
      
      const material = new THREE.MeshPhongMaterial({
        color: 0x39ff14,
        opacity: 0.5,
        transparent: true,
        side: THREE.DoubleSide,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = (obstacle.x - window.innerWidth / 2) / 50;
      mesh.position.y = -(obstacle.y - window.innerHeight / 2) / 50;
      mesh.position.z = (obstacle.z || 0) / 50;
      
      this.scene.add(mesh);
      this.obstacles3D.push(mesh);
    });

    // Animate grid and axes appearance
    this.axes.visible = progress > 0;
    this.gridHelper.visible = progress > 0;
    this.axes.scale.setScalar(progress);
    this.gridHelper.scale.setScalar(progress);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

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
    this.controls.dispose();
  }
}
