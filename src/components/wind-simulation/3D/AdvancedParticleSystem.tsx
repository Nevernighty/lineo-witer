import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Obstacle, GENERATOR_SUBTYPES } from '../types';
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
  lastObstacleId?: string;
}

interface CollisionEvent {
  id: string;
  position: [number, number, number];
  intensity: number;
  obstacleId?: string;
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
  onObstacleEnergyUpdate?: (energies: Map<string, number>) => void;
  particleImpact?: number;
  particleTrailLength?: number;
}

const MATERIAL_RESTITUTION: Record<string, number> = {
  wood: 0.3,
  concrete: 0.15,
  steel: 0.5,
  glass: 0.6,
  brick: 0.2,
};

export const AdvancedParticleSystem: React.FC<AdvancedParticleSystemProps> = ({
  config, particleCount, obstacles, width, height, depth,
  onCollisionEnergyUpdate, onCollisionEvent, onObstacleEnergyUpdate,
  particleImpact = 1.0, particleTrailLength = 1.0
}) => {
  const particlesRef = useRef<WindParticle[]>([]);
  const collisionEnergyRef = useRef(0);
  const obstacleEnergyRef = useRef<Map<string, number>>(new Map());
  const cumulativeEnergyRef = useRef<Map<string, { energy: number; timestamp: number }[]>>(new Map());
  const renderCountRef = useRef(0);
  const [, forceUpdate] = useState(0);
  const lastEnergyCallbackTime = useRef(0);

  const windDirection = useMemo(() => {
    const angleRad = (config.windAngle * Math.PI) / 180;
    return { x: Math.cos(angleRad), z: Math.sin(angleRad) };
  }, [config.windAngle]);

  useEffect(() => {
    const angleRad = (config.windAngle * Math.PI) / 180;
    const elevationRad = (config.windElevation * Math.PI) / 180;
    
    particlesRef.current = Array.from({ length: particleCount }, () => {
      const particleHeight = Math.random() * height * 0.8 + 2;
      const adjustedSpeed = calculateWindShear(config.windSpeed, config.referenceHeight, particleHeight, config.surfaceRoughness);
      
      return {
        x: Math.random() * width - width / 2,
        y: particleHeight,
        z: Math.random() * depth - depth / 2,
        size: Math.random() * 0.4 + 0.3 + (config.humidity / 100) * 0.15,
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
    
    obstacleEnergyRef.current.clear();
    cumulativeEnergyRef.current.clear();
    forceUpdate(n => n + 1);
  }, [particleCount, width, height, depth]);

  // Transform-aware collision: transforms particle into obstacle local space
  const checkCollision = useCallback((particle: WindParticle, obstacle: Obstacle): boolean => {
    const margin = 1.5;
    const scale = obstacle.scale || 1;
    const halfW = (obstacle.width * scale) / 2;
    const halfH = (obstacle.height * scale) / 2;
    const halfD = (obstacle.depth * scale) / 2;
    const cx = obstacle.x + obstacle.width / 2;
    const cy = obstacle.y + obstacle.height / 2;
    const cz = obstacle.z + obstacle.depth / 2;

    // Transform particle position to obstacle local space (inverse rotation)
    let dx = particle.x - cx;
    let dy = particle.y - cy;
    let dz = particle.z - cz;

    const rotY = -((obstacle.rotation || 0) * Math.PI) / 180;
    const rotX = -(obstacle.rotationX || 0);
    const rotZ = -(obstacle.rotationZ || 0);

    // Apply inverse Y rotation
    if (rotY !== 0) {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const nx = dx * cosY - dz * sinY;
      const nz = dx * sinY + dz * cosY;
      dx = nx; dz = nz;
    }
    // Apply inverse X rotation
    if (rotX !== 0) {
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const ny = dy * cosX - dz * sinX;
      const nz2 = dy * sinX + dz * cosX;
      dy = ny; dz = nz2;
    }
    // Apply inverse Z rotation
    if (rotZ !== 0) {
      const cosZ = Math.cos(rotZ);
      const sinZ = Math.sin(rotZ);
      const nx2 = dx * cosZ - dy * sinZ;
      const ny2 = dx * sinZ + dy * cosZ;
      dx = nx2; dy = ny2;
    }

    return (
      dx >= -halfW - margin && dx <= halfW + margin &&
      dy >= -halfH - margin && dy <= halfH + margin &&
      dz >= -halfD - margin && dz <= halfD + margin
    );
  }, []);

  const getSurfaceNormal = useCallback((particle: WindParticle, obstacle: Obstacle): [number, number, number] => {
    const scale = obstacle.scale || 1;
    const cx = obstacle.x + obstacle.width / 2;
    const cy = obstacle.y + obstacle.height / 2;
    const cz = obstacle.z + obstacle.depth / 2;
    const dx = (particle.x - cx) / (obstacle.width * scale);
    const dy = (particle.y - cy) / (obstacle.height * scale);
    const dz = (particle.z - cz) / (obstacle.depth * scale);
    const adx = Math.abs(dx), ady = Math.abs(dy), adz = Math.abs(dz);

    let nx = 0, ny = 0, nz = 0;
    if (adx > ady && adx > adz) nx = Math.sign(dx);
    else if (ady > adz) ny = Math.sign(dy);
    else nz = Math.sign(dz);

    // Rotate normal back to world space
    const rotYAngle = ((obstacle.rotation || 0) * Math.PI) / 180;
    if (rotYAngle !== 0) {
      const cosY = Math.cos(rotYAngle);
      const sinY = Math.sin(rotYAngle);
      const wnx = nx * cosY + nz * sinY;
      const wnz = -nx * sinY + nz * cosY;
      return [wnx, ny, wnz];
    }
    return [nx, ny, nz];
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const angleRad = (config.windAngle * Math.PI) / 180;
    const elevationRad = (config.windElevation * Math.PI) / 180;
    const gustMultiplier = config.gustFrequency > 0 
      ? calculateGust(time, config.gustFrequency, config.gustIntensity, 1) : 1;

    // Decay obstacle energies
    obstacleEnergyRef.current.forEach((energy, id) => {
      obstacleEnergyRef.current.set(id, energy * 0.995);
    });

    // Clean up old cumulative entries (>10s)
    const now = time;
    cumulativeEnergyRef.current.forEach((entries, id) => {
      const filtered = entries.filter(e => now - e.timestamp < 10);
      if (filtered.length === 0) cumulativeEnergyRef.current.delete(id);
      else cumulativeEnergyRef.current.set(id, filtered);
    });

    // Precompute generator positions for attraction
    const generators = obstacles.filter(o => o.type === 'wind_generator').map(o => {
      const specs = GENERATOR_SUBTYPES[o.generatorSubtype || 'hawt3'];
      const rotorDiameter = o.width * 1.8 * (o.scale || 1);
      return {
        cx: o.x + o.width / 2,
        cy: o.y + o.height * (o.scale || 1),
        cz: o.z + o.depth / 2,
        rotorRadius: rotorDiameter / 2,
        attractRadius: rotorDiameter * 3,
        cp: specs.cp,
        axis: specs.axis
      };
    });

    particlesRef.current.forEach((particle) => {
      particle.age += delta;

      const heightAdjustedSpeed = calculateWindShear(config.windSpeed, config.referenceHeight, Math.max(1, particle.y), config.surfaceRoughness);
      const effectiveSpeed = heightAdjustedSpeed * gustMultiplier;

      const turbX = turbulenceNoise(particle.x, particle.y, particle.z, time, config.turbulenceScale);
      const turbY = turbulenceNoise(particle.x + 100, particle.y + 100, particle.z, time * 1.3, config.turbulenceScale);
      const turbZ = turbulenceNoise(particle.x, particle.y, particle.z + 100, time * 0.7, config.turbulenceScale);
      const turbulenceMagnitude = config.turbulenceIntensity * effectiveSpeed;

      let targetSpeedX = Math.cos(angleRad) * Math.cos(elevationRad) * effectiveSpeed + turbX * turbulenceMagnitude;
      let targetSpeedY = Math.sin(elevationRad) * effectiveSpeed * 0.5 + turbY * turbulenceMagnitude * 0.3;
      let targetSpeedZ = Math.sin(angleRad) * Math.cos(elevationRad) * effectiveSpeed + turbZ * turbulenceMagnitude;

      // Wake zones from all obstacles
      for (const obstacle of obstacles) {
        const obstacleCenter = {
          x: obstacle.x + obstacle.width / 2,
          y: obstacle.y + obstacle.height / 2,
          z: obstacle.z + obstacle.depth / 2
        };
        const physics = OBSTACLE_DRAG_COEFFICIENTS[obstacle.type] || OBSTACLE_DRAG_COEFFICIENTS.building;
        
        if (isInWakeZone(particle, obstacleCenter, obstacle, windDirection, physics.wakeLength)) {
          const distance = Math.sqrt((particle.x - obstacleCenter.x) ** 2 + (particle.z - obstacleCenter.z) ** 2);
          const wakeReduction = calculateWakeVelocity(distance, physics.wakeLength, effectiveSpeed) / effectiveSpeed;
          targetSpeedX *= wakeReduction;
          targetSpeedZ *= wakeReduction;
          const wakeTurbulence = physics.turbulenceGeneration * 0.5;
          targetSpeedX += (Math.random() - 0.5) * wakeTurbulence;
          targetSpeedY += (Math.random() - 0.5) * wakeTurbulence;
          targetSpeedZ += (Math.random() - 0.5) * wakeTurbulence;
        }
      }

      // Generator attraction ("suction") effect
      for (const gen of generators) {
        const dx = gen.cx - particle.x;
        const dy = gen.cy - particle.y;
        const dz = gen.cz - particle.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < gen.attractRadius && dist > 0.5) {
          // Determine if particle is upstream or downstream of generator
          const dotWind = dx * windDirection.x + dz * windDirection.z;
          
          if (dotWind > 0) {
            // Upstream: attract toward rotor center (inverse-square)
            const attractK = 2.0;
            const force = attractK / (dist * dist + 1);
            targetSpeedX += (dx / dist) * force;
            targetSpeedY += (dy / dist) * force * 0.5;
            targetSpeedZ += (dz / dist) * force;
          } else {
            // Downstream: slow down by (1 - Cp) and add turbulence
            const speedReduction = 1 - gen.cp * 0.6;
            targetSpeedX *= speedReduction;
            targetSpeedZ *= speedReduction;
            // Add downstream turbulence
            const downTurb = gen.cp * 2;
            targetSpeedX += (Math.random() - 0.5) * downTurb;
            targetSpeedY += (Math.random() - 0.5) * downTurb * 0.5;
            targetSpeedZ += (Math.random() - 0.5) * downTurb;
          }
        }
      }

      const lerpFactor = 0.08;
      particle.speedX += (targetSpeedX - particle.speedX) * lerpFactor;
      particle.speedY += (targetSpeedY - particle.speedY) * lerpFactor;
      particle.speedZ += (targetSpeedZ - particle.speedZ) * lerpFactor;
      particle.speedY -= 0.05 * delta;

      particle.x += particle.speedX * delta * 2.5;
      particle.y += particle.speedY * delta * 2.5;
      particle.z += particle.speedZ * delta * 2.5;

      if (particle.x < -width / 2) particle.x = width / 2;
      if (particle.x > width / 2) particle.x = -width / 2;
      if (particle.y < 0.5) { particle.y = 0.5; particle.speedY = Math.abs(particle.speedY) * 0.3; }
      if (particle.y > height) particle.y = height * 0.5;
      if (particle.z < -depth / 2) particle.z = depth / 2;
      if (particle.z > depth / 2) particle.z = -depth / 2;

      if (!particle.hasCollided) {
        for (const obstacle of obstacles) {
          if (obstacle.type === 'wind_generator') continue; // generators use attraction, not collision
          if (checkCollision(particle, obstacle)) {
            const physics = OBSTACLE_DRAG_COEFFICIENTS[obstacle.type] || OBSTACLE_DRAG_COEFFICIENTS.building;
            const obstacleId = obstacle.id || `${obstacle.x}-${obstacle.z}`;
            
            const speed = Math.sqrt(particle.speedX ** 2 + particle.speedY ** 2 + particle.speedZ ** 2);
            
            const [nx, ny, nz] = getSurfaceNormal(particle, obstacle);
            const dotProduct = Math.abs(
              (particle.speedX * nx + particle.speedY * ny + particle.speedZ * nz) / (speed || 1)
            );
            
            const energy = 0.5 * particle.mass * speed * speed * physics.dragCoefficient * config.airDensity * dotProduct;
            
            collisionEnergyRef.current += energy;
            onCollisionEnergyUpdate(collisionEnergyRef.current);
            
            const currentObstacleEnergy = obstacleEnergyRef.current.get(obstacleId) || 0;
            obstacleEnergyRef.current.set(obstacleId, currentObstacleEnergy + energy);

            const cumEntries = cumulativeEnergyRef.current.get(obstacleId) || [];
            cumEntries.push({ energy, timestamp: time });
            cumulativeEnergyRef.current.set(obstacleId, cumEntries);
            
            if (onObstacleEnergyUpdate && renderCountRef.current % 5 === 0) {
              onObstacleEnergyUpdate(new Map(obstacleEnergyRef.current));
            }

            if (onCollisionEvent && Math.random() < 0.25) {
              onCollisionEvent({
                id: `collision-${Date.now()}-${Math.random()}`,
                position: [particle.x, particle.y, particle.z],
                intensity: Math.min(speed * physics.dragCoefficient * 0.15, 2),
                obstacleId
              });
            }

            const materialRestitution = MATERIAL_RESTITUTION[obstacle.material || 'concrete'] || 0.2;
            const restitution = materialRestitution * (1 - physics.porosityFactor);
            const separationAngleRad = (physics.separationAngle * Math.PI) / 180;

            const centerX = obstacle.x + obstacle.width / 2;
            const centerY = obstacle.y + obstacle.height / 2;
            const centerZ = obstacle.z + obstacle.depth / 2;
            const ddx = particle.x - centerX;
            const ddy = particle.y - centerY;
            const ddz = particle.z - centerZ;
            const normDx = ddx / obstacle.width;
            const normDy = ddy / obstacle.height;
            const normDz = ddz / obstacle.depth;
            const absNormDx = Math.abs(normDx);
            const absNormDy = Math.abs(normDy);
            const absNormDz = Math.abs(normDz);

            if (absNormDx > absNormDy && absNormDx > absNormDz) {
              particle.speedX *= -restitution;
              particle.x = ddx > 0 ? obstacle.x + obstacle.width + 2 : obstacle.x - 2;
              particle.speedZ += Math.sign(ddz) * Math.sin(separationAngleRad) * speed * 0.3;
            } else if (absNormDy > absNormDz) {
              particle.speedY *= -restitution;
              particle.y = ddy > 0 ? obstacle.y + obstacle.height + 2 : obstacle.y - 2;
            } else {
              particle.speedZ *= -restitution;
              particle.z = ddz > 0 ? obstacle.z + obstacle.depth + 2 : obstacle.z - 2;
              particle.speedX += Math.sign(ddx) * Math.sin(separationAngleRad) * speed * 0.3;
            }

            const scatterAmount = physics.turbulenceGeneration * 1.5;
            particle.speedX += (Math.random() - 0.5) * scatterAmount;
            particle.speedY += Math.random() * scatterAmount * 0.5;
            particle.speedZ += (Math.random() - 0.5) * scatterAmount;

            particle.hasCollided = true;
            particle.collisionTimer = 20;
            particle.lastObstacleId = obstacleId;
            break;
          }
        }
      }

      if (particle.collisionTimer > 0) {
        particle.collisionTimer--;
        if (particle.collisionTimer === 0) particle.hasCollided = false;
      }
    });

    collisionEnergyRef.current *= 0.995;
    renderCountRef.current++;
    if (renderCountRef.current % 3 === 0) {
      onCollisionEnergyUpdate(collisionEnergyRef.current);
    }
    forceUpdate(n => n + 1);
  });

  return (
    <InstancedParticles
      particles={particlesRef.current}
      impactMultiplier={particleImpact}
      trailLengthMultiplier={particleTrailLength}
      windAngle={config.windAngle}
    />
  );
};
