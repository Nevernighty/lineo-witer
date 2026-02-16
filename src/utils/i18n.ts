export type Lang = 'ua' | 'en';

const translations: Record<string, Record<Lang, string>> = {
  // Header
  windEnergyInfo: { ua: 'Інфо про вітроенергетику', en: 'Wind Energy Info' },
  
  // Wind tab
  speed: { ua: 'Швидкість', en: 'Speed' },
  direction: { ua: 'Напрямок', en: 'Direction' },
  elevation: { ua: 'Підйом', en: 'Elevation' },
  
  // Turbulence tab
  intensity: { ua: 'Інтенсивність', en: 'Intensity' },
  scale: { ua: 'Масштаб', en: 'Scale' },
  gustFreq: { ua: 'Част. поривів', en: 'Gust Freq' },
  gustPower: { ua: 'Сила поривів', en: 'Gust Power' },
  
  // Atmosphere tab
  temperature: { ua: 'Температура', en: 'Temperature' },
  humidity: { ua: 'Вологість', en: 'Humidity' },
  altitude: { ua: 'Висота', en: 'Altitude' },
  airDensity: { ua: 'Густ. повітря', en: 'Air Density' },
  calculatedDensity: { ua: 'Розрах. ρ', en: 'Calc. ρ' },
  
  // Terrain tab
  surfaceRoughness: { ua: 'Шорсткість', en: 'Surface Roughness' },
  refHeight: { ua: 'Реф. висота', en: 'Ref. Height' },
  obstacleType: { ua: 'Тип перешкоди', en: 'Obstacle Type' },
  water: { ua: 'Вода', en: 'Water' },
  open: { ua: 'Поле', en: 'Open' },
  urban: { ua: 'Місто', en: 'Urban' },
  
  // Obstacle types
  tree: { ua: 'Дерево', en: 'Tree' },
  building: { ua: 'Будівля', en: 'Building' },
  skyscraper: { ua: 'Хмарочос', en: 'Skyscraper' },
  tower: { ua: 'Вежа', en: 'Tower' },
  house: { ua: 'Будинок', en: 'House' },
  wall: { ua: 'Стіна', en: 'Wall' },
  fence: { ua: 'Паркан', en: 'Fence' },
  wind_generator: { ua: 'Вітрогенератор', en: 'Wind Generator' },
  
  // Categories
  vegetation: { ua: 'Рослинність', en: 'Vegetation' },
  structures: { ua: 'Споруди', en: 'Structures' },
  barriers: { ua: 'Бар\'єри', en: 'Barriers' },
  energy: { ua: 'Енергетика', en: 'Energy' },
  
  // Analysis
  analysisLayers: { ua: 'Шари аналізу', en: 'Analysis Layers' },
  collisionHotspots: { ua: 'Зони зіткнень', en: 'Collision Hotspots' },
  wakeZones: { ua: 'Сліди потоку', en: 'Wake Zones' },
  localHits: { ua: 'Локальні удари', en: 'Local Hits' },
  
  // Actions
  clearAll: { ua: 'Очистити', en: 'Clear All' },
  footerHint: { ua: 'Клікніть щоб поставити • Alt+тягніть для обертання', en: 'Click to place • Alt+Drag to rotate' },
  
  // Measurement Panel
  windPower: { ua: 'Потужність вітру', en: 'Wind Power' },
  powerDensity: { ua: 'Густ. потужності', en: 'Power Density' },
  atmosphere: { ua: 'Атмосфера', en: 'Atmosphere' },
  density: { ua: 'Густ. (ρ)', en: 'Density (ρ)' },
  turbulence: { ua: 'Турбулентність', en: 'Turbulence' },
  roughness: { ua: 'Шорсткість', en: 'Roughness' },
  collisions: { ua: 'Зіткнення', en: 'Collisions' },
  collisionEnergy: { ua: 'Енергія', en: 'Energy' },
  totalCd: { ua: 'Сума Cd', en: 'Total Cd' },
  blockage: { ua: 'Блокування', en: 'Blockage' },
  environment: { ua: 'Середовище', en: 'Environment' },
  particles: { ua: 'Частинки', en: 'Particles' },
  volume: { ua: 'Об\'єм', en: 'Volume' },
  generators: { ua: 'Генератори', en: 'Generators' },
  totalPowerOutput: { ua: 'Заг. потужність', en: 'Total Power' },
  
  // Wind generator info
  generatorPower: { ua: 'Потужність', en: 'Power' },
  
  // Info tooltips (keep English for scientific terms, UA primary)
  infoSpeed: { ua: 'Швидкість вітру впливає на енергію частинок (E = 0.5mv²). Більша швидкість = більше передачі енергії.', en: 'Wind velocity affects particle speed and collision energy (E = 0.5mv²).' },
  infoDirection: { ua: 'Горизонтальний кут вітру. 0° = Схід, 90° = Південь, 180° = Захід, 270° = Північ.', en: 'Horizontal wind angle. 0° = East, 90° = South, 180° = West, 270° = North.' },
  infoElevation: { ua: 'Вертикальний кут. Додатній = висхідний потік, від\'ємний = низхідний.', en: 'Vertical angle. Positive = upward, negative = downward.' },
  infoTurbulenceIntensity: { ua: 'Випадкові коливання швидкості у % від основної. Більше = хаотичніший рух.', en: 'Random velocity variations as % of wind speed.' },
  infoTurbulenceScale: { ua: 'Розмір вихорів турбулентності. Більший масштаб = ширші хвилі.', en: 'Size of turbulence eddies.' },
  infoGustFrequency: { ua: 'Кількість поривів на хвилину. Пориви тимчасово збільшують швидкість.', en: 'Gusts per minute. Gusts temporarily increase wind speed.' },
  infoGustPower: { ua: 'Максимальна сила пориву як % збільшення базової швидкості.', en: 'Max gust strength as % increase over base speed.' },
  infoTemperature: { ua: 'Температура впливає на густину повітря. Холодне повітря щільніше = більше енергії.', en: 'Temperature affects air density. Cold air is denser = more energy.' },
  infoHumidity: { ua: 'Вологість повітря. Більша вологість трохи зменшує густину.', en: 'Atmospheric moisture. Higher humidity slightly reduces density.' },
  infoAltitude: { ua: 'Висота над рівнем моря. Вище = менший тиск = менша густ. повітря.', en: 'Height above sea level. Higher = lower pressure = reduced density.' },
  infoAirDensity: { ua: 'Маса на об\'єм (кг/м³). Рівень моря ≈ 1.225, гори ≈ 1.0.', en: 'Mass per volume (kg/m³). Sea level ≈ 1.225, mountains ≈ 1.0.' },
  infoSurfaceRoughness: { ua: 'Коефіцієнт тертя поверхні. Вода ≈ 0.001, поле ≈ 0.03, місто ≈ 0.5-2.0.', en: 'Terrain friction. Water ≈ 0.001, grassland ≈ 0.03, urban ≈ 0.5-2.0.' },
  infoRefHeight: { ua: 'Базова висота для розрахунку зсуву вітру. Швидкість зменшується ближче до землі.', en: 'Reference height for wind shear calculations.' },
  infoHotspots: { ua: 'Показує концентрацію енергії біля перешкод. Кольори: Зелений → Жовтий → Помаранчевий → Червоний.', en: 'Shows energy concentration at obstacles.' },
  infoWakeZones: { ua: 'Візуалізує турбулентні зони за перешкодами. Показує дефіцит швидкості.', en: 'Visualizes turbulent wake zones behind obstacles.' },
  infoLocalHits: { ua: 'Анімовані спливаючі вікна з енергією зіткнення (Дж) у точці удару.', en: 'Animated popups showing collision energy (J) at impact point.' },
  
  // Elevation science
  elevationScience: { ua: 'Швидкість вітру зростає з висотою за степеневим законом: V = V_ref × (h/h_ref)^α. Подвоєння висоти збільшує потужність на ~40-80%.', en: 'Wind speed increases with height by power law: V = V_ref × (h/h_ref)^α. Doubling height increases power by ~40-80%.' },
  
  // Wind profile heights
  heightProfile: { ua: 'Профіль висоти', en: 'Height Profile' },
};

export function t(key: string, lang: Lang): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry['en'] || key;
}

export function getObstacleLabel(type: string, lang: Lang): string {
  return t(type, lang);
}
