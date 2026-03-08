import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calculator, Settings, Volume2, Wind, ChevronDown, Zap, TrendingDown, TrendingUp, Home, Wrench, Battery } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

const turbineSpecs = [
  {
    model: 'Rutland 504', power: '30 W', rotor: '0.51m', hub: '6–10m',
    cutIn: '2.5', cutOut: '18', regulation: 'Furling', aep: '~100 kWh/yr',
    price: '€300–500', noise: 25, useCase: 'marine', installType: 'pole',
    purpose_ua: 'Морський/автономний', purpose_en: 'Marine/off-grid',
    desc_ua: 'Компактний генератор для яхт, кемпінгу та зарядки акумуляторів 12V. Витримує морські умови.',
    desc_en: 'Compact generator for boats, camping, and 12V battery charging. Marine-rated.',
    powerCurveData: [{ v: 3, p: 2 }, { v: 5, p: 8 }, { v: 8, p: 18 }, { v: 10, p: 25 }, { v: 13, p: 30 }, { v: 15, p: 30 }],
  },
  {
    model: 'Air Breeze (Primus)', power: '400 W', rotor: '1.17m', hub: '9–15m',
    cutIn: '3', cutOut: '22', regulation: 'Stall + brake', aep: '~600 kWh/yr',
    price: '€800–1,200', noise: 32, useCase: 'residential', installType: 'roof',
    purpose_ua: 'Дах будинку / дача', purpose_en: 'Rooftop / cottage',
    desc_ua: 'Популярний побутовий генератор для дачі або даху. Тихий, легкий монтаж.',
    desc_en: 'Popular residential turbine for rooftops. Quiet operation, easy install.',
    powerCurveData: [{ v: 3, p: 10 }, { v: 5, p: 50 }, { v: 8, p: 180 }, { v: 10, p: 300 }, { v: 12, p: 400 }, { v: 15, p: 400 }],
  },
  {
    model: 'Automaxx 1500W', power: '1.5 kW', rotor: '1.5m', hub: '8–12m',
    cutIn: '2', cutOut: '20', regulation: 'MPPT controller', aep: '~2,500 kWh/yr',
    price: '€1,500–2,500', noise: 35, useCase: 'hybrid', installType: 'pole',
    purpose_ua: 'Гібрид сонце+вітер', purpose_en: 'Solar+wind hybrid',
    desc_ua: 'Гібридна система з сонячними панелями. Ідеально для автономного живлення.',
    desc_en: 'Hybrid system with solar panels. Ideal for off-grid power supply.',
    powerCurveData: [{ v: 2, p: 20 }, { v: 5, p: 150 }, { v: 8, p: 600 }, { v: 10, p: 1100 }, { v: 12, p: 1500 }, { v: 15, p: 1500 }],
  },
  {
    model: 'Bergey Excel 6', power: '6 kW', rotor: '6.17m', hub: '18–30m',
    cutIn: '2.5', cutOut: '25', regulation: 'Autofurl', aep: '~12,000 kWh/yr',
    price: '€15,000–25,000', noise: 42, useCase: 'rural', installType: 'tower',
    purpose_ua: 'Ферма / садиба', purpose_en: 'Farm / rural estate',
    desc_ua: 'Надійний генератор для ферм. 30+ років експлуатації, мінімальне обслуговування.',
    desc_en: 'Reliable farm turbine. 30+ year lifespan, minimal maintenance.',
    powerCurveData: [{ v: 3, p: 100 }, { v: 5, p: 500 }, { v: 8, p: 2500 }, { v: 10, p: 4500 }, { v: 12, p: 6000 }, { v: 15, p: 6000 }],
  },
  {
    model: 'Ryse E20', power: '20 kW', rotor: '10m', hub: '24–36m',
    cutIn: '3', cutOut: '25', regulation: 'Pitch', aep: '~50,000 kWh/yr',
    price: '€40,000–65,000', noise: 48, useCase: 'commercial', installType: 'tower',
    purpose_ua: 'Мале підприємство', purpose_en: 'Small commercial',
    desc_ua: 'Для малого бізнесу, готелів, ферм. Живить 5–10 домогосподарств.',
    desc_en: 'For small business, hotels, farms. Powers 5–10 households.',
    powerCurveData: [{ v: 3, p: 200 }, { v: 5, p: 1500 }, { v: 8, p: 8000 }, { v: 10, p: 15000 }, { v: 12, p: 20000 }, { v: 15, p: 20000 }],
  },
];

const economicMetrics = [
  { metric_ua: 'LCOE (мала вітроенерг.)', metric_en: 'LCOE (Small Wind)', value: '€0.15–0.40', unit: '/kWh', trend: 'down', pct: '25%' },
  { metric_ua: 'Окупність', metric_en: 'Payback Period', value: '5–15', unit: ' yr', trend: 'down', pct: '' },
  { metric_ua: 'Вартість встановлення', metric_en: 'Installation Cost', value: '€2k–25k', unit: '', trend: 'stable', pct: '' },
  { metric_ua: 'Обслуговування/рік', metric_en: 'Maintenance/yr', value: '€100–500', unit: '/yr', trend: 'stable', pct: '' },
  { metric_ua: 'Акумулятор (опц.)', metric_en: 'Battery Storage', value: '€2k–8k', unit: '', trend: 'down', pct: '40%' },
  { metric_ua: 'Ресурс турбіни', metric_en: 'Turbine Lifespan', value: '20–30', unit: ' yr', trend: 'up', pct: '' },
];

// ═══════ ROTOR COMPARISON WITH HOUSEHOLD SCALE ═══════
const RotorComparisonSVG = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [hovered, setHovered] = useState<number | null>(null);
  const turbines = [
    { name: 'Rutland', rotor: 0.51, power: '30 W', color: 'hsl(180 70% 50%)' },
    { name: 'Air Breeze', rotor: 1.17, power: '400 W', color: 'hsl(120 80% 50%)' },
    { name: 'Automaxx', rotor: 1.5, power: '1.5 kW', color: 'hsl(210 90% 60%)' },
    { name: 'Bergey', rotor: 6.17, power: '6 kW', color: 'hsl(270 70% 60%)' },
    { name: 'Ryse E20', rotor: 10, power: '20 kW', color: 'hsl(25 90% 55%)' },
  ];
  const maxR = 12;
  const W = 440, H = 200;
  const barAreaW = 260;
  const barStartX = 90;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 sm:h-52" onMouseLeave={() => setHovered(null)}>
      {/* Reference silhouettes */}
      {/* Person ~1.8m */}
      <g opacity="0.15">
        <line x1={barStartX + (1.8 / maxR) * barAreaW} y1={10} x2={barStartX + (1.8 / maxR) * barAreaW} y2={170} stroke="hsl(var(--foreground))" strokeWidth="0.5" strokeDasharray="3 3" />
        <text x={barStartX + (1.8 / maxR) * barAreaW} y={180} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">🧍1.8m</text>
      </g>
      {/* House ~6m */}
      <g opacity="0.15">
        <line x1={barStartX + (6 / maxR) * barAreaW} y1={10} x2={barStartX + (6 / maxR) * barAreaW} y2={170} stroke="hsl(var(--foreground))" strokeWidth="0.5" strokeDasharray="3 3" />
        <text x={barStartX + (6 / maxR) * barAreaW} y={180} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">🏠6m</text>
      </g>

      {turbines.map((t, i) => {
        const w = (t.rotor / maxR) * barAreaW;
        const y = 12 + i * 32;
        const area = Math.round(Math.PI * (t.rotor / 2) ** 2 * 100) / 100;
        const isH = hovered === i;
        return (
          <g key={i} onMouseEnter={() => setHovered(i)} style={{ cursor: 'pointer' }}>
            <motion.rect x={barStartX} y={y} width={w} height={isH ? 24 : 20} rx="4" fill={t.color}
              opacity={isH ? 0.9 : hovered !== null ? 0.35 : 0.7}
              initial={{ width: 0 }} animate={{ width: w, y: isH ? y - 2 : y }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
              style={{ filter: isH ? `drop-shadow(0 0 10px ${t.color}60)` : `drop-shadow(0 0 3px ${t.color}30)` }} />
            <text x={barStartX - 4} y={y + 14} textAnchor="end" fontSize="9" fontFamily="monospace"
              fill={isH ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'} fontWeight={isH ? '700' : '400'}>
              {t.name}
            </text>
            <text x={barStartX + w + 6} y={y + 14} fontSize="10" fontWeight="600" fill="hsl(var(--foreground))" fontFamily="monospace">
              {t.rotor}m
            </text>
            {isH && (
              <text x={barStartX + w + 50} y={y + 14} fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="monospace">
                {area} m² · {t.power}
              </text>
            )}
          </g>
        );
      })}
      {/* Scale axis */}
      {[0, 2, 4, 6, 8, 10, 12].map(v => (
        <g key={v}>
          <line x1={barStartX + (v / maxR) * barAreaW} y1={172} x2={barStartX + (v / maxR) * barAreaW} y2={175} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.3" />
          <text x={barStartX + (v / maxR) * barAreaW} y={192} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{v}m</text>
        </g>
      ))}
      <text x={barStartX + barAreaW / 2} y={200} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">{L('Діаметр ротора', 'Rotor Diameter')}</text>
    </svg>
  );
};

// ═══════ INTERACTIVE AEP CALCULATOR (HOUSEHOLD) ═══════
const AEPCalculator = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [windSpeed, setWindSpeed] = useState(5);
  const [rotorD, setRotorD] = useState(3);

  const calc = useMemo(() => {
    const rho = 1.225;
    const A = Math.PI * (rotorD / 2) ** 2;
    const Cp = 0.35; // lower Cp for small turbines
    const cf = 0.18; // lower CF for household
    const pRated = 0.5 * rho * A * Math.pow(windSpeed, 3) * Cp;
    const aep = pRated * 8760 * cf / 1000; // kWh
    const monthlySaving = (aep / 12) * 0.20; // €0.20/kWh
    return {
      A: (A).toFixed(1),
      pRated: pRated > 1000 ? `${(pRated / 1000).toFixed(2)} kW` : `${pRated.toFixed(0)} W`,
      aep: Math.round(aep),
      monthlySaving: monthlySaving.toFixed(0),
    };
  }, [windSpeed, rotorD]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">{L('Середня швидкість вітру', 'Mean Wind Speed')}</span>
            <span className="font-mono text-primary font-semibold">{windSpeed.toFixed(1)} {L('м/с', 'm/s')}</span>
          </div>
          <Slider value={[windSpeed]} onValueChange={([v]) => setWindSpeed(v)} min={2} max={10} step={0.5} />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">{L('Діаметр ротора', 'Rotor Diameter')}</span>
            <span className="font-mono text-primary font-semibold">{rotorD.toFixed(1)}m</span>
          </div>
          <Slider value={[rotorD]} onValueChange={([v]) => setRotorD(v)} min={0.5} max={12} step={0.5} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: L('Площа ометання', 'Swept Area'), value: `${calc.A} m²`, icon: '⊙' },
          { label: L('Потужність (пік)', 'Peak Power'), value: calc.pRated, icon: '⚡' },
          { label: L('AEP (CF=18%)', 'AEP (CF=18%)'), value: `${calc.aep.toLocaleString()} kWh`, icon: '📊' },
          { label: L('Економія/міс.', 'Savings/mo'), value: `~€${calc.monthlySaving}`, icon: '💰' },
        ].map((item, i) => (
          <motion.div key={i} layout className="p-3 rounded-xl border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
            <span className="text-xs text-muted-foreground">{item.icon} {item.label}</span>
            <p className="text-base sm:text-lg font-mono font-bold text-foreground mt-0.5">{item.value}</p>
          </motion.div>
        ))}
      </div>
      <div className="p-3 rounded-xl text-xs" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
        <p className="font-mono text-primary text-center text-sm">
          AEP = P<sub>peak</sub> × 8760h × CF(18%) = <strong>{calc.aep.toLocaleString()} kWh/{L('рік', 'yr')}</strong>
        </p>
        <p className="text-muted-foreground text-center mt-1">
          {L('При тарифі €0.20/kWh', 'At €0.20/kWh tariff')} → <span className="text-primary font-semibold">~€{(calc.aep * 0.20).toFixed(0)}/{L('рік', 'yr')}</span>
        </p>
      </div>
    </div>
  );
};

// ═══════ MINI POWER CURVE SVG ═══════
const MiniPowerCurve = ({ data, ratedPower, color }: { data: { v: number; p: number }[]; ratedPower: number; color: string }) => {
  const W = 120, H = 50;
  const padL = 2, padR = 2, padT = 4, padB = 10;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const maxV = Math.max(...data.map(d => d.v));
  const maxP = ratedPower;

  const pts = data.map(d => `${padL + (d.v / maxV) * plotW},${padT + plotH - (d.p / maxP) * plotH}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" opacity="0.8" />
      {/* Rated line */}
      <line x1={padL} y1={padT} x2={padL + plotW} y2={padT} stroke={color} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
      {data.map((d, i) => (
        <circle key={i} cx={padL + (d.v / maxV) * plotW} cy={padT + plotH - (d.p / maxP) * plotH} r="1.5" fill={color} opacity="0.6" />
      ))}
      {/* X labels */}
      <text x={padL} y={H - 1} fontSize="6" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{data[0].v}</text>
      <text x={padL + plotW} y={H - 1} textAnchor="end" fontSize="6" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{maxV}m/s</text>
    </svg>
  );
};

// ═══════ INTERACTIVE WEIBULL + POWER CURVE ═══════
const WeibullPowerCurve = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [k, setK] = useState(2.0);
  const [hoverV, setHoverV] = useState<number | null>(null);
  const c = 5; // scale parameter — lower for household sites

  const W = 420, H = 200;
  const padL = 40, padR = 10, padT = 15, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const weibull = (v: number) => (k / c) * Math.pow(v / c, k - 1) * Math.exp(-Math.pow(v / c, k));
  const powerCurve = (v: number) => {
    if (v < 2.5) return 0;
    if (v > 20) return 0;
    if (v >= 10) return 1;
    return Math.pow((v - 2.5) / 7.5, 2);
  };

  const maxV = 22;
  const maxF = Math.max(...Array.from({ length: 100 }, (_, i) => weibull((i / 100) * maxV)));

  const vToX = (v: number) => padL + (v / maxV) * plotW;
  const fToY = (f: number) => padT + plotH - (f / maxF) * plotH;
  const pToY = (p: number) => padT + plotH - p * plotH;

  const weibullPts = Array.from({ length: 100 }, (_, i) => {
    const v = (i / 100) * maxV;
    return `${vToX(v)},${fToY(weibull(v))}`;
  }).join(' ');

  const powerPts = Array.from({ length: 100 }, (_, i) => {
    const v = (i / 100) * maxV;
    return `${vToX(v)},${pToY(powerCurve(v))}`;
  }).join(' ');

  const aepPts = Array.from({ length: 100 }, (_, i) => {
    const v = (i / 100) * maxV;
    const val = weibull(v) * powerCurve(v);
    return `${vToX(v)},${fToY(val)}`;
  });
  const aepPolygon = `${vToX(0)},${fToY(0)} ${aepPts.join(' ')} ${vToX(maxV)},${fToY(0)}`;

  const aepEstimate = useMemo(() => {
    let sum = 0;
    for (let v = 0; v < maxV; v += 0.1) sum += weibull(v) * powerCurve(v) * 0.1;
    return (sum * 8760 * 100).toFixed(0);
  }, [k]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">k =</span>
        <div className="flex-1"><Slider value={[k]} onValueChange={([v]) => setK(v)} min={1.2} max={3.5} step={0.1} /></div>
        <span className="text-sm font-mono text-primary font-bold w-10 text-right">{k.toFixed(1)}</span>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'hsl(222 28% 6%)', border: '1px solid hsl(var(--border) / 0.12)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48 sm:h-56"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width * W;
            const v = ((x - padL) / plotW) * maxV;
            if (v >= 0 && v <= maxV) setHoverV(v);
          }}
          onMouseLeave={() => setHoverV(null)}>
          
          {[0, 5, 10, 15, 20].map(v => (
            <g key={v}>
              <line x1={vToX(v)} y1={padT} x2={vToX(v)} y2={padT + plotH} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.15" />
              <text x={vToX(v)} y={H - 8} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{v}</text>
            </g>
          ))}
          <text x={W / 2} y={H - 0} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{L('Швидкість вітру (м/с)', 'Wind Speed (m/s)')}</text>

          <polygon points={aepPolygon} fill="hsl(var(--primary))" opacity="0.12" />
          <polyline points={weibullPts} fill="none" stroke="hsl(120 70% 50%)" strokeWidth="2" opacity="0.8" />
          <polyline points={powerPts} fill="none" stroke="hsl(25 80% 55%)" strokeWidth="2" strokeDasharray="6 3" opacity="0.7" />

          <line x1={vToX(2.5)} y1={padT} x2={vToX(2.5)} y2={padT + plotH} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
          <line x1={vToX(20)} y1={padT} x2={vToX(20)} y2={padT + plotH} stroke="hsl(0 60% 50%)" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
          <text x={vToX(2.5)} y={padT - 3} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">cut-in</text>
          <text x={vToX(20)} y={padT - 3} textAnchor="middle" fontSize="7" fill="hsl(0 60% 50%)">cut-out</text>

          {hoverV !== null && hoverV >= 0 && (
            <>
              <line x1={vToX(hoverV)} y1={padT} x2={vToX(hoverV)} y2={padT + plotH} stroke="hsl(var(--primary))" strokeWidth="0.8" opacity="0.4" strokeDasharray="2 2" />
              <circle cx={vToX(hoverV)} cy={fToY(weibull(hoverV))} r="3" fill="hsl(120 70% 50%)" />
              <circle cx={vToX(hoverV)} cy={pToY(powerCurve(hoverV))} r="3" fill="hsl(25 80% 55%)" />
              <rect x={Math.min(W - 100, Math.max(5, vToX(hoverV) - 48))} y={padT + 4} width="96" height="32" rx="5"
                fill="hsl(222 28% 8%)" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.95" />
              <text x={Math.min(W - 52, Math.max(53, vToX(hoverV)))} y={padT + 17} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="hsl(var(--primary))">
                V = {hoverV.toFixed(1)} m/s
              </text>
              <text x={Math.min(W - 52, Math.max(53, vToX(hoverV)))} y={padT + 29} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="hsl(var(--foreground))">
                f={weibull(hoverV).toFixed(3)} · P={(powerCurve(hoverV) * 100).toFixed(0)}%
              </text>
            </>
          )}

          <g transform={`translate(${padL + 4}, ${padT + 6})`}>
            <line x1="0" y1="0" x2="14" y2="0" stroke="hsl(120 70% 50%)" strokeWidth="2" />
            <text x="18" y="3" fontSize="8" fill="hsl(var(--muted-foreground))">f(V) Weibull</text>
            <line x1="0" y1="12" x2="14" y2="12" stroke="hsl(25 80% 55%)" strokeWidth="2" strokeDasharray="4 2" />
            <text x="18" y="15" fontSize="8" fill="hsl(var(--muted-foreground))">P(V) {L('Крива потужності', 'Power Curve')}</text>
            <rect x="0" y="22" width="14" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.2" />
            <text x="18" y="28" fontSize="8" fill="hsl(var(--muted-foreground))">AEP {L('інтеграл', 'integral')}</text>
          </g>
        </svg>
      </div>

      <div className="p-3 rounded-xl font-mono text-center text-sm" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
        <span className="text-primary">AEP = 8760 × ∫ P(V) · f(V) dV</span>
        <span className="text-muted-foreground ml-2">| k = {k.toFixed(1)}, c = {c}</span>
      </div>
    </div>
  );
};

// ═══════ STALL vs PITCH INTERACTIVE ═══════
const StallVsPitch = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [mode, setMode] = useState<'both' | 'stall' | 'pitch'>('both');
  const [hoverV, setHoverV] = useState<number | null>(null);

  const W = 420, H = 180;
  const padL = 40, padR = 10, padT = 20, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const maxV = 25, maxP = 1.15;

  const vToX = (v: number) => padL + (v / maxV) * plotW;
  const pToY = (p: number) => padT + plotH - (p / maxP) * plotH;

  const pitchP = (v: number) => { if (v < 2.5) return 0; if (v > 20) return 0; if (v >= 10) return 1; return ((v - 2.5) / 7.5) ** 2; };
  const stallP = (v: number) => { if (v < 2.5) return 0; if (v > 20) return 0; const peak = 1.1; if (v <= 12) return ((v - 2.5) / 9.5) ** 1.8 * peak; return Math.max(0, peak * (1 - ((v - 12) / 9) ** 1.5)); };

  const makePts = (fn: (v: number) => number) => Array.from({ length: 120 }, (_, i) => {
    const v = (i / 120) * maxV;
    return `${vToX(v)},${pToY(fn(v))}`;
  }).join(' ');

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {(['both', 'pitch', 'stall'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
            style={{
              backgroundColor: mode === m ? 'hsl(var(--primary) / 0.15)' : 'hsl(222 28% 10%)',
              border: `1px solid ${mode === m ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border) / 0.15)'}`,
              color: mode === m ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            }}>
            {m === 'both' ? L('Обидва', 'Both') : m === 'pitch' ? 'Pitch' : 'Stall'}
          </button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'hsl(222 28% 6%)', border: '1px solid hsl(var(--border) / 0.12)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40 sm:h-48"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const v = ((e.clientX - rect.left) / rect.width * W - padL) / plotW * maxV;
            if (v >= 0 && v <= maxV) setHoverV(v);
          }}
          onMouseLeave={() => setHoverV(null)}>

          {[0, 5, 10, 15, 20, 25].map(v => (
            <line key={v} x1={vToX(v)} y1={padT} x2={vToX(v)} y2={padT + plotH} stroke="hsl(var(--border))" strokeWidth="0.4" opacity="0.15" />
          ))}
          {[0, 0.25, 0.5, 0.75, 1.0].map(p => (
            <g key={p}>
              <line x1={padL} y1={pToY(p)} x2={padL + plotW} y2={pToY(p)} stroke="hsl(var(--border))" strokeWidth="0.4" opacity="0.12" />
              <text x={padL - 4} y={pToY(p) + 3} textAnchor="end" fontSize="7" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{(p * 100).toFixed(0)}%</text>
            </g>
          ))}

          <line x1={padL} y1={pToY(1)} x2={padL + plotW} y2={pToY(1)} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
          <text x={padL + plotW + 2} y={pToY(1) + 3} fontSize="7" fill="hsl(var(--muted-foreground))">P_rated</text>

          {(mode === 'both' || mode === 'pitch') && (
            <polyline points={makePts(pitchP)} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" opacity="0.85" />
          )}
          {(mode === 'both' || mode === 'stall') && (
            <polyline points={makePts(stallP)} fill="none" stroke="hsl(0 70% 55%)" strokeWidth="2" strokeDasharray="6 3" opacity="0.75" />
          )}

          {hoverV !== null && (
            <>
              <line x1={vToX(hoverV)} y1={padT} x2={vToX(hoverV)} y2={padT + plotH} stroke="hsl(var(--foreground))" strokeWidth="0.5" opacity="0.2" strokeDasharray="2 2" />
              {(mode === 'both' || mode === 'pitch') && <circle cx={vToX(hoverV)} cy={pToY(pitchP(hoverV))} r="3" fill="hsl(var(--primary))" />}
              {(mode === 'both' || mode === 'stall') && <circle cx={vToX(hoverV)} cy={pToY(stallP(hoverV))} r="3" fill="hsl(0 70% 55%)" />}
              <rect x={Math.min(W - 110, Math.max(5, vToX(hoverV) - 52))} y={padT + 2} width="105" height="28" rx="5"
                fill="hsl(222 28% 8%)" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.95" />
              <text x={Math.min(W - 58, Math.max(57, vToX(hoverV)))} y={padT + 14} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="hsl(var(--foreground))">
                V={hoverV.toFixed(1)} m/s
              </text>
              <text x={Math.min(W - 58, Math.max(57, vToX(hoverV)))} y={padT + 24} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="hsl(var(--muted-foreground))">
                Pitch: {(pitchP(hoverV) * 100).toFixed(0)}% · Stall: {(stallP(hoverV) * 100).toFixed(0)}%
              </text>
            </>
          )}

          <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{L('Швидкість вітру (м/с)', 'Wind Speed (m/s)')}</text>

          <g transform={`translate(${padL + plotW - 110}, ${padT + plotH - 28})`}>
            <line x1="0" y1="0" x2="12" y2="0" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            <text x="16" y="3" fontSize="7" fill="hsl(var(--muted-foreground))">Pitch</text>
            <line x1="0" y1="10" x2="12" y2="10" stroke="hsl(0 70% 55%)" strokeWidth="2" strokeDasharray="4 2" />
            <text x="16" y="13" fontSize="7" fill="hsl(var(--muted-foreground))">Stall</text>
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'hsl(222 28% 12%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
          <p className="text-xs font-semibold text-primary mb-1">{L('Кутове (Pitch)', 'Pitch Regulation')}</p>
          <p className="text-[11px] text-muted-foreground">{L('Активний контроль кута лопаті. Використовується в Bergey, Ryse.', 'Active blade angle control. Used in Bergey, Ryse turbines.')}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'hsl(222 28% 12%)', border: '1px solid hsl(0 60% 40% / 0.2)' }}>
          <p className="text-xs font-semibold" style={{ color: 'hsl(0 70% 55%)' }}>{L('Зривне / Furling', 'Stall / Furling')}</p>
          <p className="text-[11px] text-muted-foreground">{L('Пасивний захист хвостом або аеродинамікою. Типово для малих турбін.', 'Passive protection via tail or aerodynamics. Typical for small turbines.')}</p>
        </div>
      </div>
    </div>
  );
};

// ═══════ WAKE EFFECTS VISUALIZATION ═══════
const WakeEffects = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [spacing, setSpacing] = useState(7);

  const W = 420, H = 160;
  const turbine1X = 60, turbineY = H / 2;
  const D = 20;
  const turbine2X = turbine1X + spacing * D;

  const ct = 0.8;
  const k0 = 0.075;
  const deficit = useMemo(() => {
    const x = spacing;
    const dw = 1 + 2 * k0 * x;
    return (1 - Math.sqrt(1 - ct / (dw * dw))) * 100;
  }, [spacing]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{L('Відстань', 'Spacing')}</span>
        <div className="flex-1"><Slider value={[spacing]} onValueChange={([v]) => setSpacing(v)} min={3} max={15} step={0.5} /></div>
        <span className="text-sm font-mono text-primary font-bold w-10 text-right">{spacing}D</span>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'hsl(222 28% 6%)', border: '1px solid hsl(var(--border) / 0.12)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36 sm:h-44">
          <defs>
            <linearGradient id="wakeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(210 80% 55%)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(210 80% 55%)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0.2, 0.35, 0.5, 0.65, 0.8].map((yNorm, i) => {
            const y = 20 + yNorm * (H - 40);
            const isInWake = Math.abs(y - turbineY) < D * (1 + spacing * 0.15);
            return (
              <motion.g key={i} animate={{ x: [0, 8, 0] }} transition={{ duration: 2 + i * 0.3, repeat: Infinity }}>
                <line x1="10" y1={y} x2="50" y2={y} stroke={isInWake ? 'hsl(210 60% 45%)' : 'hsl(210 80% 60%)'} strokeWidth="1" opacity={isInWake ? 0.3 : 0.5} />
                <polygon points={`50,${y - 3} 56,${y} 50,${y + 3}`} fill={isInWake ? 'hsl(210 60% 45%)' : 'hsl(210 80% 60%)'} opacity={isInWake ? 0.3 : 0.5} />
              </motion.g>
            );
          })}

          <path d={`M${turbine1X + 8} ${turbineY - D / 2} 
            L${Math.min(turbine1X + spacing * D + 30, W - 10)} ${turbineY - D / 2 - spacing * 3}
            L${Math.min(turbine1X + spacing * D + 30, W - 10)} ${turbineY + D / 2 + spacing * 3}
            L${turbine1X + 8} ${turbineY + D / 2} Z`}
            fill="url(#wakeGrad)" />

          {Array.from({ length: 6 }, (_, i) => {
            const px = turbine1X + 20 + i * (spacing * D / 7);
            const py = turbineY + Math.sin(i * 1.5) * (4 + i * 1.5);
            return (
              <motion.circle key={i} cx={px} cy={py} r="1.5" fill="hsl(210 70% 55%)" opacity="0.25"
                animate={{ cy: [py - 3, py + 3, py - 3] }}
                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }} />
            );
          })}

          <line x1={turbine1X} y1={turbineY - D / 2 - 5} x2={turbine1X} y2={turbineY + D / 2 + 5} stroke="hsl(var(--foreground))" strokeWidth="2.5" />
          <rect x={turbine1X - 3} y={turbineY + D / 2 + 5} width="6" height="8" rx="1" fill="hsl(var(--muted-foreground))" />
          <circle cx={turbine1X} cy={turbineY} r="3" fill="hsl(var(--primary))" style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))' }} />

          {turbine2X < W - 20 && (
            <>
              <line x1={turbine2X} y1={turbineY - D / 2 - 5} x2={turbine2X} y2={turbineY + D / 2 + 5}
                stroke={deficit > 25 ? 'hsl(0 60% 50%)' : deficit > 12 ? 'hsl(40 70% 50%)' : 'hsl(120 60% 50%)'} strokeWidth="2.5" />
              <rect x={turbine2X - 3} y={turbineY + D / 2 + 5} width="6" height="8" rx="1" fill="hsl(var(--muted-foreground))" />
              <circle cx={turbine2X} cy={turbineY} r="3"
                fill={deficit > 25 ? 'hsl(0 60% 50%)' : deficit > 12 ? 'hsl(40 70% 50%)' : 'hsl(120 60% 50%)'}
                style={{ filter: `drop-shadow(0 0 4px ${deficit > 25 ? 'hsl(0 60% 50% / 0.5)' : 'hsl(120 60% 50% / 0.5)'})` }} />
            </>
          )}

          <line x1={turbine1X} y1={H - 18} x2={Math.min(turbine2X, W - 20)} y2={H - 18} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" />
          <text x={(turbine1X + Math.min(turbine2X, W - 20)) / 2} y={H - 8} textAnchor="middle" fontSize="9" fontFamily="monospace" fill="hsl(var(--primary))">
            {spacing}D
          </text>

          {turbine2X < W - 20 && (
            <text x={turbine2X} y={turbineY - D / 2 - 12} textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="700"
              fill={deficit > 25 ? 'hsl(0 70% 55%)' : deficit > 12 ? 'hsl(40 70% 55%)' : 'hsl(120 60% 50%)'}>
              -{deficit.toFixed(0)}%
            </text>
          )}

          <text x="12" y="14" fontSize="8" fill="hsl(var(--muted-foreground))">→ {L('Вітер', 'Wind')}</text>
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: L('Дефіцит', 'Deficit'), value: `${deficit.toFixed(1)}%`, warn: deficit > 20 },
          { label: L('Відстань', 'Spacing'), value: `${spacing}D`, warn: spacing < 5 },
          { label: L('Рекоменд.', 'Optimal'), value: '7–10D', warn: false },
        ].map((item, i) => (
          <div key={i} className="p-2 rounded-xl text-center" style={{
            backgroundColor: 'hsl(222 28% 10%)',
            border: `1px solid ${item.warn ? 'hsl(0 60% 40% / 0.3)' : 'hsl(var(--border) / 0.1)'}`,
          }}>
            <span className="text-[9px] text-muted-foreground block">{item.label}</span>
            <span className="text-xs font-mono font-bold" style={{ color: item.warn ? 'hsl(0 70% 55%)' : 'hsl(var(--primary))' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════ NOISE DISTANCE GAUGE ═══════
const NoiseGauge = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [distance, setDistance] = useState(100);

  const Lw = 85; // household turbine source level ~85 dB(A) (vs 105 industrial)
  const alpha = 0.005;
  const Lp = Lw - 10 * Math.log10(4 * Math.PI * distance * distance) - alpha * distance;

  const W = 300, H = 170;
  const cx = W / 2, cy = 130;
  const R = 100;
  const startAngle = Math.PI;
  const endAngle = 0;

  const dbToAngle = (db: number) => {
    const norm = Math.max(0, Math.min(1, (db - 10) / 50)); // 10-60 dB range for household
    return startAngle + (endAngle - startAngle) * norm;
  };

  const refLevels = [
    { db: 20, label: L('Шепіт', 'Whisper'), color: 'hsl(120 60% 50%)' },
    { db: 30, label: L('Бібліотека', 'Library'), color: 'hsl(120 60% 50%)' },
    { db: 40, label: L('Тихий офіс', 'Quiet office'), color: 'hsl(60 70% 50%)' },
    { db: 50, label: L('Розмова', 'Conversation'), color: 'hsl(25 80% 55%)' },
  ];

  const angle = dbToAngle(Lp);
  const needleX = cx + Math.cos(angle) * (R - 10);
  const needleY = cy + Math.sin(angle) * (R - 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{L('Відстань', 'Distance')}</span>
        <div className="flex-1"><Slider value={[distance]} onValueChange={([v]) => setDistance(v)} min={10} max={500} step={10} /></div>
        <span className="text-sm font-mono text-primary font-bold w-16 text-right">{distance}m</span>
      </div>

      <div className="rounded-xl overflow-hidden flex justify-center p-4" style={{ backgroundColor: 'hsl(222 28% 6%)', border: '1px solid hsl(var(--border) / 0.12)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[300px] h-40">
          {[
            { from: 10, to: 25, color: 'hsl(120 60% 50%)' },
            { from: 25, to: 35, color: 'hsl(60 70% 50%)' },
            { from: 35, to: 45, color: 'hsl(25 80% 55%)' },
            { from: 45, to: 60, color: 'hsl(0 70% 50%)' },
          ].map((seg, i) => {
            const a1 = dbToAngle(seg.from), a2 = dbToAngle(seg.to);
            const x1 = cx + Math.cos(a1) * R, y1 = cy + Math.sin(a1) * R;
            const x2 = cx + Math.cos(a2) * R, y2 = cy + Math.sin(a2) * R;
            return (
              <path key={i} d={`M${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2}`}
                fill="none" stroke={seg.color} strokeWidth="8" opacity="0.2" strokeLinecap="round" />
            );
          })}

          {[10, 20, 30, 40, 50, 60].map(db => {
            const a = dbToAngle(db);
            const outerR = R + 5, innerR = R - 3;
            return (
              <g key={db}>
                <line x1={cx + Math.cos(a) * innerR} y1={cy + Math.sin(a) * innerR}
                  x2={cx + Math.cos(a) * outerR} y2={cy + Math.sin(a) * outerR}
                  stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.4" />
                <text x={cx + Math.cos(a) * (outerR + 10)} y={cy + Math.sin(a) * (outerR + 10) + 3}
                  textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{db}</text>
              </g>
            );
          })}

          {refLevels.map((ref, i) => {
            const a = dbToAngle(ref.db);
            return (
              <g key={i}>
                <circle cx={cx + Math.cos(a) * (R - 15)} cy={cy + Math.sin(a) * (R - 15)} r="2" fill={ref.color} />
                <text x={cx + Math.cos(a) * (R - 28)} y={cy + Math.sin(a) * (R - 28) + 3}
                  textAnchor="middle" fontSize="6" fill={ref.color}>{ref.label}</text>
              </g>
            );
          })}

          <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="hsl(var(--primary))" strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))' }} />
          <circle cx={cx} cy={cy} r="4" fill="hsl(var(--primary))" />

          <text x={cx} y={cy - 20} textAnchor="middle" fontSize="20" fontWeight="800" fontFamily="monospace"
            fill={Lp > 40 ? 'hsl(0 70% 55%)' : Lp > 30 ? 'hsl(40 70% 55%)' : 'hsl(120 60% 50%)'}>
            {Lp.toFixed(1)}
          </text>
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">dB(A)</text>

          {(() => {
            const limitA = dbToAngle(35);
            return (
              <>
                <line x1={cx + Math.cos(limitA) * (R - 5)} y1={cy + Math.sin(limitA) * (R - 5)}
                  x2={cx + Math.cos(limitA) * (R + 8)} y2={cy + Math.sin(limitA) * (R + 8)}
                  stroke="hsl(0 70% 55%)" strokeWidth="1.5" strokeDasharray="3 2" />
                <text x={cx + Math.cos(limitA) * (R + 18)} y={cy + Math.sin(limitA) * (R + 18) + 3}
                  textAnchor="middle" fontSize="7" fill="hsl(0 70% 55%)" fontWeight="600">
                  {L('Нічний ліміт', 'Night limit')}
                </text>
              </>
            );
          })()}
        </svg>
      </div>

      <div className="p-3 rounded-xl font-mono text-center text-xs" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.1)' }}>
        <span className="text-primary">L<sub>p</sub> = L<sub>w</sub> − 10·log₁₀(4πr²) − αr = {Lw} − {(10 * Math.log10(4 * Math.PI * distance * distance)).toFixed(1)} − {(alpha * distance).toFixed(1)} = <strong>{Lp.toFixed(1)} dB(A)</strong></span>
      </div>

      <div className="p-2.5 rounded-xl text-center" style={{
        backgroundColor: Lp > 35 ? 'hsl(0 60% 15% / 0.3)' : 'hsl(120 40% 15% / 0.3)',
        border: `1px solid ${Lp > 35 ? 'hsl(0 60% 40% / 0.3)' : 'hsl(120 50% 40% / 0.3)'}`,
      }}>
        <span className="text-xs font-semibold" style={{ color: Lp > 35 ? 'hsl(0 70% 55%)' : 'hsl(120 60% 50%)' }}>
          {Lp > 35 ? L('⚠ Може турбувати сусідів вночі (ліміт 35 dB)', '⚠ May disturb neighbors at night (limit 35 dB)') :
           L('✓ Тихо — в межах нормативів', '✓ Quiet — within residential limits')}
        </span>
      </div>
    </div>
  );
};

// ═══════ HELPERS ═══════
const getInstallIcon = (type: string) => {
  switch (type) {
    case 'roof': return '🏠';
    case 'pole': return '📍';
    case 'tower': return '🗼';
    default: return '⚙️';
  }
};

const getNoiseColor = (db: number) => {
  if (db <= 30) return 'hsl(120 60% 50%)';
  if (db <= 40) return 'hsl(60 70% 50%)';
  return 'hsl(25 80% 55%)';
};

const getUseCaseLabel = (useCase: string, lang: 'ua' | 'en') => {
  const labels: Record<string, Record<string, string>> = {
    marine: { ua: 'Морський', en: 'Marine' },
    residential: { ua: 'Побутовий', en: 'Residential' },
    hybrid: { ua: 'Гібрид', en: 'Hybrid' },
    rural: { ua: 'Сільський', en: 'Rural' },
    commercial: { ua: 'Комерційний', en: 'Commercial' },
  };
  return labels[useCase]?.[lang] || useCase;
};

// ═══════ MAIN COMPONENT ═══════
export const TechnicalSpecs = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [openTurbine, setOpenTurbine] = useState<string | null>(null);

  const trendIcon = (t: string) => t === 'down' ? <TrendingDown className="w-3 h-3" /> : t === 'up' ? <TrendingUp className="w-3 h-3" /> : <span className="text-xs">→</span>;
  const trendColor = (t: string) => t === 'down' ? 'hsl(120 60% 50%)' : t === 'up' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))';

  return (
    <div className="space-y-4 eng-scrollbar">
      {/* ═══ Turbine Specs ═══ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-1 flex items-center gap-2">
          <Home className="w-4 h-4 text-primary" /> {L('Побутові вітрогенератори', 'Residential Wind Turbines')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          {L('Реальні моделі для дому, дачі та малого бізнесу — від 30 Вт до 20 кВт. Наведіть курсор на діаграму.',
             'Real models for home, cottage & small business — 30W to 20kW. Hover chart for details.')}
        </p>
        <div className="p-3 rounded-xl mb-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--border) / 0.15)' }}>
          <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{L('Діаметри ротора (масштаб: людина 1.8м, будинок 6м)', 'Rotor Diameters (scale: person 1.8m, house 6m)')}</p>
          <RotorComparisonSVG lang={lang} />
        </div>
      </motion.div>

      {/* Turbine expandable cards */}
      <div className="space-y-2">
        {turbineSpecs.map((t, i) => {
          const isOpen = openTurbine === `turbine-${i}`;
          const ratedW = t.powerCurveData[t.powerCurveData.length - 1].p;
          const turbineColors = ['hsl(180 70% 50%)', 'hsl(120 80% 50%)', 'hsl(210 90% 60%)', 'hsl(270 70% 60%)', 'hsl(25 90% 55%)'];
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-xl overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: isOpen ? 'hsl(222 28% 13%)' : 'hsl(222 28% 11%)',
                border: `1px solid ${isOpen ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border) / 0.15)'}`,
                boxShadow: isOpen ? '0 4px 24px hsl(var(--primary) / 0.08)' : 'none',
              }}>
              <button onClick={() => setOpenTurbine(isOpen ? null : `turbine-${i}`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-foreground">{t.model}</span>
                    <span className="text-sm">{getInstallIcon(t.installType)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">{t.power}</Badge>
                    <Badge variant="outline" className="text-[10px]" style={{ borderColor: getNoiseColor(t.noise) + '40', color: getNoiseColor(t.noise) }}>
                      {t.noise} dB
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{getUseCaseLabel(t.useCase, lang)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-primary">{t.aep}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }} className="overflow-hidden">
                    <div className="px-4 pb-4" style={{ borderTop: '1px solid hsl(var(--primary) / 0.1)' }}>
                      {/* Description */}
                      <p className="text-xs text-muted-foreground pt-3 mb-3">{lang === 'ua' ? t.desc_ua : t.desc_en}</p>

                      {/* Power curve mini */}
                      <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--border) / 0.1)' }}>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">{L('Крива потужності', 'Power Curve')}</p>
                        <MiniPowerCurve data={t.powerCurveData} ratedPower={ratedW} color={turbineColors[i]} />
                      </div>

                      {/* Specs grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                        {[
                          { label: L('Ротор', 'Rotor'), value: t.rotor },
                          { label: L('Висота', 'Hub Height'), value: t.hub },
                          { label: L('Регулювання', 'Regulation'), value: t.regulation },
                          { label: L('Пуск / зупинка', 'Cut-in / out'), value: `${t.cutIn} / ${t.cutOut} ${L('м/с', 'm/s')}` },
                          { label: L('Ціна', 'Price'), value: t.price },
                          { label: L('€/Вт', '€/W'), value: (() => {
                            const priceNum = parseInt(t.price.replace(/[^0-9]/g, ''));
                            const powerW = t.powerCurveData[t.powerCurveData.length - 1].p;
                            return `~€${(priceNum / powerW).toFixed(1)}`;
                          })() },
                        ].map((spec, j) => (
                          <div key={j} className="p-2.5 rounded-xl" style={{ backgroundColor: 'hsl(222 28% 15%)', border: '1px solid hsl(var(--border) / 0.12)' }}>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{spec.label}</span>
                            <p className="font-mono text-foreground mt-0.5">{spec.value}</p>
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

      {/* ═══ AEP Calculator ═══ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-1 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" /> {L('Калькулятор AEP для дому', 'Household AEP Calculator')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          {L('Оцініть річне виробництво та економію для побутової турбіни.',
             'Estimate annual production and savings for a residential turbine.')}
        </p>
        <AEPCalculator lang={lang} />
      </motion.div>

      {/* ═══ ECONOMIC METRICS ═══ */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> {L('Економіка побутової вітроенергетики', 'Household Wind Economics')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {economicMetrics.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
              className="p-3 rounded-xl group hover:scale-[1.02] transition-transform" style={{
                backgroundColor: 'hsl(222 28% 12%)',
                border: '1px solid hsl(var(--border) / 0.15)',
              }}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{lang === 'ua' ? item.metric_ua : item.metric_en}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <motion.span className="text-lg sm:text-xl font-bold text-foreground font-mono"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 + 0.3 }}>
                  {item.value}
                </motion.span>
                <span className="text-xs text-muted-foreground">{item.unit}</span>
              </div>
              <div className="flex items-center gap-1 mt-1" style={{ color: trendColor(item.trend) }}>
                {trendIcon(item.trend)}
                <span className="text-[10px] font-mono">
                  {item.trend === 'down' ? `↓ ${item.pct || ''}` : item.trend === 'up' ? '↑' : '→'} {item.trend === 'down' ? (lang === 'ua' ? 'з 2020' : 'since 2020') : item.trend === 'up' ? (lang === 'ua' ? 'Зростає' : 'Improving') : (lang === 'ua' ? 'Стабільний' : 'Stable')}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══ INTERACTIVE ENGINEERING VISUALIZATIONS ═══ */}

      {/* Weibull + Power Curve */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-1 flex items-center gap-2">
          <Calculator className="w-4 h-4" style={{ color: 'hsl(120 70% 50%)' }} />
          {L('Розподіл Вейбулла × Крива потужності → AEP', 'Weibull Distribution × Power Curve → AEP')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Змінюйте параметр форми k для аналізу впливу вітрового режиму на виробництво. Наведіть курсор для значень.',
             'Adjust shape parameter k to analyze wind regime impact on production. Hover for values.')}
        </p>
        <WeibullPowerCurve lang={lang} />
      </div>

      {/* Stall vs Pitch */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-1 flex items-center gap-2">
          <Wind className="w-4 h-4" style={{ color: 'hsl(25 90% 55%)' }} />
          {L('Зривне vs кутове регулювання', 'Stall vs Pitch Regulation')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Порівняйте криві потужності двох типів регулювання побутових турбін.',
             'Compare power curves of two regulation types for small turbines.')}
        </p>
        <StallVsPitch lang={lang} />
      </div>

      {/* Wake Effects */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-1 flex items-center gap-2">
          <Wind className="w-4 h-4" style={{ color: 'hsl(210 90% 60%)' }} />
          {L('Сліди та оптимальне розташування', 'Wake Effects & Optimal Spacing')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Модель Єнсена: дефіцит швидкості за слідом. Змініть відстань для оцінки втрат.',
             'Jensen wake model: velocity deficit downstream. Adjust spacing to evaluate losses.')}
        </p>
        <WakeEffects lang={lang} />
      </div>

      {/* Noise */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-1 flex items-center gap-2">
          <Volume2 className="w-4 h-4" style={{ color: 'hsl(0 60% 55%)' }} />
          {L('Шум побутової турбіни — відстань', 'Residential Turbine Noise — Distance')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Рівень звуку побутового генератора (85 dB джерело) як функція відстані.',
             'Sound level of residential turbine (85 dB source) as function of distance.')}
        </p>
        <NoiseGauge lang={lang} />
      </div>
    </div>
  );
};
