import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type WindGeneratorSpecs } from "@/utils/windCalculations";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wind, Zap, Wrench, Calculator, BarChart3, TrendingUp, Info, AlertTriangle, Leaf, DollarSign, Activity, Gauge, ArrowRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";

interface GeneratorSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: WindGeneratorSpecs;
  onSettingsChange: (settings: WindGeneratorSpecs) => void;
  windSpeed: number;
  lang?: 'ua' | 'en';
}

const bladeProfiles = [
  { value: 'NACA 4412', lift: 1.2, drag: 0.012, clcd: 100, thickness: 0.12, camber: 0.04, camberPos: 0.4, desc_ua: 'Класичний профіль для малих турбін', desc_en: 'Classic profile for small turbines' },
  { value: 'NACA 63-215', lift: 1.4, drag: 0.008, clcd: 175, thickness: 0.15, camber: 0.03, camberPos: 0.35, desc_ua: 'Ламінарний профіль, висока ефективність', desc_en: 'Laminar profile, high efficiency' },
  { value: 'S809', lift: 1.0, drag: 0.010, clcd: 100, thickness: 0.21, camber: 0.01, camberPos: 0.45, desc_ua: 'Спеціально для вітрових турбін (NREL)', desc_en: 'Designed specifically for wind turbines (NREL)' },
  { value: 'DU 93-W-210', lift: 1.3, drag: 0.009, clcd: 144, thickness: 0.21, camber: 0.035, camberPos: 0.38, desc_ua: 'Профіль Делфтського університету', desc_en: 'Delft University profile' },
];

const genTypes = [
  { value: 'PMSG', desc_ua: 'Синхронний з постійними магнітами — безредукторний', desc_en: 'Permanent magnet synchronous — direct drive', efficiency: 0.96, icon: '🧲' },
  { value: 'DFIG', desc_ua: 'Подвійне живлення — з редуктором', desc_en: 'Doubly-fed induction — geared', efficiency: 0.93, icon: '⚙️' },
  { value: 'SCIG', desc_ua: 'Асинхронний з к.з. ротором', desc_en: 'Squirrel cage induction', efficiency: 0.91, icon: '🔄' },
];

const materials = [
  { name: 'E-Glass/Epoxy', E: 40, sigma: 1000, rho: 2100, color: 'hsl(120 100% 54%)', desc_ua: 'Стандарт для лопатей', desc_en: 'Standard for blades' },
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
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: glowColor }}>{label}</span>
          {infoText && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 opacity-40 hover:opacity-100 cursor-help transition-colors" style={{ color: glowColor }} />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[300px] bg-[#0d1117] border-primary/40 text-xs leading-relaxed z-[100]">
                  <p>{infoText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="text-sm font-mono font-bold" style={{ color: glowColor }}>{displayValue}</span>
      </div>
      <div className="relative h-2.5">
        <div className="absolute inset-0 rounded-full border" style={{ backgroundColor: 'hsl(var(--background) / 0.6)', borderColor: `${glowColor}33` }} />
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
          style={{ width: `${percentage}%`, background: `linear-gradient(90deg, ${glowColor}99, ${glowColor})`, boxShadow: `0 0 14px ${glowColor}80, 0 0 4px ${glowColor}40` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all duration-150"
          style={{ left: `calc(${percentage}% - 8px)`, backgroundColor: glowColor, borderColor: 'hsl(var(--background))', boxShadow: `0 0 16px ${glowColor}cc, 0 0 4px ${glowColor}` }} />
        <Slider value={[value]} onValueChange={(v) => onChange(v[0])} min={min} max={max} step={step}
          className="absolute inset-0 opacity-0 cursor-pointer" />
      </div>
    </div>
  );
};

// ─── Tab config ───
const tabItems = [
  { value: 'aero', icon: Wind, ua: 'Аеро', en: 'Aero', color: 'hsl(210 90% 60%)' },
  { value: 'struct', icon: Wrench, ua: 'Конст', en: 'Struct', color: 'hsl(25 90% 55%)' },
  { value: 'elec', icon: Zap, ua: 'Елект', en: 'Elec', color: 'hsl(50 90% 55%)' },
  { value: 'curve', icon: BarChart3, ua: 'Крива', en: 'Curve', color: 'hsl(270 70% 60%)' },
  { value: 'calc', icon: Calculator, ua: 'Розр', en: 'Calc', color: 'hsl(120 100% 54%)' },
];

// ─── Enhanced Blade Profile SVG ───
const BladeProfileSVG = ({ profile, attackAngle, label }: { profile: typeof bladeProfiles[0]; attackAngle: number; label: (ua: string, en: string) => string }) => {
  const isStall = attackAngle > 15;
  const t = profile.thickness;
  const camber = profile.camber;
  const p = profile.camberPos;

  const upperPoints: { x: number; y: number }[] = [];
  const lowerPoints: { x: number; y: number }[] = [];

  for (let i = 0; i <= 40; i++) {
    const x = i / 40;
    const yc = x < p
      ? camber * (2 * p * x - x * x) / (p * p)
      : camber * ((1 - 2 * p) + 2 * p * x - x * x) / ((1 - p) * (1 - p));
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1015 * x ** 4);
    upperPoints.push({ x: 50 + x * 280, y: 85 - (yc + yt) * 500 });
    lowerPoints.push({ x: 50 + x * 280, y: 85 - (yc - yt) * 500 });
  }

  const allPoints = [...upperPoints, ...lowerPoints.reverse()];
  const allPath = allPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ') + 'Z';
  const upperPressurePath = upperPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ');
  const lowerPressureReversed = [...lowerPoints].reverse();
  const lowerPressurePath = lowerPressureReversed.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ');

  return (
    <svg viewBox="0 0 400 170" className="w-full h-44">
      <defs>
        <linearGradient id="pressureHigh" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="hsl(0 80% 55%)" stopOpacity="0.35" />
          <stop offset="50%" stopColor="hsl(0 80% 55%)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(0 80% 55%)" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="pressureLow" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="hsl(210 90% 60%)" stopOpacity="0.35" />
          <stop offset="50%" stopColor="hsl(210 90% 60%)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(210 90% 60%)" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="airfoilBody" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="hsl(210 90% 60%)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="hsl(210 90% 60%)" stopOpacity="0.1" />
        </linearGradient>
        <filter id="airfoilGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Animated flow lines */}
      {[-30, -18, -6, 6, 18, 30, 42].map((dy, i) => (
        <line key={i} x1="10" y1={85 + dy} x2="390" y2={85 + dy - attackAngle * 1.2}
          stroke="hsl(210 90% 60%)" strokeWidth="0.6" opacity="0.12"
          strokeDasharray="6,4" className="animate-flow-dash" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}

      {/* Pressure zones */}
      <g transform={`rotate(${-attackAngle}, 190, 85)`} opacity="0.6">
        <path d={`${upperPressurePath} L${upperPoints[upperPoints.length - 1].x},${85 - 40} L${upperPoints[0].x},${85 - 40} Z`}
          fill="url(#pressureLow)" />
        <path d={`${lowerPressurePath} L${lowerPressureReversed[lowerPressureReversed.length - 1].x},${85 + 35} L${lowerPressureReversed[0].x},${85 + 35} Z`}
          fill="url(#pressureHigh)" />
      </g>

      {/* Airfoil body */}
      <g transform={`rotate(${-attackAngle}, 190, 85)`} filter="url(#airfoilGlow)">
        <path d={allPath} fill="url(#airfoilBody)" stroke="hsl(210 90% 60%)" strokeWidth="1.5" />
        <line x1="50" y1="85" x2="330" y2="85" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />
        <circle cx="50" cy="85" r="2.5" fill="hsl(210 90% 60%)" />
      </g>

      {/* Pressure labels */}
      <g transform={`rotate(${-attackAngle}, 190, 85)`}>
      <text x="160" y={55 - attackAngle * 0.5} fontSize="10" fill="hsl(210 90% 60%)" fontWeight="600" opacity="0.7">
          {label('− Низький P', '− Low P')}
        </text>
        <text x="160" y={120 + attackAngle * 0.3} fontSize="10" fill="hsl(0 80% 55%)" fontWeight="600" opacity="0.7">
          {label('+ Високий P', '+ High P')}
        </text>
      </g>

      {/* Lift arrow */}
      <g transform={`translate(340, ${85 - Math.min(attackAngle * 2, 35)})`}>
        <line x1="0" y1="15" x2="0" y2={-Math.min(profile.lift * 15, 30)} stroke="hsl(120 100% 54%)" strokeWidth="2" markerEnd="url(#liftArrow)" />
        <text x="8" y="0" fontSize="10" fill="hsl(120 100% 54%)" fontWeight="bold">L</text>
      </g>

      {/* Drag arrow */}
      <g transform={`translate(355, 85)`}>
        <line x1="0" y1="0" x2={Math.min(profile.drag * 800, 20)} y2="0" stroke="hsl(0 60% 55%)" strokeWidth="1.5" markerEnd="url(#dragArrow)" />
        <text x={Math.min(profile.drag * 800, 20) + 4} y="3" fontSize="10" fill="hsl(0 60% 55%)" fontWeight="bold">D</text>
      </g>

      <defs>
        <marker id="liftArrow" markerWidth="6" markerHeight="4" refX="3" refY="2" orient="auto">
          <polygon points="0 4, 3 0, 6 4" fill="hsl(120 100% 54%)" />
        </marker>
        <marker id="dragArrow" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
          <polygon points="0 0, 5 2, 0 4" fill="hsl(0 60% 55%)" />
        </marker>
      </defs>

      {/* Stall warning turbulence */}
      {isStall && (
        <g opacity="0.7">
          <text x="300" y="20" fontSize="12" fill="hsl(var(--destructive))" fontWeight="bold" className="animate-pulse">⚠ STALL</text>
          {[0, 1, 2, 3].map(i => (
            <circle key={i} cx={250 + i * 25} cy={50 + Math.sin(i * 1.5) * 12} r={4 + i * 1.5}
              fill="none" stroke="hsl(var(--destructive))" strokeWidth="1" opacity={0.6 - i * 0.1}
              strokeDasharray="3,2" className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
              <animateTransform attributeName="transform" type="rotate" values={`0 ${250 + i * 25} ${50 + Math.sin(i * 1.5) * 12};360 ${250 + i * 25} ${50 + Math.sin(i * 1.5) * 12}`} dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      )}

      {/* Info bar */}
      <rect x="20" y="152" width="360" height="14" rx="4" fill="hsl(var(--background) / 0.6)" stroke="hsl(210 90% 60% / 0.15)" strokeWidth="0.5" />
      <text x="30" y="163" fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="monospace">
        {profile.value} │ Cl={profile.lift} │ Cd={profile.drag} │ Cl/Cd={profile.clcd} │ t={(profile.thickness * 100).toFixed(0)}%
      </text>
    </svg>
  );
};

// ─── TSR Optimization Curve SVG ───
const TSRCurveSVG = ({ currentTSR }: { currentTSR: number }) => {
  const optimalTSR = 7;
  const points: string[] = [];
  const maxCp = 0.48;
  for (let tsr = 0; tsr <= 14; tsr += 0.3) {
    const cp = maxCp * Math.exp(-0.5 * Math.pow((tsr - optimalTSR) / 2.2, 2));
    const x = 25 + (tsr / 14) * 260;
    const y = 65 - (cp / maxCp) * 50;
    points.push(`${x},${y}`);
  }

  const currentX = 25 + (Math.min(currentTSR, 14) / 14) * 260;
  const currentCp = maxCp * Math.exp(-0.5 * Math.pow((currentTSR - optimalTSR) / 2.2, 2));
  const currentY = 65 - (currentCp / maxCp) * 50;

  return (
    <svg viewBox="0 0 310 80" className="w-full h-20">
      <text x="5" y="12" fontSize="9" fill="hsl(var(--muted-foreground))" fontWeight="600">Cp vs TSR</text>
      {/* Grid */}
      <line x1="25" y1="65" x2="285" y2="65" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
      <line x1="25" y1="15" x2="25" y2="65" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
      {/* Optimal zone highlight */}
      <rect x={25 + (5 / 14) * 260} y="10" width={(4 / 14) * 260} height="55" rx="3" fill="hsl(120 100% 54%)" opacity="0.04" />
      {/* Cp curve */}
      <polyline points={points.join(' ')} fill="none" stroke="hsl(120 100% 54%)" strokeWidth="2" strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 3px hsl(120 100% 54% / 0.4))' }} />
      {/* Current point */}
      <circle cx={currentX} cy={currentY} r="4" fill="hsl(120 100% 54%)" stroke="hsl(var(--background))" strokeWidth="2"
        style={{ filter: 'drop-shadow(0 0 6px hsl(120 100% 54% / 0.8))' }}>
        <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
      </circle>
      <text x={currentX + 8} y={currentY + 3} fontSize="9" fill="hsl(120 100% 54%)" fontWeight="bold" fontFamily="monospace">
        λ={currentTSR.toFixed(1)}
      </text>
      {/* Optimal label */}
      <text x={25 + (optimalTSR / 14) * 260} y="75" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">λ_opt≈{optimalTSR}</text>
      {/* Axis labels */}
      {[0, 4, 7, 10, 14].map(v => (
        <text key={v} x={25 + (v / 14) * 260} y="74" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">{v}</text>
      ))}
    </svg>
  );
};

// ─── Enhanced Radar Chart SVG ───
const RadarChartSVG = ({ materials: mats, selectedIdx, onSelect }: {
  materials: typeof materials; selectedIdx: number; onSelect: (i: number) => void;
}) => {
  const axes = ['E (GPa)', 'σ (MPa)', 'ρ (kg/m³)'];
  const maxVals = [210, 1500, 7850];
  const cx = 150, cy = 110, r = 90;
  const angles = axes.map((_, i) => (i * 2 * Math.PI / 3) - Math.PI / 2);

  const getPoint = (val: number, maxVal: number, angleIdx: number) => ({
    x: cx + (val / maxVal) * r * Math.cos(angles[angleIdx]),
    y: cy + (val / maxVal) * r * Math.sin(angles[angleIdx]),
  });

  return (
    <svg viewBox="0 0 300 220" className="w-full h-56">
      <defs>
        <filter id="radarGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f}
          points={angles.map(a => `${cx + f * r * Math.cos(a)},${cy + f * r * Math.sin(a)}`).join(' ')}
          fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={f === 1 ? 0.4 : 0.2} />
      ))}

      {/* Axes */}
      {angles.map((a, i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)}
            stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.35" />
          <text x={cx + (r + 20) * Math.cos(a)} y={cy + (r + 20) * Math.sin(a)}
            fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle" dominantBaseline="middle" fontWeight="500">
            {axes[i]}
          </text>
        </g>
      ))}

      {/* Material polygons */}
      {mats.map((mat, mi) => {
        const pts = [
          getPoint(mat.E, maxVals[0], 0),
          getPoint(mat.sigma, maxVals[1], 1),
          getPoint(mat.rho, maxVals[2], 2),
        ];
        const isSelected = mi === selectedIdx;
        return (
          <g key={mi} onClick={() => onSelect(mi)} className="cursor-pointer">
            <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')}
              fill={mat.color} fillOpacity={isSelected ? 0.2 : 0.06}
              stroke={mat.color} strokeWidth={isSelected ? 2 : 1}
              opacity={isSelected ? 1 : 0.5}
              filter={isSelected ? 'url(#radarGlow)' : undefined}
              style={{ transition: 'all 0.3s ease' }} />
            {pts.map((p, pi) => (
              <circle key={pi} cx={p.x} cy={p.y} r={isSelected ? 4 : 2.5} fill={mat.color}
                style={{ transition: 'all 0.3s ease' }}>
                {isSelected && <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />}
              </circle>
            ))}
          </g>
        );
      })}

      {/* Legend */}
      {mats.map((mat, i) => (
        <g key={i} transform={`translate(10, ${185 + i * 8})`}
          onClick={() => onSelect(i)} className="cursor-pointer" opacity={i === selectedIdx ? 1 : 0.6}>
          <rect width="8" height="8" rx="2" fill={mat.color} opacity="0.8" />
          <text x="12" y="7" fontSize="8" fill="hsl(var(--foreground))" fontWeight={i === selectedIdx ? '600' : '400'}>
            {mat.name.split('/')[0]}
          </text>
        </g>
      ))}
    </svg>
  );
};

// ─── Fatigue Lifecycle Ring SVG ───
const FatigueRingSVG = ({ fatigueCycles }: { fatigueCycles: number }) => {
  const designLife = 20;
  const maxCycles = 3.15e9; // ~20yr at ~5 RPS
  const pct = Math.min(fatigueCycles / maxCycles, 1);
  const strokeLen = 2 * Math.PI * 28;
  const yearsUsed = pct * designLife;

  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20">
      <circle cx="40" cy="40" r="28" fill="none" stroke="hsl(var(--border))" strokeWidth="5" opacity="0.15" />
      <circle cx="40" cy="40" r="28" fill="none" stroke={pct > 0.8 ? 'hsl(0 60% 55%)' : 'hsl(25 90% 55%)'}
        strokeWidth="5" strokeDasharray={`${pct * strokeLen} ${strokeLen}`}
        strokeLinecap="round" transform="rotate(-90 40 40)"
        style={{ filter: `drop-shadow(0 0 4px ${pct > 0.8 ? 'hsl(0 60% 55% / 0.5)' : 'hsl(25 90% 55% / 0.5)'})`, transition: 'all 0.5s ease' }} />
      <text x="40" y="36" textAnchor="middle" fontSize="10" fontWeight="bold" fill="hsl(var(--foreground))" fontFamily="monospace">
        {yearsUsed.toFixed(0)}yr
      </text>
      <text x="40" y="48" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">/ {designLife}yr</text>
    </svg>
  );
};

// ─── Generator Schematic SVG ───
const GeneratorSchematicSVG = ({ genType, poleCount, label }: { genType: string; poleCount: number; label: (ua: string, en: string) => string }) => {
  const syncSpeed = (60 * 50 / (poleCount / 2));
  const nodes = [
    { x: 30, label: '🌬️', sub: label('Вітер', 'Wind'), color: 'hsl(210 90% 60%)' },
    { x: 90, label: '⚡', sub: label('Ротор', 'Rotor'), color: 'hsl(120 100% 54%)' },
    ...(genType === 'DFIG' ? [{ x: 155, label: '⚙️', sub: label('Редуктор', 'Gearbox'), color: 'hsl(40 80% 60%)' }] : []),
    { x: genType === 'DFIG' ? 220 : 170, label: genType === 'PMSG' ? '🧲' : genType === 'DFIG' ? '🔌' : '🔄', sub: genType, color: 'hsl(50 90% 55%)' },
    { x: genType === 'DFIG' ? 285 : 250, label: '🔋', sub: label('Мережа', 'Grid'), color: 'hsl(var(--primary))' },
  ];

  return (
    <svg viewBox="0 0 320 100" className="w-full h-28">
      <defs>
        <marker id="flowArrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="hsl(var(--primary))" opacity="0.7" />
        </marker>
      </defs>

      {nodes.map((node, i) => (
        <g key={i}>
          <rect x={node.x - 22} y={18} width="44" height="44" rx="8"
            fill="none" stroke={node.color} strokeWidth="1.2" opacity="0.5" />
          <rect x={node.x - 22} y={18} width="44" height="44" rx="8"
            fill={node.color} opacity="0.05" />
          <text x={node.x} y={44} textAnchor="middle" fontSize="18">{node.label}</text>
          <text x={node.x} y={76} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" fontWeight="500">{node.sub}</text>

          {i < nodes.length - 1 && (
            <g>
              <line x1={node.x + 22} y1={40} x2={nodes[i + 1].x - 22} y2={40}
                stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="4,3"
                className="animate-flow-dash" opacity="0.5" markerEnd="url(#flowArrow)" />
              <circle r="3" fill="hsl(var(--primary))" opacity="0.8">
                <animateMotion dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite"
                  path={`M${node.x + 22},40 L${nodes[i + 1].x - 22},40`} />
              </circle>
            </g>
          )}
        </g>
      ))}

      <text x="160" y="94" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="monospace">
        n_sync = {syncSpeed.toFixed(0)} RPM @ 50Hz │ {poleCount} {label('полюсів', 'poles')}
      </text>
    </svg>
  );
};

// ─── 3-Phase AC Diagram SVG ───
const PhaseDiagramSVG = ({ frequency }: { frequency: number }) => {
  const phases = [
    { offset: 0, color: 'hsl(0 70% 55%)', label: 'A' },
    { offset: 120, color: 'hsl(120 70% 50%)', label: 'B' },
    { offset: 240, color: 'hsl(210 80% 55%)', label: 'C' },
  ];

  return (
    <svg viewBox="0 0 280 70" className="w-full h-16 overflow-hidden">
      <defs>
        <clipPath id="phaseClip"><rect x="0" y="0" width="280" height="60" /></clipPath>
      </defs>
      <g clipPath="url(#phaseClip)">
        {phases.map((phase, pi) => {
          const points: string[] = [];
          for (let x = 0; x <= 280; x += 2) {
            const y = 30 + Math.sin((x / 70) * Math.PI * 2 + (phase.offset * Math.PI / 180)) * 20;
            points.push(`${x},${y}`);
          }
          return (
            <g key={pi} className="animate-sine-scroll">
              <polyline points={points.join(' ')} fill="none" stroke={phase.color} strokeWidth="1.8" opacity="0.7" />
              <polyline points={points.map(p => { const [x, y] = p.split(','); return `${Number(x) + 280},${y}`; }).join(' ')}
                fill="none" stroke={phase.color} strokeWidth="1.8" opacity="0.7" />
            </g>
          );
        })}
      </g>
      <g>
        {phases.map((phase, i) => (
          <g key={i} transform={`translate(${240 + i * 15}, 65)`}>
            <rect width="10" height="4" rx="1" fill={phase.color} opacity="0.8" />
            <text x="5" y="-2" textAnchor="middle" fontSize="7" fill={phase.color} fontWeight="bold">{phase.label}</text>
          </g>
        ))}
      </g>
      <text x="140" y="68" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{frequency} Hz · 3φ AC</text>
    </svg>
  );
};

// ─── Frequency Waveform SVG ───
const FrequencyWaveform = ({ frequency }: { frequency: number }) => {
  const points: string[] = [];
  for (let x = 0; x <= 200; x++) {
    const y = 20 + Math.sin((x / 200) * Math.PI * 2 * (frequency / 10)) * 15;
    points.push(`${x},${y}`);
  }
  return (
    <svg viewBox="0 0 200 40" className="w-full h-10 overflow-hidden">
      <g className="animate-sine-scroll">
        <polyline points={points.join(' ')} fill="none" stroke="hsl(50 90% 55%)" strokeWidth="1.5" opacity="0.6" />
        <polyline points={points.map(p => { const [x, y] = p.split(','); return `${Number(x) + 200},${y}`; }).join(' ')}
          fill="none" stroke="hsl(50 90% 55%)" strokeWidth="1.5" opacity="0.6" />
      </g>
      <text x="100" y="38" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{frequency} Hz</text>
    </svg>
  );
};

// ─── Interactive Power Curve SVG ───
const PowerCurveSVG = ({ currentSettings, windSpeed, lang, weibullK, weibullC }: {
  currentSettings: WindGeneratorSpecs; windSpeed: number; lang: 'ua' | 'en'; weibullK: number; weibullC: number;
}) => {
  const [hover, setHover] = useState<{ x: number; v: number; p: number; w: number } | null>(null);
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

  const chartLeft = 40, chartRight = 380, chartTop = 25, chartBottom = 200;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  for (let v = 0; v <= 30; v += 0.5) {
    const x = chartLeft + (v / 30) * chartW;
    const p = getPower(v);
    const y = chartBottom - (p / rated) * chartH;
    powerPoints.push(`${x},${y}`);

    const w = getWeibull(v);
    const wy = chartBottom - (w / maxWeibull) * (chartH * 0.7);
    weibullPoints.push(`${x},${wy}`);

    const aepVal = p * w;
    const maxAep = rated * maxWeibull;
    const ay = chartBottom - (maxAep > 0 ? (aepVal / maxAep) * (chartH * 0.5) : 0);
    aepFillPoints.push(`${x},${ay}`);
  }

  const currentX = chartLeft + (windSpeed / 30) * chartW;
  const currentP = getPower(windSpeed);
  const currentY = chartBottom - (currentP / rated) * chartH;
  const formatP = (w: number) => w >= 1e6 ? `${(w / 1e6).toFixed(1)}MW` : w >= 1e3 ? `${(w / 1e3).toFixed(0)}kW` : `${w.toFixed(0)}W`;

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const v = Math.max(0, Math.min(30, (relX * 420 - chartLeft) / chartW * 30));
    const svgX = chartLeft + (v / 30) * chartW;
    setHover({ x: svgX, v, p: getPower(v), w: getWeibull(v) });
  }, [currentSettings, ratedSpeed, weibullK, weibullC]);

  const cutInX = chartLeft + (cutIn / 30) * chartW;
  const ratedX = chartLeft + (ratedSpeed / 30) * chartW;
  const cutOutX = chartLeft + (cutOut / 30) * chartW;

  return (
    <svg viewBox="0 0 420 230" className="w-full h-64 cursor-crosshair" onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)}>
      <defs>
        <linearGradient id="aepGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(120 100% 54%)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="hsl(120 100% 54%)" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="powerFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(120 100% 54%)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(120 100% 54%)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <g key={f}>
          <line x1={chartLeft} y1={chartBottom - f * chartH} x2={chartRight} y2={chartBottom - f * chartH}
            stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray={f === 0 ? "" : "3,4"} opacity="0.25" />
          <text x={chartLeft - 5} y={chartBottom - f * chartH + 3} textAnchor="end" fontSize="8" fill="hsl(var(--muted-foreground))">
            {formatP(f * rated)}
          </text>
        </g>
      ))}
      {[0, 5, 10, 15, 20, 25, 30].map(v => (
        <g key={v}>
          <line x1={chartLeft + (v / 30) * chartW} y1={chartBottom} x2={chartLeft + (v / 30) * chartW} y2={chartBottom + 3}
            stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" />
          <text x={chartLeft + (v / 30) * chartW} y={chartBottom + 13} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">{v}</text>
        </g>
      ))}

      {/* Operating regions */}
      <rect x={chartLeft} y={chartTop} width={cutInX - chartLeft} height={chartH} fill="hsl(var(--destructive))" opacity="0.04" />
      <rect x={cutOutX} y={chartTop} width={chartRight - cutOutX} height={chartH} fill="hsl(var(--destructive))" opacity="0.04" />
      <rect x={cutInX} y={chartTop} width={ratedX - cutInX} height={chartH} fill="hsl(210 90% 60%)" opacity="0.03" />
      <rect x={ratedX} y={chartTop} width={cutOutX - ratedX} height={chartH} fill="hsl(120 100% 54%)" opacity="0.03" />

      <text x={(chartLeft + cutInX) / 2} y={chartTop + 12} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))" opacity="0.5">OFF</text>
      <text x={(cutInX + ratedX) / 2} y={chartTop + 12} textAnchor="middle" fontSize="8" fill="hsl(210 90% 60%)" opacity="0.6">RAMP</text>
      <text x={(ratedX + cutOutX) / 2} y={chartTop + 12} textAnchor="middle" fontSize="8" fill="hsl(120 100% 54%)" opacity="0.6">RATED</text>
      <text x={(cutOutX + chartRight) / 2} y={chartTop + 12} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))" opacity="0.5">OFF</text>

      <line x1={cutInX} y1={chartTop} x2={cutInX} y2={chartBottom} stroke="hsl(var(--destructive))" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.4" />
      <line x1={cutOutX} y1={chartTop} x2={cutOutX} y2={chartBottom} stroke="hsl(var(--destructive))" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.4" />

      <polyline points={`${chartLeft},${chartBottom} ${aepFillPoints.join(' ')} ${chartRight},${chartBottom}`} fill="url(#aepGrad)" />
      <polyline points={`${chartLeft},${chartBottom} ${powerPoints.join(' ')} ${chartRight},${chartBottom}`} fill="url(#powerFill)" />
      <polyline points={weibullPoints.join(' ')} fill="none" stroke="hsl(270 70% 60%)" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
      <polyline points={powerPoints.join(' ')} fill="none" stroke="hsl(120 100% 54%)" strokeWidth="2.5" strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 3px hsl(120 100% 54% / 0.4))' }} />

      {/* Current operating point */}
      <line x1={currentX} y1={currentY} x2={currentX} y2={chartBottom} stroke="hsl(120 100% 54%)" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.5" />
      <circle cx={currentX} cy={currentY} r="5" fill="hsl(120 100% 54%)" stroke="hsl(var(--background))" strokeWidth="2"
        style={{ filter: 'drop-shadow(0 0 6px hsl(120 100% 54% / 0.8))' }}>
        <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
      </circle>
      <rect x={currentX - 32} y={currentY - 22} width="64" height="16" rx="4" fill="hsl(var(--background) / 0.9)" stroke="hsl(120 100% 54% / 0.3)" strokeWidth="0.8" />
      <text x={currentX} y={currentY - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="hsl(120 100% 54%)" fontFamily="monospace">
        {formatP(currentP)}
      </text>

      {/* Hover crosshair */}
      {hover && (
        <g>
          <line x1={hover.x} y1={chartTop} x2={hover.x} y2={chartBottom} stroke="hsl(var(--foreground))" strokeWidth="0.5" opacity="0.25" />
          <rect x={hover.x - 44} y={chartTop - 2} width="88" height="24" rx="4"
            fill="hsl(var(--background) / 0.95)" stroke="hsl(var(--border))" strokeWidth="0.8" />
          <text x={hover.x} y={chartTop + 9} textAnchor="middle" fontSize="9" fill="hsl(var(--foreground))" fontFamily="monospace">
            V={hover.v.toFixed(1)} → {formatP(hover.p)}
          </text>
          <text x={hover.x} y={chartTop + 18} textAnchor="middle" fontSize="8" fill="hsl(270 70% 60%)">
            f={hover.w.toFixed(3)}
          </text>
        </g>
      )}

      <text x={(chartLeft + chartRight) / 2} y={chartBottom + 25} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
        {lang === 'ua' ? 'Швидкість вітру (m/s)' : 'Wind Speed (m/s)'}
      </text>
      <text x="12" y={(chartTop + chartBottom) / 2} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))"
        transform={`rotate(-90 12 ${(chartTop + chartBottom) / 2})`}>P(V)</text>
      <text x={chartRight + 8} y={chartTop + 30} fontSize="8" fill="hsl(270 70% 60%)">f(V)</text>
    </svg>
  );
};

// ─── Efficiency Chain SVG ───
const EfficiencyChainSVG = ({ cp, genEff, lang }: { cp: number; genEff: number; lang: 'ua' | 'en' }) => {
  const convEff = 0.97;
  const total = cp * genEff * convEff;
  const stages = [
    { label: lang === 'ua' ? 'Вітер' : 'Wind', value: 1, icon: '🌬️', color: 'hsl(210 90% 60%)' },
    { label: `Cp=${cp}`, value: cp, icon: '💨', color: 'hsl(120 100% 54%)' },
    { label: `η=${(genEff * 100).toFixed(0)}%`, value: cp * genEff, icon: '⚡', color: 'hsl(50 90% 55%)' },
    { label: `η=${(convEff * 100).toFixed(0)}%`, value: total, icon: '🔋', color: 'hsl(var(--primary))' },
  ];

  return (
    <svg viewBox="0 0 340 80" className="w-full h-20">
      <defs>
        <marker id="chainArrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="hsl(var(--primary))" opacity="0.6" />
        </marker>
      </defs>
      {stages.map((s, i) => {
        const x = 30 + i * 80;
        return (
          <g key={i}>
            <rect x={x - 20} y={8} width="40" height="40" rx="8"
              fill={`${s.color}`} fillOpacity="0.08" stroke={s.color} strokeWidth="1.2"
              opacity={0.4 + s.value * 0.5} />
            <text x={x} y={32} textAnchor="middle" fontSize="16">{s.icon}</text>
            <text x={x} y={62} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" fontWeight="500">{s.label}</text>
            {i < stages.length - 1 && (
              <g>
                <line x1={x + 20} y1={28} x2={x + 60} y2={28}
                  stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.4"
                  strokeDasharray="4,3" className="animate-flow-dash" markerEnd="url(#chainArrow)" />
                <text x={x + 40} y={22} textAnchor="middle" fontSize="9" fill="hsl(var(--primary))" fontWeight="bold" opacity="0.7">
                  {(stages[i + 1].value / s.value * 100).toFixed(0)}%
                </text>
                <circle r="2.5" fill="hsl(var(--primary))">
                  <animateMotion dur={`${1.8 + i * 0.3}s`} repeatCount="indefinite"
                    path={`M${x + 20},28 L${x + 60},28`} />
                </circle>
              </g>
            )}
          </g>
        );
      })}
      <rect x="280" y="58" width="55" height="14" rx="3" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" />
      <text x="308" y="68" textAnchor="middle" fontSize="9" fontWeight="bold" fill="hsl(var(--primary))" fontFamily="monospace">
        Σ {(total * 100).toFixed(1)}%
      </text>
    </svg>
  );
};

// ─── Power Gauge SVG ───
const PowerGaugeSVG = ({ value, max, label: gaugeLabel }: { value: number; max: number; label: string }) => {
  const pct = Math.min(value / max, 1);
  const angle = pct * 180;
  const r = 40;
  const cx = 50, cy = 50;

  const polarToCart = (deg: number) => ({
    x: cx + r * Math.cos((180 + deg) * Math.PI / 180),
    y: cy + r * Math.sin((180 + deg) * Math.PI / 180),
  });

  const arcEnd = polarToCart(angle);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <svg viewBox="0 0 100 62" className="w-full h-16">
      <path d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`}
        fill="none" stroke="hsl(var(--border))" strokeWidth="6" opacity="0.2" strokeLinecap="round" />
      <path d={`M${cx - r},${cy} A${r},${r} 0 ${largeArc},1 ${arcEnd.x},${arcEnd.y}`}
        fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))', transition: 'all 0.5s ease' }} />
      {/* Needle */}
      <line x1={cx} y1={cy} x2={arcEnd.x} y2={arcEnd.y}
        stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.7"
        style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      <circle cx={cx} cy={cy} r="3" fill="hsl(var(--primary))" />
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">{gaugeLabel}</text>
    </svg>
  );
};

// ─── Blade Deflection SVG ───
const BladeDeflectionSVG = ({ deflection, bladeLength }: { deflection: number; bladeLength: number }) => {
  const normalizedDefl = Math.min(Math.abs(deflection) * 20, 40);
  const points: string[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const x = 20 + t * 160;
    const y = 40 - normalizedDefl * t * t;
    points.push(`${x},${y}`);
  }

  return (
    <svg viewBox="0 0 200 55" className="w-full h-14">
      <line x1="20" y1="40" x2="180" y2="40" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
      <polyline points={points.join(' ')} fill="none" stroke="hsl(25 90% 55%)" strokeWidth="2.5" strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 3px hsl(25 90% 55% / 0.4))' }} />
      <circle cx="20" cy="40" r="4" fill="hsl(25 90% 55%)" opacity="0.6" />
      <line x1="180" y1="40" x2="180" y2={40 - normalizedDefl} stroke="hsl(25 90% 55%)" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
      <text x="185" y={40 - normalizedDefl / 2} fontSize="8" fill="hsl(25 90% 55%)" fontFamily="monospace">
        δ≈{(deflection * 100).toFixed(1)}cm
      </text>
      <text x="100" y="52" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">R={bladeLength}m</text>
    </svg>
  );
};

// ─── Sparkline SVG ───
const SparklineSVG = ({ values, color, label: sparkLabel }: { values: number[]; color: string; label: string }) => {
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => `${5 + (i / (values.length - 1)) * 50},${28 - (v / max) * 22}`).join(' ');
  return (
    <svg viewBox="0 0 60 32" className="w-14 h-8">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <circle cx={5 + 50} cy={28 - (values[values.length - 1] / max) * 22} r="2" fill={color}>
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </circle>
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
  const [selectedMaterialIdx, setSelectedMaterialIdx] = useState(0);

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

    const chord = R * 0.07;
    const mu = 1.81e-5;
    const Re = (rho * V * chord) / mu;
    const tsr = omega * R / (V || 1);
    const rps = omega / (2 * Math.PI);
    const fatigueCycles = rps * 3600 * 8760 * 20;
    const deflection = (rho * V * V * A * R) / (48 * 40e9 * (0.01 * R ** 4));

    let aep = 0;
    for (let v = 0.5; v <= 30; v += 0.5) {
      const fv = (weibullK / weibullC) * Math.pow(v / weibullC, weibullK - 1) * Math.exp(-Math.pow(v / weibullC, weibullK));
      let pv = 0;
      if (v >= 3 && v <= 25) {
        pv = Math.min(0.5 * rho * A * Math.pow(v, 3) * Cp, currentSettings.ratedPower);
      }
      aep += pv * fv * 0.5 * 8760;
    }

    const capex = currentSettings.ratedPower * 1.2;
    const opex = capex * 0.025;
    const lcoe = aep > 0 ? ((capex + opex * 20) / (aep * 20 / 1000)) : 0;
    const co2Offset = aep * 0.5 / 1000;

    // Electrical frequency: f = (RPM * poles) / 120
    const rpm = rps * 60;
    const elecFreqRaw = (rpm * poleCount) / 120;
    // DFIG uses gearbox to target ~50Hz; PMSG is direct-drive low freq
    const elecFreq = genType === 'DFIG' ? Math.min(elecFreqRaw * 50, 55) : elecFreqRaw;

    return { P, omega, torque, Fc, rps, capacityFactor, aep, Re, tsr, fatigueCycles, deflection, lcoe, co2Offset, elecFreq };
  }, [currentSettings, windSpeed, weibullK, weibullC, poleCount, genType]);

  // Generate sparkline data for various wind speeds
  const sparkData = useMemo(() => {
    const speeds = [2, 4, 6, 8, 10, 12, 14, 16];
    const R = currentSettings.bladeLength;
    const rho = 1.225;
    const A = Math.PI * R * R;
    const Cp = currentSettings.efficiency;
    return {
      torque: speeds.map(v => { const P = 0.5 * rho * A * v ** 3 * Cp; const omega = (7 * v) / R; return omega > 0 ? P / omega : 0; }),
      rpm: speeds.map(v => (7 * v) / R / (2 * Math.PI) * 60),
      force: speeds.map(v => { const omega = (7 * v) / R; const m = 0.5 * R * 15; return m * omega * omega * (R / 2); }),
    };
  }, [currentSettings]);

  const formatP = (w: number) => w >= 1e6 ? `${(w / 1e6).toFixed(2)} MW` : w >= 1e3 ? `${(w / 1e3).toFixed(1)} kW` : `${w.toFixed(0)} W`;
  const formatE = (wh: number) => wh >= 1e6 ? `${(wh / 1e6).toFixed(1)} GWh` : wh >= 1e3 ? `${(wh / 1e3).toFixed(0)} MWh` : `${wh.toFixed(0)} kWh`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] sm:max-h-[92vh] overflow-hidden border-primary/30 p-0" style={{ backgroundColor: '#080c12' }}>
        <div className="p-5 pb-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-foreground text-lg">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.12)', border: '1px solid hsl(var(--primary) / 0.25)' }}>
                <Wrench className="w-4.5 h-4.5 text-primary" />
              </div>
              {label('Інженерна панель генератора', 'Generator Engineering Panel')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {label('Налаштування параметрів вітрового генератора', 'Wind generator parameter settings')}
            </DialogDescription>
          </DialogHeader>

          {/* ─── Status Bar ─── */}
          <div className="flex items-center gap-2 sm:gap-3 mt-3 p-2 sm:p-2.5 rounded-xl flex-wrap" style={{ backgroundColor: 'hsl(var(--background) / 0.5)', border: '1px solid hsl(var(--border) / 0.2)' }}>
            {[
              { icon: Wind, label: 'V', value: `${windSpeed.toFixed(1)} m/s`, color: 'hsl(210 90% 60%)' },
              { icon: Zap, label: 'P', value: formatP(liveCalc.P), color: 'hsl(120 100% 54%)' },
              { icon: Activity, label: 'RPM', value: `${(liveCalc.rps * 60).toFixed(0)}`, color: 'hsl(50 90% 55%)' },
              { icon: Gauge, label: 'CF', value: `${(liveCalc.capacityFactor * 100).toFixed(0)}%`, color: 'hsl(270 70% 60%)' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                  <Icon className="w-3 h-3" style={{ color: item.color }} />
                  <span className="text-[10px] text-muted-foreground font-semibold">{item.label}</span>
                  <span className="text-xs font-mono font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Custom Tabs ─── */}
        <div className="px-5 pt-3">
          <div className="flex gap-1 p-1.5 rounded-xl" style={{ backgroundColor: 'hsl(222 28% 10% / 0.8)', border: '1px solid hsl(var(--border) / 0.3)' }}>
            {tabItems.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all duration-300 relative"
                  style={{
                    background: isActive ? `linear-gradient(135deg, ${tab.color}18, ${tab.color}08)` : 'transparent',
                    color: isActive ? tab.color : 'hsl(var(--muted-foreground))',
                    boxShadow: isActive ? `0 2px 16px ${tab.color}25, inset 0 -2px 0 ${tab.color}` : 'none',
                  }}>
                  <Icon className="w-4 h-4" style={isActive ? { filter: `drop-shadow(0 0 4px ${tab.color})` } : {}} />
                  <span className="hidden sm:inline">{lang === 'ua' ? tab.ua : tab.en}</span>
                  {isActive && (
                    <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{ backgroundColor: tab.color, boxShadow: `0 0 8px ${tab.color}` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Tab Content ─── */}
        <div className="px-5 pb-5 pt-3 overflow-y-auto eng-scrollbar overflow-x-hidden" style={{ maxHeight: 'calc(92vh - 200px)' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>

              {/* ═══ AERO ═══ */}
              {activeTab === 'aero' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl border" style={{ backgroundColor: 'hsl(210 30% 8%)', borderColor: 'hsl(210 90% 60% / 0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="w-4 h-4" style={{ color: 'hsl(210 90% 60%)' }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(210 90% 60%)' }}>
                        {label('Візуалізація профілю', 'Profile Visualization')}
                      </span>
                    </div>
                    <BladeProfileSVG profile={profile} attackAngle={attackAngle} label={label} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">{label('Профіль лопаті (NACA)', 'Blade Profile (NACA)')}</Label>
                      <Select value={bladeProfile} onValueChange={setBladeProfile}>
                        <SelectTrigger className="mt-1.5 border-border/30 bg-background/40 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {bladeProfiles.map(p => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.value} — Cl/Cd={p.clcd}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        {lang === 'ua' ? profile.desc_ua : profile.desc_en}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-semibold" style={{ color: 'hsl(120 100% 54%)' }}>Cl (Lift)</span>
                          <span className="font-mono font-bold" style={{ color: 'hsl(120 100% 54%)' }}>{profile.lift}</span>
                        </div>
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--background) / 0.6)' }}>
                          <motion.div className="h-full rounded-full" animate={{ width: `${(profile.lift / 1.5) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                            style={{ background: 'hsl(120 100% 54%)', boxShadow: '0 0 8px hsl(120 100% 54% / 0.4)' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-semibold" style={{ color: 'hsl(0 60% 55%)' }}>Cd (Drag)</span>
                          <span className="font-mono font-bold" style={{ color: 'hsl(0 60% 55%)' }}>{profile.drag}</span>
                        </div>
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--background) / 0.6)' }}>
                          <motion.div className="h-full rounded-full" animate={{ width: `${(profile.drag / 0.02) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                            style={{ background: 'hsl(0 60% 55%)', boxShadow: '0 0 8px hsl(0 60% 55% / 0.4)' }} />
                        </div>
                      </div>
                      <div className="text-center p-1.5 rounded-lg" style={{ background: 'hsl(210 90% 60% / 0.08)', border: '1px solid hsl(210 90% 60% / 0.15)' }}>
                        <span className="text-[10px] text-muted-foreground">Cl/Cd = </span>
                        <span className="text-sm font-mono font-bold" style={{ color: 'hsl(210 90% 60%)' }}>{profile.clcd}</span>
                      </div>
                    </div>
                  </div>

                  <GlowSlider value={attackAngle} onChange={setAttackAngle} min={0} max={20} step={0.5}
                    label={label('Кут атаки', 'Angle of Attack')} displayValue={`${attackAngle}°`}
                    infoText={label('6-10° — оптимально. >15° — зрив потоку (stall)', '6-10° optimal. >15° — flow separation (stall)')}
                    color={attackAngle > 15 ? 'hsl(0 62.8% 30.6%)' : 'hsl(210 90% 60%)'} />

                  {attackAngle > 15 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2.5 text-xs p-3 rounded-lg border"
                      style={{ backgroundColor: 'hsl(0 62.8% 30.6% / 0.12)', borderColor: 'hsl(0 62.8% 30.6% / 0.3)' }}>
                      <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
                      <span className="text-destructive font-medium">{label('Зрив потоку! Різке падіння підйомної сили.', 'Flow separation! Sudden lift drop.')}</span>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <GlowSlider value={currentSettings.bladeLength} onChange={v => onSettingsChange({ ...currentSettings, bladeLength: v })}
                      min={5} max={120} step={1} label={label('Довжина лопаті', 'Blade Length')} displayValue={`${currentSettings.bladeLength}m`}
                      infoText={label('A = πR². Подвоєння R → 4x потужність', 'A = πR². Double R → 4x power')} color="hsl(210 90% 60%)" />

                    <GlowSlider value={currentSettings.efficiency} onChange={v => onSettingsChange({ ...currentSettings, efficiency: v })}
                      min={0.1} max={0.55} step={0.01} label={label('Cp (ефективність)', 'Cp (efficiency)')} displayValue={`${currentSettings.efficiency}`}
                      infoText={label('Ліміт Бетца: 0.593. Реальні: 0.35-0.50', 'Betz limit: 0.593. Real: 0.35-0.50')} color="hsl(120 100% 54%)" />
                  </div>

                  {/* Betz + Re + TSR Curve */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--border))" strokeWidth="3" opacity="0.15" />
                        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(120 100% 54%)" strokeWidth="3"
                          strokeDasharray={`${(currentSettings.efficiency / 0.593) * 94.2} 94.2`}
                          strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 5px hsl(120 100% 54% / 0.5))', transition: 'stroke-dasharray 0.5s ease' }} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-mono font-bold text-primary">
                        {((currentSettings.efficiency / 0.593) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 flex-1">
                      <div className="text-center p-2 rounded-lg" style={{ background: 'hsl(var(--background) / 0.4)', border: '1px solid hsl(var(--border) / 0.2)' }}>
                        <div className="text-[10px] text-muted-foreground uppercase">Betz</div>
                        <div className="text-xs font-mono font-bold text-primary">{((currentSettings.efficiency / 0.593) * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: 'hsl(var(--background) / 0.4)', border: '1px solid hsl(var(--border) / 0.2)' }}>
                        <div className="text-[10px] text-muted-foreground uppercase">Re</div>
                        <div className="text-xs font-mono font-bold" style={{ color: 'hsl(210 90% 60%)' }}>
                          {liveCalc.Re > 1e6 ? `${(liveCalc.Re / 1e6).toFixed(1)}M` : `${(liveCalc.Re / 1e3).toFixed(0)}k`}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: 'hsl(var(--background) / 0.4)', border: '1px solid hsl(var(--border) / 0.2)' }}>
                        <div className="text-[10px] text-muted-foreground uppercase">TSR</div>
                        <div className="text-xs font-mono font-bold" style={{ color: 'hsl(40 80% 60%)' }}>{liveCalc.tsr.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>

                  {/* TSR Optimization Curve */}
                  <div className="p-3 rounded-xl border" style={{ backgroundColor: 'hsl(210 20% 7%)', borderColor: 'hsl(120 100% 54% / 0.15)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3.5 h-3.5" style={{ color: 'hsl(120 100% 54%)' }} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(120 100% 54%)' }}>
                        {label('Оптимізація TSR', 'TSR Optimization')}
                      </span>
                    </div>
                    <TSRCurveSVG currentTSR={liveCalc.tsr} />
                  </div>
                </div>
              )}

              {/* ═══ STRUCT ═══ */}
              {activeTab === 'struct' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" style={{ color: 'hsl(25 90% 55%)' }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(25 90% 55%)' }}>
                      {label('Матеріали та конструкція', 'Materials & Structure')}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border" style={{ backgroundColor: 'hsl(25 20% 7%)', borderColor: 'hsl(25 90% 55% / 0.2)' }}>
                    <RadarChartSVG materials={materials} selectedIdx={selectedMaterialIdx} onSelect={setSelectedMaterialIdx} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {materials.map((mat, i) => (
                      <motion.div key={i}
                        onClick={() => setSelectedMaterialIdx(i)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-3.5 rounded-xl border cursor-pointer transition-all duration-300"
                        style={{
                          backgroundColor: i === selectedMaterialIdx ? `${mat.color}0a` : 'hsl(var(--background) / 0.3)',
                          borderColor: i === selectedMaterialIdx ? `${mat.color}66` : 'hsl(var(--border) / 0.2)',
                          borderLeftWidth: '3px',
                          borderLeftColor: mat.color,
                          boxShadow: i === selectedMaterialIdx ? `0 0 20px ${mat.color}15` : 'none',
                        }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-foreground">{mat.name}</span>
                          {i === selectedMaterialIdx && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full" style={{ backgroundColor: mat.color, boxShadow: `0 0 6px ${mat.color}` }} />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-2">{lang === 'ua' ? mat.desc_ua : mat.desc_en}</p>
                        <div className="space-y-1.5">
                          {[
                            { prop: label('Модуль', 'Modulus'), val: mat.E, max: 210, unit: 'GPa' },
                            { prop: 'σ', val: mat.sigma, max: 1500, unit: 'MPa' },
                            { prop: 'ρ', val: mat.rho, max: 7850, unit: 'kg/m³' },
                          ].map((p, pi) => (
                            <div key={pi}>
                              <div className="flex justify-between text-[10px] mb-0.5">
                                <span className="text-muted-foreground">{p.prop}</span>
                                <span className="font-mono text-foreground">{p.val} {p.unit}</span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--background) / 0.6)' }}>
                                <motion.div className="h-full rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(p.val / p.max) * 100}%` }}
                                  transition={{ type: 'spring', stiffness: 100, damping: 15, delay: pi * 0.1 }}
                                  style={{ background: mat.color, opacity: 0.6 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <GlowSlider value={currentSettings.height} onChange={v => onSettingsChange({ ...currentSettings, height: v })}
                    min={10} max={200} step={5} label={label('Висота маточини', 'Hub Height')} displayValue={`${currentSettings.height}m`}
                    infoText={label('Висота впливає на швидкість вітру за степеневим законом', 'Height affects wind speed via power law')}
                    color="hsl(25 90% 55%)" />

                  {/* Blade deflection + Fatigue ring side by side */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 p-3 rounded-xl border" style={{ backgroundColor: 'hsl(25 15% 8%)', borderColor: 'hsl(25 90% 55% / 0.15)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowRight className="w-3.5 h-3.5" style={{ color: 'hsl(25 90% 55%)' }} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(25 90% 55%)' }}>
                          {label('Прогин лопаті', 'Blade Deflection')}
                        </span>
                      </div>
                      <BladeDeflectionSVG deflection={liveCalc.deflection} bladeLength={currentSettings.bladeLength} />
                    </div>

                    <div className="p-3 rounded-xl border flex flex-col items-center justify-center" style={{ backgroundColor: 'hsl(25 15% 8%)', borderColor: 'hsl(25 90% 55% / 0.15)' }}>
                      <span className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'hsl(25 90% 55%)' }}>
                        {label('Ресурс', 'Fatigue')}
                      </span>
                      <FatigueRingSVG fatigueCycles={liveCalc.fatigueCycles} />
                      <span className="text-[8px] text-muted-foreground font-mono mt-1">
                        {(liveCalc.fatigueCycles / 1e9).toFixed(1)}×10⁹ cyc
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ ELEC ═══ */}
              {activeTab === 'elec' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" style={{ color: 'hsl(50 90% 55%)' }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(50 90% 55%)' }}>
                      {label('Електрична система', 'Electrical System')}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border" style={{ backgroundColor: 'hsl(50 15% 6%)', borderColor: 'hsl(50 90% 55% / 0.2)' }}>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">{label('Топологія', 'Topology')}</span>
                    <GeneratorSchematicSVG genType={genType} poleCount={poleCount} label={label} />
                  </div>

                  {/* 3-Phase Diagram */}
                  <div className="p-3 rounded-xl border" style={{ backgroundColor: 'hsl(50 10% 6%)', borderColor: 'hsl(50 90% 55% / 0.15)' }}>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 block">{label('3-фазна діаграма', '3-Phase AC Diagram')}</span>
                    <PhaseDiagramSVG frequency={50} />
                  </div>

                  {/* Generator type cards — clickable */}
                  <div className="space-y-2">
                    <span className="text-[11px] text-muted-foreground uppercase font-semibold">{label('Тип генератора', 'Generator Type')}</span>
                    <div className="grid grid-cols-3 gap-2">
                      {genTypes.map((g, i) => (
                        <motion.button key={g.value}
                          onClick={() => setGenType(g.value)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="p-3 rounded-xl border text-center transition-all"
                          style={{
                            backgroundColor: g.value === genType ? 'hsl(50 90% 55% / 0.08)' : 'hsl(var(--background) / 0.3)',
                            borderColor: g.value === genType ? 'hsl(50 90% 55% / 0.5)' : 'hsl(var(--border) / 0.2)',
                            boxShadow: g.value === genType ? '0 0 20px hsl(50 90% 55% / 0.1)' : 'none',
                          }}>
                          <span className="text-2xl">{g.icon}</span>
                          <p className="text-xs font-mono font-bold mt-1" style={{ color: g.value === genType ? 'hsl(50 90% 55%)' : 'hsl(var(--muted-foreground))' }}>{g.value}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">η={(g.efficiency * 100).toFixed(0)}%</p>
                          {g.value === genType && (
                            <motion.div layoutId="genTypeGlow" className="w-full h-0.5 rounded-full mt-1.5"
                              style={{ backgroundColor: 'hsl(50 90% 55%)', boxShadow: '0 0 6px hsl(50 90% 55%)' }} />
                          )}
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{lang === 'ua' ? genTypeData.desc_ua : genTypeData.desc_en}</p>
                  </div>

                  {/* Efficiency comparison bars */}
                  <div className="space-y-2">
                    {genTypes.map((g, i) => (
                      <div key={g.value} className="flex items-center gap-2">
                        <span className="text-sm">{g.icon}</span>
                        <span className="text-xs font-mono w-12 font-semibold" style={{ color: g.value === genType ? 'hsl(50 90% 55%)' : 'hsl(var(--muted-foreground))' }}>{g.value}</span>
                        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--background) / 0.6)' }}>
                          <motion.div className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${g.efficiency * 100}%` }}
                            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: i * 0.1 }}
                            style={{
                              background: g.value === genType ? 'hsl(50 90% 55%)' : 'hsl(var(--muted-foreground) / 0.3)',
                              boxShadow: g.value === genType ? '0 0 10px hsl(50 90% 55% / 0.5)' : 'none',
                            }} />
                        </div>
                        <span className="text-xs font-mono font-bold" style={{ color: g.value === genType ? 'hsl(50 90% 55%)' : 'hsl(var(--muted-foreground))' }}>
                          {(g.efficiency * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl border" style={{ backgroundColor: 'hsl(50 10% 6%)', borderColor: 'hsl(50 90% 55% / 0.15)' }}>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 block">{label('Частотна форма хвилі', 'Frequency Waveform')}</span>
                    <FrequencyWaveform frequency={50} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <GlowSlider value={poleCount} onChange={setPoleCount} min={4} max={96} step={2}
                      label={label('Кількість полюсів', 'Pole Count')} displayValue={`${poleCount}`}
                      infoText={`n_sync = ${(60 * 50 / (poleCount / 2)).toFixed(0)} RPM @ 50Hz`}
                      color="hsl(50 90% 55%)" />
                    <GlowSlider value={voltage} onChange={setVoltage} min={230} max={6600} step={10}
                      label={label('Напруга', 'Voltage')} displayValue={`${voltage} V`} color="hsl(50 90% 55%)" />
                  </div>

                  <GlowSlider value={currentSettings.ratedPower} onChange={v => onSettingsChange({ ...currentSettings, ratedPower: v })}
                    min={1000} max={15000000} step={1000}
                    label={label('Номінальна потужність', 'Rated Power')} displayValue={formatP(currentSettings.ratedPower)}
                    color="hsl(50 90% 55%)" />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'hsl(50 15% 6%)', borderColor: 'hsl(50 90% 55% / 0.15)' }}>
                      <div className="text-[10px] text-muted-foreground uppercase mb-1">{label('Коеф. потужності', 'Power Factor')}</div>
                      <p className="text-lg font-mono font-bold text-foreground">cos φ = 0.95</p>
                    </div>
                    <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: 'hsl(50 15% 6%)', borderColor: 'hsl(50 90% 55% / 0.15)' }}>
                      <div className="text-[10px] text-muted-foreground uppercase mb-1">{label('Реактивна', 'Reactive')}</div>
                      <p className="text-lg font-mono font-bold text-foreground">
                        {formatP(liveCalc.P * Math.tan(Math.acos(0.95)))} VAr
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ CURVE ═══ */}
              {activeTab === 'curve' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" style={{ color: 'hsl(270 70% 60%)' }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(270 70% 60%)' }}>
                      {label('Крива потужності P(V) + Вейбулл f(V)', 'Power Curve P(V) + Weibull f(V)')}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border" style={{ backgroundColor: 'hsl(270 20% 7%)', borderColor: 'hsl(270 70% 60% / 0.2)' }}>
                    <PowerCurveSVG currentSettings={currentSettings} windSpeed={windSpeed} lang={lang} weibullK={weibullK} weibullC={weibullC} />
                    <div className="flex gap-5 mt-2 justify-center">
                      {[
                        { color: 'hsl(120 100% 54%)', label: 'P(V)', dash: false },
                        { color: 'hsl(270 70% 60%)', label: 'f(V)', dash: true },
                        { color: 'hsl(120 100% 54%)', label: 'AEP', dash: false, fill: true },
                      ].map((item, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="w-4 inline-block rounded" style={{
                            backgroundColor: item.color,
                            opacity: item.fill ? 0.3 : 1,
                            height: item.fill ? '8px' : '2px',
                            borderBottom: item.dash ? `2px dashed ${item.color}` : 'none',
                          }} />
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'hsl(270 70% 60% / 0.04)', borderColor: 'hsl(270 70% 60% / 0.2)' }}>
                    <span className="text-xs font-semibold text-foreground">{label('Параметри Вейбулла', 'Weibull Parameters')}</span>
                    <div className="grid grid-cols-2 gap-4">
                      <GlowSlider value={weibullK} onChange={setWeibullK} min={1.0} max={4.0} step={0.1}
                        label={`k (${label('форма', 'shape')})`} displayValue={weibullK.toFixed(1)} color="hsl(270 70% 60%)" />
                      <GlowSlider value={weibullC} onChange={setWeibullC} min={3} max={15} step={0.5}
                        label={`c (${label('масштаб', 'scale')})`} displayValue={`${weibullC.toFixed(1)} m/s`} color="hsl(270 70% 60%)" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {label('k=2 — типове розподілення. c ≈ середня_V × 1.12', 'k=2 — typical distribution. c ≈ mean_V × 1.12')}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(270 70% 60% / 0.15)' }}>
                    <span className="text-[11px] text-muted-foreground uppercase font-semibold">{label('Бенчмарки CF (Україна)', 'CF Benchmarks (Ukraine)')}</span>
                    {[
                      { region: lang === 'ua' ? '🌊 Узбережжя (Азов/Чорне)' : '🌊 Coast (Azov/Black)', cf: 0.32 },
                      { region: lang === 'ua' ? '🌾 Степ (Запоріжжя)' : '🌾 Steppe (Zaporizhia)', cf: 0.25 },
                      { region: lang === 'ua' ? '⛰️ Карпати (хребти)' : '⛰️ Carpathians (ridges)', cf: 0.22 },
                    ].map((b, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[11px] w-40 text-muted-foreground">{b.region}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--background) / 0.6)' }}>
                          <motion.div className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${b.cf * 100 * 2.5}%` }}
                            transition={{ type: 'spring', stiffness: 80, damping: 15, delay: i * 0.15 }}
                            style={{ background: 'hsl(270 70% 60%)', boxShadow: '0 0 6px hsl(270 70% 60% / 0.3)' }} />
                        </div>
                        <span className="text-xs font-mono font-bold" style={{ color: 'hsl(270 70% 60%)' }}>{(b.cf * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ CALC ═══ */}
              {activeTab === 'calc' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {label('Live-розрахунки', 'Live Calculations')}
                      </span>
                    </div>
                    <div className="text-xs font-mono px-3 py-1 rounded-lg" style={{ background: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                      V = {windSpeed.toFixed(1)} m/s
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="col-span-1 p-3 rounded-xl border text-center" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
                      <PowerGaugeSVG value={liveCalc.P} max={currentSettings.ratedPower} label={label('Потужність', 'Power')} />
                      <p className="text-lg font-mono font-bold text-primary mt-1">{formatP(liveCalc.P)}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">P = ½ρAV³Cp</p>
                    </div>
                    <div className="col-span-2">
                      <div className="p-3 rounded-xl border" style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(var(--primary) / 0.15)' }}>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">{label('Ланцюг ефективності', 'Efficiency Chain')}</span>
                        <EfficiencyChainSVG cp={currentSettings.efficiency} genEff={genTypeData.efficiency} lang={lang} />
                      </div>
                    </div>
                  </div>

                  {/* Main calc cards with sparklines */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: label('Крутний момент', 'Torque'), value: liveCalc.torque > 1000 ? `${(liveCalc.torque / 1000).toFixed(1)} kNm` : `${liveCalc.torque.toFixed(0)} Nm`, formula: 'τ = P/ω', color: 'hsl(210 90% 60%)', spark: sparkData.torque },
                      { label: label('Відцентрова сила', 'Centrifugal Force'), value: liveCalc.Fc > 1000 ? `${(liveCalc.Fc / 1000).toFixed(1)} kN` : `${liveCalc.Fc.toFixed(0)} N`, formula: 'F = mω²r', color: 'hsl(25 90% 55%)', spark: sparkData.force },
                      { label: label('Обертання', 'Rotation'), value: `${(liveCalc.rps * 60).toFixed(1)} RPM`, formula: `ω = ${liveCalc.omega.toFixed(2)} rad/s`, color: 'hsl(50 90% 55%)', spark: sparkData.rpm },
                      { label: label('Коеф. використання', 'Capacity Factor'), value: `${(liveCalc.capacityFactor * 100).toFixed(1)}%`, formula: 'CF = P/P_rated', color: 'hsl(270 70% 60%)', spark: null },
                    ].map((card, i) => (
                      <motion.div key={i} className="p-4 rounded-xl border"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        style={{
                          backgroundColor: 'hsl(var(--background) / 0.3)',
                          borderColor: `${card.color}22`,
                          borderLeftWidth: '3px',
                          borderLeftColor: card.color,
                        }}>
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] text-muted-foreground uppercase">{card.label}</div>
                          {card.spark && <SparklineSVG values={card.spark} color={card.color} label={card.label} />}
                        </div>
                        <p className="text-xl font-mono font-bold text-foreground">{card.value}</p>
                        <div className="text-[10px] text-muted-foreground font-mono mt-1">{card.formula}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* AEP */}
                  <div className="p-4 rounded-xl border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] text-muted-foreground uppercase font-semibold">{label('Річна енергія (AEP)', 'Annual Energy (AEP)')}</div>
                      <span className="text-[10px] text-muted-foreground font-mono">k={weibullK}, c={weibullC}</span>
                    </div>
                    <p className="text-3xl font-mono font-bold text-primary text-center mb-2">{formatE(liveCalc.aep)}</p>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--background) / 0.6)' }}>
                      <motion.div className="h-full rounded-full"
                        animate={{ width: `${Math.min(liveCalc.capacityFactor * 100 * 2, 100)}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                        style={{ background: 'hsl(var(--primary))', boxShadow: '0 0 10px hsl(var(--primary) / 0.5)' }} />
                    </div>
                  </div>

                  {/* LCOE + CO2 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(var(--border) / 0.3)' }}>
                      <div className="text-[10px] text-muted-foreground uppercase flex items-center justify-center gap-1.5 mb-1">
                        <DollarSign className="w-3.5 h-3.5" /> LCOE
                      </div>
                      <p className="text-xl font-mono font-bold text-foreground">{liveCalc.lcoe > 0 ? `${liveCalc.lcoe.toFixed(1)}` : '—'}</p>
                      <p className="text-[10px] text-muted-foreground">$/MWh</p>
                      <div className="mt-2 text-[10px] font-mono rounded-md p-1" style={{
                        color: liveCalc.lcoe < 50 ? 'hsl(120 100% 54%)' : liveCalc.lcoe < 100 ? 'hsl(50 90% 55%)' : 'hsl(0 60% 55%)',
                        background: liveCalc.lcoe < 50 ? 'hsl(120 100% 54% / 0.08)' : liveCalc.lcoe < 100 ? 'hsl(50 90% 55% / 0.08)' : 'hsl(0 60% 55% / 0.08)',
                      }}>
                        {liveCalc.lcoe < 50 ? label('✓ Відмінно', '✓ Excellent') : liveCalc.lcoe < 100 ? label('◐ Середнє', '◐ Average') : label('✗ Високе', '✗ High')}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(var(--border) / 0.3)' }}>
                      <div className="text-[10px] text-muted-foreground uppercase flex items-center justify-center gap-1.5 mb-1">
                        <Leaf className="w-3.5 h-3.5" /> CO₂ {label('Офсет', 'Offset')}
                      </div>
                      <p className="text-xl font-mono font-bold" style={{ color: 'hsl(120 100% 54%)' }}>
                        {liveCalc.co2Offset > 1000 ? `${(liveCalc.co2Offset / 1000).toFixed(1)}k` : liveCalc.co2Offset.toFixed(0)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{label('тонн/рік', 'tonnes/yr')}</p>
                      <div className="mt-2 text-[10px] font-mono rounded-md p-1" style={{ color: 'hsl(120 100% 54%)', background: 'hsl(120 100% 54% / 0.08)' }}>
                        🌱 {label('Еквів.', 'Equiv.')} {(liveCalc.co2Offset * 0.05).toFixed(0)} {label('дерев', 'trees')}
                      </div>
                    </div>
                  </div>

                  {/* Industry comparison */}
                  <div className="p-4 rounded-xl border" style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(var(--primary) / 0.15)' }}>
                    <span className="text-[11px] text-muted-foreground uppercase font-semibold">{label('Ваша турбіна vs індустрія', 'Your turbine vs industry')}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-3">
                      {[
                        { metric: 'Cp', yours: currentSettings.efficiency.toFixed(2), avg: '0.40', good: currentSettings.efficiency >= 0.40 },
                        { metric: 'CF', yours: `${(liveCalc.capacityFactor * 100).toFixed(0)}%`, avg: '25-35%', good: liveCalc.capacityFactor >= 0.25 },
                        { metric: 'TSR', yours: liveCalc.tsr.toFixed(1), avg: '6-8', good: liveCalc.tsr >= 6 && liveCalc.tsr <= 8 },
                      ].map((c, i) => (
                        <div key={i} className="text-center p-2 rounded-lg" style={{
                          background: c.good ? 'hsl(120 100% 54% / 0.05)' : 'hsl(0 60% 55% / 0.05)',
                          border: `1px solid ${c.good ? 'hsl(120 100% 54% / 0.15)' : 'hsl(0 60% 55% / 0.15)'}`,
                        }}>
                          <div className="text-[10px] text-muted-foreground font-semibold">{c.metric}</div>
                          <div className="text-lg font-mono font-bold" style={{ color: c.good ? 'hsl(120 100% 54%)' : 'hsl(0 60% 55%)' }}>{c.yours}</div>
                          <div className="text-[10px] text-muted-foreground">{label('сер.', 'avg')}: {c.avg}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
