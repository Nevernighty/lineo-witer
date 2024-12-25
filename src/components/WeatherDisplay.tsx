import { Cloud } from "lucide-react";

interface WeatherDisplayProps {
  location: { lat: number; lon: number } | null;
}

export const WeatherDisplay = ({ location }: WeatherDisplayProps) => {
  if (!location) return <div className="text-stalker-muted">Acquiring location...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Cloud className="w-5 h-5 text-stalker-accent" />
        <span className="text-sm text-stalker-muted">WEATHER FORECAST</span>
      </div>
      <div className="text-stalker-muted text-center py-8">
        Weather forecast coming soon...
      </div>
    </div>
  );
};