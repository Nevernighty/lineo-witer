// Three-phase teleport overlay: Blade thumbnail → fanned blade silhouettes →
// wireframe dissolve, then hand off to the simulation route.
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { useTeleport, clearTeleport } from "@/store/useTeleportStore";

export function BladeTeleport() {
  const t = useTeleport();
  if (!t) return null;
  const cx = typeof window !== "undefined" ? window.innerWidth * 0.5 : 640;
  const cy = typeof window !== "undefined" ? window.innerHeight * 0.5 : 400;
  const from = t.fromRect ?? { x: cx, y: cy, w: 240, h: 160 };
  const nBlades = Math.max(2, Math.min(6, t.nBlades ?? 3));

  return (
    <AnimatePresence onExitComplete={clearTeleport}>
      <motion.div
        key="teleport"
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 100 }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Radial pulse background */}
        <motion.div
          className="absolute inset-0"
          initial={{ background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0) 0%, hsl(var(--background) / 0) 100%)" }}
          animate={{
            background: [
              "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.0) 0%, hsl(var(--background) / 0.0) 100%)",
              "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.25) 0%, hsl(var(--background) / 0.55) 55%, hsl(var(--background) / 0.9) 100%)",
              "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.05) 0%, hsl(var(--background) / 0.15) 55%, hsl(var(--background) / 0.0) 100%)",
            ],
          }}
          transition={{ duration: 2.0, times: [0, 0.5, 1] }}
        />

        {/* Phase A: shockwave rings (0.0–0.6s) */}
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.div
            key={"ring" + i}
            className="absolute rounded-full border border-primary/70"
            style={{ left: cx, top: cy, translateX: "-50%", translateY: "-50%" }}
            initial={{ width: 20, height: 20, opacity: 0.9 }}
            animate={{ width: 620, height: 620, opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut", delay }}
          />
        ))}

        {/* Phase A: thumbnail flies to centre and shrinks (0.0–0.6s) */}
        <motion.div
          className="absolute rounded-xl border border-primary/60 shadow-[0_0_50px_hsl(var(--primary)/0.7)] overflow-hidden bg-card/70 backdrop-blur"
          initial={{
            left: from.x, top: from.y, width: from.w, height: from.h,
            translateX: "-50%", translateY: "-50%", rotate: 0, scale: 1, opacity: 1,
          }}
          animate={{
            left: cx, top: cy, width: 140, height: 140,
            translateX: "-50%", translateY: "-50%", rotate: 540, scale: 0.6, opacity: 0,
          }}
          transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
        >
          {t.thumbnail && <img src={t.thumbnail} alt="" className="w-full h-full object-cover" />}
        </motion.div>

        {/* Phase B: fanned blade silhouettes explode out (0.55–1.2s) */}
        <BladeFan cx={cx} cy={cy} n={nBlades} rotorType={t.rotorType} />

        {/* Phase C: wireframe disk dissolves into sim (1.15–1.9s) */}
        <motion.div
          className="absolute rounded-full border-2 border-primary/70"
          style={{ left: cx, top: cy, translateX: "-50%", translateY: "-50%" }}
          initial={{ width: 200, height: 200, opacity: 0, rotate: 0 }}
          animate={{ width: 320, height: 320, opacity: [0, 0.9, 0], rotate: 360 }}
          transition={{ duration: 0.75, delay: 1.15, times: [0, 0.4, 1], ease: "easeOut" }}
        />
        <motion.div
          className="absolute rounded-full border border-primary/40"
          style={{ left: cx, top: cy, translateX: "-50%", translateY: "-50%" }}
          initial={{ width: 260, height: 260, opacity: 0 }}
          animate={{ width: 480, height: 480, opacity: [0, 0.55, 0] }}
          transition={{ duration: 0.7, delay: 1.3, times: [0, 0.5, 1] }}
        />

        {/* Caption */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 bottom-24 text-xs font-mono tracking-widest text-primary"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }}
          transition={{ duration: 2.0, times: [0, 0.2, 0.75, 1] }}
        >
          ↯ TRANSFERRING BLADE → SIMULATION ↯
          {t.presetName ? <span className="ml-2 text-foreground/80">{t.presetName}</span> : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function BladeFan({ cx, cy, n, rotorType }: { cx: number; cy: number; n: number; rotorType?: string }) {
  const blades = useMemo(() => Array.from({ length: n }, (_, i) => i), [n]);
  const isVAWT = rotorType === "darrieus" || rotorType === "savonius" || rotorType === "gorlov" || rotorType === "archimedes";
  return (
    <>
      {blades.map((i) => {
        const angle = (i / n) * 360;
        const rad = (angle * Math.PI) / 180;
        const finalX = cx + Math.cos(rad - Math.PI / 2) * 140;
        const finalY = cy + Math.sin(rad - Math.PI / 2) * 140;
        return (
          <motion.div
            key={"blade" + i}
            className="absolute"
            style={{
              left: cx, top: cy, translateX: "-50%", translateY: "-50%",
              width: isVAWT ? 8 : 14, height: isVAWT ? 180 : 220,
              background: "linear-gradient(180deg, hsl(var(--primary)/0.9) 0%, hsl(var(--primary)/0.2) 100%)",
              borderRadius: isVAWT ? 4 : "50% 50% 20% 20% / 30% 30% 5% 5%",
              boxShadow: "0 0 20px hsl(var(--primary)/0.7)",
              transformOrigin: "50% 100%",
            }}
            initial={{ opacity: 0, scale: 0.2, rotate: angle }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.2, 1, 1, 0.6],
              rotate: [angle, angle + 90, angle + 180, angle + 260],
              left: [cx, cx, finalX, cx],
              top: [cy, cy, finalY, cy],
            }}
            transition={{ duration: 1.35, delay: 0.55, times: [0, 0.25, 0.7, 1], ease: "easeInOut" }}
          />
        );
      })}
    </>
  );
}
