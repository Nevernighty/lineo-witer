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
  wobbliness: { ua: 'Хитавиця', en: 'Wobbliness' },
  infoWobbliness: { ua: 'Коефіцієнт деформації об\'єктів від вітру. Дерева та паркани хитаються як желе. Більше = сильніша анімація.', en: 'Object deformation coefficient from wind. Trees and fences wobble like jelly. Higher = stronger animation.' },
  
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
  simulationGuide: { ua: 'Симуляція', en: 'Simulation' },
  greenEnergy: { ua: 'Зелена енергія', en: 'Green Energy' },

  // Wake zone enhanced
  wakeLength: { ua: 'Довж. сліду', en: 'Wake Length' },
  velocityDeficit: { ua: 'Дефіцит V', en: 'V Deficit' },
  recoveryZone: { ua: 'Зона відновлення', en: 'Recovery Zone' },

  // Particle settings
  particleImpact: { ua: 'Імпакт', en: 'Impact' },
  particleTrail: { ua: 'Слід', en: 'Trail' },
  infoParticleImpact: { ua: 'Множник розміру та яскравості при колізії. Більше = помітніше зіткнення.', en: 'Collision size & brightness multiplier. Higher = more visible impacts.' },
  infoParticleTrail: { ua: 'Довжина сліду частинки. 0 = без сліду, 10 = дуже довгий яскравий слід.', en: 'Particle trail length. 0 = no trail, 10 = very long bright trail.' },

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
  energyDensity: { ua: 'Енерг. W/m²', en: 'Energy W/m²' },
  turbulenceField: { ua: 'Турбулент.', en: 'Turbulence' },
  windShearLayer: { ua: 'Зсув α', en: 'Shear α' },
  wakeMap: { ua: 'Карта слідів', en: 'Wake Map' },
  capacityFactor: { ua: 'Коеф. потужн.', en: 'Capacity Factor' },
  betzOverlay: { ua: 'Бетц зони', en: 'Betz Zones' },
  
  // Analysis info tooltips
  infoHeightRuler: { ua: 'Вертикальна шкала з реальними показниками швидкості вітру V(h) та густини потужності P/A = 0.5ρV³ на кожній висоті.', en: 'Vertical scale showing real wind speed V(h) and power density P/A = 0.5ρV³ at each height.' },
  infoWindProfile: { ua: 'Візуалізація профілю вітру за степеневим законом V(h) = Vref(h/href)^α. Стрілки показують швидкість на різних висотах.', en: 'Wind profile visualization using power law V(h) = Vref(h/href)^α. Arrows show speed at various heights.' },
  infoPressureZones: { ua: 'Зони тиску перед (H+) та позаду (L-) перешкод. Формула: ΔP = 0.5ρV² (динамічний тиск).', en: 'Pressure zones upstream (H+) and downstream (L-) of obstacles. Formula: ΔP = 0.5ρV².' },
  infoEnergyDensity: { ua: 'Кольорові кільця показують густину енергії вітру W/m² на різних висотах. Жовтогарячий = висока енергія, синій = низька.', en: 'Colored rings show wind energy density W/m² at various heights. Orange = high, blue = low energy.' },
  infoTurbulenceField: { ua: 'Тороїдні маркери візуалізують інтенсивність турбулентності TI = σᵥ/V̄ у різних точках просторового поля.', en: 'Toroid markers visualize turbulence intensity TI = σᵥ/V̄ at various spatial field points.' },
  infoWindShear: { ua: 'Шари зсуву вітру з показником α (roughness exponent). Показує як швидкість змінюється з висотою та коефіцієнт шорсткості.', en: 'Wind shear layers with α exponent. Shows how speed changes with height and roughness coefficient.' },
  infoWakeMap: { ua: 'Візуалізація зон аеродинамічного сліду за перешкодами та турбінами. Показує дефіцит швидкості та зони турбулентності.', en: 'Visualization of aerodynamic wake zones behind obstacles and turbines. Shows velocity deficit and turbulence zones.' },
  infoCapacityFactor: { ua: 'Коефіцієнт використання потужності CF = Pactual/Prated. Показує реальну ефективність генераторів відносно номінальної.', en: 'Capacity factor CF = Pactual/Prated. Shows actual generator efficiency relative to rated power.' },
  infoBetzOverlay: { ua: 'Зони ліміту Бетца (59.3%) навколо турбін. Показує теоретичний максимум захоплення енергії вітру.', en: 'Betz limit (59.3%) zones around turbines. Shows theoretical max wind energy capture.' },

  // Appearance settings
  particleGlow: { ua: 'Світіння', en: 'Glow' },
  infoParticleGlow: { ua: 'Інтенсивність світіння частинок. Більше = яскравіший неоновий ефект.', en: 'Particle glow intensity. Higher = brighter neon effect.' },
  
  // Pulsation
  pulsation: { ua: 'Пульсація', en: 'Pulsation' },
  infoPulsation: { ua: 'Частота та амплітуда осциляції розміру частинок. Створює ефект "дихання" вітру.', en: 'Frequency and amplitude of particle size oscillation. Creates a wind "breathing" effect.' },
  
  // Particle presets
  particlePreset: { ua: 'Вигляд частинок', en: 'Particle Style' },
  presetStandard: { ua: 'Стандарт', en: 'Standard' },
  presetSmoke: { ua: 'Димка', en: 'Smoke' },
  presetArrows: { ua: 'Стріли', en: 'Arrows' },
  presetSparks: { ua: 'Іскри', en: 'Sparks' },
  presetFlows: { ua: 'Потоки', en: 'Flows' },
  
  // Analysis panel
  analysisPanel: { ua: '📊 Аналіз', en: '📊 Analysis' },
  vizWarning: { ua: '⚠ Візуалізаційна модель — не CFD точність', en: '⚠ Visualization model — not CFD accurate' },
  
  // Scenario physics notes
  physicsNoteValley: { ua: 'Катабатичний вітер: холодне повітря стікає по схилах вночі. Інверсія температури створює стабільний шар, що обмежує вертикальне перемішування.', en: 'Katabatic wind: cold air drains downslope at night. Temperature inversion creates stable layer limiting vertical mixing.' },
  physicsNoteIsland: { ua: 'Бризова циркуляція: різниця нагрівання суші та моря створює циклічний потік. Конвергенція на навітряному боці підсилює вертикальні рухи.', en: 'Sea-breeze circulation: differential land-sea heating creates cyclic flow. Windward convergence enhances vertical motion.' },
  physicsNoteSteppe: { ua: 'Низька шорсткість (z₀ ≈ 0.01) забезпечує рівномірний профіль вітру з високим параметром k розподілу Вейбулла — ідеальні умови для ВЕС.', en: 'Low roughness (z₀ ≈ 0.01) ensures uniform wind profile with high Weibull k parameter — ideal for wind farms.' },
  physicsNoteMountainRidge: { ua: 'Фен-ефект: повітря піднімається навітряним схилом, конденсується, потім сухе та тепле спускається підвітряним. Орографічний підйом може подвоїти швидкість.', en: 'Foehn effect: air rises windward, condenses, then descends leeward dry and warm. Orographic lift can double wind speed.' },
  
  // More info link
  moreInfo: { ua: '📖 Детальніше', en: '📖 More Info' },

  // Loading screen
  windEnergySimulation: { ua: 'Симуляція вітрової енергії', en: 'Wind Energy Simulation' },

  // LCOE ratings
  lcoeExcellent: { ua: '✓ Відмінно', en: '✓ Excellent' },
  lcoeAverage: { ua: '◐ Середнє', en: '◐ Average' },
  lcoeHigh: { ua: '✗ Високе', en: '✗ High' },

  // Electrical labels
  powerFactor: { ua: 'Коеф. потужності', en: 'Power Factor' },
  reactive: { ua: 'Реактивна', en: 'Reactive' },

  // Blade profile labels
  lowPressure: { ua: '− Низький P', en: '− Low P' },
  highPressure: { ua: '+ Високий P', en: '+ High P' },
  liftCoeff: { ua: 'Піднімальна (Cl)', en: 'Cl (Lift)' },
  dragCoeff: { ua: 'Опір (Cd)', en: 'Cd (Drag)' },
  clCdRatio: { ua: 'Cl/Cd = ', en: 'Cl/Cd = ' },
  syncSpeed: { ua: 'n_sync', en: 'n_sync' },
  off: { ua: 'ВИМК', en: 'OFF' },
  ramp: { ua: 'РОЗГІН', en: 'RAMP' },
  rated: { ua: 'НОМІН', en: 'RATED' },
  generatorFreq: { ua: 'Генератор', en: 'Generator' },
  gridFreq: { ua: 'Мережа', en: 'Grid' },

  // Scientific wind types
  windType: { ua: 'Тип вітру', en: 'Wind Type' },
  custom: { ua: 'Власний', en: 'Custom' },
  tradeWind: { ua: 'Пасатний', en: 'Trade Wind' },
  tradeWindDesc: { ua: 'Стійкий тропічний потік. Низька турбулентність, помірна швидкість.', en: 'Steady tropical flow. Low turbulence, moderate speed.' },
  katabatic: { ua: 'Катабатичний', en: 'Katabatic' },
  katabaticDesc: { ua: 'Холодне повітря стікає вниз по схилу. Нічний вітер, від\'ємний кут підйому.', en: 'Cold air drains downslope. Night wind, negative elevation angle.' },
  seaBreeze: { ua: 'Бризовий', en: 'Sea Breeze' },
  seaBreezeDesc: { ua: 'Циклічний прибережний потік. Помірна швидкість, висока вологість.', en: 'Cyclic coastal flow. Moderate speed, high humidity.' },
  foehn: { ua: 'Фен', en: 'Foehn' },
  foehnDesc: { ua: 'Теплий сухий потік з гір. Сильні пориви, нагрівання при спуску.', en: 'Warm dry mountain downwind. Strong gusts, descending warmth.' },
  mountainWave: { ua: 'Гірська хвиля', en: 'Mountain Wave' },
  mountainWaveDesc: { ua: 'Висотні коливання над хребтами. Великий масштаб турбулентності.', en: 'High altitude oscillations over ridges. Large turbulence scale.' },
  mistral: { ua: 'Містраль', en: 'Mistral' },
  mistralDesc: { ua: 'Дуже сильний канальний вітер. Низька вологість, стабільний напрямок.', en: 'Very strong channeled wind. Low humidity, stable direction.' },
};

export function t(key: string, lang: Lang): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry['en'] || key;
}

export function getObstacleLabel(type: string, lang: Lang): string {
  return t(type, lang);
}
