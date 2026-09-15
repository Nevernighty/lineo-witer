import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Obstacle, GENERATOR_SUBTYPES, GeneratorSubtype } from '../types';
import { InstancedParticles } from './InstancedParticles';
import {
  WindPhysicsConfig,
  OBSTACLE_DRAG_COEFFICIENTS,
  turbulenceNoise,
  calculateWindShear,
  computeGustCellMultiplier,
  sampleBluffBodyWake,
  computeEdgeSpeedup,
  computeSeparationBubble,
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
  particlePreset?: string;
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
  hawt3: { attractK: 60.0, suctionRadius: 15, speedReduction: 0.41, wakeTurbulence: 3.5, rotorEfficiency: 0.45 },
  hawt2: { attractK: 50.0, suctionRadius: 13, speedReduction: 0.37, wakeTurbulence: 4.0, rotorEfficiency: 0.42 },
  darrieus: { attractK: 70.0, suctionRadius: 14, speedReduction: 0.30, wakeTurbulence: 2.5, rotorEfficiency: 0.35 },
  savonius: { attractK: 55.0, suctionRadius: 12, speedReduction: 0.50, wakeTurbulence: 2.0, rotorEfficiency: 0.18 },
  micro: { attractK: 42.0, suctionRadius: 12, speedReduction: 0.35, wakeTurbulence: 3.0, rotorEfficiency: 0.30 },
};

// Shared buffer for zero-copy particle data transfer to InstancedParticles
export interface ParticleBuffer {
  positions: Float32Array;   // [x,y,z, x,y,z, ...] length = count*3
  velocities: Float32Array;  // [vx,vy,vz, ...] length = count*3
  sizes: Float32Array;       // length = count
  flags: Uint8Array;         // bit 0 = hasCollided, bit 1 = absorbed
  absorbProgress: Float32Array; // 0→1 absorption lifecycle progress
  count: number;
}

export const AdvancedParticleSystem: React.FC<AdvancedParticleSystemProps> = ({
  config, particleCount, obstacles, width, height, depth,
  onCollisionEnergyUpdate, onCollisionEvent, onObstacleEnergyUpdate,
  particleImpact = 1.0, particleTrailLength = 1.0, glowIntensity = 1.0,
  pulsation = 0, particlePreset = 'standard'
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
    absorbProgress: new Float32Array(0),
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
      absorbProgress: new Float32Array(particleCount),
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
    let dx = particle.x - cx;
    const dy = (particle.y - cy) / (obstacle.height * scale);
    let dz = particle.z - cz;
    const localAngle = -((obstacle.rotation || 0) * Math.PI) / 180;
    const cosLocal = Math.cos(localAngle);
    const sinLocal = Math.sin(localAngle);
    const localX = dx * cosLocal - dz * sinLocal;
    const localZ = dx * sinLocal + dz * cosLocal;
    dx = localX / (obstacle.width * scale);
    dz = localZ / (obstacle.depth * scale);
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

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const time = state.clock.elapsedTime;
    const angleRad = (config.windAngle * Math.PI) / 180;
    const elevationRad = (config.windElevation * Math.PI) / 180;
    // Gusts are coherent parcels advecting downstream, sampled per particle below.
    const gustCellLength = Math.max(30, config.windSpeed * 8);

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
      const scale = o.scale || 1;
      const rotationY = ((o.rotation || 0) * Math.PI) / 180;
      const baseX = o.x + o.width / 2;
      const baseZ = o.z + o.depth / 2;
      const nacelleOffset = isVAWT ? 0 : o.width * 0.35 * 0.52 * scale;
      return {
        id: o.id || `${subtype}-${o.x}-${o.z}`,
        cx: baseX + Math.sin(rotationY) * nacelleOffset,
        cy: isVAWT ? o.y + o.height * (o.scale || 1) * 0.75 : o.y + o.height * (o.scale || 1),
        cz: baseZ + Math.cos(rotationY) * nacelleOffset,
        rotorRadius: rotorDiameter / 2,
        rotorHalfHeight: isVAWT ? o.height * scale * (subtype === 'savonius' ? 0.25 : 0.3) : rotorDiameter / 2,
        attractRadius: rotorDiameter * 2.5,
        normalX: Math.sin(rotationY),
        normalZ: Math.cos(rotationY),
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
      const gustMultiplier = computeGustCellMultiplier(
        particle.x, particle.z, time,
        config.gustFrequency, config.gustIntensity,
        windDirection.x, windDirection.z,
        Math.max(1, heightAdjustedSpeed), gustCellLength,
      );
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
        if (obstacle.type === 'wind_generator') continue; // generators use Jensen wake below
        const scale = obstacle.scale || 1;
        const ow = obstacle.width * scale;
        const oh = obstacle.height * scale;
        const od = obstacle.depth * scale;
        const ocx = obstacle.x + obstacle.width / 2;
        const ocy = obstacle.y + oh / 2;
        const ocz = obstacle.z + obstacle.depth / 2;
        const physics = OBSTACLE_DRAG_COEFFICIENTS[obstacle.type] || OBSTACLE_DRAG_COEFFICIENTS.building;
        const decayK = physics.porosityFactor > 0.3 ? 0.14 : 0.10;

        // Expanding-cone wake with near / transition / far regions.
        const wake = sampleBluffBodyWake(
          particle.x, particle.y, particle.z,
          ocx, ocy, ocz, ow, oh, od,
          windDirection.x, windDirection.z,
          physics.dragCoefficient, physics.porosityFactor, decayK,
        );
        if (wake.inWake) {
          targetSpeedX *= wake.velocityFactor;
          targetSpeedZ *= wake.velocityFactor;
          const wakeTurbulence = physics.turbulenceGeneration * wake.tiBoost * effectiveSpeed * 0.28;
          targetSpeedX += (Math.random() - 0.5) * wakeTurbulence;
          targetSpeedY += (Math.random() - 0.5) * wakeTurbulence * 0.8;
          targetSpeedZ += (Math.random() - 0.5) * wakeTurbulence;
          // Recirculation core: streamwise reversal plus upward entrainment.
          if (wake.recirculation > 0.01) {
            const rev = wake.recirculation * effectiveSpeed * 0.35;
            targetSpeedX -= windDirection.x * rev;
            targetSpeedZ -= windDirection.z * rev;
            targetSpeedY += wake.recirculation * effectiveSpeed * 0.18;
          }
        }

        // Streamline compression over the windward edge (rooftop speed-up).
        const speedup = computeEdgeSpeedup(
          particle.x, particle.y, particle.z,
          ocx, ocy, ocz, ow, oh, od,
          windDirection.x, windDirection.z,
        );
        if (speedup > 1.001) {
          targetSpeedX *= speedup;
          targetSpeedZ *= speedup;
        }

        // Roof separation bubble: flow detaches behind the leading edge.
        const bubble = computeSeparationBubble(
          particle.x, particle.y, particle.z,
          ocx, ocy, ocz, ow, oh, od,
          windDirection.x, windDirection.z,
        );
        if (bubble > 0.01) {
          const damp = 1 - 0.7 * bubble;
          targetSpeedX = targetSpeedX * damp - windDirection.x * bubble * effectiveSpeed * 0.3;
          targetSpeedZ = targetSpeedZ * damp - windDirection.z * bubble * effectiveSpeed * 0.3;
          targetSpeedY += bubble * effectiveSpeed * 0.22;
        }
      }


      for (const gen of generators) {
        const dx = gen.cx - particle.x;
        const dy = gen.cy - particle.y;
        const dz = gen.cz - particle.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < gen.attractRadius && dist > 0.05) {
          if (gen.isVAWT) {
            const horizDist = Math.sqrt(dx * dx + dz * dz);
            const vertical = Math.abs(dy);
            const radialBand = Math.abs(horizDist - gen.rotorRadius * 0.72);
            const influence = Math.max(0, 1 - radialBand / Math.max(1, gen.rotorRadius)) * Math.max(0, 1 - vertical / Math.max(1, gen.rotorHalfHeight * 1.6));
            if (influence > 0 && horizDist > 0.05) {
              const tangentSign = gen.subtype === 'savonius' ? 1 : -1;
              const tangentX = (-dz / horizDist) * tangentSign;
              const tangentZ = (dx / horizDist) * tangentSign;
              const swirl = effectiveSpeed * influence * (gen.subtype === 'savonius' ? 0.12 : 0.2);
              targetSpeedX += tangentX * swirl;
              targetSpeedZ += tangentZ * swirl;
              targetSpeedX *= 1 - gen.speedReduction * influence * 0.32;
              targetSpeedZ *= 1 - gen.speedReduction * influence * 0.32;
            }
          } else {
            // Rotor-local coordinates: axial distance to disc and radial
            // distance inside it. This preserves stream tubes instead of
            // collapsing every particle into one tower-centre point.
            const axial = (particle.x - gen.cx) * gen.normalX + (particle.z - gen.cz) * gen.normalZ;
            const lateralX = (particle.x - gen.cx) - axial * gen.normalX;
            const lateralZ = (particle.z - gen.cz) - axial * gen.normalZ;
            const radial = Math.sqrt(lateralX * lateralX + lateralZ * lateralZ + dy * dy);
            const discWeight = Math.max(0, 1 - radial / Math.max(1, gen.rotorRadius * 1.25));
            const axialWeight = Math.max(0, 1 - Math.abs(axial) / Math.max(1, gen.rotorRadius * 2.2));
            const induction = discWeight * axialWeight;
            targetSpeedX *= 1 - gen.speedReduction * induction * 0.38;
            targetSpeedZ *= 1 - gen.speedReduction * induction * 0.38;
            targetSpeedY += (-dy / Math.max(1, gen.rotorRadius)) * effectiveSpeed * induction * 0.045;
          }

          // VAWT: cylindrical absorption zone (horizontal distance + height check)
          // HAWT: spherical zone (3D distance)
          const shouldAbsorb = gen.isVAWT
            ? (() => {
                const horizDist = Math.sqrt(dx * dx + dz * dz);
                const towerHeight = gen.cy; // center height
                const rotorHalfH = gen.rotorRadius * 1.2; // vertical extent
                const inHeight = particle.y > (towerHeight - rotorHalfH) && particle.y < (towerHeight + rotorHalfH);
                 return horizDist > gen.rotorRadius * 0.3 && horizDist < gen.rotorRadius * 1.05 && inHeight;
              })()
            : (() => {
                const axial = Math.abs((particle.x - gen.cx) * gen.normalX + (particle.z - gen.cz) * gen.normalZ);
                const lateralX = (particle.x - gen.cx) - ((particle.x - gen.cx) * gen.normalX + (particle.z - gen.cz) * gen.normalZ) * gen.normalX;
                const lateralZ = (particle.z - gen.cz) - ((particle.x - gen.cx) * gen.normalX + (particle.z - gen.cz) * gen.normalZ) * gen.normalZ;
                return axial < Math.max(0.8, gen.rotorRadius * 0.12) && Math.sqrt(lateralX * lateralX + lateralZ * lateralZ + dy * dy) < gen.rotorRadius;
              })();
          
          if (shouldAbsorb && !particle.absorbed) {
            particle.absorbed = true;
            particle.absorptionTimer = 16;
            // Gentle brightening instead of a splash: the particle keeps its
            // streamline and is drawn smoothly into the rotor disc.
            particle.size = particle.size * 1.4;
            const pullNorm = Math.sqrt((gen.cx - particle.x) ** 2 + (gen.cy - particle.y) ** 2 + (gen.cz - particle.z) ** 2) || 1;
            particle.speedX += ((gen.cx - particle.x) / pullNorm) * 1.5;
            particle.speedY += ((gen.cy - particle.y) / pullNorm) * 1.0;
            particle.speedZ += ((gen.cz - particle.z) / pullNorm) * 1.5;

            if (absorbSoundCooldown.current <= 0) {
              playAbsorbSound();
              absorbSoundCooldown.current = 0.9;
            }

            // Aggregated generation accounting (no per-hit popups).
            const absorbEnergy = 0.5 * particle.mass * (particle.speedX ** 2 + particle.speedZ ** 2) * gen.rotorEfficiency;
            if ((window as any).__localAbsorptionAdd) {
              (window as any).__localAbsorptionAdd(
                [particle.x, particle.y, particle.z] as [number, number, number],
                absorbEnergy,
                gen.id,
                Math.sqrt(particle.speedX ** 2 + particle.speedY ** 2 + particle.speedZ ** 2)
              );

            }
            
            // No red collision effect for generators — only green absorption popups
          }
        }
      }

      // Higher lerpFactor near generators for responsive suction
      const nearGenerator = generators.some(g => {
        const dx = g.cx - particle.x;
        const dz = g.cz - particle.z;
        return Math.sqrt(dx*dx + dz*dz) < g.attractRadius;
      });
      const response = nearGenerator ? 5.5 : 3.2;
      const lerpFactor = 1 - Math.exp(-response * delta);
      particle.speedX += (targetSpeedX - particle.speedX) * lerpFactor;
      particle.speedY += (targetSpeedY - particle.speedY) * lerpFactor;
      particle.speedZ += (targetSpeedZ - particle.speedZ) * lerpFactor;
      const damping = Math.exp(-0.06 * delta);
      particle.speedX *= damping;
      particle.speedY *= damping;
      particle.speedZ *= damping;
      particle.speedY -= 0.01 * delta;

      particle.x += particle.speedX * delta;
      particle.y += particle.speedY * delta;
      particle.z += particle.speedZ * delta;

      // Age-based respawn for fresh flow
      particle.age = (particle.age || 0) + delta;
      const maxAge = 15 + (Math.sin(i * 7.13) * 0.5 + 0.5) * 10;

      if (particle.x < -width / 2) particle.x = width / 2;
      if (particle.x > width / 2) particle.x = -width / 2;
      if (particle.z < -depth / 2) particle.z = depth / 2;
      if (particle.z > depth / 2) particle.z = -depth / 2;

      // Respawn instead of bounce — prevents ground accumulation
      if (particle.y < 0.5 || particle.y > height || particle.age > maxAge) {
        particle.x = (Math.random() - 0.5) * width;
        particle.y = height * (0.15 + Math.random() * 0.65);
        particle.z = (Math.random() - 0.5) * depth;
        particle.speedX = targetSpeedX * 0.8;
        particle.speedY = (Math.random() - 0.5) * 0.5;
        particle.speedZ = targetSpeedZ * 0.8;
        particle.age = 0;
        particle.hasCollided = false;
        particle.absorbed = false;
      }

      // Absorbed particles shrink + spiral inward before respawn
      if (particle.absorptionTimer > 0) {
        particle.absorptionTimer--;
        const progress = 1 - particle.absorptionTimer / 28; // 0→1
        
        particle.size = Math.max(0.04, 0.8 * (1 - progress));
        if (particle.absorptionTimer === 0) {
          particle.absorbed = false;
          particle.size = 0.8;
          particle.x = (Math.random() - 0.5) * width;
          particle.y = height * (0.15 + Math.random() * 0.65);
          particle.z = (Math.random() - 0.5) * depth;
          particle.age = 0;
        }
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
            if (onCollisionEvent && Math.random() < 0.08) {
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

            // Enhanced scatter: velocity-dependent + random spread
            const scatterAmount = physics.turbulenceGeneration * 2.5;
            const speedFactor = Math.min(speed * 0.15, 2);
            particle.speedX += (Math.random() - 0.5) * scatterAmount * (1 + speedFactor);
            particle.speedY += Math.random() * scatterAmount * 0.8;
            particle.speedZ += (Math.random() - 0.5) * scatterAmount * (1 + speedFactor);
            // Post-collision speed decay
            const decayFactor = 0.6 + materialRestitution * 0.3;
            particle.speedX *= decayFactor;
            particle.speedY *= decayFactor;
            particle.speedZ *= decayFactor;
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
      buf.absorbProgress[i] = particle.absorbed ? 1 - (particle.absorptionTimer / 28) : 0;
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
      preset={particlePreset}
    />
  );
};
