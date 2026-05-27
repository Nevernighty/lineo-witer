import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip, CartesianGrid, Legend } from 'recharts';
import type { BladeGeometry } from '@/aero/bem';
import { cpLambdaCurve, powerCurve, solveBEM } from '@/aero/bem';
import { clOf, cdOf } from '@/aero/airfoils';
import { Lang } from '@/utils/i18n';

interface Props { geometry: BladeGeometry; lang: Lang; windSpeed: number; tsr: number; rho: number; }

const T = {
  ua: { polar: 'Полярна крива Cl/Cd', cpl: 'Cp - λ (Betz = 0.593)', power: 'Крива потужності P(V)', metric: 'Метрики', power_: 'Потужність', cp: 'Cp', ct: 'Ct', tip: 'Кінцева швидк.', alphaTip: 'AoA кінчик', stall: 'У зриві' },
  en: { polar: 'Polar Cl/Cd', cpl: 'Cp – λ (Betz = 0.593)', power: 'Power curve P(V)', metric: 'Metrics', power_: 'Power', cp: 'Cp', ct: 'Ct', tip: 'Tip speed', alphaTip: 'Tip AoA', stall: 'Stalled' },
};

export function AeroAnalysis({ geometry, lang, windSpeed, tsr, rho }: Props) {
  const t = T[lang];
  const polar = useMemo(() => {
    const out = [];
    for (let a = -8; a <= 22; a += 0.5) {
      out.push({ alpha: a, cl: +clOf(geometry.airfoil, a).toFixed(3), cd: +cdOf(geometry.airfoil, a).toFixed(4) });
    }
    return out;
  }, [geometry.airfoil]);

  const cpl = useMemo(() => cpLambdaCurve(geometry, windSpeed, rho).map(p => ({ ...p, cp: +p.cp.toFixed(3), ct: +p.ct.toFixed(3) })), [geometry, windSpeed, rho]);
  const pwr = useMemo(() => powerCurve(geometry, rho, 0, tsr).map(p => ({ V: p.V, P: +(p.P / 1000).toFixed(2), cp: +p.cp.toFixed(3) })), [geometry, rho, tsr]);
  const op = useMemo(() => solveBEM(geometry, { V: windSpeed, omega: (tsr * windSpeed) / geometry.tipRadius, rho }), [geometry, windSpeed, tsr, rho]);

  const tipSpeed = (tsr * windSpeed);
  const stalled = op.elements.filter(e => e.stalled).length;
  const tipAlpha = op.elements[op.elements.length - 1]?.alpha || 0;

  return (
    <div className="space-y-4 p-3 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <Metric label={t.power_} value={`${(op.power / 1000).toFixed(1)} kW`} />
        <Metric label={t.cp} value={op.cp.toFixed(3)} />
        <Metric label={t.ct} value={op.ct.toFixed(3)} />
        <Metric label={t.tip} value={`${tipSpeed.toFixed(0)} m/s`} />
        <Metric label={t.alphaTip} value={`${tipAlpha.toFixed(1)}°`} />
        <Metric label={t.stall} value={`${stalled}/${op.elements.length}`} accent={stalled > op.elements.length * 0.3 ? '#ff7a00' : undefined} />
      </div>

      <Chart title={t.polar} h={140}>
        <LineChart data={polar} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="alpha" tick={{ fontSize: 9, fill: '#888' }} />
          <YAxis tick={{ fontSize: 9, fill: '#888' }} />
          <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #333', fontSize: 11 }} />
          <Line type="monotone" dataKey="cl" stroke="#39ff14" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="cd" stroke="#ff6644" dot={false} strokeWidth={1.5} />
          <ReferenceLine y={0} stroke="#444" />
        </LineChart>
      </Chart>

      <Chart title={t.cpl} h={140}>
        <LineChart data={cpl} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="lambda" tick={{ fontSize: 9, fill: '#888' }} />
          <YAxis tick={{ fontSize: 9, fill: '#888' }} />
          <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #333', fontSize: 11 }} />
          <Line type="monotone" dataKey="cp" stroke="#39ff14" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="ct" stroke="#66e8ff" dot={false} strokeWidth={1.5} />
          <ReferenceLine y={0.593} stroke="#ffaa00" strokeDasharray="4 4" />
        </LineChart>
      </Chart>

      <Chart title={t.power} h={140}>
        <LineChart data={pwr} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="V" tick={{ fontSize: 9, fill: '#888' }} />
          <YAxis tick={{ fontSize: 9, fill: '#888' }} />
          <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #333', fontSize: 11 }} />
          <Line type="monotone" dataKey="P" stroke="#39ff14" dot={false} strokeWidth={1.5} />
        </LineChart>
      </Chart>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="border border-border/40 rounded-md p-2 bg-card/30">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="font-mono text-sm" style={{ color: accent || 'hsl(var(--primary))' }}>{value}</div>
    </div>
  );
}

function Chart({ title, h, children }: { title: string; h: number; children: React.ReactElement }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-foreground mb-1">{title}</div>
      <div className="rounded-md border border-border/40 bg-card/30 p-1" style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}
