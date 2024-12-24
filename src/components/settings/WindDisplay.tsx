import WindAnimation from "../WindAnimation";

interface WindDisplayProps {
  windSpeed: number;
}

export const WindDisplay = ({ windSpeed }: WindDisplayProps) => {
  return (
    <div className="p-4 bg-stalker-dark/30 rounded-lg">
      <WindAnimation windSpeed={windSpeed} width={400} height={300} />
      <div className="mt-4 text-stalker-accent">
        Current Wind Speed: {windSpeed} m/s
      </div>
    </div>
  );
};