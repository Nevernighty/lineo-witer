// Director hook — plays a CinemaScenario against BladeLab state.
// Interpolates windSpeed / tsr / turbulence / failureBoost between keyframes
// and surfaces the currently-active narrator message.

import { useEffect, useRef, useState } from 'react';
import type { CinemaScenario, CinemaKeyframe } from './types';

export interface DirectorAdapters {
  setWindSpeed: (v: number) => void;
  setTsr: (v: number) => void;
  setTurbulenceBoost: (v: number) => void;
  setFailureBoost: (v: number) => void;
}

export interface DirectorState {
  scenario: CinemaScenario | null;
  playing: boolean;
  elapsed: number;      // seconds
  progress: number;     // 0..1
  message: { ua: string; en: string } | null;
  target: CinemaKeyframe['target'];
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
  scrub: (t: number) => void;
  load: (s: CinemaScenario | null) => void;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function pickNumericAt<K extends 'windSpeed' | 'tsr' | 'turbulence' | 'failureBoost'>(
  kfs: CinemaKeyframe[], t: number, key: K, fallback: number,
): number {
  // Find the surrounding keyframes that actually define `key`.
  let prev: CinemaKeyframe | null = null;
  let next: CinemaKeyframe | null = null;
  for (const kf of kfs) {
    if (kf[key] === undefined) continue;
    if (kf.t <= t) prev = kf;
    else { next = kf; break; }
  }
  if (!prev && !next) return fallback;
  if (prev && !next) return prev[key] as number;
  if (!prev && next) return next[key] as number;
  const span = next!.t - prev!.t;
  const u = span > 0 ? (t - prev!.t) / span : 0;
  return lerp(prev![key] as number, next![key] as number, Math.min(1, Math.max(0, u)));
}

function pickMessageAt(kfs: CinemaKeyframe[], t: number) {
  let msg: CinemaKeyframe['message'] | null = null;
  let target: CinemaKeyframe['target'] = null;
  for (const kf of kfs) {
    if (kf.t > t) break;
    if (kf.message) msg = kf.message;
    if (kf.target !== undefined) target = kf.target;
  }
  return { msg, target };
}

export function useDirector(adapters: DirectorAdapters): DirectorState {
  const [scenario, setScenario] = useState<CinemaScenario | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState<{ ua: string; en: string } | null>(null);
  const [target, setTarget] = useState<CinemaKeyframe['target']>(null);

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const adaptersRef = useRef(adapters);
  adaptersRef.current = adapters;

  // Apply state at time t.
  const apply = (sc: CinemaScenario, t: number) => {
    const kf = sc.keyframes;
    adaptersRef.current.setWindSpeed(pickNumericAt(kf, t, 'windSpeed', 5));
    adaptersRef.current.setTsr(pickNumericAt(kf, t, 'tsr', 4));
    adaptersRef.current.setTurbulenceBoost(pickNumericAt(kf, t, 'turbulence', 0));
    adaptersRef.current.setFailureBoost(pickNumericAt(kf, t, 'failureBoost', 0));
    const { msg, target } = pickMessageAt(kf, t);
    setMessage(msg);
    setTarget(target);
  };

  useEffect(() => {
    if (!playing || !scenario) return;
    lastTsRef.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTsRef.current) / 1000;
      lastTsRef.current = now;
      setElapsed(prev => {
        const next = Math.min(scenario.duration, prev + dt);
        apply(scenario, next);
        if (next >= scenario.duration) {
          setPlaying(false);
          return scenario.duration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, scenario]);

  // Reset scrub effects on load.
  useEffect(() => {
    if (scenario) apply(scenario, 0);
    else {
      adaptersRef.current.setTurbulenceBoost(0);
      adaptersRef.current.setFailureBoost(0);
      setMessage(null); setTarget(null);
    }
    setElapsed(0);
  }, [scenario]);

  return {
    scenario,
    playing,
    elapsed,
    progress: scenario ? elapsed / scenario.duration : 0,
    message,
    target,
    play: () => { if (scenario) setPlaying(true); },
    pause: () => setPlaying(false),
    toggle: () => setPlaying(p => (scenario ? !p : false)),
    stop: () => { setPlaying(false); setElapsed(0); if (scenario) apply(scenario, 0); },
    scrub: (t: number) => {
      if (!scenario) return;
      const clamped = Math.max(0, Math.min(scenario.duration, t));
      setElapsed(clamped);
      apply(scenario, clamped);
    },
    load: (s) => { setPlaying(false); setScenario(s); },
  };
}
