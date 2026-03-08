import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calculator, Settings, Volume2, Wind, ChevronDown, Zap, TrendingDown, TrendingUp } from 'lucide-react';
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
  { metric_ua: 'LCOE (наземні)', metric_en: 'LCOE (Onshore)', value: '€25–45', unit: '/MWh', trend: 'down', pct: '40%' },
  { metric_ua: 'LCOE (морські)', metric_en: 'LCOE (Offshore)', value: '€50–80', unit: '/MWh', trend: 'down', pct: '50%' },
  { metric_ua: 'Коеф. використання', metric_en: 'Capacity Factor', value: '25–55', unit: '%', trend: 'up', pct: '' },
  { metric_ua: 'IRR проєкту', metric_en: 'Project IRR', value: '8–12', unit: '%', trend: 'stable', pct: '' },
  { metric_ua: 'Окупність', metric_en: 'Payback Period', value: '7–12', unit: ' yr', trend: 'down', pct: '' },
  { metric_ua: 'Ресурс турбіни', metric_en: 'Turbine Lifespan', value: '25–30', unit: ' yr', trend: 'up', pct: '' },
];

// ═══════ ROTOR COMPARISON WITH HOVER ═══════
const RotorComparisonSVG = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const turbines = [
    { name: 'E-138', rotor: 138, power: '4.2 MW', color: 'hsl(25 90% 55%)' },
    { name: 'V150', rotor: 150, power: '4.2 MW', color: 'hsl(120 80% 50%)' },
    { name: 'N163', rotor: 163, power: '5.7 MW', color: 'hsl(210 90% 60%)' },
    { name: 'SG 170', rotor: 170, power: '5.8 MW', color: 'hsl(270 70% 60%)' },
    { name: 'HX 220', rotor: 220, power: '14 MW', color: 'hsl(0 80% 55%)' },
  ];
  const maxR = 220;
  const W = 440, H = 170;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36 sm:h-44" onMouseLeave={() => setHovered(null)}>
      {turbines.map((t, i) => {
        const w = (t.rotor / maxR) * 250;
        const y = 8 + i * 30;
        const area = Math.round(Math.PI * (t.rotor / 2) ** 2);
        const isH = hovered === i;
        return (
          <g key={i} onMouseEnter={() => setHovered(i)} style={{ cursor: 'pointer' }}>
            <motion.rect x="72" y={y} width={w} height={isH ? 24 : 20} rx="4" fill={t.color}
              opacity={isH ? 0.9 : hovered !== null ? 0.35 : 0.7}
              initial={{ width: 0 }} animate={{ width: w, y: isH ? y - 2 : y }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
              style={{ filter: isH ? `drop-shadow(0 0 10px ${t.color}60)` : `drop-shadow(0 0 3px ${t.color}30)` }} />
            <text x="66" y={y + 14} textAnchor="end" fontSize="10" fontFamily="monospace"
              fill={isH ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'} fontWeight={isH ? '700' : '400'}>
              {t.name}
            </text>
            <text x={78 + w} y={y + 14} fontSize="10" fontWeight="600" fill="hsl(var(--foreground))" fontFamily="monospace">
              {t.rotor}m
            </text>
            {isH && (
              <text x={78 + w + 40} y={y + 14} fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="monospace">
                {area.toLocaleString()} m² · {t.power}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ═══════ INTERACTIVE AEP CALCULATOR ═══════
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
          <motion.div key={i} layout className="p-3 rounded-xl border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
            <span className="text-xs text-muted-foreground">{item.icon} {item.label}</span>
            <p className="text-base sm:text-lg font-mono font-bold text-foreground mt-0.5">{item.value}</p>
          </motion.div>
        ))}
      </div>
      <div className="p-3 rounded-xl text-xs" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
        <p className="font-mono text-primary text-center text-sm">
          AEP = P<sub>rated</sub> × 8760h × CF = {calc.pRated} × 8760 × 0.30 = <strong>{calc.aepGWh} GWh</strong>
        </p>
      </div>
    </div>
  );
};

// ═══════ INTERACTIVE WEIBULL + POWER CURVE ═══════
const WeibullPowerCurve = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [k, setK] = useState(2.0);
  const [hoverV, setHoverV] = useState<number | null>(null);
  const c = 8; // scale parameter

  const W = 420, H = 200;
  const padL = 40, padR = 10, padT = 15, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const weibull = (v: number) => (k / c) * Math.pow(v / c, k - 1) * Math.exp(-Math.pow(v / c, k));
  const powerCurve = (v: number) => {
    if (v < 3) return 0;
    if (v > 25) return 0;
    if (v >= 12) return 1;
    return Math.pow((v - 3) / 9, 2);
  };

  const maxV = 28;
  const maxF = Math.max(...Array.from({ length: 100 }, (_, i) => weibull((i / 100) * maxV)));

  const vToX = (v: number) => padL + (v / maxV) * plotW;
  const fToY = (f: number) => padT + plotH - (f / maxF) * plotH;
  const pToY = (p: number) => padT + plotH - p * plotH;

  // Weibull curve points
  const weibullPts = Array.from({ length: 100 }, (_, i) => {
    const v = (i / 100) * maxV;
    return `${vToX(v)},${fToY(weibull(v))}`;
  }).join(' ');

  // Power curve points
  const powerPts = Array.from({ length: 100 }, (_, i) => {
    const v = (i / 100) * maxV;
    return `${vToX(v)},${pToY(powerCurve(v))}`;
  }).join(' ');

  // AEP shaded area (f(v) * P(v))
  const aepPts = Array.from({ length: 100 }, (_, i) => {
    const v = (i / 100) * maxV;
    const val = weibull(v) * powerCurve(v);
    return `${vToX(v)},${fToY(val)}`;
  });
  const aepPolygon = `${vToX(0)},${fToY(0)} ${aepPts.join(' ')} ${vToX(maxV)},${fToY(0)}`;

  // Compute AEP estimate
  const aepEstimate = useMemo(() => {
    let sum = 0;
    for (let v = 0; v < maxV; v += 0.1) sum += weibull(v) * powerCurve(v) * 0.1;
    return (sum * 8760 * 100).toFixed(0); // relative %
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
          
          {/* Grid lines */}
          {[0, 5, 10, 15, 20, 25].map(v => (
            <g key={v}>
              <line x1={vToX(v)} y1={padT} x2={vToX(v)} y2={padT + plotH} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.15" />
              <text x={vToX(v)} y={H - 8} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{v}</text>
            </g>
          ))}
          <text x={W / 2} y={H - 0} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{L('Швидкість вітру (м/с)', 'Wind Speed (m/s)')}</text>

          {/* AEP shaded area */}
          <polygon points={aepPolygon} fill="hsl(var(--primary))" opacity="0.12" />

          {/* Weibull distribution */}
          <polyline points={weibullPts} fill="none" stroke="hsl(120 70% 50%)" strokeWidth="2" opacity="0.8" />

          {/* Power curve */}
          <polyline points={powerPts} fill="none" stroke="hsl(25 80% 55%)" strokeWidth="2" strokeDasharray="6 3" opacity="0.7" />

          {/* Cut-in / cut-out markers */}
          <line x1={vToX(3)} y1={padT} x2={vToX(3)} y2={padT + plotH} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
          <line x1={vToX(25)} y1={padT} x2={vToX(25)} y2={padT + plotH} stroke="hsl(0 60% 50%)" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
          <text x={vToX(3)} y={padT - 3} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">cut-in</text>
          <text x={vToX(25)} y={padT - 3} textAnchor="middle" fontSize="7" fill="hsl(0 60% 50%)">cut-out</text>

          {/* Hover crosshair */}
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

          {/* Legend */}
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
  const maxV = 30, maxP = 1.15;

  const vToX = (v: number) => padL + (v / maxV) * plotW;
  const pToY = (p: number) => padT + plotH - (p / maxP) * plotH;

  const pitchP = (v: number) => { if (v < 3) return 0; if (v > 25) return 0; if (v >= 12) return 1; return ((v - 3) / 9) ** 2; };
  const stallP = (v: number) => { if (v < 3) return 0; if (v > 25) return 0; const peak = 1.1; if (v <= 14) return ((v - 3) / 11) ** 1.8 * peak; return Math.max(0, peak * (1 - ((v - 14) / 12) ** 1.5)); };

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

          {/* Grid */}
          {[0, 5, 10, 15, 20, 25, 30].map(v => (
            <line key={v} x1={vToX(v)} y1={padT} x2={vToX(v)} y2={padT + plotH} stroke="hsl(var(--border))" strokeWidth="0.4" opacity="0.15" />
          ))}
          {[0, 0.25, 0.5, 0.75, 1.0].map(p => (
            <g key={p}>
              <line x1={padL} y1={pToY(p)} x2={padL + plotW} y2={pToY(p)} stroke="hsl(var(--border))" strokeWidth="0.4" opacity="0.12" />
              <text x={padL - 4} y={pToY(p) + 3} textAnchor="end" fontSize="7" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{(p * 100).toFixed(0)}%</text>
            </g>
          ))}

          {/* Rated power line */}
          <line x1={padL} y1={pToY(1)} x2={padL + plotW} y2={pToY(1)} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
          <text x={padL + plotW + 2} y={pToY(1) + 3} fontSize="7" fill="hsl(var(--muted-foreground))">P_rated</text>

          {/* Pitch curve */}
          {(mode === 'both' || mode === 'pitch') && (
            <polyline points={makePts(pitchP)} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" opacity="0.85" />
          )}

          {/* Stall curve */}
          {(mode === 'both' || mode === 'stall') && (
            <polyline points={makePts(stallP)} fill="none" stroke="hsl(0 70% 55%)" strokeWidth="2" strokeDasharray="6 3" opacity="0.75" />
          )}

          {/* Hover */}
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

          {/* Axis label */}
          <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{L('Швидкість вітру (м/с)', 'Wind Speed (m/s)')}</text>

          {/* Legend */}
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
          <p className="text-[11px] text-muted-foreground">{L('Активний контроль кута лопаті підтримує номінальну потужність. Стандарт сучасних турбін.', 'Active blade angle control maintains rated power. Modern turbine standard.')}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'hsl(222 28% 12%)', border: '1px solid hsl(0 60% 40% / 0.2)' }}>
          <p className="text-xs font-semibold" style={{ color: 'hsl(0 70% 55%)' }}>{L('Зривне (Stall)', 'Stall Regulation')}</p>
          <p className="text-[11px] text-muted-foreground">{L('Аеродинаміка лопаті природно обмежує потужність. Простіший механізм, але потужність падає.', 'Blade aerodynamics naturally limit power. Simpler but power drops beyond rated speed.')}</p>
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
  const D = 20; // visual diameter
  const turbine2X = turbine1X + spacing * D;

  // Wake deficit at downstream position (Jensen model)
  const ct = 0.8; // thrust coefficient
  const k0 = 0.075; // wake decay constant
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

          {/* Wind flow arrows */}
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

          {/* Wake cone */}
          <path d={`M${turbine1X + 8} ${turbineY - D / 2} 
            L${Math.min(turbine1X + spacing * D + 30, W - 10)} ${turbineY - D / 2 - spacing * 3}
            L${Math.min(turbine1X + spacing * D + 30, W - 10)} ${turbineY + D / 2 + spacing * 3}
            L${turbine1X + 8} ${turbineY + D / 2} Z`}
            fill="url(#wakeGrad)" />

          {/* Turbulence markers inside wake */}
          {Array.from({ length: 6 }, (_, i) => {
            const px = turbine1X + 20 + i * (spacing * D / 7);
            const py = turbineY + Math.sin(i * 1.5) * (4 + i * 1.5);
            return (
              <motion.circle key={i} cx={px} cy={py} r="1.5" fill="hsl(210 70% 55%)" opacity="0.25"
                animate={{ cy: [py - 3, py + 3, py - 3] }}
                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }} />
            );
          })}

          {/* Turbine 1 */}
          <line x1={turbine1X} y1={turbineY - D / 2 - 5} x2={turbine1X} y2={turbineY + D / 2 + 5} stroke="hsl(var(--foreground))" strokeWidth="2.5" />
          <rect x={turbine1X - 3} y={turbineY + D / 2 + 5} width="6" height="8" rx="1" fill="hsl(var(--muted-foreground))" />
          <circle cx={turbine1X} cy={turbineY} r="3" fill="hsl(var(--primary))" style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))' }} />

          {/* Turbine 2 */}
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

          {/* Spacing label */}
          <line x1={turbine1X} y1={H - 18} x2={Math.min(turbine2X, W - 20)} y2={H - 18} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" />
          <text x={(turbine1X + Math.min(turbine2X, W - 20)) / 2} y={H - 8} textAnchor="middle" fontSize="9" fontFamily="monospace" fill="hsl(var(--primary))">
            {spacing}D
          </text>

          {/* Deficit label */}
          {turbine2X < W - 20 && (
            <text x={turbine2X} y={turbineY - D / 2 - 12} textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="700"
              fill={deficit > 25 ? 'hsl(0 70% 55%)' : deficit > 12 ? 'hsl(40 70% 55%)' : 'hsl(120 60% 50%)'}>
              -{deficit.toFixed(0)}%
            </text>
          )}

          {/* Wind direction label */}
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
  const [distance, setDistance] = useState(500);

  const Lw = 105; // source sound power level dB(A)
  const alpha = 0.005; // atmospheric absorption
  const Lp = Lw - 10 * Math.log10(4 * Math.PI * distance * distance) - alpha * distance;

  const W = 300, H = 170;
  const cx = W / 2, cy = 130;
  const R = 100;
  const startAngle = Math.PI;
  const endAngle = 0;

  const dbToAngle = (db: number) => {
    const norm = Math.max(0, Math.min(1, (db - 20) / 60)); // 20-80 dB range
    return startAngle + (endAngle - startAngle) * norm;
  };

  const refLevels = [
    { db: 30, label: L('Бібліотека', 'Library'), color: 'hsl(120 60% 50%)' },
    { db: 40, label: L('Тихий офіс', 'Quiet office'), color: 'hsl(60 70% 50%)' },
    { db: 55, label: L('Розмова', 'Conversation'), color: 'hsl(25 80% 55%)' },
    { db: 70, label: L('Трафік', 'Traffic'), color: 'hsl(0 70% 50%)' },
  ];

  const angle = dbToAngle(Lp);
  const needleX = cx + Math.cos(angle) * (R - 10);
  const needleY = cy + Math.sin(angle) * (R - 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{L('Відстань', 'Distance')}</span>
        <div className="flex-1"><Slider value={[distance]} onValueChange={([v]) => setDistance(v)} min={100} max={2000} step={50} /></div>
        <span className="text-sm font-mono text-primary font-bold w-16 text-right">{distance}m</span>
      </div>

      <div className="rounded-xl overflow-hidden flex justify-center p-4" style={{ backgroundColor: 'hsl(222 28% 6%)', border: '1px solid hsl(var(--border) / 0.12)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[300px] h-40">
          {/* Arc background segments */}
          {[
            { from: 20, to: 35, color: 'hsl(120 60% 50%)' },
            { from: 35, to: 45, color: 'hsl(60 70% 50%)' },
            { from: 45, to: 60, color: 'hsl(25 80% 55%)' },
            { from: 60, to: 80, color: 'hsl(0 70% 50%)' },
          ].map((seg, i) => {
            const a1 = dbToAngle(seg.from), a2 = dbToAngle(seg.to);
            const x1 = cx + Math.cos(a1) * R, y1 = cy + Math.sin(a1) * R;
            const x2 = cx + Math.cos(a2) * R, y2 = cy + Math.sin(a2) * R;
            return (
              <path key={i} d={`M${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2}`}
                fill="none" stroke={seg.color} strokeWidth="8" opacity="0.2" strokeLinecap="round" />
            );
          })}

          {/* Tick marks + labels */}
          {[20, 30, 40, 50, 60, 70, 80].map(db => {
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

          {/* Reference level markers */}
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

          {/* Needle */}
          <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="hsl(var(--primary))" strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))' }} />
          <circle cx={cx} cy={cy} r="4" fill="hsl(var(--primary))" />

          {/* Current value */}
          <text x={cx} y={cy - 20} textAnchor="middle" fontSize="20" fontWeight="800" fontFamily="monospace"
            fill={Lp > 45 ? 'hsl(0 70% 55%)' : Lp > 35 ? 'hsl(40 70% 55%)' : 'hsl(120 60% 50%)'}>
            {Lp.toFixed(1)}
          </text>
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">dB(A)</text>

          {/* EU limit marker */}
          {(() => {
            const limitA = dbToAngle(40);
            return (
              <>
                <line x1={cx + Math.cos(limitA) * (R - 5)} y1={cy + Math.sin(limitA) * (R - 5)}
                  x2={cx + Math.cos(limitA) * (R + 8)} y2={cy + Math.sin(limitA) * (R + 8)}
                  stroke="hsl(0 70% 55%)" strokeWidth="1.5" strokeDasharray="3 2" />
                <text x={cx + Math.cos(limitA) * (R + 18)} y={cy + Math.sin(limitA) * (R + 18) + 3}
                  textAnchor="middle" fontSize="7" fill="hsl(0 70% 55%)" fontWeight="600">
                  {L('ЄС ліміт', 'EU limit')}
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
        backgroundColor: Lp > 40 ? 'hsl(0 60% 15% / 0.3)' : 'hsl(120 40% 15% / 0.3)',
        border: `1px solid ${Lp > 40 ? 'hsl(0 60% 40% / 0.3)' : 'hsl(120 50% 40% / 0.3)'}`,
      }}>
        <span className="text-xs font-semibold" style={{ color: Lp > 40 ? 'hsl(0 70% 55%)' : 'hsl(120 60% 50%)' }}>
          {Lp > 40 ? L('⚠ Перевищує нічний ліміт ЄС (35–40 dB)', '⚠ Exceeds EU night limit (35–40 dB)') :
           L('✓ В межах нормативів', '✓ Within regulatory limits')}
        </span>
      </div>
    </div>
  );
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
          <Settings className="w-4 h-4 text-primary" /> {L('Специфікації сучасних вітротурбін', 'Modern Wind Turbine Specifications')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          {L('Промислові турбіни з номінальною потужністю, геометрією ротора та оцінкою AEP. Наведіть курсор на діаграму.',
             'Industrial turbines with rated power, rotor geometry, and AEP estimates. Hover chart for details.')}
        </p>
        <div className="p-3 rounded-xl mb-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--border) / 0.15)' }}>
          <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{L('Діаметри ротора + площа ометання', 'Rotor Diameters + Swept Area')}</p>
          <RotorComparisonSVG />
        </div>
      </motion.div>

      {/* Turbine expandable cards */}
      <div className="space-y-2">
        {turbineSpecs.map((t, i) => {
          const isOpen = openTurbine === `turbine-${i}`;
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
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{t.model}</span>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">{t.power}</Badge>
                    <span>{L('Ротор', 'Rotor')}: {t.rotor}</span>
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
                      <div className="pt-3 grid grid-cols-2 gap-2 text-xs sm:text-sm">
                        {[
                          { label: L('Висота щогли', 'Hub Height'), value: t.hub },
                          { label: L('Регулювання', 'Regulation'), value: t.regulation },
                          { label: L('Швидкість пуску', 'Cut-in Speed'), value: `${t.cutIn} ${L('м/с', 'm/s')}` },
                          { label: L('Швидкість зупинки', 'Cut-out Speed'), value: `${t.cutOut} ${L('м/с', 'm/s')}` },
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
          <Calculator className="w-5 h-5 text-primary" /> {L('Інтерактивний калькулятор AEP', 'Interactive AEP Calculator')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          {L('Регулюйте швидкість вітру та діаметр ротора.',
             'Adjust wind speed and rotor diameter to estimate annual energy production.')}
        </p>
        <AEPCalculator lang={lang} />
      </motion.div>

      {/* ═══ ECONOMIC METRICS ═══ */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> {L('Економічні показники', 'Economic Performance')}
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
                  {item.trend === 'down' ? `↓ ${item.pct || ''}` : item.trend === 'up' ? '↑' : '→'} {item.trend === 'down' ? (lang === 'ua' ? 'з 2015' : 'since 2015') : item.trend === 'up' ? (lang === 'ua' ? 'Зростає' : 'Improving') : (lang === 'ua' ? 'Стабільний' : 'Stable')}
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
          {L('Порівняйте криві потужності двох типів регулювання. Наведіть курсор або перемикайте режими.',
             'Compare power curves of two regulation types. Hover or toggle modes.')}
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
          {L('Акустичний вплив — аналіз відстані', 'Acoustic Impact — Distance Analysis')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Рівень звуку як функція відстані. Калькулятор SPL з атмосферним поглинанням.',
             'Sound pressure level as function of distance. SPL calculator with atmospheric absorption.')}
        </p>
        <NoiseGauge lang={lang} />
      </div>
    </div>
  );
};
