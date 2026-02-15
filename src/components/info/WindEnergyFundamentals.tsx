import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

export const WindEnergyFundamentals = () => {
  return (
    <div className="space-y-4">
      {/* Hero Stats - responsive grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Wind className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Power Formula</span>
          </div>
          <p className="text-base sm:text-lg font-mono font-bold text-foreground">P = ½ρAV³</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Cubic wind speed relationship</p>
        </Card>
        
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-secondary/20 to-transparent border-secondary/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Gauge className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Betz Limit</span>
          </div>
          <p className="text-base sm:text-lg font-mono font-bold text-foreground">59.3%</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Max theoretical efficiency</p>
        </Card>
        
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-secondary/20 to-transparent border-secondary/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Modern HAWT</span>
          </div>
          <p className="text-base sm:text-lg font-mono font-bold text-foreground">45-50%</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Practical efficiency</p>
        </Card>
        
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Capacity Factor</span>
          </div>
          <p className="text-base sm:text-lg font-mono font-bold text-foreground">25-45%</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Typical wind farm output</p>
        </Card>
      </div>

      {/* Power Equation */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
          <Wind className="w-4 h-4 text-primary" />
          Wind Power Equation
        </h3>
        <div className="space-y-4">
          <div className="p-3 sm:p-4 bg-card border border-border rounded-lg">
            <p className="text-xl sm:text-2xl font-mono text-center mb-3 text-primary">
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
                <div key={i} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                  <span className="font-mono text-primary">{item.sym}</span>
                  <span className="text-muted-foreground text-xs sm:text-sm">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid gap-2">
            <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-primary">Cubic Relationship</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    Doubling wind speed increases power by 8×. This makes site selection critical for economic viability.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-2.5 bg-secondary/10 border border-secondary/30 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-foreground">Swept Area Impact</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    Doubling blade length quadruples power output. Modern turbines reach 107m blade lengths.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-secondary/10 border border-secondary/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-foreground">Air Density Factor</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    Cold air is denser, producing more power. High altitude sites lose ~3% per 1000m elevation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Wind Shear Profile */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          Wind Shear Profile
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Wind speed increases with height due to reduced surface friction. The power law models this relationship:
        </p>
        <div className="p-3 bg-card border border-border rounded-lg mb-3">
          <p className="text-lg font-mono text-center text-primary">
            V = V<sub>ref</sub> · (h / h<sub>ref</sub>)<sup>α</sup>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-card border border-border rounded">
            <span className="text-muted-foreground">Smooth terrain (sea)</span>
            <p className="font-mono text-foreground mt-0.5">α = 0.10–0.12</p>
          </div>
          <div className="p-2 bg-card border border-border rounded">
            <span className="text-muted-foreground">Open grassland</span>
            <p className="font-mono text-foreground mt-0.5">α = 0.14–0.16</p>
          </div>
          <div className="p-2 bg-card border border-border rounded">
            <span className="text-muted-foreground">Suburban areas</span>
            <p className="font-mono text-foreground mt-0.5">α = 0.20–0.30</p>
          </div>
          <div className="p-2 bg-card border border-border rounded">
            <span className="text-muted-foreground">Urban / forest</span>
            <p className="font-mono text-foreground mt-0.5">α = 0.30–0.40</p>
          </div>
        </div>
      </Card>

      {/* Wind Speed Classification */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3">IEC 61400 Wind Classes</h3>
        <div className="space-y-2">
          {[
            { class: 'I', speed: '10.0', turbulence: 'High (A: 16%)', desc: 'Offshore, exposed coastal' },
            { class: 'II', speed: '8.5', turbulence: 'Medium (B: 14%)', desc: 'Flat terrain, open plains' },
            { class: 'III', speed: '7.5', turbulence: 'Low (C: 12%)', desc: 'Complex terrain, lower wind' },
            { class: 'S', speed: 'Custom', turbulence: 'Site-specific', desc: 'Special design conditions' },
          ].map((item, i) => (
            <div key={i} className="p-2.5 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
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
      </Card>

      {/* Turbulence Intensity */}
      <Card className="p-4 sm:p-5">
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
            <div key={i} className="flex items-center justify-between p-2.5 bg-card border border-border rounded-lg">
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
      </Card>

      {/* Key Concepts Accordion */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold mb-3">Advanced Concepts</h3>
        <Accordion type="single" collapsible className="space-y-2">
          <AccordionItem value="betz" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="text-xs sm:text-sm py-2.5">Betz Limit — Maximum Energy Extraction</AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
              <p>
                The Betz limit (59.3%) represents the maximum theoretical efficiency of a wind turbine.
                Discovered by Albert Betz in 1919, it proves that no turbine can capture more than 16/27 of wind's kinetic energy.
              </p>
              <p>
                If all kinetic energy were extracted, air would stop behind the rotor, blocking incoming flow.
                The optimal extraction occurs when downstream speed is ⅓ of upstream speed.
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-[10px]">Theory: 59.3%</Badge>
                <ArrowRight className="w-3 h-3" />
                <Badge variant="outline" className="text-[10px] bg-primary/10">Practice: 45–50%</Badge>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="weibull" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="text-xs sm:text-sm py-2.5">Weibull Distribution — Wind Speed Probability</AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
              <p>
                Wind speeds follow a Weibull distribution, characterized by shape factor (k) and scale factor (c).
                This distribution is critical for estimating Annual Energy Production (AEP).
              </p>
              <div className="p-2 bg-card border border-border rounded font-mono text-center text-primary text-sm">
                f(V) = (k/c)(V/c)<sup>k-1</sup> · e<sup>-(V/c)^k</sup>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="p-2 bg-card border border-border rounded">
                  <span className="text-[10px] text-muted-foreground">Shape (k)</span>
                  <p className="font-mono text-xs">1.5–3.0</p>
                  <span className="text-[10px]">k=2 → Rayleigh</span>
                </div>
                <div className="p-2 bg-card border border-border rounded">
                  <span className="text-[10px] text-muted-foreground">Scale (c)</span>
                  <p className="font-mono text-xs">≈ 1.12 × V̄</p>
                  <span className="text-[10px]">Related to mean</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="reynolds" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="text-xs sm:text-sm py-2.5">Reynolds Number — Blade Aerodynamics</AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
              <p>
                The Reynolds number determines whether airflow over blade surfaces is laminar or turbulent,
                directly affecting lift and drag characteristics.
              </p>
              <div className="p-2 bg-card border border-border rounded font-mono text-center text-primary text-sm">
                Re = ρVL / μ
              </div>
              <p>
                Wind turbine blades typically operate at Re = 10⁶–10⁷. At low Re (small turbines, low wind),
                laminar separation bubbles reduce efficiency. Vortex generators or turbulators can mitigate this.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tsr" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="text-xs sm:text-sm py-2.5">Tip-Speed Ratio (λ) — Optimal Rotation</AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
              <p>
                TSR is the ratio of blade tip speed to wind speed. Each turbine design has an optimal TSR for maximum Cp.
              </p>
              <div className="p-2 bg-card border border-border rounded font-mono text-center text-primary text-sm">
                λ = ωR / V
              </div>
              <div className="space-y-1 mt-1">
                <div className="flex justify-between p-1.5 border-b border-border/50">
                  <span>3-blade HAWT</span>
                  <span className="font-mono">λ = 6–8</span>
                </div>
                <div className="flex justify-between p-1.5 border-b border-border/50">
                  <span>2-blade HAWT</span>
                  <span className="font-mono">λ = 8–10</span>
                </div>
                <div className="flex justify-between p-1.5 border-b border-border/50">
                  <span>Darrieus VAWT</span>
                  <span className="font-mono">λ = 4–6</span>
                </div>
                <div className="flex justify-between p-1.5">
                  <span>Savonius VAWT</span>
                  <span className="font-mono">λ = 0.8–1.2</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="capacity" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="text-xs sm:text-sm py-2.5">Capacity Factor (KVVP)</AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
              <p>
                The capacity factor measures actual output versus theoretical maximum over a period.
                It accounts for wind variability, maintenance, grid curtailment, and turbine availability.
              </p>
              <div className="flex gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-[10px]">Onshore: 25–35%</Badge>
                <Badge variant="outline" className="text-[10px]">Offshore: 40–55%</Badge>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="lcoe" className="border border-border rounded-lg px-3">
            <AccordionTrigger className="text-xs sm:text-sm py-2.5">LCOE — Levelized Cost of Energy</AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
              <p>
                LCOE represents the average cost per unit of electricity over a project's lifetime.
              </p>
              <div className="p-2 bg-primary/5 rounded-lg">
                <p className="font-mono text-xs text-center text-primary">
                  LCOE = (Capital + O&M + Decom.) / Σ(Energy × (1+r)<sup>-t</sup>)
                </p>
              </div>
              <p className="mt-1">
                Modern onshore wind: €25–45/MWh. Offshore: €50–80/MWh. Both competitive with fossil fuels without subsidies.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
};
