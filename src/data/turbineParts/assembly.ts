// Guided assembly sequence + practical print/BOM data for the real turbine library.
// Everything here is derived from the existing part metadata — no new assets.
import { turbineParts, getRealTurbine, type ResolvedPart, type RealTurbine } from '@/data/realTurbines';
import { ROLE_LABEL, ROLE_FUNCTION, ROLE_ORDER, type PartRole } from './types';

export interface AssemblyStep {
  id: string;
  role: PartRole;
  partIds: string[];
  titleUA: string;
  titleEN: string;
  bodyUA: string;
  bodyEN: string;
}

/** How each sub-assembly mounts — the practical half of the step caption. */
const MOUNT_HINT: Record<PartRole, { ua: string; en: string }> = {
  base: {
    ua: 'Спочатку фіксуємо основу на щоглі: вона задає вертикаль і сприймає всі навантаження.',
    en: 'Mount the base on the mast first — it sets the vertical datum and takes every load.',
  },
  shaft: {
    ua: 'Вал/вісь встановлюється в основу співвісно; биття понад 0.2 мм дає вібрацію на робочих обертах.',
    en: 'The shaft seats coaxially into the base; runout above 0.2 mm shows up as vibration at speed.',
  },
  bearing: {
    ua: 'Підшипники та дистанційні кільця задають осьовий зазор — від нього прямо залежить старт.',
    en: 'Bearings and spacers set the axial clearance, which directly governs cut-in wind speed.',
  },
  generator: {
    ua: 'Магнітні диски та статор збираються з фіксованим повітряним зазором (зазвичай 1–2 мм на бік).',
    en: 'Magnet disks and stator go together with a fixed air gap, typically 1–2 mm per side.',
  },
  hub: {
    ua: 'Втулка ставиться на вал і задає кут установки лопаті — усі лопаті мають однаковий pitch.',
    en: 'The hub goes onto the shaft and locks blade pitch — every blade must share the same angle.',
  },
  arm: {
    ua: 'Траверси кріпляться симетрично; асиметрія понад 1° дає биття та шум на VAWT.',
    en: 'Struts mount symmetrically; more than ~1° of asymmetry gives VAWT wobble and noise.',
  },
  blade: {
    ua: 'Лопаті ставляться по колу з рівним кроком і вирівнюються по масі — балансування обовʼязкове.',
    en: 'Blades go on at equal angular spacing and must be mass-matched — balancing is mandatory.',
  },
  cover: {
    ua: 'Корпус/обтічник закриває генератор від дощу та згладжує потік перед ротором.',
    en: 'The housing/cowling seals the generator from rain and smooths flow ahead of the rotor.',
  },
  tail: {
    ua: 'Хвіст встановлюється останнім: його плече задає швидкість і стабільність рискання.',
    en: 'The tail goes last — its lever arm sets yaw speed and stability.',
  },
  tool: {
    ua: 'Друковані пристосування не входять у машину: вони потрібні лише під час збирання.',
    en: 'Printed jigs are not part of the machine — they are only used during the build.',
  },
};

/** Ordered build sequence: one step per present sub-assembly. */
export function buildAssemblySteps(turbineId: string): AssemblyStep[] {
  const parts = turbineParts(turbineId);
  const byRole = new Map<PartRole, ResolvedPart[]>();
  for (const p of parts) {
    if (!byRole.has(p.role)) byRole.set(p.role, []);
    byRole.get(p.role)!.push(p);
  }
  return ROLE_ORDER.filter(r => byRole.has(r)).map((role, i) => ({
    id: `${turbineId}-${role}`,
    role,
    partIds: byRole.get(role)!.map(p => p.id),
    titleUA: `${i + 1}. ${ROLE_LABEL[role].ua}`,
    titleEN: `${i + 1}. ${ROLE_LABEL[role].en}`,
    bodyUA: `${MOUNT_HINT[role].ua} ${ROLE_FUNCTION[role].ua}`,
    bodyEN: `${MOUNT_HINT[role].en} ${ROLE_FUNCTION[role].en}`,
  }));
}

// ---------------------------------------------------------------- print data

export interface PartEngineering {
  /** Copies needed for one complete machine. */
  qty: number;
  handed: 'left' | 'right' | null;
  orientation: { ua: string; en: string };
  supports: boolean;
  /** Approximate printed volume, cm³ (bbox × typical solid fraction). */
  volumeCm3: number;
  /** Longest edge in mm — helps judge bed size. */
  longestMm: number;
}

const ORIENTATION: Record<PartRole, { ua: string; en: string }> = {
  base: { ua: 'Плоскою гранню на стіл, 4+ периметри', en: 'Flat face down, 4+ perimeters' },
  shaft: { ua: 'Вертикально, ≥40 % заповнення', en: 'Upright, ≥40 % infill' },
  bearing: { ua: 'Плоско, шар 0.15 мм', en: 'Flat, 0.15 mm layers' },
  generator: { ua: 'Плоско, 5 периметрів під заливку', en: 'Flat, 5 perimeters for potting' },
  hub: { ua: 'Отвором вала вгору', en: 'Shaft bore facing up' },
  arm: { ua: 'По довжині, шари поперек вигину', en: 'Lengthwise, layers across bending' },
  blade: { ua: 'Коренем на стіл, шари поперек хорди', en: 'Root down, layers across the chord' },
  cover: { ua: 'Куполом вниз або в підтримках', en: 'Dome down or on supports' },
  tail: { ua: 'Плоско, 3 периметри', en: 'Flat, 3 perimeters' },
  tool: { ua: 'Плоско, чернетковий профіль', en: 'Flat, draft profile' },
};

const SUPPORT_ROLES: PartRole[] = ['cover', 'tail'];
/** Typical solid fraction of a printed part vs its bounding box. */
const FILL = 0.3;

const L_RE = /(^|_)(l|left|links)(\d*)$/i;
const R_RE = /(^|_)(r|right|rechts)(\d*)$/i;

export function partEngineering(part: ResolvedPart, turbine: RealTurbine, sameRoleCount: number): PartEngineering {
  const handed: PartEngineering['handed'] = L_RE.test(part.id) ? 'left' : R_RE.test(part.id) ? 'right' : null;

  let qty = 1;
  if (part.role === 'blade' || part.role === 'arm') {
    // Blade sets printed as distinct sections stay 1× per blade; identical blades scale to the rotor.
    qty = sameRoleCount >= turbine.spec.blades ? 1 : Math.max(1, Math.round(turbine.spec.blades / sameRoleCount));
  } else if (part.role === 'bearing') {
    qty = 2;
  }

  const [x, y, z] = part.ext;
  return {
    qty,
    handed,
    orientation: ORIENTATION[part.role],
    supports: SUPPORT_ROLES.includes(part.role) || Math.min(x, y, z) < 3,
    volumeCm3: (x * y * z * FILL) / 1000,
    longestMm: Math.max(x, y, z),
  };
}

export interface Bom {
  printedParts: number;
  uniqueParts: number;
  volumeCm3: number;
  filamentG: number;
  longestMm: number;
  hardware: { ua: string; en: string }[];
}

/** Non-printed hardware implied by the sub-assemblies each machine uses. */
const HARDWARE: Record<PartRole, { ua: string; en: string } | null> = {
  base: { ua: 'Гвинти M6 + шайби для кріплення до щогли', en: 'M6 bolts + washers for the mast mount' },
  shaft: { ua: 'Сталева вісь/трубка як силовий елемент', en: 'Steel axle / spar tube as the load member' },
  bearing: { ua: 'Кулькові підшипники 608ZZ (2 шт.)', en: 'Ball bearings 608ZZ (×2)' },
  generator: { ua: 'Неодимові магніти, емальований дріт, епоксидка, 3-фазний випрямляч', en: 'Neodymium magnets, enamelled wire, epoxy, 3-phase rectifier' },
  hub: { ua: 'Гвинти M4/M5 з контргайками', en: 'M4/M5 screws with lock nuts' },
  arm: { ua: 'Гвинти M4 для траверс', en: 'M4 screws for the struts' },
  blade: { ua: 'Клей для стиків секцій лопаті', en: 'Adhesive for blade section joints' },
  cover: { ua: 'Саморізи або защіпки для корпусу', en: 'Self-tappers or clips for the housing' },
  tail: { ua: 'Штифт/трубка хвостової балки', en: 'Tail boom pin or tube' },
  tool: null,
};

export function buildBom(turbineId: string): Bom {
  const turbine = getRealTurbine(turbineId);
  const parts = turbineParts(turbineId);
  const roleCount = new Map<PartRole, number>();
  for (const p of parts) roleCount.set(p.role, (roleCount.get(p.role) ?? 0) + 1);

  let printedParts = 0, volumeCm3 = 0, longestMm = 0;
  for (const p of parts) {
    if (p.role === 'tool') continue;
    const e = partEngineering(p, turbine, roleCount.get(p.role) ?? 1);
    printedParts += e.qty;
    volumeCm3 += e.volumeCm3 * e.qty;
    longestMm = Math.max(longestMm, e.longestMm);
  }

  const hardware = [...roleCount.keys()]
    .sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b))
    .map(r => HARDWARE[r])
    .filter((h): h is { ua: string; en: string } => !!h);

  return {
    printedParts,
    uniqueParts: parts.filter(p => p.role !== 'tool').length,
    volumeCm3,
    filamentG: volumeCm3 * 1.24,
    longestMm,
    hardware,
  };
}

/** Plain-text BOM for the clipboard. */
export function bomText(turbineId: string, lang: 'ua' | 'en'): string {
  const turbine = getRealTurbine(turbineId);
  const parts = turbineParts(turbineId);
  const roleCount = new Map<PartRole, number>();
  for (const p of parts) roleCount.set(p.role, (roleCount.get(p.role) ?? 0) + 1);
  const bom = buildBom(turbineId);

  const lines: string[] = [];
  lines.push(`${lang === 'ua' ? turbine.nameUA : turbine.nameEN} — ${turbine.source}`);
  lines.push('');
  for (const p of parts) {
    const e = partEngineering(p, turbine, roleCount.get(p.role) ?? 1);
    lines.push(
      `${String(e.qty).padStart(2, ' ')}× ${lang === 'ua' ? p.nameUA : p.nameEN}` +
      `  [${ROLE_LABEL[p.role][lang]}]  ${p.ext.map(v => v.toFixed(0)).join('×')} mm` +
      `  ~${e.volumeCm3.toFixed(1)} cm³${e.supports ? (lang === 'ua' ? '  (підтримки)' : '  (supports)') : ''}`,
    );
  }
  lines.push('');
  lines.push(`${lang === 'ua' ? 'Друкованих деталей' : 'Printed parts'}: ${bom.printedParts}`);
  lines.push(`${lang === 'ua' ? 'Обʼєм' : 'Volume'}: ~${bom.volumeCm3.toFixed(0)} cm³ (~${bom.filamentG.toFixed(0)} g PLA)`);
  lines.push(`${lang === 'ua' ? 'Найбільша деталь' : 'Largest part'}: ${bom.longestMm.toFixed(0)} mm`);
  lines.push('');
  lines.push(lang === 'ua' ? 'Не друкується:' : 'Not printed:');
  for (const h of bom.hardware) lines.push(`- ${h[lang]}`);
  return lines.join('\n');
}
