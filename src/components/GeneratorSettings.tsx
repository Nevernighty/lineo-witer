import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, QuestionMarkCircle } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GENERATOR_PRESETS, type WindGeneratorSpecs } from "@/utils/windCalculations";

interface GeneratorSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: WindGeneratorSpecs;
  onSettingsChange: (settings: WindGeneratorSpecs) => void;
}

export const GeneratorSettings = ({
  open,
  onOpenChange,
  currentSettings,
  onSettingsChange,
}: GeneratorSettingsProps) => {
  const [showSecretValues, setShowSecretValues] = useState(false);
  const [localSettings, setLocalSettings] = useState<WindGeneratorSpecs>(currentSettings);

  const handlePresetChange = (type: string) => {
    const newSettings = GENERATOR_PRESETS[type];
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleNumberInput = (field: keyof WindGeneratorSpecs, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newSettings = { ...localSettings, [field]: numValue };
      setLocalSettings(newSettings);
      onSettingsChange(newSettings);
    }
  };

  const tooltips = {
    height: "Installation height affects wind speed due to wind shear. Higher installations typically experience stronger winds.",
    diameter: "Rotor diameter determines the swept area. Larger area captures more wind energy but requires stronger support.",
    efficiency: "Overall system efficiency including mechanical and electrical losses.",
    cutInSpeed: "Minimum wind speed required for power generation.",
    cutOutSpeed: "Maximum safe operating wind speed.",
    ratedSpeed: "Wind speed at which rated power is achieved.",
    ratedPower: "Maximum power output of the generator."
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="stalker-card max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Generator Configuration
            <button
              onClick={() => setShowSecretValues(!showSecretValues)}
              className="text-stalker-muted hover:text-stalker-accent"
            >
              {showSecretValues ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label>Generator Type</Label>
            <select
              className="stalker-input"
              value={localSettings.type}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              <option value="small">Small Wind Turbine</option>
              <option value="medium">Medium Wind Turbine</option>
              <option value="large">Large Wind Turbine</option>
            </select>
          </div>

          {Object.entries(tooltips).map(([key, tooltip]) => (
            <div key={key} className="grid gap-2">
              <div className="flex items-center gap-2">
                <Label>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                <Tooltip content={tooltip}>
                  <QuestionMarkCircle className="h-4 w-4 text-stalker-muted opacity-50 hover:opacity-100" />
                </Tooltip>
              </div>
              <Input
                type={showSecretValues ? "number" : "password"}
                value={localSettings[key as keyof WindGeneratorSpecs]}
                onChange={(e) => handleNumberInput(key as keyof WindGeneratorSpecs, e.target.value)}
                className="stalker-input"
                step="any"
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};