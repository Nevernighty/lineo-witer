import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wind, Zap, ArrowLeft, BookOpen, Gauge, Factory, 
  Leaf, TrendingUp, Globe, Battery, Settings, Thermometer,
  FileText, Calculator, Target
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { WindEnergyFundamentals } from '@/components/info/WindEnergyFundamentals';
import { TurbineCategories } from '@/components/info/TurbineCategories';
import { PrintableComponents } from '@/components/info/PrintableComponents';
import { UkraineWindPotential } from '@/components/info/UkraineWindPotential';
import { TechnicalSpecs } from '@/components/info/TechnicalSpecs';

const InfoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold">Wind Energy Knowledge Base</h1>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            <BookOpen className="w-3 h-3 mr-1" />
            Scientific Reference
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="fundamentals" className="space-y-6">
          <TabsList className="grid grid-cols-5 gap-2 bg-card/50 p-1 h-auto">
            <TabsTrigger value="fundamentals" className="flex items-center gap-2 py-2 text-xs">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Fundamentals</span>
            </TabsTrigger>
            <TabsTrigger value="potential" className="flex items-center gap-2 py-2 text-xs">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Wind Potential</span>
            </TabsTrigger>
            <TabsTrigger value="turbines" className="flex items-center gap-2 py-2 text-xs">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Turbines</span>
            </TabsTrigger>
            <TabsTrigger value="printing" className="flex items-center gap-2 py-2 text-xs">
              <Factory className="w-4 h-4" />
              <span className="hidden sm:inline">3D Printing</span>
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center gap-2 py-2 text-xs">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Technical</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fundamentals" className="space-y-6">
            <WindEnergyFundamentals />
          </TabsContent>

          <TabsContent value="potential" className="space-y-6">
            <UkraineWindPotential />
          </TabsContent>

          <TabsContent value="turbines" className="space-y-6">
            <TurbineCategories />
          </TabsContent>

          <TabsContent value="printing" className="space-y-6">
            <PrintableComponents />
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <TechnicalSpecs />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default InfoPage;
