import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type WindGeneratorSpecs } from "@/utils/windCalculations";

interface MaterialSelectProps {
  currentSettings: WindGeneratorSpecs;
  onSettingsChange: (settings: WindGeneratorSpecs) => void;
}

export const MaterialSelect = ({ currentSettings, onSettingsChange }: MaterialSelectProps) => {
  const materials = [
    { value: "abs", label: "ABS" },
    { value: "petg", label: "PETG" },
    { value: "pla", label: "PLA" },
    { value: "pp", label: "PP" },
    { value: "metal", label: "Metal" },
    { value: "wood", label: "Wood" },
    { value: "carbon-fiber", label: "Carbon Fiber" },
    { value: "composite", label: "Composite" }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>Material</Label>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle className="h-4 w-4 text-stalker-muted opacity-50 hover:opacity-100" />
          </TooltipTrigger>
          <TooltipContent>Choose material based on durability and environmental impact</TooltipContent>
        </Tooltip>
      </div>
      <Select
        value={currentSettings.material}
        onValueChange={(value: any) =>
          onSettingsChange({ ...currentSettings, material: value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select material" />
        </SelectTrigger>
        <SelectContent>
          {materials.map((material) => (
            <SelectItem key={material.value} value={material.value}>
              {material.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};