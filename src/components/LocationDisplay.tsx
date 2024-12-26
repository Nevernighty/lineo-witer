import { MapPin } from "lucide-react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface LocationDisplayProps {
  location: { lat: number; lon: number } | null;
}

export const LocationDisplay = ({ location }: LocationDisplayProps) => {
  const [showCoordinates, setShowCoordinates] = useState(false);

  if (!location) return <div className="text-stalker-muted">Acquiring location...</div>;

  const toggleCoordinates = () => setShowCoordinates(!showCoordinates);

  const maskedCoordinate = "••.••••°";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <MapPin className="w-5 h-5 text-stalker-accent" />
        <span className="text-sm text-stalker-muted">LOCATION</span>
      </div>
      <div className="space-y-4">
        <div className="relative">
          <div className="text-xl font-bold mb-1">
            {showCoordinates ? `${location.lat.toFixed(4)}°N` : maskedCoordinate}
          </div>
          <div className="text-xl font-bold">
            {showCoordinates ? `${location.lon.toFixed(4)}°E` : maskedCoordinate}
          </div>
          <button
            onClick={toggleCoordinates}
            className="absolute right-0 top-0 text-stalker-muted hover:text-stalker-accent transition-colors"
          >
            {showCoordinates ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};