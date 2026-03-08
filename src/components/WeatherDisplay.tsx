import { Cloud, Wind, Thermometer, Gauge, ArrowUp, Droplets, BookOpen, Wifi, WifiOff } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { t, type Lang } from '@/utils/i18n';

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
    return {
      hour: fHour,
      speed: Math.max(0.5, baseWind + latFactor * 1.5 + fDiurnal + (Math.sin(i * 0.7) * 0.8))
    };
  });

  const recommendedGen = windSpeed > 10 ? 'hawt3' : windSpeed > 6 ? 'hawt2' : windSpeed > 3 ? 'darrieus' : 'savonius';

  return {
    windSpeed: Math.round(windSpeed * 10) / 10,
    windAngle: Math.round(windAngle),
    temperature: Math.round(temperature * 10) / 10,
    pressure: Math.round(pressure),
    humidity: Math.round(humidity + (Math.random() - 0.5) * 15),
    cloudCover: Math.round(Math.max(0, Math.min(100, cloudCover + (Math.random() - 0.5) * 20))),
    season, wpd: Math.round(wpd), potentialClass, hour, month, monthlyEnergy: Math.round(monthlyEnergy),
    windVariability: Math.round(windVariability * 10) / 10,
    windChill: Math.round(windChill * 10) / 10,
    beaufort,
    forecast24h,
    recommendedGen,
    isLive: false,
  };
}

async function fetchOpenMeteoWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m,temperature_2m,relative_humidity_2m,surface_pressure,cloud_cover&hourly=wind_speed_10m&forecast_days=1&timezone=auto`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.current;
    if (!c) return null;

    const windSpeed = c.wind_speed_10m / 3.6; // km/h → m/s
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

    // Use hourly data for 24h forecast if available
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
      windSpeed: Math.round(windSpeed * 10) / 10,
      windAngle: Math.round(windAngle),
      temperature: Math.round(temperature * 10) / 10,
      pressure,
      humidity: Math.round(humidity),
      cloudCover: Math.round(cloudCover),
      season, wpd: Math.round(wpd), potentialClass, hour, month, monthlyEnergy: Math.round(monthlyEnergy),
      windVariability: Math.round(windVariability * 10) / 10,
      windChill: Math.round(windChill * 10) / 10,
      beaufort, forecast24h, recommendedGen,
      isLive: true,
    };
  } catch {
    return null;
  }
}

async function fetchLiveWeather(lat: number, lon: number): Promise<WeatherData | null> {
  // Try Open-Meteo first (free, no API key needed)
  const openMeteo = await fetchOpenMeteoWeather(lat, lon);
  if (openMeteo) return openMeteo;

  // Fallback to OpenWeatherMap if key available
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) return null;
  
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
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
      windSpeed: Math.round(windSpeed * 10) / 10,
      windAngle: Math.round(windAngle),
      temperature: Math.round(temperature * 10) / 10,
      pressure: Math.round(pressure),
      humidity: Math.round(humidity),
      cloudCover: Math.round(cloudCover),
      season, wpd: Math.round(wpd), potentialClass, hour, month, monthlyEnergy: Math.round(monthlyEnergy),
      windVariability: Math.round(windVariability * 10) / 10,
      windChill: Math.round(windChill * 10) / 10,
      beaufort, forecast24h, recommendedGen,
      isLive: true,
    };
  } catch {
    return null;
  }
}

const seasonNames = {
  winter: { ua: 'Зима', en: 'Winter' },
  spring: { ua: 'Весна', en: 'Spring' },
  summer: { ua: 'Літо', en: 'Summer' },
  autumn: { ua: 'Осінь', en: 'Autumn' }
};

const potentialNames = {
  excellent: { ua: 'Відмінний', en: 'Excellent', color: 'text-green-400' },
  good: { ua: 'Добрий', en: 'Good', color: 'text-primary' },
  moderate: { ua: 'Помірний', en: 'Moderate', color: 'text-yellow-400' },
  low: { ua: 'Низький', en: 'Low', color: 'text-orange-400' }
};

const beaufortNames: Record<number, { ua: string; en: string }> = {
  0: { ua: 'Штиль', en: 'Calm' },
  1: { ua: 'Тихий', en: 'Light air' },
  2: { ua: 'Легкий', en: 'Light breeze' },
  3: { ua: 'Слабкий', en: 'Gentle breeze' },
  4: { ua: 'Помірний', en: 'Moderate breeze' },
  5: { ua: 'Свіжий', en: 'Fresh breeze' },
  6: { ua: 'Сильний', en: 'Strong breeze' },
  7: { ua: 'Міцний', en: 'Near gale' },
  8: { ua: 'Шторм', en: 'Gale' },
  9: { ua: 'Сильний шторм', en: 'Strong gale' },
  10: { ua: 'Ураган', en: 'Storm' },
  11: { ua: 'Жорстокий ураган', en: 'Violent storm' },
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

export const WeatherDisplay = ({ location, lang = 'ua', onApplyToSimulation }: WeatherDisplayProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showPhysics, setShowPhysics] = useState(false);

  // Try live API first, fall back to synthetic
  useEffect(() => {
    if (!location) { setWeather(null); return; }
    
    let cancelled = false;
    (async () => {
      const live = await fetchLiveWeather(location.lat, location.lon);
      if (!cancelled) {
        setWeather(live || generateSyntheticWeather(location.lat, location.lon));
      }
    })();
    return () => { cancelled = true; };
  }, [location]);

  if (!location || !weather) {
    return <div className="text-muted-foreground">{lang === 'ua' ? 'Визначення локації...' : 'Acquiring location...'}</div>;
  }

  const pot = potentialNames[weather.potentialClass as keyof typeof potentialNames];
  const seasonLabel = seasonNames[weather.season as keyof typeof seasonNames][lang];
  const beaufortLabel = beaufortNames[weather.beaufort]?.[lang] || '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">{lang === 'ua' ? 'Погода' : 'Weather'}</span>
        </div>
        <div className="flex items-center gap-2">
          {weather.isLive ? (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 font-mono">
              <Wifi className="w-3 h-3" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 font-mono">
              <WifiOff className="w-3 h-3" /> {lang === 'ua' ? 'Синтетична' : 'Synthetic'}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">{seasonLabel}</span>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        {weather.isLive 
          ? (lang === 'ua' ? 'Реальні дані з Open-Meteo API (безкоштовно).' : 'Live data from Open-Meteo API (free).')
          : (lang === 'ua' ? 'Синтетичні дані на основі геолокації, сезону та часу доби.' : 'Synthetic data based on geolocation, season, and time of day.')}
      </p>

      {/* Main metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Wind className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase">{lang === 'ua' ? 'Швидкість вітру' : 'Wind Speed'}</span>
          </div>
          <p className="text-lg font-mono font-bold">{weather.windSpeed} <span className="text-xs text-muted-foreground">m/s</span></p>
          <p className="text-[10px] text-muted-foreground">{t('beaufortScale', lang)}: {weather.beaufort} — {beaufortLabel}</p>
        </div>
        
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUp className="w-3.5 h-3.5 text-primary" style={{ transform: `rotate(${weather.windAngle}deg)` }} />
            <span className="text-[10px] text-muted-foreground uppercase">{lang === 'ua' ? 'Напрямок' : 'Direction'}</span>
          </div>
          <p className="text-lg font-mono font-bold">{windDirName(weather.windAngle, lang)} <span className="text-xs text-muted-foreground">{weather.windAngle}°</span></p>
          <p className="text-[10px] text-muted-foreground">{t('windVariability', lang)}: ±{weather.windVariability} m/s</p>
        </div>
        
        <div className="p-3 bg-secondary/10 rounded-lg border border-border/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Thermometer className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase">{lang === 'ua' ? 'Температура' : 'Temperature'}</span>
          </div>
          <p className="text-lg font-mono font-bold">{weather.temperature}°C</p>
          <p className="text-[10px] text-muted-foreground">{t('windChill', lang)}: {weather.windChill}°C</p>
        </div>
        
        <div className="p-3 bg-secondary/10 rounded-lg border border-border/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Gauge className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase">{lang === 'ua' ? 'Тиск' : 'Pressure'}</span>
          </div>
          <p className="text-lg font-mono font-bold">{weather.pressure} <span className="text-xs text-muted-foreground">hPa</span></p>
        </div>

        <div className="p-3 bg-secondary/10 rounded-lg border border-border/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Droplets className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase">{lang === 'ua' ? 'Вологість' : 'Humidity'}</span>
          </div>
          <p className="text-lg font-mono font-bold">{weather.humidity}%</p>
        </div>

        <div className="p-3 bg-secondary/10 rounded-lg border border-border/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Cloud className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase">{lang === 'ua' ? 'Хмарність' : 'Cloud Cover'}</span>
          </div>
          <p className="text-lg font-mono font-bold">{weather.cloudCover}%</p>
        </div>
      </div>

      {/* 24h Forecast mini chart */}
      <div className="p-3 bg-secondary/10 rounded-lg border border-border/30">
        <span className="text-xs font-semibold">{t('forecast24h', lang)}</span>
        <div className="flex items-end gap-[2px] mt-2 h-12">
          {weather.forecast24h.map((f, i) => {
            const maxS = Math.max(...weather.forecast24h.map(ff => ff.speed));
            const h = Math.max(4, (f.speed / maxS) * 48);
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full rounded-t bg-primary/60" style={{ height: `${h}px` }} />
                {i % 6 === 0 && <span className="text-[7px] text-muted-foreground mt-0.5">{f.hour}h</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended generator */}
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <span className="text-xs font-semibold">{t('recommendedGen', lang)}</span>
        <p className="text-[10px] text-muted-foreground mt-1">
          {genRecommendations[weather.recommendedGen]?.[lang]}
        </p>
      </div>

      {/* Wind Energy Potential */}
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold">{lang === 'ua' ? 'Потенціал вітрової енергії' : 'Wind Energy Potential'}</span>
          <span className={`text-xs font-bold ${pot.color}`}>{pot[lang]}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{lang === 'ua' ? 'Густ. потужності' : 'Power Density'}</span>
          <span className="font-mono text-primary">{weather.wpd} W/m²</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{t('monthlyEnergy', lang)}</span>
          <span className="font-mono text-primary">~{weather.monthlyEnergy} kWh/m²</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          {lang === 'ua'
            ? 'P = ½ρV³ — густина потужності. E = WPD × A × hours × Cp. >400 W/m² = відмінні умови.'
            : 'P = ½ρV³ — power density. E = WPD × A × hours × Cp. >400 W/m² = excellent conditions.'}
        </p>
      </div>

      {/* Weather Physics toggle */}
      <button
        onClick={() => setShowPhysics(!showPhysics)}
        className="w-full py-1.5 rounded-lg bg-secondary/20 hover:bg-secondary/30 border border-border/30 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
      >
        <BookOpen className="w-3.5 h-3.5" />
        {t('weatherPhysicsTitle', lang)}
      </button>

      {showPhysics && (
        <div className="p-3 bg-secondary/10 rounded-lg border border-border/30 space-y-2 text-[10px] text-muted-foreground">
          <p className="font-semibold text-foreground text-xs">{t('weatherPhysicsTitle', lang)}</p>
          <p>• {t('baricGradient', lang)}</p>
          <p>• {t('geostrophicWind', lang)}</p>
          <p>• {t('pasquillStability', lang)}</p>
          <p>• {t('diurnalCycle', lang)}</p>
        </div>
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
          className="w-full py-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-sm font-semibold transition-colors"
        >
          {lang === 'ua' ? '🌬️ Застосувати до симуляції' : '🌬️ Apply to Simulation'}
        </button>
      )}
    </div>
  );
};
