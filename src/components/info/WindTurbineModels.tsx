
import React from 'react';
import { TabsList, TabsTrigger, TabsContent, Tabs } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, Wind, Rulers, Thermometer, Tool, RotateCcw } from 'lucide-react';

interface ModelCategory {
  emoji: string;
  title: string;
  description: string;
  count: number;
  likes: number;
  examples: Array<{
    name: string;
    author: string;
    description: string;
    link: string;
  }>;
}

const categories: ModelCategory[] = [
  {
    emoji: "⚡",
    title: "DIY Wind Turbine Generators",
    description: "Functional wind turbines and components for power generation experiments",
    count: 42,
    likes: 17308,
    examples: [
      {
        name: "Windmill - 100% printable",
        author: "PRINTER",
        description: "No support needed, low friction design with detailed assembly instructions",
        link: "https://www.printables.com/model/123456"
      },
      // ... more examples
    ]
  },
  // ... more categories
];

export const WindTurbineModels = () => {
  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wind className="h-6 w-6" />
          Wind Energy STL Models
        </CardTitle>
        <CardDescription>
          Browse our curated collection of 3D printable wind energy models
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generators" className="w-full">
          <TabsList className="grid grid-cols-5 gap-4">
            <TabsTrigger value="generators" className="flex items-center gap-2">
              <Wind className="h-4 w-4" />
              Generators
            </TabsTrigger>
            <TabsTrigger value="decorative" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Decorative
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Rulers className="h-4 w-4" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Weather
            </TabsTrigger>
            <TabsTrigger value="hardware" className="flex items-center gap-2">
              <Tool className="h-4 w-4" />
              Hardware
            </TabsTrigger>
          </TabsList>

          {categories.map((category, index) => (
            <TabsContent key={index} value={category.title.toLowerCase().replace(/\s+/g, '')}>
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{category.emoji} {category.title}</h3>
                    <p className="text-sm text-stalker-muted">{category.count} models • {category.likes} likes</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        View Models
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>{category.emoji} {category.title}</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {category.examples.map((example, i) => (
                          <Card key={i} className="p-4">
                            <h4 className="font-semibold">{example.name}</h4>
                            <p className="text-sm text-stalker-muted">by {example.author}</p>
                            <p className="mt-2 text-sm">{example.description}</p>
                            <Button
                              variant="link"
                              className="mt-2 p-0"
                              onClick={() => window.open(example.link, '_blank')}
                            >
                              View on Printables →
                            </Button>
                          </Card>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-sm">{category.description}</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
