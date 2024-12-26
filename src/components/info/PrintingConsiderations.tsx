import { Card } from "@/components/ui/card";

export const PrintingConsiderations = () => {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Key Considerations for 3D Printing</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Blade Design</h3>
            <p className="text-stalker-muted">
              Aerodynamic optimization using CAD tools (Fusion 360, SolidWorks)
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Material Selection</h3>
            <p className="text-stalker-muted">
              PETG for flexibility and weather resistance; ASA for UV resistance
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Layer Height</h3>
            <p className="text-stalker-muted">
              0.2mm for fine details; 0.3mm for faster production
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Infill Density</h3>
            <p className="text-stalker-muted">
              50–80% for structural parts; 20–40% for non-critical parts
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};