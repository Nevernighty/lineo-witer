import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type WindGeneratorSpecs } from "@/utils/windCalculations";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wind, Zap, Wrench, Calculator, BarChart3, TrendingUp, Info, AlertTriangle, Leaf, DollarSign, Activity } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

interface GeneratorSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: WindGeneratorSpecs;
  onSettingsChange: (settings: WindGeneratorSpecs) => void;
  windSpeed: number;
  lang?: 'ua' | 'en';
}

const bladeProfiles = [
  { value: 'NACA 4412', lift: 1.2, drag: 0.012, clcd: 100, desc_ua: 'Класичний профіль для малих турбін', desc_en: 'Classic profile for small turbines' },
  { value: 'NACA 63-215', lift: 1.4, drag: 0.008, clcd: 175, desc_ua: 'Ламінарний профіль, висока ефективність', desc_en: 'Laminar profile, high efficiency' },
  { value: 'S809', lift: 1.0, drag: 0.010, clcd: 100, desc_ua: 'Спеціально для вітрових турбін (NREL)', desc_en: 'Designed specifically for wind turbines (NREL)' },
  { value: 'DU 93-W-210', lift: 1.3, drag: 0.009, clcd: 144, desc_ua: 'Профіль Делфтського університету', desc_en: 'Delft University profile' },
];

const genTypes = [
  { value: 'PMSG', desc_ua: 'Синхронний з постійними магнітами — безредукторний', desc_en: 'Permanent magnet synchronous — direct drive', efficiency: 0.96, icon: '🧲' },
  { value: 'DFIG', desc_ua: 'Подвійне живлення — з редуктором', desc_en: 'Doubly-fed induction — geared', efficiency: 0.93, icon: '⚙️' },
  { value: 'SCIG', desc_ua: 'Асинхронний з к.з. ротором', desc_en: 'Squirrel cage induction', efficiency: 0.91, icon: '🔄' },
];

const materials = [
  { name: 'E-Glass/Epoxy', E: 40, sigma: 1000, rho: 2100, color: 'hsl(var(--primary))', desc_ua: 'Стандарт для лопатей', desc_en: 'Standard for blades' },
  { name: 'Carbon/Epoxy', E: 135, sigma: 1500, rho: 1600, color: 'hsl(200 80% 60%)', desc_ua: 'Преміум, легший, дорожчий', desc_en: 'Premium, lighter, costlier' },
  { name: 'Balsa/GF Sandwich', E: 8, sigma: 200, rho: 250, color: 'hsl(40 80% 60%)', desc_ua: 'Легкий сандвіч для обшивки', desc_en: 'Lightweight sandwich for skins' },
  { name: 'Steel (Tower)', E: 210, sigma: 355, rho: 7850, color: 'hsl(0 60% 55%)', desc_ua: 'Конструкційна сталь S355', desc_en: 'Structural steel S355' },
];

// ─── GlowSlider ───
const GlowSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  displayValue: string;
  infoText?: string;
  color?: string;
}> = ({ value, onChange, min, max, step, label, displayValue, infoText, color }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const glowColor = color || 'hsl(var(--primary))';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: `${glowColor}` }}>{label}</span>
          {infoText && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 opacity-40 hover:opacity-100 cursor-help transition-colors" style={{ color: glowColor }} />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[280px] bg-[#0d1117] border-primary/40 text-xs leading-relaxed z-[100]">
                  <p>{infoText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="text-xs font-mono font-semibold" style={{ color: glowColor }}>{displayValue}</span>
      </div>
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full border" style={{ backgroundColor: 'hsl(var(--background) / 0.6)', borderColor: `${glowColor}33` }} />
        <div className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${percentage}%`, background: `linear-gradient(90deg, ${glowColor}cc, ${glowColor})`, boxShadow: `0 0 10px ${glowColor}80` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
          style={{ left: `calc(${percentage}% - 6px)`, backgroundColor: glowColor, borderColor: 'hsl(var(--background))', boxShadow: `0 0 12px ${glowColor}cc` }} />
        <Slider value={[value]} onValueChange={(v) => onChange(v[0])} min={min} max={max} step={step}
          className="absolute inset-0 opacity-0 cursor-pointer" />
      </div>
    </div>
  );
};

// ─── Tab Button ───
const tabItems = [
  { value: 'aero', icon: Wind, ua: 'Аеро', en: 'Aero', color: 'hsl(210 90% 60%)' },
  { value: 'struct', icon: Wrench, ua: 'Конст.', en: 'Struct', color: 'hsl(25 90% 55%)' },
  { value: 'elec', icon: Zap, ua: 'Елект.', en: 'Elec', color: 'hsl(50 90% 55%)' },
  { value: 'curve', icon: BarChart3, ua: 'Крива', en: 'Curve', color: 'hsl(270 70% 60%)' },
  { value: 'calc', icon: Calculator, ua: 'Розр.', en: 'Calc', color: 'hsl(var(--primary))' },
];

// ─── Blade Profile SVG ───
const BladeProfileSVG = ({ profile, attackAngle }: { profile: typeof bladeProfiles[0]; attackAngle: number }) => {
  const isStall = attackAngle > 15;
  // NACA-like airfoil shape
  const upperPoints = [];
  const lowerPoints = [];
  for (let i = 0; i <= 20; i++) {
    const x = i / 20;
    const t = 0.12; // thickness
    const camber = 0.04;
    const yc = camber * (x < 0.4 ? (2 * 0.4 * x - x * x) / (0.4 * 0.4) : ((1 - 2 * 0.4) + 2 * 0.4 * x - x * x) / ((1 - 0.4) * (1 - 0.4)));
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1015 * x ** 4);
    upperPoints.push({ x: 40 + x * 200, y: 50 - (yc + yt) * 300 });
    lowerPoints.push({ x: 40 + x * 200, y: 50 - (yc - yt) * 300 });
  }
  const upper = upperPoints.map(p => `${p.x},${p.y}`).join(' ');
  const lower = lowerPoints.map(p => `${p.x},${p.y}`).join(' ');
  const all = [...upperPoints, ...lowerPoints.reverse()].map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 280 100" className="w-full h-20">
      <defs>
        <linearGradient id="airfoilGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="hsl(210 90% 60%)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="hsl(210 90% 60%)" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* Flow lines */}
      {[-20, -10, 0, 10, 20].map(dy => (
        <line key={dy} x1="10" y1={50 + dy} x2="270" y2={50 + dy - attackAngle * 0.5}
          stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.15" strokeDasharray="4,4" />
      ))}
      {/* Airfoil */}
      <g transform={`rotate(${-attackAngle}, 140, 50)`}>
        <polygon points={all} fill="url(#airfoilGrad)" stroke="hsl(210 90% 60%)" strokeWidth="1.5" />
        {/* Chord line */}
        <line x1="40" y1="50" x2="240" y2="50" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
      </g>
      {/* Stall warning */}
      {isStall && (
        <g>
          <text x="200" y="15" fontSize="8" fill="hsl(var(--destructive))" fontWeight="bold" className="animate-pulse">⚠ STALL</text>
          {/* Separation vortices */}
          {[0,1,2].map(i => (
            <circle key={i} cx={200 + i * 20} cy={35 + Math.sin(i) * 8} r={3 + i} fill="none" stroke="hsl(var(--destructive))" strokeWidth="0.8" opacity={0.5 - i * 0.1} strokeDasharray="2,2" />
          ))}
        </g>
      )}
      {/* Lift/Drag labels */}
      <text x="10" y="95" fontSize="7" fill="hsl(var(--muted-foreground))">
        Cl/Cd = {profile.clcd} | Cl = {profile.lift} | Cd = {profile.drag}
      </text>
    </svg>
  );
};

// ─── Radar Chart SVG ───
const RadarChartSVG = ({ materials: mats }: { materials: typeof materials }) => {
  const axes = ['E (GPa)', 'σ (MPa)', 'ρ (kg/m³)'];
  const maxVals = [210, 1500, 7850];
  const cx = 110, cy = 75, r = 55;
  const angles = axes.map((_, i) => (i * 2 * Math.PI / 3) - Math.PI / 2);

  const getPoint = (val: number, maxVal: number, angleIdx: number) => ({
    x: cx + (val / maxVal) * r * Math.cos(angles[angleIdx]),
    y: cy + (val / maxVal) * r * Math.sin(angles[angleIdx]),
  });

  return (
    <svg viewBox="0 0 220 150" className="w-full h-36">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f}
          points={angles.map(a => `${cx + f * r * Math.cos(a)},${cy + f * r * Math.sin(a)}`).join(' ')}
          fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
      ))}
      {/* Axes */}
      {angles.map((a, i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
          <text x={cx + (r + 12) * Math.cos(a)} y={cy + (r + 12) * Math.sin(a)} fontSize="6" fill="hsl(var(--muted-foreground))" textAnchor="middle" dominantBaseline="middle">{axes[i]}</text>
        </g>
      ))}
      {/* Material polygons */}
      {mats.map((mat, mi) => {
        const pts = [
          getPoint(mat.E, maxVals[0], 0),
          getPoint(mat.sigma, maxVals[1], 1),
          getPoint(mat.rho, maxVals[2], 2),
        ];
        return (
          <g key={mi}>
            <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')}
              fill={mat.color} fillOpacity="0.08" stroke={mat.color} strokeWidth="1.2" opacity="0.7" />
            {pts.map((p, pi) => (
              <circle key={pi} cx={p.x} cy={p.y} r="2" fill={mat.color} />
            ))}
          </g>
        );
      })}
      {/* Legend */}
      {mats.map((mat, i) => (
        <g key={i} transform={`translate(155, ${20 + i * 14})`}>
          <rect width="8" height="8" rx="1" fill={mat.color} opacity="0.7" />
          <text x="12" y="7" fontSize="6" fill="hsl(var(--foreground))">{mat.name.split(' ')[0]}</text>
        </g>
      ))}
    </svg>
  );
};

// ─── Generator Schematic SVG ───
const GeneratorSchematicSVG = ({ genType, poleCount }: { genType: string; poleCount: number }) => {
  const syncSpeed = (60 * 50 / (poleCount / 2));
  return (
    <svg viewBox="0 0 280 80" className="w-full h-16">
      {/* Flow: Wind → Rotor → [Gearbox] → Generator → Grid */}
      {[
        { x: 15, label: '🌬️', sub: 'Wind' },
        { x: 65, label: '⚡', sub: 'Rotor' },
        ...(genType === 'DFIG' ? [{ x: 125, label: '⚙️', sub: 'Gearbox' }] : []),
        { x: genType === 'DFIG' ? 185 : 140, label: genType === 'PMSG' ? '🧲' : genType === 'DFIG' ? '🔌' : '🔄', sub: genType },
        { x: genType === 'DFIG' ? 245 : 215, label: '🔋', sub: 'Grid' },
      ].map((node, i, arr) => (
        <g key={i}>
          <rect x={node.x - 18} y={15} width="36" height="36" rx="6" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.8" opacity="0.4" />
          <text x={node.x} y={35} textAnchor="middle" fontSize="14">{node.label}</text>
          <text x={node.x} y={62} textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))">{node.sub}</text>
          {i < arr.length - 1 && (
            <line x1={node.x + 18} y1={33} x2={arr[i + 1].x - 18} y2={33} stroke="hsl(var(--primary))" strokeWidth="1" markerEnd="url(#arrowhead)" opacity="0.5" />
          )}
        </g>
      ))}
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="hsl(var(--primary))" opacity="0.6" />
        </marker>
      </defs>
      <text x="140" y="76" textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))">
        n_sync = {syncSpeed.toFixed(0)} RPM @ 50Hz | {poleCount} poles
      </text>
    </svg>
  );
};

// ─── Interactive Power Curve SVG ───
const PowerCurveSVG = ({ currentSettings, windSpeed, lang, weibullK, weibullC }: {
  currentSettings: WindGeneratorSpecs; windSpeed: number; lang: 'ua' | 'en'; weibullK: number; weibullC: number;
}) => {
  const [hover, setHover] = useState<{ x: number; v: number; p: number } | null>(null);
  const cutIn = 3, cutOut = 25;
  const rated = currentSettings.ratedPower;
  const ratedSpeed = Math.min(Math.max(Math.pow(rated / (0.5 * 1.225 * Math.PI * currentSettings.bladeLength ** 2 * currentSettings.efficiency), 1 / 3), 8), 16);

  const getPower = (v: number) => {
    if (v < cutIn || v > cutOut) return 0;
    if (v < ratedSpeed) return Math.min(0.5 * 1.225 * Math.PI * currentSettings.bladeLength ** 2 * v ** 3 * currentSettings.efficiency, rated);
    return rated;
  };

  const getWeibull = (v: number) => {
    if (v <= 0) return 0;
    return (weibullK / weibullC) * Math.pow(v / weibullC, weibullK - 1) * Math.exp(-Math.pow(v / weibullC, weibullK));
  };

  const powerPoints: string[] = [];
  const weibullPoints: string[] = [];
  const aepFillPoints: string[] = [];
  const maxWeibull = Math.max(...Array.from({ length: 60 }, (_, i) => getWeibull(i * 0.5 + 0.5)));

  for (let v = 0; v <= 30; v += 0.5) {
    const x = 30 + (v / 30) * 240;
    const p = getPower(v);
    const y = 120 - (p / rated) * 100;
    powerPoints.push(`${x},${y}`);

    const w = getWeibull(v);
    const wy = 120 - (w / maxWeibull) * 80;
    weibullPoints.push(`${x},${wy}`);

    // AEP area = P(v) * f(v)
    const aepVal = p * w;
    const maxAep = rated * maxWeibull;
    const ay = 120 - (maxAep > 0 ? (aepVal / maxAep) * 60 : 0);
    aepFillPoints.push(`${x},${ay}`);
  }

  const currentX = 30 + (windSpeed / 30) * 240;
  const currentP = getPower(windSpeed);
  const currentY = 120 - (currentP / rated) * 100;
  const formatP = (w: number) => w >= 1e6 ? `${(w / 1e6).toFixed(1)}MW` : w >= 1e3 ? `${(w / 1e3).toFixed(0)}kW` : `${w.toFixed(0)}W`;

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const v = Math.max(0, Math.min(30, relX * 30 * (280 / 240) - 30 / 240 * 30));
    const svgX = 30 + (v / 30) * 240;
    setHover({ x: svgX, v, p: getPower(v) });
  }, [currentSettings, ratedSpeed]);

  return (
    <svg viewBox="0 0 290 145" className="w-full h-40 cursor-crosshair" onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)}>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1="30" y1={120 - f * 100} x2="270" y2={120 - f * 100} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray={f === 0 ? "" : "2,3"} opacity="0.3" />
      ))}
      {[0, 5, 10, 15, 20, 25, 30].map(v => (
        <g key={v}>
          <line x1={30 + (v / 30) * 240} y1="120" x2={30 + (v / 30) * 240} y2="122" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" />
          <text x={30 + (v / 30) * 240} y="132" textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))">{v}</text>
        </g>
      ))}
      {/* Cut-in / cut-out zones */}
      <rect x="30" y="20" width={(cutIn / 30) * 240} height="100" fill="hsl(var(--destructive))" opacity="0.05" />
      <rect x={30 + (cutOut / 30) * 240} y="20" width={((30 - cutOut) / 30) * 240} height="100" fill="hsl(var(--destructive))" opacity="0.05" />
      <line x1={30 + (cutIn / 30) * 240} y1="20" x2={30 + (cutIn / 30) * 240} y2="120" stroke="hsl(var(--destructive))" strokeWidth="0.5" strokeDasharray="3,2" opacity="0.4" />
      <line x1={30 + (cutOut / 30) * 240} y1="20" x2={30 + (cutOut / 30) * 240} y2="120" stroke="hsl(var(--destructive))" strokeWidth="0.5" strokeDasharray="3,2" opacity="0.4" />
      {/* AEP shaded area */}
      <polyline points={`30,120 ${aepFillPoints.join(' ')} 270,120`} fill="hsl(var(--primary))" opacity="0.06" />
      {/* Weibull distribution (dashed) */}
      <polyline points={weibullPoints.join(' ')} fill="none" stroke="hsl(270 70% 60%)" strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
      {/* Power curve fill */}
      <polyline points={`30,120 ${powerPoints.join(' ')} 270,120`} fill="hsl(var(--primary))" opacity="0.08" />
      {/* Power curve */}
      <polyline points={powerPoints.join(' ')} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
      {/* Current point */}
      <line x1={currentX} y1={currentY} x2={currentX} y2="120" stroke="hsl(var(--primary))" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
      <circle cx={currentX} cy={currentY} r="4" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="1.5">
        <animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite" />
      </circle>
      <text x={currentX} y={currentY - 8} textAnchor="middle" fontSize="7" fontWeight="bold" fill="hsl(var(--primary))">{formatP(currentP)}</text>
      {/* Hover crosshair */}
      {hover && (
        <g>
          <line x1={hover.x} y1="20" x2={hover.x} y2="120" stroke="hsl(var(--foreground))" strokeWidth="0.5" opacity="0.3" />
          <rect x={hover.x - 28} y="8" width="56" height="14" rx="3" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="0.5" />
          <text x={hover.x} y="17" textAnchor="middle" fontSize="6" fill="hsl(var(--foreground))">
            {hover.v.toFixed(1)}m/s → {formatP(hover.p)}
          </text>
        </g>
      )}
      {/* Labels */}
      <text x="272" y="23" fontSize="5" fill="hsl(var(--primary))">{formatP(rated)}</text>
      <text x="150" y="143" textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))">
        {lang === 'ua' ? 'Швидкість вітру (m/s)' : 'Wind Speed (m/s)'}
      </text>
      <text x="275" y="40" fontSize="5" fill="hsl(270 70% 60%)" opacity="0.7">f(V)</text>
      <text x="8" y="70" textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))" transform="rotate(-90 8 70)">P</text>
    </svg>
  );
};

// ─── Efficiency Chain SVG ───
const EfficiencyChainSVG = ({ cp, genEff, lang }: { cp: number; genEff: number; lang: 'ua' | 'en' }) => {
  const convEff = 0.97;
  const total = cp * genEff * convEff;
  const stages = [
    { label: lang === 'ua' ? 'Вітер' : 'Wind', value: 1, icon: '🌬️' },
    { label: `Cp=${cp}`, value: cp, icon: '💨' },
    { label: `η=${(genEff * 100).toFixed(0)}%`, value: cp * genEff, icon: '⚡' },
    { label: `η=${(convEff * 100).toFixed(0)}%`, value: total, icon: '🔋' },
  ];

  return (
    <svg viewBox="0 0 280 50" className="w-full h-10">
      {stages.map((s, i) => {
        const x = 20 + i * 70;
        return (
          <g key={i}>
            <rect x={x - 15} y={8} width="30" height="30" rx="6" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.8" opacity={0.3 + s.value * 0.5} />
            <text x={x} y={25} textAnchor="middle" fontSize="12">{s.icon}</text>
            <text x={x} y={46} textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))">{s.label}</text>
            {i < stages.length - 1 && (
              <g>
                <line x1={x + 15} y1={23} x2={x + 55} y2={23} stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.4" markerEnd="url(#arrowhead2)" />
                <text x={x + 35} y={18} textAnchor="middle" fontSize="5" fill="hsl(var(--primary))" opacity="0.6">
                  {(stages[i + 1].value / s.value * 100).toFixed(0)}%
                </text>
              </g>
            )}
          </g>
        );
      })}
      <defs>
        <marker id="arrowhead2" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
          <polygon points="0 0, 5 2, 0 4" fill="hsl(var(--primary))" opacity="0.5" />
        </marker>
      </defs>
    </svg>
  );
};

// ─── Main Component ───
export const GeneratorSettings = ({
  open, onOpenChange, currentSettings, onSettingsChange, windSpeed, lang = 'ua'
}: GeneratorSettingsProps) => {
  const [activeTab, setActiveTab] = useState('aero');
  const [bladeProfile, setBladeProfile] = useState('NACA 63-215');
  const [attackAngle, setAttackAngle] = useState(8);
  const [genType, setGenType] = useState('PMSG');
  const [poleCount, setPoleCount] = useState(48);
  const [voltage, setVoltage] = useState(690);
  const [weibullK, setWeibullK] = useState(2.0);
  const [weibullC, setWeibullC] = useState(7.0);

  const label = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const profile = bladeProfiles.find(p => p.value === bladeProfile) || bladeProfiles[0];
  const genTypeData = genTypes.find(g => g.value === genType) || genTypes[0];

  const liveCalc = useMemo(() => {
    const R = currentSettings.bladeLength;
    const rho = 1.225;
    const A = Math.PI * R * R;
    const V = windSpeed;
    const Cp = currentSettings.efficiency;
    const P = 0.5 * rho * A * Math.pow(V, 3) * Cp;
    const omega = (7 * V) / R;
    const torque = omega > 0 ? P / omega : 0;
    const bladeM = 0.5 * R * 15;
    const Fc = bladeM * omega * omega * (R / 2);
    const capacityFactor = Math.min(P / currentSettings.ratedPower, 1);

    // Reynolds number
    const chord = R * 0.07; // approx chord
    const mu = 1.81e-5; // dynamic viscosity
    const Re = (rho * V * chord) / mu;

    // TSR
    const tsr = omega * R / (V || 1);

    // Fatigue cycles (20 years)
    const rps = omega / (2 * Math.PI);
    const fatigueCycles = rps * 3600 * 8760 * 20;

    // Blade deflection estimate (simplified)
    const deflection = (rho * V * V * A * R) / (48 * 40e9 * (0.01 * R ** 4)); // rough

    // AEP using Weibull
    let aep = 0;
    for (let v = 0.5; v <= 30; v += 0.5) {
      const fv = (weibullK / weibullC) * Math.pow(v / weibullC, weibullK - 1) * Math.exp(-Math.pow(v / weibullC, weibullK));
      let pv = 0;
      if (v >= 3 && v <= 25) {
        pv = Math.min(0.5 * rho * A * Math.pow(v, 3) * Cp, currentSettings.ratedPower);
      }
      aep += pv * fv * 0.5 * 8760;
    }

    // LCOE estimate (simplified)
    const capex = currentSettings.ratedPower * 1.2; // $/W typical
    const opex = capex * 0.025; // 2.5% annual
    const lcoe = aep > 0 ? ((capex + opex * 20) / (aep * 20 / 1000)) : 0; // $/kWh * 1000 = $/MWh

    // CO2 offset (0.5 kg CO2/kWh grid average)
    const co2Offset = aep * 0.5 / 1000; // tonnes/year

    return { P, omega, torque, Fc, rps, capacityFactor, aep, Re, tsr, fatigueCycles, deflection, lcoe, co2Offset };
  }, [currentSettings, windSpeed, weibullK, weibullC]);

  const formatP = (w: number) => w >= 1e6 ? `${(w / 1e6).toFixed(2)} MW` : w >= 1e3 ? `${(w / 1e3).toFixed(1)} kW` : `${w.toFixed(0)} W`;
  const formatE = (wh: number) => wh >= 1e6 ? `${(wh / 1e6).toFixed(1)} GWh` : wh >= 1e3 ? `${(wh / 1e3).toFixed(0)} MWh` : `${wh.toFixed(0)} kWh`;

  const activeTabData = tabItems.find(t => t.value === activeTab)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-primary/30" style={{ backgroundColor: '#0a0e14' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Wrench className="w-5 h-5 text-primary" />
            {label('Інженерна панель генератора', 'Generator Engineering Panel')}
          </DialogTitle>
        </DialogHeader>

        {/* ─── Custom Tabs ─── */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'hsl(var(--background) / 0.5)' }}>
          {tabItems.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                className="flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-md text-xs font-medium transition-all duration-200 relative"
                style={{
                  background: isActive ? `${tab.color}22` : 'transparent',
                  color: isActive ? tab.color : 'hsl(var(--muted-foreground))',
                  borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                  boxShadow: isActive ? `0 2px 12px ${tab.color}33` : 'none',
                }}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'ua' ? tab.ua : tab.en}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Tab Content ─── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            {/* ═══ AERO ═══ */}
            {activeTab === 'aero' && (
              <div className="space-y-4">
                {/* Blade profile visualizer */}
                <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--background) / 0.4)', borderColor: 'hsl(210 90% 60% / 0.2)' }}>
                  <BladeProfileSVG profile={profile} attackAngle={attackAngle} />
                </div>

                <div>
                  <Label className="text-xs">{label('Профіль лопаті (NACA)', 'Blade Profile (NACA)')}</Label>
                  <Select value={bladeProfile} onValueChange={setBladeProfile}>
                    <SelectTrigger className="mt-1 border-border/30 bg-background/40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {bladeProfiles.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.value} — Cl/Cd={p.clcd}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {lang === 'ua' ? profile.desc_ua : profile.desc_en}
                  </p>
                </div>

                <GlowSlider value={attackAngle} onChange={setAttackAngle} min={0} max={20} step={0.5}
                  label={label('Кут атаки', 'Angle of Attack')} displayValue={`${attackAngle}°`}
                  infoText={label('6-10° — оптимально. >15° — зрив потоку (stall)', '6-10° optimal. >15° — flow separation (stall)')}
                  color={attackAngle > 15 ? 'hsl(var(--destructive))' : 'hsl(210 90% 60%)'} />

                {attackAngle > 15 && (
                  <div className="flex items-center gap-2 text-[10px] text-destructive p-2 rounded-md" style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)' }}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {label('Зрив потоку! Різке падіння підйомної сили.', 'Flow separation! Sudden lift drop.')}
                  </div>
                )}

                <GlowSlider value={currentSettings.bladeLength} onChange={v => onSettingsChange({ ...currentSettings, bladeLength: v })}
                  min={5} max={120} step={1} label={label('Довжина лопаті', 'Blade Length')} displayValue={`${currentSettings.bladeLength}m`}
                  infoText={label('A = πR². Подвоєння R → 4x потужність', 'A = πR². Double R → 4x power')} color="hsl(210 90% 60%)" />

                <GlowSlider value={currentSettings.efficiency} onChange={v => onSettingsChange({ ...currentSettings, efficiency: v })}
                  min={0.1} max={0.55} step={0.01} label={label('Ефективність (Cp)', 'Efficiency (Cp)')} displayValue={`${currentSettings.efficiency}`}
                  infoText={label('Ліміт Бетца: 0.593. Реальні: 0.35-0.50', 'Betz limit: 0.593. Real: 0.35-0.50')} color="hsl(var(--primary))" />

                {/* Betz gauge */}
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--border))" strokeWidth="3" opacity="0.2" />
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                        strokeDasharray={`${(currentSettings.efficiency / 0.593) * 97.4} 97.4`}
                        strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))' }} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-primary">
                      {((currentSettings.efficiency / 0.593) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <p>{label('Ефективність vs ліміт Бетца', 'Efficiency vs Betz limit')}</p>
                    <p className="font-mono">Re ≈ {liveCalc.Re > 1e6 ? `${(liveCalc.Re / 1e6).toFixed(1)}M` : `${(liveCalc.Re / 1e3).toFixed(0)}k`}</p>
                    <p className="font-mono">TSR = {liveCalc.tsr.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STRUCT ═══ */}
            {activeTab === 'struct' && (
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(25 90% 55%)' }}>
                  {label('Властивості матеріалів', 'Material Properties')}
                </div>

                {/* Radar chart */}
                <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--background) / 0.4)', borderColor: 'hsl(25 90% 55% / 0.2)' }}>
                  <RadarChartSVG materials={materials} />
                </div>

                {/* Material cards */}
                <div className="space-y-2">
                  {materials.map((mat, i) => (
                    <div key={i} className="p-2.5 rounded-lg border transition-all hover:border-opacity-60 group" style={{
                      backgroundColor: 'hsl(var(--background) / 0.3)',
                      borderColor: `${mat.color}33`,
                      borderLeftWidth: '3px',
                      borderLeftColor: mat.color,
                    }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">{mat.name}</span>
                        <span className="text-[9px] text-muted-foreground">{lang === 'ua' ? mat.desc_ua : mat.desc_en}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <span className="text-muted-foreground">{label('Модуль', 'Modulus')}</span>
                          <p className="font-mono text-foreground">{mat.E} GPa</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">σ</span>
                          <p className="font-mono text-foreground">{mat.sigma} MPa</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ρ</span>
                          <p className="font-mono text-foreground">{mat.rho} kg/m³</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <GlowSlider value={currentSettings.height} onChange={v => onSettingsChange({ ...currentSettings, height: v })}
                  min={10} max={200} step={5} label={label('Висота маточини', 'Hub Height')} displayValue={`${currentSettings.height}m`}
                  infoText={label('Висота впливає на швидкість вітру за степеневим законом', 'Height affects wind speed via power law')}
                  color="hsl(25 90% 55%)" />

                {/* Deep data: blade mass & fatigue */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg border text-center" style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(25 90% 55% / 0.2)' }}>
                    <div className="text-[9px] text-muted-foreground uppercase">{label('Маса лопаті (оцінка)', 'Blade Mass (est.)')}</div>
                    <p className="text-sm font-mono font-bold text-foreground">{(0.5 * currentSettings.bladeLength * 15).toFixed(0)} kg</p>
                  </div>
                  <div className="p-2 rounded-lg border text-center" style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(25 90% 55% / 0.2)' }}>
                    <div className="text-[9px] text-muted-foreground uppercase">{label('Цикли (20 р.)', 'Fatigue (20yr)')}</div>
                    <p className="text-sm font-mono font-bold text-foreground">
                      {liveCalc.fatigueCycles > 1e9 ? `${(liveCalc.fatigueCycles / 1e9).toFixed(1)}G` :
                        liveCalc.fatigueCycles > 1e6 ? `${(liveCalc.fatigueCycles / 1e6).toFixed(0)}M` :
                          `${(liveCalc.fatigueCycles / 1e3).toFixed(0)}k`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ ELEC ═══ */}
            {activeTab === 'elec' && (
              <div className="space-y-4">
                {/* Generator schematic */}
                <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--background) / 0.4)', borderColor: 'hsl(50 90% 55% / 0.2)' }}>
                  <GeneratorSchematicSVG genType={genType} poleCount={poleCount} />
                </div>

                <div>
                  <Label className="text-xs">{label('Тип генератора', 'Generator Type')}</Label>
                  <Select value={genType} onValueChange={setGenType}>
                    <SelectTrigger className="mt-1 border-border/30 bg-background/40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {genTypes.map(g => (
                        <SelectItem key={g.value} value={g.value}>{g.icon} {g.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {lang === 'ua' ? genTypeData.desc_ua : genTypeData.desc_en}
                  </p>
                </div>

                {/* Efficiency comparison */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase">{label('Порівняння ККД', 'Efficiency Comparison')}</span>
                  {genTypes.map(g => (
                    <div key={g.value} className="flex items-center gap-2">
                      <span className="text-[9px] font-mono w-10" style={{ color: g.value === genType ? 'hsl(50 90% 55%)' : 'hsl(var(--muted-foreground))' }}>{g.value}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--background) / 0.6)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{
                          width: `${g.efficiency * 100}%`,
                          background: g.value === genType ? 'hsl(50 90% 55%)' : 'hsl(var(--muted-foreground) / 0.3)',
                          boxShadow: g.value === genType ? '0 0 8px hsl(50 90% 55% / 0.5)' : 'none',
                        }} />
                      </div>
                      <span className="text-[9px] font-mono" style={{ color: g.value === genType ? 'hsl(50 90% 55%)' : 'hsl(var(--muted-foreground))' }}>
                        {(g.efficiency * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>

                <GlowSlider value={poleCount} onChange={v => setPoleCount(v)} min={4} max={96} step={2}
                  label={label('Кількість полюсів', 'Pole Count')} displayValue={`${poleCount}`}
                  infoText={`n_sync = ${(60 * 50 / (poleCount / 2)).toFixed(0)} RPM @ 50Hz`}
                  color="hsl(50 90% 55%)" />

                <GlowSlider value={voltage} onChange={v => setVoltage(v)} min={230} max={6600} step={10}
                  label={label('Напруга', 'Voltage')} displayValue={`${voltage} V`} color="hsl(50 90% 55%)" />

                <GlowSlider value={currentSettings.ratedPower} onChange={v => onSettingsChange({ ...currentSettings, ratedPower: v })}
                  min={1000} max={15000000} step={1000}
                  label={label('Номінальна потужність', 'Rated Power')} displayValue={formatP(currentSettings.ratedPower)}
                  color="hsl(50 90% 55%)" />

                {/* Power factor & reactive power */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg border text-center" style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(50 90% 55% / 0.2)' }}>
                    <div className="text-[9px] text-muted-foreground uppercase">{label('Коеф. потужності', 'Power Factor')}</div>
                    <p className="text-sm font-mono font-bold text-foreground">cos φ = 0.95</p>
                  </div>
                  <div className="p-2 rounded-lg border text-center" style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(50 90% 55% / 0.2)' }}>
                    <div className="text-[9px] text-muted-foreground uppercase">{label('Реактивна', 'Reactive')}</div>
                    <p className="text-sm font-mono font-bold text-foreground">
                      {formatP(liveCalc.P * Math.tan(Math.acos(0.95)))} VAr
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ CURVE ═══ */}
            {activeTab === 'curve' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4" style={{ color: 'hsl(270 70% 60%)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(270 70% 60%)' }}>
                    {label('Крива потужності P(V) + Вейбулл f(V)', 'Power Curve P(V) + Weibull f(V)')}
                  </span>
                </div>

                <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--background) / 0.4)', borderColor: 'hsl(270 70% 60% / 0.2)' }}>
                  <PowerCurveSVG currentSettings={currentSettings} windSpeed={windSpeed} lang={lang} weibullK={weibullK} weibullC={weibullC} />
                  <div className="flex gap-4 mt-1 text-[8px] text-muted-foreground justify-center">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: 'hsl(var(--primary))' }} /> P(V)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: 'hsl(270 70% 60%)', borderBottom: '1px dashed' }} /> f(V)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-2 inline-block rounded opacity-30" style={{ backgroundColor: 'hsl(var(--primary))' }} /> AEP
                    </span>
                  </div>
                </div>

                {/* Weibull params */}
                <div className="p-3 rounded-lg border space-y-2" style={{ backgroundColor: 'hsl(270 70% 60% / 0.05)', borderColor: 'hsl(270 70% 60% / 0.2)' }}>
                  <span className="text-xs font-semibold text-foreground">{label('Параметри Вейбулла', 'Weibull Parameters')}</span>
                  <div className="grid grid-cols-2 gap-3">
                    <GlowSlider value={weibullK} onChange={v => setWeibullK(v)} min={1.0} max={4.0} step={0.1}
                      label={`k (${label('форма', 'shape')})`} displayValue={weibullK.toFixed(1)} color="hsl(270 70% 60%)" />
                    <GlowSlider value={weibullC} onChange={v => setWeibullC(v)} min={3} max={15} step={0.5}
                      label={`c (${label('масштаб', 'scale')})`} displayValue={`${weibullC.toFixed(1)} m/s`} color="hsl(270 70% 60%)" />
                  </div>
                  <p className="text-[8px] text-muted-foreground">
                    {label('k=2 — типове. c ≈ середня × 1.12', 'k=2 — typical. c ≈ mean × 1.12')}
                  </p>
                </div>

                {/* Capacity factor benchmarks */}
                <div className="p-2 rounded-lg border space-y-1" style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(270 70% 60% / 0.15)' }}>
                  <span className="text-[10px] text-muted-foreground uppercase">{label('Бенчмарки CF (Україна)', 'CF Benchmarks (Ukraine)')}</span>
                  {[
                    { region: lang === 'ua' ? 'Узбережжя (Азов/Чорне)' : 'Coast (Azov/Black)', cf: 0.32 },
                    { region: lang === 'ua' ? 'Степ (Запоріжжя)' : 'Steppe (Zaporizhia)', cf: 0.25 },
                    { region: lang === 'ua' ? 'Карпати (хребти)' : 'Carpathians (ridges)', cf: 0.22 },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[9px] w-32 text-muted-foreground">{b.region}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--background) / 0.6)' }}>
                        <div className="h-full rounded-full" style={{ width: `${b.cf * 100 * 2}%`, background: 'hsl(270 70% 60% / 0.5)' }} />
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground">{(b.cf * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ CALC ═══ */}
            {activeTab === 'calc' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {label('Live-розрахунки при V =', 'Live Calculations at V =')} {windSpeed.toFixed(1)} m/s
                </div>

                {/* Efficiency chain */}
                <div className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(var(--background) / 0.4)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
                  <EfficiencyChainSVG cp={currentSettings.efficiency} genEff={genTypeData.efficiency} lang={lang} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: label('Потужність', 'Power'), value: formatP(liveCalc.P), formula: 'P = ½ρAV³Cp', highlight: true },
                    { label: label('Крутний момент', 'Torque'), value: liveCalc.torque > 1000 ? `${(liveCalc.torque / 1000).toFixed(1)} kNm` : `${liveCalc.torque.toFixed(0)} Nm`, formula: 'τ = P/ω' },
                    { label: label('Відцентрова сила', 'Centrifugal Force'), value: liveCalc.Fc > 1000 ? `${(liveCalc.Fc / 1000).toFixed(1)} kN` : `${liveCalc.Fc.toFixed(0)} N`, formula: 'F = mω²r' },
                    { label: label('Обертання', 'Rotation'), value: `${(liveCalc.rps * 60).toFixed(1)} RPM`, formula: `ω = ${liveCalc.omega.toFixed(2)} rad/s` },
                  ].map((card, i) => (
                    <motion.div key={i} className="p-3 rounded-lg border text-center"
                      style={{
                        backgroundColor: card.highlight ? 'hsl(var(--primary) / 0.05)' : 'hsl(var(--background) / 0.3)',
                        borderColor: card.highlight ? 'hsl(var(--primary) / 0.25)' : 'hsl(var(--border) / 0.3)',
                      }}
                      animate={{ scale: [1, 1.01, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}>
                      <div className="text-[9px] text-muted-foreground uppercase">{card.label}</div>
                      <p className="text-lg font-mono font-bold" style={{ color: card.highlight ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{card.value}</p>
                      <div className="text-[8px] text-muted-foreground font-mono">{card.formula}</div>
                    </motion.div>
                  ))}
                </div>

                {/* CF + AEP */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg border text-center" style={{ backgroundColor: 'hsl(var(--primary) / 0.05)', borderColor: 'hsl(var(--primary) / 0.25)' }}>
                    <div className="text-[9px] text-muted-foreground uppercase">{label('Коеф. використання', 'Capacity Factor')}</div>
                    <p className="text-lg font-mono font-bold text-primary">{(liveCalc.capacityFactor * 100).toFixed(1)}%</p>
                    <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ backgroundColor: 'hsl(var(--background) / 0.6)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${liveCalc.capacityFactor * 100}%`, background: 'hsl(var(--primary))', boxShadow: '0 0 6px hsl(var(--primary) / 0.5)' }} />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border text-center" style={{ backgroundColor: 'hsl(var(--primary) / 0.05)', borderColor: 'hsl(var(--primary) / 0.25)' }}>
                    <div className="text-[9px] text-muted-foreground uppercase">{label('Річна енергія (AEP)', 'Annual Energy (AEP)')}</div>
                    <p className="text-lg font-mono font-bold text-primary">{formatE(liveCalc.aep)}</p>
                    <div className="text-[8px] text-muted-foreground font-mono">k={weibullK}, c={weibullC}</div>
                  </div>
                </div>

                {/* LCOE + CO2 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg border text-center" style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(var(--border) / 0.3)' }}>
                    <div className="text-[9px] text-muted-foreground uppercase flex items-center justify-center gap-1">
                      <DollarSign className="w-3 h-3" /> LCOE
                    </div>
                    <p className="text-sm font-mono font-bold text-foreground">{liveCalc.lcoe > 0 ? `${liveCalc.lcoe.toFixed(1)} $/MWh` : '—'}</p>
                    <p className="text-[7px] text-muted-foreground">{label('Нижче = краще', 'Lower = better')}</p>
                  </div>
                  <div className="p-2 rounded-lg border text-center" style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(var(--border) / 0.3)' }}>
                    <div className="text-[9px] text-muted-foreground uppercase flex items-center justify-center gap-1">
                      <Leaf className="w-3 h-3" /> CO₂
                    </div>
                    <p className="text-sm font-mono font-bold text-foreground">
                      {liveCalc.co2Offset > 1000 ? `${(liveCalc.co2Offset / 1000).toFixed(1)}k` : liveCalc.co2Offset.toFixed(0)} {label('т/рік', 't/yr')}
                    </p>
                    <p className="text-[7px] text-muted-foreground">{label('Офсет CO₂', 'CO₂ offset')}</p>
                  </div>
                </div>

                {/* Industry comparison */}
                <div className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(var(--primary) / 0.15)' }}>
                  <span className="text-[10px] text-muted-foreground uppercase">{label('Ваша турбіна vs індустрія', 'Your turbine vs industry')}</span>
                  <div className="grid grid-cols-3 gap-2 mt-1 text-center">
                    {[
                      { metric: 'Cp', yours: currentSettings.efficiency.toFixed(2), avg: '0.40' },
                      { metric: 'CF', yours: `${(liveCalc.capacityFactor * 100).toFixed(0)}%`, avg: '25-35%' },
                      { metric: 'TSR', yours: liveCalc.tsr.toFixed(1), avg: '6-8' },
                    ].map((c, i) => (
                      <div key={i}>
                        <div className="text-[8px] text-muted-foreground">{c.metric}</div>
                        <div className="text-[10px] font-mono font-bold text-primary">{c.yours}</div>
                        <div className="text-[7px] text-muted-foreground">{label('сер.', 'avg')}: {c.avg}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
