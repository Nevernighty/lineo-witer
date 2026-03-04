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
  terrainSlopeX: { ua: 'Нахил X', en: 'Slope X' },
  terrainSlopeZ: { ua: 'Нахил Z', en: 'Slope Z' },
  
  // Obstacle types
  tree: { ua: 'Дерево', en: 'Tree' },
  building: { ua: 'Будівля', en: 'Building' },
  skyscraper: { ua: 'Хмарочос', en: 'Skyscraper' },
  tower: { ua: 'Вежа', en: 'Tower' },
  house: { ua: 'Будинок', en: 'House' },
  wall: { ua: 'Стіна', en: 'Wall' },
  fence: { ua: 'Паркан', en: 'Fence' },
  wind_generator: { ua: 'Вітрогенератор', en: 'Wind Generator' },
  
  // Generator subtypes
  hawt3: { ua: '3-лопатевий HAWT', en: '3-Blade HAWT' },
  hawt2: { ua: '2-лопатевий HAWT', en: '2-Blade HAWT' },
  darrieus: { ua: 'Дар\'є VAWT', en: 'Darrieus VAWT' },
  savonius: { ua: 'Савоніус VAWT', en: 'Savonius VAWT' },
  micro: { ua: 'Мікро-турбіна', en: 'Micro Turbine' },
  generatorType: { ua: 'Тип генератора', en: 'Generator Type' },
  
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
  footerHint: { ua: 'Клік = поставити | ←→ обертання | Q/E розмір', en: 'Click = place | ←→ rotate | Q/E scale' },
  hintRotateScale: { ua: '←→: обертання | Q/E: розмір', en: '←→: rotate | Q/E: scale' },
  particleCount: { ua: 'Частинки', en: 'Particles' },
  infoParticleCount: { ua: 'Кількість частинок вітру в симуляції. Більше = точніше, але повільніше.', en: 'Wind particle count. More = accurate but slower.' },
  beaufortScale: { ua: 'Шкала Бофорта', en: 'Beaufort Scale' },
  windChill: { ua: 'Відчувається як', en: 'Feels like' },
  windVariability: { ua: 'Варіабельність (σ)', en: 'Variability (σ)' },
  forecast24h: { ua: 'Прогноз 24г', en: '24h Forecast' },
  recommendedGen: { ua: 'Рекомендований генератор', en: 'Recommended Generator' },
  tempImpactTitle: { ua: 'Вплив температури', en: 'Temperature Impact' },
  tempDensityFormula: { ua: 'ρ = P·M/(R·T), де P=101325 Па, M=0.029 кг/моль, R=8.314', en: 'ρ = P·M/(R·T), P=101325 Pa, M=0.029 kg/mol, R=8.314' },
  weatherPhysicsTitle: { ua: 'Фізика погоди', en: 'Weather Physics' },
  baricGradient: { ua: 'Баричний градієнт: вітер дме від високого до низького тиску. Сила: F = -∇P/ρ', en: 'Baric gradient: wind blows from high to low pressure. Force: F = -∇P/ρ' },
  geostrophicWind: { ua: 'Геострофічний вітер: Vg = (1/fρ)·(∂P/∂n), де f = 2Ω·sin(φ) — параметр Коріоліса', en: 'Geostrophic wind: Vg = (1/fρ)·(∂P/∂n), f = 2Ω·sin(φ) — Coriolis parameter' },
  pasquillStability: { ua: 'Клас стабільності Пасквілла: A (дуже нестабільно) — F (стабільно). Впливає на вертикальне перемішування.', en: 'Pasquill stability class: A (very unstable) — F (stable). Affects vertical mixing.' },
  diurnalCycle: { ua: 'Денний цикл: вітер сильніший вдень через конвекцію від нагрівання поверхні. Вночі стабільніший.', en: 'Diurnal cycle: wind stronger during day due to surface heating convection. More stable at night.' },
  monthlyEnergy: { ua: 'Місячна енергія', en: 'Monthly Energy' },
  
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
  
  // Info tooltips
  infoSpeed: { ua: 'Швидкість вітру впливає на енергію частинок (E = 0.5mv²). Більша швидкість = більше передачі енергії.', en: 'Wind velocity affects particle speed and collision energy (E = 0.5mv²).' },
  infoDirection: { ua: 'Горизонтальний кут вітру. 0° = Схід, 90° = Південь, 180° = Захід, 270° = Північ.', en: 'Horizontal wind angle. 0° = East, 90° = South, 180° = West, 270° = North.' },
  infoElevation: { ua: 'Вертикальний кут. Додатній = висхідний потік, від\'ємний = низхідний.', en: 'Vertical angle. Positive = upward, negative = downward.' },
  infoTurbulenceIntensity: { ua: 'TI = σᵥ/V̄ — випадкові коливання швидкості у % від основної (IEC 61400-1).', en: 'TI = σᵥ/V̄ — random velocity variations as % of mean (IEC 61400-1).' },
  infoTurbulenceScale: { ua: 'Розмір вихорів турбулентності. Більший масштаб = ширші хвилі.', en: 'Size of turbulence eddies.' },
  infoGustFrequency: { ua: 'Кількість поривів на хвилину. Пориви тимчасово збільшують швидкість.', en: 'Gusts per minute. Gusts temporarily increase wind speed.' },
  infoGustPower: { ua: 'Максимальна сила пориву як % збільшення базової швидкості.', en: 'Max gust strength as % increase over base speed.' },
  infoTemperature: { ua: 'Температура впливає на густину повітря (ρ = PM/RT). Холодне повітря щільніше = більше енергії.', en: 'Temperature affects air density (ρ = PM/RT). Cold air is denser = more energy.' },
  infoHumidity: { ua: 'Вологість повітря. Впливає на видимість частинок та щільність повітря.', en: 'Atmospheric moisture. Affects particle visibility and air density.' },
  infoAltitude: { ua: 'Висота над рівнем моря. Вище = менший тиск = менша ρ. На 1000м ρ ≈ -3%.', en: 'Height above sea level. Higher = lower pressure = reduced ρ. At 1000m ρ ≈ -3%.' },
  infoSurfaceRoughness: { ua: 'Коефіцієнт тертя поверхні (z₀). Вода ≈ 0.001, поле ≈ 0.03, місто ≈ 0.5-2.0.', en: 'Terrain friction (z₀). Water ≈ 0.001, grassland ≈ 0.03, urban ≈ 0.5-2.0.' },
  infoRefHeight: { ua: 'Базова висота для розрахунку зсуву вітру V(h) = Vref × (h/href)^α.', en: 'Reference height for wind shear V(h) = Vref × (h/href)^α.' },
  infoTerrainSlope: { ua: 'Нахил рельєфу створює прискорення вітру (hill speedup). Об\'єкти зміщуються по висоті вздовж схилу.', en: 'Terrain slope creates wind speedup. Objects shift vertically along the slope.' },
  
  // Elevation science
  elevationScience: { ua: 'Швидкість вітру зростає з висотою за степеневим законом: V = V_ref × (h/h_ref)^α. Подвоєння висоти збільшує потужність на ~40-80%.', en: 'Wind speed increases with height by power law: V = V_ref × (h/h_ref)^α. Doubling height increases power by ~40-80%.' },
  
  heightProfile: { ua: 'Профіль висоти', en: 'Height Profile' },
  
  // Weather
  weatherTitle: { ua: 'Синтетична погода', en: 'Synthetic Weather' },
  windSpeedLabel: { ua: 'Швидкість вітру', en: 'Wind Speed' },
  windDirectionLabel: { ua: 'Напрямок вітру', en: 'Wind Direction' },
  pressureLabel: { ua: 'Тиск', en: 'Pressure' },
  tempLabel: { ua: 'Температура', en: 'Temperature' },
  cloudLabel: { ua: 'Хмарність', en: 'Cloud Cover' },
  applyToSim: { ua: 'Застосувати до симуляції', en: 'Apply to Simulation' },
  seasonWinter: { ua: 'Зима', en: 'Winter' },
  seasonSpring: { ua: 'Весна', en: 'Spring' },
  seasonSummer: { ua: 'Літо', en: 'Summer' },
  seasonAutumn: { ua: 'Осінь', en: 'Autumn' },
  weatherExplainer: { ua: 'Синтетичні дані на основі геолокації, сезону та часу доби для регіону України.', en: 'Synthetic data based on geolocation, season, and time of day for Ukraine region.' },
  windPotentialNote: { ua: 'Потенціал вітрової енергії', en: 'Wind Energy Potential' },
  
  // Turbine panel
  turbineAnalysis: { ua: 'Аналіз турбіни', en: 'Turbine Analysis' },
  powerFormula: { ua: 'Формула потужності', en: 'Power Formula' },
  currentValues: { ua: 'Поточні значення', en: 'Current Values' },
  betzLimit: { ua: 'Ліміт Бетца', en: 'Betz Limit' },
  actualEfficiency: { ua: 'Реальна ефективність', en: 'Actual Efficiency' },
  tipSpeedRatio: { ua: 'TSR (λ)', en: 'TSR (λ)' },
  aepEstimate: { ua: 'Оцінка AEP', en: 'AEP Estimate' },
  powerAtSpeeds: { ua: 'Потужність при різних V', en: 'Power at Various V' },
  cutInSpeed: { ua: 'Вхідна швидкість', en: 'Cut-in Speed' },
  cutOutSpeed: { ua: 'Вихідна швидкість', en: 'Cut-out Speed' },
  ratedPower: { ua: 'Номінальна потужність', en: 'Rated Power' },
  sweptArea: { ua: 'Площа ометання', en: 'Swept Area' },
  
  // Generator settings
  engineeringPanel: { ua: 'Інженерна панель', en: 'Engineering Panel' },
  aerodynamics: { ua: 'Аеродинаміка', en: 'Aerodynamics' },
  bladeProfile: { ua: 'Профіль лопаті', en: 'Blade Profile' },
  angleOfAttack: { ua: 'Кут атаки', en: 'Angle of Attack' },
  bladeCount: { ua: 'Кількість лопатей', en: 'Blade Count' },
  construction: { ua: 'Конструкція', en: 'Construction' },
  electrical: { ua: 'Електрика', en: 'Electrical' },
  genType: { ua: 'Тип генератора', en: 'Generator Type' },
  poles: { ua: 'Кількість полюсів', en: 'Pole Count' },
  voltage: { ua: 'Напруга', en: 'Voltage' },
  liveCalc: { ua: 'Live-розрахунки', en: 'Live Calculations' },
  torque: { ua: 'Крутний момент', en: 'Torque' },
  centrifugalForce: { ua: 'Відцентрова сила', en: 'Centrifugal Force' },
  materialProps: { ua: 'Властивості матеріалів', en: 'Material Properties' },
  youngsModulus: { ua: 'Модуль Юнга', en: "Young's Modulus" },
  tensileStrength: { ua: 'Міцність на розтяг', en: 'Tensile Strength' },
  materialDensity: { ua: 'Щільність', en: 'Density' },
  
  // Info page
  knowledgeBase: { ua: 'База знань з вітроенергетики', en: 'Wind Energy Knowledge Base' },
  scientificRef: { ua: 'Наукова довідка', en: 'Scientific Reference' },
  fundamentals: { ua: 'Основи', en: 'Fundamentals' },
  windPotential: { ua: 'Потенціал вітру', en: 'Wind Potential' },
  turbines: { ua: 'Турбіни', en: 'Turbines' },
  printing3d: { ua: '3D Друк', en: '3D Printing' },
  components: { ua: 'Компоненти', en: 'Components' },
  technical: { ua: 'Технічне', en: 'Technical' },

  // Wake zone enhanced
  wakeLength: { ua: 'Довж. сліду', en: 'Wake Length' },
  velocityDeficit: { ua: 'Дефіцит V', en: 'V Deficit' },
  recoveryZone: { ua: 'Зона відновлення', en: 'Recovery Zone' },

  // Particle settings
  particleImpact: { ua: 'Імпакт', en: 'Impact' },
  particleTrail: { ua: 'Слід', en: 'Trail' },
  infoParticleImpact: { ua: 'Множник розміру та яскравості при колізії. Більше = помітніше зіткнення.', en: 'Collision size & brightness multiplier. Higher = more visible impacts.' },
  infoParticleTrail: { ua: 'Довжина сліду частинки. 0 = без сліду, 2 = довгий яскравий слід.', en: 'Particle trail length. 0 = no trail, 2 = long bright trail.' },

  // Select mode
  placeMode: { ua: 'Встановити', en: 'Place' },
  selectMode: { ua: 'Вибрати', en: 'Select' },
  footerHintSelect: { ua: 'Клік = вибрати | Drag = перемістити | ←→ Q/E = обертання/розмір | A/D Z/C = зсув', en: 'Click = select | Drag = move | ←→ Q/E = rotate/scale | A/D Z/C = shift' },

  // Scenarios
  scenarios: { ua: 'Сценарії', en: 'Scenarios' },
  
  // Analysis toggles
  heightRuler: { ua: 'Лінійка', en: 'Ruler' },
  windProfile: { ua: 'Профіль V', en: 'V Profile' },
  pressureZones: { ua: 'Тиск', en: 'Pressure' },
};

export function t(key: string, lang: Lang): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry['en'] || key;
}

export function getObstacleLabel(type: string, lang: Lang): string {
  return t(type, lang);
}
