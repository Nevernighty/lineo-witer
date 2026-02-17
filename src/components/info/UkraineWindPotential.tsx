import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, Wind, Zap, TrendingUp, 
  MapPin, Factory, Leaf, Target, Calendar
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const regions = [
  { name: 'Zaporizhzhia Oblast', potential: 'Very High', speed: '7.5–8.5', capacity: '2,500 MW', status: 'operational' },
  { name: 'Kherson Oblast', potential: 'Very High', speed: '7.0–8.0', capacity: '1,800 MW', status: 'operational' },
  { name: 'Mykolaiv Oblast', potential: 'High', speed: '6.5–7.5', capacity: '1,200 MW', status: 'developing' },
  { name: 'Odesa Oblast', potential: 'High', speed: '6.5–7.5', capacity: '1,500 MW', status: 'developing' },
  { name: 'Lviv Oblast', potential: 'Medium', speed: '5.5–6.5', capacity: '600 MW', status: 'planned' },
  { name: 'Carpathian Mtns', potential: 'Medium-High', speed: '6.0–7.0', capacity: '800 MW', status: 'planned' },
];

const seasonalData = [
  { month: 'Jan', speed: 8.2, gen: 'High' },
  { month: 'Feb', speed: 7.8, gen: 'High' },
  { month: 'Mar', speed: 7.1, gen: 'Med-High' },
  { month: 'Apr', speed: 6.2, gen: 'Medium' },
  { month: 'May', speed: 5.4, gen: 'Low-Med' },
  { month: 'Jun', speed: 4.8, gen: 'Low' },
  { month: 'Jul', speed: 4.5, gen: 'Low' },
  { month: 'Aug', speed: 4.7, gen: 'Low' },
  { month: 'Sep', speed: 5.6, gen: 'Medium' },
  { month: 'Oct', speed: 6.5, gen: 'Medium' },
  { month: 'Nov', speed: 7.4, gen: 'Med-High' },
  { month: 'Dec', speed: 8.0, gen: 'High' },
];

export const UkraineWindPotential = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  return (
    <div className="space-y-4">
      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Wind className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase">Technical Potential</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-foreground">438 TWh/yr</p>
          <p className="text-[10px] text-muted-foreground">National assessment 2023</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-secondary/20 to-transparent border-secondary/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Factory className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase">Installed (2023)</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-foreground">1.67 GW</p>
          <p className="text-[10px] text-muted-foreground">Active wind capacity</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-secondary/20 to-transparent border-secondary/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase">2030 Target</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-foreground">10 GW</p>
          <p className="text-[10px] text-muted-foreground">National energy plan</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Leaf className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase">CO₂ Target</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-foreground">−65%</p>
          <p className="text-[10px] text-muted-foreground">vs 1990 by 2030 (NDC2)</p>
        </Card>
      </div>

      {/* Wind Resource */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          Wind Resource Distribution (100m)
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Based on IVE NAN Ukraine data. Technically achievable potential accounts for terrain, infrastructure, and grid constraints.
        </p>
        <div className="space-y-2">
          {[
            { range: '> 8.0 m/s', percent: 5 },
            { range: '7.0–8.0 m/s', percent: 15 },
            { range: '6.0–7.0 m/s', percent: 30 },
            { range: '5.0–6.0 m/s', percent: 35 },
            { range: '< 5.0 m/s', percent: 15 },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs w-24 shrink-0 font-mono">{item.range}</span>
              <Progress value={item.percent} className="flex-1 h-2" />
              <span className="text-[10px] text-muted-foreground w-8 text-right">{item.percent}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Regions */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Key Regions
        </h3>
        <div className="space-y-2">
          {regions.map((region, i) => (
            <div key={i} className="p-2.5 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{region.name}</span>
                <Badge 
                  variant="outline" 
                  className={`text-[10px] ${
                    region.status === 'operational' ? 'bg-primary/10 text-primary border-primary/30' :
                    region.status === 'developing' ? 'bg-secondary/20 text-foreground border-secondary/30' :
                    'bg-muted/10 text-muted-foreground border-border'
                  }`}
                >
                  {region.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                <span className="font-mono">{region.speed} m/s</span>
                <span>·</span>
                <span>{region.capacity} capacity</span>
                <span>·</span>
                <span>{region.potential}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Seasonal Variation */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Seasonal Wind Variation (Southern Ukraine)
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Monthly average wind speeds at 100m height. Winter months (Nov–Feb) provide 40–60% more energy than summer.
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {seasonalData.map((m, i) => (
            <div key={i} className="p-2 bg-card border border-border rounded text-center">
              <p className="text-[10px] text-muted-foreground">{m.month}</p>
              <p className="text-xs font-mono font-bold text-foreground">{m.speed}</p>
              <div 
                className="h-1 rounded-full mt-1 mx-auto bg-primary"
                style={{ width: `${(m.speed / 8.5) * 100}%`, opacity: 0.4 + (m.speed / 8.5) * 0.6 }}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Strategy & Grid */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Energy Strategy & EU Integration
        </h3>
        <div className="space-y-2">
          {[
            { title: 'Green Deal Alignment', text: 'Ukraine targets 25% renewable share by 2030, aligning with European Green Deal. NPD VDE exceeds NDC2 commitments.' },
            { title: 'ENTSO-E Synchronization', text: 'Grid synchronization with continental Europe (March 2022) enables electricity exports and improves stability for renewables.' },
            { title: 'Green Hydrogen', text: 'Wind-to-hydrogen production projected to make Ukraine a key green hydrogen supplier to EU markets.' },
          ].map((item, i) => (
            <div key={i} className="p-2.5 bg-card border border-border rounded-lg">
              <p className="text-xs font-semibold text-foreground">{item.title}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="mt-3 p-3 bg-card border border-border rounded-lg">
          <p className="text-[10px] font-semibold text-foreground mb-2">Development Timeline</p>
          <div className="flex items-center justify-between text-[10px]">
            {[
              { year: '2019', val: '1.2 GW' },
              { year: '2023', val: '1.67 GW' },
              { year: '2030', val: '10 GW', highlight: true },
              { year: '2050', val: '70% RES' },
            ].map((t, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="flex-1 h-0.5 bg-gradient-to-r from-primary/50 to-primary/30 mx-1" />}
                <div className="text-center">
                  <Badge variant={t.highlight ? 'default' : 'outline'} className="text-[9px] mb-0.5">
                    {t.year}
                  </Badge>
                  <p className={t.highlight ? 'font-medium text-foreground' : 'text-muted-foreground'}>{t.val}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </Card>

      {/* Grid Integration Details */}
      <Accordion type="single" collapsible>
        <AccordionItem value="grid" className="border-0">
          <Card className="overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold">Grid Integration & Frequency Regulation</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-2">
              <div className="space-y-2">
                {[
                  { title: 'Frequency Regulation', text: 'Ukrainian grid operates at 50 Hz ±0.2 Hz. Modern wind turbines provide synthetic inertia and primary frequency response (PFR) within 200ms. Required under ENTSO-E RfG network code.' },
                  { title: 'Balancing Markets', text: 'Wind plants participate in day-ahead (RDN), intraday (VDR), and balancing markets through SVB (balance-responsible parties). Imbalance penalties incentivize accurate forecasting.' },
                  { title: 'Curtailment & Storage', text: 'Grid congestion in southern regions causes 5–10% curtailment. GAES (pumped hydro) at Dniester and Kaniv provides 2.9 GW balancing. Battery storage projects emerging.' },
                  { title: 'Forecasting Accuracy', text: 'MCP (Measure-Correlate-Predict) methods achieve ±5% annual P50 accuracy. Day-ahead forecasts use NWP models (ECMWF, GFS) with ±15% RMSE for hourly predictions.' },
                ].map((item, i) => (
                  <div key={i} className="p-2.5 bg-card border border-border rounded-lg">
                    <p className="text-[10px] font-semibold text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.text}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>

      {/* Wind Rose explanation */}
      <Accordion type="single" collapsible>
        <AccordionItem value="windrose" className="border-0">
          <Card className="overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold">Understanding Wind Rose Diagrams</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-2">
              <p>
                A wind rose shows the frequency and speed distribution of wind from each compass direction. 
                For Ukraine's southern coast, dominant winds come from NW and NE, with seasonal shifts:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-card border border-border rounded">
                  <p className="text-[10px] font-semibold text-foreground">Winter (NW dominant)</p>
                  <p className="text-[10px]">Strong, consistent NW winds from continental high-pressure systems. 35–40% of annual energy.</p>
                </div>
                <div className="p-2 bg-card border border-border rounded">
                  <p className="text-[10px] font-semibold text-foreground">Summer (Variable)</p>
                  <p className="text-[10px]">Thermal convection creates afternoon SW sea breezes. Lower speeds but good for VAWT sites.</p>
                </div>
              </div>
              <p>
                Turbine orientation should align with the energy-weighted mean wind direction, not just frequency. 
                A 10° misalignment reduces output by ~1.5% (cosine³ loss).
              </p>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
