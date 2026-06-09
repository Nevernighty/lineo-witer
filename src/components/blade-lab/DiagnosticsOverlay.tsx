import { useDiagnostics } from '@/store/useDiagnosticsStore';
import { useMemo } from 'react';

interface Props {
  lang: 'ua' | 'en';
  onClose?: () => void;
}

/**
 * Lightweight diagnostics chart for Spin/Stability debugging.
 * Plots RPM, failure%, vibration over the last ~12 s without any chart library
 * (inline SVG keeps it cheap inside the 3D loop).
 */
export function DiagnosticsOverlay({ lang, onClose }: Props) {
  const samples = useDiagnostics();
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  const { rpmPath, failPath, flexPath, latest } = useMemo(() => {
    if (samples.length < 2) return { rpmPath: '', failPath: '', flexPath: '', latest: null };
    const w = 280, h = 90;
    const n = samples.length;
    const maxRpm = Math.max(10, ...samples.map(s => s.rpm));
    const toX = (i: number) => (i / Math.max(1, n - 1)) * w;
    const toY = (v: number, max: number) => h - (Math.min(1, v / max)) * h;
    const path = (key: keyof typeof samples[0], max: number) =>
      samples.map((s, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(s[key] as number, max).toFixed(1)}`).join(' ');
    return {
      rpmPath: path('rpm', maxRpm),
      failPath: path('failure', 1.2),
      flexPath: path('flexAmp', 1.5),
      latest: samples[samples.length - 1],
    };
  }, [samples]);

  return (
    <div className="absolute top-12 right-2 z-30 w-[300px] rounded-md border border-primary/30 bg-card/85 backdrop-blur-xl shadow-xl p-2 pointer-events-auto bl-meta">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-semibold text-primary">{L('Діагностика обертання', 'Spin diagnostics')}</span>
        {onClose && <button onClick={onClose} className="text-muted-foreground hover:text-foreground px-1">×</button>}
      </div>
      <svg width="100%" height="92" viewBox="0 0 280 92" className="rounded bg-black/40 border border-border/30">
        <path d={rpmPath}  stroke="hsl(120 100% 60%)" strokeWidth={1.5} fill="none" />
        <path d={failPath} stroke="hsl(0 90% 60%)"    strokeWidth={1.5} fill="none" />
        <path d={flexPath} stroke="hsl(200 90% 65%)"  strokeWidth={1.2} fill="none" opacity={0.7} />
      </svg>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1.5 font-mono tabular-nums">
        <Row label="RPM"        v={latest?.rpm.toFixed(1)        ?? '—'} color="text-emerald-400" />
        <Row label="ω rad/s"    v={latest?.omega.toFixed(2)      ?? '—'} color="text-emerald-400" />
        <Row label="V tip m/s"  v={latest?.tipSpeed.toFixed(1)   ?? '—'} color="text-primary" />
        <Row label={L('Руйнув. %', 'Fail %')} v={latest ? `${(latest.failure * 100).toFixed(0)}` : '—'}
             color={latest && latest.failure > 0.7 ? 'text-red-400' : 'text-orange-300'} />
        <Row label={L('Відкол.', 'Detached')}  v={latest ? `${(latest.detachedFrac * 100).toFixed(0)}%` : '—'}
             color={latest && latest.detachedFrac > 0.2 ? 'text-red-400' : 'text-muted-foreground'} />
        <Row label={L('Вібрація', 'Vibration')} v={latest?.flexAmp.toFixed(2) ?? '—'} color="text-sky-300" />
      </div>
      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
        <Legend color="hsl(120 100% 60%)" label="RPM" />
        <Legend color="hsl(0 90% 60%)" label={L('Перевантаж.', 'Fail')} />
        <Legend color="hsl(200 90% 65%)" label={L('Вібрація', 'Vib')} />
      </div>
    </div>
  );
}

function Row({ label, v, color }: { label: string; v: string; color: string }) {
  return (
    <div className="flex justify-between gap-1">
      <span className="text-muted-foreground truncate">{label}</span>
      <span className={color}>{v}</span>
    </div>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block w-3 h-0.5" style={{ background: color }} />
      {label}
    </span>
  );
}
