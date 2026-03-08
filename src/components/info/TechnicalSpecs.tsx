import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calculator, Settings, Volume2, Wind } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

const turbineSpecs = [
  { model: 'Vestas V150-4.2', power: '4.2 MW', rotor: '150m', hub: '105–166m', cutIn: '3', cutOut: '25', regulation: 'Pitch', aep: '~15 GWh/yr' },
  { model: 'Siemens SG 5.8-170', power: '5.8 MW', rotor: '170m', hub: '115–165m', cutIn: '3', cutOut: '25', regulation: 'Pitch', aep: '~22 GWh/yr' },
  { model: 'GE Haliade-X 14', power: '14 MW', rotor: '220m', hub: '135m', cutIn: '3', cutOut: '28', regulation: 'Pitch', aep: '~74 GWh/yr' },
  { model: 'Nordex N163/5.X', power: '5.7 MW', rotor: '163m', hub: '118–164m', cutIn: '3', cutOut: '25', regulation: 'Pitch', aep: '~20 GWh/yr' },
  { model: 'Enercon E-138 EP3', power: '4.2 MW', rotor: '138m', hub: '81–160m', cutIn: '2', cutOut: '28', regulation_ua: 'Кут (безредукторний)', regulation_en: 'Pitch (gearless)', aep: '~16 GWh/yr' },
];

const economicMetrics = [
  { metric_ua: 'LCOE (наземні)', metric_en: 'LCOE (Onshore)', value: '€25–45/MWh', trend_ua: '↓ 40% з 2015', trend_en: '↓ 40% since 2015' },
  { metric_ua: 'LCOE (морські)', metric_en: 'LCOE (Offshore)', value: '€50–80/MWh', trend_ua: '↓ 50% з 2015', trend_en: '↓ 50% since 2015' },
  { metric_ua: 'Коеф. використання', metric_en: 'Capacity Factor', value: '25–55%', trend_ua: 'Зростає', trend_en: 'Improving' },
  { metric_ua: 'IRR проєкту', metric_en: 'Project IRR', value: '8–12%', trend_ua: 'Стабільний', trend_en: 'Stable' },
  { metric_ua: 'Окупність', metric_en: 'Payback Period', value: '7–12 years', trend_ua: 'Скорочується', trend_en: 'Shortening' },
  { metric_ua: 'Ресурс турбіни', metric_en: 'Turbine Lifespan', value: '25–30 years', trend_ua: 'Подовжується', trend_en: 'Extending' },
];

// Rotor size comparison SVG
const RotorComparisonSVG = () => {
  const turbines = [
    { name: 'E-138', rotor: 138, color: 'hsl(25 90% 55%)' },
    { name: 'V150', rotor: 150, color: 'hsl(120 80% 50%)' },
    { name: 'N163', rotor: 163, color: 'hsl(210 90% 60%)' },
    { name: 'SG 170', rotor: 170, color: 'hsl(270 70% 60%)' },
    { name: 'HX 220', rotor: 220, color: 'hsl(0 80% 55%)' },
  ];
  const maxR = 220;
  return (
    <svg viewBox="0 0 300 80" className="w-full h-16">
      {turbines.map((t, i) => {
        const w = (t.rotor / maxR) * 240;
        const y = 10 + i * 14;
        return (
          <g key={i}>
            <rect x="50" y={y} width={w} height="10" rx="2" fill={t.color} opacity="0.7"
              style={{ filter: `drop-shadow(0 0 3px ${t.color}50)` }} />
            <text x="46" y={y + 8} textAnchor="end" fontSize="7" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{t.name}</text>
            <text x={52 + w} y={y + 8} fontSize="7" fill="hsl(var(--foreground))" fontFamily="monospace">{t.rotor}m</text>
          </g>
        );
      })}
    </svg>
  );
};

export const TechnicalSpecs = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-1 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" /> {L('Специфікації сучасних вітротурбін', 'Modern Wind Turbine Specifications')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Промислові референсні турбіни з номінальною потужністю, геометрією ротора та оцінкою річного виробництва.',
             'Industrial-scale reference turbines with rated power, rotor geometry, and estimated annual energy production.')}
        </p>
        {/* Rotor comparison */}
        <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--border) / 0.2)' }}>
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">{L('Порівняння діаметрів ротора', 'Rotor Diameter Comparison')}</p>
          <RotorComparisonSVG />
        </div>
      </motion.div>

      <Accordion type="single" collapsible className="space-y-2">
        {turbineSpecs.map((t, i) => (
          <AccordionItem key={i} value={`turbine-${i}`} className="border-0">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="stalker-card overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 text-left w-full">
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm font-semibold">{t.model}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">{t.power}</Badge>
                      <span>{L('Ротор', 'Rotor')}: {t.rotor}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-primary shrink-0">{t.aep}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: L('Висота щогли', 'Hub Height'), value: t.hub },
                    { label: L('Регулювання', 'Regulation'), value: ('regulation_ua' in t && lang === 'ua') ? (t as any).regulation_ua : ('regulation_en' in t && lang === 'en') ? (t as any).regulation_en : t.regulation },
                    { label: L('Швидкість пуску', 'Cut-in Speed'), value: `${t.cutIn} ${L('м/с', 'm/s')}` },
                    { label: L('Швидкість зупинки', 'Cut-out Speed'), value: `${t.cutOut} ${L('м/с', 'm/s')}` },
                  ].map((spec, j) => (
                    <div key={j} className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                      <span className="text-[10px] text-muted-foreground">{spec.label}</span>
                      <p className="font-mono text-foreground">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </motion.div>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Economic Metrics */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" /> {L('Економічні показники', 'Economic Performance')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {economicMetrics.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{lang === 'ua' ? item.metric_ua : item.metric_en}</p>
              <p className="text-sm sm:text-base font-bold text-foreground mt-0.5">{item.value}</p>
              <p className="text-[10px] text-primary mt-0.5">{lang === 'ua' ? item.trend_ua : item.trend_en}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Advanced Topics */}
      <Accordion type="single" collapsible className="space-y-2">
        {[
          { value: 'aep', icon: Calculator, title: L('Метод розрахунку AEP', 'AEP Calculation Method'), content: (
            <div className="space-y-2">
              <p>{L('Річне виробництво енергії інтегрує криву потужності турбіни з розподілом вітру на ділянці:', 'Annual Energy Production integrates the turbine power curve against the site wind distribution:')}</p>
              <div className="p-2.5 rounded-lg font-mono text-center text-primary text-sm" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                AEP = 8760 × ∫ P(V) · f(V) dV
              </div>
              <p>{L('Втрати: сліди (5–10%), електричні (2–3%), доступність (95–98%), забруднення лопатей (1–2%), обмерзання (0–5% залежно від клімату).',
                   'Losses applied: wake (5–10%), electrical (2–3%), availability (95–98%), blade soiling (1–2%), icing (0–5% depending on climate).')}</p>
              <p>{L('Чисте AEP зазвичай 75–85% від валового після всіх коефіцієнтів втрат.',
                   'Net AEP is typically 75–85% of gross AEP after all loss factors.')}</p>
            </div>
          )},
          { value: 'power-curve', icon: Wind, title: L('Зривне vs кутове регулювання', 'Stall vs Pitch Regulation'), content: (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                  <p className="text-[10px] font-semibold text-foreground">{L('Зривне регулювання', 'Stall Regulation')}</p>
                  <p className="text-[10px] mt-0.5">{L('Аеродинаміка лопаті природно обмежує потужність вище номінальної швидкості. Простіше, але потужність падає при сильному вітрі.',
                     'Blade aerodynamics naturally limit power above rated speed. Simpler but power drops in high winds.')}</p>
                </div>
                <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
                  <p className="text-[10px] font-semibold text-primary">{L('Кутове регулювання', 'Pitch Regulation')}</p>
                  <p className="text-[10px] mt-0.5">{L('Активний контроль кута лопаті підтримує номінальну потужність. Дозволяє аварійне прапорування. Стандарт на сучасних турбінах.',
                     'Active blade angle control maintains rated power. Enables emergency feathering. Standard on modern utility turbines.')}</p>
                </div>
              </div>
              <p>{L('Активні системи реагують за 3–5 секунд. IPC (Individual Pitch Control) регулює кожну лопать окремо для зменшення асиметричних навантажень.',
                   'Active pitch systems respond in 3–5 seconds. Individual Pitch Control (IPC) adjusts each blade independently to reduce asymmetric loads.')}</p>
            </div>
          )},
          { value: 'wake', icon: Wind, title: L('Сліди та розташування', 'Wake Effects & Spacing'), content: (
            <div className="space-y-2">
              <p>{L('Турбіни за слідом відчувають знижену швидкість вітру та підвищену турбулентність:',
                   'Downstream turbines in a wake experience reduced wind speed and increased turbulence:')}</p>
              <div className="space-y-1.5">
                {[
                  { label: L('Дефіцит швидкості на 5D', 'Velocity deficit at 5D'), value: '20–40%' },
                  { label: L('Дефіцит швидкості на 10D', 'Velocity deficit at 10D'), value: '5–15%' },
                  { label: L('Відновлення турбулентності', 'Turbulence recovery'), value: '10–15D' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                    <span>{item.label}</span>
                    <span className="font-mono text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
                <p className="text-[10px] font-semibold text-primary">{L('Галузеве правило', 'Industry Rule')}</p>
                <p className="text-[10px]">{L('Мінімум 5D перпендикулярно переважному вітру, 7–10D у напрямку переважного вітру.',
                   'Minimum 5D spacing perpendicular to prevailing wind, 7–10D in prevailing direction.')}</p>
              </div>
            </div>
          )},
          { value: 'noise', icon: Volume2, title: L('Поширення шуму та нормативи', 'Noise Propagation & Regulations'), content: (
            <div className="space-y-2">
              <p>{L('Шум вітротурбіни: аеродинамічний (широкосмуговий, задня кромка) та механічний (редуктор, генератор) компоненти.',
                   'Wind turbine noise: aerodynamic (broadband, trailing edge) and mechanical (gearbox, generator) components.')}</p>
              <div className="p-2.5 rounded-lg font-mono text-center text-primary text-sm" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                L<sub>p</sub> = L<sub>w</sub> − 10·log₁₀(4πr²) − α·r
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                  <p className="text-[10px] font-semibold text-foreground">{L('На 500м', 'At 500m')}</p>
                  <p className="font-mono text-foreground">~40 dB(A)</p>
                </div>
                <div className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                  <p className="text-[10px] font-semibold text-foreground">{L('Ліміт ЄС (ніч)', 'EU limit (night)')}</p>
                  <p className="font-mono text-foreground">35–40 dB(A)</p>
                </div>
              </div>
              <p>{L('Зубчасті кромки задньої частини зменшують широкосмуговий шум на 2–5 дБ(А). Шумооптимізовані режими обмінюють 1–3% AEP на відповідність.',
                   'Trailing edge serrations reduce broadband noise by 2–5 dB(A). Noise-optimized modes trade 1–3% AEP for compliance.')}</p>
            </div>
          )},
        ].map(item => (
          <AccordionItem key={item.value} value={item.value} className="border-0">
            <div className="stalker-card overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-semibold">{item.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground">
                {item.content}
              </AccordionContent>
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
