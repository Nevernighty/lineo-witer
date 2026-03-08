import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, Wind, Zap, TrendingUp, 
  MapPin, Factory, Leaf, Target, Calendar, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

// Seasonal bar chart
const SeasonalBarChart = ({ lang }: { lang: 'ua' | 'en' }) => {
  const W = 420, H = 200, pad = { l: 40, r: 10, t: 15, b: 35 };
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  const maxSpeed = 9;
  const barW = plotW / 12 - 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 sm:h-52">
      {[4, 5, 6, 7, 8].map(v => (
        <g key={v}>
          <line x1={pad.l} y1={pad.t + plotH - ((v) / maxSpeed) * plotH} x2={W - pad.r} y2={pad.t + plotH - ((v) / maxSpeed) * plotH} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.12" />
          <text x={pad.l - 4} y={pad.t + plotH - ((v) / maxSpeed) * plotH + 4} textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{v}</text>
        </g>
      ))}
      <line x1={pad.l} y1={pad.t + plotH} x2={W - pad.r} y2={pad.t + plotH} stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.3" />
      {seasonalData.map((m, i) => {
        const x = pad.l + i * (plotW / 12) + 2;
        const barH = (m.speed / maxSpeed) * plotH;
        const y = pad.t + plotH - barH;
        const intensity = 0.3 + (m.speed / 8.5) * 0.7;
        return (
          <g key={i}>
            <motion.rect x={x} y={y} width={barW} height={barH} rx="2"
              fill="hsl(var(--primary))" opacity={intensity}
              initial={{ height: 0, y: pad.t + plotH }} animate={{ height: barH, y }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 3px hsl(var(--primary) / ${intensity * 0.4}))` }} />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(var(--foreground))" fontFamily="monospace">{m.speed}</text>
            <text x={x + barW / 2} y={H - pad.b + 14} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">{lang === 'ua' ? m.month_ua : m.month_en}</text>
          </g>
        );
      })}
      <text x={12} y={(pad.t + pad.t + plotH) / 2} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" transform={`rotate(-90 12 ${(pad.t + pad.t + plotH) / 2})`}>{lang === 'ua' ? 'м/с' : 'm/s'}</text>
    </svg>
  );
};

// Wind Rose SVG
const WindRoseSVG = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const cx = 100, cy = 100, R = 80;
  const directions = [
    { label: L('Пн', 'N'), angle: 0, winter: 0.15, summer: 0.08 },
    { label: L('ПнСх', 'NE'), angle: 45, winter: 0.08, summer: 0.06 },
    { label: L('Сх', 'E'), angle: 90, winter: 0.06, summer: 0.10 },
    { label: L('ПдСх', 'SE'), angle: 135, winter: 0.05, summer: 0.12 },
    { label: L('Пд', 'S'), angle: 180, winter: 0.04, summer: 0.10 },
    { label: L('ПдЗх', 'SW'), angle: 225, winter: 0.10, summer: 0.25 },
    { label: L('Зх', 'W'), angle: 270, winter: 0.15, summer: 0.18 },
    { label: L('ПнЗх', 'NW'), angle: 315, winter: 0.37, summer: 0.11 },
  ];

  const polarToXY = (angle: number, r: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r];
  };

  const makePolygon = (key: 'winter' | 'summer') => {
    return directions.map(d => {
      const [x, y] = polarToXY(d.angle, d[key] * R * 2.2);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <svg viewBox="0 0 200 210" className="w-full h-48 sm:h-56">
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <circle key={f} cx={cx} cy={cy} r={R * f} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.15" />
      ))}
      {/* Axis lines */}
      {directions.map(d => {
        const [x, y] = polarToXY(d.angle, R);
        return <line key={d.angle} x1={cx} y1={cy} x2={x} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.1" />;
      })}
      {/* Winter polygon */}
      <polygon points={makePolygon('winter')} fill="hsl(210 90% 60%)" opacity="0.15" stroke="hsl(210 90% 60%)" strokeWidth="1.5" />
      {/* Summer polygon */}
      <polygon points={makePolygon('summer')} fill="hsl(25 90% 55%)" opacity="0.12" stroke="hsl(25 90% 55%)" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Direction labels */}
      {directions.map(d => {
        const [x, y] = polarToXY(d.angle, R + 12);
        return <text key={d.angle} x={x} y={y + 3} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{d.label}</text>;
      })}
      {/* Legend */}
      <rect x={10} y={195} width="10" height="3" rx="1" fill="hsl(210 90% 60%)" opacity="0.7" />
      <text x={24} y={199} fontSize="8" fill="hsl(210 90% 60%)">{L('Зима', 'Winter')}</text>
      <rect x={70} y={195} width="10" height="3" rx="1" fill="hsl(25 90% 55%)" opacity="0.7" />
      <text x={84} y={199} fontSize="8" fill="hsl(25 90% 55%)">{L('Літо', 'Summer')}</text>
    </svg>
  );
};

// Expandable section
const ExpandableSection = ({ title, icon: Icon, children, color = 'hsl(var(--primary))' }: { title: string; icon: any; children: React.ReactNode; color?: string }) => {
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

export const UkraineWindPotential = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="space-y-4 eng-scrollbar">
      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Wind, title: L('Технічний потенціал', 'Technical Potential'), value: '438 TWh/yr', sub: L('Національна оцінка 2023', 'National assessment 2023'), color: 'hsl(120 100% 54%)' },
          { icon: Factory, title: L('Встановлено (2023)', 'Installed (2023)'), value: '1.67 GW', sub: L('Активна потужність ВЕС', 'Active wind capacity'), color: 'hsl(210 90% 60%)' },
          { icon: Target, title: L('Ціль 2030', '2030 Target'), value: '10 GW', sub: L('Національний план', 'National energy plan'), color: 'hsl(25 90% 55%)' },
          { icon: Leaf, title: L('Ціль CO₂', 'CO₂ Target'), value: '−65%', sub: L('відн. 1990 до 2030 (NDC2)', 'vs 1990 by 2030 (NDC2)'), color: 'hsl(270 70% 60%)' },
        ].map((card, i) => {
          const CardIcon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="stalker-card p-3 sm:p-4" style={{ borderLeftWidth: '3px', borderLeftColor: card.color }}>
              <div className="flex items-center gap-1.5 mb-1">
                <CardIcon className="w-3.5 h-3.5" style={{ color: card.color }} />
                <span className="text-[10px] sm:text-xs text-muted-foreground uppercase">{card.title}</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{card.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Wind Resource Distribution */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          {L('Розподіл вітрового ресурсу (100м)', 'Wind Resource Distribution (100m)')}
        </h3>
        <div className="flex items-center gap-1 mb-3">
          <span className="text-[9px] text-muted-foreground">{L('Слабкий', 'Low')}</span>
          {['hsl(210 30% 40%)', 'hsl(120 40% 40%)', 'hsl(60 70% 45%)', 'hsl(30 80% 50%)', 'hsl(0 70% 50%)'].map((c, i) => (
            <div key={i} className="flex-1 h-2.5 rounded-sm" style={{ backgroundColor: c }} />
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
              <span className="text-xs w-24 shrink-0 font-mono">{item.range}</span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(222 28% 12%)' }}>
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${item.percent}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 15, delay: i * 0.1 }}
                  style={{ background: 'hsl(var(--primary))', boxShadow: '0 0 6px hsl(var(--primary) / 0.4)' }} />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wind Rose */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
          <Wind className="w-4 h-4 text-primary" /> {L('Вітрова роза — сезонні напрямки', 'Wind Rose — Seasonal Directions')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Зима: домінування ПнЗх вітрів від континентальних антициклонів. Літо: ПдЗх морські бризи.', 
             'Winter: dominant NW winds from continental highs. Summer: SW sea breezes.')}
        </p>
        <div className="rounded-lg p-3 flex justify-center" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <WindRoseSVG lang={lang} />
        </div>
      </div>

      {/* Regions */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> {L('Ключові регіони', 'Key Regions')}
        </h3>
        <div className="space-y-2">
          {regions.map((region, i) => (
            <div key={i} className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium">{lang === 'ua' ? region.name_ua : region.name_en}</span>
                <Badge variant="outline" className={`text-xs ${
                  region.status === 'operational' ? 'bg-primary/10 text-primary border-primary/30' :
                  region.status === 'developing' ? 'bg-secondary/20 text-foreground border-secondary/30' :
                  'bg-muted/10 text-muted-foreground border-border/30'
                }`}>{statusLabels[region.status][lang]}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="font-mono">{region.speed} {L('м/с', 'm/s')}</span><span>·</span>
                <span>{region.capacity} {L('потужність', 'capacity')}</span><span>·</span>
                <span>{lang === 'ua' ? region.potential_ua : region.potential_en}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal Bar Chart */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> {L('Сезонна варіація вітру (Південь України)', 'Seasonal Wind Variation (Southern Ukraine)')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Середня швидкість вітру на 100м за місяцями. Зима — пік виробництва, літо — мінімум.', 
             'Mean wind speed at 100m by month. Winter — peak production, summer — minimum.')}
        </p>
        <div className="rounded-lg p-2" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <SeasonalBarChart lang={lang} />
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
            <div key={i} className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <p className="text-xs sm:text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
          <p className="text-xs font-semibold text-foreground mb-2">{L('Хронологія розвитку', 'Development Timeline')}</p>
          <div className="flex items-center justify-between text-xs">
            {[
              { year: '2019', val: '1.2 GW' }, { year: '2023', val: '1.67 GW' },
              { year: '2030', val: '10 GW', highlight: true }, { year: '2050', val: '70% RES' },
            ].map((t, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="flex-1 h-0.5 mx-1" style={{ background: 'linear-gradient(90deg, hsl(var(--primary) / 0.5), hsl(var(--primary) / 0.2))' }} />}
                <div className="text-center">
                  <Badge variant={t.highlight ? 'default' : 'outline'} className={`text-[10px] mb-0.5 ${!t.highlight ? 'border-primary/30 bg-primary/5 text-primary' : ''}`}>
                    {t.year}
                  </Badge>
                  <p className={t.highlight ? 'font-medium text-foreground' : 'text-muted-foreground'}>{t.val}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable sections instead of accordions */}
      <div className="space-y-2">
        <ExpandableSection title={L('Інтеграція в мережу та регулювання частоти', 'Grid Integration & Frequency Regulation')} icon={Zap} color="hsl(120 70% 50%)">
          <div className="space-y-2">
            {[
              { title: L('Регулювання частоти', 'Frequency Regulation'), text: L('Українська мережа працює на 50 Гц ±0.2 Гц. Сучасні вітротурбіни забезпечують синтетичну інерцію протягом 200мс.', 'Ukrainian grid operates at 50 Hz ±0.2 Hz. Modern turbines provide synthetic inertia within 200ms.') },
              { title: L('Балансуючі ринки', 'Balancing Markets'), text: L('ВЕС беруть участь у ринках на добу наперед та балансуючих. Штрафи стимулюють точне прогнозування.', 'Wind plants participate in day-ahead and balancing markets. Imbalance penalties incentivize forecasting.') },
              { title: L('Обмеження та накопичення', 'Curtailment & Storage'), text: L('Перевантаження мережі на півдні — 5–10% обмеження. Зʼявляються проєкти батарей.', 'Grid congestion in south causes 5–10% curtailment. Battery projects emerging.') },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </ExpandableSection>

        <ExpandableSection title={L('Сезонні вітрові патерни', 'Seasonal Wind Patterns')} icon={Wind} color="hsl(210 90% 60%)">
          <div className="space-y-2">
            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(210 90% 60% / 0.2)' }}>
              <p className="text-xs font-semibold" style={{ color: 'hsl(210 90% 60%)' }}>{L('Зима (ПнЗх домінування)', 'Winter (NW dominant)')}</p>
              <p className="text-xs text-muted-foreground mt-1">{L('Сильні ПнЗх вітри від континентальних антициклонів. 35–40% річної енергії. Середня швидкість 7.5–8.5 м/с.', 'Strong NW winds from continental highs. 35–40% of annual energy. Mean speed 7.5–8.5 m/s.')}</p>
            </div>
            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(25 90% 55% / 0.2)' }}>
              <p className="text-xs font-semibold" style={{ color: 'hsl(25 90% 55%)' }}>{L('Літо (Змінні)', 'Summer (Variable)')}</p>
              <p className="text-xs text-muted-foreground mt-1">{L('Термічна конвекція створює ПдЗх морські бризи. Нижчі швидкості 4.5–5.5 м/с. Добре для VAWT.', 'Thermal convection creates SW sea breezes. Lower speeds 4.5–5.5 m/s. Good for VAWT.')}</p>
            </div>
          </div>
        </ExpandableSection>
      </div>
    </div>
  );
};
