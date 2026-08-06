// CinemaPanel — adaptive scenario HUD. It measures itself and the canvas and
// reports the vertical band it occupies so the cinema camera composes inside the
// remaining free area; density collapses automatically on small canvases.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Camera, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Film, Maximize2, Pause, Play, RotateCcw, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CINEMA_SCENARIOS } from './scenarios';
import type { DirectorState } from './useDirector';
import { reportHudBand } from './hudLayout';
import type { Composition, Framing } from './useComposition';

interface Props {
  lang: 'ua' | 'en';
  director: DirectorState;
  composition: Composition;
  onComposition: (patch: Partial<Composition>) => void;
  onResetComposition: () => void;
}

const FRAMINGS: Array<{ id: Framing; ua: string; en: string }> = [
  { id: 'wide', ua: 'Загальний', en: 'Wide' },
  { id: 'medium', ua: 'Середній', en: 'Medium' },
  { id: 'detail', ua: 'Деталь', en: 'Detail' },
];

export function CinemaPanel({ lang, director, composition, onComposition, onResetComposition }: Props) {
  const scenario = director.scenario;
  const [collapsed, setCollapsed] = useState(false);
  const [showComp, setShowComp] = useState(false);
  const [box, setBox] = useState({ w: 900, h: 700 });
  const hostRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Track the canvas area size (the panel's positioned parent).
  useLayoutEffect(() => {
    const parent = hostRef.current?.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(() => setBox({ w: parent.clientWidth, h: parent.clientHeight }));
    ro.observe(parent);
    setBox({ w: parent.clientWidth, h: parent.clientHeight });
    return () => ro.disconnect();
  }, []);

  const tightHeight = box.h < 470;
  const narrow = box.w < 660;
  const rich = !collapsed && !tightHeight && !!scenario;
  const bottomOffset = tightHeight ? 6 : 14;

  // Report the occupied band (panel + its offset) to the shared layout store.
  useEffect(() => {
    if (!scenario) { reportHudBand('cinema-panel', null); return; }
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      reportHudBand('cinema-panel', { bottom: el.offsetHeight + bottomOffset + 8 });
    });
    ro.observe(el);
    reportHudBand('cinema-panel', { bottom: el.offsetHeight + bottomOffset + 8 });
    return () => { ro.disconnect(); reportHudBand('cinema-panel', null); };
  }, [scenario, rich, showComp, bottomOffset]);

  const currentStep = scenario
    ? Math.max(0, scenario.keyframes.reduce((last, keyframe, index) => (keyframe.t <= director.elapsed ? index : last), 0))
    : 0;

  return (
    <section
      ref={hostRef}
      className="absolute inset-x-2 z-30 pointer-events-none"
      style={{ bottom: bottomOffset }}
      aria-label={lang === 'ua' ? 'Кінематографічний сценарій' : 'Cinematic scenario'}
    >
      <div
        ref={cardRef}
        className="mx-auto overflow-hidden rounded-md border border-border/70 bg-background/90 shadow-2xl backdrop-blur-xl pointer-events-auto"
        style={{ maxWidth: Math.max(320, Math.min(820, box.w - 16)) }}
      >
        {rich && (
          <div className={`gap-3 border-b border-border/50 px-3 py-2 ${narrow ? 'flex flex-col' : 'grid grid-cols-[minmax(0,1.2fr)_minmax(200px,0.8fr)]'}`}>
            <div className="min-w-0 border-l-2 border-primary pl-3">
              <div className="mb-1 flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
                <span>{lang === 'ua' ? 'Крок' : 'Step'} {currentStep + 1}/{scenario?.keyframes.length ?? 0}</span>
                {director.target && <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 text-primary">{director.target}</span>}
              </div>
              <h2 className="truncate text-sm font-semibold text-primary">
                {director.chapter ? (lang === 'ua' ? director.chapter.ua : director.chapter.en) : (lang === 'ua' ? scenario?.nameUA : scenario?.nameEN)}
              </h2>
              {director.message && <p className="mt-1 text-[12px] leading-4 text-foreground">{lang === 'ua' ? director.message.ua : director.message.en}</p>}
            </div>
            <div className={`min-w-0 ${narrow ? 'border-t border-border/50 pt-1.5' : 'border-l border-border/60 pl-3'}`}>
              {director.hud?.formula && <div className="truncate font-mono text-[11px] text-primary" title={director.hud.formula}>{director.hud.formula}</div>}
              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                {director.hud?.metrics?.map((metric) => (
                  <div key={`${metric.label}-${metric.value}`} className="flex min-w-0 items-baseline justify-between gap-2 text-[10px]">
                    <span className="truncate text-muted-foreground">{metric.label}</span>
                    <span className={metric.warn ? 'font-mono text-orange-400' : 'font-mono text-primary'}>{metric.value}{metric.unit ? ` ${metric.unit}` : ''}</span>
                  </div>
                ))}
              </div>
              {director.hud?.legend && (
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 border-t border-border/40 pt-1.5">
                  {director.hud.legend.map((item) => (
                    <span key={item.labelEN} className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                      <i className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {lang === 'ua' ? item.labelUA : item.labelEN}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showComp && scenario && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border/50 bg-card/40 px-3 py-1.5 text-[10px]">
            <span className="uppercase tracking-wider text-muted-foreground">{lang === 'ua' ? 'Кадр' : 'Framing'}</span>
            <div className="flex overflow-hidden rounded border border-border/50">
              {FRAMINGS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onComposition({ framing: f.id })}
                  className={`px-2 py-0.5 ${composition.framing === f.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-card'}`}
                >
                  {lang === 'ua' ? f.ua : f.en}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 text-muted-foreground">
              FOV
              <input
                type="range" min={24} max={72} step={1} value={composition.fov}
                onChange={(e) => onComposition({ fov: Number(e.target.value) })}
                className="h-1 w-24 accent-primary"
              />
              <span className="w-6 tabular-nums text-primary">{composition.fov}</span>
            </label>
            <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={onResetComposition} title={lang === 'ua' ? 'Скинути кадр' : 'Reset framing'}>
              <RotateCcw />
            </Button>
          </div>
        )}

        <div className={`items-center gap-2 px-2 py-1.5 ${narrow ? 'grid grid-cols-[1fr_auto]' : 'grid grid-cols-[minmax(160px,1.1fr)_auto_minmax(140px,1fr)_auto]'}`}>
          <label className="flex min-w-0 items-center gap-2">
            <Film className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <select
              className="h-7 min-w-0 flex-1 truncate rounded-sm border border-border/50 bg-card px-2 text-[11px] text-foreground outline-none focus:border-primary"
              value={scenario?.id ?? ''}
              onChange={(event) => director.load(CINEMA_SCENARIOS.find((item) => item.id === event.target.value) ?? null)}
            >
              <option value="">{lang === 'ua' ? 'Оберіть сценарій' : 'Choose scenario'}</option>
              {CINEMA_SCENARIOS.map((item) => <option key={item.id} value={item.id}>{lang === 'ua' ? item.nameUA : item.nameEN}</option>)}
            </select>
          </label>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={director.prevKf} disabled={!scenario} aria-label="Previous step"><ChevronLeft /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={director.toggle} disabled={!scenario} aria-label={director.playing ? 'Pause' : 'Play'}>{director.playing ? <Pause /> : <Play />}</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={director.nextKf} disabled={!scenario} aria-label="Next step"><ChevronRight /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={director.stop} disabled={!scenario} aria-label="Stop"><Square /></Button>
          </div>
          <div className={`relative flex h-7 min-w-0 items-center ${narrow ? 'col-span-2 row-start-2' : ''}`}>
            <input
              className="absolute inset-0 z-10 w-full accent-primary" type="range" min={0} max={scenario?.duration ?? 1} step={0.05}
              value={director.elapsed} onChange={(event) => director.scrub(Number(event.target.value))} disabled={!scenario} aria-label="Scenario timeline"
            />
            {scenario && (
              <div className="pointer-events-none absolute inset-x-2 top-1/2 h-px bg-border">
                {director.keyframeTimes.map((time) => (
                  <i key={time} className="absolute top-1/2 h-1.5 w-px -translate-y-1/2 bg-primary/70" style={{ left: `${(time / scenario.duration) * 100}%` }} />
                ))}
              </div>
            )}
          </div>
          <div className={`flex items-center justify-end gap-1 text-[10px] text-muted-foreground ${narrow ? 'col-span-2 row-start-3' : ''}`}>
            <span className="w-[70px] text-right tabular-nums">{director.elapsed.toFixed(1)} / {scenario?.duration ?? 0}s</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowComp((v) => !v)} disabled={!scenario} title={lang === 'ua' ? 'Композиція камери' : 'Camera composition'} aria-label="Composition">
              <Maximize2 />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={director.releaseCamera} disabled={!director.cameraControlled} title={lang === 'ua' ? 'Ручна камера' : 'Manual camera'} aria-label="Release camera">
              <Camera />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed((value) => !value)} disabled={!scenario} aria-label={collapsed ? 'Expand' : 'Collapse'}>
              {collapsed ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </div>

        {rich && scenario?.reference && (
          <div className="truncate border-t border-border/40 px-3 py-1 text-[9px] text-muted-foreground" title={scenario.reference}>{scenario.reference}</div>
        )}
      </div>
    </section>
  );
}
