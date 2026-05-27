import { Lang } from '@/utils/i18n';

export interface MacroScenario {
  id: string;
  nameUA: string; nameEN: string;
  hubHeight: number;        // m
  meanWind: number;         // m/s at hub
  turbulenceIntensity: number; // %
  shear: number;            // power-law exponent alpha
  weibullK: number;
  weibullC: number;
  roughness: number;        // z0 m
  temperatureC: number;
  airDensity: number;
  notes_UA: string; notes_EN: string;
  fitRanges: { minHub?: number; maxHub?: number; minR?: number };
  env: 'urban' | 'suburban' | 'plain' | 'coastal' | 'offshore' | 'mountain' | 'valley' | 'forest' | 'arctic' | 'desert';
}

export const MACRO_SCENARIOS: MacroScenario[] = [
  { id: 'urban', nameUA: 'Міський дах', nameEN: 'Urban rooftop', hubHeight: 20, meanWind: 4.8, turbulenceIntensity: 28, shear: 0.30, weibullK: 1.7, weibullC: 5.4, roughness: 1.0, temperatureC: 12, airDensity: 1.225, env: 'urban',
    notes_UA: 'Висока турбулентність, пориви; підходять малі VAWT та міні-HAWT.',
    notes_EN: 'High turbulence, gusty; small VAWTs and micro-HAWTs perform best.',
    fitRanges: { maxHub: 30, minR: 0.3 } },
  { id: 'suburban', nameUA: 'Передмістя', nameEN: 'Suburban', hubHeight: 50, meanWind: 5.8, turbulenceIntensity: 18, shear: 0.22, weibullK: 1.9, weibullC: 6.5, roughness: 0.3, temperatureC: 12, airDensity: 1.225, env: 'suburban',
    notes_UA: 'Помірна шорсткість, помірні пориви.', notes_EN: 'Moderate roughness, moderate gusts.',
    fitRanges: { minHub: 30, maxHub: 80 } },
  { id: 'plain', nameUA: 'Степ / рівнина', nameEN: 'Open plain / steppe', hubHeight: 80, meanWind: 7.2, turbulenceIntensity: 12, shear: 0.16, weibullK: 2.1, weibullC: 8.1, roughness: 0.05, temperatureC: 10, airDensity: 1.225, env: 'plain',
    notes_UA: 'Класичні умови для MW-генераторів.', notes_EN: 'Classical conditions for MW-class turbines.',
    fitRanges: { minHub: 60, minR: 20 } },
  { id: 'coastal', nameUA: 'Узбережжя', nameEN: 'Coastal / sea breeze', hubHeight: 90, meanWind: 8.0, turbulenceIntensity: 10, shear: 0.14, weibullK: 2.2, weibullC: 9.0, roughness: 0.02, temperatureC: 14, airDensity: 1.22, env: 'coastal',
    notes_UA: 'Циклічний бриз, висока ефективність.', notes_EN: 'Cyclic sea-breeze, high yield.',
    fitRanges: { minHub: 60 } },
  { id: 'offshore', nameUA: 'Офшор', nameEN: 'Offshore', hubHeight: 120, meanWind: 9.8, turbulenceIntensity: 7, shear: 0.10, weibullK: 2.3, weibullC: 10.8, roughness: 0.001, temperatureC: 11, airDensity: 1.23, env: 'offshore',
    notes_UA: 'Найвищі ресурси вітру; ерозія від солі.', notes_EN: 'Highest wind resource; salt erosion concern.',
    fitRanges: { minHub: 80, minR: 40 } },
  { id: 'ridge', nameUA: 'Гірський хребет', nameEN: 'Mountain ridge', hubHeight: 70, meanWind: 8.5, turbulenceIntensity: 20, shear: 0.12, weibullK: 2.0, weibullC: 9.4, roughness: 0.1, temperatureC: 6, airDensity: 1.15, env: 'mountain',
    notes_UA: 'Орографічне прискорення, висока турбулентність.', notes_EN: 'Orographic speed-up, high turbulence.',
    fitRanges: { minHub: 40 } },
  { id: 'valley', nameUA: 'Долина (катабатичний)', nameEN: 'Valley katabatic', hubHeight: 40, meanWind: 5.5, turbulenceIntensity: 16, shear: 0.18, weibullK: 1.8, weibullC: 6.2, roughness: 0.2, temperatureC: 3, airDensity: 1.27, env: 'valley',
    notes_UA: 'Холодні низхідні потоки вночі.', notes_EN: 'Cold downslope flow at night.',
    fitRanges: { maxHub: 80 } },
  { id: 'forest', nameUA: 'Край лісу', nameEN: 'Forest edge', hubHeight: 60, meanWind: 5.0, turbulenceIntensity: 24, shear: 0.28, weibullK: 1.8, weibullC: 5.7, roughness: 0.8, temperatureC: 10, airDensity: 1.225, env: 'forest',
    notes_UA: 'Сильний зсув вітру, висока турбулентність.', notes_EN: 'High shear and turbulence near canopy.',
    fitRanges: { minHub: 50 } },
  { id: 'arctic', nameUA: 'Арктичний', nameEN: 'Arctic', hubHeight: 80, meanWind: 7.5, turbulenceIntensity: 10, shear: 0.14, weibullK: 2.0, weibullC: 8.4, roughness: 0.03, temperatureC: -15, airDensity: 1.35, env: 'arctic',
    notes_UA: 'Холодне щільне повітря підвищує потужність; ризик льоду.', notes_EN: 'Cold dense air boosts power; icing risk.',
    fitRanges: { minHub: 60 } },
  { id: 'desert', nameUA: 'Пустеля', nameEN: 'Desert', hubHeight: 80, meanWind: 6.5, turbulenceIntensity: 14, shear: 0.20, weibullK: 1.9, weibullC: 7.3, roughness: 0.005, temperatureC: 35, airDensity: 1.13, env: 'desert',
    notes_UA: 'Гаряче рідкісне повітря; ерозія від пилу.', notes_EN: 'Hot thin air; dust erosion of leading edges.',
    fitRanges: { minHub: 50 } },
];

export function scenarioFitVerdict(s: MacroScenario, hub: number, rotorR: number, lang: Lang): { fit: 'good' | 'ok' | 'poor'; reason: string } {
  const reasons: string[] = [];
  let score = 2;
  if (s.fitRanges.minHub && hub < s.fitRanges.minHub) { score--; reasons.push(lang === 'ua' ? `Висота нижча за рекомендовану (${s.fitRanges.minHub} м)` : `Hub below recommended (${s.fitRanges.minHub} m)`); }
  if (s.fitRanges.maxHub && hub > s.fitRanges.maxHub) { score--; reasons.push(lang === 'ua' ? `Висота вища за типову для сценарію (${s.fitRanges.maxHub} м)` : `Hub above scenario range (${s.fitRanges.maxHub} m)`); }
  if (s.fitRanges.minR && rotorR < s.fitRanges.minR) { score--; reasons.push(lang === 'ua' ? `Ротор замалий (рек. ≥${s.fitRanges.minR} м)` : `Rotor too small (rec ≥${s.fitRanges.minR} m)`); }
  const fit: 'good' | 'ok' | 'poor' = score >= 2 ? 'good' : score === 1 ? 'ok' : 'poor';
  return { fit, reason: reasons.length ? reasons.join('; ') : (lang === 'ua' ? 'Геометрія добре підходить для цього сценарію.' : 'Geometry fits this scenario well.') };
}

export function scenarioName(s: MacroScenario, lang: Lang) { return lang === 'ua' ? s.nameUA : s.nameEN; }
export function scenarioNotes(s: MacroScenario, lang: Lang) { return lang === 'ua' ? s.notes_UA : s.notes_EN; }
