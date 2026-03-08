import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Wind, Zap, Volume2 } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

const turbineData = [
  { id: 'hawt3', type: 'Horizontal Axis', category: 'Three-Blade HAWT', power: '5–10 kW', parts: 'Blades, housing, connectors', efficiency: '55–60%', useCase: 'Rural open spaces', cost: '€1,500–€6,000', tsr: '6–8', noise: '35–45 dB(A)', setback: '≥ 500m from dwellings', pros: ['Highest efficiency', 'Mature technology', 'Self-starting at low speed'], cons: ['Requires yaw mechanism', 'Sensitive to turbulence', 'Visual impact'], powerCurve: 'Cut-in ~3 m/s, rated ~12 m/s, cut-out ~25 m/s. Pitch regulation maintains rated power above rated wind speed.' },
  { id: 'savonius', type: 'Vertical Axis', category: 'Savonius VAWT', power: '1–5 kW', parts: 'Rotor, supports, shaft', efficiency: '40–45%', useCase: 'Urban rooftops', cost: '€800–€2,500', tsr: '0.8–1.2', noise: '20–30 dB(A)', setback: 'Minimal — low noise', pros: ['Omnidirectional', 'Very low noise', 'Self-starting', 'Simple construction'], cons: ['Low efficiency', 'Limited scalability', 'Heavy for power output'], powerCurve: 'Cut-in ~2 m/s, operates well in turbulent/gusty conditions. Drag-driven — power limited by TSR.' },
  { id: 'darrieus', type: 'Vertical Axis', category: 'Darrieus VAWT', power: '1–5 kW', parts: 'Blades, vertical housing', efficiency: '45–50%', useCase: 'Mixed environments', cost: '€1,000–€3,000', tsr: '4–6', noise: '25–35 dB(A)', setback: '≥ 100m recommended', pros: ['Higher efficiency than Savonius', 'Compact footprint', 'Accepts wind from any direction'], cons: ['Not self-starting', 'Cyclic fatigue stresses', 'Vibration issues at resonance'], powerCurve: 'Requires external start mechanism. Lift-driven with periodic angle-of-attack variation. Peak Cp at λ ≈ 5.' },
  { id: 'micro', type: 'Micro Turbine', category: 'Rooftop Micro HAWT', power: '0.2–1 kW', parts: 'Blades, mounts', efficiency: '30–40%', useCase: 'Balconies, RVs, boats', cost: '€100–€500', tsr: '5–7', noise: '25–35 dB(A)', setback: 'None — personal use', pros: ['Portable', 'Low cost', 'Easy installation', 'Ideal for off-grid'], cons: ['Very low power', 'Affected by urban turbulence', 'Short lifespan'], powerCurve: 'Cut-in ~2.5 m/s. Small rotor diameter limits capture. Best with consistent laminar flow.' },
  { id: 'hybrid', type: 'Hybrid System', category: 'Wind-Solar Hybrid', power: '5–15 kW', parts: 'Integration housing, inverter', efficiency: '50–60%', useCase: 'Off-grid homes, farms', cost: '€2,500–€8,000', tsr: 'Varies by turbine type', noise: '30–40 dB(A)', setback: 'Depends on turbine component', pros: ['Complementary generation', 'Higher capacity factor', 'Reduced storage needs'], cons: ['Complex integration', 'Higher upfront cost', 'Dual maintenance'], powerCurve: 'Combined output smooths variability. Wind peaks at night/winter complement solar peaks at day/summer.' },
];

export const TurbineCategories = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stalker-card p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1">Household Wind Turbine Categories</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Comparison of turbine architectures with aerodynamic performance metrics, noise characteristics, and practical deployment guidelines.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.05)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
            <p className="text-xs font-semibold text-primary mb-1">HAWT</p>
            <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5">
              <li>• Higher Cp (up to 0.50)</li><li>• Requires yaw control</li>
              <li>• Sensitive to turbulence</li><li>• Better at scale</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.3)' }}>
            <p className="text-xs font-semibold text-foreground mb-1">VAWT</p>
            <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5">
              <li>• Omnidirectional</li><li>• Better in turbulence</li>
              <li>• Lower noise profile</li><li>• Simpler mechanics</li>
            </ul>
          </div>
        </div>
      </motion.div>

      <Accordion type="single" collapsible className="space-y-2">
        {turbineData.map((turbine, idx) => (
          <AccordionItem key={turbine.id} value={turbine.id} className="border-0">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
              className="stalker-card overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 text-left w-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-semibold">{turbine.category}</span>
                      <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">{turbine.type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{turbine.power}</span>
                      <span className="flex items-center gap-1"><Wind className="w-3 h-3" />η {turbine.efficiency}</span>
                      <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" />{turbine.noise}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-primary shrink-0">{turbine.cost}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: 'TSR (λ)', value: turbine.tsr },
                      { label: 'Setback', value: turbine.setback },
                      { label: '3D Printed Parts', value: turbine.parts },
                      { label: 'Best Use', value: turbine.useCase },
                    ].map((spec, i) => (
                      <div key={i} className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                        <span className="text-muted-foreground text-[10px]">{spec.label}</span>
                        <p className="text-foreground">{spec.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
                    <p className="text-[10px] font-semibold text-primary mb-1">Power Curve Behavior</p>
                    <p className="text-[11px] text-muted-foreground">{turbine.powerCurve}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] font-semibold text-primary mb-1">Advantages</p>
                      <ul className="text-[11px] text-muted-foreground space-y-0.5">
                        {turbine.pros.map((p, i) => <li key={i}>+ {p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold mb-1" style={{ color: 'hsl(0 60% 55%)' }}>Limitations</p>
                      <ul className="text-[11px] text-muted-foreground space-y-0.5">
                        {turbine.cons.map((c, i) => <li key={i}>− {c}</li>)}
                      </ul>
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
