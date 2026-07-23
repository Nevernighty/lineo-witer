import type { CinemaScenario } from '../types';

// s06 — Cold-start & self-starting.
// Savonius/Darrieus at low wind: watches the turbine "catch" — torque ramps,
// TSR climbs from 0 to the design point, Cp emerges. Illustrates why some
// VAWTs need external kick-start (Darrieus) while others self-start (Savonius).
export const scenarioColdStart: CinemaScenario = {
  id: 's06-cold-start',
  nameUA: 'Холодний старт — самозапуск',
  nameEN: 'Cold start & self-starting',
  synopsisUA: 'Від нуля до робочої точки: як ротор «ловить» вітер, і чому не всі VAWT стартують самі.',
  synopsisEN: 'From zero to design point: how a rotor "catches" the wind, and why not all VAWTs self-start.',
  duration: 30,
  site: 'lowland_open',
  stage: 'wake',
  reference: 'Sheldahl & Klimas SAND80-2114; Menet Savonius (2004)',
  keyframes: [
    { t: 0, windSpeed: 3.5, tsr: 0.2, turbulence: 0.08, rotorType: 'vawt-savonius',
      chapter: { ua: 'Холодний старт', en: 'Cold start' },
      camera: { pos: [6, 2.5, 6], look: [0, 0.5, 0], lerp: 0.04 },
      hud: { formula: 'τ_start = ρ·A·R·V² · C_τ(0)',
        metrics: [{ label: 'V', value: '3.5', unit: 'm/s' }, { label: 'ω', value: '0.0', unit: 'rad/s' }] },
      message: { ua: 'Ротор нерухомий. Вітер тисне на ковш — стартовий момент.',
                 en: 'Rotor is at rest. Wind loads the bucket — starting torque appears.' } },

    { t: 4, windSpeed: 4, tsr: 0.8,
      vfx: [{ kind: 'arrow', pos: [-1, 0.5, 0], dir: [2, 0, 0], color: '#33ff99', ttl: 4, label: 'push' }],
      hud: { metrics: [{ label: 'ω', value: '0.4', unit: 'rad/s' }, { label: 'Cτ', value: '0.34' }] },
      message: { ua: 'Savonius має Cτ(0) > 0 — стартує з нуля без сторонньої допомоги.',
                 en: 'Savonius has Cτ(0) > 0 — self-starts with no assist.' } },

    { t: 9, tsr: 1.6,
      hud: { metrics: [{ label: 'TSR', value: '1.6' }, { label: 'Cp', value: '0.18' }] },
      message: { ua: 'TSR росте, аеродинамічний опір знижує подальше прискорення.',
                 en: 'TSR climbs, aero drag brakes further acceleration.' } },

    { t: 13, tsr: 2.6, windSpeed: 5, rotorType: 'vawt-tropo',
      camera: { pos: [4, 1.5, 4], look: [0, 0.8, 0], lerp: 0.06 },
      vfx: [{ kind: 'label3d', pos: [0, 2, 0], text: 'Cτ(0) ≈ 0', color: '#ff5566', ttl: 4 }],
      message: { ua: 'Перемикаю на Darrieus: при ω=0 симетричний профіль не бачить AoA.',
                 en: 'Switching to Darrieus: at ω=0 a symmetric aerofoil sees no AoA.' } },

    { t: 17, tsr: 0.3, failureBoost: 0.1, viewMode: 'stall',
      hud: { metrics: [{ label: 'Cτ(0)', value: '≈0', warn: true }, { label: 'ω', value: '0.1', unit: 'rad/s', warn: true }] },
      message: { ua: 'Darrieus застряг у «мертвій зоні» — треба зовнішній розкрут або гібрид з Savonius.',
                 en: 'Darrieus stuck in the dead band — needs external kick or a Savonius hybrid.' } },

    { t: 22, tsr: 4.5, windSpeed: 7, failureBoost: 0.02, viewMode: 'solid',
      vfx: [{ kind: 'pulse', pos: [0, 1, 0], radius: 0.6, color: '#33ff99', ttl: 1.5 }],
      hud: { metrics: [{ label: 'TSR', value: '4.5' }, { label: 'Cp', value: '0.42' }] },
      message: { ua: 'Після старту Cp виходить на робоче плато 0.4 — далі енергія тече стабільно.',
                 en: 'Once running, Cp settles on the 0.4 plateau — energy flows steadily.' } },

    { t: 27, chapter: { ua: 'Висновок', en: 'Takeaway' },
      hud: { metrics: [{ label: 'Self-start V', value: '3.0', unit: 'm/s' }, { label: 'Design TSR', value: '4.5' }] },
      message: { ua: 'Savonius стартує з 3 м/с, Darrieus — з 5 м/с або з розкруту.',
                 en: 'Savonius self-starts at 3 m/s, Darrieus at 5 m/s or with a kicker.' } },

    { t: 30, windSpeed: 6, tsr: 4, failureBoost: 0 },
  ],
};
