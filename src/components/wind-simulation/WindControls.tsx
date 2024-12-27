import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SimulationMode } from "./types";

interface WindControlsProps {
  windSpeed: number;
  windAngle: number;
  windCurve: number;
  particleDensity: number;
  selectedMode: SimulationMode;
  selectedObstacle: "tree" | "building" | "skyscraper";
  onWindSpeedChange: (value: number[]) => void;
  onWindAngleChange: (value: number[]) => void;
  onWindCurveChange: (value: number[]) => void;
  onParticleDensityChange: (value: number[]) => void;
  onModeChange: (mode: SimulationMode) => void;
  onObstacleTypeChange: (type: "tree" | "building" | "skyscraper") => void;
  onClearAll: () => void;
}

export const WindControls: React.FC<WindControlsProps> = ({
  windSpeed,
  windAngle,
  windCurve,
  particleDensity,
  selectedMode,
  selectedObstacle,
  onWindSpeedChange,
  onWindAngleChange,
  onWindCurveChange,
  onParticleDensityChange,
  onModeChange,
  onObstacleTypeChange,
  onClearAll,
}) => {
  return (
    <div className="space-y-4 p-4 bg-stalker-dark/30 rounded-lg backdrop-blur">
      <div className="space-y-2">
        <Label>Wind Speed: {windSpeed.toFixed(1)} m/s</Label>
        <Slider
          defaultValue={[windSpeed]}
          max={20}
          min={0}
          step={0.1}
          onValueChange={onWindSpeedChange}
        />
      </div>

      <div className="space-y-2">
        <Label>Wind Angle: {windAngle}°</Label>
        <Slider
          defaultValue={[windAngle]}
          max={360}
          min={0}
          step={1}
          onValueChange={onWindAngleChange}
        />
      </div>

      <div className="space-y-2">
        <Label>Wind Curve</Label>
        <Slider
          defaultValue={[windCurve]}
          max={1}
          min={0}
          step={0.1}
          onValueChange={onWindCurveChange}
        />
      </div>

      <div className="space-y-2">
        <Label>Particle Density</Label>
        <Slider
          defaultValue={[particleDensity]}
          max={200}
          min={10}
          step={10}
          onValueChange={onParticleDensityChange}
        />
      </div>

      <div className="space-y-2">
        <Label>Mode</Label>
        <div className="flex gap-2">
          <Button
            variant={selectedMode === "add" ? "default" : "outline"}
            onClick={() => onModeChange("add")}
            size="sm"
          >
            Add
          </Button>
          <Button
            variant={selectedMode === "move" ? "default" : "outline"}
            onClick={() => onModeChange("move")}
            size="sm"
          >
            Move
          </Button>
          <Button
            variant={selectedMode === "resize" ? "default" : "outline"}
            onClick={() => onModeChange("resize")}
            size="sm"
          >
            Resize
          </Button>
          <Button
            variant={selectedMode === "draw" ? "default" : "outline"}
            onClick={() => onModeChange("draw")}
            size="sm"
          >
            Draw
          </Button>
          <Button
            variant={selectedMode === "erase" ? "default" : "outline"}
            onClick={() => onModeChange("erase")}
            size="sm"
          >
            Erase
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Obstacle Type</Label>
        <RadioGroup
          defaultValue={selectedObstacle}
          onValueChange={(value) => onObstacleTypeChange(value as "tree" | "building" | "skyscraper")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="tree" id="tree" />
            <Label htmlFor="tree">Trees</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="building" id="building" />
            <Label htmlFor="building">Buildings</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="skyscraper" id="skyscraper" />
            <Label htmlFor="skyscraper">Skyscrapers</Label>
          </div>
        </RadioGroup>
      </div>

      <Button variant="destructive" onClick={onClearAll} size="sm">
        Clear All
      </Button>
    </div>
  );
};