

## Add Loading Screen + Main Menu with 3D Simulation Lazy Loading

### Overview
Replace the current direct-to-simulation flow with a professional animated loading screen on app start, followed by a main menu hub. The 3D simulation loads on-demand with its own loading transition.

### Flow
```text
App Start → Loading Screen (2s animated) → Main Menu Hub
                                              ├── 🌬️ 3D Симуляція (with secondary loader)
                                              ├── 🌤️ Погода
                                              ├── 📚 База знань
                                              ├── ⚙️ Налаштування генератора
                                              └── 🌐 UA/EN toggle
```

### New Files

#### 1. `src/components/LoadingScreen.tsx`
- Full-screen dark overlay with the LINE-O-WITER logo centered
- Animated spinning Recycle icon + Wind icon wiggle (reuse existing animations)
- Pulsing progress bar using the primary green color
- Fades out after 2s with smooth opacity + scale transition
- Uses `framer-motion` for smooth enter/exit

#### 2. `src/components/MainMenu.tsx`
- Full-screen menu with centered card layout
- Logo at top, 4 main buttons in a grid:
  - **3D Вітрова Симуляція** (largest, prominent, primary colored) — sets view to 'simulation'
  - **Погода** — sets view to 'weather'  
  - **База Знань** — navigates to `/info`
  - **Налаштування Генератора** — opens generator settings dialog
- Language toggle (UA/EN) in top-right corner
- Wind speed + power readout at bottom
- Each button has icon + label, hover glow effect
- Background uses the existing stalker grid pattern

#### 3. `src/components/SimulationLoader.tsx`
- Secondary loading overlay shown when user clicks "3D Симуляція"
- Shows "Завантаження симуляції..." with animated wind particles (CSS-only)
- Uses `React.lazy` + `Suspense` to load `WindAnimation` on demand
- Fades out when canvas is ready (onCreated callback from R3F)

### Modified Files

#### `src/pages/Index.tsx`
- Add state: `appState: 'loading' | 'menu' | 'simulation' | 'weather'`
- Initial state: `'loading'` → after 2s timer → `'menu'`
- Render `LoadingScreen` when `'loading'`, `MainMenu` when `'menu'`
- When `'simulation'` clicked → show `SimulationLoader` + lazy-load `WindAnimation`
- When `'weather'` clicked → show `WeatherDisplay`
- Back button in simulation/weather views returns to menu
- Remove the old header — menu replaces it
- Keep header only in simulation/weather views (compact version)

### Design Details
- Loading screen: dark bg, green accent, smooth fade-out via framer-motion `AnimatePresence`
- Menu cards: `stalker-card` style with hover border glow, scale on hover
- 3D simulation button: 2x size, gradient border, animated wind icon
- All text respects `lang` state (UA/EN)
- Mobile responsive: buttons stack vertically on small screens

