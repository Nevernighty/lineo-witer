import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Settings, Volume2, Wind } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const turbineSpecs = [
  { model: 'Vestas V150-4.2', power: '4.2 MW', rotor: '150m', hub: '105–166m', cutIn: '3', cutOut: '25', regulation: 'Pitch', aep: '~15 GWh/yr' },
  { model: 'Siemens SG 5.8-170', power: '5.8 MW', rotor: '170m', hub: '115–165m', cutIn: '3', cutOut: '25', regulation: 'Pitch', aep: '~22 GWh/yr' },
  { model: 'GE Haliade-X 14', power: '14 MW', rotor: '220m', hub: '135m', cutIn: '3', cutOut: '28', regulation: 'Pitch', aep: '~74 GWh/yr' },
  { model: 'Nordex N163/5.X', power: '5.7 MW', rotor: '163m', hub: '118–164m', cutIn: '3', cutOut: '25', regulation: 'Pitch', aep: '~20 GWh/yr' },
  { model: 'Enercon E-138 EP3', power: '4.2 MW', rotor: '138m', hub: '81–160m', cutIn: '2', cutOut: '28', regulation: 'Pitch (gearless)', aep: '~16 GWh/yr' },
];

const economicMetrics = [
  { metric: 'LCOE (Onshore)', value: '€25–45/MWh', trend: '↓ 40% since 2015' },
  { metric: 'LCOE (Offshore)', value: '€50–80/MWh', trend: '↓ 50% since 2015' },
  { metric: 'Capacity Factor', value: '25–55%', trend: 'Improving' },
  { metric: 'Project IRR', value: '8–12%', trend: 'Stable' },
  { metric: 'Payback Period', value: '7–12 years', trend: 'Shortening' },
  { metric: 'Turbine Lifespan', value: '25–30 years', trend: 'Extending' },
];

export const TechnicalSpecs = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  return (
    <div className="space-y-4">
      {/* Turbine Specs as expandable cards */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-1 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Modern Wind Turbine Specifications
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Industrial-scale reference turbines with rated power, rotor geometry, and estimated annual energy production.
        </p>
      </Card>

      <Accordion type="single" collapsible className="space-y-2">
        {turbineSpecs.map((t, i) => (
          <AccordionItem key={i} value={`turbine-${i}`} className="border-0">
            <Card className="overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 text-left w-full">
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm font-semibold">{t.model}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">{t.power}</Badge>
                      <span>Rotor: {t.rotor}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-primary shrink-0">{t.aep}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-card border border-border rounded">
                    <span className="text-[10px] text-muted-foreground">Hub Height</span>
                    <p className="font-mono text-foreground">{t.hub}</p>
                  </div>
                  <div className="p-2 bg-card border border-border rounded">
                    <span className="text-[10px] text-muted-foreground">Regulation</span>
                    <p className="text-foreground">{t.regulation}</p>
                  </div>
                  <div className="p-2 bg-card border border-border rounded">
                    <span className="text-[10px] text-muted-foreground">Cut-in Speed</span>
                    <p className="font-mono text-foreground">{t.cutIn} m/s</p>
                  </div>
                  <div className="p-2 bg-card border border-border rounded">
                    <span className="text-[10px] text-muted-foreground">Cut-out Speed</span>
                    <p className="font-mono text-foreground">{t.cutOut} m/s</p>
                  </div>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Economic Metrics */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          Economic Performance
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {economicMetrics.map((item, i) => (
            <div key={i} className="p-2.5 bg-card border border-border rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.metric}</p>
              <p className="text-sm sm:text-base font-bold text-foreground mt-0.5">{item.value}</p>
              <p className="text-[10px] text-primary mt-0.5">{item.trend}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Advanced Technical Topics */}
      <Accordion type="single" collapsible className="space-y-2">
        <AccordionItem value="aep" className="border-0">
          <Card className="overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold">AEP Calculation Method</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-2">
              <p>Annual Energy Production integrates the turbine power curve against the site wind distribution:</p>
              <div className="p-2.5 bg-card border border-border rounded-lg font-mono text-center text-primary text-sm">
                AEP = 8760 × ∫ P(V) · f(V) dV
              </div>
              <p>
                Where P(V) is the power curve and f(V) is the Weibull PDF. Losses applied: wake (5–10%), 
                electrical (2–3%), availability (95–98%), blade soiling (1–2%), icing (0–5% depending on climate).
              </p>
              <p>
                Net AEP is typically 75–85% of gross AEP after all loss factors. P50/P75/P90 exceedance 
                probabilities account for wind resource uncertainty for bankability.
              </p>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="power-curve" className="border-0">
          <Card className="overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold">Power Curve: Stall vs Pitch Regulation</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-card border border-border rounded-lg">
                  <p className="text-[10px] font-semibold text-foreground">Stall Regulation</p>
                  <p className="text-[10px] mt-0.5">Blade aerodynamics naturally limit power above rated speed. 
                  Simpler, cheaper, but power drops in high winds. Used in older/smaller turbines.</p>
                </div>
                <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-[10px] font-semibold text-primary">Pitch Regulation</p>
                  <p className="text-[10px] mt-0.5">Active blade angle control maintains rated power. 
                  Enables emergency feathering (90° pitch). Standard on all modern utility turbines.</p>
                </div>
              </div>
              <p>
                Active pitch systems respond in 3–5 seconds. Individual Pitch Control (IPC) adjusts each blade 
                independently to reduce asymmetric loads from wind shear and yaw misalignment.
              </p>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="wake" className="border-0">
          <Card className="overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold">Wake Effects & Spacing Guidelines</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-2">
              <p>
                Downstream turbines in a wake experience reduced wind speed and increased turbulence:
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between p-2 bg-card border border-border rounded">
                  <span>Velocity deficit at 5D</span>
                  <span className="font-mono text-primary">20–40%</span>
                </div>
                <div className="flex justify-between p-2 bg-card border border-border rounded">
                  <span>Velocity deficit at 10D</span>
                  <span className="font-mono text-primary">5–15%</span>
                </div>
                <div className="flex justify-between p-2 bg-card border border-border rounded">
                  <span>Turbulence recovery</span>
                  <span className="font-mono text-primary">10–15D</span>
                </div>
              </div>
              <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-[10px] font-semibold text-primary">Industry Rule</p>
                <p className="text-[10px]">
                  Minimum 5D spacing perpendicular to prevailing wind, 7–10D in prevailing direction. 
                  D = rotor diameter. Jensen/Park wake model used for initial layout; CFD for detailed optimization.
                </p>
              </div>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="noise" className="border-0">
          <Card className="overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold">Noise Propagation & Regulations</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-2">
              <p>
                Wind turbine noise consists of aerodynamic (broadband, trailing edge) and mechanical (gearbox, generator) components.
              </p>
              <div className="p-2.5 bg-card border border-border rounded-lg font-mono text-center text-primary text-sm">
                L<sub>p</sub> = L<sub>w</sub> − 10·log₁₀(4πr²) − α·r
              </div>
              <p>Where L<sub>w</sub> is source power level (~104 dB(A) for modern turbines), r is distance, α is atmospheric absorption.</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-card border border-border rounded">
                  <p className="text-[10px] font-semibold text-foreground">At 500m</p>
                  <p className="font-mono text-foreground">~40 dB(A)</p>
                </div>
                <div className="p-2 bg-card border border-border rounded">
                  <p className="text-[10px] font-semibold text-foreground">EU limit (night)</p>
                  <p className="font-mono text-foreground">35–40 dB(A)</p>
                </div>
              </div>
              <p>
                Trailing edge serrations reduce broadband noise by 2–5 dB(A). Noise-optimized operation modes 
                curtail RPM at night, trading 1–3% AEP for regulatory compliance.
              </p>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
