import { useState, useEffect } from "react";
import { Wind, Zap, MapPin, Settings } from "lucide-react";

const Index = () => {
  const [windSpeed, setWindSpeed] = useState<number>(0);
  const [power, setPower] = useState<number>(0);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    // Simulate wind speed updates
    const interval = setInterval(() => {
      const newSpeed = 5 + Math.random() * 10;
      setWindSpeed(Number(newSpeed.toFixed(1)));
      setPower(Number((newSpeed * 100).toFixed(0)));
    }, 3000);

    // Get user location
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
          <h1 className="text-4xl font-bold tracking-tight">
            LINE-O WITER
          </h1>
          <button className="stalker-button">
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <div className="stalker-badge animate-glow">
          MONITORING ACTIVE
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        <div className="stalker-card animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center justify-between mb-4">
            <MapPin className="w-5 h-5 text-stalker-accent" />
            <span className="text-sm text-stalker-muted">LOCATION</span>
          </div>
          {location ? (
            <div>
              <div className="text-xl font-bold mb-1">
                {location.lat.toFixed(4)}°N
              </div>
              <div className="text-xl font-bold">
                {location.lon.toFixed(4)}°E
              </div>
            </div>
          ) : (
            <div className="text-stalker-muted">Acquiring location...</div>
          )}
        </div>

        <div className="stalker-card col-span-1 md:col-span-2 lg:col-span-3 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <h2 className="stalker-heading">Generator Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="stalker-label">Generator Type</label>
              <select className="stalker-input w-full">
                <option>Vertical Axis Turbine</option>
                <option>Horizontal Axis Turbine</option>
                <option>Custom Generator</option>
              </select>
            </div>
            <div>
              <label className="stalker-label">Installation Height (m)</label>
              <input type="number" className="stalker-input w-full" defaultValue={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;