import { useMemo } from 'react';
import { MACRO_SCENARIOS, scenarioFitVerdict, scenarioName, scenarioNotes, MacroScenario } from '@/aero/macroScenarios';
import { powerCurve } from '@/aero/bem';
import { annualEnergy, capacityFactor } from '@/aero/weibull';
import type { BladeGeometry } from '@/aero/bem';
import { Lang } from '@/utils/i18n';

interface Props {
  geometry: BladeGeometry;
  scenarioId: string;
  onScenarioChange: (id: string) => void;
  lang: Lang;
}

const T = {
  ua: { title: 'Макро режим — реальні сценарії', aep: 'Річне виробництво', cf: 'Коеф. навантаження', meanV: 'Середній вітер', hub: 'Висота втулки', ti: 'Турбулентність', rho: 'Густина', verdict: 'Вердикт', good: 'Добре підходить', ok: 'Прийнятно', poor: 'Не рекомендовано', rated: 'Розрахункова P' },
  en: { title: 'Macro regime — real scenarios', aep: 'Annual energy', cf: 'Capacity factor', meanV: 'Mean wind', hub: 'Hub height', ti: 'Turbulence', rho: 'Air density', verdict: 'Verdict', good: 'Good fit', ok: 'Acceptable', poor: 'Not recommended', rated: 'Rated P' },
};

export function MacroRegime({ geometry, scenarioId, onScenarioChange, lang }: Props) {
  const t = T[lang];
  const scenario = MACRO_SCENARIOS.find(s => s.id === scenarioId) || MACRO_SCENARIOS[0];

  const { aepGWh, cf, ratedKw, verdict } = useMemo(() => {
    const curve = powerCurve(geometry, scenario.airDensity, 0, 7);
    const rated = Math.max(...curve.map(p => p.P));
    const aepWh = annualEnergy(curve, scenario.weibullK, scenario.weibullC);
    const cf = capacityFactor(aepWh, Math.max(1, rated));
    return { aepGWh: aepWh / 1e9, cf, ratedKw: rated / 1000, verdict: scenarioFitVerdict(scenario, scenario.hubHeight, geometry.tipRadius, lang) };
  }, [geometry, scenario, lang]);

  const verdictColor = verdict.fit === 'good' ? '#39ff14' : verdict.fit === 'ok' ? '#ffaa00' : '#ff5566';
  const verdictLabel = verdict.fit === 'good' ? t.good : verdict.fit === 'ok' ? t.ok : t.poor;

  return (
    <div className="p-3 space-y-3 text-xs">
      <div className="text-[11px] font-semibold text-foreground">{t.title}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {MACRO_SCENARIOS.map(s => (
          <button key={s.id} onClick={() => onScenarioChange(s.id)}
            className={`px-2 py-1.5 rounded text-[10px] text-left border transition ${s.id === scenario.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 text-muted-foreground hover:border-primary/40'}`}>
            {scenarioName(s, lang)}
          </button>
        ))}
      </div>

      <div className="border border-border/40 rounded-md p-2 space-y-1.5 bg-card/30">
        <div className="text-[11px] text-foreground font-medium">{scenarioName(scenario, lang)}</div>
        <p className="text-[10px] text-muted-foreground italic leading-tight">{scenarioNotes(scenario, lang)}</p>
        <div className="grid grid-cols-2 gap-1 text-[10px] mt-1">
          <Item label={t.hub} value={`${scenario.hubHeight} m`} />
          <Item label={t.meanV} value={`${scenario.meanWind} m/s`} />
          <Item label={t.ti} value={`${scenario.turbulenceIntensity}%`} />
          <Item label={t.rho} value={`${scenario.airDensity} kg/m³`} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Big label={t.rated} value={`${ratedKw.toFixed(1)} kW`} />
        <Big label={t.aep} value={`${aepGWh.toFixed(3)} GWh`} />
        <Big label={t.cf} value={`${(cf * 100).toFixed(1)}%`} />
        <div className="border rounded-md p-2 bg-card/30" style={{ borderColor: `${verdictColor}66` }}>
          <div className="text-[9px] uppercase text-muted-foreground tracking-wider">{t.verdict}</div>
          <div className="font-mono text-sm" style={{ color: verdictColor }}>{verdictLabel}</div>
          <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{verdict.reason}</div>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-mono text-foreground">{value}</span></div>;
}
function Big({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/40 rounded-md p-2 bg-card/30">
      <div className="text-[9px] uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className="font-mono text-sm text-primary">{value}</div>
    </div>
  );
}
