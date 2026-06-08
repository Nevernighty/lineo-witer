## План виправлення Blade Lab

### 1. Нормальна кінематика ротора замість wiggle/stutter
- Розділити **обертання ротора** і **деформацію лопатей** у `BladeMesh`:
  - окремий spin-group крутиться стабільно від `omega = TSR * V / R`;
  - bending/flutter застосовується тільки як мале локальне відхилення лопатей, не замінює обертання.
- Для HAWT крутити навколо Z, для VAWT навколо Y.
- При overload плавно зменшувати RPM через damage factor, але без рандомного смикання.

### 2. Multi-blade failure + красива recovery-анімація
- Замість відриву тільки однієї лопаті зробити стан для кожної лопаті:
  - індивідуальна затримка руйнування;
  - відрив усіх лопатей/ківшів/спіралей при перевищенні fracture threshold;
  - різний drift/fall/tumble для кожної частини, щоб виглядало фізично, а не однаково.
- Коли параметри повертаються нижче порогу:
  - лопаті анімовано повертаються назад до ротора;
  - damage/recovery інтерполюється плавно, без телепорту.
- Додати видимі stress-cracks/heat glow, debris sparks і root separation markers, але з mobile throttling.

### 3. Реалістичніший wind VFX навколо ротора
- Переробити потік у `BladeViewer3D`:
  - HAWT: осьовий потік + tip vortex helix позаду ротора, не величезні пласкі кільця перед камерою;
  - VAWT: боковий потік через rotor cylinder + wake/downstream swirl.
- Додати параметри в меню: щільність потоку, wake swirl, vortex intensity, turbulence/gust visual intensity.
- На mobile зменшувати кількість streamlines/tubes і вимикати зайві post effects для стабільності.

### 4. Детальніше й функціональніше DaVinci-style top menu
- Прибрати/ущільнити oversized typography у `Симуляція > Потік`:
  - компактні секції, нормальний line-height, менші labels, значення вирівняні моноширинно;
  - меню ширше там, де треба, але без обрізання тексту.
- Додати логічні submenu:
  - `Simulation > Flow`: V∞, TSR, turbulence, gusts;
  - `Simulation > Failure`: bend/fracture thresholds, recovery speed, damage damping;
  - `View > VFX`: streamlines, wake, vortices, stress overlay, fracture debris;
  - `View > Quality`: desktop/mobile quality preset.
- Залишити меню як головне місце керування, без повернення старого modal.

### 5. Темний і читабельний Analysis/Macro
- Виправити `TabsList` і `TabsTrigger`, щоб `Аналіз/Макро` завжди були на темному фоні, а inactive tab не ставав світло-сірим.
- Додати спеціальні класи Blade Lab для темних panel-tabs.
- Перевірити `AeroAnalysis` chart cards: без горизонтального скроллу, dark chart background, читабельні ticks/labels.

### 6. Більше family-aware параметрів у GeometryPanel
- Розширити controls за rotor family:
  - HAWT: taper, root cutout, pitch, twist law, blade thickness multiplier;
  - Darrieus/Gorlov: H/D, toe-in, helical wrap, strut count/position;
  - Savonius: bucket overlap, bucket arc, endplate size;
  - Archimedes/Liam F1: spiral turns, inner radius ratio, ribbon width, cone/taper feel.
- Контроли, які не мають сенсу для конкретної сім’ї, не показувати; ті, що показуються, реально впливають на 3D або хоча б на derived metrics.

### 7. Технічні файли, які будуть змінені
- `src/pages/BladeLab.tsx` — menu structure, new simulation/VFX parameters, dark tabs.
- `src/components/blade-lab/BladeMesh.tsx` — stable spin, per-blade failure/recovery, better deformation sync.
- `src/components/blade-lab/BladeViewer3D.tsx` — improved wind/wake/vortex VFX and mobile quality gating.
- `src/components/blade-lab/GeometryPanel.tsx` — additional family-aware controls.
- `src/components/blade-lab/AeroAnalysis.tsx` — dark/no-horizontal-scroll analysis polish.
- `src/components/wind-simulation/3D/BladePresetTurbine3D.tsx` — sync stable spin + multi-blade failure in main simulation.
- `src/aero/buildBladeGeometry.ts` — if needed, extend Savonius/Archimedes geometry options.
- `src/store/useBladePresetStore.ts` — persist new thresholds/VFX/geometry options used by simulation.
- `src/index.css` — unified Blade Lab font sizes, dark tabs, menu typography, resize/scroll styling.

### 8. Verification
- Run targeted validation after implementation.
- Check `/blade-lab` visually on desktop dimensions from the screenshot and mobile-sized viewport.
- Confirm:
  - propellers spin continuously;
  - wind VFX aligns with rotor direction;
  - Analysis/Macro tabs are dark and readable;
  - Simulation menu text is compact/readable;
  - no horizontal scroll in Analysis;
  - overload breaks all blades and recovery restores them smoothly.