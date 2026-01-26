import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, Wind, Zap, TrendingUp, 
  MapPin, Factory, Leaf, Target
} from 'lucide-react';

export const UkraineWindPotential = () => {
  const regions = [
    { name: 'Zaporizhzhia Oblast', potential: 'Very High', speed: '7.5-8.5', capacity: '2,500 MW', status: 'operational' },
    { name: 'Kherson Oblast', potential: 'Very High', speed: '7.0-8.0', capacity: '1,800 MW', status: 'operational' },
    { name: 'Mykolaiv Oblast', potential: 'High', speed: '6.5-7.5', capacity: '1,200 MW', status: 'developing' },
    { name: 'Odesa Oblast', potential: 'High', speed: '6.5-7.5', capacity: '1,500 MW', status: 'developing' },
    { name: 'Lviv Oblast', potential: 'Medium', speed: '5.5-6.5', capacity: '600 MW', status: 'planned' },
    { name: 'Carpathian Mountains', potential: 'Medium-High', speed: '6.0-7.0', capacity: '800 MW', status: 'planned' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase">Technical Potential</span>
          </div>
          <p className="text-2xl font-bold text-foreground">438 TWh/yr</p>
          <p className="text-xs text-muted-foreground mt-1">National assessment 2023</p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Factory className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground uppercase">Installed (2023)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">1.67 GW</p>
          <p className="text-xs text-muted-foreground mt-1">Active wind capacity</p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-xs text-muted-foreground uppercase">2030 Target</span>
          </div>
          <p className="text-2xl font-bold text-foreground">10 GW</p>
          <p className="text-xs text-muted-foreground mt-1">National energy plan</p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-muted-foreground uppercase">CO₂ Avoided</span>
          </div>
          <p className="text-2xl font-bold text-foreground">65%</p>
          <p className="text-xs text-muted-foreground mt-1">vs 1990 by 2030 (NDC2)</p>
        </Card>
      </div>

      {/* Wind Resource Map Description */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Wind Energy Potential of Ukraine
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              According to the Institute of Renewable Energy (IVE NAN Ukraine), Ukraine possesses 
              significant wind energy resources, particularly in southern and southeastern regions.
              The technically achievable wind potential (TDVP) accounts for terrain, infrastructure,
              and grid constraints.
            </p>
            
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Wind Speed Distribution (100m height)</h4>
              {[
                { range: '> 8.0 m/s', percent: 5, color: 'bg-red-500' },
                { range: '7.0-8.0 m/s', percent: 15, color: 'bg-orange-500' },
                { range: '6.0-7.0 m/s', percent: 30, color: 'bg-yellow-500' },
                { range: '5.0-6.0 m/s', percent: 35, color: 'bg-green-500' },
                { range: '< 5.0 m/s', percent: 15, color: 'bg-blue-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded ${item.color}`} />
                  <span className="text-xs w-24">{item.range}</span>
                  <Progress value={item.percent} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground w-10">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Key Regions for Wind Development</h4>
            <div className="space-y-2">
              {regions.map((region, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span className="text-sm">{region.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">{region.speed} m/s</span>
                    <Badge 
                      variant="outline" 
                      className={
                        region.status === 'operational' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                        region.status === 'developing' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }
                    >
                      {region.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Energy Strategy */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          National Energy Strategy & EU Integration
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="text-sm font-semibold text-primary mb-2">Green Deal Alignment</h4>
            <p className="text-xs text-muted-foreground">
              Ukraine's energy strategy aligns with European Green Deal targets.
              The National Plan for RES Development (NPD VDE) aims for 25% renewable share by 2030,
              exceeding NDC2 commitments.
            </p>
          </div>
          
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">ENTSO-E Integration</h4>
            <p className="text-xs text-muted-foreground">
              Successful synchronization with European continental grid (ENTSO-E) in March 2022
              enables electricity exports and improves grid stability for renewable integration.
            </p>
          </div>
          
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
            <h4 className="text-sm font-semibold text-green-400 mb-2">Hydrogen Potential</h4>
            <p className="text-xs text-muted-foreground">
              Wind-to-hydrogen production (green hydrogen) scenarios project significant export
              potential. Ukraine could become a key supplier of green hydrogen to EU markets.
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-card border border-border rounded-lg">
          <h4 className="text-sm font-semibold mb-3">Development Timeline</h4>
          <div className="flex items-center justify-between text-xs">
            <div className="text-center">
              <Badge variant="outline" className="mb-1">2019</Badge>
              <p className="text-muted-foreground">1.2 GW</p>
            </div>
            <div className="flex-1 h-1 bg-gradient-to-r from-blue-500 to-primary mx-2" />
            <div className="text-center">
              <Badge variant="outline" className="mb-1">2023</Badge>
              <p className="text-muted-foreground">1.67 GW</p>
            </div>
            <div className="flex-1 h-1 bg-gradient-to-r from-primary to-green-500 mx-2" />
            <div className="text-center">
              <Badge className="mb-1 bg-primary">2030</Badge>
              <p className="text-foreground font-medium">10 GW</p>
            </div>
            <div className="flex-1 h-1 bg-gradient-to-r from-green-500 to-green-400 mx-2" />
            <div className="text-center">
              <Badge variant="outline" className="mb-1">2050</Badge>
              <p className="text-muted-foreground">70% RES</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Technical Infrastructure */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-4">Grid Integration Considerations</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Balancing Requirements</p>
                <p className="text-xs text-muted-foreground">
                  Large-scale wind integration requires energy storage systems (SZE) and 
                  fast-response balancing capacity from GAES (pumped hydro) installations.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Factory className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Grid Infrastructure</p>
                <p className="text-xs text-muted-foreground">
                  Reinforcement of 330kV and 750kV transmission lines needed for optimal
                  power evacuation from wind-rich southern regions.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Wind className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Forecasting Systems</p>
                <p className="text-xs text-muted-foreground">
                  MCP (Measure-Correlate-Predict) methods enable long-term energy yield
                  predictions with ±5% annual accuracy for investment planning.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Market Participation</p>
                <p className="text-xs text-muted-foreground">
                  Wind plants participate in day-ahead (RDN), intraday (VDR), and 
                  balancing markets through designated balance-responsible parties (SVB).
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
