import { Cloud, Wind, Thermometer, Gauge, ArrowUp, Droplets, BookOpen, Wifi, WifiOff, Layers, MapPin, Mountain, ZoomIn, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { t, type Lang } from '@/utils/i18n';
import { motion, AnimatePresence } from 'framer-motion';

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
  elevation?: number;
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
    beaufort, forecast24h, recommendedGen, isLive: false, elevation: 0,
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
    const elevation = data.elevation ?? 0;
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
      windChill: Math.round(windChill * 10) / 10, beaufort, forecast24h, recommendedGen, isLive: true, elevation,
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
      beaufort, forecast24h, recommendedGen, isLive: true, elevation: 0,
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

const windyOverlays = [
  { id: 'wind', ua: 'Вітер', en: 'Wind', icon: '💨' },
  { id: 'gust', ua: 'Пориви', en: 'Gusts', icon: '🌪️' },
  { id: 'rain', ua: 'Опади', en: 'Rain', icon: '🌧️' },
  { id: 'clouds', ua: 'Хмари', en: 'Clouds', icon: '☁️' },
  { id: 'temp', ua: 'Темп.', en: 'Temp', icon: '🌡️' },
  { id: 'pressure', ua: 'Тиск', en: 'Pressure', icon: '🔵' },
  { id: 'waves', ua: 'Хвилі', en: 'Waves', icon: '🌊' },
  { id: 'snow', ua: 'Сніг', en: 'Snow', icon: '❄️' },
  { id: 'thunder', ua: 'CAPE', en: 'Thunder', icon: '⚡' },
  { id: 'humidity', ua: 'Волог.', en: 'Humidity', icon: '💧' },
  { id: 'visibility', ua: 'Видим.', en: 'Visibility', icon: '👁️' },
  { id: 'currJet', ua: 'Джетстрім', en: 'Jet Stream', icon: '🛩️' },
];

const windyLevels = [
  { id: 'surface', label: { ua: 'Поверхня', en: 'Surface' } },
  { id: '850h', label: { ua: '850 гПа (~1.5 км)', en: '850 hPa (~1.5 km)' } },
  { id: '700h', label: { ua: '700 гПа (~3 км)', en: '700 hPa (~3 km)' } },
  { id: '500h', label: { ua: '500 гПа (~5.5 км)', en: '500 hPa (~5.5 km)' } },
];

const zoomLevels = [5, 7, 9, 11];

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
const WindRoseCompass = ({ angle, speed, lang }: { angle: number; speed: number; lang: 'ua' | 'en' }) => {
  const dirs = lang === 'ua'
    ? ['Пн', 'ПнСх', 'Сх', 'ПдСх', 'Пд', 'ПдЗх', 'Зх', 'ПнЗх']
    : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const r = 38;
  const cx = 50, cy = 50;
  const arrowAngle = (angle - 90) * Math.PI / 180;
  const arrowX = cx + r * 0.7 * Math.cos(arrowAngle);
  const arrowY = cy + r * 0.7 * Math.sin(arrowAngle);

  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="1" opacity="0.3" />
      <circle cx={cx} cy={cy} r={r * 0.6} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.15" />
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
      <line x1={cx} y1={cy} x2={arrowX} y2={arrowY}
        stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.6))', transition: 'all 0.5s ease' }} />
      <circle cx={arrowX} cy={arrowY} r="3" fill="hsl(var(--primary))"
        style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary)))' }}>
        <animate attributeName="r" values="3;4.5;3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r="3" fill="hsl(var(--primary))" opacity="0.5" />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="0" fill="transparent">{speed}</text>
    </svg>
  );
};

// ─── WPD Class Bar ───
const WPDClassBar = ({ wpd, lang }: { wpd: number; lang: 'ua' | 'en' }) => {
  const classes = [
    { min: 0, max: 100, label: '1', color: 'hsl(210 30% 50%)' },
    { min: 100, max: 200, label: '2', color: 'hsl(120 40% 45%)' },
    { min: 200, max: 300, label: '3', color: 'hsl(60 80% 45%)' },
    { min: 300, max: 400, label: '4', color: 'hsl(30 90% 50%)' },
    { min: 400, max: 500, label: '5', color: 'hsl(15 90% 50%)' },
    { min: 500, max: 800, label: '6–7', color: 'hsl(0 80% 50%)' },
  ];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        {classes.map((cls, i) => {
          const isActive = wpd >= cls.min && wpd < cls.max;
          return (
            <div key={i} className="flex-1 relative">
              <div className="h-3 rounded-sm transition-all" style={{
                backgroundColor: isActive ? cls.color : `${cls.color}30`,
                boxShadow: isActive ? `0 0 8px ${cls.color}80` : 'none',
              }} />
              <span className="text-[8px] text-muted-foreground text-center block mt-0.5">{cls.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>0 W/m²</span>
        <span className="font-mono text-primary font-bold">{wpd} W/m²</span>
        <span>800+ W/m²</span>
      </div>
    </div>
  );
};

export const WeatherDisplay = ({ location, lang = 'ua', onApplyToSimulation }: WeatherDisplayProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [windyOverlay, setWindyOverlay] = useState('wind');
  const [windyLevel, setWindyLevel] = useState('surface');
  const [windyZoom, setWindyZoom] = useState(7);
  // Fetch weather for the user's location
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

  const windyUrl = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricWind=m%2Fs&metricTemp=%C2%B0C&zoom=${windyZoom}&overlay=${windyOverlay}&product=ecmwf&level=${windyLevel}&lat=${location.lat}&lon=${location.lon}`;

  const airDensity = (weather.pressure * 100) / (287.05 * (weather.temperature + 273.15));
  const actualWPD = 0.5 * airDensity * Math.pow(weather.windSpeed, 3);

  return (
    <div className="space-y-4">

      {/* Windy.com Map — larger */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative rounded-xl overflow-hidden border border-primary/20" style={{ height: '420px' }}>
        <iframe
          src={windyUrl}
          className="w-full h-full border-0"
          title="Wind Map"
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
      </motion.div>

      {/* ─── Map Controls: Layers + Level + Zoom ─── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="p-3 rounded-xl border space-y-3" style={{ backgroundColor: 'hsl(222 28% 10%)', borderColor: 'hsl(var(--border) / 0.3)' }}>
        {/* Layer buttons */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-foreground">{lang === 'ua' ? 'Шари карти' : 'Map Layers'}</span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {windyOverlays.map(overlay => {
              const isActive = windyOverlay === overlay.id;
              return (
                <button key={overlay.id} onClick={() => setWindyOverlay(overlay.id)}
                  className="flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg text-[9px] font-semibold transition-all"
                  style={{
                    background: isActive ? 'hsl(var(--primary) / 0.15)' : 'hsl(222 28% 14%)',
                    border: `1px solid ${isActive ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border) / 0.2)'}`,
                    color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    boxShadow: isActive ? '0 0 12px hsl(var(--primary) / 0.2)' : 'none',
                  }}>
                  <span className="text-base">{overlay.icon}</span>
                  {lang === 'ua' ? overlay.ua : overlay.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Level + Zoom row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Level selector */}
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold mb-1.5 block flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> {lang === 'ua' ? 'Висота' : 'Level'}
            </span>
            <div className="flex flex-col gap-1">
              {windyLevels.map(level => {
                const isActive = windyLevel === level.id;
                return (
                  <button key={level.id} onClick={() => setWindyLevel(level.id)}
                    className="text-left px-2 py-1.5 rounded-lg text-[10px] font-mono transition-all"
                    style={{
                      background: isActive ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                      border: `1px solid ${isActive ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border) / 0.15)'}`,
                      color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    }}>
                    {level.label[lang]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zoom selector */}
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold mb-1.5 block flex items-center gap-1">
              <ZoomIn className="w-3 h-3" /> {lang === 'ua' ? 'Масштаб' : 'Zoom'}
            </span>
            <div className="flex flex-col gap-1">
              {zoomLevels.map(z => {
                const isActive = windyZoom === z;
                const zLabels: Record<number, { ua: string; en: string }> = {
                  5: { ua: 'Країна', en: 'Country' },
                  7: { ua: 'Регіон', en: 'Region' },
                  9: { ua: 'Район', en: 'District' },
                  11: { ua: 'Місто', en: 'City' },
                };
                return (
                  <button key={z} onClick={() => setWindyZoom(z)}
                    className="text-left px-2 py-1.5 rounded-lg text-[10px] font-mono transition-all"
                    style={{
                      background: isActive ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                      border: `1px solid ${isActive ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border) / 0.15)'}`,
                      color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    }}>
                    ×{z} — {zLabels[z][lang]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ring Gauges Row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="flex items-center justify-between p-4 rounded-xl border" style={{ backgroundColor: 'hsl(222 28% 10%)', borderColor: 'hsl(var(--border) / 0.3)' }}>
        <RingGauge value={weather.windSpeed} max={25} label={lang === 'ua' ? 'Вітер' : 'Wind'} unit="m/s" color="hsl(120 100% 54%)" />
        <WindRoseCompass angle={weather.windAngle} speed={weather.windSpeed} lang={lang} />
        <RingGauge value={weather.temperature} max={45} label={lang === 'ua' ? 'Темп.' : 'Temp'} unit="°C" color="hsl(25 90% 55%)" />
        <RingGauge value={weather.humidity} max={100} label={lang === 'ua' ? 'Волог.' : 'Humid'} unit="%" color="hsl(210 80% 55%)" />
        <RingGauge value={weather.pressure} max={1060} label={lang === 'ua' ? 'Тиск' : 'Press'} unit="hPa" color="hsl(270 60% 55%)" />
      </motion.div>

      {/* Wind info badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-1 rounded-lg font-mono border" style={{ backgroundColor: 'hsl(var(--background) / 0.5)', borderColor: 'hsl(var(--border) / 0.2)' }}>
          {t('windVariability', lang)}: ±{weather.windVariability} m/s
        </span>
        <span className="text-[10px] px-2 py-1 rounded-lg font-mono border" style={{ backgroundColor: 'hsl(var(--background) / 0.5)', borderColor: 'hsl(var(--border) / 0.2)' }}>
          {t('windChill', lang)}: {weather.windChill}°C
        </span>
        <span className="text-[10px] px-2 py-1 rounded-lg font-mono border" style={{ backgroundColor: 'hsl(var(--background) / 0.5)', borderColor: 'hsl(var(--border) / 0.2)' }}>
          {lang === 'ua' ? 'Хмарність' : 'Clouds'}: {weather.cloudCover}%
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

      {/* Air Density + WPD */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border" style={{ backgroundColor: 'hsl(222 28% 10%)', borderColor: 'hsl(var(--border) / 0.3)' }}>
          <span className="text-[10px] text-muted-foreground">{lang === 'ua' ? 'Густина повітря' : 'Air Density'}</span>
          <p className="text-sm font-mono font-bold text-foreground mt-0.5">{airDensity.toFixed(3)} <span className="text-[10px] text-muted-foreground">kg/m³</span></p>
          <p className="text-[9px] text-muted-foreground mt-1 font-mono">ρ = P / (R·T)</p>
          <p className="text-[9px] text-muted-foreground">{weather.pressure} Pa / (287 × {(weather.temperature + 273.15).toFixed(0)} K)</p>
        </div>
        <div className="p-3 rounded-xl border" style={{ backgroundColor: 'hsl(222 28% 10%)', borderColor: 'hsl(var(--border) / 0.3)' }}>
          <span className="text-[10px] text-muted-foreground">{lang === 'ua' ? 'Реальна WPD' : 'Actual WPD'}</span>
          <p className="text-sm font-mono font-bold text-primary mt-0.5">{Math.round(actualWPD)} <span className="text-[10px] text-muted-foreground">W/m²</span></p>
          <p className="text-[9px] text-muted-foreground mt-1 font-mono">WPD = ½ρV³</p>
          <p className="text-[9px] text-muted-foreground">= 0.5 × {airDensity.toFixed(2)} × {weather.windSpeed}³</p>
        </div>
      </div>

      {/* WPD Classification Visual */}
      <div className="p-4 rounded-xl border" style={{ backgroundColor: 'hsl(222 28% 10%)', borderColor: 'hsl(var(--border) / 0.3)' }}>
        <span className="text-xs font-semibold text-foreground mb-2 block">
          {lang === 'ua' ? 'Клас вітрового ресурсу (NREL)' : 'Wind Resource Class (NREL)'}
        </span>
        <WPDClassBar wpd={displayWeather.wpd} lang={lang} />
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
            <p className="text-sm font-mono font-bold text-primary">{displayWeather.wpd} W/m²</p>
          </div>
          <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--background) / 0.4)', border: '1px solid hsl(var(--border) / 0.2)' }}>
            <span className="text-[10px] text-muted-foreground">{t('monthlyEnergy', lang)}</span>
            <p className="text-sm font-mono font-bold text-primary">~{displayWeather.monthlyEnergy} kWh/m²</p>
          </div>
        </div>
      </div>

      {/* Recommended generator */}
      <div className="p-3 rounded-xl border" style={{ backgroundColor: 'hsl(var(--primary) / 0.04)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
        <span className="text-xs font-semibold text-foreground">{t('recommendedGen', lang)}</span>
        <p className="text-[11px] text-muted-foreground mt-1">
          {genRecommendations[displayWeather.recommendedGen]?.[lang]}
        </p>
      </div>

      {/* Weather Physics */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="p-4 rounded-xl border space-y-2"
        style={{ backgroundColor: 'hsl(222 28% 10%)', borderColor: 'hsl(var(--border) / 0.3)' }}>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">{t('weatherPhysicsTitle', lang)}</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <p>• {t('baricGradient', lang)}</p>
          <p>• {t('geostrophicWind', lang)}</p>
          <p>• {t('pasquillStability', lang)}</p>
          <p>• {t('diurnalCycle', lang)}</p>
        </div>
        <div className="mt-2 p-2.5 rounded-lg" style={{ backgroundColor: 'hsl(222 28% 8%)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <p className="text-[10px] font-semibold text-primary mb-1">{lang === 'ua' ? 'Профіль вітру за висотою' : 'Wind Profile Power Law'}</p>
          <p className="text-[11px] font-mono text-center text-primary" style={{ textShadow: '0 0 8px hsl(var(--primary) / 0.3)' }}>
            V(h) = V<sub>ref</sub> · (h / h<sub>ref</sub>)<sup>α</sup>
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {lang === 'ua'
              ? 'α = 0.14 (відкрита місцевість) — 0.40 (міська забудова). Подвоєння висоти: +10–30% швидкості.'
              : 'α = 0.14 (open terrain) — 0.40 (urban). Doubling height: +10–30% speed.'}
          </p>
        </div>
      </motion.div>

      {/* Apply button */}
      {onApplyToSimulation && (
        <button
          onClick={() => onApplyToSimulation({
            windSpeed: displayWeather.windSpeed,
            temperature: displayWeather.temperature,
            humidity: displayWeather.humidity,
            windAngle: displayWeather.windAngle
          })}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.4)', color: 'hsl(var(--primary))' }}>
          🌬️ {lang === 'ua' ? 'Застосувати до симуляції' : 'Apply to Simulation'}
        </button>
      )}
    </div>
  );
};
