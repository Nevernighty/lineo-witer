// Synthesized UI + environment sounds via Web Audio API — no external files.
// All output goes through one master gain so mute/volume is global and persisted.
import { useSyncExternalStore } from 'react';

const PREF_KEY = 'lineo.audio.v1';

interface AudioPrefs { muted: boolean; volume: number }

function loadPrefs(): AudioPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      const p = JSON.parse(raw) as AudioPrefs;
      return { muted: !!p.muted, volume: Math.min(1, Math.max(0, p.volume ?? 0.7)) };
    }
  } catch {}
  return { muted: false, volume: 0.7 };
}

let prefs: AudioPrefs = typeof window !== 'undefined' ? loadPrefs() : { muted: false, volume: 0.7 };
const listeners = new Set<() => void>();

let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    master = audioCtx.createGain();
    master.gain.value = prefs.muted ? 0 : prefs.volume;
    master.connect(audioCtx.destination);
  }
  return audioCtx;
}

/** Destination every synthesized voice must connect to. */
function out(): AudioNode {
  const ctx = getCtx();
  return master ?? ctx.destination;
}

function applyMaster() {
  if (!master || !audioCtx) return;
  master.gain.setTargetAtTime(prefs.muted ? 0 : prefs.volume, audioCtx.currentTime, 0.05);
}

function persist() {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {}
  applyMaster();
  listeners.forEach(l => l());
}

export function setAudioMuted(muted: boolean) { prefs = { ...prefs, muted }; persist(); }
export function toggleAudioMuted() { setAudioMuted(!prefs.muted); }
export function setAudioVolume(volume: number) { prefs = { ...prefs, volume: Math.min(1, Math.max(0, volume)) }; persist(); }
export function getAudioPrefs(): AudioPrefs { return prefs; }

function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
const snap = () => prefs;
export function useAudioPrefs(): AudioPrefs { return useSyncExternalStore(subscribe, snap, snap); }

/** Skip synthesis entirely while muted so the audio graph stays idle. */
function silent() { return prefs.muted || prefs.volume <= 0.001; }

// ── Rate limiting: no machine-gun bursts ─────────────────────
const lastPlayed: Record<string, number> = {};
function gate(key: string, minGapMs: number) {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (now - (lastPlayed[key] ?? -1e9) < minGapMs) return false;
  lastPlayed[key] = now;
  return true;
}

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    // Slightly brown-ish noise — much softer than pure white noise.
    last = (last + (Math.random() * 2 - 1) * 0.35) * 0.96;
    data[i] = last;
  }
  return buffer;
}

export function playPlaceSound() {
  if (silent() || !gate('place', 60)) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); osc2.connect(gain); gain.connect(out());
    osc.type = 'sine'; osc2.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(); osc.stop(ctx.currentTime + 0.12);
    osc2.start(); osc2.stop(ctx.currentTime + 0.12);
  } catch {}
}

export function playRotateSound() {
  if (silent() || !gate('rotate', 50)) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(out());
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(); osc.stop(ctx.currentTime + 0.05);
  } catch {}
}

export function playClearSound() {
  if (silent() || !gate('clear', 120)) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(out());
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

export function playScaleSound() {
  if (silent() || !gate('scale', 50)) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(out());
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(); osc.stop(ctx.currentTime + 0.06);
  } catch {}
}

/**
 * Soft, airy "capture" chime. Heavily rate-limited (once per 900 ms) so a
 * storm of particle absorptions can never turn into the old buzzing.
 */
export function playAbsorbSound() {
  if (silent() || !gate('absorb', 900)) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 1.2;
    osc.connect(filter); filter.connect(gain); gain.connect(out());
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1180, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.022, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

export function playWindGustSound() {
  if (silent() || !gate('gust', 1500)) return;
  try {
    const ctx = getCtx();
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx, 0.9);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(420, ctx.currentTime + 0.35);
    filter.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.9);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
    noise.connect(filter); filter.connect(gain); gain.connect(out());
    noise.start(); noise.stop(ctx.currentTime + 0.95);
  } catch {}
}

// ── Continuous wind ambience, shaped by wind type ────────────

export type AmbienceKind = 'calm' | 'breeze' | 'gusty' | 'storm';

interface Ambience {
  src: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
}

let ambience: Ambience | null = null;

const AMBIENCE_SHAPE: Record<AmbienceKind, { cutoff: number; level: number; lfoHz: number; sweep: number }> = {
  calm:   { cutoff: 260,  level: 0.012, lfoHz: 0.08, sweep: 60 },
  breeze: { cutoff: 480,  level: 0.022, lfoHz: 0.16, sweep: 160 },
  gusty:  { cutoff: 900,  level: 0.038, lfoHz: 0.32, sweep: 420 },
  storm:  { cutoff: 1500, level: 0.06,  lfoHz: 0.55, sweep: 700 },
};

/** Map wind speed (m/s) to an ambience character. */
export function ambienceForSpeed(speed: number): AmbienceKind {
  if (speed < 3) return 'calm';
  if (speed < 8) return 'breeze';
  if (speed < 15) return 'gusty';
  return 'storm';
}

/** Start (or retune) the looping wind bed. Safe to call on every change. */
export function setWindAmbience(kind: AmbienceKind | null) {
  try {
    if (!kind || silent()) { stopWindAmbience(); return; }
    const ctx = getCtx();
    const shape = AMBIENCE_SHAPE[kind];
    if (!ambience) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, 4);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = shape.cutoff;
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      // Slow modulation makes the bed breathe instead of hissing flatly.
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = shape.lfoHz;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = shape.sweep;
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
      src.connect(filter); filter.connect(gain); gain.connect(out());
      src.start(); lfo.start();
      ambience = { src, filter, gain, lfo, lfoGain };
    }
    const a = ambience;
    a.filter.frequency.setTargetAtTime(shape.cutoff, ctx.currentTime, 0.6);
    a.lfo.frequency.setTargetAtTime(shape.lfoHz, ctx.currentTime, 0.6);
    a.lfoGain.gain.setTargetAtTime(shape.sweep, ctx.currentTime, 0.6);
    a.gain.gain.setTargetAtTime(shape.level, ctx.currentTime, 0.8);
  } catch {}
}

export function stopWindAmbience() {
  if (!ambience) return;
  try {
    const ctx = getCtx();
    ambience.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
    const a = ambience;
    setTimeout(() => { try { a.src.stop(); a.lfo.stop(); } catch {} }, 900);
  } catch {}
  ambience = null;
}
