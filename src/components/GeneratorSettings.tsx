import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import { MaterialSelect } from "./settings/MaterialSelect";
import { WindDisplay } from "./settings/WindDisplay";
import { type WindGeneratorSpecs } from "@/utils/windCalculations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import WindAnimation from "./WindAnimation";

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

  const categories = {
    "Blade Design": {
      options: [
        { value: "three-blade", label: "Three Blade" },
        { value: "two-blade", label: "Two Blade" },
        { value: "darrieus", label: "Darrieus" },
        { value: "savonius", label: "Savonius" }
      ],
      description: "Different blade configurations affect efficiency and noise levels. Three-blade designs offer the best balance of efficiency and stability."
    },
    "Installation Type": {
      options: [
        { value: "rooftop", label: "Rooftop" },
        { value: "freestanding", label: "Freestanding" },
        { value: "hybrid", label: "Hybrid" }
      ],
      description: "The mounting location impacts performance. Rooftop installations can leverage building updrafts, while freestanding units need clear wind access."
    },
    "Power Category": {
      options: [
        { value: "micro", label: "Micro" },
        { value: "small", label: "Small" },
        { value: "medium", label: "Medium" }
      ],
      description: "Power categories determine output capacity. Micro units (<1kW) suit small applications, while medium units (1-5kW) can power entire homes."
    },
    "Purpose": {
      options: [
        { value: "off-grid", label: "Off-Grid" },
        { value: "grid-tied", label: "Grid-Tied" }
      ],
      description: "Grid-tied systems feed excess power back to the grid, while off-grid systems require battery storage for energy independence."
    }
  };

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <MaterialSelect 
              currentSettings={currentSettings}
              onSettingsChange={onSettingsChange}
            />
            
            {Object.entries(categories).map(([category, { options, description }]) => (
              <div key={category} className="space-y-2 group">
                <div className="flex items-center gap-2">
                  <Label>{category}</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-stalker-muted opacity-50 group-hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      className="max-w-[300px] p-4"
                      sideOffset={5}
                      align="start"
                      alignOffset={-50}
                    >
                      {description}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={currentSettings[category.toLowerCase().replace(" ", "") as keyof WindGeneratorSpecs] as string}
                  onValueChange={(value) =>
                    onSettingsChange({
                      ...currentSettings,
                      [category.toLowerCase().replace(" ", "")]: value,
                    })
                  }
                >
                  <SelectTrigger className="group-hover:border-stalker-accent/30 transition-colors">
                    <SelectValue placeholder={`Select ${category}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          
          <div className="space-y-6">
            <div className="p-4 bg-stalker-dark/30 rounded-lg">
              <WindAnimation windSpeed={windSpeed} width={400} height={300} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};