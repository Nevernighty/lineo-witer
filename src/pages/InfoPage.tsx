import React from "react";
import { motion } from "framer-motion";
import { 
  Wind, 
  Zap, 
  Droplets, 
  Sun, 
  TreePine, 
  Printer,
  Settings,
  BarChart3,
  Lightbulb,
  HelpCircle
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PrintableComponents } from "@/components/info/PrintableComponents";
import { PrintingConsiderations } from "@/components/info/PrintingConsiderations";
import { TurbineCategories } from "@/components/info/TurbineCategories";
import { VisualizationGuide } from "@/components/info/VisualizationGuide";

const InfoSection = ({ 
  icon: Icon, 
  title, 
  children 
}: { 
  icon: React.ElementType; 
  title: string; 
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="p-6 bg-stalker-dark/30 rounded-lg backdrop-blur hover:bg-stalker-dark/40 transition-all group"
  >
    <div className="flex items-center gap-3 mb-4">
      <Icon className="w-6 h-6 text-stalker-accent group-hover:text-stalker-accent/80 transition-colors" />
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </motion.div>
);

const InfoPage = () => {
  return (
    <ScrollArea className="h-screen">
      <div className="container mx-auto py-8 px-4 space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Wind className="text-stalker-accent" />
            LINE-O WITER Guide
          </h1>
          <p className="text-stalker-muted max-w-2xl mx-auto">
            Comprehensive guide to wind energy harvesting, 3D printing integration, and sustainable power generation
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoSection icon={Wind} title="Wind Energy Basics">
            <div className="space-y-4">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Zap className="w-4 h-4 mr-2" />
                    Power Generation Principles
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">How Wind Generates Power</h4>
                    <p className="text-sm text-stalker-muted">
                      Wind turbines convert kinetic energy into mechanical power, which is then transformed into electricity through electromagnetic induction.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <TurbineCategories />
            </div>
          </InfoSection>

          <InfoSection icon={Printer} title="3D Printing Integration">
            <PrintableComponents />
            <PrintingConsiderations />
          </InfoSection>

          <InfoSection icon={BarChart3} title="Performance Metrics">
            <div className="space-y-4">
              <Badge variant="outline" className="mb-4">
                Real-time Analytics
              </Badge>
              <VisualizationGuide />
            </div>
          </InfoSection>

          <InfoSection icon={Settings} title="Installation Guide">
            <div className="space-y-4">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <TreePine className="w-4 h-4 mr-2" />
                    Environmental Considerations
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Optimal Placement</h4>
                    <p className="text-sm text-stalker-muted">
                      Learn about ideal locations, height requirements, and environmental factors that affect wind turbine performance.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </InfoSection>
        </div>

        <Separator className="my-8" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoSection icon={Sun} title="Solar Integration">
            <p className="text-stalker-muted">
              Combine wind and solar power for optimal renewable energy generation.
            </p>
          </InfoSection>

          <InfoSection icon={Droplets} title="Hydro Compatibility">
            <p className="text-stalker-muted">
              Explore hybrid systems that leverage both wind and water power.
            </p>
          </InfoSection>

          <InfoSection icon={Lightbulb} title="Energy Efficiency">
            <p className="text-stalker-muted">
              Tips and strategies for maximizing power output and reducing losses.
            </p>
          </InfoSection>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 p-6 bg-stalker-dark/30 rounded-lg backdrop-blur text-center"
        >
          <HelpCircle className="w-8 h-8 text-stalker-accent mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Need Help?</h2>
          <p className="text-stalker-muted">
            Our community is here to help you with any questions about wind energy harvesting and 3D printing integration.
          </p>
          <Button variant="outline" className="mt-4">
            Join Community
          </Button>
        </motion.div>
      </div>
    </ScrollArea>
  );
};

export default InfoPage;