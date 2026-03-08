

## Overhaul: Glow Default, Trail Paths, Performance, Weather API, Generator Settings

### Issues from Screenshots

1. **Glow minimum too high**: `particleGlow` slider min is `0.2`, should be `0.01`. Default should match screenshot 2 (~0.2x visual).
2. **Trails ("Слід") don't show wind path**: Trails just store old positions — they should create visible continuous wind streamlines, not just fading dots behind particles.
3. **Performance/lag at 1600 particles**: Trail system creates 8 extra instanced meshes × particle count = 12,800 draw instances. Need to reduce overhead.
4. **Weather API**: Currently uses `VITE_OPENWEATHER_API_KEY` env var with fallback to synthetic. Need Open-Meteo (free, no key) as primary external API.
5. **Generator Settings modal**: Current modal is functional but basic. Needs power curve visualization, more advanced calc, better design.

### Changes

#### 1. Glow Slider Defaults — `AdvancedWindControls.tsx` + `WindSimulation3D.tsx`
- Change glow slider `min={0.2}` → `min={0.01}` (line 165)
- Change default `particleGlow` from `1.0` to `0.2` in WindSimulation3D (line 116)
- Update preset defaults to use lower glow values

#### 2. Wind Streamline Trails — `InstancedParticles.tsx`
- Increase `FRAME_SKIP` from 3 to 4 for wider spacing between trail segments
- Scale trail segment sizes proportionally to `trailLengthMultiplier` more aggressively
- Connect trail segments visually: orient each trail segment to face the next one (directional elongation along velocity)
- This creates a "streamline" effect — trail dots stretch into a line following the wind path

#### 3. Performance Optimization — `AdvancedParticleSystem.tsx` + `InstancedParticles.tsx`
- Reduce `TRAIL_SEGMENTS` from 8 to 6 (saves 2 instanced meshes × count)
- Only update trail meshes every 2nd frame (alternate with main particles)
- Throttle `onCollisionEvent` callback — batch instead of per-particle
- Cap collision effects more aggressively in useFrame

#### 4. Open-Meteo Weather API — `WeatherDisplay.tsx`
- Add Open-Meteo API (free, no key needed) as primary live weather source
- Keep OpenWeatherMap as secondary option
- Fetch from `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=wind_speed_10m,wind_direction_10m,temperature_2m,relative_humidity_2m,surface_pressure,cloud_cover`
- Display live/synthetic status badge

#### 5. Enhanced Generator Settings — `GeneratorSettings.tsx`
- Add a simple power curve chart (SVG-based, no new deps) showing P vs V with current operating point marked
- Add annual energy production (AEP) estimate card
- Add capacity factor calculation
- Add cut-in/cut-out speed indicators on a visual wind range bar
- Improve layout: use 2-column grid for calc cards, add section headers with icons
- Add Weibull distribution parameters (k, c) for AEP estimation

### Files Modified

| File | Changes |
|------|---------|
| `AdvancedWindControls.tsx` | Glow min 0.01 |
| `WindSimulation3D.tsx` | Default glow 0.2, preset glow values |
| `InstancedParticles.tsx` | 6 segments, directional trail elongation, frame-skip optimization |
| `AdvancedParticleSystem.tsx` | Throttle collision callbacks |
| `WeatherDisplay.tsx` | Open-Meteo free API integration |
| `GeneratorSettings.tsx` | SVG power curve, AEP, capacity factor, Weibull, visual wind range bar |

