import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { TurbineCategories } from "@/components/info/TurbineCategories";
import { PrintableComponents } from "@/components/info/PrintableComponents";
import { PrintingConsiderations } from "@/components/info/PrintingConsiderations";
import { VisualizationGuide } from "@/components/info/VisualizationGuide";

const InfoPage = () => {
  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-stalker-accent hover:text-stalker-accent/80 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Household Wind Turbines + 3D Printing Integration</h1>
        
        <div className="grid gap-8">
          <TurbineCategories />
          <PrintableComponents />
          <PrintingConsiderations />
          <VisualizationGuide />
        </div>
      </div>
    </div>
  );
};

export default InfoPage;