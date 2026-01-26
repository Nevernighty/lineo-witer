import { useState, useEffect } from "react";
import { Wind, Zap, Recycle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { WindTurbine } from "@/components/WindTurbine";
import { GeneratorSettings } from "@/components/GeneratorSettings";
import { GENERATOR_PRESETS, type WindGeneratorSpecs } from "@/utils/windCalculations";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WeatherDisplay } from "@/components/WeatherDisplay";
import { HeaderControls } from "@/components/HeaderControls";
import WindAnimation from "@/components/WindAnimation";

const Index = () => {
  const [windSpeed, setWindSpeed] = useState<number>(0);
  const [power, setPower] = useState<number>(0);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [generatorSpecs, setGeneratorSpecs] = useState<WindGeneratorSpecs>(GENERATOR_PRESETS["GE Haliade-X 14"]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showWeather, setShowWeather] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const newSpeed = 5 + Math.random() * 10;
      setWindSpeed(Number(newSpeed.toFixed(1)));
      setPower(Number((newSpeed * 100).toFixed(0)));
    }, 3000);

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
        }
      );
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-6 animate-fade-in flex flex-col">
      {/* Header */}
      <header className="mb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Recycle 
                className="text-primary w-6 h-6 md:w-8 md:h-8 animate-[spin_6s_linear_infinite] hover:animate-[spin_0.4s_linear_infinite]" 
              />
              <span className="text-foreground">LINE-O</span>
              <Wind className="text-primary w-5 h-5 md:w-6 md:h-6 animate-wiggle-slow" />
              <span className="text-foreground">WITER</span>
            </h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/info" className="p-1.5 rounded-lg hover:bg-card text-muted-foreground hover:text-primary transition-colors">
                  <Info className="w-4 h-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>View turbine info</TooltipContent>
            </Tooltip>
            <div className="stalker-badge text-xs">ACTIVE</div>
          </div>
          <HeaderControls 
            location={location}
            showWeather={showWeather}
            setShowWeather={setShowWeather}
            setSettingsOpen={setSettingsOpen}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Wind Speed */}
          <div className="stalker-card py-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <Wind className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Wind Speed</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{windSpeed} <span className="text-sm text-muted-foreground">m/s</span></div>
            <div className="h-1.5 bg-background rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(windSpeed / 20) * 100}%` }}
              />
            </div>
          </div>

          {/* Power Output */}
          <div className="stalker-card py-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Power</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{power} <span className="text-sm text-muted-foreground">W</span></div>
            <div className="h-1.5 bg-background rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(power / 1000) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Simulation/Weather Area - Takes remaining space */}
        <div className="stalker-card flex-1 min-h-[400px] md:min-h-[500px] p-0 overflow-hidden">
          {showWeather ? (
            <div className="p-4 h-full">
              <WeatherDisplay location={location} />
            </div>
          ) : (
            <div className="w-full h-full">
              <WindAnimation windSpeed={windSpeed} />
            </div>
          )}
        </div>

        {/* Generator Card */}
        <div className="stalker-card">
          <WindTurbine windSpeed={windSpeed} generatorSpecs={generatorSpecs} />
        </div>
      </div>

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
