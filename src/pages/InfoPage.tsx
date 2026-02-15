import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Wind, Zap, ArrowLeft, BookOpen, Globe, Factory, 
  Calculator, Settings, Printer
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { WindEnergyFundamentals } from '@/components/info/WindEnergyFundamentals';
import { TurbineCategories } from '@/components/info/TurbineCategories';
import { PrintableComponents } from '@/components/info/PrintableComponents';
import { UkraineWindPotential } from '@/components/info/UkraineWindPotential';
import { TechnicalSpecs } from '@/components/info/TechnicalSpecs';
import { PrintingConsiderations } from '@/components/info/PrintingConsiderations';

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
          <Badge variant="outline" className="text-xs hidden sm:flex">
            <BookOpen className="w-3 h-3 mr-1" />
            Scientific Reference
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue="fundamentals" className="space-y-4 sm:space-y-6">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max gap-1 bg-card/50 p-1 h-auto">
              <TabsTrigger value="fundamentals" className="flex items-center gap-1.5 py-2 px-3 text-xs whitespace-nowrap">
                <Zap className="w-3.5 h-3.5" />
                Fundamentals
              </TabsTrigger>
              <TabsTrigger value="potential" className="flex items-center gap-1.5 py-2 px-3 text-xs whitespace-nowrap">
                <Globe className="w-3.5 h-3.5" />
                Wind Potential
              </TabsTrigger>
              <TabsTrigger value="turbines" className="flex items-center gap-1.5 py-2 px-3 text-xs whitespace-nowrap">
                <Settings className="w-3.5 h-3.5" />
                Turbines
              </TabsTrigger>
              <TabsTrigger value="printing" className="flex items-center gap-1.5 py-2 px-3 text-xs whitespace-nowrap">
                <Printer className="w-3.5 h-3.5" />
                3D Printing
              </TabsTrigger>
              <TabsTrigger value="components" className="flex items-center gap-1.5 py-2 px-3 text-xs whitespace-nowrap">
                <Factory className="w-3.5 h-3.5" />
                Components
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-1.5 py-2 px-3 text-xs whitespace-nowrap">
                <Calculator className="w-3.5 h-3.5" />
                Technical
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="fundamentals" className="space-y-4">
            <WindEnergyFundamentals />
          </TabsContent>

          <TabsContent value="potential" className="space-y-4">
            <UkraineWindPotential />
          </TabsContent>

          <TabsContent value="turbines" className="space-y-4">
            <TurbineCategories />
          </TabsContent>

          <TabsContent value="printing" className="space-y-4">
            <PrintingConsiderations />
          </TabsContent>

          <TabsContent value="components" className="space-y-4">
            <PrintableComponents />
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            <TechnicalSpecs />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default InfoPage;
