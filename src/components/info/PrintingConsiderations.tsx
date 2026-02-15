import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Flame, Droplets, RotateCw, Shield, Zap } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const PrintingConsiderations = () => {
  return (
    <div className="space-y-4">
      {/* Overview */}
      <Card className="p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1">3D Printing for Wind Energy</h2>
        <p className="text-xs text-muted-foreground">
          Advanced manufacturing considerations including FEA validation, fatigue analysis, post-processing, and quality control for rotating components.
        </p>
      </Card>

      {/* Print Settings */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Optimal Print Parameters
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Layer Height', structural: '0.15–0.20mm', nonCritical: '0.25–0.30mm' },
            { label: 'Infill Density', structural: '60–80%', nonCritical: '20–40%' },
            { label: 'Wall Thickness', structural: '3–4 perimeters', nonCritical: '2 perimeters' },
            { label: 'Print Speed', structural: '30–40 mm/s', nonCritical: '50–80 mm/s' },
          ].map((p, i) => (
            <div key={i} className="p-2.5 bg-card border border-border rounded-lg">
              <p className="text-[10px] font-semibold text-foreground mb-1">{p.label}</p>
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Structural</span>
                  <span className="font-mono text-primary">{p.structural}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Non-critical</span>
                  <span className="font-mono text-foreground">{p.nonCritical}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Advanced Topics */}
      <Accordion type="single" collapsible className="space-y-2">
        <AccordionItem value="fea" className="border-0">
          <Card className="overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold">Finite Element Analysis (FEA)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-2">
              <p>
                FEA validates structural integrity before printing. For rotating blades, simulate:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-card border border-border rounded">
                  <p className="text-[10px] font-semibold text-foreground">Static Analysis</p>
                  <p className="text-[10px] mt-0.5">Centrifugal + aerodynamic loads at rated speed. Safety factor ≥ 2.0 for printed parts.</p>
                </div>
                <div className="p-2 bg-card border border-border rounded">
                  <p className="text-[10px] font-semibold text-foreground">Modal Analysis</p>
                  <p className="text-[10px] mt-0.5">Natural frequencies must avoid 1P and 3P excitation harmonics to prevent resonance.</p>
                </div>
              </div>
              <p>
                Use orthotropic material models for FDM parts — layer direction has 40–60% reduced strength. 
                Free tools: FreeCAD FEM, Fusion 360 Simulation.
              </p>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="fatigue" className="border-0">
          <Card className="overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold">Fatigue Life Analysis</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-2">
              <p>
                Rotating parts experience cyclic loading. Each revolution = 1 fatigue cycle. 
                At 300 RPM, that's 432,000 cycles/day or 157M cycles/year.
              </p>
              <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-[10px] font-semibold text-primary mb-1">Design Rule</p>
                <p className="text-[10px]">
                  Keep maximum stress below 30–40% of material UTS for infinite fatigue life in polymers. 
                  PETG endurance limit: ~20 MPa. Nylon: ~28 MPa.
                </p>
              </div>
              <p>
                Stress concentrations at layer boundaries are primary crack initiation sites. 
                Use generous fillets (r ≥ 2mm) at all transitions. Avoid sharp internal corners.
              </p>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="postprocess" className="border-0">
          <Card className="overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold">Post-Processing & Surface Treatment</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-2">
              <div className="space-y-2">
                {[
                  { step: 'Annealing', detail: 'Heat PETG to 80°C for 2h to relieve residual stress and improve crystallinity by ~15%. Increases heat deflection temperature.' },
                  { step: 'Surface Smoothing', detail: 'Sand progressively (120→400→800 grit) for aerodynamic surfaces. Filler primer fills layer lines. Target Ra < 10μm for blade surfaces.' },
                  { step: 'UV Coating', detail: 'Apply 2K polyurethane clear coat for UV and weather protection. Recoat annually for outdoor installations.' },
                  { step: 'Epoxy Reinforcement', detail: 'Brush-apply epoxy resin to structural areas. Adds ~30% strength and seals layer interfaces against moisture ingress.' },
                ].map((item, i) => (
                  <div key={i} className="p-2.5 bg-card border border-border rounded-lg">
                    <p className="text-[10px] font-semibold text-foreground">{item.step}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.detail}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="balance" className="border-0">
          <Card className="overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold">Rotor Balancing Procedures</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-2">
              <p>
                Unbalanced rotors cause vibration, bearing wear, and noise. 3D-printed parts have inherent mass variation (±2–5%).
              </p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">Step 1</Badge>
                  <p className="text-[10px]">Weigh all blades. Match within 0.5g for blades under 200g.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">Step 2</Badge>
                  <p className="text-[10px]">Static balance: mount hub horizontally on knife edge. Add clay to lighter blade until level.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">Step 3</Badge>
                  <p className="text-[10px]">Dynamic test: spin at low speed, observe vibration. Target &lt; 0.5mm/s RMS.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">Step 4</Badge>
                  <p className="text-[10px]">Replace clay with epoxy + steel shot for permanent balance correction.</p>
                </div>
              </div>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="quality" className="border-0">
          <Card className="overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold">Quality Control Checklist</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-1.5">
              {[
                'Visual inspection: no delamination, stringing, or under-extrusion',
                'Dimensional check: critical dimensions within tolerance (calipers)',
                'Tap test: consistent sound indicates uniform infill density',
                'Flexural test: blade tip deflection under 5N load within expected range',
                'Weight check: within ±3% of CAD-predicted mass',
                'Surface finish: Ra < 10μm on aerodynamic surfaces after post-processing',
                'Assembly fit: all joints mate without forcing or excessive play',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <p className="text-[10px] sm:text-[11px]">{item}</p>
                </div>
              ))}
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
