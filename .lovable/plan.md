
# Виправлення UI, фізики частинок та візуалізації

## 1. Кнопки "Встановити/Вибрати" перекривають статистику

**Проблема:** Обидва елементи (`top-3 left-3`) в одній позиції — кнопки режиму та `AdvancedMeasurementPanel`.

**Рішення (WindSimulation3D.tsx):**
- Перемістити кнопки Place/Select з `top-3 left-3` на `top-3 left-48` (або зробити їх частиною measurement panel зверху)
- Альтернативно: зробити кнопки Place/Select в одному рядку з measurement panel, додавши їх як перший елемент всередину `AdvancedMeasurementPanel` або зверху нього з offset `top-3 left-[190px]`

## 2. Нахил X/Z (terrainSlope) спотворює об'єкти

**Проблема:** `Obstacle3D` та `GhostObstacle` застосовують `rotationX` та `rotationZ` через `<group rotation={[rotX, rotationY, rotZ]}>`, що нахиляє всю модель. Крім того, `getTerrainYOffset` використовує `tan()` що дає екстремальні значення при великих кутах.

**Рішення:**
- **Obstacle3D.tsx:** Прибрати `rotationX` та `rotationZ` з обертання group. Об'єкти повинні обертатися тільки по Y. Прибрати рядки `rotX` та `rotZ` з `rotation` prop. Залишити тільки `rotation={[0, rotationY, 0]}`.
- **GhostObstacle.tsx:** Аналогічно — `rotation={[0, rotationY, 0]}`.
- **WindSimulation3D.tsx:** Прибрати клавіші A/D та Z/C з keydown handler. Прибрати `currentGhostRotationX`, `currentGhostRotationZ` states. Прибрати `rotationX`/`rotationZ` з `addObstacle`.
- Обмежити `getTerrainYOffset` щоб `tan()` не давав безкінечних значень: `Math.max(-10, Math.min(10, offset))`.
- Об'єкти просто стоять на нахиленій площині (Y-offset), без власного нахилу.

## 3. "Слід" (Trail) налаштування не працює

**Проблема:** В `InstancedParticles.tsx` trail — це просто один додатковий instanced mesh позаду частинки. При `trailLengthMultiplier` > 0 він малюється, але візуально майже невидимий (opacity 0.2, масштаб 0.3).

**Рішення (InstancedParticles.tsx):**
- Замість одного trail mesh, додати 3-4 trail segments (окремі instancedMesh), кожен зі зменшуючимся opacity та розміром
- Зберігати позиції попередніх кадрів для кожної частинки в `useRef` (circular buffer з 4 позицій)
- Trail segment 1: позиція 1 кадр назад, opacity 0.4, scale 0.8
- Trail segment 2: позиція 2 кадри назад, opacity 0.25, scale 0.5
- Trail segment 3: позиція 3 кадри назад, opacity 0.12, scale 0.3
- Всі сегменти масштабуються `trailLengthMultiplier` — при 0 вони невидимі, при 2.0 вони довші та яскравіші
- Колір trail segments = колір частинки з зниженою яскравістю

## 4. Реалістичніші частинки та оптимізація

**AdvancedParticleSystem.tsx:**
- Збільшити `lerpFactor` з 0.08 до 0.12 для швидшої реакції на вітер
- Додати плавний drag: `speed *= 0.998` кожен кадр (запобігає нескінченному прискоренню)
- Throttle `forceUpdate` — замість кожен кадр, робити `forceUpdate` кожні 2 кадри: `if (renderCountRef.current % 2 === 0) forceUpdate(...)`
- Прибрати `useState` для forceUpdate, використати лише `renderCountRef` + пряме оновлення instancedMesh через ref
- Обмежити `collisionEffects` максимально 20 одночасно (зараз без ліміту — може лагати)

**InstancedParticles.tsx:**
- Прибрати `glowMeshRef` (третій instancedMesh) — це зайвий overhead. Замість цього збільшити розмір частинки при колізії
- Залишити 2 instanced meshes: particles + trails (замість 3)

## 5. Генератори всмоктують частинки — візуалізація

**AdvancedParticleSystem.tsx:**
- Збільшити `attractK` з 2.0 до 4.0 для помітнішого ефекту
- Додати `absorbed` стан для частинок: коли частинка проходить через ротор (dist < rotorRadius), вона стає яскраво-жовтою на 15 кадрів (`absorptionTimer`)
- Передати `absorbed` стан в InstancedParticles як окреме поле

**InstancedParticles.tsx:**
- Для absorbed частинок: яскравий жовто-білий колір (`#ffee00`), збільшений розмір на 1.5x
- Pulse ефект: scale = 1.5 + sin(time * 10) * 0.3

**WindGenerator3D.tsx:**
- Зробити конус перед ротором більш видимим: opacity 0.15 -> 0.25, додати пульсацію

## 6. Стрілки напрямку вітру після колізії

**CollisionEffect.tsx:**
- Додати параметр `deflectionDirection: [number, number, number]` до `CollisionEffectProps`
- Після flash ефекту, показати 2-3 маленькі стрілки (cone + cylinder) що вказують напрямок відбиття вітру
- Стрілки з'являються на 0.3с пізніше ніж flash і тримаються ще 0.5с

**AdvancedParticleSystem.tsx:**
- При генерації `CollisionEvent`, додати поле `deflection: [nx, ny, nz]` — нормалізований вектор напрямку відбиття (обчислюється з surface normal)
- Передати в `CollisionEffectsManager`

**WindSimulation3D.tsx:**
- Оновити тип `collisionEffects` щоб включити `deflection`

## 7. Кращі impact ефекти

**CollisionEffect.tsx:**
- Замінити 6 cylinderGeometry rays на shockwave ring: `ringGeometry` що розширюється
- Додати spark particles: 4-6 маленьких sphere що розлітаються від точки колізії
- Колір залежить від intensity: слабкий = зелений, середній = жовтий, сильний = червоно-помаранчевий
- Тривалість збільшити з 0.5с до 0.8с

---

## Технічна послідовність

1. `WindSimulation3D.tsx` — зсунути кнопки, прибрати rotationX/Z, обмежити terrain offset, ліміт collision effects, додати deflection до collision type
2. `Obstacle3D.tsx` — rotation тільки по Y
3. `GhostObstacle.tsx` — rotation тільки по Y
4. `AdvancedParticleSystem.tsx` — оптимізація, посилити suction, додати absorption state, deflection в collision events, кращий drag
5. `InstancedParticles.tsx` — багато-сегментний trail, прибрати glow mesh, absorption візуалізація
6. `CollisionEffect.tsx` — shockwave ring, spark particles, deflection arrows, кращі кольори
