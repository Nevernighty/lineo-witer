import { useMemo } from "react";
import { calculatePowerOutput, calculateHeightAdjustedWindSpeed, type WindGeneratorSpecs } from "@/utils/windCalculations";

interface WindTurbineProps {
  windSpeed: number;
  generatorSpecs: WindGeneratorSpecs;
  lang?: 'ua' | 'en';
}

export const WindTurbine = ({ windSpeed, generatorSpecs, lang = 'ua' }: WindTurbineProps) => {
  const analysis = useMemo(() => {
    const adjusted = calculateHeightAdjustedWindSpeed(windSpeed, 10, generatorSpecs.height);
    const power = calculatePowerOutput(adjusted, generatorSpecs);
    const sweptArea = Math.PI * Math.pow(generatorSpecs.bladeLength, 2);
    const rho = 1.225;
    
    // Available wind power
    const availablePower = 0.5 * rho * sweptArea * Math.pow(adjusted, 3);
    const actualEff = availablePower > 0 ? (power / availablePower) * 100 : 0;
    
    // TSR calculation (approximate omega from power and torque)
    const omega = adjusted > 0 ? (generatorSpecs.optimalWindSpeed * 7) / generatorSpecs.bladeLength : 0;
    const tsr = adjusted > 0 ? (omega * generatorSpecs.bladeLength) / adjusted : 0;
    
    // Torque
    const torque = omega > 0 ? power / omega : 0;
    
    // AEP estimate (simplified using capacity factor assumption)
    const capacityFactor = 0.3;
    const aep = generatorSpecs.ratedPower * 8760 * capacityFactor;
    
    // Power at various speeds
    const powerCurve = [3, 5, 8, 10, 12, 15, 20, 25].map(v => {
      const adjV = calculateHeightAdjustedWindSpeed(v, 10, generatorSpecs.height);
      const p = calculatePowerOutput(adjV, generatorSpecs);
      return { v, p };
    });
    
    return { adjusted, power, sweptArea, availablePower, actualEff, tsr, torque, aep, powerCurve };
  }, [windSpeed, generatorSpecs]);

  const formatPower = (w: number) => {
    if (w >= 1e6) return `${(w / 1e6).toFixed(2)} MW`;
    if (w >= 1e3) return `${(w / 1e3).toFixed(1)} kW`;
    return `${w.toFixed(0)} W`;
  };

  const label = (ua: string, en: string) => lang === 'ua' ? ua : en;

  return (
    <div className="space-y-3">
      {/* Power formula */}
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label('Формула потужності', 'Power Formula')}</div>
        <p className="text-sm font-mono text-primary text-center">P = ½ · ρ · A · V³ · Cp</p>
      </div>

      {/* Current values */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label('Поточні значення', 'Current Values')}</div>
        {[
          [label('Швидкість (h-корекція)', 'Speed (h-adjusted)'), `${analysis.adjusted.toFixed(1)} m/s`],
          [label('Потужність', 'Power'), formatPower(analysis.power)],
          [label('Площа ометання', 'Swept Area'), `${analysis.sweptArea.toFixed(0)} m²`],
          [label('Доступна потужність', 'Available Power'), formatPower(analysis.availablePower)],
        ].map(([k, v], i) => (
          <div key={i} className="flex justify-between items-center py-0.5 border-b border-border/30">
            <span className="text-xs text-muted-foreground">{k}</span>
            <span className="text-xs font-mono text-primary">{v}</span>
          </div>
        ))}
      </div>

      {/* Efficiency comparison */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-secondary/10 rounded-lg border border-border/30 text-center">
          <div className="text-[9px] text-muted-foreground uppercase">{label('Ліміт Бетца', 'Betz Limit')}</div>
          <p className="text-base font-mono font-bold">59.3%</p>
          <div className="text-[9px] text-muted-foreground">{label('Теорет. макс.', 'Theoretical Max')}</div>
        </div>
        <div className="p-2 bg-primary/5 rounded-lg border border-primary/20 text-center">
          <div className="text-[9px] text-muted-foreground uppercase">{label('Реальна ефективність', 'Actual Efficiency')}</div>
          <p className="text-base font-mono font-bold text-primary">{analysis.actualEff.toFixed(1)}%</p>
          <div className="text-[9px] text-muted-foreground">Cp = {generatorSpecs.efficiency}</div>
        </div>
      </div>

      {/* TSR & Torque */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-secondary/10 rounded-lg border border-border/30">
          <div className="text-[9px] text-muted-foreground uppercase">TSR (λ)</div>
          <p className="text-sm font-mono font-bold">{analysis.tsr.toFixed(1)}</p>
          <div className="text-[8px] text-muted-foreground font-mono">λ = ωR/V</div>
        </div>
        <div className="p-2 bg-secondary/10 rounded-lg border border-border/30">
          <div className="text-[9px] text-muted-foreground uppercase">{label('Крутний момент', 'Torque')}</div>
          <p className="text-sm font-mono font-bold">{analysis.torque > 1000 ? `${(analysis.torque/1000).toFixed(1)} kNm` : `${analysis.torque.toFixed(0)} Nm`}</p>
          <div className="text-[8px] text-muted-foreground font-mono">τ = P/ω</div>
        </div>
      </div>

      {/* AEP */}
      <div className="p-2 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{label('Оцінка AEP (CF=30%)', 'AEP Estimate (CF=30%)')}</span>
          <span className="text-xs font-mono text-primary font-bold">{(analysis.aep / 1e6).toFixed(1)} GWh/{label('рік', 'yr')}</span>
        </div>
        <div className="text-[8px] text-muted-foreground mt-1">AEP = P_rated × 8760h × CF</div>
      </div>

      {/* Power curve table */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label('Потужність при різних V', 'Power at Various V')}</div>
        <div className="grid grid-cols-4 gap-1">
          {analysis.powerCurve.map(({ v, p }) => (
            <div key={v} className="p-1.5 bg-secondary/10 rounded text-center border border-border/20">
              <div className="text-[8px] text-muted-foreground">{v} m/s</div>
              <div className="text-[9px] font-mono text-foreground">{formatPower(p)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Specs */}
      <div className="space-y-1 text-xs">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label('Характеристики', 'Specifications')}</div>
        {[
          [label('Довжина лопаті', 'Blade Length'), `${generatorSpecs.bladeLength}m`],
          [label('Висота маточини', 'Hub Height'), `${generatorSpecs.height}m`],
          [label('Вхідна швидкість', 'Cut-in Speed'), `${generatorSpecs.cutInSpeed} m/s`],
          [label('Вихідна швидкість', 'Cut-out Speed'), `${generatorSpecs.cutOutSpeed} m/s`],
          [label('Номінальна потужність', 'Rated Power'), formatPower(generatorSpecs.ratedPower)],
        ].map(([k, v], i) => (
          <div key={i} className="flex justify-between py-0.5 border-b border-border/20">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
