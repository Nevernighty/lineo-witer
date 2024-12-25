import { MapPin } from "lucide-react";

interface LocationDisplayProps {
  location: { lat: number; lon: number } | null;
}

export const LocationDisplay = ({ location }: LocationDisplayProps) => {
  if (!location) return <div className="text-stalker-muted">Acquiring location...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <MapPin className="w-5 h-5 text-stalker-accent" />
        <span className="text-sm text-stalker-muted">LOCATION</span>
      </div>
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
          <WindMap location={location} windSpeed={0} />
        </div>
      </div>
    </div>
  );
};