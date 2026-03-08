import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wind, Zap, ArrowLeft, BookOpen, Globe, Factory, 
  Calculator, Settings, Printer
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WindEnergyFundamentals } from '@/components/info/WindEnergyFundamentals';
import { TurbineCategories } from '@/components/info/TurbineCategories';
import { PrintableComponents } from '@/components/info/PrintableComponents';
import { UkraineWindPotential } from '@/components/info/UkraineWindPotential';
import { TechnicalSpecs } from '@/components/info/TechnicalSpecs';
import { PrintingConsiderations } from '@/components/info/PrintingConsiderations';
import { type Lang, t } from '@/utils/i18n';
import { motion, AnimatePresence } from 'framer-motion';

const tabItems = [
  { value: 'fundamentals', icon: Zap, label_ua: 'Основи', label_en: 'Fundamentals', color: 'hsl(120 100% 54%)' },
  { value: 'potential', icon: Globe, label_ua: 'Потенціал', label_en: 'Potential', color: 'hsl(210 90% 60%)' },
  { value: 'turbines', icon: Settings, label_ua: 'Турбіни', label_en: 'Turbines', color: 'hsl(25 90% 55%)' },
  { value: 'printing', icon: Printer, label_ua: '3D Друк', label_en: '3D Print', color: 'hsl(270 70% 60%)' },
  { value: 'components', icon: Factory, label_ua: 'Деталі', label_en: 'Parts', color: 'hsl(50 90% 55%)' },
  { value: 'technical', icon: Calculator, label_ua: 'Технічне', label_en: 'Technical', color: 'hsl(0 60% 55%)' },
];

const InfoPage = () => {
  const [lang, setLang] = useState<Lang>('ua');
  const [activeTab, setActiveTab] = useState('fundamentals');

  const renderContent = () => {
    switch (activeTab) {
      case 'fundamentals': return <WindEnergyFundamentals lang={lang} />;
      case 'potential': return <UkraineWindPotential lang={lang} />;
      case 'turbines': return <TurbineCategories lang={lang} />;
      case 'printing': return <PrintingConsiderations lang={lang} />;
      case 'components': return <PrintableComponents lang={lang} />;
      case 'technical': return <TechnicalSpecs lang={lang} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b backdrop-blur-sm" style={{ backgroundColor: 'hsl(222 28% 13% / 0.95)', borderColor: 'hsl(var(--border) / 0.3)' }}>
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
            <div className="flex rounded-lg p-0.5" style={{ backgroundColor: 'hsl(222 28% 10%)', border: '1px solid hsl(var(--border) / 0.3)' }}>
              <button onClick={() => setLang('ua')}
                className="px-2 py-1 rounded text-xs font-semibold transition-colors"
                style={{ background: lang === 'ua' ? 'hsl(var(--primary) / 0.15)' : 'transparent', color: lang === 'ua' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                UA
              </button>
              <button onClick={() => setLang('en')}
                className="px-2 py-1 rounded text-xs font-semibold transition-colors"
                style={{ background: lang === 'en' ? 'hsl(var(--primary) / 0.15)' : 'transparent', color: lang === 'en' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                EN
              </button>
            </div>
            <Badge variant="outline" className="text-xs hidden sm:flex border-primary/30 bg-primary/5 text-primary">
              <BookOpen className="w-3 h-3 mr-1" />
              {t('scientificRef', lang)}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 eng-scrollbar overflow-y-auto" style={{ maxHeight: 'calc(100vh - 56px)' }}>
        {/* Custom dark tabs */}
        <div className="mb-6 overflow-x-auto eng-scrollbar">
          <div className="flex gap-1 p-1.5 rounded-xl min-w-max" style={{ backgroundColor: 'hsl(222 28% 10% / 0.8)', border: '1px solid hsl(var(--border) / 0.3)' }}>
            {tabItems.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                  className="flex items-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-300 relative whitespace-nowrap"
                  style={{
                    background: isActive ? `linear-gradient(135deg, ${tab.color}18, ${tab.color}08)` : 'transparent',
                    color: isActive ? tab.color : 'hsl(var(--muted-foreground))',
                    boxShadow: isActive ? `0 2px 16px ${tab.color}25, inset 0 -2px 0 ${tab.color}` : 'none',
                  }}>
                  <Icon className="w-3.5 h-3.5" style={isActive ? { filter: `drop-shadow(0 0 4px ${tab.color})` } : {}} />
                  {lang === 'ua' ? tab.label_ua : tab.label_en}
                  {isActive && (
                    <motion.div layoutId="infoTabIndicator" className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{ backgroundColor: tab.color, boxShadow: `0 0 8px ${tab.color}` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default InfoPage;
