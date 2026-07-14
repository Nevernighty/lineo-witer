import { motion } from "framer-motion";
import { Wind, Recycle, Cloud, BookOpen, Settings, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { type Lang } from "@/utils/i18n";
import { SceneBackdrop } from "@/components/backgrounds/SceneBackdrop";
import { GoogleAuthPill } from "@/components/GoogleAuthPill";
import { RecentlyUsedRibbon } from "@/components/RecentlyUsedRibbon";

interface MainMenuProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onStartSimulation: () => void;
  onOpenWeather: () => void;
  onOpenSettings: () => void;
  windSpeed: number;
  power: number;
}

const labels = {
  ua: {
    simulation: "3D Вітрова Симуляція",
    simulationDesc: "Інтерактивна 3D візуалізація вітрового потоку",
    weather: "Погода",
    weatherDesc: "Поточні дані вітру та прогноз",
    knowledge: "База Знань",
    knowledgeDesc: "Довідник з вітроенергетики",
    settings: "Налаштування",
    settingsDesc: "Параметри генератора",
    windSpeed: "Швидкість вітру",
    power: "Потужність",
  },
  en: {
    simulation: "3D Wind Simulation",
    simulationDesc: "Interactive 3D wind flow visualization",
    weather: "Weather",
    weatherDesc: "Current wind data and forecast",
    knowledge: "Knowledge Base",
    knowledgeDesc: "Wind energy reference",
    settings: "Settings",
    settingsDesc: "Generator parameters",
    windSpeed: "Wind Speed",
    power: "Power",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export const MainMenu = ({
  lang, onLangChange, onStartSimulation, onOpenWeather, onOpenSettings, windSpeed, power,
}: MainMenuProps) => {
  const t = labels[lang];

  return (
    <motion.div
      className="h-screen w-screen flex flex-col items-center justify-center bg-background relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
    >
      {/* Live 3D backdrop with uploaded turbine GLBs */}
      <SceneBackdrop
        actors={[
          { model: "hawtHero",     position: [ 0.0, -0.4, -2.5], scale: 1.6, spin: 0.9 },
          { model: "vawtHero",     position: [-4.5, -0.8, -4.0], scale: 1.1, spin: 1.4 },
          { model: "savoniusMain", position: [ 4.2, -1.2, -3.8], scale: 0.9, spin: 1.8 },
        ]}
      />

      {/* Top-right controls: Google login + language toggle */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <GoogleAuthPill lang={lang} />
        <div className="flex bg-card/60 rounded-lg border border-border/30 p-0.5 backdrop-blur-sm">
          <button onClick={() => onLangChange('ua')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${lang === 'ua' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'}`}>
            UA
          </button>
          <button onClick={() => onLangChange('en')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'}`}>
            EN
          </button>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 flex flex-col items-center max-w-lg w-full px-3 sm:px-4">
        {/* Logo */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-10">
          <Recycle className="text-primary w-7 h-7 animate-[spin_6s_linear_infinite]" />
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-foreground">LINE-O</span>
            <Wind className="inline-block text-primary w-5 h-5 mx-1 animate-wiggle-slow" />
            <span className="text-foreground">WITER</span>
          </h1>
        </motion.div>

        {/* Geometry / Form lab tile (half-transparent, premium) */}
        <motion.div variants={itemVariants} className="w-full mb-3">
          <Link to="/blade-lab"
            className="group block relative overflow-hidden rounded-xl border border-primary/20 bg-card/30 backdrop-blur-md p-4 transition-all duration-300 hover:border-primary/50 hover:bg-card/40">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 64 32" className="w-12 h-6 text-primary/80 flex-shrink-0">
                <path d="M2,18 C12,4 40,4 62,14 C40,20 12,24 2,18 Z" fill="currentColor" opacity="0.4" />
                <path d="M2,18 C12,4 40,4 62,14" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground">{lang === 'ua' ? 'ФОРМА' : 'GEOMETRY'} <span className="text-primary/60 font-normal">· Blade Lab</span></div>
                <div className="text-[9px] text-muted-foreground/70 tracking-[0.18em] uppercase truncate mt-0.5">
                  AEROFOIL · PROFILE · PLANFORM · CAMBER · CHORD · TWIST · SOLIDITY · MORPHOLOGY · TOPOLOGY
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Primary button — 3D Simulation */}
        <motion.button
          variants={itemVariants}
          onClick={onStartSimulation}
          className="w-full mb-4 group relative overflow-hidden rounded-xl border-2 border-primary/30 bg-card/60 backdrop-blur-sm p-6 text-left transition-all duration-300 hover:border-primary/70 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]"
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Wind className="w-7 h-7 text-primary animate-wiggle-slow" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{t.simulation}</div>
              <div className="text-sm text-muted-foreground">{t.simulationDesc}</div>
            </div>
            <Zap className="ml-auto w-5 h-5 text-primary/50 group-hover:text-primary transition-colors" />
          </div>
        </motion.button>

        {/* Secondary buttons grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full mb-8">
          {/* Weather */}
          <motion.button
            variants={itemVariants}
            onClick={onOpenWeather}
            className="group rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-4 text-center transition-all duration-300 hover:border-primary/40 hover:bg-card/60"
          >
            <Cloud className="w-6 h-6 text-primary/70 mx-auto mb-2 group-hover:text-primary transition-colors" />
            <div className="text-sm font-medium text-foreground">{t.weather}</div>
            <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{t.weatherDesc}</div>
          </motion.button>

          {/* Knowledge Base */}
          <motion.div variants={itemVariants}>
            <Link
              to="/info"
              className="group block rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-4 text-center transition-all duration-300 hover:border-primary/40 hover:bg-card/60"
            >
              <BookOpen className="w-6 h-6 text-primary/70 mx-auto mb-2 group-hover:text-primary transition-colors" />
              <div className="text-sm font-medium text-foreground">{t.knowledge}</div>
              <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{t.knowledgeDesc}</div>
            </Link>
          </motion.div>

          {/* Settings */}
          <motion.button
            variants={itemVariants}
            onClick={onOpenSettings}
            className="group rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-4 text-center transition-all duration-300 hover:border-primary/40 hover:bg-card/60"
          >
            <Settings className="w-6 h-6 text-primary/70 mx-auto mb-2 group-hover:text-primary transition-colors" />
            <div className="text-sm font-medium text-foreground">{t.settings}</div>
            <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{t.settingsDesc}</div>
          </motion.button>
        </div>

        {/* Stats bar */}
        <motion.div variants={itemVariants} className="flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-primary/60" />
            <span className="font-mono">{windSpeed.toFixed(1)}</span>
            <span>m/s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary/60" />
            <span className="font-mono">{power}</span>
            <span>W</span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
