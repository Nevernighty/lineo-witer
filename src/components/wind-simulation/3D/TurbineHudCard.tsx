// Per-turbine HUD anchored beside each rotor.
// Compact chip by default, expanded panel on hover, pinned panel (with a live
// measured-power sparkline) on click. Values come from the particle solver's
// per-generator telemetry, plus the analytic Betz/Cp estimate for comparison.
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Zap, Activity, Pin, X } from "lucide-react";
import type { EnergySample } from "@/store/useEnergyStore";

export interface TurbineHudDatum {
  /** Analytic (Betz/Cp) power at hub height, W. */
  power: number;
  /** Generated energy integrated from rotor power, J. */
  generatedEnergy?: number;
  /** Measured power from captured air parcels, W. */
  measuredPower?: number;
  /** Measured cumulative energy, J. */
  measuredEnergy?: number;
  /** Captures per second. */
  hitsPerSec?: number;
  /** Mean speed of captured parcels, m/s. */
  flowSpeed?: number;
  hubSpeed?: number;
  ti?: number;
  cp?: number;
  rpm?: number;
  tsr?: number;
  status?: "ok" | "low" | "cutout";
  history?: EnergySample[];
}

interface Props {
  position: [number, number, number];
  radius: number;
  height: number;
  data: TurbineHudDatum;
  density?: "off" | "compact" | "full";
  pinned?: boolean;
  onClose?: () => void;
  label?: string;
}

export function TurbineHudCard({ position, radius, height, data, density = "compact", pinned, onClose, label }: Props) {
  const { camera } = useThree();
  const anchor = useRef(new THREE.Vector3());
  const [side, setSide] = useState<1 | -1>(1);
  const [opacity, setOpacity] = useState(1);

  useFrame(() => {
    const nextSide = camera.position.x - position[0] >= 0 ? 1 : -1;
    if (nextSide !== side) setSide(nextSide);
    anchor.current.set(...position);
    const d = camera.position.distanceTo(anchor.current);
    const next = pinned || density === 'full' ? 1 : THREE.MathUtils.clamp(1 - Math.max(0, d - radius * 9) / Math.max(1, radius * 12), 0.25, 1);
    if (Math.abs(next - opacity) > 0.04) setOpacity(next);
  });

  const anchorPos = useMemo<[number, number, number]>(
    () => [position[0] + side * (radius * 1.5 + 2), position[1] - radius * 0.35, position[2]],
    [position, side, radius, height],
  );

  if (density === "off") return null;
  const expanded = density === "full" || pinned;
  const measured = data.measuredPower ?? 0;
  const statusColor = data.status === "cutout" ? "text-destructive" : data.status === "low" ? "text-accent-foreground" : "text-primary";

  return (
    <Html position={anchorPos} center zIndexRange={[20, 0]}
      style={{ pointerEvents: pinned ? "auto" : "none", opacity, transition: "opacity .25s" }}>
      <div
        className={`rounded-lg border bg-background/90 backdrop-blur px-2.5 py-1.5 shadow-lg transition-all duration-200 ${pinned ? "border-primary" : "border-primary/40"}`}
        style={{ minWidth: expanded ? 216 : 92, whiteSpace: 'nowrap', fontFamily: "ui-monospace, monospace", fontSize: 10, lineHeight: 1.35, transform: `translateX(${side < 0 ? "-100%" : "0"})` }}
      >
        <div className="mb-0.5 flex items-center gap-1">
          {label && <span className="truncate text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>}
          {pinned && <Pin size={9} className="ml-auto text-primary" />}
          {pinned && onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-destructive" aria-label="close"><X size={10} /></button>
          )}
        </div>
        <Row icon={<Zap size={9} />} value={fmtW(data.status === 'ok' ? data.power : 0)} unit="" tint />
        <Row icon={<Activity size={9} />} value={fmtJ(data.generatedEnergy ?? 0)} unit="" />
        {expanded && (
          <>
            <div className="my-1 border-t border-border/40" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px]">
              <M l="P₍tr₎" v={fmtW(measured)} />
              <M l="E₍tr₎" v={fmtJ(data.measuredEnergy ?? 0)} />
              <M l="v₍hub₎" v={fmt(data.hubSpeed, 1)} />
              <M l="v₍flow₎" v={fmt(data.flowSpeed, 1)} />
              <M l="hits/s" v={fmt(data.hitsPerSec, 1)} />
              <M l="RPM" v={fmt(data.rpm, 0)} />
              <M l="TSR" v={fmt(data.tsr, 1)} />
              <M l="Cp" v={fmt(data.cp, 2)} />
              <M l="TI" v={`${fmt((data.ti ?? 0) * 100, 0)}%`} />
            </div>
            <div className={`mt-1 text-[9px] ${statusColor}`}>
              {data.status === "cutout" ? "⛔ cut-out" : data.status === "low" ? "⏸ below cut-in" : "● generating"}
            </div>
            {pinned && <Spark samples={data.history ?? []} />}
          </>
        )}
      </div>
    </Html>
  );
}

function Spark({ samples }: { samples: EnergySample[] }) {
  const w = 176, h = 38;
  if (samples.length < 2) return <div className="mt-1 text-[9px] text-muted-foreground"><Activity size={9} className="mr-1 inline" />collecting…</div>;
  const max = Math.max(...samples.map(s => s.power), 1e-6);
  const d = samples.map((s, i) => `${i ? "L" : "M"}${((i / (samples.length - 1)) * w).toFixed(1)},${(h - (s.power / max) * (h - 4) - 2).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} className="mt-1 overflow-visible text-primary">
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="currentColor" opacity={0.15} />
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.4} />
    </svg>
  );
}

function Row({ icon, value, unit, tint }: { icon: React.ReactNode; value: string; unit: string; tint?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={tint ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      <span className={`tabular-nums ${tint ? "font-semibold text-primary" : "text-foreground"}`}>{value}{unit}</span>
    </div>
  );
}

function M({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-1">
      <span className="text-muted-foreground">{l}</span>
      <span className="tabular-nums text-foreground">{v}</span>
    </div>
  );
}

function fmt(x: number | undefined, digits: number) {
  return x === undefined || !isFinite(x) ? "–" : x.toFixed(digits);
}
function fmtW(w: number) {
  if (w >= 1e6) return `${(w / 1e6).toFixed(2)} MW`;
  if (w >= 1000) return `${(w / 1000).toFixed(1)} kW`;
  return `${w.toFixed(1)} W`;
}
function fmtJ(j: number) {
  if (j >= 3.6e6) return `${(j / 3.6e6).toFixed(2)} kWh`;
  if (j >= 1000) return `${(j / 1000).toFixed(1)} kJ`;
  return `${j.toFixed(1)} J`;
}
