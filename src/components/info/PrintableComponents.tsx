import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Wrench, Thermometer, Shield, Layers, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

const componentsData = [
  { id: 'blades', component_ua: 'Лопаті турбіни', component_en: 'Turbine Blades', material: 'PETG, ABS, ASA', method: 'FDM — 0.2mm', cost: '€10–€30', orientation_ua: 'Друкуйте вертикально з підтримками для збереження аеропрофілю', orientation_en: 'Print vertically with supports for aero profile integrity', stressNote_ua: 'Відцентрова сила: F = mω²r. При 300 об/хв з лопаттю 0.5м, сила на кінці ≈ 50Н. PETG (50 МПа) витримує при 60% заповненні.', stressNote_en: 'Centrifugal force: F = mω²r. At 300 RPM with 0.5m blade, tip force ≈ 50N. PETG tensile (50 MPa) handles this with 60% infill.', tolerancing_ua: '±0.2мм на кореневій посадці. Посадка з натягом для хабу.', tolerancing_en: '±0.2mm on root fitment. Interference fit for hub connection.', assembly_ua: 'Балансуйте лопаті в межах 0.5г. Зашліфуйте задні кромки до 0.5мм.', assembly_en: 'Balance blades within 0.5g per set. Sand trailing edges to 0.5mm.', color: 'hsl(120 100% 54%)' },
  { id: 'hub', component_ua: 'Хаб ротора', component_en: 'Rotor Hub', material: 'PLA+, PETG, Nylon', method: 'FDM — 0.15mm', cost: '€5–€15', orientation_ua: 'Друкуйте плоско з концентричним заповненням', orientation_en: 'Print flat with concentric infill for radial strength', stressNote_ua: 'Комбіноване згинання + кручення від усіх лопатей. Мінімум 80% заповнення. Нейлон кращий для втомного ресурсу.', stressNote_en: 'Combined bending + torsion from all blades. 80% infill minimum. Nylon preferred for fatigue resistance.', tolerancing_ua: '±0.1мм на отворі вала. Розгортка після друку для пресової посадки.', tolerancing_en: '±0.1mm on shaft bore. Ream after printing for press-fit with bearing.', assembly_ua: 'Попередньо свердліть отвори під болти. Нарізьте M4/M5 різьбу.', assembly_en: 'Pre-drill blade bolt holes slightly undersized. Tap with M4/M5 thread.', color: 'hsl(210 90% 60%)' },
  { id: 'housing', component_ua: 'Корпус гондоли', component_en: 'Nacelle Housing', material: 'ASA, PETG', method: 'FDM — 0.3mm', cost: '€20–€50', orientation_ua: 'Розділіть на половини, зʼєднуйте розчинником або механічно', orientation_en: 'Split into halves, join with solvent welding or fasteners', stressNote_ua: 'Захист від погоди. ASA зберігає 90% міцності після 2000 год UV.', stressNote_en: 'Weather protection. ASA retains 90% strength after 2000h UV.', tolerancing_ua: '±0.5мм. Прокладка або силікон на лінії розʼєму.', tolerancing_en: '±0.5mm acceptable. Gasket or silicone at split line.', assembly_ua: 'Канали для кабелів у дизайні. Вентиляційні щілини.', assembly_en: 'Include cable channels. Add ventilation slots for cooling.', color: 'hsl(25 90% 55%)' },
  { id: 'vawt-rotor', component_ua: 'Вертикальний ротор', component_en: 'Vertical Rotor (VAWT)', material: 'PETG, ASA', method: 'FDM — 0.2mm', cost: '€15–€40', orientation_ua: 'Половини Савоніуса окремо, зʼєднуйте епоксидом', orientation_en: 'Print Savonius halves separately, bond with epoxy', stressNote_ua: 'Циклічний згин за оберт. Межа втоми PETG ≈ 40% від UTS. Проектуйте для нескінченного ресурсу.', stressNote_en: 'Cyclic bending per revolution. PETG fatigue limit ≈ 40% of tensile. Design for infinite life.', tolerancing_ua: '±0.3мм на профілі. Наповнювач-ґрунт для гладкості.', tolerancing_en: '±0.3mm on profile. Filler primer for smooth surface.', assembly_ua: 'Динамічне балансування на оправці. Вібрація < 0.5мм/с RMS.', assembly_en: 'Dynamic balance on mandrel. Vibration < 0.5mm/s RMS.', color: 'hsl(270 70% 60%)' },
  { id: 'mounts', component_ua: 'Кріплення та корпуси підшипників', component_en: 'Mounts & Bearing Housings', material: 'Nylon, CF-PETG', method: 'FDM / SLS', cost: '€30–€100', orientation_ua: 'Навантаження вздовж шарів. Z-вісь найслабша.', orientation_en: 'Load path aligned to layers. Z-axis is weakest.', stressNote_ua: 'CF-PETG дає 2× жорсткість. Адгезія шарів 40-60% від міцності в площині.', stressNote_en: 'CF-PETG gives 2× stiffness. Layer adhesion is 40-60% of in-plane strength.', tolerancing_ua: '±0.05мм на посадочних поверхнях підшипників. Металеві вставки.', tolerancing_en: '±0.05mm on bearing seats. Metal inserts for bolt holes.', assembly_ua: 'Запресовуйте підшипники (натяг 0.02мм). Фіксатор різьби.', assembly_en: 'Press-fit bearings (0.02mm interference). Thread-locking compound.', color: 'hsl(0 60% 55%)' },
];

const materialComparison = [
  { name: 'PLA', tensile: 60, tensileStr: '60 MPa', uv_ua: 'Погана', uv_en: 'Poor', tempMax: '55°C', fatigue_ua: 'Погана', fatigue_en: 'Poor', cost: '€' },
  { name: 'PETG', tensile: 50, tensileStr: '50 MPa', uv_ua: 'Помірна', uv_en: 'Moderate', tempMax: '75°C', fatigue_ua: 'Добра', fatigue_en: 'Good', cost: '€€' },
  { name: 'ASA', tensile: 45, tensileStr: '45 MPa', uv_ua: 'Відмінна', uv_en: 'Excellent', tempMax: '95°C', fatigue_ua: 'Добра', fatigue_en: 'Good', cost: '€€' },
  { name: 'Nylon', tensile: 70, tensileStr: '70 MPa', uv_ua: 'Помірна', uv_en: 'Moderate', tempMax: '110°C', fatigue_ua: 'Відмінна', fatigue_en: 'Excellent', cost: '€€€' },
  { name: 'CF-PETG', tensile: 75, tensileStr: '75 MPa', uv_ua: 'Добра', uv_en: 'Good', tempMax: '85°C', fatigue_ua: 'Дуже добра', fatigue_en: 'Very Good', cost: '€€€' },
];

// Material strength bar chart with hover
const MaterialStrengthChart = ({ lang }: { lang: 'ua' | 'en' }) => {
  const [hoveredMat, setHoveredMat] = useState<number | null>(null);
  const maxTensile = 80;
  const W = 400, H = 160;
  const barH = 22, gap = 8;
  const colors = ['hsl(0 60% 50%)', 'hsl(210 80% 55%)', 'hsl(25 80% 55%)', 'hsl(120 70% 50%)', 'hsl(var(--primary))'];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36 sm:h-44"
      onMouseLeave={() => setHoveredMat(null)}>
      {materialComparison.map((mat, i) => {
        const y = 6 + i * (barH + gap);
        const w = (mat.tensile / maxTensile) * 240;
        const isHovered = hoveredMat === i;
        return (
          <g key={i} onMouseEnter={() => setHoveredMat(i)} style={{ cursor: 'pointer' }}>
            <text x={64} y={y + 15} textAnchor="end" fontSize="11" fill={isHovered ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'} fontFamily="monospace" fontWeight={isHovered ? '700' : '400'}>{mat.name}</text>
            <motion.rect x={70} y={y} width={w} height={barH} rx="4" fill={colors[i]} opacity={isHovered ? 0.95 : 0.7}
              initial={{ width: 0 }} animate={{ width: w, height: isHovered ? barH + 4 : barH, y: isHovered ? y - 2 : y }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              style={{ filter: isHovered ? `drop-shadow(0 0 8px ${colors[i]}60)` : `drop-shadow(0 0 3px ${colors[i]}30)` }} />
            <text x={74 + w} y={y + 15} fontSize="11" fontWeight="600" fill="hsl(var(--foreground))" fontFamily="monospace">{mat.tensileStr}</text>
            {isHovered && (
              <text x={74 + w + 55} y={y + 15} fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="monospace">
                UV: {lang === 'ua' ? mat.uv_ua : mat.uv_en} | {mat.tempMax}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// Interactive Blade Stress SVG — with RPM slider
const BladeStressSVG = ({ lang, rpm }: { lang: 'ua' | 'en'; rpm: number }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [hoverX, setHoverX] = useState<number | null>(null);
  
  const bladeLength = 0.5;
  const omega = (rpm * 2 * Math.PI) / 60;
  const bladeMass = 0.1;

  const W = 420, H = 360;
  const bladeStartX = 40, bladeEndX = 390;
  const bladeSpan = bladeEndX - bladeStartX;

  const getStressAtPosition = (normalizedR: number) => {
    const r = normalizedR * bladeLength;
    const F_centrifugal = bladeMass * omega * omega * r;
    const bendingMoment = F_centrifugal * (bladeLength - r) * 0.5;
    return { F_centrifugal, bendingMoment, r };
  };

  const getHeatColor = (normalizedR: number) => {
    const stress = 1 - normalizedR;
    if (stress > 0.7) return 'hsl(0 80% 50%)';
    if (stress > 0.4) return 'hsl(40 80% 50%)';
    return 'hsl(120 60% 45%)';
  };

  const hoverNormalized = hoverX !== null ? Math.max(0, Math.min(1, (hoverX - bladeStartX) / bladeSpan)) : null;
  const hoverData = hoverNormalized !== null ? getStressAtPosition(hoverNormalized) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-64 sm:h-80"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * W;
        if (x >= bladeStartX && x <= bladeEndX) setHoverX(x);
        else setHoverX(null);
      }}
      onMouseLeave={() => setHoverX(null)}>
      
      <text x={W / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="600" fill="hsl(var(--foreground))">
        {L('Розподіл навантажень — інтерактивна візуалізація', 'Load Distribution — Interactive Visualization')}
      </text>
      <text x={W / 2} y="30" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
        {rpm} {L('об/хв', 'RPM')} | ω = {omega.toFixed(1)} rad/s
      </text>

      <defs>
        <linearGradient id="bladeHeat" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(0 80% 50%)" stopOpacity="0.3" />
          <stop offset="30%" stopColor="hsl(30 80% 50%)" stopOpacity="0.2" />
          <stop offset="60%" stopColor="hsl(60 70% 50%)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(120 60% 45%)" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* Blade body */}
      <path d={`M${bladeStartX} 95 Q${bladeStartX + bladeSpan * 0.3} 65 ${bladeEndX} 88 Q${bladeStartX + bladeSpan * 0.3} 125 ${bladeStartX} 95Z`}
        fill="url(#bladeHeat)" stroke="hsl(var(--primary))" strokeWidth="1.5" />

      {/* Stress heatmap segments */}
      {Array.from({ length: 20 }, (_, i) => {
        const norm = i / 20;
        const x = bladeStartX + norm * bladeSpan;
        const w = bladeSpan / 20;
        return <rect key={i} x={x} y={70} width={w} height={50} fill={getHeatColor(norm)} opacity="0.12" rx="1" />;
      })}

      {/* Aero load arrows */}
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((pos, i) => {
        const x = bladeStartX + pos * bladeSpan;
        const arrowLen = 20 + (1 - pos) * 15;
        return (
          <g key={`aero-${i}`} style={{ animation: `pulse 2s ease-in-out ${i * 0.2}s infinite` }}>
            <line x1={x} y1={40} x2={x} y2={40 + arrowLen} stroke="hsl(0 80% 55%)" strokeWidth="1.5" markerEnd="url(#arrowR)" />
          </g>
        );
      })}

      {/* Centrifugal arrows */}
      {[0.15, 0.35, 0.55].map((pos, i) => (
        <g key={`cent-${i}`}>
          <line x1={bladeStartX + pos * bladeSpan} y1={125} x2={bladeStartX + pos * bladeSpan} y2={145} stroke="hsl(210 80% 55%)" strokeWidth="1.5" markerEnd="url(#arrowB)" />
        </g>
      ))}

      {/* Bending moment curve */}
      {(() => {
        const pts: string[] = [];
        for (let i = 0; i <= 40; i++) {
          const norm = i / 40;
          const x = bladeStartX + norm * bladeSpan;
          const moment = (1 - norm) ** 2;
          const y = 190 - moment * 50;
          pts.push(`${x},${y}`);
        }
        return (
          <>
            <polygon points={`${bladeStartX},190 ${pts.join(' ')} ${bladeEndX},190`} fill="hsl(25 80% 55%)" opacity="0.08" />
            <polyline points={pts.join(' ')} fill="none" stroke="hsl(25 80% 55%)" strokeWidth="2" strokeDasharray="6 3" opacity="0.7" />
          </>
        );
      })()}

      {/* Shear force diagram */}
      {(() => {
        const pts: string[] = [];
        for (let i = 0; i <= 40; i++) {
          const norm = i / 40;
          const x = bladeStartX + norm * bladeSpan;
          const shear = (1 - norm);
          const y = 245 - shear * 35;
          pts.push(`${x},${y}`);
        }
        return (
          <>
            <polygon points={`${bladeStartX},245 ${pts.join(' ')} ${bladeEndX},245`} fill="hsl(210 80% 55%)" opacity="0.06" />
            <polyline points={pts.join(' ')} fill="none" stroke="hsl(210 80% 55%)" strokeWidth="1.5" opacity="0.6" />
          </>
        );
      })()}

      {/* Labels */}
      <text x={bladeStartX - 4} y="98" textAnchor="end" fontSize="10" fill="hsl(var(--muted-foreground))" fontWeight="600">{L('Корінь', 'Root')}</text>
      <text x={bladeEndX + 4} y="92" fontSize="10" fill="hsl(var(--muted-foreground))" fontWeight="600">{L('Кінець', 'Tip')}</text>
      <text x={bladeStartX - 4} y="182" textAnchor="end" fontSize="9" fill="hsl(25 80% 55%)">M(x)</text>
      <text x={bladeStartX - 4} y="238" textAnchor="end" fontSize="9" fill="hsl(210 80% 55%)">V(x)</text>
      <text x={W / 2} y="155" textAnchor="middle" fontSize="10" fill="hsl(0 80% 55%)">{L('Аеро навантаження ↓', 'Aero load ↓')}</text>

      {/* Legend — moved lower */}
      <g transform="translate(50, 270)">
        <rect width="12" height="3" rx="1" fill="hsl(25 80% 55%)" opacity="0.7" />
        <text x="16" y="4" fontSize="9" fill="hsl(var(--muted-foreground))">{L('Момент згину', 'Bending Moment')} M(x)</text>
        <rect y="12" width="12" height="3" rx="1" fill="hsl(210 80% 55%)" opacity="0.6" />
        <text x="16" y="16" fontSize="9" fill="hsl(var(--muted-foreground))">{L('Поперечна сила', 'Shear Force')} V(x)</text>
        <rect x="180" width="12" height="3" rx="1" fill="hsl(0 80% 50%)" opacity="0.5" />
        <text x="196" y="4" fontSize="9" fill="hsl(var(--muted-foreground))">{L('Зона макс. σ', 'Max σ zone')}</text>
        <rect x="180" y="12" width="12" height="3" rx="1" fill="hsl(120 60% 45%)" opacity="0.3" />
        <text x="196" y="16" fontSize="9" fill="hsl(var(--muted-foreground))">{L('Зона мін. σ', 'Min σ zone')}</text>
      </g>

      {/* Hover tooltip */}
      {hoverX !== null && hoverNormalized !== null && hoverData !== null && (
        <>
          <line x1={hoverX} y1={40} x2={hoverX} y2={255} stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.4" strokeDasharray="3 3" />
          <circle cx={hoverX} cy={95} r="4" fill="hsl(var(--primary))" style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))' }} />
          
          <rect x={Math.min(W - 165, Math.max(5, hoverX - 80))} y={300} width="160" height="48" rx="6" 
            fill="hsl(222 28% 10%)" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.95" />
          <text x={Math.min(W - 85, Math.max(85, hoverX))} y={314} textAnchor="middle" fontSize="9" fontFamily="monospace" fill="hsl(var(--primary))">
            r = {hoverData.r.toFixed(2)}m ({(hoverNormalized * 100).toFixed(0)}%)
          </text>
          <text x={Math.min(W - 85, Math.max(85, hoverX))} y={328} textAnchor="middle" fontSize="9" fontFamily="monospace" fill="hsl(var(--foreground))">
            F = {hoverData.F_centrifugal.toFixed(1)}N | M = {hoverData.bendingMoment.toFixed(2)}N·m
          </text>
          <text x={Math.min(W - 85, Math.max(85, hoverX))} y={342} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="hsl(var(--muted-foreground))">
            σ ≈ {((1 - hoverNormalized) * 25 * (rpm / 300)).toFixed(1)} MPa ({L('при', 'at')} 60% infill)
          </text>
        </>
      )}

      <defs>
        <marker id="arrowR" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7Z" fill="hsl(0 80% 55%)" /></marker>
        <marker id="arrowB" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7Z" fill="hsl(210 80% 55%)" /></marker>
      </defs>
    </svg>
  );
};

export const PrintableComponents = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const [openComponent, setOpenComponent] = useState<string | null>(null);
  const [bladeRpm, setBladeRpm] = useState(300);

  return (
    <div className="space-y-4 eng-scrollbar">
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1 flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-primary" /> {L('Порівняння властивостей матеріалів', 'Material Properties Comparison')}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">{L('Наведіть курсор для детальних властивостей. Механічні та екологічні показники для 3D-друку вітротурбін.', 'Hover for detailed properties. Mechanical and environmental ratings for wind turbine 3D printing.')}</p>
        
        <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <p className="text-xs font-semibold text-muted-foreground mb-2">{L('Межа міцності на розтяг (МПа)', 'Tensile Strength (MPa)')}</p>
          <MaterialStrengthChart lang={lang} />
        </div>

        <div className="space-y-2">
          {materialComparison.map((mat, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <Badge variant="outline" className="text-xs border-primary/30 bg-primary/5 text-primary font-mono">{mat.name}</Badge>
                <span className="text-xs text-muted-foreground">{mat.cost}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-xs">
                {[
                  { label: L('Розтяг', 'Tensile'), value: mat.tensileStr },
                  { label: 'UV', value: lang === 'ua' ? mat.uv_ua : mat.uv_en },
                  { label: L('Макс. темп.', 'Max Temp'), value: mat.tempMax },
                  { label: L('Втома', 'Fatigue'), value: lang === 'ua' ? mat.fatigue_ua : mat.fatigue_en },
                ].map((prop, j) => (
                  <div key={j}>
                    <span className="text-muted-foreground block text-xs">{prop.label}</span>
                    <span className="text-foreground font-mono text-xs">{prop.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Interactive Blade Stress Diagram with RPM slider */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> {L('Розподіл навантажень на лопать', 'Blade Load Distribution')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Наведіть курсор вздовж лопаті для перегляду відцентрової сили F = mω²r. Змінюйте оберти для динамічного оновлення навантажень.', 
             'Hover along the blade to view centrifugal force F = mω²r. Adjust RPM to dynamically update loads.')}
        </p>
        
        {/* RPM Slider */}
        <div className="flex items-center gap-3 mb-3 p-3 rounded-lg" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{L('ОБ/ХВ', 'RPM')}:</span>
          <div className="flex-1">
            <Slider value={[bladeRpm]} onValueChange={([v]) => setBladeRpm(v)} min={100} max={600} step={25} />
          </div>
          <span className="text-sm font-mono text-primary font-semibold w-16 text-right">{bladeRpm}</span>
        </div>

        <div className="rounded-lg p-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <BladeStressSVG lang={lang} rpm={bladeRpm} />
        </div>

        {/* Stats below SVG */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'hsl(222 28% 12%)', border: '1px solid hsl(var(--border) / 0.2)' }}>
            <span className="text-muted-foreground">{L('ОБ/ХВ', 'RPM')}</span>
            <p className="font-mono text-primary font-semibold">{bladeRpm}</p>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'hsl(222 28% 12%)', border: '1px solid hsl(var(--border) / 0.2)' }}>
            <span className="text-muted-foreground">{L('Довжина', 'Length')}</span>
            <p className="font-mono text-primary font-semibold">0.5m</p>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'hsl(222 28% 12%)', border: '1px solid hsl(var(--border) / 0.2)' }}>
            <span className="text-muted-foreground">F<sub>tip</sub></span>
            <p className="font-mono text-primary font-semibold">{(0.1 * ((bladeRpm * 2 * Math.PI / 60) ** 2) * 0.5).toFixed(0)}N</p>
          </div>
        </div>
      </div>

      <div className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" /> {L('Деталі для друку — інженерні подробиці', 'Printable Components — Engineering Details')}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">{L('Аналіз напружень, орієнтація друку, допуски та рекомендації зі збірки.', 'Stress analysis, print orientation, tolerancing, and assembly guidance.')}</p>
      </div>

      {/* Component cards */}
      <div className="space-y-2">
        {componentsData.map((item, idx) => {
          const isOpen = openComponent === item.id;
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
              className="rounded-lg overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: 'hsl(222 28% 12%)',
                border: `1px solid ${isOpen ? (item.color || 'hsl(var(--primary))') + '40' : 'hsl(var(--border) / 0.2)'}`,
                borderLeftWidth: '3px',
                borderLeftColor: item.color || 'hsl(var(--primary))',
                boxShadow: isOpen ? `0 0 20px ${item.color || 'hsl(var(--primary))'}15` : 'none',
              }}>
              <button onClick={() => setOpenComponent(isOpen ? null : item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{lang === 'ua' ? item.component_ua : item.component_en}</span>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span>{item.material}</span><span>·</span><span>{item.method}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-primary">{item.cost}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-2">
                      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--primary) / 0.15)' }}>
                        <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> {L('Аналіз напружень', 'Stress Analysis')}
                        </p>
                        <p className="text-xs text-muted-foreground">{lang === 'ua' ? item.stressNote_ua : item.stressNote_en}</p>
                      </div>
                      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                        <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                          <Layers className="w-3 h-3" /> {L('Орієнтація друку', 'Print Orientation')}
                        </p>
                        <p className="text-xs text-muted-foreground">{lang === 'ua' ? item.orientation_ua : item.orientation_en}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                          <p className="text-xs font-semibold text-foreground mb-0.5">{L('Допуски', 'Tolerancing')}</p>
                          <p className="text-xs text-muted-foreground">{lang === 'ua' ? item.tolerancing_ua : item.tolerancing_en}</p>
                        </div>
                        <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 15%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                          <p className="text-xs font-semibold text-foreground mb-0.5">{L('Збірка', 'Assembly')}</p>
                          <p className="text-xs text-muted-foreground">{lang === 'ua' ? item.assembly_ua : item.assembly_en}</p>
                        </div>
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
