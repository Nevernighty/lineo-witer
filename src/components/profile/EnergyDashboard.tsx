// Lifetime energy dashboard: totals, CO₂ offset, household equivalent, 14-day bars.
import { useMemo, useState } from "react";
import { Zap, Leaf, Home, Gauge, RotateCcw } from "lucide-react";
import { getLifetimeEnergy, resetLifetimeEnergy, formatEnergy, formatPower } from "@/store/useEnergyStore";

const CO2_KG_PER_KWH = 0.37; // середній вуглецевий слід мережі України
const HOUSE_KWH_DAY = 6.5;   // середнє споживання домогосподарства на добу

export function EnergyDashboard({ lang }: { lang: "ua" | "en" }) {
  const [life, setLife] = useState(getLifetimeEnergy);
  const ua = lang === "ua";
  const kwh = life.totalJ / 3.6e6;
  const days = useMemo(() => {
    const out: { d: string; j: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const x = new Date(now); x.setDate(now.getDate() - i);
      const k = x.toISOString().slice(0, 10);
      out.push({ d: k, j: life.daily[k] ?? 0 });
    }
    return out;
  }, [life]);
  const max = Math.max(1e-9, ...days.map((d) => d.j));
  const hours = life.seconds / 3600;

  const stats = [
    { icon: Zap, label: ua ? "Вироблено всього" : "Total generated", value: formatEnergy(life.totalJ) },
    { icon: Gauge, label: ua ? "Пікова потужність" : "Peak power", value: formatPower(life.peakW) },
    { icon: Leaf, label: ua ? "Зекономлено CO₂" : "CO₂ avoided", value: `${(kwh * CO2_KG_PER_KWH * 1000).toFixed(kwh < 0.01 ? 2 : 0)} г` },
    { icon: Home, label: ua ? "Живлення оселі" : "Home powered", value: `${((kwh / HOUSE_KWH_DAY) * 24 * 60).toFixed(1)} ${ua ? "хв" : "min"}` },
  ];

  return (
    <section className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <div className="text-sm font-semibold">{ua ? "Енергія за весь час" : "Lifetime energy"}</div>
        <div className="text-[11px] text-muted-foreground">
          {life.sessions} {ua ? "сесій" : "sessions"} · {hours.toFixed(1)} {ua ? "год симуляції" : "h simulated"}
        </div>
        <button onClick={() => { resetLifetimeEnergy(); setLife(getLifetimeEnergy()); }}
          className="ml-auto p-1 rounded text-muted-foreground hover:text-destructive" title={ua ? "Скинути" : "Reset"}>
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border/30 bg-background/40 p-3">
            <s.icon className="w-4 h-4 text-primary mb-1" />
            <div className="text-lg font-semibold tabular-nums leading-tight">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-[11px] text-muted-foreground mb-1">{ua ? "Виробіток за 14 днів" : "14-day output"}</div>
        <div className="flex items-end gap-1 h-20">
          {days.map((d) => (
            <div key={d.d} className="flex-1 flex flex-col justify-end h-full group relative" title={`${d.d}: ${formatEnergy(d.j)}`}>
              <div className="rounded-sm bg-primary/70 group-hover:bg-primary transition-all" style={{ height: `${Math.max(3, (d.j / max) * 100)}%`, opacity: d.j > 0 ? 1 : 0.25 }} />
            </div>
          ))}
        </div>
      </div>
      {life.totalJ === 0 && (
        <div className="text-[11px] text-muted-foreground">{ua ? "Запустіть симуляцію з вітряками — енергія рахуватиметься тут автоматично." : "Run the simulation with turbines — energy will accumulate here."}</div>
      )}
    </section>
  );
}

export default EnergyDashboard;
