import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Obstacle } from '../types';
import { InstancedParticles } from './InstancedParticles';
import * as THREE from 'three';

interface WindParticle {
  x: number;
  y: number;
  z: number;
  size: number;
  speedX: number;
  speedY: number;
  speedZ: number;
  hasCollided: boolean;
  collisionTimer: number;
  power: number;
}

interface CollisionEvent {
  id: string;
  position: [number, number, number];
  intensity: number;
}

interface ParticleSystem3DProps {
  windSpeed: number;
  windAngle: number;
  windElevation: number;
  particleCount: number;
  obstacles: Obstacle[];
  width: number;
  height: number;
  depth: number;
  onCollisionEnergyUpdate: (energy: number) => void;
  onCollisionEvent?: (event: CollisionEvent) => void;
}

export const ParticleSystem3D: React.FC<ParticleSystem3DProps> = ({
  windSpeed,
  windAngle,
  windElevation,
  particleCount,
  obstacles,
  width,
  height,
  depth,
  onCollisionEnergyUpdate,
  onCollisionEvent
}) => {
  const particlesRef = useRef<WindParticle[]>([]);
  const collisionEnergyRef = useRef(0);
  const [, forceUpdate] = useState(0);

  // Initialize particles
  useEffect(() => {
    const angleRad = (windAngle * Math.PI) / 180;
    const elevationRad = (windElevation * Math.PI) / 180;
    
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width - width / 2,
      y: Math.random() * height * 0.8 + 2,
      z: Math.random() * depth - depth / 2,
      size: Math.random() * 0.4 + 0.3,
      speedX: Math.cos(angleRad) * Math.cos(elevationRad) * windSpeed * (0.5 + Math.random() * 0.5),
      speedY: Math.sin(elevationRad) * windSpeed * (0.5 + Math.random() * 0.5),
      speedZ: Math.sin(angleRad) * Math.cos(elevationRad) * windSpeed * (0.5 + Math.random() * 0.5),
      hasCollided: false,
      collisionTimer: 0,
      power: windSpeed * (0.5 + Math.random() * 0.5),
    }));
    forceUpdate(n => n + 1);
  }, [particleCount, width, height, depth]);

  // Check collision with obstacles
  const checkCollision = useCallback((particle: WindParticle, obstacle: Obstacle): boolean => {
    const halfW = obstacle.width / 2;
    const halfH = obstacle.height / 2;
    const halfD = obstacle.depth / 2;
    const cx = obstacle.x + halfW;
    const cy = obstacle.y + halfH;
    const cz = obstacle.z + halfD;
    
    return (
      particle.x >= cx - halfW - 1 &&
      particle.x <= cx + halfW + 1 &&
      particle.y >= cy - halfH - 1 &&
      particle.y <= cy + halfH + 1 &&
      particle.z >= cz - halfD - 1 &&
      particle.z <= cz + halfD + 1
    );
  }, []);

  // Update particles every frame
  useFrame((state, delta) => {
    const angleRad = (windAngle * Math.PI) / 180;
    const elevationRad = (windElevation * Math.PI) / 180;
    const time = state.clock.elapsedTime;

    particlesRef.current.forEach((particle) => {
      // Add turbulence
      const turbulence = Math.sin(time * 2 + particle.x * 0.1) * 0.2;
      const finalAngle = angleRad + turbulence;

      // Strong wind force
      const windForce = Math.max(windSpeed * 1.5, 3);
      const targetSpeedX = Math.cos(finalAngle) * Math.cos(elevationRad) * windForce;
      const targetSpeedY = Math.sin(elevationRad) * windForce * 0.5;
      const targetSpeedZ = Math.sin(finalAngle) * Math.cos(elevationRad) * windForce;

      // Smooth interpolation
      particle.speedX += (targetSpeedX - particle.speedX) * 0.05;
      particle.speedY += (targetSpeedY - particle.speedY) * 0.05;
      particle.speedZ += (targetSpeedZ - particle.speedZ) * 0.05;

      // Add random jitter for more organic feel
      particle.speedX += (Math.random() - 0.5) * 0.5;
      particle.speedY += (Math.random() - 0.5) * 0.3;
      particle.speedZ += (Math.random() - 0.5) * 0.5;

      // Update position
      particle.x += particle.speedX * delta * 3;
      particle.y += particle.speedY * delta * 3;
      particle.z += particle.speedZ * delta * 3;

      // Boundary wrapping
      if (particle.x < -width / 2) particle.x = width / 2;
      if (particle.x > width / 2) particle.x = -width / 2;
      if (particle.y < 1) particle.y = height * 0.5;
      if (particle.y > height) particle.y = height * 0.5;
      if (particle.z < -depth / 2) particle.z = depth / 2;
      if (particle.z > depth / 2) particle.z = -depth / 2;

      // Check collisions
      if (!particle.hasCollided) {
        for (const obstacle of obstacles) {
          if (checkCollision(particle, obstacle)) {
            const speed = Math.sqrt(
              particle.speedX ** 2 + particle.speedY ** 2 + particle.speedZ ** 2
            );
            const energy = 0.5 * particle.power * speed * (obstacle.resistance || 1);
            
            collisionEnergyRef.current += energy;
            onCollisionEnergyUpdate(collisionEnergyRef.current);

            // Emit collision event for volumetric effect
            if (onCollisionEvent && Math.random() < 0.3) { // Throttle effects
              onCollisionEvent({
                id: `collision-${Date.now()}-${Math.random()}`,
                position: [particle.x, particle.y, particle.z],
                intensity: Math.min(speed * 0.3, 2)
              });
            }

            // Reflect and deflect
            const centerX = obstacle.x + obstacle.width / 2;
            const centerY = obstacle.y + obstacle.height / 2;
            const centerZ = obstacle.z + obstacle.depth / 2;
            
            const dx = particle.x - centerX;
            const dy = particle.y - centerY;
            const dz = particle.z - centerZ;
            
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            const absDz = Math.abs(dz);
            
            if (absDx > absDy && absDx > absDz) {
              particle.speedX *= -0.5;
              particle.x = dx > 0 ? obstacle.x + obstacle.width + 2 : obstacle.x - 2;
            } else if (absDy > absDz) {
              particle.speedY *= -0.5;
              particle.y = dy > 0 ? obstacle.y + obstacle.height + 2 : obstacle.y - 2;
            } else {
              particle.speedZ *= -0.5;
              particle.z = dz > 0 ? obstacle.z + obstacle.depth + 2 : obstacle.z - 2;
            }

            // Add deflection randomness
            particle.speedX += (Math.random() - 0.5) * 3;
            particle.speedY += (Math.random() - 0.5) * 3;
            particle.speedZ += (Math.random() - 0.5) * 3;

            particle.hasCollided = true;
            particle.collisionTimer = 30;
            break;
          }
        }
      }

      // Collision cooldown
      if (particle.collisionTimer > 0) {
        particle.collisionTimer--;
        if (particle.collisionTimer === 0) {
          particle.hasCollided = false;
        }
      }
    });

    // Decay collision energy
    collisionEnergyRef.current *= 0.99;
    onCollisionEnergyUpdate(collisionEnergyRef.current);
    
    forceUpdate(n => n + 1);
  });

  return (
    <InstancedParticles particles={particlesRef.current} />
  );
};
