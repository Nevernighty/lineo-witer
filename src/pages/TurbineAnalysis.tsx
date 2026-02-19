import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { WindTurbine } from "@/components/WindTurbine";
import { GeneratorSettings } from "@/components/GeneratorSettings";
import { WindGenerationCharts } from "@/components/charts/WindGenerationCharts";
import { GENERATOR_PRESETS, type WindGeneratorSpecs } from "@/utils/windCalculations";
import { type Lang } from "@/utils/i18n";

const TurbineAnalysis = () => {
  const [windSpeed] = useState(8);
  const [generatorSpecs, setGeneratorSpecs] = useState<WindGeneratorSpecs>(GENERATOR_PRESETS["GE Haliade-X 14"]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lang] = useState<Lang>('ua');

  const label = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 py-3 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">{label('Аналіз турбіни', 'Turbine Analysis')}</h1>
        </div>
        <button
          className="p-1.5 rounded bg-background/50 border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="w-4 h-4" />
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="stalker-card p-4">
            <WindTurbine windSpeed={windSpeed} generatorSpecs={generatorSpecs} lang={lang} />
          </div>
          <div className="stalker-card p-4">
            <WindGenerationCharts windSpeed={windSpeed} generatorSpecs={generatorSpecs} />
          </div>
        </div>
      </main>

      <GeneratorSettings
        open={settingsOpen} onOpenChange={setSettingsOpen}
        currentSettings={generatorSpecs} onSettingsChange={setGeneratorSpecs}
        windSpeed={windSpeed} lang={lang}
      />
    </div>
  );
};

export default TurbineAnalysis;
