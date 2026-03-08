import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Obstacle, GENERATOR_SUBTYPES, GeneratorSubtype } from '../types';
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
import { playAbsorbSound } from '@/utils/sounds';

interface WindParticle {
  x: number; y: number; z: number;
  size: number;
  speedX: number; speedY: number; speedZ: number;
  hasCollided: boolean;
  collisionTimer: number;
  power: number; mass: number; age: number;
  lastObstacleId?: string;
  absorbed: boolean;
  absorptionTimer: number;
}

interface CollisionEvent {
  id: string;
  position: [number, number, number];
  intensity: number;
  obstacleId?: string;
  deflection?: [number, number, number];
}

interface AdvancedParticleSystemProps {
  config: WindPhysicsConfig;
  particleCount: number;
  obstacles: Obstacle[];
  width: number; height: number; depth: number;
  onCollisionEnergyUpdate: (energy: number) => void;
  onCollisionEvent?: (event: CollisionEvent) => void;
  onObstacleEnergyUpdate?: (energies: Map<string, number>) => void;
  particleImpact?: number;
  particleTrailLength?: number;
  glowIntensity?: number;
  pulsation?: number;
}

const MATERIAL_RESTITUTION: Record<string, number> = {
  wood: 0.3, concrete: 0.15, steel: 0.5, glass: 0.6, brick: 0.2,
};

const GENERATOR_SUCTION_PHYSICS: Record<string, {
  attractK: number;
  suctionRadius: number;
  speedReduction: number;
  wakeTurbulence: number;
  rotorEfficiency: number;
}> = {
  hawt3: { attractK: 20.0, suctionRadius: 7.5, speedReduction: 0.41, wakeTurbulence: 3.5, rotorEfficiency: 0.45 },
  hawt2: { attractK: 17.0, suctionRadius: 6.75, speedReduction: 0.37, wakeTurbulence: 4.0, rotorEfficiency: 0.42 },
  darrieus: { attractK: 13.0, suctionRadius: 5.25, speedReduction: 0.30, wakeTurbulence: 2.5, rotorEfficiency: 0.35 },
  savonius: { attractK: 10.0, suctionRadius: 4.5, speedReduction: 0.50, wakeTurbulence: 2.0, rotorEfficiency: 0.18 },
  micro: { attractK: 14.0, suctionRadius: 6.0, speedReduction: 0.35, wakeTurbulence: 3.0, rotorEfficiency: 0.30 },
};

// Shared buffer for zero-copy particle data transfer to InstancedParticles
export interface ParticleBuffer {
  positions: Float32Array;   // [x,y,z, x,y,z, ...] length = count*3
  velocities: Float32Array;  // [vx,vy,vz, ...] length = count*3
  sizes: Float32Array;       // length = count
  flags: Uint8Array;         // bit 0 = hasCollided, bit 1 = absorbed
  count: number;
}

export const AdvancedParticleSystem: React.FC<AdvancedParticleSystemProps> = ({
  config, particleCount, obstacles, width, height, depth,
  onCollisionEnergyUpdate, onCollisionEvent, onObstacleEnergyUpdate,
  particleImpact = 1.0, particleTrailLength = 1.0, glowIntensity = 1.0,
  pulsation = 0
}) => {
  const particlesRef = useRef<WindParticle[]>([]);
  const collisionEnergyRef = useRef(0);
  const obstacleEnergyRef = useRef<Map<string, number>>(new Map());
  const cumulativeEnergyRef = useRef<Map<string, { energy: number; timestamp: number }[]>>(new Map());
  const renderCountRef = useRef(0);
  const absorbSoundCooldown = useRef(0);
  
  // Shared buffer ref — InstancedParticles reads this directly
  const bufferRef = useRef<ParticleBuffer>({
    positions: new Float32Array(0),
    velocities: new Float32Array(0),
    sizes: new Float32Array(0),
    flags: new Uint8Array(0),
    count: 0,
  });

  // Throttle timestamps for callbacks
  const lastEnergyCallbackTime = useRef(0);
  const lastObstacleEnergyCallbackTime = useRef(0);

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
        size: Math.random() * 0.6 + 0.5 + (config.humidity / 100) * 0.2,
        speedX: Math.cos(angleRad) * Math.cos(elevationRad) * adjustedSpeed * (0.7 + Math.random() * 0.6),
        speedY: Math.sin(elevationRad) * adjustedSpeed * (0.5 + Math.random() * 0.5),
        speedZ: Math.sin(angleRad) * Math.cos(elevationRad) * adjustedSpeed * (0.7 + Math.random() * 0.6),
        hasCollided: false,
        collisionTimer: 0,
        power: adjustedSpeed * (0.5 + Math.random() * 0.5),
        mass: 0.01 + Math.random() * 0.02,
        age: Math.random() * 100,
        absorbed: false,
        absorptionTimer: 0,
      };
    });
    
    // Allocate shared buffers
    bufferRef.current = {
      positions: new Float32Array(particleCount * 3),
      velocities: new Float32Array(particleCount * 3),
      sizes: new Float32Array(particleCount),
      flags: new Uint8Array(particleCount),
      count: particleCount,
    };
    
    obstacleEnergyRef.current.clear();
    cumulativeEnergyRef.current.clear();
  }, [particleCount, width, height, depth]);

  const checkCollision = useCallback((particle: WindParticle, obstacle: Obstacle): boolean => {
    const margin = 1.5;
    const scale = obstacle.scale || 1;
    const halfW = (obstacle.width * scale) / 2;
    const halfH = (obstacle.height * scale) / 2;
    const halfD = (obstacle.depth * scale) / 2;
    const cx = obstacle.x + obstacle.width / 2;
    const cy = obstacle.y + obstacle.height / 2;
    const cz = obstacle.z + obstacle.depth / 2;
    let dx = particle.x - cx;
    let dy = particle.y - cy;
    let dz = particle.z - cz;
    const rotY = -((obstacle.rotation || 0) * Math.PI) / 180;
    if (rotY !== 0) {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const nx = dx * cosY - dz * sinY;
      const nz = dx * sinY + dz * cosY;
      dx = nx; dz = nz;
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

    obstacleEnergyRef.current.forEach((energy, id) => {
      obstacleEnergyRef.current.set(id, energy * 0.995);
    });

    cumulativeEnergyRef.current.forEach((entries, id) => {
      const filtered = entries.filter(e => time - e.timestamp < 10);
      if (filtered.length === 0) cumulativeEnergyRef.current.delete(id);
      else cumulativeEnergyRef.current.set(id, filtered);
    });

    if (absorbSoundCooldown.current > 0) absorbSoundCooldown.current -= delta;

    const generators = obstacles.filter(o => o.type === 'wind_generator').map(o => {
      const subtype = (o.generatorSubtype || 'hawt3') as GeneratorSubtype;
      const specs = GENERATOR_SUBTYPES[subtype];
      const suctionPhysics = GENERATOR_SUCTION_PHYSICS[subtype] || GENERATOR_SUCTION_PHYSICS.hawt3;
      const rotorDiameter = o.width * 1.8 * (o.scale || 1);
      const isVAWT = specs.axis === 'vertical';
      return {
        cx: o.x + o.width / 2,
        cy: isVAWT ? o.y + o.height * (o.scale || 1) * 0.75 : o.y + o.height * (o.scale || 1),
        cz: o.z + o.depth / 2,
        rotorRadius: rotorDiameter / 2,
        attractRadius: rotorDiameter * suctionPhysics.suctionRadius,
        cp: specs.cp,
        subtype,
        isVAWT,
        ...suctionPhysics,
      };
    });

    const buf = bufferRef.current;
    const particles = particlesRef.current;

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
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

      if (config.terrainSlopeX !== 0 || config.terrainSlopeZ !== 0) {
        const slopeSpeedupX = Math.sin((config.terrainSlopeX * Math.PI) / 180) * effectiveSpeed * 0.3;
        const slopeSpeedupZ = Math.sin((config.terrainSlopeZ * Math.PI) / 180) * effectiveSpeed * 0.3;
        targetSpeedY += Math.abs(slopeSpeedupX + slopeSpeedupZ) * 0.2;
      }

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

      for (const gen of generators) {
        const dx = gen.cx - particle.x;
        const dy = gen.cy - particle.y;
        const dz = gen.cz - particle.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < gen.attractRadius && dist > 0.5) {
          if (gen.isVAWT) {
            const horizDist = Math.sqrt(dx * dx + dz * dz);
            if (horizDist > 0.5) {
              const force = gen.attractK / (horizDist * horizDist + 1.5);
              targetSpeedX += (dx / horizDist) * force;
              targetSpeedZ += (dz / horizDist) * force;
              const tangentX = -dz / horizDist;
              const tangentZ = dx / horizDist;
              targetSpeedX += tangentX * force * 0.4;
              targetSpeedZ += tangentZ * force * 0.4;
            }
            if (horizDist < gen.rotorRadius * 1.5) {
              targetSpeedX *= (1 - gen.speedReduction);
              targetSpeedZ *= (1 - gen.speedReduction);
              targetSpeedX += (Math.random() - 0.5) * gen.wakeTurbulence;
              targetSpeedZ += (Math.random() - 0.5) * gen.wakeTurbulence;
            }
          } else {
            const dotWind = dx * windDirection.x + dz * windDirection.z;
            if (dotWind > 0) {
              const closeRange = dist < gen.rotorRadius * 2;
              const force = closeRange 
                ? gen.attractK / (dist + 0.5) * 1.5
                : gen.attractK / (dist * dist + 1);
              const convergeFactor = Math.max(0.5, 1 - dist / gen.attractRadius);
              targetSpeedX += (dx / dist) * force * convergeFactor;
              targetSpeedY += (dy / dist) * force * 0.4 * convergeFactor;
              targetSpeedZ += (dz / dist) * force * convergeFactor;
            } else {
              targetSpeedX *= (1 - gen.speedReduction);
              targetSpeedZ *= (1 - gen.speedReduction);
              targetSpeedX += (Math.random() - 0.5) * gen.wakeTurbulence;
              targetSpeedY += (Math.random() - 0.5) * gen.wakeTurbulence * 0.5;
              targetSpeedZ += (Math.random() - 0.5) * gen.wakeTurbulence;
            }
          }

          if (dist < gen.rotorRadius * 1.2 && !particle.absorbed) {
            particle.absorbed = true;
            particle.absorptionTimer = 25;
            
            if (absorbSoundCooldown.current <= 0) {
              playAbsorbSound();
              absorbSoundCooldown.current = 0.3;
            }
            
            if (onCollisionEvent && Math.random() < 0.25) {
              onCollisionEvent({
                id: `absorb-${Date.now()}-${Math.random()}`,
                position: [particle.x, particle.y, particle.z],
                intensity: Math.min(Math.sqrt(particle.speedX ** 2 + particle.speedZ ** 2) * 0.12, 1.8),
                deflection: [-windDirection.x, 0.3, -windDirection.z],
              });
            }
          }
        }
      }

      const lerpFactor = 0.12;
      particle.speedX += (targetSpeedX - particle.speedX) * lerpFactor;
      particle.speedY += (targetSpeedY - particle.speedY) * lerpFactor;
      particle.speedZ += (targetSpeedZ - particle.speedZ) * lerpFactor;
      particle.speedX *= 0.998;
      particle.speedY *= 0.998;
      particle.speedZ *= 0.998;
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

      if (particle.absorptionTimer > 0) {
        particle.absorptionTimer--;
        if (particle.absorptionTimer === 0) particle.absorbed = false;
      }

      if (!particle.hasCollided) {
        for (const obstacle of obstacles) {
          if (obstacle.type === 'wind_generator') continue;
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
            const currentObstacleEnergy = obstacleEnergyRef.current.get(obstacleId) || 0;
            obstacleEnergyRef.current.set(obstacleId, currentObstacleEnergy + energy);
            const cumEntries = cumulativeEnergyRef.current.get(obstacleId) || [];
            cumEntries.push({ energy, timestamp: time });
            cumulativeEnergyRef.current.set(obstacleId, cumEntries);

            const deflection: [number, number, number] = [nx, ny, nz];
            if (onCollisionEvent && Math.random() < 0.2) {
              onCollisionEvent({
                id: `collision-${Date.now()}-${Math.random()}`,
                position: [particle.x, particle.y, particle.z],
                intensity: Math.min(speed * physics.dragCoefficient * 0.15, 2),
                obstacleId,
                deflection,
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

      // Write to shared buffer — NO React state update
      const i3 = i * 3;
      buf.positions[i3] = particle.x;
      buf.positions[i3 + 1] = particle.y;
      buf.positions[i3 + 2] = particle.z;
      buf.velocities[i3] = particle.speedX;
      buf.velocities[i3 + 1] = particle.speedY;
      buf.velocities[i3 + 2] = particle.speedZ;
      buf.sizes[i] = particle.size;
      buf.flags[i] = (particle.hasCollided ? 1 : 0) | (particle.absorbed ? 2 : 0);
    }

    collisionEnergyRef.current *= 0.995;
    renderCountRef.current++;
    
    // Throttled callbacks — fire at most every 500ms instead of every frame
    const now = time;
    if (now - lastEnergyCallbackTime.current > 0.5) {
      lastEnergyCallbackTime.current = now;
      onCollisionEnergyUpdate(collisionEnergyRef.current);
    }
    if (onObstacleEnergyUpdate && now - lastObstacleEnergyCallbackTime.current > 0.5) {
      lastObstacleEnergyCallbackTime.current = now;
      onObstacleEnergyUpdate(new Map(obstacleEnergyRef.current));
    }
    
    // NO forceUpdate — InstancedParticles reads from bufferRef directly
  });

  return (
    <InstancedParticles
      bufferRef={bufferRef}
      impactMultiplier={particleImpact}
      trailLengthMultiplier={particleTrailLength}
      windAngle={config.windAngle}
      glowIntensity={glowIntensity}
      pulsation={pulsation}
    />
  );
};
