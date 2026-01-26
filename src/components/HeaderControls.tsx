import { MapPin, Cloud, Settings, Eye, EyeOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

interface HeaderControlsProps {
  location: { lat: number; lon: number } | null;
  showWeather: boolean;
  setShowWeather: (show: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
}

export const HeaderControls = ({ 
  location, 
  showWeather, 
  setShowWeather, 
  setSettingsOpen 
}: HeaderControlsProps) => {
  const [showCoords, setShowCoords] = useState(false);

  return (
    <div className="flex items-center gap-3 w-full md:w-auto">
      {/* Location Display in Nav */}
      {location && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50">
          <MapPin className="w-4 h-4 text-primary" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-foreground">
              {showCoords ? (
                <>{location.lat.toFixed(2)}°N, {location.lon.toFixed(2)}°E</>
              ) : (
                <>••.••°N, ••.••°E</>
              )}
            </span>
            <button
              onClick={() => setShowCoords(!showCoords)}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {showCoords ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* View Toggle Buttons */}
      {location && (
        <div className="flex gap-1 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => setShowWeather(false)}
                className={`p-1.5 rounded transition-colors ${!showWeather ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'}`}
              >
                <MapPin size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Show Simulation</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => setShowWeather(true)}
                className={`p-1.5 rounded transition-colors ${showWeather ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'}`}
              >
                <Cloud size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Show Weather</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Settings Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            className="p-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors" 
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Open Settings</TooltipContent>
      </Tooltip>
    </div>
  );
};
