import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Wind, Zap, Volume2 } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

const turbineData = [
  { id: 'hawt3', type_ua: 'Горизонтальна вісь', type_en: 'Horizontal Axis', category_ua: '3-лопатевий HAWT', category_en: 'Three-Blade HAWT', power: '5–10 kW', parts_ua: 'Лопаті, корпус, зʼєднувачі', parts_en: 'Blades, housing, connectors', efficiency: '55–60%', useCase_ua: 'Сільські відкриті простори', useCase_en: 'Rural open spaces', cost: '€1,500–€6,000', tsr: '6–8', noise: '35–45 dB(A)', setback_ua: '≥ 500м від жител', setback_en: '≥ 500m from dwellings', pros_ua: ['Найвища ефективність', 'Зріла технологія', 'Самозапуск при слабкому вітрі'], pros_en: ['Highest efficiency', 'Mature technology', 'Self-starting at low speed'], cons_ua: ['Потребує курсовий механізм', 'Чутливий до турбулентності', 'Візуальний вплив'], cons_en: ['Requires yaw mechanism', 'Sensitive to turbulence', 'Visual impact'], powerCurve_ua: 'Пуск ~3 м/с, номінал ~12 м/с, зупинка ~25 м/с. Регулювання кутом підтримує номінальну потужність вище номінальної швидкості.', powerCurve_en: 'Cut-in ~3 m/s, rated ~12 m/s, cut-out ~25 m/s. Pitch regulation maintains rated power above rated wind speed.' },
  { id: 'savonius', type_ua: 'Вертикальна вісь', type_en: 'Vertical Axis', category_ua: 'Савоніус VAWT', category_en: 'Savonius VAWT', power: '1–5 kW', parts_ua: 'Ротор, опори, вал', parts_en: 'Rotor, supports, shaft', efficiency: '40–45%', useCase_ua: 'Міські дахи', useCase_en: 'Urban rooftops', cost: '€800–€2,500', tsr: '0.8–1.2', noise: '20–30 dB(A)', setback_ua: 'Мінімальна — низький шум', setback_en: 'Minimal — low noise', pros_ua: ['Всенаправлений', 'Дуже низький шум', 'Самозапуск', 'Проста конструкція'], pros_en: ['Omnidirectional', 'Very low noise', 'Self-starting', 'Simple construction'], cons_ua: ['Низька ефективність', 'Обмежена масштабованість', 'Важкий для своєї потужності'], cons_en: ['Low efficiency', 'Limited scalability', 'Heavy for power output'], powerCurve_ua: 'Пуск ~2 м/с, добре працює при турбулентному/поривчастому вітрі. Приводиться опором — потужність обмежена λ.', powerCurve_en: 'Cut-in ~2 m/s, operates well in turbulent/gusty conditions. Drag-driven — power limited by TSR.' },
  { id: 'darrieus', type_ua: 'Вертикальна вісь', type_en: 'Vertical Axis', category_ua: "Дар'є VAWT", category_en: 'Darrieus VAWT', power: '1–5 kW', parts_ua: 'Лопаті, вертикальний корпус', parts_en: 'Blades, vertical housing', efficiency: '45–50%', useCase_ua: 'Змішані середовища', useCase_en: 'Mixed environments', cost: '€1,000–€3,000', tsr: '4–6', noise: '25–35 dB(A)', setback_ua: '≥ 100м рекомендовано', setback_en: '≥ 100m recommended', pros_ua: ['Вища ефективність ніж Савоніус', 'Компактна площа', 'Приймає вітер з будь-якого напрямку'], pros_en: ['Higher efficiency than Savonius', 'Compact footprint', 'Accepts wind from any direction'], cons_ua: ['Не самозапуск', 'Циклічні навантаження втоми', 'Проблеми вібрації при резонансі'], cons_en: ['Not self-starting', 'Cyclic fatigue stresses', 'Vibration issues at resonance'], powerCurve_ua: 'Потребує зовнішній запуск. Приводиться підйомною силою з періодичною зміною кута атаки. Пік Cp при λ ≈ 5.', powerCurve_en: 'Requires external start mechanism. Lift-driven with periodic angle-of-attack variation. Peak Cp at λ ≈ 5.' },
  { id: 'micro', type_ua: 'Мікро турбіна', type_en: 'Micro Turbine', category_ua: 'Дахова мікро HAWT', category_en: 'Rooftop Micro HAWT', power: '0.2–1 kW', parts_ua: 'Лопаті, кріплення', parts_en: 'Blades, mounts', efficiency: '30–40%', useCase_ua: 'Балкони, автодоми, човни', useCase_en: 'Balconies, RVs, boats', cost: '€100–€500', tsr: '5–7', noise: '25–35 dB(A)', setback_ua: 'Не потрібна — особисте використання', setback_en: 'None — personal use', pros_ua: ['Портативна', 'Низька вартість', 'Легка установка', 'Ідеальна для автономних систем'], pros_en: ['Portable', 'Low cost', 'Easy installation', 'Ideal for off-grid'], cons_ua: ['Дуже низька потужність', 'Вплив міської турбулентності', 'Короткий термін служби'], cons_en: ['Very low power', 'Affected by urban turbulence', 'Short lifespan'], powerCurve_ua: 'Пуск ~2.5 м/с. Малий діаметр ротора обмежує захоплення. Найкраще з постійним ламінарним потоком.', powerCurve_en: 'Cut-in ~2.5 m/s. Small rotor diameter limits capture. Best with consistent laminar flow.' },
  { id: 'hybrid', type_ua: 'Гібридна система', type_en: 'Hybrid System', category_ua: 'Вітро-сонячний гібрид', category_en: 'Wind-Solar Hybrid', power: '5–15 kW', parts_ua: 'Корпус інтеграції, інвертор', parts_en: 'Integration housing, inverter', efficiency: '50–60%', useCase_ua: 'Автономні будинки, ферми', useCase_en: 'Off-grid homes, farms', cost: '€2,500–€8,000', tsr: 'N/A', noise: '30–40 dB(A)', setback_ua: 'Залежить від типу турбіни', setback_en: 'Depends on turbine component', pros_ua: ['Взаємодоповнююча генерація', 'Вищий КВПП', 'Менше потреби в накопиченні'], pros_en: ['Complementary generation', 'Higher capacity factor', 'Reduced storage needs'], cons_ua: ['Складна інтеграція', 'Вищі початкові витрати', 'Подвійне обслуговування'], cons_en: ['Complex integration', 'Higher upfront cost', 'Dual maintenance'], powerCurve_ua: 'Комбінована віддача згладжує мінливість. Вітер піковий вночі/взимку доповнює сонячні піки вдень/влітку.', powerCurve_en: 'Combined output smooths variability. Wind peaks at night/winter complement solar peaks at day/summer.' },
];

// Simple turbine silhouette SVGs
const TurbineSilhouette = ({ type }: { type: string }) => {
  if (type === 'hawt3' || type === 'micro') {
    return (
      <svg viewBox="0 0 40 50" className="w-8 h-10 shrink-0" fill="none">
        <line x1="20" y1="20" x2="20" y2="48" stroke="hsl(var(--muted-foreground))" strokeWidth="2" opacity="0.4" />
        <line x1="20" y1="20" x2="20" y2="4" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        <line x1="20" y1="20" x2="6" y2="30" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        <line x1="20" y1="20" x2="34" y2="30" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="2" fill="hsl(var(--primary))" />
      </svg>
    );
  }
  if (type === 'savonius') {
    return (
      <svg viewBox="0 0 40 50" className="w-8 h-10 shrink-0" fill="none">
        <line x1="20" y1="5" x2="20" y2="48" stroke="hsl(var(--muted-foreground))" strokeWidth="2" opacity="0.4" />
        <path d="M20 10 Q30 15 20 25" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="hsl(var(--primary) / 0.1)" />
        <path d="M20 25 Q10 30 20 40" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="hsl(var(--primary) / 0.1)" />
      </svg>
    );
  }
  if (type === 'darrieus') {
    return (
      <svg viewBox="0 0 40 50" className="w-8 h-10 shrink-0" fill="none">
        <line x1="20" y1="5" x2="20" y2="48" stroke="hsl(var(--muted-foreground))" strokeWidth="2" opacity="0.4" />
        <ellipse cx="20" cy="25" rx="12" ry="18" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  // hybrid
  return (
    <svg viewBox="0 0 40 50" className="w-8 h-10 shrink-0" fill="none">
      <line x1="15" y1="20" x2="15" y2="48" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
      <line x1="15" y1="20" x2="15" y2="8" stroke="hsl(var(--primary))" strokeWidth="1" />
      <line x1="15" y1="20" x2="7" y2="26" stroke="hsl(var(--primary))" strokeWidth="1" />
      <line x1="15" y1="20" x2="23" y2="26" stroke="hsl(var(--primary))" strokeWidth="1" />
      <circle cx="15" cy="20" r="1.5" fill="hsl(var(--primary))" />
      <rect x="26" y="30" width="10" height="8" rx="1" stroke="hsl(60 80% 55%)" strokeWidth="1" fill="hsl(60 80% 55% / 0.15)" />
      <line x1="28" y1="32" x2="28" y2="36" stroke="hsl(60 80% 55%)" strokeWidth="0.5" opacity="0.5" />
      <line x1="31" y1="32" x2="31" y2="36" stroke="hsl(60 80% 55%)" strokeWidth="0.5" opacity="0.5" />
      <line x1="34" y1="32" x2="34" y2="36" stroke="hsl(60 80% 55%)" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
};

export const TurbineCategories = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1">{L('Категорії побутових вітротурбін', 'Household Wind Turbine Categories')}</h2>
        <p className="text-xs text-muted-foreground mb-4">
          {L('Порівняння архітектур турбін з аеродинамічними показниками, шумовими характеристиками та практичними рекомендаціями розгортання.',
             'Comparison of turbine architectures with aerodynamic performance metrics, noise characteristics, and practical deployment guidelines.')}
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.05)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
            <p className="text-xs font-semibold text-primary mb-1">HAWT</p>
            <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5">
              <li>• {L('Вищий Cp (до 0.50)', 'Higher Cp (up to 0.50)')}</li>
              <li>• {L('Потребує курсовий контроль', 'Requires yaw control')}</li>
              <li>• {L('Чутливий до турбулентності', 'Sensitive to turbulence')}</li>
              <li>• {L('Краще у масштабі', 'Better at scale')}</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.3)' }}>
            <p className="text-xs font-semibold text-foreground mb-1">VAWT</p>
            <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5">
              <li>• {L('Всенаправлений', 'Omnidirectional')}</li>
              <li>• {L('Краще при турбулентності', 'Better in turbulence')}</li>
              <li>• {L('Нижчий рівень шуму', 'Lower noise profile')}</li>
              <li>• {L('Простіша механіка', 'Simpler mechanics')}</li>
            </ul>
          </div>
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
                      <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">{lang === 'ua' ? turbine.type_ua : turbine.type_en}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{turbine.power}</span>
                      <span className="flex items-center gap-1"><Wind className="w-3 h-3" />η {turbine.efficiency}</span>
                      <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" />{turbine.noise}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-primary shrink-0">{turbine.cost}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: L('λ (TSR)', 'TSR (λ)'), value: turbine.tsr },
                      { label: L('Відступ', 'Setback'), value: lang === 'ua' ? turbine.setback_ua : turbine.setback_en },
                      { label: L('3D-друк деталі', '3D Printed Parts'), value: lang === 'ua' ? turbine.parts_ua : turbine.parts_en },
                      { label: L('Оптимальне використання', 'Best Use'), value: lang === 'ua' ? turbine.useCase_ua : turbine.useCase_en },
                    ].map((spec, i) => (
                      <div key={i} className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                        <span className="text-muted-foreground text-[10px]">{spec.label}</span>
                        <p className="text-foreground">{spec.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
                    <p className="text-[10px] font-semibold text-primary mb-1">{L('Поведінка кривої потужності', 'Power Curve Behavior')}</p>
                    <p className="text-[11px] text-muted-foreground">{lang === 'ua' ? turbine.powerCurve_ua : turbine.powerCurve_en}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] font-semibold text-primary mb-1">{L('Переваги', 'Advantages')}</p>
                      <ul className="text-[11px] text-muted-foreground space-y-0.5">
                        {(lang === 'ua' ? turbine.pros_ua : turbine.pros_en).map((p, i) => <li key={i}>+ {p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold mb-1" style={{ color: 'hsl(0 60% 55%)' }}>{L('Обмеження', 'Limitations')}</p>
                      <ul className="text-[11px] text-muted-foreground space-y-0.5">
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
