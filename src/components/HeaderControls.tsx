import { MapPin, Cloud, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  return (
    <div className="flex items-center gap-4 w-full md:w-auto">
      <div className="text-sm text-stalker-muted flex-grow md:flex-grow-0">
        {location && (
          <div className="flex items-center justify-end gap-4">
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setShowWeather(false)}
                    className={`p-1 transition-colors ${!showWeather ? 'text-stalker-accent' : 'text-stalker-muted hover:text-stalker-accent'}`}
                  >
                    <MapPin size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Show Location
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setShowWeather(true)}
                    className={`p-1 transition-colors ${showWeather ? 'text-stalker-accent' : 'text-stalker-muted hover:text-stalker-accent'}`}
                  >
                    <Cloud size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Show Weather
                </TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="stalker-button" 
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Open Settings
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};