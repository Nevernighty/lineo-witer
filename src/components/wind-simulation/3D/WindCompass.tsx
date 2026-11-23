import type { PointerEvent } from 'react';
import type { Lang } from '@/utils/i18n';

/** Uses the simulation's flow heading: 0° = +X (east), 90° = +Z (south). */
export function WindCompass({ value, onChange, lang }: {
  value: number; onChange: (value: number) => void; lang: Lang;
}) {
  const update = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const angle = Math.atan2(event.clientY - rect.top - rect.height / 2, event.clientX - rect.left - rect.width / 2) * 180 / Math.PI;
    onChange((Math.round(angle / 5) * 5 + 360) % 360);
  };
  const ua = lang === 'ua';
  return (
    <div className="flex items-center gap-3 border-y border-primary/15 py-2">
      <svg viewBox="0 0 120 120" role="slider" tabIndex={0}
        aria-label={ua ? 'Напрямок потоку' : 'Flow direction'}
        aria-valuemin={0} aria-valuemax={355} aria-valuenow={value % 360}
        aria-valuetext={`${value % 360}°`} className="h-28 w-28 shrink-0 touch-none text-primary cursor-crosshair rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); update(e); }}
        onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e); }}
        onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}
        onKeyDown={e => {
          if (['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
            e.preventDefault();
            onChange(e.key === 'Home' ? 0 : e.key === 'End' ? 355 : (value + (e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 5 : -5) + 360) % 360);
          }
        }}>
        <circle cx="60" cy="60" r="43" fill="none" stroke="currentColor" opacity="0.3" />
        {Array.from({ length: 24 }, (_, i) => <path key={i} d="M 97 60 H 102" stroke="currentColor" opacity={i % 3 === 0 ? 0.8 : 0.25} transform={`rotate(${i * 15} 60 60)`} />)}
        {[[60, 10, ua ? 'Пн' : 'N'], [111, 63, ua ? 'Сх' : 'E'], [60, 115, ua ? 'Пд' : 'S'], [9, 63, ua ? 'Зх' : 'W']].map(([x, y, label]) => <text key={label} x={x} y={y} textAnchor="middle" fill="currentColor" fontSize="10">{label}</text>)}
        <g transform={`rotate(${value} 60 60)`}>
          <path d="M 33 60 H 86 M 77 52 L 87 60 L 77 68" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <circle cx="60" cy="60" r="4" fill="currentColor" />
      </svg>
      <div className="min-w-0 space-y-1">
        <div className="text-xs text-muted-foreground">{ua ? 'Напрямок потоку' : 'Flow heading'}</div>
        <div className="text-xl font-mono tabular-nums text-primary">{value % 360}°</div>
        <div className="text-xs text-muted-foreground">{ua ? '0° → Схід · 90° → Південь' : '0° → East · 90° → South'}</div>
      </div>
    </div>
  );
}