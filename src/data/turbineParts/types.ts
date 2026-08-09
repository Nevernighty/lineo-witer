// Shared types for the real 3D-printed turbine part library.

export type PartRole =
  | 'base'
  | 'shaft'
  | 'bearing'
  | 'generator'
  | 'hub'
  | 'arm'
  | 'blade'
  | 'cover'
  | 'tail'
  | 'tool';

export const ROLE_ORDER: PartRole[] = [
  'base', 'shaft', 'bearing', 'generator', 'hub', 'arm', 'blade', 'cover', 'tail', 'tool',
];

export const ROLE_LABEL: Record<PartRole, { ua: string; en: string }> = {
  base: { ua: 'Основа / кріплення', en: 'Base / mount' },
  shaft: { ua: 'Вал і вісь', en: 'Shaft & axle' },
  bearing: { ua: 'Підшипники, втулки', en: 'Bearings & spacers' },
  generator: { ua: 'Генератор', en: 'Generator' },
  hub: { ua: 'Втулка ротора', en: 'Rotor hub' },
  arm: { ua: 'Траверси / тримачі', en: 'Arms & holders' },
  blade: { ua: 'Лопаті', en: 'Blades' },
  cover: { ua: 'Корпус / обтічник', en: 'Housing / cowling' },
  tail: { ua: 'Хвіст / орієнтація', en: 'Tail & yaw vane' },
  tool: { ua: 'Друковані інструменти', en: 'Printed tools' },
};

/** Role → hue used for the colour-coded exploded view. */
export const ROLE_COLOR: Record<PartRole, string> = {
  base: '#6b7f8c',
  shaft: '#9aa7b0',
  bearing: '#c0a15a',
  generator: '#d2603f',
  hub: '#4fa3d1',
  arm: '#5f8fb0',
  blade: '#4ade80',
  cover: '#a78bfa',
  tail: '#f0b429',
  tool: '#7a8288',
};

/** What each role does — used by the inspector for real engineering context. */
export const ROLE_FUNCTION: Record<PartRole, { ua: string; en: string }> = {
  base: {
    ua: 'Передає всі навантаження ротора на щоглу: осьову тягу, момент рискання та вібрацію.',
    en: 'Transfers all rotor loads into the mast: axial thrust, yaw moment and vibration.',
  },
  shaft: {
    ua: 'Несе згинальний момент від тяги ротора та передає крутний момент на генератор.',
    en: 'Carries the bending moment from rotor thrust and delivers torque to the generator.',
  },
  bearing: {
    ua: 'Задає осьовий зазор та мінімізує момент тертя — від нього залежить швидкість старту.',
    en: 'Sets axial clearance and minimises friction torque — it governs cut-in wind speed.',
  },
  generator: {
    ua: 'Аксіальний PM-генератор: магнітні диски + статор із котушками, E = 4.44·f·N·Φ.',
    en: 'Axial-flux PM generator: magnet disks + coil stator, E = 4.44·f·N·Φ.',
  },
  hub: {
    ua: 'Фіксує кут установки лопаті (pitch) і передає вигин та відцентрову силу на вал.',
    en: 'Locks blade pitch and passes flap bending plus centrifugal load into the shaft.',
  },
  arm: {
    ua: 'Траверси VAWT: працюють на вигин від відцентрової сили та додають паразитний опір.',
    en: 'VAWT struts: loaded in bending by centrifugal force and adding parasitic drag.',
  },
  blade: {
    ua: 'Єдиний елемент, що виробляє момент. Хорда, закрутка та профіль задають Cp(λ).',
    en: 'The only torque-producing element. Chord, twist and airfoil define Cp(λ).',
  },
  cover: {
    ua: 'Захищає генератор від дощу та зменшує опір гондоли.',
    en: 'Weather-protects the generator and lowers nacelle drag.',
  },
  tail: {
    ua: 'Пасивне рискання: тримає ротор проти вітру, а при штормі відводить його вбік (furling).',
    en: 'Passive yaw: keeps the rotor upwind and furls it aside in storm winds.',
  },
  tool: {
    ua: 'Допоміжна друкована оснастка для збирання (намотка котушок, кондуктори).',
    en: 'Printed assembly jig (coil winder, alignment fixtures).',
  },
};
