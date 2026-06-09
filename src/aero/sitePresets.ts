// Site/scenario macro presets — bind wind regime, turbulence and visual dressing
// so the lab matches real residential micro-wind contexts.

export interface SiteScenario {
  id: string;
  nameUA: string;
  nameEN: string;
  /** Mean freestream wind speed (m/s) */
  windSpeed: number;
  /** Turbulence intensity 0..1 — drives blade flex jitter & streamline jitter */
  turbulence: number;
  /** Gust factor multiplier (peak/mean) — used by failure pulses */
  gustFactor: number;
  /** Wind shear exponent α (power-law) for visual cues only */
  shearAlpha: number;
  /** Sky / ambient tint, used by the viewer background gradient */
  tint: string;
  /** Recommended rotor families */
  recommend: Array<'hawt' | 'vawt'>;
  /** Short description for the picker card */
  noteUA: string;
  noteEN: string;
}

export const SITE_SCENARIOS: SiteScenario[] = [
  { id: 'roof_pitched',   nameUA: 'Скатний дах',         nameEN: 'Pitched roof',
    windSpeed: 5.5, turbulence: 0.32, gustFactor: 1.7, shearAlpha: 0.20,
    tint: '#0a1622', recommend: ['vawt'],
    noteUA: 'Турбулентний потік над коником даху.', noteEN: 'Turbulent flow over ridge of roof.' },
  { id: 'roof_flat',      nameUA: 'Плаский дах',         nameEN: 'Flat roof',
    windSpeed: 6.5, turbulence: 0.25, gustFactor: 1.55, shearAlpha: 0.18,
    tint: '#0c1a26', recommend: ['vawt', 'hawt'],
    noteUA: 'Стабільніший потік, зона відриву ~30% висоти.', noteEN: 'Steadier flow, separation zone ≈30% height.' },
  { id: 'near_roof_edge', nameUA: 'Біля краю даху',      nameEN: 'Near roof edge',
    windSpeed: 7.5, turbulence: 0.40, gustFactor: 1.9, shearAlpha: 0.16,
    tint: '#0b1422', recommend: ['vawt'],
    noteUA: 'Прискорений потік + сильні густи.', noteEN: 'Accelerated flow + strong gusts.' },
  { id: 'balcony',        nameUA: 'Балкон',              nameEN: 'Balcony',
    windSpeed: 4.5, turbulence: 0.45, gustFactor: 2.0, shearAlpha: 0.22,
    tint: '#0e1822', recommend: ['vawt'],
    noteUA: 'Дуже мінливий, рекомендовано Savonius/Archimedes.', noteEN: 'Very variable, prefer Savonius/Archimedes.' },
  { id: 'lowland_open',   nameUA: 'Рівнина (відкрита)',  nameEN: 'Lowland open',
    windSpeed: 7.0, turbulence: 0.14, gustFactor: 1.35, shearAlpha: 0.14,
    tint: '#0a1828', recommend: ['hawt'],
    noteUA: 'Чистий ламінарний потік.', noteEN: 'Clean laminar flow.' },
  { id: 'lowland_urban',  nameUA: 'Місто (рівнина)',     nameEN: 'Urban lowland',
    windSpeed: 5.0, turbulence: 0.35, gustFactor: 1.6, shearAlpha: 0.28,
    tint: '#0d141c', recommend: ['vawt'],
    noteUA: 'Висока турбулентність від будівель.', noteEN: 'High urban turbulence.' },
  { id: 'highland_ridge', nameUA: 'Гірський хребет',     nameEN: 'Highland ridge',
    windSpeed: 11.0, turbulence: 0.22, gustFactor: 1.7, shearAlpha: 0.12,
    tint: '#091422', recommend: ['hawt', 'vawt'],
    noteUA: 'Сильний потік + орографічне прискорення.', noteEN: 'Strong wind + orographic speed-up.' },
  { id: 'coastal',        nameUA: 'Узбережжя',           nameEN: 'Coastal',
    windSpeed: 9.0, turbulence: 0.12, gustFactor: 1.4, shearAlpha: 0.10,
    tint: '#08192a', recommend: ['hawt'],
    noteUA: 'Стабільний морський бриз.', noteEN: 'Steady sea breeze.' },
  { id: 'forest_clearing', nameUA: 'Поляна в лісі',      nameEN: 'Forest clearing',
    windSpeed: 4.0, turbulence: 0.30, gustFactor: 1.45, shearAlpha: 0.35,
    tint: '#0a1818', recommend: ['vawt'],
    noteUA: 'Слабкий потік, сильний градієнт.', noteEN: 'Weak flow, strong shear.' },
];

export const getSiteScenario = (id: string) =>
  SITE_SCENARIOS.find(s => s.id === id) || SITE_SCENARIOS[0];
