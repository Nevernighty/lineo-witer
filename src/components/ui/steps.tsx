interface StepsProps {
  items: {
    title: string;
    description: string;
  }[];
}

export const Steps = ({ items }: StepsProps) => {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stalker-accent text-stalker-dark font-medium">
              {i + 1}
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-medium leading-none">{item.title}</h3>
            <p className="text-sm text-stalker-muted">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};