// Bottom-of-viewport cinema HUD: scenario picker + play/pause/scrub + narrator subtitle.

import { Play, Pause, Square, Film } from 'lucide-react';
import { CINEMA_SCENARIOS } from './scenarios';
import type { DirectorState } from './useDirector';

interface Props {
  lang: 'ua' | 'en';
  director: DirectorState;
}

export function CinemaPanel({ lang, director }: Props) {
  const s = director.scenario;
  const showNarrator = !!director.message;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none"
      style={{ bottom: 74, width: 'min(720px, calc(100vw - 32px))' }}
    >
      {/* Narrator subtitle */}
      {showNarrator && (
        <div
          className="mx-auto mb-2 rounded-md border border-border/60 bg-background/85 backdrop-blur px-3 py-2 text-[13px] leading-snug shadow-lg animate-fade-in pointer-events-auto"
          style={{ maxWidth: 640 }}
        >
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

        <button
          className="p-1 rounded hover:bg-muted disabled:opacity-30"
          onClick={director.toggle}
          disabled={!s}
          aria-label={director.playing ? 'Pause' : 'Play'}
        >
          {director.playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          className="p-1 rounded hover:bg-muted disabled:opacity-30"
          onClick={director.stop}
          disabled={!s}
          aria-label="Stop"
        >
          <Square size={14} />
        </button>

        <input
          type="range"
          min={0}
          max={s ? s.duration : 1}
          step={0.1}
          value={director.elapsed}
          onChange={(e) => director.scrub(parseFloat(e.target.value))}
          disabled={!s}
          className="flex-1 min-w-[120px] accent-primary"
        />
        <span className="w-14 text-right tabular-nums text-[11px] text-muted-foreground">
          {director.elapsed.toFixed(1)}s / {s ? s.duration.toFixed(0) : '–'}s
        </span>
      </div>
    </div>
  );
}
