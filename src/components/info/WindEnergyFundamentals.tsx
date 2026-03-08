import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Wind, Zap, TrendingUp, Gauge, 
  ArrowRight, AlertCircle, CheckCircle, Info, Layers, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.3 } }),
};

// Reusable expandable section component
const ExpandableCard = ({ title, icon: Icon, children, color = 'hsl(var(--primary))' }: { title: string; icon?: any; children: React.ReactNode; color?: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg overflow-hidden transition-all duration-300" style={{
      backgroundColor: 'hsl(222 28% 12%)',
      border: `1px solid ${open ? color + '40' : 'hsl(var(--border) / 0.2)'}`,
      boxShadow: open ? `0 0 20px ${color}15` : 'none',
    }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left group">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" style={{ color }} />}
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

// Interactive Power Curve SVG
const PowerCurveSVG = ({ lang }: { lang: 'ua' | 'en' }) => {
  const [hoverV, setHoverV] = useState<number | null>(null);
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  const W = 440, H = 280, pad = { l: 52, r: 30, t: 25, b: 55 };
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  const vMax = 28;
  const cutIn = 3, rated = 14, cutOut = 25;

  const vToX = (v: number) => pad.l + (v / vMax) * plotW;
  const pToY = (p: number) => pad.t + plotH - (p / 100) * plotH;

  const points: string[] = [];
  for (let v = 0; v <= vMax; v += 0.3) {
    const p = v < cutIn ? 0 : v >= cutOut ? 0 : v >= rated ? 100 : Math.min(100, ((v - cutIn) / (rated - cutIn)) ** 3 * 100);
    points.push(`${vToX(v)},${pToY(p)}`);
  }

  const hoverP = hoverV !== null
    ? hoverV < cutIn ? 0 : hoverV >= cutOut ? 0 : hoverV >= rated ? 100 : Math.min(100, ((hoverV - cutIn) / (rated - cutIn)) ** 3 * 100)
    : null;

  // Clamp tooltip position
  const tooltipX = hoverV !== null ? Math.max(pad.l + 44, Math.min(W - pad.r - 44, vToX(hoverV))) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56 sm:h-64"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * W;
        const v = Math.max(0, Math.min(vMax, ((x - pad.l) / plotW) * vMax));
        setHoverV(Math.round(v * 10) / 10);
      }}
      onMouseLeave={() => setHoverV(null)}>
      
      {/* Operating zones */}
      <rect x={pad.l} y={pad.t} width={vToX(cutIn) - pad.l} height={plotH} fill="hsl(var(--muted-foreground))" opacity="0.04" />
      <rect x={vToX(cutIn)} y={pad.t} width={vToX(rated) - vToX(cutIn)} height={plotH} fill="hsl(120 80% 50%)" opacity="0.04" />
      <rect x={vToX(rated)} y={pad.t} width={vToX(cutOut) - vToX(rated)} height={plotH} fill="hsl(25 90% 55%)" opacity="0.04" />
      <rect x={vToX(cutOut)} y={pad.t} width={vToX(vMax) - vToX(cutOut)} height={plotH} fill="hsl(0 70% 50%)" opacity="0.06" />

      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(p => (
        <g key={p}>
          <line x1={pad.l} y1={pToY(p)} x2={W - pad.r} y2={pToY(p)} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.15" />
          <text x={pad.l - 6} y={pToY(p) + 4} textAnchor="end" fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{p}%</text>
        </g>
      ))}
      {[0, 5, 10, 15, 20, 25].map(v => (
        <g key={v}>
          <line x1={vToX(v)} y1={pad.t} x2={vToX(v)} y2={pad.t + plotH} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.1" />
          <text x={vToX(v)} y={H - pad.b + 18} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{v}</text>
        </g>
      ))}

      {/* Axes */}
      <line x1={pad.l} y1={pad.t + plotH} x2={W - pad.r} y2={pad.t + plotH} stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.5" />
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + plotH} stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.5" />

      {/* Axis labels */}
      <text x={(pad.l + W - pad.r) / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="hsl(var(--muted-foreground))">{L('Швидкість вітру (м/с)', 'Wind Speed (m/s)')}</text>
      <text x={14} y={(pad.t + pad.t + plotH) / 2} textAnchor="middle" fontSize="12" fill="hsl(var(--muted-foreground))" transform={`rotate(-90 14 ${(pad.t + pad.t + plotH) / 2})`}>{L('Потужність (%)', 'Power (%)')}</text>

      {/* Cut-in / rated / cut-out dashed lines */}
      <line x1={vToX(cutIn)} y1={pad.t} x2={vToX(cutIn)} y2={pad.t + plotH} stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
      <line x1={vToX(rated)} y1={pad.t} x2={vToX(rated)} y2={pad.t + plotH} stroke="hsl(25 90% 55%)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
      <line x1={vToX(cutOut)} y1={pad.t} x2={vToX(cutOut)} y2={pad.t + plotH} stroke="hsl(0 70% 50%)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />

      {/* Zone labels */}
      <text x={(vToX(0) + vToX(cutIn)) / 2} y={pad.t + plotH - 8} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" opacity="0.6">{L('Тихо', 'Idle')}</text>
      <text x={(vToX(cutIn) + vToX(rated)) / 2} y={pad.t + 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(120 80% 50%)">P ∝ V³</text>
      <text x={(vToX(rated) + vToX(cutOut)) / 2} y={pad.t + 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(25 90% 55%)">{L('Номінал', 'Rated')}</text>
      <text x={(vToX(cutOut) + vToX(vMax)) / 2} y={pad.t + 14} textAnchor="middle" fontSize="9" fill="hsl(0 70% 50%)">{L('Стоп', 'Cut-out')}</text>

      {/* Power curve fill */}
      <polygon points={`${vToX(0)},${pToY(0)} ${points.join(' ')} ${vToX(vMax)},${pToY(0)}`} fill="hsl(var(--primary))" opacity="0.06" />
      
      {/* Power curve line */}
      <polyline points={points.join(' ')} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
        strokeDasharray="800" strokeDashoffset="800" style={{ animation: 'drawCurve 2s ease-out forwards' }} />

      {/* Hover crosshair & tooltip */}
      {hoverV !== null && hoverP !== null && (
        <>
          <line x1={vToX(hoverV)} y1={pad.t} x2={vToX(hoverV)} y2={pad.t + plotH} stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" strokeDasharray="2 2" />
          <line x1={pad.l} y1={pToY(hoverP)} x2={W - pad.r} y2={pToY(hoverP)} stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.3" strokeDasharray="2 2" />
          <circle cx={vToX(hoverV)} cy={pToY(hoverP)} r="5" fill="hsl(var(--primary))" opacity="0.9" style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))' }} />
          <rect x={tooltipX - 44} y={Math.max(pad.t + 2, pToY(hoverP) - 30)} width="88" height="22" rx="4" fill="hsl(222 28% 10%)" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.95" />
          <text x={tooltipX} y={Math.max(pad.t + 17, pToY(hoverP) - 15)} textAnchor="middle" fontSize="10" fontFamily="monospace" fill="hsl(var(--primary))">
            {hoverV.toFixed(1)} {L('м/с', 'm/s')} → {hoverP.toFixed(0)}%
          </text>
        </>
      )}
    </svg>
  );
};

// Betz Limit Gauge — fixed viewBox to prevent clipping
const BetzGauge = ({ lang }: { lang: 'ua' | 'en' }) => {
  const betzPct = 59.3;
  const practicalPct = 47;
  const r = 48;
  const rInner = 36;
  const cx = 65, cy = 60;
  const circ = 2 * Math.PI * r;
  const circInner = 2 * Math.PI * rInner;
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  return (
    <svg viewBox="0 0 130 120" className="w-40 h-36">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="8" opacity="0.08" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(210 90% 60%)" strokeWidth="8"
        strokeDasharray={`${(betzPct / 100) * circ} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter: 'drop-shadow(0 0 6px hsl(210 90% 60% / 0.4))', animation: 'betzFill 1.5s ease-out forwards' }} />
      <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="hsl(var(--border))" strokeWidth="5" opacity="0.05" />
      <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="hsl(var(--primary))" strokeWidth="5"
        strokeDasharray={`${(practicalPct / 100) * circInner} ${circInner}`} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter: 'drop-shadow(0 0 5px hsl(var(--primary) / 0.4))', animation: 'betzFill 1.8s ease-out forwards' }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="bold" fill="hsl(var(--foreground))" fontFamily="monospace">59.3%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">{L('Ліміт Бетца', 'Betz Limit')}</text>
      <text x={cx} y={cy + 26} textAnchor="middle" fontSize="9" fill="hsl(var(--primary))">~47% {L('практ.', 'pract.')}</text>
    </svg>
  );
};

// Weibull Distribution — interactive k parameter
const WeibullSVG = ({ lang }: { lang: 'ua' | 'en' }) => {
  const [kVal, setKVal] = useState(2.0);
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const c = 7;
  const W = 400, H = 200, pad = { l: 45, r: 15, t: 15, b: 40 };
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;

  const weibull = (v: number, k: number, cVal: number) => {
    if (v <= 0) return 0;
    return (k / cVal) * Math.pow(v / cVal, k - 1) * Math.exp(-Math.pow(v / cVal, k));
  };

  const kValues = [1.5, 2.0, 2.5, 3.0];
  const vMax = 20;
  const fMax = 0.18;

  const makePath = (k: number) => {
    const pts: string[] = [];
    for (let v = 0; v <= vMax; v += 0.3) {
      const f = weibull(v, k, c);
      const x = pad.l + (v / vMax) * plotW;
      const y = pad.t + plotH - (f / fMax) * plotH;
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-muted-foreground font-mono">k =</span>
        {kValues.map(k => (
          <button key={k} onClick={() => setKVal(k)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${k === kVal ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'}`}>
            {k.toFixed(1)}
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-1">c = {c} {L('м/с', 'm/s')}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 sm:h-48">
        {[0, 0.05, 0.10, 0.15].map(f => (
          <g key={f}>
            <line x1={pad.l} y1={pad.t + plotH - (f / fMax) * plotH} x2={W - pad.r} y2={pad.t + plotH - (f / fMax) * plotH} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.15" />
            <text x={pad.l - 5} y={pad.t + plotH - (f / fMax) * plotH + 4} textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{(f * 100).toFixed(0)}%</text>
          </g>
        ))}
        {[0, 5, 10, 15, 20].map(v => (
          <text key={v} x={pad.l + (v / vMax) * plotW} y={H - pad.b + 16} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{v}</text>
        ))}

        <line x1={pad.l} y1={pad.t + plotH} x2={W - pad.r} y2={pad.t + plotH} stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.4" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + plotH} stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.4" />

        {kValues.filter(k => k !== kVal).map(k => (
          <polyline key={k} points={makePath(k)} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.15" />
        ))}

        <polygon points={`${pad.l},${pad.t + plotH} ${makePath(kVal)} ${W - pad.r},${pad.t + plotH}`} fill="hsl(var(--primary))" opacity="0.08" />
        <polyline points={makePath(kVal)} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
          style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.4))' }} />

        <text x={(pad.l + W - pad.r) / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">{L('Швидкість вітру (м/с)', 'Wind Speed (m/s)')}</text>
        <text x={12} y={(pad.t + pad.t + plotH) / 2} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))" transform={`rotate(-90 12 ${(pad.t + pad.t + plotH) / 2})`}>f(V)</text>
      </svg>
    </div>
  );
};

// Wind Shear Profile SVG
const WindShearSVG = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const W = 380, H = 240, pad = { l: 55, r: 30, t: 15, b: 40 };
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  const vRef = 6, hRef = 10;

  const terrains = [
    { label: L('Море', 'Sea'), alpha: 0.11, color: 'hsl(210 90% 60%)' },
    { label: L('Луг', 'Grass'), alpha: 0.15, color: 'hsl(120 70% 50%)' },
    { label: L('Примісто', 'Suburb'), alpha: 0.25, color: 'hsl(25 80% 55%)' },
    { label: L('Місто', 'City'), alpha: 0.35, color: 'hsl(0 60% 50%)' },
  ];

  const hMax = 200, vMax = 12;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48 sm:h-56">
      {[0, 50, 100, 150, 200].map(h => (
        <g key={h}>
          <line x1={pad.l} y1={pad.t + plotH - (h / hMax) * plotH} x2={W - pad.r} y2={pad.t + plotH - (h / hMax) * plotH} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.12" />
          <text x={pad.l - 5} y={pad.t + plotH - (h / hMax) * plotH + 4} textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{h}m</text>
        </g>
      ))}

      <line x1={pad.l} y1={pad.t + plotH} x2={W - pad.r} y2={pad.t + plotH} stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.4" />
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + plotH} stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.4" />

      {terrains.map((t, idx) => {
        const pts: string[] = [];
        for (let h = 1; h <= hMax; h += 2) {
          const v = vRef * Math.pow(h / hRef, t.alpha);
          const x = pad.l + (v / vMax) * plotW;
          const y = pad.t + plotH - (h / hMax) * plotH;
          pts.push(`${x},${y}`);
        }
        return (
          <g key={idx}>
            <polyline points={pts.join(' ')} fill="none" stroke={t.color} strokeWidth="2" opacity="0.8" />
            <text x={W - pad.r + 4} y={pad.t + plotH - (180 / hMax) * plotH + idx * 14} fontSize="9" fill={t.color} fontFamily="monospace">{t.label}</text>
          </g>
        );
      })}

      <line x1={pad.l} y1={pad.t + plotH - (100 / hMax) * plotH} x2={W - pad.r} y2={pad.t + plotH - (100 / hMax) * plotH} stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
      <text x={pad.l + 4} y={pad.t + plotH - (100 / hMax) * plotH - 4} fontSize="9" fill="hsl(var(--primary))">Hub 100m</text>

      <text x={(pad.l + W - pad.r) / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">{L('Швидкість вітру (м/с)', 'Wind Speed (m/s)')}</text>
      <text x={12} y={(pad.t + pad.t + plotH) / 2} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))" transform={`rotate(-90 12 ${(pad.t + pad.t + plotH) / 2})`}>{L('Висота (м)', 'Height (m)')}</text>
    </svg>
  );
};

export const WindEnergyFundamentals = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="space-y-4 eng-scrollbar">
      <style>{`
        @keyframes drawCurve { to { stroke-dashoffset: 0; } }
        @keyframes betzFill { from { stroke-dasharray: 0 999; } }
      `}</style>

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

      {/* Interactive Power Curve */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          {L('Інтерактивна крива потужності P ∝ V³', 'Interactive Power Curve P ∝ V³')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
          {L('Наведіть курсор для перегляду значень. Кольорові зони: сірий — нижче пуску, зелений — кубічна зона, оранжевий — номінальна, червоний — зупинка.', 
             'Hover to see values. Color zones: gray — below cut-in, green — cubic zone, orange — rated, red — cut-out.')}
        </p>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <PowerCurveSVG lang={lang} />
        </div>
        <div className="flex gap-3 mt-2 flex-wrap text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm" style={{ backgroundColor: 'hsl(120 80% 50%)', opacity: 0.3 }} />{L('Кубічна зона', 'Cubic zone')}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm" style={{ backgroundColor: 'hsl(25 90% 55%)', opacity: 0.3 }} />{L('Номінальна', 'Rated')}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm" style={{ backgroundColor: 'hsl(0 70% 50%)', opacity: 0.3 }} />{L('Зупинка', 'Cut-out')}</span>
        </div>
      </motion.div>

      {/* Betz Limit Visual + Power Equation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="stalker-card p-4 sm:p-5 flex flex-col items-center">
          <h3 className="text-sm sm:text-base font-semibold mb-3">{L('Ліміт Бетца', 'Betz Limit')}</h3>
          <BetzGauge lang={lang} />
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(210 90% 60%)' }} />{L('Теорія', 'Theory')}: 59.3%</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary" />{L('Практика', 'Practice')}: ~47%</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="stalker-card p-4 sm:p-5">
          <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
            <Wind className="w-4 h-4 text-primary" />
            {L('Рівняння потужності', 'Power Equation')}
          </h3>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
            <p className="text-xl font-mono text-center text-primary" style={{ textShadow: '0 0 12px hsl(var(--primary) / 0.3)' }}>
              P = ½ · ρ · A · V³ · Cp
            </p>
          </div>
          <div className="space-y-1.5 mt-3 text-xs sm:text-sm">
            {[
              { sym: 'P', desc: L('Потужність (Вт)', 'Power output (Watts)') },
              { sym: 'ρ', desc: L('Густина повітря (1.225 кг/м³)', 'Air density (1.225 kg/m³)') },
              { sym: 'A', desc: L('Площа ометання (πr²)', 'Swept area (πr²)') },
              { sym: 'V', desc: L('Швидкість вітру (м/с)', 'Wind speed (m/s)') },
              { sym: 'Cp', desc: L('Коеф. потужності (0.35–0.45)', 'Power coefficient (0.35–0.45)') },
            ].map((item, i) => (
              <div key={i} className="flex justify-between py-1 border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.2)' }}>
                <span className="font-mono text-primary font-semibold">{item.sym}</span>
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
            <div key={i} className="p-3 rounded-lg border" style={{ backgroundColor: item.bg, borderColor: item.border }}>
              <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: item.color }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: item.color }}>{item.title}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{item.text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weibull Distribution */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          {L('Розподіл Вейбулла — ймовірність швидкості вітру', 'Weibull Distribution — Wind Speed Probability')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
          {L('Натисніть кнопки k для зміни форми розподілу. k=2 ≈ Релея (типовий). Вищий k — стабільніший вітер.', 
             'Click k buttons to change distribution shape. k=2 ≈ Rayleigh (typical). Higher k = more consistent wind.')}
        </p>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <WeibullSVG lang={lang} />
        </div>
        <div className="p-3 rounded-lg mt-3 font-mono text-center text-primary text-base" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
          f(V) = (k/c)(V/c)<sup>k-1</sup> · e<sup>-(V/c)^k</sup>
        </div>
      </motion.div>

      {/* Wind Shear Profile */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          {L('Профіль зсуву вітру за висотою', 'Wind Shear Height Profile')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
          {L('Порівняння логарифмічних профілів вітру для різних типів місцевості. Пунктир — типова висота щогли 100м.', 
             'Comparison of logarithmic wind profiles for different terrain types. Dashed line — typical hub height 100m.')}
        </p>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <WindShearSVG lang={lang} />
        </div>
        <div className="p-3 rounded-lg mt-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
          <p className="text-base font-mono text-center text-primary" style={{ textShadow: '0 0 8px hsl(var(--primary) / 0.3)' }}>
            V(h) = V<sub>ref</sub> · (h / h<sub>ref</sub>)<sup>α</sup>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs sm:text-sm">
          {[
            { terrain: L('Гладкий (море)', 'Smooth (sea)'), alpha: 'α = 0.10–0.12' },
            { terrain: L('Відкритий луг', 'Open grassland'), alpha: 'α = 0.14–0.16' },
            { terrain: L('Приміська зона', 'Suburban'), alpha: 'α = 0.20–0.30' },
            { terrain: L('Місто / ліс', 'Urban / forest'), alpha: 'α = 0.30–0.40' },
          ].map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <span className="text-muted-foreground">{item.terrain}</span>
              <p className="font-mono text-foreground mt-0.5">{item.alpha}</p>
            </div>
          ))}
        </div>
      </motion.div>

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
            <div key={i} className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-xs border-primary/40 text-primary bg-primary/5">
                  {L('Клас', 'Class')} {item.class}
                </Badge>
                <span className="font-mono text-sm text-foreground">{item.speed} {L('м/с', 'm/s')}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{L('Турбулентність', 'Turbulence')}: {item.turbulence}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Turbulence Intensity */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3">{L('Інтенсивність турбулентності (TI)', 'Turbulence Intensity (TI)')}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
          {L('TI = σv / V̄ — відношення стандартного відхилення швидкості до середньої. Вища TI збільшує навантаження втоми.',
             'TI = σv / V̄ — ratio of wind speed standard deviation to mean. Higher TI increases fatigue loads.')}
        </p>
        <div className="space-y-2">
          {[
            { cat: L('A (Висока)', 'A (High)'), ti: '16%', ref: 'I₁₅ = 0.18', desc: L('Прибережні скелі, хребти', 'Coastal cliffs, ridgelines') },
            { cat: L('B (Середня)', 'B (Medium)'), ti: '14%', ref: 'I₁₅ = 0.16', desc: L('Відкрита місцевість з помірною шорсткістю', 'Open terrain with moderate roughness') },
            { cat: L('C (Низька)', 'C (Low)'), ti: '12%', ref: 'I₁₅ = 0.12', desc: L('Відкрите море, гладка поверхня', 'Flat open sea, smooth terrain') },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <div>
                <p className="text-sm font-medium text-foreground">{item.cat}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-primary">{item.ti}</p>
                <p className="text-xs text-muted-foreground">{item.ref}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Concepts — Custom expandable cards */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3">{L('Поглиблені концепції', 'Advanced Concepts')}</h3>
        <div className="space-y-2">
          <ExpandableCard title={L('Ліміт Бетца — максимальне вилучення енергії', 'Betz Limit — Maximum Energy Extraction')} color="hsl(210 90% 60%)">
            <div className="space-y-2">
              <p>{L('Ліміт Бетца (59.3%) — максимальна теоретична ефективність вітротурбіни. Відкритий Альбертом Бетцом у 1919 р.', 'The Betz limit (59.3%) represents the maximum theoretical efficiency of a wind turbine. Discovered by Albert Betz in 1919.')}</p>
              <p>{L('Якщо всю кінетичну енергію вилучити, повітря зупиниться за ротором, блокуючи вхідний потік. Оптимум — швидкість за ротором = ⅓ від вхідної.', 'If all kinetic energy were extracted, air would stop behind the rotor. Optimal: downstream speed = ⅓ of upstream.')}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs border-primary/30 bg-primary/5 text-primary">{L('Теорія', 'Theory')}: 59.3%</Badge>
                <ArrowRight className="w-3 h-3" />
                <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">{L('Практика', 'Practice')}: 45–50%</Badge>
              </div>
            </div>
          </ExpandableCard>

          <ExpandableCard title={L('Число Рейнольдса — аеродинаміка лопаті', 'Reynolds Number — Blade Aerodynamics')} color="hsl(120 70% 50%)">
            <div className="space-y-2">
              <p>{L('Визначає ламінарний чи турбулентний потік над лопаттю. Впливає на підйомну силу та опір.', 'Determines laminar vs turbulent flow over the blade. Affects lift and drag.')}</p>
              <div className="p-3 rounded-lg font-mono text-center text-primary text-base" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                Re = ρVL / μ
              </div>
              <p>{L('Лопаті працюють при Re = 10⁶–10⁷. При низькому Re ламінарні пузирі відриву знижують ефективність.', 'Blades operate at Re = 10⁶–10⁷. At low Re, laminar separation bubbles reduce efficiency.')}</p>
            </div>
          </ExpandableCard>

          <ExpandableCard title={L('Коефіцієнт швидкохідності (λ)', 'Tip-Speed Ratio (λ)')} color="hsl(25 90% 55%)">
            <div className="space-y-2">
              <p>{L('λ — відношення швидкості кінця лопаті до швидкості вітру. Кожна конструкція має оптимальний λ для макс. Cp.', 'TSR is blade tip speed to wind speed ratio. Each design has optimal TSR for max Cp.')}</p>
              <div className="p-3 rounded-lg font-mono text-center text-primary text-base" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                λ = ωR / V
              </div>
              <div className="space-y-1.5 mt-2">
                {[
                  { type: L('3-лопатевий HAWT', '3-blade HAWT'), tsr: 'λ = 6–8' },
                  { type: L('2-лопатевий HAWT', '2-blade HAWT'), tsr: 'λ = 8–10' },
                  { type: L("Дар'є VAWT", 'Darrieus VAWT'), tsr: 'λ = 4–6' },
                  { type: L('Савоніус VAWT', 'Savonius VAWT'), tsr: 'λ = 0.8–1.2' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between p-2 border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.2)' }}>
                    <span>{item.type}</span>
                    <span className="font-mono text-primary">{item.tsr}</span>
                  </div>
                ))}
              </div>
            </div>
          </ExpandableCard>

          <ExpandableCard title={L('Коефіцієнт використання потужності', 'Capacity Factor')} color="hsl(270 70% 60%)">
            <div className="space-y-2">
              <p>{L('Вимірює фактичну віддачу vs теоретичний максимум. Враховує мінливість вітру, ТО, обмеження мережі.', 'Measures actual output vs theoretical max. Accounts for wind variability, maintenance, curtailment.')}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs border-primary/30 bg-primary/5 text-primary">{L('Наземні', 'Onshore')}: 25–35%</Badge>
                <Badge variant="outline" className="text-xs border-primary/30 bg-primary/5 text-primary">{L('Морські', 'Offshore')}: 40–55%</Badge>
              </div>
            </div>
          </ExpandableCard>

          <ExpandableCard title={L('LCOE — Нівельована вартість енергії', 'LCOE — Levelized Cost of Energy')} color="hsl(0 60% 55%)">
            <div className="space-y-2">
              <p>{L('Середня вартість одиниці електроенергії за весь термін експлуатації проєкту.', 'Average cost per unit of electricity over project lifetime.')}</p>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary) / 0.05)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
                <p className="font-mono text-sm text-center text-primary">
                  LCOE = ({L('Капітал + ОМ + Демонтаж', 'Capital + O&M + Decom.')}) / Σ(E × (1+r)<sup>-t</sup>)
                </p>
              </div>
              <p className="mt-1">{L('Наземна ВЕС: €25–45/МВт·год. Морська: €50–80/МВт·год. Конкурентні без субсидій.', 'Onshore: €25–45/MWh. Offshore: €50–80/MWh. Competitive without subsidies.')}</p>
            </div>
          </ExpandableCard>
        </div>
      </div>
    </div>
  );
};
