import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { WindPhysicsConfig, calculateWindShear } from './WindPhysicsEngine';
import { calculateGeneratorPower } from './WindGenerator3D';
import { Obstacle } from '../types';

// ==================== WIND PROFILE ====================
export const WindProfileViz: React.FC<{ config: WindPhysicsConfig }> = ({ config }) => {
  const groupRef = useRef<THREE.Group>(null);
  const heights = [2, 5, 10, 20, 30, 40, 50];
  const angleRad = (config.windAngle * Math.PI) / 180;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Group) {
        // Pulse arrows with gust cycle
        const pulse = 1 + Math.sin(t * 1.5 + i * 0.4) * 0.12;
        child.scale.setScalar(pulse);
      }
    });
  });

  return (
    <group ref={groupRef} position={[-48, 0, -48]}>
      {heights.map((h, i) => {
        const speed = calculateWindShear(config.windSpeed, config.referenceHeight, h, config.surfaceRoughness);
        const arrowLen = speed * 0.6;
        const norm = Math.min(speed / 20, 1);
        // Color gradient: blue(slow) → cyan → white(fast)
        const r = 0.1 + norm * 0.9;
        const g = 0.4 + norm * 0.6;
        const b = 1.0;
        const color = new THREE.Color(r, g, b);
        const hexColor = `#${color.getHexString()}`;
        return (
          <group key={h} position={[0, h, 0]}>
            <mesh position={[Math.cos(angleRad) * arrowLen / 2, 0, Math.sin(angleRad) * arrowLen / 2]}
              rotation={[0, -angleRad + Math.PI / 2, Math.PI / 2]}>
              <cylinderGeometry args={[0.06 + norm * 0.06, 0.06 + norm * 0.06, arrowLen, 6]} />
              <meshBasicMaterial color={hexColor} transparent opacity={0.5 + norm * 0.3} />
            </mesh>
            <mesh position={[Math.cos(angleRad) * arrowLen, 0, Math.sin(angleRad) * arrowLen]}
              rotation={[0, -angleRad + Math.PI / 2, 0]}>
              <coneGeometry args={[0.2 + norm * 0.15, 0.5 + norm * 0.3, 6]} />
              <meshBasicMaterial color={hexColor} transparent opacity={0.6 + norm * 0.3} />
            </mesh>
            <Html position={[Math.cos(angleRad) * (arrowLen + 1.5), 0, Math.sin(angleRad) * (arrowLen + 1.5)]} center style={{ pointerEvents: 'none' }}>
              <div className="text-[7px] font-mono px-1 rounded whitespace-nowrap" style={{
                backgroundColor: 'rgba(0,0,0,0.85)', color: hexColor, border: `1px solid ${hexColor}40`
              }}>
                {h}m: {speed.toFixed(1)} m/s
              </div>
            </Html>
          </group>
        );
      })}
      {/* Profile curve connecting tips */}
      {(() => {
        const points = heights.map(h => {
          const speed = calculateWindShear(config.windSpeed, config.referenceHeight, h, config.surfaceRoughness);
          const len = speed * 0.6;
          return new THREE.Vector3(Math.cos(angleRad) * len, h, Math.sin(angleRad) * len);
        });
        const curve = new THREE.CatmullRomCurve3(points);
        const curvePoints = curve.getPoints(40);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
        return (
          <line>
            <bufferGeometry attach="geometry" {...lineGeo} />
            <lineBasicMaterial color="#00ccff" transparent opacity={0.4} />
          </line>
        );
      })()}
    </group>
  );
};

// ==================== PRESSURE MAP ====================
export const PressureMapViz: React.FC<{ config: WindPhysicsConfig; obstacles: Obstacle[] }> = ({ config, obstacles }) => {
  const groupRef = useRef<THREE.Group>(null);
  const angleRad = (config.windAngle * Math.PI) / 180;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    const ws = config.windSpeed;
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Group) {
        const pulse = 1 + Math.sin(t * ws * 0.15 + i) * 0.15;
        child.scale.setScalar(pulse);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {obstacles.map((obs, i) => {
        if (obs.type === 'wind_generator') return null;
        const cx = obs.x + obs.width / 2, cz = obs.z + obs.depth / 2;
        const hpX = cx - Math.cos(angleRad) * obs.width, hpZ = cz - Math.sin(angleRad) * obs.depth;
        const lpX = cx + Math.cos(angleRad) * obs.width * 1.5, lpZ = cz + Math.sin(angleRad) * obs.depth * 1.5;
        const pi = Math.min(config.windSpeed / 15, 1);
        const dynPressure = 0.5 * config.airDensity * config.windSpeed * config.windSpeed;
        return (
          <group key={`pressure-${i}`}>
            {/* High pressure zone */}
            <mesh position={[hpX, obs.height * 0.5, hpZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[obs.width * 0.6 * (0.5 + pi * 0.5), 24]} />
              <meshBasicMaterial color="#ff3333" transparent opacity={0.12 + pi * 0.12} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[hpX, obs.height * 0.5, hpZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[obs.width * 0.3, obs.width * 0.6 * (0.5 + pi * 0.5), 24]} />
              <meshBasicMaterial color="#ff5555" transparent opacity={0.06 + pi * 0.06} side={THREE.DoubleSide} />
            </mesh>
            <Html position={[hpX, obs.height * 0.7, hpZ]} center style={{ pointerEvents: 'none' }}>
              <div className="text-[7px] font-mono px-1 rounded" style={{ backgroundColor: 'rgba(255,30,30,0.25)', color: '#ff6666', border: '1px solid rgba(255,50,50,0.3)' }}>
                H+ {dynPressure.toFixed(0)} Pa
              </div>
            </Html>
            {/* Low pressure zone */}
            <mesh position={[lpX, obs.height * 0.5, lpZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[obs.width * 0.7 * (0.5 + pi * 0.5), 24]} />
              <meshBasicMaterial color="#3333ff" transparent opacity={0.1 + pi * 0.08} side={THREE.DoubleSide} />
            </mesh>
            <Html position={[lpX, obs.height * 0.7, lpZ]} center style={{ pointerEvents: 'none' }}>
              <div className="text-[7px] font-mono px-1 rounded" style={{ backgroundColor: 'rgba(30,30,255,0.25)', color: '#7777ff', border: '1px solid rgba(50,50,255,0.3)' }}>
                L- {(dynPressure * 0.6).toFixed(0)} Pa
              </div>
            </Html>
            {/* Deflection arrows */}
            {[-1, 1].map(side => {
              const perpX = -Math.sin(angleRad) * side * obs.width * 0.8;
              const perpZ = Math.cos(angleRad) * side * obs.depth * 0.8;
              return (
                <mesh key={side} position={[cx + perpX, obs.height * 0.4, cz + perpZ]}
                  rotation={[0, -angleRad + Math.PI / 2 + side * 0.4, 0]}>
                  <coneGeometry args={[0.15, 0.4, 4]} />
                  <meshBasicMaterial color="#8888ff" transparent opacity={0.3 + pi * 0.2} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

// ==================== TURBULENCE FIELD ====================
export const TurbulenceFieldViz: React.FC<{ config: WindPhysicsConfig; obstacles: Obstacle[] }> = ({ config, obstacles }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    const ti = config.turbulenceIntensity;
    let idx = 0;
    groupRef.current.traverse(child => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.TorusGeometry) {
        child.rotation.x = Math.PI / 2 + Math.sin(t * (1 + ti * 3) + idx) * 0.3;
        child.rotation.z = Math.cos(t * (0.8 + ti * 2) + idx * 1.5) * 0.2;
        idx++;
      }
    });
  });

  const ti = config.turbulenceIntensity * config.windSpeed;
  const angleRad = (config.windAngle * Math.PI) / 180;

  // Dynamic placement: around obstacles + some ambient positions
  const positions: [number, number, number][] = [];
  obstacles.forEach(obs => {
    const cx = obs.x + obs.width / 2, cz = obs.z + obs.depth / 2;
    // Behind obstacle (wake turbulence)
    positions.push([cx + Math.cos(angleRad) * obs.width * 2, obs.height * 0.6, cz + Math.sin(angleRad) * obs.depth * 2]);
    // Above obstacle
    positions.push([cx, obs.height * 1.2, cz]);
  });
  // Add ambient if few obstacles
  if (positions.length < 4) {
    positions.push([-15, 15, -15], [15, 25, 15], [0, 10, 0]);
  }

  return (
    <group ref={groupRef}>
      {positions.slice(0, 12).map(([px, py, pz], i) => {
        const size = 1.2 + ti * 0.25;
        return (
          <group key={`turb-${i}`} position={[px, py, pz]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[size, 0.08, 6, 20]} />
              <meshBasicMaterial color="#aa44ff" transparent opacity={0.12 + ti * 0.02} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
              <torusGeometry args={[size * 0.7, 0.06, 6, 16]} />
              <meshBasicMaterial color="#cc66ff" transparent opacity={0.08 + ti * 0.015} side={THREE.DoubleSide} />
            </mesh>
            <Html position={[size + 0.8, 0, 0]} center style={{ pointerEvents: 'none' }}>
              <div className="text-[6px] font-mono px-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.75)', color: '#bb66ff' }}>
                TI={config.turbulenceIntensity.toFixed(2)}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

// ==================== CAPACITY FACTOR ====================
export const CapacityFactorViz: React.FC<{ config: WindPhysicsConfig; obstacles: Obstacle[] }> = ({ config, obstacles }) => {
  const generators = obstacles.filter(o => o.type === 'wind_generator');
  const sweepRef = useRef<number[]>(generators.map(() => 0));

  useFrame(({ clock }) => {
    const dt = clock.getDelta();
    generators.forEach((obs, i) => {
      const power = calculateGeneratorPower(config.airDensity, obs.width * 1.8, config.windSpeed, obs.height + obs.y, config.referenceHeight, config.surfaceRoughness, obs.generatorSubtype || 'hawt3');
      const ratedPower = 0.5 * config.airDensity * Math.PI * Math.pow(obs.width * 0.9, 2) * Math.pow(12, 3) * 0.45;
      const targetCf = ratedPower > 0 ? Math.min(power / ratedPower, 0.6) : 0;
      // Smooth animation
      if (sweepRef.current[i] === undefined) sweepRef.current[i] = 0;
      sweepRef.current[i] += (targetCf - sweepRef.current[i]) * Math.min(dt * 3, 1);
    });
  });

  return (
    <group>
      {generators.map((obs, i) => {
        const cx = obs.x + obs.width / 2, cz = obs.z + obs.depth / 2;
        const power = calculateGeneratorPower(config.airDensity, obs.width * 1.8, config.windSpeed, obs.height + obs.y, config.referenceHeight, config.surfaceRoughness, obs.generatorSubtype || 'hawt3');
        const ratedPower = 0.5 * config.airDensity * Math.PI * Math.pow(obs.width * 0.9, 2) * Math.pow(12, 3) * 0.45;
        const cf = ratedPower > 0 ? Math.min(power / ratedPower, 0.6) : 0;
        const cfPct = (cf * 100).toFixed(0);
        const cfColor = cf < 0.2 ? '#ff4444' : cf < 0.35 ? '#ffaa00' : '#44ff44';
        return (
          <Html key={`cf-${i}`} position={[cx, obs.height + obs.y + 10, cz]} center style={{ pointerEvents: 'none' }}>
            <div className="flex flex-col items-center bg-black/70 rounded-lg px-2 py-1 border" style={{ borderColor: `${cfColor}60` }}>
              <svg width="56" height="36" viewBox="0 0 56 36">
                <path d="M 6 30 A 22 22 0 0 1 50 30" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
                <path d="M 6 30 A 22 22 0 0 1 50 30" fill="none" stroke={cfColor} strokeWidth="4"
                  strokeDasharray={`${cf / 0.6 * 69} 69`} strokeLinecap="round" />
                <text x="28" y="28" textAnchor="middle" fill={cfColor} fontSize="11" fontFamily="monospace" fontWeight="bold">{cfPct}%</text>
              </svg>
              <div className="text-[8px] font-mono font-bold" style={{ color: cfColor }}>
                Capacity Factor
              </div>
              <div className="text-[7px] font-mono text-gray-400">
                {power.toFixed(0)}W / {ratedPower.toFixed(0)}W
              </div>
            </div>
          </Html>
        );
      })}
    </group>
  );
};

// ==================== BETZ OVERLAY ====================
export const BetzOverlayViz: React.FC<{ config: WindPhysicsConfig; obstacles: Obstacle[] }> = ({ config, obstacles }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    let meshIdx = 0;
    groupRef.current.traverse(child => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
        child.rotation.y = t * 0.3 + meshIdx * 0.5;
        child.rotation.x = Math.sin(t * 0.5 + meshIdx) * 0.1;
        // Pulse opacity
        const mat = child.material as THREE.MeshBasicMaterial;
        if (mat.opacity !== undefined) {
          const baseOp = meshIdx % 3 === 0 ? 0.04 : meshIdx % 3 === 1 ? 0.06 : 0.1;
          mat.opacity = baseOp + Math.sin(t * 2 + meshIdx) * 0.02;
        }
        meshIdx++;
      }
    });
  });

  const generators = obstacles.filter(o => o.type === 'wind_generator');

  return (
    <group ref={groupRef}>
      {generators.map((obs, i) => {
        const cx = obs.x + obs.width / 2, cz = obs.z + obs.depth / 2;
        const cy = obs.y + obs.height * 0.7;
        const rotorR = obs.width * 0.9 * (obs.scale || 1);
        const power = calculateGeneratorPower(config.airDensity, obs.width * 1.8, config.windSpeed, obs.height + obs.y, config.referenceHeight, config.surfaceRoughness, obs.generatorSubtype || 'hawt3');
        const totalWind = 0.5 * config.airDensity * Math.PI * rotorR * rotorR * Math.pow(config.windSpeed, 3);
        const actualPct = totalWind > 0 ? ((power / totalWind) * 100).toFixed(0) : '0';
        return (
          <group key={`betz-${i}`} position={[cx, cy, cz]}>
            {/* Outer: total wind energy */}
            <mesh><sphereGeometry args={[rotorR * 1.5, 20, 14]} /><meshBasicMaterial color="#4488ff" transparent opacity={0.04} wireframe /></mesh>
            {/* Middle: Betz limit 59.3% */}
            <mesh><sphereGeometry args={[rotorR * 1.1, 20, 14]} /><meshBasicMaterial color="#ffaa00" transparent opacity={0.06} wireframe /></mesh>
            {/* Inner: actual extraction */}
            <mesh><sphereGeometry args={[rotorR * 0.7, 20, 14]} /><meshBasicMaterial color="#44ff44" transparent opacity={0.1} wireframe /></mesh>
            {/* Animated expanding ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[rotorR * 0.5, rotorR * 0.55, 24]} />
              <meshBasicMaterial color="#44ff44" transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
            <Html position={[rotorR * 1.7, rotorR * 0.6, 0]} center style={{ pointerEvents: 'none' }}>
              <div className="text-[7px] font-mono leading-tight px-1.5 py-0.5 rounded bg-black/80" style={{ border: '1px solid rgba(68,136,255,0.4)' }}>
                <div style={{ color: '#4488ff' }}>100% — повна E</div>
                <div style={{ color: '#ffaa00' }}>59.3% — Betz</div>
                <div style={{ color: '#44ff44' }}>{actualPct}% — факт.</div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
