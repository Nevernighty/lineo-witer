import { useState, useEffect } from "react";
import { Wind, Zap, MapPin, Settings, Recycle, HelpCircle, Cloud, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { WindTurbine } from "@/components/WindTurbine";
import { WindMap } from "@/components/WindMap";
import { GeneratorSettings } from "@/components/GeneratorSettings";
import { GENERATOR_PRESETS, type WindGeneratorSpecs } from "@/utils/windCalculations";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LocationDisplay } from "@/components/LocationDisplay";
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
    <div className="min-h-screen p-6 animate-fade-in">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
              <Recycle 
                className="text-stalker-accent animate-[spin_6s_linear_infinite] hover:animate-[spin_0.4s_linear_infinite] active:animate-[spin_0.2s_linear_infinite] transition-all" 
              />
              LINE-O 
              <Wind 
                className="text-stalker-accent animate-wiggle-slow group-hover:animate-wiggle-fast" 
              />
              WITER
            </h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/info" className="p-2 hover:text-stalker-accent transition-colors">
                  <Info className="w-5 h-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                View detailed information about wind turbines and 3D printing
              </TooltipContent>
            </Tooltip>
          </div>
          <HeaderControls 
            location={location}
            showWeather={showWeather}
            setShowWeather={setShowWeather}
            setSettingsOpen={setSettingsOpen}
          />
        </div>
        <div className="stalker-badge animate-glow">
          MONITORING ACTIVE
        </div>
      </header>

      {/* Main content layout */}
      <div className="flex flex-col gap-6">
        {/* Wind Speed Card */}
        <div className="stalker-card animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-4">
            <Wind className="w-5 h-5 text-stalker-accent" />
            <span className="text-sm text-stalker-muted">WIND SPEED</span>
          </div>
          <div className="text-4xl font-bold mb-2">{windSpeed} m/s</div>
          <div className="h-2 bg-stalker-dark rounded overflow-hidden">
            <div 
              className="h-full bg-stalker-accent transition-all duration-300"
              style={{ width: `${(windSpeed / 20) * 100}%` }}
            />
          </div>
        </div>

        {/* Power Output Card */}
        <div className="stalker-card animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-5 h-5 text-stalker-accent" />
            <span className="text-sm text-stalker-muted">POWER OUTPUT</span>
          </div>
          <div className="text-4xl font-bold mb-2">{power}W</div>
          <div className="h-2 bg-stalker-dark rounded overflow-hidden">
            <div 
              className="h-full bg-stalker-accent transition-all duration-300"
              style={{ width: `${(power / 1000) * 100}%` }}
            />
          </div>
        </div>

        {/* Location/Weather Card with Wind Animation */}
        <div className="stalker-card animate-fade-up" style={{ animationDelay: "0.3s" }}>
          {showWeather ? (
            <WeatherDisplay location={location} />
          ) : (
            <>
              <LocationDisplay location={location} />
              <div className="mt-4 p-4 bg-stalker-dark/30 rounded-lg">
                <WindAnimation windSpeed={windSpeed} width={300} height={200} />
              </div>
            </>
          )}
        </div>

        {/* Generator Settings Card */}
        <div className="stalker-card col-span-1 lg:col-span-3 animate-fade-up" style={{ animationDelay: "0.4s" }}>
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
