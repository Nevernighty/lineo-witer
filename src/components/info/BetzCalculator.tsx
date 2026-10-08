import { useState } from 'react';
import type { Lang } from '@/utils/i18n';

/** Калькулятор потужності (межа Беца) і річного виробітку (Релей/Вейбулл k=2). */
export const BetzCalculator = ({ lang }: { lang: Lang }) => {
  const [v, setV] = useState(5.5);
  const [r, setR] = useState(1.2);
  const [cp, setCp] = useState(0.35);
  const rho = 1.225;
  const A = Math.PI * r * r;
  const pBetz = 0.5 * rho * A * v ** 3 * (16 / 27);
  // Середнє v³ для Релея = (6/π)·v̄³
  const pAvg = 0.5 * rho * A * cp * (6 / Math.PI) * v ** 3;
  const aep = (pAvg * 8760) / 1000;
  const ua = lang === 'ua';
  const row = (label: string, val: number, set: (n: number) => void, min: number, max: number, step: number, unit: string) => (
    <label className="block text-xs">
      <div className="flex justify-between"><span>{label}</span><span className="font-mono text-primary">{val} {unit}</span></div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(+e.target.value)} className="w-full accent-primary" />
    </label>
  );
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 space-y-3">
      <h3 className="font-semibold text-sm">{ua ? 'Калькулятор Беца та річного виробітку (AEP)' : 'Betz & AEP calculator'}</h3>
      {row(ua ? 'Середня швидкість вітру' : 'Mean wind speed', v, setV, 2, 12, 0.1, 'м/с')}
      {row(ua ? 'Радіус ротора' : 'Rotor radius', r, setR, 0.2, 10, 0.1, 'м')}
      {row(ua ? 'Коефіцієнт Cp' : 'Cp', cp, setCp, 0.05, 0.59, 0.01, '')}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-background/50 p-2"><div className="text-[10px] text-muted-foreground">{ua ? 'Межа Беца' : 'Betz limit'}</div><div className="font-mono text-sm">{pBetz.toFixed(0)} Вт</div></div>
        <div className="rounded-md bg-background/50 p-2"><div className="text-[10px] text-muted-foreground">{ua ? 'Середня потужність' : 'Mean power'}</div><div className="font-mono text-sm">{pAvg.toFixed(0)} Вт</div></div>
        <div className="rounded-md bg-background/50 p-2"><div className="text-[10px] text-muted-foreground">AEP</div><div className="font-mono text-sm text-primary">{aep.toFixed(0)} кВт·год</div></div>
      </div>
      <p className="text-[10px] text-muted-foreground">{ua ? 'Розподіл вітру — Релея (Вейбулл k=2), ρ=1.225 кг/м³. Оцінка без втрат генератора.' : 'Rayleigh distribution (Weibull k=2), ρ=1.225. Excludes generator losses.'}</p>
    </div>
  );
};
