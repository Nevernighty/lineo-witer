import { motion } from "framer-motion";
import { Wind } from "lucide-react";
import { type Lang } from "@/utils/i18n";

interface SimulationLoaderProps {
  lang: Lang;
}

export const SimulationLoader = ({ lang }: SimulationLoaderProps) => {
  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Wind className="w-10 h-10 text-primary mb-4 animate-wiggle-slow" />
      <p className="text-foreground font-medium mb-3">
        {lang === 'ua' ? 'Завантаження симуляції...' : 'Loading simulation...'}
      </p>
      <div className="w-48 h-1 rounded-full bg-border/30 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-primary/30"
          animate={{
            x: [Math.random() * -200, Math.random() * 200],
            y: [Math.random() * 100 - 50, Math.random() * 100 - 50],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 1.5 + Math.random(),
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </motion.div>
  );
};
