interface WindDisplayProps {
  windSpeed: number;
}

export const WindDisplay = ({ windSpeed }: WindDisplayProps) => {
  return (
    <div className="p-4 bg-stalker-dark/30 rounded-lg">
      <div className="text-stalker-accent text-xl font-bold mb-2">
        Current Wind Speed: {windSpeed} m/s
      </div>
      <div className="h-2 bg-stalker-dark rounded overflow-hidden">
        <div 
          className="h-full bg-stalker-accent transition-all duration-300"
          style={{ width: `${(windSpeed / 20) * 100}%` }}
        />
      </div>
    </div>
  );
};