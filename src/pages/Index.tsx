import { useState, useEffect } from "react";
import { Wind, Zap, MapPin, Settings, Recycle, HelpCircle, Cloud } from "lucide-react";
import { WindTurbine } from "@/components/WindTurbine";
import { WindMap } from "@/components/WindMap";
import { GeneratorSettings } from "@/components/GeneratorSettings";
import { GENERATOR_PRESETS, type WindGeneratorSpecs } from "@/utils/windCalculations";

const Index = () => {
  const [windSpeed, setWindSpeed] = useState<number>(0);
  const [power, setPower] = useState<number>(0);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [generatorSpecs, setGeneratorSpecs] = useState<WindGeneratorSpecs>(GENERATOR_PRESETS["GE Haliade-X 14"]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [weatherProvider, setWeatherProvider] = useState("openweather");
  const [timeFrame, setTimeFrame] = useState("hours");

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
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
            <Recycle 
              className="text-stalker-accent animate-spin-slow hover:animate-spin-hover transition-all" 
            />
            LINE-O 
            <Wind 
              className="text-stalker-accent animate-wiggle-slow group-hover:animate-wiggle-fast" 
            />
            WITER
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-stalker-muted">
              {location && !showWeather ? (
                <div className="text-right">
                  <div className="mb-1">City, Oblast</div>
                  <div className="mb-1">District</div>
                  <div className="flex items-center justify-end gap-1">
                    <span>{location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E</span>
                    <button 
                      onClick={() => setShowWeather(!showWeather)}
                      className="p-1 hover:text-stalker-accent transition-colors"
                    >
                      <MapPin size={24} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-right">
                  <div className="flex items-center justify-end gap-4 mb-2">
                    <select 
                      value={weatherProvider}
                      onChange={(e) => setWeatherProvider(e.target.value)}
                      className="stalker-input text-sm"
                    >
                      <option value="openweather">OpenWeather</option>
                      <option value="weatherapi">WeatherAPI</option>
                      <option value="tomorrow">Tomorrow.io</option>
                    </select>
                    <button 
                      onClick={() => setShowWeather(!showWeather)}
                      className="p-1 hover:text-stalker-accent transition-colors"
                    >
                      <Cloud size={24} />
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <button 
                      className={`px-2 py-1 rounded ${timeFrame === 'hours' ? 'bg-stalker-accent text-stalker-dark' : 'text-stalker-muted'}`}
                      onClick={() => setTimeFrame('hours')}
                    >
                      Hours
                    </button>
                    <button 
                      className={`px-2 py-1 rounded ${timeFrame === 'days' ? 'bg-stalker-accent text-stalker-dark' : 'text-stalker-muted'}`}
                      onClick={() => setTimeFrame('days')}
                    >
                      Days
                    </button>
                  </div>
                  <div className="text-stalker-muted">
                    Weather forecast coming soon...
                  </div>
                </div>
              )}
            </div>
            <button 
              className="stalker-button fixed top-6 right-6 lg:static" 
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="stalker-badge animate-glow">
          MONITORING ACTIVE
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Location Card */}
        <div className="stalker-card animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center justify-between mb-4">
            <MapPin className="w-5 h-5 text-stalker-accent" />
            <span className="text-sm text-stalker-muted">LOCATION</span>
          </div>
          {location ? (
            <div className="space-y-4">
              <div>
                <div className="text-xl font-bold mb-1">
                  {location.lat.toFixed(4)}°N
                </div>
                <div className="text-xl font-bold">
                  {location.lon.toFixed(4)}°E
                </div>
              </div>
              <div className="h-[300px]">
                <WindMap location={location} windSpeed={windSpeed} />
              </div>
            </div>
          ) : (
            <div className="text-stalker-muted">Acquiring location...</div>
          )}
        </div>

        {/* Generator Settings Card - Full Width */}
        <div className="stalker-card col-span-1 lg:col-span-3 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <h2 className="stalker-heading">Generator Settings</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="stalker-label">Generator Type</label>
                    <HelpCircle className="h-4 w-4 text-stalker-muted opacity-50 hover:opacity-100" />
                  </div>
                  <select 
                    className="stalker-input w-full"
                    value={generatorSpecs.type}
                    onChange={(e) => setGeneratorSpecs(GENERATOR_PRESETS[e.target.value])}
                  >
                    <option value="small">Small Wind Turbine</option>
                    <option value="medium">Medium Wind Turbine</option>
                    <option value="large">Large Wind Turbine</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="stalker-label">Installation Height (m)</label>
                    <HelpCircle className="h-4 w-4 text-stalker-muted opacity-50 hover:opacity-100" />
                  </div>
                  <input 
                    type="number" 
                    className="stalker-input w-full" 
                    value={generatorSpecs.height}
                    onChange={(e) => setGeneratorSpecs({
                      ...generatorSpecs,
                      height: parseFloat(e.target.value) || generatorSpecs.height
                    })}
                  />
                </div>
              </div>
            </div>
            
            {/* Wind Turbine Visualization */}
            <div className="h-full">
              <WindTurbine windSpeed={windSpeed} generatorSpecs={generatorSpecs} />
            </div>
          </div>
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
