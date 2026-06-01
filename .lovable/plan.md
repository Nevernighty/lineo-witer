План продовження Blade Lab v4 — без видалення існуючих функцій, тільки рефакторинг, доповнення й виправлення.

1. Уніфікувати Blade Lab UI як компактну “DaVinci Resolve”-логіку
- Переробити верхній бар у справжнє компактне меню: Preset / Geometry / Rotor / View / Export / Simulation.
- Прибрати розкидані оверлеї з 3D-вікна: HUD, режими перегляду, wind/TSR і toggles перенести у впорядковану top-toolbar/side drawer.
- Уніфікувати розміри шрифтів, висоти кнопок, падінги, tabs, chips, labels, metric cards.
- Заборонити горизонтальний скрол у Analysis/Macro: responsive grid + min-width: 0 + overflow-x-hidden для chart containers.
- Мобільна версія: один viewport без накладання тексту; нижні tabs + scene controls у bottom sheet; графіки стають компактними картками, без кривого обрізання.

2. Додати ресайз і нормальну роботу з панелями
- На desktop замінити жорсткий grid `300px / 1fr / 340px` на `ResizablePanelGroup`.
- Ліва Geometry і права Analysis/Macro панелі матимуть draggable borders.
- Курсор біля межі змінюється на `col-resize`, ручки будуть тонкі, зелені, акуратні.
- Додати кнопки collapse/expand для лівої і правої панелі, щоб 3D-вікно могло бути великим.
- На mobile ресайз не вмикати, щоб не ламати touch UX.

3. Переробити модель даних ротора, щоб налаштування не були “HAWT для всього”
- Додати окремі rotor families: `hawt`, `darrieus-h`, `darrieus-troposkein`, `gorlov-helical`, `savonius-s`, `archimedes-spiral`, `crossflow-diy`.
- Для VAWT перейменувати й переосмислити поля в UI: не “root/tip radius” як у горизонтальної лопаті, а Radius, Height, Chord, Solidity, Pitch/Toe-in, Helix angle.
- GeometryPanel буде показувати різні секції для HAWT і VAWT, а не однакові слайдери, які дають нереалістичні значення.
- Додати clamp/validation presets: Savonius не зможе мати абсурдну TSR/airfoil twist; Darrieus не буде використовувати tip/root логіку HAWT.

4. Реальніші 3D-ротори й лопаті
- HAWT: лопать буде кріпитися до hub root adapter, без “відірваної” геометрії; додати root cuff, pitch bearing, nacelle spinner, hub bolts/plates.
- Darrieus H: вертикальні airfoil blades з top/bottom arms, correct radius, blade toe-in, центральний вал.
- Troposkein/Phi Darrieus: справжня “eggbeater” форма з плавним радіальним профілем, а не просто вертикальна палка.
- Gorlov/QR5: helical blades зі справжнім обертанням вздовж висоти, top/bottom rings, стійки.
- Savonius: S-buckets із перекриттям, товщиною shell, центральним overlap gap, top/bottom plates.
- Додати Archimedes spiral rotor: спіральні лопаті як DIY/urban low-speed preset, з STL export.
- Додати декоративно-функціональні деталі: struts, collars, root fairings, tip caps, support rings, shaft, material shading.

5. Покращити wind/physics visualization у Blade Lab
- Додати режим “Operational deformation”: лопаті плавно гнуться під навантаженням залежно від wind speed, material stiffness, TSR.
- Додати режим “Failure risk”: stress heatmap + tip overspeed + root bending warning.
- Якщо параметри явно небезпечні: показувати crack/spark/fracture preview або partial blade detachment як візуальну аварійну симуляцію, без руйнування даних користувача.
- Додати airflow ribbons, wake cone/cylinder, pressure zones, tip vortex більш фізично розміщені для HAWT/VAWT окремо.
- Покращити camera fit: HAWT wide, VAWT tall, Savonius close, Archimedes front/side readable.

6. Переробити presets
- Розширити presets: референсні HAWT, small wind, DIY carved wood, segmented 3D-print, Darrieus H, Gorlov, QR5-like, Phi Darrieus, Savonius S, Savonius helical, Archimedes spiral.
- Кожен preset отримає коректний rotor family, height/diameter, chord/solidity, material, recommended TSR, cut-in range, notes.
- Preset selection стане не одним dropdown, а categorized compact menu / command list з бейджами: HAWT, VAWT, DIY, Utility, Urban.
- При виборі preset усі налаштування форми, матеріалу, режимів аналізу та симуляції синхронізуються.

7. Науковіший аналіз для різних типів ротора
- HAWT лишається через BEM, але додати root/tip loss, solidity warning, material stress summary.
- VAWT: покращити DMS-inspired модель: upstream/downstream half-cycle, azimuth AoA, torque ripple, self-start score.
- Savonius: окрема drag-based модель Cp/λ, overlap effect, torque at low TSR.
- Archimedes: окрема low-TSR helical drag/lift hybrid approximation.
- Analysis UI показуватиме релевантні графіки: для VAWT — azimuth torque/AoA, solidity, swept rectangle; для HAWT — radial BEM distribution.

8. Повна інтеграція з основною симуляцією
- Активний Blade Lab preset буде впливати не тільки на модель, а й на generator subtype, power calculation, labels, wake/absorption visualization.
- `WindGenerator3D` отримає той самий advanced rotor renderer, що й Blade Lab, щоб не було різниці між лабораторією і сценою.
- Додати в simulation label компактний статус: Blade Lab preset, Cp, power, risk state.
- Для overspeed/high wind у головній симуляції додати bend/failure animation: лопать згинається, вібрує, може візуально тріснути/відлетіти при критичних параметрах.

9. Прибрати “сирість” 3D матеріалів і сцени
- Замість плоского зеленого матеріалу: PBR матеріали для carbon/fiberglass/aluminum/wood/PLA з subtle roughness/metalness.
- Vertex colors лишити тільки для analysis modes; у solid mode — реалістичний material shading.
- Додати edge highlights, root shadows, better lighting, less chaotic bloom.
- Зменшити UI overlay opacity і навести порядок z-index/pointer-events.

10. Перевірка після реалізації
- Перевірити `/blade-lab` на desktop 1024×720 і mobile.
- Перевірити presets: Darrieus H, QR5/Gorlov, Savonius, Archimedes, NREL/HAWT.
- Перевірити, що analysis/macro не створюють горизонтальний scrollbar.
- Перевірити STL export для single blade і rotor для HAWT/VAWT/Savonius/Archimedes.
- Перевірити “Apply to Simulation” і поведінку ротора в основній 3D симуляції.

Технічні файли, які будуть змінені/додані:
- `src/pages/BladeLab.tsx` — layout, top menu, resizable panels, mobile structure.
- `src/components/blade-lab/GeometryPanel.tsx` — rotor-family aware controls.
- `src/components/blade-lab/BladeViewer3D.tsx` — cleaner scene controls, camera fit, advanced wind visuals.
- `src/components/blade-lab/BladeMesh.tsx` — rotor assemblies and attachment fixes.
- `src/aero/buildBladeGeometry.ts` — advanced HAWT/VAWT/Savonius/Archimedes mesh builders.
- `src/aero/presets.ts` — expanded, corrected presets with family-specific data.
- `src/aero/bem.ts` — improved family-specific power/loads models.
- `src/aero/stlExport.ts` — export all new rotor families.
- `src/components/wind-simulation/3D/BladePresetTurbine3D.tsx` — use the same advanced rotor renderer in simulation.
- `src/components/wind-simulation/3D/WindGenerator3D.tsx` — integration, deformation/failure states, labels.
- `src/components/wind-simulation/EnergyCalculator.ts` — family-specific power bridge.
- `src/index.css` — Blade Lab scrollbar/resizable/mobile polish utilities.