import type { CinemaScenario } from '../types';

// s01 — Rooftop turbulence.
// Teaches: parapet-shed eddies drop mean speed and inject high-frequency gusts
// that make small rotors hunt in yaw and stall intermittently.
export const scenarioRooftop: CinemaScenario = {
  id: 's01-rooftop',
  nameUA: 'Дах багатоповерхівки',
  nameEN: 'Rooftop turbulence',
  synopsisUA: 'Парапет зриває вихори — низька середня швидкість, різкі пориви, часті часткові зриви.',
  synopsisEN: 'Parapet sheds eddies — low mean speed, sharp gusts, intermittent partial stall.',
  duration: 30,
  site: 'roof',
  reference: 'IEC 61400-2 §11.9 (small-wind rooftop turbulence)',
  keyframes: [
    { t: 0,  windSpeed: 4,  tsr: 4, turbulence: 0.05, target: 'inflow',
      message: { ua: 'Початок: спокійний потік 4 м/с, парапет попереду.',
                 en: 'Start: calm 4 m/s inflow, parapet upstream.' } },
    { t: 4,  windSpeed: 4.5, turbulence: 0.15, target: 'inflow',
      message: { ua: 'Парапет зриває дрібні вихори — з’являється зсув швидкості по висоті.',
                 en: 'Parapet begins shedding eddies — vertical shear appears.' } },
    { t: 9,  windSpeed: 6, tsr: 4.5, turbulence: 0.30, target: 'blade',
      message: { ua: 'Порив 6 м/с піднімає TSR, але корінь лопаті входить у зону зриву.',
                 en: 'A 6 m/s gust lifts TSR, but the blade root dips into stall.' } },
    { t: 14, windSpeed: 3.5, tsr: 3.5, turbulence: 0.35, target: 'blade',
      message: { ua: 'Швидкість падає — ротор інерцією тримає обʼєм обертання.',
                 en: 'Speed drops — rotor inertia carries the rpm briefly.' } },
    { t: 18, windSpeed: 8, tsr: 5, turbulence: 0.45, failureBoost: 0.25, target: 'wake',
      message: { ua: 'Різкий гст 8 м/с: слід стає нестабільним, зʼявляється 1P-вібрація.',
                 en: 'Sharp 8 m/s gust: wake destabilises, 1P vibration builds.' } },
    { t: 23, windSpeed: 5.5, tsr: 4.5, turbulence: 0.55, failureBoost: 0.5, target: 'blade',
      message: { ua: 'Перевантаження на корені — треба зменшити TSR або підняти щоглу.',
                 en: 'Root overload — reduce TSR or raise the mast.' } },
    { t: 28, windSpeed: 5,  tsr: 4, turbulence: 0.4,  failureBoost: 0.1, target: null,
      message: { ua: 'Висновок: rooftop TI ~40 % їсть 30–50 % річної виробітки.',
                 en: 'Takeaway: rooftop TI ~40 % costs 30–50 % of annual yield.' } },
    { t: 30, windSpeed: 5,  tsr: 4, turbulence: 0.4,  failureBoost: 0 },
  ],
};
