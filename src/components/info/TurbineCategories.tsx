import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const turbineData = [
  {
    type: "Horizontal Axis",
    category: "Three-Blade HAWT",
    power: "5–10",
    parts: "Blades, housing, connectors",
    efficiency: "55–60%",
    useCase: "Rural open spaces",
    cost: "€1,500–€6,000"
  },
  {
    type: "Vertical Axis",
    category: "Savonius",
    power: "1–5",
    parts: "Rotor, supports, shaft",
    efficiency: "40–45%",
    useCase: "Urban rooftops",
    cost: "€800–€2,500"
  },
  {
    type: "Vertical Axis",
    category: "Darrieus",
    power: "1–5",
    parts: "Blades, vertical housing",
    efficiency: "45–50%",
    useCase: "Mixed environments",
    cost: "€1,000–€3,000"
  },
  {
    type: "Micro Turbines",
    category: "Rooftop Micro HAWT",
    power: "0.2–1",
    parts: "Blades, mounts",
    efficiency: "30–40%",
    useCase: "Balconies, RVs",
    cost: "€100–€500"
  },
  {
    type: "Hybrid Systems",
    category: "Wind-Solar Hybrid",
    power: "5–15",
    parts: "Integration housing",
    efficiency: "50–60%",
    useCase: "Off-grid homes",
    cost: "€2,500–€8,000"
  }
];

export const TurbineCategories = () => {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Categories of Household Wind Turbines</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Power Output (kW)</TableHead>
              <TableHead>3D Printed Parts</TableHead>
              <TableHead>Efficiency</TableHead>
              <TableHead>Best Use Case</TableHead>
              <TableHead>Estimated Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {turbineData.map((item, i) => (
              <TableRow key={i}>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.power}</TableCell>
                <TableCell>{item.parts}</TableCell>
                <TableCell>{item.efficiency}</TableCell>
                <TableCell>{item.useCase}</TableCell>
                <TableCell>{item.cost}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};