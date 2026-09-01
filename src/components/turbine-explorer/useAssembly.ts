// Playback clock for the guided assembly sequence.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildAssemblySteps, type AssemblyStep } from '@/data/turbineParts/assembly';

const STEP_MS = 2400;
/** Progress state is throttled — PartMesh damping smooths the rest. */
const TICK_MS = 70;

export interface AssemblyApi {
  steps: AssemblyStep[];
  active: boolean;
  playing: boolean;
  stepIndex: number;
  progress: number;
  step: AssemblyStep | null;
  /** 0 = fully exploded, 1 = seated in place. */
  placement: Map<string, number>;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (index: number, progress?: number) => void;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function useAssembly(turbineId: string, initialStep = -1): AssemblyApi {
  const steps = useMemo(() => buildAssemblySteps(turbineId), [turbineId]);
  const [stepIndex, setStepIndex] = useState(initialStep);
  const [progress, setProgress] = useState(initialStep >= 0 ? 1 : 0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number>();
  const last = useRef(0);
  const acc = useRef(0);

  useEffect(() => { setStepIndex(-1); setProgress(0); setPlaying(false); }, [turbineId]);

  useEffect(() => {
    if (!playing) return;
    last.current = performance.now();
    acc.current = 0;
    const loop = (now: number) => {
      const dt = Math.min(120, now - last.current);
      last.current = now;
      acc.current += dt;
      if (acc.current >= TICK_MS) {
        const delta = acc.current / STEP_MS;
        acc.current = 0;
        setProgress((p) => {
          const nextP = p + delta;
          if (nextP < 1) return nextP;
          let done = false;
          setStepIndex((i) => {
            if (i + 1 >= steps.length) { done = true; return i; }
            return i + 1;
          });
          if (done) { setPlaying(false); return 1; }
          return 0;
        });
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [playing, steps.length]);

  const placement = useMemo(() => {
    const map = new Map<string, number>();
    steps.forEach((s, i) => {
      s.partIds.forEach((id, j) => {
        if (stepIndex < 0) { map.set(id, 0); return; }
        if (i < stepIndex) { map.set(id, 1); return; }
        if (i > stepIndex) { map.set(id, 0); return; }
        const n = s.partIds.length;
        const span = 1 / (n + 1);
        const local = (progress - j * span) / (1 - j * span || 1);
        map.set(id, ease(Math.max(0, Math.min(1, local))));
      });
    });
    return map;
  }, [steps, stepIndex, progress]);

  const seek = useCallback((index: number, p = 1) => {
    setStepIndex(Math.max(-1, Math.min(steps.length - 1, index)));
    setProgress(p);
  }, [steps.length]);

  const start = useCallback(() => {
    setStepIndex(i => (i < 0 ? 0 : i));
    setProgress(p => (p >= 1 ? 0 : p));
    setPlaying(true);
  }, []);

  const stop = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? stop() : start()), [playing, start, stop]);
  const next = useCallback(() => { setPlaying(false); seek(stepIndex + 1, 1); }, [seek, stepIndex]);
  const prev = useCallback(() => { setPlaying(false); seek(stepIndex - 1, 1); }, [seek, stepIndex]);

  return {
    steps,
    active: stepIndex >= 0,
    playing,
    stepIndex,
    progress,
    step: stepIndex >= 0 ? steps[stepIndex] ?? null : null,
    placement,
    start, stop, toggle, next, prev, seek,
  };
}
