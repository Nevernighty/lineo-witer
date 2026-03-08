// Scenario presets — extracted from WindSimulation3D.tsx
import type { SimulationParams } from '@/simulation/types';
import type { Obstacle } from '@/components/wind-simulation/types';
import type { Lang } from '@/utils/i18n';

export interface ScenarioKnowledgeCard {
  phenomenon: Record<Lang, string>;
  approximates: Record<Lang, string>;
  limitations: Record<Lang, string>;
}

export interface ScenarioPreset {
  id: string;
  name: Record<Lang, string>;
  description: Record<Lang, string>;
  physicsNote?: Record<Lang, string>;
  knowledgeCard?: ScenarioKnowledgeCard;
  config: Partial<SimulationParams>;
  obstacles: Obstacle[];
  particleCount: number;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'open_field',
    name: { ua: 'Відкрите поле', en: 'Open Field' },
    description: { ua: 'Рівне поле з мінімальними перешкодами. Ідеальні умови для вітроенергетики.', en: 'Flat field with minimal obstacles. Ideal wind energy conditions.' },
    config: { windSpeed: 9, windAngle: 45, windElevation: 0, turbulenceIntensity: 0.15, turbulenceScale: 1.0, gustFrequency: 4, gustIntensity: 0.15, temperature: 18, humidity: 45, altitude: 100, surfaceRoughness: 0.03, referenceHeight: 10, terrainSlopeX: 0, terrainSlopeZ: 0 },
    obstacles: [
      { id: 'gen-1', type: 'wind_generator', category: 'energy', shape: 'regular', x: -5, y: 0, z: -5, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.2 },
      { id: 'gen-2', type: 'wind_generator', category: 'energy', shape: 'regular', x: 25, y: 0, z: -5, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.2 },
      { id: 'tree-1', type: 'tree', category: 'vegetation', shape: 'regular', x: -30, y: 0, z: 20, width: 10, height: 20, depth: 10, material: 'wood', resistance: 0.8, density: 0.6 },
    ],
    particleCount: 300,
  },
  {
    id: 'urban_city',
    name: { ua: 'Місто', en: 'Urban City' },
    description: { ua: 'Щільна міська забудова з висотками. Складна турбулентність та тіньові зони.', en: 'Dense urban area with high-rises. Complex turbulence and shadow zones.' },
    knowledgeCard: {
      phenomenon: { ua: 'Міський каньйонний ефект: будівлі прискорюють і перенаправляють вітер', en: 'Urban canyon effect: buildings accelerate and redirect wind' },
      approximates: { ua: 'Спрощені wake-зони за будівлями, drag-коефіцієнти по типу перешкоди', en: 'Simplified wake zones behind buildings, drag coefficients by obstacle type' },
      limitations: { ua: 'Не моделює: вихори на кутах, теплові острови, мікроклімат дворів', en: 'Does NOT model: corner vortices, heat islands, courtyard microclimates' },
    },
    config: { windSpeed: 6, windAngle: 90, windElevation: 0, turbulenceIntensity: 0.6, turbulenceScale: 2.0, gustFrequency: 10, gustIntensity: 0.35, temperature: 22, humidity: 55, altitude: 50, surfaceRoughness: 1.5, referenceHeight: 10, terrainSlopeX: 0, terrainSlopeZ: 0 },
    obstacles: [
      { id: 'sky-1', type: 'skyscraper', category: 'structure', shape: 'regular', x: -15, y: 0, z: -10, width: 15, height: 45, depth: 10, material: 'glass', resistance: 1.2, density: 0.9 },
      { id: 'bld-1', type: 'building', category: 'structure', shape: 'regular', x: 10, y: 0, z: -15, width: 10, height: 15, depth: 10, material: 'concrete', resistance: 1.2, density: 0.9 },
      { id: 'bld-2', type: 'building', category: 'structure', shape: 'regular', x: 10, y: 0, z: 10, width: 10, height: 18, depth: 10, material: 'concrete', resistance: 1.2, density: 0.9 },
      { id: 'gen-city', type: 'wind_generator', category: 'energy', shape: 'regular', x: 30, y: 0, z: -20, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'micro' },
    ],
    particleCount: 400,
  },
  {
    id: 'coastal',
    name: { ua: 'Узбережжя', en: 'Coastal' },
    description: { ua: 'Морське узбережжя з сильним стабільним вітром та мінімальною шорсткістю.', en: 'Seaside with strong steady wind and minimal surface roughness.' },
    knowledgeCard: {
      phenomenon: { ua: 'Морський бриз і низька шорсткість дають стабільний вітровий потік', en: 'Sea breeze and low roughness provide stable wind flow' },
      approximates: { ua: 'Малий зсув вітру (z₀≈0.001), зменшена турбулентність', en: 'Low wind shear (z₀≈0.001), reduced turbulence' },
      limitations: { ua: 'Не моделює: хвильовий вплив, морські тумани, прибережну конвергенцію', en: 'Does NOT model: wave impact, sea fog, coastal convergence' },
    },
    config: { windSpeed: 12, windAngle: 180, windElevation: -5, turbulenceIntensity: 0.1, turbulenceScale: 0.5, gustFrequency: 2, gustIntensity: 0.1, temperature: 14, humidity: 80, altitude: 5, surfaceRoughness: 0.001, referenceHeight: 10, terrainSlopeX: 3, terrainSlopeZ: 0 },
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
    config: { windSpeed: 10, windAngle: 0, windElevation: 5, turbulenceIntensity: 0.25, turbulenceScale: 1.5, gustFrequency: 6, gustIntensity: 0.2, temperature: 10, humidity: 60, altitude: 500, surfaceRoughness: 0.1, referenceHeight: 10, terrainSlopeX: 8, terrainSlopeZ: 4 },
    obstacles: [
      { id: 'gen-h1', type: 'wind_generator', category: 'energy', shape: 'regular', x: -10, y: 0, z: -10, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.4 },
      { id: 'gen-h2', type: 'wind_generator', category: 'energy', shape: 'regular', x: 15, y: 0, z: 10, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'darrieus' },
      { id: 'tree-h1', type: 'tree', category: 'vegetation', shape: 'regular', x: -30, y: 0, z: 15, width: 10, height: 20, depth: 10, material: 'wood', resistance: 0.8, density: 0.6 },
    ],
    particleCount: 350,
  },
  {
    id: 'wind_farm',
    name: { ua: 'Вітроферма', en: 'Wind Farm' },
    description: { ua: 'Масив вітрогенераторів з оптимальним розташуванням. Дослідження wake-ефектів.', en: 'Wind turbine array with optimal spacing. Wake effect research.' },
    config: { windSpeed: 11, windAngle: 0, windElevation: 0, turbulenceIntensity: 0.12, turbulenceScale: 0.8, gustFrequency: 3, gustIntensity: 0.12, temperature: 15, humidity: 50, altitude: 200, surfaceRoughness: 0.05, referenceHeight: 10, terrainSlopeX: 0, terrainSlopeZ: 0 },
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
    config: { windSpeed: 7, windAngle: 135, windElevation: 0, turbulenceIntensity: 0.4, turbulenceScale: 1.5, gustFrequency: 5, gustIntensity: 0.25, temperature: 16, humidity: 65, altitude: 200, surfaceRoughness: 0.5, referenceHeight: 10, terrainSlopeX: 2, terrainSlopeZ: 1 },
    obstacles: [
      { id: 'fe-t1', type: 'tree', category: 'vegetation', shape: 'regular', x: -40, y: 0, z: -20, width: 12, height: 26, depth: 12, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'fe-t2', type: 'tree', category: 'vegetation', shape: 'regular', x: -38, y: 0, z: -5, width: 8, height: 14, depth: 8, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'fe-t3', type: 'tree', category: 'vegetation', shape: 'regular', x: -42, y: 0, z: 10, width: 14, height: 28, depth: 14, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'fe-t4', type: 'tree', category: 'vegetation', shape: 'regular', x: -35, y: 0, z: 20, width: 7, height: 12, depth: 7, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'fe-g1', type: 'wind_generator', category: 'energy', shape: 'regular', x: 10, y: 0, z: 0, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.2 },
    ],
    particleCount: 350,
  },
  {
    id: 'mountain_pass',
    name: { ua: 'Гірський перевал', en: 'Mountain Pass' },
    description: { ua: 'Вузький перевал між горами. Ефект Вентурі прискорює вітер.', en: 'Narrow pass between mountains. Venturi effect accelerates wind.' },
    knowledgeCard: {
      phenomenon: { ua: 'Ефект Вентурі: звуження прискорює вітер між стінами', en: 'Venturi effect: narrowing accelerates wind between walls' },
      approximates: { ua: 'Наближене прискорення потоку через перешкоди-стіни', en: 'Approximate flow acceleration through wall obstacles' },
      limitations: { ua: 'Не моделює: 3D орографічне обтікання, стійкі вихори Кармана', en: 'Does NOT model: 3D orographic flow, persistent Kármán vortices' },
    },
    config: { windSpeed: 14, windAngle: 0, windElevation: -3, turbulenceIntensity: 0.35, turbulenceScale: 2.5, gustFrequency: 7, gustIntensity: 0.4, temperature: 5, humidity: 40, altitude: 1200, surfaceRoughness: 0.3, referenceHeight: 10, terrainSlopeX: 12, terrainSlopeZ: -5 },
    obstacles: [
      { id: 'mp-w1', type: 'wall', category: 'barrier', shape: 'regular', x: -10, y: 0, z: -30, width: 20, height: 25, depth: 5, material: 'concrete', resistance: 1.2, density: 0.9 },
      { id: 'mp-w2', type: 'wall', category: 'barrier', shape: 'regular', x: -10, y: 0, z: 25, width: 20, height: 25, depth: 5, material: 'concrete', resistance: 1.2, density: 0.9 },
      { id: 'mp-g1', type: 'wind_generator', category: 'energy', shape: 'regular', x: 20, y: 0, z: 0, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'darrieus', scale: 1.2 },
    ],
    particleCount: 300,
  },
  {
    id: 'park',
    name: { ua: 'Парк', en: 'Park' },
    description: { ua: 'Міський парк з різноманітними деревами різних розмірів.', en: 'City park with diverse trees of various sizes.' },
    config: { windSpeed: 5, windAngle: 60, windElevation: 0, turbulenceIntensity: 0.35, turbulenceScale: 1.3, gustFrequency: 4, gustIntensity: 0.15, temperature: 22, humidity: 55, altitude: 80, surfaceRoughness: 0.3, referenceHeight: 10, terrainSlopeX: 1, terrainSlopeZ: -1 },
    obstacles: [
      { id: 'pk-t1', type: 'tree', category: 'vegetation', shape: 'regular', x: -30, y: 0, z: -20, width: 14, height: 28, depth: 14, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'pk-t2', type: 'tree', category: 'vegetation', shape: 'regular', x: -15, y: 0, z: -10, width: 6, height: 10, depth: 6, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'pk-t3', type: 'tree', category: 'vegetation', shape: 'regular', x: 5, y: 0, z: 15, width: 11, height: 22, depth: 11, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'pk-t4', type: 'tree', category: 'vegetation', shape: 'regular', x: 20, y: 0, z: -15, width: 8, height: 16, depth: 8, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'pk-t5', type: 'tree', category: 'vegetation', shape: 'regular', x: -20, y: 0, z: 25, width: 5, height: 8, depth: 5, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'pk-g1', type: 'wind_generator', category: 'energy', shape: 'regular', x: 30, y: 0, z: 0, width: 6, height: 20, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'micro', scale: 0.8 },
    ],
    particleCount: 300,
  },
  {
    id: 'valley',
    name: { ua: 'Долина', en: 'Valley' },
    description: { ua: 'Катабатичний вітер стікає по схилах. Інверсія температури обмежує перемішування.', en: 'Katabatic wind drains downslope. Temperature inversion limits mixing.' },
    knowledgeCard: {
      phenomenon: { ua: 'Катабатичний вітер: холодне повітря стікає вниз під дією гравітації', en: 'Katabatic wind: cold air drains downhill by gravity at night' },
      approximates: { ua: 'Нахил рельєфу та знижена турбулентність через інверсію', en: 'Terrain slope and reduced turbulence due to inversion' },
      limitations: { ua: 'Не моделює: інверсійний шар, термічну стратифікацію', en: 'Does NOT model: inversion layer, thermal stratification' },
    },
    physicsNote: { ua: 'Катабатичний вітер: холодне повітря стікає по схилах вночі під дією гравітації. Інверсійний шар створює "кришку", обмежуючи турбулентність.', en: 'Katabatic wind: cold air drains downslope at night by gravity. Inversion layer creates a "lid" limiting turbulence.' },
    config: { windSpeed: 6, windAngle: 180, windElevation: -8, turbulenceIntensity: 0.15, turbulenceScale: 0.8, gustFrequency: 2, gustIntensity: 0.1, temperature: 2, humidity: 75, altitude: 400, surfaceRoughness: 0.2, referenceHeight: 10, terrainSlopeX: -10, terrainSlopeZ: 5 },
    obstacles: [
      { id: 'vl-w1', type: 'wall', category: 'barrier', shape: 'regular', x: -35, y: 0, z: -25, width: 15, height: 18, depth: 5, material: 'concrete', resistance: 1.2, density: 0.9 },
      { id: 'vl-w2', type: 'wall', category: 'barrier', shape: 'regular', x: -35, y: 0, z: 20, width: 15, height: 20, depth: 5, material: 'concrete', resistance: 1.2, density: 0.9 },
      { id: 'vl-t1', type: 'tree', category: 'vegetation', shape: 'regular', x: -10, y: 0, z: -15, width: 10, height: 18, depth: 10, material: 'wood', resistance: 0.8, density: 0.6 },
      { id: 'vl-g1', type: 'wind_generator', category: 'energy', shape: 'regular', x: 15, y: 0, z: 0, width: 6, height: 25, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'savonius', scale: 1.1 },
    ],
    particleCount: 350,
  },
  {
    id: 'island',
    name: { ua: 'Острів', en: 'Island' },
    description: { ua: 'Бризова циркуляція: різниця нагрівання суші та моря. Конвергенція потоків.', en: 'Sea-breeze circulation: differential land-sea heating. Flow convergence.' },
    knowledgeCard: {
      phenomenon: { ua: 'Бризова циркуляція: суша нагрівається швидше → висхідний потік → вітер з моря', en: 'Sea breeze: land heats faster → updraft → onshore wind' },
      approximates: { ua: 'Напрямок вітру та низька шорсткість морської поверхні', en: 'Wind direction and low sea surface roughness' },
      limitations: { ua: 'Не моделює: вертикальну конвекцію, зворотний нічний бриз', en: 'Does NOT model: vertical convection, reverse land breeze at night' },
    },
    physicsNote: { ua: 'Бризова циркуляція виникає через різницю теплоємності суші та моря. Вдень суша нагрівається швидше → висхідний потік → бриз з моря.', en: 'Sea breeze arises from difference in heat capacity of land vs sea. Daytime land heats faster → updraft → onshore breeze.' },
    config: { windSpeed: 8, windAngle: 270, windElevation: 3, turbulenceIntensity: 0.2, turbulenceScale: 1.2, gustFrequency: 5, gustIntensity: 0.2, temperature: 25, humidity: 85, altitude: 10, surfaceRoughness: 0.01, referenceHeight: 10, terrainSlopeX: 2, terrainSlopeZ: -2 },
    obstacles: [
      { id: 'is-g1', type: 'wind_generator', category: 'energy', shape: 'regular', x: -15, y: 0, z: 0, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.4 },
      { id: 'is-g2', type: 'wind_generator', category: 'energy', shape: 'regular', x: 20, y: 0, z: -10, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt2', scale: 1.2 },
      { id: 'is-t1', type: 'tree', category: 'vegetation', shape: 'regular', x: 5, y: 0, z: 15, width: 8, height: 12, depth: 8, material: 'wood', resistance: 0.8, density: 0.6 },
    ],
    particleCount: 400,
  },
  {
    id: 'steppe',
    name: { ua: 'Степ', en: 'Steppe' },
    description: { ua: 'Низька шорсткість, рівномірний профіль вітру. Ідеальний для промислових ВЕС.', en: 'Low roughness, uniform wind profile. Ideal for industrial wind farms.' },
    physicsNote: { ua: 'z₀ ≈ 0.01м забезпечує малий зсув вітру α ≈ 0.1. Розподіл Вейбулла з k > 2.5 — стабільна генерація.', en: 'z₀ ≈ 0.01m ensures small wind shear α ≈ 0.1. Weibull distribution with k > 2.5 — stable generation.' },
    config: { windSpeed: 10, windAngle: 315, windElevation: 0, turbulenceIntensity: 0.08, turbulenceScale: 0.5, gustFrequency: 2, gustIntensity: 0.08, temperature: 15, humidity: 35, altitude: 150, surfaceRoughness: 0.01, referenceHeight: 10, terrainSlopeX: 0, terrainSlopeZ: 0 },
    obstacles: [
      { id: 'st-g1', type: 'wind_generator', category: 'energy', shape: 'regular', x: -30, y: 0, z: -10, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.5 },
      { id: 'st-g2', type: 'wind_generator', category: 'energy', shape: 'regular', x: 0, y: 0, z: 10, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.5 },
      { id: 'st-g3', type: 'wind_generator', category: 'energy', shape: 'regular', x: 30, y: 0, z: -10, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.5 },
    ],
    particleCount: 500,
  },
  {
    id: 'mountain_ridge',
    name: { ua: 'Гірський хребет', en: 'Mountain Ridge' },
    description: { ua: 'Фен-ефект: орографічний підйом подвоює швидкість. Ротор-турбулентність.', en: 'Foehn effect: orographic lift doubles speed. Rotor turbulence.' },
    physicsNote: { ua: 'Повітря піднімається навітряним схилом, конденсується (хмари), потім сухе та тепле спускається підвітряним. Швидкість на гребені може бути 2× від базової.', en: 'Air rises windward, condenses (clouds), then descends leeward dry and warm. Ridge speed can be 2× base.' },
    config: { windSpeed: 16, windAngle: 90, windElevation: 8, turbulenceIntensity: 0.45, turbulenceScale: 3.0, gustFrequency: 12, gustIntensity: 0.5, temperature: 0, humidity: 30, altitude: 1800, surfaceRoughness: 0.5, referenceHeight: 10, terrainSlopeX: 15, terrainSlopeZ: 8 },
    obstacles: [
      { id: 'mr-g1', type: 'wind_generator', category: 'energy', shape: 'regular', x: 0, y: 0, z: 0, width: 6, height: 30, depth: 6, material: 'steel', resistance: 0.3, density: 0.5, generatorSubtype: 'hawt3', scale: 1.3 },
      { id: 'mr-tw', type: 'tower', category: 'structure', shape: 'regular', x: -25, y: 0, z: -15, width: 5, height: 35, depth: 5, material: 'steel', resistance: 1.2, density: 0.9 },
    ],
    particleCount: 350,
  },
];
