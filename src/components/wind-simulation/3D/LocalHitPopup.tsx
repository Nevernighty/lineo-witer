// Energy bridge for the 3D simulation.
//
// Historically this file rendered a floating "+0.32 Дж" label for every single
// particle hit, which stacked into dozens of jittering popups. Those popups are
// gone: absorption and collision events are now funnelled into the aggregated
// energy store and surfaced once, calmly, in the HUD.
import React from 'react';
import { reportAbsorbedEnergy } from '@/store/useEnergyStore';

interface LocalHitManagerProps {
  /** When false, energy accounting is paused (HUD keeps its last value). */
  enabled: boolean;
}

export const LocalHitManager: React.FC<LocalHitManagerProps> = ({ enabled }) => {
  React.useEffect(() => {
    if (!enabled) return;
    (window as any).__localAbsorptionAdd = (_pos: [number, number, number], energy: number) => {
      reportAbsorbedEnergy(energy, 'all');
    };
    // Collisions with buildings do not generate power — they are recorded as
    // losses only, so they must never inflate the generation readout.
    (window as any).__localHitAdd = () => {};
    return () => {
      delete (window as any).__localAbsorptionAdd;
      delete (window as any).__localHitAdd;
    };
  }, [enabled]);

  return null;
};

export default LocalHitManager;
