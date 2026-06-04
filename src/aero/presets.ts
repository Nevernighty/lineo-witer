// Rotor presets — utility, small commercial, DIY/3D-printable, VAWT and reference geometries.
// All numbers are published nominal values or analytic-ideal shapes; clamp to slider ranges before applying.

import type { BladeGeometry } from './bem';
import type { RotorType } from './buildBladeGeometry';

export interface RotorPreset {
  id: string;
  nameUA: string;
  nameEN: string;
  category: 'utility' | 'small' | 'diy' | 'vawt' | 'reference';
  materialId: string;
  rotorType?: RotorType;       // defaults to 'hawt' when unset
  helicalTwistDeg?: number;    // total wrap for helical VAWT, deg
  heightOverDiameter?: number; // VAWT only: H/D, used by geometry builder
  geometry: Omit<BladeGeometry, 'airfoil'> & { airfoilId: string };
  descUA: string;
  descEN: string;
}

export const PRESETS: RotorPreset[] = [
  // ---------------- Utility HAWT ----------------
  { id: 'nrel5', nameUA: 'NREL 5-MW', nameEN: 'NREL 5-MW', category: 'utility', materialId: 'gfrp',
    geometry: { airfoilId: 'du91w250', rootRadius: 1.5, tipRadius: 63, chordRoot: 4.6, chordTip: 1.3, twistRoot: 13.3, twistTip: 0, pitch: 0, nBlades: 3, twistLaw: 'optimal' },
    descUA: 'Еталонна 5 МВт офшорна турбіна NREL.', descEN: 'NREL 5-MW reference offshore turbine.' },
  { id: 'iea15', nameUA: 'IEA 15-MW', nameEN: 'IEA 15-MW', category: 'utility', materialId: 'gfrp',
    geometry: { airfoilId: 'ffaw3241', rootRadius: 2.8, tipRadius: 120, chordRoot: 5.2, chordTip: 0.9, twistRoot: 15.5, twistTip: -1, pitch: 0, nBlades: 3, twistLaw: 'optimal' },
    descUA: 'Еталонна 15 МВт офшорна (IEA Wind Task 37).', descEN: 'IEA 15-MW reference offshore (Task 37).' },
  { id: 'v90',   nameUA: 'Vestas V90 3MW', nameEN: 'Vestas V90 3MW', category: 'utility', materialId: 'gfrp',
    geometry: { airfoilId: 'du96w180', rootRadius: 1.2, tipRadius: 45, chordRoot: 3.4, chordTip: 0.7, twistRoot: 12, twistTip: 0, pitch: 0, nBlades: 3, twistLaw: 'linear' },
    descUA: 'Серійна 3 МВт онсайт-турбіна.', descEN: 'Workhorse onshore 3 MW.' },
  { id: 'e126',  nameUA: 'Enercon E-126', nameEN: 'Enercon E-126', category: 'utility', materialId: 'gfrp',
    geometry: { airfoilId: 'risoeb118', rootRadius: 3.0, tipRadius: 63, chordRoot: 5.4, chordTip: 0.6, twistRoot: 16, twistTip: -2, pitch: 0, nBlades: 3, twistLaw: 'optimal' },
    descUA: 'Direct-drive 7.5 МВт.', descEN: 'Direct-drive 7.5 MW.' },
  { id: 'swt36', nameUA: 'Siemens SWT-3.6-107', nameEN: 'Siemens SWT-3.6-107', category: 'utility', materialId: 'gfrp',
    geometry: { airfoilId: 'du91w250', rootRadius: 1.6, tipRadius: 53.5, chordRoot: 4.0, chordTip: 0.9, twistRoot: 13, twistTip: -0.5, pitch: 0, nBlades: 3, twistLaw: 'optimal' },
    descUA: '3.6 МВт офшор/онсайт.', descEN: '3.6 MW offshore/onshore.' },
  { id: 'ge15',  nameUA: 'GE 1.5sle', nameEN: 'GE 1.5sle', category: 'utility', materialId: 'gfrp',
    geometry: { airfoilId: 'naca63415', rootRadius: 1.0, tipRadius: 38.5, chordRoot: 3.0, chordTip: 0.6, twistRoot: 11.5, twistTip: 0, pitch: 0, nBlades: 3, twistLaw: 'linear' },
    descUA: 'Найпоширеніша 1.5 МВт у США.', descEN: 'Most-deployed 1.5 MW in US fleet.' },

  // ---------------- Small commercial ----------------
  { id: 'bergey', nameUA: 'Bergey Excel 10', nameEN: 'Bergey Excel 10', category: 'small', materialId: 'gfrp',
    geometry: { airfoilId: 'naca4415', rootRadius: 0.3, tipRadius: 3.5, chordRoot: 0.42, chordTip: 0.18, twistRoot: 18, twistTip: 2, pitch: 0, nBlades: 3, twistLaw: 'schmitz' },
    descUA: '10 кВт residential, перевірений часом.', descEN: '10 kW residential, time-tested.' },
  { id: 'aeolos', nameUA: 'Aeolos H-10kW', nameEN: 'Aeolos H-10kW', category: 'small', materialId: 'gfrp',
    geometry: { airfoilId: 'naca4415', rootRadius: 0.3, tipRadius: 4.0, chordRoot: 0.45, chordTip: 0.17, twistRoot: 20, twistTip: 3, pitch: 0, nBlades: 3, twistLaw: 'schmitz' },
    descUA: '10 кВт горизонтальна.', descEN: '10 kW horizontal axis.' },
  { id: 'sd6',    nameUA: 'Sunderland SD6', nameEN: 'Sunderland SD6', category: 'small', materialId: 'wood',
    geometry: { airfoilId: 'naca4412', rootRadius: 0.25, tipRadius: 3.0, chordRoot: 0.30, chordTip: 0.10, twistRoot: 20, twistTip: 4, pitch: 0, nBlades: 3, twistLaw: 'schmitz' },
    descUA: 'Дослідницька малогабаритна.', descEN: 'Research-scale small wind.' },
  { id: 'skystream', nameUA: 'Skystream 3.7', nameEN: 'Skystream 3.7', category: 'small', materialId: 'gfrp',
    geometry: { airfoilId: 's809', rootRadius: 0.25, tipRadius: 1.85, chordRoot: 0.28, chordTip: 0.12, twistRoot: 18, twistTip: 2, pitch: 0, nBlades: 3, twistLaw: 'optimal' },
    descUA: '2.4 кВт residential з вбудованим інвертером.', descEN: '2.4 kW residential with inverter.' },

  // ---------------- DIY / 3D-printable ----------------
  { id: 'piggott24', nameUA: 'Hugh Piggott 2.4 м', nameEN: 'Hugh Piggott 2.4 m', category: 'diy', materialId: 'wood',
    geometry: { airfoilId: 'naca4415', rootRadius: 0.15, tipRadius: 1.2, chordRoot: 0.18, chordTip: 0.07, twistRoot: 22, twistTip: 4, pitch: 0, nBlades: 3, twistLaw: 'schmitz' },
    descUA: 'Класичні DIY-плани з дерева.', descEN: 'Classic carved-wood DIY plans.' },
  { id: 'piggott42', nameUA: 'Hugh Piggott 4.2 м', nameEN: 'Hugh Piggott 4.2 m', category: 'diy', materialId: 'wood',
    geometry: { airfoilId: 'naca4415', rootRadius: 0.22, tipRadius: 2.1, chordRoot: 0.28, chordTip: 0.10, twistRoot: 22, twistTip: 4, pitch: 0, nBlades: 3, twistLaw: 'schmitz' },
    descUA: 'Більший Piggott axial-flux DIY.', descEN: 'Larger Piggott axial-flux DIY.' },
  { id: 'pico12', nameUA: 'PicoTurbine 1.2 м', nameEN: 'PicoTurbine 1.2 m', category: 'diy', materialId: 'pla',
    geometry: { airfoilId: 'naca4412', rootRadius: 0.08, tipRadius: 0.6, chordRoot: 0.10, chordTip: 0.04, twistRoot: 22, twistTip: 4, pitch: 0, nBlades: 3, twistLaw: 'schmitz' },
    descUA: 'Освітня, друкована PLA.', descEN: 'Educational PLA-printed.' },
  { id: 'os16',   nameUA: 'Open-Source 1.6 м PETG', nameEN: 'Open-Source 1.6 m PETG', category: 'diy', materialId: 'petg',
    geometry: { airfoilId: 's809', rootRadius: 0.10, tipRadius: 0.8, chordRoot: 0.12, chordTip: 0.04, twistRoot: 20, twistTip: 3, pitch: 0, nBlades: 3, twistLaw: 'schmitz' },
    descUA: '3D-друкована, режеться на сегменти.', descEN: '3D-printed, sliced into segments.' },
  { id: 'pacf18', nameUA: 'PA-CF 1.8 м', nameEN: 'PA-CF 1.8 m', category: 'diy', materialId: 'pacf',
    geometry: { airfoilId: 'du96w180', rootRadius: 0.10, tipRadius: 0.9, chordRoot: 0.13, chordTip: 0.04, twistRoot: 18, twistTip: 2, pitch: 0, nBlades: 3, twistLaw: 'optimal' },
    descUA: 'Найміцніший FDM-варіант.', descEN: 'Strongest FDM variant.' },
  { id: 'diy_print5', nameUA: 'DIY 5-лопаті PLA 0.8 м', nameEN: 'DIY 5-blade PLA 0.8 m', category: 'diy', materialId: 'pla',
    geometry: { airfoilId: 'naca4412', rootRadius: 0.06, tipRadius: 0.4, chordRoot: 0.08, chordTip: 0.04, twistRoot: 18, twistTip: 3, pitch: 0, nBlades: 5, twistLaw: 'schmitz' },
    descUA: '5-лопатна низькошвидкісна, заряджає 12V.', descEN: '5-blade low-RPM, 12V charging.' },

  // ---------------- VAWT (true vertical-axis topology) ----------------
  { id: 'darrieus', nameUA: 'Darrieus H 3 м', nameEN: 'Darrieus H 3 m', category: 'vawt', materialId: 'alu',
    rotorType: 'vawt-h', heightOverDiameter: 1.0,
    geometry: { airfoilId: 'naca0012', rootRadius: 0.1, tipRadius: 1.5, chordRoot: 0.25, chordTip: 0.25, twistRoot: 0, twistTip: 0, pitch: 0, nBlades: 3, twistLaw: 'linear' },
    descUA: 'H-Дарьє; прямі симетричні лопаті, вертикальна вісь.', descEN: 'H-Darrieus; straight symmetric blades, vertical axis.' },
  { id: 'darrieus5', nameUA: 'Darrieus H 5 м (urban)', nameEN: 'Darrieus H 5 m (urban)', category: 'vawt', materialId: 'cfrp',
    rotorType: 'vawt-h', heightOverDiameter: 1.2,
    geometry: { airfoilId: 'naca0012', rootRadius: 0.15, tipRadius: 2.5, chordRoot: 0.35, chordTip: 0.35, twistRoot: 0, twistTip: 0, pitch: 2, nBlades: 3, twistLaw: 'linear' },
    descUA: 'Більший H-Darrieus з toe-in pitch для self-start.', descEN: 'Bigger H-Darrieus with toe-in pitch for self-start.' },
  { id: 'gorlov', nameUA: 'Gorlov helical 2 м', nameEN: 'Gorlov helical 2 m', category: 'vawt', materialId: 'alu',
    rotorType: 'vawt-helical', helicalTwistDeg: 60, heightOverDiameter: 1.3,
    geometry: { airfoilId: 'naca0012', rootRadius: 0.1, tipRadius: 1.0, chordRoot: 0.20, chordTip: 0.20, twistRoot: 0, twistTip: 0, pitch: 0, nBlades: 3, twistLaw: 'linear' },
    descUA: 'Спіральний VAWT; низькі пульсації крутного моменту.', descEN: 'Helical VAWT; low torque ripple.' },
  { id: 'qr5', nameUA: 'QuietRevolution QR5', nameEN: 'QuietRevolution QR5', category: 'vawt', materialId: 'cfrp',
    rotorType: 'vawt-helical', helicalTwistDeg: 120, heightOverDiameter: 1.65,
    geometry: { airfoilId: 'naca0012', rootRadius: 0.15, tipRadius: 1.55, chordRoot: 0.30, chordTip: 0.30, twistRoot: 0, twistTip: 0, pitch: 2, nBlades: 3, twistLaw: 'linear' },
    descUA: 'Комерційний 5 м S-helix; міський VAWT.', descEN: 'Commercial 5 m S-helix; urban VAWT.' },
  { id: 'eggbeater', nameUA: 'Phi Darrieus (eggbeater)', nameEN: 'Phi Darrieus (eggbeater)', category: 'vawt', materialId: 'alu',
    rotorType: 'vawt-tropo', heightOverDiameter: 1.7,
    geometry: { airfoilId: 'naca0012', rootRadius: 0.1, tipRadius: 2.0, chordRoot: 0.22, chordTip: 0.22, twistRoot: 0, twistTip: 0, pitch: 0, nBlades: 2, twistLaw: 'linear' },
    descUA: 'Класичний troposkein Φ-Дарьє; стрічкова лопать.', descEN: 'Classic troposkein Φ-Darrieus; ribbon blade.' },
  { id: 'savonius', nameUA: 'Savonius S 1 м', nameEN: 'Savonius S 1 m', category: 'vawt', materialId: 'alu',
    rotorType: 'vawt-savonius', heightOverDiameter: 2.0,
    geometry: { airfoilId: 'flat', rootRadius: 0.05, tipRadius: 0.5, chordRoot: 0.5, chordTip: 0.5, twistRoot: 0, twistTip: 0, pitch: 0, nBlades: 2, twistLaw: 'linear' },
    descUA: 'Опірний S-ротор; самостартує, низький Cp.', descEN: 'Drag-type S-rotor; self-starting, low Cp.' },
  { id: 'savonius_helix', nameUA: 'Savonius helix 1.5 м', nameEN: 'Savonius helix 1.5 m', category: 'vawt', materialId: 'alu',
    rotorType: 'vawt-savonius', heightOverDiameter: 2.4,
    geometry: { airfoilId: 'flat', rootRadius: 0.08, tipRadius: 0.75, chordRoot: 0.75, chordTip: 0.75, twistRoot: 0, twistTip: 0, pitch: 0, nBlades: 2, twistLaw: 'linear' },
    descUA: 'Витягнутий Savonius з вищим moment.', descEN: 'Tall Savonius with higher moment.' },
  { id: 'archimedes_liam', nameUA: 'Archimedes Liam F1', nameEN: 'Archimedes Liam F1', category: 'vawt', materialId: 'pacf',
    rotorType: 'vawt-archimedes', heightOverDiameter: 1.8, helicalTwistDeg: 360,
    geometry: { airfoilId: 'flat', rootRadius: 0.1, tipRadius: 0.75, chordRoot: 0.55, chordTip: 0.55, twistRoot: 0, twistTip: 0, pitch: 0, nBlades: 3, twistLaw: 'linear' },
    descUA: 'Архімедова спіраль; ультратиха міська турбіна.', descEN: 'Archimedes spiral; ultra-quiet urban turbine.' },
  { id: 'archimedes_diy', nameUA: 'Archimedes DIY 0.6 м', nameEN: 'Archimedes DIY 0.6 m', category: 'vawt', materialId: 'pla',
    rotorType: 'vawt-archimedes', heightOverDiameter: 1.6, helicalTwistDeg: 360,
    geometry: { airfoilId: 'flat', rootRadius: 0.05, tipRadius: 0.3, chordRoot: 0.25, chordTip: 0.25, twistRoot: 0, twistTip: 0, pitch: 0, nBlades: 3, twistLaw: 'linear' },
    descUA: 'DIY 3D-друкований Архімед; для балкону.', descEN: 'DIY 3D-printed Archimedes; balcony scale.' },

  // ---------------- Market innovators ----------------
  { id: 'harmony', nameUA: 'Harmony Turbines (urban)', nameEN: 'Harmony Turbines (urban)', category: 'vawt', materialId: 'cfrp',
    rotorType: 'vawt-helical', helicalTwistDeg: 180, heightOverDiameter: 1.4,
    geometry: { airfoilId: 'naca0018', rootRadius: 0.12, tipRadius: 1.1, chordRoot: 0.22, chordTip: 0.22, twistRoot: 0, twistTip: 0, pitch: 3, nBlades: 3, twistLaw: 'linear' },
    descUA: 'Запатентована безшумна VAWT для дахів.', descEN: 'Patented silent rooftop VAWT.' },
  { id: 'icewind', nameUA: 'Icewind Freya', nameEN: 'Icewind Freya', category: 'vawt', materialId: 'alu',
    rotorType: 'vawt-savonius', heightOverDiameter: 1.6,
    geometry: { airfoilId: 'flat', rootRadius: 0.05, tipRadius: 0.4, chordRoot: 0.4, chordTip: 0.4, twistRoot: 0, twistTip: 0, pitch: 0, nBlades: 3, twistLaw: 'linear' },
    descUA: 'Полярна 600 Вт; стартує з 1.8 м/с.', descEN: 'Arctic 600 W; starts at 1.8 m/s.' },
  { id: 'flowergen', nameUA: 'Flower Turbines Tulip', nameEN: 'Flower Turbines Tulip', category: 'vawt', materialId: 'gfrp',
    rotorType: 'vawt-helical', helicalTwistDeg: 90, heightOverDiameter: 2.0,
    geometry: { airfoilId: 'naca0018', rootRadius: 0.08, tipRadius: 0.6, chordRoot: 0.16, chordTip: 0.16, twistRoot: 0, twistTip: 0, pitch: 2, nBlades: 3, twistLaw: 'linear' },
    descUA: 'Кластерна VAWT-«тюльпан»; масиви.', descEN: 'Tulip-shaped VAWT designed for clustering.' },


  // ---------------- Reference / ideal ----------------
  { id: 'betz',    nameUA: 'Betz-ideal', nameEN: 'Betz-ideal', category: 'reference', materialId: 'cfrp',
    geometry: { airfoilId: 'risoeb118', rootRadius: 0.8, tipRadius: 30, chordRoot: 3.0, chordTip: 0.4, twistRoot: 14, twistTip: -1, pitch: 0, nBlades: 3, twistLaw: 'optimal' },
    descUA: 'Аналітично оптимальна (Cp→0.593).', descEN: 'Analytic optimum (Cp→0.593).' },
  { id: 'schmitz', nameUA: 'Schmitz-ideal', nameEN: 'Schmitz-ideal', category: 'reference', materialId: 'cfrp',
    geometry: { airfoilId: 'naca63415', rootRadius: 0.8, tipRadius: 25, chordRoot: 2.4, chordTip: 0.5, twistRoot: 16, twistTip: 0, pitch: 0, nBlades: 3, twistLaw: 'schmitz' },
    descUA: 'Schmitz-розподіл хорди/закрутки.', descEN: 'Schmitz chord/twist distribution.' },
];

export const SLIDER_BOUNDS = {
  tipRadius: { min: 0.3, max: 130, step: 0.1 },
  chordRoot: { min: 0.05, max: 8, step: 0.05 },
  chordTip:  { min: 0.02, max: 4, step: 0.05 },
  twistRoot: { min: -5, max: 30, step: 0.5 },
  twistTip:  { min: -10, max: 30, step: 0.5 },
  pitch:     { min: -15, max: 45, step: 0.5 },
  nBlades:   { min: 1, max: 7, step: 1 },
  rootRadius:{ min: 0.05, max: 5, step: 0.05 },
};

export function clampGeometry<T extends Record<string, any>>(g: T): T {
  const c = { ...g };
  for (const k of Object.keys(SLIDER_BOUNDS) as Array<keyof typeof SLIDER_BOUNDS>) {
    if (typeof c[k] === 'number') {
      const b = SLIDER_BOUNDS[k];
      (c as any)[k] = Math.max(b.min, Math.min(b.max, c[k] as number));
    }
  }
  return c;
}
