import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { WindParticle, Obstacle } from '../types';
import { Particle3D } from './Particle3D';
import * as THREE from 'three';

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
  onCollisionEnergyUpdate
}) => {
  const [particles, setParticles] = useState<WindParticle[]>([]);
  const [collisionEnergy, setCollisionEnergy] = useState(0);
  const systemRef = useRef<THREE.Group>(null);

  // Initialize particles
  useEffect(() => {
    const newParticles: WindParticle[] = [];
    const angleRad = (windAngle * Math.PI) / 180;
    const elevationRad = (windElevation * Math.PI) / 180;
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * depth - depth / 2,
        size: Math.random() * 0.3 + 0.2,
        speedX: Math.cos(angleRad) * Math.cos(elevationRad) * windSpeed * (0.5 + Math.random() * 0.5),
        speedY: Math.sin(elevationRad) * windSpeed * (0.5 + Math.random() * 0.5),
        speedZ: Math.sin(angleRad) * Math.cos(elevationRad) * windSpeed * (0.5 + Math.random() * 0.5),
        color: `rgba(57, 255, 20, ${0.6 + Math.random() * 0.4})`,
        lifetime: Infinity,
        trail: [],
        hasCollided: false,
        collisionTimer: 0,
        power: windSpeed,
        originalColor: `rgba(57, 255, 20, ${0.6 + Math.random() * 0.4})`
      });
    }
    setParticles(newParticles);
  }, [particleCount, width, height, depth]);

  // Check collision with obstacles
  const checkCollision = (particle: WindParticle, obstacle: Obstacle): boolean => {
    return (
      particle.x >= obstacle.x &&
      particle.x <= obstacle.x + obstacle.width &&
      particle.y >= obstacle.y &&
      particle.y <= obstacle.y + obstacle.height &&
      particle.z >= obstacle.z &&
      particle.z <= obstacle.z + obstacle.depth
    );
  };

  // Handle collision response
  const handleCollision = (particle: WindParticle, obstacle: Obstacle) => {
    const speed = Math.sqrt(
      particle.speedX ** 2 + particle.speedY ** 2 + particle.speedZ ** 2
    );
    const energy = 0.5 * particle.power! * speed * speed * (obstacle.resistance || 1);
    
    setCollisionEnergy(prev => {
      const newEnergy = prev + energy;
      onCollisionEnergyUpdate(newEnergy);
      return newEnergy;
    });

    // Calculate collision normal and reflect
    const centerX = obstacle.x + obstacle.width / 2;
    const centerY = obstacle.y + obstacle.height / 2;
    const centerZ = obstacle.z + obstacle.depth / 2;
    
    const dx = particle.x - centerX;
    const dy = particle.y - centerY;
    const dz = particle.z - centerZ;
    
    // Determine dominant collision axis and reflect
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const absDz = Math.abs(dz);
    
    if (absDx > absDy && absDx > absDz) {
      particle.speedX *= -0.7 * (obstacle.resistance || 1);
      particle.x = dx > 0 ? obstacle.x + obstacle.width + 2 : obstacle.x - 2;
    } else if (absDy > absDz) {
      particle.speedY *= -0.7 * (obstacle.resistance || 1);
      particle.y = dy > 0 ? obstacle.y + obstacle.height + 2 : obstacle.y - 2;
    } else {
      particle.speedZ *= -0.7 * (obstacle.resistance || 1);
      particle.z = dz > 0 ? obstacle.z + obstacle.depth + 2 : obstacle.z - 2;
    }

    // Add randomness and set collision state
    particle.speedX += (Math.random() - 0.5) * 2;
    particle.speedY += (Math.random() - 0.5) * 2;
    particle.speedZ += (Math.random() - 0.5) * 2;
    
    particle.hasCollided = true;
    particle.collisionTimer = 60;
    particle.size *= 1.5;
  };

  // Update particles
  useFrame(() => {
    setParticles(currentParticles => {
      return currentParticles.map(particle => {
        const updatedParticle = { ...particle };
        
        // Apply wind forces
        const angleRad = (windAngle * Math.PI) / 180;
        const elevationRad = (windElevation * Math.PI) / 180;
        const time = performance.now() * 0.001;
        
        // Add turbulence
        const turbulence = Math.sin(time + particle.x * 0.01) * 0.3;
        const finalAngle = angleRad + turbulence;
        
        // Strong wind force for visibility
        const windForceMultiplier = Math.max(windSpeed * 2, 5);
        const targetSpeedX = Math.cos(finalAngle) * Math.cos(elevationRad) * windForceMultiplier;
        const targetSpeedY = Math.sin(elevationRad) * windForceMultiplier;
        const targetSpeedZ = Math.sin(finalAngle) * Math.cos(elevationRad) * windForceMultiplier;
        
        // Apply forces
        updatedParticle.speedX = targetSpeedX + (Math.random() - 0.5) * 2;
        updatedParticle.speedY = targetSpeedY + (Math.random() - 0.5) * 2;
        updatedParticle.speedZ = targetSpeedZ + (Math.random() - 0.5) * 2;
        
        // Update position
        updatedParticle.x += updatedParticle.speedX * 0.1;
        updatedParticle.y += updatedParticle.speedY * 0.1;
        updatedParticle.z += updatedParticle.speedZ * 0.1;
        
        // Boundary wrapping
        if (updatedParticle.x < -width/2) updatedParticle.x = width/2;
        if (updatedParticle.x > width/2) updatedParticle.x = -width/2;
        if (updatedParticle.y < -height/2) updatedParticle.y = height/2;
        if (updatedParticle.y > height/2) updatedParticle.y = -height/2;
        if (updatedParticle.z < -depth/2) updatedParticle.z = depth/2;
        if (updatedParticle.z > depth/2) updatedParticle.z = -depth/2;
        
        // Update trail
        if (updatedParticle.trail) {
          updatedParticle.trail.unshift({ 
            x: updatedParticle.x, 
            y: updatedParticle.y, 
            z: updatedParticle.z 
          });
          if (updatedParticle.trail.length > 8) {
            updatedParticle.trail.pop();
          }
        }
        
        // Check collisions
        for (const obstacle of obstacles) {
          if (checkCollision(updatedParticle, obstacle) && !updatedParticle.hasCollided) {
            handleCollision(updatedParticle, obstacle);
            break;
          }
        }
        
        // Handle collision timer
        if (updatedParticle.collisionTimer > 0) {
          updatedParticle.collisionTimer--;
          if (updatedParticle.collisionTimer === 0) {
            updatedParticle.hasCollided = false;
            updatedParticle.size = Math.max(0.2, updatedParticle.size / 1.5);
          }
        }
        
        return updatedParticle;
      });
    });

    // Decay collision energy
    setCollisionEnergy(prev => {
      const decayed = prev * 0.995;
      onCollisionEnergyUpdate(decayed);
      return decayed;
    });
  });

  const updateParticle = (updatedParticle: WindParticle) => {
    setParticles(current => 
      current.map(p => 
        p === updatedParticle ? updatedParticle : p
      )
    );
  };

  return (
    <group ref={systemRef}>
      {particles.map((particle, index) => (
        <Particle3D
          key={index}
          particle={particle}
          onUpdate={updateParticle}
        />
      ))}
    </group>
  );
};