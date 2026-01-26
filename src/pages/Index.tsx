import { useState, useEffect } from "react";
import { Wind, Zap, Recycle, Info, Settings, Cloud, MapPin, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { WindTurbine } from "@/components/WindTurbine";
import { GeneratorSettings } from "@/components/GeneratorSettings";
import { GENERATOR_PRESETS, type WindGeneratorSpecs } from "@/utils/windCalculations";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WeatherDisplay } from "@/components/WeatherDisplay";
import WindAnimation from "@/components/WindAnimation";

const Index = () => {
  const [windSpeed, setWindSpeed] = useState<number>(8);
  const [power, setPower] = useState<number>(800);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [generatorSpecs, setGeneratorSpecs] = useState<WindGeneratorSpecs>(GENERATOR_PRESETS["GE Haliade-X 14"]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showCoords, setShowCoords] = useState(false);
  const [showTurbinePanel, setShowTurbinePanel] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Set default location if geolocation fails
          setLocation({ lat: 50.45, lon: 30.52 });
        }
      );
    }
  }, []);

  // Update power based on wind speed
  useEffect(() => {
    const calculatedPower = Math.round(windSpeed * windSpeed * 3.2);
    setPower(calculatedPower);
  }, [windSpeed]);

  const handleWindSpeedChange = (speed: number) => {
    setWindSpeed(speed);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      {/* Compact Header */}
      <header className="flex-shrink-0 px-4 py-2 border-b border-border/50 bg-card/80 backdrop-blur-sm z-20">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Recycle className="text-primary w-5 h-5 animate-[spin_6s_linear_infinite]" />
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-foreground">LINE-O</span>
              <Wind className="inline-block text-primary w-4 h-4 mx-1 animate-wiggle-slow" />
              <span className="text-foreground">WITER</span>
            </h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/info" className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                  <Info className="w-4 h-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Wind Energy Info</TooltipContent>
            </Tooltip>
          </div>

          {/* Stats Bar */}
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

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Location */}
            {location && (
              <div className="flex items-center gap-2 px-2 py-1 bg-background/50 rounded-lg border border-border/30">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="text-xs font-mono text-muted-foreground">
                  {showCoords ? `${location.lat.toFixed(2)}°, ${location.lon.toFixed(2)}°` : '••.••°'}
                </span>
                <button 
                  onClick={() => setShowCoords(!showCoords)}
                  className="text-muted-foreground hover:text-primary"
                >
                  {showCoords ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            )}

            {/* View Toggle */}
            <div className="flex gap-1 bg-background/50 rounded-lg border border-border/30 p-0.5">
              <button 
                onClick={() => setShowWeather(false)}
                className={`p-1.5 rounded text-xs transition-colors ${!showWeather ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'}`}
              >
                <Wind size={14} />
              </button>
              <button 
                onClick={() => setShowWeather(true)}
                className={`p-1.5 rounded text-xs transition-colors ${showWeather ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'}`}
              >
                <Cloud size={14} />
              </button>
            </div>

            {/* Turbine Info Toggle */}
            <button
              onClick={() => setShowTurbinePanel(!showTurbinePanel)}
              className={`p-1.5 rounded border transition-colors ${showTurbinePanel ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-background/50 border-border/30 text-muted-foreground hover:text-primary'}`}
            >
              <Zap size={14} />
            </button>

            {/* Settings */}
            <button 
              className="p-1.5 rounded bg-background/50 border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors" 
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Full remaining height */}
      <main className="flex-1 min-h-0 relative">
        {showWeather ? (
          <div className="h-full p-4 overflow-auto">
            <div className="stalker-card max-w-2xl mx-auto">
              <WeatherDisplay location={location} />
            </div>
          </div>
        ) : (
          <div className="h-full w-full">
            <WindAnimation 
              windSpeed={windSpeed} 
              onWindSpeedChange={handleWindSpeedChange}
            />
          </div>
        )}

        {/* Turbine Panel - Slide out from right */}
        {showTurbinePanel && (
          <div className="absolute top-0 right-0 h-full w-80 bg-card/95 backdrop-blur-sm border-l border-border/50 z-10 overflow-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Generator Info</h3>
                <button 
                  onClick={() => setShowTurbinePanel(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
              <WindTurbine windSpeed={windSpeed} generatorSpecs={generatorSpecs} />
            </div>
          </div>
        )}
      </main>

      {/* Settings Dialog */}
      <GeneratorSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        currentSettings={generatorSpecs}
        onSettingsChange={setGeneratorSpecs}
        windSpeed={windSpeed}
      />
    </div>
  );
};

export default Index;
