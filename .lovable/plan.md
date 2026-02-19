

# Комплексне оновлення UX, фізики та візуалізації

## Проблеми та рішення

### 1. Компактне меню вітрогенератора
Зараз при виборі `wind_generator` з'являється додатковий Select + блок опису, що розтягує панель за межі екрану.

**Рішення (AdvancedWindControls.tsx):**
- Замінити окремий Select генератора на іконкові кнопки (5 маленьких кнопок в рядок) з tooltip
- Прибрати великий блок опису, показувати лише 1 рядок тексту
- Зменшити відступи в секції obstacle type

### 2. Прибрати Alt+Scroll та Ctrl+Q/E, замінити на стрілки/клавіші
Поточна система не працює. Замінити на:

**Нова система управління (WindSimulation3D.tsx):**
- **Стрілки Left/Right**: обертання по Y (yaw) на 15 градусів
- **Q/E**: масштаб +/- 0.1 (без Ctrl)
- **A/D**: нахил по X (pitch) на 10 градусів
- **Z/C**: нахил по Z (roll) на 10 градусів
- Всі клавіші працюють на останній поставлений об'єкт або на ghost preview
- Прибрати `handleWheel` з `onWheel`, прибрати `Ctrl` з keydown
- Оновити хінт і footerHint

**Зміни в types.ts:**
- Додати `rotationX?: number` та `rotationZ?: number` до Obstacle

**Зміни в Obstacle3D.tsx та WindGenerator3D.tsx:**
- Застосувати всі 3 осі обертання через `rotation={[rotX, rotY, rotZ]}`

**Зміни в GhostObstacle.tsx:**
- Додати підтримку `rotationX`, `rotationZ` + scale в привиді

### 3. Нахил сітки без нахилу будівель
Зараз `terrainRotation` обертає всю `<group>` включно з будівлями.

**Рішення (WindSimulation3D.tsx):**
- Винести Grid в окрему group з `terrainRotation`
- Перешкоди, частинки, хотспоти залишити в group без terrain rotation
- Тільки Grid візуально нахиляється

### 4. Аналіз турбіни - окрема сторінка замість sidebar
Прибрати бічну панель з прокруткою, зробити повноцінну сторінку.

**Зміни:**
- `App.tsx`: додати Route `/turbine`
- Створити `src/pages/TurbineAnalysis.tsx` - повноцінна сторінка з WindTurbine + GeneratorSettings
- `Index.tsx`: замінити кнопку toggle на `Link to="/turbine"`
- Прибрати `showTurbinePanel` state та sidebar div

### 5. Інженерна панель генератора - красивіша
**GeneratorSettings.tsx:**
- Збільшити dialog до `max-w-3xl`
- Додати кольорову тему для кожного таба (аеро=синій, конст=помаранчевий, елект=жовтий, розр=зелений)
- Додати графічний індикатор ефективності (прогрес-бар Cp vs Betz)
- Додати діаграму залежності P від V (текстова таблиця з кольоровими стовпчиками)
- Текст контрастний: `text-foreground` для всіх Label

### 6. Кращі wake zones
**CollisionHotspot.tsx:**
- Додати анімацію стрімлайну (пунктирна лінія з рухомим dash offset)
- Додати бічні межі wake zone (тонкі лінії)
- Показувати інфо при hover (кількість частинок у сліді)
- Кольоровий градієнт: темно-синій -> голубий -> прозорий
- Додати ground shadow під wake zone

### 7. Більш деталізовані 3D об'єкти
**Obstacle3D.tsx:**
- Будівля: додати двері (прямокутник), кондиціонери (маленькі бокси на стінах)
- Будинок: додати ґанок (box + стовпчики), водостічна труба
- Хмарочос: додати світяться вікна (emissive material), кран на даху
- Вежа: додати сходи (маленькі бокси по спіралі), антена параболічна
- Дерево: різні розміри крон, додати гілки

### 8. Кількість частинок у налаштуваннях
**WindSimulation3D.tsx:**
- Замінити `const [particleCount] = useState(250)` на змінний state
- Передати в AdvancedWindControls

**AdvancedWindControls.tsx:**
- Додати слайдер "Частинки / Particles" в вкладку wind (50-2000)

### 9. Звуки інтерфейсу
- Створити `src/utils/sounds.ts` з функціями для UI-звуків через Web Audio API
- Звуки: place object (короткий "клік"), rotate (тихий "тік"), clear all (swoosh)
- Без зовнішніх файлів - синтезовані через oscillator

### 10. Більш продвинута погода
**WeatherDisplay.tsx:**
- Додати прогноз на 24 години (mini chart з 24 точками)
- Додати індекс комфорту вітру (шкала Бофорта)
- Додати розрахунок wind chill
- Додати варіабельність вітру (σ)
- Додати рекомендацію типу генератора для поточних умов

### 11. Оптимізація
**AdvancedParticleSystem.tsx:**
- Використати `useRef` для forceUpdate замість `useState`
- Зменшити частоту оновлення obstacle energy callbacks (throttle)

**InstancedParticles.tsx:**
- Мемоізувати geometry та materials

### 12. Всі налаштування працюють
**AdvancedParticleSystem.tsx:**
- Переконатись що humidity впливає на розмір частинок
- altitude автоматично перераховує airDensity (вже є)
- surfaceRoughness впливає на wind shear (вже є)
- gustFrequency/gustIntensity створюють видимі пориви (вже є)

---

## Технічна послідовність

1. `types.ts` - додати rotationX, rotationZ
2. `src/utils/sounds.ts` - створити модуль звуків
3. `src/utils/i18n.ts` - оновити хінти
4. `WindSimulation3D.tsx` - нова система клавіш, розділити terrain/objects groups, particleCount state
5. `Obstacle3D.tsx` - 3-осьове обертання, деталізовані моделі
6. `WindGenerator3D.tsx` - 3-осьове обертання
7. `GhostObstacle.tsx` - 3-осьове обертання + scale preview
8. `AdvancedWindControls.tsx` - компактний генератор меню, слайдер частинок
9. `CollisionHotspot.tsx` - покращені wake zones
10. `GeneratorSettings.tsx` - красивіший дизайн
11. `WeatherDisplay.tsx` - розширена погода
12. `src/pages/TurbineAnalysis.tsx` - нова сторінка
13. `App.tsx` - додати route
14. `Index.tsx` - замінити sidebar на link, прибрати scrollbar panel
