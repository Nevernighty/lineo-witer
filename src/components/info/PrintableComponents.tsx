import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Wrench, Thermometer, Shield, Layers } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

const componentsData = [
  { id: 'blades', component_ua: 'Лопаті турбіни', component_en: 'Turbine Blades', material: 'PETG, ABS, ASA', method: 'FDM — 0.2mm', cost: '€10–€30', orientation_ua: 'Друкуйте вертикально з підтримками для збереження аеропрофілю', orientation_en: 'Print vertically with supports for aero profile integrity', stressNote_ua: 'Відцентрова сила: F = mω²r. При 300 об/хв з лопаттю 0.5м, сила на кінці ≈ 50Н. PETG (50 МПа) витримує при 60% заповненні.', stressNote_en: 'Centrifugal force: F = mω²r. At 300 RPM with 0.5m blade, tip force ≈ 50N. PETG tensile (50 MPa) handles this with 60% infill.', tolerancing_ua: '±0.2мм на кореневій посадці. Посадка з натягом для хабу.', tolerancing_en: '±0.2mm on root fitment. Interference fit for hub connection.', assembly_ua: 'Балансуйте лопаті в межах 0.5г. Зашліфуйте задні кромки до 0.5мм.', assembly_en: 'Balance blades within 0.5g per set. Sand trailing edges to 0.5mm.' },
  { id: 'hub', component_ua: 'Хаб ротора', component_en: 'Rotor Hub', material: 'PLA+, PETG, Nylon', method: 'FDM — 0.15mm', cost: '€5–€15', orientation_ua: 'Друкуйте плоско з концентричним заповненням', orientation_en: 'Print flat with concentric infill for radial strength', stressNote_ua: 'Комбіноване згинання + кручення від усіх лопатей. Мінімум 80% заповнення. Нейлон кращий для втомного ресурсу.', stressNote_en: 'Combined bending + torsion from all blades. 80% infill minimum. Nylon preferred for fatigue resistance.', tolerancing_ua: '±0.1мм на отворі вала. Розгортка після друку для пресової посадки.', tolerancing_en: '±0.1mm on shaft bore. Ream after printing for press-fit with bearing.', assembly_ua: 'Попередньо свердліть отвори під болти. Нарізьте M4/M5 різьбу.', assembly_en: 'Pre-drill blade bolt holes slightly undersized. Tap with M4/M5 thread.' },
  { id: 'housing', component_ua: 'Корпус гондоли', component_en: 'Nacelle Housing', material: 'ASA, PETG', method: 'FDM — 0.3mm', cost: '€20–€50', orientation_ua: 'Розділіть на половини, зʼєднуйте розчинником або механічно', orientation_en: 'Split into halves, join with solvent welding or fasteners', stressNote_ua: 'Захист від погоди. ASA зберігає 90% міцності після 2000 год UV.', stressNote_en: 'Weather protection. ASA retains 90% strength after 2000h UV.', tolerancing_ua: '±0.5мм. Прокладка або силікон на лінії розʼєму.', tolerancing_en: '±0.5mm acceptable. Gasket or silicone at split line.', assembly_ua: 'Канали для кабелів у дизайні. Вентиляційні щілини.', assembly_en: 'Include cable channels. Add ventilation slots for cooling.' },
  { id: 'vawt-rotor', component_ua: 'Вертикальний ротор', component_en: 'Vertical Rotor (VAWT)', material: 'PETG, ASA', method: 'FDM — 0.2mm', cost: '€15–€40', orientation_ua: 'Половини Савоніуса окремо, зʼєднуйте епоксидом', orientation_en: 'Print Savonius halves separately, bond with epoxy', stressNote_ua: 'Циклічний згин за оберт. Межа втоми PETG ≈ 40% від UTS. Проектуйте для нескінченного ресурсу.', stressNote_en: 'Cyclic bending per revolution. PETG fatigue limit ≈ 40% of tensile. Design for infinite life.', tolerancing_ua: '±0.3мм на профілі. Наповнювач-ґрунт для гладкості.', tolerancing_en: '±0.3mm on profile. Filler primer for smooth surface.', assembly_ua: 'Динамічне балансування на оправці. Вібрація < 0.5мм/с RMS.', assembly_en: 'Dynamic balance on mandrel. Vibration < 0.5mm/s RMS.' },
  { id: 'mounts', component_ua: 'Кріплення та корпуси підшипників', component_en: 'Mounts & Bearing Housings', material: 'Nylon, CF-PETG', method: 'FDM / SLS', cost: '€30–€100', orientation_ua: 'Навантаження вздовж шарів. Z-вісь найслабша.', orientation_en: 'Load path aligned to layers. Z-axis is weakest.', stressNote_ua: 'CF-PETG дає 2× жорсткість. Адгезія шарів 40-60% від міцності в площині.', stressNote_en: 'CF-PETG gives 2× stiffness. Layer adhesion is 40-60% of in-plane strength.', tolerancing_ua: '±0.05мм на посадочних поверхнях підшипників. Металеві вставки.', tolerancing_en: '±0.05mm on bearing seats. Metal inserts for bolt holes.', assembly_ua: 'Запресовуйте підшипники (натяг 0.02мм). Фіксатор різьби.', assembly_en: 'Press-fit bearings (0.02mm interference). Thread-locking compound.' },
];

const materialComparison = [
  { name: 'PLA', tensile: 60, tensileStr: '60 MPa', uv_ua: 'Погана', uv_en: 'Poor', tempMax: '55°C', fatigue_ua: 'Погана', fatigue_en: 'Poor', cost: '€' },
  { name: 'PETG', tensile: 50, tensileStr: '50 MPa', uv_ua: 'Помірна', uv_en: 'Moderate', tempMax: '75°C', fatigue_ua: 'Добра', fatigue_en: 'Good', cost: '€€' },
  { name: 'ASA', tensile: 45, tensileStr: '45 MPa', uv_ua: 'Відмінна', uv_en: 'Excellent', tempMax: '95°C', fatigue_ua: 'Добра', fatigue_en: 'Good', cost: '€€' },
  { name: 'Nylon', tensile: 70, tensileStr: '70 MPa', uv_ua: 'Помірна', uv_en: 'Moderate', tempMax: '110°C', fatigue_ua: 'Відмінна', fatigue_en: 'Excellent', cost: '€€€' },
  { name: 'CF-PETG', tensile: 75, tensileStr: '75 MPa', uv_ua: 'Добра', uv_en: 'Good', tempMax: '85°C', fatigue_ua: 'Дуже добра', fatigue_en: 'Very Good', cost: '€€€' },
];

// Material strength bar chart
const MaterialStrengthChart = ({ lang }: { lang: 'ua' | 'en' }) => {
  const maxTensile = 80;
  const W = 400, H = 150;
  const barH = 20, gap = 8;

  const colors = ['hsl(0 60% 50%)', 'hsl(210 80% 55%)', 'hsl(25 80% 55%)', 'hsl(120 70% 50%)', 'hsl(var(--primary))'];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36 sm:h-40">
      {materialComparison.map((mat, i) => {
        const y = 6 + i * (barH + gap);
        const w = (mat.tensile / maxTensile) * 260;
        return (
          <g key={i}>
            <text x={64} y={y + 14} textAnchor="end" fontSize="11" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{mat.name}</text>
            <motion.rect x={70} y={y} width={w} height={barH} rx="3" fill={colors[i]} opacity="0.75"
              initial={{ width: 0 }} animate={{ width: w }} transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{ filter: `drop-shadow(0 0 3px ${colors[i]}40)` }} />
            <text x={74 + w} y={y + 14} fontSize="11" fontWeight="600" fill="hsl(var(--foreground))" fontFamily="monospace">{mat.tensileStr}</text>
          </g>
        );
      })}
    </svg>
  );
};

// Blade stress diagram — larger with pulsing arrows and bending moment
const BladeStressSVG = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  return (
    <svg viewBox="0 0 340 140" className="w-full h-28 sm:h-32">
      {/* Blade shape */}
      <path d="M30 70 Q90 40 310 65 Q90 100 30 70Z" fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      
      {/* Bending moment distribution curve */}
      <path d="M30 70 Q80 30 160 50 Q240 60 310 68" fill="none" stroke="hsl(25 80% 55%)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
      
      {/* Aero load arrows */}
      {[120, 170, 220, 260].map((x, i) => (
        <g key={`aero-${i}`} style={{ animation: `pulse 2s ease-in-out ${i * 0.3}s infinite` }}>
          <line x1={x} y1={20} x2={x} y2={48} stroke="hsl(0 80% 55%)" strokeWidth="1.5" markerEnd="url(#arrowR)" />
        </g>
      ))}
      
      {/* Centrifugal arrows */}
      {[80, 140].map((x, i) => (
        <g key={`cent-${i}`}>
          <line x1={x} y1={90} x2={x} y2={115} stroke="hsl(210 80% 55%)" strokeWidth="1.5" markerEnd="url(#arrowB)" />
        </g>
      ))}
      
      {/* Labels */}
      <text x="180" y="14" textAnchor="middle" fontSize="11" fill="hsl(0 80% 55%)" fontWeight="600">{L('Аеродинамічне навантаження (вигин)', 'Aerodynamic load (bending)')}</text>
      <text x="110" y="132" textAnchor="middle" fontSize="11" fill="hsl(210 80% 55%)" fontWeight="600">{L('Відцентрова сила (розтяг)', 'Centrifugal force (tension)')}</text>
      <text x="24" y="74" textAnchor="end" fontSize="10" fill="hsl(var(--muted-foreground))">{L('Корінь', 'Root')}</text>
      <text x="316" y="68" textAnchor="start" fontSize="10" fill="hsl(var(--muted-foreground))">{L('Кінець', 'Tip')}</text>
      <text x="240" y="44" fontSize="9" fill="hsl(25 80% 55%)" opacity="0.7">{L('Момент згину', 'Bending moment')}</text>
      
      <defs>
        <marker id="arrowR" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7Z" fill="hsl(0 80% 55%)" /></marker>
        <marker id="arrowB" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7Z" fill="hsl(210 80% 55%)" /></marker>
      </defs>
    </svg>
  );
};

export const PrintableComponents = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="space-y-4">
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1 flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-primary" /> {L('Порівняння властивостей матеріалів', 'Material Properties Comparison')}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">{L('Механічні та екологічні властивості для 3D-друку вітротурбін.', 'Mechanical and environmental properties for wind turbine 3D printing.')}</p>
        
        {/* Material strength bar chart */}
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

      {/* Blade stress diagram */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> {L('Розподіл навантажень на лопать', 'Blade Load Distribution')}
        </h3>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--border) / 0.2)' }}>
          <BladeStressSVG lang={lang} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {L('Червоні стрілки: аеродинамічне навантаження (вигин). Сині: відцентрова сила. Пунктир: крива моменту згину. Корінь — зона макс. напруження.',
             'Red arrows: aerodynamic load (bending). Blue: centrifugal force. Dashed: bending moment curve. Root is maximum stress zone.')}
        </p>
      </div>

      <div className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" /> {L('Деталі для друку — інженерні подробиці', 'Printable Components — Engineering Details')}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">{L('Аналіз напружень, орієнтація друку, допуски та рекомендації зі збірки.', 'Stress analysis, print orientation, tolerancing, and assembly guidance.')}</p>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {componentsData.map((item, idx) => (
          <AccordionItem key={item.id} value={item.id} className="border-0">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
              className="stalker-card overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 text-left w-full">
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm font-semibold">{lang === 'ua' ? item.component_ua : item.component_en}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{item.material}</span><span>·</span><span>{item.method}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-primary shrink-0">{item.cost}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--primary) / 0.15)' }}>
                    <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {L('Аналіз напружень', 'Stress Analysis')}
                    </p>
                    <p className="text-xs text-muted-foreground">{lang === 'ua' ? item.stressNote_ua : item.stressNote_en}</p>
                  </div>
                  <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                    <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> {L('Орієнтація друку', 'Print Orientation')}
                    </p>
                    <p className="text-xs text-muted-foreground">{lang === 'ua' ? item.orientation_ua : item.orientation_en}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                      <p className="text-xs font-semibold text-foreground mb-0.5">{L('Допуски', 'Tolerancing')}</p>
                      <p className="text-xs text-muted-foreground">{lang === 'ua' ? item.tolerancing_ua : item.tolerancing_en}</p>
                    </div>
                    <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                      <p className="text-xs font-semibold text-foreground mb-0.5">{L('Збірка', 'Assembly')}</p>
                      <p className="text-xs text-muted-foreground">{lang === 'ua' ? item.assembly_ua : item.assembly_en}</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </motion.div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
