import { WindGenerationCharts } from "@/components/charts/WindGenerationCharts";
import { GENERATOR_PRESETS } from "@/utils/windCalculations";

export const VisualizationGuide = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Wind Generation Visualization</h2>
      <p className="text-stalker-muted mb-6">
        Real-time visualization of wind turbine performance metrics and material comparisons.
      </p>
      
      <WindGenerationCharts 
        windSpeed={5} 
        generatorSpecs={GENERATOR_PRESETS["GE Haliade-X 14"]} 
      />
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Understanding the Data</h3>
        <ul className="space-y-2 text-stalker-muted">
          <li>• Material efficiency shows comparative performance across different materials</li>
          <li>• Power output curve demonstrates the relationship between wind speed and energy generation</li>
          <li>• All measurements are based on standardized testing conditions</li>
        </ul>
      </div>
    </div>
  );
};