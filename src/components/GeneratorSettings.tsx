import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";
import { MaterialSelect } from "./settings/MaterialSelect";
import { WindDisplay } from "./settings/WindDisplay";
import { type WindGeneratorSpecs } from "@/utils/windCalculations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
    "Blade Design": [
      { value: "three-blade", label: "Three Blade" },
      { value: "two-blade", label: "Two Blade" },
      { value: "darrieus", label: "Darrieus" },
      { value: "savonius", label: "Savonius" }
    ],
    "Installation Type": [
      { value: "rooftop", label: "Rooftop" },
      { value: "freestanding", label: "Freestanding" },
      { value: "hybrid", label: "Hybrid" }
    ],
    "Power Category": [
      { value: "micro", label: "Micro" },
      { value: "small", label: "Small" },
      { value: "medium", label: "Medium" }
    ],
    "Purpose": [
      { value: "off-grid", label: "Off-Grid" },
      { value: "grid-tied", label: "Grid-Tied" }
    ]
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
            
            {Object.entries(categories).map(([category, options]) => (
              <div key={category} className="space-y-2">
                <Label>{category}</Label>
                <Select
                  value={currentSettings[category.toLowerCase().replace(" ", "") as keyof WindGeneratorSpecs] as string}
                  onValueChange={(value) =>
                    onSettingsChange({
                      ...currentSettings,
                      [category.toLowerCase().replace(" ", "")]: value,
                    })
                  }
                >
                  <SelectTrigger>
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