import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Settings, Flame, Droplets, RotateCw, Shield, Zap, Layers } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

// Layer orientation diagram
const LayerOrientationSVG = ({ lang }: { lang: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;
  return (
    <svg viewBox="0 0 380 130" className="w-full h-28 sm:h-32">
      {/* Correct orientation */}
      <g>
        <text x="95" y="14" textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(120 70% 50%)">✓ {L('Правильно', 'Correct')}</text>
        <rect x="30" y="22" width="130" height="80" rx="4" fill="hsl(222 28% 12%)" stroke="hsl(120 70% 50%)" strokeWidth="1.5" opacity="0.6" />
        {/* Horizontal layers */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <line key={i} x1="32" y1={26 + i * 10} x2="158" y2={26 + i * 10} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.2" />
        ))}
        {/* Load arrow — horizontal (along layers) */}
        <line x1="20" y1="62" x2="5" y2="62" stroke="hsl(120 70% 50%)" strokeWidth="2" markerEnd="url(#arrG)" />
        <text x="95" y="115" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">{L('Навантаження ∥ шарам', 'Load ∥ layers')}</text>
      </g>
      
      {/* Wrong orientation */}
      <g>
        <text x="285" y="14" textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(0 70% 55%)">✗ {L('Неправильно', 'Wrong')}</text>
        <rect x="220" y="22" width="130" height="80" rx="4" fill="hsl(222 28% 12%)" stroke="hsl(0 70% 55%)" strokeWidth="1.5" opacity="0.6" />
        {/* Vertical layers */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
          <line key={i} x1={224 + i * 10} y1="24" x2={224 + i * 10} y2="100" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.2" />
        ))}
        {/* Load arrow — perpendicular (across layers) */}
        <line x1="210" y1="62" x2="195" y2="62" stroke="hsl(0 70% 55%)" strokeWidth="2" markerEnd="url(#arrR)" />
        {/* Crack indication */}
        <path d="M270 30 L275 50 L265 70 L275 90" stroke="hsl(0 70% 55%)" strokeWidth="1.5" fill="none" strokeDasharray="3 2" opacity="0.7" />
        <text x="285" y="115" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">{L('Навантаження ⊥ шарам', 'Load ⊥ layers')}</text>
      </g>
      
      <defs>
        <marker id="arrG" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7Z" fill="hsl(120 70% 50%)" /></marker>
        <marker id="arrR" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7Z" fill="hsl(0 70% 55%)" /></marker>
      </defs>
    </svg>
  );
};

export const PrintingConsiderations = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1">{L('3D-друк для вітрової енергетики', '3D Printing for Wind Energy')}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {L('Розширені виробничі рекомендації: FEA-валідація, аналіз втоми, постобробка та контроль якості обертових компонентів.',
             'Advanced manufacturing: FEA validation, fatigue analysis, post-processing, and quality control for rotating components.')}
        </p>
      </motion.div>

      {/* Layer orientation diagram */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" /> {L('Орієнтація шарів відносно навантаження', 'Layer Orientation vs Load Direction')}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {L('Адгезія шарів FDM — 40–60% від міцності в площині. Завжди орієнтуйте деталь так, щоб навантаження йшло вздовж шарів.',
             'FDM layer adhesion is 40–60% of in-plane strength. Always orient parts so load runs along layers.')}
        </p>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <LayerOrientationSVG lang={lang} />
        </div>
      </div>

      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" /> {L('Оптимальні параметри друку', 'Optimal Print Parameters')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: L('Висота шару', 'Layer Height'), structural: '0.15–0.20mm', nonCritical: '0.25–0.30mm' },
            { label: L('Заповнення', 'Infill Density'), structural: '60–80%', nonCritical: '20–40%' },
            { label: L('Товщина стінки', 'Wall Thickness'), structural: L('3–4 периметри', '3–4 perimeters'), nonCritical: L('2 периметри', '2 perimeters') },
            { label: L('Швидкість друку', 'Print Speed'), structural: '30–40 mm/s', nonCritical: '50–80 mm/s' },
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
            </motion.div>
          ))}
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {[
          { value: 'fea', icon: Shield, title: L('Метод скінченних елементів (FEA)', 'Finite Element Analysis (FEA)'), content: (
            <div className="space-y-2">
              <p>{L('FEA валідує структурну цілісність перед друком:', 'FEA validates structural integrity before printing:')}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                  <p className="text-xs font-semibold text-foreground">{L('Статичний аналіз', 'Static Analysis')}</p>
                  <p className="text-xs mt-1">{L('Відцентрові + аеродинамічні навантаження. Запас міцності ≥ 2.0.', 'Centrifugal + aerodynamic loads. Safety factor ≥ 2.0.')}</p>
                </div>
                <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                  <p className="text-xs font-semibold text-foreground">{L('Модальний аналіз', 'Modal Analysis')}</p>
                  <p className="text-xs mt-1">{L('Власні частоти мають уникати гармонік 1P та 3P.', 'Natural frequencies must avoid 1P and 3P harmonics.')}</p>
                </div>
              </div>
              <p>{L('Ортотропні моделі матеріалу для FDM. Безкоштовні інструменти: FreeCAD FEM, Fusion 360.',
                   'Use orthotropic material models for FDM. Free tools: FreeCAD FEM, Fusion 360.')}</p>
            </div>
          )},
          { value: 'fatigue', icon: RotateCw, title: L('Аналіз ресурсу втоми', 'Fatigue Life Analysis'), content: (
            <div className="space-y-2">
              <p>{L('Кожен оберт = 1 цикл втоми. При 300 об/хв це 432,000 циклів/день або 157М/рік.',
                   'Each revolution = 1 fatigue cycle. At 300 RPM: 432,000 cycles/day or 157M/year.')}</p>
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
                <p className="text-xs font-semibold text-primary mb-1">{L('Правило проектування', 'Design Rule')}</p>
                <p className="text-xs">{L('Макс. напруження < 30–40% UTS для нескінченного ресурсу полімерів. PETG: ~20 МПа. Нейлон: ~28 МПа.',
                     'Max stress < 30–40% of UTS for infinite polymer life. PETG: ~20 MPa. Nylon: ~28 MPa.')}</p>
              </div>
              <p>{L('Концентрації напружень на межах шарів — місця ініціації тріщин. Галтелі r ≥ 2мм на переходах.',
                   'Layer boundary stress concentrations are crack initiation sites. Fillets r ≥ 2mm at transitions.')}</p>
            </div>
          )},
          { value: 'postprocess', icon: Flame, title: L('Постобробка та обробка поверхні', 'Post-Processing & Surface Treatment'), content: (
            <div className="space-y-2">
              {[
                { step: L('Відпал', 'Annealing'), detail: L('PETG до 80°C на 2 год для зняття напружень та +15% кристалічності.', 'PETG at 80°C for 2h to relieve stress and +15% crystallinity.') },
                { step: L('Шліфування', 'Sanding'), detail: L('120→400→800 грит. Ціль Ra < 10мкм для лопатей.', '120→400→800 grit. Target Ra < 10μm for blades.') },
                { step: L('UV-покриття', 'UV Coating'), detail: L('2K поліуретановий лак. Оновлюйте щорічно.', '2K polyurethane clear coat. Recoat annually.') },
                { step: L('Епоксид', 'Epoxy'), detail: L('Епоксидна смола на структурні ділянки. +30% міцності.', 'Epoxy resin on structural areas. +30% strength.') },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                  <p className="text-xs font-semibold text-foreground">{item.step}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>
          )},
          { value: 'balance', icon: Droplets, title: L('Балансування ротора', 'Rotor Balancing'), content: (
            <div className="space-y-2">
              <p>{L('Незбалансовані ротори — вібрація, знос підшипників, шум. 3D-друк має варіацію маси ±2–5%.',
                   'Unbalanced rotors cause vibration, bearing wear, noise. 3D prints have ±2–5% mass variation.')}</p>
              <div className="space-y-1.5">
                {[
                  L('Зважте лопаті. Збіг у межах 0.5г.', 'Weigh blades. Match within 0.5g.'),
                  L('Статичне: хаб горизонтально на лезі, глина на легшу лопать.', 'Static: hub on knife edge, clay on lighter blade.'),
                  L('Динамічний тест: обертайте повільно. Ціль < 0.5мм/с RMS.', 'Dynamic: spin slowly. Target < 0.5mm/s RMS.'),
                  L('Замініть глину на епоксид + стальний дріб.', 'Replace clay with epoxy + steel shot.'),
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs shrink-0 mt-0.5 border-primary/30 bg-primary/5 text-primary">{L('Крок', 'Step')} {i + 1}</Badge>
                    <p className="text-xs">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )},
          { value: 'quality', icon: Zap, title: L('Контрольний список якості', 'Quality Control Checklist'), content: (
            <div className="space-y-1.5">
              {[
                L('Візуальний огляд: без розшарування, ниток, недоекструзії', 'Visual: no delamination, stringing, under-extrusion'),
                L('Розмір: критичні розміри в допуску (штангенциркулем)', 'Dimensions: critical sizes within tolerance (calipers)'),
                L('Тест постукуванням: рівномірний звук = однорідне заповнення', 'Tap test: consistent sound = uniform infill'),
                L('Згин: прогин кінця під 5Н в нормі', 'Flex: tip deflection under 5N within expected range'),
                L('Маса: ±3% від CAD-прогнозу', 'Weight: ±3% of CAD-predicted mass'),
                L('Поверхня: Ra < 10мкм після обробки', 'Surface: Ra < 10μm after processing'),
                L('Збірка: зʼєднання без зусилля чи люфту', 'Assembly: joints mate without forcing or play'),
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <p className="text-xs">{item}</p>
                </div>
              ))}
            </div>
          )},
        ].map(item => (
          <AccordionItem key={item.value} value={item.value} className="border-0">
            <div className="stalker-card overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-semibold">{item.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0 text-xs sm:text-sm text-muted-foreground">
                {item.content}
              </AccordionContent>
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
