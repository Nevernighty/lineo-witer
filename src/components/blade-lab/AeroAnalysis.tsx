import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts';
import type { BladeGeometry } from '@/aero/bem';
import { cpLambdaCurve, cpLambdaCurveVAWT, powerCurve, powerCurveVAWT, solveBEM, solveVAWT } from '@/aero/bem';
import type { RotorType } from '@/aero/buildBladeGeometry';
import { clOf, cdOf } from '@/aero/airfoils';
import { Lang } from '@/utils/i18n';
import { getMaterial } from '@/aero/materials';

interface Props {
  geometry: BladeGeometry;
  lang: Lang;
  windSpeed: number;
  tsr: number;
  rho: number;
  materialId: string;
  rotorType?: RotorType;
  heightOverDiameter?: number;
}

const T = {
  ua: { polar: 'Полярна крива Cl/Cd', cpl: 'Cp – λ (межа Betz 0.593)', power: 'Крива потужності P(V)', aoaDist: 'Розподіл AoA / азимуту', power_: 'Потужність', cp: 'Cp', ct: 'Ct', tipS: 'Кінцева швидк.', alphaTip: 'AoA кінчик', stall: 'У зриві', re70: 'Re @ 0.7R', machTip: 'Mach кінчик', swept: 'Ометена площа', lambdaOpt: 'λ оптимум', warn: 'Попередження', warnStall: 'Більше 30% секцій у зриві', warnMach: 'Mach кінчика > 0.3 (шум, втрати)', warnTip: 'Кінцева швидкість > ліміту матеріалу', warnSig: 'Низька солідність σ < 0.03' },
  en: { polar: 'Polar Cl/Cd', cpl: 'Cp – λ (Betz 0.593)', power: 'Power curve P(V)', aoaDist: 'AoA / azimuth distribution', power_: 'Power', cp: 'Cp', ct: 'Ct', tipS: 'Tip speed', alphaTip: 'Tip AoA', stall: 'Stalled', re70: 'Re @ 0.7R', machTip: 'Tip Mach', swept: 'Swept area', lambdaOpt: 'λ optimum', warn: 'Warnings', warnStall: '>30% of sections stalled', warnMach: 'Tip Mach > 0.3 (noise, losses)', warnTip: 'Tip speed exceeds material limit', warnSig: 'Low solidity σ < 0.03' },
};

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  fontSize: 11,
  color: 'hsl(var(--foreground))',
};

export function AeroAnalysis({ geometry, lang, windSpeed, tsr, rho, materialId }: Props) {
  const t = T[lang];
  const material = getMaterial(materialId);

  const polar = useMemo(() => {
    const out = [];
    for (let a = -8; a <= 22; a += 0.5) {
      out.push({ alpha: a, cl: +clOf(geometry.airfoil, a).toFixed(3), cd: +cdOf(geometry.airfoil, a).toFixed(4) });
    }
    return out;
  }, [geometry.airfoil]);

  const cpl = useMemo(() => cpLambdaCurve(geometry, windSpeed, rho).map(p => ({ ...p, cp: +p.cp.toFixed(3), ct: +p.ct.toFixed(3) })), [geometry, windSpeed, rho]);
  const pwr = useMemo(() => powerCurve(geometry, rho, 0, tsr).map(p => ({ V: p.V, P: +(p.P / 1000).toFixed(2), cp: +p.cp.toFixed(3) })), [geometry, rho, tsr]);
  const op = useMemo(() => solveBEM(geometry, { V: windSpeed, omega: (tsr * windSpeed) / Math.max(0.1, geometry.tipRadius), rho }), [geometry, windSpeed, tsr, rho]);

  const tipSpeed = tsr * windSpeed;
  const stalled = op.elements.filter(e => e.stalled).length;
  const tipAlpha = op.elements[op.elements.length - 1]?.alpha || 0;
  const aoaDist = op.elements.map(e => ({ rR: +(e.r / geometry.tipRadius).toFixed(2), alpha: +e.alpha.toFixed(1), stall: geometry.airfoil.alphaStall }));
  const e07 = op.elements[Math.floor(op.elements.length * 0.7)];
  const re70 = e07 ? (Math.sqrt(windSpeed * windSpeed + Math.pow((tsr * windSpeed) * (e07.r / geometry.tipRadius), 2)) * e07.chord) / 1.5e-5 : 0;
  const machTip = tipSpeed / 343;

  const avgChord = (geometry.chordRoot + geometry.chordTip) / 2;
  const sigma = (geometry.nBlades * avgChord) / (Math.PI * geometry.tipRadius);

  const warnings: string[] = [];
  if (stalled > op.elements.length * 0.3) warnings.push(t.warnStall);
  if (machTip > 0.3) warnings.push(t.warnMach);
  if (tipSpeed > material.maxTipSpeed) warnings.push(t.warnTip);
  if (sigma < 0.03) warnings.push(t.warnSig);

  return (
    <div className="space-y-3 p-3 text-xs">
      <div className="grid grid-cols-2 gap-1.5">
        <Metric label={t.power_} value={`${(op.power / 1000).toFixed(1)} kW`} />
        <Metric label={t.cp} value={op.cp.toFixed(3)} />
        <Metric label={t.ct} value={op.ct.toFixed(3)} />
        <Metric label={t.tipS} value={`${tipSpeed.toFixed(0)} m/s`} accent={tipSpeed > material.maxTipSpeed ? '#ff7a00' : undefined} />
        <Metric label={t.alphaTip} value={`${tipAlpha.toFixed(1)}°`} />
        <Metric label={t.stall} value={`${stalled}/${op.elements.length}`} accent={stalled > op.elements.length * 0.3 ? '#ff7a00' : undefined} />
        <Metric label={t.re70} value={re70 > 1e6 ? `${(re70 / 1e6).toFixed(2)}M` : `${(re70 / 1e3).toFixed(0)}k`} />
        <Metric label={t.machTip} value={machTip.toFixed(3)} accent={machTip > 0.3 ? '#ff7a00' : undefined} />
      </div>

      {warnings.length > 0 && (
        <div className="rounded-md border border-orange-500/40 bg-orange-500/10 p-2 space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-orange-400 font-semibold">{t.warn}</div>
          {warnings.map((w, i) => <div key={i} className="text-[10px] text-orange-300">• {w}</div>)}
        </div>
      )}

      <Chart title={t.polar} h={130}>
        <LineChart data={polar} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="alpha" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="cl" stroke="hsl(var(--primary))" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="cd" stroke="#ff6644" dot={false} strokeWidth={1.5} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />
        </LineChart>
      </Chart>

      <Chart title={t.cpl} h={130}>
        <LineChart data={cpl} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="lambda" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="cp" stroke="hsl(var(--primary))" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="ct" stroke="#66e8ff" dot={false} strokeWidth={1.5} />
          <ReferenceLine y={0.593} stroke="#ffaa00" strokeDasharray="4 4" />
        </LineChart>
      </Chart>

      <Chart title={t.power} h={120}>
        <LineChart data={pwr} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="V" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="P" stroke="hsl(var(--primary))" dot={false} strokeWidth={1.5} />
        </LineChart>
      </Chart>

      <Chart title={t.aoaDist} h={100}>
        <AreaChart data={aoaDist} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="rR" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip contentStyle={tooltipStyle} />
          <ReferenceLine y={geometry.airfoil.alphaStall} stroke="#ff7a00" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="alpha" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={1.5} />
        </AreaChart>
      </Chart>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="border border-border/40 rounded-md p-1.5 bg-card/30">
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider truncate">{label}</div>
      <div className="font-mono text-sm tabular-nums" style={{ color: accent || 'hsl(var(--primary))' }}>{value}</div>
    </div>
  );
}

function Chart({ title, h, children }: { title: string; h: number; children: React.ReactElement }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{title}</div>
      <div className="rounded-md border border-border/40 bg-card/30 p-1" style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}
