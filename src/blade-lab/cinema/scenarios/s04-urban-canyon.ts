import type { CinemaScenario } from '../types';

// s04 — Urban canyon Venturi. Two panel blocks flank the rotor.
// The gap accelerates the flow (mass conservation); teaches when a small
// rooftop rotor between buildings can OUTPERFORM the same rotor in open field.
export const scenarioUrbanCanyon: CinemaScenario = {
  id: 's04-urban-canyon',
  nameUA: 'Міський каньйон — Вентурі',
  nameEN: 'Urban canyon Venturi',
  synopsisUA: 'Дві панельні висотки формують сопло — швидкість у щілині зростає, як у трубі Вентурі.',
  synopsisEN: 'Two panel blocks form a nozzle — gap velocity rises like a Venturi tube.',
  duration: 32,
  site: 'lowland_open',
  stage: 'urban_canyon',
  anchor: [0, 0, 0],
  stageRadiusR: 4.8,
  composition: { framing: 'wide', fov: 44, lookBias: [0, 0.08, 0], minDistanceR: 1.35, floorClearance: 0.22 },
  reference: 'Continuity: V_gap = V∞ · (A_open / A_gap)',
  steps: [
    { id: 'opening', at: 0, titleUA: 'Вхід у каньйон', titleEN: 'Canyon inlet', bodyUA: 'Фасади звужують доступний переріз потоку.', bodyEN: 'The façades reduce the available flow area.', marks: [
      { kind: 'flow', pos: [0, 0.3, -2.8], dir: [0, 0, 2.2], color: '#7be7ff', speed: 1 },
      { kind: 'span', from: [-1.3, 0, 0], to: [1.3, 0, 0], color: '#c9b7ff', label: 'A_gap' },
    ] },
    { id: 'venturi', at: 4, titleUA: 'Ефект Вентурі', titleEN: 'Venturi acceleration', bodyUA: 'У щілині той самий масовий потік проходить через меншу площу, тому V зростає.', bodyEN: 'The same mass flow crosses a smaller area in the gap, so velocity rises.', marks: [
      { kind: 'zone', pos: [0, 0, 0], radius: 1.15, height: 1.8, color: '#33ff99', label: 'V_gap' },
      { kind: 'flow', pos: [0, 0.3, -1.5], dir: [0, 0, 3], color: '#33ff99', speed: 1.8 },
    ] },
    { id: 'shear', at: 13, titleUA: 'Зсувні шари', titleEN: 'Shear layers', bodyUA: 'Гострі краї фасадів скидають турбулентні шари на краї диска.', bodyEN: 'Sharp façade edges shed turbulent layers across the rotor rim.', marks: [
      { kind: 'zone', pos: [-1.3, 0, 0], radius: 0.45, height: 2.2, color: '#ffaa44', label: 'shear' },
      { kind: 'zone', pos: [1.3, 0, 0], radius: 0.45, height: 2.2, color: '#ffaa44' },
    ] },
    { id: 'fatigue', at: 18, titleUA: 'Циклічна втома', titleEN: 'Cyclic fatigue', bodyUA: 'Кожна лопать двічі за оберт перетинає зсув і навантажує корінь.', bodyEN: 'Every blade crosses the shear twice per turn, loading its root.', marks: [
      { kind: 'point', pos: [0.35, 0.1, 0], color: '#ff5533', label: 'root stress', sub: 'cyclic ΔM' },
      { kind: 'zone', pos: [0, 0, 0], radius: 0.5, height: 0.35, color: '#ff5533' },
    ] },
    { id: 'height', at: 24, titleUA: 'Вийти над зсувом', titleEN: 'Clear the shear', bodyUA: 'Вища щогла залишає прискорення, але відводить диск від найгіршої турбулентності.', bodyEN: 'A taller mast keeps useful speed-up while lifting the disc clear of peak turbulence.', marks: [
      { kind: 'span', from: [0, -1.1, 0], to: [0, 1.8, 0], color: '#33ff99', label: '1.5H' },
    ] },
  ],
  keyframes: [
    { t: 0, windSpeed: 5, tsr: 5, turbulence: 0.10, target: 'inflow',
      chapter: { ua: 'Каньйон між будинками', en: 'The canyon between the blocks' },
      camera: { pos: [10, 3, 10], look: [0, 1, 0], lerp: 0.04 },
      hud: { formula: 'V_gap = V∞ · A_open / A_gap',
        metrics: [{ label: 'V∞', value: '5.0', unit: 'm/s' }, { label: 'A_open/A_gap', value: '2.4' }] },
      message: { ua: 'Дві панельні висотки формують вертикальне сопло.',
                 en: 'Two panel blocks form a vertical nozzle.' } },

    { t: 4, windSpeed: 6.5, turbulence: 0.14, target: 'inflow',
      vfx: [
        { kind: 'arrow', pos: [0, 1.2, -5], dir: [0, 0, 3], color: '#7be7ff', ttl: 5, label: 'inflow' },
        { kind: 'windPatch', pos: [0, -0.5, 0], size: 4, color: '#33ff99', ttl: 6, label: 'compression' },
      ],
      message: { ua: 'Потік стискається — за законом збереження маси швидкість росте.',
                 en: 'Flow compresses — mass conservation lifts the velocity.' } },

    { t: 8, windSpeed: 8.8, tsr: 6, turbulence: 0.18,
      hud: { formula: 'P/P₀ = (V/V₀)³',
        metrics: [{ label: 'V_gap', value: '8.8', unit: 'm/s' }, { label: 'P/P₀', value: '≈ 5.4×' }] },
      camera: { pos: [3, 1.5, 6], look: [0, 1, 0], lerp: 0.05 },
      message: { ua: '+75% швидкості = +440% потужності. Але це ще не вся історія.',
                 en: '+75% speed = +440% power. But that is not the whole story.' } },

    { t: 13, turbulence: 0.35, failureBoost: 0.10, target: 'blade',
      vfx: [
        { kind: 'pulse', pos: [-2, 1, 0], radius: 0.4, color: '#ffaa44', ttl: 1.5 },
        { kind: 'pulse', pos: [ 2, 1, 0], radius: 0.4, color: '#ffaa44', ttl: 1.5 },
        { kind: 'label3d', pos: [0, 2.4, 0], text: 'shear layers', color: '#ffcc66', ttl: 4 },
      ],
      message: { ua: 'Стіни зривають зсувні шари — TI підскакує до 30–40%.',
                 en: 'Walls shed shear layers — TI jumps to 30–40%.' } },

    { t: 18, windSpeed: 9.5, tsr: 6.5, turbulence: 0.45, failureBoost: 0.20,
      viewMode: 'stress',
      vfx: [
        { kind: 'highlightBlade', index: 0, ttl: 2 },
        { kind: 'shockwave', pos: [0, 1, 0], radius: 0.5, color: '#ff5533', ttl: 1.5 },
      ],
      hud: { metrics: [
        { label: 'TI', value: '45', unit: '%', warn: true },
        { label: 'Cp', value: '0.28', warn: true },
        { label: 'Fatigue', value: '×3.1', warn: true },
      ]},
      message: { ua: '3P-збурення від будинків жорстко навантажує корені лопатей.',
                 en: '3P disturbances from the buildings hammer the blade roots.' } },

    { t: 24, viewMode: 'solid',
      chapter: { ua: 'Правильна висота — все', en: 'Height is everything' },
      vfx: [{ kind: 'arrow', pos: [0, 3, 0], dir: [0, 1.5, 0], color: '#33ff99', ttl: 4, label: 'lift the mast' }],
      message: { ua: 'Підняти щоглу на 1.5 висоти будинку — TI падає до 15%, Cp повертається.',
                 en: 'Raise the mast to 1.5× building height — TI drops to 15%, Cp recovers.' } },

    { t: 28, windSpeed: 8.2, tsr: 6, turbulence: 0.18, failureBoost: 0.02,
      hud: { metrics: [
        { label: 'Net yield vs open', value: '+65', unit: '%' },
        { label: 'Bearing life', value: '−20', unit: '%' },
      ]},
      message: { ua: 'Підсумок: +65% енергії, ціна — ресурс підшипників скорочується на 20%.',
                 en: 'Takeaway: +65% energy, cost — bearing life shortens by 20%.' } },

    { t: 32, windSpeed: 7, tsr: 5.5, turbulence: 0.14, failureBoost: 0 },
  ],
};
