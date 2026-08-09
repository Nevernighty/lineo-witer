// Real 3D-printed wind turbines featured in the Line-O 3D-wind library.
// Specs are taken from the original model documentation (Printables / Thingiverse).
import { RAW_PARTS, type RawPart } from './turbineParts/generated';
import { PART_META, type PartMeta } from './turbineParts/partMeta';
import type { PartRole } from './turbineParts/types';

export type RotorAxis = 'horizontal' | 'vertical';

export interface RealTurbineSpec {
  /** Rated electrical power, W. */
  ratedW: number;
  /** Rated wind speed for the rated power, m/s. */
  ratedWind: number;
  /** Rotor diameter, m. */
  rotorD: number;
  /** Rotor height, m (VAWT swept height; HAWT = diameter). */
  rotorH: number;
  /** Number of aerodynamic blades on the assembled rotor. */
  blades: number;
  /** Cut-in wind speed, m/s. */
  cutIn: number;
  /** Design tip-speed ratio. */
  designTsr: number;
  /** Peak power coefficient reported / expected for this rotor family. */
  cpPeak: number;
  /** Generator description. */
  generator: { ua: string; en: string };
}

export interface RealTurbine {
  id: keyof typeof RAW_PARTS & string;
  nameUA: string;
  nameEN: string;
  author: string;
  /** Original model page — opens in a new tab. */
  source: string;
  sourceLabel: string;
  axis: RotorAxis;
  /** Blade-Lab rotor family this maps onto when sent to the aero lab. */
  family: 'hawt' | 'vawt-h' | 'vawt-helical' | 'vawt-savonius';
  spec: RealTurbineSpec;
  summaryUA: string;
  summaryEN: string;
  /** Practical build / printing notes from the source documentation. */
  notesUA: string[];
  notesEN: string[];
}

export const REAL_TURBINES: RealTurbine[] = [
  {
    id: 'hawt450',
    nameUA: 'Functional 450 W HAWT',
    nameEN: 'Functional 450 W HAWT',
    author: 'From Waste To Wind',
    source: 'https://www.printables.com/model/1023045-functional-450w-windturbine',
    sourceLabel: 'Printables · 1023045',
    axis: 'horizontal',
    family: 'hawt',
    spec: {
      ratedW: 450, ratedWind: 11, rotorD: 1.8, rotorH: 1.8, blades: 3, cutIn: 3.0,
      designTsr: 6.5, cpPeak: 0.38,
      generator: { ua: 'Аксіальний PM, 4 сегменти котушок, 3 фази', en: 'Axial-flux PM, 4 coil segments, 3-phase' },
    },
    summaryUA: 'Найпотужніша повністю друкована HAWT добірки: сегментований аксіальний генератор, п’ять типорозмірів секцій лопаті та друкований намотувач котушок.',
    summaryEN: 'The most powerful fully printed HAWT in the set: segmented axial-flux generator, five blade section sizes and a printed coil-winding jig.',
    notesUA: [
      'Лопаті друкуються секціями та склеюються на сталевій трубці-лонжероні.',
      'Сегменти генератора 90° друкуються по 4 шт. — верх і низ окремо.',
      'Обов’язковий баланс ротора: різниця мас лопатей < 2 г.',
    ],
    notesEN: [
      'Blades print in sections and bond onto a steel spar tube.',
      'The 90° generator segments print as four top/bottom pairs.',
      'Rotor balancing is mandatory: keep blade mass spread under 2 g.',
    ],
  },
  {
    id: 'hawt100',
    nameUA: 'Functional 100 W HAWT (Propel-e 50)',
    nameEN: 'Functional 100 W HAWT (Propel-e 50)',
    author: 'From Waste To Wind',
    source: 'https://www.printables.com/model/1023044-functional-100w-windturbine',
    sourceLabel: 'Printables · 1023044',
    axis: 'horizontal',
    family: 'hawt',
    spec: {
      ratedW: 100, ratedWind: 10, rotorD: 1.2, rotorH: 1.2, blades: 3, cutIn: 2.6,
      designTsr: 6.0, cpPeak: 0.35,
      generator: { ua: 'Аксіальний PM, два магнітні диски + статор', en: 'Axial-flux PM, twin magnet disks + stator' },
    },
    summaryUA: 'Компактна версія з повним друкованим генератором: два магнітні диски різного діаметра, статор із тримачами котушок, дощовий кожух і тришаровий хвіст.',
    summaryEN: 'Compact sibling with a complete printed generator: two magnet disks of different diameter, a coil-holder stator, rain cowling and a three-piece tail.',
    notesUA: [
      'Магнітні диски заливаються епоксидом — друкуйте з 5 периметрами.',
      'Дощовий кожух друкується двома половинами (frontal + back).',
      'Хвіст із трьох сегментів дозволяє налаштувати furling у шторм.',
    ],
    notesEN: [
      'Magnet disks get epoxy-potted — print with 5 perimeters.',
      'The rain cowling prints as frontal + back halves.',
      'The three-segment tail lets you tune storm furling.',
    ],
  },
  {
    id: 'twinmk3',
    nameUA: 'Double Wind Turbine MK3 (контр-обертання)',
    nameEN: 'Double Wind Turbine MK3 (counter-rotating)',
    author: 'rosch8',
    source: 'https://www.printables.com/model/883528-double-wind-turbine-mk3-counter-rotating',
    sourceLabel: 'Printables · 883528',
    axis: 'horizontal',
    family: 'hawt',
    spec: {
      ratedW: 20, ratedWind: 9, rotorD: 0.41, rotorH: 0.41, blades: 4, cutIn: 2.2,
      designTsr: 5.5, cpPeak: 0.32,
      generator: { ua: 'Два зустрічні ротори на спільній осі, DC-мотор', en: 'Two counter-rotating rotors on one axle, DC motor' },
    },
    summaryUA: 'Настільна демонстрація контр-обертання: два ротори L/R на подвійній втулці підвищують відносну кутову швидкість генератора майже вдвічі.',
    summaryEN: 'Desktop counter-rotation demo: two L/R rotors on a double hub nearly double the relative angular speed seen by the generator.',
    notesUA: [
      'rotorblattl і rotorblattr — дзеркальні: не переплутайте бік.',
      'Дистанційні втулки 8 та 22 мм задають зазор між роторами.',
      'Вертикальна вісь друкується зі щільним заповненням (≥ 40 %).',
    ],
    notesEN: [
      'rotorblattl and rotorblattr are mirrored — do not swap sides.',
      'The 8 mm and 22 mm spacers set the gap between the two rotors.',
      'Print the vertical axle at ≥ 40 % infill.',
    ],
  },
  {
    id: 'gorlov',
    nameUA: 'Savonius & Gorlov VAWT',
    nameEN: 'Savonius & Gorlov VAWT',
    author: 'Thingiverse community',
    source: 'https://www.thingiverse.com/thing:16504',
    sourceLabel: 'Thingiverse · 16504',
    axis: 'vertical',
    family: 'vawt-helical',
    spec: {
      ratedW: 5, ratedWind: 8, rotorD: 0.17, rotorH: 0.2, blades: 3, cutIn: 1.6,
      designTsr: 2.2, cpPeak: 0.25,
      generator: { ua: 'Зовнішній — вал виводиться через основу', en: 'External — shaft exits through the base' },
    },
    summaryUA: 'Модульний стек: спільна основа плюс змінні верхні секції — Savonius (тяговий старт) або Gorlov/стандартний спіральний ротор (вищий Cp).',
    summaryEN: 'Modular stack: a shared base plus interchangeable tops — Savonius (drag start-up) or Gorlov/standard helical rotor (higher Cp).',
    notesUA: [
      'Секції стикуються — можна набрати ротор потрібної висоти.',
      'Спіральна закрутка усуває пульсацію моменту Darrieus.',
      'Atomic-версія друкується без підтримок.',
    ],
    notesEN: [
      'Sections stack — build the rotor height you need.',
      'The helical wrap removes Darrieus torque ripple.',
      'The Atomic version prints support-free.',
    ],
  },
  {
    id: 'savonius',
    nameUA: 'Savonius VAWT (remix)',
    nameEN: 'Savonius VAWT (remix)',
    author: 'rosch8',
    source: 'https://www.printables.com/model/775074-savonius-vertical-wind-turbine-remix',
    sourceLabel: 'Printables · 775074',
    axis: 'vertical',
    family: 'vawt-savonius',
    spec: {
      ratedW: 3, ratedWind: 8, rotorD: 0.17, rotorH: 0.3, blades: 2, cutIn: 1.4,
      designTsr: 1.0, cpPeak: 0.2,
      generator: { ua: 'Малий DC-мотор через втулку nabe', en: 'Small DC motor via the nabe hub' },
    },
    summaryUA: 'Класичний S-ротор із перекриттям ківшів: стартує від найслабшого вітру, не потребує орієнтації, ідеальний для балкона.',
    summaryEN: 'Classic S-rotor with bucket overlap: starts in the lightest breeze, needs no yaw, ideal for a balcony.',
    notesUA: [
      'Перекриття ківшів ≈ 0.15·D дає максимальний Cp.',
      'Секції savonius1/2/3 стикуються з поворотом 90° для рівного моменту.',
      'Дистанційники 5 та 56 мм задають висоту стека.',
    ],
    notesEN: [
      'A bucket overlap of ≈ 0.15·D maximises Cp.',
      'Stack savonius1/2/3 with a 90° offset for smooth torque.',
      'The 5 mm and 56 mm spacers set the stack height.',
    ],
  },
  {
    id: 'helix',
    nameUA: 'HEL3D Vertical Wind Power v8',
    nameEN: 'HEL3D Vertical Wind Power v8',
    author: 'HEL3D',
    source: 'https://www.printables.com/model/1156042-hel3d-vertical-wind-power-v8',
    sourceLabel: 'Printables · 1156042',
    axis: 'vertical',
    family: 'vawt-helical',
    spec: {
      ratedW: 30, ratedWind: 10, rotorD: 0.4, rotorH: 0.55, blades: 3, cutIn: 1.8,
      designTsr: 2.6, cpPeak: 0.28,
      generator: { ua: 'Вбудований аксіальний PM: rotor + stator у корпусі', en: 'Integrated axial-flux PM: rotor + stator inside the case' },
    },
    summaryUA: 'Гібрид: внутрішній Savonius для старту та зовнішні спіральні лопаті для потужності, все на власному друкованому аксіальному генераторі в корпусі.',
    summaryEN: 'Hybrid rotor: an inner Savonius for start-up plus outer helical blades for power, all driving its own printed axial-flux generator inside the case.',
    notesUA: [
      'Лопаті у двох довжинах (large/mid) — можна нарощувати висоту.',
      'Корпус + кришка герметизують статор; ставте розпірні кільця під підшипник.',
      'Rod mount дозволяє встановити ротор на щоглу 1"–1.5".',
    ],
    notesEN: [
      'Blades come in two lengths (large/mid) — stack for more height.',
      'Case + cover seal the stator; fit the spacer rings under the bearing.',
      'The rod mount takes a 1"–1.5" mast.',
    ],
  },
  {
    id: 'aeolus',
    nameUA: 'Project Aeolus VAWT v2',
    nameEN: 'Project Aeolus VAWT v2',
    author: 'Aeolus',
    source: 'https://www.printables.com/model/124399-project-aeolus-vertical-axis-wind-turbine-v2',
    sourceLabel: 'Printables · 124399',
    axis: 'vertical',
    family: 'vawt-h',
    spec: {
      ratedW: 2, ratedWind: 8, rotorD: 0.28, rotorH: 0.3, blades: 3, cutIn: 2.4,
      designTsr: 3.2, cpPeak: 0.26,
      generator: { ua: 'Зовнішній малий генератор під центральною втулкою', en: 'External small generator under the centre hub' },
    },
    summaryUA: 'Мінімалістичний H-Darrieus: центральна деталь, траверса та профільована лопать — найчистіший приклад підйомного VAWT для навчання.',
    summaryEN: 'Minimal H-Darrieus: a centrepiece, an arm and an aerofoil vane — the cleanest teaching example of a lift-driven VAWT.',
    notesUA: [
      'Потребує розкрутки: власного старту при слабкому вітрі майже немає.',
      'Кут установки лопаті (toe-in) 2–4° помітно покращує момент рушання.',
      'Друкуйте лопать вертикально для гладкої поверхні профілю.',
    ],
    notesEN: [
      'Needs a spin-up: self-starting at low wind is marginal.',
      'A 2–4° toe-in pitch noticeably improves starting torque.',
      'Print the vane upright for a smooth aerofoil surface.',
    ],
  },
];

export function getRealTurbine(id: string): RealTurbine {
  return REAL_TURBINES.find(t => t.id === id) ?? REAL_TURBINES[0];
}

export interface ResolvedPart extends RawPart, PartMeta {}

/** Joins CDN geometry with role metadata, sorted by assembly order. */
export function turbineParts(id: string): ResolvedPart[] {
  const raws = RAW_PARTS[id] ?? [];
  const metas = PART_META[id] ?? [];
  const byId = new Map(raws.map(r => [r.id, r]));
  return metas
    .filter(m => byId.has(m.id))
    .map(m => ({ ...byId.get(m.id)!, ...m }))
    .sort((a, b) => a.order - b.order);
}

export function partsByRole(id: string): Array<{ role: PartRole; parts: ResolvedPart[] }> {
  const out = new Map<PartRole, ResolvedPart[]>();
  for (const p of turbineParts(id)) {
    if (!out.has(p.role)) out.set(p.role, []);
    out.get(p.role)!.push(p);
  }
  return [...out.entries()].map(([role, parts]) => ({ role, parts }));
}
