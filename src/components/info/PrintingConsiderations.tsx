import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Settings, Flame, Droplets, RotateCw, Shield, Zap } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

export const PrintingConsiderations = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  const L = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1">{L('3D-друк для вітрової енергетики', '3D Printing for Wind Energy')}</h2>
        <p className="text-xs text-muted-foreground">
          {L('Розширені виробничі рекомендації включаючи FEA-валідацію, аналіз втоми, постобробку та контроль якості для обертових компонентів.',
             'Advanced manufacturing considerations including FEA validation, fatigue analysis, post-processing, and quality control for rotating components.')}
        </p>
      </motion.div>

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
              className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <p className="text-[10px] font-semibold text-foreground mb-1">{p.label}</p>
              <div className="space-y-0.5 text-[10px]">
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
              <p>{L('FEA валідує структурну цілісність перед друком. Для обертових лопатей моделюйте:', 'FEA validates structural integrity before printing. For rotating blades, simulate:')}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                  <p className="text-[10px] font-semibold text-foreground">{L('Статичний аналіз', 'Static Analysis')}</p>
                  <p className="text-[10px] mt-0.5">{L('Відцентрові + аеродинамічні навантаження при номінальній швидкості. Запас міцності ≥ 2.0 для друкованих деталей.', 'Centrifugal + aerodynamic loads at rated speed. Safety factor ≥ 2.0 for printed parts.')}</p>
                </div>
                <div className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                  <p className="text-[10px] font-semibold text-foreground">{L('Модальний аналіз', 'Modal Analysis')}</p>
                  <p className="text-[10px] mt-0.5">{L('Власні частоти повинні уникати гармонік 1P та 3P для запобігання резонансу.', 'Natural frequencies must avoid 1P and 3P excitation harmonics to prevent resonance.')}</p>
                </div>
              </div>
              <p>{L('Використовуйте ортотропні моделі матеріалу для FDM — напрямок шару має на 40–60% знижену міцність. Безкоштовні інструменти: FreeCAD FEM, Fusion 360.',
                   'Use orthotropic material models for FDM parts — layer direction has 40–60% reduced strength. Free tools: FreeCAD FEM, Fusion 360 Simulation.')}</p>
            </div>
          )},
          { value: 'fatigue', icon: RotateCw, title: L('Аналіз ресурсу втоми', 'Fatigue Life Analysis'), content: (
            <div className="space-y-2">
              <p>{L('Обертові деталі зазнають циклічного навантаження. Кожен оберт = 1 цикл втоми. При 300 об/хв це 432,000 циклів/день або 157М циклів/рік.',
                   'Rotating parts experience cyclic loading. Each revolution = 1 fatigue cycle. At 300 RPM, that\'s 432,000 cycles/day or 157M cycles/year.')}</p>
              <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
                <p className="text-[10px] font-semibold text-primary mb-1">{L('Правило проектування', 'Design Rule')}</p>
                <p className="text-[10px]">{L('Тримайте максимальне напруження нижче 30–40% від UTS матеріалу для нескінченного ресурсу втоми полімерів. PETG: ~20 МПа. Нейлон: ~28 МПа.',
                     'Keep maximum stress below 30–40% of material UTS for infinite fatigue life in polymers. PETG endurance limit: ~20 MPa. Nylon: ~28 MPa.')}</p>
              </div>
              <p>{L('Концентрації напружень на межах шарів — основні місця ініціації тріщин. Використовуйте щедрі галтелі (r ≥ 2мм) на всіх переходах.',
                   'Stress concentrations at layer boundaries are primary crack initiation sites. Use generous fillets (r ≥ 2mm) at all transitions.')}</p>
            </div>
          )},
          { value: 'postprocess', icon: Flame, title: L('Постобробка та обробка поверхні', 'Post-Processing & Surface Treatment'), content: (
            <div className="space-y-2">
              {[
                { step: L('Відпал', 'Annealing'), detail: L('Нагрійте PETG до 80°C на 2 год для зняття залишкових напружень та покращення кристалічності на ~15%.', 'Heat PETG to 80°C for 2h to relieve residual stress and improve crystallinity by ~15%.') },
                { step: L('Шліфування поверхні', 'Surface Smoothing'), detail: L('Шліфуйте послідовно (120→400→800 грит) для аеродинамічних поверхонь. Ціль Ra < 10мкм для лопатей.', 'Sand progressively (120→400→800 grit) for aerodynamic surfaces. Target Ra < 10μm for blade surfaces.') },
                { step: L('UV-покриття', 'UV Coating'), detail: L('Нанесіть 2K поліуретановий лак для захисту від UV та погоди. Оновлюйте щорічно.', 'Apply 2K polyurethane clear coat for UV and weather protection. Recoat annually.') },
                { step: L('Епоксидне підсилення', 'Epoxy Reinforcement'), detail: L('Нанесіть пензлем епоксидну смолу на структурні ділянки. Додає ~30% міцності та герметизує міжшарові зʼєднання.', 'Brush-apply epoxy resin to structural areas. Adds ~30% strength and seals layer interfaces.') },
              ].map((item, i) => (
                <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                  <p className="text-[10px] font-semibold text-foreground">{item.step}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>
          )},
          { value: 'balance', icon: Droplets, title: L('Процедури балансування ротора', 'Rotor Balancing Procedures'), content: (
            <div className="space-y-2">
              <p>{L('Незбалансовані ротори спричиняють вібрацію, знос підшипників та шум. 3D-друковані деталі мають природну варіацію маси (±2–5%).',
                   'Unbalanced rotors cause vibration, bearing wear, and noise. 3D-printed parts have inherent mass variation (±2–5%).')}</p>
              <div className="space-y-1.5">
                {[
                  L('Зважте всі лопаті. Збіг у межах 0.5г для лопатей до 200г.', 'Weigh all blades. Match within 0.5g for blades under 200g.'),
                  L('Статичне балансування: встановіть хаб горизонтально на лезо. Додайте глину на легшу лопать до рівноваги.', 'Static balance: mount hub horizontally on knife edge. Add clay to lighter blade until level.'),
                  L('Динамічний тест: обертайте на низькій швидкості, спостерігайте вібрацію. Ціль < 0.5мм/с RMS.', 'Dynamic test: spin at low speed, observe vibration. Target < 0.5mm/s RMS.'),
                  L('Замініть глину епоксидом + стальним дробом для постійної корекції балансу.', 'Replace clay with epoxy + steel shot for permanent balance correction.'),
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5 border-primary/30 bg-primary/5 text-primary">{L('Крок', 'Step')} {i + 1}</Badge>
                    <p className="text-[10px]">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )},
          { value: 'quality', icon: Zap, title: L('Контрольний список якості', 'Quality Control Checklist'), content: (
            <div className="space-y-1.5">
              {[
                L('Візуальний огляд: без розшарування, ниткоподібних артефактів або недоекструзії', 'Visual inspection: no delamination, stringing, or under-extrusion'),
                L('Перевірка розмірів: критичні розміри в допуску (штангенциркулем)', 'Dimensional check: critical dimensions within tolerance (calipers)'),
                L('Тест постукуванням: рівномірний звук вказує на однорідну щільність заповнення', 'Tap test: consistent sound indicates uniform infill density'),
                L('Тест на згин: прогин кінця лопаті під навантаженням 5Н у межах очікуваного', 'Flexural test: blade tip deflection under 5N load within expected range'),
                L('Перевірка маси: в межах ±3% від прогнозованої CAD маси', 'Weight check: within ±3% of CAD-predicted mass'),
                L('Якість поверхні: Ra < 10мкм на аеродинамічних поверхнях після постобробки', 'Surface finish: Ra < 10μm on aerodynamic surfaces after post-processing'),
                L('Збірка: всі зʼєднання стикуються без зусилля чи надмірного люфту', 'Assembly fit: all joints mate without forcing or excessive play'),
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <p className="text-[10px] sm:text-[11px]">{item}</p>
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
              <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground">
                {item.content}
              </AccordionContent>
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
