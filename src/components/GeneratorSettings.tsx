import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, HelpCircle, Globe, Ruler, Type, MapPin } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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
  const [language, setLanguage] = useState("en");
  const [units, setUnits] = useState("metric");
  const [uiSize, setUiSize] = useState("medium");
  const [showCoordinates, setShowCoordinates] = useState(false);

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
    ratedSpeed: "Wind speed at which rated power is achieved.",
    ratedPower: "Maximum power output of the generator.",
    sustainabilityFocus: "Environmental and sustainability features of the turbine design."
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="stalker-card max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Generator Configuration
            <div className="flex gap-2">
              <button
                onClick={() => setShowSecretValues(!showSecretValues)}
                className="text-stalker-muted hover:text-stalker-accent"
              >
                {showSecretValues ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Location Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin size={24} className="text-stalker-accent" />
                <div>
                  <div className="text-sm text-stalker-muted">Country: Ukraine</div>
                  <div className="text-sm text-stalker-muted">City: Kyiv</div>
                  <button
                    onMouseEnter={() => setShowCoordinates(true)}
                    onMouseLeave={() => setShowCoordinates(false)}
                    className="text-stalker-muted hover:text-stalker-accent"
                  >
                    {showCoordinates ? "50.4501° N, 30.5234° E" : "**.****° *, **.****° *"}
                  </button>
                </div>
              </div>
            </div>

            {/* Interface Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-stalker-muted" />
                <Label>Language</Label>
              </div>
              <select
                className="stalker-input w-full"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="uk">Ukrainian</option>
              </select>

              <div className="flex items-center gap-2">
                <Ruler size={16} className="text-stalker-muted" />
                <Label>Units</Label>
              </div>
              <select
                className="stalker-input w-full"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
              >
                <option value="metric">Metric (m/s, meters)</option>
                <option value="imperial">Imperial (mph, feet)</option>
              </select>

              <div className="flex items-center gap-2">
                <Type size={16} className="text-stalker-muted" />
                <Label>UI Size</Label>
              </div>
              <select
                className="stalker-input w-full"
                value={uiSize}
                onChange={(e) => setUiSize(e.target.value)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Generator Type</Label>
              <select
                className="stalker-input w-full"
                value={localSettings.design}
                onChange={(e) => handlePresetChange(e.target.value)}
              >
                {Object.entries(GENERATOR_PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.design} ({preset.type})
                  </option>
                ))}
              </select>
            </div>

            <TooltipProvider>
              {Object.entries(tooltips).map(([key, tooltip]) => (
                <div key={key} className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-stalker-muted opacity-50 hover:opacity-100" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tooltip}</p>
                      </TooltipContent>
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
            </TooltipProvider>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};