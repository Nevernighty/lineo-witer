import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wind, Zap, TrendingUp, Gauge, 
  ArrowRight, AlertCircle, CheckCircle, Info
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const WindEnergyFundamentals = () => {
  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Power Formula</span>
          </div>
          <p className="text-lg font-mono font-bold text-foreground">P = ½ρAV³</p>
          <p className="text-xs text-muted-foreground mt-1">Cubic wind speed relationship</p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Betz Limit</span>
          </div>
          <p className="text-lg font-mono font-bold text-foreground">59.3%</p>
          <p className="text-xs text-muted-foreground mt-1">Maximum theoretical efficiency</p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Modern HAWT</span>
          </div>
          <p className="text-lg font-mono font-bold text-foreground">45-50%</p>
          <p className="text-xs text-muted-foreground mt-1">Practical efficiency achieved</p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Capacity Factor</span>
          </div>
          <p className="text-lg font-mono font-bold text-foreground">25-45%</p>
          <p className="text-xs text-muted-foreground mt-1">Typical wind farm output</p>
        </Card>
      </div>

      {/* Power Equation Breakdown */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wind className="w-5 h-5 text-primary" />
          Wind Power Equation
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-card border border-border rounded-lg">
              <p className="text-2xl font-mono text-center mb-4 text-primary">
                P = ½ · ρ · A · V³ · Cp
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="font-mono text-primary">P</span>
                  <span className="text-muted-foreground">Power output (Watts)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="font-mono text-primary">ρ</span>
                  <span className="text-muted-foreground">Air density (1.225 kg/m³ at sea level)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="font-mono text-primary">A</span>
                  <span className="text-muted-foreground">Swept area (πr²)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="font-mono text-primary">V</span>
                  <span className="text-muted-foreground">Wind speed (m/s)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-mono text-primary">Cp</span>
                  <span className="text-muted-foreground">Power coefficient (0.35-0.45)</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-400">Cubic Relationship</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Doubling wind speed increases power by 8x. This makes site selection critical.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-400">Swept Area Impact</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Doubling blade length quadruples power output. Modern turbines reach 107m blade lengths.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-400">Air Density Factor</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cold air is denser, producing more power. High altitude sites lose ~3% per 1000m.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Wind Speed Classes */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-4">Wind Speed Classification (IEC 61400)</h3>
        <div className="space-y-3">
          {[
            { class: 'I', speed: '10.0', turbulence: 'High (A)', color: 'bg-red-500', desc: 'Offshore, exposed coastal' },
            { class: 'II', speed: '8.5', turbulence: 'Medium (B)', color: 'bg-orange-500', desc: 'Flat terrain, open plains' },
            { class: 'III', speed: '7.5', turbulence: 'Low (C)', color: 'bg-yellow-500', desc: 'Complex terrain, lower wind' },
            { class: 'S', speed: 'Custom', turbulence: 'Site-specific', color: 'bg-blue-500', desc: 'Special design conditions' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg">
              <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">Class {item.class}</span>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Avg Speed</span>
                  <p className="font-mono text-foreground">{item.speed} m/s</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Turbulence</span>
                  <p className="text-foreground">{item.turbulence}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Typical Sites</span>
                  <p className="text-foreground">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detailed Concepts */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-4">Key Concepts</h3>
        <Accordion type="single" collapsible className="space-y-2">
          <AccordionItem value="betz" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-sm">Betz Limit Explained</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                The Betz limit (59.3%) represents the maximum theoretical efficiency of a wind turbine.
                Discovered by Albert Betz in 1919, it proves that no turbine can capture more than 16/27 of wind's kinetic energy.
              </p>
              <p>
                This occurs because some air must continue moving past the turbine—if all kinetic energy were extracted,
                the air would stop and block incoming wind flow.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">Theory: 59.3%</Badge>
                <ArrowRight className="w-4 h-4" />
                <Badge variant="outline" className="bg-primary/10">Practice: 45-50%</Badge>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="weibull" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-sm">Weibull Distribution</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Wind speeds at a given location follow a Weibull distribution, characterized by shape factor (k) and scale factor (c).
              </p>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-2 bg-card border border-border rounded">
                  <span className="text-xs text-muted-foreground">Shape Factor (k)</span>
                  <p className="font-mono">1.5 - 3.0</p>
                  <span className="text-xs">Typical range</span>
                </div>
                <div className="p-2 bg-card border border-border rounded">
                  <span className="text-xs text-muted-foreground">Scale Factor (c)</span>
                  <p className="font-mono">≈ 1.12 × V̄</p>
                  <span className="text-xs">Related to mean speed</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="capacity" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-sm">Capacity Factor (KVVP)</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                The capacity factor (KVVP - коефіцієнт використання встановленої потужності) measures actual output
                versus theoretical maximum. It accounts for:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Wind variability and downtime</li>
                <li>Maintenance periods</li>
                <li>Grid curtailment</li>
                <li>Turbine availability</li>
              </ul>
              <div className="flex gap-2 mt-2">
                <Badge>Onshore: 25-35%</Badge>
                <Badge>Offshore: 40-55%</Badge>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="lcoe" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-sm">LCOE (Levelized Cost of Energy)</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                LCOE represents the average cost per unit of electricity over a project's lifetime,
                enabling comparison across energy sources.
              </p>
              <div className="p-3 bg-primary/10 rounded-lg mt-2">
                <p className="font-mono text-sm text-center">
                  LCOE = (Capital + O&M + Fuel) / Energy Output
                </p>
              </div>
              <p className="mt-2">
                Modern wind LCOE ranges from €25-50/MWh, competitive with fossil fuels without subsidies.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
};
