import React, { useState } from 'react';
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
import { type Lang, t } from '@/utils/i18n';

const InfoPage = () => {
  const [lang, setLang] = useState<Lang>('ua');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold">{t('knowledgeBase', lang)}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-background/50 rounded-lg border border-border/30 p-0.5">
              <button onClick={() => setLang('ua')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${lang === 'ua' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                UA
              </button>
              <button onClick={() => setLang('en')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                EN
              </button>
            </div>
            <Badge variant="outline" className="text-xs hidden sm:flex">
              <BookOpen className="w-3 h-3 mr-1" />
              {t('scientificRef', lang)}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue="fundamentals" className="space-y-4 sm:space-y-6">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max gap-1 bg-card/50 p-1 h-auto">
              <TabsTrigger value="fundamentals" className="flex items-center gap-1.5 py-2 px-3 text-xs whitespace-nowrap">
                <Zap className="w-3.5 h-3.5" />
                {t('fundamentals', lang)}
              </TabsTrigger>
              <TabsTrigger value="potential" className="flex items-center gap-1.5 py-2 px-3 text-xs whitespace-nowrap">
                <Globe className="w-3.5 h-3.5" />
                {t('windPotential', lang)}
              </TabsTrigger>
              <TabsTrigger value="turbines" className="flex items-center gap-1.5 py-2 px-3 text-xs whitespace-nowrap">
                <Settings className="w-3.5 h-3.5" />
                {t('turbines', lang)}
              </TabsTrigger>
              <TabsTrigger value="printing" className="flex items-center gap-1.5 py-2 px-3 text-xs whitespace-nowrap">
                <Printer className="w-3.5 h-3.5" />
                {t('printing3d', lang)}
              </TabsTrigger>
              <TabsTrigger value="components" className="flex items-center gap-1.5 py-2 px-3 text-xs whitespace-nowrap">
                <Factory className="w-3.5 h-3.5" />
                {t('components', lang)}
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-1.5 py-2 px-3 text-xs whitespace-nowrap">
                <Calculator className="w-3.5 h-3.5" />
                {t('technical', lang)}
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="fundamentals" className="space-y-4">
            <WindEnergyFundamentals lang={lang} />
          </TabsContent>
          <TabsContent value="potential" className="space-y-4">
            <UkraineWindPotential lang={lang} />
          </TabsContent>
          <TabsContent value="turbines" className="space-y-4">
            <TurbineCategories lang={lang} />
          </TabsContent>
          <TabsContent value="printing" className="space-y-4">
            <PrintingConsiderations lang={lang} />
          </TabsContent>
          <TabsContent value="components" className="space-y-4">
            <PrintableComponents lang={lang} />
          </TabsContent>
          <TabsContent value="technical" className="space-y-4">
            <TechnicalSpecs lang={lang} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default InfoPage;
