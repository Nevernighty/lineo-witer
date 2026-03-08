import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Wind, Zap, TrendingUp, Gauge, 
  ArrowRight, AlertCircle, CheckCircle, Info, Layers
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.3 } }),
};

export const WindEnergyFundamentals = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  return (
    <div className="space-y-4">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Wind, title: 'Power Formula', value: 'P = ½ρAV³', sub: 'Cubic wind speed relationship', color: 'hsl(120 100% 54%)' },
          { icon: Gauge, title: 'Betz Limit', value: '59.3%', sub: 'Max theoretical efficiency', color: 'hsl(210 90% 60%)' },
          { icon: TrendingUp, title: 'Modern HAWT', value: '45-50%', sub: 'Practical efficiency', color: 'hsl(25 90% 55%)' },
          { icon: Zap, title: 'Capacity Factor', value: '25-45%', sub: 'Typical wind farm output', color: 'hsl(270 70% 60%)' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} custom={i} initial="hidden" animate="visible" variants={cardVariants}
              className="stalker-card p-3 sm:p-4" style={{ borderLeftWidth: '3px', borderLeftColor: card.color }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">{card.title}</span>
              </div>
              <p className="text-base sm:text-lg font-mono font-bold text-foreground">{card.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Power Equation */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
          <Wind className="w-4 h-4 text-primary" />
          Wind Power Equation
        </h3>
        <div className="space-y-4">
          <div className="p-3 sm:p-4 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 10%)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
            <p className="text-xl sm:text-2xl font-mono text-center mb-3 text-primary" style={{ textShadow: '0 0 12px hsl(var(--primary) / 0.3)' }}>
              P = ½ · ρ · A · V³ · Cp
            </p>
            <div className="space-y-1.5 text-sm">
              {[
                { sym: 'P', desc: 'Power output (Watts)' },
                { sym: 'ρ', desc: 'Air density (1.225 kg/m³ at sea level)' },
                { sym: 'A', desc: 'Swept area (πr²)' },
                { sym: 'V', desc: 'Wind speed (m/s)' },
                { sym: 'Cp', desc: 'Power coefficient (0.35–0.45)' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
                  <span className="font-mono text-primary">{item.sym}</span>
                  <span className="text-muted-foreground text-xs sm:text-sm">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid gap-2">
            {[
              { icon: Info, color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.05)', border: 'hsl(var(--primary) / 0.2)', title: 'Cubic Relationship', text: 'Doubling wind speed increases power by 8×. This makes site selection critical for economic viability.' },
              { icon: CheckCircle, color: 'hsl(var(--foreground))', bg: 'hsl(222 28% 15%)', border: 'hsl(var(--border) / 0.3)', title: 'Swept Area Impact', text: 'Doubling blade length quadruples power output. Modern turbines reach 107m blade lengths.' },
              { icon: AlertCircle, color: 'hsl(var(--foreground))', bg: 'hsl(222 28% 15%)', border: 'hsl(var(--border) / 0.3)', title: 'Air Density Factor', text: 'Cold air is denser, producing more power. High altitude sites lose ~3% per 1000m elevation.' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: item.bg, borderColor: item.border }}>
                  <div className="flex items-start gap-2">
                    <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: item.color }} />
                    <div>
                      <p className="text-xs sm:text-sm font-medium" style={{ color: item.color }}>{item.title}</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{item.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Wind Shear Profile */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          Wind Shear Profile
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Wind speed increases with height due to reduced surface friction. The power law models this relationship:
        </p>
        <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
          <p className="text-lg font-mono text-center text-primary" style={{ textShadow: '0 0 8px hsl(var(--primary) / 0.3)' }}>
            V = V<sub>ref</sub> · (h / h<sub>ref</sub>)<sup>α</sup>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { terrain: 'Smooth terrain (sea)', alpha: 'α = 0.10–0.12' },
            { terrain: 'Open grassland', alpha: 'α = 0.14–0.16' },
            { terrain: 'Suburban areas', alpha: 'α = 0.20–0.30' },
            { terrain: 'Urban / forest', alpha: 'α = 0.30–0.40' },
          ].map((item, i) => (
            <div key={i} className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <span className="text-muted-foreground">{item.terrain}</span>
              <p className="font-mono text-foreground mt-0.5">{item.alpha}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Wind Speed Classification */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3">IEC 61400 Wind Classes</h3>
        <div className="space-y-2">
          {[
            { class: 'I', speed: '10.0', turbulence: 'High (A: 16%)', desc: 'Offshore, exposed coastal' },
            { class: 'II', speed: '8.5', turbulence: 'Medium (B: 14%)', desc: 'Flat terrain, open plains' },
            { class: 'III', speed: '7.5', turbulence: 'Low (C: 12%)', desc: 'Complex terrain, lower wind' },
            { class: 'S', speed: 'Custom', turbulence: 'Site-specific', desc: 'Special design conditions' },
          ].map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/5">
                  Class {item.class}
                </Badge>
                <span className="font-mono text-xs text-foreground">{item.speed} m/s</span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Turbulence: {item.turbulence}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Turbulence Intensity */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3">Turbulence Intensity (TI)</h3>
        <p className="text-xs text-muted-foreground mb-3">
          TI = σ<sub>v</sub> / V̄ — ratio of wind speed standard deviation to mean speed. Higher TI increases fatigue loads on turbine components.
        </p>
        <div className="space-y-2">
          {[
            { cat: 'A (High)', ti: '16%', ref: 'I₁₅ = 0.18', desc: 'Coastal cliffs, ridgelines' },
            { cat: 'B (Medium)', ti: '14%', ref: 'I₁₅ = 0.16', desc: 'Open terrain with moderate roughness' },
            { cat: 'C (Low)', ti: '12%', ref: 'I₁₅ = 0.12', desc: 'Flat open sea, smooth terrain' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <div>
                <p className="text-xs font-medium text-foreground">{item.cat}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-primary">{item.ti}</p>
                <p className="text-[10px] text-muted-foreground">{item.ref}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Concepts Accordion */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3">Advanced Concepts</h3>
        <Accordion type="single" collapsible className="space-y-2">
          {[
            { value: 'betz', title: 'Betz Limit — Maximum Energy Extraction', content: (
              <div className="space-y-2">
                <p>The Betz limit (59.3%) represents the maximum theoretical efficiency of a wind turbine. Discovered by Albert Betz in 1919, it proves that no turbine can capture more than 16/27 of wind's kinetic energy.</p>
                <p>If all kinetic energy were extracted, air would stop behind the rotor, blocking incoming flow. The optimal extraction occurs when downstream speed is ⅓ of upstream speed.</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">Theory: 59.3%</Badge>
                  <ArrowRight className="w-3 h-3" />
                  <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/30 text-primary">Practice: 45–50%</Badge>
                </div>
              </div>
            )},
            { value: 'weibull', title: 'Weibull Distribution — Wind Speed Probability', content: (
              <div className="space-y-2">
                <p>Wind speeds follow a Weibull distribution, characterized by shape factor (k) and scale factor (c). This distribution is critical for estimating Annual Energy Production (AEP).</p>
                <div className="p-2 rounded-lg font-mono text-center text-primary text-sm" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                  f(V) = (k/c)(V/c)<sup>k-1</sup> · e<sup>-(V/c)^k</sup>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                    <span className="text-[10px] text-muted-foreground">Shape (k)</span>
                    <p className="font-mono text-xs">1.5–3.0</p>
                    <span className="text-[10px]">k=2 → Rayleigh</span>
                  </div>
                  <div className="p-2 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                    <span className="text-[10px] text-muted-foreground">Scale (c)</span>
                    <p className="font-mono text-xs">≈ 1.12 × V̄</p>
                    <span className="text-[10px]">Related to mean</span>
                  </div>
                </div>
              </div>
            )},
            { value: 'reynolds', title: 'Reynolds Number — Blade Aerodynamics', content: (
              <div className="space-y-2">
                <p>The Reynolds number determines whether airflow over blade surfaces is laminar or turbulent, directly affecting lift and drag characteristics.</p>
                <div className="p-2 rounded-lg font-mono text-center text-primary text-sm" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                  Re = ρVL / μ
                </div>
                <p>Wind turbine blades typically operate at Re = 10⁶–10⁷. At low Re (small turbines, low wind), laminar separation bubbles reduce efficiency. Vortex generators or turbulators can mitigate this.</p>
              </div>
            )},
            { value: 'tsr', title: 'Tip-Speed Ratio (λ) — Optimal Rotation', content: (
              <div className="space-y-2">
                <p>TSR is the ratio of blade tip speed to wind speed. Each turbine design has an optimal TSR for maximum Cp.</p>
                <div className="p-2 rounded-lg font-mono text-center text-primary text-sm" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                  λ = ωR / V
                </div>
                <div className="space-y-1 mt-1">
                  {[
                    { type: '3-blade HAWT', tsr: 'λ = 6–8' },
                    { type: '2-blade HAWT', tsr: 'λ = 8–10' },
                    { type: 'Darrieus VAWT', tsr: 'λ = 4–6' },
                    { type: 'Savonius VAWT', tsr: 'λ = 0.8–1.2' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between p-1.5 border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.2)' }}>
                      <span>{item.type}</span>
                      <span className="font-mono">{item.tsr}</span>
                    </div>
                  ))}
                </div>
              </div>
            )},
            { value: 'capacity', title: 'Capacity Factor (KVVP)', content: (
              <div className="space-y-2">
                <p>The capacity factor measures actual output versus theoretical maximum over a period. It accounts for wind variability, maintenance, grid curtailment, and turbine availability.</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">Onshore: 25–35%</Badge>
                  <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">Offshore: 40–55%</Badge>
                </div>
              </div>
            )},
            { value: 'lcoe', title: 'LCOE — Levelized Cost of Energy', content: (
              <div className="space-y-2">
                <p>LCOE represents the average cost per unit of electricity over a project's lifetime.</p>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary) / 0.05)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
                  <p className="font-mono text-xs text-center text-primary">
                    LCOE = (Capital + O&M + Decom.) / Σ(Energy × (1+r)<sup>-t</sup>)
                  </p>
                </div>
                <p className="mt-1">Modern onshore wind: €25–45/MWh. Offshore: €50–80/MWh. Both competitive with fossil fuels without subsidies.</p>
              </div>
            )},
          ].map(item => (
            <AccordionItem key={item.value} value={item.value} className="rounded-lg border px-3" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--primary) / 0.1)' }}>
              <AccordionTrigger className="text-xs sm:text-sm py-2.5 hover:no-underline hover:text-primary">{item.title}</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground pb-3">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
