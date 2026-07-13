import type { CinemaScenario } from '../types';

// s03 — Wake interference (Jensen wake).
// A rotor 5 D downstream of another rotor sits in a deficit cone:
// V_w = V·[1 − (1 − √(1−Ct))·(D/(D+2kx))²],  k=0.075 (onshore), Ct≈0.8
// x/D = 5 ⇒ V_w ≈ 0.78·V. Local TI roughly doubles inside the wake and
// the trailing rotor sees a 3P (blade-pass) buffet as blades clip the wake edge.
export const scenarioWake: CinemaScenario = {
  id: 's03-wake',
  nameUA: 'Слід від сусіднього ротора',
  nameEN: 'Wake interference',
  synopsisUA: 'Модель Дженсена: у сліду швидкість падає, турбулентність подвоюється, зʼявляється 3P-буферинг.',
  synopsisEN: 'Jensen model: wake deficit cuts speed, doubles TI, and stamps a 3P buffet on the downstream rotor.',
  duration: 40,
  site: 'lowland_open',
  stage: 'wake',
  reference: 'Jensen (1983); Katic, Højstrup & Jensen (1986)',
  keyframes: [
    { t: 0, windSpeed: 9, tsr: 7, turbulence: 0.10,
      chapter: { ua: 'Взаємодія зі слідом', en: 'Wake interference' },
      camera: { pos: [0, 2, 12], look: [0, 0, -6], lerp: 0.04 },
      hud: { formula: 'V_w = V·[1 − (1−√(1−Ct))·(D/(D+2kx))²]', metrics: [
        { label: 'x/D', value: '5' },
        { label: 'k',   value: '0.075' },
        { label: 'Ct',  value: '0.8' },
      ] },
      message: { ua: 'Верхнє за потоком колесо стоїть на 5 діаметрах попереду.',
                 en: 'An upstream rotor sits 5 diameters ahead.' } },

    { t: 5, turbulence: 0.20,
      vfx: [
        { kind: 'arrow', pos: [0, 0, -8], dir: [0, 0, 6], color: '#7be7ff', ttl: 6, label: 'wake axis' },
        { kind: 'windPatch', pos: [0, -1.1, -4], size: 3.2, color: '#3366cc', ttl: 8, label: '0.85·V' },
      ],
      message: { ua: 'Слід — не циліндр, а розширюваний конус із дефіцитом швидкості.',
                 en: 'The wake is an expanding cone with a speed deficit, not a cylinder.' } },

    { t: 10, windSpeed: 7.0, turbulence: 0.30,
      vfx: [
        { kind: 'label3d', pos: [0, 1.6, -1], text: 'V_eff ≈ 0.78·V₀', color: '#66e8ff', ttl: 6 },
      ],
      hud: { metrics: [
        { label: 'V_eff', value: '7.0', unit: 'm/s' },
        { label: 'TI',    value: '30', unit: '%', warn: true },
      ] },
      message: { ua: 'На нашому роторі швидкість падає до ~78 % — потужність втрачає ~50 %.',
                 en: 'Local speed drops to ~78 % — power loses ~50 %.' } },

    { t: 15, viewMode: 'pressure',
      vfx: [
        { kind: 'highlightBlade', index: 0, ttl: 1.6 },
        { kind: 'pulse', pos: [1.8, 0, 0], radius: 0.5, color: '#ff8844', ttl: 1.2 },
      ],
      message: { ua: 'Лопать, входячи в межу сліду, різко змінює навантаження.',
                 en: 'Each blade snaps in load as it crosses the wake edge.' } },

    { t: 18,
      vfx: [
        { kind: 'highlightBlade', index: 1, ttl: 1.6 },
        { kind: 'pulse', pos: [-0.9, 1.55, 0], radius: 0.5, color: '#ff8844', ttl: 1.2 },
      ] },

    { t: 21,
      vfx: [
        { kind: 'highlightBlade', index: 2, ttl: 1.6 },
        { kind: 'pulse', pos: [-0.9, -1.55, 0], radius: 0.5, color: '#ff8844', ttl: 1.2 },
      ] },

    { t: 22, turbulence: 0.35, failureBoost: 0.18,
      hud: { formula: 'f_3P = 3·RPM/60', metrics: [
        { label: '3P',  value: '4.2', unit: 'Hz', warn: true },
        { label: 'V',   value: '7.0', unit: 'm/s' },
      ] },
      message: { ua: '3P-буферинг: три удари за оберт — швидко втомлює корінь лопаті.',
                 en: '3P buffet: three hits per revolution — root fatigue accelerates.' } },

    { t: 28, camera: { pos: [0, 14, 0.01], look: [0, 0, -4], lerp: 0.04 },
      message: { ua: 'Вигляд згори: наш ротор глибоко всередині конуса сліду.',
                 en: 'Top-down: our rotor sits deep inside the wake cone.' } },

    { t: 32, windSpeed: 6.5, turbulence: 0.50, failureBoost: 0.35,
      vfx: [
        { kind: 'arrow', pos: [1.5, 0, -2], dir: [-0.8, 0.2, 0.6], color: '#ff6644', ttl: 3, label: 'wake meander' },
        { kind: 'arrow', pos: [-1.5, 0.6, -2], dir: [0.9, -0.1, 0.5], color: '#ff6644', ttl: 3 },
      ],
      message: { ua: 'Слід «блукає» — низькочастотне бокове коливання додає навантаження.',
                 en: 'The wake meanders — low-frequency lateral swing loads the rotor.' } },

    { t: 36, camera: { pos: [8, 3, 8], look: [0, 0, 0], lerp: 0.04 },
      chapter: { ua: 'Рішення: зсув > 7D або 0.5D вбік', en: 'Fix: stagger > 7 D or 0.5 D lateral' },
      message: { ua: 'Розноси ряди на 7 D і зсувай на пів-діаметра — втрати падають до 8–12 %.',
                 en: 'Space rows > 7 D and offset by 0.5 D — losses drop to 8–12 %.' } },

    { t: 40, windSpeed: 9, tsr: 7, turbulence: 0.10, failureBoost: 0 },
  ],
};
