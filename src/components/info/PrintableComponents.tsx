import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Wrench, Thermometer, Shield, Layers } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

const componentsData = [
  { id: 'blades', component_ua: 'Лопаті турбіни', component_en: 'Turbine Blades', material: 'PETG, ABS, ASA', method: 'FDM — 0.2mm', cost: '€10–€30', orientation_ua: 'Друкуйте вертикально з підтримками для збереження аеропрофілю', orientation_en: 'Print vertically with supports for aero profile integrity', stressNote_ua: 'Відцентрова сила: F = mω²r. При 300 об/хв з лопаттю 0.5м, сила на кінці ≈ 50Н. PETG (50 МПа) витримує при 60% заповненні.', stressNote_en: 'Centrifugal force: F = mω²r. At 300 RPM with 0.5m blade, tip force ≈ 50N. PETG tensile (50 MPa) handles this with 60% infill.', tolerancing_ua: '±0.2мм на кореневій посадці. Використовуйте посадку з натягом для зʼєднання з хабом.', tolerancing_en: '±0.2mm on root fitment. Use interference fit for hub connection.', assembly_ua: 'Балансуйте лопаті в межах 0.5г на комплект. Зашліфуйте задні кромки до 0.5мм для покращення аеродинаміки.', assembly_en: 'Balance blades within 0.5g per set. Sand trailing edges to 0.5mm for improved aerodynamic performance.' },
  { id: 'hub', component_ua: 'Хаб ротора', component_en: 'Rotor Hub', material: 'PLA+, PETG, Nylon', method: 'FDM — 0.15mm', cost: '€5–€15', orientation_ua: 'Друкуйте плоско з концентричним заповненням для радіального розподілу міцності', orientation_en: 'Print flat with concentric infill for radial strength distribution', stressNote_ua: 'Хаб несе комбіноване згинання + кручення від усіх лопатей. Мінімум 80% заповнення. Нейлон кращий для втомного ресурсу.', stressNote_en: 'Hub bears combined bending + torsion from all blades. Use 80% infill minimum. Nylon preferred for fatigue resistance.', tolerancing_ua: '±0.1мм на отворі вала. Розгортка після друку для пресової посадки з підшипником.', tolerancing_en: '±0.1mm on shaft bore. Ream after printing for press-fit with bearing.', assembly_ua: 'Попередньо свердліть отвори під болти лопатей трохи менше. Нарізьте M4/M5 різьбу для надійного кріплення.', assembly_en: 'Pre-drill blade bolt holes slightly undersized. Tap with M4/M5 thread for secure fastening.' },
  { id: 'housing', component_ua: 'Корпус гондоли', component_en: 'Nacelle Housing', material: 'ASA, PETG', method: 'FDM — 0.3mm', cost: '€20–€50', orientation_ua: 'Розділіть на половини, друкуйте плоскою стороною вниз. Зʼєднуйте розчинником або механічними кріпленнями.', orientation_en: 'Split into halves, print flat face down. Join with solvent welding or mechanical fasteners.', stressNote_ua: 'Переважно захист від погоди. ASA забезпечує UV-стійкість (зберігає 90% міцності після 2000 год UV).', stressNote_en: 'Primarily weather protection. ASA provides UV resistance (retains 90% strength after 2000h UV exposure).', tolerancing_ua: '±0.5мм допустимо. Використовуйте прокладку або силіконовий герметик на лінії розʼєму.', tolerancing_en: '±0.5mm acceptable. Use gasket or silicone seal at split line.', assembly_ua: 'Включіть канали для кабелів у дизайн. Додайте вентиляційні щілини для охолодження генератора.', assembly_en: 'Include cable routing channels in design. Add ventilation slots for generator cooling.' },
  { id: 'vawt-rotor', component_ua: 'Вертикальний ротор (VAWT)', component_en: 'Vertical Rotor (VAWT)', material: 'PETG, ASA', method: 'FDM — 0.2mm', cost: '€15–€40', orientation_ua: 'Друкуйте половини Савоніуса окремо, зʼєднуйте епоксидом. Лопаті Дарʼє друкуйте хордою паралельно столу.', orientation_en: 'Print Savonius halves separately, bond with epoxy. Darrieus blades print with chord parallel to bed.', stressNote_ua: 'Циклічний згин за оберт. Межа втоми PETG ≈ 40% від межі міцності. Проектуйте для нескінченного ресурсу нижче цього порогу.', stressNote_en: 'Cyclic bending per revolution. PETG fatigue limit ≈ 40% of tensile strength. Design for infinite life below this threshold.', tolerancing_ua: '±0.3мм на профілі. Постобробка наповнювачем-ґрунтом для гладкої поверхні аеропрофілю.', tolerancing_en: '±0.3mm on profile. Post-process with filler primer for smooth airfoil surface.', assembly_ua: 'Динамічне балансування на оправці. Ціль вібрації < 0.5мм/с RMS при номінальній швидкості.', assembly_en: 'Dynamic balance on mandrel. Target vibration < 0.5mm/s RMS at rated speed.' },
  { id: 'mounts', component_ua: 'Кріплення та корпуси підшипників', component_en: 'Mounts & Bearing Housings', material: 'Nylon, CF-PETG', method: 'FDM / SLS', cost: '€30–€100', orientation_ua: 'Друкуйте з напрямком навантаження вздовж шарів. Вісь Z найслабша.', orientation_en: 'Print with load path aligned to layer direction. Z-axis is weakest.', stressNote_ua: 'Використовуйте PETG з вуглеволокном для 2× жорсткості. Критично: адгезія шарів 40-60% від міцності в площині.', stressNote_en: 'Use carbon-fiber filled PETG for 2× stiffness. Critical: layer adhesion is 40-60% of in-plane strength.', tolerancing_ua: '±0.05мм на посадочних поверхнях підшипників (обробіть якщо потрібно). Металеві вставки для отворів під болти.', tolerancing_en: '±0.05mm on bearing seats (post-machine if needed). Use metal inserts for bolt holes.', assembly_ua: 'Запресовуйте підшипники з невеликим натягом (0.02мм). Наносіть фіксатор різьби на всі кріплення.', assembly_en: 'Press-fit bearings with slight interference (0.02mm). Apply thread-locking compound on all fasteners.' },
];

const materialComparison = [
  { name: 'PLA', tensile: '60 MPa', uv_ua: 'Погана', uv_en: 'Poor', tempMax: '55°C', fatigue_ua: 'Погана', fatigue_en: 'Poor', cost: '€' },
  { name: 'PETG', tensile: '50 MPa', uv_ua: 'Помірна', uv_en: 'Moderate', tempMax: '75°C', fatigue_ua: 'Добра', fatigue_en: 'Good', cost: '€€' },
  { name: 'ASA', tensile: '45 MPa', uv_ua: 'Відмінна', uv_en: 'Excellent', tempMax: '95°C', fatigue_ua: 'Добра', fatigue_en: 'Good', cost: '€€' },
  { name: 'Nylon', tensile: '70 MPa', uv_ua: 'Помірна', uv_en: 'Moderate', tempMax: '110°C', fatigue_ua: 'Відмінна', fatigue_en: 'Excellent', cost: '€€€' },
  { name: 'CF-PETG', tensile: '75 MPa', uv_ua: 'Добра', uv_en: 'Good', tempMax: '85°C', fatigue_ua: 'Дуже добра', fatigue_en: 'Very Good', cost: '€€€' },
];

// Blade stress diagram SVG
const BladeStressSVG = ({ lang }: { lang: 'ua' | 'en' }) => (
  <svg viewBox="0 0 200 80" className="w-full h-16">
    {/* Blade shape */}
    <path d="M20 40 Q60 25 180 38 Q60 55 20 40Z" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary))" strokeWidth="1" />
    {/* Force arrows */}
    <line x1="100" y1="15" x2="100" y2="30" stroke="hsl(0 80% 55%)" strokeWidth="1.5" markerEnd="url(#arrowRed)" />
    <line x1="140" y1="15" x2="140" y2="30" stroke="hsl(0 80% 55%)" strokeWidth="1.5" markerEnd="url(#arrowRed)" />
    <line x1="60" y1="55" x2="60" y2="65" stroke="hsl(210 80% 55%)" strokeWidth="1.5" markerEnd="url(#arrowBlue)" />
    {/* Labels */}
    <text x="120" y="12" textAnchor="middle" fontSize="6" fill="hsl(0 80% 55%)">{lang === 'ua' ? 'Аеро навантаження' : 'Aero load'}</text>
    <text x="60" y="75" textAnchor="middle" fontSize="6" fill="hsl(210 80% 55%)">{lang === 'ua' ? 'Відцентрова' : 'Centrifugal'}</text>
    <text x="20" y="44" textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))">{lang === 'ua' ? 'Корінь' : 'Root'}</text>
    <text x="185" y="44" textAnchor="start" fontSize="6" fill="hsl(var(--muted-foreground))">{lang === 'ua' ? 'Кінець' : 'Tip'}</text>
    <defs>
      <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="hsl(0 80% 55%)" /></marker>
      <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="hsl(210 80% 55%)" /></marker>
    </defs>
  </svg>
);

export const PrintableComponents = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1 flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-primary" /> {L('Порівняння властивостей матеріалів', 'Material Properties Comparison')}
        </h2>
        <p className="text-xs text-muted-foreground mb-3">{L('Ключові механічні та екологічні властивості матеріалів для 3D-друку вітротурбін.', 'Key mechanical and environmental properties for wind turbine 3D printing materials.')}</p>
        <div className="space-y-2">
          {materialComparison.map((mat, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary font-mono">{mat.name}</Badge>
                <span className="text-[10px] text-muted-foreground">{mat.cost}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] sm:text-xs">
                {[
                  { label: L('Розтяг', 'Tensile'), value: mat.tensile },
                  { label: 'UV', value: lang === 'ua' ? mat.uv_ua : mat.uv_en },
                  { label: L('Макс. темп.', 'Max Temp'), value: mat.tempMax },
                  { label: L('Втома', 'Fatigue'), value: lang === 'ua' ? mat.fatigue_ua : mat.fatigue_en },
                ].map((prop, j) => (
                  <div key={j}>
                    <span className="text-muted-foreground block">{prop.label}</span>
                    <span className="text-foreground font-mono">{prop.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Blade stress diagram */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> {L('Розподіл навантажень на лопать', 'Blade Load Distribution')}
        </h3>
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--border) / 0.2)' }}>
          <BladeStressSVG lang={lang} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          {L('Червоні стрілки: аеродинамічне навантаження (вигин). Сині: відцентрова сила (розтяг). Корінь лопаті — зона максимального напруження.',
             'Red arrows: aerodynamic load (bending). Blue: centrifugal force (tension). Blade root is the maximum stress zone.')}
        </p>
      </div>

      <div className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" /> {L('Деталі для друку — інженерні подробиці', 'Printable Components — Engineering Details')}
        </h2>
        <p className="text-xs text-muted-foreground mb-3">{L('Кожен компонент включає аналіз напружень, орієнтацію друку, допуски та рекомендації зі збірки.', 'Each component includes stress analysis, print orientation, tolerancing, and assembly guidance.')}</p>
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
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs text-muted-foreground">
                      <span>{item.material}</span><span>·</span><span>{item.method}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-primary shrink-0">{item.cost}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--primary) / 0.15)' }}>
                    <p className="text-[10px] font-semibold text-primary mb-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {L('Аналіз напружень', 'Stress Analysis')}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{lang === 'ua' ? item.stressNote_ua : item.stressNote_en}</p>
                  </div>
                  <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                    <p className="text-[10px] font-semibold text-foreground mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> {L('Орієнтація друку', 'Print Orientation')}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{lang === 'ua' ? item.orientation_ua : item.orientation_en}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                      <p className="text-[10px] font-semibold text-foreground mb-0.5">{L('Допуски', 'Tolerancing')}</p>
                      <p className="text-[11px] text-muted-foreground">{lang === 'ua' ? item.tolerancing_ua : item.tolerancing_en}</p>
                    </div>
                    <div className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                      <p className="text-[10px] font-semibold text-foreground mb-0.5">{L('Збірка', 'Assembly')}</p>
                      <p className="text-[11px] text-muted-foreground">{lang === 'ua' ? item.assembly_ua : item.assembly_en}</p>
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
