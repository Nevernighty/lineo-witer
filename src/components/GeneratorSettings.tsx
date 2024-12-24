import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";
import { MaterialSelect } from "./settings/MaterialSelect";
import { WindDisplay } from "./settings/WindDisplay";
import { type WindGeneratorSpecs } from "@/utils/windCalculations";

interface GeneratorSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: WindGeneratorSpecs;
  onSettingsChange: (settings: WindGeneratorSpecs) => void;
  windSpeed: number;
}

export const GeneratorSettings = ({
  open,
  onOpenChange,
  currentSettings,
  onSettingsChange,
  windSpeed,
}: GeneratorSettingsProps) => {
  const [showHiddenValues, setShowHiddenValues] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="stalker-card max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Generator Configuration
          </DialogTitle>
          <button
            onClick={() => setShowHiddenValues(!showHiddenValues)}
            className="absolute right-6 top-6 text-stalker-muted hover:text-stalker-accent"
          >
            {showHiddenValues ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-6">
            <MaterialSelect 
              currentSettings={currentSettings}
              onSettingsChange={onSettingsChange}
            />
            {/* Add other setting components here */}
          </div>
          <div>
            <WindDisplay windSpeed={windSpeed} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
