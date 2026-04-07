import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { ArrowLeft, Wind, Zap, Recycle, Settings, Cloud, MapPin, Eye, EyeOff } from "lucide-react";
import { GeneratorSettings } from "@/components/GeneratorSettings";
import { GENERATOR_PRESETS, type WindGeneratorSpecs } from "@/utils/windCalculations";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WeatherDisplay } from "@/components/WeatherDisplay";
import { LoadingScreen } from "@/components/LoadingScreen";
import { MainMenu } from "@/components/MainMenu";
import { SimulationLoader } from "@/components/SimulationLoader";
import { AnimatePresence } from "framer-motion";
import { type Lang } from "@/utils/i18n";

const WindAnimation = lazy(() => import("@/components/WindAnimation"));

type AppState = 'loading' | 'menu' | 'simulation' | 'weather';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [simReady, setSimReady] = useState(false);
  const [windSpeed, setWindSpeed] = useState<number>(8);
  const [power, setPower] = useState<number>(800);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [generatorSpecs, setGeneratorSpecs] = useState<WindGeneratorSpecs>(GENERATOR_PRESETS["GE Haliade-X 14"]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showCoords, setShowCoords] = useState(false);
  const [lang, setLang] = useState<Lang>('ua');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setLocation({ lat: 50.45, lon: 30.52 })
      );
    }
  }, []);

  useEffect(() => {
    setPower(Math.round(windSpeed * windSpeed * 3.2));
  }, [windSpeed]);

  const handleLoadingComplete = useCallback(() => setAppState('menu'), []);

  const handleWeatherApply = (data: { windSpeed: number; temperature: number; humidity: number; windAngle: number }) => {
    setWindSpeed(data.windSpeed);
    setAppState('menu');
  };

  const handleStartSimulation = () => {
    setSimReady(false);
    setAppState('simulation');
    // Give lazy load time, then mark ready
    setTimeout(() => setSimReady(true), 1800);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      <AnimatePresence mode="wait">
        {/* Loading Screen */}
        {appState === 'loading' && (
          <LoadingScreen key="loading" onComplete={handleLoadingComplete} lang={lang} />
        )}

        {/* Main Menu */}
        {appState === 'menu' && (
          <MainMenu
            key="menu"
            lang={lang}
            onLangChange={setLang}
            onStartSimulation={handleStartSimulation}
            onOpenWeather={() => setAppState('weather')}
            onOpenSettings={() => setSettingsOpen(true)}
            windSpeed={windSpeed}
            power={power}
          />
        )}
      </AnimatePresence>

      {/* Simulation View */}
      {appState === 'simulation' && (
        <>
          <header className="flex-shrink-0 px-4 py-2 border-b border-border/50 bg-card/80 backdrop-blur-sm z-20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setAppState('menu')} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Recycle className="text-primary w-5 h-5 animate-[spin_6s_linear_infinite]" />
                <h1 className="text-lg font-bold tracking-tight">
                  <span className="text-foreground">LINE-O</span>
                  <Wind className="inline-block text-primary w-4 h-4 mx-1 animate-wiggle-slow" />
                  <span className="text-foreground">WITER</span>
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-background/50 rounded-lg border border-border/30">
                  <Wind className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono text-primary">{windSpeed.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">m/s</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-background/50 rounded-lg border border-border/30">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono text-primary">{power}</span>
                  <span className="text-xs text-muted-foreground">W</span>
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
                {location && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-background/50 rounded-lg border border-border/30">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span className="text-xs font-mono text-muted-foreground">
                      {showCoords ? `${location.lat.toFixed(2)}°, ${location.lon.toFixed(2)}°` : '••.••°'}
                    </span>
                    <button onClick={() => setShowCoords(!showCoords)} className="text-muted-foreground hover:text-primary">
                      {showCoords ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                )}
                <button className="p-1.5 rounded bg-background/50 border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  onClick={() => setSettingsOpen(true)}>
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>
          <main className="flex-1 min-h-0 relative">
            <Suspense fallback={<SimulationLoader lang={lang} />}>
              {!simReady && <SimulationLoader lang={lang} />}
              <WindAnimation windSpeed={windSpeed} onWindSpeedChange={setWindSpeed} lang={lang} />
            </Suspense>
          </main>
        </>
      )}

      {/* Weather View */}
      {appState === 'weather' && (
        <>
          <header className="flex-shrink-0 px-4 py-2 border-b border-border/50 bg-card/80 backdrop-blur-sm z-20">
            <div className="flex items-center gap-3">
              <button onClick={() => setAppState('menu')} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Cloud className="w-5 h-5 text-primary" />
              <span className="text-foreground font-semibold">{lang === 'ua' ? 'Погода' : 'Weather'}</span>
            </div>
          </header>
          <main className="flex-1 min-h-0 overflow-auto p-4 eng-scrollbar">
            <div className="max-w-5xl mx-auto">
              <WeatherDisplay location={location} lang={lang} onApplyToSimulation={handleWeatherApply} />
            </div>
          </main>
        </>
      )}

      <GeneratorSettings
        open={settingsOpen} onOpenChange={setSettingsOpen}
        currentSettings={generatorSpecs} onSettingsChange={setGeneratorSpecs}
        windSpeed={windSpeed} lang={lang}
      />
    </div>
  );
};

export default Index;
