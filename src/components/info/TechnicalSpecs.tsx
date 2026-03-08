import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calculator, Settings, Volume2, Wind, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

const turbineSpecs = [
  { model: 'Vestas V150-4.2', power: '4.2 MW', rotor: '150m', hub: '105–166m', cutIn: '3', cutOut: '25', regulation: 'Pitch', aep: '~15 GWh/yr' },
  { model: 'Siemens SG 5.8-170', power: '5.8 MW', rotor: '170m', hub: '115–165m', cutIn: '3', cutOut: '25', regulation: 'Pitch', aep: '~22 GWh/yr' },
  { model: 'GE Haliade-X 14', power: '14 MW', rotor: '220m', hub: '135m', cutIn: '3', cutOut: '28', regulation: 'Pitch', aep: '~74 GWh/yr' },
  { model: 'Nordex N163/5.X', power: '5.7 MW', rotor: '163m', hub: '118–164m', cutIn: '3', cutOut: '25', regulation: 'Pitch', aep: '~20 GWh/yr' },
  { model: 'Enercon E-138 EP3', power: '4.2 MW', rotor: '138m', hub: '81–160m', cutIn: '2', cutOut: '28', regulation: 'Pitch (gearless)', aep: '~16 GWh/yr' },
];

const economicMetrics = [
  { metric_ua: 'LCOE (наземні)', metric_en: 'LCOE (Onshore)', value: '€25–45/MWh', trend_ua: '↓ 40% з 2015', trend_en: '↓ 40% since 2015' },
  { metric_ua: 'LCOE (морські)', metric_en: 'LCOE (Offshore)', value: '€50–80/MWh', trend_ua: '↓ 50% з 2015', trend_en: '↓ 50% since 2015' },
  { metric_ua: 'Коеф. використання', metric_en: 'Capacity Factor', value: '25–55%', trend_ua: 'Зростає', trend_en: 'Improving' },
  { metric_ua: 'IRR проєкту', metric_en: 'Project IRR', value: '8–12%', trend_ua: 'Стабільний', trend_en: 'Stable' },
  { metric_ua: 'Окупність', metric_en: 'Payback Period', value: '7–12 years', trend_ua: 'Скорочується', trend_en: 'Shortening' },
  { metric_ua: 'Ресурс турбіни', metric_en: 'Turbine Lifespan', value: '25–30 years', trend_ua: 'Подовжується', trend_en: 'Extending' },
];

// Expandable card
const ExpandableCard = ({ title, icon: Icon, children, color = 'hsl(var(--primary))' }: { title: string; icon: any; children: React.ReactNode; color?: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg overflow-hidden transition-all duration-300" style={{
      backgroundColor: 'hsl(222 28% 12%)',
      border: `1px solid ${open ? color + '40' : 'hsl(var(--border) / 0.2)'}`,
      boxShadow: open ? `0 0 20px ${color}15` : 'none',
    }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-xs sm:text-sm font-semibold text-foreground">{title}</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-4 pb-4 text-xs sm:text-sm text-muted-foreground">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Rotor comparison
const RotorComparisonSVG = () => {
  const turbines = [
    { name: 'E-138', rotor: 138, color: 'hsl(25 90% 55%)' },
    { name: 'V150', rotor: 150, color: 'hsl(120 80% 50%)' },
    { name: 'N163', rotor: 163, color: 'hsl(210 90% 60%)' },
    { name: 'SG 170', rotor: 170, color: 'hsl(270 70% 60%)' },
    { name: 'HX 220', rotor: 220, color: 'hsl(0 80% 55%)' },
  ];
  const maxR = 220;
  const W = 440, H = 160;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32 sm:h-40">
      {turbines.map((t, i) => {
        const w = (t.rotor / maxR) * 260;
        const y = 10 + i * 28;
        const area = Math.round(Math.PI * (t.rotor / 2) ** 2);
        return (
          <g key={i}>
            <motion.rect x="80" y={y} width={w} height="20" rx="4" fill={t.color} opacity="0.75"
              initial={{ width: 0 }} animate={{ width: w }} transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 4px ${t.color}50)` }} />
            <text x="74" y={y + 14} textAnchor="end" fontSize="11" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{t.name}</text>
            <text x={84 + w} y={y + 14} fontSize="11" fill="hsl(var(--foreground))" fontFamily="monospace" fontWeight="600">{t.rotor}m</text>
            <text x={84 + w + 45} y={y + 14} fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{area.toLocaleString()} m²</text>
          </g>
        );
      })}
    </svg>
  );
};

// Interactive AEP Calculator
const AEPCalculator = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [windSpeed, setWindSpeed] = useState(7);
  const [rotorD, setRotorD] = useState(150);

  const calc = useMemo(() => {
    const rho = 1.225;
    const A = Math.PI * (rotorD / 2) ** 2;
    const Cp = 0.45;
    const cf = 0.30;
    const pRated = 0.5 * rho * A * Math.pow(windSpeed, 3) * Cp / 1e6;
    const aep = pRated * 8760 * cf;
    return { A: Math.round(A), pRated: pRated.toFixed(2), aep: Math.round(aep), aepGWh: (aep / 1000).toFixed(1) };
  }, [windSpeed, rotorD]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">{L('Середня швидкість вітру', 'Mean Wind Speed')}</span>
            <span className="font-mono text-primary font-semibold">{windSpeed.toFixed(1)} {L('м/с', 'm/s')}</span>
          </div>
          <Slider value={[windSpeed]} onValueChange={([v]) => setWindSpeed(v)} min={4} max={12} step={0.5} />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">{L('Діаметр ротора', 'Rotor Diameter')}</span>
            <span className="font-mono text-primary font-semibold">{rotorD}m</span>
          </div>
          <Slider value={[rotorD]} onValueChange={([v]) => setRotorD(v)} min={80} max={240} step={10} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: L('Площа ометання', 'Swept Area'), value: `${calc.A.toLocaleString()} m²`, icon: '⊙' },
          { label: L('Потужність (пік)', 'Peak Power'), value: `${calc.pRated} MW`, icon: '⚡' },
          { label: L('AEP (CF=30%)', 'AEP (CF=30%)'), value: `${calc.aepGWh} GWh`, icon: '📊' },
          { label: L('Домогосподарства', 'Households'), value: `~${Math.round(calc.aep / 4).toLocaleString()}`, icon: '🏠' },
        ].map((item, i) => (
          <motion.div key={i} layout className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
            <span className="text-xs text-muted-foreground">{item.icon} {item.label}</span>
            <p className="text-base sm:text-lg font-mono font-bold text-foreground mt-0.5">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
        <p className="font-mono text-primary text-center text-sm">
          AEP = P<sub>rated</sub> × 8760h × CF = {calc.pRated} × 8760 × 0.30 = <strong>{calc.aepGWh} GWh</strong>
        </p>
      </div>
    </div>
  );
};

export const TechnicalSpecs = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [openTurbine, setOpenTurbine] = useState<string | null>(null);

  return (
    <div className="space-y-4 eng-scrollbar">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-1 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" /> {L('Специфікації сучасних вітротурбін', 'Modern Wind Turbine Specifications')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          {L('Промислові референсні турбіни з номінальною потужністю, геометрією ротора та оцінкою річного виробництва.',
             'Industrial-scale reference turbines with rated power, rotor geometry, and estimated annual energy production.')}
        </p>
        <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--border) / 0.2)' }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2">{L('Порівняння діаметрів ротора (+ площа ометання πr²)', 'Rotor Diameter Comparison (+ swept area πr²)')}</p>
          <RotorComparisonSVG />
        </div>
      </motion.div>

      {/* Turbine specs — custom expandable */}
      <div className="space-y-2">
        {turbineSpecs.map((t, i) => {
          const isOpen = openTurbine === `turbine-${i}`;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-lg overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: 'hsl(222 28% 12%)',
                border: `1px solid ${isOpen ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border) / 0.2)'}`,
                boxShadow: isOpen ? '0 0 20px hsl(var(--primary) / 0.1)' : 'none',
              }}>
              <button onClick={() => setOpenTurbine(isOpen ? null : `turbine-${i}`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{t.model}</span>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs border-primary/30 bg-primary/5 text-primary">{t.power}</Badge>
                    <span>{L('Ротор', 'Rotor')}: {t.rotor}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-primary">{t.aep}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                        {[
                          { label: L('Висота щогли', 'Hub Height'), value: t.hub },
                          { label: L('Регулювання', 'Regulation'), value: t.regulation },
                          { label: L('Швидкість пуску', 'Cut-in Speed'), value: `${t.cutIn} ${L('м/с', 'm/s')}` },
                          { label: L('Швидкість зупинки', 'Cut-out Speed'), value: `${t.cutOut} ${L('м/с', 'm/s')}` },
                        ].map((spec, j) => (
                          <div key={j} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                            <span className="text-xs text-muted-foreground">{spec.label}</span>
                            <p className="font-mono text-foreground">{spec.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive AEP Calculator */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-1 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" /> {L('Інтерактивний калькулятор AEP', 'Interactive AEP Calculator')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          {L('Регулюйте швидкість вітру та діаметр ротора для оцінки річного виробництва енергії в реальному часі.',
             'Adjust wind speed and rotor diameter to estimate annual energy production in real-time.')}
        </p>
        <AEPCalculator lang={lang} />
      </motion.div>

      {/* Economic Metrics */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" /> {L('Економічні показники', 'Economic Performance')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {economicMetrics.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{lang === 'ua' ? item.metric_ua : item.metric_en}</p>
              <p className="text-base sm:text-lg font-bold text-foreground mt-0.5">{item.value}</p>
              <p className="text-xs text-primary mt-0.5">{lang === 'ua' ? item.trend_ua : item.trend_en}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Advanced Topics — custom expandables */}
      <div className="space-y-2">
        <ExpandableCard title={L('Метод розрахунку AEP', 'AEP Calculation Method')} icon={Calculator} color="hsl(120 70% 50%)">
          <div className="space-y-2">
            <p>{L('Річне виробництво інтегрує криву потужності з розподілом вітру:', 'Annual Energy Production integrates the power curve against wind distribution:')}</p>
            <div className="p-3 rounded-lg font-mono text-center text-primary text-base" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
              AEP = 8760 × ∫ P(V) · f(V) dV
            </div>
            <p>{L('Втрати: сліди (5–10%), електричні (2–3%), доступність (95–98%), забруднення лопатей (1–2%).', 'Losses: wake (5–10%), electrical (2–3%), availability (95–98%), blade soiling (1–2%).')}</p>
          </div>
        </ExpandableCard>

        <ExpandableCard title={L('Зривне vs кутове регулювання', 'Stall vs Pitch Regulation')} icon={Wind} color="hsl(25 90% 55%)">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                <p className="text-xs font-semibold text-foreground">{L('Зривне регулювання', 'Stall Regulation')}</p>
                <p className="text-xs mt-1">{L('Аеродинаміка лопаті природно обмежує потужність. Простіше, але потужність падає.', 'Blade aerodynamics naturally limit power. Simpler but power drops.')}</p>
              </div>
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
                <p className="text-xs font-semibold text-primary">{L('Кутове регулювання', 'Pitch Regulation')}</p>
                <p className="text-xs mt-1">{L('Активний контроль кута лопаті підтримує номінал. Стандарт на сучасних турбінах.', 'Active blade angle control maintains rated power. Standard on modern turbines.')}</p>
              </div>
            </div>
          </div>
        </ExpandableCard>

        <ExpandableCard title={L('Сліди та розташування', 'Wake Effects & Spacing')} icon={Wind} color="hsl(210 90% 60%)">
          <div className="space-y-2">
            <p>{L('Турбіни за слідом відчувають знижену швидкість та підвищену турбулентність:', 'Downstream turbines experience reduced speed and increased turbulence:')}</p>
            <div className="space-y-1.5">
              {[
                { label: L('Дефіцит на 5D', 'Deficit at 5D'), value: '20–40%' },
                { label: L('Дефіцит на 10D', 'Deficit at 10D'), value: '5–15%' },
                { label: L('Відновлення', 'Recovery'), value: '10–15D' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                  <span>{item.label}</span>
                  <span className="font-mono text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ExpandableCard>

        <ExpandableCard title={L('Шум та нормативи', 'Noise & Regulations')} icon={Volume2} color="hsl(0 60% 55%)">
          <div className="space-y-2">
            <p>{L('Аеродинамічний (задня кромка) та механічний (редуктор) компоненти шуму.', 'Aerodynamic (trailing edge) and mechanical (gearbox) noise components.')}</p>
            <div className="p-3 rounded-lg font-mono text-center text-primary text-base" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
              L<sub>p</sub> = L<sub>w</sub> − 10·log₁₀(4πr²) − α·r
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                <p className="text-xs font-semibold text-foreground">{L('На 500м', 'At 500m')}</p>
                <p className="font-mono text-foreground">~40 dB(A)</p>
              </div>
              <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                <p className="text-xs font-semibold text-foreground">{L('Ліміт ЄС (ніч)', 'EU limit (night)')}</p>
                <p className="font-mono text-foreground">35–40 dB(A)</p>
              </div>
            </div>
          </div>
        </ExpandableCard>
      </div>
    </div>
  );
};
