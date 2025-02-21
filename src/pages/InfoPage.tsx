
import React from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { TurbineCategories } from '@/components/info/TurbineCategories';
import { PrintableComponents } from '@/components/info/PrintableComponents';
import { PrintingConsiderations } from '@/components/info/PrintingConsiderations';
import { WindGenerationCharts } from '@/components/charts/WindGenerationCharts';
import { WindTurbineModels } from '@/components/info/WindTurbineModels';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

const InfoSection = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
};

const InfoPage = () => {
  const defaultGeneratorSpecs = {
    bladeLength: 1.5,
    efficiency: 0.85,
    ratedPower: 1000,
    cutInSpeed: 3,
    cutOutSpeed: 25,
    optimalWindSpeed: 12,
    height: 10,
    material: 'composite',
    bladedesign: 'three-blade',
    installationtype: 'rooftop',
    powercategory: 'small',
    purpose: 'off-grid'
  };

  return (
    <ScrollArea className="h-screen">
      <div className="container mx-auto py-8 px-4">
        <div className="grid gap-8">
          <InfoSection>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-stalker-dark/30">
                <h2 className="text-2xl font-bold mb-4">Wind Energy Basics</h2>
                <div className="space-y-4">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        Power Generation Principles
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">How Wind Turbines Work</h4>
                        <p className="text-sm text-stalker-muted">
                          Wind turbines convert kinetic energy from moving air into mechanical
                          energy and then electrical power through electromagnetic induction.
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>

                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        Efficiency Factors
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Key Performance Factors</h4>
                        <p className="text-sm text-stalker-muted">
                          Turbine efficiency depends on blade design, wind speed, air density,
                          and proper positioning relative to wind direction.
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </Card>

              <Card className="p-6 bg-stalker-dark/30">
                <h2 className="text-2xl font-bold mb-4">Technical Specifications</h2>
                <div className="space-y-4">
                  <WindGenerationCharts 
                    windSpeed={10} 
                    generatorSpecs={defaultGeneratorSpecs} 
                  />
                </div>
              </Card>
            </div>
          </InfoSection>

          <InfoSection>
            <WindTurbineModels />
          </InfoSection>

          <InfoSection>
            <TurbineCategories />
          </InfoSection>

          <InfoSection>
            <div className="grid md:grid-cols-2 gap-6">
              <PrintableComponents />
              <PrintingConsiderations />
            </div>
          </InfoSection>
        </div>
      </div>
    </ScrollArea>
  );
};

export default InfoPage;
