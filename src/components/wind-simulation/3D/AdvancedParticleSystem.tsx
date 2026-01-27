import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Obstacle } from '../types';
import { InstancedParticles } from './InstancedParticles';
import {
  WindPhysicsConfig,
  OBSTACLE_DRAG_COEFFICIENTS,
  turbulenceNoise,
  calculateGust,
  calculateWindShear,
  isInWakeZone,
  calculateWakeVelocity
} from './WindPhysicsEngine';

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
  mass: number;
  age: number;
}

interface CollisionEvent {
  id: string;
  position: [number, number, number];
  intensity: number;
}

interface AdvancedParticleSystemProps {
  config: WindPhysicsConfig;
  particleCount: number;
  obstacles: Obstacle[];
  width: number;
  height: number;
  depth: number;
  onCollisionEnergyUpdate: (energy: number) => void;
  onCollisionEvent?: (event: CollisionEvent) => void;
}

export const AdvancedParticleSystem: React.FC<AdvancedParticleSystemProps> = ({
  config,
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

  // Precompute wind direction vector
  const windDirection = useMemo(() => {
    const angleRad = (config.windAngle * Math.PI) / 180;
    return {
      x: Math.cos(angleRad),
      z: Math.sin(angleRad)
    };
  }, [config.windAngle]);

  // Initialize particles
  useEffect(() => {
    const angleRad = (config.windAngle * Math.PI) / 180;
    const elevationRad = (config.windElevation * Math.PI) / 180;
    
    particlesRef.current = Array.from({ length: particleCount }, () => {
      const particleHeight = Math.random() * height * 0.8 + 2;
      // Apply wind shear based on height
      const adjustedSpeed = calculateWindShear(
        config.windSpeed,
        config.referenceHeight,
        particleHeight,
        config.surfaceRoughness
      );
      
      return {
        x: Math.random() * width - width / 2,
        y: particleHeight,
        z: Math.random() * depth - depth / 2,
        size: Math.random() * 0.4 + 0.3,
        speedX: Math.cos(angleRad) * Math.cos(elevationRad) * adjustedSpeed * (0.7 + Math.random() * 0.6),
        speedY: Math.sin(elevationRad) * adjustedSpeed * (0.5 + Math.random() * 0.5),
        speedZ: Math.sin(angleRad) * Math.cos(elevationRad) * adjustedSpeed * (0.7 + Math.random() * 0.6),
        hasCollided: false,
        collisionTimer: 0,
        power: adjustedSpeed * (0.5 + Math.random() * 0.5),
        mass: 0.01 + Math.random() * 0.02,
        age: Math.random() * 100
      };
    });
    forceUpdate(n => n + 1);
  }, [particleCount, width, height, depth]);

  // Collision detection with AABB
  const checkCollision = useCallback((particle: WindParticle, obstacle: Obstacle): boolean => {
    const margin = 1.5;
    const halfW = obstacle.width / 2;
    const halfH = obstacle.height / 2;
    const halfD = obstacle.depth / 2;
    const cx = obstacle.x + halfW;
    const cy = obstacle.y + halfH;
    const cz = obstacle.z + halfD;
    
    return (
      particle.x >= cx - halfW - margin &&
      particle.x <= cx + halfW + margin &&
      particle.y >= cy - halfH - margin &&
      particle.y <= cy + halfH + margin &&
      particle.z >= cz - halfD - margin &&
      particle.z <= cz + halfD + margin
    );
  }, []);

  // Update particles every frame
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const angleRad = (config.windAngle * Math.PI) / 180;
    const elevationRad = (config.windElevation * Math.PI) / 180;

    // Calculate gust effect
    const gustMultiplier = config.gustFrequency > 0 
      ? calculateGust(time, config.gustFrequency, config.gustIntensity, 1)
      : 1;

    particlesRef.current.forEach((particle) => {
      particle.age += delta;

      // Calculate height-adjusted wind speed (wind shear)
      const heightAdjustedSpeed = calculateWindShear(
        config.windSpeed,
        config.referenceHeight,
        Math.max(1, particle.y),
        config.surfaceRoughness
      );

      // Apply gust
      const effectiveSpeed = heightAdjustedSpeed * gustMultiplier;

      // Calculate turbulence
      const turbX = turbulenceNoise(particle.x, particle.y, particle.z, time, config.turbulenceScale);
      const turbY = turbulenceNoise(particle.x + 100, particle.y + 100, particle.z, time * 1.3, config.turbulenceScale);
      const turbZ = turbulenceNoise(particle.x, particle.y, particle.z + 100, time * 0.7, config.turbulenceScale);

      const turbulenceMagnitude = config.turbulenceIntensity * effectiveSpeed;

      // Target velocity components
      let targetSpeedX = Math.cos(angleRad) * Math.cos(elevationRad) * effectiveSpeed + turbX * turbulenceMagnitude;
      let targetSpeedY = Math.sin(elevationRad) * effectiveSpeed * 0.5 + turbY * turbulenceMagnitude * 0.3;
      let targetSpeedZ = Math.sin(angleRad) * Math.cos(elevationRad) * effectiveSpeed + turbZ * turbulenceMagnitude;

      // Check if particle is in wake zone of any obstacle
      for (const obstacle of obstacles) {
        const obstacleCenter = {
          x: obstacle.x + obstacle.width / 2,
          y: obstacle.y + obstacle.height / 2,
          z: obstacle.z + obstacle.depth / 2
        };
        
        const physics = OBSTACLE_DRAG_COEFFICIENTS[obstacle.type] || OBSTACLE_DRAG_COEFFICIENTS.building;
        
        if (isInWakeZone(
          particle,
          obstacleCenter,
          obstacle,
          windDirection,
          physics.wakeLength
        )) {
          // Reduce velocity in wake zone
          const distance = Math.sqrt(
            (particle.x - obstacleCenter.x) ** 2 +
            (particle.z - obstacleCenter.z) ** 2
          );
          const wakeReduction = calculateWakeVelocity(distance, physics.wakeLength, effectiveSpeed) / effectiveSpeed;
          
          targetSpeedX *= wakeReduction;
          targetSpeedZ *= wakeReduction;
          
          // Add wake turbulence
          const wakeTurbulence = physics.turbulenceGeneration * 0.5;
          targetSpeedX += (Math.random() - 0.5) * wakeTurbulence;
          targetSpeedY += (Math.random() - 0.5) * wakeTurbulence;
          targetSpeedZ += (Math.random() - 0.5) * wakeTurbulence;
        }
      }

      // Smooth velocity interpolation (inertia)
      const lerpFactor = 0.08;
      particle.speedX += (targetSpeedX - particle.speedX) * lerpFactor;
      particle.speedY += (targetSpeedY - particle.speedY) * lerpFactor;
      particle.speedZ += (targetSpeedZ - particle.speedZ) * lerpFactor;

      // Apply gravity (slight downward drift)
      particle.speedY -= 0.05 * delta;

      // Update position
      particle.x += particle.speedX * delta * 2.5;
      particle.y += particle.speedY * delta * 2.5;
      particle.z += particle.speedZ * delta * 2.5;

      // Boundary wrapping
      if (particle.x < -width / 2) particle.x = width / 2;
      if (particle.x > width / 2) particle.x = -width / 2;
      if (particle.y < 0.5) {
        particle.y = 0.5;
        particle.speedY = Math.abs(particle.speedY) * 0.3;
      }
      if (particle.y > height) particle.y = height * 0.5;
      if (particle.z < -depth / 2) particle.z = depth / 2;
      if (particle.z > depth / 2) particle.z = -depth / 2;

      // Collision detection
      if (!particle.hasCollided) {
        for (const obstacle of obstacles) {
          if (checkCollision(particle, obstacle)) {
            const physics = OBSTACLE_DRAG_COEFFICIENTS[obstacle.type] || OBSTACLE_DRAG_COEFFICIENTS.building;
            
            const speed = Math.sqrt(
              particle.speedX ** 2 + particle.speedY ** 2 + particle.speedZ ** 2
            );
            
            // Energy calculation: E = 0.5 * m * v² * Cd
            const energy = 0.5 * particle.mass * speed * speed * physics.dragCoefficient * config.airDensity;
            
            collisionEnergyRef.current += energy;
            onCollisionEnergyUpdate(collisionEnergyRef.current);

            // Emit collision effect
            if (onCollisionEvent && Math.random() < 0.25) {
              onCollisionEvent({
                id: `collision-${Date.now()}-${Math.random()}`,
                position: [particle.x, particle.y, particle.z],
                intensity: Math.min(speed * physics.dragCoefficient * 0.15, 2)
              });
            }

            // Calculate reflection based on obstacle shape
            const centerX = obstacle.x + obstacle.width / 2;
            const centerY = obstacle.y + obstacle.height / 2;
            const centerZ = obstacle.z + obstacle.depth / 2;
            
            const dx = particle.x - centerX;
            const dy = particle.y - centerY;
            const dz = particle.z - centerZ;
            
            // Normalize by obstacle dimensions
            const normDx = dx / obstacle.width;
            const normDy = dy / obstacle.height;
            const normDz = dz / obstacle.depth;
            
            const absNormDx = Math.abs(normDx);
            const absNormDy = Math.abs(normDy);
            const absNormDz = Math.abs(normDz);

            // Reflection with energy loss
            const restitution = (1 - physics.porosityFactor) * 0.4;
            const separationAngleRad = (physics.separationAngle * Math.PI) / 180;
            
            if (absNormDx > absNormDy && absNormDx > absNormDz) {
              particle.speedX *= -restitution;
              particle.x = dx > 0 ? obstacle.x + obstacle.width + 2 : obstacle.x - 2;
              // Add separation angle deflection
              particle.speedZ += Math.sign(dz) * Math.sin(separationAngleRad) * speed * 0.3;
            } else if (absNormDy > absNormDz) {
              particle.speedY *= -restitution;
              particle.y = dy > 0 ? obstacle.y + obstacle.height + 2 : obstacle.y - 2;
            } else {
              particle.speedZ *= -restitution;
              particle.z = dz > 0 ? obstacle.z + obstacle.depth + 2 : obstacle.z - 2;
              particle.speedX += Math.sign(dx) * Math.sin(separationAngleRad) * speed * 0.3;
            }

            // Add turbulence from collision
            const collisionTurbulence = physics.turbulenceGeneration * 2;
            particle.speedX += (Math.random() - 0.5) * collisionTurbulence;
            particle.speedY += (Math.random() - 0.5) * collisionTurbulence;
            particle.speedZ += (Math.random() - 0.5) * collisionTurbulence;

            particle.hasCollided = true;
            particle.collisionTimer = 20;
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
    collisionEnergyRef.current *= 0.995;
    onCollisionEnergyUpdate(collisionEnergyRef.current);
    
    forceUpdate(n => n + 1);
  });

  return (
    <InstancedParticles particles={particlesRef.current} />
  );
};
