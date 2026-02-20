

# Комплексне оновлення: селекція, фізика потоків, генератори-"всмоктувачі"

## Що змінюється

### 1. Режим селекції об'єктів (Place / Select toggle)

**WindSimulation3D.tsx:**
- Додати `interactionMode: 'place' | 'select'` state
- Додати кнопку-перемикач в UI (іконки: Crosshair для place, MousePointer для select)
- В режимі `select`: клік на Canvas робить raycasting на об'єкти, знаходить найближчий, виділяє його (`selectedObstacleIndex`)
- Виділений об'єкт: `isSelected=true` передається в Obstacle3D/WindGenerator3D, показує wireframe обводку
- В режимі select: стрілки/Q/E/A/D/Z/C працюють на виділений об'єкт
- Drag (mousedown+move) в select режимі переміщує виділений об'єкт по ground plane
- В режимі `place`: поточна поведінка (ghost + клік = поставити)

### 2. Об'єкти слідують за нахилом рельєфу (лише по висоті Z)

**WindSimulation3D.tsx:**
- Об'єкти НЕ обертаються разом з terrainSlope
- Але їх Y-позиція зміщується залежно від їх X/Z координати та нахилу:
  ```
  offsetY = tan(slopeX) * posX + tan(slopeZ) * posZ
  ```
- Цей offsetY додається до position.y при рендерингу в Obstacle3D та WindGenerator3D
- Ghost preview теж отримує offsetY
- Об'єкти "стоять" на нахиленій поверхні, але самі не нахиляються

### 3. Генератори "всмоктують" повітря

**AdvancedParticleSystem.tsx:**
- Для кожного генератора (type === 'wind_generator'): частинки в радіусі `rotorDiameter * 3` від ротора притягуються до центру ротора
- Сила притягання: `F_attract = k / distance^2` (обернено-квадратична)
- Після проходження через ротор: частинки сповільнюються на `(1 - Cp)` (закон Бетца)
- Візуальний ефект: частинки перед генератором конвергують до нього, за ним — розходяться та сповільнюються
- Це дозволяє бачити "зону живлення" генератора та його вплив на потік

### 4. Колізії враховують поворот/масштаб об'єкта

**AdvancedParticleSystem.tsx:**
- `checkCollision` тепер трансформує координати частинки в локальний простір об'єкта з урахуванням rotation та scale
- Inverse rotation matrix: повернути координату частинки назад на -rotationY, -rotationX, -rotationZ
- Масштабовані розміри: `width * scale`, `height * scale`, `depth * scale`
- Surface normal теж обертається відповідно

### 5. Налаштування вигляду частинок (під слайдером кількості)

**AdvancedWindControls.tsx (вкладка wind):**
- Додати під "Частинки" новий слайдер: "Імпакт / Impact" (0.1 - 3.0) — множник розміру та яскравості колізій
- Додати слайдер: "Слід / Trail" (0 - 2.0) — довжина сліду частинки
- Ці значення передаються в InstancedParticles через новий `particleSettings` prop

**WindSimulation3D.tsx:**
- Додати state `particleImpact` та `particleTrailLength`
- Передати в AdvancedParticleSystem та InstancedParticles

**InstancedParticles.tsx:**
- `impactMultiplier` масштабує розмір при колізії та яскравість кольору
- `trailLength` контролює довжину trail mesh

### 6. Покращена візуалізація потоків та напрямку вітру

**InstancedParticles.tsx:**
- Додати стрілку напрямку вітру як окрему mesh (один великий arrow helper в куті сцени)
- Колір частинок відображає швидкість: повільні=синій, середні=зелений, швидкі=помаранчевий/червоний (не тільки при колізії, а завжди)
- При колізії: додатковий "розлітання" ефект — 2-3 маленькі scatter-частинки

**AdvancedParticleSystem.tsx:**
- Частинки зберігають `velocityHistory` (останні 3 кадри) для плавнішого trail rendering
- За генератором: частинки отримують турбулентність + зменшення швидкості (вже є wake zone, але тепер ще й притягування до ротора)

### 7. Покращені 3D моделі

**Obstacle3D.tsx:**
- **building**: додати двері (темний box на фасаді), AC units (маленькі boxes на бічних стінах), парапет на даху
- **house**: ґанок (навіс + 2 стовпчики), водостічна труба (тонкий cylinder збоку)
- **skyscraper**: emissive вікна на верхніх поверхах (meshBasicMaterial з emissive), кран на даху (тонкий cylinder + arm)
- **tower**: параболічна антена зверху (disc), сходи (спіральні маленькі boxes)
- **tree**: додати 2-3 гілки (тонкі cylinders від стовбура)

### 8. Покращені wake zones та collision visualization

**CollisionHotspot.tsx:**
- Додати animated streamlines в wake zone: 3-4 пунктирні лінії що "течуть" від об'єкта (animated dash offset через useFrame)
- Додати boundary lines — тонкі лінії по краях wake zone
- Ground shadow: темна пляма під wake zone (opacity 0.1)
- Генератори: окрема візуалізація зони впливу — кольоровий disc перед ротором показує "зону збору вітру"

### 9. Колізія враховує rotation при відображенні

**WindGenerator3D.tsx:**
- Додати візуалізацію зони збору: напівпрозорий конус перед ротором (в напрямку вітру)
- Показувати стрілки потоку біля ротора: 3-4 маленькі arrow що конвергують до центру

---

## Технічна послідовність

1. `types.ts` — додати `particleImpact`, `particleTrailLength` в конфіг (або передавати окремо)
2. `i18n.ts` — нові переклади для impact/trail/select mode
3. `WindSimulation3D.tsx` — select mode, terrain Y offset, particle settings state, передача в компоненти
4. `AdvancedWindControls.tsx` — слайдери impact та trail
5. `AdvancedParticleSystem.tsx` — генератор-всмоктувач, collision з rotation/scale, передача settings
6. `InstancedParticles.tsx` — impact/trail rendering, швидкісний колір
7. `Obstacle3D.tsx` — деталізовані моделі
8. `WindGenerator3D.tsx` — візуалізація зони збору вітру
9. `GhostObstacle.tsx` — terrain Y offset
10. `CollisionHotspot.tsx` — animated streamlines, boundary, ground shadow

