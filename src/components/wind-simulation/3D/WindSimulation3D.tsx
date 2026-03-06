import React, { useState, Suspense, useCallback, useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import { AdvancedParticleSystem } from './AdvancedParticleSystem';
import { Obstacle3D } from './Obstacle3D';
import { WindGenerator3D, calculateGeneratorPower } from './WindGenerator3D';
import { AdvancedMeasurementPanel } from './AdvancedMeasurementPanel';
import { AdvancedWindControls } from './AdvancedWindControls';
import { GhostObstacle } from './GhostObstacle';
import { CollisionEffectsManager } from './CollisionEffect';
import { CollisionHotspotManager } from './CollisionHotspot';
import { LocalHitManager } from './LocalHitPopup';
import { WindPhysicsConfig, DEFAULT_WIND_PHYSICS, calculateWindShear } from './WindPhysicsEngine';
import { Obstacle, OBSTACLE_CATEGORIES, ObstacleType, GeneratorSubtype } from '../types';
import { t, type Lang } from '@/utils/i18n';
import { playPlaceSound, playRotateSound, playClearSound, playScaleSound } from '@/utils/sounds';
import { Crosshair, MousePointer, Map as MapIcon, Ruler, Eye } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as THREE from 'three';

interface WindSimulation3DProps {
  windSpeed?: number;
  onWindSpeedChange?: (speed: number) => void;
  lang: Lang;
}

// Terrain Y offset — matches the grid rotation so objects sit correctly on slopes
function getTerrainYOffset(x: number, z: number, slopeXDeg: number, slopeZDeg: number): number {
  const slopeXRad = (slopeXDeg * Math.PI) / 180;
  const slopeZRad = (slopeZDeg * Math.PI) / 180;
  // Grid rotation: [slopeZ_rad, 0, -slopeX_rad]
  // Around Z-axis by -slopeX: point at +X goes DOWN → offset = -sin(slopeX) * x
  // Around X-axis by +slopeZ: point at +Z goes UP → offset = sin(slopeZ) * z
  const raw = -Math.sin(slopeXRad) * x - Math.sin(slopeZRad) * z;
  return Math.max(-8, Math.min(8, raw));
}

// 3D Height Ruler component
const HeightRuler: React.FC<{ maxHeight: number; config: WindPhysicsConfig }> = ({ maxHeight, config }) => {
  const heights = [0, 10, 30, 50, 80, 100];
  return (
    <group position={[52, 0, -48]}>
      {/* Vertical pole */}
      <mesh position={[0, maxHeight / 2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, maxHeight, 6]} />
        <meshBasicMaterial color="#39ff14" transparent opacity={0.5} />
      </mesh>
      {/* Tick marks + labels */}
      {heights.filter(h => h <= maxHeight).map(h => {
        const windAtH = calculateWindShear(config.windSpeed, config.referenceHeight, Math.max(1, h), config.surfaceRoughness);
        return (
          <group key={h} position={[0, h, 0]}>
            <mesh position={[0.8, 0, 0]}>
              <boxGeometry args={[1.5, 0.06, 0.06]} />
              <meshBasicMaterial color="#39ff14" transparent opacity={0.4} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.15, 6, 6]} />
              <meshBasicMaterial color="#39ff14" transparent opacity={0.6} />
            </mesh>
          </group>
        );
      })}
      {/* Base plate */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 12]} />
        <meshBasicMaterial color="#39ff14" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// Height Ruler with Html labels
const HeightRulerLabels: React.FC<{ maxHeight: number; config: WindPhysicsConfig }> = ({ maxHeight, config }) => {
  const heights = [0, 10, 30, 50, 80, 100].filter(h => h <= maxHeight);
  return (
    <group position={[52, 0, -48]}>
      {heights.map(h => {
        const windAtH = calculateWindShear(config.windSpeed, config.referenceHeight, Math.max(1, h), config.surfaceRoughness);
        const power = 0.5 * config.airDensity * Math.pow(windAtH, 3);
        return (
          <Html key={h} position={[2.5, h, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="text-[8px] font-mono whitespace-nowrap px-1 py-0.5 rounded" style={{ 
              backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(57,255,20,0.3)',
              color: '#39ff14'
            }}>
              <span className="text-[7px] text-green-300/60">{h}m</span>{' '}
              <span>{windAtH.toFixed(1)}</span> m/s{' '}
              <span className="text-cyan-400">{power.toFixed(0)} W/m²</span>
            </div>
          </Html>
        );
      })}
    </group>
  );
};

// Scenario presets
export interface ScenarioPreset {
  id: string;
  name: Record<Lang, string>;
  description: Record<Lang, string>;
  config: Partial<WindPhysicsConfig>;
  obstacles: Obstacle[];
  particleCount: number;
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'open_field',
    name: { ua: 'Відкрите поле', en: 'Open Field' },
    description: { ua: 'Рівне поле з мінімальними перешкодами. Ідеальні умови для вітроенергетики.', en: 'Flat field with minimal obstacles. Ideal wind energy conditions.' },
    config: {
      windSpeed: 9, windAngle: 45, windElevation: 0,
      turbulenceIntensity: 0.15, turbulenceScale: 1.0,
      gustFrequency: 4, gustIntensity: 0.15,
      temperature: 18, humidity: 45, altitude: 100,
      surfaceRoughness: 0.03, referenceHeight: 10,
      terrainSlopeX: 0, terrainSlopeZ: 0,
    },
    obstacles: [
      { id: 'gen-1', type: 'wind_generator', category: 'energy', shape: 'regular', x: -5, y: 0, z: -5, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.2 },
      { id: 'gen-2', type: 'wind_generator', category: 'energy', shape: 'regular', x: 25, y: 0, z: -5, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.2 },
      { id: 'tree-1', type: 'tree', category: 'vegetation', shape: 'regular', x: -30, y: 0, z: 20, width: 10, height: 20, depth: 10, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'tree-2', type: 'tree', category: 'vegetation', shape: 'regular', x: -35, y: 0, z: 25, width: 10, height: 20, depth: 10, material: 'wood', resistance: 0.8, density: 0.6 },
    ],
    particleCount: 300,
  },
  {
    id: 'urban_city',
    name: { ua: 'Місто', en: 'Urban City' },
    description: { ua: 'Щільна міська забудова з висотками. Складна турбулентність та тіньові зони.', en: 'Dense urban area with high-rises. Complex turbulence and shadow zones.' },
    config: {
      windSpeed: 6, windAngle: 90, windElevation: 0,
      turbulenceIntensity: 0.6, turbulenceScale: 2.0,
      gustFrequency: 10, gustIntensity: 0.35,
      temperature: 22, humidity: 55, altitude: 50,
      surfaceRoughness: 1.5, referenceHeight: 10,
      terrainSlopeX: 0, terrainSlopeZ: 0,
    },
    obstacles: [
      { id: 'sky-1', type: 'skyscraper', category: 'structure', shape: 'regular', x: -15, y: 0, z: -10, width: 15, height: 45, depth: 10, material: 'glass', resistance: 1.2, density: 0.9 },
      { id: 'bld-1', type: 'building', category: 'structure', shape: 'regular', x: 10, y: 0, z: -15, width: 10, height: 15, depth: 10, material: 'concrete', resistance: 1.2, density: 0.9 },
      { id: 'bld-2', type: 'building', category: 'structure', shape: 'regular', x: 10, y: 0, z: 10, width: 10, height: 18, depth: 10, material: 'concrete', resistance: 1.2, density: 0.9 },
      { id: 'bld-3', type: 'building', category: 'structure', shape: 'regular', x: -10, y: 0, z: 15, width: 10, height: 12, depth: 10, material: 'brick', resistance: 1.2, density: 0.9 },
      { id: 'house-1', type: 'house', category: 'structure', shape: 'regular', x: 25, y: 0, z: 5, width: 10, height: 12, depth: 10, material: 'brick', resistance: 1.2, density: 0.9 },
      { id: 'gen-city', type: 'wind_generator', category: 'energy', shape: 'regular', x: 30, y: 0, z: -20, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'micro' },
      { id: 'fence-1', type: 'fence', category: 'barrier', shape: 'regular', x: -30, y: 0, z: 0, width: 10, height: 3, depth: 1, material: 'wood', resistance: 1.0, density: 0.7 },
    ],
    particleCount: 400,
  },
  {
    id: 'coastal',
    name: { ua: 'Узбережжя', en: 'Coastal' },
    description: { ua: 'Морське узбережжя з сильним стабільним вітром та мінімальною шорсткістю.', en: 'Seaside with strong steady wind and minimal surface roughness.' },
    config: {
      windSpeed: 12, windAngle: 180, windElevation: -5,
      turbulenceIntensity: 0.1, turbulenceScale: 0.5,
      gustFrequency: 2, gustIntensity: 0.1,
      temperature: 14, humidity: 80, altitude: 5,
      surfaceRoughness: 0.001, referenceHeight: 10,
      terrainSlopeX: 3, terrainSlopeZ: 0,
    },
    obstacles: [
      { id: 'gen-c1', type: 'wind_generator', category: 'energy', shape: 'regular', x: -20, y: 0, z: 0, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.5 },
      { id: 'gen-c2', type: 'wind_generator', category: 'energy', shape: 'regular', x: 15, y: 0, z: 0, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt2', scale: 1.3 },
      { id: 'tower-c', type: 'tower', category: 'structure', shape: 'regular', x: 35, y: 0, z: 20, width: 5, height: 35, depth: 5, material: 'steel', resistance: 1.2, density: 0.9 },
    ],
    particleCount: 350,
  },
  {
    id: 'hilltop',
    name: { ua: 'Пагорб', en: 'Hilltop' },
    description: { ua: 'Вітроелектростанція на вершині пагорба. Ефект прискорення вітру (hill speedup).', en: 'Wind farm on hilltop. Hill speedup effect increases power.' },
    config: {
      windSpeed: 10, windAngle: 0, windElevation: 5,
      turbulenceIntensity: 0.25, turbulenceScale: 1.5,
      gustFrequency: 6, gustIntensity: 0.2,
      temperature: 10, humidity: 60, altitude: 500,
      surfaceRoughness: 0.1, referenceHeight: 10,
      terrainSlopeX: 8, terrainSlopeZ: 4,
    },
    obstacles: [
      { id: 'gen-h1', type: 'wind_generator', category: 'energy', shape: 'regular', x: -10, y: 0, z: -10, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.4 },
      { id: 'gen-h2', type: 'wind_generator', category: 'energy', shape: 'regular', x: 15, y: 0, z: 10, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'darrieus' },
      { id: 'tree-h1', type: 'tree', category: 'vegetation', shape: 'regular', x: -30, y: 0, z: 15, width: 10, height: 20, depth: 10, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'tree-h2', type: 'tree', category: 'vegetation', shape: 'regular', x: -25, y: 0, z: -20, width: 10, height: 20, depth: 10, material: 'wood', resistance: 0.8, density: 0.6 },
    ],
    particleCount: 350,
  },
  {
    id: 'industrial',
    name: { ua: 'Індустріальна зона', en: 'Industrial Zone' },
    description: { ua: 'Промисловий район з великими об\'єктами та різними типами генераторів.', en: 'Industrial area with large objects and diverse generator types.' },
    config: {
      windSpeed: 7, windAngle: 270, windElevation: 0,
      turbulenceIntensity: 0.45, turbulenceScale: 1.8,
      gustFrequency: 8, gustIntensity: 0.3,
      temperature: 20, humidity: 50, altitude: 150,
      surfaceRoughness: 0.8, referenceHeight: 10,
      terrainSlopeX: 0, terrainSlopeZ: 0,
    },
    obstacles: [
      { id: 'wall-i1', type: 'wall', category: 'barrier', shape: 'regular', x: -35, y: 0, z: -15, width: 10, height: 8, depth: 3, material: 'concrete', resistance: 1.0, density: 0.7 },
      { id: 'bld-i1', type: 'building', category: 'structure', shape: 'regular', x: -20, y: 0, z: -5, width: 10, height: 15, depth: 10, material: 'concrete', resistance: 1.2, density: 0.9 },
      { id: 'bld-i2', type: 'building', category: 'structure', shape: 'regular', x: 5, y: 0, z: -10, width: 10, height: 20, depth: 10, material: 'steel', resistance: 1.2, density: 0.9 },
      { id: 'gen-i1', type: 'wind_generator', category: 'energy', shape: 'regular', x: 20, y: 0, z: 10, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'savonius' },
      { id: 'gen-i2', type: 'wind_generator', category: 'energy', shape: 'regular', x: -5, y: 0, z: 20, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3' },
      { id: 'tower-i', type: 'tower', category: 'structure', shape: 'regular', x: 30, y: 0, z: -20, width: 5, height: 35, depth: 5, material: 'steel', resistance: 1.2, density: 0.9 },
    ],
    particleCount: 500,
  },
  // New scenarios
  {
    id: 'wind_farm',
    name: { ua: 'Вітроферма', en: 'Wind Farm' },
    description: { ua: 'Масив вітрогенераторів з оптимальним розташуванням. Дослідження wake-ефектів.', en: 'Wind turbine array with optimal spacing. Wake effect research.' },
    config: {
      windSpeed: 11, windAngle: 0, windElevation: 0,
      turbulenceIntensity: 0.12, turbulenceScale: 0.8,
      gustFrequency: 3, gustIntensity: 0.12,
      temperature: 15, humidity: 50, altitude: 200,
      surfaceRoughness: 0.05, referenceHeight: 10,
      terrainSlopeX: 0, terrainSlopeZ: 0,
    },
    obstacles: [
      { id: 'wf-1', type: 'wind_generator', category: 'energy', shape: 'regular', x: -35, y: 0, z: -15, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.3 },
      { id: 'wf-2', type: 'wind_generator', category: 'energy', shape: 'regular', x: -35, y: 0, z: 15, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.3 },
      { id: 'wf-3', type: 'wind_generator', category: 'energy', shape: 'regular', x: 0, y: 0, z: -15, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.3 },
      { id: 'wf-4', type: 'wind_generator', category: 'energy', shape: 'regular', x: 0, y: 0, z: 15, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.3 },
      { id: 'wf-5', type: 'wind_generator', category: 'energy', shape: 'regular', x: 30, y: 0, z: 0, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt2', scale: 1.4 },
    ],
    particleCount: 400,
  },
  {
    id: 'forest_edge',
    name: { ua: 'Узлісся', en: 'Forest Edge' },
    description: { ua: 'Перехід від лісу до відкритого поля. Складна аеродинаміка на межі.', en: 'Transition from forest to open field. Complex aerodynamics at the boundary.' },
    config: {
      windSpeed: 7, windAngle: 135, windElevation: 0,
      turbulenceIntensity: 0.4, turbulenceScale: 1.5,
      gustFrequency: 5, gustIntensity: 0.25,
      temperature: 16, humidity: 65, altitude: 200,
      surfaceRoughness: 0.5, referenceHeight: 10,
      terrainSlopeX: 2, terrainSlopeZ: 1,
    },
    obstacles: [
      { id: 'fe-t1', type: 'tree', category: 'vegetation', shape: 'regular', x: -40, y: 0, z: -20, width: 12, height: 26, depth: 12, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'fe-t2', type: 'tree', category: 'vegetation', shape: 'regular', x: -38, y: 0, z: -5, width: 8, height: 14, depth: 8, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'fe-t3', type: 'tree', category: 'vegetation', shape: 'regular', x: -42, y: 0, z: 10, width: 14, height: 28, depth: 14, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'fe-t4', type: 'tree', category: 'vegetation', shape: 'regular', x: -35, y: 0, z: 20, width: 7, height: 12, depth: 7, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'fe-t5', type: 'tree', category: 'vegetation', shape: 'regular', x: -30, y: 0, z: -15, width: 10, height: 20, depth: 10, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'fe-t6', type: 'tree', category: 'vegetation', shape: 'regular', x: -36, y: 0, z: 28, width: 6, height: 10, depth: 6, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'fe-t7', type: 'tree', category: 'vegetation', shape: 'regular', x: -44, y: 0, z: -30, width: 11, height: 22, depth: 11, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'fe-g1', type: 'wind_generator', category: 'energy', shape: 'regular', x: 10, y: 0, z: 0, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.2 },
      { id: 'fe-f1', type: 'fence', category: 'barrier', shape: 'regular', x: -20, y: 0, z: -25, width: 15, height: 3, depth: 1, material: 'wood', resistance: 1.0, density: 0.7 },
    ],
    particleCount: 350,
  },
  {
    id: 'mountain_pass',
    name: { ua: 'Гірський перевал', en: 'Mountain Pass' },
    description: { ua: 'Вузький перевал між горами. Ефект Вентурі прискорює вітер.', en: 'Narrow pass between mountains. Venturi effect accelerates wind.' },
    config: {
      windSpeed: 14, windAngle: 0, windElevation: -3,
      turbulenceIntensity: 0.35, turbulenceScale: 2.5,
      gustFrequency: 7, gustIntensity: 0.4,
      temperature: 5, humidity: 40, altitude: 1200,
      surfaceRoughness: 0.3, referenceHeight: 10,
      terrainSlopeX: 12, terrainSlopeZ: -5,
    },
    obstacles: [
      { id: 'mp-w1', type: 'wall', category: 'barrier', shape: 'regular', x: -10, y: 0, z: -30, width: 20, height: 25, depth: 5, material: 'concrete', resistance: 1.2, density: 0.9 },
      { id: 'mp-w2', type: 'wall', category: 'barrier', shape: 'regular', x: -10, y: 0, z: 25, width: 20, height: 25, depth: 5, material: 'concrete', resistance: 1.2, density: 0.9 },
      { id: 'mp-g1', type: 'wind_generator', category: 'energy', shape: 'regular', x: 20, y: 0, z: 0, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'darrieus', scale: 1.2 },
    ],
    particleCount: 300,
  },
  {
    id: 'suburban',
    name: { ua: 'Приміська зона', en: 'Suburban Area' },
    description: { ua: 'Приватна забудова з будинками та садами. Мікрогенерація.', en: 'Residential area with houses and gardens. Micro-generation.' },
    config: {
      windSpeed: 5, windAngle: 200, windElevation: 0,
      turbulenceIntensity: 0.35, turbulenceScale: 1.2,
      gustFrequency: 6, gustIntensity: 0.2,
      temperature: 20, humidity: 50, altitude: 100,
      surfaceRoughness: 0.5, referenceHeight: 10,
      terrainSlopeX: 0, terrainSlopeZ: 0,
    },
    obstacles: [
      { id: 'sb-h1', type: 'house', category: 'structure', shape: 'regular', x: -25, y: 0, z: -15, width: 10, height: 12, depth: 10, material: 'brick', resistance: 1.2, density: 0.9 },
      { id: 'sb-h2', type: 'house', category: 'structure', shape: 'regular', x: 5, y: 0, z: -15, width: 10, height: 10, depth: 10, material: 'brick', resistance: 1.2, density: 0.9 },
      { id: 'sb-h3', type: 'house', category: 'structure', shape: 'regular', x: -15, y: 0, z: 12, width: 10, height: 11, depth: 10, material: 'brick', resistance: 1.2, density: 0.9 },
      { id: 'sb-t1', type: 'tree', category: 'vegetation', shape: 'regular', x: -35, y: 0, z: 5, width: 10, height: 18, depth: 10, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'sb-t2', type: 'tree', category: 'vegetation', shape: 'regular', x: 20, y: 0, z: 10, width: 10, height: 15, depth: 10, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'sb-f1', type: 'fence', category: 'barrier', shape: 'regular', x: -5, y: 0, z: -8, width: 12, height: 3, depth: 1, material: 'wood', resistance: 1.0, density: 0.7 },
      { id: 'sb-g1', type: 'wind_generator', category: 'energy', shape: 'regular', x: 30, y: 0, z: -5, width: 6, height: 15, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'micro', scale: 0.8 },
      { id: 'sb-g2', type: 'wind_generator', category: 'energy', shape: 'regular', x: -30, y: 0, z: 20, width: 6, height: 20, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'savonius', scale: 0.9 },
    ],
    particleCount: 300,
  },
  {
    id: 'canyon',
    name: { ua: 'Каньйон', en: 'Canyon' },
    description: { ua: 'Вузький прохід між стінами. Ефект тунелю прискорює потік.', en: 'Narrow passage between walls. Tunnel effect accelerates flow.' },
    config: {
      windSpeed: 13, windAngle: 0, windElevation: -2,
      turbulenceIntensity: 0.3, turbulenceScale: 2.0,
      gustFrequency: 8, gustIntensity: 0.35,
      temperature: 12, humidity: 35, altitude: 600,
      surfaceRoughness: 0.4, referenceHeight: 10,
      terrainSlopeX: 0, terrainSlopeZ: 0,
    },
    obstacles: [
      { id: 'cn-w1', type: 'wall', category: 'barrier', shape: 'regular', x: -15, y: 0, z: -35, width: 25, height: 20, depth: 5, material: 'concrete', resistance: 1.2, density: 0.9 },
      { id: 'cn-w2', type: 'wall', category: 'barrier', shape: 'regular', x: -15, y: 0, z: 30, width: 25, height: 22, depth: 5, material: 'concrete', resistance: 1.2, density: 0.9 },
      { id: 'cn-g1', type: 'wind_generator', category: 'energy', shape: 'regular', x: 20, y: 0, z: 0, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'darrieus', scale: 1.1 },
    ],
    particleCount: 400,
  },
  {
    id: 'park',
    name: { ua: 'Парк', en: 'Park' },
    description: { ua: 'Міський парк з різноманітними деревами різних розмірів.', en: 'City park with diverse trees of various sizes.' },
    config: {
      windSpeed: 5, windAngle: 60, windElevation: 0,
      turbulenceIntensity: 0.35, turbulenceScale: 1.3,
      gustFrequency: 4, gustIntensity: 0.15,
      temperature: 22, humidity: 55, altitude: 80,
      surfaceRoughness: 0.3, referenceHeight: 10,
      terrainSlopeX: 1, terrainSlopeZ: -1,
    },
    obstacles: [
      { id: 'pk-t1', type: 'tree', category: 'vegetation', shape: 'regular', x: -30, y: 0, z: -20, width: 14, height: 28, depth: 14, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'pk-t2', type: 'tree', category: 'vegetation', shape: 'regular', x: -15, y: 0, z: -10, width: 6, height: 10, depth: 6, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'pk-t3', type: 'tree', category: 'vegetation', shape: 'regular', x: 5, y: 0, z: 15, width: 11, height: 22, depth: 11, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'pk-t4', type: 'tree', category: 'vegetation', shape: 'regular', x: 20, y: 0, z: -15, width: 8, height: 15, depth: 8, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'pk-t5', type: 'tree', category: 'vegetation', shape: 'regular', x: -5, y: 0, z: 30, width: 13, height: 25, depth: 13, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'pk-t6', type: 'tree', category: 'vegetation', shape: 'regular', x: 30, y: 0, z: 5, width: 5, height: 8, depth: 5, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'pk-t7', type: 'tree', category: 'vegetation', shape: 'regular', x: -20, y: 0, z: 20, width: 9, height: 18, depth: 9, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'pk-f1', type: 'fence', category: 'barrier', shape: 'regular', x: -40, y: 0, z: -30, width: 20, height: 3, depth: 1, material: 'wood', resistance: 1.0, density: 0.7 },
      { id: 'pk-g1', type: 'wind_generator', category: 'energy', shape: 'regular', x: 35, y: 0, z: -25, width: 6, height: 20, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'micro', scale: 0.7 },
    ],
    particleCount: 300,
  },
  {
    id: 'offshore',
    name: { ua: 'Офшор', en: 'Offshore' },
    description: { ua: 'Морська платформа з потужними вітрами та мінімальною турбулентністю.', en: 'Offshore platform with powerful winds and minimal turbulence.' },
    config: {
      windSpeed: 15, windAngle: 270, windElevation: 0,
      turbulenceIntensity: 0.08, turbulenceScale: 0.4,
      gustFrequency: 2, gustIntensity: 0.08,
      temperature: 10, humidity: 90, altitude: 0,
      surfaceRoughness: 0.0002, referenceHeight: 10,
      terrainSlopeX: 0, terrainSlopeZ: 0,
    },
    obstacles: [
      { id: 'os-g1', type: 'wind_generator', category: 'energy', shape: 'regular', x: -30, y: 0, z: -20, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.6 },
      { id: 'os-g2', type: 'wind_generator', category: 'energy', shape: 'regular', x: -30, y: 0, z: 20, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.6 },
      { id: 'os-g3', type: 'wind_generator', category: 'energy', shape: 'regular', x: 10, y: 0, z: -20, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.6 },
      { id: 'os-g4', type: 'wind_generator', category: 'energy', shape: 'regular', x: 10, y: 0, z: 20, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.6 },
      { id: 'os-t1', type: 'tower', category: 'structure', shape: 'regular', x: 35, y: 0, z: 0, width: 5, height: 30, depth: 5, material: 'steel', resistance: 1.2, density: 0.9 },
    ],
    particleCount: 500,
  },
];

const MouseTracker: React.FC<{
  onPositionChange: (pos: [number, number, number] | null) => void;
  simulationSize: { width: number; height: number; depth: number };
  slopeX: number;
  slopeZ: number;
}> = ({ onPositionChange, simulationSize }) => {
  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectPoint = useRef(new THREE.Vector3());

  useFrame(({ mouse }) => {
    plane.current.normal.set(0, 1, 0);
    plane.current.constant = 0;
    raycaster.current.setFromCamera(mouse, camera);
    const didIntersect = raycaster.current.ray.intersectPlane(plane.current, intersectPoint.current);
    if (didIntersect) {
      const x = Math.max(-simulationSize.width / 2, Math.min(simulationSize.width / 2, intersectPoint.current.x));
      const z = Math.max(-simulationSize.depth / 2, Math.min(simulationSize.depth / 2, intersectPoint.current.z));
      onPositionChange([x, 0, z]);
    }
  });
  return null;
};

export const WindSimulation3D: React.FC<WindSimulation3DProps> = ({
  windSpeed: initialWindSpeed = 8,
  onWindSpeedChange,
  lang
}) => {
  const [physicsConfig, setPhysicsConfig] = useState<WindPhysicsConfig>({
    ...DEFAULT_WIND_PHYSICS,
    windSpeed: initialWindSpeed
  });
  const [particleCount, setParticleCount] = useState(250);
  const [particleImpact, setParticleImpact] = useState(1.0);
  const [particleTrailLength, setParticleTrailLength] = useState(3.0);
  const [wobbliness, setWobbliness] = useState(1.0);
  const [particleGlow, setParticleGlow] = useState(1.0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [selectedObstacleType, setSelectedObstacleType] = useState<string>('building');
  const [selectedGeneratorSubtype, setSelectedGeneratorSubtype] = useState<GeneratorSubtype>('hawt3');
  const [collisionEnergy, setCollisionEnergy] = useState(0);
  const [showHotspots, setShowHotspots] = useState(false);
  const [showWakeZones, setShowWakeZones] = useState(false);
  const [showLocalHits, setShowLocalHits] = useState(true);
  const [showHeightRuler, setShowHeightRuler] = useState(false);
  const [showWindProfile, setShowWindProfile] = useState(false);
  const [showPressureMap, setShowPressureMap] = useState(false);
  const [showEnergyDensity, setShowEnergyDensity] = useState(false);
  const [showTurbulenceField, setShowTurbulenceField] = useState(false);
  const [showWindShear, setShowWindShear] = useState(false);
  const [showWakeMap, setShowWakeMap] = useState(false);
  const [showCapacityFactor, setShowCapacityFactor] = useState(false);
  const [showBetzOverlay, setShowBetzOverlay] = useState(false);
  const [ghostPosition, setGhostPosition] = useState<[number, number, number] | null>(null);
  const [obstacleEnergies, setObstacleEnergies] = useState<Map<string, number>>(new Map());
  const [collisionEffects, setCollisionEffects] = useState<Array<{
    id: string; position: [number, number, number]; intensity: number; deflection?: [number, number, number];
  }>>([]);
  const [showHint, setShowHint] = useState(false);
  const [currentGhostRotation, setCurrentGhostRotation] = useState(0);
  const [currentGhostScale, setCurrentGhostScale] = useState(1);
  const lastPlacedIdRef = useRef<string | null>(null);

  // Interaction mode: place or select
  const [interactionMode, setInteractionMode] = useState<'place' | 'select'>('place');
  const [selectedObstacleIndex, setSelectedObstacleIndex] = useState<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; z: number } | null>(null);
  
  // Scenario panel
  const [showScenarios, setShowScenarios] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  useEffect(() => {
    setPhysicsConfig(prev => ({ ...prev, windSpeed: initialWindSpeed }));
  }, [initialWindSpeed]);

  const handleConfigChange = (newConfig: WindPhysicsConfig) => {
    setPhysicsConfig(newConfig);
    onWindSpeedChange?.(newConfig.windSpeed);
  };

  const simulationSize = { width: 100, height: 50, depth: 100 };

  const generatorPower = useMemo(() => {
    return obstacles
      .filter(o => o.type === 'wind_generator')
      .reduce((sum, o) => {
        return sum + calculateGeneratorPower(
          physicsConfig.airDensity, o.width * 1.8, physicsConfig.windSpeed,
          o.height + o.y, physicsConfig.referenceHeight, physicsConfig.surfaceRoughness,
          o.generatorSubtype || 'hawt3'
        );
      }, 0);
  }, [obstacles, physicsConfig]);

  // Keyboard controls — Y rotation, scale, shift
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toLowerCase();
      
      const targetId = interactionMode === 'select' && selectedObstacleIndex !== null
        ? obstacles[selectedObstacleIndex]?.id
        : lastPlacedIdRef.current;

      const modifyObstacle = (fn: (obs: Obstacle) => Obstacle) => {
        if (targetId) {
          setObstacles(prev => prev.map(obs => obs.id === targetId ? fn(obs) : obs));
        }
      };

      const modifyGhostOrObstacle = (
        obsFn: (obs: Obstacle) => Obstacle,
        ghostFn: () => void
      ) => {
        if (targetId && obstacles.some(o => o.id === targetId)) {
          modifyObstacle(obsFn);
        } else if (interactionMode === 'place') {
          ghostFn();
        }
      };

      switch (key) {
        case 'arrowleft':
          e.preventDefault();
          modifyGhostOrObstacle(
            obs => ({ ...obs, rotation: ((obs.rotation || 0) - 15) % 360 }),
            () => setCurrentGhostRotation(prev => (prev - 15) % 360)
          );
          playRotateSound();
          break;
        case 'arrowright':
          e.preventDefault();
          modifyGhostOrObstacle(
            obs => ({ ...obs, rotation: ((obs.rotation || 0) + 15) % 360 }),
            () => setCurrentGhostRotation(prev => (prev + 15) % 360)
          );
          playRotateSound();
          break;
        case 'q':
          e.preventDefault();
          modifyGhostOrObstacle(
            obs => ({ ...obs, scale: Math.max(0.3, (obs.scale || 1) - 0.1) }),
            () => setCurrentGhostScale(prev => Math.max(0.3, prev - 0.1))
          );
          playScaleSound();
          break;
        case 'e':
          e.preventDefault();
          modifyGhostOrObstacle(
            obs => ({ ...obs, scale: Math.min(3.0, (obs.scale || 1) + 0.1) }),
            () => setCurrentGhostScale(prev => Math.min(3.0, prev + 0.1))
          );
          playScaleSound();
          break;
        // A/D: move along X (works in both modes)
        case 'a':
          e.preventDefault();
          if (interactionMode === 'select' && selectedObstacleIndex !== null) {
            modifyObstacle(obs => ({ ...obs, x: obs.x - 2 }));
          } else if (interactionMode === 'place' && lastPlacedIdRef.current) {
            modifyObstacle(obs => ({ ...obs, x: obs.x - 2 }));
          }
          break;
        case 'd':
          e.preventDefault();
          if (interactionMode === 'select' && selectedObstacleIndex !== null) {
            modifyObstacle(obs => ({ ...obs, x: obs.x + 2 }));
          } else if (interactionMode === 'place' && lastPlacedIdRef.current) {
            modifyObstacle(obs => ({ ...obs, x: obs.x + 2 }));
          }
          break;
        // Z/C: move along Z (works in both modes)
        case 'z':
          e.preventDefault();
          if (interactionMode === 'select' && selectedObstacleIndex !== null) {
            modifyObstacle(obs => ({ ...obs, z: obs.z - 2 }));
          } else if (interactionMode === 'place' && lastPlacedIdRef.current) {
            modifyObstacle(obs => ({ ...obs, z: obs.z - 2 }));
          }
          break;
        case 'c':
          e.preventDefault();
          if (interactionMode === 'select' && selectedObstacleIndex !== null) {
            modifyObstacle(obs => ({ ...obs, z: obs.z + 2 }));
          } else if (interactionMode === 'place' && lastPlacedIdRef.current) {
            modifyObstacle(obs => ({ ...obs, z: obs.z + 2 }));
          }
          break;
        case 'delete':
        case 'backspace':
          if (interactionMode === 'select' && selectedObstacleIndex !== null) {
            e.preventDefault();
            setObstacles(prev => prev.filter((_, i) => i !== selectedObstacleIndex));
            setSelectedObstacleIndex(null);
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [obstacles, interactionMode, selectedObstacleIndex]);

  const addObstacle = useCallback((x: number, y: number, z: number) => {
    const category = Object.entries(OBSTACLE_CATEGORIES).find(([_, cat]) => 
      cat.types.includes(selectedObstacleType as ObstacleType)
    );
    if (!category) return;

    const [categoryKey, categoryData] = category;
    const obstacleId = `obstacle-${Date.now()}`;
    
    let width = 10, height = 15, depth = 10;
    switch (selectedObstacleType) {
      case 'skyscraper': width = 15; height = 45; break;
      case 'tower': width = 5; height = 35; depth = 5; break;
      case 'tree': height = 20; break;
      case 'fence': height = 3; depth = 1; break;
      case 'wall': height = 8; depth = 3; break;
      case 'house': height = 12; break;
      case 'wind_generator': width = 6; height = 30; depth = 6; break;
    }

    const newObstacle: Obstacle = {
      id: obstacleId,
      type: selectedObstacleType as ObstacleType,
      category: categoryKey as any,
      shape: 'regular',
      x: x - width / 2, y: 0, z: z - depth / 2,
      width, height, depth,
      density: categoryData.defaultProperties.density,
      material: categoryData.defaultProperties.material,
      resistance: categoryData.defaultProperties.resistance,
      rotation: currentGhostRotation,
      scale: currentGhostScale,
      ...(selectedObstacleType === 'wind_generator' ? { generatorSubtype: selectedGeneratorSubtype } : {})
    };
    
    setObstacles(prev => [...prev, newObstacle]);
    lastPlacedIdRef.current = obstacleId;
    playPlaceSound();
    
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  }, [selectedObstacleType, selectedGeneratorSubtype, currentGhostRotation, currentGhostScale]);

  const selectObstacleAt = useCallback((clickPos: [number, number, number]) => {
    let bestIdx = -1;
    let bestDist = Infinity;
    obstacles.forEach((obs, idx) => {
      const cx = obs.x + obs.width / 2;
      const cz = obs.z + obs.depth / 2;
      const dist = Math.sqrt((clickPos[0] - cx) ** 2 + (clickPos[2] - cz) ** 2);
      const maxReach = Math.max(obs.width, obs.depth) * (obs.scale || 1);
      if (dist < maxReach && dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    setSelectedObstacleIndex(bestIdx >= 0 ? bestIdx : null);
  }, [obstacles]);

  const clearObstacles = () => {
    setObstacles([]);
    setCollisionEnergy(0);
    setObstacleEnergies(new Map());
    lastPlacedIdRef.current = null;
    setSelectedObstacleIndex(null);
    setActiveScenario(null);
    playClearSound();
  };

  const applyScenario = useCallback((preset: ScenarioPreset) => {
    setPhysicsConfig(prev => ({ ...prev, ...preset.config }));
    setObstacles(preset.obstacles.map(o => ({ ...o })));
    setParticleCount(preset.particleCount);
    setActiveScenario(preset.id);
    setSelectedObstacleIndex(null);
    setCollisionEnergy(0);
    setObstacleEnergies(new Map());
    onWindSpeedChange?.(preset.config.windSpeed || 8);
  }, [onWindSpeedChange]);

  const handleCollisionEvent = useCallback((event: { id: string; position: [number, number, number]; intensity: number; deflection?: [number, number, number] }) => {
    setCollisionEffects(prev => {
      const next = [...prev, event];
      return next.length > 20 ? next.slice(-20) : next;
    });
    if ((window as any).__localHitAdd) {
      const speed = event.intensity;
      const energy = 0.5 * 0.015 * speed * speed * physicsConfig.airDensity;
      (window as any).__localHitAdd(event.position, energy);
    }
  }, [physicsConfig.airDensity]);

  const handleRemoveCollision = useCallback((id: string) => {
    setCollisionEffects(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleObstacleEnergyUpdate = useCallback((energies: Map<string, number>) => {
    setObstacleEnergies(energies);
  }, []);

  const terrainRotation: [number, number, number] = [
    (physicsConfig.terrainSlopeZ * Math.PI) / 180,
    0,
    -(physicsConfig.terrainSlopeX * Math.PI) / 180
  ];

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.altKey) return;
    if (interactionMode === 'select') {
      if (ghostPosition) {
        selectObstacleAt(ghostPosition);
        dragStartRef.current = { x: ghostPosition[0], z: ghostPosition[2] };
        isDraggingRef.current = false;
      }
    } else {
      if (ghostPosition) {
        addObstacle(ghostPosition[0], 0, ghostPosition[2]);
      }
    }
  }, [interactionMode, ghostPosition, addObstacle, selectObstacleAt]);

  const handleCanvasPointerMove = useCallback(() => {
    if (interactionMode === 'select' && dragStartRef.current && selectedObstacleIndex !== null && ghostPosition) {
      isDraggingRef.current = true;
      setObstacles(prev => prev.map((obs, i) => {
        if (i !== selectedObstacleIndex) return obs;
        return { ...obs, x: ghostPosition[0] - obs.width / 2, z: ghostPosition[2] - obs.depth / 2 };
      }));
    }
  }, [interactionMode, selectedObstacleIndex, ghostPosition]);

  const handleCanvasPointerUp = useCallback(() => {
    dragStartRef.current = null;
    isDraggingRef.current = false;
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Mode toggle + Scenario button — positioned right of measurement panel */}
      <div className="absolute top-3 left-[195px] z-20 flex gap-1" style={{ pointerEvents: 'auto' }}>
        <button
          onClick={() => { setInteractionMode('place'); setSelectedObstacleIndex(null); }}
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-mono border transition-all ${
            interactionMode === 'place'
              ? 'bg-primary/25 border-primary/60 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]'
              : 'bg-background/90 border-primary/20 text-muted-foreground hover:border-primary/40'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          {t('placeMode', lang)}
        </button>
        <button
          onClick={() => setInteractionMode('select')}
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-mono border transition-all ${
            interactionMode === 'select'
              ? 'bg-primary/25 border-primary/60 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]'
              : 'bg-background/90 border-primary/20 text-muted-foreground hover:border-primary/40'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
          {t('selectMode', lang)}
        </button>
        <button
          onClick={() => setShowScenarios(!showScenarios)}
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-mono border transition-all ${
            showScenarios
              ? 'bg-cyan-500/25 border-cyan-500/60 text-cyan-400 shadow-[0_0_10px_rgba(0,200,255,0.3)]'
              : 'bg-background/90 border-primary/20 text-muted-foreground hover:border-primary/40'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          {t('scenarios', lang)}
        </button>
      </div>

      {/* Analysis checkboxes — 9 items in 3 rows, styled */}
      <div className="absolute top-12 left-[195px] z-20 bg-background/80 backdrop-blur-sm rounded-lg border border-primary/30 p-2 shadow-[0_0_12px_rgba(57,255,20,0.1)]" style={{ pointerEvents: 'auto' }}>
        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
          {[
            { key: 'ruler', checked: showHeightRuler, set: setShowHeightRuler, icon: '📏', label: t('heightRuler', lang), color: 'border-primary/50', info: t('infoHeightRuler', lang) },
            { key: 'vprofile', checked: showWindProfile, set: setShowWindProfile, icon: '🌬️', label: t('windProfile', lang), color: 'border-cyan-500/50', info: t('infoWindProfile', lang) },
            { key: 'pressure', checked: showPressureMap, set: setShowPressureMap, icon: '🔴', label: t('pressureZones', lang), color: 'border-orange-500/50', info: t('infoPressureZones', lang) },
            { key: 'energy', checked: showEnergyDensity, set: setShowEnergyDensity, icon: '⚡', label: t('energyDensity', lang), color: 'border-yellow-500/50', info: t('infoEnergyDensity', lang) },
            { key: 'turbulence', checked: showTurbulenceField, set: setShowTurbulenceField, icon: '🌀', label: t('turbulenceField', lang), color: 'border-purple-500/50', info: t('infoTurbulenceField', lang) },
            { key: 'shear', checked: showWindShear, set: setShowWindShear, icon: '📊', label: t('windShearLayer', lang), color: 'border-emerald-500/50', info: t('infoWindShear', lang) },
            { key: 'wake', checked: showWakeMap, set: setShowWakeMap, icon: '💨', label: t('wakeMap', lang), color: 'border-sky-500/50', info: t('infoWakeMap', lang) },
            { key: 'capacity', checked: showCapacityFactor, set: setShowCapacityFactor, icon: '📈', label: t('capacityFactor', lang), color: 'border-lime-500/50', info: t('infoCapacityFactor', lang) },
            { key: 'betz', checked: showBetzOverlay, set: setShowBetzOverlay, icon: '🎯', label: t('betzOverlay', lang), color: 'border-rose-500/50', info: t('infoBetzOverlay', lang) },
          ].map(item => (
            <label key={item.key} className={`flex items-center gap-1.5 cursor-pointer group px-1.5 py-1 rounded transition-all hover:bg-primary/10 ${item.checked ? 'bg-primary/15 shadow-[0_0_6px_rgba(57,255,20,0.15)]' : ''}`}>
              <input type="checkbox" checked={item.checked} onChange={(e) => item.set(e.target.checked)}
                className="hidden" />
              <div className={`w-3 h-3 rounded border-2 ${item.color} flex items-center justify-center transition-all ${item.checked ? 'bg-primary/40 border-primary shadow-[0_0_4px_rgba(57,255,20,0.5)]' : 'bg-background/40'}`}>
                {item.checked && <span className="text-[6px] text-primary font-bold">✓</span>}
              </div>
              <span className="text-[8px]">{item.icon}</span>
              <span className={`text-[9px] font-mono transition-colors ${item.checked ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>{item.label}</span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[8px] text-muted-foreground/50 hover:text-primary cursor-help transition-colors">ⓘ</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[240px] bg-[#0d1117] border-primary/40 text-[10px] z-50">
                    <p>{item.info}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </label>
          ))}
        </div>
      </div>

      {/* Scenario picker dropdown with custom scrollbar */}
      {showScenarios && (
        <div className="absolute top-12 left-[195px] z-30 w-72 bg-background/95 backdrop-blur-md border border-cyan-500/40 rounded-lg shadow-[0_0_25px_rgba(0,200,255,0.2)] overflow-hidden" style={{ pointerEvents: 'auto' }}>
          <div className="px-3 py-2 border-b border-cyan-500/20 flex items-center gap-2">
            <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{t('scenarios', lang)}</span>
          </div>
          <div className="max-h-80 overflow-y-auto scenario-scrollbar">
            {SCENARIO_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => { applyScenario(preset); setShowScenarios(false); }}
                className={`w-full text-left px-3 py-2.5 border-b border-primary/10 hover:bg-primary/10 transition-colors ${
                  activeScenario === preset.id ? 'bg-primary/15 border-l-2 border-l-primary' : ''
                }`}
              >
                <div className="text-xs font-semibold text-foreground">{preset.name[lang]}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{preset.description[lang]}</div>
                <div className="flex gap-2 mt-1 text-[8px] font-mono text-primary/60">
                  <span>💨 {preset.config.windSpeed} m/s</span>
                  <span>🌡 {preset.config.temperature}°C</span>
                  <span>📐 z₀={preset.config.surfaceRoughness}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <Canvas
        camera={{ position: [70, 45, 70], fov: 50 }}
        className="!absolute inset-0"
        style={{ pointerEvents: 'auto' }}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <directionalLight position={[30, 40, 20]} intensity={0.9} color="#ffffff" />
          <pointLight position={[-30, 25, -30]} intensity={0.5} color="#39ff14" />
          <pointLight position={[30, 15, 30]} intensity={0.4} color="#00ffff" />
          <hemisphereLight args={['#87CEEB', '#363636', 0.3]} />

          <MouseTracker onPositionChange={setGhostPosition} simulationSize={simulationSize} slopeX={physicsConfig.terrainSlopeX} slopeZ={physicsConfig.terrainSlopeZ} />

          {/* Grid tilts with terrain */}
          <group rotation={terrainRotation}>
            <Grid 
              args={[simulationSize.width, simulationSize.depth]}
              cellSize={5} cellThickness={0.5} cellColor="#1a4a3a"
              sectionSize={20} sectionThickness={1} sectionColor="#39ff14"
              fadeDistance={150} fadeStrength={1} followCamera={false} infiniteGrid={false}
            />
          </group>

          {/* Height ruler */}
          {showHeightRuler && (
            <>
              <HeightRuler maxHeight={simulationSize.height} config={physicsConfig} />
              <HeightRulerLabels maxHeight={simulationSize.height} config={physicsConfig} />
            </>
          )}

          {/* Wind profile visualization */}
          {showWindProfile && (
            <group position={[-48, 0, -48]}>
              {[5, 10, 20, 30, 40, 50].map(h => {
                const speed = calculateWindShear(physicsConfig.windSpeed, physicsConfig.referenceHeight, h, physicsConfig.surfaceRoughness);
                const angleRad = (physicsConfig.windAngle * Math.PI) / 180;
                const arrowLen = speed * 0.5;
                return (
                  <group key={h} position={[0, h, 0]}>
                    <mesh position={[Math.cos(angleRad) * arrowLen / 2, 0, Math.sin(angleRad) * arrowLen / 2]} 
                      rotation={[0, -angleRad + Math.PI / 2, Math.PI / 2]}>
                      <cylinderGeometry args={[0.08, 0.08, arrowLen, 4]} />
                      <meshBasicMaterial color="#00aaff" transparent opacity={0.5} />
                    </mesh>
                    <mesh position={[Math.cos(angleRad) * arrowLen, 0, Math.sin(angleRad) * arrowLen]} 
                      rotation={[0, -angleRad + Math.PI / 2, 0]}>
                      <coneGeometry args={[0.25, 0.6, 4]} />
                      <meshBasicMaterial color="#00aaff" transparent opacity={0.6} />
                    </mesh>
                  </group>
                );
              })}
            </group>
          )}

          {/* Pressure zones visualization */}
          {showPressureMap && obstacles.map((obs, i) => {
            if (obs.type === 'wind_generator') return null;
            const cx = obs.x + obs.width / 2;
            const cz = obs.z + obs.depth / 2;
            const angleRad = (physicsConfig.windAngle * Math.PI) / 180;
            const highPressureX = cx - Math.cos(angleRad) * obs.width;
            const highPressureZ = cz - Math.sin(angleRad) * obs.depth;
            const lowPressureX = cx + Math.cos(angleRad) * obs.width * 1.5;
            const lowPressureZ = cz + Math.sin(angleRad) * obs.depth * 1.5;
            const pressureIntensity = Math.min(physicsConfig.windSpeed / 15, 1);
            return (
              <group key={`pressure-${i}`}>
                {/* High pressure (windward) — red with label */}
                <mesh position={[highPressureX, obs.height * 0.5, highPressureZ]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[obs.width * 0.5 * (0.5 + pressureIntensity * 0.5), 20]} />
                  <meshBasicMaterial color="#ff4444" transparent opacity={0.15 + pressureIntensity * 0.1} side={THREE.DoubleSide} />
                </mesh>
                <Html position={[highPressureX, obs.height * 0.7, highPressureZ]} center style={{ pointerEvents: 'none' }}>
                  <div className="text-[7px] font-mono px-1 rounded" style={{ backgroundColor: 'rgba(255,50,50,0.3)', color: '#ff6666' }}>
                    H+ {(0.5 * physicsConfig.airDensity * physicsConfig.windSpeed * physicsConfig.windSpeed).toFixed(0)} Pa
                  </div>
                </Html>
                {/* Low pressure (leeward) — blue with label */}
                <mesh position={[lowPressureX, obs.height * 0.5, lowPressureZ]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[obs.width * 0.6 * (0.5 + pressureIntensity * 0.5), 20]} />
                  <meshBasicMaterial color="#4444ff" transparent opacity={0.12 + pressureIntensity * 0.08} side={THREE.DoubleSide} />
                </mesh>
                <Html position={[lowPressureX, obs.height * 0.7, lowPressureZ]} center style={{ pointerEvents: 'none' }}>
                  <div className="text-[7px] font-mono px-1 rounded" style={{ backgroundColor: 'rgba(50,50,255,0.3)', color: '#6666ff' }}>
                    L-
                  </div>
                </Html>
              </group>
            );
          })}

          {/* Energy Density visualization — colored height bands */}
          {showEnergyDensity && (
            <group position={[48, 0, 48]}>
              {[5, 15, 25, 35, 45].map(h => {
                const windAtH = calculateWindShear(physicsConfig.windSpeed, physicsConfig.referenceHeight, h, physicsConfig.surfaceRoughness);
                const power = 0.5 * physicsConfig.airDensity * Math.pow(windAtH, 3);
                const intensity = Math.min(power / 1500, 1);
                return (
                  <group key={`ed-${h}`}>
                    <mesh position={[0, h, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                      <ringGeometry args={[1, 3, 20]} />
                      <meshBasicMaterial color={intensity > 0.5 ? '#ff8800' : '#00aaff'} transparent opacity={0.08 + intensity * 0.15} side={THREE.DoubleSide} />
                    </mesh>
                    <Html position={[4, h, 0]} center style={{ pointerEvents: 'none' }}>
                      <div className="text-[7px] font-mono px-1 rounded" style={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', color: intensity > 0.5 ? '#ffaa33' : '#44aaff',
                        border: `1px solid ${intensity > 0.5 ? 'rgba(255,136,0,0.4)' : 'rgba(0,170,255,0.4)'}`
                      }}>
                        {h}m: {power.toFixed(0)} W/m²
                      </div>
                    </Html>
                  </group>
                );
              })}
            </group>
          )}

          {/* Turbulence field visualization — spinning markers */}
          {showTurbulenceField && (
            <group>
              {[[-20, 10, -20], [0, 20, 0], [20, 10, 20], [-15, 30, 15], [15, 15, -15]].map(([px, py, pz], i) => {
                const ti = physicsConfig.turbulenceIntensity * physicsConfig.windSpeed;
                const size = 1 + ti * 0.3;
                return (
                  <group key={`turb-${i}`} position={[px, py, pz]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                      <torusGeometry args={[size, 0.1, 6, 16]} />
                      <meshBasicMaterial color="#aa44ff" transparent opacity={0.15 + ti * 0.02} side={THREE.DoubleSide} />
                    </mesh>
                    <Html position={[size + 1, 0, 0]} center style={{ pointerEvents: 'none' }}>
                      <div className="text-[6px] font-mono px-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#bb66ff' }}>
                        TI={physicsConfig.turbulenceIntensity.toFixed(2)}
                      </div>
                    </Html>
                  </group>
                );
              })}
            </group>
          )}

          {/* Wind shear layer visualization — horizontal gradient bands */}
          {showWindShear && (
            <group position={[-48, 0, 48]}>
              {[2, 10, 30, 50, 80].map((h, i, arr) => {
                const speedH = calculateWindShear(physicsConfig.windSpeed, physicsConfig.referenceHeight, h, physicsConfig.surfaceRoughness);
                const nextH = arr[i + 1] || h + 20;
                const speedNext = calculateWindShear(physicsConfig.windSpeed, physicsConfig.referenceHeight, nextH, physicsConfig.surfaceRoughness);
                const shearExp = h > 1 ? Math.log(speedH / (physicsConfig.windSpeed || 1)) / Math.log(h / physicsConfig.referenceHeight) : 0;
                return (
                  <group key={`shear-${h}`}>
                    <mesh position={[0, h, 0]}>
                      <boxGeometry args={[6, 0.15, 0.15]} />
                      <meshBasicMaterial color="#22ff88" transparent opacity={0.3 + (speedH / 20) * 0.3} />
                    </mesh>
                    <Html position={[5, h, 0]} center style={{ pointerEvents: 'none' }}>
                      <div className="text-[7px] font-mono px-1 rounded" style={{ 
                        backgroundColor: 'rgba(0,0,0,0.85)', color: '#44ffaa',
                        border: '1px solid rgba(34,255,136,0.3)'
                      }}>
                        {h}m: {speedH.toFixed(1)}m/s α≈{Math.abs(shearExp).toFixed(2)}
                      </div>
                    </Html>
                  </group>
                );
              })}
            </group>
          )}

          {/* Objects stay upright — terrain Y offset only */}
          <group>
            {interactionMode === 'place' && ghostPosition && (
              <GhostObstacle
                position={[
                  ghostPosition[0],
                  getTerrainYOffset(ghostPosition[0], ghostPosition[2], physicsConfig.terrainSlopeX, physicsConfig.terrainSlopeZ),
                  ghostPosition[2]
                ]}
                obstacleType={selectedObstacleType as ObstacleType}
                visible={true}
                generatorSubtype={selectedGeneratorSubtype}
                rotation={currentGhostRotation}
                scale={currentGhostScale}
              />
            )}

            <AdvancedParticleSystem
              config={physicsConfig} particleCount={particleCount}
              obstacles={obstacles} width={simulationSize.width}
              height={simulationSize.height} depth={simulationSize.depth}
              onCollisionEnergyUpdate={setCollisionEnergy}
              onCollisionEvent={handleCollisionEvent}
              onObstacleEnergyUpdate={handleObstacleEnergyUpdate}
              particleImpact={particleImpact}
              particleTrailLength={particleTrailLength}
            />

            <CollisionEffectsManager collisions={collisionEffects} onRemoveCollision={handleRemoveCollision} />
            
            <CollisionHotspotManager
              obstacles={obstacles} obstacleEnergies={obstacleEnergies}
              showHotspots={showHotspots} showWakeZones={showWakeZones}
              windAngle={physicsConfig.windAngle} windSpeed={physicsConfig.windSpeed}
              turbulenceIntensity={physicsConfig.turbulenceIntensity}
              surfaceRoughness={physicsConfig.surfaceRoughness}
            />

            <LocalHitManager enabled={showLocalHits} />

            {obstacles.map((obstacle, index) => {
              const offsetY = getTerrainYOffset(
                obstacle.x + obstacle.width / 2,
                obstacle.z + obstacle.depth / 2,
                physicsConfig.terrainSlopeX,
                physicsConfig.terrainSlopeZ
              );
              return obstacle.type === 'wind_generator' ? (
                <group key={obstacle.id || index} position={[0, offsetY, 0]}>
                  <WindGenerator3D
                    obstacle={obstacle} config={physicsConfig}
                    isSelected={interactionMode === 'select' && selectedObstacleIndex === index}
                  />
                </group>
              ) : (
                <group key={obstacle.id || index} position={[0, offsetY, 0]}>
                  <Obstacle3D
                    obstacle={obstacle}
                    windSpeed={physicsConfig.windSpeed}
                    windAngle={physicsConfig.windAngle}
                    isSelected={interactionMode === 'select' && selectedObstacleIndex === index}
                  />
                </group>
              );
            })}
          </group>

          <OrbitControls 
            enablePan enableZoom enableRotate
            minDistance={25} maxDistance={180} maxPolarAngle={Math.PI / 2.1}
            enableDamping dampingFactor={0.1}
            rotateSpeed={0.6}
          />
        </Suspense>
      </Canvas>

      {/* Hint badge after placing object */}
      {showHint && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{ pointerEvents: 'none' }}>
          <div className="px-3 py-1.5 rounded-full bg-background/90 border border-primary/50 text-primary text-xs font-mono shadow-[0_0_15px_rgba(57,255,20,0.3)]">
            {t('hintRotateScale', lang)}
          </div>
        </div>
      )}

      {/* Controls panel */}
      <div className="absolute top-3 right-3 w-56 z-10" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
        <AdvancedWindControls
          config={physicsConfig} onConfigChange={handleConfigChange}
          selectedObstacleType={selectedObstacleType} onObstacleTypeChange={setSelectedObstacleType}
          selectedGeneratorSubtype={selectedGeneratorSubtype} onGeneratorSubtypeChange={setSelectedGeneratorSubtype}
          onClearObstacles={clearObstacles}
          showHotspots={showHotspots} onToggleHotspots={() => setShowHotspots(!showHotspots)}
          showWakeZones={showWakeZones} onToggleWakeZones={() => setShowWakeZones(!showWakeZones)}
          showLocalHits={showLocalHits} onToggleLocalHits={() => setShowLocalHits(!showLocalHits)}
          lang={lang}
          particleCount={particleCount}
          onParticleCountChange={setParticleCount}
          particleImpact={particleImpact}
          onParticleImpactChange={setParticleImpact}
          particleTrailLength={particleTrailLength}
          onParticleTrailLengthChange={setParticleTrailLength}
        />
      </div>

      {/* Measurements */}
      <div style={{ pointerEvents: 'auto', overflow: 'visible' }}>
        <AdvancedMeasurementPanel
          config={physicsConfig} particleCount={particleCount}
          obstacles={obstacles} collisionEnergy={collisionEnergy}
          activeCollisions={obstacles.length} generatorPower={generatorPower}
          lang={lang}
        />
      </div>

      {/* Footer hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10" style={{ pointerEvents: 'none' }}>
        <p className="text-[9px] text-muted-foreground/70 text-center font-mono bg-background/60 px-3 py-1 rounded-full">
          {interactionMode === 'select' ? t('footerHintSelect', lang) : t('footerHint', lang)}
        </p>
      </div>
    </div>
  );
};
