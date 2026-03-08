import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Wind, Zap, Volume2 } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

const turbineData = [
  { id: 'hawt3', type_ua: 'Горизонтальна вісь', type_en: 'Horizontal Axis', category_ua: '3-лопатевий HAWT', category_en: 'Three-Blade HAWT', power: '5–10 kW', parts_ua: 'Лопаті, корпус, зʼєднувачі', parts_en: 'Blades, housing, connectors', efficiency: '55–60%', cp: 0.48, useCase_ua: 'Сільські відкриті простори', useCase_en: 'Rural open spaces', cost: '€1,500–€6,000', tsr: '6–8', noise: '35–45 dB(A)', setback_ua: '≥ 500м від жител', setback_en: '≥ 500m from dwellings', pros_ua: ['Найвища ефективність', 'Зріла технологія', 'Самозапуск при слабкому вітрі'], pros_en: ['Highest efficiency', 'Mature technology', 'Self-starting at low speed'], cons_ua: ['Потребує курсовий механізм', 'Чутливий до турбулентності', 'Візуальний вплив'], cons_en: ['Requires yaw mechanism', 'Sensitive to turbulence', 'Visual impact'], powerCurve_ua: 'Пуск ~3 м/с, номінал ~12 м/с, зупинка ~25 м/с. Регулювання кутом підтримує номінальну потужність.', powerCurve_en: 'Cut-in ~3 m/s, rated ~12 m/s, cut-out ~25 m/s. Pitch regulation maintains rated power.' },
  { id: 'savonius', type_ua: 'Вертикальна вісь', type_en: 'Vertical Axis', category_ua: 'Савоніус VAWT', category_en: 'Savonius VAWT', power: '1–5 kW', parts_ua: 'Ротор, опори, вал', parts_en: 'Rotor, supports, shaft', efficiency: '40–45%', cp: 0.18, useCase_ua: 'Міські дахи', useCase_en: 'Urban rooftops', cost: '€800–€2,500', tsr: '0.8–1.2', noise: '20–30 dB(A)', setback_ua: 'Мінімальна — низький шум', setback_en: 'Minimal — low noise', pros_ua: ['Всенаправлений', 'Дуже низький шум', 'Самозапуск', 'Проста конструкція'], pros_en: ['Omnidirectional', 'Very low noise', 'Self-starting', 'Simple construction'], cons_ua: ['Низька ефективність', 'Обмежена масштабованість', 'Важкий для своєї потужності'], cons_en: ['Low efficiency', 'Limited scalability', 'Heavy for power output'], powerCurve_ua: 'Пуск ~2 м/с, працює при турбулентному вітрі. Приводиться опором — потужність обмежена λ.', powerCurve_en: 'Cut-in ~2 m/s, operates in turbulent conditions. Drag-driven — power limited by TSR.' },
  { id: 'darrieus', type_ua: 'Вертикальна вісь', type_en: 'Vertical Axis', category_ua: "Дар'є VAWT", category_en: 'Darrieus VAWT', power: '1–5 kW', parts_ua: 'Лопаті, вертикальний корпус', parts_en: 'Blades, vertical housing', efficiency: '45–50%', cp: 0.35, useCase_ua: 'Змішані середовища', useCase_en: 'Mixed environments', cost: '€1,000–€3,000', tsr: '4–6', noise: '25–35 dB(A)', setback_ua: '≥ 100м рекомендовано', setback_en: '≥ 100m recommended', pros_ua: ['Вища ефективність ніж Савоніус', 'Компактна площа', 'Приймає вітер з будь-якого напрямку'], pros_en: ['Higher efficiency than Savonius', 'Compact footprint', 'Accepts wind from any direction'], cons_ua: ['Не самозапуск', 'Циклічні навантаження втоми', 'Проблеми вібрації при резонансі'], cons_en: ['Not self-starting', 'Cyclic fatigue stresses', 'Vibration issues at resonance'], powerCurve_ua: 'Потребує зовнішній запуск. Приводиться підйомною силою. Пік Cp при λ ≈ 5.', powerCurve_en: 'Requires external start. Lift-driven. Peak Cp at λ ≈ 5.' },
  { id: 'micro', type_ua: 'Мікро турбіна', type_en: 'Micro Turbine', category_ua: 'Дахова мікро HAWT', category_en: 'Rooftop Micro HAWT', power: '0.2–1 kW', parts_ua: 'Лопаті, кріплення', parts_en: 'Blades, mounts', efficiency: '30–40%', cp: 0.25, useCase_ua: 'Балкони, автодоми, човни', useCase_en: 'Balconies, RVs, boats', cost: '€100–€500', tsr: '5–7', noise: '25–35 dB(A)', setback_ua: 'Не потрібна', setback_en: 'None — personal use', pros_ua: ['Портативна', 'Низька вартість', 'Легка установка', 'Для автономних систем'], pros_en: ['Portable', 'Low cost', 'Easy installation', 'Ideal for off-grid'], cons_ua: ['Дуже низька потужність', 'Вплив міської турбулентності', 'Короткий термін служби'], cons_en: ['Very low power', 'Affected by urban turbulence', 'Short lifespan'], powerCurve_ua: 'Пуск ~2.5 м/с. Малий ротор обмежує захоплення. Найкраще з ламінарним потоком.', powerCurve_en: 'Cut-in ~2.5 m/s. Small rotor limits capture. Best with laminar flow.' },
  { id: 'hybrid', type_ua: 'Гібридна система', type_en: 'Hybrid System', category_ua: 'Вітро-сонячний гібрид', category_en: 'Wind-Solar Hybrid', power: '5–15 kW', parts_ua: 'Корпус інтеграції, інвертор', parts_en: 'Integration housing, inverter', efficiency: '50–60%', cp: 0.40, useCase_ua: 'Автономні будинки, ферми', useCase_en: 'Off-grid homes, farms', cost: '€2,500–€8,000', tsr: 'N/A', noise: '30–40 dB(A)', setback_ua: 'Залежить від типу турбіни', setback_en: 'Depends on turbine component', pros_ua: ['Взаємодоповнююча генерація', 'Вищий КВПП', 'Менше потреби в накопиченні'], pros_en: ['Complementary generation', 'Higher capacity factor', 'Reduced storage needs'], cons_ua: ['Складна інтеграція', 'Вищі початкові витрати', 'Подвійне обслуговування'], cons_en: ['Complex integration', 'Higher upfront cost', 'Dual maintenance'], powerCurve_ua: 'Комбінована віддача згладжує мінливість. Вітер вночі/взимку доповнює сонце вдень/влітку.', powerCurve_en: 'Combined output smooths variability. Wind at night/winter complements solar at day/summer.' },
];

// Larger turbine silhouettes with animated HAWT blades
const TurbineSilhouette = ({ type }: { type: string }) => {
  if (type === 'hawt3' || type === 'micro') {
    return (
      <svg viewBox="0 0 60 70" className="w-14 h-16 shrink-0" fill="none">
        <line x1="30" y1="32" x2="30" y2="66" stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" opacity="0.4" />
        <g style={{ transformOrigin: '30px 30px', animation: 'spin 4s linear infinite' }}>
          <line x1="30" y1="30" x2="30" y2="8" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
          <line x1="30" y1="30" x2="11" y2="42" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
          <line x1="30" y1="30" x2="49" y2="42" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle cx="30" cy="30" r="3" fill="hsl(var(--primary))" />
      </svg>
    );
  }
  if (type === 'savonius') {
    return (
      <svg viewBox="0 0 60 70" className="w-14 h-16 shrink-0" fill="none">
        <line x1="30" y1="8" x2="30" y2="66" stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" opacity="0.4" />
        <path d="M30 14 Q44 22 30 36" stroke="hsl(var(--primary))" strokeWidth="2" fill="hsl(var(--primary) / 0.1)" />
        <path d="M30 36 Q16 44 30 56" stroke="hsl(var(--primary))" strokeWidth="2" fill="hsl(var(--primary) / 0.1)" />
      </svg>
    );
  }
  if (type === 'darrieus') {
    return (
      <svg viewBox="0 0 60 70" className="w-14 h-16 shrink-0" fill="none">
        <line x1="30" y1="8" x2="30" y2="66" stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" opacity="0.4" />
        <ellipse cx="30" cy="37" rx="16" ry="24" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />
      </svg>
    );
  }
  // hybrid
  return (
    <svg viewBox="0 0 60 70" className="w-14 h-16 shrink-0" fill="none">
      <line x1="22" y1="30" x2="22" y2="66" stroke="hsl(var(--muted-foreground))" strokeWidth="2" opacity="0.4" />
      <line x1="22" y1="30" x2="22" y2="14" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <line x1="22" y1="30" x2="12" y2="38" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <line x1="22" y1="30" x2="32" y2="38" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <circle cx="22" cy="30" r="2" fill="hsl(var(--primary))" />
      <rect x="38" y="42" width="16" height="12" rx="2" stroke="hsl(60 80% 55%)" strokeWidth="1.5" fill="hsl(60 80% 55% / 0.15)" />
      <line x1="42" y1="45" x2="42" y2="51" stroke="hsl(60 80% 55%)" strokeWidth="0.7" opacity="0.5" />
      <line x1="46" y1="45" x2="46" y2="51" stroke="hsl(60 80% 55%)" strokeWidth="0.7" opacity="0.5" />
      <line x1="50" y1="45" x2="50" y2="51" stroke="hsl(60 80% 55%)" strokeWidth="0.7" opacity="0.5" />
    </svg>
  );
};

// Efficiency (Cp) comparison bar chart
const EfficiencyComparisonSVG = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const items = [
    { label: 'HAWT 3-blade', cp: 0.48, color: 'hsl(var(--primary))' },
    { label: L('Гібрид', 'Hybrid'), cp: 0.40, color: 'hsl(120 70% 50%)' },
    { label: "Darrieus", cp: 0.35, color: 'hsl(210 90% 60%)' },
    { label: L('Мікро', 'Micro'), cp: 0.25, color: 'hsl(25 80% 55%)' },
    { label: "Savonius", cp: 0.18, color: 'hsl(0 60% 50%)' },
  ];
  const W = 400, H = 160;
  const barH = 20, gap = 8;
  const maxCp = 0.593; // Betz limit

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36 sm:h-40">
      {/* Betz limit line */}
      <line x1={80 + (0.593 / maxCp) * 260} y1={0} x2={80 + (0.593 / maxCp) * 260} y2={H} stroke="hsl(210 90% 60%)" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
      <text x={80 + (0.593 / maxCp) * 260 - 4} y={H - 4} textAnchor="end" fontSize="9" fill="hsl(210 90% 60%)" fontFamily="monospace">{L('Ліміт Бетца', 'Betz')} 59.3%</text>

      {items.map((item, i) => {
        const y = 8 + i * (barH + gap);
        const w = (item.cp / maxCp) * 260;
        return (
          <g key={i}>
            <text x={76} y={y + 14} textAnchor="end" fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{item.label}</text>
            <motion.rect x={80} y={y} width={w} height={barH} rx="3" fill={item.color} opacity="0.75"
              initial={{ width: 0 }} animate={{ width: w }} transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{ filter: `drop-shadow(0 0 4px ${item.color}40)` }} />
            <text x={84 + w} y={y + 14} fontSize="11" fontWeight="600" fill="hsl(var(--foreground))" fontFamily="monospace">Cp={item.cp.toFixed(2)}</text>
          </g>
        );
      })}
    </svg>
  );
};

export const TurbineCategories = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="space-y-4">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1">{L('Категорії побутових вітротурбін', 'Household Wind Turbine Categories')}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          {L('Порівняння архітектур турбін з аеродинамічними показниками, шумовими характеристиками та рекомендаціями розгортання.',
             'Comparison of turbine architectures with aerodynamic performance, noise characteristics, and deployment guidelines.')}
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.05)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
            <p className="text-sm font-semibold text-primary mb-1">HAWT</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>• {L('Вищий Cp (до 0.50)', 'Higher Cp (up to 0.50)')}</li>
              <li>• {L('Потребує курсовий контроль', 'Requires yaw control')}</li>
              <li>• {L('Чутливий до турбулентності', 'Sensitive to turbulence')}</li>
              <li>• {L('Краще у масштабі', 'Better at scale')}</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.3)' }}>
            <p className="text-sm font-semibold text-foreground mb-1">VAWT</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>• {L('Всенаправлений', 'Omnidirectional')}</li>
              <li>• {L('Краще при турбулентності', 'Better in turbulence')}</li>
              <li>• {L('Нижчий рівень шуму', 'Lower noise profile')}</li>
              <li>• {L('Простіша механіка', 'Simpler mechanics')}</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Efficiency Comparison Chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          {L('Порівняння ефективності (Cp) за типом', 'Efficiency Comparison (Cp) by Type')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Пунктирна лінія — теоретичний ліміт Бетца (59.3%). Cp — коефіцієнт потужності.', 
             'Dashed line — theoretical Betz limit (59.3%). Cp — power coefficient.')}
        </p>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <EfficiencyComparisonSVG lang={lang} />
        </div>
      </motion.div>

      <Accordion type="single" collapsible className="space-y-2">
        {turbineData.map((turbine, idx) => (
          <AccordionItem key={turbine.id} value={turbine.id} className="border-0">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
              className="stalker-card overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 text-left w-full">
                  <TurbineSilhouette type={turbine.id} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-semibold">{lang === 'ua' ? turbine.category_ua : turbine.category_en}</span>
                      <Badge variant="outline" className="text-xs border-primary/30 bg-primary/5 text-primary">{lang === 'ua' ? turbine.type_ua : turbine.type_en}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{turbine.power}</span>
                      <span className="flex items-center gap-1"><Wind className="w-3 h-3" />Cp {turbine.cp}</span>
                      <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" />{turbine.noise}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-primary shrink-0">{turbine.cost}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    {[
                      { label: L('λ (TSR)', 'TSR (λ)'), value: turbine.tsr },
                      { label: L('Відступ', 'Setback'), value: lang === 'ua' ? turbine.setback_ua : turbine.setback_en },
                      { label: L('3D-друк деталі', '3D Printed Parts'), value: lang === 'ua' ? turbine.parts_ua : turbine.parts_en },
                      { label: L('Оптимальне використання', 'Best Use'), value: lang === 'ua' ? turbine.useCase_ua : turbine.useCase_en },
                    ].map((spec, i) => (
                      <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                        <span className="text-muted-foreground text-xs">{spec.label}</span>
                        <p className="text-foreground">{spec.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
                    <p className="text-xs font-semibold text-primary mb-1">{L('Поведінка кривої потужності', 'Power Curve Behavior')}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{lang === 'ua' ? turbine.powerCurve_ua : turbine.powerCurve_en}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">{L('Переваги', 'Advantages')}</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {(lang === 'ua' ? turbine.pros_ua : turbine.pros_en).map((p, i) => <li key={i}>+ {p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(0 60% 55%)' }}>{L('Обмеження', 'Limitations')}</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {(lang === 'ua' ? turbine.cons_ua : turbine.cons_en).map((c, i) => <li key={i}>− {c}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </motion.div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
