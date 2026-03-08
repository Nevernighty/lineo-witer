import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, Wind, Zap, TrendingUp, 
  MapPin, Factory, Leaf, Target, Calendar
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

const regions = [
  { name_ua: 'Запорізька область', name_en: 'Zaporizhzhia Oblast', potential_ua: 'Дуже високий', potential_en: 'Very High', speed: '7.5–8.5', capacity: '2,500 MW', status: 'operational' },
  { name_ua: 'Херсонська область', name_en: 'Kherson Oblast', potential_ua: 'Дуже високий', potential_en: 'Very High', speed: '7.0–8.0', capacity: '1,800 MW', status: 'operational' },
  { name_ua: 'Миколаївська область', name_en: 'Mykolaiv Oblast', potential_ua: 'Високий', potential_en: 'High', speed: '6.5–7.5', capacity: '1,200 MW', status: 'developing' },
  { name_ua: 'Одеська область', name_en: 'Odesa Oblast', potential_ua: 'Високий', potential_en: 'High', speed: '6.5–7.5', capacity: '1,500 MW', status: 'developing' },
  { name_ua: 'Львівська область', name_en: 'Lviv Oblast', potential_ua: 'Середній', potential_en: 'Medium', speed: '5.5–6.5', capacity: '600 MW', status: 'planned' },
  { name_ua: 'Карпати', name_en: 'Carpathian Mtns', potential_ua: 'Середньо-високий', potential_en: 'Medium-High', speed: '6.0–7.0', capacity: '800 MW', status: 'planned' },
];

const seasonalData = [
  { month_ua: 'Січ', month_en: 'Jan', speed: 8.2 }, { month_ua: 'Лют', month_en: 'Feb', speed: 7.8 },
  { month_ua: 'Бер', month_en: 'Mar', speed: 7.1 }, { month_ua: 'Кві', month_en: 'Apr', speed: 6.2 },
  { month_ua: 'Тра', month_en: 'May', speed: 5.4 }, { month_ua: 'Чер', month_en: 'Jun', speed: 4.8 },
  { month_ua: 'Лип', month_en: 'Jul', speed: 4.5 }, { month_ua: 'Сер', month_en: 'Aug', speed: 4.7 },
  { month_ua: 'Вер', month_en: 'Sep', speed: 5.6 }, { month_ua: 'Жов', month_en: 'Oct', speed: 6.5 },
  { month_ua: 'Лис', month_en: 'Nov', speed: 7.4 }, { month_ua: 'Гру', month_en: 'Dec', speed: 8.0 },
];

const statusLabels: Record<string, { ua: string; en: string }> = {
  operational: { ua: 'Діючий', en: 'Operational' },
  developing: { ua: 'Розвивається', en: 'Developing' },
  planned: { ua: 'Плановий', en: 'Planned' },
};

export const UkraineWindPotential = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="space-y-4">
      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Wind, title: L('Технічний потенціал', 'Technical Potential'), value: '438 TWh/yr', sub: L('Національна оцінка 2023', 'National assessment 2023'), color: 'hsl(120 100% 54%)' },
          { icon: Factory, title: L('Встановлено (2023)', 'Installed (2023)'), value: '1.67 GW', sub: L('Активна потужність ВЕС', 'Active wind capacity'), color: 'hsl(210 90% 60%)' },
          { icon: Target, title: L('Ціль 2030', '2030 Target'), value: '10 GW', sub: L('Національний план', 'National energy plan'), color: 'hsl(25 90% 55%)' },
          { icon: Leaf, title: L('Ціль CO₂', 'CO₂ Target'), value: '−65%', sub: L('відн. 1990 до 2030 (NDC2)', 'vs 1990 by 2030 (NDC2)'), color: 'hsl(270 70% 60%)' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="stalker-card p-3 sm:p-4" style={{ borderLeftWidth: '3px', borderLeftColor: card.color }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                <span className="text-[10px] text-muted-foreground uppercase">{card.title}</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-[10px] text-muted-foreground">{card.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Wind Speed Legend */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          {L('Розподіл вітрового ресурсу (100м)', 'Wind Resource Distribution (100m)')}
        </h3>
        {/* Color legend */}
        <div className="flex items-center gap-1 mb-3">
          <span className="text-[9px] text-muted-foreground">{L('Слабкий', 'Low')}</span>
          {['hsl(210 30% 40%)', 'hsl(120 40% 40%)', 'hsl(60 70% 45%)', 'hsl(30 80% 50%)', 'hsl(0 70% 50%)'].map((c, i) => (
            <div key={i} className="flex-1 h-2 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[9px] text-muted-foreground">{L('Сильний', 'Strong')}</span>
        </div>
        <div className="space-y-2">
          {[
            { range: '> 8.0 m/s', percent: 5 }, { range: '7.0–8.0 m/s', percent: 15 },
            { range: '6.0–7.0 m/s', percent: 30 }, { range: '5.0–6.0 m/s', percent: 35 },
            { range: '< 5.0 m/s', percent: 15 },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs w-24 shrink-0 font-mono">{item.range}</span>
              <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(222 28% 12%)' }}>
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${item.percent}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 15, delay: i * 0.1 }}
                  style={{ background: 'hsl(var(--primary))', boxShadow: '0 0 6px hsl(var(--primary) / 0.4)' }} />
              </div>
              <span className="text-[10px] text-muted-foreground w-8 text-right">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Regions */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> {L('Ключові регіони', 'Key Regions')}
        </h3>
        <div className="space-y-2">
          {regions.map((region, i) => (
            <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{lang === 'ua' ? region.name_ua : region.name_en}</span>
                <Badge variant="outline" className={`text-[10px] ${
                  region.status === 'operational' ? 'bg-primary/10 text-primary border-primary/30' :
                  region.status === 'developing' ? 'bg-secondary/20 text-foreground border-secondary/30' :
                  'bg-muted/10 text-muted-foreground border-border/30'
                }`}>{statusLabels[region.status][lang]}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                <span className="font-mono">{region.speed} {L('м/с', 'm/s')}</span><span>·</span>
                <span>{region.capacity} {L('потужність', 'capacity')}</span><span>·</span>
                <span>{lang === 'ua' ? region.potential_ua : region.potential_en}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal Variation */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> {L('Сезонна варіація вітру (Південь України)', 'Seasonal Wind Variation (Southern Ukraine)')}
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {seasonalData.map((m, i) => (
            <div key={i} className="p-2 rounded-lg text-center border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.15)' }}>
              <p className="text-[10px] text-muted-foreground">{lang === 'ua' ? m.month_ua : m.month_en}</p>
              <p className="text-xs font-mono font-bold text-foreground">{m.speed}</p>
              <div className="h-1 rounded-full mt-1 mx-auto" style={{
                width: `${(m.speed / 8.5) * 100}%`,
                background: 'hsl(var(--primary))',
                opacity: 0.4 + (m.speed / 8.5) * 0.6,
                boxShadow: '0 0 4px hsl(var(--primary) / 0.3)',
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Strategy */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> {L('Енергетична стратегія та інтеграція з ЄС', 'Energy Strategy & EU Integration')}
        </h3>
        <div className="space-y-2">
          {[
            { title: L('Узгодження з Green Deal', 'Green Deal Alignment'), text: L('Україна ставить за мету 25% частку ВДЕ до 2030 р., узгоджуючись з Європейським зеленим курсом.', 'Ukraine targets 25% renewable share by 2030, aligning with European Green Deal.') },
            { title: L('Синхронізація з ENTSO-E', 'ENTSO-E Synchronization'), text: L('Синхронізація мережі з континентальною Європою (березень 2022) уможливлює експорт електроенергії.', 'Grid synchronization with continental Europe (March 2022) enables electricity exports.') },
            { title: L('Зелений водень', 'Green Hydrogen'), text: L('Виробництво водню з вітру прогнозується зробити Україну ключовим постачальником зеленого водню для ЄС.', 'Wind-to-hydrogen production projected to make Ukraine a key green hydrogen supplier to EU.') },
          ].map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <p className="text-xs font-semibold text-foreground">{item.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
          <p className="text-[10px] font-semibold text-foreground mb-2">{L('Хронологія розвитку', 'Development Timeline')}</p>
          <div className="flex items-center justify-between text-[10px]">
            {[
              { year: '2019', val: '1.2 GW' }, { year: '2023', val: '1.67 GW' },
              { year: '2030', val: '10 GW', highlight: true }, { year: '2050', val: '70% RES' },
            ].map((t, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="flex-1 h-0.5 mx-1" style={{ background: 'linear-gradient(90deg, hsl(var(--primary) / 0.5), hsl(var(--primary) / 0.2))' }} />}
                <div className="text-center">
                  <Badge variant={t.highlight ? 'default' : 'outline'} className={`text-[9px] mb-0.5 ${!t.highlight ? 'border-primary/30 bg-primary/5 text-primary' : ''}`}>
                    {t.year}
                  </Badge>
                  <p className={t.highlight ? 'font-medium text-foreground' : 'text-muted-foreground'}>{t.val}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Accordions */}
      {[
        { value: 'grid', icon: Zap, title: L('Інтеграція в мережу та регулювання частоти', 'Grid Integration & Frequency Regulation'), items: [
          { title: L('Регулювання частоти', 'Frequency Regulation'), text: L('Українська мережа працює на 50 Гц ±0.2 Гц. Сучасні вітротурбіни забезпечують синтетичну інерцію та первинне регулювання частоти протягом 200мс.', 'Ukrainian grid operates at 50 Hz ±0.2 Hz. Modern wind turbines provide synthetic inertia and primary frequency response within 200ms.') },
          { title: L('Балансуючі ринки', 'Balancing Markets'), text: L('ВЕС беруть участь у ринках на добу наперед, внутрішньоденних та балансуючих. Штрафи за дисбаланс стимулюють точне прогнозування.', 'Wind plants participate in day-ahead, intraday, and balancing markets. Imbalance penalties incentivize accurate forecasting.') },
          { title: L('Обмеження та накопичення', 'Curtailment & Storage'), text: L('Перевантаження мережі на півдні спричиняє 5–10% обмеження. Зʼявляються проєкти акумуляторних батарей.', 'Grid congestion in southern regions causes 5–10% curtailment. Battery storage projects emerging.') },
          { title: L('Точність прогнозування', 'Forecasting Accuracy'), text: L('MCP-методи досягають ±5% річної точності P50. Прогнози на добу використовують NWP-моделі з ±15% RMSE.', 'MCP methods achieve ±5% annual P50 accuracy. Day-ahead forecasts use NWP models with ±15% RMSE.') },
        ]},
        { value: 'windrose', icon: Wind, title: L('Розуміння діаграм вітрової рози', 'Understanding Wind Rose Diagrams'), items: [
          { title: L('Зима (ПнЗх домінування)', 'Winter (NW dominant)'), text: L('Сильні, стабільні ПнЗх вітри від континентальних антициклонів. 35–40% річної енергії.', 'Strong, consistent NW winds from continental high-pressure systems. 35–40% of annual energy.') },
          { title: L('Літо (Змінні)', 'Summer (Variable)'), text: L('Термічна конвекція створює денні ПдЗх морські бризи. Нижчі швидкості, але добре для VAWT.', 'Thermal convection creates afternoon SW sea breezes. Lower speeds but good for VAWT sites.') },
        ]},
      ].map(section => (
        <Accordion key={section.value} type="single" collapsible>
          <AccordionItem value={section.value} className="border-0">
            <div className="stalker-card overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <section.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-semibold">{section.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-2">
                {section.items.map((item, i) => (
                  <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                    <p className="text-[10px] font-semibold text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.text}</p>
                  </div>
                ))}
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>
      ))}
    </div>
  );
};
