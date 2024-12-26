import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type WindGeneratorSpecs } from "@/utils/windCalculations";

interface MaterialSelectProps {
  currentSettings: WindGeneratorSpecs;
  onSettingsChange: (settings: WindGeneratorSpecs) => void;
}

const materialInfo = {
  abs: {
    efficiency: "Medium (65-75%)",
    source: "Petroleum-based",
    processing: "3-stage polymerization",
    environmental: "Moderate impact, recyclable",
    details: "Derived from acrylonitrile, butadiene, and styrene. Requires 2.5kg oil/1kg material."
  },
  petg: {
    efficiency: "High (75-85%)",
    source: "Modified PET plastic",
    processing: "2-stage modification",
    environmental: "Low impact, highly recyclable",
    details: "Modified from PET with cyclohexanedimethanol. Uses 30% less energy than ABS production."
  },
  pla: {
    efficiency: "Low-Medium (55-65%)",
    source: "Corn starch or sugarcane",
    processing: "Fermentation + polymerization",
    environmental: "Very low impact, biodegradable",
    details: "Requires 65% less energy than ABS. Produces 68% fewer greenhouse gases."
  },
  metal: {
    efficiency: "Very High (85-95%)",
    source: "Various ores",
    processing: "Mining, smelting, forming",
    environmental: "High impact, highly recyclable",
    details: "Typically aluminum or steel. Aluminum requires 45kWh/kg to produce."
  },
  wood: {
    efficiency: "Low (45-55%)",
    source: "Sustainable forestry",
    processing: "Harvesting, treatment",
    environmental: "Very low impact, biodegradable",
    details: "Requires 4MJ/kg to process. Carbon negative when sourced sustainably."
  },
  "carbon-fiber": {
    efficiency: "Extremely High (90-98%)",
    source: "Polyacrylonitrile fiber",
    processing: "Oxidation, carbonization",
    environmental: "High impact, difficult to recycle",
    details: "Requires 183-286MJ/kg to produce. 10x stronger than steel per weight."
  },
  composite: {
    efficiency: "High (80-90%)",
    source: "Mixed materials",
    processing: "Various processes",
    environmental: "Moderate-high impact",
    details: "Typically glass fiber + resin. Uses 50% less energy than carbon fiber."
  }
};

export const MaterialSelect = ({ currentSettings, onSettingsChange }: MaterialSelectProps) => {
  const materials = [
    { value: "abs", label: "ABS" },
    { value: "petg", label: "PETG" },
    { value: "pla", label: "PLA" },
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
          <TooltipContent 
            side="right" 
            className="max-w-[300px] p-4" 
            sideOffset={5}
            align="start"
            alignOffset={-50}
          >
            <div className="space-y-2">
              <p className="font-bold">Material Properties:</p>
              <p>Efficiency: {materialInfo[currentSettings.material as keyof typeof materialInfo].efficiency}</p>
              <p>Source: {materialInfo[currentSettings.material as keyof typeof materialInfo].source}</p>
              <p>Processing: {materialInfo[currentSettings.material as keyof typeof materialInfo].processing}</p>
              <p>Environmental Impact: {materialInfo[currentSettings.material as keyof typeof materialInfo].environmental}</p>
              <p className="text-xs mt-2">{materialInfo[currentSettings.material as keyof typeof materialInfo].details}</p>
            </div>
          </TooltipContent>
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