import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Gauge, Settings, Zap } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const turbineSpecs = [
  { model: 'Vestas V150-4.2', power: '4.2 MW', rotor: '150m', hub: '105-166m', cutIn: '3 m/s', cutOut: '25 m/s' },
  { model: 'Siemens SG 5.8-170', power: '5.8 MW', rotor: '170m', hub: '115-165m', cutIn: '3 m/s', cutOut: '25 m/s' },
  { model: 'GE Haliade-X 14', power: '14 MW', rotor: '220m', hub: '135m', cutIn: '3 m/s', cutOut: '28 m/s' },
  { model: 'Nordex N163/5.X', power: '5.7 MW', rotor: '163m', hub: '118-164m', cutIn: '3 m/s', cutOut: '25 m/s' },
  { model: 'Enercon E-138 EP3', power: '4.2 MW', rotor: '138m', hub: '81-160m', cutIn: '2 m/s', cutOut: '28 m/s' },
];

const economicMetrics = [
  { metric: 'LCOE (Onshore)', value: '€25-45/MWh', trend: '↓ 40% since 2015' },
  { metric: 'LCOE (Offshore)', value: '€50-80/MWh', trend: '↓ 50% since 2015' },
  { metric: 'Capacity Factor', value: '25-55%', trend: 'Improving with tech' },
  { metric: 'Project IRR', value: '8-12%', trend: 'Stable' },
  { metric: 'Payback Period', value: '7-12 years', trend: 'Shortening' },
];

export const TechnicalSpecs = () => {
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Modern Wind Turbine Specifications
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Power</TableHead>
                <TableHead>Rotor</TableHead>
                <TableHead>Hub Height</TableHead>
                <TableHead>Cut-in</TableHead>
                <TableHead>Cut-out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {turbineSpecs.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.model}</TableCell>
                  <TableCell><Badge variant="outline">{item.power}</Badge></TableCell>
                  <TableCell>{item.rotor}</TableCell>
                  <TableCell>{item.hub}</TableCell>
                  <TableCell>{item.cutIn}</TableCell>
                  <TableCell>{item.cutOut}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Economic Performance Metrics
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {economicMetrics.map((item, i) => (
            <div key={i} className="p-4 bg-card border border-border rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.metric}</p>
              <p className="text-xl font-bold text-foreground mt-1">{item.value}</p>
              <p className="text-xs text-primary mt-1">{item.trend}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
