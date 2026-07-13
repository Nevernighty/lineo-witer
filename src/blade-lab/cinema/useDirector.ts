// Director hook v2 — plays a CinemaScenario against BladeLab state.
// - Interpolates numeric fields between keyframes
// - Fires vfx bursts, view-mode / rotor / helical / preset switches on kf crossings
// - Exposes hud, chapter, camera cue for the panel & 3D layers

import { useEffect, useRef, useState, useCallback } from 'react';
import type { CinemaScenario, CinemaKeyframe, CameraCue, HudCard } from './types';
import type { ViewMode, RotorType } from '@/aero/buildBladeGeometry';
import type { VfxBus } from './VfxBus';

export interface DirectorAdapters {
  setWindSpeed: (v: number) => void;
  setTsr: (v: number) => void;
  setTurbulenceBoost: (v: number) => void;
  setFailureBoost: (v: number) => void;
  setViewMode?: (v: ViewMode) => void;
  setRotorType?: (v: RotorType) => void;
  setHelical?: (v: number) => void;
  setPreset?: (id: string) => void;
  vfxBus?: VfxBus;
}

export interface DirectorState {
  scenario: CinemaScenario | null;
  playing: boolean;
  elapsed: number;
  progress: number;
  speed: number;
  message: { ua: string; en: string } | null;
  target: CinemaKeyframe['target'];
  chapter: { ua: string; en: string } | null;
  hud: HudCard | null;
  cameraCue: CameraCue | null;
  keyframeTimes: number[];
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
  scrub: (t: number) => void;
  setSpeed: (s: number) => void;
  nextKf: () => void;
  prevKf: () => void;
  load: (s: CinemaScenario | null) => void;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function pickNumericAt<K extends 'windSpeed' | 'tsr' | 'turbulence' | 'failureBoost' | 'helical'>(
  kfs: CinemaKeyframe[], t: number, key: K, fallback: number,
): number {
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

function pickDiscreteAt<K extends 'viewMode' | 'rotorType' | 'preset' | 'target' | 'message' | 'chapter' | 'hud' | 'camera'>(
  kfs: CinemaKeyframe[], t: number, key: K,
): CinemaKeyframe[K] | null {
  let val: CinemaKeyframe[K] | null = null;
  for (const kf of kfs) {
    if (kf.t > t) break;
    if (kf[key] !== undefined) val = kf[key] as CinemaKeyframe[K];
  }
  return val;
}

export function useDirector(adapters: DirectorAdapters): DirectorState {
  const [scenario, setScenario] = useState<CinemaScenario | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [message, setMessage] = useState<{ ua: string; en: string } | null>(null);
  const [target, setTarget] = useState<CinemaKeyframe['target']>(null);
  const [chapter, setChapter] = useState<{ ua: string; en: string } | null>(null);
  const [hud, setHud] = useState<HudCard | null>(null);
  const [cameraCue, setCameraCue] = useState<CameraCue | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const lastKfIdxRef = useRef<number>(-1);
  const adaptersRef = useRef(adapters);
  adaptersRef.current = adapters;

  const applyDiscrete = useCallback((sc: CinemaScenario, t: number, fireVfx: boolean) => {
    const kf = sc.keyframes;
    setMessage((pickDiscreteAt(kf, t, 'message') as any) ?? null);
    setTarget((pickDiscreteAt(kf, t, 'target') as any) ?? null);
    setChapter((pickDiscreteAt(kf, t, 'chapter') as any) ?? null);
    setHud((pickDiscreteAt(kf, t, 'hud') as any) ?? null);
    setCameraCue((pickDiscreteAt(kf, t, 'camera') as any) ?? null);

    const vm = pickDiscreteAt(kf, t, 'viewMode') as ViewMode | null;
    if (vm && adaptersRef.current.setViewMode) adaptersRef.current.setViewMode(vm);
    const rt = pickDiscreteAt(kf, t, 'rotorType') as RotorType | null;
    if (rt && adaptersRef.current.setRotorType) adaptersRef.current.setRotorType(rt);
    const pr = pickDiscreteAt(kf, t, 'preset') as string | null;
    if (pr && adaptersRef.current.setPreset) adaptersRef.current.setPreset(pr);

    if (fireVfx && adaptersRef.current.vfxBus) {
      // fire vfx bursts whose kf was crossed since last tick
      const bus = adaptersRef.current.vfxBus;
      const idx = kf.reduce((acc, k, i) => (k.t <= t ? i : acc), -1);
      for (let i = lastKfIdxRef.current + 1; i <= idx; i++) {
        const evs = kf[i]?.vfx;
        if (evs) evs.forEach(e => bus.emit(e));
      }
      lastKfIdxRef.current = idx;
    }
  }, []);

  const apply = useCallback((sc: CinemaScenario, t: number, fireVfx = true) => {
    const kf = sc.keyframes;
    adaptersRef.current.setWindSpeed(pickNumericAt(kf, t, 'windSpeed', 5));
    adaptersRef.current.setTsr(pickNumericAt(kf, t, 'tsr', 4));
    adaptersRef.current.setTurbulenceBoost(pickNumericAt(kf, t, 'turbulence', 0));
    adaptersRef.current.setFailureBoost(pickNumericAt(kf, t, 'failureBoost', 0));
    const h = pickNumericAt(kf, t, 'helical', NaN);
    if (!Number.isNaN(h) && adaptersRef.current.setHelical) adaptersRef.current.setHelical(h);
    applyDiscrete(sc, t, fireVfx);
  }, [applyDiscrete]);

  useEffect(() => {
    if (!playing || !scenario) return;
    lastTsRef.current = performance.now();
    const tick = (now: number) => {
      const dt = ((now - lastTsRef.current) / 1000) * speed;
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
  }, [playing, scenario, speed, apply]);

  useEffect(() => {
    if (scenario) {
      lastKfIdxRef.current = -1;
      adaptersRef.current.vfxBus?.clear();
      apply(scenario, 0, true);
    } else {
      adaptersRef.current.setTurbulenceBoost(0);
      adaptersRef.current.setFailureBoost(0);
      setMessage(null); setTarget(null); setChapter(null); setHud(null); setCameraCue(null);
      adaptersRef.current.vfxBus?.clear();
    }
    setElapsed(0);
  }, [scenario, apply]);

  const seek = useCallback((t: number) => {
    if (!scenario) return;
    const clamped = Math.max(0, Math.min(scenario.duration, t));
    // when scrubbing, don't re-fire past vfx bursts
    lastKfIdxRef.current = scenario.keyframes.reduce((acc, k, i) => (k.t <= clamped ? i : acc), -1);
    setElapsed(clamped);
    apply(scenario, clamped, false);
  }, [scenario, apply]);

  return {
    scenario,
    playing,
    elapsed,
    progress: scenario ? elapsed / scenario.duration : 0,
    speed,
    message, target, chapter, hud, cameraCue,
    keyframeTimes: scenario?.keyframes.map(k => k.t) ?? [],
    play: () => { if (scenario) setPlaying(true); },
    pause: () => setPlaying(false),
    toggle: () => setPlaying(p => (scenario ? !p : false)),
    stop: () => { setPlaying(false); seek(0); },
    scrub: seek,
    setSpeed: (s: number) => setSpeed(s),
    nextKf: () => {
      if (!scenario) return;
      const nk = scenario.keyframes.find(k => k.t > elapsed + 0.01);
      seek(nk ? nk.t : scenario.duration);
    },
    prevKf: () => {
      if (!scenario) return;
      const prior = [...scenario.keyframes].reverse().find(k => k.t < elapsed - 0.01);
      seek(prior ? prior.t : 0);
    },
    load: (s) => { setPlaying(false); setScenario(s); },
  };
}
