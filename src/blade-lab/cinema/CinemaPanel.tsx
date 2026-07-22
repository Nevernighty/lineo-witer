// Bottom-of-viewport cinema HUD v3: responsive width driven by side-panel CSS vars,
// collapsible chapter/HUD strip, and safer scrubbing.

import { useState } from 'react';
import { Play, Pause, Square, Film, ChevronLeft, ChevronRight, Gauge, ChevronDown, ChevronUp } from 'lucide-react';
import { CINEMA_SCENARIOS } from './scenarios';
import type { DirectorState } from './useDirector';

interface Props {
  lang: 'ua' | 'en';
  director: DirectorState;
}

export function CinemaPanel({ lang, director }: Props) {
  const s = director.scenario;
  const [collapsed, setCollapsed] = useState(false);
  const hasNarrator = !!director.message;
  const hasChapter = !!director.chapter;
  const hasHud = !!director.hud && ((director.hud.metrics?.length ?? 0) > 0 || !!director.hud.formula);
  const showRich = !collapsed && (hasNarrator || hasChapter || hasHud);

  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{
        bottom: 74,
        left: 'calc(var(--panel-l, 0px) + 12px)',
        right: 'calc(var(--panel-r, 0px) + 12px)',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 920 }}>

      {/* Chapter title card */}
      {showRich && hasChapter && (
        <div className="mx-auto mb-2 text-center animate-fade-in">
          <div className="inline-block px-4 py-1 rounded-md border border-primary/40 bg-background/85 backdrop-blur text-primary tracking-wide font-semibold text-[14px] shadow-lg">
            {lang === 'ua' ? director.chapter!.ua : director.chapter!.en}
          </div>
        </div>
      )}


      {/* Narrator + HUD row */}
      {showRich && (hasNarrator || hasHud) && (
        <div className="mx-auto mb-2 flex gap-2 items-stretch animate-fade-in">
          {hasNarrator && (
            <div className="flex-1 rounded-md border border-border/60 bg-background/85 backdrop-blur px-3 py-2 text-[13px] leading-snug shadow-lg pointer-events-auto">
              <div className="text-foreground">
                {lang === 'ua' ? director.message!.ua : director.message!.en}
              </div>
              {director.target && (
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {lang === 'ua' ? 'фокус' : 'focus'}: {director.target}
                </div>
              )}
            </div>
          )}
          {hasHud && (
            <div className="w-[260px] max-w-[45%] shrink-0 rounded-md border border-primary/30 bg-background/85 backdrop-blur px-3 py-2 shadow-lg pointer-events-auto">
              {director.hud!.formula && (
                <div className="font-mono text-[11px] text-primary/90 mb-1 truncate" title={director.hud!.formula}>
                  {director.hud!.formula}
                </div>
              )}
              {director.hud!.metrics && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  {director.hud!.metrics.map((m, i) => (
                    <div key={i} className="flex items-baseline justify-between text-[11px] gap-1">
                      <span className="text-muted-foreground truncate">{m.label}</span>
                      <span className={`font-mono tabular-nums ${m.warn ? 'text-orange-400' : 'text-primary'}`}>
                        {m.value}{m.unit ? <span className="text-muted-foreground ml-0.5">{m.unit}</span> : null}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}


      {/* Control ribbon */}
      <div className="mx-auto flex items-center gap-2 rounded-md border border-border/60 bg-background/85 backdrop-blur px-2 py-1.5 shadow-lg pointer-events-auto">
        <Film size={14} className="text-muted-foreground shrink-0" />
        <select
          className="min-w-[180px] flex-1 bg-transparent text-[12px] outline-none"
          value={s?.id ?? ''}
          onChange={(e) => {
            const sc = CINEMA_SCENARIOS.find(x => x.id === e.target.value) ?? null;
            director.load(sc);
          }}
        >
          <option value="">{lang === 'ua' ? '— Оберіть сценарій —' : '— Choose scenario —'}</option>
          {CINEMA_SCENARIOS.map(sc => (
            <option key={sc.id} value={sc.id}>{lang === 'ua' ? sc.nameUA : sc.nameEN}</option>
          ))}
        </select>

        <button className="p-1 rounded hover:bg-muted disabled:opacity-30" onClick={director.prevKf} disabled={!s} aria-label="Prev keyframe">
          <ChevronLeft size={14} />
        </button>
        <button
          className="p-1 rounded hover:bg-muted disabled:opacity-30"
          onClick={director.toggle}
          disabled={!s}
          aria-label={director.playing ? 'Pause' : 'Play'}
        >
          {director.playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button className="p-1 rounded hover:bg-muted disabled:opacity-30" onClick={director.nextKf} disabled={!s} aria-label="Next keyframe">
          <ChevronRight size={14} />
        </button>
        <button className="p-1 rounded hover:bg-muted disabled:opacity-30" onClick={director.stop} disabled={!s} aria-label="Stop">
          <Square size={14} />
        </button>

        <div className="relative flex-1 min-w-[140px] h-6 flex items-center">
          <input
            type="range" min={0} max={s ? s.duration : 1} step={0.05}
            value={director.elapsed}
            onChange={(e) => director.scrub(parseFloat(e.target.value))}
            disabled={!s}
            className="absolute inset-0 w-full accent-primary z-10"
          />
          {/* keyframe ticks */}
          {s && (
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-[2px] bg-border/40 pointer-events-none">
              {director.keyframeTimes.map((kt, i) => (
                <div key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-[2px] h-[8px] bg-primary/60 rounded-full"
                  style={{ left: `${(kt / s.duration) * 100}%` }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <Gauge size={11} />
          {[0.5, 1, 2].map(sp => (
            <button key={sp}
              onClick={() => director.setSpeed(sp)}
              className={`px-1 rounded ${director.speed === sp ? 'bg-primary/20 text-primary' : 'hover:bg-muted'}`}
            >{sp}×</button>
          ))}
        </div>

        <span className="w-14 text-right tabular-nums text-[11px] text-muted-foreground">
          {director.elapsed.toFixed(1)}s / {s ? s.duration.toFixed(0) : '–'}s
        </span>
        {(hasNarrator || hasChapter || hasHud) && (
          <button
            className="p-1 rounded hover:bg-muted"
            onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? 'Expand narration' : 'Collapse narration'}
            title={collapsed ? (lang === 'ua' ? 'Показати оповідача' : 'Show narrator') : (lang === 'ua' ? 'Приховати' : 'Hide')}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>
      </div>
    </div>
  );
}

