import { Card } from "@/components/ui/card";
import { Steps } from "@/components/ui/steps";

export const VisualizationGuide = () => {
  const steps = [
    {
      title: "Prepare Data in Spreadsheet",
      description: "Organize data into clear tables with headers for clarity. Export as .csv or .xlsx."
    },
    {
      title: "Import Data into WindTail",
      description: "Open WindTail Dashboard, click Import Data, and upload your file."
    },
    {
      title: "Create Graphs",
      description: "Create bar charts, line graphs, pie charts, and scatter plots to visualize your data."
    },
    {
      title: "Customize Visuals",
      description: "Add legends, labels, titles, and enable tooltips for better understanding."
    },
    {
      title: "Export Graphs",
      description: "Export as .png, .svg, or interactive HTML for presentations or reports."
    }
  ];

  const visualizationIdeas = [
    "Power Output vs. Efficiency: Compare different turbine types",
    "3D Printing Material Costs: Show material breakdown by percentage",
    "Sustainability Index: Track recyclability and carbon footprint per turbine",
    "Hybrid Energy Comparison: Visualize energy contribution from wind vs. solar"
  ];

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Creating Graphs & Visuals in WindTail</h2>
      
      <div className="space-y-8">
        <Steps items={steps} />
        
        <div>
          <h3 className="text-xl font-semibold mb-3">Example Visualization Ideas</h3>
          <ul className="list-disc list-inside space-y-2 text-stalker-muted">
            {visualizationIdeas.map((idea, i) => (
              <li key={i}>{idea}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};