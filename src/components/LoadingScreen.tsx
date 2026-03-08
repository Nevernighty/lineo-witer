import { motion } from "framer-motion";
import { Wind, Recycle } from "lucide-react";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 120);

    const timeout = setTimeout(onComplete, 2200);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23222832' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Logo */}
      <motion.div
        className="flex items-center gap-3 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Recycle className="text-primary w-8 h-8 animate-[spin_4s_linear_infinite]" />
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-foreground">LINE-O</span>
          <Wind className="inline-block text-primary w-6 h-6 mx-1.5 animate-wiggle-slow" />
          <span className="text-foreground">WITER</span>
        </h1>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        className="text-muted-foreground text-sm mb-10 tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        Wind Energy Simulation
      </motion.p>

      {/* Progress bar */}
      <motion.div
        className="w-64 h-1 rounded-full bg-border/30 overflow-hidden"
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <motion.div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.15 }}
        />
      </motion.div>

      {/* Decorative floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/40"
          initial={{
            x: -100 + Math.random() * 200,
            y: 80 + Math.random() * 60,
            opacity: 0,
          }}
          animate={{
            x: [null, Math.random() * 300 - 150],
            y: [null, Math.random() * 200 - 100],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 1.5,
            delay: 0.3 + i * 0.2,
            ease: "easeOut",
          }}
        />
      ))}
    </motion.div>
  );
};
