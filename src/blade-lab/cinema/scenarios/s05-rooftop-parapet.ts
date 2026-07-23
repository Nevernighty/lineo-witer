import type { CinemaScenario } from '../types';

// s05 — Rooftop parapet recirculation.
// Full 5-storey block, small rooftop rotor. Shows the recirculation bubble
// riding on top of the parapet and why mounting inside it destroys Cp.
export const scenarioRooftopParapet: CinemaScenario = {
  id: 's05-rooftop-parapet',
  nameUA: 'Парапет даху — рециркуляція',
  nameEN: 'Rooftop parapet recirculation',
  synopsisUA: 'Парапет 5-поверхівки формує зону рециркуляції. Ротор всередині неї — це вимкнена турбіна.',
  synopsisEN: 'The parapet of a 5-storey block creates a recirculation zone. A rotor inside it is a switched-off turbine.',
  duration: 30,
  site: 'roof',
  stage: 'rooftop_5floor',
  reference: 'Wieringa (1993); IEC 61400-2 rooftop mounting',
  keyframes: [
    { t: 0, windSpeed: 5, tsr: 4.5, turbulence: 0.15,
      chapter: { ua: 'Дах 5-поверхівки', en: '5-storey rooftop' },
      camera: { pos: [8, 4, 8], look: [0, 1.5, 0], lerp: 0.04 },
      hud: { formula: 'h_bubble ≈ 3·h_parapet',
        metrics: [{ label: 'V̄', value: '5.0', unit: 'm/s' }, { label: 'h_parapet', value: '0.8', unit: 'm' }] },
      message: { ua: 'Реальний будинок, реальний парапет. Куди поставити ротор?',
                 en: 'Real building, real parapet. Where do we mount the rotor?' } },

    { t: 5, target: 'inflow',
      vfx: [
        { kind: 'arrow', pos: [0, 0.4, -3], dir: [0, 0.6, 1.8], color: '#7be7ff', ttl: 5, label: 'incoming' },
        { kind: 'label3d', pos: [0, 1.2, -1], text: 'recirculation ↺', color: '#ff5566', ttl: 5 },
      ],
      message: { ua: 'Вітер натикається на парапет — зверху крутиться зворотний вихор.',
                 en: 'Wind hits the parapet — a counter-rotating bubble spins above it.' } },

    { t: 10, tsr: 3.5, turbulence: 0.5, failureBoost: 0.15, viewMode: 'stall',
      vfx: [{ kind: 'pulse', pos: [0, 1.2, 0], radius: 0.5, color: '#ff8844', ttl: 1.5 }],
      hud: { metrics: [
        { label: 'V @ hub', value: '2.8', unit: 'm/s', warn: true },
        { label: 'TI', value: '50', unit: '%', warn: true },
        { label: 'Cp', value: '0.12', warn: true },
      ]},
      message: { ua: 'Ротор у бульбашці бачить лише 2.8 м/с — це нижче cut-in!',
                 en: 'Rotor inside the bubble sees only 2.8 m/s — below cut-in!' } },

    { t: 15, target: 'hub',
      camera: { pos: [0, 4, 4], look: [0, 2.5, 0], lerp: 0.05 },
      vfx: [{ kind: 'arrow', pos: [0, 3, 0], dir: [0, 2, 0], color: '#33ff99', ttl: 4, label: 'raise 1.5×h' }],
      message: { ua: 'Правило: підніми втулку на ≥1.5× висоти парапета.',
                 en: 'Rule of thumb: raise the hub ≥1.5× parapet height.' } },

    { t: 20, windSpeed: 6.8, tsr: 5.5, turbulence: 0.2, failureBoost: 0.03, viewMode: 'solid',
      hud: { metrics: [
        { label: 'V @ hub', value: '6.8', unit: 'm/s' },
        { label: 'TI', value: '20', unit: '%' },
        { label: 'Cp', value: '0.38' },
      ]},
      message: { ua: 'Вийшли з бульбашки — швидкість і Cp повертаються до нормальних.',
                 en: 'Above the bubble — speed and Cp recover to normal.' } },

    { t: 25, chapter: { ua: 'Висновок', en: 'Takeaway' },
      hud: { metrics: [{ label: 'Yield gain', value: '×3.1' }, { label: 'Cost', value: '+15%' }] },
      message: { ua: 'Правильна щогла втричі підняла річну виробітку за +15% ціни.',
                 en: 'Right mast tripled annual yield for +15% cost.' } },

    { t: 30, windSpeed: 6, tsr: 5, turbulence: 0.18, failureBoost: 0 },
  ],
};
