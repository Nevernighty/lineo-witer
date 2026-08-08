import type { CinemaScenario } from '../types';

// s02 — Ridge speed-up (Jackson–Hunt).
// A rotor placed at the crest of a low ridge sees a substantial fractional speed-up
// ΔS ≈ 2·H/L over the crest. Because power ∝ V³ that ≈ +25 % speed ⇒ ≈ +95 % power,
// but the flow tilts up-slope (angle of attack shifts) and the lee side carries a
// separation bubble that drops V by ~30 % just behind the crest.
export const scenarioRidge: CinemaScenario = {
  id: 's02-ridge',
  nameUA: 'Гірський хребет — прискорення',
  nameEN: 'Ridge speed-up',
  synopsisUA: 'Джексон–Хант: невеликий хребет розганяє потік на 25 % — питома потужність зростає майже вдвічі.',
  synopsisEN: 'Jackson–Hunt: a modest ridge accelerates flow ~25 % — specific power nearly doubles.',
  duration: 34,
  site: 'highland_ridge',
  stage: 'ridge',
  anchor: [0, 0.1, 0],
  stageRadiusR: 4.2,
  composition: { framing: 'wide', fov: 42, lookBias: [0, 0.04, 0], minDistanceR: 1.3, floorClearance: 0.2 },
  reference: 'Jackson & Hunt (1975); IEC 61400-1 complex terrain',
  steps: [
    { id: 'approach', at: 0, titleUA: 'Підхід до схилу', titleEN: 'Slope approach', bodyUA: 'Потік слідує рельєфу й стискається перед гребенем.', bodyEN: 'The flow follows the terrain and compresses before the crest.', marks: [
      { kind: 'flow', pos: [-2.8, -1.1, 0], dir: [2.3, 0.7, 0], color: '#7be7ff', speed: 1.1, label: 'V₀' },
      { kind: 'point', pos: [0, -0.95, 0], color: '#8ef7c4', label: 'crest', sub: 'maximum speed-up' },
    ] },
    { id: 'speedup', at: 4, titleUA: 'Зона прискорення', titleEN: 'Speed-up zone', bodyUA: 'Над гребенем лінії потоку зближуються, а локальна швидкість зростає.', bodyEN: 'Streamlines converge over the crest and local velocity rises.', marks: [
      { kind: 'zone', pos: [0, 0, 0], radius: 1.25, height: 0.35, color: '#33ff99', label: '+25% V' },
      { kind: 'flow', pos: [-1.4, 0.2, 0], dir: [2.8, 0.15, 0], color: '#33ff99', speed: 1.7 },
    ] },
    { id: 'tilt', at: 8, titleUA: 'Нахил потоку', titleEN: 'Flow inclination', bodyUA: 'Вертикальна компонента змінює локальний кут атаки біля кореня.', bodyEN: 'The vertical component changes local root angle of attack.', marks: [
      { kind: 'point', pos: [0.35, 0.1, 0], color: '#ffcc66', label: 'Δα ≈ +3°', sub: 'root section' },
      { kind: 'flow', pos: [-1.1, -0.15, 0], dir: [1.3, 0.5, 0], color: '#ffcc66', speed: 1.2 },
    ] },
    { id: 'lee', at: 18, titleUA: 'Підвітряний відрив', titleEN: 'Lee separation', bodyUA: 'За гребенем формується повільна рециркуляційна зона — це погане місце монтажу.', bodyEN: 'A slow recirculation region forms behind the crest — a poor mounting location.', marks: [
      { kind: 'zone', pos: [2.1, -0.65, 0], radius: 1.25, height: 0.7, color: '#ff6644', label: 'lee bubble' },
      { kind: 'flow', pos: [2.4, -0.35, 0], dir: [-1, 0.2, 0], color: '#ff8866', speed: 0.7 },
    ] },
    { id: 'sit', at: 26, titleUA: 'Правильна точка', titleEN: 'Correct siting', bodyUA: 'Втулка над гребенем отримує приріст швидкості без підвітряної турбулентності.', bodyEN: 'A hub above the crest captures speed-up without lee turbulence.', marks: [
      { kind: 'span', from: [0, -1.1, 0], to: [0, 0, 0], color: '#8ef7c4', label: 'clearance' },
    ] },
  ],
  keyframes: [
    { t: 0, windSpeed: 6, tsr: 6, turbulence: 0.10,
      chapter: { ua: 'Прискорення на хребті', en: 'Ridge speed-up' },
      camera: { pos: [8, 3, 8], look: [0, 0, 0], lerp: 0.04 },
      hud: { formula: 'ΔS ≈ 2·H/L · V₀', metrics: [
        { label: 'V₀', value: '6.0', unit: 'm/s' },
        { label: 'H/L', value: '0.12' },
      ] },
      message: { ua: 'Ротор стоїть на вершині — вітер лише починає прискорюватись.',
                 en: 'Rotor sits at crest — flow is just starting to accelerate.' } },

    { t: 4, windSpeed: 7.5, turbulence: 0.12,
      vfx: [
        { kind: 'arrow', pos: [0, 0.5, -4], dir: [0, 0, 3], color: '#7be7ff', ttl: 4, label: 'flow accelerates' },
        { kind: 'windPatch', pos: [0, -1.1, 0], size: 4, color: '#33ff99', ttl: 6, label: '+25%' },
      ],
      message: { ua: 'Ізобари стискаються — швидкість над коником росте.',
                 en: 'Isobars compress — wind speed above the crest grows.' } },

    { t: 8, viewMode: 'stall',
      vfx: [
        { kind: 'label3d', pos: [0, 1.5, 0], text: 'α_local +3°', color: '#ffcc66', ttl: 5 },
      ],
      message: { ua: 'Потік нахиляється — кут атаки біля кореня росте, зʼявляється легкий зрив.',
                 en: 'Flow tilts up — root angle of attack grows, mild stall appears.' } },

    { t: 14, windSpeed: 8.4, tsr: 6.5,
      hud: { formula: 'P/P₀ = (V/V₀)³', metrics: [
        { label: 'V', value: '8.4', unit: 'm/s' },
        { label: 'P/P₀', value: '≈ 1.9×', warn: false },
      ] },
      camera: { pos: [4, 1.5, 4], look: [0, 0, 0], lerp: 0.05 },
      message: { ua: '+40 % швидкості → +95 % потужності (кубічна залежність).',
                 en: '+40 % speed → +95 % power (cubic law).' } },

    { t: 18, turbulence: 0.28, failureBoost: 0.05,
      vfx: [
        { kind: 'windPatch', pos: [0, -1.1, 6], size: 5, color: '#ff5566', ttl: 6, label: '−30% lee' },
        { kind: 'arrow', pos: [3, 0.2, 5], dir: [-1.5, -1, -1], color: '#ff8866', ttl: 4, label: 'separation' },
      ],
      message: { ua: 'За коником — зона відриву: там ставити ротор не варто.',
                 en: 'Behind the crest — separation bubble: do not place a rotor here.' } },

    { t: 22, windSpeed: 9.2, turbulence: 0.38, failureBoost: 0.18,
      vfx: [
        { kind: 'pulse', pos: [2.2, 0.5, 0], radius: 0.4, color: '#ff9944', ttl: 1.5 },
        { kind: 'highlightBlade', index: 0, ttl: 2 },
      ],
      message: { ua: 'Гст із підвітряного боку тисне на одну лопать — 1P-вібрація.',
                 en: 'Lee-side gust loads a single blade — 1P vibration.' } },

    { t: 26, viewMode: 'solid',
      chapter: { ua: 'Розміщення важливіше за розмір', en: 'Position beats size' },
      message: { ua: 'Правильно поставлений малий ротор дасть більше за великий у долині.',
                 en: 'A well-sited small rotor beats a large one in a valley.' } },

    { t: 30, windSpeed: 7.5, turbulence: 0.16, failureBoost: 0.02,
      hud: { metrics: [
        { label: 'Yield vs plain', value: '+40', unit: '%' },
        { label: 'Wake loss', value: '−8', unit: '%' },
      ] },
      message: { ua: 'Підсумок: чистий приріст ~40 % при правильному розміщенні.',
                 en: 'Takeaway: net +40 % yield when sited correctly.' } },

    { t: 34, windSpeed: 7, tsr: 6, turbulence: 0.12, failureBoost: 0 },
  ],
};
