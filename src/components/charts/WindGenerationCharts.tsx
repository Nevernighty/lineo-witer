import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { type WindGeneratorSpecs } from '@/utils/windCalculations';

interface WindGenerationChartsProps {
  windSpeed: number;
  generatorSpecs: WindGeneratorSpecs;
}

export const WindGenerationCharts = ({ windSpeed, generatorSpecs }: WindGenerationChartsProps) => {
  // Sample data based on current wind speed and specs
  const efficiencyData = [
    { name: 'ABS', efficiency: 70 },
    { name: 'PETG', efficiency: 80 },
    { name: 'PLA', efficiency: 60 },
    { name: 'Metal', efficiency: 90 },
    { name: 'Wood', efficiency: 50 },
    { name: 'Carbon Fiber', efficiency: 95 },
    { name: 'Composite', efficiency: 85 },
  ];

  const powerOutputData = Array.from({ length: 10 }, (_, i) => ({
    windSpeed: i + 1,
    output: Math.pow(i + 1, 2) * 100, // Sample calculation
  }));

  return (
    <div className="space-y-8">
      <div className="h-[300px]">
        <h3 className="text-lg font-semibold mb-4">Material Efficiency Comparison</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={efficiencyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                background: '#222832', 
                border: '1px solid #39FF14',
                borderRadius: '8px' 
              }}
            />
            <Legend />
            <Bar dataKey="efficiency" fill="#39FF14" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[300px]">
        <h3 className="text-lg font-semibold mb-4">Power Output vs Wind Speed</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={powerOutputData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="windSpeed" label={{ value: 'Wind Speed (m/s)', position: 'bottom' }} />
            <YAxis label={{ value: 'Power Output (W)', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              contentStyle={{ 
                background: '#222832', 
                border: '1px solid #39FF14',
                borderRadius: '8px' 
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="output" stroke="#39FF14" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};