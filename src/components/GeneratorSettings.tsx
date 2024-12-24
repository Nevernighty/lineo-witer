import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GENERATOR_PRESETS, type WindGeneratorSpecs } from "@/utils/windCalculations";

interface GeneratorSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: WindGeneratorSpecs;
  onSettingsChange: (settings: WindGeneratorSpecs) => void;
}

const tooltips = {
  axisOrientation: "Horizontal-axis turbines are more efficient in open areas, while vertical-axis turbines work better in urban environments",
  bladeDesign: "Three-blade designs are most common and efficient, while Savonius designs work better in low wind",
  installationType: "Choose based on your available space and local regulations",
  powerCategory: "Select based on your energy needs - micro for small devices, medium for full household",
  purpose: "Grid-tied systems can sell excess power, while off-grid systems provide independence",
  material: "Consider durability vs environmental impact"
};

export const GeneratorSettings = ({
  open,
  onOpenChange,
  currentSettings,
  onSettingsChange,
}: GeneratorSettingsProps) => {
  const [showHiddenValues, setShowHiddenValues] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="stalker-card max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Generator Configuration
            <button
              onClick={() => setShowHiddenValues(!showHiddenValues)}
              className="text-stalker-muted hover:text-stalker-accent"
            >
              {showHiddenValues ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6">
          <TooltipProvider>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Axis Orientation</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-stalker-muted opacity-50 hover:opacity-100" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltips.axisOrientation}</TooltipContent>
                  </Tooltip>
                </div>
                <RadioGroup
                  value={currentSettings.axisOrientation}
                  onValueChange={(value: "horizontal" | "vertical") =>
                    onSettingsChange({ ...currentSettings, axisOrientation: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="horizontal" id="horizontal" />
                    <Label htmlFor="horizontal">Horizontal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vertical" id="vertical" />
                    <Label htmlFor="vertical">Vertical</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Blade Design</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-stalker-muted opacity-50 hover:opacity-100" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltips.bladeDesign}</TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={currentSettings.bladeDesign}
                  onValueChange={(value: any) =>
                    onSettingsChange({ ...currentSettings, bladeDesign: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blade design" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="three-blade">Three Blade</SelectItem>
                    <SelectItem value="two-blade">Two Blade</SelectItem>
                    <SelectItem value="darrieus">Darrieus</SelectItem>
                    <SelectItem value="savonius">Savonius</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Installation Type</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-stalker-muted opacity-50 hover:opacity-100" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltips.installationType}</TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={currentSettings.installationType}
                  onValueChange={(value: any) =>
                    onSettingsChange({ ...currentSettings, installationType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select installation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rooftop">Rooftop</SelectItem>
                    <SelectItem value="freestanding">Freestanding</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Power Category</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-stalker-muted opacity-50 hover:opacity-100" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltips.powerCategory}</TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={currentSettings.powerCategory}
                  onValueChange={(value: any) =>
                    onSettingsChange({ ...currentSettings, powerCategory: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select power category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="micro">Micro</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Purpose</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-stalker-muted opacity-50 hover:opacity-100" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltips.purpose}</TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={currentSettings.purpose}
                  onValueChange={(value: any) =>
                    onSettingsChange({ ...currentSettings, purpose: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off-grid">Off-Grid</SelectItem>
                    <SelectItem value="grid-tied">Grid-Tied</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Material</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-stalker-muted opacity-50 hover:opacity-100" />
                    </TooltipTrigger>
                    <TooltipContent>{tooltips.material}</TooltipContent>
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
                    <SelectItem value="lightweight">Lightweight</SelectItem>
                    <SelectItem value="eco-friendly">Eco-Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};
