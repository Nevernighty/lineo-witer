// Aggregated generation readout for the 3D simulation.
//
// One calm chip instead of dozens of floating joule popups: it animates the
// committed value every ~2 s and opens a draggable / snappable / resizable live
// chart window on click.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, X, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { useEnergyState, formatEnergy, formatPower, resetEnergy } from '@/store/useEnergyStore';
import { useAudioPrefs, toggleAudioMuted, setAudioVolume } from '@/utils/sounds';
import type { Lang } from '@/utils/i18n';

const L = {
  ua: { gen: 'Генерація', power: 'Потужність', energy: 'Енергія', live: 'Живий графік', reset: 'Скинути', close: 'Закрити', volume: 'Гучність' },
  en: { gen: 'Generation', power: 'Power', energy: 'Energy', live: 'Live chart', reset: 'Reset', close: 'Close', volume: 'Volume' },
};

/** Ease a displayed number toward its target so commits read as motion. */
function useAnimatedNumber(target: number) {
  const [value, setValue] = useState(target);
  const raf = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const from = value;
    const dur = 900;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setValue(from + (target - from) * eased);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

const Sparkline: React.FC<{ points: number[]; color: string; height: number; width: number }> = ({ points, color, height, width }) => {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1e-6);
  const d = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - (p / max) * (height - 6) - 3;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={`${d} L${width},${height} L0,${height} Z`} fill={color} opacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
};

interface ChartWindowProps { lang: Lang; onClose: () => void }

const ChartWindow: React.FC<ChartWindowProps> = ({ lang, onClose }) => {
  const t = L[lang] ?? L.ua;
  const energy = useEnergyState();
  const [pos, setPos] = useState({ x: 24, y: 90 });
  const [size, setSize] = useState({ w: 380, h: 240 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const resize = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (drag.current) {
      setPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy });
    } else if (resize.current) {
      const r = resize.current;
      setSize({
        w: Math.max(280, Math.min(window.innerWidth - 40, r.w + (e.clientX - r.x))),
        h: Math.max(180, Math.min(window.innerHeight - 80, r.h + (e.clientY - r.y))),
      });
    }
  }, []);

  const onPointerUp = useCallback(() => {
    if (drag.current) {
      // Snap to the nearest screen edge when released close to it.
      setPos(p => {
        const snap = 28;
        const maxX = window.innerWidth - size.w - 12;
        const maxY = window.innerHeight - size.h - 12;
        let { x, y } = p;
        if (x < snap) x = 12; else if (x > maxX - snap) x = Math.max(12, maxX);
        if (y < snap + 50) y = 62; else if (y > maxY - snap) y = Math.max(62, maxY);
        return { x: Math.max(0, Math.min(maxX, x)), y: Math.max(0, Math.min(maxY, y)) };
      });
    }
    drag.current = null;
    resize.current = null;
  }, [size.w, size.h]);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const powerSeries = energy.history.map(h => h.power);
  const energySeries = energy.history.map(h => h.total);
  const chartW = size.w - 28;
  const chartH = Math.max(50, (size.h - 118) / 2);

  return (
    <div
      className="fixed z-[60] rounded-lg border border-primary/40 bg-background/95 backdrop-blur shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, pointerEvents: 'auto' }}
    >
      <div
        className="flex cursor-grab items-center gap-2 border-b border-primary/20 px-2.5 py-1.5 active:cursor-grabbing"
        onPointerDown={(e) => { drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }; }}
      >
        <Activity className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-primary">{t.live}</span>
        <button onClick={resetEnergy} className="ml-auto rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-primary">{t.reset}</button>
        <button onClick={onClose} className="rounded p-0.5 text-muted-foreground hover:text-destructive" title={t.close}><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className="space-y-2 px-3 py-2">
        <div>
          <div className="mb-0.5 flex items-baseline justify-between text-[10px] text-muted-foreground">
            <span>{t.power}</span>
            <span className="font-mono text-primary">{formatPower(energy.power)}</span>
          </div>
          <Sparkline points={powerSeries} color="#39ff14" width={chartW} height={chartH} />
        </div>
        <div>
          <div className="mb-0.5 flex items-baseline justify-between text-[10px] text-muted-foreground">
            <span>{t.energy}</span>
            <span className="font-mono text-cyan-400">{formatEnergy(energy.total)}</span>
          </div>
          <Sparkline points={energySeries} color="#22d3ee" width={chartW} height={chartH} />
        </div>
      </div>

      <div
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize text-muted-foreground/70"
        onPointerDown={(e) => { resize.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }; }}
      >
        <Maximize2 className="h-3 w-3 rotate-90" />
      </div>
    </div>
  );
};

export const EnergyHud: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = L[lang] ?? L.ua;
  const energy = useEnergyState();
  const audio = useAudioPrefs();
  const [open, setOpen] = useState(false);
  const power = useAnimatedNumber(energy.power);
  const total = useAnimatedNumber(energy.total);

  return (
    <>
      <div className="absolute bottom-16 left-3 z-50 flex items-center gap-1.5" style={{ pointerEvents: 'auto' }}>
        <button
          onClick={() => setOpen(o => !o)}
          className="group flex items-center gap-2 rounded-full border border-primary/40 bg-background/80 px-3 py-1.5 backdrop-blur transition-colors hover:border-primary"
          title={t.live}
        >
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[11px] text-primary">{formatPower(power)}</span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="font-mono text-[11px] text-cyan-400">{formatEnergy(total)}</span>
        </button>

        <div className="flex items-center gap-1 rounded-full border border-border/50 bg-background/80 px-2 py-1 backdrop-blur">
          <button onClick={toggleAudioMuted} title={audio.muted ? 'unmute' : 'mute'} className="text-muted-foreground hover:text-primary">
            {audio.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <input
            type="range" min={0} max={1} step={0.05} value={audio.volume}
            onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
            className="h-1 w-14 accent-primary" title={t.volume}
          />
        </div>
      </div>

      {open && <ChartWindow lang={lang} onClose={() => setOpen(false)} />}
    </>
  );
};

export default EnergyHud;
