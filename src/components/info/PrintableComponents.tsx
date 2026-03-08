import React, { useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Wrench, Thermometer, Shield, Layers, ChevronDown, Wind, Cog, Box, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

const componentsData = [
  { id: 'blades', icon: Wind, component_ua: 'Лопаті турбіни', component_en: 'Turbine Blades', material: 'PETG, ABS, ASA', method: 'FDM — 0.2mm', cost: '€10–€30', orientation_ua: 'Друкуйте вертикально з підтримками для збереження аеропрофілю', orientation_en: 'Print vertically with supports for aero profile integrity', stressNote_ua: 'Відцентрова сила: F = mω²r. При 300 об/хв з лопаттю 0.5м, сила на кінці ≈ 50Н. PETG (50 МПа) витримує при 60% заповненні.', stressNote_en: 'Centrifugal force: F = mω²r. At 300 RPM with 0.5m blade, tip force ≈ 50N. PETG tensile (50 MPa) handles this with 60% infill.', tolerancing_ua: '±0.2мм на кореневій посадці. Посадка з натягом для хабу.', tolerancing_en: '±0.2mm on root fitment. Interference fit for hub connection.', assembly_ua: 'Балансуйте лопаті в межах 0.5г. Зашліфуйте задні кромки до 0.5мм.', assembly_en: 'Balance blades within 0.5g per set. Sand trailing edges to 0.5mm.', color: 'hsl(120 100% 54%)', severity: 'critical' },
  { id: 'hub', icon: Cog, component_ua: 'Хаб ротора', component_en: 'Rotor Hub', material: 'PLA+, PETG, Nylon', method: 'FDM — 0.15mm', cost: '€5–€15', orientation_ua: 'Друкуйте плоско з концентричним заповненням', orientation_en: 'Print flat with concentric infill for radial strength', stressNote_ua: 'Комбіноване згинання + кручення від усіх лопатей. Мінімум 80% заповнення. Нейлон кращий для втомного ресурсу.', stressNote_en: 'Combined bending + torsion from all blades. 80% infill minimum. Nylon preferred for fatigue resistance.', tolerancing_ua: '±0.1мм на отворі вала. Розгортка після друку для пресової посадки.', tolerancing_en: '±0.1mm on shaft bore. Ream after printing for press-fit with bearing.', assembly_ua: 'Попередньо свердліть отвори під болти. Нарізьте M4/M5 різьбу.', assembly_en: 'Pre-drill blade bolt holes slightly undersized. Tap with M4/M5 thread.', color: 'hsl(210 90% 60%)', severity: 'critical' },
  { id: 'housing', icon: Box, component_ua: 'Корпус гондоли', component_en: 'Nacelle Housing', material: 'ASA, PETG', method: 'FDM — 0.3mm', cost: '€20–€50', orientation_ua: 'Розділіть на половини, зʼєднуйте розчинником або механічно', orientation_en: 'Split into halves, join with solvent welding or fasteners', stressNote_ua: 'Захист від погоди. ASA зберігає 90% міцності після 2000 год UV.', stressNote_en: 'Weather protection. ASA retains 90% strength after 2000h UV.', tolerancing_ua: '±0.5мм. Прокладка або силікон на лінії розʼєму.', tolerancing_en: '±0.5mm acceptable. Gasket or silicone at split line.', assembly_ua: 'Канали для кабелів у дизайні. Вентиляційні щілини.', assembly_en: 'Include cable channels. Add ventilation slots for cooling.', color: 'hsl(25 90% 55%)', severity: 'recommended' },
  { id: 'vawt-rotor', icon: RotateCcw, component_ua: 'Вертикальний ротор', component_en: 'Vertical Rotor (VAWT)', material: 'PETG, ASA', method: 'FDM — 0.2mm', cost: '€15–€40', orientation_ua: 'Половини Савоніуса окремо, зʼєднуйте епоксидом', orientation_en: 'Print Savonius halves separately, bond with epoxy', stressNote_ua: 'Циклічний згин за оберт. Межа втоми PETG ≈ 40% від UTS. Проектуйте для нескінченного ресурсу.', stressNote_en: 'Cyclic bending per revolution. PETG fatigue limit ≈ 40% of tensile. Design for infinite life.', tolerancing_ua: '±0.3мм на профілі. Наповнювач-ґрунт для гладкості.', tolerancing_en: '±0.3mm on profile. Filler primer for smooth surface.', assembly_ua: 'Динамічне балансування на оправці. Вібрація < 0.5мм/с RMS.', assembly_en: 'Dynamic balance on mandrel. Vibration < 0.5mm/s RMS.', color: 'hsl(270 70% 60%)', severity: 'recommended' },
  { id: 'mounts', icon: Layers, component_ua: 'Кріплення та корпуси підшипників', component_en: 'Mounts & Bearing Housings', material: 'Nylon, CF-PETG', method: 'FDM / SLS', cost: '€30–€100', orientation_ua: 'Навантаження вздовж шарів. Z-вісь найслабша.', orientation_en: 'Load path aligned to layers. Z-axis is weakest.', stressNote_ua: 'CF-PETG дає 2× жорсткість. Адгезія шарів 40-60% від міцності в площині.', stressNote_en: 'CF-PETG gives 2× stiffness. Layer adhesion is 40-60% of in-plane strength.', tolerancing_ua: '±0.05мм на посадочних поверхнях підшипників. Металеві вставки.', tolerancing_en: '±0.05mm on bearing seats. Metal inserts for bolt holes.', assembly_ua: 'Запресовуйте підшипники (натяг 0.02мм). Фіксатор різьби.', assembly_en: 'Press-fit bearings (0.02mm interference). Thread-locking compound.', color: 'hsl(0 60% 55%)', severity: 'critical' },
];

const materialComparison = [
  { name: 'PLA', tensile: 60, uv: 1, temp: 55, fatigue: 1, cost: 1, color: 'hsl(0 60% 50%)' },
  { name: 'PETG', tensile: 50, uv: 2, temp: 75, fatigue: 3, cost: 2, color: 'hsl(210 80% 55%)' },
  { name: 'ASA', tensile: 45, uv: 4, temp: 95, fatigue: 3, cost: 2, color: 'hsl(25 80% 55%)' },
  { name: 'Nylon', tensile: 70, uv: 2, temp: 110, fatigue: 4, cost: 3, color: 'hsl(120 70% 50%)' },
  { name: 'CF-PETG', tensile: 75, uv: 3, temp: 85, fatigue: 3.5, cost: 3, color: 'hsl(var(--primary))' },
];

const properties = [
  { key: 'tensile', label_ua: 'Розтяг', label_en: 'Tensile', max: 80, unit: 'MPa' },
  { key: 'uv', label_ua: 'UV стійкість', label_en: 'UV Resist.', max: 4, unit: '' },
  { key: 'temp', label_ua: 'Макс. темп.', label_en: 'Max Temp', max: 120, unit: '°C' },
  { key: 'fatigue', label_ua: 'Втома', label_en: 'Fatigue', max: 4, unit: '' },
  { key: 'cost', label_ua: 'Ціна', label_en: 'Cost', max: 4, unit: '' },
];

// Pentagon radar chart for a single material
const MaterialRadar = ({ mat, size = 80, isActive }: { mat: typeof materialComparison[0]; size?: number; isActive: boolean }) => {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38;
  const angles = properties.map((_, i) => (Math.PI * 2 * i) / properties.length - Math.PI / 2);
  
  const getNorm = (key: string) => {
    const val = (mat as any)[key];
    const prop = properties.find(p => p.key === key)!;
    return val / prop.max;
  };

  const dataPoints = properties.map((p, i) => {
    const norm = getNorm(p.key);
    return {
      x: cx + Math.cos(angles[i]) * r * norm,
      y: cy + Math.sin(angles[i]) * r * norm,
    };
  });
  const path = dataPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ') + 'Z';

  // Grid rings
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      {/* Grid */}
      {gridRings.map((ringR, ri) => {
        const ringPath = angles.map((a, i) => {
          const px = cx + Math.cos(a) * r * ringR;
          const py = cy + Math.sin(a) * r * ringR;
          return `${i === 0 ? 'M' : 'L'}${px},${py}`;
        }).join(' ') + 'Z';
        return <path key={ri} d={ringPath} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.2" />;
      })}
      {/* Axes */}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r}
          stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.3" />
      ))}
      {/* Data fill */}
      <motion.path d={path} fill={mat.color} fillOpacity={isActive ? 0.25 : 0.1}
        stroke={mat.color} strokeWidth={isActive ? 1.5 : 0.8}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        style={{ filter: isActive ? `drop-shadow(0 0 6px ${mat.color})` : 'none' }} />
      {/* Dots */}
      {dataPoints.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={isActive ? 2.5 : 1.5} fill={mat.color} opacity={isActive ? 1 : 0.6} />
      ))}
    </svg>
  );
};

// Interactive blade stress — upgraded
const BladeStressSVG = ({ lang, rpm }: { lang: 'ua' | 'en'; rpm: number }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [hoverX, setHoverX] = useState<number | null>(null);
  
  const bladeLength = 0.5;
  const omega = (rpm * 2 * Math.PI) / 60;
  const bladeMass = 0.1;

  const W = 440, H = 400;
  const bladeStartX = 50, bladeEndX = 400;
  const bladeSpan = bladeEndX - bladeStartX;
  const bladeY = 100;

  const getStressAtPosition = (normalizedR: number) => {
    const r = normalizedR * bladeLength;
    const F_centrifugal = bladeMass * omega * omega * r;
    const bendingMoment = F_centrifugal * (bladeLength - r) * 0.5;
    const shearForce = bladeMass * omega * omega * (bladeLength - r) * 0.3;
    const sigma = ((1 - normalizedR) * 25 * (rpm / 300));
    return { F_centrifugal, bendingMoment, shearForce, r, sigma };
  };

  const hoverNormalized = hoverX !== null ? Math.max(0, Math.min(1, (hoverX - bladeStartX) / bladeSpan)) : null;
  const hoverData = hoverNormalized !== null ? getStressAtPosition(hoverNormalized) : null;
  const tipForce = (bladeMass * omega * omega * bladeLength).toFixed(0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-72 sm:h-96"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * W;
        if (x >= bladeStartX && x <= bladeEndX) setHoverX(x);
        else setHoverX(null);
      }}
      onMouseLeave={() => setHoverX(null)}>
      
      <defs>
        <linearGradient id="bladeHeatGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(0 85% 50%)" stopOpacity="0.5" />
          <stop offset="20%" stopColor="hsl(15 80% 50%)" stopOpacity="0.35" />
          <stop offset="45%" stopColor="hsl(40 75% 50%)" stopOpacity="0.2" />
          <stop offset="75%" stopColor="hsl(80 60% 48%)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="hsl(130 50% 45%)" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="momentFill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="hsl(25 80% 55%)" stopOpacity="0" />
          <stop offset="100%" stopColor="hsl(25 80% 55%)" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="shearFill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="hsl(210 80% 55%)" stopOpacity="0" />
          <stop offset="100%" stopColor="hsl(210 80% 55%)" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="critZone" cx="0" cy="0.5" r="0.2">
          <stop offset="0%" stopColor="hsl(0 80% 50%)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(0 80% 50%)" stopOpacity="0" />
        </radialGradient>
        <marker id="arrowRed" markerWidth="8" markerHeight="6" refX="4" refY="3" orient="auto">
          <path d="M0 0 L8 3 L0 6Z" fill="hsl(0 80% 55%)" />
        </marker>
        <marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="4" refY="3" orient="auto">
          <path d="M0 0 L8 3 L0 6Z" fill="hsl(210 80% 55%)" />
        </marker>
        <filter id="glowRoot">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Title */}
      <text x={W / 2} y="18" textAnchor="middle" fontSize="13" fontWeight="700" fill="hsl(var(--foreground))">
        {L('Розподіл навантажень — інтерактивна візуалізація', 'Blade Load Distribution — Interactive')}
      </text>
      <text x={W / 2} y="34" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="monospace">
        {rpm} {L('об/хв', 'RPM')} · ω = {omega.toFixed(1)} rad/s · F_tip = {tipForce}N
      </text>

      {/* Critical zone pulse at root */}
      <motion.circle cx={bladeStartX} cy={bladeY} r="18" fill="url(#critZone)" filter="url(#glowRoot)"
        animate={{ r: [16, 22, 16], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />

      {/* Blade body with airfoil shape */}
      <path d={`M${bladeStartX} ${bladeY} 
        Q${bladeStartX + bladeSpan * 0.15} ${bladeY - 22} ${bladeStartX + bladeSpan * 0.4} ${bladeY - 16}
        Q${bladeStartX + bladeSpan * 0.7} ${bladeY - 8} ${bladeEndX} ${bladeY - 2}
        L${bladeEndX} ${bladeY + 2}
        Q${bladeStartX + bladeSpan * 0.7} ${bladeY + 12} ${bladeStartX + bladeSpan * 0.4} ${bladeY + 18}
        Q${bladeStartX + bladeSpan * 0.15} ${bladeY + 24} ${bladeStartX} ${bladeY}Z`}
        fill="url(#bladeHeatGrad)" stroke="hsl(var(--primary))" strokeWidth="1.2" />

      {/* Stress color bands along blade */}
      {Array.from({ length: 30 }, (_, i) => {
        const norm = i / 30;
        const x = bladeStartX + norm * bladeSpan;
        const w = bladeSpan / 30;
        const stress = 1 - norm;
        const hue = stress > 0.65 ? 0 : stress > 0.35 ? 30 + (1 - stress) * 60 : 90 + (1 - stress) * 40;
        return <rect key={i} x={x} y={bladeY - 18} width={w} height={38} fill={`hsl(${hue} 70% 50%)`} opacity={0.06 + stress * 0.08} rx="0.5" />;
      })}

      {/* Aerodynamic load arrows — pulsing */}
      {[0.12, 0.25, 0.38, 0.52, 0.66, 0.8].map((pos, i) => {
        const x = bladeStartX + pos * bladeSpan;
        const magnitude = (1 - pos) * 0.7 + 0.3;
        const arrowLen = 18 + magnitude * 18;
        return (
          <motion.g key={`aero-${i}`}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }}>
            <line x1={x} y1={bladeY - 28 - arrowLen} x2={x} y2={bladeY - 22}
              stroke="hsl(0 80% 55%)" strokeWidth="1.3" markerEnd="url(#arrowRed)" />
            <text x={x} y={bladeY - 30 - arrowLen} textAnchor="middle" fontSize="7" fill="hsl(0 70% 55%)" fontFamily="monospace">
              {(magnitude * 15).toFixed(0)}N
            </text>
          </motion.g>
        );
      })}

      {/* Centrifugal force arrows — scale with RPM */}
      {[0.1, 0.3, 0.5, 0.7].map((pos, i) => {
        const x = bladeStartX + pos * bladeSpan;
        const forceNorm = pos * (rpm / 400);
        const arrowLen = 8 + forceNorm * 22;
        return (
          <motion.g key={`cent-${i}`}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.5, delay: i * 0.2, repeat: Infinity }}>
            <line x1={x} y1={bladeY + 22} x2={x} y2={bladeY + 22 + arrowLen}
              stroke="hsl(210 80% 55%)" strokeWidth="1.3" markerEnd="url(#arrowBlue)" />
          </motion.g>
        );
      })}

      {/* Labels for sections */}
      <text x={bladeStartX} y={bladeY + 58} fontSize="9" fill="hsl(0 70% 55%)" fontWeight="600" fontFamily="monospace">
        {L('КРИТИЧНА ЗОНА', 'CRITICAL ZONE')}
      </text>
      <text x={bladeEndX - 30} y={bladeY + 58} textAnchor="end" fontSize="9" fill="hsl(120 60% 50%)" fontWeight="600" fontFamily="monospace">
        {L('Кінець', 'Tip')}
      </text>

      {/* ═══ Bending moment diagram ═══ */}
      <text x={bladeStartX - 6} y="195" textAnchor="end" fontSize="9" fill="hsl(25 80% 55%)" fontWeight="600">M(x)</text>
      {(() => {
        const baseY = 220;
        const pts: string[] = [];
        for (let i = 0; i <= 50; i++) {
          const norm = i / 50;
          const x = bladeStartX + norm * bladeSpan;
          const moment = (1 - norm) ** 2 * (rpm / 300);
          const y = baseY - Math.min(moment, 2) * 25;
          pts.push(`${x},${y}`);
        }
        return (
          <>
            <polygon points={`${bladeStartX},${baseY} ${pts.join(' ')} ${bladeEndX},${baseY}`} fill="url(#momentFill)" />
            <polyline points={pts.join(' ')} fill="none" stroke="hsl(25 80% 55%)" strokeWidth="2" opacity="0.8" />
            <line x1={bladeStartX} y1={baseY} x2={bladeEndX} y2={baseY} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
          </>
        );
      })()}

      {/* ═══ Shear force diagram ═══ */}
      <text x={bladeStartX - 6} y="255" textAnchor="end" fontSize="9" fill="hsl(210 80% 55%)" fontWeight="600">V(x)</text>
      {(() => {
        const baseY = 280;
        const pts: string[] = [];
        for (let i = 0; i <= 50; i++) {
          const norm = i / 50;
          const x = bladeStartX + norm * bladeSpan;
          const shear = (1 - norm) * (rpm / 300);
          const y = baseY - Math.min(shear, 2) * 18;
          pts.push(`${x},${y}`);
        }
        return (
          <>
            <polygon points={`${bladeStartX},${baseY} ${pts.join(' ')} ${bladeEndX},${baseY}`} fill="url(#shearFill)" />
            <polyline points={pts.join(' ')} fill="none" stroke="hsl(210 80% 55%)" strokeWidth="1.8" opacity="0.7" />
            <line x1={bladeStartX} y1={baseY} x2={bladeEndX} y2={baseY} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
          </>
        );
      })()}

      {/* Hover crosshair + tooltip */}
      {hoverX !== null && hoverNormalized !== null && hoverData !== null && (
        <>
          <line x1={hoverX} y1={40} x2={hoverX} y2={290} stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.35" strokeDasharray="3 3" />
          <circle cx={hoverX} cy={bladeY} r="5" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5"
            style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.6))' }} />
          
          <rect x={Math.min(W - 175, Math.max(5, hoverX - 85))} y="310" width="170" height="70" rx="8"
            fill="hsl(222 28% 8%)" stroke="hsl(var(--primary))" strokeWidth="0.8" opacity="0.97"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} />
          <text x={Math.min(W - 90, Math.max(90, hoverX))} y="326" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="hsl(var(--primary))" fontWeight="600">
            r = {hoverData.r.toFixed(3)}m ({(hoverNormalized * 100).toFixed(0)}%)
          </text>
          <text x={Math.min(W - 90, Math.max(90, hoverX))} y="342" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="hsl(var(--foreground))">
            F = {hoverData.F_centrifugal.toFixed(1)}N · M = {hoverData.bendingMoment.toFixed(2)} N·m
          </text>
          <text x={Math.min(W - 90, Math.max(90, hoverX))} y="357" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="hsl(var(--foreground))">
            V = {hoverData.shearForce.toFixed(1)}N · σ ≈ {hoverData.sigma.toFixed(1)} MPa
          </text>
          <text x={Math.min(W - 90, Math.max(90, hoverX))} y="372" textAnchor="middle" fontSize="8" fontFamily="monospace"
            fill={hoverData.sigma > 30 ? 'hsl(0 70% 55%)' : hoverData.sigma > 15 ? 'hsl(40 70% 55%)' : 'hsl(120 60% 50%)'}>
            {hoverData.sigma > 30 ? L('⚠ Перевищує PETG межу', '⚠ Exceeds PETG limit') : hoverData.sigma > 15 ? L('⚡ Помірне навантаження', '⚡ Moderate load') : L('✓ Безпечна зона', '✓ Safe zone')}
          </text>
        </>
      )}
    </svg>
  );
};

// Print orientation mini SVG
const OrientationArrow = ({ vertical }: { vertical: boolean }) => (
  <svg viewBox="0 0 28 28" className="w-6 h-6 shrink-0">
    <rect x="4" y="6" width="20" height="16" rx="2" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.4" />
    {vertical ? (
      <>
        <line x1="14" y1="18" x2="14" y2="8" stroke="hsl(120 70% 50%)" strokeWidth="1.5" markerEnd="url(#orientUp)" />
        <defs><marker id="orientUp" markerWidth="6" markerHeight="5" refX="3" refY="5" orient="auto"><path d="M0 5 L3 0 L6 5Z" fill="hsl(120 70% 50%)" /></marker></defs>
      </>
    ) : (
      <>
        <line x1="6" y1="14" x2="22" y2="14" stroke="hsl(210 80% 55%)" strokeWidth="1.5" markerEnd="url(#orientRight)" />
        <defs><marker id="orientRight" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto"><path d="M0 0 L6 2.5 L0 5Z" fill="hsl(210 80% 55%)" /></marker></defs>
      </>
    )}
  </svg>
);

// Severity dot
const SeverityDot = ({ level, lang }: { level: string; lang: 'ua' | 'en' }) => {
  const colors: Record<string, string> = { critical: 'hsl(0 70% 50%)', recommended: 'hsl(40 80% 50%)', optional: 'hsl(120 60% 50%)' };
  const labels: Record<string, [string, string]> = { critical: ['Критично', 'Critical'], recommended: ['Рекомендовано', 'Recommended'], optional: ['Опціонально', 'Optional'] };
  return (
    <div className="flex items-center gap-1.5">
      <motion.div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[level] }}
        animate={level === 'critical' ? { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }} />
      <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors[level] }}>
        {lang === 'ua' ? labels[level]?.[0] : labels[level]?.[1]}
      </span>
    </div>
  );
};

export const PrintableComponents = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [openComponent, setOpenComponent] = useState<string | null>(null);
  const [bladeRpm, setBladeRpm] = useState(300);
  const [activeMaterial, setActiveMaterial] = useState(1); // PETG default

  return (
    <div className="space-y-4 eng-scrollbar">

      {/* ═══════ MATERIAL COMPARISON ═══════ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1 flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-primary" /> {L('Порівняння матеріалів для 3D-друку', 'Material Comparison for 3D Printing')}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          {L('Оберіть матеріал для детального аналізу. Пентагонна діаграма показує баланс властивостей.',
             'Select a material for detailed analysis. Pentagon chart shows property balance.')}
        </p>

        {/* Material selector + radar */}
        <div className="grid grid-cols-5 gap-1.5 mb-4">
          {materialComparison.map((mat, i) => (
            <button key={i} onClick={() => setActiveMaterial(i)}
              className="rounded-xl p-2 transition-all duration-200 text-center"
              style={{
                backgroundColor: activeMaterial === i ? `color-mix(in srgb, ${mat.color} 12%, hsl(222 28% 12%))` : 'hsl(222 28% 10%)',
                border: `1.5px solid ${activeMaterial === i ? mat.color : 'hsl(var(--border) / 0.15)'}`,
                boxShadow: activeMaterial === i ? `0 0 16px color-mix(in srgb, ${mat.color} 20%, transparent)` : 'none',
              }}>
              <span className="text-xs font-mono font-bold" style={{ color: activeMaterial === i ? mat.color : 'hsl(var(--muted-foreground))' }}>
                {mat.name}
              </span>
            </button>
          ))}
        </div>

        {/* Radar + properties side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 flex items-center justify-center" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--border) / 0.15)' }}>
            <div className="w-full max-w-[180px] aspect-square">
              <MaterialRadar mat={materialComparison[activeMaterial]} isActive={true} />
            </div>
          </div>
          
          <div className="space-y-1.5">
            {properties.map((prop, i) => {
              const val = (materialComparison[activeMaterial] as any)[prop.key];
              const norm = val / prop.max;
              const barColor = materialComparison[activeMaterial].color;
              return (
                <div key={i} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">{lang === 'ua' ? prop.label_ua : prop.label_en}</span>
                    <span className="font-mono text-foreground">{prop.key === 'tensile' ? `${val} MPa` : prop.key === 'temp' ? `${val}°C` : prop.key === 'cost' ? '€'.repeat(val) : ['—', L('Погана', 'Poor'), L('Помірна', 'Moderate'), L('Добра', 'Good'), L('Відмінна', 'Excellent')][Math.round(val)] || ''}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--border) / 0.15)' }}>
                    <motion.div className="h-full rounded-full"
                      style={{ backgroundColor: barColor }}
                      initial={{ width: 0 }} animate={{ width: `${norm * 100}%` }}
                      transition={{ delay: i * 0.08, duration: 0.5 }} />
                  </div>
                </div>
              );
            })}
            
            <div className="mt-2 p-2 rounded-lg text-center" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--border) / 0.1)' }}>
              <span className="text-[10px] text-muted-foreground">{L('Рекомендація', 'Recommendation')}</span>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {activeMaterial === 0 ? L('Тільки прототипи (UV-деградація)', 'Prototyping only (UV degrades)') :
                 activeMaterial === 1 ? L('Оптимальний баланс ціна/якість', 'Best price/performance balance') :
                 activeMaterial === 2 ? L('Ідеальний для зовнішнього використання', 'Ideal for outdoor use') :
                 activeMaterial === 3 ? L('Структурні елементи (хаб, кріплення)', 'Structural parts (hub, mounts)') :
                 L('Максимальна жорсткість, абразивний', 'Max stiffness, abrasive on nozzle')}
              </p>
            </div>
          </div>
        </div>

        {/* All materials overlay comparison */}
        <div className="mt-4 rounded-xl p-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--border) / 0.15)' }}>
          <p className="text-[10px] text-muted-foreground mb-2 text-center font-semibold uppercase tracking-wider">
            {L('Порівняння всіх матеріалів — міцність на розтяг', 'All Materials — Tensile Strength Comparison')}
          </p>
          <div className="space-y-1">
            {materialComparison.map((mat, i) => {
              const norm = mat.tensile / 80;
              return (
                <div key={i} className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveMaterial(i)}>
                  <span className="text-[10px] font-mono w-14 text-right" style={{ color: activeMaterial === i ? mat.color : 'hsl(var(--muted-foreground))' }}>{mat.name}</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--border) / 0.1)' }}>
                    <motion.div className="h-full rounded-full transition-all"
                      style={{ 
                        backgroundColor: mat.color,
                        opacity: activeMaterial === i ? 0.85 : 0.35,
                        filter: activeMaterial === i ? `drop-shadow(0 0 4px ${mat.color})` : 'none',
                      }}
                      initial={{ width: 0 }} animate={{ width: `${norm * 100}%` }}
                      transition={{ delay: i * 0.06, duration: 0.4 }} />
                  </div>
                  <span className="text-[10px] font-mono w-12" style={{ color: activeMaterial === i ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                    {mat.tensile} MPa
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ═══════ BLADE STRESS VISUALIZATION ═══════ */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> {L('Розподіл навантажень на лопать', 'Blade Load Distribution')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Наведіть курсор вздовж лопаті. Змінюйте оберти для динамічного оновлення сил, моментів та напружень.',
             'Hover along the blade. Adjust RPM to dynamically update forces, moments, and stresses.')}
        </p>
        
        <div className="flex items-center gap-3 mb-3 p-3 rounded-xl" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">{L('ОБ/ХВ', 'RPM')}</span>
          <div className="flex-1"><Slider value={[bladeRpm]} onValueChange={([v]) => setBladeRpm(v)} min={100} max={600} step={25} /></div>
          <span className="text-sm font-mono text-primary font-bold w-14 text-right">{bladeRpm}</span>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'hsl(222 28% 6%)', border: '1px solid hsl(var(--primary) / 0.1)' }}>
          <BladeStressSVG lang={lang} rpm={bladeRpm} />
        </div>

        {/* Legend below SVG in HTML */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {[
            { color: 'hsl(0 80% 55%)', label: L('Аеро навантаження', 'Aero Load'), icon: '↓' },
            { color: 'hsl(210 80% 55%)', label: L('Відцентрова F', 'Centrifugal F'), icon: '↗' },
            { color: 'hsl(25 80% 55%)', label: L('Момент M(x)', 'Moment M(x)'), icon: '⌒' },
            { color: 'hsl(120 60% 50%)', label: L('Безпечна зона', 'Safe Zone'), icon: '✓' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-lg" style={{ backgroundColor: 'hsl(222 28% 10%)' }}>
              <div className="w-3 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] text-muted-foreground">{item.icon} {item.label}</span>
            </div>
          ))}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {[
            { label: L('ОБ/ХВ', 'RPM'), value: `${bladeRpm}`, color: 'hsl(var(--primary))' },
            { label: 'ω', value: `${((bladeRpm * 2 * Math.PI) / 60).toFixed(1)}`, color: 'hsl(var(--primary))' },
            { label: 'F_tip', value: `${(0.1 * ((bladeRpm * 2 * Math.PI / 60) ** 2) * 0.5).toFixed(0)}N`, color: 'hsl(25 80% 55%)' },
            { label: 'σ_root', value: `${(25 * bladeRpm / 300).toFixed(0)} MPa`, color: (25 * bladeRpm / 300) > 30 ? 'hsl(0 70% 55%)' : 'hsl(120 60% 50%)' },
          ].map((m, i) => (
            <div key={i} className="p-2 rounded-lg text-center" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--border) / 0.1)' }}>
              <span className="text-[9px] text-muted-foreground block">{m.label}</span>
              <span className="text-xs font-mono font-bold" style={{ color: m.color }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ COMPONENT CARDS ═══════ */}
      <div className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" /> {L('Деталі для друку — інженерні подробиці', 'Printable Components — Engineering Details')}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
          {L('Натисніть для аналізу напружень, орієнтації друку, допусків та збірки.',
             'Click for stress analysis, print orientation, tolerancing, and assembly.')}
        </p>
      </div>

      <div className="space-y-2">
        {componentsData.map((item, idx) => {
          const isOpen = openComponent === item.id;
          const ItemIcon = item.icon;
          const isVertical = item.id === 'blades' || item.id === 'vawt-rotor';
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
              className="rounded-xl overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: isOpen ? 'hsl(222 28% 13%)' : 'hsl(222 28% 11%)',
                border: `1px solid ${isOpen ? item.color + '40' : 'hsl(var(--border) / 0.15)'}`,
                borderLeftWidth: '3px',
                borderLeftColor: item.color,
                boxShadow: isOpen ? `0 4px 24px ${item.color}12` : 'none',
              }}>
              <button onClick={() => setOpenComponent(isOpen ? null : item.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
                  style={{
                    backgroundColor: isOpen ? item.color + '18' : 'hsl(var(--muted) / 0.1)',
                    boxShadow: isOpen ? `0 0 10px ${item.color}30` : 'none',
                  }}>
                  <ItemIcon className="w-4 h-4" style={{ color: isOpen ? item.color : 'hsl(var(--muted-foreground))' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{lang === 'ua' ? item.component_ua : item.component_en}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{item.material}</span>
                    <span className="text-muted-foreground">·</span>
                    <SeverityDot level={item.severity} lang={lang} />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5 text-primary">{item.cost}</Badge>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-2" style={{ borderTop: `1px solid ${item.color}15` }}>
                      <div className="pt-3" />
                      
                      {/* Stress Analysis */}
                      <div className="p-3 rounded-xl" style={{ 
                        backgroundColor: 'hsl(222 28% 14%)', 
                        border: `1px solid ${item.severity === 'critical' ? 'hsl(0 60% 40% / 0.3)' : 'hsl(var(--border) / 0.15)'}`,
                        borderLeftWidth: '2px',
                        borderLeftColor: item.severity === 'critical' ? 'hsl(0 70% 50%)' : 'hsl(40 80% 50%)',
                      }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Shield className="w-3.5 h-3.5" style={{ color: item.severity === 'critical' ? 'hsl(0 70% 55%)' : 'hsl(40 70% 55%)' }} />
                          <p className="text-xs font-semibold" style={{ color: item.severity === 'critical' ? 'hsl(0 70% 55%)' : 'hsl(40 70% 55%)' }}>
                            {L('Аналіз напружень', 'Stress Analysis')}
                          </p>
                          <SeverityDot level={item.severity} lang={lang} />
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{lang === 'ua' ? item.stressNote_ua : item.stressNote_en}</p>
                      </div>

                      {/* Print Orientation with visual */}
                      <div className="p-3 rounded-xl flex items-start gap-3" style={{ backgroundColor: 'hsl(222 28% 14%)', border: '1px solid hsl(var(--border) / 0.15)' }}>
                        <OrientationArrow vertical={isVertical} />
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-0.5 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-muted-foreground" /> {L('Орієнтація друку', 'Print Orientation')}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{lang === 'ua' ? item.orientation_ua : item.orientation_en}</p>
                        </div>
                      </div>

                      {/* Tolerancing + Assembly grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'hsl(222 28% 14%)', border: '1px solid hsl(var(--border) / 0.12)' }}>
                          <p className="text-[10px] font-semibold text-foreground mb-1 uppercase tracking-wide">{L('Допуски', 'Tolerancing')}</p>
                          <p className="text-xs text-muted-foreground font-mono leading-relaxed">{lang === 'ua' ? item.tolerancing_ua : item.tolerancing_en}</p>
                        </div>
                        <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'hsl(222 28% 14%)', border: '1px solid hsl(var(--border) / 0.12)' }}>
                          <p className="text-[10px] font-semibold text-foreground mb-1 uppercase tracking-wide">{L('Збірка', 'Assembly')}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{lang === 'ua' ? item.assembly_ua : item.assembly_en}</p>
                        </div>
                      </div>

                      {/* Method badge */}
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5 text-primary">{item.method}</Badge>
                        <span className="text-[10px] text-muted-foreground">{item.cost}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
