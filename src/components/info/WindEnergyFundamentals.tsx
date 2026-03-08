import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Wind, Zap, TrendingUp, Gauge, 
  ArrowRight, AlertCircle, CheckCircle, Info, Layers
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.3 } }),
};

// Power Curve SVG — animated P ∝ V³
const PowerCurveSVG = ({ lang }: { lang: 'ua' | 'en' }) => {
  const points: string[] = [];
  for (let v = 0; v <= 25; v += 0.5) {
    const p = v < 3 ? 0 : v > 15 ? 100 : Math.min(100, ((v - 3) / 12) ** 3 * 100);
    const x = 20 + (v / 25) * 260;
    const y = 130 - p * 1.1;
    points.push(`${x},${y}`);
  }
  return (
    <svg viewBox="0 0 300 160" className="w-full h-32">
      {/* Grid */}
      {[0, 25, 50, 75, 100].map(p => (
        <line key={p} x1="20" y1={130 - p * 1.1} x2="280" y2={130 - p * 1.1} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.2" />
      ))}
      {/* Axes */}
      <line x1="20" y1="130" x2="280" y2="130" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.4" />
      <line x1="20" y1="20" x2="20" y2="130" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.4" />
      {/* Power curve */}
      <polyline points={points.join(' ')} fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
        strokeDasharray="500" strokeDashoffset="500" style={{ animation: 'drawCurve 1.5s ease-out forwards' }} />
      {/* Fill under curve */}
      <polygon points={`20,130 ${points.join(' ')} 280,130`} fill="hsl(var(--primary))" opacity="0.05" />
      {/* Labels */}
      <text x="150" y="150" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{lang === 'ua' ? 'Швидкість вітру (м/с)' : 'Wind Speed (m/s)'}</text>
      <text x="8" y="75" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))" transform="rotate(-90 8 75)">P (%)</text>
      {/* Zone labels */}
      <text x="55" y="145" textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))">{lang === 'ua' ? 'Пуск' : 'Cut-in'}</text>
      <text x="180" y="40" textAnchor="middle" fontSize="6" fill="hsl(var(--primary))">{lang === 'ua' ? 'Кубічна зона' : 'Cubic zone'}</text>
      <text x="250" y="40" textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))">{lang === 'ua' ? 'Номінал' : 'Rated'}</text>
      {/* Cut-in line */}
      <line x1="56" y1="20" x2="56" y2="130" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
    </svg>
  );
};

// Betz Limit Gauge
const BetzGauge = ({ lang }: { lang: 'ua' | 'en' }) => {
  const betzPct = 59.3;
  const practicalPct = 47;
  const r = 40;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28">
      <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="8" opacity="0.1" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(210 90% 60%)" strokeWidth="8"
        strokeDasharray={`${(betzPct / 100) * circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{ filter: 'drop-shadow(0 0 4px hsl(210 90% 60% / 0.4))', transition: 'stroke-dasharray 1s ease' }} />
      <circle cx="50" cy="50" r={r - 10} fill="none" stroke="hsl(var(--primary))" strokeWidth="5"
        strokeDasharray={`${(practicalPct / 100) * (2 * Math.PI * (r - 10))} ${2 * Math.PI * (r - 10)}`} strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.4))', transition: 'stroke-dasharray 1.2s ease' }} />
      <text x="50" y="46" textAnchor="middle" fontSize="11" fontWeight="bold" fill="hsl(var(--foreground))" fontFamily="monospace">59.3%</text>
      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">{lang === 'ua' ? 'Ліміт Бетца' : 'Betz Limit'}</text>
    </svg>
  );
};

export const WindEnergyFundamentals = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="space-y-4">
      <style>{`@keyframes drawCurve { to { stroke-dashoffset: 0; } }`}</style>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Wind, title: L('Формула потужності', 'Power Formula'), value: 'P = ½ρAV³', sub: L('Кубічна залежність від швидкості', 'Cubic wind speed relationship'), color: 'hsl(120 100% 54%)' },
          { icon: Gauge, title: L('Ліміт Бетца', 'Betz Limit'), value: '59.3%', sub: L('Макс. теоретична ефективність', 'Max theoretical efficiency'), color: 'hsl(210 90% 60%)' },
          { icon: TrendingUp, title: L('Сучасний HAWT', 'Modern HAWT'), value: '45-50%', sub: L('Практична ефективність', 'Practical efficiency'), color: 'hsl(25 90% 55%)' },
          { icon: Zap, title: L('Коеф. використання', 'Capacity Factor'), value: '25-45%', sub: L('Типова продуктивність ВЕС', 'Typical wind farm output'), color: 'hsl(270 70% 60%)' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} custom={i} initial="hidden" animate="visible" variants={cardVariants}
              className="stalker-card p-3 sm:p-4" style={{ borderLeftWidth: '3px', borderLeftColor: card.color }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">{card.title}</span>
              </div>
              <p className="text-base sm:text-lg font-mono font-bold text-foreground">{card.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Power Curve Visualization */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          {L('Крива потужності P ∝ V³', 'Power Curve P ∝ V³')}
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          {L('Потужність зростає кубічно зі швидкістю вітру: подвоєння V збільшує P у 8 разів.', 
             'Power grows cubically with wind speed: doubling V increases P by 8×.')}
        </p>
        <div className="rounded-lg p-2" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <PowerCurveSVG lang={lang} />
        </div>
      </motion.div>

      {/* Betz Limit Visual + Power Equation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="stalker-card p-4 flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-2">{L('Ліміт Бетца', 'Betz Limit')}</h3>
          <BetzGauge lang={lang} />
          <div className="flex gap-3 mt-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(210 90% 60%)' }} />{L('Теорія', 'Theory')}: 59.3%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />{L('Практика', 'Practice')}: ~47%</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="stalker-card p-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Wind className="w-4 h-4 text-primary" />
            {L('Рівняння потужності', 'Power Equation')}
          </h3>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
            <p className="text-lg font-mono text-center text-primary" style={{ textShadow: '0 0 12px hsl(var(--primary) / 0.3)' }}>
              P = ½ · ρ · A · V³ · Cp
            </p>
          </div>
          <div className="space-y-1 mt-2 text-[11px]">
            {[
              { sym: 'P', desc: L('Потужність (Вт)', 'Power output (Watts)') },
              { sym: 'ρ', desc: L('Густина повітря (1.225 кг/м³)', 'Air density (1.225 kg/m³)') },
              { sym: 'A', desc: L('Площа ометання (πr²)', 'Swept area (πr²)') },
              { sym: 'V', desc: L('Швидкість вітру (м/с)', 'Wind speed (m/s)') },
              { sym: 'Cp', desc: L('Коеф. потужності (0.35–0.45)', 'Power coefficient (0.35–0.45)') },
            ].map((item, i) => (
              <div key={i} className="flex justify-between py-0.5 border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.2)' }}>
                <span className="font-mono text-primary">{item.sym}</span>
                <span className="text-muted-foreground">{item.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Key insights */}
      <div className="grid gap-2">
        {[
          { icon: Info, color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.05)', border: 'hsl(var(--primary) / 0.2)', title: L('Кубічна залежність', 'Cubic Relationship'), text: L('Подвоєння швидкості вітру збільшує потужність у 8 разів. Це робить вибір місця критичним для економічної доцільності.', 'Doubling wind speed increases power by 8×. This makes site selection critical for economic viability.') },
          { icon: CheckCircle, color: 'hsl(var(--foreground))', bg: 'hsl(222 28% 15%)', border: 'hsl(var(--border) / 0.3)', title: L('Вплив площі ометання', 'Swept Area Impact'), text: L('Подвоєння довжини лопаті збільшує потужність у 4 рази. Сучасні турбіни досягають 107м довжини лопатей.', 'Doubling blade length quadruples power output. Modern turbines reach 107m blade lengths.') },
          { icon: AlertCircle, color: 'hsl(var(--foreground))', bg: 'hsl(222 28% 15%)', border: 'hsl(var(--border) / 0.3)', title: L('Фактор густини', 'Air Density Factor'), text: L('Холодне повітря густіше — більше потужності. Високогірні ділянки втрачають ~3% на кожні 1000м висоти.', 'Cold air is denser, producing more power. High altitude sites lose ~3% per 1000m elevation.') },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: item.bg, borderColor: item.border }}>
              <div className="flex items-start gap-2">
                <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: item.color }} />
                <div>
                  <p className="text-xs sm:text-sm font-medium" style={{ color: item.color }}>{item.title}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{item.text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wind Shear Profile */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          {L('Профіль зсуву вітру', 'Wind Shear Profile')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Швидкість вітру зростає з висотою через зменшення поверхневого тертя. Степеневий закон моделює цю залежність:', 
             'Wind speed increases with height due to reduced surface friction. The power law models this relationship:')}
        </p>
        <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
          <p className="text-lg font-mono text-center text-primary" style={{ textShadow: '0 0 8px hsl(var(--primary) / 0.3)' }}>
            V = V<sub>ref</sub> · (h / h<sub>ref</sub>)<sup>α</sup>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { terrain: L('Гладкий (море)', 'Smooth terrain (sea)'), alpha: 'α = 0.10–0.12' },
            { terrain: L('Відкритий луг', 'Open grassland'), alpha: 'α = 0.14–0.16' },
            { terrain: L('Приміська зона', 'Suburban areas'), alpha: 'α = 0.20–0.30' },
            { terrain: L('Місто / ліс', 'Urban / forest'), alpha: 'α = 0.30–0.40' },
          ].map((item, i) => (
            <div key={i} className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <span className="text-muted-foreground">{item.terrain}</span>
              <p className="font-mono text-foreground mt-0.5">{item.alpha}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Wind Speed Classification */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3">{L('Класи вітру IEC 61400', 'IEC 61400 Wind Classes')}</h3>
        <div className="space-y-2">
          {[
            { class: 'I', speed: '10.0', turbulence: L('Висока (A: 16%)', 'High (A: 16%)'), desc: L('Морські, відкриті прибережні', 'Offshore, exposed coastal') },
            { class: 'II', speed: '8.5', turbulence: L('Середня (B: 14%)', 'Medium (B: 14%)'), desc: L('Рівнинна місцевість', 'Flat terrain, open plains') },
            { class: 'III', speed: '7.5', turbulence: L('Низька (C: 12%)', 'Low (C: 12%)'), desc: L('Складний рельєф', 'Complex terrain, lower wind') },
            { class: 'S', speed: L('Спец.', 'Custom'), turbulence: L('Індивідуальна', 'Site-specific'), desc: L('Особливі умови проектування', 'Special design conditions') },
          ].map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/5">
                  {L('Клас', 'Class')} {item.class}
                </Badge>
                <span className="font-mono text-xs text-foreground">{item.speed} {lang === 'ua' ? 'м/с' : 'm/s'}</span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{L('Турбулентність', 'Turbulence')}: {item.turbulence}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Turbulence Intensity */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3">{L('Інтенсивність турбулентності (TI)', 'Turbulence Intensity (TI)')}</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('TI = σv / V̄ — відношення стандартного відхилення швидкості до середньої. Вища TI збільшує навантаження втоми на компоненти.',
             'TI = σv / V̄ — ratio of wind speed standard deviation to mean speed. Higher TI increases fatigue loads on turbine components.')}
        </p>
        <div className="space-y-2">
          {[
            { cat: L('A (Висока)', 'A (High)'), ti: '16%', ref: 'I₁₅ = 0.18', desc: L('Прибережні скелі, хребти', 'Coastal cliffs, ridgelines') },
            { cat: L('B (Середня)', 'B (Medium)'), ti: '14%', ref: 'I₁₅ = 0.16', desc: L('Відкрита місцевість з помірною шорсткістю', 'Open terrain with moderate roughness') },
            { cat: L('C (Низька)', 'C (Low)'), ti: '12%', ref: 'I₁₅ = 0.12', desc: L('Відкрите море, гладка поверхня', 'Flat open sea, smooth terrain') },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <div>
                <p className="text-xs font-medium text-foreground">{item.cat}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-primary">{item.ti}</p>
                <p className="text-[10px] text-muted-foreground">{item.ref}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Concepts Accordion */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3">{L('Поглиблені концепції', 'Advanced Concepts')}</h3>
        <Accordion type="single" collapsible className="space-y-2">
          {[
            { value: 'betz', title: L('Ліміт Бетца — максимальне вилучення енергії', 'Betz Limit — Maximum Energy Extraction'), content: (
              <div className="space-y-2">
                <p>{L('Ліміт Бетца (59.3%) — максимальна теоретична ефективність вітротурбіни. Відкритий Альбертом Бетцом у 1919 р., він доводить, що жодна турбіна не може захопити більше 16/27 кінетичної енергії вітру.',
                     'The Betz limit (59.3%) represents the maximum theoretical efficiency of a wind turbine. Discovered by Albert Betz in 1919, it proves that no turbine can capture more than 16/27 of wind\'s kinetic energy.')}</p>
                <p>{L('Якщо всю кінетичну енергію вилучити, повітря зупиниться за ротором, блокуючи вхідний потік. Оптимальне вилучення відбувається, коли швидкість за ротором = ⅓ від швидкості перед ним.',
                     'If all kinetic energy were extracted, air would stop behind the rotor, blocking incoming flow. The optimal extraction occurs when downstream speed is ⅓ of upstream speed.')}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">{L('Теорія', 'Theory')}: 59.3%</Badge>
                  <ArrowRight className="w-3 h-3" />
                  <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/30 text-primary">{L('Практика', 'Practice')}: 45–50%</Badge>
                </div>
              </div>
            )},
            { value: 'weibull', title: L('Розподіл Вейбулла — ймовірність швидкості', 'Weibull Distribution — Wind Speed Probability'), content: (
              <div className="space-y-2">
                <p>{L('Швидкості вітру підпорядковуються розподілу Вейбулла, що характеризується параметром форми (k) та масштабу (c). Критично важливий для оцінки річного виробництва енергії (AEP).',
                     'Wind speeds follow a Weibull distribution, characterized by shape factor (k) and scale factor (c). Critical for estimating Annual Energy Production (AEP).')}</p>
                <div className="p-2 rounded-lg font-mono text-center text-primary text-sm" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                  f(V) = (k/c)(V/c)<sup>k-1</sup> · e<sup>-(V/c)^k</sup>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                    <span className="text-[10px] text-muted-foreground">{L('Форма (k)', 'Shape (k)')}</span>
                    <p className="font-mono text-xs">1.5–3.0</p>
                    <span className="text-[10px]">k=2 → Rayleigh</span>
                  </div>
                  <div className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                    <span className="text-[10px] text-muted-foreground">{L('Масштаб (c)', 'Scale (c)')}</span>
                    <p className="font-mono text-xs">≈ 1.12 × V̄</p>
                    <span className="text-[10px]">{L('Повʼязана із середнім', 'Related to mean')}</span>
                  </div>
                </div>
              </div>
            )},
            { value: 'reynolds', title: L('Число Рейнольдса — аеродинаміка лопаті', 'Reynolds Number — Blade Aerodynamics'), content: (
              <div className="space-y-2">
                <p>{L('Число Рейнольдса визначає, чи є потік над поверхнею лопаті ламінарним або турбулентним, що безпосередньо впливає на характеристики підйомної сили та опору.',
                     'The Reynolds number determines whether airflow over blade surfaces is laminar or turbulent, directly affecting lift and drag characteristics.')}</p>
                <div className="p-2 rounded-lg font-mono text-center text-primary text-sm" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                  Re = ρVL / μ
                </div>
                <p>{L('Лопаті вітротурбін працюють при Re = 10⁶–10⁷. При низькому Re (малі турбіни, слабкий вітер) ламінарні пузирі відриву знижують ефективність. Вихрові генератори можуть це компенсувати.',
                     'Wind turbine blades typically operate at Re = 10⁶–10⁷. At low Re (small turbines, low wind), laminar separation bubbles reduce efficiency. Vortex generators or turbulators can mitigate this.')}</p>
              </div>
            )},
            { value: 'tsr', title: L('Коефіцієнт швидкохідності (λ)', 'Tip-Speed Ratio (λ) — Optimal Rotation'), content: (
              <div className="space-y-2">
                <p>{L('λ — відношення лінійної швидкості кінця лопаті до швидкості вітру. Кожна конструкція турбіни має оптимальний λ для максимального Cp.',
                     'TSR is the ratio of blade tip speed to wind speed. Each turbine design has an optimal TSR for maximum Cp.')}</p>
                <div className="p-2 rounded-lg font-mono text-center text-primary text-sm" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                  λ = ωR / V
                </div>
                <div className="space-y-1 mt-1">
                  {[
                    { type: L('3-лопатевий HAWT', '3-blade HAWT'), tsr: 'λ = 6–8' },
                    { type: L('2-лопатевий HAWT', '2-blade HAWT'), tsr: 'λ = 8–10' },
                    { type: L('Дарʼє VAWT', 'Darrieus VAWT'), tsr: 'λ = 4–6' },
                    { type: L('Савоніус VAWT', 'Savonius VAWT'), tsr: 'λ = 0.8–1.2' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between p-1.5 border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.2)' }}>
                      <span>{item.type}</span>
                      <span className="font-mono">{item.tsr}</span>
                    </div>
                  ))}
                </div>
              </div>
            )},
            { value: 'capacity', title: L('Коефіцієнт використання потужності (КВПП)', 'Capacity Factor (CF)'), content: (
              <div className="space-y-2">
                <p>{L('КВПП вимірює фактичну віддачу відносно теоретичного максимуму за період. Враховує мінливість вітру, ТО, обмеження мережі та доступність турбіни.',
                     'The capacity factor measures actual output versus theoretical maximum over a period. It accounts for wind variability, maintenance, grid curtailment, and turbine availability.')}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">{L('Наземні', 'Onshore')}: 25–35%</Badge>
                  <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">{L('Морські', 'Offshore')}: 40–55%</Badge>
                </div>
              </div>
            )},
            { value: 'lcoe', title: L('LCOE — Нівельована вартість енергії', 'LCOE — Levelized Cost of Energy'), content: (
              <div className="space-y-2">
                <p>{L('LCOE — середня вартість одиниці електроенергії за весь термін експлуатації проєкту.',
                     'LCOE represents the average cost per unit of electricity over a project\'s lifetime.')}</p>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary) / 0.05)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
                  <p className="font-mono text-xs text-center text-primary">
                    LCOE = ({L('Капітал + ОМ + Демонтаж', 'Capital + O&M + Decom.')}) / Σ(Energy × (1+r)<sup>-t</sup>)
                  </p>
                </div>
                <p className="mt-1">{L('Сучасна наземна ВЕС: €25–45/МВт·год. Морська: €50–80/МВт·год. Обидва конкурентні з викопним паливом без субсидій.',
                     'Modern onshore wind: €25–45/MWh. Offshore: €50–80/MWh. Both competitive with fossil fuels without subsidies.')}</p>
              </div>
            )},
          ].map(item => (
            <AccordionItem key={item.value} value={item.value} className="rounded-lg border px-3" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--primary) / 0.1)' }}>
              <AccordionTrigger className="text-xs sm:text-sm py-2.5 hover:no-underline hover:text-primary">{item.title}</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground pb-3">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
