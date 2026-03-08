import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, Wind, Zap, TrendingUp, 
  MapPin, Factory, Leaf, Target, Calendar
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

const regions = [
  { name: 'Zaporizhzhia Oblast', potential: 'Very High', speed: '7.5–8.5', capacity: '2,500 MW', status: 'operational' },
  { name: 'Kherson Oblast', potential: 'Very High', speed: '7.0–8.0', capacity: '1,800 MW', status: 'operational' },
  { name: 'Mykolaiv Oblast', potential: 'High', speed: '6.5–7.5', capacity: '1,200 MW', status: 'developing' },
  { name: 'Odesa Oblast', potential: 'High', speed: '6.5–7.5', capacity: '1,500 MW', status: 'developing' },
  { name: 'Lviv Oblast', potential: 'Medium', speed: '5.5–6.5', capacity: '600 MW', status: 'planned' },
  { name: 'Carpathian Mtns', potential: 'Medium-High', speed: '6.0–7.0', capacity: '800 MW', status: 'planned' },
];

const seasonalData = [
  { month: 'Jan', speed: 8.2 }, { month: 'Feb', speed: 7.8 }, { month: 'Mar', speed: 7.1 },
  { month: 'Apr', speed: 6.2 }, { month: 'May', speed: 5.4 }, { month: 'Jun', speed: 4.8 },
  { month: 'Jul', speed: 4.5 }, { month: 'Aug', speed: 4.7 }, { month: 'Sep', speed: 5.6 },
  { month: 'Oct', speed: 6.5 }, { month: 'Nov', speed: 7.4 }, { month: 'Dec', speed: 8.0 },
];

export const UkraineWindPotential = ({ lang = 'en' }: { lang?: 'ua' | 'en' }) => {
  return (
    <div className="space-y-4">
      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Wind, title: 'Technical Potential', value: '438 TWh/yr', sub: 'National assessment 2023', color: 'hsl(120 100% 54%)' },
          { icon: Factory, title: 'Installed (2023)', value: '1.67 GW', sub: 'Active wind capacity', color: 'hsl(210 90% 60%)' },
          { icon: Target, title: '2030 Target', value: '10 GW', sub: 'National energy plan', color: 'hsl(25 90% 55%)' },
          { icon: Leaf, title: 'CO₂ Target', value: '−65%', sub: 'vs 1990 by 2030 (NDC2)', color: 'hsl(270 70% 60%)' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="stalker-card p-3 sm:p-4" style={{ borderLeftWidth: '3px', borderLeftColor: card.color }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                <span className="text-[10px] text-muted-foreground uppercase">{card.title}</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-[10px] text-muted-foreground">{card.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Wind Resource */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          Wind Resource Distribution (100m)
        </h3>
        <div className="space-y-2">
          {[
            { range: '> 8.0 m/s', percent: 5 }, { range: '7.0–8.0 m/s', percent: 15 },
            { range: '6.0–7.0 m/s', percent: 30 }, { range: '5.0–6.0 m/s', percent: 35 },
            { range: '< 5.0 m/s', percent: 15 },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs w-24 shrink-0 font-mono">{item.range}</span>
              <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(222 28% 12%)' }}>
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${item.percent}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 15, delay: i * 0.1 }}
                  style={{ background: 'hsl(var(--primary))', boxShadow: '0 0 6px hsl(var(--primary) / 0.4)' }} />
              </div>
              <span className="text-[10px] text-muted-foreground w-8 text-right">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Regions */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> Key Regions
        </h3>
        <div className="space-y-2">
          {regions.map((region, i) => (
            <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{region.name}</span>
                <Badge variant="outline" className={`text-[10px] ${
                  region.status === 'operational' ? 'bg-primary/10 text-primary border-primary/30' :
                  region.status === 'developing' ? 'bg-secondary/20 text-foreground border-secondary/30' :
                  'bg-muted/10 text-muted-foreground border-border/30'
                }`}>{region.status}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                <span className="font-mono">{region.speed} m/s</span><span>·</span>
                <span>{region.capacity} capacity</span><span>·</span><span>{region.potential}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal Variation */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> Seasonal Wind Variation (Southern Ukraine)
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {seasonalData.map((m, i) => (
            <div key={i} className="p-2 rounded-lg text-center border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.15)' }}>
              <p className="text-[10px] text-muted-foreground">{m.month}</p>
              <p className="text-xs font-mono font-bold text-foreground">{m.speed}</p>
              <div className="h-1 rounded-full mt-1 mx-auto" style={{
                width: `${(m.speed / 8.5) * 100}%`,
                background: 'hsl(var(--primary))',
                opacity: 0.4 + (m.speed / 8.5) * 0.6,
                boxShadow: '0 0 4px hsl(var(--primary) / 0.3)',
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Strategy */}
      <div className="stalker-card p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Energy Strategy & EU Integration
        </h3>
        <div className="space-y-2">
          {[
            { title: 'Green Deal Alignment', text: 'Ukraine targets 25% renewable share by 2030, aligning with European Green Deal.' },
            { title: 'ENTSO-E Synchronization', text: 'Grid synchronization with continental Europe (March 2022) enables electricity exports.' },
            { title: 'Green Hydrogen', text: 'Wind-to-hydrogen production projected to make Ukraine a key green hydrogen supplier to EU.' },
          ].map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
              <p className="text-xs font-semibold text-foreground">{item.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
          <p className="text-[10px] font-semibold text-foreground mb-2">Development Timeline</p>
          <div className="flex items-center justify-between text-[10px]">
            {[
              { year: '2019', val: '1.2 GW' }, { year: '2023', val: '1.67 GW' },
              { year: '2030', val: '10 GW', highlight: true }, { year: '2050', val: '70% RES' },
            ].map((t, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="flex-1 h-0.5 mx-1" style={{ background: 'linear-gradient(90deg, hsl(var(--primary) / 0.5), hsl(var(--primary) / 0.2))' }} />}
                <div className="text-center">
                  <Badge variant={t.highlight ? 'default' : 'outline'} className={`text-[9px] mb-0.5 ${!t.highlight ? 'border-primary/30 bg-primary/5 text-primary' : ''}`}>
                    {t.year}
                  </Badge>
                  <p className={t.highlight ? 'font-medium text-foreground' : 'text-muted-foreground'}>{t.val}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Accordions */}
      {[
        { value: 'grid', icon: Zap, title: 'Grid Integration & Frequency Regulation', items: [
          { title: 'Frequency Regulation', text: 'Ukrainian grid operates at 50 Hz ±0.2 Hz. Modern wind turbines provide synthetic inertia and primary frequency response within 200ms.' },
          { title: 'Balancing Markets', text: 'Wind plants participate in day-ahead, intraday, and balancing markets. Imbalance penalties incentivize accurate forecasting.' },
          { title: 'Curtailment & Storage', text: 'Grid congestion in southern regions causes 5–10% curtailment. Battery storage projects emerging.' },
          { title: 'Forecasting Accuracy', text: 'MCP methods achieve ±5% annual P50 accuracy. Day-ahead forecasts use NWP models with ±15% RMSE.' },
        ]},
        { value: 'windrose', icon: Wind, title: 'Understanding Wind Rose Diagrams', items: [
          { title: 'Winter (NW dominant)', text: 'Strong, consistent NW winds from continental high-pressure systems. 35–40% of annual energy.' },
          { title: 'Summer (Variable)', text: 'Thermal convection creates afternoon SW sea breezes. Lower speeds but good for VAWT sites.' },
        ]},
      ].map(section => (
        <Accordion key={section.value} type="single" collapsible>
          <AccordionItem value={section.value} className="border-0">
            <div className="stalker-card overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <section.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-semibold">{section.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-2">
                {section.items.map((item, i) => (
                  <div key={i} className="p-2.5 rounded-lg border" style={{ backgroundColor: 'hsl(222 28% 12%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
                    <p className="text-[10px] font-semibold text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.text}</p>
                  </div>
                ))}
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>
      ))}
    </div>
  );
};
