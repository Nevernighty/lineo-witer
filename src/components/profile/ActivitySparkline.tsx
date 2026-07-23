// Tiny SVG sparkline used on the profile page.
interface Props { data: { date: string; n: number }[] }
export function ActivitySparkline({ data }: Props) {
  const w = 560, h = 44, pad = 4;
  const max = Math.max(1, ...data.map((d) => d.n));
  const dx = (w - pad * 2) / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = pad + i * dx;
    const y = pad + (h - pad * 2) * (1 - d.n / max);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const total = data.reduce((a, d) => a + d.n, 0);
  return (
    <div className="flex items-center gap-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-11">
        <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = pad + i * dx;
          const y = pad + (h - pad * 2) * (1 - d.n / max);
          return <circle key={i} cx={x} cy={y} r={d.n > 0 ? 1.8 : 0.8} fill="hsl(var(--primary))" opacity={d.n > 0 ? 0.85 : 0.35} />;
        })}
      </svg>
      <div className="text-right shrink-0">
        <div className="text-lg font-semibold tabular-nums text-primary">{total}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">actions</div>
      </div>
    </div>
  );
}
