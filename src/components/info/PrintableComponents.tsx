import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Thermometer, Shield, Layers } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const componentsData = [
  {
    id: 'blades',
    component: 'Turbine Blades',
    material: 'PETG, ABS, ASA',
    method: 'FDM — 0.2mm layer',
    cost: '€10–€30 each',
    orientation: 'Print vertically with supports for aero profile integrity',
    stressNote: 'Centrifugal force: F = mω²r. At 300 RPM with 0.5m blade, tip force ≈ 50N. PETG tensile (50 MPa) handles this with 60% infill.',
    tolerancing: '±0.2mm on root fitment. Use interference fit for hub connection.',
    assembly: 'Balance blades within 0.5g per set. Sand trailing edges to 0.5mm for improved aerodynamic performance.',
  },
  {
    id: 'hub',
    component: 'Rotor Hub',
    material: 'PLA+, PETG, Nylon',
    method: 'FDM — 0.15mm layer',
    cost: '€5–€15',
    orientation: 'Print flat with concentric infill for radial strength distribution',
    stressNote: 'Hub bears combined bending + torsion from all blades. Use 80% infill minimum. Nylon preferred for fatigue resistance.',
    tolerancing: '±0.1mm on shaft bore. Ream after printing for press-fit with bearing.',
    assembly: 'Pre-drill blade bolt holes slightly undersized. Tap with M4/M5 thread for secure fastening.',
  },
  {
    id: 'housing',
    component: 'Nacelle Housing',
    material: 'ASA, PETG',
    method: 'FDM — 0.3mm layer',
    cost: '€20–€50',
    orientation: 'Split into halves, print flat face down. Join with solvent welding or mechanical fasteners.',
    stressNote: 'Primarily weather protection. ASA provides UV resistance (retains 90% strength after 2000h UV exposure).',
    tolerancing: '±0.5mm acceptable. Use gasket or silicone seal at split line.',
    assembly: 'Include cable routing channels in design. Add ventilation slots for generator cooling.',
  },
  {
    id: 'vawt-rotor',
    component: 'Vertical Rotor (VAWT)',
    material: 'PETG, ASA',
    method: 'FDM — 0.2mm layer',
    cost: '€15–€40',
    orientation: 'Print Savonius halves separately, bond with epoxy. Darrieus blades print with chord parallel to bed.',
    stressNote: 'Cyclic bending per revolution. PETG fatigue limit ≈ 40% of tensile strength. Design for infinite life below this threshold.',
    tolerancing: '±0.3mm on profile. Post-process with filler primer for smooth airfoil surface.',
    assembly: 'Dynamic balance on mandrel. Target vibration < 0.5mm/s RMS at rated speed.',
  },
  {
    id: 'mounts',
    component: 'Mounts & Bearing Housings',
    material: 'Nylon, CF-PETG',
    method: 'FDM or SLS',
    cost: '€30–€100',
    orientation: 'Print with load path aligned to layer direction. Z-axis is weakest.',
    stressNote: 'Use carbon-fiber filled PETG for 2× stiffness. Critical: layer adhesion is 40-60% of in-plane strength.',
    tolerancing: '±0.05mm on bearing seats (post-machine if needed). Use metal inserts for bolt holes.',
    assembly: 'Press-fit bearings with slight interference (0.02mm). Apply thread-locking compound on all fasteners.',
  },
];

const materialComparison = [
  { name: 'PLA', tensile: '60 MPa', uv: 'Poor', tempMax: '55°C', fatigue: 'Poor', cost: '€' },
  { name: 'PETG', tensile: '50 MPa', uv: 'Moderate', tempMax: '75°C', fatigue: 'Good', cost: '€€' },
  { name: 'ASA', tensile: '45 MPa', uv: 'Excellent', tempMax: '95°C', fatigue: 'Good', cost: '€€' },
  { name: 'Nylon', tensile: '70 MPa', uv: 'Moderate', tempMax: '110°C', fatigue: 'Excellent', cost: '€€€' },
  { name: 'CF-PETG', tensile: '75 MPa', uv: 'Good', tempMax: '85°C', fatigue: 'Very Good', cost: '€€€' },
];

export const PrintableComponents = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  return (
    <div className="space-y-4">
      {/* Material Comparison */}
      <Card className="p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1 flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-primary" />
          Material Properties Comparison
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Key mechanical and environmental properties for wind turbine 3D printing materials.
        </p>
        <div className="space-y-2">
          {materialComparison.map((mat, i) => (
            <div key={i} className="p-2.5 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary font-mono">{mat.name}</Badge>
                <span className="text-[10px] text-muted-foreground">{mat.cost}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] sm:text-xs">
                <div>
                  <span className="text-muted-foreground block">Tensile</span>
                  <span className="text-foreground font-mono">{mat.tensile}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">UV</span>
                  <span className="text-foreground">{mat.uv}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Max Temp</span>
                  <span className="text-foreground font-mono">{mat.tempMax}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Fatigue</span>
                  <span className="text-foreground">{mat.fatigue}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Components */}
      <Card className="p-4 sm:p-5">
        <h2 className="text-base sm:text-xl font-bold mb-1 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          Printable Components — Engineering Details
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Each component includes stress analysis, print orientation, tolerancing, and assembly guidance.
        </p>
      </Card>

      <Accordion type="single" collapsible className="space-y-2">
        {componentsData.map((item) => (
          <AccordionItem key={item.id} value={item.id} className="border-0">
            <Card className="overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 text-left w-full">
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm font-semibold">{item.component}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs text-muted-foreground">
                      <span>{item.material}</span>
                      <span>·</span>
                      <span>{item.method}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-primary shrink-0">{item.cost}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="space-y-2">
                  <div className="p-2.5 bg-card border border-border rounded-lg">
                    <p className="text-[10px] font-semibold text-primary mb-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Stress Analysis
                    </p>
                    <p className="text-[11px] text-muted-foreground">{item.stressNote}</p>
                  </div>
                  <div className="p-2.5 bg-card border border-border rounded-lg">
                    <p className="text-[10px] font-semibold text-foreground mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Print Orientation
                    </p>
                    <p className="text-[11px] text-muted-foreground">{item.orientation}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-card border border-border rounded">
                      <p className="text-[10px] font-semibold text-foreground mb-0.5">Tolerancing</p>
                      <p className="text-[11px] text-muted-foreground">{item.tolerancing}</p>
                    </div>
                    <div className="p-2 bg-card border border-border rounded">
                      <p className="text-[10px] font-semibold text-foreground mb-0.5">Assembly</p>
                      <p className="text-[11px] text-muted-foreground">{item.assembly}</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
