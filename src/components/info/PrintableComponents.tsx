import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const componentsData = [
  {
    component: "Blades",
    material: "PETG, ABS",
    method: "FDM",
    useCase: "Durable, outdoor use",
    cost: "€10–€30 each"
  },
  {
    component: "Rotor Hub",
    material: "PLA, PETG",
    method: "FDM",
    useCase: "Structural connection",
    cost: "€5–€15"
  },
  {
    component: "Housing",
    material: "ASA, Nylon",
    method: "FDM",
    useCase: "UV & weather resistance",
    cost: "€20–€50"
  },
  {
    component: "Vertical Rotor",
    material: "PETG, ASA",
    method: "FDM",
    useCase: "Savonius/Darrieus shape",
    cost: "€15–€40"
  },
  {
    component: "Mounts & Shafts",
    material: "Metal-plastic mix",
    method: "SLA or SLS",
    useCase: "Strength-critical parts",
    cost: "€30–€100"
  }
];

export const PrintableComponents = () => {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">3D Printable Wind Turbine Components</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>3D Printing Method</TableHead>
              <TableHead>Best Use Case</TableHead>
              <TableHead>Cost per Component</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {componentsData.map((item, i) => (
              <TableRow key={i}>
                <TableCell>{item.component}</TableCell>
                <TableCell>{item.material}</TableCell>
                <TableCell>{item.method}</TableCell>
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