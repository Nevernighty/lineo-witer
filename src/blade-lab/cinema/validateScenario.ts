// validateScenario — pre-flight checks run before a scenario is played.
//
// A cinematic is only useful if the subject is actually visible. These checks
// reproduce the same solve the CinemaCamera performs, so a scenario that would
// bury the camera in the stage, hide the rotor behind the HUD, or frame it at a
// nonsensical scale is reported *before* playback instead of being discovered
// as a broken shot.

import type { CinemaScenario, HighlightMark } from './types';
import { FRAMING_MUL, type Composition } from './useComposition';
import type { HudInsets } from './hudLayout';

export type IssueLevel = 'error' | 'warn';

export interface ScenarioIssue {
  level: IssueLevel;
  code: string;
  ua: string;
  en: string;
}

export interface ValidationContext {
  canvas: { width: number; height: number };
  hud: HudInsets;
  composition: Composition;
  /** Radius of the sphere that must stay in frame (world units). */
  subjectRadius: number;
  /** Overall scene scale used to map cue-space to world space. */
  sceneScale: number;
  /** Stage floor height in world units. */
  floorY: number;
  /** Rotor centre height in world units. */
  centerY: number;
}

export interface ValidationResult {
  issues: ScenarioIssue[];
  /** No errors — playback is safe (warnings may still be present). */
  ok: boolean;
  worst: IssueLevel | null;
}

/** Fraction of the free viewport band the subject fills at the solved distance. */
export function solveFraming(ctx: ValidationContext) {
  const { canvas, hud, composition, subjectRadius } = ctx;
  const freeH = Math.max(1, canvas.height - hud.top - hud.bottom);
  const fovRad = (composition.fov * Math.PI) / 180;
  const tanHalf = Math.tan(fovRad / 2);
  const aspect = Math.max(0.35, canvas.width / Math.max(1, canvas.height));
  const fit = Math.max(0.4, subjectRadius) * FRAMING_MUL[composition.framing];
  const distV = (fit / tanHalf) * (canvas.height / freeH);
  const distH = fit / (tanHalf * aspect);
  const dist = Math.max(distV, distH);
  // Subject height in pixels at that distance, relative to the free band.
  const halfWorldAtDist = dist * tanHalf;
  const subjectPx = (subjectRadius / halfWorldAtDist) * (canvas.height / 2);
  return { dist, freeH, subjectPx, fillFraction: (subjectPx * 2) / freeH };
}

function markPositions(marks: HighlightMark[] | undefined): Array<[number, number, number]> {
  if (!marks) return [];
  const out: Array<[number, number, number]> = [];
  for (const m of marks) {
    if (m.kind === 'span') { out.push(m.from, m.to); }
    else out.push(m.pos);
  }
  return out;
}

export function validateScenario(scenario: CinemaScenario, ctx: ValidationContext): ValidationResult {
  const issues: ScenarioIssue[] = [];
  const { composition, subjectRadius, sceneScale, floorY, centerY, hud, canvas } = ctx;

  // --- 1. HUD occlusion -----------------------------------------------------
  const freeH = canvas.height - hud.top - hud.bottom;
  if (freeH < canvas.height * 0.35) {
    issues.push({
      level: 'error',
      code: 'hud-occlusion',
      ua: 'Панелі займають понад 65 % полотна — сцену неможливо скомпонувати. Згорніть HUD.',
      en: 'Overlays take over 65 % of the canvas — the shot cannot be composed. Collapse the HUD.',
    });
  } else if (freeH < canvas.height * 0.5) {
    issues.push({
      level: 'warn',
      code: 'hud-tight',
      ua: 'Вільна смуга кадру менша за половину полотна — камера відійде далі, ніж задумано.',
      en: 'The free viewport band is under half the canvas — the camera will pull back further than authored.',
    });
  }

  // --- 2. Subject visibility and scale -------------------------------------
  const { dist, fillFraction } = solveFraming(ctx);
  if (fillFraction < 0.12) {
    issues.push({
      level: 'warn',
      code: 'subject-small',
      ua: `Ротор займе лише ${Math.round(fillFraction * 100)} % кадру — оберіть ближче кадрування.`,
      en: `The rotor will fill only ${Math.round(fillFraction * 100)} % of the frame — pick a tighter framing.`,
    });
  }
  if (fillFraction > 1.05) {
    issues.push({
      level: 'warn',
      code: 'subject-clipped',
      ua: 'Ротор не вміщується у вільну смугу кадру — частина буде обрізана.',
      en: 'The rotor overflows the free viewport band — part of it will be clipped.',
    });
  }

  // --- 3. Camera vs stage geometry -----------------------------------------
  const minY = floorY + subjectRadius * composition.floorClearance;
  if (minY >= centerY + dist * 0.85) {
    issues.push({
      level: 'error',
      code: 'camera-floor',
      ua: 'Мінімальна висота камери вища за розрахункову орбіту — камера впреться у підлогу сцени.',
      en: 'The floor clearance exceeds the solved orbit — the camera would sink into the stage floor.',
    });
  }
  const safeRadius = subjectRadius * composition.minDistanceR;
  if (safeRadius > dist) {
    issues.push({
      level: 'warn',
      code: 'camera-clamped',
      ua: 'Мінімальна дистанція більша за розрахункову — кадр буде ширшим, ніж задано.',
      en: 'The minimum distance exceeds the solved distance — the shot will be wider than authored.',
    });
  }

  // --- 4. Rotor mount vs floor ---------------------------------------------
  if (scenario.anchor && scenario.anchor[1] - subjectRadius < floorY - 1e-3) {
    issues.push({
      level: 'error',
      code: 'rotor-intersects-floor',
      ua: 'Точка кріплення ротора нижча за підлогу сцени — лопаті перетинатимуть геометрію.',
      en: 'The rotor mount sits below the stage floor — the blades would intersect stage geometry.',
    });
  }

  // --- 5. Keyframe integrity ------------------------------------------------
  const kfs = scenario.keyframes;
  if (!kfs.length) {
    issues.push({ level: 'error', code: 'no-keyframes', ua: 'Сценарій без ключових кадрів.', en: 'Scenario has no keyframes.' });
  } else {
    for (let i = 1; i < kfs.length; i++) {
      if (kfs[i].t < kfs[i - 1].t) {
        issues.push({
          level: 'error', code: 'keyframes-unsorted',
          ua: `Ключові кадри не відсортовані (t=${kfs[i].t} після t=${kfs[i - 1].t}).`,
          en: `Keyframes are out of order (t=${kfs[i].t} after t=${kfs[i - 1].t}).`,
        });
        break;
      }
    }
    const last = kfs[kfs.length - 1];
    if (last.t > scenario.duration + 0.01) {
      issues.push({
        level: 'warn', code: 'keyframe-past-end',
        ua: 'Останній ключовий кадр поза тривалістю сценарію — його не буде відтворено.',
        en: 'The final keyframe lies past the scenario duration and will never play.',
      });
    }
    if (!kfs.some(k => k.camera)) {
      issues.push({
        level: 'warn', code: 'no-camera-cue',
        ua: 'У сценарії немає жодної камерної підказки — камера залишиться в позиції за замовчуванням.',
        en: 'No camera cue anywhere in the scenario — the camera will stay at its default pose.',
      });
    }
  }

  // --- 6. Highlight marks inside the shot ----------------------------------
  const cueScale = Math.max(0.15, sceneScale / 3);
  const frameRadius = dist * Math.tan((composition.fov * Math.PI) / 360);
  for (const step of scenario.steps ?? []) {
    for (const p of markPositions(step.marks)) {
      const world = Math.hypot(p[0], p[1], p[2]) * cueScale;
      if (world > frameRadius * 2.2) {
        issues.push({
          level: 'warn',
          code: 'mark-offscreen',
          ua: `Крок «${step.titleUA}»: підсвітка виходить за межі кадру.`,
          en: `Step "${step.titleEN}": a highlight sits outside the framed area.`,
        });
        break;
      }
    }
    if (step.at > scenario.duration) {
      issues.push({
        level: 'warn', code: 'step-past-end',
        ua: `Крок «${step.titleUA}» починається після кінця сценарію.`,
        en: `Step "${step.titleEN}" starts after the scenario ends.`,
      });
    }
  }

  const hasError = issues.some(i => i.level === 'error');
  return {
    issues,
    ok: !hasError,
    worst: hasError ? 'error' : issues.length ? 'warn' : null,
  };
}
