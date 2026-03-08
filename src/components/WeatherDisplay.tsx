import { Cloud, Wind, Thermometer, Gauge, ArrowUp, Droplets, BookOpen, Wifi, WifiOff, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { t, type Lang } from '@/utils/i18n';
import { motion } from 'framer-motion';

interface WeatherDisplayProps {
  location: { lat: number; lon: number } | null;
  lang?: 'ua' | 'en';
  onApplyToSimulation?: (data: { windSpeed: number; temperature: number; humidity: number; windAngle: number }) => void;
}

interface WeatherData {
  windSpeed: number;
  windAngle: number;
  temperature: number;
  pressure: number;
  humidity: number;
  cloudCover: number;
  season: string;
  wpd: number;
  potentialClass: string;
  hour: number;
  month: number;
  monthlyEnergy: number;
  windVariability: number;
  windChill: number;
  beaufort: number;
  forecast24h: Array<{ hour: number; speed: number }>;
  recommendedGen: string;
  isLive?: boolean;
}

function generateSyntheticWeather(lat: number, lon: number): WeatherData {
  const now = new Date();
  const month = now.getMonth();
  const hour = now.getHours();
  const isWinter = month >= 10 || month <= 2;
  const isSummer = month >= 5 && month <= 7;
  const isSpring = month >= 3 && month <= 4;
  const latFactor = Math.max(0, (52 - lat) / 10);
  const baseWind = isWinter ? 7.5 : isSummer ? 4.5 : isSpring ? 6.0 : 6.8;
  const diurnalVar = Math.sin((hour - 6) * Math.PI / 12) * 1.5;
  const windSpeed = Math.max(1, baseWind + latFactor * 1.5 + diurnalVar + (Math.random() - 0.5) * 2);
  const baseAngle = isWinter ? 315 : isSummer ? 225 : 270;
  const windAngle = (baseAngle + (Math.random() - 0.5) * 60) % 360;
  const baseTempByMonth = [-3, -1, 4, 12, 18, 22, 25, 24, 18, 11, 4, 0];
  const baseTemp = baseTempByMonth[month];
  const diurnalTemp = Math.sin((hour - 6) * Math.PI / 12) * 5;
  const temperature = baseTemp + diurnalTemp + (Math.random() - 0.5) * 3;
  const pressure = 1013 + (isWinter ? 8 : -3) + (Math.random() - 0.5) * 10;
  const humidity = isWinter ? 80 : isSummer ? 55 : 65;
  const cloudCover = isWinter ? 70 : isSummer ? 30 : 50;
  const season = isWinter ? 'winter' : isSummer ? 'summer' : isSpring ? 'spring' : 'autumn';
  const rho = 1.225;
  const wpd = 0.5 * rho * Math.pow(windSpeed, 3);
  const potentialClass = wpd > 500 ? 'excellent' : wpd > 300 ? 'good' : wpd > 150 ? 'moderate' : 'low';
  const monthlyEnergy = wpd * 0.4 * 720 / 1000;
  const windVariability = windSpeed * (isWinter ? 0.35 : isSummer ? 0.2 : 0.28);
  const windChill = temperature < 10 && windSpeed > 1.3
    ? 13.12 + 0.6215 * temperature - 11.37 * Math.pow(windSpeed * 3.6, 0.16) + 0.3965 * temperature * Math.pow(windSpeed * 3.6, 0.16)
    : temperature;
  const beaufort = windSpeed < 0.3 ? 0 : windSpeed < 1.6 ? 1 : windSpeed < 3.4 ? 2
    : windSpeed < 5.5 ? 3 : windSpeed < 8 ? 4 : windSpeed < 10.8 ? 5
    : windSpeed < 13.9 ? 6 : windSpeed < 17.2 ? 7 : windSpeed < 20.8 ? 8
    : windSpeed < 24.5 ? 9 : windSpeed < 28.5 ? 10 : windSpeed < 32.7 ? 11 : 12;
  const forecast24h = Array.from({ length: 24 }, (_, i) => {
    const fHour = (hour + i) % 24;
    const fDiurnal = Math.sin((fHour - 6) * Math.PI / 12) * 1.8;
    return { hour: fHour, speed: Math.max(0.5, baseWind + latFactor * 1.5 + fDiurnal + (Math.sin(i * 0.7) * 0.8)) };
  });
  const recommendedGen = windSpeed > 10 ? 'hawt3' : windSpeed > 6 ? 'hawt2' : windSpeed > 3 ? 'darrieus' : 'savonius';
  return {
    windSpeed: Math.round(windSpeed * 10) / 10, windAngle: Math.round(windAngle),
    temperature: Math.round(temperature * 10) / 10, pressure: Math.round(pressure),
    humidity: Math.round(humidity + (Math.random() - 0.5) * 15),
    cloudCover: Math.round(Math.max(0, Math.min(100, cloudCover + (Math.random() - 0.5) * 20))),
    season, wpd: Math.round(wpd), potentialClass, hour, month, monthlyEnergy: Math.round(monthlyEnergy),
    windVariability: Math.round(windVariability * 10) / 10, windChill: Math.round(windChill * 10) / 10,
    beaufort, forecast24h, recommendedGen, isLive: false,
  };
}

async function fetchOpenMeteoWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m,temperature_2m,relative_humidity_2m,surface_pressure,cloud_cover&hourly=wind_speed_10m&forecast_days=1&timezone=auto`);
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.current;
    if (!c) return null;
    const windSpeed = c.wind_speed_10m / 3.6;
    const windAngle = c.wind_direction_10m || 0;
    const temperature = c.temperature_2m || 0;
    const pressure = c.surface_pressure ? Math.round(c.surface_pressure) : 1013;
    const humidity = c.relative_humidity_2m || 50;
    const cloudCover = c.cloud_cover || 0;
    const now = new Date();
    const month = now.getMonth();
    const hour = now.getHours();
    const isWinter = month >= 10 || month <= 2;
    const isSummer = month >= 5 && month <= 7;
    const isSpring = month >= 3 && month <= 4;
    const season = isWinter ? 'winter' : isSummer ? 'summer' : isSpring ? 'spring' : 'autumn';
    const rho = 1.225;
    const wpd = 0.5 * rho * Math.pow(windSpeed, 3);
    const potentialClass = wpd > 500 ? 'excellent' : wpd > 300 ? 'good' : wpd > 150 ? 'moderate' : 'low';
    const monthlyEnergy = wpd * 0.4 * 720 / 1000;
    const windVariability = windSpeed * 0.25;
    const windChill = temperature < 10 && windSpeed > 1.3
      ? 13.12 + 0.6215 * temperature - 11.37 * Math.pow(windSpeed * 3.6, 0.16) + 0.3965 * temperature * Math.pow(windSpeed * 3.6, 0.16)
      : temperature;
    const beaufort = windSpeed < 0.3 ? 0 : windSpeed < 1.6 ? 1 : windSpeed < 3.4 ? 2
      : windSpeed < 5.5 ? 3 : windSpeed < 8 ? 4 : windSpeed < 10.8 ? 5
      : windSpeed < 13.9 ? 6 : windSpeed < 17.2 ? 7 : windSpeed < 20.8 ? 8
      : windSpeed < 24.5 ? 9 : windSpeed < 28.5 ? 10 : windSpeed < 32.7 ? 11 : 12;
    const hourlyWind = data.hourly?.wind_speed_10m as number[] | undefined;
    const forecast24h = hourlyWind
      ? hourlyWind.slice(0, 24).map((s: number, i: number) => ({ hour: (hour + i) % 24, speed: Math.max(0.5, s / 3.6) }))
      : Array.from({ length: 24 }, (_, i) => {
          const fHour = (hour + i) % 24;
          const fDiurnal = Math.sin((fHour - 6) * Math.PI / 12) * 1.5;
          return { hour: fHour, speed: Math.max(0.5, windSpeed + fDiurnal + Math.sin(i * 0.5) * 0.6) };
        });
    const recommendedGen = windSpeed > 10 ? 'hawt3' : windSpeed > 6 ? 'hawt2' : windSpeed > 3 ? 'darrieus' : 'savonius';
    return {
      windSpeed: Math.round(windSpeed * 10) / 10, windAngle: Math.round(windAngle),
      temperature: Math.round(temperature * 10) / 10, pressure, humidity: Math.round(humidity),
      cloudCover: Math.round(cloudCover), season, wpd: Math.round(wpd), potentialClass, hour, month,
      monthlyEnergy: Math.round(monthlyEnergy), windVariability: Math.round(windVariability * 10) / 10,
      windChill: Math.round(windChill * 10) / 10, beaufort, forecast24h, recommendedGen, isLive: true,
    };
  } catch { return null; }
}

async function fetchLiveWeather(lat: number, lon: number): Promise<WeatherData | null> {
  const openMeteo = await fetchOpenMeteoWeather(lat, lon);
  if (openMeteo) return openMeteo;
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    if (!res.ok) return null;
    const data = await res.json();
    const windSpeed = data.wind?.speed || 0;
    const windAngle = data.wind?.deg || 0;
    const temperature = data.main?.temp || 0;
    const pressure = data.main?.pressure || 1013;
    const humidity = data.main?.humidity || 50;
    const cloudCover = data.clouds?.all || 0;
    const now = new Date();
    const month = now.getMonth();
    const hour = now.getHours();
    const isWinter = month >= 10 || month <= 2;
    const isSummer = month >= 5 && month <= 7;
    const isSpring = month >= 3 && month <= 4;
    const season = isWinter ? 'winter' : isSummer ? 'summer' : isSpring ? 'spring' : 'autumn';
    const rho = 1.225;
    const wpd = 0.5 * rho * Math.pow(windSpeed, 3);
    const potentialClass = wpd > 500 ? 'excellent' : wpd > 300 ? 'good' : wpd > 150 ? 'moderate' : 'low';
    const monthlyEnergy = wpd * 0.4 * 720 / 1000;
    const windVariability = windSpeed * 0.25;
    const windChill = temperature < 10 && windSpeed > 1.3
      ? 13.12 + 0.6215 * temperature - 11.37 * Math.pow(windSpeed * 3.6, 0.16) + 0.3965 * temperature * Math.pow(windSpeed * 3.6, 0.16)
      : temperature;
    const beaufort = windSpeed < 0.3 ? 0 : windSpeed < 1.6 ? 1 : windSpeed < 3.4 ? 2
      : windSpeed < 5.5 ? 3 : windSpeed < 8 ? 4 : windSpeed < 10.8 ? 5
      : windSpeed < 13.9 ? 6 : windSpeed < 17.2 ? 7 : windSpeed < 20.8 ? 8
      : windSpeed < 24.5 ? 9 : windSpeed < 28.5 ? 10 : windSpeed < 32.7 ? 11 : 12;
    const baseWind = windSpeed;
    const forecast24h = Array.from({ length: 24 }, (_, i) => {
      const fHour = (hour + i) % 24;
      const fDiurnal = Math.sin((fHour - 6) * Math.PI / 12) * 1.5;
      return { hour: fHour, speed: Math.max(0.5, baseWind + fDiurnal + Math.sin(i * 0.5) * 0.6) };
    });
    const recommendedGen = windSpeed > 10 ? 'hawt3' : windSpeed > 6 ? 'hawt2' : windSpeed > 3 ? 'darrieus' : 'savonius';
    return {
      windSpeed: Math.round(windSpeed * 10) / 10, windAngle: Math.round(windAngle),
      temperature: Math.round(temperature * 10) / 10, pressure: Math.round(pressure),
      humidity: Math.round(humidity), cloudCover: Math.round(cloudCover),
      season, wpd: Math.round(wpd), potentialClass, hour, month, monthlyEnergy: Math.round(monthlyEnergy),
      windVariability: Math.round(windVariability * 10) / 10, windChill: Math.round(windChill * 10) / 10,
      beaufort, forecast24h, recommendedGen, isLive: true,
    };
  } catch { return null; }
}

const seasonNames = {
  winter: { ua: 'Зима', en: 'Winter' }, spring: { ua: 'Весна', en: 'Spring' },
  summer: { ua: 'Літо', en: 'Summer' }, autumn: { ua: 'Осінь', en: 'Autumn' },
};

const potentialNames = {
  excellent: { ua: 'Відмінний', en: 'Excellent', color: 'text-green-400' },
  good: { ua: 'Добрий', en: 'Good', color: 'text-primary' },
  moderate: { ua: 'Помірний', en: 'Moderate', color: 'text-yellow-400' },
  low: { ua: 'Низький', en: 'Low', color: 'text-orange-400' },
};

const beaufortNames: Record<number, { ua: string; en: string }> = {
  0: { ua: 'Штиль', en: 'Calm' }, 1: { ua: 'Тихий', en: 'Light air' },
  2: { ua: 'Легкий', en: 'Light breeze' }, 3: { ua: 'Слабкий', en: 'Gentle breeze' },
  4: { ua: 'Помірний', en: 'Moderate breeze' }, 5: { ua: 'Свіжий', en: 'Fresh breeze' },
  6: { ua: 'Сильний', en: 'Strong breeze' }, 7: { ua: 'Міцний', en: 'Near gale' },
  8: { ua: 'Шторм', en: 'Gale' }, 9: { ua: 'Сильний шторм', en: 'Strong gale' },
  10: { ua: 'Ураган', en: 'Storm' }, 11: { ua: 'Жорстокий ураган', en: 'Violent storm' },
  12: { ua: 'Тайфун', en: 'Hurricane' },
};

const genRecommendations: Record<string, { ua: string; en: string }> = {
  hawt3: { ua: '3-лопатевий HAWT — оптимальний для сильного вітру', en: '3-Blade HAWT — optimal for strong winds' },
  hawt2: { ua: '2-лопатевий HAWT — добре для помірного вітру', en: '2-Blade HAWT — good for moderate winds' },
  darrieus: { ua: "Дар'є VAWT — працює при змінному напрямку", en: 'Darrieus VAWT — works with variable direction' },
  savonius: { ua: 'Савоніус — самозапуск при слабкому вітрі', en: 'Savonius — self-starting in low winds' },
};

const windDirName = (angle: number, lang: 'ua' | 'en') => {
  const dirs = lang === 'ua'
    ? ['Пн', 'ПнСх', 'Сх', 'ПдСх', 'Пд', 'ПдЗх', 'Зх', 'ПнЗх']
    : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(angle / 45) % 8];
};

// ─── Ring Gauge SVG ───
const RingGauge = ({ value, max, label, unit, color }: { value: number; max: number; label: string; unit: string; color: string }) => {
  const pct = Math.min(value / max, 1);
  const r = 32;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="5" opacity="0.15" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${pct * circumference} ${circumference}`}
          strokeLinecap="round" transform="rotate(-90 40 40)"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)`, transition: 'stroke-dasharray 0.6s ease' }} />
        <text x="40" y="36" textAnchor="middle" fontSize="14" fontWeight="bold" fill="hsl(var(--foreground))" fontFamily="monospace">{value}</text>
        <text x="40" y="50" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{unit}</text>
      </svg>
      <span className="text-[10px] text-muted-foreground font-semibold uppercase mt-1">{label}</span>
    </div>
  );
};

// ─── Wind Rose Compass SVG ───
const WindRoseCompass = ({ angle, speed }: { angle: number; speed: number }) => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const r = 38;
  const cx = 50, cy = 50;
  const arrowAngle = (angle - 90) * Math.PI / 180;
  const arrowX = cx + r * 0.7 * Math.cos(arrowAngle);
  const arrowY = cy + r * 0.7 * Math.sin(arrowAngle);

  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="1" opacity="0.3" />
      <circle cx={cx} cy={cy} r={r * 0.6} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.15" />
      {/* Cardinal directions */}
      {dirs.map((d, i) => {
        const a = (i * 45 - 90) * Math.PI / 180;
        return (
          <g key={d}>
            <line x1={cx + (r - 5) * Math.cos(a)} y1={cy + (r - 5) * Math.sin(a)} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)}
              stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.4" />
            <text x={cx + (r + 7) * Math.cos(a)} y={cy + (r + 7) * Math.sin(a)}
              textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="hsl(var(--muted-foreground))" fontWeight={i % 2 === 0 ? '600' : '400'}>
              {d}
            </text>
          </g>
        );
      })}
      {/* Wind arrow */}
      <line x1={cx} y1={cy} x2={arrowX} y2={arrowY}
        stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.6))', transition: 'all 0.5s ease' }} />
      <circle cx={arrowX} cy={arrowY} r="3" fill="hsl(var(--primary))"
        style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary)))' }}>
        <animate attributeName="r" values="3;4.5;3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r="3" fill="hsl(var(--primary))" opacity="0.5" />
      {/* Speed label */}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="0" fill="transparent">{speed}</text>
    </svg>
  );
};

export const WeatherDisplay = ({ location, lang = 'ua', onApplyToSimulation }: WeatherDisplayProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showPhysics, setShowPhysics] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  useEffect(() => {
    if (!location) { setWeather(null); return; }
    let cancelled = false;
    (async () => {
      const live = await fetchLiveWeather(location.lat, location.lon);
      if (!cancelled) setWeather(live || generateSyntheticWeather(location.lat, location.lon));
    })();
    return () => { cancelled = true; };
  }, [location]);

  if (!location || !weather) {
    return <div className="text-muted-foreground">{lang === 'ua' ? 'Визначення локації...' : 'Acquiring location...'}</div>;
  }

  const pot = potentialNames[weather.potentialClass as keyof typeof potentialNames];
  const seasonLabel = seasonNames[weather.season as keyof typeof seasonNames][lang];
  const beaufortLabel = beaufortNames[weather.beaufort]?.[lang] || '';

  const windyUrl = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricWind=m%2Fs&metricTemp=%C2%B0C&zoom=7&overlay=wind&product=ecmwf&level=surface&lat=${location.lat}&lon=${location.lon}`;

  return (
    <div className="space-y-4">
      {/* Windy.com Map */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-xl overflow-hidden border border-primary/20" style={{ height: '280px' }}>
        <iframe
          src={windyUrl}
          className="w-full h-full border-0"
          title="Windy.com Wind Map"
          loading="lazy"
          allowFullScreen
        />
        {/* Overlay header */}
        <div className="absolute top-0 left-0 right-0 px-3 py-2 flex items-center justify-between"
          style={{ background: 'linear-gradient(180deg, hsl(222 28% 13% / 0.85) 0%, transparent 100%)' }}>
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">
              {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
            </span>
          </div>
          <div className="flex items-center gap-2">
            {weather.isLive ? (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-mono" style={{ backgroundColor: 'hsl(120 100% 54% / 0.1)', color: 'hsl(120 80% 60%)', borderColor: 'hsl(120 100% 54% / 0.3)' }}>
                <Wifi className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-mono" style={{ backgroundColor: 'hsl(30 80% 50% / 0.1)', color: 'hsl(30 80% 60%)', borderColor: 'hsl(30 80% 50% / 0.3)' }}>
                <WifiOff className="w-3 h-3" /> {lang === 'ua' ? 'Синтетична' : 'Synthetic'}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full border font-mono" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary) / 0.3)' }}>
              {seasonLabel}
            </span>
          </div>
        </div>
        {/* Windy attribution */}
        <a href="https://www.windy.com" target="_blank" rel="noopener noreferrer"
          className="absolute bottom-2 right-2 flex items-center gap-1 text-[9px] text-muted-foreground hover:text-primary transition-colors px-2 py-0.5 rounded-md"
          style={{ background: 'hsl(222 28% 13% / 0.7)' }}>
          <ExternalLink className="w-2.5 h-2.5" /> Windy.com
        </a>
      </motion.div>

      {/* Ring Gauges Row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="flex items-center justify-between p-4 rounded-xl border" style={{ backgroundColor: 'hsl(222 28% 10%)', borderColor: 'hsl(var(--border) / 0.3)' }}>
        <RingGauge value={weather.windSpeed} max={25} label={lang === 'ua' ? 'Вітер' : 'Wind'} unit="m/s" color="hsl(120 100% 54%)" />
        <WindRoseCompass angle={weather.windAngle} speed={weather.windSpeed} />
        <RingGauge value={weather.temperature} max={45} label={lang === 'ua' ? 'Темп.' : 'Temp'} unit="°C" color="hsl(25 90% 55%)" />
        <RingGauge value={weather.humidity} max={100} label={lang === 'ua' ? 'Волог.' : 'Humid'} unit="%" color="hsl(210 80% 55%)" />
        <RingGauge value={weather.pressure} max={1060} label={lang === 'ua' ? 'Тиск' : 'Press'} unit="hPa" color="hsl(270 60% 55%)" />
      </motion.div>

      {/* Wind info badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-1 rounded-lg font-mono border" style={{ backgroundColor: 'hsl(var(--background) / 0.5)', borderColor: 'hsl(var(--border) / 0.2)' }}>
          <Wind className="w-3 h-3 inline mr-1 text-primary" />
          {windDirName(weather.windAngle, lang)} {weather.windAngle}°
        </span>
        <span className="text-[10px] px-2 py-1 rounded-lg font-mono border" style={{ backgroundColor: 'hsl(var(--background) / 0.5)', borderColor: 'hsl(var(--border) / 0.2)' }}>
          {t('beaufortScale', lang)}: {weather.beaufort} — {beaufortLabel}
        </span>
        <span className="text-[10px] px-2 py-1 rounded-lg font-mono border" style={{ backgroundColor: 'hsl(var(--background) / 0.5)', borderColor: 'hsl(var(--border) / 0.2)' }}>
          {t('windVariability', lang)}: ±{weather.windVariability} m/s
        </span>
        <span className="text-[10px] px-2 py-1 rounded-lg font-mono border" style={{ backgroundColor: 'hsl(var(--background) / 0.5)', borderColor: 'hsl(var(--border) / 0.2)' }}>
          {t('windChill', lang)}: {weather.windChill}°C
        </span>
      </div>

      {/* 24h Forecast with hover tooltips */}
      <div className="p-4 rounded-xl border" style={{ backgroundColor: 'hsl(222 28% 10%)', borderColor: 'hsl(var(--border) / 0.3)' }}>
        <span className="text-xs font-semibold text-foreground">{t('forecast24h', lang)}</span>
        <div className="flex items-end gap-[2px] mt-3 h-16 relative">
          {weather.forecast24h.map((f, i) => {
            const maxS = Math.max(...weather.forecast24h.map(ff => ff.speed));
            const h = Math.max(4, (f.speed / maxS) * 60);
            const isHovered = hoveredBar === i;
            return (
              <div key={i} className="flex-1 flex flex-col items-center relative"
                onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                {isHovered && (
                  <div className="absolute -top-7 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold z-10 whitespace-nowrap"
                    style={{ backgroundColor: 'hsl(222 28% 13%)', border: '1px solid hsl(var(--primary) / 0.3)', color: 'hsl(var(--primary))' }}>
                    {f.speed.toFixed(1)} m/s
                  </div>
                )}
                <div className="w-full rounded-t transition-all duration-150"
                  style={{
                    height: `${h}px`,
                    background: isHovered ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.5)',
                    boxShadow: isHovered ? '0 0 8px hsl(var(--primary) / 0.5)' : 'none',
                  }} />
                {i % 4 === 0 && <span className="text-[8px] text-muted-foreground mt-1">{f.hour}h</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Wind Energy Potential */}
      <div className="p-4 rounded-xl border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground">{lang === 'ua' ? 'Потенціал вітрової енергії' : 'Wind Energy Potential'}</span>
          <span className={`text-xs font-bold ${pot.color}`}>{pot[lang]}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--background) / 0.4)', border: '1px solid hsl(var(--border) / 0.2)' }}>
            <span className="text-[10px] text-muted-foreground">{lang === 'ua' ? 'Густ. потужності' : 'Power Density'}</span>
            <p className="text-sm font-mono font-bold text-primary">{weather.wpd} W/m²</p>
          </div>
          <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--background) / 0.4)', border: '1px solid hsl(var(--border) / 0.2)' }}>
            <span className="text-[10px] text-muted-foreground">{t('monthlyEnergy', lang)}</span>
            <p className="text-sm font-mono font-bold text-primary">~{weather.monthlyEnergy} kWh/m²</p>
          </div>
        </div>
      </div>

      {/* Recommended generator */}
      <div className="p-3 rounded-xl border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
        <span className="text-xs font-semibold text-foreground">{t('recommendedGen', lang)}</span>
        <p className="text-[11px] text-muted-foreground mt-1">
          {genRecommendations[weather.recommendedGen]?.[lang]}
        </p>
      </div>

      {/* Weather Physics toggle */}
      <button
        onClick={() => setShowPhysics(!showPhysics)}
        className="w-full py-2 rounded-xl border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
        style={{ backgroundColor: 'hsl(var(--background) / 0.3)', borderColor: 'hsl(var(--border) / 0.2)' }}>
        <BookOpen className="w-3.5 h-3.5" />
        {t('weatherPhysicsTitle', lang)}
      </button>

      {showPhysics && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="p-3 rounded-xl border space-y-2 text-[11px] text-muted-foreground"
          style={{ backgroundColor: 'hsl(222 28% 10%)', borderColor: 'hsl(var(--border) / 0.2)' }}>
          <p className="font-semibold text-foreground text-xs">{t('weatherPhysicsTitle', lang)}</p>
          <p>• {t('baricGradient', lang)}</p>
          <p>• {t('geostrophicWind', lang)}</p>
          <p>• {t('pasquillStability', lang)}</p>
          <p>• {t('diurnalCycle', lang)}</p>
        </motion.div>
      )}

      {/* Apply button */}
      {onApplyToSimulation && (
        <button
          onClick={() => onApplyToSimulation({
            windSpeed: weather.windSpeed,
            temperature: weather.temperature,
            humidity: weather.humidity,
            windAngle: weather.windAngle
          })}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.4)', color: 'hsl(var(--primary))' }}>
          🌬️ {lang === 'ua' ? 'Застосувати до симуляції' : 'Apply to Simulation'}
        </button>
      )}
    </div>
  );
};
