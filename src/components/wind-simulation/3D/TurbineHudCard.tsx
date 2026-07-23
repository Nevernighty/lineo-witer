// Compact per-turbine HUD card anchored in world space beside each turbine.
// Uses drei's <Html> to render DOM that reads current camera to auto-flip so
// it never sits between the viewer and the rotor disk (which would block the
// air-flow visualisation).
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Wind, Zap, Activity } from "lucide-react";

export interface TurbineHudDatum {
  power: number;     // instantaneous W
  avgPower: number;  // rolling W
  cumulativeKJ: number;
  hitsPerSec?: number;
  ti?: number;       // 0..1
  cp?: number;
  rpm?: number;
  tsr?: number;
}

interface Props {
  /** Turbine centre in world space (typically hub). */
  position: [number, number, number];
  /** Turbine rotor radius / diameter in world units — used to offset the card. */
  radius: number;
  /** Height in world units — used to lift the card above the rotor. */
  height: number;
  data: TurbineHudDatum;
  /** 'off' | 'compact' | 'full' */
  density?: "off" | "compact" | "full";
  label?: string;
}

export function TurbineHudCard({ position, radius, height, data, density = "compact", label }: Props) {
  const { camera } = useThree();
  const anchor = useRef(new THREE.Vector3());
  const [side, setSide] = useState<1 | -1>(1);

  useFrame(() => {
    // Flip the card to the side of the turbine facing away from the camera-forward,
    // so it hovers next to the rotor rather than in front of it.
    const dx = camera.position.x - position[0];
    setSide(dx >= 0 ? 1 : -1);
  });

  const anchorPos = useMemo<[number, number, number]>(() => {
    return [position[0] + side * (radius * 0.9 + 1.5), position[1] + height * 0.65, position[2]];
  }, [position, side, radius, height]);

  if (density === "off") return null;

  const compact = density === "compact";

  return (
    <group>
      <Html
        position={anchorPos}
        center
        distanceFactor={compact ? 14 : 12}
        occlude={false}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          className="rounded-lg border border-primary/40 bg-background/85 backdrop-blur px-2.5 py-1.5 shadow-[0_4px_20px_hsl(var(--primary)/0.25)]"
          style={{
            minWidth: compact ? 90 : 140,
            fontFamily: "ui-monospace, monospace",
            fontSize: 10,
            lineHeight: 1.3,
            transform: `translateX(${side < 0 ? "-100%" : "0"})`,
          }}
        >
          {label && (
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground truncate mb-0.5">
              {label}
            </div>
          )}
          <Row icon={<Zap size={9} />} value={fmt(data.power, 0)} unit="W" tint="primary" />
          <Row icon={<Activity size={9} />} value={fmt(data.avgPower, 0)} unit="W avg" />
          <Row icon={<Wind size={9} />} value={fmt(data.cumulativeKJ, 1)} unit="kJ" />
          {!compact && (
            <div className="mt-1 pt-1 border-t border-border/40 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
              {data.rpm !== undefined && <M l="RPM" v={fmt(data.rpm, 0)} />}
              {data.tsr !== undefined && <M l="TSR" v={fmt(data.tsr, 1)} />}
              {data.cp !== undefined  && <M l="Cp"  v={fmt(data.cp, 2)} />}
              {data.ti !== undefined  && <M l="TI"  v={`${fmt(data.ti * 100, 0)}%`} warn={data.ti > 0.3} />}
              {data.hitsPerSec !== undefined && <M l="hits/s" v={fmt(data.hitsPerSec, 0)} />}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

function Row({ icon, value, unit, tint }: { icon: React.ReactNode; value: string; unit: string; tint?: "primary" }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={`inline-flex items-center gap-1 ${tint === "primary" ? "text-primary" : "text-muted-foreground"}`}>
        {icon}
      </span>
      <span className={`tabular-nums ${tint === "primary" ? "text-primary font-semibold" : "text-foreground"}`}>
        {value}<span className="text-muted-foreground ml-0.5 font-normal">{unit}</span>
      </span>
    </div>
  );
}

function M({ l, v, warn }: { l: string; v: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-1">
      <span className="text-muted-foreground">{l}</span>
      <span className={`tabular-nums ${warn ? "text-orange-400" : "text-foreground"}`}>{v}</span>
    </div>
  );
}

function fmt(x: number | undefined, digits: number): string {
  if (x === undefined || !isFinite(x)) return "–";
  if (Math.abs(x) >= 1000 && digits === 0) return (x / 1000).toFixed(1) + "k";
  return x.toFixed(digits);
}
