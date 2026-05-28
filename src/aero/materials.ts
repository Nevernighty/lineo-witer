// Engineering materials for wind-turbine blade structure & 3D-printed DIY rotors.
// Values are representative (handbook ranges) — used for mass, stress and tip-speed limits.

export interface BladeMaterial {
  id: string;
  nameUA: string;
  nameEN: string;
  density: number;        // kg/m^3 (effective composite/shell density)
  youngsModulus: number;  // GPa
  ultimateStress: number; // MPa
  maxTipSpeed: number;    // m/s safety limit
  diyFriendly: boolean;
  notesUA: string;
  notesEN: string;
}

export const MATERIALS: BladeMaterial[] = [
  { id: 'gfrp',  nameUA: 'Скловолокно (GFRP)', nameEN: 'Glass FRP',  density: 1900, youngsModulus: 35,  ultimateStress: 450, maxTipSpeed: 85, diyFriendly: false, notesUA: 'Стандарт для MW-класу.', notesEN: 'Industry standard for MW-class blades.' },
  { id: 'cfrp',  nameUA: 'Карбон (CFRP)',      nameEN: 'Carbon FRP', density: 1550, youngsModulus: 130, ultimateStress: 900, maxTipSpeed: 100, diyFriendly: false, notesUA: 'Жорсткий, легкий, дорогий.', notesEN: 'Stiff, light, expensive.' },
  { id: 'wood',  nameUA: 'Дерево-ламінат',     nameEN: 'Wood laminate', density: 700, youngsModulus: 12, ultimateStress: 90, maxTipSpeed: 65, diyFriendly: true, notesUA: 'Класичні DIY-плани (Hugh Piggott).', notesEN: 'Classic DIY plans (Hugh Piggott).' },
  { id: 'pla',   nameUA: 'PLA (3D-друк)',      nameEN: 'PLA (3D-print)', density: 1240, youngsModulus: 3.5, ultimateStress: 50, maxTipSpeed: 40, diyFriendly: true, notesUA: 'Тільки мікро-турбіни ≤2 м.', notesEN: 'Micro turbines ≤2 m only.' },
  { id: 'petg',  nameUA: 'PETG (3D-друк)',     nameEN: 'PETG (3D-print)', density: 1270, youngsModulus: 2.1, ultimateStress: 53, maxTipSpeed: 45, diyFriendly: true, notesUA: 'УФ-стійкіший за PLA.', notesEN: 'More UV-stable than PLA.' },
  { id: 'pacf',  nameUA: 'PA-CF (нейлон+карбон)', nameEN: 'PA-CF (nylon+carbon)', density: 1180, youngsModulus: 7.5, ultimateStress: 110, maxTipSpeed: 70, diyFriendly: true, notesUA: 'Найкращий FDM для лопатей.', notesEN: 'Best FDM blend for blades.' },
  { id: 'alu',   nameUA: 'Алюміній лист',      nameEN: 'Aluminium sheet', density: 2700, youngsModulus: 70, ultimateStress: 290, maxTipSpeed: 90, diyFriendly: true, notesUA: 'Витинанки + згин для VAWT.', notesEN: 'Cut-and-bend VAWT designs.' },
];

export function getMaterial(id: string): BladeMaterial {
  return MATERIALS.find(m => m.id === id) || MATERIALS[0];
}
