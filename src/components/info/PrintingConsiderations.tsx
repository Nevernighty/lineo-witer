import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Settings, Flame, Droplets, RotateCw, Shield, Zap, Layers, Wind, ChevronDown, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

// Expandable section
const ExpandableCard = ({ title, icon: Icon, children, color = 'hsl(var(--primary))' }: { title: string; icon: any; children: React.ReactNode; color?: string }) => {
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

// Layer orientation diagram — bigger with animated arrows
const LayerOrientationSVG = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  return (
    <svg viewBox="0 0 420 160" className="w-full h-36 sm:h-44">
      {/* Correct */}
      <g>
        <text x="100" y="16" textAnchor="middle" fontSize="12" fontWeight="600" fill="hsl(120 70% 50%)">✓ {L('Правильно', 'Correct')}</text>
        <rect x="30" y="24" width="140" height="90" rx="6" fill="hsl(222 28% 12%)" stroke="hsl(120 70% 50%)" strokeWidth="1.5" opacity="0.6" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <line key={i} x1="32" y1={28 + i * 10} x2="168" y2={28 + i * 10} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.2" />
        ))}
        {/* Animated load arrows */}
        <g style={{ animation: 'pulse 2s ease-in-out infinite' }}>
          <line x1="18" y1="69" x2="5" y2="69" stroke="hsl(120 70% 50%)" strokeWidth="2.5" markerEnd="url(#arrG)" />
        </g>
        <text x="100" y="130" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">{L('Навантаження ∥ шарам', 'Load ∥ layers')}</text>
        <text x="100" y="145" textAnchor="middle" fontSize="9" fill="hsl(120 70% 50%)">σ = 100% UTS</text>
      </g>
      
      {/* Wrong */}
      <g>
        <text x="320" y="16" textAnchor="middle" fontSize="12" fontWeight="600" fill="hsl(0 70% 55%)">✗ {L('Неправильно', 'Wrong')}</text>
        <rect x="250" y="24" width="140" height="90" rx="6" fill="hsl(222 28% 12%)" stroke="hsl(0 70% 55%)" strokeWidth="1.5" opacity="0.6" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(i => (
          <line key={i} x1={254 + i * 10} y1="26" x2={254 + i * 10} y2="112" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.2" />
        ))}
        <g style={{ animation: 'pulse 2s ease-in-out 0.5s infinite' }}>
          <line x1="238" y1="69" x2="225" y2="69" stroke="hsl(0 70% 55%)" strokeWidth="2.5" markerEnd="url(#arrR)" />
        </g>
        <path d="M300 32 L305 55 L295 78 L305 100" stroke="hsl(0 70% 55%)" strokeWidth="1.5" fill="none" strokeDasharray="3 2" opacity="0.7" />
        <text x="320" y="130" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">{L('Навантаження ⊥ шарам', 'Load ⊥ layers')}</text>
        <text x="320" y="145" textAnchor="middle" fontSize="9" fill="hsl(0 70% 55%)">σ = 40-60% UTS</text>
      </g>
      
      <defs>
        <marker id="arrG" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="hsl(120 70% 50%)" /></marker>
        <marker id="arrR" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="hsl(0 70% 55%)" /></marker>
      </defs>
    </svg>
  );
};

// Interactive Infill vs Strength chart
const InfillStrengthSVG = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [infill, setInfill] = useState(60);
  
  const W = 400, H = 200, pad = { l: 50, r: 20, t: 15, b: 45 };
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;

  // Tensile strength curve (non-linear — diminishing returns above 60%)
  const strengthAt = (inf: number) => {
    if (inf <= 20) return 15 + inf * 0.8;
    if (inf <= 60) return 31 + (inf - 20) * 0.625;
    return 56 + (inf - 60) * 0.2;
  };
  const maxStr = 65;

  const points: string[] = [];
  for (let x = 10; x <= 100; x += 2) {
    const sx = pad.l + ((x - 10) / 90) * plotW;
    const sy = pad.t + plotH - (strengthAt(x) / maxStr) * plotH;
    points.push(`${sx},${sy}`);
  }

  const currentStr = strengthAt(infill);
  const cx = pad.l + ((infill - 10) / 90) * plotW;
  const cy = pad.t + plotH - (currentStr / maxStr) * plotH;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-muted-foreground">{L('Заповнення', 'Infill')}:</span>
        <div className="flex-1">
          <Slider value={[infill]} onValueChange={([v]) => setInfill(v)} min={10} max={100} step={5} />
        </div>
        <span className="text-sm font-mono text-primary font-semibold w-12 text-right">{infill}%</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40 sm:h-48">
        {[20, 30, 40, 50, 60].map(s => (
          <g key={s}>
            <line x1={pad.l} y1={pad.t + plotH - (s / maxStr) * plotH} x2={W - pad.r} y2={pad.t + plotH - (s / maxStr) * plotH} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.12" />
            <text x={pad.l - 5} y={pad.t + plotH - (s / maxStr) * plotH + 4} textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{s}</text>
          </g>
        ))}
        {[20, 40, 60, 80, 100].map(v => (
          <text key={v} x={pad.l + ((v - 10) / 90) * plotW} y={H - pad.b + 16} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{v}%</text>
        ))}
        <line x1={pad.l} y1={pad.t + plotH} x2={W - pad.r} y2={pad.t + plotH} stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.4" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + plotH} stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.4" />

        {/* Optimal zone */}
        <rect x={pad.l + ((50 - 10) / 90) * plotW} y={pad.t} width={((80 - 50) / 90) * plotW} height={plotH} fill="hsl(var(--primary))" opacity="0.04" />
        <text x={pad.l + ((65 - 10) / 90) * plotW} y={pad.t + 12} textAnchor="middle" fontSize="9" fill="hsl(var(--primary))" opacity="0.6">{L('Оптимум', 'Optimal')}</text>

        {/* Curve */}
        <polyline points={points.join(' ')} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 3px hsl(var(--primary) / 0.3))' }} />
        
        {/* Current point */}
        <line x1={cx} y1={pad.t} x2={cx} y2={pad.t + plotH} stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
        <circle cx={cx} cy={cy} r="5" fill="hsl(var(--primary))" style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.6))' }} />
        <text x={cx + 10} y={cy - 8} fontSize="11" fontWeight="600" fill="hsl(var(--primary))" fontFamily="monospace">{currentStr.toFixed(0)} MPa</text>

        <text x={(pad.l + W - pad.r) / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">{L('Заповнення (%)', 'Infill (%)')}</text>
        <text x={12} y={(pad.t + pad.t + plotH) / 2} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))" transform={`rotate(-90 12 ${(pad.t + pad.t + plotH) / 2})`}>MPa</text>
      </svg>
    </div>
  );
};

// NACA Airfoil SVG
const NACAAirfoilSVG = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  return (
    <svg viewBox="0 0 400 180" className="w-full h-36 sm:h-40">
      {/* Airfoil shape */}
      <path d="M40 90 Q60 55 120 48 Q200 40 340 85 Q200 130 120 128 Q60 125 40 90Z" 
        fill="hsl(var(--primary) / 0.06)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      
      {/* Layer lines showing FDM layers */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <line key={i} x1="50" y1={58 + i * 10} x2="330" y2={58 + i * 10} 
          stroke="hsl(var(--muted-foreground))" strokeWidth="0.3" opacity="0.15" 
          clipPath="url(#airfoilClip)" />
      ))}
      
      {/* Surface roughness indicators */}
      <path d="M80 55 L85 53 L90 56 L95 52 L100 55 L105 53 L110 56 L115 52 L120 55" 
        stroke="hsl(25 90% 55%)" strokeWidth="1" fill="none" opacity="0.6" />
      <text x="100" y="44" textAnchor="middle" fontSize="9" fill="hsl(25 90% 55%)">Ra ≈ 10-50μm (FDM)</text>
      
      {/* Smooth surface ideal */}
      <path d="M180 42 L340 84" stroke="hsl(120 70% 50%)" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5" />
      <text x="260" y="55" textAnchor="middle" fontSize="9" fill="hsl(120 70% 50%)">{'Ra < 5μm'} ({L('ідеал', 'ideal')})</text>
      
      {/* Airflow arrows */}
      {[60, 90, 130, 180, 240].map((x, i) => (
        <g key={i}>
          <line x1={x - 20} y1={88 - (i < 2 ? 30 : 20)} x2={x} y2={88 - (i < 2 ? 25 : 15)} 
            stroke="hsl(210 90% 60%)" strokeWidth="1" opacity="0.4" markerEnd="url(#airArr)" />
        </g>
      ))}
      
      <text x="200" y="170" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">
        {L('Шорсткість FDM: Cl/Cd знижується на 10–25%', 'FDM roughness: Cl/Cd reduces by 10–25%')}
      </text>
      
      <defs>
        <clipPath id="airfoilClip">
          <path d="M40 90 Q60 55 120 48 Q200 40 340 85 Q200 130 120 128 Q60 125 40 90Z" />
        </clipPath>
        <marker id="airArr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6Z" fill="hsl(210 90% 60%)" opacity="0.5" />
        </marker>
      </defs>
    </svg>
  );
};

export const PrintingConsiderations = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="space-y-4 eng-scrollbar">
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1">{L('3D-друк для вітрової енергетики', '3D Printing for Wind Energy')}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {L('Адитивне виробництво компонентів вітротурбін: збереження аеропрофілю, аналіз структурної цілісності обертових деталей, вибір матеріалів для зовнішньої експлуатації.',
             'Additive manufacturing of wind turbine components: airfoil preservation, structural analysis of rotating parts, material selection for outdoor operation.')}
        </p>
      </motion.div>

      {/* NACA Airfoil Printing */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
          <Wind className="w-4 h-4 text-primary" /> {L('Друк аеродинамічного профілю', 'Printing Aerodynamic Profiles')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Шорсткість поверхні FDM-друку (Ra 10–50 мкм) збільшує аеродинамічний опір лопаті на 10–25%, знижуючи Cl/Cd. Критично: задня кромка та зона максимальної товщини профілю.',
             'FDM surface roughness (Ra 10–50 μm) increases blade drag by 10–25%, reducing Cl/Cd. Critical: trailing edge and max thickness zone.')}
        </p>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <NACAAirfoilSVG lang={lang} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: L('Шліфування', 'Sanding'), value: '120→800 grit', desc: L('Ra < 10мкм', 'Ra < 10μm') },
            { label: L('Наповнювач', 'Filler'), value: L('ґрунт-шпакля', 'primer filler'), desc: L('Заповнює ступені', 'Fills step lines') },
            { label: L('Лак', 'Coating'), value: '2K PU', desc: L('UV + Ra < 3мкм', 'UV + Ra < 3μm') },
          ].map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg border text-center" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <p className="text-xs font-semibold text-foreground">{item.label}</p>
              <p className="text-xs font-mono text-primary mt-0.5">{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Layer orientation diagram */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" /> {L('Орієнтація шарів відносно навантаження', 'Layer Orientation vs Load Direction')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Адгезія шарів FDM — 40–60% від міцності в площині. Завжди орієнтуйте деталь так, щоб навантаження йшло вздовж шарів. Це критично для лопатей та хабу ротора.',
             'FDM layer adhesion is 40–60% of in-plane strength. Always orient parts so load runs along layers. Critical for blades and rotor hub.')}
        </p>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <LayerOrientationSVG lang={lang} />
        </div>
      </div>

      {/* Infill vs Strength interactive */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" /> {L('Заповнення vs міцність (PETG)', 'Infill vs Strength (PETG)')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Нелінійна залежність: після 60% заповнення приріст міцності мінімальний, але маса значно зростає. Оптимум для лопатей: 50–70%.', 
             'Non-linear relationship: beyond 60% infill, strength gains are minimal but mass increases significantly. Blade optimum: 50–70%.')}
        </p>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <InfillStrengthSVG lang={lang} />
        </div>
      </div>

      {/* Optimal Print Parameters */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" /> {L('Оптимальні параметри друку', 'Optimal Print Parameters')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: L('Висота шару', 'Layer Height'), structural: '0.15–0.20mm', nonCritical: '0.25–0.30mm', note: L('Менше = гладша поверхня = кращий Cl/Cd', 'Smaller = smoother surface = better Cl/Cd') },
            { label: L('Заповнення', 'Infill Density'), structural: '60–80%', nonCritical: '20–40%', note: L('Структурні деталі — від 60%', 'Structural parts — from 60%') },
            { label: L('Товщина стінки', 'Wall Thickness'), structural: L('3–4 периметри', '3–4 perimeters'), nonCritical: L('2 периметри', '2 perimeters'), note: L('Більше стінок = краща УФ-стійкість', 'More walls = better UV resistance') },
            { label: L('Швидкість друку', 'Print Speed'), structural: '30–40 mm/s', nonCritical: '50–80 mm/s', note: L('Повільніше = менше вібрацій = точніший профіль', 'Slower = less vibration = precise profile') },
          ].map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <p className="text-xs font-semibold text-foreground mb-1.5">{p.label}</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{L('Силові', 'Structural')}</span>
                  <span className="font-mono text-primary">{p.structural}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{L('Некритичні', 'Non-critical')}</span>
                  <span className="font-mono text-foreground">{p.nonCritical}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 opacity-70">{p.note}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Expandable engineering sections */}
      <div className="space-y-2">
        <ExpandableCard title={L('Структурний FEA-аналіз для FDM', 'Structural FEA Analysis for FDM')} icon={Shield} color="hsl(210 90% 60%)">
          <div className="space-y-2">
            <p>{L('FEA з ортотропними моделями матеріалу — обовʼязковий для обертових деталей:', 'FEA with orthotropic material models is mandatory for rotating parts:')}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                <p className="text-xs font-semibold text-foreground">{L('Статичний аналіз', 'Static Analysis')}</p>
                <p className="text-xs mt-1">{L('Відцентрові + аеродинамічні навантаження. Запас міцності ≥ 2.0 для полімерів. Враховувати анізотропію FDM: Z-вісь = 40–60% від XY.', 'Centrifugal + aerodynamic loads. Safety factor ≥ 2.0 for polymers. Account for FDM anisotropy: Z-axis = 40–60% of XY.')}</p>
              </div>
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                <p className="text-xs font-semibold text-foreground">{L('Модальний аналіз', 'Modal Analysis')}</p>
                <p className="text-xs mt-1">{L('Власні частоти уникають гармонік 1P (обертання) та 3P (лопаті). Кемпбелл-діаграма обовʼязкова.', 'Natural frequencies must avoid 1P (rotation) and 3P (blade pass). Campbell diagram mandatory.')}</p>
              </div>
            </div>
            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
              <p className="text-xs font-semibold text-primary mb-1">{L('Відцентрове навантаження', 'Centrifugal Loading')}</p>
              <p className="text-xs font-mono text-center text-primary my-1">F = m·ω²·r</p>
              <p className="text-xs">{L('При 300 об/хв, лопать 0.5м, маса 100г: F ≈ 50Н на кінці. PETG (50 МПа) витримує при 60% заповненні та 3+ стінках.', 'At 300 RPM, 0.5m blade, 100g mass: F ≈ 50N at tip. PETG (50 MPa) handles with 60% infill and 3+ walls.')}</p>
            </div>
            <p className="text-xs">{L('Безкоштовні інструменти: FreeCAD FEM, Fusion 360 Simulation, SimScale (cloud).', 'Free tools: FreeCAD FEM, Fusion 360 Simulation, SimScale (cloud).')}</p>
          </div>
        </ExpandableCard>

        <ExpandableCard title={L('Аналіз втоми обертових деталей', 'Fatigue Analysis for Rotating Parts')} icon={RotateCw} color="hsl(25 90% 55%)">
          <div className="space-y-2">
            <p>{L('Кожен оберт = 1 цикл втоми. При 300 об/хв це 432,000 циклів/день або 157М/рік.', 'Each revolution = 1 fatigue cycle. At 300 RPM: 432,000 cycles/day or 157M/year.')}</p>
            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
              <p className="text-xs font-semibold text-primary mb-1">{L('Правило проектування для нескінченного ресурсу', 'Infinite Life Design Rule')}</p>
              <p className="text-xs">{L('Макс. напруження < 30–40% UTS. PETG: ≤20 МПа. Нейлон: ≤28 МПа. ASA: ≤18 МПа.', 'Max stress < 30–40% UTS. PETG: ≤20 MPa. Nylon: ≤28 MPa. ASA: ≤18 MPa.')}</p>
            </div>
            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <p className="text-xs font-semibold text-foreground">{L('Повзучість (Creep)', 'Creep Under Load')}</p>
              <p className="text-xs mt-1">{L('При постійному навантаженні + температурі > 40°C полімери деформуються з часом. PETG: +0.5% при 60°C за 1000 год. Нейлон: +0.3%.', 'Under sustained load + temp > 40°C, polymers deform over time. PETG: +0.5% at 60°C per 1000h. Nylon: +0.3%.')}</p>
            </div>
            <p className="text-xs">{L('Галтелі r ≥ 2мм на всіх переходах. Концентрації напружень на межах шарів — місця ініціації тріщин.', 'Fillets r ≥ 2mm at all transitions. Layer boundary stress concentrations are crack initiation sites.')}</p>
          </div>
        </ExpandableCard>

        <ExpandableCard title={L('Матеріали для зовнішньої експлуатації', 'Materials for Outdoor Operation')} icon={Flame} color="hsl(0 70% 55%)">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'ASA', uv: L('Відмінна', 'Excellent'), temp: '95°C', note: L('Найкращий для зовнішнього — зберігає 90% після 2000г УФ', 'Best outdoor — retains 90% after 2000h UV') },
                { name: 'PETG', uv: L('Помірна', 'Moderate'), temp: '75°C', note: L('Добрий баланс ціна/якість. Потребує УФ-покриття', 'Good value balance. Needs UV coating') },
                { name: 'Nylon (PA)', uv: L('Помірна', 'Moderate'), temp: '110°C', note: L('Найкраща втомна стійкість. Гігроскопічний — потребує сушіння', 'Best fatigue resistance. Hygroscopic — needs drying') },
                { name: 'CF-PETG', uv: L('Добра', 'Good'), temp: '85°C', note: L('2× жорсткість. Абразивний для сопел — потребує hardened steel', '2× stiffness. Abrasive — needs hardened nozzle') },
              ].map((mat, i) => (
                <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                  <Badge variant="outline" className="text-xs border-primary/30 bg-primary/5 text-primary font-mono mb-1">{mat.name}</Badge>
                  <div className="text-xs space-y-0.5">
                    <div className="flex justify-between"><span className="text-muted-foreground">UV</span><span>{mat.uv}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">T<sub>max</sub></span><span className="font-mono">{mat.temp}</span></div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{mat.note}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
              <p className="text-xs font-semibold text-primary mb-1">{L('Вологопоглинання', 'Moisture Absorption')}</p>
              <p className="text-xs">{L('Нейлон: 2–8% маси. Сушити при 70°C 6–12 год перед друком. Зберігати з силікагелем. PETG та ASA < 0.3%.', 'Nylon: 2–8% mass. Dry at 70°C 6–12h before printing. Store with desiccant. PETG and ASA < 0.3%.')}</p>
            </div>
          </div>
        </ExpandableCard>

        <ExpandableCard title={L('Постобробка та фінішна обробка', 'Post-Processing & Surface Finishing')} icon={Flame} color="hsl(120 70% 50%)">
          <div className="space-y-2">
            {[
              { step: L('Відпал', 'Annealing'), detail: L('PETG до 80°C на 2 год для зняття напружень та +15% кристалічності. Розміри зміняться на ±0.5% — враховуйте в CAD.', 'PETG at 80°C for 2h to relieve stress and +15% crystallinity. Dimensions shift ±0.5% — account in CAD.') },
              { step: L('Шліфування аеропрофілю', 'Airfoil Sanding'), detail: L('120→400→800 грит. Ціль Ra < 10мкм для лопатей. Фокус на задній кромці (trailing edge) — вона визначає Cd.', '120→400→800 grit. Target Ra < 10μm for blades. Focus on trailing edge — it determines Cd.') },
              { step: L('UV-покриття', 'UV Coating'), detail: L('2K поліуретановий лак. 2–3 шари. Оновлюйте щорічно. Для PETG/PLA обовʼязково — без покриття деградація за 6–12 місяців.', '2K polyurethane clear coat. 2–3 layers. Recoat annually. Mandatory for PETG/PLA — degrades in 6–12 months without.') },
              { step: L('Епоксидне підсилення', 'Epoxy Reinforcement'), detail: L('Епоксидна смола на кореневу частину лопаті та хаб. +30% міцності. Скловолокно на критичні ділянки.', 'Epoxy resin on blade root and hub. +30% strength. Fiberglass on critical areas.') },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                <p className="text-xs font-semibold text-foreground">{item.step}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
            ))}
          </div>
        </ExpandableCard>

        <ExpandableCard title={L('Балансування ротора', 'Rotor Balancing')} icon={Droplets} color="hsl(270 70% 60%)">
          <div className="space-y-2">
            <p>{L('Незбалансовані ротори — вібрація, знос підшипників, шум. 3D-друк має варіацію маси ±2–5% між деталями.', 'Unbalanced rotors cause vibration, bearing wear, noise. 3D prints have ±2–5% mass variation between parts.')}</p>
            <div className="space-y-1.5">
              {[
                { step: 1, text: L('Зважте всі лопаті. Збіг маси в межах 0.5г.', 'Weigh all blades. Match mass within 0.5g.') },
                { step: 2, text: L('Статичне балансування: хаб горизонтально на лезі ножа. Додайте глину на легшу лопать.', 'Static balance: hub on knife edge. Add clay to lighter blade.') },
                { step: 3, text: L('Динамічний тест: обертайте повільно. Ціль вібрації < 0.5мм/с RMS.', 'Dynamic test: spin slowly. Target vibration < 0.5mm/s RMS.') },
                { step: 4, text: L('Замініть глину на епоксид + стальний дріб для постійного балансу.', 'Replace clay with epoxy + steel shot for permanent balance.') },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs shrink-0 mt-0.5 border-primary/30 bg-primary/5 text-primary">{item.step}</Badge>
                  <p className="text-xs">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </ExpandableCard>

        <ExpandableCard title={L('Контрольний список якості', 'Quality Control Checklist')} icon={Zap} color="hsl(50 90% 55%)">
          <div className="space-y-1.5">
            {[
              L('Візуальний: без розшарування, ниток, недоекструзії', 'Visual: no delamination, stringing, under-extrusion'),
              L('Розмір: критичні розміри в допуску ±0.2мм (штангенциркулем)', 'Dimensions: critical sizes within ±0.2mm tolerance (calipers)'),
              L('Тест постукуванням: рівномірний звук = однорідне заповнення', 'Tap test: consistent sound = uniform infill'),
              L('Профіль: перевірити аеропрофіль шаблоном у 3+ перерізах', 'Profile: check airfoil with template at 3+ sections'),
              L('Маса: ±3% від CAD-прогнозу. Різниця між лопатями < 0.5г', 'Weight: ±3% of CAD mass. Blade-to-blade difference < 0.5g'),
              L('Поверхня: Ra < 10мкм після обробки на аеродинамічних зонах', 'Surface: Ra < 10μm post-processing on aerodynamic zones'),
              L('Збірка: зʼєднання без зусилля чи люфту. Болти з фіксатором', 'Assembly: joints mate without forcing or play. Bolts with thread-lock'),
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <p className="text-xs">{item}</p>
              </div>
            ))}
          </div>
        </ExpandableCard>
      </div>
    </div>
  );
};
