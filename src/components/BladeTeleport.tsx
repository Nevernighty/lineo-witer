// Full-screen overlay that animates a captured blade thumbnail from its
// origin rect on the Blade Lab canvas → screen centre, with a shockwave ring.
import { motion, AnimatePresence } from "framer-motion";
import { useTeleport, clearTeleport } from "@/store/useTeleportStore";

export function BladeTeleport() {
  const t = useTeleport();
  if (!t) return null;
  const from = t.fromRect ?? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, w: 240, h: 160 };
  const targetX = window.innerWidth * 0.5;
  const targetY = window.innerHeight * 0.5;

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
        {/* Backdrop pulse */}
        <motion.div
          className="absolute inset-0"
          initial={{ background: "hsl(var(--primary) / 0)" }}
          animate={{ background: [
            "hsl(var(--primary) / 0)",
            "hsl(var(--primary) / 0.14)",
            "hsl(var(--primary) / 0)",
          ] }}
          transition={{ duration: 1.6, times: [0, 0.5, 1] }}
        />
        {/* Shockwave ring */}
        <motion.div
          className="absolute rounded-full border-2 border-primary/70"
          style={{ left: targetX, top: targetY, translateX: "-50%", translateY: "-50%" }}
          initial={{ width: 20, height: 20, opacity: 0.9 }}
          animate={{ width: 560, height: 560, opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.4 }}
        />
        {/* Streamline sweep */}
        <motion.div
          className="absolute h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent"
          style={{ top: targetY, left: 0, right: 0, transformOrigin: "center" }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, delay: 0.2, times: [0, 0.5, 1] }}
        />
        {/* Blade thumbnail flying to centre */}
        <motion.div
          className="absolute rounded-xl border border-primary/50 shadow-[0_0_40px_hsl(var(--primary)/0.6)] overflow-hidden bg-card/70 backdrop-blur"
          initial={{
            left: from.x, top: from.y, width: from.w, height: from.h,
            translateX: "-50%", translateY: "-50%", rotate: 0, scale: 1,
          }}
          animate={{
            left: targetX, top: targetY, width: 120, height: 120,
            translateX: "-50%", translateY: "-50%", rotate: 720, scale: 0.15, opacity: 0,
          }}
          transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
        >
          {t.thumbnail && <img src={t.thumbnail} alt="" className="w-full h-full object-cover" />}
        </motion.div>
        {/* Caption */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 bottom-24 text-xs font-mono tracking-widest text-primary/80"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 0], y: [8, 0, -4] }}
          transition={{ duration: 1.8, times: [0, 0.4, 1] }}
        >
          ↯ TRANSFERRING BLADE → SIMULATION ↯
          {t.presetName ? <span className="ml-2 text-foreground/70">{t.presetName}</span> : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
